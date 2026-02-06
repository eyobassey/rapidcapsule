/**
 * Accounting Service - Core Ledger Operations
 *
 * Handles creation, posting, and reversal of transaction batches.
 * Ensures double-entry accounting principles are maintained.
 */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import * as moment from 'moment';
import * as currency from 'currency.js';

import { Account, AccountDocument } from '../entities/account.entity';
import { LedgerEntry, LedgerEntryDocument } from '../entities/ledger-entry.entity';
import {
  TransactionBatch,
  TransactionBatchDocument,
} from '../entities/transaction-batch.entity';
import {
  EntryType,
  EntryStatus,
  BatchStatus,
  NormalBalance,
  AccountCode,
  TransactionCategory,
  getAccountTypeFromCode,
  getNormalBalance,
} from '../enums/account-codes.enum';
import { CreateBatchDto, CreateEntryDto, ReverseBatchDto } from '../dto/create-batch.dto';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
    @InjectModel(LedgerEntry.name)
    private ledgerEntryModel: Model<LedgerEntryDocument>,
    @InjectModel(TransactionBatch.name)
    private batchModel: Model<TransactionBatchDocument>,
  ) {}

  /**
   * Generate unique batch ID: TB-YYYYMMDD-XXXXXX
   */
  private async generateBatchId(): Promise<string> {
    const today = moment().format('YYYYMMDD');
    const prefix = `TB-${today}-`;

    const lastBatch = await this.batchModel
      .findOne({ batch_id: { $regex: `^${prefix}` } })
      .sort({ batch_id: -1 })
      .lean();

    let sequence = 1;
    if (lastBatch) {
      const lastSequence = parseInt(lastBatch.batch_id.split('-').pop() || '0', 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }

  /**
   * Generate unique entry ID: LE-YYYYMMDD-XXXXXX
   */
  private async generateEntryId(): Promise<string> {
    const today = moment().format('YYYYMMDD');
    const prefix = `LE-${today}-`;

    const lastEntry = await this.ledgerEntryModel
      .findOne({ entry_id: { $regex: `^${prefix}` } })
      .sort({ entry_id: -1 })
      .lean();

    let sequence = 1;
    if (lastEntry) {
      const lastSequence = parseInt(lastEntry.entry_id.split('-').pop() || '0', 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }

  /**
   * Create a transaction batch with entries
   * The batch is created in PENDING status and must be posted separately
   */
  async createBatch(dto: CreateBatchDto): Promise<TransactionBatchDocument> {
    // Validate entries
    if (!dto.entries || dto.entries.length === 0) {
      throw new BadRequestException('Batch must have at least one entry');
    }

    // Validate all account codes exist
    const accountCodes = [...new Set(dto.entries.map((e) => e.account_code))];
    const accounts = await this.accountModel.find({ code: { $in: accountCodes } }).lean();
    const accountMap = new Map(accounts.map((a) => [a.code, a]));

    for (const code of accountCodes) {
      if (!accountMap.has(code)) {
        throw new BadRequestException(`Account code not found: ${code}`);
      }
    }

    // Calculate totals
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of dto.entries) {
      if (entry.entry_type === EntryType.DEBIT) {
        totalDebits = currency(totalDebits).add(entry.amount).value;
      } else {
        totalCredits = currency(totalCredits).add(entry.amount).value;
      }
    }

    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Allow for rounding

    // Generate batch ID
    const batchId = await this.generateBatchId();

    // Create the batch
    const batch = await this.batchModel.create({
      batch_id: batchId,
      category: dto.category,
      description: dto.description,
      total_debits: totalDebits,
      total_credits: totalCredits,
      is_balanced: isBalanced,
      entry_count: dto.entries.length,
      currency: 'NGN',
      status: BatchStatus.PENDING,
      from_user: dto.from_user,
      from_name: dto.from_name,
      from_wallet: dto.from_wallet,
      to_user: dto.to_user,
      to_name: dto.to_name,
      to_wallet: dto.to_wallet,
      reference_type: dto.reference_type,
      reference_id: dto.reference_id,
      external_reference: dto.external_reference,
      performed_by: dto.performed_by,
      ip_address: dto.ip_address,
      notes: dto.notes,
      metadata: dto.metadata,
    });

    return batch;
  }

  /**
   * Post a batch - creates ledger entries and updates account balances
   * Uses transactions for atomicity
   */
  async postBatch(batchId: string, session?: ClientSession): Promise<TransactionBatchDocument> {
    const batch = await this.batchModel.findOne({ batch_id: batchId });

    if (!batch) {
      throw new NotFoundException(`Batch not found: ${batchId}`);
    }

    if (batch.status !== BatchStatus.PENDING) {
      throw new BadRequestException(`Batch is not in PENDING status: ${batch.status}`);
    }

    if (!batch.is_balanced) {
      throw new BadRequestException(
        `Batch is not balanced. Debits: ${batch.total_debits}, Credits: ${batch.total_credits}`,
      );
    }

    // This method is called after entries are created
    // Update batch status to POSTED
    batch.status = BatchStatus.POSTED;
    batch.posted_at = new Date();
    await batch.save({ session });

    return batch;
  }

  /**
   * Create a single ledger entry
   * Updates the account balance atomically
   */
  async createEntry(
    batchId: string,
    dto: CreateEntryDto,
    session?: ClientSession,
  ): Promise<LedgerEntryDocument> {
    // Get account
    const account = await this.accountModel.findOne({ code: dto.account_code });
    if (!account) {
      throw new NotFoundException(`Account not found: ${dto.account_code}`);
    }

    // Generate entry ID
    const entryId = await this.generateEntryId();

    // Calculate new balance
    const balanceBefore = account.current_balance;
    let balanceAfter: number;

    // Apply double-entry logic:
    // - Assets and Expenses increase with DEBIT
    // - Liabilities, Equity, and Revenue increase with CREDIT
    if (account.normal_balance === NormalBalance.DEBIT) {
      // Asset or Expense account
      if (dto.entry_type === EntryType.DEBIT) {
        balanceAfter = currency(balanceBefore).add(dto.amount).value;
      } else {
        balanceAfter = currency(balanceBefore).subtract(dto.amount).value;
      }
    } else {
      // Liability, Equity, or Revenue account
      if (dto.entry_type === EntryType.CREDIT) {
        balanceAfter = currency(balanceBefore).add(dto.amount).value;
      } else {
        balanceAfter = currency(balanceBefore).subtract(dto.amount).value;
      }
    }

    // Create entry
    const entry = await this.ledgerEntryModel.create(
      [
        {
          entry_id: entryId,
          batch_id: batchId,
          account_code: dto.account_code,
          account_name: account.name,
          entry_type: dto.entry_type,
          amount: dto.amount,
          currency: 'NGN',
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: dto.description,
          status: EntryStatus.POSTED,
          user_id: dto.user_id,
          wallet_id: dto.wallet_id,
        },
      ],
      { session },
    );

    // Update account balance
    await this.accountModel.updateOne(
      { _id: account._id },
      {
        current_balance: balanceAfter,
        balance_updated_at: new Date(),
      },
      { session },
    );

    return entry[0];
  }

  /**
   * Create batch and entries in one operation
   * This is the main method for creating transactions
   */
  async createAndPostBatch(dto: CreateBatchDto): Promise<TransactionBatchDocument> {
    // Validate balance
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of dto.entries) {
      if (entry.entry_type === EntryType.DEBIT) {
        totalDebits = currency(totalDebits).add(entry.amount).value;
      } else {
        totalCredits = currency(totalCredits).add(entry.amount).value;
      }
    }

    if (Math.abs(totalDebits - totalCredits) >= 0.01) {
      throw new BadRequestException(
        `Batch is not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`,
      );
    }

    // Validate all accounts exist
    const accountCodes = [...new Set(dto.entries.map((e) => e.account_code))];
    const accounts = await this.accountModel.find({ code: { $in: accountCodes } }).lean();

    if (accounts.length !== accountCodes.length) {
      const foundCodes = accounts.map((a) => a.code);
      const missingCodes = accountCodes.filter((c) => !foundCodes.includes(c));
      throw new BadRequestException(`Account codes not found: ${missingCodes.join(', ')}`);
    }

    // Generate batch ID
    const batchId = await this.generateBatchId();

    // Create batch
    const batch = await this.batchModel.create({
      batch_id: batchId,
      category: dto.category,
      description: dto.description,
      total_debits: totalDebits,
      total_credits: totalCredits,
      is_balanced: true,
      entry_count: dto.entries.length,
      currency: 'NGN',
      status: BatchStatus.POSTED,
      from_user: dto.from_user,
      from_name: dto.from_name,
      from_wallet: dto.from_wallet,
      to_user: dto.to_user,
      to_name: dto.to_name,
      to_wallet: dto.to_wallet,
      reference_type: dto.reference_type,
      reference_id: dto.reference_id,
      external_reference: dto.external_reference,
      performed_by: dto.performed_by,
      ip_address: dto.ip_address,
      notes: dto.notes,
      metadata: dto.metadata,
      posted_at: new Date(),
    });

    // Create entries
    const accountMap = new Map(accounts.map((a) => [a.code, a]));

    for (const entryDto of dto.entries) {
      const account = accountMap.get(entryDto.account_code);

      if (!account) {
        throw new BadRequestException(`Account not found: ${entryDto.account_code}`);
      }

      // Generate entry ID
      const entryId = await this.generateEntryId();

      // Calculate new balance
      const balanceBefore = account.current_balance;
      let balanceAfter: number;

      if (account.normal_balance === NormalBalance.DEBIT) {
        if (entryDto.entry_type === EntryType.DEBIT) {
          balanceAfter = currency(balanceBefore).add(entryDto.amount).value;
        } else {
          balanceAfter = currency(balanceBefore).subtract(entryDto.amount).value;
        }
      } else {
        if (entryDto.entry_type === EntryType.CREDIT) {
          balanceAfter = currency(balanceBefore).add(entryDto.amount).value;
        } else {
          balanceAfter = currency(balanceBefore).subtract(entryDto.amount).value;
        }
      }

      // Create entry
      await this.ledgerEntryModel.create({
        entry_id: entryId,
        batch_id: batchId,
        account_code: entryDto.account_code,
        account_name: account.name,
        entry_type: entryDto.entry_type,
        amount: entryDto.amount,
        currency: 'NGN',
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: entryDto.description,
        status: EntryStatus.POSTED,
        user_id: entryDto.user_id,
        wallet_id: entryDto.wallet_id,
        reference_type: dto.reference_type,
        reference_id: dto.reference_id,
        external_reference: dto.external_reference,
        performed_by: dto.performed_by,
        ip_address: dto.ip_address,
      });

      // Update account balance
      await this.accountModel.updateOne(
        { code: entryDto.account_code },
        {
          current_balance: balanceAfter,
          balance_updated_at: new Date(),
        },
      );

      // Update the account map for subsequent entries
      account.current_balance = balanceAfter;
    }

    this.logger.log(`Batch posted: ${batchId} with ${dto.entries.length} entries`);

    return batch;
  }

  /**
   * Reverse an entire batch by creating reversing entries
   */
  async reverseBatch(dto: ReverseBatchDto): Promise<TransactionBatchDocument> {
    const originalBatch = await this.batchModel.findOne({ batch_id: dto.batch_id });

    if (!originalBatch) {
      throw new NotFoundException(`Batch not found: ${dto.batch_id}`);
    }

    if (originalBatch.status === BatchStatus.REVERSED) {
      throw new BadRequestException(`Batch is already reversed`);
    }

    if (originalBatch.status !== BatchStatus.POSTED) {
      throw new BadRequestException(`Can only reverse POSTED batches`);
    }

    // Get original entries
    const originalEntries = await this.ledgerEntryModel
      .find({ batch_id: dto.batch_id })
      .lean();

    // Create reversing entries (opposite entry types)
    const reversingEntries: CreateEntryDto[] = originalEntries.map((entry) => ({
      account_code: entry.account_code,
      entry_type: entry.entry_type === EntryType.DEBIT ? EntryType.CREDIT : EntryType.DEBIT,
      amount: entry.amount,
      description: `Reversal: ${entry.description}`,
      user_id: entry.user_id,
      wallet_id: entry.wallet_id,
    }));

    // Create reversal batch
    const reversalBatch = await this.createAndPostBatch({
      category: originalBatch.category,
      description: `Reversal of ${dto.batch_id}: ${dto.reason}`,
      entries: reversingEntries,
      from_user: originalBatch.from_user,
      from_name: originalBatch.from_name,
      from_wallet: originalBatch.from_wallet,
      to_user: originalBatch.to_user,
      to_name: originalBatch.to_name,
      to_wallet: originalBatch.to_wallet,
      reference_type: originalBatch.reference_type,
      reference_id: originalBatch.reference_id,
      performed_by: dto.performed_by,
      ip_address: dto.ip_address,
      notes: dto.reason,
      metadata: { reverses_batch: dto.batch_id },
    });

    // Update reversal batch to mark it as a reversal
    await this.batchModel.updateOne(
      { batch_id: reversalBatch.batch_id },
      { reverses_batch: dto.batch_id },
    );

    // Update original batch status
    await this.batchModel.updateOne(
      { batch_id: dto.batch_id },
      {
        status: BatchStatus.REVERSED,
        reversed_by_batch: reversalBatch.batch_id,
        reversed_at: new Date(),
        reversal_reason: dto.reason,
      },
    );

    // Update original entries status
    await this.ledgerEntryModel.updateMany(
      { batch_id: dto.batch_id },
      {
        status: EntryStatus.REVERSED,
        reversed_by_batch: reversalBatch.batch_id,
        reversed_at: new Date(),
        reversal_reason: dto.reason,
      },
    );

    this.logger.log(`Batch reversed: ${dto.batch_id} -> ${reversalBatch.batch_id}`);

    return reversalBatch;
  }

  /**
   * Get batch by ID
   */
  async getBatch(batchId: string): Promise<TransactionBatchDocument> {
    const batch = await this.batchModel.findOne({ batch_id: batchId });
    if (!batch) {
      throw new NotFoundException(`Batch not found: ${batchId}`);
    }
    return batch;
  }

  /**
   * Get entries for a batch
   */
  async getBatchEntries(batchId: string): Promise<LedgerEntryDocument[]> {
    return this.ledgerEntryModel.find({ batch_id: batchId }).sort({ created_at: 1 });
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountCode: string): Promise<number> {
    const account = await this.accountModel.findOne({ code: accountCode });
    if (!account) {
      throw new NotFoundException(`Account not found: ${accountCode}`);
    }
    return account.current_balance;
  }

  /**
   * Recalculate account balance from entries
   * Used for reconciliation
   */
  async recalculateAccountBalance(accountCode: string): Promise<number> {
    const account = await this.accountModel.findOne({ code: accountCode });
    if (!account) {
      throw new NotFoundException(`Account not found: ${accountCode}`);
    }

    // Sum all entries for this account
    const result = await this.ledgerEntryModel.aggregate([
      { $match: { account_code: accountCode, status: EntryStatus.POSTED } },
      {
        $group: {
          _id: null,
          totalDebits: {
            $sum: { $cond: [{ $eq: ['$entry_type', EntryType.DEBIT] }, '$amount', 0] },
          },
          totalCredits: {
            $sum: { $cond: [{ $eq: ['$entry_type', EntryType.CREDIT] }, '$amount', 0] },
          },
        },
      },
    ]);

    let calculatedBalance = 0;
    if (result.length > 0) {
      const { totalDebits, totalCredits } = result[0];
      if (account.normal_balance === NormalBalance.DEBIT) {
        calculatedBalance = currency(totalDebits).subtract(totalCredits).value;
      } else {
        calculatedBalance = currency(totalCredits).subtract(totalDebits).value;
      }
    }

    // Update account with calculated balance
    await this.accountModel.updateOne(
      { code: accountCode },
      {
        current_balance: calculatedBalance,
        balance_updated_at: new Date(),
      },
    );

    return calculatedBalance;
  }

  /**
   * Record prescription card payment
   * Creates a double-entry:
   * - DEBIT CASH_PAYSTACK (money received)
   * - CREDIT REVENUE_PRESCRIPTION_FEE (revenue recognized)
   */
  async recordPrescriptionCardPayment(data: {
    prescriptionId: Types.ObjectId;
    prescriptionNumber: string;
    patientId: Types.ObjectId;
    amount: number;
    paymentMethod: string;
    paymentReference: string;
  }): Promise<TransactionBatchDocument> {
    const description = `Prescription payment: ${data.prescriptionNumber}`;

    const batch = await this.createAndPostBatch({
      category: TransactionCategory.PRESCRIPTION_PAYMENT,
      description,
      entries: [
        {
          account_code: AccountCode.CASH_PAYSTACK,
          entry_type: EntryType.DEBIT,
          amount: data.amount,
          description: `Card payment received - ${data.prescriptionNumber}`,
          user_id: data.patientId,
        },
        {
          account_code: AccountCode.REVENUE_PRESCRIPTION_FEE,
          entry_type: EntryType.CREDIT,
          amount: data.amount,
          description: `Revenue from prescription - ${data.prescriptionNumber}`,
          user_id: data.patientId,
        },
      ],
      from_user: data.patientId,
      reference_type: 'prescription',
      reference_id: data.prescriptionId,
      external_reference: data.paymentReference,
      metadata: {
        prescription_number: data.prescriptionNumber,
        payment_method: data.paymentMethod,
      },
    });

    this.logger.log(
      `Prescription payment recorded: ${data.prescriptionNumber}, Amount: ₦${data.amount}, Batch: ${batch.batch_id}`,
    );

    return batch;
  }

  /**
   * Get entries for a specific user/wallet
   */
  async getEntriesForWallet(
    walletId: Types.ObjectId,
    options: { page?: number; limit?: number; startDate?: Date; endDate?: Date } = {},
  ): Promise<{ entries: LedgerEntryDocument[]; total: number }> {
    const { page = 1, limit = 20, startDate, endDate } = options;

    const filter: any = { wallet_id: walletId, status: EntryStatus.POSTED };

    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at.$gte = startDate;
      if (endDate) filter.created_at.$lte = endDate;
    }

    const [entries, total] = await Promise.all([
      this.ledgerEntryModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.ledgerEntryModel.countDocuments(filter),
    ]);

    return { entries, total };
  }
}
