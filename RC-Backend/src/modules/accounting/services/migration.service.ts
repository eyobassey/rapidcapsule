/**
 * Migration Service
 *
 * Handles one-time migration from old wallet systems to the unified accounting system.
 * Migrates patient wallets and specialist wallets, creating opening balance entries.
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';

import {
  UnifiedWallet,
  UnifiedWalletDocument,
} from '../entities/unified-wallet.entity';
import {
  TransactionBatch,
  TransactionBatchDocument,
} from '../entities/transaction-batch.entity';
import { LedgerEntry, LedgerEntryDocument } from '../entities/ledger-entry.entity';
import { AccountingService } from './accounting.service';
import {
  AccountCode,
  EntryType,
  TransactionCategory,
  WalletOwnerType,
  WalletStatus,
} from '../enums/account-codes.enum';

// Types for old wallet documents
interface OldPatientWallet {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  currency: string;
  available_balance: number;
  ledger_balance: number;
  created_at: Date;
  updated_at: Date;
}

interface OldSpecialistWallet {
  _id: Types.ObjectId;
  specialist_id: Types.ObjectId;
  currency: string;
  available_balance: number;
  held_balance: number;
  total_credited: number;
  total_debited: number;
  is_active: boolean;
  last_transaction_at: Date;
  created_at: Date;
  updated_at: Date;
}

interface OldPatientTransaction {
  _id: Types.ObjectId;
  walletId: Types.ObjectId;
  userId: Types.ObjectId;
  bankId?: Types.ObjectId;
  amount: number;
  narration: string;
  reference: string;
  type: 'Credit' | 'Debit';
  created_at: Date;
  updated_at: Date;
}

interface OldSpecialistTransaction {
  _id: Types.ObjectId;
  transaction_id: string;
  wallet_id: Types.ObjectId;
  specialist_id: Types.ObjectId;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  held_balance_before: number;
  held_balance_after: number;
  reference_type: string;
  reference_id?: Types.ObjectId;
  external_reference?: string;
  description: string;
  status: string;
  performed_by?: Types.ObjectId;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface MigrationResult {
  success: boolean;
  migrationBatchId: string;
  patientWalletsMigrated: number;
  specialistWalletsMigrated: number;
  totalPatientBalance: number;
  totalSpecialistBalance: number;
  totalHeldBalance: number;
  errors: string[];
  timestamp: Date;
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(UnifiedWallet.name)
    private unifiedWalletModel: Model<UnifiedWalletDocument>,
    @InjectModel(TransactionBatch.name)
    private batchModel: Model<TransactionBatchDocument>,
    @InjectModel(LedgerEntry.name)
    private ledgerEntryModel: Model<LedgerEntryDocument>,
    private accountingService: AccountingService,
  ) {}

  /**
   * Check if migration has already been performed
   */
  async isMigrationComplete(): Promise<boolean> {
    const migrationBatch = await this.batchModel.findOne({
      category: TransactionCategory.MIGRATION,
      notes: 'Initial wallet migration',
    });
    return !!migrationBatch;
  }

  /**
   * Run the full migration
   */
  async runMigration(): Promise<MigrationResult> {
    this.logger.log('Starting wallet migration...');

    const result: MigrationResult = {
      success: false,
      migrationBatchId: '',
      patientWalletsMigrated: 0,
      specialistWalletsMigrated: 0,
      totalPatientBalance: 0,
      totalSpecialistBalance: 0,
      totalHeldBalance: 0,
      errors: [],
      timestamp: new Date(),
    };

    // Check if already migrated
    if (await this.isMigrationComplete()) {
      result.errors.push('Migration has already been completed');
      return result;
    }

    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        // Migrate patient wallets
        const patientResult = await this.migratePatientWallets(session);
        result.patientWalletsMigrated = patientResult.count;
        result.totalPatientBalance = patientResult.totalBalance;

        // Migrate specialist wallets
        const specialistResult = await this.migrateSpecialistWallets(session);
        result.specialistWalletsMigrated = specialistResult.count;
        result.totalSpecialistBalance = specialistResult.totalBalance;
        result.totalHeldBalance = specialistResult.totalHeld;

        // Create opening balance entries
        const migrationBatch = await this.createOpeningBalanceEntries(
          result.totalPatientBalance,
          result.totalSpecialistBalance,
          result.totalHeldBalance,
          session,
        );
        result.migrationBatchId = migrationBatch.batch_id;

        this.logger.log('Migration completed successfully');
        result.success = true;
      });
    } catch (error) {
      this.logger.error('Migration failed', error);
      result.errors.push(error.message);
    } finally {
      session.endSession();
    }

    return result;
  }

  /**
   * Migrate patient wallets
   */
  private async migratePatientWallets(
    session: any,
  ): Promise<{ count: number; totalBalance: number }> {
    this.logger.log('Migrating patient wallets...');

    const oldWallets = await this.connection
      .collection('wallets')
      .find({})
      .toArray();

    let count = 0;
    let totalBalance = 0;

    for (const oldWallet of oldWallets as unknown as OldPatientWallet[]) {
      // Check if already migrated
      const existing = await this.unifiedWalletModel.findOne({
        legacy_wallet_id: oldWallet._id,
      });

      if (existing) {
        this.logger.log(`Wallet ${oldWallet._id} already migrated, skipping`);
        continue;
      }

      // Get transaction history for stats
      const transactions = (await this.connection
        .collection('wallettransactions')
        .find({ walletId: oldWallet._id })
        .toArray()) as unknown as OldPatientTransaction[];

      const totalCredited = transactions
        .filter((t) => t.type === 'Credit')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalDebited = transactions
        .filter((t) => t.type === 'Debit')
        .reduce((sum, t) => sum + t.amount, 0);

      const lastTransaction = transactions.length > 0
        ? new Date(Math.max(...transactions.map((t) => t.created_at.getTime())))
        : null;

      // Create new unified wallet
      const newWallet = new this.unifiedWalletModel({
        wallet_id: this.generateWalletId(),
        owner_id: oldWallet.userId,
        owner_type: WalletOwnerType.PATIENT,
        currency: oldWallet.currency || 'NGN',
        available_balance: oldWallet.available_balance || 0,
        held_balance: 0,
        pending_balance: 0,
        total_credited: totalCredited,
        total_debited: totalDebited,
        total_held: 0,
        total_released: 0,
        status: WalletStatus.ACTIVE,
        daily_withdrawal_limit: 500000,
        daily_withdrawn_today: 0,
        single_transaction_limit: 200000,
        requires_pin: false,
        failed_pin_attempts: 0,
        last_credit_at: lastTransaction,
        last_debit_at: lastTransaction,
        last_transaction_at: lastTransaction,
        transaction_count: transactions.length,
        legacy_wallet_id: oldWallet._id,
        legacy_wallet_type: 'patient',
        migrated_at: new Date(),
      });

      await newWallet.save({ session });

      totalBalance += oldWallet.available_balance || 0;
      count++;

      this.logger.log(
        `Migrated patient wallet ${oldWallet._id} -> ${newWallet.wallet_id}`,
      );
    }

    this.logger.log(
      `Patient wallet migration complete: ${count} wallets, ₦${totalBalance} total`,
    );
    return { count, totalBalance };
  }

  /**
   * Migrate specialist wallets
   */
  private async migrateSpecialistWallets(
    session: any,
  ): Promise<{ count: number; totalBalance: number; totalHeld: number }> {
    this.logger.log('Migrating specialist wallets...');

    const oldWallets = await this.connection
      .collection('specialistwallets')
      .find({})
      .toArray();

    let count = 0;
    let totalBalance = 0;
    let totalHeld = 0;

    for (const oldWallet of oldWallets as unknown as OldSpecialistWallet[]) {
      // Check if already migrated
      const existing = await this.unifiedWalletModel.findOne({
        legacy_wallet_id: oldWallet._id,
      });

      if (existing) {
        this.logger.log(`Wallet ${oldWallet._id} already migrated, skipping`);
        continue;
      }

      // Get transaction history for stats
      const transactions = (await this.connection
        .collection('specialistwallettransactions')
        .find({ wallet_id: oldWallet._id })
        .toArray()) as unknown as OldSpecialistTransaction[];

      const totalCredited = transactions
        .filter((t) => t.type === 'CREDIT')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalDebited = transactions
        .filter((t) => t.type === 'DEBIT')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalHeldFromTxns = transactions
        .filter((t) => t.type === 'HOLD')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalReleased = transactions
        .filter((t) => t.type === 'RELEASE')
        .reduce((sum, t) => sum + t.amount, 0);

      // Create new unified wallet
      const newWallet = new this.unifiedWalletModel({
        wallet_id: this.generateWalletId(),
        owner_id: oldWallet.specialist_id,
        owner_type: WalletOwnerType.SPECIALIST,
        currency: oldWallet.currency || 'NGN',
        available_balance: oldWallet.available_balance || 0,
        held_balance: oldWallet.held_balance || 0,
        pending_balance: 0,
        total_credited: oldWallet.total_credited || totalCredited,
        total_debited: oldWallet.total_debited || totalDebited,
        total_held: totalHeldFromTxns,
        total_released: totalReleased,
        status: oldWallet.is_active ? WalletStatus.ACTIVE : WalletStatus.SUSPENDED,
        daily_withdrawal_limit: 1000000, // ₦1,000,000 for specialists
        daily_withdrawn_today: 0,
        single_transaction_limit: 500000,
        requires_pin: false,
        failed_pin_attempts: 0,
        last_transaction_at: oldWallet.last_transaction_at,
        transaction_count: transactions.length,
        legacy_wallet_id: oldWallet._id,
        legacy_wallet_type: 'specialist',
        migrated_at: new Date(),
      });

      await newWallet.save({ session });

      totalBalance += oldWallet.available_balance || 0;
      totalHeld += oldWallet.held_balance || 0;
      count++;

      this.logger.log(
        `Migrated specialist wallet ${oldWallet._id} -> ${newWallet.wallet_id}`,
      );
    }

    this.logger.log(
      `Specialist wallet migration complete: ${count} wallets, ₦${totalBalance} available, ₦${totalHeld} held`,
    );
    return { count, totalBalance, totalHeld };
  }

  /**
   * Create opening balance entries for migrated wallets
   */
  private async createOpeningBalanceEntries(
    patientBalance: number,
    specialistBalance: number,
    heldBalance: number,
    session: any,
  ): Promise<TransactionBatchDocument> {
    this.logger.log('Creating opening balance entries...');

    const entries: Array<{
      account_code: string;
      entry_type: EntryType;
      amount: number;
      description: string;
    }> = [];

    // Patient wallet pool and liability
    if (patientBalance > 0) {
      entries.push(
        {
          account_code: AccountCode.PATIENT_WALLET_POOL,
          entry_type: EntryType.DEBIT,
          amount: patientBalance,
          description: 'Opening balance: Patient wallet pool',
        },
        {
          account_code: AccountCode.LIABILITY_PATIENT_WALLETS,
          entry_type: EntryType.CREDIT,
          amount: patientBalance,
          description: 'Opening balance: Patient wallet liability',
        },
      );
    }

    // Specialist available balance
    if (specialistBalance > 0) {
      entries.push(
        {
          account_code: AccountCode.SPECIALIST_WALLET_POOL,
          entry_type: EntryType.DEBIT,
          amount: specialistBalance,
          description: 'Opening balance: Specialist wallet pool',
        },
        {
          account_code: AccountCode.LIABILITY_SPECIALIST_WALLETS,
          entry_type: EntryType.CREDIT,
          amount: specialistBalance,
          description: 'Opening balance: Specialist wallet liability',
        },
      );
    }

    // Specialist held balance
    if (heldBalance > 0) {
      entries.push(
        {
          account_code: AccountCode.SPECIALIST_HELD_FUNDS,
          entry_type: EntryType.DEBIT,
          amount: heldBalance,
          description: 'Opening balance: Specialist held funds',
        },
        {
          account_code: AccountCode.LIABILITY_SPECIALIST_HELD,
          entry_type: EntryType.CREDIT,
          amount: heldBalance,
          description: 'Opening balance: Specialist held liability',
        },
      );
    }

    // Opening balance equity adjustment
    const totalBalance = patientBalance + specialistBalance + heldBalance;
    if (totalBalance > 0) {
      entries.push(
        {
          account_code: AccountCode.OPENING_BALANCE,
          entry_type: EntryType.CREDIT,
          amount: totalBalance,
          description: 'Opening balance: Equity from migration',
        },
        {
          account_code: AccountCode.CASH_PAYSTACK,
          entry_type: EntryType.DEBIT,
          amount: totalBalance,
          description: 'Opening balance: Cash representing held funds',
        },
      );
    }

    // Create and post the migration batch
    if (entries.length === 0) {
      // Create a minimal batch if no balances
      entries.push(
        {
          account_code: AccountCode.OPENING_BALANCE,
          entry_type: EntryType.DEBIT,
          amount: 0.01,
          description: 'Migration marker (no balances)',
        },
        {
          account_code: AccountCode.OPENING_BALANCE,
          entry_type: EntryType.CREDIT,
          amount: 0.01,
          description: 'Migration marker (no balances)',
        },
      );
    }

    const batch = await this.accountingService.createAndPostBatch({
      category: TransactionCategory.MIGRATION,
      description: `Wallet migration - ${patientBalance + specialistBalance + heldBalance} total balance`,
      entries,
      notes: 'Initial wallet migration',
      metadata: {
        patient_balance: patientBalance,
        specialist_balance: specialistBalance,
        held_balance: heldBalance,
        migration_date: new Date().toISOString(),
      },
    });

    this.logger.log(`Created opening balance batch: ${batch.batch_id}`);
    return batch;
  }

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
   * Verify migration integrity
   */
  async verifyMigration(): Promise<{
    valid: boolean;
    patientWalletCount: number;
    specialistWalletCount: number;
    patientBalanceMatch: boolean;
    specialistBalanceMatch: boolean;
    details: Record<string, any>;
  }> {
    this.logger.log('Verifying migration...');

    // Get old wallet totals
    const oldPatientWallets = await this.connection
      .collection('wallets')
      .find({})
      .toArray();
    const oldSpecialistWallets = await this.connection
      .collection('specialistwallets')
      .find({})
      .toArray();

    const oldPatientTotal = oldPatientWallets.reduce(
      (sum, w: any) => sum + (w.available_balance || 0),
      0,
    );
    const oldSpecialistTotal = oldSpecialistWallets.reduce(
      (sum, w: any) => sum + (w.available_balance || 0),
      0,
    );
    const oldHeldTotal = oldSpecialistWallets.reduce(
      (sum, w: any) => sum + (w.held_balance || 0),
      0,
    );

    // Get new wallet totals
    const newPatientWallets = await this.unifiedWalletModel.find({
      owner_type: WalletOwnerType.PATIENT,
    });
    const newSpecialistWallets = await this.unifiedWalletModel.find({
      owner_type: WalletOwnerType.SPECIALIST,
    });

    const newPatientTotal = newPatientWallets.reduce(
      (sum, w) => sum + w.available_balance,
      0,
    );
    const newSpecialistTotal = newSpecialistWallets.reduce(
      (sum, w) => sum + w.available_balance,
      0,
    );
    const newHeldTotal = newSpecialistWallets.reduce(
      (sum, w) => sum + w.held_balance,
      0,
    );

    const patientBalanceMatch = oldPatientTotal === newPatientTotal;
    const specialistBalanceMatch =
      oldSpecialistTotal === newSpecialistTotal && oldHeldTotal === newHeldTotal;

    return {
      valid: patientBalanceMatch && specialistBalanceMatch,
      patientWalletCount: newPatientWallets.length,
      specialistWalletCount: newSpecialistWallets.length,
      patientBalanceMatch,
      specialistBalanceMatch,
      details: {
        old: {
          patientCount: oldPatientWallets.length,
          patientBalance: oldPatientTotal,
          specialistCount: oldSpecialistWallets.length,
          specialistBalance: oldSpecialistTotal,
          heldBalance: oldHeldTotal,
        },
        new: {
          patientCount: newPatientWallets.length,
          patientBalance: newPatientTotal,
          specialistCount: newSpecialistWallets.length,
          specialistBalance: newSpecialistTotal,
          heldBalance: newHeldTotal,
        },
      },
    };
  }

  /**
   * Get wallet mapping (old ID -> new wallet ID)
   */
  async getWalletMapping(): Promise<
    Map<string, { wallet_id: string; owner_type: WalletOwnerType }>
  > {
    const wallets = await this.unifiedWalletModel.find({
      legacy_wallet_id: { $exists: true },
    });

    const mapping = new Map();
    for (const wallet of wallets) {
      mapping.set(wallet.legacy_wallet_id.toString(), {
        wallet_id: wallet.wallet_id,
        owner_type: wallet.owner_type,
      });
    }

    return mapping;
  }

  /**
   * Find new wallet by old wallet ID
   */
  async findWalletByLegacyId(
    legacyId: Types.ObjectId,
  ): Promise<UnifiedWalletDocument | null> {
    return this.unifiedWalletModel.findOne({ legacy_wallet_id: legacyId });
  }
}
