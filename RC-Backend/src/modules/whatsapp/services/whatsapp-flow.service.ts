import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { FlowType } from '../entities/whatsapp-session.entity';
import { WhatsAppSessionService } from './whatsapp-session.service';
import { WhatsAppIdentityService } from './whatsapp-identity.service';
import { WhatsAppAuditService } from './whatsapp-audit.service';
import { WhatsAppTwilioService } from './whatsapp-twilio.service';
import { ParsedWhatsAppMessage } from '../dto/twilio-webhook.dto';
import {
  FlowContext,
  FlowHandlerResult,
  BaseFlowHandler,
} from '../handlers/base-flow.handler';
import {
  VerificationFlowHandler,
  AccountLinkFlowHandler,
} from '../handlers/verification-flow.handler';
import { PrescriptionFlowHandler } from '../handlers/prescription-flow.handler';
import { OrderFlowHandler } from '../handlers/order-flow.handler';
import { PharmacistChatHandler } from '../handlers/pharmacist-chat.handler';
import {
  MESSAGES,
  GLOBAL_COMMANDS,
  MENU_OPTIONS,
} from '../constants/messages.constant';

/**
 * Central service for routing WhatsApp messages to appropriate flow handlers
 */
@Injectable()
export class WhatsAppFlowService {
  private readonly logger = new Logger(WhatsAppFlowService.name);
  private handlers: Map<FlowType, BaseFlowHandler>;

  constructor(
    private readonly sessionService: WhatsAppSessionService,
    private readonly identityService: WhatsAppIdentityService,
    private readonly auditService: WhatsAppAuditService,
    private readonly twilioService: WhatsAppTwilioService,
    private readonly verificationHandler: VerificationFlowHandler,
    private readonly accountLinkHandler: AccountLinkFlowHandler,
    private readonly prescriptionHandler: PrescriptionFlowHandler,
    private readonly orderHandler: OrderFlowHandler,
    private readonly pharmacistChatHandler: PharmacistChatHandler,
  ) {
    // Register flow handlers
    this.handlers = new Map<FlowType, BaseFlowHandler>();
    this.handlers.set(FlowType.VERIFICATION, verificationHandler);
    this.handlers.set(FlowType.ACCOUNT_LINK, accountLinkHandler);
    this.handlers.set(FlowType.PRESCRIPTION_UPLOAD, prescriptionHandler);
    this.handlers.set(FlowType.ORDER_CREATION, orderHandler);
    this.handlers.set(FlowType.PHARMACIST_CHAT, pharmacistChatHandler);
  }

  /**
   * Process an incoming message and route to appropriate handler
   */
  async processMessage(
    message: ParsedWhatsAppMessage,
    sessionDoc: any,
    identityDoc: any,
  ): Promise<string | null> {
    const context: FlowContext = {
      message,
      session: sessionDoc,
      identity: identityDoc,
      patientId: identityDoc.patient_id,
    };

    try {
      // Check for global commands first
      const globalCommand = this.parseGlobalCommand(message.body || '');
      if (globalCommand) {
        return this.handleGlobalCommand(globalCommand, context);
      }

      // If not verified, route to verification flow
      if (!identityDoc.is_verified) {
        return this.handleUnverifiedUser(context);
      }

      // Route based on current flow
      const currentFlow = sessionDoc.current_flow as FlowType;
      const handler = this.handlers.get(currentFlow);

      if (handler) {
        const result = await handler.handle(context);
        await this.applyFlowResult(result, context);
        return result.response;
      }

      // Handle IDLE state
      if (currentFlow === FlowType.IDLE) {
        return this.handleIdleState(context);
      }

      // Unknown flow - reset to idle
      await this.sessionService.resetToIdle(sessionDoc._id);
      return MESSAGES.MENU();
    } catch (error) {
      this.logger.error('Error processing message:', error);
      await this.auditService.logError(message.from, error as Error, {
        session_id: sessionDoc._id,
        patient_id: identityDoc.patient_id,
        current_flow: sessionDoc.current_flow,
      });
      return MESSAGES.ERROR_GENERIC;
    }
  }

  /**
   * Parse global commands from message text
   */
  private parseGlobalCommand(text: string): string | null {
    const normalized = text.toLowerCase().trim();
    return GLOBAL_COMMANDS[normalized] || null;
  }

  /**
   * Handle global commands that work in any state
   */
  private async handleGlobalCommand(
    command: string,
    context: FlowContext,
  ): Promise<string> {
    const { session, identity, message } = context;

    switch (command) {
      case 'SHOW_MENU':
        await this.sessionService.resetToIdle(session._id);
        if (identity.is_verified) {
          const patientName = await this.getPatientName(identity.patient_id);
          return MESSAGES.MENU(patientName);
        }
        return MESSAGES.WELCOME_UNVERIFIED;

      case 'SHOW_HELP':
        return MESSAGES.HELP;

      case 'CANCEL_FLOW':
        await this.sessionService.resetToIdle(session._id);
        return MESSAGES.CANCELLED;

      case 'OPT_OUT':
        await this.identityService.handleOptOut(message.from);
        return MESSAGES.OPT_OUT;

      case 'REQUEST_HUMAN':
        await this.sessionService.updateFlow(
          session._id,
          FlowType.PHARMACIST_CHAT,
          0,
        );
        return MESSAGES.QUEUE_PHARMACIST_ESCALATION;

      default:
        return MESSAGES.MENU();
    }
  }

