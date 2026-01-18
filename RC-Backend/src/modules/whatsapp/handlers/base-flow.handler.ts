import { Types } from 'mongoose';
import { WhatsAppSessionDocument, FlowType } from '../entities/whatsapp-session.entity';
import { WhatsAppIdentityDocument } from '../entities/whatsapp-identity.entity';
import { ParsedWhatsAppMessage } from '../dto/twilio-webhook.dto';

/**
 * Result from handling a message
 */
export interface FlowHandlerResult {
  // Response message to send back (null for no response)
  response: string | null;

  // New flow state (null to keep current)
  newFlow?: FlowType;
  newStep?: number;
  newFlowData?: Record<string, any>;

  // Actions to perform
  actions?: FlowAction[];

  // End the current flow
  endFlow?: boolean;
}

/**
 * Actions that can be triggered by flow handlers
 */
export interface FlowAction {
  type:
    | 'SEND_MESSAGE'
    | 'CREATE_QUEUE_ITEM'
    | 'START_PRESCRIPTION_VERIFICATION'
    | 'CREATE_ORDER'
    | 'REQUEST_HUMAN'
    | 'LOG_EVENT';
  payload: Record<string, any>;
}

/**
 * Context passed to flow handlers
 */
export interface FlowContext {
  message: ParsedWhatsAppMessage;
  session: WhatsAppSessionDocument;
  identity: WhatsAppIdentityDocument;
  patientId?: Types.ObjectId;
}

/**
 * Base class for all flow handlers
 */
export abstract class BaseFlowHandler {
  /**
   * Flow type this handler manages
   */
  abstract readonly flowType: FlowType;

  /**
   * Handle an incoming message
   */
  abstract handle(context: FlowContext): Promise<FlowHandlerResult>;

  /**
   * Called when entering this flow
   */
  async onEnter(context: FlowContext): Promise<FlowHandlerResult> {
    // Default implementation - override in subclasses
    return { response: null };
  }

  /**
   * Called when exiting this flow
   */
  async onExit(context: FlowContext): Promise<void> {
    // Default implementation - override in subclasses
  }

  /**
   * Check if a message matches expected responses
   */
  protected isExpectedResponse(
    message: string,
    expected: string[],
  ): boolean {
    const normalized = message.toLowerCase().trim();
    return expected.some((e) => e.toLowerCase() === normalized);
  }

  /**
   * Parse numeric response (1, 2, 3, etc.)
   */
  protected parseNumericResponse(message: string): number | null {
    const trimmed = message.trim();
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num < 1) return null;
    return num;
  }

  /**
   * Helper to create a simple response result
   */
  protected respond(message: string): FlowHandlerResult {
    return { response: message };
  }

  /**
   * Helper to transition to a new flow
   */
  protected transitionTo(
    flow: FlowType,
    step: number = 0,
    data?: Record<string, any>,
    response?: string,
  ): FlowHandlerResult {
    return {
      response: response || null,
      newFlow: flow,
      newStep: step,
      newFlowData: data || {},
    };
  }

  /**
   * Helper to end the current flow and return to idle
   */
  protected endFlow(response?: string): FlowHandlerResult {
    return {
      response: response || null,
      endFlow: true,
      newFlow: FlowType.IDLE,
      newStep: 0,
      newFlowData: {},
    };
  }

  /**
   * Helper to increment step within current flow
   */
  protected nextStep(
    response: string,
    additionalData?: Record<string, any>,
  ): FlowHandlerResult {
    return {
      response,
      newStep: (this as any).currentStep + 1,
      newFlowData: additionalData,
    };
  }

  /**
   * Helper to stay on current step
   */
  protected stayOnStep(response: string): FlowHandlerResult {
    return { response };
  }

  /**
   * Get current flow data value
   */
  protected getFlowData<T>(context: FlowContext, key: string): T | undefined {
    return context.session.flow_data?.[key] as T | undefined;
  }
}
