import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClaudeSummaryCreditsModule } from '../claude-summary-credits/claude-summary-credits.module';

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
import {
  GroupSession,
  GroupSessionSchema,
} from './entities/group-session.entity';
import {
  PeerAssignment,
  PeerAssignmentSchema,
} from './entities/peer-assignment.entity';

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
import { MilestoneCheckerScheduler } from './schedulers/milestone-checker.scheduler';
import { CheckInReminderScheduler } from './schedulers/check-in-reminder.scheduler';
import { MATComplianceScheduler } from './schedulers/mat-compliance.scheduler';

import { AddictionScreeningController } from './controllers/addiction-screening.controller';
import { RecoveryProfileController } from './controllers/recovery-profile.controller';
import { SobrietyTrackerController } from './controllers/sobriety-tracker.controller';
import { RecoveryCompanionController } from './controllers/recovery-companion.controller';
import { CopingExerciseController } from './controllers/coping-exercise.controller';
import { RelapseRiskController } from './controllers/relapse-risk.controller';
import { WithdrawalAssessmentController } from './controllers/withdrawal-assessment.controller';
import { WithdrawalAssessmentService } from './services/withdrawal-assessment.service';
import { GroupSessionService } from './services/group-session.service';
import { PeerSupportService } from './services/peer-support.service';
import { RecoveryPlanService } from './services/recovery-plan.service';
import { GroupSessionController } from './controllers/group-session.controller';
import { PeerSupportController } from './controllers/peer-support.controller';
import { RecoveryPlanController } from './controllers/recovery-plan.controller';
import { MATProtocolService } from './services/mat-protocol.service';
import { MATProtocolController } from './controllers/mat-protocol.controller';
import { HarmReductionService } from './services/harm-reduction.service';
import { HarmReductionController } from './controllers/harm-reduction.controller';
import { CrisisInterventionService } from './services/crisis-intervention.service';
import { CrisisInterventionController } from './controllers/crisis-intervention.controller';
import { User, UserSchema } from '../users/entities/user.entity';
import {
  EkaConversation,
  EkaConversationSchema,
} from '../eka/entities/eka-conversation.entity';
import {
  SpecialistPrescription,
  SpecialistPrescriptionSchema,
} from '../prescriptions/entities/specialist-prescription.entity';

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    ClaudeSummaryCreditsModule,
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
      { name: GroupSession.name, schema: GroupSessionSchema },
      { name: PeerAssignment.name, schema: PeerAssignmentSchema },
      // Cross-module entities for Risk Engine
      { name: Vital.name, schema: VitalSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: Drug.name, schema: DrugSchema },
      { name: HealthCheckup.name, schema: HealthCheckupSchema },
      { name: User.name, schema: UserSchema },
      { name: SpecialistPrescription.name, schema: SpecialistPrescriptionSchema },
      { name: EkaConversation.name, schema: EkaConversationSchema },
    ]),
  ],
  controllers: [
    AddictionScreeningController,
    RecoveryProfileController,
    SobrietyTrackerController,
    RecoveryCompanionController,
    CopingExerciseController,
    RelapseRiskController,
    WithdrawalAssessmentController,
    GroupSessionController,
    PeerSupportController,
    RecoveryPlanController,
    MATProtocolController,
    HarmReductionController,
    CrisisInterventionController,
  ],
  providers: [
    AddictionScreeningService,
    RecoveryProfileService,
    SobrietyTrackerService,
    RecoveryCompanionService,
    CopingExerciseService,
    RiskScoringService,
    WithdrawalAssessmentService,
    GroupSessionService,
    PeerSupportService,
    RecoveryPlanService,
    RiskEventListener,
    RiskRecalculationScheduler,
    MilestoneCheckerScheduler,
    CheckInReminderScheduler,
    MATComplianceScheduler,
    MATProtocolService,
    HarmReductionService,
    CrisisInterventionService,
  ],
  exports: [
    AddictionScreeningService,
    RecoveryProfileService,
    SobrietyTrackerService,
    RecoveryCompanionService,
    CopingExerciseService,
    RiskScoringService,
    GroupSessionService,
    PeerSupportService,
    RecoveryPlanService,
    MATProtocolService,
    HarmReductionService,
    CrisisInterventionService,
  ],
})
export class RecoveryModule {}
