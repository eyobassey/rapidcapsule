import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthTip, HealthTipSchema } from './entities/health-tip.entity';
import { HealthTipGeneration, HealthTipGenerationSchema } from './entities/health-tip-generation.entity';
import { HealthTipsController } from './health-tips.controller';
import { HealthTipsService } from './health-tips.service';
import { HealthTipsScheduledService } from './health-tips-scheduled.service';
import { HealthTipsDataService } from './services/data.service';
import { HealthTipsRuleEngine } from './services/rule-engine.service';
import { User, UserSchema } from '../users/entities/user.entity';
import { Vital, VitalSchema } from '../vitals/entities/vital.entity';
import { HealthCheckup, HealthCheckupSchema } from '../health-checkup/entities/health-checkup.entity';
import { AdvancedHealthScore, AdvancedHealthScoreSchema } from '../advanced-health-score/entities/advanced-health-score.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HealthTip.name, schema: HealthTipSchema },
      { name: HealthTipGeneration.name, schema: HealthTipGenerationSchema },
      { name: User.name, schema: UserSchema },
      { name: Vital.name, schema: VitalSchema },
      { name: HealthCheckup.name, schema: HealthCheckupSchema },
      { name: AdvancedHealthScore.name, schema: AdvancedHealthScoreSchema },
    ]),
  ],
  controllers: [HealthTipsController],
  providers: [
    HealthTipsService,
    HealthTipsScheduledService,
    HealthTipsDataService,
    HealthTipsRuleEngine,
  ],
  exports: [HealthTipsService],
})
export class HealthTipsModule {}
