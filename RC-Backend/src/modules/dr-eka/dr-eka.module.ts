import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DrEkaDataService } from './services/dr-eka-data.service';
import { DrEkaService } from './services/dr-eka.service';
import { DrEkaSchedulerService } from './services/dr-eka-scheduler.service';
import { DrEkaEmailService } from './services/dr-eka-email.service';
import { DrEkaController } from './dr-eka.controller';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import {
  DrEkaDailyDigest,
  DrEkaDailyDigestSchema,
} from './entities/daily-digest.entity';
import {
  DrEkaWeeklyReport,
  DrEkaWeeklyReportSchema,
} from './entities/weekly-report.entity';
import {
  DrEkaMonthlyReport,
  DrEkaMonthlyReportSchema,
} from './entities/monthly-report.entity';

// Imported schemas from other modules
import { User, UserSchema } from '../users/entities/user.entity';
import { Vital, VitalSchema } from '../vitals/entities/vital.entity';
import {
  HealthCheckup,
  HealthCheckupSchema,
} from '../health-checkup/entities/health-checkup.entity';
import {
  AdvancedHealthScore,
  AdvancedHealthScoreSchema,
} from '../advanced-health-score/entities/advanced-health-score.entity';
import {
  Prescription,
  PrescriptionSchema,
} from '../prescriptions/entities/prescription.entity';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/entities/appointment.entity';
import {
  EkaPatientMemory,
  EkaPatientMemorySchema,
} from '../eka/entities/eka-patient-memory.entity';
import {
  EkaConversation,
  EkaConversationSchema,
} from '../eka/entities/eka-conversation.entity';
import {
  HealthIntegration,
  HealthIntegrationSchema,
} from '../health-integrations/schemas/health-integration.schema';
import {
  RecoveryProfile,
  RecoveryProfileSchema,
} from '../recovery/entities/recovery-profile.entity';
import {
  SobrietyLog,
  SobrietyLogSchema,
} from '../recovery/entities/sobriety-log.entity';
import { Session, SessionSchema } from '../auth/entities/session.entity';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';
import {
  PharmacyOrder,
  PharmacyOrderSchema,
} from '../pharmacy/entities/pharmacy-order.entity';
import {
  HealthTip,
  HealthTipSchema,
} from '../health-tips/entities/health-tip.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      // Dr Eka own entities
      { name: DrEkaDailyDigest.name, schema: DrEkaDailyDigestSchema },
      { name: DrEkaWeeklyReport.name, schema: DrEkaWeeklyReportSchema },
      { name: DrEkaMonthlyReport.name, schema: DrEkaMonthlyReportSchema },

      // Cross-module schemas for data aggregation
      { name: User.name, schema: UserSchema },
      { name: Vital.name, schema: VitalSchema },
      { name: HealthCheckup.name, schema: HealthCheckupSchema },
      { name: AdvancedHealthScore.name, schema: AdvancedHealthScoreSchema },
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: EkaPatientMemory.name, schema: EkaPatientMemorySchema },
      { name: EkaConversation.name, schema: EkaConversationSchema },
      { name: HealthIntegration.name, schema: HealthIntegrationSchema },
      { name: RecoveryProfile.name, schema: RecoveryProfileSchema },
      { name: SobrietyLog.name, schema: SobrietyLogSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: PharmacyOrder.name, schema: PharmacyOrderSchema },
      { name: HealthTip.name, schema: HealthTipSchema },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [DrEkaController],
  providers: [DrEkaDataService, DrEkaService, DrEkaSchedulerService, DrEkaEmailService, GeneralHelpers],
  exports: [DrEkaDataService, DrEkaService],
})
export class DrEkaModule {}
