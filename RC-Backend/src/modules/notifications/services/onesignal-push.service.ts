import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class OneSignalPushService {
  private readonly logger = new Logger(OneSignalPushService.name);
  private readonly appId: string;
  private readonly apiKey: string;
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('ONESIGNAL_APP_ID') || '';
    this.apiKey = this.configService.get<string>('ONESIGNAL_REST_API_KEY') || '';
    this.isConfigured = !!(this.appId && this.apiKey);

    if (!this.isConfigured) {
      this.logger.warn('OneSignal credentials not configured — push notifications disabled');
    } else {
      this.logger.log('OneSignal push service initialized');
    }
  }

  /**
   * Send push notification to a user by their MongoDB _id
   * (mapped via OneSignal.login(userId) on the mobile app)
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<SendResult> {
    if (!this.isConfigured) {
      return { success: false, error: 'OneSignal not configured' };
    }

    try {
      const body = {
        app_id: this.appId,
        include_aliases: { external_id: [userId] },
        target_channel: 'push',
        headings: { en: payload.title },
        contents: { en: payload.body },
        data: payload.data || {},
        ...(payload.imageUrl ? { big_picture: payload.imageUrl } : {}),
      };

      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok && result.id) {
        this.logger.debug(`Push sent to user ${userId}: ${result.id}`);
        return { success: true, messageId: result.id };
      }

      const error = result.errors?.[0] || result.error || 'Unknown error';
      this.logger.warn(`Push failed for user ${userId}: ${error}`);
      return { success: false, error };
    } catch (error) {
      this.logger.error(`Push error for user ${userId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(userIds: string[], payload: PushPayload): Promise<SendResult> {
    if (!this.isConfigured) {
      return { success: false, error: 'OneSignal not configured' };
    }

    try {
      const body = {
        app_id: this.appId,
        include_aliases: { external_id: userIds },
        target_channel: 'push',
        headings: { en: payload.title },
        contents: { en: payload.body },
        data: payload.data || {},
      };

      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok && result.id) {
        return { success: true, messageId: result.id };
      }

      return { success: false, error: result.errors?.[0] || 'Unknown error' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