  /**
   * Handle messages from unverified users
   */
  private async handleUnverifiedUser(context: FlowContext): Promise<string> {
    const { session, message } = context;
    const currentFlow = session.current_flow as FlowType;

    // If already in verification flow, continue it
    if (
      currentFlow === FlowType.VERIFICATION ||
      currentFlow === FlowType.ACCOUNT_LINK
    ) {
      const handler = this.handlers.get(currentFlow);
      if (handler) {
        const result = await handler.handle(context);
        await this.applyFlowResult(result, context);
        return result.response || MESSAGES.WELCOME_UNVERIFIED;
      }
    }

    // Start verification flow
    await this.sessionService.updateFlow(
      session._id,
      FlowType.VERIFICATION,
      0,
    );
    return MESSAGES.WELCOME_UNVERIFIED;
  }

  /**
   * Handle messages in IDLE state
   */
  private async handleIdleState(context: FlowContext): Promise<string> {
    const { message, session } = context;
    const text = message.body?.trim() || '';

    // Check for menu option selection (1-5)
    const menuOption = this.parseMenuOption(text);
    if (menuOption) {
      return this.handleMenuOption(menuOption, context);
    }

    // Check if image was sent (prescription upload shortcut)
    if (message.type === 'image' && message.media?.length) {
      // Start prescription upload flow with the image
      await this.sessionService.updateFlow(
        session._id,
        FlowType.PRESCRIPTION_UPLOAD,
        0,
      );

      const handler = this.handlers.get(FlowType.PRESCRIPTION_UPLOAD);
      if (handler) {
        const result = await handler.handle(context);
        await this.applyFlowResult(result, context);
        return result.response || MESSAGES.PRESCRIPTION_RECEIVED;
      }
    }

    // Unknown input - show menu
    return MESSAGES.INVALID_INPUT('Send "menu" for options.');
  }

  /**
   * Parse menu option from text
   */
  private parseMenuOption(text: string): string | null {
    const trimmed = text.trim();
    return MENU_OPTIONS[trimmed] || null;
  }

  /**
   * Handle menu option selection
   */
  private async handleMenuOption(
    option: string,
    context: FlowContext,
  ): Promise<string> {
    const { session } = context;

    switch (option) {
      case 'UPLOAD_PRESCRIPTION':
        await this.sessionService.updateFlow(
          session._id,
          FlowType.PRESCRIPTION_UPLOAD,
          0,
        );
        return MESSAGES.PRESCRIPTION_UPLOAD_PROMPT;

      case 'VIEW_PRESCRIPTIONS':
        return MESSAGES.FEATURE_COMING_SOON('View prescriptions');

      case 'TRACK_ORDER':
        return MESSAGES.FEATURE_COMING_SOON('Order tracking');

      case 'SPEAK_TO_PHARMACIST':
        await this.sessionService.updateFlow(
          session._id,
          FlowType.PHARMACIST_CHAT,
          0,
        );
        return MESSAGES.QUEUE_PHARMACIST_ESCALATION;

      case 'HELP':
        return MESSAGES.HELP;

      default:
        return MESSAGES.MENU();
    }
  }

  /**
   * Apply flow handler result to session
   */
  private async applyFlowResult(
    result: FlowHandlerResult,
    context: FlowContext,
  ): Promise<void> {
    const { session } = context;

    if (result.endFlow) {
      await this.sessionService.resetToIdle(session._id);
      return;
    }

    if (result.newFlow !== undefined || result.newStep !== undefined) {
      await this.sessionService.updateFlow(
        session._id,
        result.newFlow ?? (session.current_flow as FlowType),
        result.newStep ?? session.flow_step,
        result.newFlowData,
      );
    } else if (result.newFlowData) {
      // Only update flow data
      for (const [key, value] of Object.entries(result.newFlowData)) {
        await this.sessionService.addFlowData(session._id, key, value);
      }
    }

    // Handle actions
    if (result.actions?.length) {
      for (const action of result.actions) {
        await this.executeAction(action, context);
      }
    }
  }

  /**
   * Execute a flow action
   */
  private async executeAction(
    action: any,
    context: FlowContext,
  ): Promise<void> {
    const { message } = context;

    switch (action.type) {
      case 'SEND_MESSAGE':
        await this.twilioService.sendTextMessage(
          message.from,
          action.payload.message,
        );
        break;

      case 'LOG_EVENT':
        await this.auditService.logAction(
          message.from,
          action.payload.event,
          {
            session_id: context.session._id,
            patient_id: context.identity.patient_id,
            current_flow: context.session.current_flow,
          },
          action.payload.details,
        );
        break;

      // Add more action handlers as needed
      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Get patient name by ID
   */
  private async getPatientName(
    patientId: Types.ObjectId | undefined,
  ): Promise<string | undefined> {
    // This will be implemented to fetch from UsersService
    // For now, return undefined
    return undefined;
  }

  /**
   * Start a specific flow for a user
   */
  async startFlow(
    whatsappNumber: string,
    flow: FlowType,
    initialData?: Record<string, any>,
  ): Promise<void> {
    const session = await this.sessionService.getActiveSession(whatsappNumber);
    if (session) {
      await this.sessionService.updateFlow(
        session._id,
        flow,
        0,
        initialData || {},
      );
    }
  }

  /**
   * Send a proactive message to a user
   */
  async sendProactiveMessage(
    whatsappNumber: string,
    message: string,
  ): Promise<void> {
    await this.twilioService.sendTextMessage(whatsappNumber, message);
  }
}
