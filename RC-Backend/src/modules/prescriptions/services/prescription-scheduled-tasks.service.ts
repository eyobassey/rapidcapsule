import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment';
import {
  SpecialistPrescription,
  SpecialistPrescriptionDocument,
  SpecialistPrescriptionStatus,
  PrescriptionPaymentStatus,
} from '../entities/specialist-prescription.entity';
import { RefillService } from './refill.service';
import { GeneralHelpers } from '../../../common/helpers/general.helpers';
import {
  prescriptionExpiredEmail,
  prescriptionRatingRequestEmail,
  prescriptionRatingReminderEmail,
} from '../../../core/emails/mails/prescriptionEmails';

@Injectable()
export class PrescriptionScheduledTasksService {
  private readonly logger = new Logger(PrescriptionScheduledTasksService.name);

  constructor(
    @InjectModel(SpecialistPrescription.name)
    private prescriptionModel: Model<SpecialistPrescriptionDocument>,
    private readonly refillService: RefillService,
    private readonly generalHelpers: GeneralHelpers,
  ) {}

  /**
   * Run every day at 9:00 AM to send refill reminders
   * Checks for prescriptions where the patient will need a refill within 3 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleRefillReminders(): Promise<void> {
    this.logger.log('Starting daily refill reminder job...');

    try {
      // Get prescriptions due for reminder (3 days before refill date)
      const prescriptions = await this.refillService.getPrescriptionsDueForReminder(3);

      this.logger.log(`Found ${prescriptions.length} prescriptions due for refill reminders`);

      for (const prescription of prescriptions) {
        try {
          await this.refillService.sendRefillReminder(prescription._id.toString());
        } catch (error) {
          this.logger.error(
            `Failed to send refill reminder for ${prescription.prescription_number}: ${error.message}`
          );
        }
      }

      this.logger.log('Refill reminder job completed');
    } catch (error) {
      this.logger.error(`Refill reminder job failed: ${error.message}`);
    }
  }

  /**
   * Run every day at 10:00 AM to send prescription expiring notifications
   * Notifies patients when their prescription will expire within 14 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handlePrescriptionExpiryNotifications(): Promise<void> {
    this.logger.log('Starting daily prescription expiry notification job...');

    try {
      // Get prescriptions expiring within 14 days
      const prescriptions = await this.refillService.getPrescriptionsExpiringSoon(14);

      // Filter to only send once per prescription (at 14, 7, 3, and 1 day intervals)
      const now = new Date();
      const notificationIntervals = [14, 7, 3, 1];

      this.logger.log(`Found ${prescriptions.length} prescriptions expiring soon`);

      for (const prescription of prescriptions) {
        if (!prescription.prescription_valid_until) continue;

        const daysUntilExpiry = Math.ceil(
          (prescription.prescription_valid_until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only send notification at specific intervals
        if (notificationIntervals.includes(daysUntilExpiry)) {
          try {
            await this.refillService.sendPrescriptionExpiringNotification(
              prescription._id.toString()
            );
          } catch (error) {
            this.logger.error(
              `Failed to send expiry notification for ${prescription.prescription_number}: ${error.message}`
            );
          }
        }
      }

      this.logger.log('Prescription expiry notification job completed');
    } catch (error) {
      this.logger.error(`Prescription expiry notification job failed: ${error.message}`);
    }
  }

  /**
   * Run every hour to handle expired prescriptions waiting for payment
   * Expires prescriptions that have passed their expires_at time
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredPrescriptions(): Promise<void> {
    this.logger.log('Starting hourly expired prescriptions job...');

    try {
      const now = new Date();

      // Find prescriptions that are pending payment and have expired
      const expiredPrescriptions = await this.prescriptionModel.find({
        status: {
          $in: [
            SpecialistPrescriptionStatus.PENDING_PAYMENT,
            SpecialistPrescriptionStatus.PENDING_ACCEPTANCE,
            SpecialistPrescriptionStatus.ACCEPTED,
          ],
        },
        expires_at: { $lt: now },
      }).populate('patient_id', 'email profile')
        .populate('specialist_id', 'email profile');

      this.logger.log(`Found ${expiredPrescriptions.length} expired prescriptions`);

      for (const prescription of expiredPrescriptions) {
        try {
          // Update status to expired
          prescription.status = SpecialistPrescriptionStatus.EXPIRED;
          prescription.status_history.push({
            status: SpecialistPrescriptionStatus.EXPIRED,
            changed_at: now,
            changed_by: prescription.specialist_id._id,
            notes: 'Automatically expired due to non-payment within time limit',
          });

          await prescription.save();

          // Release any stock reservations
          await this.releaseStockReservations(prescription);

          // Send expiration notification to patient
          await this.sendExpirationNotification(prescription);

          this.logger.log(`Prescription ${prescription.prescription_number} marked as expired`);
        } catch (error) {
          this.logger.error(
            `Failed to expire prescription ${prescription.prescription_number}: ${error.message}`
          );
        }
      }

      this.logger.log('Expired prescriptions job completed');
    } catch (error) {
      this.logger.error(`Expired prescriptions job failed: ${error.message}`);
    }
  }

  /**
   * Run every day at 8:00 AM to notify patients when their refill becomes available
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleRefillAvailableNotifications(): Promise<void> {
    this.logger.log('Starting daily refill available notification job...');

    try {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      // Find prescriptions where refill just became available (next_refill_date was yesterday or today)
      const prescriptions = await this.prescriptionModel.find({
        is_refillable: true,
        status: SpecialistPrescriptionStatus.DELIVERED,
        next_refill_date: { $lte: now, $gte: yesterday },
        $expr: { $lt: ['$refills_used', '$refill_count'] },
      });

      this.logger.log(`Found ${prescriptions.length} prescriptions now eligible for refill`);

      for (const prescription of prescriptions) {
        try {
          await this.refillService.sendRefillAvailableNotification(prescription._id.toString());
        } catch (error) {
          this.logger.error(
            `Failed to send refill available notification for ${prescription.prescription_number}: ${error.message}`
          );
        }
      }

      this.logger.log('Refill available notification job completed');
    } catch (error) {
      this.logger.error(`Refill available notification job failed: ${error.message}`);
    }
  }

  /**
   * Run every 30 minutes to send payment reminders for prescriptions expiring soon
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handlePaymentReminders(): Promise<void> {
    this.logger.log('Starting payment reminder job...');

    try {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Find prescriptions expiring in the next 2 hours that haven't had a recent reminder
      const prescriptions = await this.prescriptionModel.find({
        status: {
          $in: [
            SpecialistPrescriptionStatus.PENDING_PAYMENT,
            SpecialistPrescriptionStatus.ACCEPTED,
          ],
        },
        payment_status: PrescriptionPaymentStatus.PENDING,
        expires_at: { $gt: now, $lte: twoHoursFromNow },
        $or: [
          { last_reminder_sent_at: { $exists: false } },
          { last_reminder_sent_at: { $lt: oneHourAgo } },
        ],
        payment_reminders_sent: { $lt: 3 }, // Max 3 reminders
      }).populate('patient_id', 'email profile');

      this.logger.log(`Found ${prescriptions.length} prescriptions needing payment reminders`);

      for (const prescription of prescriptions) {
        try {
          await this.sendPaymentReminder(prescription);
        } catch (error) {
          this.logger.error(
            `Failed to send payment reminder for ${prescription.prescription_number}: ${error.message}`
          );
        }
      }

      this.logger.log('Payment reminder job completed');
    } catch (error) {
      this.logger.error(`Payment reminder job failed: ${error.message}`);
    }
  }

  /**
   * Release stock reservations for a prescription
   */
  private async releaseStockReservations(prescription: SpecialistPrescriptionDocument): Promise<void> {
    // This would integrate with the pharmacy stock module
    // For now, just update the items to mark reservations as released
    for (const item of prescription.items) {
      if (item.stock_reserved) {
        item.stock_reserved = false;
        item.stock_reservation_id = undefined;
        item.stock_reservation_expires = undefined;
      }
    }
    await prescription.save();

    this.logger.log(`Released stock reservations for prescription ${prescription.prescription_number}`);
  }

