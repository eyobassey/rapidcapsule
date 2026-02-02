/**
 * Accounting Module
 *
 * Unified financial architecture with double-entry bookkeeping.
 * Replaces separate patient and specialist wallet systems.
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Entities
import { Account, AccountSchema } from './entities/account.entity';
import { LedgerEntry, LedgerEntrySchema } from './entities/ledger-entry.entity';
import {
  TransactionBatch,
  TransactionBatchSchema,
} from './entities/transaction-batch.entity';
import {
  UnifiedWallet,
  UnifiedWalletSchema,
} from './entities/unified-wallet.entity';
import {
  SpecialistWalletTransaction,
  SpecialistWalletTransactionSchema,
} from '../wallets/entities/specialist-wallet-transaction.entity';

// Services
import { AccountingService } from './services/accounting.service';
import { ChartOfAccountsService } from './services/chart-of-accounts.service';
import { UnifiedWalletService } from './services/unified-wallet.service';
import { MigrationService } from './services/migration.service';
import { AppointmentEscrowService } from './services/appointment-escrow.service';

// Controllers
import { WalletController } from './controllers/wallet.controller';
import { AdminWalletController } from './controllers/admin-wallet.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: LedgerEntry.name, schema: LedgerEntrySchema },
      { name: TransactionBatch.name, schema: TransactionBatchSchema },
      { name: UnifiedWallet.name, schema: UnifiedWalletSchema },
      {
        name: SpecialistWalletTransaction.name,
        schema: SpecialistWalletTransactionSchema,
      },
    ]),
  ],
  controllers: [WalletController, AdminWalletController],
  providers: [
    AccountingService,
    ChartOfAccountsService,
    UnifiedWalletService,
    MigrationService,
    AppointmentEscrowService,
  ],
  exports: [
    AccountingService,
    ChartOfAccountsService,
    UnifiedWalletService,
    MigrationService,
    AppointmentEscrowService,
    MongooseModule, // Export for other modules to access entities
  ],
})
export class AccountingModule {}
