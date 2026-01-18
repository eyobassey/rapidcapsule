import { Module } from '@nestjs/common';
import { SpecialistsService } from './specialists.service';
import { SpecialistsController } from './specialists.controller';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { PatientsModule } from '../patients/patients.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../patients/entities/patient.entity';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from './entities/wallet-transactions.entity';
import { Appointment, AppointmentSchema } from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    PatientsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [SpecialistsController],
  providers: [SpecialistsService, GeneralHelpers, FileUploadHelper],
  exports: [SpecialistsService],
})
export class SpecialistsModule {}
