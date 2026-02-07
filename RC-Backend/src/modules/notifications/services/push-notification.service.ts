import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as admin from 'firebase-admin';
import { User, UserDocument } from '../../users/entities/user.entity';

interface PushNotificationPayload {
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
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn('Firebase credentials not configured - push notifications disabled');
        return;
      }

      // Check if already initialized
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            // Handle newline characters in private key
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }

      this.isInitialized = true;
      this.logger.log('Firebase initialized for push notifications');
    } catch (error) {
      this.logger.error(`Failed to initialize Firebase: ${error.message}`);
    }
  }

  /**
   * Send push notification to a user by their ID
   */
  async sendToUser(
    userId: string,
    payload: PushNotificationPayload,
  ): Promise<SendResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Push notifications not configured' };
    }

    try {
      const user = await this.userModel.findById(userId).select('device_tokens').lean();

      const userWithTokens = user as any;
      if (!userWithTokens?.device_tokens?.length) {
        this.logger.debug(`No device tokens for user ${userId}`);
        return { success: false, error: 'No device tokens registered' };
      }

      // Send to all user devices
      const results = await Promise.allSettled(
        userWithTokens.device_tokens.map((token: string) => this.sendToDevice(token, payload))
      );

      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;

      return {
        success: successful > 0,
        messageId: `sent_to_${successful}_devices`,
      };
    } catch (error) {
      this.logger.error(`Failed to send push to user ${userId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to a specific device token
   */
  async sendToDevice(
    token: string,
    payload: PushNotificationPayload,
  ): Promise<SendResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Push notifications not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
          },
          fcmOptions: {
            link: payload.data?.action_url || '/',
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.debug(`Push sent to ${token}: ${response}`);

      return { success: true, messageId: response };
    } catch (error) {
      this.logger.error(`Failed to send push to device: ${error.message}`);

      // Handle invalid tokens
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        await this.removeInvalidToken(token);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(
    userIds: string[],
    payload: PushNotificationPayload,
  ): Promise<{ total: number; successful: number; failed: number }> {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendToUser(userId, payload))
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    return {
      total: userIds.length,
      successful,
      failed: userIds.length - successful,
    };
  }

  /**
   * Send push notification to a topic (for broadcasts)
   */
  async sendToTopic(
    topic: string,
    payload: PushNotificationPayload,
  ): Promise<SendResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Push notifications not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push sent to topic ${topic}: ${response}`);

      return { success: true, messageId: response };
    } catch (error) {
      this.logger.error(`Failed to send push to topic ${topic}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe a device to a topic
   */
  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await admin.messaging().subscribeToTopic([token], topic);
      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic: ${error.message}`);
      return false;
    }
  }

  /**
   * Unsubscribe a device from a topic
   */
  async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await admin.messaging().unsubscribeFromTopic([token], topic);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic: ${error.message}`);
      return false;
    }
  }

  /**
   * Register a device token for a user
   */
  async registerDeviceToken(userId: string, token: string): Promise<boolean> {
    try {
      await this.userModel.findByIdAndUpdate(
        userId,
        { $addToSet: { device_tokens: token } },
        { new: true }
      );

      // Subscribe to user-specific topic and general topics
      await this.subscribeToTopic(token, `user_${userId}`);
      await this.subscribeToTopic(token, 'all_users');

      this.logger.log(`Device token registered for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to register device token: ${error.message}`);
      return false;
    }
  }

  /**
   * Remove a device token
   */
  async removeDeviceToken(userId: string, token: string): Promise<boolean> {
    try {
      await this.userModel.findByIdAndUpdate(
        userId,
        { $pull: { device_tokens: token } }
      );

      await this.unsubscribeFromTopic(token, `user_${userId}`);
      await this.unsubscribeFromTopic(token, 'all_users');

      this.logger.log(`Device token removed for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove device token: ${error.message}`);
      return false;
    }
  }

  /**
   * Remove invalid token from all users
   */
  private async removeInvalidToken(token: string): Promise<void> {
    try {
      await this.userModel.updateMany(
        { device_tokens: token },
        { $pull: { device_tokens: token } }
      );
      this.logger.debug(`Removed invalid token: ${token.substring(0, 20)}...`);
    } catch (error) {
      this.logger.error(`Failed to remove invalid token: ${error.message}`);
    }
  }

  /**
   * Check if push notifications are enabled
   */
  isEnabled(): boolean {
    return this.isInitialized;
  }
}
