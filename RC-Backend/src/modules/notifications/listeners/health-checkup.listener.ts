import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationOrchestratorService } from '../services/notification-orchestrator.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
  HealthCheckupEventPayload,
} from '../types/notification.types';

@Injectable()
export class HealthCheckupListener {
  private readonly logger = new Logger(HealthCheckupListener.name);

  constructor(
    private orchestratorService: NotificationOrchestratorService,
  ) {}

  @OnEvent('health_checkup.completed')
  async handleHealthCheckupCompleted(payload: HealthCheckupEventPayload): Promise<void> {
    this.logger.log(`Handling health_checkup.completed event for ${payload.checkupId}`);

    try {
      const priority = this.getTriagePriority(payload.triageLevel);
      const triageMessage = this.getTriageMessage(payload.triageLevel);

      await this.orchestratorService.sendNotification({
        userId: payload.userId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.HEALTH_CHECKUP_COMPLETE,
        title: 'Health Checkup Complete',
        message: `Your health checkup has been completed. ${triageMessage}`,
        data: {
          checkupId: payload.checkupId,
          triageLevel: payload.triageLevel,
          conditions: payload.conditions,
        },
        action_url: `/app/patient/health-checkup/${payload.checkupId}`,
        priority,
        channels: priority === NotificationPriority.URGENT
          ? [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.WHATSAPP]
          : [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle health_checkup.completed: ${error.message}`);
    }
  }

  @OnEvent('health_score.updated')
  async handleHealthScoreUpdated(payload: {
    userId: string;
    score: number;
    previousScore?: number;
    status: string;
  }): Promise<void> {
    this.logger.log(`Handling health_score.updated event for user ${payload.userId}`);

    try {
      const scoreChange = payload.previousScore !== undefined
        ? payload.score - payload.previousScore
        : 0;

      const changeMessage = scoreChange > 0
        ? `Your score improved by ${scoreChange} points!`
        : scoreChange < 0
        ? `Your score decreased by ${Math.abs(scoreChange)} points.`
        : '';

      await this.orchestratorService.sendNotification({
        userId: payload.userId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.HEALTH_SCORE_UPDATED,
        title: 'Health Score Updated',
        message: `Your health score is now ${payload.score}/100 (${payload.status}). ${changeMessage}`,
        data: {
          score: payload.score,
          previousScore: payload.previousScore,
          status: payload.status,
        },
        action_url: '/app/patient/health-score',
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.IN_APP],
      });
    } catch (error) {
      this.logger.error(`Failed to handle health_score.updated: ${error.message}`);
    }
  }

  @OnEvent('vitals.alert')
  async handleVitalsAlert(payload: {
    userId: string;
    vitalType: string;
    value: number;
    unit: string;
    alertType: 'high' | 'low' | 'critical';
    normalRange?: { min: number; max: number };
  }): Promise<void> {
    this.logger.log(`Handling vitals.alert event for user ${payload.userId}`);

    try {
      const alertText = payload.alertType === 'critical' ? 'CRITICAL' : payload.alertType.toUpperCase();
      const priority = payload.alertType === 'critical'
        ? NotificationPriority.URGENT
        : NotificationPriority.HIGH;

      await this.orchestratorService.sendNotification({
        userId: payload.userId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.VITALS_ALERT,
        title: `${alertText}: ${this.formatVitalName(payload.vitalType)}`,
        message: `Your ${this.formatVitalName(payload.vitalType)} reading of ${payload.value} ${payload.unit} is ${payload.alertType}. ${payload.alertType === 'critical' ? 'Please seek medical attention immediately.' : 'Consider consulting your doctor.'}`,
        data: {
          vitalType: payload.vitalType,
          value: payload.value,
          unit: payload.unit,
          alertType: payload.alertType,
          normalRange: payload.normalRange,
        },
        action_url: '/app/patient/vitals',
        priority,
        channels: priority === NotificationPriority.URGENT
          ? [NotificationChannel.IN_APP, NotificationChannel.SMS, NotificationChannel.WHATSAPP, NotificationChannel.PUSH]
          : [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      });
    } catch (error) {
      this.logger.error(`Failed to handle vitals.alert: ${error.message}`);
    }
  }

  @OnEvent('vitals.reminder')
  async handleVitalsReminder(payload: {
    userId: string;
    vitalTypes: string[];
    lastRecorded?: Date;
  }): Promise<void> {
    this.logger.log(`Handling vitals.reminder event for user ${payload.userId}`);

    try {
      const vitalsList = payload.vitalTypes.map(v => this.formatVitalName(v)).join(', ');
      const daysAgo = payload.lastRecorded
        ? Math.floor((Date.now() - new Date(payload.lastRecorded).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const message = daysAgo
        ? `It's been ${daysAgo} days since you last recorded your vitals. Please update your ${vitalsList}.`
        : `Remember to record your ${vitalsList} for better health tracking.`;

      await this.orchestratorService.sendNotification({
        userId: payload.userId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.VITALS_REMINDER,
        title: 'Vitals Reminder',
        message,
        data: {
          vitalTypes: payload.vitalTypes,
          lastRecorded: payload.lastRecorded,
        },
        action_url: '/app/patient/vitals/add',
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      });
    } catch (error) {
      this.logger.error(`Failed to handle vitals.reminder: ${error.message}`);
    }
  }

  private getTriagePriority(triageLevel?: string): NotificationPriority {
    switch (triageLevel?.toLowerCase()) {
      case 'emergency':
      case 'emergency_ambulance':
        return NotificationPriority.URGENT;
      case 'consultation_24':
        return NotificationPriority.HIGH;
      case 'consultation':
        return NotificationPriority.MEDIUM;
      default:
        return NotificationPriority.LOW;
    }
  }

  private getTriageMessage(triageLevel?: string): string {
    switch (triageLevel?.toLowerCase()) {
      case 'emergency':
      case 'emergency_ambulance':
        return 'Based on your symptoms, please seek immediate medical attention.';
      case 'consultation_24':
        return 'We recommend seeing a doctor within 24 hours.';
      case 'consultation':
        return 'We recommend scheduling a consultation with a specialist.';
      case 'self_care':
        return 'Your symptoms suggest self-care may be sufficient, but monitor for changes.';
      default:
        return 'Review your results for personalized recommendations.';
    }
  }

  private formatVitalName(vitalType: string): string {
    const names: Record<string, string> = {
      blood_pressure: 'Blood Pressure',
      heart_rate: 'Heart Rate',
      pulse_rate: 'Pulse Rate',
      temperature: 'Temperature',
      blood_sugar: 'Blood Sugar',
      oxygen_saturation: 'Oxygen Saturation',
      respiratory_rate: 'Respiratory Rate',
      weight: 'Weight',
      bmi: 'BMI',
    };

    return names[vitalType] || vitalType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
