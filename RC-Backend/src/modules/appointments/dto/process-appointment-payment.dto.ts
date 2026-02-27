import { IsNotEmpty, IsString, IsNumber, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AppointmentPaymentSource {
  PATIENT_WALLET = 'patient_wallet',
  SPECIALIST_WALLET = 'specialist_wallet',
}

export class ProcessAppointmentPaymentDto {
  @ApiProperty({ description: 'Patient MongoDB ID', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsMongoId()
  patient_id: string;

  @ApiProperty({ description: 'Consultation fee amount in kobo/cents', example: 15000 })
  @IsNotEmpty()
  @IsNumber()
  consultation_fee: number;

  @ApiProperty({ description: 'Platform service fee in kobo/cents', example: 1500 })
  @IsNotEmpty()
  @IsNumber()
  platform_fee: number;

  @ApiProperty({ description: 'Total amount to charge (consultation_fee + platform_fee)', example: 16500 })
  @IsNotEmpty()
  @IsNumber()
  total_amount: number;

  @ApiProperty({ description: 'Which wallet to debit for payment', enum: AppointmentPaymentSource, example: 'patient_wallet' })
  @IsNotEmpty()
  @IsEnum(AppointmentPaymentSource)
  payment_source: AppointmentPaymentSource;

  @ApiPropertyOptional({ description: 'Appointment type ID', example: '64c3d4e5f6a7b8c9d0e1f2a3' })
  @IsOptional()
  @IsString()
  appointment_type?: string;

  @ApiPropertyOptional({ description: 'Appointment type display name', example: 'General Consultation' })
  @IsOptional()
  @IsString()
  appointment_type_name?: string;
}
