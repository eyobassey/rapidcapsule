import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

export interface WhatsAppMessageOptions {
  to: string;
  body?: string;
  mediaUrl?: string[];
  contentSid?: string; // For template messages
  contentVariables?: Record<string, string>;
}

export interface WhatsAppButtonMessage {
  to: string;
  body: string;
  buttons: Array<{ id: string; title: string }>;
}

export interface WhatsAppListMessage {
  to: string;
  body: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}

@Injectable()
export class WhatsAppTwilioService {
  private readonly logger = new Logger(WhatsAppTwilioService.name);
  private client: Twilio;
  private whatsappNumber: string;
  private isTestMode: boolean;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.whatsappNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '';
    this.isTestMode = this.configService.get<string>('TWILIO_TEST_MODE') === 'true';

    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
      this.logger.log(`Twilio client initialized ${this.isTestMode ? '(TEST MODE)' : ''}`);
    } else {
      this.logger.warn('Twilio credentials not configured - WhatsApp messaging disabled');
    }
  }

  /**
   * Send a simple text message via WhatsApp
   */
  async sendTextMessage(to: string, body: string): Promise<MessageInstance | null> {
    if (!this.client) {
      this.logger.warn('Twilio client not initialized');
      return null;
    }

    try {
      const message = await this.client.messages.create({
        body,
        from: this.formatWhatsAppNumber(this.whatsappNumber),
        to: this.formatWhatsAppNumber(to),
      });

      this.logger.log(`Message sent to ${to}: ${message.sid}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to send message to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send a message with media (image/document)
   */
  async sendMediaMessage(
    to: string,
    body: string,
    mediaUrl: string,
  ): Promise<MessageInstance | null> {
    if (!this.client) {
      this.logger.warn('Twilio client not initialized');
      return null;
    }

    try {
      const message = await this.client.messages.create({
        body,
        from: this.formatWhatsAppNumber(this.whatsappNumber),
        to: this.formatWhatsAppNumber(to),
        mediaUrl: [mediaUrl],
      });

      this.logger.log(`Media message sent to ${to}: ${message.sid}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to send media message to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send a template message (pre-approved WhatsApp Business templates)
   */
  async sendTemplateMessage(
    to: string,
    contentSid: string,
    variables?: Record<string, string>,
  ): Promise<MessageInstance | null> {
    if (!this.client) {
      this.logger.warn('Twilio client not initialized');
      return null;
    }

    try {
      const messageParams: any = {
        from: this.formatWhatsAppNumber(this.whatsappNumber),
        to: this.formatWhatsAppNumber(to),
        contentSid,
      };

      if (variables) {
        messageParams.contentVariables = JSON.stringify(variables);
      }

      const message = await this.client.messages.create(messageParams);

      this.logger.log(`Template message sent to ${to}: ${message.sid}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to send template message to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send an interactive button message
   * Note: Twilio uses Content API for interactive messages
   */
  async sendButtonMessage(options: WhatsAppButtonMessage): Promise<MessageInstance | null> {
    if (!this.client) {
      this.logger.warn('Twilio client not initialized');
      return null;
    }

    // For Twilio, we send buttons as part of the message body with numbered options
    // Full interactive buttons require Twilio Content API templates
    const buttonText = options.buttons
      .map((btn, idx) => `${idx + 1}. ${btn.title}`)
      .join('\n');

    const fullBody = `${options.body}\n\n${buttonText}\n\nReply with a number to select an option.`;

    return this.sendTextMessage(options.to, fullBody);
  }

  /**
   * Send an interactive list message
   * Note: Twilio uses Content API for interactive messages
   */
  async sendListMessage(options: WhatsAppListMessage): Promise<MessageInstance | null> {
    if (!this.client) {
      this.logger.warn('Twilio client not initialized');
      return null;
    }

    // Format list as text (full list UI requires Twilio Content API templates)
    let listText = options.body + '\n\n';

    options.sections.forEach((section) => {
      listText += `*${section.title}*\n`;
      section.rows.forEach((row, idx) => {
        listText += `${idx + 1}. ${row.title}`;
        if (row.description) {
          listText += ` - ${row.description}`;
        }
        listText += '\n';
      });
      listText += '\n';
    });

    listText += `Reply with a number to select an option.`;

    return this.sendTextMessage(options.to, listText);
  }

  /**
   * Send the welcome menu
   */
  async sendWelcomeMenu(to: string, patientName?: string): Promise<MessageInstance | null> {
    const greeting = patientName ? `Hello ${patientName}!` : 'Hello!';

    const menuText = `${greeting} Welcome to Rapid Capsule Pharmacy.

I can help you with:
1. Upload a prescription
2. View my prescriptions
3. Track an order
4. Speak to a pharmacist
5. Help

Reply with a number to get started, or send 'menu' anytime to see these options.`;

    return this.sendTextMessage(to, menuText);
  }

  /**
   * Send prescription upload instructions
   */
  async sendPrescriptionUploadPrompt(to: string): Promise<MessageInstance | null> {
    const text = `Please send a clear photo of your prescription.

Tips for best results:
- Good lighting
- Straight angle
- Full prescription visible
- No shadows or glare

Send 'cancel' to go back to the menu.`;

    return this.sendTextMessage(to, text);
  }

  /**
   * Send prescription received confirmation
   */
  async sendPrescriptionReceived(to: string): Promise<MessageInstance | null> {
    const text = `Prescription received!

I'm analyzing your prescription now. This usually takes 1-2 minutes.

I'll notify you when it's ready.`;

    return this.sendTextMessage(to, text);
  }

  /**
   * Send prescription verification result
   */
  async sendPrescriptionVerified(
    to: string,
    medications: Array<{ name: string; dosage: string; quantity: string }>,
    total: string,
  ): Promise<MessageInstance | null> {
    let medicationList = medications
      .map((m, i) => `${i + 1}. ${m.name} (${m.dosage}) x${m.quantity}`)
      .join('\n');

    const text = `Your prescription has been verified!

*Medications found:*
${medicationList}

*Estimated Total:* ${total}

Would you like to order these medications?
1. Order Now
2. View Details
3. Not Now

Reply with a number to continue.`;

    return this.sendTextMessage(to, text);
  }

  /**
   * Send session timeout warning
   */
  async sendTimeoutWarning(to: string): Promise<MessageInstance | null> {
    const text = `Your session will expire in 5 minutes due to inactivity.

Send any message to continue.`;

    return this.sendTextMessage(to, text);
  }

  /**
   * Send session expired message
   */
  async sendSessionExpired(to: string): Promise<MessageInstance | null> {
    const text = `Your session has expired for security.

Send 'hi' to start a new session.`;

    return this.sendTextMessage(to, text);
  }

  /**
   * Send error message
   */
  async sendErrorMessage(to: string, userFriendlyMessage?: string): Promise<MessageInstance | null> {
    const text = userFriendlyMessage ||
      `Sorry, something went wrong. Please try again or send 'menu' to start over.

If the problem persists, reply 'human' to speak with a pharmacist.`;

    return this.sendTextMessage(to, text);
  }

  /**
   * Send rate limit message
   */
  async sendRateLimitMessage(to: string, retryAfter?: string): Promise<MessageInstance | null> {
    let text = `You've made too many requests. Please slow down.`;

    if (retryAfter) {
      text += `\n\nYou can try again ${retryAfter}.`;
    }

    return this.sendTextMessage(to, text);
  }

  /**
   * Send queue notification
   */
  async sendQueueNotification(
    to: string,
    queueType: string,
    estimatedTime: string,
  ): Promise<MessageInstance | null> {
    let text: string;

    switch (queueType) {
      case 'OCR_REVIEW':
        text = `Your prescription needs a quick review by our pharmacist.

Estimated time: ${estimatedTime}

You'll be notified once it's complete.`;
        break;
      case 'CONTROLLED_SUBSTANCE':
        text = `Your prescription contains medication that requires additional verification.

A pharmacist will review your prescription and may contact you or your prescriber for verification.

Estimated time: ${estimatedTime}

You'll receive a notification when complete.`;
        break;
      default:
        text = `Your prescription is being processed.

Estimated time: ${estimatedTime}

You'll be notified once it's complete.`;
    }

    return this.sendTextMessage(to, text);
  }

  /**
   * Validate Twilio webhook signature
   */
  validateWebhookSignature(
    signature: string,
    url: string,
    params: Record<string, string>,
  ): boolean {
    if (this.isTestMode) {
      // Skip validation in test mode
      return true;
    }

    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    if (!authToken) return false;

    const { validateRequest } = require('twilio');
    return validateRequest(authToken, signature, url, params);
  }

  /**
   * Format phone number for WhatsApp
   */
  private formatWhatsAppNumber(phone: string): string {
    // Remove existing whatsapp: prefix if present
    let formatted = phone.replace('whatsapp:', '');

    // Ensure it starts with +
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }

    // Add whatsapp: prefix
    return `whatsapp:${formatted}`;
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!this.client;
  }

  /**
   * Get configured WhatsApp number
   */
  getWhatsAppNumber(): string {
    return this.whatsappNumber;
  }
}
