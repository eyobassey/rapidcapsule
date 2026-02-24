import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ChannelPreferencesDto {
  @IsOptional()
  @IsBoolean()
  in_app?: boolean;

  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  push?: boolean;
}

class QuietHoursDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  start?: string; // e.g., "22:00"

  @IsOptional()
  @IsString()
  end?: string; // e.g., "07:00"

  @IsOptional()
  @IsString()
  timezone?: string;
}

class MessagingTimingDto {
  @IsOptional()
  @IsNumber()
  unread_threshold_minutes?: number; // default 20

  @IsOptional()
  @IsNumber()
  cooldown_hours?: number; // default 3
}

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  appointment_reminders?: ChannelPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  appointment_updates?: ChannelPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  payment_updates?: ChannelPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  health_reminders?: ChannelPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  vitals_alerts?: ChannelPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  prescription_updates?: ChannelPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  message_notifications?: ChannelPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  promotional?: ChannelPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quiet_hours?: QuietHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessagingTimingDto)
  messaging_timing?: MessagingTimingDto;
}

export class NotificationPreferencesResponseDto {
  appointment_reminders: ChannelPreferencesDto;
  appointment_updates: ChannelPreferencesDto;
  payment_updates: ChannelPreferencesDto;
  health_reminders: ChannelPreferencesDto;
  vitals_alerts: ChannelPreferencesDto;
  prescription_updates: ChannelPreferencesDto;
  message_notifications: ChannelPreferencesDto;
  promotional: ChannelPreferencesDto;
}
