import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RxGPTAdminController } from './rxgpt-admin.controller';
import { RxGPTAdminService } from './rxgpt-admin.service';
import { RxGPTSettings, RxGPTSettingsSchema } from './entities/rxgpt-settings.entity';
import { RxGPTAnalytics, RxGPTAnalyticsSchema } from './entities/rxgpt-analytics.entity';
import {
  ClaudeSummaryCredit,
  ClaudeSummaryCreditSchema,
} from '../claude-summary/entities/claude-summary-credit.entity';
import { User, UserSchema } from '../patients/entities/patient.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RxGPTSettings.name, schema: RxGPTSettingsSchema },
      { name: RxGPTAnalytics.name, schema: RxGPTAnalyticsSchema },
      { name: ClaudeSummaryCredit.name, schema: ClaudeSummaryCreditSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RxGPTAdminController],
  providers: [RxGPTAdminService],
  exports: [RxGPTAdminService],
})
export class RxGPTModule {}
