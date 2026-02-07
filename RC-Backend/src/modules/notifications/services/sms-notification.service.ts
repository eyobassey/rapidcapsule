import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsNotificationService {
  private readonly logger = new Logger(SmsNotificationService.name);
  private client: Twilio;
  private smsFromNumber: string;
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.smsFromNumber = this.configService.get<string>('TWILIO_SMS_NUMBER') || '';
    this.isEnabled = !!accountSid && !!authToken && !!this.smsFromNumber;

    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
      this.logger.log(`SMS service initialized${this.isEnabled ? '' : ' (SMS NUMBER NOT CONFIGURED)'}`);
    } else {
      this.logger.warn('Twilio credentials not configured - SMS messaging disabled');
    }
  }

  /**
   * Send an SMS message
   */
  async sendSms(
    to: string,
    message: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isEnabled || !this.client) {
      this.logger.debug(`SMS not sent (disabled): ${to}`);
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      // Format phone number
      const formattedNumber = this.formatPhoneNumber(to);

      // Truncate message if too long (SMS limit is 160 chars for single SMS)
      const truncatedMessage = message.length > 160
        ? message.substring(0, 157) + '...'
        : message;

      const result = await this.client.messages.create({
        body: truncatedMessage,
        from: this.smsFromNumber,
        to: formattedNumber,
      });

      this.logger.log(`SMS sent to ${to}: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an urgent SMS (for critical notifications)
   */
  async sendUrgentSms(
    to: string,
    message: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Prepend URGENT to the message
    const urgentMessage = `🚨 URGENT: ${message}`;
    return this.sendSms(to, urgentMessage);
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, assume Nigerian number
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }

    // Add + prefix if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Check if SMS service is enabled
   */
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }
}
