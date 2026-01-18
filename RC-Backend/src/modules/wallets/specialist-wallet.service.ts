import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as moment from 'moment';
import * as currency from 'currency.js';

import {
  SpecialistWallet,
  SpecialistWalletDocument,
} from './entities/specialist-wallet.entity';
import {
  SpecialistWalletTransaction,
  SpecialistWalletTransactionDocument,
  SpecialistTransactionType,
  SpecialistTransactionStatus,
  SpecialistTransactionReference,
} from './entities/specialist-wallet-transaction.entity';
import {
  TopUpWalletDto,
  SpecialistWalletTransactionQueryDto,
} from './dto/specialist-wallet.dto';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { PaymentHandler } from '../../common/external/payment/payment.handler';

@Injectable()
export class SpecialistWalletService {
  constructor(
    @InjectModel(SpecialistWallet.name)
    private walletModel: Model<SpecialistWalletDocument>,
    @InjectModel(SpecialistWalletTransaction.name)
    private transactionModel: Model<SpecialistWalletTransactionDocument>,
    private readonly generalHelpers: GeneralHelpers,
    private readonly paymentHandler: PaymentHandler,
  ) {}

  /**
   * Generate unique transaction ID: TXN-YYYYMMDD-XXXX
   */
  private async generateTransactionId(): Promise<string> {
    const today = moment().format('YYYYMMDD');
    const prefix = `TXN-${today}-`;

    // Find the last transaction of today
    const lastTransaction = await this.transactionModel
      .findOne({ transaction_id: { $regex: `^${prefix}` } })
      .sort({ transaction_id: -1 })
      .lean();

    let sequence = 1;
    if (lastTransaction) {
      const lastSequence = parseInt(
        lastTransaction.transaction_id.split('-').pop() || '0',
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Create wallet for a specialist (called on specialist registration)
   */
  async createWallet(specialistId: Types.ObjectId): Promise<SpecialistWalletDocument> {
    const existing = await this.walletModel.findOne({ specialist_id: specialistId });
    if (existing) {
      return existing;
    }

    return this.walletModel.create({
      specialist_id: specialistId,
    });
  }

  /**
   * Get specialist wallet
   */
  async getWallet(specialistId: Types.ObjectId): Promise<SpecialistWalletDocument> {
    let wallet = await this.walletModel.findOne({ specialist_id: specialistId });

    if (!wallet) {
      // Auto-create wallet if doesn't exist
      wallet = await this.createWallet(specialistId);
    }

    return wallet;
  }

  /**
   * Get wallet balance summary
   */
  async getWalletBalance(specialistId: Types.ObjectId) {
    const wallet = await this.getWallet(specialistId);

    return {
      available_balance: wallet.available_balance,
      held_balance: wallet.held_balance,
      total_balance: currency(wallet.available_balance).add(wallet.held_balance).value,
      currency: wallet.currency,
      is_active: wallet.is_active,
      last_transaction_at: wallet.last_transaction_at,
    };
  }

  /**
   * Get transaction history with pagination and filters
   */
  async getTransactions(
    specialistId: Types.ObjectId,
    query: SpecialistWalletTransactionQueryDto,
  ) {
    const {
      page = 1,
      limit = 20,
      type,
      reference_type,
      start_date,
      end_date,
    } = query;

    const filter: any = { specialist_id: specialistId };

    if (type) {
      filter.type = type;
    }

    if (reference_type) {
      filter.reference_type = reference_type;
    }

    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) {
        filter.created_at.$gte = new Date(start_date);
      }
      if (end_date) {
        filter.created_at.$lte = new Date(end_date);
      }
    }

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.transactionModel.countDocuments(filter),
    ]);

