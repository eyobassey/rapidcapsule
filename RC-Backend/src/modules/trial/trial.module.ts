import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrialSession, TrialSessionSchema } from './trial.entity';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadSchema,
} from '../pharmacy/entities/patient-prescription-upload.entity';
import { TrialController } from './trial.controller';
import { TrialService } from './trial.service';
import { TrialGuard } from './trial.guard';
import { HealthCheckupModule } from '../health-checkup/health-checkup.module';
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { ClaudeHealthSummaryService } from '../health-checkup/services/claude-health-summary.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrialSession.name, schema: TrialSessionSchema },
      { name: PatientPrescriptionUpload.name, schema: PatientPrescriptionUploadSchema },
    ]),
    HealthCheckupModule,
    PharmacyModule,
  ],
  controllers: [TrialController],
  providers: [TrialService, TrialGuard, GeneralHelpers, ClaudeHealthSummaryService],
  exports: [TrialService],
})
export class TrialModule {}
