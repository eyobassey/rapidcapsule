import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthTip, HealthTipSchema } from './entities/health-tip.entity';
import { HealthTipGeneration, HealthTipGenerationSchema } from './entities/health-tip-generation.entity';
import { HealthTipsController } from './health-tips.controller';
import { HealthTipsService } from './health-tips.service';
import { HealthTipsScheduledService } from './health-tips-scheduled.service';
import { HealthTipsDataService } from './services/data.service';
import { HealthTipsRuleEngine } from './services/rule-engine.service';
import { HealthInsightsTriggerService } from './services/insight-trigger.service';
import { VitalsBridgeService } from './services/vitals-bridge.service';
import { User, UserSchema } from '../users/entities/user.entity';
import { Vital, VitalSchema } from '../vitals/entities/vital.entity';
import { HealthCheckup, HealthCheckupSchema } from '../health-checkup/entities/health-checkup.entity';
import { AdvancedHealthScore, AdvancedHealthScoreSchema } from '../advanced-health-score/entities/advanced-health-score.entity';
import { Prescription, PrescriptionSchema } from '../prescriptions/entities/prescription.entity';
import { Appointment, AppointmentSchema } from '../appointments/entities/appointment.entity';
import { EkaPatientMemory, EkaPatientMemorySchema } from '../eka/entities/eka-patient-memory.entity';
import { HealthIntegration, HealthIntegrationSchema } from '../health-integrations/schemas/health-integration.schema';
import { RecoveryProfile, RecoveryProfileSchema } from '../recovery/entities/recovery-profile.entity';
import { SobrietyLog, SobrietyLogSchema } from '../recovery/entities/sobriety-log.entity';
import { NotificationsModule } from '../notifications/notifications.module';

// Event listeners
import { VitalsInsightListener } from './listeners/vitals.listener';
import { HealthCheckupInsightListener } from './listeners/health-checkup.listener';
import { PrescriptionInsightListener } from './listeners/prescription.listener';
import { WearableSyncInsightListener } from './listeners/wearable-sync.listener';
import { AppointmentInsightListener } from './listeners/appointment.listener';
import { RecoveryInsightListener } from './listeners/recovery.listener';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HealthTip.name, schema: HealthTipSchema },
      { name: HealthTipGeneration.name, schema: HealthTipGenerationSchema },
      { name: User.name, schema: UserSchema },
      { name: Vital.name, schema: VitalSchema },
      { name: HealthCheckup.name, schema: HealthCheckupSchema },
      { name: AdvancedHealthScore.name, schema: AdvancedHealthScoreSchema },
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: EkaPatientMemory.name, schema: EkaPatientMemorySchema },
      { name: HealthIntegration.name, schema: HealthIntegrationSchema },
      { name: RecoveryProfile.name, schema: RecoveryProfileSchema },
      { name: SobrietyLog.name, schema: SobrietyLogSchema },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [HealthTipsController],
  providers: [
    HealthTipsService,
    HealthTipsScheduledService,
    HealthTipsDataService,
    HealthTipsRuleEngine,
    HealthInsightsTriggerService,
    VitalsBridgeService,
    // Event listeners
    VitalsInsightListener,
    HealthCheckupInsightListener,
    PrescriptionInsightListener,
    WearableSyncInsightListener,
    AppointmentInsightListener,
    RecoveryInsightListener,
  ],
  exports: [HealthTipsService, HealthInsightsTriggerService],
})
export class HealthTipsModule {}
