import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  PharmacyOrder,
  PharmacyOrderDocument,
} from '../../pharmacy/entities/pharmacy-order.entity';
import { GupshupService } from '../../../common/external/gupshup/gupshup.service';

/**
 * Paystack webhook event types
 */
enum PaystackEvent {
  CHARGE_SUCCESS = 'charge.success',
  CHARGE_FAILED = 'charge.failed',
  TRANSFER_SUCCESS = 'transfer.success',
  TRANSFER_FAILED = 'transfer.failed',
}

/**
 * Controller for handling Paystack payment webhooks for WhatsApp orders
 */
@Controller('webhooks/paystack')
export class WhatsAppPaymentWebhookController {
  private readonly logger = new Logger(WhatsAppPaymentWebhookController.name);

  constructor(
    @InjectModel(PharmacyOrder.name)
    private readonly orderModel: Model<PharmacyOrderDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly gupshupService: GupshupService,
  ) {}

  /**
   * Handle Paystack webhook events
   * Paystack sends POST requests to this endpoint when payment events occur
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handlePaystackWebhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    // Verify webhook signature
    if (!this.verifySignature(payload, signature)) {
      this.logger.warn('Invalid Paystack webhook signature');
      return { status: 'error', message: 'Invalid signature' };
    }

    const { event, data } = payload;
    this.logger.log(`Paystack webhook received: ${event}`);

    try {
      switch (event) {
        case PaystackEvent.CHARGE_SUCCESS:
          await this.handleChargeSuccess(data);
          break;
        case PaystackEvent.CHARGE_FAILED:
          await this.handleChargeFailed(data);
          break;
        default:
          this.logger.log(`Unhandled Paystack event: ${event}`);
      }

      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Error processing Paystack webhook: ${error.message}`, error.stack);
      // Return success to prevent Paystack from retrying
      return { status: 'success' };
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  private verifySignature(payload: any, signature: string): boolean {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey || !signature) {
      this.logger.warn('Missing Paystack secret key or signature');
      return false;
    }

    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  /**
   * Handle successful charge/payment
   */
  private async handleChargeSuccess(data: any) {
    const { reference, metadata, amount, customer } = data;

    this.logger.log(`Payment successful: ${reference}`);

    // Check if this is a WhatsApp order payment
    if (!metadata?.source || metadata.source !== 'WHATSAPP') {
      this.logger.log(`Payment ${reference} is not from WhatsApp, skipping`);
      return;
    }

    const orderId = metadata?.order_id;
    const orderNumber = metadata?.order_number;

    if (!orderId) {
      this.logger.warn(`No order_id in payment metadata: ${reference}`);
      return;
    }

    // Find and update the order
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
    });

    if (!order) {
      this.logger.warn(`Order not found for payment: ${orderId}`);
      return;
    }

    // Check if already processed
    if (order.payment_status === 'PAID') {
      this.logger.log(`Order ${orderNumber} already marked as paid`);
      return;
    }

    // Calculate card amount paid (Paystack returns amount in kobo)
    const cardAmountPaid = amount / 100;

    // Update order status
    await this.orderModel.updateOne(
      { _id: order._id },
      {
        status: 'CONFIRMED',
        payment_status: 'PAID',
        paid_at: new Date(),
        card_amount_paid: cardAmountPaid,
        payment_reference: reference,
        updated_at: new Date(),
        $push: {
          status_history: {
            status: 'CONFIRMED',
            timestamp: new Date(),
            notes: `Payment confirmed via Paystack (ref: ${reference})`,
          },
        },
      },
    );

    this.logger.log(`Order ${orderNumber} updated to CONFIRMED/PAID`);

    // Send WhatsApp confirmation to patient
    await this.sendOrderConfirmation(order, cardAmountPaid);
  }

  /**
   * Handle failed charge/payment
   */
  private async handleChargeFailed(data: any) {
    const { reference, metadata, gateway_response } = data;

    this.logger.log(`Payment failed: ${reference} - ${gateway_response}`);

    // Check if this is a WhatsApp order payment
    if (!metadata?.source || metadata.source !== 'WHATSAPP') {
      return;
    }

    const orderId = metadata?.order_id;
    const orderNumber = metadata?.order_number;

    if (!orderId) {
      return;
    }

    // Find the order
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
    });

    if (!order) {
      return;
    }

    // Update order with failure info
    await this.orderModel.updateOne(
      { _id: order._id },
      {
        payment_status: 'FAILED',
        updated_at: new Date(),
        $push: {
          status_history: {
            status: 'PAYMENT_FAILED',
            timestamp: new Date(),
            notes: `Payment failed: ${gateway_response}`,
          },
        },
      },
    );

    this.logger.log(`Order ${orderNumber} marked as payment failed`);

    // Send WhatsApp notification about payment failure
    await this.sendPaymentFailureNotification(order, gateway_response);
  }

  /**
   * Send WhatsApp order confirmation after successful payment
   */
  private async sendOrderConfirmation(order: any, amountPaid: number) {
    try {
      const whatsappNumber = order.whatsapp_number;
      if (!whatsappNumber) {
        this.logger.warn(`No WhatsApp number for order ${order.order_number}`);
        return;
      }

      // Get patient name
      const patientName = await this.getPatientName(order.patient);

      // Estimate delivery time
      const estimatedDelivery = order.delivery_method === 'PICKUP'
        ? '30-60 minutes'
        : '2-4 hours';

      const message = `Payment received! Thank you ${patientName}.\n\n` +
        `*Order Confirmed*\n` +
        `Order Number: ${order.order_number}\n` +
        `Amount Paid: ₦${amountPaid.toLocaleString()}\n` +
        `Delivery Method: ${order.delivery_method === 'PICKUP' ? 'Pickup' : 'Delivery'}\n` +
        `Estimated ${order.delivery_method === 'PICKUP' ? 'Ready' : 'Delivery'}: ${estimatedDelivery}\n\n` +
        `You'll receive updates as your order progresses.\n\n` +
        `Send "menu" for options or "track" to check your order status.`;

      await this.gupshupService.sendTextMessage(whatsappNumber, message);
      this.logger.log(`Order confirmation sent to ${whatsappNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation: ${error.message}`);
    }
  }

  /**
   * Send WhatsApp notification about payment failure
   */
  private async sendPaymentFailureNotification(order: any, reason: string) {
    try {
      const whatsappNumber = order.whatsapp_number;
      if (!whatsappNumber) {
        return;
      }

      const message = `Sorry, your payment for order ${order.order_number} was not successful.\n\n` +
        `Reason: ${reason}\n\n` +
        `Please try again or contact support if you need help.\n\n` +
        `Reply "order" to try placing a new order or "menu" for options.`;

      await this.gupshupService.sendTextMessage(whatsappNumber, message);
      this.logger.log(`Payment failure notification sent to ${whatsappNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send payment failure notification: ${error.message}`);
    }
  }

  /**
   * Get patient name from database
   */
  private async getPatientName(patientId: Types.ObjectId): Promise<string> {
    try {
      const UsersCollection = this.connection.collection('users');
      const user = await UsersCollection.findOne(
        { _id: patientId },
        { projection: { 'profile.first_name': 1, 'profile.last_name': 1 } },
      );
      if (user?.profile) {
        return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || 'there';
      }
      return 'there';
    } catch {
      return 'there';
    }
  }
}
