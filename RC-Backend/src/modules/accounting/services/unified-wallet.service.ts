/**
 * Unified Wallet Service
 *
 * Manages wallet operations using double-entry accounting.
 * All balance changes are recorded through the ledger.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';

import {
  UnifiedWallet,
  UnifiedWalletDocument,
} from '../entities/unified-wallet.entity';
import {
  LedgerEntry,
  LedgerEntryDocument,
} from '../entities/ledger-entry.entity';
import { AccountingService } from './accounting.service';
import {
  AccountCode,
  EntryType,
  TransactionCategory,
  WalletOwnerType,
  WalletStatus,
} from '../enums/account-codes.enum';
import {
  CreateWalletDto,
  CreditWalletDto,
  DebitWalletDto,
  HoldFundsDto,
  ReleaseFundsDto,
  TransferFundsDto,
  AdminAdjustmentDto,
  WalletBalanceResponse,
  WalletTransactionsQueryDto,
} from '../dto/wallet-operations.dto';
import { TransactionBatchDocument } from '../entities/transaction-batch.entity';

export interface PaginatedTransactions {
  transactions: LedgerEntryDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UnifiedWalletService {
  private readonly logger = new Logger(UnifiedWalletService.name);

  constructor(
    @InjectModel(UnifiedWallet.name)
    private walletModel: Model<UnifiedWalletDocument>,
    @InjectModel(LedgerEntry.name)
    private ledgerEntryModel: Model<LedgerEntryDocument>,
    private accountingService: AccountingService,
  ) {}

  /**
   * Generate a unique wallet ID
   */
  private generateWalletId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'WLT-';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get the appropriate liability account code for a wallet owner type
   */
  private getLiabilityAccountCode(ownerType: WalletOwnerType): string {
    switch (ownerType) {
      case WalletOwnerType.PATIENT:
        return AccountCode.LIABILITY_PATIENT_WALLETS;
      case WalletOwnerType.SPECIALIST:
        return AccountCode.LIABILITY_SPECIALIST_WALLETS;
      default:
        throw new BadRequestException(`Unsupported owner type: ${ownerType}`);
    }
  }

  /**
   * Get the appropriate pool account code for a wallet owner type
   */
  private getPoolAccountCode(ownerType: WalletOwnerType): string {
    switch (ownerType) {
      case WalletOwnerType.PATIENT:
        return AccountCode.PATIENT_WALLET_POOL;
      case WalletOwnerType.SPECIALIST:
        return AccountCode.SPECIALIST_WALLET_POOL;
      default:
        throw new BadRequestException(`Unsupported owner type: ${ownerType}`);
    }
  }

  /**
   * Create a new wallet for a user
   */
  async createWallet(dto: CreateWalletDto): Promise<UnifiedWalletDocument> {
    // Check if wallet already exists for this owner
    const existing = await this.walletModel.findOne({
      owner_id: dto.owner_id,
      owner_type: dto.owner_type,
    });

    if (existing) {
      throw new ConflictException(
        `Wallet already exists for ${dto.owner_type} ${dto.owner_id}`,
      );
    }

    const wallet = await this.walletModel.create({
      wallet_id: this.generateWalletId(),
      owner_id: dto.owner_id,
      owner_type: dto.owner_type,
      currency: dto.currency || 'NGN',
      available_balance: 0,
      held_balance: 0,
      pending_balance: 0,
      total_credited: 0,
      total_debited: 0,
      total_held: 0,
      total_released: 0,
      status: WalletStatus.ACTIVE,
      daily_withdrawal_limit: 500000, // ₦500,000 default
      daily_withdrawn_today: 0,
      single_transaction_limit: 200000, // ₦200,000 default
      requires_pin: false,
      failed_pin_attempts: 0,
      transaction_count: 0,
    });

    this.logger.log(
      `Created wallet ${wallet.wallet_id} for ${dto.owner_type} ${dto.owner_id}`,
    );
    return wallet;
  }

  /**
   * Get wallet by wallet_id
   */
  async getWallet(walletId: string): Promise<UnifiedWalletDocument> {
    const wallet = await this.walletModel.findOne({ wallet_id: walletId });
    if (!wallet) {
      throw new NotFoundException(`Wallet not found: ${walletId}`);
    }
    return wallet;
  }

  /**
   * Get wallet by owner
   */
  async getWalletByOwner(
    ownerId: Types.ObjectId,
    ownerType: WalletOwnerType,
  ): Promise<UnifiedWalletDocument | null> {
    return this.walletModel.findOne({
      owner_id: ownerId,
      owner_type: ownerType,
    });
  }

  /**
   * Get or create wallet for a user
   */
  async getOrCreateWallet(
    ownerId: Types.ObjectId,
    ownerType: WalletOwnerType,
  ): Promise<UnifiedWalletDocument> {
    let wallet = await this.getWalletByOwner(ownerId, ownerType);
    if (!wallet) {
      wallet = await this.createWallet({
        owner_id: ownerId,
        owner_type: ownerType,
      });
    }
    return wallet;
  }

  /**
   * Credit wallet (add funds)
   *
   * Creates a batch with:
   * - DEBIT to Cash (Paystack or Bank)
   * - CREDIT to Wallet Liability
   */
  async credit(dto: CreditWalletDto): Promise<TransactionBatchDocument> {
    const wallet = await this.getWallet(dto.wallet_id);
    this.validateWalletActive(wallet);

    const liabilityAccount = this.getLiabilityAccountCode(wallet.owner_type);
    const category = dto.category || TransactionCategory.WALLET_TOPUP;

    // Determine source account based on category
    let sourceAccount = AccountCode.CASH_PAYSTACK;
    if (category === TransactionCategory.ADMIN_CREDIT) {
      sourceAccount = AccountCode.OPENING_BALANCE;
    }

    const batch = await this.accountingService.createAndPostBatch({
      category,
      description: dto.description,
      entries: [
        {
          account_code: sourceAccount,
          entry_type: EntryType.DEBIT,
          amount: dto.amount,
          description: dto.description,
          user_id: wallet.owner_id,
          wallet_id: new Types.ObjectId(wallet._id.toString()),
        },
        {
          account_code: liabilityAccount,
          entry_type: EntryType.CREDIT,
          amount: dto.amount,
          description: dto.description,
          user_id: wallet.owner_id,
          wallet_id: new Types.ObjectId(wallet._id.toString()),
        },
      ],
      to_user: wallet.owner_id,
      to_wallet: new Types.ObjectId(wallet._id.toString()),
      reference_type: dto.reference_type,
      reference_id: dto.reference_id,
      external_reference: dto.external_reference,
      performed_by: dto.performed_by,
      ip_address: dto.ip_address,
      metadata: dto.metadata,
    });

    // Update wallet balance
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        $inc: {
          available_balance: dto.amount,
          total_credited: dto.amount,
          transaction_count: 1,
        },
        $set: {
          last_credit_at: new Date(),
          last_transaction_at: new Date(),
        },
      },
    );

    this.logger.log(
      `Credited wallet ${dto.wallet_id} with ₦${dto.amount}. Batch: ${batch.batch_id}`,
    );
    return batch;
  }

  /**
   * Debit wallet (remove funds)
   *
   * Creates a batch with:
   * - DEBIT to Wallet Liability
   * - CREDIT to destination account
   */
  async debit(dto: DebitWalletDto): Promise<TransactionBatchDocument> {
    const wallet = await this.getWallet(dto.wallet_id);
    this.validateWalletActive(wallet);

    // Check sufficient balance
    if (!dto.allow_negative && wallet.available_balance < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ₦${wallet.available_balance}, Required: ₦${dto.amount}`,
      );
    }

    const liabilityAccount = this.getLiabilityAccountCode(wallet.owner_type);
    const category = dto.category || TransactionCategory.WALLET_WITHDRAWAL;

    // Determine destination account based on category
    let destinationAccount = AccountCode.CASH_BANK_NGN;
    if (category === TransactionCategory.PHARMACY_ORDER_PAYMENT) {
      destinationAccount = AccountCode.PAYABLE_PHARMACY;
    } else if (category === TransactionCategory.AI_SUMMARY_PURCHASE) {
      destinationAccount = AccountCode.REVENUE_AI_SUMMARY;
    } else if (category === TransactionCategory.SUBSCRIPTION_PAYMENT) {
      destinationAccount = AccountCode.REVENUE_SUBSCRIPTION;
    } else if (category === TransactionCategory.APPOINTMENT_PAYMENT) {
      destinationAccount = AccountCode.REVENUE_APPOINTMENT_FEE;
    } else if (category === TransactionCategory.ADMIN_DEBIT) {
      destinationAccount = AccountCode.OPENING_BALANCE;
    }

    const batch = await this.accountingService.createAndPostBatch({
      category,
      description: dto.description,
      entries: [
        {
          account_code: liabilityAccount,
          entry_type: EntryType.DEBIT,
          amount: dto.amount,
          description: dto.description,
          user_id: wallet.owner_id,
          wallet_id: new Types.ObjectId(wallet._id.toString()),
        },
        {
          account_code: destinationAccount,
          entry_type: EntryType.CREDIT,
          amount: dto.amount,
          description: dto.description,
          user_id: wallet.owner_id,
          wallet_id: new Types.ObjectId(wallet._id.toString()),
        },
      ],
      from_user: wallet.owner_id,
      from_wallet: new Types.ObjectId(wallet._id.toString()),
      reference_type: dto.reference_type,
      reference_id: dto.reference_id,
      external_reference: dto.external_reference,
      performed_by: dto.performed_by,
      ip_address: dto.ip_address,
      metadata: dto.metadata,
    });

    // Update wallet balance
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        $inc: {
          available_balance: -dto.amount,
          total_debited: dto.amount,
          transaction_count: 1,
        },
        $set: {
          last_debit_at: new Date(),
          last_transaction_at: new Date(),
        },
      },
    );

    this.logger.log(
      `Debited wallet ${dto.wallet_id} by ₦${dto.amount}. Batch: ${batch.batch_id}`,
    );
    return batch;
  }

  /**
   * Hold funds (for specialists awaiting prescription payment)
   *
   * Creates a batch with:
   * - DEBIT to Specialist Wallet Liability
   * - CREDIT to Specialist Held Liability
   */
  async hold(dto: HoldFundsDto): Promise<TransactionBatchDocument> {
    const wallet = await this.getWallet(dto.wallet_id);
    this.validateWalletActive(wallet);

    if (wallet.owner_type !== WalletOwnerType.SPECIALIST) {
      throw new BadRequestException('Hold operation only available for specialists');
    }

    if (wallet.available_balance < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ₦${wallet.available_balance}, Required: ₦${dto.amount}`,
      );
    }

    const batch = await this.accountingService.createAndPostBatch({
      category: TransactionCategory.SPECIALIST_HOLD,
      description: dto.description,
      entries: [
        {
          account_code: AccountCode.LIABILITY_SPECIALIST_WALLETS,
          entry_type: EntryType.DEBIT,
          amount: dto.amount,
          description: dto.description,
          user_id: wallet.owner_id,
          wallet_id: new Types.ObjectId(wallet._id.toString()),
        },
        {
          account_code: AccountCode.LIABILITY_SPECIALIST_HELD,
          entry_type: EntryType.CREDIT,
          amount: dto.amount,
          description: dto.description,
          user_id: wallet.owner_id,
          wallet_id: new Types.ObjectId(wallet._id.toString()),
        },
      ],
      from_user: wallet.owner_id,
      from_wallet: new Types.ObjectId(wallet._id.toString()),
      reference_type: dto.reference_type,
      reference_id: dto.reference_id,
      performed_by: dto.performed_by,
      metadata: {
        expires_at: dto.expires_at,
      },
    });

    // Update wallet balances
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        $inc: {
          available_balance: -dto.amount,
          held_balance: dto.amount,
          total_held: dto.amount,
          transaction_count: 1,
        },
        $set: {
          last_transaction_at: new Date(),
        },
      },
    );

    this.logger.log(
      `Held ₦${dto.amount} from wallet ${dto.wallet_id}. Batch: ${batch.batch_id}`,
    );
    return batch;
  }

  /**
   * Release held funds (cancel hold, return to available)
   *
   * Creates a batch with:
   * - DEBIT to Specialist Held Liability
   * - CREDIT to Specialist Wallet Liability
   */
  async release(dto: ReleaseFundsDto): Promise<TransactionBatchDocument> {
    const wallet = await this.getWallet(dto.wallet_id);

    // Find the original hold batch to get the amount
    const holdBatch = await this.accountingService.getBatch(
      dto.hold_reference_type,
    );

    // For now, we'll need to find the hold by reference
    const holdEntries = await this.ledgerEntryModel.find({
      wallet_id: wallet._id,
      reference_type: dto.hold_reference_type,
      reference_id: dto.hold_reference_id,
      account_code: AccountCode.LIABILITY_SPECIALIST_HELD,
      entry_type: EntryType.CREDIT,
      status: 'POSTED',
    });

    if (holdEntries.length === 0) {
      throw new NotFoundException('Hold not found for the given reference');
    }

    const holdAmount = holdEntries.reduce((sum, entry) => sum + entry.amount, 0);

    const batch = await this.accountingService.createAndPostBatch({
      category: TransactionCategory.SPECIALIST_RELEASE,
      description: dto.reason || 'Release held funds',
      entries: [
        {
          account_code: AccountCode.LIABILITY_SPECIALIST_HELD,
          entry_type: EntryType.DEBIT,
          amount: holdAmount,
          description: dto.reason || 'Release held funds',
          user_id: wallet.owner_id,
          wallet_id: new Types.ObjectId(wallet._id.toString()),
        },
        {
          account_code: AccountCode.LIABILITY_SPECIALIST_WALLETS,
          entry_type: EntryType.CREDIT,
          amount: holdAmount,
          description: dto.reason || 'Release held funds',
          user_id: wallet.owner_id,
          wallet_id: new Types.ObjectId(wallet._id.toString()),
        },
      ],
      to_user: wallet.owner_id,
      to_wallet: new Types.ObjectId(wallet._id.toString()),
      reference_type: dto.hold_reference_type,
      reference_id: dto.hold_reference_id,
      performed_by: dto.performed_by,
    });

    // Update wallet balances
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        $inc: {
          available_balance: holdAmount,
          held_balance: -holdAmount,
          total_released: holdAmount,
          transaction_count: 1,
        },
        $set: {
          last_transaction_at: new Date(),
        },
      },
    );

    this.logger.log(
      `Released ₦${holdAmount} to wallet ${dto.wallet_id}. Batch: ${batch.batch_id}`,
    );
    return batch;
  }

  /**
   * Confirm held funds (transfer to platform/recipient)
   *
   * Creates a batch with:
   * - DEBIT to Specialist Held Liability
   * - CREDIT to destination (Revenue/Payable)
   */
  async confirmHold(
    walletId: string,
    referenceType: string,
    referenceId: Types.ObjectId,
    options: {
      commission_rate?: number;
      description?: string;
      performed_by?: Types.ObjectId;
    } = {},
  ): Promise<TransactionBatchDocument> {
    const wallet = await this.getWallet(walletId);

    // Find the held amount
    const holdEntries = await this.ledgerEntryModel.find({
      wallet_id: wallet._id,
      reference_type: referenceType,
      reference_id: referenceId,
      account_code: AccountCode.LIABILITY_SPECIALIST_HELD,
      entry_type: EntryType.CREDIT,
      status: 'POSTED',
    });

    if (holdEntries.length === 0) {
      throw new NotFoundException('Hold not found for the given reference');
    }

    const holdAmount = holdEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const commissionRate = options.commission_rate || 0;
    const commissionAmount = Math.round(holdAmount * (commissionRate / 100));
    const settleAmount = holdAmount - commissionAmount;

    const entries = [
      {
        account_code: AccountCode.LIABILITY_SPECIALIST_HELD,
        entry_type: EntryType.DEBIT,
        amount: holdAmount,
        description: options.description || 'Settle held funds',
        user_id: wallet.owner_id,
        wallet_id: new Types.ObjectId(wallet._id.toString()),
      },
    ];

    // Settlement to payable (pharmacy or other)
    if (settleAmount > 0) {
      entries.push({
        account_code: AccountCode.PAYABLE_PHARMACY,
        entry_type: EntryType.CREDIT,
        amount: settleAmount,
        description: `Settlement for ${referenceType}`,
        user_id: wallet.owner_id,
        wallet_id: new Types.ObjectId(wallet._id.toString()),
      });
    }

    // Platform commission
    if (commissionAmount > 0) {
      entries.push({
        account_code: AccountCode.REVENUE_PLATFORM_COMMISSION,
        entry_type: EntryType.CREDIT,
        amount: commissionAmount,
        description: `Commission (${commissionRate}%)`,
        user_id: wallet.owner_id,
        wallet_id: new Types.ObjectId(wallet._id.toString()),
      });
    }

    const batch = await this.accountingService.createAndPostBatch({
      category: TransactionCategory.SPECIALIST_SETTLE,
      description: options.description || 'Settle held funds',
      entries,
      from_user: wallet.owner_id,
      from_wallet: new Types.ObjectId(wallet._id.toString()),
      reference_type: referenceType,
      reference_id: referenceId,
      performed_by: options.performed_by,
      metadata: {
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
      },
    });

    // Update wallet balances
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        $inc: {
          held_balance: -holdAmount,
          transaction_count: 1,
        },
        $set: {
          last_transaction_at: new Date(),
        },
      },
    );

    this.logger.log(
      `Settled ₦${holdAmount} from wallet ${walletId} (commission: ₦${commissionAmount}). Batch: ${batch.batch_id}`,
    );
    return batch;
  }

  /**
   * Transfer funds between wallets
   */
  async transfer(dto: TransferFundsDto): Promise<TransactionBatchDocument> {
    const fromWallet = await this.getWallet(dto.from_wallet_id);
    const toWallet = await this.getWallet(dto.to_wallet_id);

    this.validateWalletActive(fromWallet);
    this.validateWalletActive(toWallet);

    if (fromWallet.available_balance < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ₦${fromWallet.available_balance}, Required: ₦${dto.amount}`,
      );
    }

    const fromLiability = this.getLiabilityAccountCode(fromWallet.owner_type);
    const toLiability = this.getLiabilityAccountCode(toWallet.owner_type);

    const commissionRate = dto.commission_rate || 0;
    const commissionAmount = Math.round(dto.amount * (commissionRate / 100));
    const transferAmount = dto.amount - commissionAmount;

    const entries = [
      {
        account_code: fromLiability,
        entry_type: EntryType.DEBIT,
        amount: dto.amount,
        description: dto.description,
        user_id: fromWallet.owner_id,
        wallet_id: new Types.ObjectId(fromWallet._id.toString()),
      },
      {
        account_code: toLiability,
        entry_type: EntryType.CREDIT,
        amount: transferAmount,
        description: dto.description,
        user_id: toWallet.owner_id,
        wallet_id: new Types.ObjectId(toWallet._id.toString()),
      },
    ];

    // Add commission entry if applicable
    if (commissionAmount > 0) {
      entries.push({
        account_code: AccountCode.REVENUE_PLATFORM_COMMISSION,
        entry_type: EntryType.CREDIT,
        amount: commissionAmount,
        description: `Transfer commission (${commissionRate}%)`,
        user_id: fromWallet.owner_id,
        wallet_id: new Types.ObjectId(fromWallet._id.toString()),
      });
    }

    const batch = await this.accountingService.createAndPostBatch({
      category: TransactionCategory.WALLET_TRANSFER,
      description: dto.description,
      entries,
      from_user: fromWallet.owner_id,
      from_wallet: new Types.ObjectId(fromWallet._id.toString()),
      to_user: toWallet.owner_id,
      to_wallet: new Types.ObjectId(toWallet._id.toString()),
      reference_type: dto.reference_type,
      reference_id: dto.reference_id,
      performed_by: dto.performed_by,
      metadata: {
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
      },
    });

    // Update wallet balances
    await this.walletModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: fromWallet._id },
          update: {
            $inc: {
              available_balance: -dto.amount,
              total_debited: dto.amount,
              transaction_count: 1,
            },
            $set: {
              last_debit_at: new Date(),
              last_transaction_at: new Date(),
            },
          },
        },
      },
      {
        updateOne: {
          filter: { _id: toWallet._id },
          update: {
            $inc: {
              available_balance: transferAmount,
              total_credited: transferAmount,
              transaction_count: 1,
            },
            $set: {
              last_credit_at: new Date(),
              last_transaction_at: new Date(),
            },
          },
        },
      },
    ]);

    this.logger.log(
      `Transferred ₦${transferAmount} from ${dto.from_wallet_id} to ${dto.to_wallet_id}. Batch: ${batch.batch_id}`,
    );
    return batch;
  }

  /**
   * Admin adjustment (credit or debit)
   */
  async adminAdjustment(dto: AdminAdjustmentDto): Promise<TransactionBatchDocument> {
    const wallet = await this.getWallet(dto.wallet_id);

    if (dto.amount > 0) {
      return this.credit({
        wallet_id: dto.wallet_id,
        amount: dto.amount,
        category: TransactionCategory.ADMIN_CREDIT,
        description: `Admin adjustment: ${dto.reason}`,
        performed_by: dto.admin_id,
        metadata: {
          admin_notes: dto.notes,
          adjustment_reason: dto.reason,
        },
      });
    } else {
      return this.debit({
        wallet_id: dto.wallet_id,
        amount: Math.abs(dto.amount),
        category: TransactionCategory.ADMIN_DEBIT,
        description: `Admin adjustment: ${dto.reason}`,
        performed_by: dto.admin_id,
        allow_negative: true,
        metadata: {
          admin_notes: dto.notes,
          adjustment_reason: dto.reason,
        },
      });
    }
  }

  /**
   * Get wallet balance summary
   */
  async getBalance(walletId: string): Promise<WalletBalanceResponse> {
    const wallet = await this.getWallet(walletId);

    return {
      wallet_id: wallet.wallet_id,
      owner_type: wallet.owner_type,
      available_balance: wallet.available_balance,
      held_balance: wallet.held_balance,
      pending_balance: wallet.pending_balance,
      total_balance:
        wallet.available_balance + wallet.held_balance + wallet.pending_balance,
      currency: wallet.currency,
      last_transaction_at: wallet.last_transaction_at,
    };
  }

  /**
   * Get transaction history for a wallet
   */
  async getTransactionHistory(
    walletId: string,
    query: WalletTransactionsQueryDto,
  ): Promise<PaginatedTransactions> {
    const wallet = await this.getWallet(walletId);

    const filter: any = {
      wallet_id: wallet._id,
    };

    if (query.category) {
      // Need to join with batch to filter by category
      // For now, we'll filter after fetching
    }

    if (query.start_date || query.end_date) {
      filter.created_at = {};
      if (query.start_date) {
        filter.created_at.$gte = query.start_date;
      }
      if (query.end_date) {
        filter.created_at.$lte = query.end_date;
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.ledgerEntryModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      this.ledgerEntryModel.countDocuments(filter),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Freeze a wallet
   */
  async freezeWallet(
    walletId: string,
    reason: string,
    adminId: Types.ObjectId,
  ): Promise<void> {
    const wallet = await this.getWallet(walletId);

    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        $set: {
          status: WalletStatus.FROZEN,
          status_reason: reason,
          status_changed_at: new Date(),
          status_changed_by: adminId,
        },
      },
    );

    this.logger.log(`Wallet ${walletId} frozen. Reason: ${reason}`);
  }

  /**
   * Unfreeze a wallet
   */
  async unfreezeWallet(walletId: string, adminId: Types.ObjectId): Promise<void> {
    const wallet = await this.getWallet(walletId);

    if (wallet.status !== WalletStatus.FROZEN) {
      throw new BadRequestException('Wallet is not frozen');
    }

    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        $set: {
          status: WalletStatus.ACTIVE,
          status_reason: null,
          status_changed_at: new Date(),
          status_changed_by: adminId,
        },
      },
    );

    this.logger.log(`Wallet ${walletId} unfrozen`);
  }

  /**
   * Suspend a wallet
   */
  async suspendWallet(
    walletId: string,
    reason: string,
    adminId: Types.ObjectId,
  ): Promise<void> {
    const wallet = await this.getWallet(walletId);

    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        $set: {
          status: WalletStatus.SUSPENDED,
          status_reason: reason,
          status_changed_at: new Date(),
          status_changed_by: adminId,
        },
      },
    );

    this.logger.log(`Wallet ${walletId} suspended. Reason: ${reason}`);
  }

  /**
   * Validate wallet is active
   */
  private validateWalletActive(wallet: UnifiedWalletDocument): void {
    if (wallet.status === WalletStatus.FROZEN) {
      throw new BadRequestException('Wallet is frozen');
    }
    if (wallet.status === WalletStatus.SUSPENDED) {
      throw new BadRequestException('Wallet is suspended');
    }
    if (wallet.status === WalletStatus.CLOSED) {
      throw new BadRequestException('Wallet is closed');
    }
  }

  /**
   * Backward compatibility: Debit wallet for purchase
   * Maps to the old WalletsService.debitWalletForPurchase() interface
   */
  async debitWalletForPurchase(
    ownerId: Types.ObjectId,
    ownerType: WalletOwnerType,
    amount: number,
    description: string,
    referenceType: string,
    referenceId: Types.ObjectId,
    metadata?: Record<string, any>,
  ): Promise<TransactionBatchDocument> {
    const wallet = await this.getOrCreateWallet(ownerId, ownerType);

    return this.debit({
      wallet_id: wallet.wallet_id,
      amount,
      description,
      category: TransactionCategory.PHARMACY_ORDER_PAYMENT,
      reference_type: referenceType,
      reference_id: referenceId,
      metadata,
    });
  }

  /**
   * Backward compatibility: Get user earnings (for specialists)
   * Maps to the old WalletsService.getUserEarnings() interface
   */
  async getUserEarnings(
    ownerId: Types.ObjectId,
    ownerType: WalletOwnerType,
  ): Promise<{
    total_earnings: number;
    available_balance: number;
    held_balance: number;
    pending_balance: number;
  }> {
    const wallet = await this.getWalletByOwner(ownerId, ownerType);

    if (!wallet) {
      return {
        total_earnings: 0,
        available_balance: 0,
        held_balance: 0,
        pending_balance: 0,
      };
    }

    return {
      total_earnings: wallet.total_credited,
      available_balance: wallet.available_balance,
      held_balance: wallet.held_balance,
      pending_balance: wallet.pending_balance,
    };
  }
}
