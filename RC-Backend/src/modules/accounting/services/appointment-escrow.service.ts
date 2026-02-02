/**
 * Appointment Escrow Service
 *
 * Manages the escrow flow for appointment payments:
 * 1. When booking confirmed: Funds held in escrow
 * 2. When cancelled before start: 100% refund to payer (patient or specialist)
 * 3. When meeting completes: Specialist gets consultation fee, Platform gets platform fee
 * 4. When no-show: Same as completion (specialist gets fee, platform gets commission)
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  UnifiedWallet,
  UnifiedWalletDocument,
} from '../entities/unified-wallet.entity';
import {
  LedgerEntry,
  LedgerEntryDocument,
} from '../entities/ledger-entry.entity';
import {
  TransactionBatch,
  TransactionBatchDocument,
} from '../entities/transaction-batch.entity';
import { AccountingService } from './accounting.service';
import { UnifiedWalletService } from './unified-wallet.service';
import {
  AccountCode,
  EntryType,
  TransactionCategory,
  WalletOwnerType,
} from '../enums/account-codes.enum';
import {
  SpecialistWalletTransaction,
  SpecialistWalletTransactionDocument,
  SpecialistTransactionType,
  SpecialistTransactionStatus,
  SpecialistTransactionReference,
} from '../../wallets/entities/specialist-wallet-transaction.entity';

export interface HoldAppointmentFundsDto {
  appointment_id: Types.ObjectId;
  patient_id: Types.ObjectId;
  specialist_id: Types.ObjectId;
  payment_source: 'patient_wallet' | 'specialist_wallet';
  consultation_fee: number;
  platform_fee: number;
  total_amount: number;
  description?: string;
  performed_by?: Types.ObjectId;
}

export interface RefundAppointmentDto {
  appointment_id: string | Types.ObjectId;
  reason?: string;
  performed_by?: Types.ObjectId;
}

export interface SettleAppointmentDto {
  appointment_id: string | Types.ObjectId;
  settlement_type: 'completed' | 'no_show';
  performed_by?: Types.ObjectId;
}

export interface AppointmentEscrowRecord {
  appointment_id: Types.ObjectId;
  patient_id: Types.ObjectId;
  specialist_id: Types.ObjectId;
  payer_id: Types.ObjectId;
  payer_type: 'patient' | 'specialist';
  payer_wallet_id: string;
  consultation_fee: number;
  platform_fee: number;
  total_amount: number;
  hold_batch_id: string;
  status: 'held' | 'refunded' | 'settled';
}

@Injectable()
export class AppointmentEscrowService {
  private readonly logger = new Logger(AppointmentEscrowService.name);

  constructor(
    @InjectModel(UnifiedWallet.name)
    private walletModel: Model<UnifiedWalletDocument>,
    @InjectModel(LedgerEntry.name)
    private ledgerEntryModel: Model<LedgerEntryDocument>,
    @InjectModel(TransactionBatch.name)
    private batchModel: Model<TransactionBatchDocument>,
    @InjectModel(SpecialistWalletTransaction.name)
    private specialistTransactionModel: Model<SpecialistWalletTransactionDocument>,
    private accountingService: AccountingService,
    private unifiedWalletService: UnifiedWalletService,
  ) {}

  /**
   * Generate a unique transaction ID for specialist wallet transactions
   */
  private async generateTransactionId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.specialistTransactionModel.countDocuments({
      created_at: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999)),
      },
    });
    return `TXN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Hold appointment funds in escrow
   * Called when appointment booking is confirmed and payment is made
   */
  async holdAppointmentFunds(
    dto: HoldAppointmentFundsDto,
  ): Promise<TransactionBatchDocument> {
    const {
      appointment_id,
      patient_id,
      specialist_id,
      payment_source,
      consultation_fee,
      platform_fee,
      total_amount,
      description,
      performed_by,
    } = dto;

    // Determine payer based on payment source
    const payerId =
      payment_source === 'patient_wallet' ? patient_id : specialist_id;
    const payerType: WalletOwnerType =
      payment_source === 'patient_wallet'
        ? WalletOwnerType.PATIENT
        : WalletOwnerType.SPECIALIST;

    // Get payer's wallet
    const payerWallet = await this.unifiedWalletService.getWalletByOwner(
      payerId,
      payerType,
    );

    if (!payerWallet) {
      throw new NotFoundException(
        `${payerType} wallet not found for user ${payerId}`,
      );
    }

    // Check sufficient balance
    if (payerWallet.available_balance < total_amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ₦${payerWallet.available_balance}, Required: ₦${total_amount}`,
      );
    }

    // Get the liability account for the payer
    const payerLiabilityAccount =
      payment_source === 'patient_wallet'
        ? AccountCode.LIABILITY_PATIENT_WALLETS
        : AccountCode.LIABILITY_SPECIALIST_WALLETS;

    // Create batch: Debit payer wallet, Credit escrow
    const batch = await this.accountingService.createAndPostBatch({
      category: TransactionCategory.APPOINTMENT_ESCROW_HOLD,
      description:
        description ||
        `Appointment escrow hold - ${payment_source === 'patient_wallet' ? 'Patient' : 'Specialist'} payment`,
      entries: [
        {
          account_code: payerLiabilityAccount,
          entry_type: EntryType.DEBIT,
          amount: total_amount,
          description: `Appointment payment from ${payerType.toLowerCase()}`,
          user_id: payerId,
          wallet_id: new Types.ObjectId(payerWallet._id.toString()),
        },
        {
          account_code: AccountCode.LIABILITY_APPOINTMENT_ESCROW,
          entry_type: EntryType.CREDIT,
          amount: total_amount,
          description: 'Funds held in appointment escrow',
          user_id: payerId,
          wallet_id: new Types.ObjectId(payerWallet._id.toString()),
        },
      ],
      from_user: payerId,
      from_wallet: new Types.ObjectId(payerWallet._id.toString()),
      reference_type: 'appointment_escrow',
      reference_id: appointment_id,
      performed_by: performed_by || payerId,
      metadata: {
        appointment_id: appointment_id.toString(),
        patient_id: patient_id.toString(),
        specialist_id: specialist_id.toString(),
        payment_source,
        consultation_fee,
        platform_fee,
        total_amount,
        payer_type: payerType,
        payer_wallet_id: payerWallet.wallet_id,
      },
    });

    // Update payer wallet balance
    await this.walletModel.updateOne(
      { _id: payerWallet._id },
      {
        $inc: {
          available_balance: -total_amount,
          total_debited: total_amount,
          transaction_count: 1,
        },
        $set: {
          last_debit_at: new Date(),
          last_transaction_at: new Date(),
        },
      },
    );

    this.logger.log(
      `Held ₦${total_amount} in escrow for appointment ${appointment_id}. ` +
        `Payer: ${payerType} (${payerId}). Batch: ${batch.batch_id}`,
    );

    return batch;
  }

  /**
   * Refund appointment funds from escrow
   * Called when appointment is cancelled before start time
   * Returns 100% to the original payer (patient or specialist)
   */
  async refundAppointmentFunds(
    dto: RefundAppointmentDto,
  ): Promise<TransactionBatchDocument> {
    const { appointment_id, reason, performed_by } = dto;

    // Convert appointment_id to ObjectId if it's a string
    const appointmentObjectId =
      typeof appointment_id === 'string'
        ? new Types.ObjectId(appointment_id)
        : appointment_id;

    // Find the original hold batch
    const holdBatch = await this.batchModel.findOne({
      reference_type: 'appointment_escrow',
      reference_id: appointmentObjectId,
      category: TransactionCategory.APPOINTMENT_ESCROW_HOLD,
      status: 'POSTED',
    });

    if (!holdBatch) {
      throw new NotFoundException(
        `No escrow hold found for appointment ${appointmentObjectId}`,
      );
    }

    // Check if already refunded or settled
    const existingRefundOrSettle = await this.batchModel.findOne({
      reference_type: 'appointment_escrow',
      reference_id: appointmentObjectId,
      category: {
        $in: [
          TransactionCategory.APPOINTMENT_ESCROW_REFUND,
          TransactionCategory.APPOINTMENT_ESCROW_SETTLE,
          TransactionCategory.APPOINTMENT_NO_SHOW_SETTLE,
        ],
      },
      status: 'POSTED',
    });

    if (existingRefundOrSettle) {
      throw new BadRequestException(
        `Appointment ${appointmentObjectId} has already been ${existingRefundOrSettle.category === TransactionCategory.APPOINTMENT_ESCROW_REFUND ? 'refunded' : 'settled'}`,
      );
    }

    // Extract escrow details from hold batch metadata
    const {
      payer_type,
      payer_wallet_id,
      total_amount,
      patient_id,
      specialist_id,
      payment_source,
    } = holdBatch.metadata;

    // Get payer's wallet
    const payerWallet = await this.unifiedWalletService.getWallet(
      payer_wallet_id,
    );

    // Get the liability account for the payer
    const payerLiabilityAccount =
      payment_source === 'patient_wallet'
        ? AccountCode.LIABILITY_PATIENT_WALLETS
        : AccountCode.LIABILITY_SPECIALIST_WALLETS;

    // Create refund batch: Debit escrow, Credit payer wallet
    const batch = await this.accountingService.createAndPostBatch({
      category: TransactionCategory.APPOINTMENT_ESCROW_REFUND,
      description:
        reason ||
        `Appointment cancellation refund to ${payment_source === 'patient_wallet' ? 'patient' : 'specialist'}`,
      entries: [
        {
          account_code: AccountCode.LIABILITY_APPOINTMENT_ESCROW,
          entry_type: EntryType.DEBIT,
          amount: total_amount,
          description: 'Release funds from appointment escrow',
          user_id: new Types.ObjectId(
            payment_source === 'patient_wallet' ? patient_id : specialist_id,
          ),
          wallet_id: new Types.ObjectId(payerWallet._id.toString()),
        },
        {
          account_code: payerLiabilityAccount,
          entry_type: EntryType.CREDIT,
          amount: total_amount,
          description: `Refund to ${payer_type.toLowerCase()} wallet`,
          user_id: new Types.ObjectId(
            payment_source === 'patient_wallet' ? patient_id : specialist_id,
          ),
          wallet_id: new Types.ObjectId(payerWallet._id.toString()),
        },
      ],
      to_user: new Types.ObjectId(
        payment_source === 'patient_wallet' ? patient_id : specialist_id,
      ),
      to_wallet: new Types.ObjectId(payerWallet._id.toString()),
      reference_type: 'appointment_escrow',
      reference_id: appointmentObjectId,
      performed_by: performed_by,
      metadata: {
        ...holdBatch.metadata,
        refund_reason: reason,
        original_hold_batch: holdBatch.batch_id,
      },
    });

    // Update payer wallet balance (refund)
    await this.walletModel.updateOne(
      { _id: payerWallet._id },
      {
        $inc: {
          available_balance: total_amount,
          total_credited: total_amount,
          transaction_count: 1,
        },
        $set: {
          last_credit_at: new Date(),
          last_transaction_at: new Date(),
        },
      },
    );

    this.logger.log(
      `Refunded ₦${total_amount} from escrow for appointment ${appointmentObjectId}. ` +
        `Refunded to: ${payer_type} (wallet: ${payer_wallet_id}). Batch: ${batch.batch_id}`,
    );

    return batch;
  }

  /**
   * Settle appointment funds from escrow
   * Called when meeting completes or on no-show
   * - Specialist gets consultation fee (credited to their wallet)
   * - Platform gets platform fee (credited to revenue)
   */
  async settleAppointmentFunds(
    dto: SettleAppointmentDto,
  ): Promise<TransactionBatchDocument> {
    const { appointment_id, settlement_type, performed_by } = dto;

    // Convert appointment_id to ObjectId if it's a string
    const appointmentObjectId =
      typeof appointment_id === 'string'
        ? new Types.ObjectId(appointment_id)
        : appointment_id;

    // Find the original hold batch
    const holdBatch = await this.batchModel.findOne({
      reference_type: 'appointment_escrow',
      reference_id: appointmentObjectId,
      category: TransactionCategory.APPOINTMENT_ESCROW_HOLD,
      status: 'POSTED',
    });

    if (!holdBatch) {
      throw new NotFoundException(
        `No escrow hold found for appointment ${appointmentObjectId}`,
      );
    }

    // Check if already refunded or settled
    const existingRefundOrSettle = await this.batchModel.findOne({
      reference_type: 'appointment_escrow',
      reference_id: appointmentObjectId,
      category: {
        $in: [
          TransactionCategory.APPOINTMENT_ESCROW_REFUND,
          TransactionCategory.APPOINTMENT_ESCROW_SETTLE,
          TransactionCategory.APPOINTMENT_NO_SHOW_SETTLE,
        ],
      },
      status: 'POSTED',
    });

    if (existingRefundOrSettle) {
      throw new BadRequestException(
        `Appointment ${appointmentObjectId} has already been ${existingRefundOrSettle.category === TransactionCategory.APPOINTMENT_ESCROW_REFUND ? 'refunded' : 'settled'}`,
      );
    }

    // Extract escrow details from hold batch metadata
    const {
      specialist_id,
      consultation_fee,
      platform_fee,
      total_amount,
      payment_source,
    } = holdBatch.metadata;

    // Get specialist's wallet
    const specialistWallet = await this.unifiedWalletService.getWalletByOwner(
      new Types.ObjectId(specialist_id),
      WalletOwnerType.SPECIALIST,
    );

    if (!specialistWallet) {
      throw new NotFoundException(
        `Specialist wallet not found for user ${specialist_id}`,
      );
    }

    const category =
      settlement_type === 'completed'
        ? TransactionCategory.APPOINTMENT_ESCROW_SETTLE
        : TransactionCategory.APPOINTMENT_NO_SHOW_SETTLE;

    const description =
      settlement_type === 'completed'
        ? 'Appointment completed - settlement'
        : 'Appointment no-show - settlement';

    // Build entries
    const entries: any[] = [
      // Debit escrow (release held funds)
      {
        account_code: AccountCode.LIABILITY_APPOINTMENT_ESCROW,
        entry_type: EntryType.DEBIT,
        amount: total_amount,
        description: 'Release funds from appointment escrow',
        user_id: new Types.ObjectId(specialist_id),
        wallet_id: new Types.ObjectId(specialistWallet._id.toString()),
      },
    ];

    // Credit specialist wallet with consultation fee
    if (consultation_fee > 0) {
      entries.push({
        account_code: AccountCode.LIABILITY_SPECIALIST_WALLETS,
        entry_type: EntryType.CREDIT,
        amount: consultation_fee,
        description: `Consultation fee earnings${settlement_type === 'no_show' ? ' (patient no-show)' : ''}`,
        user_id: new Types.ObjectId(specialist_id),
        wallet_id: new Types.ObjectId(specialistWallet._id.toString()),
      });
    }

    // Credit platform with platform fee
    if (platform_fee > 0) {
      entries.push({
        account_code: AccountCode.REVENUE_PLATFORM_COMMISSION,
        entry_type: EntryType.CREDIT,
        amount: platform_fee,
        description: `Platform fee - appointment ${settlement_type}`,
        user_id: new Types.ObjectId(specialist_id),
        wallet_id: new Types.ObjectId(specialistWallet._id.toString()),
      });
    }

    // Create settlement batch
    const batch = await this.accountingService.createAndPostBatch({
      category,
      description,
      entries,
      to_user: new Types.ObjectId(specialist_id),
      to_wallet: new Types.ObjectId(specialistWallet._id.toString()),
      reference_type: 'appointment_escrow',
      reference_id: appointmentObjectId,
      performed_by,
      metadata: {
        ...holdBatch.metadata,
        settlement_type,
        original_hold_batch: holdBatch.batch_id,
      },
    });

    // Update specialist wallet balance (add consultation fee)
    if (consultation_fee > 0) {
      const balanceBefore = specialistWallet.available_balance;
      const balanceAfter = balanceBefore + consultation_fee;

      await this.walletModel.updateOne(
        { _id: specialistWallet._id },
        {
          $inc: {
            available_balance: consultation_fee,
            total_credited: consultation_fee,
            transaction_count: 1,
          },
          $set: {
            last_credit_at: new Date(),
            last_transaction_at: new Date(),
          },
        },
      );

      // Create legacy specialist wallet transaction for UI display
      try {
        const transactionId = await this.generateTransactionId();
        await this.specialistTransactionModel.create({
          transaction_id: transactionId,
          wallet_id: specialistWallet.legacy_wallet_id || specialistWallet._id,
          specialist_id: new Types.ObjectId(specialist_id),
          type: SpecialistTransactionType.CREDIT,
          amount: consultation_fee,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          held_balance_before: specialistWallet.held_balance || 0,
          held_balance_after: specialistWallet.held_balance || 0,
          reference_type: SpecialistTransactionReference.APPOINTMENT,
          reference_id: appointmentObjectId,
          description: `Appointment consultation fee${settlement_type === 'no_show' ? ' (Patient no-show)' : ''} - Escrow Settlement`,
          status: SpecialistTransactionStatus.COMPLETED,
          performed_by: new Types.ObjectId(specialist_id),
          metadata: {
            batch_id: batch.batch_id,
            settlement_type,
            platform_fee,
          },
        });
        this.logger.log(`Created specialist wallet transaction ${transactionId}`);
      } catch (txError) {
        this.logger.error(`Failed to create specialist transaction record: ${txError.message}`);
        // Continue - the main settlement succeeded
      }
    }

    this.logger.log(
      `Settled appointment ${appointmentObjectId} (${settlement_type}). ` +
        `Specialist receives ₦${consultation_fee}, Platform receives ₦${platform_fee}. ` +
        `Batch: ${batch.batch_id}`,
    );

    return batch;
  }

  /**
   * Get escrow status for an appointment
   */
  async getEscrowStatus(appointmentId: Types.ObjectId): Promise<{
    status: 'not_found' | 'held' | 'refunded' | 'settled';
    hold_batch?: TransactionBatchDocument;
    settlement_batch?: TransactionBatchDocument;
    details?: any;
  }> {
    // Find hold batch
    const holdBatch = await this.batchModel.findOne({
      reference_type: 'appointment_escrow',
      reference_id: appointmentId,
      category: TransactionCategory.APPOINTMENT_ESCROW_HOLD,
      status: 'POSTED',
    });

    if (!holdBatch) {
      return { status: 'not_found' };
    }

    // Find refund or settlement batch
    const settlementBatch = await this.batchModel.findOne({
      reference_type: 'appointment_escrow',
      reference_id: appointmentId,
      category: {
        $in: [
          TransactionCategory.APPOINTMENT_ESCROW_REFUND,
          TransactionCategory.APPOINTMENT_ESCROW_SETTLE,
          TransactionCategory.APPOINTMENT_NO_SHOW_SETTLE,
        ],
      },
      status: 'POSTED',
    });

    if (!settlementBatch) {
      return {
        status: 'held',
        hold_batch: holdBatch,
        details: holdBatch.metadata,
      };
    }

    const status =
      settlementBatch.category === TransactionCategory.APPOINTMENT_ESCROW_REFUND
        ? 'refunded'
        : 'settled';

    return {
      status,
      hold_batch: holdBatch,
      settlement_batch: settlementBatch,
      details: {
        ...holdBatch.metadata,
        settlement_type: settlementBatch.metadata?.settlement_type,
        settlement_date: settlementBatch.created_at,
      },
    };
  }
}
