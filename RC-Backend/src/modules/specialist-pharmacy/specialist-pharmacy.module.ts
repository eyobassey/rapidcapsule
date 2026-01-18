import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpecialistPharmacyService } from './specialist-pharmacy.service';
import { SpecialistPharmacyController } from './specialist-pharmacy.controller';
import {
  SpecialistPrescription,
  SpecialistPrescriptionSchema,
} from '../prescriptions/entities/specialist-prescription.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@Module({
  imports: [
    WalletsModule,
    MongooseModule.forFeature([
      { name: SpecialistPrescription.name, schema: SpecialistPrescriptionSchema },
    ]),
  ],
  controllers: [SpecialistPharmacyController],
  providers: [SpecialistPharmacyService, GeneralHelpers, FileUploadHelper],
  exports: [SpecialistPharmacyService],
})
export class SpecialistPharmacyModule {}
