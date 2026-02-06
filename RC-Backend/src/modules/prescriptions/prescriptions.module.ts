import { Module } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Prescription,
  PrescriptionSchema,
} from './entities/prescription.entity';
import {
  PrescriptionFile,
  PrescriptionFileSchema,
} from './entities/prescription-file.entity';
import {
  SpecialistPrescription,
  SpecialistPrescriptionSchema,
} from './entities/specialist-prescription.entity';
import {
  StockReservation,
  StockReservationSchema,
} from './entities/stock-reservation.entity';
import {
  Drug,
  DrugSchema,
} from '../pharmacy/entities/drug.entity';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { TaskScheduler } from '../../core/worker/task.scheduler';
import { UsersModule } from '../users/users.module';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Order, OrderSchema } from './entities/order.entity';
import {
  PrescriptionDrug,
  PrescriptionDrugSchema,
} from './entities/drug.entity';
import { PaymentsModule } from '../payments/payments.module';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { PaymentHandler } from '../../common/external/payment/payment.handler';
import { Paystack } from '../../common/external/payment/providers/paystack';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { WalletsModule } from '../wallets/wallets.module';
import { UserSettingsModule } from '../user-settings/user-settings.module';
import { AccountingModule } from '../accounting/accounting.module';
import { SpecialistPrescriptionService } from './specialist-prescription.service';
import { PrescriptionPdfService } from './services/prescription-pdf.service';
import { RefillService } from './services/refill.service';
import { PrescriptionScheduledTasksService } from './services/prescription-scheduled-tasks.service';
import {
  SpecialistPrescriptionController,
  PatientPrescriptionController,
  PrescriptionPaymentController,
} from './specialist-prescription.controller';
import { PrescriptionVerifyController } from './prescription-verify.controller';

@Module({
  imports: [
    UsersModule,
    PaymentsModule,
    AdminSettingsModule,
    WalletsModule,
    UserSettingsModule,
    AccountingModule,
    MongooseModule.forFeature([
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: PrescriptionFile.name, schema: PrescriptionFileSchema },
      { name: Order.name, schema: OrderSchema },
      { name: PrescriptionDrug.name, schema: PrescriptionDrugSchema },
      { name: SpecialistPrescription.name, schema: SpecialistPrescriptionSchema },
      { name: StockReservation.name, schema: StockReservationSchema },
      { name: Drug.name, schema: DrugSchema },
    ]),
  ],
  controllers: [
    PrescriptionsController,
    SpecialistPrescriptionController,
    PatientPrescriptionController,
    PrescriptionPaymentController,
    PrescriptionVerifyController,
  ],
  providers: [
    PrescriptionsService,
    SpecialistPrescriptionService,
    PrescriptionPdfService,
    RefillService,
    PrescriptionScheduledTasksService,
    FileUploadHelper,
    TaskScheduler,
    SchedulerRegistry,
    GeneralHelpers,
    PaymentHandler,
    Paystack,
  ],
  exports: [SpecialistPrescriptionService, RefillService],
})
export class PrescriptionsModule {}
