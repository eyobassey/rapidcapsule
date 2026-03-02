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
import {
  Appointment,
  AppointmentDocument,
} from '../../appointments/entities/appointment.entity';
import {
  Prescription,
  PrescriptionDocument,
} from '../../prescriptions/entities/prescription.entity';
import { Drug, DrugDocument } from '../../pharmacy/entities/drug.entity';

/**
 * Weekly scheduler that checks MAT (Medication-Assisted Treatment) adherence
 * for enrolled patients and flags non-compliant cases.
 */
@Injectable()
export class MATComplianceScheduler {
  private readonly logger = new Logger(MATComplianceScheduler.name);

  constructor(
    @InjectModel(RecoveryProfile.name)
    private recoveryProfileModel: Model<RecoveryProfileDocument>,
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Prescription.name)
    private prescriptionModel: Model<PrescriptionDocument>,
    @InjectModel(Drug.name)
    private drugModel: Model<DrugDocument>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Runs weekly on Monday at 6:00 AM UTC.
   * Checks MAT prescription adherence for active recovery patients:
   * 1. Medication logging compliance (≥50% of days logged medications_taken)
   * 2. Appointment attendance in last 30 days
   * 3. Active MAT prescription status
   */
  @Cron('0 0 6 * * 1')
  async handleWeeklyMATComplianceCheck(): Promise<void> {
    this.logger.log('Starting weekly MAT compliance check...');
    const startTime = Date.now();
    let checked = 0;
    let flagged = 0;
    let errors = 0;

    try {
      // Find MAT drug IDs
      const matDrugs = await this.drugModel
        .find({ is_mat_medication: true })
        .select('_id')
        .lean();

      if (!matDrugs.length) {
        this.logger.log('No MAT medications found in drug database — skipping');
        return;
      }

      const matDrugIds = matDrugs.map((d) => d._id);

      // Find patients with active MAT prescriptions
      const matPrescriptions = await this.prescriptionModel
        .find({
          'medications.drug': { $in: matDrugIds },
          status: { $in: ['active', 'filled', 'dispensed'] },
        })
        .select('patient specialist medications')
        .lean();

      if (!matPrescriptions.length) {
        this.logger.log('No active MAT prescriptions found');
        return;
      }

      // Group by patient
      const patientPrescriptionMap = new Map<string, any[]>();
      for (const rx of matPrescriptions) {
        const patientId = rx.patient?.toString();
        if (!patientId) continue;
        if (!patientPrescriptionMap.has(patientId)) {
          patientPrescriptionMap.set(patientId, []);
        }
        patientPrescriptionMap.get(patientId)!.push(rx);
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      for (const [patientId, prescriptions] of patientPrescriptionMap) {
        try {
          checked++;
          const warnings: string[] = [];

          // Check 1: Medication logging compliance (last 7 days)
          const recentLogs = await this.sobrietyLogModel
            .find({
              user: patientId,
              log_date: { $gte: sevenDaysAgo },
            })
            .select('medications_taken log_date')
            .lean();

          const loggedDays = recentLogs.length;
          const medsTakenDays = recentLogs.filter((l) => l.medications_taken).length;

          if (loggedDays < 4) {
            warnings.push(
              `Only ${loggedDays}/7 daily logs completed this week`,
            );
          }

          if (loggedDays > 0 && medsTakenDays / loggedDays < 0.5) {
            warnings.push(
              `Low medication adherence: ${medsTakenDays}/${loggedDays} days reported taking medications`,
            );
          }

          // Check 2: Appointment attendance in last 30 days
          const appointments = await this.appointmentModel
            .find({
              patient: patientId,
              start_time: { $gte: thirtyDaysAgo },
              status: { $in: ['COMPLETED', 'MISSED', 'CANCELLED'] },
            })
            .select('status start_time')
            .lean();

          const missed = appointments.filter(
            (a) => a.status === 'MISSED' || a.status === 'CANCELLED',
          ).length;
          const total = appointments.length;

          if (total > 0 && missed / total > 0.3) {
            warnings.push(
              `${missed}/${total} appointments missed/cancelled in last 30 days`,
            );
          }

          if (total === 0) {
            warnings.push('No appointments in last 30 days');
          }

          // If warnings exist, flag and notify
          if (warnings.length > 0) {
            flagged++;

            // Notify the prescribing specialist(s)
            const specialistIds = [
              ...new Set(prescriptions.map((rx) => rx.specialist?.toString()).filter(Boolean)),
            ];

            for (const specialistId of specialistIds) {
              await this.notificationsService.createFromPayload({
                userId: specialistId,
                user_type: UserTypeNotification.SPECIALIST,
                type: NotificationType.RECOVERY_MAT_COMPLIANCE_WARNING,
                title: 'MAT Compliance Alert',
                message: `A patient on MAT has compliance concerns: ${warnings.join('; ')}`,
                data: {
                  action: 'view_patient_recovery',
                  patientId,
                  warnings,
                },
                priority: NotificationPriority.HIGH,
                channels: [
                  NotificationChannel.IN_APP,
                  NotificationChannel.PUSH,
                ],
              });
            }
          }
        } catch (err) {
          errors++;
          this.logger.warn(
            `MAT compliance check failed for patient ${patientId}: ${err.message}`,
          );
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(
        `MAT compliance check complete: ${checked} patients checked, ${flagged} flagged, ${errors} errors (${duration}s)`,
      );
    } catch (error) {
      this.logger.error(
        `MAT compliance check failed: ${error.message}`,
        error.stack,
      );
    }
  }
}
