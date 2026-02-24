import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './entities/conversation.entity';
import { Message, MessageDocument } from './entities/message.entity';
import { UserSetting, UserSettingsDocument } from '../user-settings/entities/user-setting.entity';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { unreadMessageEmail } from './emails/unread-message-email';

/** Default: how long a message must be unread before we notify (minutes) */
const DEFAULT_UNREAD_THRESHOLD_MINUTES = 20;

/** Default: minimum time between email notifications per conversation per user (hours) */
const DEFAULT_COOLDOWN_HOURS = 3;

/** Coarse DB-level filter — minimum possible threshold (5 min) to catch all users */
const MIN_THRESHOLD_MS = 5 * 60 * 1000;

/** Max conversations to process per cron run (avoid overload) */
const BATCH_LIMIT = 50;

@Injectable()
export class MessagingNotificationScheduler {
  private readonly logger = new Logger(MessagingNotificationScheduler.name);

  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(UserSetting.name) private userSettingsModel: Model<UserSettingsDocument>,
    private readonly generalHelpers: GeneralHelpers,
  ) {}

  /**
   * Runs every 5 minutes.
   * Finds users with unread messages older than their configured threshold,
   * respecting per-user cooldown, quiet hours, and email preference.
   */
  @Cron('0 */5 * * * *')
  async handleUnreadNotifications(): Promise<void> {
    try {
      const now = new Date();
      // Use minimum threshold for the DB query (individual user thresholds checked later)
      const threshold = new Date(now.getTime() - MIN_THRESHOLD_MS);

      this.logger.log(`Cron fired. Coarse threshold: ${threshold.toISOString()}`);

      // Find active conversations that have a last_message older than min threshold
      const conversations = await this.conversationModel
        .find({
          is_active: true,
          is_archived: false,
          'last_message.sent_at': { $lte: threshold },
        })
        .populate('participants.user', 'profile user_type')
        .limit(BATCH_LIMIT)
        .lean();

      if (!conversations.length) {
        this.logger.log('No conversations with old unread messages found.');
        return;
      }

      this.logger.log(`Found ${conversations.length} conversations to check.`);

      let emailsSent = 0;

      for (const conv of conversations) {
        try {
          const sent = await this.processConversation(conv, now);
          emailsSent += sent;
        } catch (err) {
          this.logger.error(`Error processing conversation ${conv._id}: ${err.message}`);
        }
      }

      this.logger.log(
        `Unread notification check complete. ${conversations.length} conversations checked, ${emailsSent} emails sent.`,
      );
    } catch (err) {
      this.logger.error(`Unread notification cron failed: ${err.message}`);
    }
  }

  private async processConversation(conv: any, now: Date): Promise<number> {
    const unreadCounts = conv.unread_counts instanceof Map
      ? Object.fromEntries(conv.unread_counts)
      : conv.unread_counts || {};

    const lastEmailMap = conv.last_unread_email_at instanceof Map
      ? Object.fromEntries(conv.last_unread_email_at)
      : conv.last_unread_email_at || {};

    let sentCount = 0;

    for (const participant of conv.participants) {
      const userId = participant.user?._id?.toString();
      if (!userId) continue;

      const unreadCount = unreadCounts[userId] || 0;
      if (unreadCount === 0) continue;

      // Load user's notification preferences
      const userPrefs = await this.getUserMessagingPrefs(userId);

      // Check if user has disabled message email notifications
      if (userPrefs.emailDisabled) {
        continue;
      }

      // Check quiet hours
      if (this.isInQuietHours(now, userPrefs.quietHours)) {
        continue;
      }

      // Check per-user unread threshold
      const lastMessageAt = conv.last_message?.sent_at;
      if (lastMessageAt) {
        const userThresholdMs = userPrefs.unreadThresholdMinutes * 60 * 1000;
        if (now.getTime() - new Date(lastMessageAt).getTime() < userThresholdMs) {
          continue;
        }
      }

      // Check per-user cooldown
      const userCooldownMs = userPrefs.cooldownHours * 60 * 60 * 1000;
      const lastEmailAt = lastEmailMap[userId];
      if (lastEmailAt) {
        const lastEmailDate = new Date(lastEmailAt);
        if (now.getTime() - lastEmailDate.getTime() < userCooldownMs) continue;
      }

      // Get user details — email is stored at profile.contact.email
      const user = participant.user as any;
      const userEmail = user?.profile?.contact?.email;
      if (!userEmail) {
        this.logger.warn(`Conv ${conv._id}: User ${userId} has no email at profile.contact.email, skipping.`);
        continue;
      }

      // Find the sender (the other participant)
      const sender = conv.participants.find(
        (p: any) => p.user?._id?.toString() !== userId,
      )?.user as any;
      if (!sender) continue;

      // Get the latest unread message for preview
      const latestMessage = await this.messageModel
        .findOne({
          conversation: conv._id,
          sender: { $ne: new Types.ObjectId(userId) },
          'status.read_at': null,
          is_deleted: false,
        })
        .sort({ created_at: -1 })
        .lean();

      if (!latestMessage) continue;

      // Build names
      const recipientName = [user.profile?.first_name, user.profile?.last_name]
        .filter(Boolean)
        .join(' ') || 'there';
      const senderName = [sender.profile?.first_name, sender.profile?.last_name]
        .filter(Boolean)
        .join(' ') || 'Someone';
      const senderRole = this.formatRole(sender.user_type);

      // Build conversation URL based on user type
      const conversationUrl = this.buildConversationUrl(user.user_type, conv._id);

      // Build and send email
      const emailBody = unreadMessageEmail({
        recipientName,
        senderName,
        senderRole,
        unreadCount,
        latestMessage: latestMessage.content || '',
        latestMessageType: latestMessage.type,
        conversationUrl,
      });

      try {
        await this.generalHelpers.sendEmail(
          userEmail,
          `${senderName} sent you ${unreadCount} ${unreadCount === 1 ? 'message' : 'messages'} on Rapid Capsule`,
          emailBody,
        );

        // Update cooldown timestamp
        await this.conversationModel.updateOne(
          { _id: conv._id },
          { $set: { [`last_unread_email_at.${userId}`]: now } },
        );

        sentCount++;
        this.logger.log(
          `Sent unread notification to ${userEmail} — ${unreadCount} messages from ${senderName} (${senderRole})`,
        );
      } catch (emailErr) {
        this.logger.error(`Failed to send unread email to ${userEmail}: ${emailErr.message}`);
      }
    }

    return sentCount;
  }

  /**
   * Load user's messaging notification preferences from UserSettings.
   */
  private async getUserMessagingPrefs(userId: string): Promise<{
    emailDisabled: boolean;
    unreadThresholdMinutes: number;
    cooldownHours: number;
    quietHours: { enabled: boolean; start: string; end: string; timezone: string } | null;
  }> {
    try {
      const settings = await this.userSettingsModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .lean();

      const defaults = (settings?.defaults || {}) as Record<string, any>;
      const notifPrefs = defaults.notification_preferences || {};

      const messagePrefs = notifPrefs.message_notifications || {};
      const timing = notifPrefs.messaging_timing || {};
      const quietHours = notifPrefs.quiet_hours || null;

      return {
        emailDisabled: messagePrefs.email === false,
        unreadThresholdMinutes: timing.unread_threshold_minutes || DEFAULT_UNREAD_THRESHOLD_MINUTES,
        cooldownHours: timing.cooldown_hours || DEFAULT_COOLDOWN_HOURS,
        quietHours: quietHours?.enabled ? quietHours : null,
      };
    } catch (err) {
      this.logger.warn(`Failed to load prefs for user ${userId}: ${err.message}`);
      return {
        emailDisabled: false,
        unreadThresholdMinutes: DEFAULT_UNREAD_THRESHOLD_MINUTES,
        cooldownHours: DEFAULT_COOLDOWN_HOURS,
        quietHours: null,
      };
    }
  }

  /**
   * Check if the current time falls within the user's quiet hours.
   */
  private isInQuietHours(
    now: Date,
    quietHours: { enabled: boolean; start: string; end: string; timezone: string } | null,
  ): boolean {
    if (!quietHours || !quietHours.enabled) return false;

    try {
      const { start, end, timezone } = quietHours;
      if (!start || !end) return false;

      // Get current time in user's timezone
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone || 'UTC' }));
      const currentMinutes = userTime.getHours() * 60 + userTime.getMinutes();

      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes <= endMinutes) {
        // Same day range (e.g., 09:00 - 17:00)
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      } else {
        // Overnight range (e.g., 22:00 - 07:00)
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }
    } catch {
      return false;
    }
  }

  private buildConversationUrl(userType: string, conversationId: any): string {
    switch (userType) {
      case 'Specialist':
        return `https://rapidcapsule.com/app/specialist/messages/${conversationId}`;
      case 'Admin':
        return `https://admin.rapidcapsule.com/admin/messaging?conv=${conversationId}`;
      default:
        return `https://rapidcapsule.com/app/patient/messages/${conversationId}`;
    }
  }

  private formatRole(userType: string): string {
    switch (userType) {
      case 'Patient': return 'Patient';
      case 'Specialist': return 'Specialist';
      case 'Admin': return 'Admin';
      default: return userType || 'User';
    }
  }
}
