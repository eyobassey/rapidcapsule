import { Module } from '@nestjs/common';
import { HealthCheckupService } from './health-checkup.service';
import { HealthCheckupController } from './health-checkup.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HealthCheckup,
  HealthCheckupSchema,
} from './entities/health-checkup.entity';
import { ClaudeHealthSummaryService } from './services/claude-health-summary.service';
import { User, UserSchema } from '../users/entities/user.entity';
import { ClaudeSummaryCreditsModule } from '../claude-summary-credits/claude-summary-credits.module';

@Module({
  imports: [
    ClaudeSummaryCreditsModule,
    MongooseModule.forFeature([
      { name: HealthCheckup.name, schema: HealthCheckupSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [HealthCheckupController],
  providers: [HealthCheckupService, ClaudeHealthSummaryService],
})
export class HealthCheckupModule {}
