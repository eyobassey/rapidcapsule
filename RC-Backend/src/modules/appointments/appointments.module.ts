import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentScheduledTasksService } from './appointment-scheduled-tasks.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from './entities/appointment.entity';
import { Zoom } from '../../common/external/zoom/zoom';
import { UsersModule } from '../users/users.module';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { TaskScheduler } from '../../core/worker/task.scheduler';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PaymentHandler } from '../../common/external/payment/payment.handler';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { Paystack } from '../../common/external/payment/providers/paystack';
import { PaymentsModule } from '../payments/payments.module';
import { CardsModule } from '../cards/cards.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import {
  AppointmentReferral,
  AppointmentReferralSchema,
} from './entities/referral.entity';
import { ClinicalNotesModule } from '../clinical-notes/clinical-notes.module';
import { JwtModule } from '@nestjs/jwt';
import { AdminOrJwtGuard } from './guards/admin-or-jwt.guard';
import { HealthCheckupModule } from '../health-checkup/health-checkup.module';
import { AdvancedHealthScoreModule } from '../advanced-health-score/advanced-health-score.module';
import { VitalsModule } from '../vitals/vitals.module';
import { AccountingModule } from '../accounting/accounting.module';
import { ConsultationServicesModule } from '../consultation-services/consultation-services.module';
import { WalletsModule } from '../wallets/wallets.module';
import {
  SpecialistPrescription,
  SpecialistPrescriptionSchema,
} from '../prescriptions/entities/specialist-prescription.entity';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadSchema,
} from '../pharmacy/entities/patient-prescription-upload.entity';
import {
  PharmacyOrder,
  PharmacyOrderSchema,
} from '../pharmacy/entities/pharmacy-order.entity';

@Module({
  imports: [
    UsersModule,
    AdminSettingsModule,
    PaymentsModule,
    CardsModule,
    SubscriptionsModule,
    ClinicalNotesModule,
    HealthCheckupModule,
    AdvancedHealthScoreModule,
    VitalsModule,
    AccountingModule,
    ConsultationServicesModule,
    WalletsModule,
    JwtModule.register({
      secret: process.env.JWTKEY || 'theBestKepSecret',
      signOptions: { expiresIn: '24h' },
    }),
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: AppointmentReferral.name, schema: AppointmentReferralSchema },
      { name: SpecialistPrescription.name, schema: SpecialistPrescriptionSchema },
      { name: PatientPrescriptionUpload.name, schema: PatientPrescriptionUploadSchema },
      { name: PharmacyOrder.name, schema: PharmacyOrderSchema },
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AppointmentScheduledTasksService,
    Zoom,
    FileUploadHelper,
    GeneralHelpers,
    TaskScheduler,
    SchedulerRegistry,
    PaymentHandler,
    Paystack,
    AdminOrJwtGuard,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

