import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { MigrationService } from './services/migration.service';
import { UnifiedWallet, UnifiedWalletSchema } from './entities/unified-wallet.entity';
import { LedgerEntry, LedgerEntrySchema } from './entities/ledger-entry.entity';
import { TransactionBatch, TransactionBatchSchema } from './entities/transaction-batch.entity';
import { Account, AccountSchema } from './entities/account.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UnifiedWallet.name, schema: UnifiedWalletSchema },
      { name: LedgerEntry.name, schema: LedgerEntrySchema },
      { name: TransactionBatch.name, schema: TransactionBatchSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService, MigrationService],
  exports: [FinanceService, MigrationService],
})
export class FinanceModule {}
