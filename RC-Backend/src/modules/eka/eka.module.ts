import { Module } from '@nestjs/common';
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
    ]),
    ClaudeSummaryCreditsModule,
  ],
  controllers: [EkaController],
  providers: [EkaService, ClaudeHealthSummaryService, ClaudeAIService, TextractService],
})
export class EkaModule {}
