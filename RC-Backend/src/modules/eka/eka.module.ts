import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EkaController } from './eka.controller';
import { EkaService } from './eka.service';
import { EkaConversation, EkaConversationSchema } from './entities/eka-conversation.entity';
import { Vital, VitalSchema } from '../vitals/entities/vital.entity';
import { HealthCheckup, HealthCheckupSchema } from '../health-checkup/entities/health-checkup.entity';
import { ClaudeHealthSummaryService } from '../health-checkup/services/claude-health-summary.service';
import { Prescription, PrescriptionSchema } from '../prescriptions/entities/prescription.entity';
import { SpecialistPrescription, SpecialistPrescriptionSchema } from '../prescriptions/entities/specialist-prescription.entity';
import { PatientPrescriptionUpload, PatientPrescriptionUploadSchema } from '../pharmacy/entities/patient-prescription-upload.entity';
import { PharmacyOrder, PharmacyOrderSchema } from '../pharmacy/entities/pharmacy-order.entity';
import { BasicHealthScoreHistory, BasicHealthScoreHistorySchema } from '../basic-health-score/entities/basic-health-score-history.entity';
import { AdvancedHealthScore, AdvancedHealthScoreSchema } from '../advanced-health-score/entities/advanced-health-score.entity';
import { Order, OrderSchema } from '../prescriptions/entities/order.entity';
import { Appointment, AppointmentSchema } from '../appointments/entities/appointment.entity';
import { Drug, DrugSchema } from '../pharmacy/entities/drug.entity';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { ClaudeSummaryCredit, ClaudeSummaryCreditSchema } from '../claude-summary-credits/entities/claude-summary-credit.entity';
import { ClaudeSummaryPlan, ClaudeSummaryPlanSchema } from '../claude-summary-credits/entities/claude-summary-plan.entity';
import { ClaudeSummaryCreditsModule } from '../claude-summary-credits/claude-summary-credits.module';
import { ClaudeAIService } from '../pharmacy/services/claude-ai.service';
import { TextractService } from '../pharmacy/services/textract.service';
import { RecoveryProfile, RecoveryProfileSchema } from '../recovery/entities/recovery-profile.entity';
import { AddictionScreening, AddictionScreeningSchema } from '../recovery/entities/addiction-screening.entity';
import { SobrietyLog, SobrietyLogSchema } from '../recovery/entities/sobriety-log.entity';
import { RecoveryMilestone, RecoveryMilestoneSchema } from '../recovery/entities/recovery-milestone.entity';
import { RecoveryJournal, RecoveryJournalSchema } from '../recovery/entities/recovery-journal.entity';
import { CrisisEvent, CrisisEventSchema } from '../recovery/entities/crisis-event.entity';
import { RecoveryPlan, RecoveryPlanSchema } from '../recovery/entities/recovery-plan.entity';
import { CopingExerciseSession, CopingExerciseSessionSchema } from '../recovery/entities/coping-exercise-session.entity';
import { RiskAssessmentReport, RiskAssessmentReportSchema } from '../recovery/entities/risk-assessment-report.entity';
import { RecoveryModule } from '../recovery/recovery.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EkaConversation.name, schema: EkaConversationSchema },
      { name: Vital.name, schema: VitalSchema },
      { name: HealthCheckup.name, schema: HealthCheckupSchema },
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: SpecialistPrescription.name, schema: SpecialistPrescriptionSchema },
      { name: PatientPrescriptionUpload.name, schema: PatientPrescriptionUploadSchema },
      { name: PharmacyOrder.name, schema: PharmacyOrderSchema },
      { name: BasicHealthScoreHistory.name, schema: BasicHealthScoreHistorySchema },
      { name: AdvancedHealthScore.name, schema: AdvancedHealthScoreSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Drug.name, schema: DrugSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: User.name, schema: UserSchema },
      { name: ClaudeSummaryCredit.name, schema: ClaudeSummaryCreditSchema },
      { name: ClaudeSummaryPlan.name, schema: ClaudeSummaryPlanSchema },
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
    ]),
    ClaudeSummaryCreditsModule,
    forwardRef(() => RecoveryModule),
  ],
  controllers: [EkaController],
  providers: [EkaService, ClaudeHealthSummaryService, ClaudeAIService, TextractService],
  exports: [EkaService],
})
export class EkaModule {}