    return this.generalHelpers.paginate(transactions, page, limit, total);
  }

  /**
   * Initialize top-up payment
   */
  async initializeTopUp(
    specialistId: Types.ObjectId,
    email: string,
    dto: TopUpWalletDto,
  ) {
    const wallet = await this.getWallet(specialistId);
    const reference = this.generalHelpers.genTxReference();

    // Initialize payment with Paystack
    const paymentResponse = await this.paymentHandler.initializeTransaction(
      email,
      dto.amount * 100, // Convert to kobo
      reference,
      {
        type: 'specialist_wallet_topup',
        specialist_id: specialistId.toString(),
        wallet_id: wallet._id.toString(),
        callback_url: dto.callback_url,
      },
    );

    return {
      authorization_url: paymentResponse.data?.authorization_url,
      reference,
      amount: dto.amount,
    };
  }

  /**
   * Verify top-up payment and credit wallet
   */
  async verifyTopUp(specialistId: Types.ObjectId, reference: string) {
    const wallet = await this.getWallet(specialistId);

    // Check if already processed
    const existingTxn = await this.transactionModel.findOne({
      external_reference: reference,
      specialist_id: specialistId,
    });

    if (existingTxn) {
      return {
        success: true,
        message: 'Payment already processed',
        transaction: existingTxn,
      };
    }

    // Verify with Paystack
    const verification = await this.paymentHandler.verifyTransaction(reference);

    if (verification.data?.status !== 'success') {
      throw new BadRequestException('Payment verification failed');
    }

    const amount = verification.data.amount / 100; // Convert from kobo

    // Credit wallet
    const transaction = await this.credit(
      specialistId,
      amount,
      SpecialistTransactionReference.TOPUP,
      null,
      `Wallet top-up via Paystack`,
      reference,
    );

    return {
      success: true,
      message: 'Wallet credited successfully',
      transaction,
      new_balance: wallet.available_balance + amount,
    };
  }

  /**
   * Credit wallet (add funds)
   */
  async credit(
    specialistId: Types.ObjectId,
    amount: number,
    referenceType: SpecialistTransactionReference,
    referenceId: Types.ObjectId | null,
    description: string,
    externalReference?: string,
    performedBy?: Types.ObjectId,
  ): Promise<SpecialistWalletTransactionDocument> {
    const wallet = await this.getWallet(specialistId);
    const transactionId = await this.generateTransactionId();

    const balanceBefore = wallet.available_balance;
    const balanceAfter = currency(balanceBefore).add(amount).value;

    // Update wallet
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        available_balance: balanceAfter,
        total_credited: currency(wallet.total_credited).add(amount).value,
        last_transaction_at: new Date(),
      },
    );

    // Create transaction record
    const transaction = await this.transactionModel.create({
      transaction_id: transactionId,
      wallet_id: wallet._id,
      specialist_id: specialistId,
      type: SpecialistTransactionType.CREDIT,
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      held_balance_before: wallet.held_balance,
      held_balance_after: wallet.held_balance,
      reference_type: referenceType,
      reference_id: referenceId,
      external_reference: externalReference,
      description,
      status: SpecialistTransactionStatus.COMPLETED,
      performed_by: performedBy || specialistId,
    });

    return transaction;
  }

  /**
   * Debit wallet (deduct funds)
   */
  async debit(
    specialistId: Types.ObjectId,
    amount: number,
    referenceType: SpecialistTransactionReference,
    referenceId: Types.ObjectId | null,
    description: string,
    performedBy?: Types.ObjectId,
  ): Promise<SpecialistWalletTransactionDocument> {
    const wallet = await this.getWallet(specialistId);

    if (wallet.available_balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const transactionId = await this.generateTransactionId();
    const balanceBefore = wallet.available_balance;
    const balanceAfter = currency(balanceBefore).subtract(amount).value;

    // Update wallet
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        available_balance: balanceAfter,
        total_debited: currency(wallet.total_debited).add(amount).value,
        last_transaction_at: new Date(),
      },
    );

    // Create transaction record
    const transaction = await this.transactionModel.create({
      transaction_id: transactionId,
      wallet_id: wallet._id,
      specialist_id: specialistId,
      type: SpecialistTransactionType.DEBIT,
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      held_balance_before: wallet.held_balance,
      held_balance_after: wallet.held_balance,
      reference_type: referenceType,
      reference_id: referenceId,
      description,
      status: SpecialistTransactionStatus.COMPLETED,
      performed_by: performedBy || specialistId,
    });

    return transaction;
  }

  /**
   * Hold funds (reserve for pending transaction like prescription)
   */
  async hold(
    specialistId: Types.ObjectId,
    amount: number,
    referenceId: Types.ObjectId,
    description?: string,
  ): Promise<SpecialistWalletTransactionDocument> {
    const wallet = await this.getWallet(specialistId);

    if (wallet.available_balance < amount) {
      throw new BadRequestException('Insufficient wallet balance to hold');
    }

    const transactionId = await this.generateTransactionId();
    const balanceBefore = wallet.available_balance;
    const balanceAfter = currency(balanceBefore).subtract(amount).value;
    const heldBefore = wallet.held_balance;
    const heldAfter = currency(heldBefore).add(amount).value;

    // Update wallet - move from available to held
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        available_balance: balanceAfter,
        held_balance: heldAfter,
        last_transaction_at: new Date(),
      },
    );

    // Create transaction record
    const transaction = await this.transactionModel.create({
      transaction_id: transactionId,
      wallet_id: wallet._id,
      specialist_id: specialistId,
      type: SpecialistTransactionType.HOLD,
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      held_balance_before: heldBefore,
      held_balance_after: heldAfter,
      reference_type: SpecialistTransactionReference.PRESCRIPTION,
      reference_id: referenceId,
      description: description || `Funds held for prescription payment`,
      status: SpecialistTransactionStatus.PENDING,
      performed_by: specialistId,
    });

    return transaction;
  }

  /**
   * Release held funds (return to available balance)
   */
  async release(
    specialistId: Types.ObjectId,
    referenceId: Types.ObjectId,
    reason?: string,
  ): Promise<SpecialistWalletTransactionDocument> {
    // Find the hold transaction
    const holdTransaction = await this.transactionModel.findOne({
      specialist_id: specialistId,
      reference_id: referenceId,
      type: SpecialistTransactionType.HOLD,
      status: SpecialistTransactionStatus.PENDING,
    });

    if (!holdTransaction) {
      throw new NotFoundException('No pending hold found for this reference');
    }

    const wallet = await this.getWallet(specialistId);
    const transactionId = await this.generateTransactionId();
    const amount = holdTransaction.amount;

    const balanceBefore = wallet.available_balance;
    const balanceAfter = currency(balanceBefore).add(amount).value;
    const heldBefore = wallet.held_balance;
    const heldAfter = currency(heldBefore).subtract(amount).value;

    // Update wallet - move from held back to available
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        available_balance: balanceAfter,
        held_balance: Math.max(0, heldAfter), // Ensure non-negative
        last_transaction_at: new Date(),
      },
    );

    // Update the original hold transaction
    await this.transactionModel.updateOne(
      { _id: holdTransaction._id },
      { status: SpecialistTransactionStatus.REVERSED },
    );

    // Create release transaction record
    const transaction = await this.transactionModel.create({
      transaction_id: transactionId,
      wallet_id: wallet._id,
      specialist_id: specialistId,
      type: SpecialistTransactionType.RELEASE,
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      held_balance_before: heldBefore,
      held_balance_after: Math.max(0, heldAfter),
      reference_type: SpecialistTransactionReference.PRESCRIPTION,
      reference_id: referenceId,
      description: reason || `Funds released - prescription cancelled/expired`,
      status: SpecialistTransactionStatus.COMPLETED,
      performed_by: specialistId,
    });

    return transaction;
  }

  /**
   * Confirm held funds (convert hold to actual debit - for completed payment)
   */
  async confirmHold(
    specialistId: Types.ObjectId,
    referenceId: Types.ObjectId,
  ): Promise<SpecialistWalletTransactionDocument> {
    // Find the hold transaction
    const holdTransaction = await this.transactionModel.findOne({
      specialist_id: specialistId,
      reference_id: referenceId,
      type: SpecialistTransactionType.HOLD,
      status: SpecialistTransactionStatus.PENDING,
    });

    if (!holdTransaction) {
      throw new NotFoundException('No pending hold found for this reference');
    }

    const wallet = await this.getWallet(specialistId);
    const amount = holdTransaction.amount;

    const heldBefore = wallet.held_balance;
    const heldAfter = currency(heldBefore).subtract(amount).value;

    // Update wallet - remove from held (already deducted from available)
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        held_balance: Math.max(0, heldAfter),
        total_debited: currency(wallet.total_debited).add(amount).value,
        last_transaction_at: new Date(),
      },
    );

    // Update the hold transaction to completed
    await this.transactionModel.updateOne(
      { _id: holdTransaction._id },
      { status: SpecialistTransactionStatus.COMPLETED },
    );

    return holdTransaction;
  }

  /**
   * Refund to wallet
   */
  async refund(
    specialistId: Types.ObjectId,
    amount: number,
    referenceId: Types.ObjectId,
    description: string,
  ): Promise<SpecialistWalletTransactionDocument> {
    const wallet = await this.getWallet(specialistId);
    const transactionId = await this.generateTransactionId();

    const balanceBefore = wallet.available_balance;
    const balanceAfter = currency(balanceBefore).add(amount).value;

    // Update wallet
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        available_balance: balanceAfter,
        last_transaction_at: new Date(),
      },
    );

    // Create transaction record
    const transaction = await this.transactionModel.create({
      transaction_id: transactionId,
      wallet_id: wallet._id,
      specialist_id: specialistId,
      type: SpecialistTransactionType.REFUND,
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      held_balance_before: wallet.held_balance,
      held_balance_after: wallet.held_balance,
      reference_type: SpecialistTransactionReference.REFUND,
      reference_id: referenceId,
      description,
      status: SpecialistTransactionStatus.COMPLETED,
      performed_by: specialistId,
    });

    return transaction;
  }

  /**
   * Check if specialist has sufficient balance
   */
  async hasSufficientBalance(
    specialistId: Types.ObjectId,
    amount: number,
  ): Promise<boolean> {
    const wallet = await this.getWallet(specialistId);
    return wallet.available_balance >= amount;
  }

  /**
   * Admin: Credit specialist wallet
   */
  async adminCredit(
    specialistId: Types.ObjectId,
    amount: number,
    description: string,
    adminId: Types.ObjectId,
    notes?: string,
  ): Promise<SpecialistWalletTransactionDocument> {
    const transaction = await this.credit(
      specialistId,
      amount,
      SpecialistTransactionReference.ADMIN_ADJUSTMENT,
      null,
      description,
      undefined,
      adminId,
    );

    if (notes) {
      await this.transactionModel.updateOne(
        { _id: transaction._id },
        { notes },
      );
    }

    return transaction;
  }

  /**
   * Admin: Debit specialist wallet
   */
  async adminDebit(
    specialistId: Types.ObjectId,
    amount: number,
    description: string,
    adminId: Types.ObjectId,
    notes?: string,
  ): Promise<SpecialistWalletTransactionDocument> {
    const wallet = await this.getWallet(specialistId);

    if (wallet.available_balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const transaction = await this.debit(
      specialistId,
      amount,
      SpecialistTransactionReference.ADMIN_ADJUSTMENT,
      null,
      description,
      adminId,
    );

    if (notes) {
      await this.transactionModel.updateOne(
        { _id: transaction._id },
        { notes },
      );
    }

    return transaction;
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(specialistId: Types.ObjectId) {
    const wallet = await this.getWallet(specialistId);

    const [
      totalTransactions,
      transactionsThisMonth,
      creditsThisMonth,
      debitsThisMonth,
    ] = await Promise.all([
      this.transactionModel.countDocuments({ specialist_id: specialistId }),
      this.transactionModel.countDocuments({
        specialist_id: specialistId,
        created_at: { $gte: moment().startOf('month').toDate() },
      }),
      this.transactionModel.aggregate([
        {
          $match: {
            specialist_id: new Types.ObjectId(specialistId),
            type: SpecialistTransactionType.CREDIT,
            created_at: { $gte: moment().startOf('month').toDate() },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.transactionModel.aggregate([
        {
          $match: {
            specialist_id: new Types.ObjectId(specialistId),
            type: SpecialistTransactionType.DEBIT,
            status: SpecialistTransactionStatus.COMPLETED,
            created_at: { $gte: moment().startOf('month').toDate() },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      balance: {
        available: wallet.available_balance,
        held: wallet.held_balance,
        total: currency(wallet.available_balance).add(wallet.held_balance).value,
      },
      lifetime: {
        total_credited: wallet.total_credited,
        total_debited: wallet.total_debited,
      },
      this_month: {
        credited: creditsThisMonth[0]?.total || 0,
        debited: debitsThisMonth[0]?.total || 0,
        transactions: transactionsThisMonth,
      },
      total_transactions: totalTransactions,
      last_transaction_at: wallet.last_transaction_at,
    };
  }
}
