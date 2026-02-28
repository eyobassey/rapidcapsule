import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RiskScoringService } from '../services/risk-scoring.service';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
  RecoveryStatus,
} from '../entities/recovery-profile.entity';
import { NotificationOrchestratorService } from '../../notifications/services/notification-orchestrator.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  UserTypeNotification,
} from '../../notifications/types/notification.types';
import { RiskCalculationResult } from '../dto/risk-score.dto';
import { ALERT_COOLDOWN_MS } from '../constants/risk-thresholds';

/** In-memory cooldown tracker: userId:level → lastAlertTime */
const alertCooldowns = new Map<string, number>();

@Injectable()
export class RiskEventListener {
  private readonly logger = new Logger(RiskEventListener.name);

  constructor(
    private riskScoringService: RiskScoringService,
    private notificationOrchestrator: NotificationOrchestratorService,
    private notificationsGateway: NotificationsGateway,
    @InjectModel(RecoveryProfile.name)
    private profileModel: Model<RecoveryProfileDocument>,
  ) {}

  @OnEvent('recovery.checkin_logged')
  async handleCheckinLogged(payload: { userId: string }) {
    await this.recalculateAndAlert(payload.userId, 'checkin_logged');
  }

  @OnEvent('recovery.relapse_reported')
  async handleRelapseReported(payload: { userId: string }) {
    await this.recalculateAndAlert(payload.userId, 'relapse_reported');
  }

  @OnEvent('recovery.screening_completed')
  async handleScreeningCompleted(payload: {
    userId: string;
    screeningId?: string;
  }) {
    await this.recalculateAndAlert(payload.userId, 'screening_completed');
  }

  @OnEvent('recovery.crisis_event')
  async handleCrisisEvent(payload: {
    userId: string;
    eventId?: string;
    severity?: string;
  }) {
    await this.recalculateAndAlert(payload.userId, 'crisis_event');
  }

  @OnEvent('recovery.coping_exercise_completed')
  async handleExerciseCompleted(payload: { userId: string }) {
    await this.recalculateAndAlert(payload.userId, 'coping_exercise_completed');
  }

  // ─── Core Logic ─────────────────────────────────────────────────