  /**
   * Send expiration notification to patient
   */
  private async sendExpirationNotification(prescription: SpecialistPrescriptionDocument): Promise<void> {
    const patient = prescription.patient_id as any;
    if (!patient?.email) return;

    const patientName = `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient';
    const primaryItem = prescription.items[0];

    const emailHtml = prescriptionExpiredEmail({
      patientName,
      prescriptionNumber: prescription.prescription_number,
      drugName: primaryItem?.drug_name || 'Your medication',
      genericName: primaryItem?.generic_name,
      totalAmount: prescription.total_amount,
      currency: prescription.currency || 'NGN',
      expiryReason: 'Payment not received within the required time frame',
      contactUrl: 'https://rapidcapsule.com/support',
    });

    await this.generalHelpers.generateEmailAndSend({
      email: patient.email,
      subject: `Prescription Expired: ${prescription.prescription_number}`,
      emailBody: emailHtml,
    });

    this.logger.log(`Expiration notification sent for ${prescription.prescription_number}`);
  }

  /**
   * Send payment reminder to patient
   */
  private async sendPaymentReminder(prescription: SpecialistPrescriptionDocument): Promise<void> {
    const patient = prescription.patient_id as any;
    if (!patient?.email) return;

    const patientName = `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient';
    const primaryItem = prescription.items[0];

    const timeRemaining = prescription.expires_at
      ? Math.max(0, Math.ceil((prescription.expires_at.getTime() - Date.now()) / (1000 * 60)))
      : 0;

    const hoursRemaining = Math.floor(timeRemaining / 60);
    const minutesRemaining = timeRemaining % 60;
    const timeString = hoursRemaining > 0
      ? `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} and ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`
      : `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4F46E5, #06B6D4); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .urgent-banner { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
          .urgent-banner h3 { color: #d97706; margin: 0 0 10px 0; }
          .prescription-info { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .btn { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">⏰ Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${patientName},</p>

            <div class="urgent-banner">
              <h3>⚠️ Time Sensitive</h3>
              <p style="margin: 0;">Your prescription payment is due within <strong>${timeString}</strong>.</p>
            </div>

            <div class="prescription-info">
              <h3 style="margin-top: 0;">Prescription Details</h3>
              <p><strong>Prescription #:</strong> ${prescription.prescription_number}</p>
              <p><strong>Medication:</strong> ${primaryItem?.drug_name || 'Prescribed medication'}</p>
              <p><strong>Amount Due:</strong> ${prescription.currency || 'NGN'} ${prescription.total_amount.toLocaleString()}</p>
            </div>

            <p>If payment is not received before the deadline, your prescription will expire and stock reservations will be released.</p>

            <p style="text-align: center; margin: 30px 0;">
              <a href="https://rapidcapsule.com/app/patient/prescriptions/${prescription._id}" class="btn">
                Complete Payment Now
              </a>
            </p>

            <p>If you've already made the payment, please disregard this reminder.</p>
          </div>
          <div class="footer">
            <p>This is an automated reminder from Rapid Capsules.</p>
            <p>If you need assistance, contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.generalHelpers.generateEmailAndSend({
      email: patient.email,
      subject: `⏰ Payment Reminder: ${prescription.prescription_number} - ${timeString} remaining`,
      emailBody: emailHtml,
    });

    // Update reminder tracking
    prescription.last_reminder_sent_at = new Date();
    prescription.payment_reminders_sent = (prescription.payment_reminders_sent || 0) + 1;
    await prescription.save();

    this.logger.log(`Payment reminder sent for ${prescription.prescription_number}`);
  }

  /**
   * Run every hour to send rating reminder emails for prescriptions
   * Sends reminders for prescriptions delivered 24+ hours ago that haven't been rated
   * Only sends one reminder per prescription
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handlePrescriptionRatingReminders(): Promise<void> {
    this.logger.log('Starting hourly prescription rating reminder job...');

    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Find prescriptions that:
      // - Are delivered
      // - Were delivered between 24 and 48 hours ago
      // - Have no rating
      // - Have not received a reminder email yet
      const prescriptionsNeedingReminder = await this.prescriptionModel.find({
        status: SpecialistPrescriptionStatus.DELIVERED,
        delivered_at: {
          $gte: fortyEightHoursAgo,
          $lte: twentyFourHoursAgo,
        },
        rating: { $exists: false },
        rating_reminder_sent_at: { $exists: false },
      })
        .populate('patient_id', 'email profile')
        .populate('specialist_id', 'email profile')
        .limit(50); // Process max 50 at a time

      this.logger.log(`Found ${prescriptionsNeedingReminder.length} prescriptions needing rating reminders`);

      for (const prescription of prescriptionsNeedingReminder) {
        try {
          await this.sendPrescriptionRatingReminderEmail(prescription);
        } catch (error) {
          this.logger.error(
            `Failed to send rating reminder for prescription ${prescription.prescription_number}: ${error.message}`
          );
        }
      }

      this.logger.log('Prescription rating reminder job completed');
    } catch (error) {
      this.logger.error(`Prescription rating reminder job failed: ${error.message}`);
    }
  }

  /**
   * Send a rating reminder email for a prescription
   */
  private async sendPrescriptionRatingReminderEmail(
    prescription: SpecialistPrescriptionDocument
  ): Promise<void> {
    const patient = prescription.patient_id as any;
    const specialist = prescription.specialist_id as any;

    if (!patient?.email) {
      this.logger.warn(
        `Cannot send rating reminder for prescription ${prescription.prescription_number}: Patient email not found`
      );
      return;
    }

    const patientName = `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Valued Customer';
    const specialistName = `Dr. ${specialist?.profile?.first_name || ''} ${specialist?.profile?.last_name || ''}`.trim() || 'Your Specialist';
    const deliveryDate = moment(prescription.delivered_at).format('MMMM D, YYYY');

    // Prepare items list
    const items = prescription.items.map(item => ({
      drug_name: item.drug_name,
      quantity: item.quantity,
    }));

    // Generate rating URL
    const ratingUrl = `https://rapidcapsule.com/app/patient/prescriptions/details/${prescription._id}`;

    const emailBody = prescriptionRatingReminderEmail({
      patientName,
      prescriptionNumber: prescription.prescription_number,
      specialistName,
      items,
      deliveryDate,
      ratingUrl,
    });

    await this.generalHelpers.generateEmailAndSend({
      email: patient.email,
      subject: `Reminder: Share Your Feedback - Prescription #${prescription.prescription_number}`,
      emailBody,
    });

    // Mark reminder as sent
    prescription.rating_reminder_sent_at = new Date();
    await prescription.save();

    this.logger.log(
      `Prescription rating reminder email sent for ${prescription.prescription_number} to ${patient.email}`
    );
  }
}
