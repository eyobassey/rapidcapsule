import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsObject,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Reminder settings sub-DTO
class ReminderSettingDto {
  @ApiProperty({ description: 'Whether this reminder channel is enabled', example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'How far before the appointment to send reminder', example: '24h' })
  @IsString()
  timing: string;
}

class ReminderSettingsDto {
  @ApiProperty({ description: 'Email reminder settings', type: ReminderSettingDto })
  @ValidateNested()
  @Type(() => ReminderSettingDto)
  email: ReminderSettingDto;

  @ApiProperty({ description: 'SMS reminder settings', type: ReminderSettingDto })
  @ValidateNested()
  @Type(() => ReminderSettingDto)
  sms: ReminderSettingDto;
}

// Video settings sub-DTO
class VideoSettingsDto {
  @ApiPropertyOptional({ description: 'Video platform', example: 'zoom', enum: ['zoom', 'google_meet', 'microsoft_teams'] })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: 'Auto-generate meeting link on confirmation', example: true })
  @IsOptional()
  @IsBoolean()
  auto_generate_link?: boolean;

  @ApiPropertyOptional({ description: 'Enable waiting room for the meeting', example: true })
  @IsOptional()
  @IsBoolean()
  enable_waiting_room?: boolean;

  @ApiPropertyOptional({ description: 'Record the video session', example: false })
  @IsOptional()
  @IsBoolean()
  record_session?: boolean;
}

// New patient data sub-DTO
class NewPatientDataDto {
  @ApiProperty({ description: 'Full name of the new patient', example: 'Chinedu Okoro' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address', example: 'chinedu.okoro@gmail.com' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Phone number', example: '08012345678' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1985-03-20' })
  @IsOptional()
  @IsString()
  date_of_birth?: string;

  @ApiPropertyOptional({ description: 'Gender', example: 'Male' })
  @IsOptional()
  @IsString()
  gender?: string;
}

// Payment source enum
export enum PaymentSource {
  SPECIALIST_WALLET = 'specialist_wallet',
  PATIENT_WALLET = 'patient_wallet',
  CARD = 'card',
}

// Payment timing enum
export enum PaymentTiming {
  AT_BOOKING = 'at_booking',
  BEFORE = 'before',
  AFTER = 'after',
}

export class CreateSpecialistAppointmentDto {
  // Patient Information
  @ApiPropertyOptional({ description: 'Existing patient ID (omit if is_new_patient is true)', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsOptional()
  @Type(() => Types.ObjectId)
  patient_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Whether this is a new unregistered patient', example: false })
  @IsOptional()
  @IsBoolean()
  is_new_patient?: boolean;

  @ApiPropertyOptional({ description: 'New patient details (required when is_new_patient is true)', type: NewPatientDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewPatientDataDto)
  new_patient_data?: NewPatientDataDto;

  // Appointment Details
  @ApiProperty({ description: 'Specialist category ID', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: 'Appointment date', example: '2025-07-20' })
  @IsString()
  @IsNotEmpty()
  appointment_date: Date;

  @ApiProperty({ description: 'Start time (24h format)', example: '10:00' })
  @IsNotEmpty()
  @IsString()
  start_time: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 30 })
  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @ApiPropertyOptional({ description: 'Timezone', example: 'Africa/Lagos' })
  @IsOptional()
  timezone?: string;

  @ApiProperty({ description: 'Appointment type ID', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  @IsNotEmpty()
  @IsString()
  appointment_type: string;

  @ApiPropertyOptional({ description: 'Appointment type display name', example: 'General Consultation' })
  @IsOptional()
  @IsString()
  appointment_type_name?: string;

  @ApiPropertyOptional({ description: 'Meeting channel', example: 'zoom', enum: ['zoom', 'google_meet', 'microsoft_teams', 'phone', 'in_person'] })
  @IsOptional()
  @IsString()
  meeting_channel?: string;

  // Clinical Flags
  @ApiPropertyOptional({ description: 'Clinical flags for the appointment', example: ['follow-up', 'prescription-refill'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clinical_flags?: string[];

  // Fee & Payment
  @ApiPropertyOptional({ description: 'Consultation fee in smallest currency unit', example: 15000 })
  @IsOptional()
  @IsNumber()
  consultation_fee?: number;

  @ApiPropertyOptional({ description: 'Platform service fee', example: 1500 })
  @IsOptional()
  @IsNumber()
  platform_fee?: number;

  @ApiPropertyOptional({ description: 'Total amount (consultation + platform fee)', example: 16500 })
  @IsOptional()
  @IsNumber()
  total_amount?: number;

  @ApiPropertyOptional({ description: 'Payment source', enum: PaymentSource, example: 'specialist_wallet' })
  @IsOptional()
  @IsEnum(PaymentSource)
  payment_source?: PaymentSource;

  @ApiPropertyOptional({ description: 'When to process payment', enum: PaymentTiming, example: 'at_booking' })
  @IsOptional()
  @IsEnum(PaymentTiming)
  payment_timing?: PaymentTiming;

  @ApiPropertyOptional({ description: 'Promotional code for discount', example: 'FIRST50' })
  @IsOptional()
  @IsString()
  promo_code?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  // Video Settings
  @ApiPropertyOptional({ description: 'Video meeting configuration', type: VideoSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VideoSettingsDto)
  video_settings?: VideoSettingsDto;

  // Reminders
  @ApiPropertyOptional({ description: 'Appointment reminder settings', type: ReminderSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReminderSettingsDto)
  reminder_settings?: ReminderSettingsDto;

  @ApiPropertyOptional({ description: 'Buffer time in minutes between appointments', example: 15 })
  @IsOptional()
  @IsNumber()
  buffer_time?: number;

  // Recurring
  @ApiPropertyOptional({ description: 'Whether this is a recurring appointment', example: false })
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @ApiPropertyOptional({
    description: 'Recurring pattern configuration',
    example: { frequency: 'weekly', occurrences: 4, endDate: '2025-08-20' },
  })
  @IsOptional()
  @IsObject()
  recurring_pattern?: {
    frequency: string;
    occurrences: number;
    endDate?: string;
  };

  // Notes
  @ApiPropertyOptional({ description: 'Notes from the patient', example: 'I have been feeling dizzy for 2 days' })
  @IsOptional()
  @IsString()
  patient_notes?: string;

  @ApiPropertyOptional({ description: 'Private notes visible only to the specialist', example: 'Patient has history of vertigo, check inner ear' })
  @IsOptional()
  @IsString()
  private_notes?: string;

  @ApiPropertyOptional({
    description: 'File attachments for the appointment',
    example: [{ name: 'lab-results.pdf', url: 'https://s3.amazonaws.com/rapidcapsules/docs/lab.pdf', type: 'application/pdf', size: 245000 }],
  })
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    name: string;
    url: string;
    type?: string;
    size?: number;
  }>;

  // Notification options
  @ApiPropertyOptional({ description: 'Send booking confirmation to patient', example: true })
  @IsOptional()
  @IsBoolean()
  notify_patient?: boolean;

  @ApiPropertyOptional({ description: 'Send appointment reminders', example: true })
  @IsOptional()
  @IsBoolean()
  send_reminders?: boolean;

  // Status (for admin/specialist override)
  @ApiPropertyOptional({ description: 'Override appointment status (admin/specialist only)', example: 'Confirmed' })
  @IsOptional()
  @IsString()
  status?: string;
}
