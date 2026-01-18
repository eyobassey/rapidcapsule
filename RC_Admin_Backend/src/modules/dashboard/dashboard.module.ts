import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PatientsModule } from "../patients/patients.module";
import { SpecialistsModule } from "../specialists/specialists.module";
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../patients/entities/patient.entity';
import { Appointment, AppointmentSchema } from '../appointments/entities/appointment.entity';
import { HealthCheckup, HealthCheckupSchema } from '../health-checkup/entities/health-checkup.entity';
import { Vital, VitalSchema } from '../vitals/entities/vital.entity';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@Module({
  imports: [
    PatientsModule,
    SpecialistsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: HealthCheckup.name, schema: HealthCheckupSchema },
      { name: Vital.name, schema: VitalSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, GeneralHelpers, FileUploadHelper],
})
export class DashboardModule {}
