import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationDocument } from '../entities/notification.entity';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
  CreateNotificationPayload,
} from '../types/notification.types';

interface ScheduledNotification {
  userId: string;
  user_type: UserTypeNotification;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  scheduled_for: Date;
}

@Injectable()
export class ScheduledNotificationService {
  private readonly logger = new Logger(ScheduledNotificationService.name);
  private scheduledQueue: Map<string, ScheduledNotification> = new Map();

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private orchestratorService: NotificationOrchestratorService,
  ) {}

  /**
   * Schedule a notification for future delivery
   */
  async scheduleNotification(
    payload: CreateNotificationPayload,
    scheduledFor: Date,
  ): Promise<string> {
    const scheduleId = new Types.ObjectId().toString();

    // Create notification record with scheduled status
    const notification = await this.notificationModel.create({
      ...payload,
      userId: new Types.ObjectId(payload.userId),
      scheduled_for: scheduledFor,
      delivery_status: [{
        channel: NotificationChannel.IN_APP,
        status: 'pending',
      }],
    });

    // Add to in-memory queue for processing
    this.scheduledQueue.set(notification._id.toString(), {
      ...payload,
      scheduled_for: scheduledFor,
    });

    this.logger.log(`Notification scheduled for ${scheduledFor.toISOString()}: ${notification._id}`);

    return notification._id.toString();
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    try {
      // Remove from queue
      this.scheduledQueue.delete(notificationId);

      // Update database record
      await this.notificationModel.findByIdAndUpdate(notificationId, {
        $set: {
          'delivery_status.$[].status': 'failed',
          'delivery_status.$[].error': 'Cancelled by user',
        },
      });

      this.logger.log(`Scheduled notification cancelled: ${notificationId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Process scheduled notifications (runs every minute)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications(): Promise<void> {
    const now = new Date();

    try {
      // Find all pending scheduled notifications that are due
      const dueNotifications = await this.notificationModel.find({
        scheduled_for: { $lte: now },
        'delivery_status.status': 'pending',
      }).limit(100);

      if (dueNotifications.length === 0) return;

      this.logger.log(`Processing ${dueNotifications.length} scheduled notifications`);

      for (const notification of dueNotifications) {
        try {
          // Send the notification through orchestrator
          await this.orchestratorService.sendNotification({
            userId: notification.userId.toString(),
            user_type: notification.user_type as UserTypeNotification,
            type: notification.type as NotificationType,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            action_url: notification.action_url,
            priority: notification.priority as NotificationPriority,
            channels: notification.delivery_status.map((s) => s.channel as NotificationChannel),
          });

          // Update original scheduled notification as sent
          await this.notificationModel.findByIdAndUpdate(notification._id, {
            $set: {
              'delivery_status.$[].status': 'sent',
              'delivery_status.$[].sent_at': now,
            },
          });

          // Remove from in-memory queue
          this.scheduledQueue.delete(notification._id.toString());

        } catch (error) {
          this.logger.error(`Failed to send scheduled notification ${notification._id}: ${error.message}`);

          await this.notificationModel.findByIdAndUpdate(notification._id, {
            $set: {
              'delivery_status.$[].status': 'failed',
              'delivery_status.$[].error': error.message,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error processing scheduled notifications: ${error.message}`);
    }
  }

  /**
   * Schedule appointment reminders
   */
  async scheduleAppointmentReminder(
    patientId: string,
    appointmentId: string,
    appointmentDate: Date,
    specialistName: string,
    reminderMinutesBefore: number = 60,
  ): Promise<string | null> {
    const reminderTime = new Date(appointmentDate.getTime() - reminderMinutesBefore * 60 * 1000);

    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      this.logger.debug(`Reminder time already passed for appointment ${appointmentId}`);
      return null;
    }

    return this.scheduleNotification(
      {
        userId: patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.APPOINTMENT_REMINDER,
        title: 'Appointment Reminder',
        message: `Your appointment with Dr. ${specialistName} is in ${reminderMinutesBefore} minutes.`,
        data: { appointmentId, appointmentDate: appointmentDate.toISOString() },
        action_url: `/app/patient/appointments/${appointmentId}`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
      },
      reminderTime,
    );
  }

  /**
   * Schedule medication reminder
   */
  async scheduleMedicationReminder(
    patientId: string,
    prescriptionId: string,
    medicationName: string,
    reminderTime: Date,
  ): Promise<string> {
    return this.scheduleNotification(
      {
        userId: patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.VITALS_REMINDER,
        title: 'Medication Reminder',
        message: `Time to take your medication: ${medicationName}`,
        data: { prescriptionId, medicationName },
        action_url: `/app/patient/prescriptions/${prescriptionId}`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      },
      reminderTime,
    );
  }

  /**
   * Get pending scheduled notifications for a user
   */
  async getPendingScheduledNotifications(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel.find({
      userId: new Types.ObjectId(userId),
      scheduled_for: { $gt: new Date() },
      'delivery_status.status': 'pending',
    }).sort({ scheduled_for: 1 });
  }
}
