import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import * as moment from 'moment';
import {
  PharmacyOrder,
  PharmacyOrderDocument,
  PharmacyOrderStatus,
} from '../entities/pharmacy-order.entity';
import { Pharmacy, PharmacyDocument } from '../entities/pharmacy.entity';
import { GeneralHelpers } from '../../../common/helpers/general.helpers';
import { pharmacyRatingReminderEmail } from '../../../core/emails/mails/prescriptionEmails';
import { OpenFDAService } from './openfda.service';

@Injectable()
export class PharmacyScheduledTasksService {
  private readonly logger = new Logger(PharmacyScheduledTasksService.name);

  constructor(
    @InjectModel(PharmacyOrder.name)
    private orderModel: Model<PharmacyOrderDocument>,
    @InjectModel(Pharmacy.name)
    private pharmacyModel: Model<PharmacyDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly generalHelpers: GeneralHelpers,
    private readonly openFDAService: OpenFDAService,
  ) {}

  /**
   * Run every hour to send rating reminder emails
   * Sends reminders for orders delivered 24+ hours ago that haven't been rated
   * Only sends one reminder per order
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleRatingReminders(): Promise<void> {
    this.logger.log('Starting hourly rating reminder job...');

    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Find orders that:
      // - Are delivered or completed
      // - Were delivered between 24 and 48 hours ago
      // - Have no rating
      // - Have not received a reminder email yet
      const ordersNeedingReminder = await this.orderModel.find({
        status: {
          $in: [PharmacyOrderStatus.DELIVERED, PharmacyOrderStatus.COMPLETED],
        },
        actual_delivery_date: {
          $gte: fortyEightHoursAgo,
          $lte: twentyFourHoursAgo,
        },
        rating: { $exists: false },
        rating_reminder_sent_at: { $exists: false },
      }).limit(50); // Process max 50 at a time to avoid overloading

      this.logger.log(`Found ${ordersNeedingReminder.length} orders needing rating reminders`);

      for (const order of ordersNeedingReminder) {
        try {
          await this.sendRatingReminderEmail(order);
        } catch (error) {
          this.logger.error(
            `Failed to send rating reminder for order ${order.order_number}: ${error.message}`
          );
        }
      }

      this.logger.log('Rating reminder job completed');
    } catch (error) {
      this.logger.error(`Rating reminder job failed: ${error.message}`);
    }
  }

  /**
   * Send a rating reminder email to the patient
   */
  private async sendRatingReminderEmail(order: PharmacyOrderDocument): Promise<void> {
    // Get patient info
    const UsersCollection = this.connection.collection('users');
    const patientId = (order.patient as any)?._id || order.patient;
    const patient = await UsersCollection.findOne(
      { _id: new Types.ObjectId(patientId) },
      { projection: { email: 1, 'profile.first_name': 1, 'profile.last_name': 1, 'profile.contact.email': 1 } },
    );

    const patientEmail = patient?.email || patient?.profile?.contact?.email;
    if (!patientEmail) {
      this.logger.warn(`Cannot send rating reminder for order ${order.order_number}: Patient email not found`);
      return;
    }

    // Get pharmacy info
    const pharmacyId = (order.pharmacy as any)?._id || order.pharmacy;
    const pharmacy = await this.pharmacyModel.findById(pharmacyId).select('name').exec();

    const patientName = `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Valued Customer';
    const pharmacyName = (pharmacy as any)?.name || 'Rapid Capsule Pharmacy';
    const deliveryDate = moment(order.actual_delivery_date).format('MMMM D, YYYY');

    // Prepare items list
    const items = order.items.map(item => ({
      drug_name: item.drug_name,
      quantity: item.quantity,
    }));

    // Generate rating URL
    const ratingUrl = `https://rapidcapsule.com/app/patient/orders/${order._id}/rate`;

    const emailBody = pharmacyRatingReminderEmail({
      patientName,
      orderNumber: order.order_number,
      pharmacyName,
      items,
      deliveryDate,
      ratingUrl,
    });

    await this.generalHelpers.generateEmailAndSend({
      email: patientEmail,
      subject: `Reminder: Share Your Feedback - Order #${order.order_number}`,
      emailBody,
    });

    // Mark reminder as sent
    await this.orderModel.updateOne(
      { _id: order._id },
      { rating_reminder_sent_at: new Date() },
    );

    this.logger.log(`Rating reminder email sent for order ${order.order_number} to ${patientEmail}`);
  }

  /**
   * Run daily at 3 AM to sync FDA drug safety information
   * Syncs drugs that are due for update (30 days since last sync)
   * Processes in batches to respect FDA API rate limits
   */
  @Cron('0 3 * * *') // 3:00 AM daily
  async handleFDASafetySync(): Promise<void> {
    this.logger.log('Starting daily FDA safety data sync job...');

    try {
      // Process up to 50 drugs per day to respect rate limits
      const result = await this.openFDAService.syncDueForUpdate(50);

      this.logger.log(
        `FDA sync completed: ${result.processed} processed, ${result.success} success, ${result.failed} failed`,
      );

      // Log sync stats
      const stats = await this.openFDAService.getSyncStats();
      this.logger.log(
        `FDA sync stats: ${stats.total} total, ${stats.synced} synced, ${stats.pending} pending, ${stats.failed} failed, ${stats.noData} no data`,
      );
    } catch (error) {
      this.logger.error(`FDA safety sync job failed: ${error.message}`);
    }
  }
}
