import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { WhatsAppIdentity, WhatsAppIdentityDocument } from '../entities/whatsapp-identity.entity';
import { WhatsAppTwilioService } from './whatsapp-twilio.service';
import { WhatsAppAuditService } from './whatsapp-audit.service';
import { MESSAGES } from '../constants/messages.constant';

/**
 * Notification types for WhatsApp messages
 */
export enum NotificationType {
  // Prescription notifications
  PRESCRIPTION_RECEIVED = 'PRESCRIPTION_RECEIVED',
  PRESCRIPTION_VERIFIED = 'PRESCRIPTION_VERIFIED',
  PRESCRIPTION_FAILED = 'PRESCRIPTION_FAILED',
  PRESCRIPTION_NEEDS_REVIEW = 'PRESCRIPTION_NEEDS_REVIEW',
  PRESCRIPTION_CLARIFICATION = 'PRESCRIPTION_CLARIFICATION',

  // Order notifications
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_PROCESSING = 'ORDER_PROCESSING',
  ORDER_READY_PICKUP = 'ORDER_READY_PICKUP',
  ORDER_OUT_FOR_DELIVERY = 'ORDER_OUT_FOR_DELIVERY',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',

  // Payment notifications
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',

  // Queue notifications
  PHARMACIST_ASSIGNED = 'PHARMACIST_ASSIGNED',
  PHARMACIST_MESSAGE = 'PHARMACIST_MESSAGE',

  // General notifications
  SESSION_TIMEOUT_WARNING = 'SESSION_TIMEOUT_WARNING',
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  PROMOTIONAL = 'PROMOTIONAL',
}

/**
 * Service for sending proactive WhatsApp notifications to users
 */
@Injectable()
export class WhatsAppNotificationService {
  private readonly logger = new Logger(WhatsAppNotificationService.name);

  constructor(
    @InjectModel(WhatsAppIdentity.name)
    private readonly identityModel: Model<WhatsAppIdentityDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly twilioService: WhatsAppTwilioService,
    private readonly auditService: WhatsAppAuditService,
  ) {}

