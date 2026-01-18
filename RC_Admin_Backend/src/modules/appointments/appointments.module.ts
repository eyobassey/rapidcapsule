import { Module, forwardRef } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { Appointment, AppointmentSchema } from './entities/appointment.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientsModule } from '../patients/patients.module';
import { SpecialistsModule } from '../specialists/specialists.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => PatientsModule),
    forwardRef(() => SpecialistsModule),
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, GeneralHelpers],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
