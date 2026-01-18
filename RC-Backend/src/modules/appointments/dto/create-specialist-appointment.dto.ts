import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export class CreateSpecialistAppointmentDto {
  @IsNotEmpty()
  @Type(() => Types.ObjectId)
  patient_id: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsString()
  @IsNotEmpty()
  appointment_date: Date;

  @IsNotEmpty()
  @IsString()
  start_time: string;

  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @IsOptional()
  timezone?: string;

  @IsNotEmpty()
  @IsString()
  appointment_type: string;

  @IsOptional()
  @IsNumber()
  consultation_fee?: number;

  @IsOptional()
  @IsString()
  patient_notes?: string;

  @IsOptional()
  @IsString()
  private_notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