  private async recalculateAndAlert(
    userId: string,
    triggerEvent: string,
  ): Promise<void> {
    try {
      const result =
        await this.riskScoringService.calculateAndPersistRisk(userId);

      // Always push real-time update to patient via WebSocket
      this.notificationsGateway.sendToUser(userId, 'risk_score_updated', {
        score: result.score,
        level: result.level,
        previous_score: result.previous_score,
        previous_level: result.previous_level,
        direction: result.direction,
        trigger: triggerEvent,
      });

      // Check threshold crossing
      if (result.threshold_crossed) {
        await this.handleThresholdCrossing(userId, result, triggerEvent);
      }

      this.logger.debug(
        `Risk recalculated for user ${userId}: ${result.score} (${result.level}) ` +
          `[trigger: ${triggerEvent}, crossed: ${result.threshold_crossed}]`,
      );
    } catch (error) {
      this.logger.error(
        `Risk recalculation failed for user ${userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleThresholdCrossing(
    userId: string,
    result: RiskCalculationResult,
    trigger: string,
  ): Promise<void> {
    const levelOrder = ['low', 'moderate', 'high', 'critical'];
    const newIdx = levelOrder.indexOf(result.level);
    const prevIdx = levelOrder.indexOf(result.previous_level);

    if (newIdx > prevIdx) {
      // Risk escalated
      switch (result.level) {
        case 'moderate':
          await this.sendModerateAlerts(userId, result);
          break;
        case 'high':
          await this.sendHighAlerts(userId, result, trigger);
          break;
        case 'critical':
          await this.sendCriticalAlerts(userId, result, trigger);
          break;
      }
    } else if (newIdx < prevIdx) {
      // Risk improved
      await this.sendImprovedAlerts(userId, result);
    }
  }

  // ─── Alert Cascade ──────────────────────────────────────────────

  private async sendModerateAlerts(
    userId: string,
    result: RiskCalculationResult,
  ): Promise<void> {
    if (this.isOnCooldown(userId, 'moderate')) return;

    await this.notificationOrchestrator.sendNotification({
      userId,
      user_type: UserTypeNotification.PATIENT,
      type: NotificationType.RECOVERY_RISK_MODERATE,
      title: 'Recovery Check-in',
      message:
        'Your recovery risk has increased slightly. Consider doing a coping exercise or chatting with Eka.',
      data: { score: result.score, level: result.level },
      priority: NotificationPriority.MEDIUM,
      channels: [NotificationChannel.IN_APP],
    });

    this.setCooldown(userId, 'moderate');
  }

  private async sendHighAlerts(
    userId: string,
    result: RiskCalculationResult,
    trigger: string,
  ): Promise<void> {
    if (this.isOnCooldown(userId, 'high')) return;

    // Patient notification
    await this.notificationOrchestrator.sendNotification({
      userId,
      user_type: UserTypeNotification.PATIENT,
      type: NotificationType.RECOVERY_RISK_HIGH,
      title: 'Important Recovery Alert',
      message:
        'Your risk level has risen to HIGH. Your care team has been notified. Please reach out if you need support.',
      data: { score: result.score, level: result.level, trigger },
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    });

    // Notify care team members
    await this.notifyCareTeam(userId, result, trigger, [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ]);

    this.setCooldown(userId, 'high');
  }

  private async sendCriticalAlerts(
    userId: string,
    result: RiskCalculationResult,
    trigger: string,
  ): Promise<void> {
    if (this.isOnCooldown(userId, 'critical')) return;

    // Patient notification
    await this.notificationOrchestrator.sendNotification({
      userId,
      user_type: UserTypeNotification.PATIENT,
      type: NotificationType.RECOVERY_RISK_CRITICAL,
      title: 'Urgent Recovery Alert',
      message:
        'Your risk level is CRITICAL. Please reach out to your care team, a crisis line, or someone you trust right now.',
      data: { score: result.score, level: result.level, trigger },
      priority: NotificationPriority.URGENT,
      channels: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.SMS,
      ],
    });

    // Notify care team with all channels
    await this.notifyCareTeam(userId, result, trigger, [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
    ]);

    // Notify emergency contacts (if consent given)
    await this.notifyEmergencyContacts(userId, result);

    this.setCooldown(userId, 'critical');
  }

  private async sendImprovedAlerts(
    userId: string,
    result: RiskCalculationResult,
  ): Promise<void> {
    if (this.isOnCooldown(userId, 'improved')) return;

    // Patient celebration
    await this.notificationOrchestrator.sendNotification({
      userId,
      user_type: UserTypeNotification.PATIENT,
      type: NotificationType.RECOVERY_RISK_IMPROVED,
      title: 'Great Progress!',
      message: `Your risk level has improved to ${result.level.toUpperCase()}. Keep up the good work!`,
      data: {
        score: result.score,
        level: result.level,
        previous_level: result.previous_level,
      },
      priority: NotificationPriority.LOW,
      channels: [NotificationChannel.IN_APP],
    });

    // Notify care team
    const profile = await this.getProfile(userId);
    if (profile?.care_team?.length) {
      for (const member of profile.care_team) {
        if (!member.is_active || !member.user) continue;
        await this.notificationOrchestrator.sendNotification({
          userId: member.user.toString(),
          user_type: UserTypeNotification.SPECIALIST,
          type: NotificationType.RECOVERY_RISK_IMPROVED,
          title: 'Patient Risk Improved',
          message: `A patient's relapse risk has improved to ${result.level.toUpperCase()}.`,
          data: { patientId: userId, score: result.score, level: result.level },
          priority: NotificationPriority.LOW,
          channels: [NotificationChannel.IN_APP],
        });
      }
    }

    this.setCooldown(userId, 'improved');
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private async notifyCareTeam(
    userId: string,
    result: RiskCalculationResult,
    trigger: string,
    channels: NotificationChannel[],
  ): Promise<void> {
    const profile = await this.getProfile(userId);
    if (!profile?.care_team?.length) return;

    // Get patient name for the notification
    const user = await this.profileModel.db
      .collection('users')
      .findOne(
        { _id: new Types.ObjectId(userId) },
        { projection: { 'profile.first_name': 1, 'profile.last_name': 1 } },
      );
    const patientName = user?.profile
      ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim()
      : 'A patient';

    for (const member of profile.care_team) {
      if (!member.is_active || !member.user) continue;

      await this.notificationOrchestrator.sendNotification({
        userId: member.user.toString(),
        user_type: UserTypeNotification.SPECIALIST,
        type:
          result.level === 'critical'
            ? NotificationType.RECOVERY_RISK_CRITICAL
            : NotificationType.RECOVERY_RISK_HIGH,
        title: `Patient Risk Alert: ${result.level.toUpperCase()}`,
        message: `${patientName}'s relapse risk has escalated to ${result.level.toUpperCase()} (score: ${result.score}/100). Trigger: ${trigger}.`,
        data: {
          patientId: userId,
          score: result.score,
          level: result.level,
          trigger,
        },
        priority:
          result.level === 'critical'
            ? NotificationPriority.URGENT
            : NotificationPriority.HIGH,
        channels,
      });
    }
  }

  private async notifyEmergencyContacts(
    userId: string,
    result: RiskCalculationResult,
  ): Promise<void> {
    const profile = await this.getProfile(userId);
    if (!profile) return;

    // Check emergency contact consent
    const hasConsent = profile.consent?.emergency_contact_consent?.given;
    if (!hasConsent) return;

    // Get emergency contacts from user profile
    const user = await this.profileModel.db
      .collection('users')
      .findOne(
        { _id: new Types.ObjectId(userId) },
        {
          projection: {
            'profile.emergency_contacts': 1,
            'profile.first_name': 1,
          },
        },
      );

    const contacts = user?.profile?.emergency_contacts;
    if (!Array.isArray(contacts) || contacts.length === 0) return;

    this.logger.warn(
      `CRITICAL RISK: Notifying ${contacts.length} emergency contact(s) for user ${userId}`,
    );

    // Emergency contacts don't have user accounts, so we log the intent.
    // In production, this would trigger SMS/WhatsApp via Twilio to their phone numbers.
    // For now, log it and rely on the care team notifications above.
    for (const contact of contacts) {
      this.logger.warn(
        `Emergency contact: ${contact.name} (${contact.relationship}) - ${contact.phone_number}`,
      );
    }
  }

  private async getProfile(userId: string): Promise<any | null> {
    return this.profileModel
      .findOne({
        user: new Types.ObjectId(userId),
        status: { $ne: RecoveryStatus.ARCHIVED },
        deleted_at: { $exists: false },
      })
      .lean();
  }

  private isOnCooldown(userId: string, level: string): boolean {
    const key = `${userId}:${level}`;
    const lastAlert = alertCooldowns.get(key);
    if (!lastAlert) return false;
    return Date.now() - lastAlert < ALERT_COOLDOWN_MS;
  }

  private setCooldown(userId: string, level: string): void {
    alertCooldowns.set(`${userId}:${level}`, Date.now());
  }
}
