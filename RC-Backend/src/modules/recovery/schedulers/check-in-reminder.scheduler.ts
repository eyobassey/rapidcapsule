import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
} from '../../notifications/types/notification.types';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
  RecoveryStatus as RecoveryProfileStatus,
} from '../entities/recovery-profile.entity';
import {
  SobrietyLog,
  SobrietyLogDocument,
} from '../entities/sobriety-log.entity';

/**
 * Daily scheduler that sends check-in reminders to recovery patients
 * who haven't logged their daily sobriety check-in.
 */
@Injectable()
export class CheckInReminderScheduler {
  private readonly logger = new Logger(CheckInReminderScheduler.name);

  constructor(
    @InjectModel(RecoveryProfile.name)
    private recoveryProfileModel: Model<RecoveryProfileDocument>,
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Runs daily at 8:00 AM UTC.
   * Finds active recovery patients who haven't checked in today
   * and sends a gentle reminder notification.
   */
  @Cron('0 0 8 * * *')
  async handleDailyCheckInReminder(): Promise<void> {
    this.logger.log('Starting daily check-in reminder batch...');
    const startTime = Date.now();
    let sent = 0;
    let errors = 0;

    try {
      // Get all active recovery profiles
      const activeProfiles = await this.recoveryProfileModel
        .find({
          status: RecoveryProfileStatus.ACTIVE,
          deleted_at: { $exists: false },
        })
        .select('_id user')
        .lean();

      if (!activeProfiles.length) {
        this.logger.log('No active recovery profiles found');
        return;
      }

      // Get today's date range
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Find users who already checked in today
      const checkedInToday = await this.sobrietyLogModel
        .find({
          user: { $in: activeProfiles.map((p) => p.user) },
          log_date: { $gte: todayStart, $lte: todayEnd },
        })
        .select('user')
        .lean();

      const checkedInUserIds = new Set(
        checkedInToday.map((l) => l.user.toString()),
      );

      // Filter to users who haven't checked in
      const needsReminder = activeProfiles.filter(
        (p) => !checkedInUserIds.has(p.user.toString()),
      );

      this.logger.log(
        `${needsReminder.length} of ${activeProfiles.length} patients need check-in reminder`,
      );

      // Send notifications
      for (const profile of needsReminder) {
        try {
          await this.notificationsService.createFromPayload({
            userId: profile.user.toString(),
            user_type: UserTypeNotification.PATIENT,
            type: NotificationType.RECOVERY_CHECK_IN_REMINDER,
            title: 'Daily Check-in Reminder',
            message:
              "How are you feeling today? Take a moment to log your daily recovery check-in. Every day counts.",
            data: {
              action: 'open_recovery_check_in',
              profileId: profile._id.toString(),
            },
            action_url: '/recovery/check-in',
            priority: NotificationPriority.MEDIUM,
            channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          });
          sent++;
        } catch (err) {
          errors++;
          this.logger.warn(
            `Failed to send check-in reminder to user ${profile.user}: ${err.message}`,
          );
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(
        `Check-in reminders complete: ${sent} sent, ${errors} errors (${duration}s)`,
      );
    } catch (error) {
      this.logger.error(
        `Check-in reminder batch failed: ${error.message}`,
        error.stack,
      );
    }
  }
}
