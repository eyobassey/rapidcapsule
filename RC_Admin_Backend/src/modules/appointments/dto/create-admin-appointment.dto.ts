import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export enum MeetingChannel {
  ZOOM = 'zoom',
  WHATSAPP = 'whatsapp',
  GOOGLE_MEET = 'google_meet',
  MICROSOFT_TEAMS = 'microsoft_teams',
  PHONE = 'phone',
  IN_PERSON = 'in_person',
}

export class CreateAdminAppointmentDto {
  @IsNotEmpty()
  @Type(() => Types.ObjectId)
  patient_id: Types.ObjectId;

  @IsNotEmpty()
  @Type(() => Types.ObjectId)
  specialist_id: Types.ObjectId;

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
  @IsString()
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
  admin_notes?: string;

  @IsOptional()
  @IsEnum(MeetingChannel)
  meeting_channel?: MeetingChannel;

  @IsOptional()
  @IsString()
  whatsapp_number?: string; // For WhatsApp channel

  @IsOptional()
  @IsString()
  location?: string; // For in-person appointments

  @IsOptional()
  @IsString()
  phone_number?: string; // For phone appointments
}
