import { IsNotEmpty, IsString, IsNumber, IsEnum, IsMongoId, IsOptional } from 'class-validator';

export enum AppointmentPaymentSource {
  PATIENT_WALLET = 'patient_wallet',
  SPECIALIST_WALLET = 'specialist_wallet',
}

export class ProcessAppointmentPaymentDto {
  @IsNotEmpty()
  @IsMongoId()
  patient_id: string;

  @IsNotEmpty()
  @IsNumber()
  consultation_fee: number;

  @IsNotEmpty()
  @IsNumber()
  platform_fee: number;

  @IsNotEmpty()
  @IsNumber()
  total_amount: number;

  @IsNotEmpty()
  @IsEnum(AppointmentPaymentSource)
  payment_source: AppointmentPaymentSource;

  @IsOptional()
  @IsString()
  appointment_type?: string;

  @IsOptional()
  @IsString()
  appointment_type_name?: string;
}
