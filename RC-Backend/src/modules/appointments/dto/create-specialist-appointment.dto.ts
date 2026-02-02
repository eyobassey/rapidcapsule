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

// Reminder settings sub-DTO
class ReminderSettingDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  timing: string; // e.g., '24h', '1h', '15m'
}

class ReminderSettingsDto {
  @ValidateNested()
  @Type(() => ReminderSettingDto)
  email: ReminderSettingDto;

  @ValidateNested()
  @Type(() => ReminderSettingDto)
  sms: ReminderSettingDto;
}

// Video settings sub-DTO
class VideoSettingsDto {
  @IsOptional()
  @IsString()
  platform?: string; // 'zoom' | 'google_meet' | 'microsoft_teams'

  @IsOptional()
  @IsBoolean()
  auto_generate_link?: boolean;

  @IsOptional()
  @IsBoolean()
  enable_waiting_room?: boolean;

  @IsOptional()
  @IsBoolean()
  record_session?: boolean;
}

// New patient data sub-DTO
class NewPatientDataDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  date_of_birth?: string;

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
  @IsOptional()
  @Type(() => Types.ObjectId)
  patient_id?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  is_new_patient?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewPatientDataDto)
  new_patient_data?: NewPatientDataDto;

  // Appointment Details
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
  @IsString()
  appointment_type_name?: string;

  @IsOptional()
  @IsString()
  meeting_channel?: string; // 'zoom' | 'google_meet' | 'microsoft_teams' | 'phone' | 'in_person'

  // Clinical Flags
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clinical_flags?: string[];

  // Fee & Payment
  @IsOptional()
  @IsNumber()
  consultation_fee?: number;

  @IsOptional()
  @IsNumber()
  platform_fee?: number;

  @IsOptional()
  @IsNumber()
  total_amount?: number;

  @IsOptional()
  @IsEnum(PaymentSource)
  payment_source?: PaymentSource;

  @IsOptional()
  @IsEnum(PaymentTiming)
  payment_timing?: PaymentTiming;

  @IsOptional()
  @IsString()
  promo_code?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  // Video Settings
  @IsOptional()
  @ValidateNested()
  @Type(() => VideoSettingsDto)
  video_settings?: VideoSettingsDto;

  // Reminders
  @IsOptional()
  @ValidateNested()
  @Type(() => ReminderSettingsDto)
  reminder_settings?: ReminderSettingsDto;

  @IsOptional()
  @IsNumber()
  buffer_time?: number;

  // Recurring
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @IsOptional()
  @IsObject()
  recurring_pattern?: {
    frequency: string;
    occurrences: number;
    endDate?: string;
  };

  // Notes
  @IsOptional()
  @IsString()
  patient_notes?: string;

  @IsOptional()
  @IsString()
  private_notes?: string;

  @IsOptional()
  @IsArray()
  attachments?: Array<{
    name: string;
    url: string;
    type?: string;
    size?: number;
  }>;

  // Notification options
  @IsOptional()
  @IsBoolean()
  notify_patient?: boolean;

  @IsOptional()
  @IsBoolean()
  send_reminders?: boolean;

  // Status (for admin/specialist override)
  @IsOptional()
  @IsString()
  status?: string;
}
