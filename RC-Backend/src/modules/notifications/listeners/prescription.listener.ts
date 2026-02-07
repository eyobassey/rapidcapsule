import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationOrchestratorService } from '../services/notification-orchestrator.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
  PrescriptionEventPayload,
} from '../types/notification.types';

@Injectable()
export class PrescriptionListener {
  private readonly logger = new Logger(PrescriptionListener.name);

  constructor(
    private orchestratorService: NotificationOrchestratorService,
  ) {}

  @OnEvent('prescription.created')
  async handlePrescriptionCreated(payload: PrescriptionEventPayload & { specialistName?: string }): Promise<void> {
    this.logger.log(`Handling prescription.created event for ${payload.prescriptionId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PRESCRIPTION_CREATED,
        title: 'New Prescription',
        message: `Dr. ${payload.specialistName || 'Your doctor'} has created a new prescription for you with ${payload.medications?.length || 0} medication(s).`,
        data: {
          prescriptionId: payload.prescriptionId,
          medications: payload.medications,
        },
        action_url: `/app/patient/prescriptions/${payload.prescriptionId}`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
      });
    } catch (error) {
      this.logger.error(`Failed to handle prescription.created: ${error.message}`);
    }
  }

  @OnEvent('prescription.ready')
  async handlePrescriptionReady(payload: PrescriptionEventPayload & { pharmacyName?: string }): Promise<void> {
    this.logger.log(`Handling prescription.ready event for ${payload.prescriptionId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PRESCRIPTION_READY,
        title: 'Prescription Ready',
        message: `Your prescription is ready for pickup${payload.pharmacyName ? ` at ${payload.pharmacyName}` : ''}.`,
        data: { prescriptionId: payload.prescriptionId },
        action_url: `/app/patient/prescriptions/${payload.prescriptionId}`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.SMS, NotificationChannel.WHATSAPP],
      });
    } catch (error) {
      this.logger.error(`Failed to handle prescription.ready: ${error.message}`);
    }
  }

  @OnEvent('prescription.payment_required')
  async handlePrescriptionPaymentRequired(payload: PrescriptionEventPayload & { amount?: number; currency?: string }): Promise<void> {
    this.logger.log(`Handling prescription.payment_required event for ${payload.prescriptionId}`);

    try {
      const amountText = payload.amount
        ? ` of ${payload.currency || 'NGN'} ${payload.amount.toLocaleString()}`
        : '';

      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PRESCRIPTION_PAYMENT_REQUIRED,
        title: 'Payment Required',
        message: `Payment${amountText} is required for your prescription before it can be processed.`,
        data: {
          prescriptionId: payload.prescriptionId,
          amount: payload.amount,
          currency: payload.currency,
        },
        action_url: `/app/patient/prescriptions/${payload.prescriptionId}/pay`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle prescription.payment_required: ${error.message}`);
    }
  }

  @OnEvent('prescription.shipped')
  async handlePrescriptionShipped(payload: PrescriptionEventPayload & { trackingNumber?: string; carrier?: string }): Promise<void> {
    this.logger.log(`Handling prescription.shipped event for ${payload.prescriptionId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PRESCRIPTION_SHIPPED,
        title: 'Prescription Shipped',
        message: `Your prescription has been shipped${payload.carrier ? ` via ${payload.carrier}` : ''}.${payload.trackingNumber ? ` Tracking: ${payload.trackingNumber}` : ''}`,
        data: {
          prescriptionId: payload.prescriptionId,
          trackingNumber: payload.trackingNumber,
          carrier: payload.carrier,
        },
        action_url: `/app/patient/prescriptions/${payload.prescriptionId}`,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.SMS, NotificationChannel.WHATSAPP],
      });
    } catch (error) {
      this.logger.error(`Failed to handle prescription.shipped: ${error.message}`);
    }
  }

  @OnEvent('prescription.delivered')
  async handlePrescriptionDelivered(payload: PrescriptionEventPayload): Promise<void> {
    this.logger.log(`Handling prescription.delivered event for ${payload.prescriptionId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PRESCRIPTION_DELIVERED,
        title: 'Prescription Delivered',
        message: 'Your prescription has been delivered. Follow the medication instructions carefully.',
        data: { prescriptionId: payload.prescriptionId },
        action_url: `/app/patient/prescriptions/${payload.prescriptionId}`,
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle prescription.delivered: ${error.message}`);
    }
  }

  // Pharmacy order events
  @OnEvent('pharmacy_order.placed')
  async handlePharmacyOrderPlaced(payload: { orderId: string; patientId: string; itemCount: number; totalAmount: number }): Promise<void> {
    this.logger.log(`Handling pharmacy_order.placed event for ${payload.orderId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PHARMACY_ORDER_PLACED,
        title: 'Order Placed',
        message: `Your pharmacy order with ${payload.itemCount} item(s) has been placed successfully.`,
        data: { orderId: payload.orderId, totalAmount: payload.totalAmount },
        action_url: `/app/patient/pharmacy/orders/${payload.orderId}`,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle pharmacy_order.placed: ${error.message}`);
    }
  }

  @OnEvent('pharmacy_order.confirmed')
  async handlePharmacyOrderConfirmed(payload: { orderId: string; patientId: string; estimatedDelivery?: Date }): Promise<void> {
    this.logger.log(`Handling pharmacy_order.confirmed event for ${payload.orderId}`);

    try {
      const deliveryText = payload.estimatedDelivery
        ? ` Expected delivery: ${new Date(payload.estimatedDelivery).toLocaleDateString()}.`
        : '';

      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PHARMACY_ORDER_CONFIRMED,
        title: 'Order Confirmed',
        message: `Your pharmacy order has been confirmed and is being prepared.${deliveryText}`,
        data: { orderId: payload.orderId },
        action_url: `/app/patient/pharmacy/orders/${payload.orderId}`,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle pharmacy_order.confirmed: ${error.message}`);
    }
  }

  @OnEvent('pharmacy_order.shipped')
  async handlePharmacyOrderShipped(payload: { orderId: string; patientId: string; trackingNumber?: string }): Promise<void> {
    this.logger.log(`Handling pharmacy_order.shipped event for ${payload.orderId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PHARMACY_ORDER_SHIPPED,
        title: 'Order Shipped',
        message: `Your pharmacy order is on its way!${payload.trackingNumber ? ` Tracking: ${payload.trackingNumber}` : ''}`,
        data: { orderId: payload.orderId, trackingNumber: payload.trackingNumber },
        action_url: `/app/patient/pharmacy/orders/${payload.orderId}`,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.SMS, NotificationChannel.WHATSAPP],
      });
    } catch (error) {
      this.logger.error(`Failed to handle pharmacy_order.shipped: ${error.message}`);
    }
  }

  @OnEvent('pharmacy_order.delivered')
  async handlePharmacyOrderDelivered(payload: { orderId: string; patientId: string }): Promise<void> {
    this.logger.log(`Handling pharmacy_order.delivered event for ${payload.orderId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PHARMACY_ORDER_DELIVERED,
        title: 'Order Delivered',
        message: 'Your pharmacy order has been delivered. Thank you for your order!',
        data: { orderId: payload.orderId },
        action_url: `/app/patient/pharmacy/orders/${payload.orderId}`,
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.IN_APP],
      });
    } catch (error) {
      this.logger.error(`Failed to handle pharmacy_order.delivered: ${error.message}`);
    }
  }

  @OnEvent('pharmacy_order.cancelled')
  async handlePharmacyOrderCancelled(payload: { orderId: string; patientId: string; reason?: string }): Promise<void> {
    this.logger.log(`Handling pharmacy_order.cancelled event for ${payload.orderId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PHARMACY_ORDER_CANCELLED,
        title: 'Order Cancelled',
        message: `Your pharmacy order has been cancelled.${payload.reason ? ` Reason: ${payload.reason}` : ''} Any payment will be refunded.`,
        data: { orderId: payload.orderId, reason: payload.reason },
        action_url: `/app/patient/pharmacy/orders`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle pharmacy_order.cancelled: ${error.message}`);
    }
  }
}
