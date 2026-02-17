import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrialSession, TrialSessionSchema } from './trial.entity';
import { TrialSettings, TrialSettingsSchema } from './trial-settings.entity';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadSchema,
} from '../pharmacy/entities/patient-prescription-upload.entity';
import { TrialController } from './trial.controller';
import { TrialService } from './trial.service';
import { TrialGuard } from './trial.guard';
import { HealthCheckupModule } from '../health-checkup/health-checkup.module';
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import { EkaModule } from '../eka/eka.module';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { ClaudeHealthSummaryService } from '../health-checkup/services/claude-health-summary.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrialSession.name, schema: TrialSessionSchema },
      { name: TrialSettings.name, schema: TrialSettingsSchema },
      { name: PatientPrescriptionUpload.name, schema: PatientPrescriptionUploadSchema },
    ]),
    HealthCheckupModule,
    PharmacyModule,
    EkaModule,
  ],
  controllers: [TrialController],
  providers: [TrialService, TrialGuard, GeneralHelpers, ClaudeHealthSummaryService],
  exports: [TrialService],
})
export class TrialModule {}
