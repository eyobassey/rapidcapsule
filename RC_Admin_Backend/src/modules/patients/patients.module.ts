import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { User, UserSchema } from './entities/patient.entity';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from './entities/subscription.entity';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { Appointment, AppointmentSchema } from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService, GeneralHelpers],
  exports: [PatientsService]
})
export class PatientsModule {}
