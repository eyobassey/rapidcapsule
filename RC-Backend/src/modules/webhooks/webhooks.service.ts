import {
  Injectable,
  InternalServerErrorException,
  Logger,
  LoggerService,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Webhook, WebhookDocument } from './entities/webhook.entity';
import { create, deleteOne } from 'src/common/crud/crud';
import { TaskScheduler } from '../../core/worker/task.scheduler';
import { PaystackWebhookData, WebhookEventTypes } from './types/webhook.types';
import { PaymentFor, Status } from '../payments/entities/payment.entity';
import { PaymentsService } from '../payments/payments.service';
import { CardsService } from '../cards/cards.service';
import { WalletsService } from '../wallets/wallets.service';
import { WebhookEvents } from './events/webhook.events';
import { Subject } from 'rxjs';
import { WebsocketGateway } from '../../core/websocket/websocket.gateway';
import {
  SpecialistPrescription,
  SpecialistPrescriptionDocument,
  SpecialistPrescriptionStatus,
  PrescriptionPaymentStatus,
} from '../prescriptions/entities/specialist-prescription.entity';
import { AccountingService } from '../accounting/services/accounting.service';

@Injectable()
export class WebhooksService {
  private logger: LoggerService = new Logger(WebhooksService.name);
  private events = new Subject();
  constructor(
    @InjectModel(Webhook.name) private webhookModel: Model<WebhookDocument>,
    @InjectModel(SpecialistPrescription.name) private prescriptionModel: Model<SpecialistPrescriptionDocument>,
    private readonly taskCron: TaskScheduler,
    private readonly paymentService: PaymentsService,
    private readonly cardService: CardsService,
    private readonly walletsService: WalletsService,
    private readonly websocketGateway: WebsocketGateway,
    private readonly accountingService: AccountingService,
  ) {}
  async createWebhook(body: PaystackWebhookData) {
    this.logger.log(`Received webhook ${body.event} from Paystack`);
    const webhook = await create(this.webhookModel, {
      event: body?.event,
      data: body?.data,
    });
    this.websocketGateway.server.emit(
      'event',
      new WebhookEvents({
        event: webhook.event,
        data: webhook.data,
      }),
    );
    this.logger.log(`Create webhook ${webhook._id} in the database`);
    await this.taskCron.addCron(
      this.processWebhook(webhook),
      `${Date.now()}-processWebhook-${body.event}`,
      [10, 'seconds'],
    );
    return true;
  }

  async processWebhook(webhook: WebhookDocument) {
    switch (webhook.event) {
      case WebhookEventTypes.TRANSACTION_SUCCESS:
        await this.handleTransactionSuccess(webhook);
        break;
      case WebhookEventTypes.TRANSFER_SUCCESS:
        //do nothing for now
        break;
    }
  }

  async handleTransactionSuccess(webhook: WebhookDocument) {
    const payment = await this.paymentService.findPaymentByReference(
      webhook.data.reference,
    );
    try {
      // Update payment status
      await this.paymentService.updatePayment(webhook.data.reference, {
        status: Status.SUCCESSFUL,
        metadata: {
          ...webhook.data.metadata,
        },
        currency: webhook.data.currency,
      });

      // Save card if reusable
      if (webhook.data?.authorization?.reusable) {
        await this.cardService.saveCardDetails(
          webhook.data.authorization,
          payment.userId,
        );
      }

      // Handle based on payment type
      const amount = Number(webhook.data.amount) / 100; // Paystack returns amount in kobo

      if (payment.payment_for === PaymentFor.WALLET_TOPUP) {
        // Credit wallet for wallet top-up
        await this.walletsService.creditWallet(
          new Types.ObjectId(payment.userId),
          amount,
          webhook.data.reference,
          `Wallet top-up via Paystack`,
        );
        this.logger.log(`Credited wallet for user ${payment.userId} with ₦${amount}`);
      } else if (payment.payment_for === PaymentFor.PRESCRIPTION) {
        // Handle prescription payment
        await this.handlePrescriptionPayment(webhook, payment, amount);
      }

      await this.deleteWebhook(webhook._id);
      this.logger.log('Updated payment and transaction successfully');
    } catch (e) {
      this.logger.error(e?.message, e);
      throw new InternalServerErrorException(e);
    }
  }

  /**
   * Handle prescription payment from Paystack webhook
   */
  private async handlePrescriptionPayment(webhook: WebhookDocument, payment: any, amount: number) {
    const prescriptionId = webhook.data.metadata?.prescription_id;

    if (!prescriptionId) {
      this.logger.error('No prescription_id in webhook metadata');
      return;
    }

    // Find and update prescription
    const prescription = await this.prescriptionModel.findOne({
      _id: new Types.ObjectId(prescriptionId),
      payment_reference: webhook.data.reference,
    });

    if (!prescription) {
      this.logger.error(`Prescription not found for reference ${webhook.data.reference}`);
      return;
    }

    // Update prescription status to paid/ready for dispensing
    await this.prescriptionModel.updateOne(
      { _id: prescription._id },
      {
        status: SpecialistPrescriptionStatus.PAID,
        payment_status: PrescriptionPaymentStatus.PAID,
        paid_at: new Date(),
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.PAID,
            changed_at: new Date(),
            notes: `Payment of ₦${amount.toLocaleString()} received via Paystack card payment`,
          },
        },
      },
    );

    this.logger.log(`Prescription ${prescription.prescription_number} marked as paid - ₦${amount}`);

    // Record in chart of accounts
    try {
      await this.accountingService.recordPrescriptionCardPayment({
        prescriptionId: prescription._id,
        prescriptionNumber: prescription.prescription_number,
        patientId: new Types.ObjectId(payment.userId),
        amount,
        paymentMethod: 'card',
        paymentReference: webhook.data.reference,
      });
      this.logger.log(`Accounting entry created for prescription ${prescription.prescription_number}`);
    } catch (err) {
      this.logger.error(`Failed to record accounting entry: ${err.message}`);
      // Don't throw - prescription is already marked as paid
    }
  }

  async deleteWebhook(webhookId) {
    await deleteOne(this.webhookModel, { _id: webhookId });
    this.logger.log(`Deleted webhook ${webhookId}`);
  }
}
