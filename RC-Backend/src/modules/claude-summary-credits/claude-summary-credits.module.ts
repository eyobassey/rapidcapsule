import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClaudeSummaryCreditsService } from './claude-summary-credits.service';
import { ClaudeSummaryCreditsController } from './claude-summary-credits.controller';
import { ClaudeSummaryCreditsScheduler } from './claude-summary-credits.scheduler';
import { ClaudeSummaryPlan, ClaudeSummaryPlanSchema } from './entities/claude-summary-plan.entity';
import { ClaudeSummaryCredit, ClaudeSummaryCreditSchema } from './entities/claude-summary-credit.entity';
import { ClaudeSummaryTransaction, ClaudeSummaryTransactionSchema } from './entities/claude-summary-transaction.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { AdvancedScoreSettings, AdvancedScoreSettingsSchema } from '../advanced-health-score/entities/advanced-score-settings.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { UsersModule } from '../users/users.module';
import { GeneralHelpers } from '../../common/helpers/general.helpers';

@Module({
  imports: [
    WalletsModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: ClaudeSummaryPlan.name, schema: ClaudeSummaryPlanSchema },
      { name: ClaudeSummaryCredit.name, schema: ClaudeSummaryCreditSchema },
      { name: ClaudeSummaryTransaction.name, schema: ClaudeSummaryTransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: AdvancedScoreSettings.name, schema: AdvancedScoreSettingsSchema },
    ]),
  ],
  controllers: [ClaudeSummaryCreditsController],
  providers: [ClaudeSummaryCreditsService, ClaudeSummaryCreditsScheduler, GeneralHelpers],
  exports: [ClaudeSummaryCreditsService],
})
export class ClaudeSummaryCreditsModule {}
