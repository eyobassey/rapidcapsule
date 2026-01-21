import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BasicHealthScoreService } from './basic-health-score.service';
import { BasicHealthScoreController } from './basic-health-score.controller';
import {
  BasicHealthScoreHistory,
  BasicHealthScoreHistorySchema,
} from './entities/basic-health-score-history.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Vital, VitalSchema } from '../vitals/entities/vital.entity';
import { HealthCheckup, HealthCheckupSchema } from '../health-checkup/entities/health-checkup.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BasicHealthScoreHistory.name, schema: BasicHealthScoreHistorySchema },
      { name: User.name, schema: UserSchema },
      { name: Vital.name, schema: VitalSchema },
      { name: HealthCheckup.name, schema: HealthCheckupSchema },
    ]),
  ],
  controllers: [BasicHealthScoreController],
  providers: [BasicHealthScoreService],
  exports: [BasicHealthScoreService],
})
export class BasicHealthScoreModule {}
