import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @Type(() => Types.ObjectId)
  patient_id: Types.ObjectId;

  @ApiProperty({ description: 'Specialist user ID', example: '507f1f77bcf86cd799439012' })
  @IsNotEmpty()
  @Type(() => Types.ObjectId)
  specialist_id: Types.ObjectId;

  @ApiProperty({ description: 'Appointment category', example: 'Cardiology' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: 'Appointment date', example: '2025-10-15' })
  @IsString()
  @IsNotEmpty()
  appointment_date: Date;

  @ApiProperty({ description: 'Start time in HH:mm format', example: '09:00' })
  @IsNotEmpty()
  @IsString()
  start_time: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 30 })
  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @ApiPropertyOptional({ description: 'Timezone', example: 'Africa/Lagos' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ description: 'Type of appointment', example: 'consultation' })
  @IsNotEmpty()
  @IsString()
  appointment_type: string;

  @ApiPropertyOptional({ description: 'Consultation fee in NGN', example: 15000 })
  @IsOptional()
  @IsNumber()
  consultation_fee?: number;

  @ApiPropertyOptional({ description: 'Notes from the patient', example: 'I have been experiencing chest pains' })
  @IsOptional()
  @IsString()
  patient_notes?: string;

  @ApiPropertyOptional({ description: 'Administrative notes', example: 'Priority patient — follow-up from last month' })
  @IsOptional()
  @IsString()
  admin_notes?: string;

  @ApiPropertyOptional({ description: 'Meeting channel', enum: MeetingChannel, example: MeetingChannel.ZOOM })
  @IsOptional()
  @IsEnum(MeetingChannel)
  meeting_channel?: MeetingChannel;

  @ApiPropertyOptional({ description: 'WhatsApp number for WhatsApp channel', example: '+2348012345678' })
  @IsOptional()
  @IsString()
  whatsapp_number?: string;

  @ApiPropertyOptional({ description: 'Location for in-person appointments', example: '15 Awolowo Road, Ikeja, Lagos' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Phone number for phone appointments', example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone_number?: string;
}
