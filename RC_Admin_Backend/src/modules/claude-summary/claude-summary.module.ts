import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClaudeSummaryAdminService } from './claude-summary-admin.service';
import { ClaudeSummaryAdminController } from './claude-summary-admin.controller';
import { ClaudeSummaryPlan, ClaudeSummaryPlanSchema } from './entities/claude-summary-plan.entity';
import { ClaudeSummaryCredit, ClaudeSummaryCreditSchema } from './entities/claude-summary-credit.entity';
import { ClaudeSummaryTransaction, ClaudeSummaryTransactionSchema } from './entities/claude-summary-transaction.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClaudeSummaryPlan.name, schema: ClaudeSummaryPlanSchema },
      { name: ClaudeSummaryCredit.name, schema: ClaudeSummaryCreditSchema },
      { name: ClaudeSummaryTransaction.name, schema: ClaudeSummaryTransactionSchema },
    ]),
  ],
  controllers: [ClaudeSummaryAdminController],
  providers: [ClaudeSummaryAdminService],
  exports: [ClaudeSummaryAdminService],
})
export class ClaudeSummaryModule {}
