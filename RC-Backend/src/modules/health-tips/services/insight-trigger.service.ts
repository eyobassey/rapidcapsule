import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { HealthTipsScheduledService } from '../health-tips-scheduled.service';
import { HealthTipsDataService } from './data.service';
import { HealthTipsRuleEngine } from './rule-engine.service';
import { NotificationOrchestratorService } from '../../notifications/services/notification-orchestrator.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
} from '../../notifications/types/notification.types';

@Injectable()
export class HealthInsightsTriggerService {
  private readonly logger = new Logger(HealthInsightsTriggerService.name);

  constructor(
    private readonly scheduledService: HealthTipsScheduledService,
    private readonly dataService: HealthTipsDataService,
    private readonly ruleEngine: HealthTipsRuleEngine,
    private readonly orchestratorService: NotificationOrchestratorService,
  ) {}

  /**
   * Triggered when vitals are logged — evaluate vitals-related rules
   */
  async onVitalsLogged(userId: string, vitalTypes: string[]): Promise<void> {
    try {
      this.logger.log(`Vitals logged for user ${userId}: ${vitalTypes.join(', ')}`);
      const userObjectId = new Types.ObjectId(userId);
      const ctx = await this.dataService.buildHealthContext(userObjectId);
      const result = await this.ruleEngine.evaluateRules(ctx, userObjectId);

      if (result.tipsCreated > 0) {
        this.logger.log(`Created ${result.tipsCreated} tips from vitals event for user ${userId}`);
        await this.notifyForNewInsights(userId, result.triggeredRuleIds);
      }
    } catch (error) {
      this.logger.error(`Error processing vitals event for ${userId}: ${error.message}`);
    }
  }

  /**
   * Triggered when a health checkup completes — generate checkup-specific insights
   */
  async onHealthCheckupCompleted(userId: string, checkupId: string): Promise<void> {
    try {
      this.logger.log(`Health checkup completed for user ${userId}: ${checkupId}`);
      const userObjectId = new Types.ObjectId(userId);

      // Generate rule-based tips first
      const ruleResult = await this.scheduledService.generateRuleBasedTips(userObjectId);

      // Also generate AI insights for deeper analysis
      const aiResult = await this.scheduledService.generateAIInsights(userObjectId);

      const totalTips = ruleResult.tips_generated + (aiResult.tips_generated || 0);
      if (totalTips > 0) {
        this.logger.log(`Generated ${totalTips} insights after health checkup for user ${userId}`);
        await this.sendInsightNotification(userId, 'New Health Insights Available',
          'Based on your recent health checkup, we have new personalized recommendations for you.',
          totalTips > 2 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing checkup event for ${userId}: ${error.message}`);
    }
  }

  /**
   * Triggered when a new prescription is created
   */
  async onPrescriptionCreated(userId: string, prescriptionId: string): Promise<void> {
    try {
      this.logger.log(`Prescription created for user ${userId}: ${prescriptionId}`);
      const userObjectId = new Types.ObjectId(userId);

      // Re-evaluate rules with updated prescription context
      const ctx = await this.dataService.buildHealthContext(userObjectId);
      const result = await this.ruleEngine.evaluateRules(ctx, userObjectId);

      if (result.tipsCreated > 0) {
        await this.sendInsightNotification(userId, 'Medication Insight',
          'We have health recommendations related to your new prescription.',
          NotificationPriority.MEDIUM,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing prescription event for ${userId}: ${error.message}`);
    }
  }

  /**
   * Triggered when wearable data syncs
   */
  async onWearableSyncCompleted(userId: string, provider: string, dataTypes: string[]): Promise<void> {
    try {
      this.logger.log(`Wearable sync completed for user ${userId} from ${provider}`);
      const userObjectId = new Types.ObjectId(userId);
      const ctx = await this.dataService.buildHealthContext(userObjectId);
      const result = await this.ruleEngine.evaluateRules(ctx, userObjectId);

      if (result.tipsCreated > 0) {
        this.logger.log(`Created ${result.tipsCreated} tips from wearable sync for user ${userId}`);
        await this.notifyForNewInsights(userId, result.triggeredRuleIds);
      }
    } catch (error) {
      this.logger.error(`Error processing wearable sync event for ${userId}: ${error.message}`);
    }
  }

  /**
   * Triggered when an appointment is completed
   */
  async onAppointmentCompleted(userId: string, appointmentId: string): Promise<void> {
    try {
      this.logger.log(`Appointment completed for user ${userId}: ${appointmentId}`);
      const userObjectId = new Types.ObjectId(userId);

      // Generate comprehensive insights post-appointment
      await this.scheduledService.generateRuleBasedTips(userObjectId);
      const aiResult = await this.scheduledService.generateAIInsights(userObjectId);

      if (aiResult.tips_generated > 0) {
        await this.sendInsightNotification(userId, 'Post-Appointment Insights',
          'Based on your recent appointment, here are personalized health recommendations.',
          NotificationPriority.MEDIUM,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing appointment event for ${userId}: ${error.message}`);
    }
  }

  /**
   * Triggered when a recovery check-in is logged
   */
  async onRecoveryCheckIn(userId: string): Promise<void> {
    try {
      this.logger.log(`Recovery check-in for user ${userId}`);
      const userObjectId = new Types.ObjectId(userId);
      const ctx = await this.dataService.buildHealthContext(userObjectId);
      const result = await this.ruleEngine.evaluateRules(ctx, userObjectId);

      if (result.tipsCreated > 0) {
        await this.notifyForNewInsights(userId, result.triggeredRuleIds);
      }
    } catch (error) {
      this.logger.error(`Error processing recovery check-in for ${userId}: ${error.message}`);
    }
  }

  /**
   * Check triggered rules and send appropriate notifications
   */
  private async notifyForNewInsights(userId: string, triggeredRuleIds: string[]): Promise<void> {
    // Only notify for high/urgent priority rules
    const hasUrgent = triggeredRuleIds.some(id =>
      id.includes('CRITICAL') || id.includes('URGENT') || id.includes('HIGH_BP') || id.includes('HIGH_SUGAR')
    );

    if (hasUrgent) {
      await this.sendInsightNotification(userId, 'Urgent Health Alert',
        'We detected something that needs your attention. Check your health insights.',
        NotificationPriority.URGENT,
      );
    } else if (triggeredRuleIds.length > 0) {
      await this.sendInsightNotification(userId, 'New Health Insight',
        'You have new personalized health recommendations based on your latest data.',
        NotificationPriority.MEDIUM,
      );
    }
  }

  /**
   * Send a notification for a new health insight
   */
  private async sendInsightNotification(
    userId: string,
    title: string,
    message: string,
    priority: NotificationPriority,
  ): Promise<void> {
    try {
      const isUrgent = priority === NotificationPriority.URGENT || priority === NotificationPriority.HIGH;
      const channels = isUrgent
        ? [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL]
        : [NotificationChannel.IN_APP];

      await this.orchestratorService.sendNotification({
        userId,
        user_type: UserTypeNotification.PATIENT,
        type: isUrgent ? NotificationType.HEALTH_INSIGHT_URGENT : NotificationType.HEALTH_INSIGHT_NEW,
        title,
        message,
        priority,
        channels,
        action_url: '/app/patient/health-tips',
      });
    } catch (error) {
      this.logger.error(`Failed to send insight notification to ${userId}: ${error.message}`);
    }
  }
}
