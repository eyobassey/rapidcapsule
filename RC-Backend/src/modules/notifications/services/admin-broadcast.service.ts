import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Notification, NotificationDocument } from '../entities/notification.entity';
import { NotificationsGateway } from '../notifications.gateway';
import { PushNotificationService } from './push-notification.service';
import { GeneralHelpers } from '../../../common/helpers/general.helpers';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
} from '../types/notification.types';

interface BroadcastPayload {
  title: string;
  message: string;
  priority?: NotificationPriority;
  action_url?: string;
  target_user_types?: UserTypeNotification[];
  channels?: NotificationChannel[];
  data?: Record<string, any>;
}

interface BroadcastResult {
  broadcast_id: string;
  total_recipients: number;
  delivered: {
    in_app: number;
    email: number;
    push: number;
  };
  failed: number;
}

@Injectable()
export class AdminBroadcastService {
  private readonly logger = new Logger(AdminBroadcastService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private notificationsGateway: NotificationsGateway,
    private pushNotificationService: PushNotificationService,
    private generalHelpers: GeneralHelpers,
  ) {}

  /**
   * Send a broadcast notification to all users or specific user types
   */
  async sendBroadcast(payload: BroadcastPayload): Promise<BroadcastResult> {
    const broadcastId = new Types.ObjectId().toString();
    const channels = payload.channels || [NotificationChannel.IN_APP];
    const targetTypes = payload.target_user_types || [
      UserTypeNotification.PATIENT,
      UserTypeNotification.SPECIALIST,
    ];

    this.logger.log(`Starting broadcast ${broadcastId} to ${targetTypes.join(', ')}`);

    // Build user query
    const userQuery: any = {
      is_active: true,
      user_type: { $in: targetTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)) },
    };

    // Get all target users
    const users = await this.userModel.find(userQuery)
      .select('_id user_type profile.first_name profile.contact.email device_tokens')
      .lean();

    this.logger.log(`Found ${users.length} users for broadcast`);

    const result: BroadcastResult = {
      broadcast_id: broadcastId,
      total_recipients: users.length,
      delivered: { in_app: 0, email: 0, push: 0 },
      failed: 0,
    };

    // Process in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (user) => {
          try {
            const userType = user.user_type.toLowerCase() as UserTypeNotification;

            // Create notification record
            const notification = await this.notificationModel.create({
              userId: user._id,
              user_type: userType,
              type: NotificationType.SYSTEM_MAINTENANCE,
              title: payload.title,
              message: payload.message,
              data: { ...payload.data, broadcast_id: broadcastId },
              action_url: payload.action_url,
              priority: payload.priority || NotificationPriority.MEDIUM,
              is_read: false,
              delivery_status: channels.map((channel) => ({
                channel,
                status: 'pending',
              })),
            });

            // Send via each channel
            for (const channel of channels) {
              try {
                switch (channel) {
                  case NotificationChannel.IN_APP:
                    // Send via WebSocket
                    this.notificationsGateway.sendToUser(user._id.toString(), 'notification', notification);
                    result.delivered.in_app++;
                    break;

                  case NotificationChannel.EMAIL:
                    const email = user.profile?.contact?.email;
                    if (email) {
                      await this.generalHelpers.sendEmail(
                        email,
                        payload.title,
                        this.buildEmailTemplate(payload, user.profile?.first_name || 'User'),
                      );
                      result.delivered.email++;
                    }
                    break;

                  case NotificationChannel.PUSH:
                    if ((user as any).device_tokens?.length) {
                      const pushResult = await this.pushNotificationService.sendToUser(
                        user._id.toString(),
                        {
                          title: payload.title,
                          body: payload.message,
                          data: {
                            type: NotificationType.SYSTEM_MAINTENANCE,
                            action_url: payload.action_url || '',
                            broadcast_id: broadcastId,
                          },
                        },
                      );
                      if (pushResult.success) result.delivered.push++;
                    }
                    break;
                }
              } catch (channelError) {
                this.logger.error(`Failed to send ${channel} to ${user._id}: ${channelError.message}`);
              }
            }
          } catch (error) {
            this.logger.error(`Failed to process user ${user._id}: ${error.message}`);
            result.failed++;
          }
        })
      );

      // Small delay between batches to prevent overwhelming services
      if (i + batchSize < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    this.logger.log(`Broadcast ${broadcastId} complete: ${JSON.stringify(result.delivered)}`);
    return result;
  }

  /**
   * Send notification to specific user group (e.g., premium users, specific region)
   */
  async sendToUserGroup(
    userIds: string[],
    payload: BroadcastPayload,
  ): Promise<BroadcastResult> {
    const broadcastId = new Types.ObjectId().toString();
    const channels = payload.channels || [NotificationChannel.IN_APP];

    const result: BroadcastResult = {
      broadcast_id: broadcastId,
      total_recipients: userIds.length,
      delivered: { in_app: 0, email: 0, push: 0 },
      failed: 0,
    };

    const users = await this.userModel.find({
      _id: { $in: userIds.map((id) => new Types.ObjectId(id)) },
      is_active: true,
    }).select('_id user_type profile.first_name profile.contact.email device_tokens').lean();

    for (const user of users) {
      try {
        const notification = await this.notificationModel.create({
          userId: user._id,
          user_type: user.user_type.toLowerCase(),
          type: NotificationType.PROMOTIONAL,
          title: payload.title,
          message: payload.message,
          data: { ...payload.data, broadcast_id: broadcastId },
          action_url: payload.action_url,
          priority: payload.priority || NotificationPriority.LOW,
          is_read: false,
          delivery_status: channels.map((channel) => ({
            channel,
            status: 'pending',
          })),
        });

        if (channels.includes(NotificationChannel.IN_APP)) {
          this.notificationsGateway.sendToUser(user._id.toString(), 'notification', notification);
          result.delivered.in_app++;
        }

        if (channels.includes(NotificationChannel.PUSH) && (user as any).device_tokens?.length) {
          await this.pushNotificationService.sendToUser(user._id.toString(), {
            title: payload.title,
            body: payload.message,
          });
          result.delivered.push++;
        }
      } catch (error) {
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Get broadcast history
   */
  async getBroadcastHistory(limit: number = 20): Promise<any[]> {
    const broadcasts = await this.notificationModel.aggregate([
      {
        $match: {
          'data.broadcast_id': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$data.broadcast_id',
          title: { $first: '$title' },
          message: { $first: '$message' },
          created_at: { $first: '$created_at' },
          total_recipients: { $sum: 1 },
          read_count: {
            $sum: { $cond: ['$is_read', 1, 0] },
          },
        },
      },
      { $sort: { created_at: -1 } },
      { $limit: limit },
    ]);

    return broadcasts;
  }

  /**
   * Build email template for broadcast
   */
  private buildEmailTemplate(payload: BroadcastPayload, firstName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${payload.title}</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="color: #374151; font-size: 16px;">Hi ${firstName},</p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">${payload.message}</p>
          ${payload.action_url ? `
            <div style="margin-top: 25px;">
              <a href="${payload.action_url}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
                Learn More
              </a>
            </div>
          ` : ''}
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>This is an automated message from Rapid Capsule.</p>
          <p>© ${new Date().getFullYear()} Rapid Capsule. All rights reserved.</p>
        </div>
      </div>
    `;
  }
}
