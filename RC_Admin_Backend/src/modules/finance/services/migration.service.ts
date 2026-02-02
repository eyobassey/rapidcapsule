import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { UnifiedWallet, UnifiedWalletDocument } from '../entities/unified-wallet.entity';
import { LedgerEntry, LedgerEntryDocument, EntryType, EntryStatus } from '../entities/ledger-entry.entity';
import { TransactionBatch, TransactionBatchDocument, TransactionCategory, BatchStatus } from '../entities/transaction-batch.entity';
import { Account, AccountDocument } from '../entities/account.entity';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectModel(UnifiedWallet.name) private walletModel: Model<UnifiedWalletDocument>,
    @InjectModel(LedgerEntry.name) private ledgerModel: Model<LedgerEntryDocument>,
    @InjectModel(TransactionBatch.name) private batchModel: Model<TransactionBatchDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async runFullMigration() {
    this.logger.log('Starting full transaction migration...');

    const results = {
      patientTransactions: { migrated: 0, errors: 0 },
      specialistTransactions: { migrated: 0, errors: 0 },
      collectionsDropped: [] as string[],
    };

    try {
      // Step 1: Migrate patient wallet transactions
      this.logger.log('Migrating patient wallet transactions...');
      const patientResult = await this.migratePatientTransactions();
      results.patientTransactions = patientResult;

      // Step 2: Migrate specialist wallet transactions
      this.logger.log('Migrating specialist wallet transactions...');
      const specialistResult = await this.migrateSpecialistTransactions();
      results.specialistTransactions = specialistResult;

      // Step 3: Drop old collections
      this.logger.log('Dropping old collections...');
      await this.dropOldCollections();
      results.collectionsDropped = ['wallettransactions', 'specialistwallettransactions', 'wallets', 'specialistwallets'];

      this.logger.log('Migration completed successfully!');
      return {
        success: true,
        message: 'Migration completed successfully',
        results,
      };
    } catch (error) {
      this.logger.error('Migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error.message}`,
        results,
      };
    }
  }

  private async migratePatientTransactions() {
    let migrated = 0;
    let errors = 0;

    // Get the old wallettransactions collection directly
    const oldTransactions = await this.connection.db
      .collection('wallettransactions')
      .find({})
      .sort({ created_at: 1 })
      .toArray();

    this.logger.log(`Found ${oldTransactions.length} patient transactions to migrate`);

    for (const oldTxn of oldTransactions) {
      try {
        // Handle both walletId and wallet fields
        const legacyWalletId = oldTxn.walletId || oldTxn.wallet;

        if (!legacyWalletId) {
          this.logger.warn(`No wallet reference in transaction ${oldTxn._id}`);
          errors++;
          continue;
        }

        // Find the unified wallet by legacy_wallet_id (try patient first, then specialist)
        let wallet = await this.walletModel.findOne({
          legacy_wallet_id: new Types.ObjectId(legacyWalletId),
          legacy_wallet_type: 'patient',
        });

        // If not found as patient, try specialist (in case of data inconsistency)
        if (!wallet) {
          wallet = await this.walletModel.findOne({
            legacy_wallet_id: new Types.ObjectId(legacyWalletId),
          });
        }

        if (!wallet) {
          this.logger.warn(`No unified wallet found for legacy patient wallet ${oldTxn.walletId}`);
          errors++;
          continue;
        }

        // Determine transaction category based on narration/type
        const category = this.mapPatientTransactionCategory(oldTxn);
        const isCredit = oldTxn.type === 'Credit';

        // Generate IDs
        const batchId = `MIG-PAT-${oldTxn._id.toString().slice(-8).toUpperCase()}`;
        const entryId = `MIG-PAT-E-${oldTxn._id.toString().slice(-8).toUpperCase()}`;

        // Create transaction batch
        const batch = new this.batchModel({
          batch_id: batchId,
          category,
          description: oldTxn.narration || `Migrated: ${oldTxn.type}`,
          total_debits: oldTxn.amount,
          total_credits: oldTxn.amount,
          is_balanced: true,
          entry_count: 1,
          currency: 'NGN',
          status: BatchStatus.POSTED,
          from_user: isCredit ? null : wallet.owner_id,
          from_wallet: isCredit ? null : wallet._id,
          to_user: isCredit ? wallet.owner_id : null,
          to_wallet: isCredit ? wallet._id : null,
          external_reference: oldTxn.reference,
          posted_at: oldTxn.created_at,
          notes: 'Migrated from legacy wallettransactions',
          metadata: { legacy_id: oldTxn._id, migration_date: new Date() },
          created_at: oldTxn.created_at,
        });

        await batch.save();

        // Create ledger entry
        const entry = new this.ledgerModel({
          entry_id: entryId,
          batch_id: batchId,
          account_code: '2100.001.001', // Patient Wallet Liability
          entry_type: isCredit ? EntryType.CREDIT : EntryType.DEBIT,
          amount: oldTxn.amount,
          currency: 'NGN',
          balance_before: 0,
          balance_after: 0,
          description: oldTxn.narration || `Migrated: ${oldTxn.type}`,
          status: EntryStatus.POSTED,
          user_id: wallet.owner_id,
          wallet_id: wallet._id,
          metadata: { legacy_id: oldTxn._id },
          created_at: oldTxn.created_at,
        });

        await entry.save();
        migrated++;
      } catch (error) {
        this.logger.error(`Failed to migrate patient transaction ${oldTxn._id}: ${error.message}`);
        errors++;
      }
    }

    return { migrated, errors };
  }

  private async migrateSpecialistTransactions() {
    let migrated = 0;
    let errors = 0;

    // Get the old specialistwallettransactions collection directly
    const oldTransactions = await this.connection.db
      .collection('specialistwallettransactions')
      .find({})
      .sort({ created_at: 1 })
      .toArray();

    this.logger.log(`Found ${oldTransactions.length} specialist transactions to migrate`);

    for (const oldTxn of oldTransactions) {
      try {
        const legacyWalletId = oldTxn.wallet_id;

        if (!legacyWalletId) {
          this.logger.warn(`No wallet reference in specialist transaction ${oldTxn._id}`);
          errors++;
          continue;
        }

        // Find the unified wallet by legacy_wallet_id
        const wallet = await this.walletModel.findOne({
          legacy_wallet_id: new Types.ObjectId(legacyWalletId),
          legacy_wallet_type: 'specialist',
        });

        if (!wallet) {
          this.logger.warn(`No unified wallet found for legacy specialist wallet ${legacyWalletId}`);
          errors++;
          continue;
        }

        // Map transaction category
        const category = this.mapSpecialistTransactionCategory(oldTxn);
        const isCredit = ['CREDIT', 'RELEASE', 'REFUND'].includes(oldTxn.type);

        // Generate IDs - use existing transaction_id if available
        const batchId = oldTxn.transaction_id || `MIG-SPEC-${oldTxn._id.toString().slice(-8).toUpperCase()}`;
        const entryId = `${batchId}-E1`;

        // Create transaction batch
        const batch = new this.batchModel({
          batch_id: batchId,
          category,
          description: oldTxn.description || `Migrated: ${oldTxn.type}`,
          total_debits: oldTxn.amount,
          total_credits: oldTxn.amount,
          is_balanced: true,
          entry_count: 1,
          currency: 'NGN',
          status: this.mapSpecialistStatus(oldTxn.status),
          from_user: isCredit ? null : wallet.owner_id,
          from_wallet: isCredit ? null : wallet._id,
          to_user: isCredit ? wallet.owner_id : null,
          to_wallet: isCredit ? wallet._id : null,
          reference_type: oldTxn.reference_type,
          reference_id: oldTxn.reference_id,
          external_reference: oldTxn.external_reference,
          performed_by: oldTxn.performed_by,
          posted_at: oldTxn.created_at,
          notes: oldTxn.notes || 'Migrated from legacy specialistwallettransactions',
          metadata: {
            legacy_id: oldTxn._id,
            legacy_transaction_id: oldTxn.transaction_id,
            balance_before: oldTxn.balance_before,
            balance_after: oldTxn.balance_after,
            held_balance_before: oldTxn.held_balance_before,
            held_balance_after: oldTxn.held_balance_after,
            migration_date: new Date(),
            original_metadata: oldTxn.metadata,
          },
          created_at: oldTxn.created_at,
        });

        await batch.save();

        // Create ledger entry
        const entry = new this.ledgerModel({
          entry_id: entryId,
          batch_id: batchId,
          account_code: oldTxn.type === 'HOLD' ? '2100.002.002' : '2100.002.001', // Specialist Held vs Available
          entry_type: isCredit ? EntryType.CREDIT : EntryType.DEBIT,
          amount: oldTxn.amount,
          currency: 'NGN',
          balance_before: oldTxn.balance_before || 0,
          balance_after: oldTxn.balance_after || 0,
          description: oldTxn.description || `Migrated: ${oldTxn.type}`,
          status: EntryStatus.POSTED,
          user_id: wallet.owner_id,
          wallet_id: wallet._id,
          reference_type: oldTxn.reference_type,
          reference_id: oldTxn.reference_id,
          external_reference: oldTxn.external_reference,
          performed_by: oldTxn.performed_by,
          metadata: {
            legacy_id: oldTxn._id,
            legacy_transaction_id: oldTxn.transaction_id,
          },
          created_at: oldTxn.created_at,
        });

        await entry.save();
        migrated++;
      } catch (error) {
        this.logger.error(`Failed to migrate specialist transaction ${oldTxn._id}: ${error.message}`);
        errors++;
      }
    }

    return { migrated, errors };
  }

  private async dropOldCollections() {
    const collectionsToDropTransactions = ['wallettransactions', 'specialistwallettransactions'];
    const collectionsToDropWallets = ['wallets', 'specialistwallets'];

    // Drop old transaction collections
    for (const collectionName of collectionsToDropTransactions) {
      try {
        const collections = await this.connection.db.listCollections({ name: collectionName }).toArray();
        if (collections.length > 0) {
          await this.connection.db.dropCollection(collectionName);
          this.logger.log(`Dropped collection: ${collectionName}`);
        } else {
          this.logger.log(`Collection ${collectionName} does not exist, skipping`);
        }
      } catch (error) {
        this.logger.warn(`Could not drop collection ${collectionName}: ${error.message}`);
      }
    }

    // Drop old wallet collections
    for (const collectionName of collectionsToDropWallets) {
      try {
        const collections = await this.connection.db.listCollections({ name: collectionName }).toArray();
        if (collections.length > 0) {
          await this.connection.db.dropCollection(collectionName);
          this.logger.log(`Dropped collection: ${collectionName}`);
        } else {
          this.logger.log(`Collection ${collectionName} does not exist, skipping`);
        }
      } catch (error) {
        this.logger.warn(`Could not drop collection ${collectionName}: ${error.message}`);
      }
    }
  }

  private mapPatientTransactionCategory(txn: any): TransactionCategory {
    const narration = (txn.narration || '').toLowerCase();

    if (narration.includes('top') || narration.includes('fund')) {
      return TransactionCategory.WALLET_TOPUP;
    }
    if (narration.includes('withdraw')) {
      return TransactionCategory.WALLET_WITHDRAWAL;
    }
    if (narration.includes('pharmacy') || narration.includes('order')) {
      return TransactionCategory.PHARMACY_ORDER_PAYMENT;
    }
    if (narration.includes('prescription')) {
      return TransactionCategory.PRESCRIPTION_PAYMENT;
    }
    if (narration.includes('appointment')) {
      return TransactionCategory.APPOINTMENT_PAYMENT;
    }
    if (narration.includes('ai') || narration.includes('summary') || narration.includes('claude')) {
      return TransactionCategory.AI_SUMMARY_PURCHASE;
    }

    return TransactionCategory.MIGRATION;
  }

  private mapSpecialistTransactionCategory(txn: any): TransactionCategory {
    switch (txn.reference_type) {
      case 'topup':
        return TransactionCategory.WALLET_TOPUP;
      case 'prescription':
        return TransactionCategory.PRESCRIPTION_PAYMENT;
      case 'withdrawal':
        return TransactionCategory.WALLET_WITHDRAWAL;
      case 'refund':
        return TransactionCategory.REFUND;
      case 'admin_adjustment':
        return txn.type === 'CREDIT' ? TransactionCategory.ADMIN_CREDIT : TransactionCategory.ADMIN_DEBIT;
      default:
        if (txn.type === 'HOLD') return TransactionCategory.SPECIALIST_HOLD;
        if (txn.type === 'RELEASE') return TransactionCategory.SPECIALIST_RELEASE;
        return TransactionCategory.MIGRATION;
    }
  }

  private mapSpecialistStatus(status: string): BatchStatus {
    switch (status) {
      case 'COMPLETED':
        return BatchStatus.POSTED;
      case 'PENDING':
        return BatchStatus.PENDING;
      case 'FAILED':
        return BatchStatus.FAILED;
      case 'REVERSED':
        return BatchStatus.REVERSED;
      default:
        return BatchStatus.POSTED;
    }
  }

  // Utility method to check migration status
  async getMigrationStatus() {
    const [
      patientTxnCount,
      specialistTxnCount,
      batchCount,
      ledgerCount,
      unifiedWalletCount,
    ] = await Promise.all([
      this.connection.db.collection('wallettransactions').countDocuments().catch(() => 0),
      this.connection.db.collection('specialistwallettransactions').countDocuments().catch(() => 0),
      this.batchModel.countDocuments(),
      this.ledgerModel.countDocuments(),
      this.walletModel.countDocuments(),
    ]);

    return {
      legacy: {
        patient_transactions: patientTxnCount,
        specialist_transactions: specialistTxnCount,
      },
      new_system: {
        transaction_batches: batchCount,
        ledger_entries: ledgerCount,
        unified_wallets: unifiedWalletCount,
      },
      migration_needed: patientTxnCount > 0 || specialistTxnCount > 0,
    };
  }
}
