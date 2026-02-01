import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { SpecialistPatientsModule } from '../specialist-patients/specialist-patients.module';
import { AccountingModule } from '../accounting/accounting.module';
import { User, UserSchema } from '../users/entities/user.entity';
import { Appointment, AppointmentSchema } from '../appointments/entities/appointment.entity';
import { SpecialistPrescription, SpecialistPrescriptionSchema } from '../prescriptions/entities/specialist-prescription.entity';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: SpecialistPrescription.name, schema: SpecialistPrescriptionSchema },
    ]),
    WalletsModule,
    AppointmentsModule,
    SpecialistPatientsModule,
    AccountingModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, FileUploadHelper],
})
export class DashboardModule {}
