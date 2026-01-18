import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { WalletsModule } from '../wallets/wallets.module';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { GeneralHelpers } from '../../common/helpers/general.helpers';

// Entities
import { Drug, DrugSchema } from './entities/drug.entity';
import { Pharmacy, PharmacySchema } from './entities/pharmacy.entity';
import { Inventory, InventorySchema } from './entities/inventory.entity';
import {
  InventoryAdjustment,
  InventoryAdjustmentSchema,
} from './entities/inventory-adjustment.entity';
import {
  PharmacyOrder,
  PharmacyOrderSchema,
} from './entities/pharmacy-order.entity';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadSchema,
} from './entities/patient-prescription-upload.entity';
import {
  PrescriptionFingerprint,
  PrescriptionFingerprintSchema,
} from './entities/prescription-fingerprint.entity';
import {
  PrescriptionVerification,
  PrescriptionVerificationSchema,
} from './entities/prescription-verification.entity';
import {
  DrugSafetyInfo,
  DrugSafetyInfoSchema,
} from './entities/drug-safety-info.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import {
  SpecialistPrescription,
  SpecialistPrescriptionSchema,
} from '../prescriptions/entities/specialist-prescription.entity';

// Services
import { DrugService } from './services/drug.service';
import { PharmacyService } from './services/pharmacy.service';
import { InventoryService } from './services/inventory.service';
import { PharmacyOrderService } from './services/pharmacy-order.service';
import { AbusePreventionService } from './services/abuse-prevention.service';
import { TextractService } from './services/textract.service';
import { FingerprintService } from './services/fingerprint.service';
import { PrescriptionVerificationService } from './services/prescription-verification.service';
import { ClaudeAIService } from './services/claude-ai.service';
import { DocumentProcessorService } from './services/document-processor.service';
import { PharmacyScheduledTasksService } from './services/pharmacy-scheduled-tasks.service';
import { OpenFDAService } from './services/openfda.service';
import { DrugInteractionService } from './services/drug-interaction.service';
import { OrderConfirmationPdfService } from './services/order-confirmation-pdf.service';

// Controllers
import { DrugController } from './controllers/drug.controller';
import { PharmacyController } from './controllers/pharmacy.controller';
import { InventoryController } from './controllers/inventory.controller';
import { PharmacyOrderController } from './controllers/pharmacy-order.controller';
import { PrescriptionUploadController } from './controllers/prescription-upload.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Drug.name, schema: DrugSchema },
      { name: Pharmacy.name, schema: PharmacySchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: InventoryAdjustment.name, schema: InventoryAdjustmentSchema },
      { name: PharmacyOrder.name, schema: PharmacyOrderSchema },
      { name: PatientPrescriptionUpload.name, schema: PatientPrescriptionUploadSchema },
      { name: PrescriptionFingerprint.name, schema: PrescriptionFingerprintSchema },
      { name: PrescriptionVerification.name, schema: PrescriptionVerificationSchema },
      { name: DrugSafetyInfo.name, schema: DrugSafetyInfoSchema },
      { name: User.name, schema: UserSchema },
      { name: SpecialistPrescription.name, schema: SpecialistPrescriptionSchema },
    ]),
    forwardRef(() => WalletsModule),
    HttpModule,
  ],
  controllers: [
    DrugController,
    PharmacyController,
    InventoryController,
    PharmacyOrderController,
    PrescriptionUploadController,
  ],
  providers: [
    DrugService,
    PharmacyService,
    InventoryService,
    PharmacyOrderService,
    AbusePreventionService,
    TextractService,
    FingerprintService,
    PrescriptionVerificationService,
    ClaudeAIService,
    DocumentProcessorService,
    PharmacyScheduledTasksService,
    OpenFDAService,
    DrugInteractionService,
    OrderConfirmationPdfService,
    FileUploadHelper,
    GeneralHelpers,
  ],
  exports: [
    DrugService,
    PharmacyService,
    InventoryService,
    PharmacyOrderService,
    AbusePreventionService,
    TextractService,
    FingerprintService,
    PrescriptionVerificationService,
    ClaudeAIService,
    DocumentProcessorService,
    OpenFDAService,
    DrugInteractionService,
  ],
})
export class PharmacyModule {}
