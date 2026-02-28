import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';

import {
  RecoveryProfile,
  RecoveryProfileSchema,
} from './entities/recovery-profile.entity';
import {
  AddictionScreening,
  AddictionScreeningSchema,
} from './entities/addiction-screening.entity';
import {
  SobrietyLog,
  SobrietyLogSchema,
} from './entities/sobriety-log.entity';
import {
  RecoveryMilestone,
  RecoveryMilestoneSchema,
} from './entities/recovery-milestone.entity';
import {
  RecoveryJournal,
  RecoveryJournalSchema,
} from './entities/recovery-journal.entity';
import {
  CrisisEvent,
  CrisisEventSchema,
} from './entities/crisis-event.entity';
import {
  RecoveryPlan,
  RecoveryPlanSchema,
} from './entities/recovery-plan.entity';
import {
  CopingExerciseSession,
  CopingExerciseSessionSchema,
} from './entities/coping-exercise-session.entity';
import {
  RiskAssessmentReport,
  RiskAssessmentReportSchema,
} from './entities/risk-assessment-report.entity';

// Cross-module entities for the Risk Scoring Engine
import { Vital, VitalSchema } from '../vitals/entities/vital.entity';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/entities/appointment.entity';
import {
  Prescription,
  PrescriptionSchema,
} from '../prescriptions/entities/prescription.entity';
import { Drug, DrugSchema } from '../pharmacy/entities/drug.entity';
import {
  HealthCheckup,
  HealthCheckupSchema,
} from '../health-checkup/entities/health-checkup.entity';

import { AddictionScreeningService } from './services/addiction-screening.service';
import { RecoveryProfileService } from './services/recovery-profile.service';
import { SobrietyTrackerService } from './services/sobriety-tracker.service';
import { RecoveryCompanionService } from './services/recovery-companion.service';
import { CopingExerciseService } from './services/coping-exercise.service';
import { RiskScoringService } from './services/risk-scoring.service';

import { RiskEventListener } from './listeners/risk-event.listener';
import { RiskRecalculationScheduler } from './schedulers/risk-recalculation.scheduler';

import { AddictionScreeningController } from './controllers/addiction-screening.controller';
import { RecoveryProfileController } from './controllers/recovery-profile.controller';
import { SobrietyTrackerController } from './controllers/sobriety-tracker.controller';
import { RecoveryCompanionController } from './controllers/recovery-companion.controller';
import { CopingExerciseController } from './controllers/coping-exercise.controller';

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    MongooseModule.forFeature([
      // Recovery entities
      { name: RecoveryProfile.name, schema: RecoveryProfileSchema },
      { name: AddictionScreening.name, schema: AddictionScreeningSchema },
      { name: SobrietyLog.name, schema: SobrietyLogSchema },
      { name: RecoveryMilestone.name, schema: RecoveryMilestoneSchema },
      { name: RecoveryJournal.name, schema: RecoveryJournalSchema },
      { name: CrisisEvent.name, schema: CrisisEventSchema },
      { name: RecoveryPlan.name, schema: RecoveryPlanSchema },
      { name: CopingExerciseSession.name, schema: CopingExerciseSessionSchema },
      { name: RiskAssessmentReport.name, schema: RiskAssessmentReportSchema },
      // Cross-module entities for Risk Engine
      { name: Vital.name, schema: VitalSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: Drug.name, schema: DrugSchema },
      { name: HealthCheckup.name, schema: HealthCheckupSchema },
    ]),
  ],
  controllers: [
    AddictionScreeningController,
    RecoveryProfileController,
    SobrietyTrackerController,
    RecoveryCompanionController,
    CopingExerciseController,
  ],
  providers: [
    AddictionScreeningService,
    RecoveryProfileService,
    SobrietyTrackerService,
    RecoveryCompanionService,
    CopingExerciseService,
    RiskScoringService,
    RiskEventListener,
    RiskRecalculationScheduler,
  ],
  exports: [
    AddictionScreeningService,
    RecoveryProfileService,
    SobrietyTrackerService,
    RecoveryCompanionService,
    CopingExerciseService,
    RiskScoringService,
  ],
})
export class RecoveryModule {}
