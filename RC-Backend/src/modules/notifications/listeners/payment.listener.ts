import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationOrchestratorService } from '../services/notification-orchestrator.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
  PaymentEventPayload,
} from '../types/notification.types';

@Injectable()
export class PaymentListener {
  private readonly logger = new Logger(PaymentListener.name);

  constructor(
    private orchestratorService: NotificationOrchestratorService,
  ) {}

  @OnEvent('payment.received')
  async handlePaymentReceived(payload: PaymentEventPayload): Promise<void> {
    this.logger.log(`Handling payment.received event for ${payload.paymentId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.userId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Payment Successful',
        message: `Your payment of ${payload.currency || 'NGN'} ${payload.amount.toLocaleString()} for ${payload.description || 'your order'} was successful.`,
        data: {
          paymentId: payload.paymentId,
          amount: payload.amount,
          currency: payload.currency,
          type: payload.type,
        },
        action_url: '/app/patient/wallet/transactions',
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle payment.received: ${error.message}`);
    }
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(payload: PaymentEventPayload & { reason?: string }): Promise<void> {
    this.logger.log(`Handling payment.failed event for ${payload.paymentId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.userId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PAYMENT_FAILED,
        title: 'Payment Failed',
        message: `Your payment of ${payload.currency || 'NGN'} ${payload.amount.toLocaleString()} failed.${payload.reason ? ` Reason: ${payload.reason}` : ' Please try again.'}`,
        data: {
          paymentId: payload.paymentId,
          amount: payload.amount,
          reason: payload.reason,
        },
        action_url: '/app/patient/wallet',
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle payment.failed: ${error.message}`);
    }
  }

  @OnEvent('wallet.credited')
  async handleWalletCredited(payload: {
    userId: string;
    userType: UserTypeNotification;
    amount: number;
    currency?: string;
    source: string;
    transactionId?: string;
  }): Promise<void> {
    this.logger.log(`Handling wallet.credited event for user ${payload.userId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.userId,
        user_type: payload.userType,
        type: NotificationType.WALLET_CREDITED,
        title: 'Wallet Credited',
        message: `${payload.currency || 'NGN'} ${payload.amount.toLocaleString()} has been added to your wallet from ${payload.source}.`,
        data: {
          amount: payload.amount,
          currency: payload.currency,
          source: payload.source,
          transactionId: payload.transactionId,
        },
        action_url: '/app/patient/wallet',
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle wallet.credited: ${error.message}`);
    }
  }

  @OnEvent('wallet.debited')
  async handleWalletDebited(payload: {
    userId: string;
    userType: UserTypeNotification;
    amount: number;
    currency?: string;
    purpose: string;
    transactionId?: string;
  }): Promise<void> {
    this.logger.log(`Handling wallet.debited event for user ${payload.userId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.userId,
        user_type: payload.userType,
        type: NotificationType.WALLET_DEBITED,
        title: 'Wallet Debited',
        message: `${payload.currency || 'NGN'} ${payload.amount.toLocaleString()} has been deducted from your wallet for ${payload.purpose}.`,
        data: {
          amount: payload.amount,
          currency: payload.currency,
          purpose: payload.purpose,
          transactionId: payload.transactionId,
        },
        action_url: '/app/patient/wallet/transactions',
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP],
      });
    } catch (error) {
      this.logger.error(`Failed to handle wallet.debited: ${error.message}`);
    }
  }

  @OnEvent('specialist.earnings_available')
  async handleEarningsAvailable(payload: {
    specialistId: string;
    amount: number;
    currency?: string;
    appointmentCount?: number;
  }): Promise<void> {
    this.logger.log(`Handling specialist.earnings_available event for specialist ${payload.specialistId}`);

    try {
      const message = payload.appointmentCount
        ? `You have ${payload.currency || 'NGN'} ${payload.amount.toLocaleString()} available from ${payload.appointmentCount} completed appointment(s).`
        : `You have ${payload.currency || 'NGN'} ${payload.amount.toLocaleString()} available for withdrawal.`;

      await this.orchestratorService.sendNotification({
        userId: payload.specialistId,
        user_type: UserTypeNotification.SPECIALIST,
        type: NotificationType.EARNINGS_AVAILABLE,
        title: 'Earnings Available',
        message,
        data: {
          amount: payload.amount,
          currency: payload.currency,
          appointmentCount: payload.appointmentCount,
        },
        action_url: '/app/specialist/wallet',
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle specialist.earnings_available: ${error.message}`);
    }
  }

  @OnEvent('refund.processed')
  async handleRefundProcessed(payload: {
    userId: string;
    amount: number;
    currency?: string;
    refundId?: string;
    originalPaymentId?: string;
    reason?: string;
  }): Promise<void> {
    this.logger.log(`Handling refund.processed event for user ${payload.userId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.userId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.REFUND_PROCESSED,
        title: 'Refund Processed',
        message: `A refund of ${payload.currency || 'NGN'} ${payload.amount.toLocaleString()} has been processed.${payload.reason ? ` Reason: ${payload.reason}` : ''}`,
        data: {
          amount: payload.amount,
          currency: payload.currency,
          refundId: payload.refundId,
          originalPaymentId: payload.originalPaymentId,
        },
        action_url: '/app/patient/wallet/transactions',
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle refund.processed: ${error.message}`);
    }
  }

  @OnEvent('subscription.renewed')
  async handleSubscriptionRenewed(payload: {
    userId: string;
    planName: string;
    amount: number;
    currency?: string;
    nextBillingDate: Date;
  }): Promise<void> {
    this.logger.log(`Handling subscription.renewed event for user ${payload.userId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.userId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Subscription Renewed',
        message: `Your ${payload.planName} subscription has been renewed. Next billing date: ${new Date(payload.nextBillingDate).toLocaleDateString()}.`,
        data: {
          planName: payload.planName,
          amount: payload.amount,
          nextBillingDate: payload.nextBillingDate,
        },
        action_url: '/app/patient/settings/subscription',
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle subscription.renewed: ${error.message}`);
    }
  }
}
