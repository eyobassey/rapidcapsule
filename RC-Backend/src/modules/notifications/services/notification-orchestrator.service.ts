import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/entities/user.entity';
import { UserSetting, UserSettingsDocument } from '../../user-settings/entities/user-setting.entity';
import { NotificationsService } from '../notifications.service';
import { NotificationsGateway } from '../notifications.gateway';
import { GeneralHelpers } from '../../../common/helpers/general.helpers';
import { SmsNotificationService } from './sms-notification.service';
import { PushNotificationService } from './push-notification.service';
import { WhatsAppNotificationService, NotificationType as WhatsAppNotificationType } from '../../whatsapp/services/whatsapp-notification.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
  CreateNotificationPayload,
  NotificationPreferences,
} from '../types/notification.types';

interface NotificationTemplate {
  title: string;
  message: string;
  action_url?: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
}

@Injectable()
export class NotificationOrchestratorService {
  private readonly logger = new Logger(NotificationOrchestratorService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserSetting.name) private userSettingsModel: Model<UserSettingsDocument>,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
    private generalHelpers: GeneralHelpers,
    private smsNotificationService: SmsNotificationService,
    private pushNotificationService: PushNotificationService,
    @Optional() private whatsAppNotificationService: WhatsAppNotificationService,
  ) {}

  // Main method to send notifications
  async sendNotification(payload: CreateNotificationPayload): Promise<void> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(payload.userId);

      // Filter channels based on preferences
      const allowedChannels = await this.filterChannelsByPreferences(
        payload.type,
        payload.channels || [NotificationChannel.IN_APP],
        preferences,
      );

      if (allowedChannels.length === 0) {
        this.logger.debug(`No channels allowed for notification type ${payload.type} for user ${payload.userId}`);
        return;
      }

      // Create the notification record
      const notification = await this.notificationsService.createFromPayload({
        ...payload,
        channels: allowedChannels,
      });

      // Dispatch to each channel
      await this.dispatchToChannels(notification, allowedChannels, payload.userId);

    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`, error.stack);
    }
  }

  // Get user notification preferences
  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const [user, settings] = await Promise.all([
        this.userModel.findById(userId).select('device_integration marketing').lean(),
        this.userSettingsModel.findOne({ userId: new Types.ObjectId(userId) }).lean(),
      ]);

      // Access settings defaults with type assertion for flexible access
      const defaults = (settings?.defaults || {}) as Record<string, any>;
      const receiveEmail = defaults.receive_email_notifications ?? true;
      const marketing = (user as any)?.marketing ?? defaults.marketing ?? false;

      // Merge preferences from user and settings
      const prefs: NotificationPreferences = {
        appointment_reminders: {
          in_app: true,
          email: receiveEmail,
          sms: true,
          whatsapp: true,
          push: true,
        },
        appointment_updates: {
          in_app: true,
          email: receiveEmail,
          sms: false,
          whatsapp: true,
          push: true,
        },
        payment_updates: {
          in_app: true,
          email: true,
          sms: false,
          whatsapp: false,
          push: true,
        },
        health_reminders: {
          in_app: true,
          email: user?.device_integration?.notification_preferences?.health_reminders ?? true,
          sms: false,
          whatsapp: false,
          push: true,
        },
        vitals_alerts: {
          in_app: true,
          email: true,
          sms: true,
          whatsapp: true,
          push: true,
        },
        prescription_updates: {
          in_app: true,
          email: true,
          sms: true,
          whatsapp: true,
          push: true,
        },
        promotional: {
          in_app: true,
          email: marketing,
          sms: false,
          whatsapp: false,
          push: false,
        },
      };

      return prefs;
    } catch (error) {
      this.logger.warn(`Failed to get user preferences: ${error.message}`);
      // Return default preferences
      return {
        appointment_reminders: { in_app: true, email: true, sms: false, whatsapp: false, push: true },
        appointment_updates: { in_app: true, email: true, sms: false, whatsapp: false, push: true },
        payment_updates: { in_app: true, email: true, sms: false, whatsapp: false, push: true },
        health_reminders: { in_app: true, email: false, sms: false, whatsapp: false, push: true },
        vitals_alerts: { in_app: true, email: true, sms: true, whatsapp: false, push: true },
        prescription_updates: { in_app: true, email: true, sms: false, whatsapp: false, push: true },
        promotional: { in_app: true, email: false, sms: false, whatsapp: false, push: false },
      };
    }
  }

  // Map notification type to preference category
  private getPreferenceCategory(type: NotificationType): keyof NotificationPreferences {
    const mapping: Record<NotificationType, keyof NotificationPreferences> = {
      [NotificationType.APPOINTMENT_BOOKED]: 'appointment_updates',
      [NotificationType.APPOINTMENT_CONFIRMED]: 'appointment_updates',
      [NotificationType.APPOINTMENT_REMINDER]: 'appointment_reminders',
      [NotificationType.APPOINTMENT_CANCELLED]: 'appointment_updates',
      [NotificationType.APPOINTMENT_RESCHEDULED]: 'appointment_updates',
      [NotificationType.APPOINTMENT_COMPLETED]: 'appointment_updates',
      [NotificationType.APPOINTMENT_MISSED]: 'appointment_updates',
      [NotificationType.APPOINTMENT_STARTED]: 'appointment_updates',
      [NotificationType.PRESCRIPTION_CREATED]: 'prescription_updates',
      [NotificationType.PRESCRIPTION_READY]: 'prescription_updates',
      [NotificationType.PRESCRIPTION_PAYMENT_REQUIRED]: 'prescription_updates',
      [NotificationType.PRESCRIPTION_SHIPPED]: 'prescription_updates',
      [NotificationType.PRESCRIPTION_DELIVERED]: 'prescription_updates',
      [NotificationType.PHARMACY_ORDER_PLACED]: 'prescription_updates',
      [NotificationType.PHARMACY_ORDER_CONFIRMED]: 'prescription_updates',
      [NotificationType.PHARMACY_ORDER_PROCESSING]: 'prescription_updates',
      [NotificationType.PHARMACY_ORDER_SHIPPED]: 'prescription_updates',
      [NotificationType.PHARMACY_ORDER_DELIVERED]: 'prescription_updates',
      [NotificationType.PHARMACY_ORDER_CANCELLED]: 'prescription_updates',
      [NotificationType.PAYMENT_RECEIVED]: 'payment_updates',
      [NotificationType.PAYMENT_FAILED]: 'payment_updates',
      [NotificationType.WALLET_CREDITED]: 'payment_updates',
      [NotificationType.WALLET_DEBITED]: 'payment_updates',
      [NotificationType.EARNINGS_AVAILABLE]: 'payment_updates',
      [NotificationType.REFUND_PROCESSED]: 'payment_updates',
      [NotificationType.HEALTH_CHECKUP_COMPLETE]: 'health_reminders',
      [NotificationType.HEALTH_SCORE_UPDATED]: 'health_reminders',
      [NotificationType.VITALS_ALERT]: 'vitals_alerts',
      [NotificationType.VITALS_REMINDER]: 'health_reminders',
      [NotificationType.ACCOUNT_VERIFIED]: 'appointment_updates',
      [NotificationType.PROFILE_UPDATE_REQUIRED]: 'appointment_updates',
      [NotificationType.SYSTEM_MAINTENANCE]: 'appointment_updates',
      [NotificationType.PROMOTIONAL]: 'promotional',
      [NotificationType.WELCOME]: 'appointment_updates',
      [NotificationType.NEW_PATIENT_ASSIGNED]: 'appointment_updates',
      [NotificationType.PATIENT_MESSAGE]: 'appointment_updates',
      [NotificationType.REVIEW_RECEIVED]: 'appointment_updates',
      [NotificationType.NEW_USER_REGISTERED]: 'appointment_updates',
      [NotificationType.SPECIALIST_VERIFICATION_PENDING]: 'appointment_updates',
      [NotificationType.SUPPORT_TICKET]: 'appointment_updates',
    };

    return mapping[type] || 'appointment_updates';
  }

  // Filter channels based on user preferences
  private async filterChannelsByPreferences(
    type: NotificationType,
    requestedChannels: NotificationChannel[],
    preferences: NotificationPreferences,
  ): Promise<NotificationChannel[]> {
    const category = this.getPreferenceCategory(type);
    const categoryPrefs = (preferences[category] || {}) as Record<string, boolean | undefined>;

    const channelMapping: Record<NotificationChannel, string> = {
      [NotificationChannel.IN_APP]: 'in_app',
      [NotificationChannel.EMAIL]: 'email',
      [NotificationChannel.SMS]: 'sms',
      [NotificationChannel.WHATSAPP]: 'whatsapp',
      [NotificationChannel.PUSH]: 'push',
    };

    return requestedChannels.filter((channel) => {
      const prefKey = channelMapping[channel];
      return categoryPrefs[prefKey] !== false;
    });
  }

  // Dispatch notification to all channels
  private async dispatchToChannels(
    notification: any,
    channels: NotificationChannel[],
    userId: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) return;

    const dispatchers = channels.map(async (channel) => {
      try {
        switch (channel) {
          case NotificationChannel.IN_APP:
            // Already handled by NotificationsService
            break;

          case NotificationChannel.EMAIL:
            await this.sendEmailNotification(notification, user);
            break;

          case NotificationChannel.SMS:
            await this.sendSmsNotification(notification, user);
            break;

          case NotificationChannel.WHATSAPP:
            await this.sendWhatsAppNotification(notification, user);
            break;

          case NotificationChannel.PUSH:
            await this.sendPushNotification(notification, user);
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send ${channel} notification: ${error.message}`);
      }
    });

    await Promise.allSettled(dispatchers);
  }

  // Send email notification using existing Brevo helper
  private async sendEmailNotification(notification: any, user: any): Promise<void> {
    const email = user.profile?.contact?.email;
    if (!email) return;

    const firstName = user.profile?.first_name || 'User';

    await this.generalHelpers.sendEmail(
      email,
      notification.title,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${notification.title}</h2>
          <p>Hi ${firstName},</p>
          <p>${notification.message}</p>
          ${notification.action_url ? `<p><a href="${notification.action_url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>` : ''}
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">This is an automated message from Rapid Capsule.</p>
        </div>
      `,
    );

    await this.notificationsService.updateDeliveryStatus(
      notification._id.toString(),
      NotificationChannel.EMAIL,
      'sent' as any,
    );
  }

  // Send SMS notification using Twilio
  private async sendSmsNotification(notification: any, user: any): Promise<void> {
    const phone = user.profile?.contact?.phone?.number;
    const countryCode = user.profile?.contact?.phone?.country_code || '+234';

    if (!phone) {
      this.logger.debug(`SMS not sent - no phone number for user ${user._id}`);
      return;
    }

    const fullPhone = `${countryCode}${phone}`.replace(/^\+?\+/, '+');

    try {
      // Use urgent SMS for high/urgent priority notifications
      const result = notification.priority === NotificationPriority.URGENT
        ? await this.smsNotificationService.sendUrgentSms(fullPhone, notification.message)
        : await this.smsNotificationService.sendSms(fullPhone, notification.message);

      if (result.success) {
        await this.notificationsService.updateDeliveryStatus(
          notification._id.toString(),
          NotificationChannel.SMS,
          'sent' as any,
        );
        this.logger.log(`SMS sent to ${fullPhone}`);
      } else {
        await this.notificationsService.updateDeliveryStatus(
          notification._id.toString(),
          NotificationChannel.SMS,
          'failed' as any,
          result.error,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${fullPhone}: ${error.message}`);
      await this.notificationsService.updateDeliveryStatus(
        notification._id.toString(),
        NotificationChannel.SMS,
        'failed' as any,
        error.message,
      );
    }
  }

  // Send WhatsApp notification using WhatsApp service
  private async sendWhatsAppNotification(notification: any, user: any): Promise<void> {
    if (!this.whatsAppNotificationService) {
      this.logger.debug('WhatsApp service not available');
      return;
    }

    const phone = user.profile?.contact?.phone?.number;
    const countryCode = user.profile?.contact?.phone?.country_code || '+234';

    if (!phone) {
      this.logger.debug(`WhatsApp not sent - no phone number for user ${user._id}`);
      return;
    }

    const fullPhone = `${countryCode}${phone}`.replace(/^\+?\+/, '+');

    try {
      // Map notification type to WhatsApp notification type
      const whatsAppType = this.mapToWhatsAppNotificationType(notification.type);

      const result = await this.whatsAppNotificationService.sendNotification(
        fullPhone,
        whatsAppType,
        {
          ...notification.data,
          message: notification.message,
          title: notification.title,
        },
      );

      if (result.success) {
        await this.notificationsService.updateDeliveryStatus(
          notification._id.toString(),
          NotificationChannel.WHATSAPP,
          'sent' as any,
        );
        this.logger.log(`WhatsApp sent to ${fullPhone}`);
      } else {
        // If WhatsApp identity not found, silently skip
        if (result.error?.includes('No verified WhatsApp')) {
          this.logger.debug(`WhatsApp not sent - user ${user._id} not linked`);
        } else {
          await this.notificationsService.updateDeliveryStatus(
            notification._id.toString(),
            NotificationChannel.WHATSAPP,
            'failed' as any,
            result.error,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp to ${fullPhone}: ${error.message}`);
      await this.notificationsService.updateDeliveryStatus(
        notification._id.toString(),
        NotificationChannel.WHATSAPP,
        'failed' as any,
        error.message,
      );
    }
  }

  // Send push notification using Firebase
  private async sendPushNotification(notification: any, user: any): Promise<void> {
    try {
      const result = await this.pushNotificationService.sendToUser(
        user._id.toString(),
        {
          title: notification.title,
          body: notification.message,
          data: {
            type: notification.type,
            notification_id: notification._id.toString(),
            action_url: notification.action_url || '',
          },
        },
      );

      if (result.success) {
        await this.notificationsService.updateDeliveryStatus(
          notification._id.toString(),
          NotificationChannel.PUSH,
          'sent' as any,
        );
        this.logger.log(`Push notification sent to user ${user._id}`);
      } else {
        // If no device tokens, silently skip
        if (result.error?.includes('No device tokens')) {
          this.logger.debug(`Push not sent - no device tokens for user ${user._id}`);
        } else {
          await this.notificationsService.updateDeliveryStatus(
            notification._id.toString(),
            NotificationChannel.PUSH,
            'failed' as any,
            result.error,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to send push to user ${user._id}: ${error.message}`);
      await this.notificationsService.updateDeliveryStatus(
        notification._id.toString(),
        NotificationChannel.PUSH,
        'failed' as any,
        error.message,
      );
    }
  }

  // Map our notification types to WhatsApp notification types
  private mapToWhatsAppNotificationType(type: NotificationType): WhatsAppNotificationType {
    const mapping: Partial<Record<NotificationType, WhatsAppNotificationType>> = {
      [NotificationType.PRESCRIPTION_CREATED]: WhatsAppNotificationType.PRESCRIPTION_RECEIVED,
      [NotificationType.PRESCRIPTION_READY]: WhatsAppNotificationType.PRESCRIPTION_VERIFIED,
      [NotificationType.PHARMACY_ORDER_PLACED]: WhatsAppNotificationType.ORDER_CONFIRMED,
      [NotificationType.PHARMACY_ORDER_CONFIRMED]: WhatsAppNotificationType.ORDER_CONFIRMED,
      [NotificationType.PHARMACY_ORDER_PROCESSING]: WhatsAppNotificationType.ORDER_PROCESSING,
      [NotificationType.PHARMACY_ORDER_SHIPPED]: WhatsAppNotificationType.ORDER_OUT_FOR_DELIVERY,
      [NotificationType.PHARMACY_ORDER_DELIVERED]: WhatsAppNotificationType.ORDER_DELIVERED,
      [NotificationType.PHARMACY_ORDER_CANCELLED]: WhatsAppNotificationType.ORDER_CANCELLED,
      [NotificationType.PAYMENT_RECEIVED]: WhatsAppNotificationType.PAYMENT_RECEIVED,
      [NotificationType.PAYMENT_FAILED]: WhatsAppNotificationType.PAYMENT_FAILED,
      [NotificationType.ACCOUNT_VERIFIED]: WhatsAppNotificationType.ACCOUNT_VERIFIED,
    };

    return mapping[type] || WhatsAppNotificationType.PROMOTIONAL;
  }

  // Convenience methods for common notification types
  async notifyAppointmentBooked(data: {
    patientId: string;
    specialistId: string;
    appointmentId: string;
    date: Date;
    specialistName: string;
    patientName: string;
  }): Promise<void> {
    // Notify patient
    await this.sendNotification({
      userId: data.patientId,
      user_type: UserTypeNotification.PATIENT,
      type: NotificationType.APPOINTMENT_BOOKED,
      title: 'Appointment Booked',
      message: `Your appointment with Dr. ${data.specialistName} has been booked for ${data.date.toLocaleDateString()}.`,
      data: { appointmentId: data.appointmentId, date: data.date },
      action_url: `/app/patient/appointments/${data.appointmentId}`,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
    });

    // Notify specialist
    await this.sendNotification({
      userId: data.specialistId,
      user_type: UserTypeNotification.SPECIALIST,
      type: NotificationType.APPOINTMENT_BOOKED,
      title: 'New Appointment',
      message: `${data.patientName} has booked an appointment for ${data.date.toLocaleDateString()}.`,
      data: { appointmentId: data.appointmentId, date: data.date },
      action_url: `/app/specialist/appointments/${data.appointmentId}`,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  async notifyPaymentReceived(data: {
    userId: string;
    userType: UserTypeNotification;
    amount: number;
    currency?: string;
    description: string;
    paymentId: string;
  }): Promise<void> {
    await this.sendNotification({
      userId: data.userId,
      user_type: data.userType,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Received',
      message: `Payment of ${data.currency || 'NGN'} ${data.amount.toLocaleString()} received for ${data.description}.`,
      data: { paymentId: data.paymentId, amount: data.amount },
      action_url: `/app/patient/wallet`,
      priority: NotificationPriority.MEDIUM,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  async notifyPrescriptionCreated(data: {
    patientId: string;
    prescriptionId: string;
    specialistName: string;
    medications: string[];
  }): Promise<void> {
    await this.sendNotification({
      userId: data.patientId,
      user_type: UserTypeNotification.PATIENT,
      type: NotificationType.PRESCRIPTION_CREATED,
      title: 'New Prescription',
      message: `Dr. ${data.specialistName} has created a new prescription for you with ${data.medications.length} medication(s).`,
      data: { prescriptionId: data.prescriptionId, medications: data.medications },
      action_url: `/app/patient/prescriptions/${data.prescriptionId}`,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
    });
  }

  async notifyHealthCheckupComplete(data: {
    userId: string;
    checkupId: string;
    triageLevel: string;
  }): Promise<void> {
    await this.sendNotification({
      userId: data.userId,
      user_type: UserTypeNotification.PATIENT,
      type: NotificationType.HEALTH_CHECKUP_COMPLETE,
      title: 'Health Checkup Complete',
      message: `Your health checkup has been completed. Triage level: ${data.triageLevel}.`,
      data: { checkupId: data.checkupId, triageLevel: data.triageLevel },
      action_url: `/app/patient/health-checkup/${data.checkupId}`,
      priority: data.triageLevel === 'emergency' ? NotificationPriority.URGENT : NotificationPriority.MEDIUM,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  // Public method to get user notification preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    return this.getUserPreferences(userId);
  }

  // Update user notification preferences
  async updateNotificationPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    try {
      // Get or create user settings
      let settings = await this.userSettingsModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!settings) {
        settings = new this.userSettingsModel({
          userId: new Types.ObjectId(userId),
          defaults: {},
        });
      }

      // Ensure notification_preferences exists
      if (!settings.defaults) {
        settings.defaults = {} as any;
      }

      // Safely access and update notification preferences
      const defaults = settings.defaults as any;
      if (!defaults.notification_preferences) {
        defaults.notification_preferences = {};
      }

      // Merge updates
      Object.keys(updates).forEach((category) => {
        if (!defaults.notification_preferences[category]) {
          defaults.notification_preferences[category] = {};
        }
        Object.assign(defaults.notification_preferences[category], updates[category]);
      });

      settings.markModified('defaults');
      await settings.save();

      this.logger.log(`Updated notification preferences for user ${userId}`);

      // Return the updated preferences
      return this.getUserPreferences(userId);
    } catch (error) {
      this.logger.error(`Failed to update preferences for user ${userId}: ${error.message}`);
      throw error;
    }
  }
}
