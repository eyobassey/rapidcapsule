import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpecialistPatientsController } from './specialist-patients.controller';
import { SpecialistPatientsService } from './specialist-patients.service';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import {
  SpecialistPatientFlag,
  SpecialistPatientFlagSchema,
} from './entities/specialist-patient-flag.entity';
import {
  PatientAccessLog,
  PatientAccessLogSchema,
} from './entities/patient-access-log.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/entities/appointment.entity';
import {
  HealthCheckup,
  HealthCheckupSchema,
} from '../health-checkup/entities/health-checkup.entity';
import { Vital, VitalSchema } from '../vitals/entities/vital.entity';
import {
  Prescription,
  PrescriptionSchema,
} from '../prescriptions/entities/prescription.entity';
import {
  SpecialistPrescription,
  SpecialistPrescriptionSchema,
} from '../prescriptions/entities/specialist-prescription.entity';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadSchema,
} from '../pharmacy/entities/patient-prescription-upload.entity';
import {
  PharmacyOrder,
  PharmacyOrderSchema,
} from '../pharmacy/entities/pharmacy-order.entity';
import { Drug, DrugSchema } from '../pharmacy/entities/drug.entity';
import {
  AdvancedHealthScore,
  AdvancedHealthScoreSchema,
} from '../advanced-health-score/entities/advanced-health-score.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SpecialistPatientFlag.name, schema: SpecialistPatientFlagSchema },
      { name: PatientAccessLog.name, schema: PatientAccessLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: HealthCheckup.name, schema: HealthCheckupSchema },
      { name: Vital.name, schema: VitalSchema },
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: SpecialistPrescription.name, schema: SpecialistPrescriptionSchema },
      { name: PatientPrescriptionUpload.name, schema: PatientPrescriptionUploadSchema },
      { name: PharmacyOrder.name, schema: PharmacyOrderSchema },
      { name: Drug.name, schema: DrugSchema },
      { name: AdvancedHealthScore.name, schema: AdvancedHealthScoreSchema },
    ]),
  ],
  controllers: [SpecialistPatientsController],
  providers: [SpecialistPatientsService, FileUploadHelper],
  exports: [SpecialistPatientsService],
})
export class SpecialistPatientsModule {}
