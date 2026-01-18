import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdvancedHealthScoreAdminService } from './advanced-health-score-admin.service';
import { AdvancedHealthScoreAdminController } from './advanced-health-score-admin.controller';
import {
  AdvancedHealthScore,
  AdvancedHealthScoreSchema,
} from './entities/advanced-health-score.entity';
import {
  AdvancedScoreQuestion,
  AdvancedScoreQuestionSchema,
} from './entities/advanced-score-question.entity';
import {
  AdvancedScoreSettings,
  AdvancedScoreSettingsSchema,
} from './entities/advanced-score-settings.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdvancedHealthScore.name, schema: AdvancedHealthScoreSchema },
      { name: AdvancedScoreQuestion.name, schema: AdvancedScoreQuestionSchema },
      { name: AdvancedScoreSettings.name, schema: AdvancedScoreSettingsSchema },
    ]),
  ],
  controllers: [AdvancedHealthScoreAdminController],
  providers: [AdvancedHealthScoreAdminService],
  exports: [AdvancedHealthScoreAdminService],
})
export class AdvancedHealthScoreAdminModule {}
