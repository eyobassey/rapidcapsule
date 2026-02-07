import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
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
  promotional?: ChannelPreferencesDto;
}

export class NotificationPreferencesResponseDto {
  appointment_reminders: ChannelPreferencesDto;
  appointment_updates: ChannelPreferencesDto;
  payment_updates: ChannelPreferencesDto;
  health_reminders: ChannelPreferencesDto;
  vitals_alerts: ChannelPreferencesDto;
  prescription_updates: ChannelPreferencesDto;
  promotional: ChannelPreferencesDto;
}
