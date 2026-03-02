import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CrisisEvent,
  CrisisEventDocument,
  CrisisType,
  CrisisStatus,
  CrisisSeverity,
} from '../entities/crisis-event.entity';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
} from '../entities/recovery-profile.entity';
import { User, UserDocument } from '../../users/entities/user.entity';
import { NotificationOrchestratorService } from '../../notifications/services/notification-orchestrator.service';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  UserTypeNotification,
} from '../../notifications/types/notification.types';

@Injectable()
export class CrisisInterventionService {
  private readonly logger = new Logger(CrisisInterventionService.name);

  constructor(
    @InjectModel(CrisisEvent.name)
    private readonly crisisModel: Model<CrisisEventDocument>,
    @InjectModel(RecoveryProfile.name)
    private readonly profileModel: Model<RecoveryProfileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationOrchestrator: NotificationOrchestratorService,
  ) {}

  /**
   * Initiate a new crisis event.
   */
  async initiateCrisis(
    userId: string,
    crisisType: CrisisType,
    triggerSource: string,
    detectionData?: Record<string, any>,
    severity?: CrisisSeverity,
  ) {
    // Auto-determine severity if not provided
    const resolvedSeverity =
      severity || this.determineSeverity(crisisType, detectionData);

    const crisis = await this.crisisModel.create({
      user: new Types.ObjectId(userId),
      crisis_type: crisisType,
      status: CrisisStatus.ACTIVE,
      severity: resolvedSeverity,
      trigger_source: triggerSource,
      detection_data: detectionData || {},
      response_timeline: [
        {
          action: 'Crisis initiated',
          actor: triggerSource,
          timestamp: new Date(),
          details: `${crisisType} detected via ${triggerSource}`,
        },
      ],
      notifications_sent: [],
    });

    this.logger.warn(
      `CRISIS INITIATED: ${crisisType} for user ${userId} — severity: ${resolvedSeverity}`,
    );

    // Send alerts based on severity
    await this.sendCrisisAlerts(userId, crisis);

    return crisis.toObject();
  }

  /**
   * Respond to a crisis event (specialist acknowledges).
   */
  async respondToCrisis(eventId: string, specialistId: string) {
    const crisis = await this.crisisModel.findById(eventId);
    if (!crisis) throw new NotFoundException('Crisis event not found');

    if (crisis.status !== CrisisStatus.ACTIVE) {
      return crisis.toObject(); // Already being handled
    }

    crisis.status = CrisisStatus.RESPONDING;
    crisis.response_timeline.push({
      action: 'Specialist responding',
      actor: specialistId,
      timestamp: new Date(),
      details: 'Specialist has acknowledged the crisis and is responding',
    });

    await crisis.save();

    this.logger.log(
      `Crisis ${eventId} — specialist ${specialistId} responding`,
    );

    return crisis.toObject();
  }

  /**
   * Resolve a crisis event.
   */
  async resolveCrisis(
    eventId: string,
    specialistId: string,
    notes: string,
    followUpPlan?: string,
  ) {
    const crisis = await this.crisisModel.findById(eventId);
    if (!crisis) throw new NotFoundException('Crisis event not found');

    crisis.status = CrisisStatus.RESOLVED;
    crisis.resolved_by = new Types.ObjectId(specialistId);
    crisis.resolved_at = new Date();
    crisis.resolution_notes = notes;
    crisis.follow_up_plan = followUpPlan || '';
    crisis.response_timeline.push({
      action: 'Crisis resolved',
      actor: specialistId,
      timestamp: new Date(),
      details: notes,
    });

    await crisis.save();

    // Notify patient that crisis has been resolved
    try {
      await this.notificationOrchestrator.sendNotification({
        userId: crisis.user.toString(),
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.RECOVERY_CHECK_IN_REMINDER as any,
        title: 'Crisis Support Update',
        message:
          'Your crisis event has been resolved. A follow-up plan has been created for you.',
        data: { crisis_id: eventId },
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      });
    } catch (err) {
      this.logger.warn(`Failed to send crisis resolution notification: ${err.message}`);
    }

    this.logger.log(
      `Crisis ${eventId} RESOLVED by specialist ${specialistId}`,
    );

    return crisis.toObject();
  }

  /**
   * Escalate a crisis to all care team + admin + emergency contacts.
   */
  async escalateCrisis(eventId: string, escalatedBy?: string) {
    const crisis = await this.crisisModel.findById(eventId);
    if (!crisis) throw new NotFoundException('Crisis event not found');

    crisis.status = CrisisStatus.ESCALATED_EXTERNAL;
    crisis.response_timeline.push({
      action: 'Crisis ESCALATED',
      actor: escalatedBy || 'system',
      timestamp: new Date(),
      details:
        'Crisis escalated to all care team members, admin, and emergency contacts',
    });

    await crisis.save();

    // Get patient's full care team
    const profile = await this.profileModel
      .findOne({
        user: crisis.user,
        deleted_at: { $exists: false },
      })
      .lean();

    if (profile) {
      const careTeam = (profile.care_team || []).filter(
        (m: any) => m.is_active,
      );
      for (const member of careTeam) {
        try {
          await this.notificationOrchestrator.sendNotification({
            userId: member.user.toString(),
            user_type: UserTypeNotification.SPECIALIST,
            type: NotificationType.RECOVERY_MILESTONE_ACHIEVED as any,
            title: 'ESCALATED CRISIS — Immediate Attention Required',
            message: `A crisis event for your patient has been escalated. Type: ${crisis.crisis_type}, Severity: ${crisis.severity}.`,
            data: {
              crisis_id: eventId,
              patient_id: crisis.user.toString(),
              crisis_type: crisis.crisis_type,
              severity: crisis.severity,
            },
            priority: NotificationPriority.URGENT,
            channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
          });
        } catch (err) {
          this.logger.warn(
            `Failed to notify care team member ${member.user}: ${err.message}`,
          );
        }
      }
    }

    // Get emergency contacts from user profile
    const user = await this.userModel
      .findById(crisis.user)
      .select('profile.emergency_contacts recovery_emergency_config')
      .lean();

    this.logger.error(
      `CRISIS ESCALATED: ${eventId} — all care team and emergency contacts notified`,
    );

    return {
      crisis: crisis.toObject(),
      care_team_notified: (profile?.care_team || []).filter(
        (m: any) => m.is_active,
      ).length,
      emergency_contacts: (user as any)?.profile?.emergency_contacts?.length || 0,
    };
  }

