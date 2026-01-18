import { Injectable } from '@nestjs/common';
import { FlowType } from '../entities/whatsapp-session.entity';
import {
  BaseFlowHandler,
  FlowHandlerResult,
  FlowContext,
} from './base-flow.handler';
import { WhatsAppIdentityService } from '../services/whatsapp-identity.service';
import { MESSAGES } from '../constants/messages.constant';

/**
 * Handles the account verification/linking flow
 *
 * Flow steps:
 * 0 - Ask if user has existing account (yes/no)
 * 1 - Wait for email/phone input
 * 2 - Wait for OTP input
 */
@Injectable()
export class VerificationFlowHandler extends BaseFlowHandler {
  readonly flowType = FlowType.VERIFICATION;

  constructor(private readonly identityService: WhatsAppIdentityService) {
    super();
  }

  async onEnter(context: FlowContext): Promise<FlowHandlerResult> {
    return this.respond(MESSAGES.WELCOME_UNVERIFIED);
  }

  async handle(context: FlowContext): Promise<FlowHandlerResult> {
    const { message, session } = context;
    const text = message.body?.trim() || '';
    const step = session.flow_step;

    switch (step) {
      case 0:
        return this.handleAccountChoice(text, context);
      case 1:
        return this.handleEmailPhoneInput(text, context);
      case 2:
        return this.handleOTPInput(text, context);
      default:
        return this.endFlow(MESSAGES.WELCOME_UNVERIFIED);
    }
  }

  /**
   * Step 0: User chooses whether they have an existing account
   */
  private async handleAccountChoice(
    text: string,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const choice = text.toLowerCase();

    // Check for "yes" / "1" / "link"
    if (
      choice === '1' ||
      choice.includes('yes') ||
      choice.includes('link') ||
      choice.includes('existing')
    ) {
      return {
        response: MESSAGES.ACCOUNT_LINK_ENTER_EMAIL,
        newFlow: FlowType.ACCOUNT_LINK,
        newStep: 0,
        newFlowData: {},
      };
    }

    // Check for "no" / "2" / "create"
    if (
      choice === '2' ||
      choice.includes('no') ||
      choice.includes('create') ||
      choice.includes('new')
    ) {
      return this.endFlow(MESSAGES.ACCOUNT_NEW_USER);
    }

    // Invalid input
    return this.respond(
      'Please reply with 1 to link an existing account, or 2 to create a new account.',
    );
  }

  /**
   * Step 1: User enters their email or phone
   */
  private async handleEmailPhoneInput(
    text: string,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const { message } = context;

    // Basic validation
    if (!text || text.length < 5) {
      return this.respond(
        'Please enter a valid email address or phone number.',
      );
    }

    // Try to initiate account link
    const result = await this.identityService.initiateAccountLink(
      message.from,
      text,
    );

    if (result.success) {
      return {
        response: result.message,
        newStep: 2,
        newFlowData: {
          email_or_phone: text,
          verification_method: result.method,
        },
      };
    }

    // Failed - account not found or already linked
    return this.respond(result.message);
  }

  /**
   * Step 2: User enters OTP code
   */
  private async handleOTPInput(
    text: string,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const { message } = context;

    // Basic validation - OTP should be 6 digits
    const otp = text.replace(/\s/g, '');
    if (!/^\d{6}$/.test(otp)) {
      return this.respond(
        'Please enter the 6-digit verification code sent to you.',
      );
    }

    // Verify OTP
    const result = await this.identityService.verifyOTP(message.from, otp);

    if (result.success) {
      // Success - return to menu with greeting
      return {
        response: `${result.message}\n\n${MESSAGES.MENU(result.patientName)}`,
        endFlow: true,
        newFlow: FlowType.IDLE,
        newStep: 0,
        newFlowData: {},
      };
    }

    // Failed - either wrong OTP or blocked
    return this.respond(result.message);
  }
}

/**
 * Handles the account linking flow (sub-flow of verification)
 * This is essentially the same as verification steps 1-2
 */
@Injectable()
export class AccountLinkFlowHandler extends BaseFlowHandler {
  readonly flowType = FlowType.ACCOUNT_LINK;

  constructor(private readonly identityService: WhatsAppIdentityService) {
    super();
  }

  async onEnter(context: FlowContext): Promise<FlowHandlerResult> {
    return this.respond(MESSAGES.ACCOUNT_LINK_ENTER_EMAIL);
  }

  async handle(context: FlowContext): Promise<FlowHandlerResult> {
    const { message, session } = context;
    const text = message.body?.trim() || '';
    const step = session.flow_step;

    switch (step) {
      case 0:
        return this.handleEmailPhoneInput(text, context);
      case 1:
        return this.handleOTPInput(text, context);
      default:
        return this.endFlow(MESSAGES.WELCOME_UNVERIFIED);
    }
  }

  /**
   * Step 0: User enters their email or phone
   */
  private async handleEmailPhoneInput(
    text: string,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const { message } = context;

    // Basic validation
    if (!text || text.length < 5) {
      return this.respond(
        'Please enter a valid email address or phone number.',
      );
    }

    // Try to initiate account link
    const result = await this.identityService.initiateAccountLink(
      message.from,
      text,
    );

    if (result.success) {
      return {
        response: result.message,
        newStep: 1,
        newFlowData: {
          email_or_phone: text,
          verification_method: result.method,
        },
      };
    }

    // Failed - account not found or already linked
    return this.respond(result.message);
  }

  /**
   * Step 1: User enters OTP code
   */
  private async handleOTPInput(
    text: string,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const { message } = context;

    // Basic validation - OTP should be 6 digits
    const otp = text.replace(/\s/g, '');
    if (!/^\d{6}$/.test(otp)) {
      return this.respond(
        'Please enter the 6-digit verification code sent to you.',
      );
    }

    // Verify OTP
    const result = await this.identityService.verifyOTP(message.from, otp);

    if (result.success) {
      // Success - return to menu with greeting
      return {
        response: `${result.message}\n\n${MESSAGES.MENU(result.patientName)}`,
        endFlow: true,
        newFlow: FlowType.IDLE,
        newStep: 0,
        newFlowData: {},
      };
    }

    // Failed - either wrong OTP or blocked
    return this.respond(result.message);
  }
}
