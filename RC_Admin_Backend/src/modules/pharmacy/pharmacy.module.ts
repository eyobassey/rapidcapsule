import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PharmacyController } from './pharmacy.controller';
import { ComplianceController } from './compliance.controller';
import { PharmacyService } from './pharmacy.service';
import { DrugCategoryEntity, DrugCategorySchema } from './entities/drug-category.entity';
import { DrugClassificationEntity, DrugClassificationSchema } from './entities/drug-classification.entity';
import { DrugRouteEntity, DrugRouteSchema } from './entities/drug-route.entity';
import { DosageFormEntity, DosageFormSchema } from './entities/dosage-form.entity';
import { DrugEntity, DrugSchema } from './entities/drug.entity';
import { ManufacturerEntity, ManufacturerSchema } from './entities/manufacturer.entity';
import { SupplierEntity, SupplierSchema } from './entities/supplier.entity';
import { StockBatchEntity, StockBatchSchema } from './entities/stock-batch.entity';
import { StockTransactionEntity, StockTransactionSchema } from './entities/stock-transaction.entity';
import { Pharmacy, PharmacySchema } from './entities/pharmacy.entity';
import { AuditLog, AuditLogSchema } from './entities/audit-log.entity';
import { FraudAlert, FraudAlertSchema } from './entities/fraud-alert.entity';
import { DrugSafetyInfo, DrugSafetyInfoSchema } from './entities/drug-safety-info.entity';
import { AuditLogService } from './services/audit-log.service';
import { FraudAlertService } from './services/fraud-alert.service';
import { OpenFDAService } from './services/openfda.service';
import { ClaudeAIService } from './services/claude-ai.service';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { GeneralHelpers } from '../../common/helpers/general.helpers';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DrugCategoryEntity.name, schema: DrugCategorySchema },
      { name: DrugClassificationEntity.name, schema: DrugClassificationSchema },
      { name: DrugRouteEntity.name, schema: DrugRouteSchema },
      { name: DosageFormEntity.name, schema: DosageFormSchema },
      { name: DrugEntity.name, schema: DrugSchema },
      { name: ManufacturerEntity.name, schema: ManufacturerSchema },
      { name: SupplierEntity.name, schema: SupplierSchema },
      { name: StockBatchEntity.name, schema: StockBatchSchema },
      { name: StockTransactionEntity.name, schema: StockTransactionSchema },
      { name: Pharmacy.name, schema: PharmacySchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: FraudAlert.name, schema: FraudAlertSchema },
      { name: DrugSafetyInfo.name, schema: DrugSafetyInfoSchema },
    ]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [PharmacyController, ComplianceController],
  providers: [
    PharmacyService,
    AuditLogService,
    FraudAlertService,
    OpenFDAService,
    ClaudeAIService,
    FileUploadHelper,
    GeneralHelpers,
  ],
  exports: [PharmacyService, AuditLogService, FraudAlertService, OpenFDAService],
})
export class PharmacyModule implements OnModuleInit {
  constructor(private pharmacyService: PharmacyService) {}

  async onModuleInit() {
    // Initialize all system data on startup
    await this.pharmacyService.initializeAllData();
  }
}
