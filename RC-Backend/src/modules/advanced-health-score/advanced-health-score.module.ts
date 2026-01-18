import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdvancedHealthScoreService } from './advanced-health-score.service';
import { AdvancedHealthScoreController } from './advanced-health-score.controller';
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
import {
  HealthCheckup,
  HealthCheckupSchema,
} from '../health-checkup/entities/health-checkup.entity';
import { ClaudeSummaryCreditsModule } from '../claude-summary-credits/claude-summary-credits.module';
import { UsersModule } from '../users/users.module';
import { VitalsModule } from '../vitals/vitals.module';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdvancedHealthScore.name, schema: AdvancedHealthScoreSchema },
      { name: AdvancedScoreQuestion.name, schema: AdvancedScoreQuestionSchema },
      { name: AdvancedScoreSettings.name, schema: AdvancedScoreSettingsSchema },
      { name: HealthCheckup.name, schema: HealthCheckupSchema },
    ]),
    ClaudeSummaryCreditsModule,
    UsersModule,
    VitalsModule,
  ],
  controllers: [AdvancedHealthScoreController],
  providers: [AdvancedHealthScoreService, FileUploadHelper],
  exports: [AdvancedHealthScoreService],
})
export class AdvancedHealthScoreModule implements OnModuleInit {
  constructor(private readonly advancedHealthScoreService: AdvancedHealthScoreService) {}

  async onModuleInit() {
    // Ensure default settings exist
    await this.advancedHealthScoreService.ensureSettingsExist();

    // Seed default questions if none exist
    await this.advancedHealthScoreService.seedQuestions();
  }
}