  /**
   * Send a notification to a user by patient ID
   */
  async sendNotificationByPatientId(
    patientId: Types.ObjectId | string,
    notificationType: NotificationType,
    data: Record<string, any> = {},
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find WhatsApp identity for patient
      const identity = await this.identityModel.findOne({
        patient_id: new Types.ObjectId(patientId),
        is_verified: true,
        opted_out: { $ne: true },
      }).exec();

      if (!identity) {
        return {
          success: false,
          error: 'No verified WhatsApp number found for patient',
        };
      }

      return this.sendNotification(identity.whatsapp_number, notificationType, data);
    } catch (error) {
      this.logger.error(`Error sending notification to patient ${patientId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a notification to a WhatsApp number
   */
  async sendNotification(
    whatsappNumber: string,
    notificationType: NotificationType,
    data: Record<string, any> = {},
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if user has opted out
      const identity = await this.identityModel.findOne({
        whatsapp_number: whatsappNumber,
      }).exec();

      if (identity?.opted_out) {
        return { success: false, error: 'User has opted out of messages' };
      }

      // Build message based on notification type
      const message = this.buildNotificationMessage(notificationType, data);

      if (!message) {
        return { success: false, error: 'Unknown notification type' };
      }

      // Send via Twilio
      const result = await this.twilioService.sendTextMessage(whatsappNumber, message);

      // Log the notification
      await this.auditService.logOutboundMessage(
        {
          to: whatsappNumber,
          id: result?.sid || 'unknown',
          type: 'notification',
          body: message,
        },
        {
          patient_id: identity?.patient_id,
          current_flow: `NOTIFICATION_${notificationType}`,
        },
        0,
      );

      this.logger.log(`Notification ${notificationType} sent to ${whatsappNumber}`);

      return {
        success: true,
        messageId: result?.sid,
      };
    } catch (error) {
      this.logger.error(`Error sending notification to ${whatsappNumber}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build notification message based on type
   */
  private buildNotificationMessage(
    type: NotificationType,
    data: Record<string, any>,
  ): string | null {
    switch (type) {
      // Prescription notifications
      case NotificationType.PRESCRIPTION_RECEIVED:
        return MESSAGES.PRESCRIPTION_RECEIVED;

      case NotificationType.PRESCRIPTION_VERIFIED:
        return MESSAGES.PRESCRIPTION_VERIFIED(
          data.medications || [],
          data.total || '₦0',
        );

      case NotificationType.PRESCRIPTION_FAILED:
        return MESSAGES.PRESCRIPTION_FAILED(data.reason || 'Unable to process prescription');

      case NotificationType.PRESCRIPTION_NEEDS_REVIEW:
        return MESSAGES.PRESCRIPTION_NEEDS_REVIEW;

      case NotificationType.PRESCRIPTION_CLARIFICATION:
        return MESSAGES.PRESCRIPTION_CLARIFICATION(
          data.message || 'Please provide additional information',
          data.items || [],
        );

      // Order notifications
      case NotificationType.ORDER_CONFIRMED:
        return MESSAGES.ORDER_CREATED(
          data.orderNumber || 'N/A',
          data.estimatedDelivery || 'Soon',
        );

      case NotificationType.ORDER_PROCESSING:
        return `Your order ${data.orderNumber || ''} is being prepared.\n\nWe'll notify you when it's ready.\n\nSend "menu" for options.`;

      case NotificationType.ORDER_READY_PICKUP:
        return `🎉 Your order ${data.orderNumber || ''} is ready for pickup!\n\n*Pickup Code:* ${data.pickupCode || 'N/A'}\n*Location:* ${data.pharmacyName || 'Rapid Capsule Pharmacy'}\n${data.pharmacyAddress || ''}\n\nPlease pick up within 72 hours.`;

      case NotificationType.ORDER_OUT_FOR_DELIVERY:
        return `🚚 Your order ${data.orderNumber || ''} is out for delivery!\n\n*Tracking:* ${data.trackingNumber || 'N/A'}\n*Estimated arrival:* ${data.estimatedArrival || 'Today'}\n\nSend "menu" for options.`;

      case NotificationType.ORDER_DELIVERED:
        return `✅ Your order ${data.orderNumber || ''} has been delivered!\n\nThank you for choosing Rapid Capsule.\n\nRate your experience: ${data.ratingUrl || 'https://rapidcapsule.com/rate'}\n\nSend "menu" for options.`;

      case NotificationType.ORDER_CANCELLED:
        return `Your order ${data.orderNumber || ''} has been cancelled.\n\n${data.reason ? `Reason: ${data.reason}\n\n` : ''}${data.refundInfo ? `Refund: ${data.refundInfo}\n\n` : ''}Send "menu" for options.`;

      // Payment notifications
      case NotificationType.PAYMENT_RECEIVED:
        return `✅ Payment received for order ${data.orderNumber || ''}!\n\nAmount: ₦${(data.amount || 0).toLocaleString()}\nReference: ${data.reference || 'N/A'}\n\nYour order is being processed.\n\nSend "menu" for options.`;

      case NotificationType.PAYMENT_FAILED:
        return `❌ Payment failed for order ${data.orderNumber || ''}.\n\n${data.reason ? `Reason: ${data.reason}\n\n` : ''}Please try again: ${data.paymentUrl || ''}\n\nSend "menu" for options.`;

      case NotificationType.PAYMENT_REMINDER:
        return `⏰ Reminder: Your order ${data.orderNumber || ''} is awaiting payment.\n\nTotal: ₦${(data.amount || 0).toLocaleString()}\n\nPay now: ${data.paymentUrl || ''}\n\nThis order will be cancelled if not paid within ${data.expiresIn || '24 hours'}.`;

      // Queue notifications
      case NotificationType.PHARMACIST_ASSIGNED:
        return `A pharmacist is now available to assist you.\n\n*Pharmacist:* ${data.pharmacistName || 'Our Pharmacist'}\n\nYou can continue your conversation now.`;

      case NotificationType.PHARMACIST_MESSAGE:
        return `*${data.pharmacistName || 'Pharmacist'}:*\n${data.message || ''}\n\n---\nReply to continue the conversation.\nSend "menu" when done.`;

      // General notifications
      case NotificationType.SESSION_TIMEOUT_WARNING:
        return MESSAGES.SESSION_TIMEOUT_WARNING;

      case NotificationType.ACCOUNT_VERIFIED:
        return `✅ Your WhatsApp is now connected to your Rapid Capsule account!\n\n${MESSAGES.MENU(data.patientName)}`;

      case NotificationType.PROMOTIONAL:
        // Only send if user hasn't opted out of promotions
        return data.message || null;

      default:
        this.logger.warn(`Unknown notification type: ${type}`);
        return null;
    }
  }

  /**
   * Send prescription verification result notification
   */
  async notifyPrescriptionVerified(
    patientId: Types.ObjectId | string,
    prescriptionData: {
      medications: Array<{ name: string; dosage: string; quantity: string }>;
      total: string;
      prescriptionId: string;
    },
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendNotificationByPatientId(
      patientId,
      NotificationType.PRESCRIPTION_VERIFIED,
      prescriptionData,
    );
  }

  /**
   * Send order status update notification
   */
  async notifyOrderStatusUpdate(
    patientId: Types.ObjectId | string,
    orderData: {
      orderNumber: string;
      status: string;
      pickupCode?: string;
      trackingNumber?: string;
      estimatedArrival?: string;
      pharmacyName?: string;
      pharmacyAddress?: string;
    },
  ): Promise<{ success: boolean; error?: string }> {
    let notificationType: NotificationType;

    switch (orderData.status.toUpperCase()) {
      case 'CONFIRMED':
        notificationType = NotificationType.ORDER_CONFIRMED;
        break;
      case 'PROCESSING':
        notificationType = NotificationType.ORDER_PROCESSING;
        break;
      case 'READY_FOR_PICKUP':
        notificationType = NotificationType.ORDER_READY_PICKUP;
        break;
      case 'OUT_FOR_DELIVERY':
        notificationType = NotificationType.ORDER_OUT_FOR_DELIVERY;
        break;
      case 'DELIVERED':
      case 'COMPLETED':
        notificationType = NotificationType.ORDER_DELIVERED;
        break;
      case 'CANCELLED':
        notificationType = NotificationType.ORDER_CANCELLED;
        break;
      default:
        notificationType = NotificationType.ORDER_PROCESSING;
    }

    return this.sendNotificationByPatientId(patientId, notificationType, orderData);
  }

  /**
   * Send pharmacist message to patient
   */
  async sendPharmacistMessage(
    whatsappNumber: string,
    pharmacistName: string,
    message: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendNotification(
      whatsappNumber,
      NotificationType.PHARMACIST_MESSAGE,
      { pharmacistName, message },
    );
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(
    patientId: Types.ObjectId | string,
    orderData: {
      orderNumber: string;
      amount: number;
      paymentUrl: string;
      expiresIn: string;
    },
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendNotificationByPatientId(
      patientId,
      NotificationType.PAYMENT_REMINDER,
      orderData,
    );
  }

  /**
   * Bulk send notifications (e.g., for promotions)
   */
  async sendBulkNotification(
    patientIds: (Types.ObjectId | string)[],
    notificationType: NotificationType,
    data: Record<string, any> = {},
    options: {
      delayBetweenMs?: number;
      maxConcurrent?: number;
    } = {},
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    errors: Array<{ patientId: string; error: string }>;
  }> {
    const { delayBetweenMs = 100, maxConcurrent = 10 } = options;
    const results = {
      total: patientIds.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ patientId: string; error: string }>,
    };

    // Process in batches
    for (let i = 0; i < patientIds.length; i += maxConcurrent) {
      const batch = patientIds.slice(i, i + maxConcurrent);

      const batchResults = await Promise.allSettled(
        batch.map((patientId) =>
          this.sendNotificationByPatientId(patientId, notificationType, data)
        )
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const patientId = batch[j].toString();

        if (result.status === 'fulfilled' && result.value.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({
            patientId,
            error: result.status === 'rejected'
              ? result.reason?.message
              : result.value?.error || 'Unknown error',
          });
        }
      }

      // Delay between batches to respect rate limits
      if (i + maxConcurrent < patientIds.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
      }
    }

    this.logger.log(
      `Bulk notification complete: ${results.successful}/${results.total} successful`,
    );

    return results;
  }
}