  /**
   * Get active crises for a specialist's patients.
   */
  async getActiveCrises(specialistId: string) {
    // Find patients where this specialist is on the care team
    const profiles = await this.profileModel
      .find({
        'care_team.user': new Types.ObjectId(specialistId),
        'care_team.is_active': true,
        deleted_at: { $exists: false },
      })
      .select('user')
      .lean();

    const patientIds = profiles.map((p) => p.user);

    const crises = await this.crisisModel
      .find({
        user: { $in: patientIds },
        status: { $in: [CrisisStatus.ACTIVE, CrisisStatus.RESPONDING, CrisisStatus.ESCALATED_EXTERNAL] },
      })
      .populate('user', 'profile.first_name profile.last_name profile.phone_number')
      .populate('resolved_by', 'profile.first_name profile.last_name')
      .sort({ created_at: -1 })
      .lean();

    return crises;
  }

  /**
   * Get crisis history for a patient.
   */
  async getCrisisHistory(
    userId: string,
    page = 1,
    limit = 10,
  ) {
    const query = {
      user: new Types.ObjectId(userId),
    };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.crisisModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('resolved_by', 'profile.first_name profile.last_name')
        .lean(),
      this.crisisModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Trigger an emergency alert (patient-initiated panic button).
   */
  async triggerEmergencyAlert(userId: string, reason?: string) {
    const crisis = await this.initiateCrisis(
      userId,
      CrisisType.PATIENT_INITIATED,
      'panic_button',
      { reason: reason || 'Patient pressed emergency button' },
      CrisisSeverity.HIGH,
    );

    // Auto-escalate patient-initiated crises
    await this.escalateCrisis(
      (crisis as any)._id.toString(),
      'system',
    );

    return crisis;
  }

  /**
   * Get crisis event by ID.
   */
  async getCrisisById(eventId: string) {
    const crisis = await this.crisisModel
      .findById(eventId)
      .populate('user', 'profile.first_name profile.last_name profile.phone_number')
      .populate('resolved_by', 'profile.first_name profile.last_name')
      .populate('follow_up_appointment')
      .lean();

    if (!crisis) throw new NotFoundException('Crisis event not found');
    return crisis;
  }

  /**
   * Determine crisis severity based on type and detection data.
   */
  private determineSeverity(
    crisisType: CrisisType,
    detectionData?: Record<string, any>,
  ): CrisisSeverity {
    // Life-threatening types
    if (
      [
        CrisisType.OVERDOSE_CONFIRMED,
        CrisisType.OVERDOSE_SUSPECTED,
        CrisisType.SUICIDAL_IDEATION,
      ].includes(crisisType)
    ) {
      return CrisisSeverity.LIFE_THREATENING;
    }

    // High severity
    if (
      [
        CrisisType.SEVERE_WITHDRAWAL,
        CrisisType.SELF_HARM,
        CrisisType.PSYCHOTIC_EPISODE,
        CrisisType.DOMESTIC_VIOLENCE,
      ].includes(crisisType)
    ) {
      return CrisisSeverity.HIGH;
    }

    // Wearable alerts depend on the specific vital sign
    if (crisisType === CrisisType.WEARABLE_ALERT) {
      const vitalType = detectionData?.vital_type;
      if (vitalType === 'spo2' || vitalType === 'respiratory_rate') {
        return CrisisSeverity.LIFE_THREATENING;
      }
      return CrisisSeverity.HIGH;
    }

    // Default
    return CrisisSeverity.MEDIUM;
  }

  /**
   * Send crisis alerts to care team and emergency contacts.
   */
  private async sendCrisisAlerts(userId: string, crisis: CrisisEventDocument) {
    const profile = await this.profileModel
      .findOne({
        user: new Types.ObjectId(userId),
        deleted_at: { $exists: false },
      })
      .lean();

    if (!profile) return;

    // Notify active care team members
    const activeTeam = (profile.care_team || []).filter(
      (m: any) => m.is_active,
    );

    for (const member of activeTeam) {
      try {
        await this.notificationOrchestrator.sendNotification({
          userId: member.user.toString(),
          user_type: UserTypeNotification.SPECIALIST,
          type: NotificationType.RECOVERY_MAT_COMPLIANCE_WARNING as any,
          title: `Crisis Alert: ${crisis.crisis_type.replace(/_/g, ' ')}`,
          message: `A ${crisis.severity} crisis has been detected for your patient. Immediate attention may be required.`,
          data: {
            crisis_id: crisis._id?.toString(),
            patient_id: userId,
            crisis_type: crisis.crisis_type,
            severity: crisis.severity,
          },
          priority: crisis.severity === CrisisSeverity.LIFE_THREATENING
            ? NotificationPriority.URGENT
            : NotificationPriority.HIGH,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        });

        crisis.notifications_sent.push({
          recipient: member.user,
          channel: 'push',
          sent_at: new Date(),
        });
      } catch (err) {
        this.logger.warn(
          `Failed to notify care team member ${member.user}: ${err.message}`,
        );
      }
    }

    await crisis.save();
  }
}
