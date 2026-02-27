import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ChannelPreferencesDto {
  @ApiPropertyOptional({
    description: 'Enable or disable in-app notifications for this category',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  in_app?: boolean;

  @ApiPropertyOptional({
    description: 'Enable or disable email notifications for this category',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({
    description: 'Enable or disable SMS notifications for this category',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @ApiPropertyOptional({
    description: 'Enable or disable WhatsApp notifications for this category',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  whatsapp?: boolean;

  @ApiPropertyOptional({
    description: 'Enable or disable push notifications for this category',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  push?: boolean;
}

class QuietHoursDto {
  @ApiPropertyOptional({
    description: 'Whether quiet hours are enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Start time for quiet hours in HH:mm format',
    example: '22:00',
  })
  @IsOptional()
  @IsString()
  start?: string; // e.g., "22:00"

  @ApiPropertyOptional({
    description: 'End time for quiet hours in HH:mm format',
    example: '07:00',
  })
  @IsOptional()
  @IsString()
  end?: string; // e.g., "07:00"

  @ApiPropertyOptional({
    description: 'Timezone for quiet hours (IANA timezone identifier)',
    example: 'Africa/Lagos',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

class MessagingTimingDto {
  @ApiPropertyOptional({
    description: 'Minutes to wait before sending an unread messages reminder notification',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  unread_threshold_minutes?: number; // default 20

  @ApiPropertyOptional({
    description: 'Minimum hours between consecutive unread message reminder notifications',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  cooldown_hours?: number; // default 3
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({
    description: 'Channel preferences for appointment reminder notifications',
    type: () => ChannelPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  appointment_reminders?: ChannelPreferencesDto;

  @ApiPropertyOptional({
    description: 'Channel preferences for appointment update notifications (booked, rescheduled, cancelled)',
    type: () => ChannelPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  appointment_updates?: ChannelPreferencesDto;

  @ApiPropertyOptional({
    description: 'Channel preferences for payment-related notifications (receipts, refunds, wallet)',
    type: () => ChannelPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  payment_updates?: ChannelPreferencesDto;

  @ApiPropertyOptional({
    description: 'Channel preferences for health reminder notifications',
    type: () => ChannelPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  health_reminders?: ChannelPreferencesDto;

  @ApiPropertyOptional({
    description: 'Channel preferences for vitals alert notifications (abnormal readings)',
    type: () => ChannelPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  vitals_alerts?: ChannelPreferencesDto;

  @ApiPropertyOptional({
    description: 'Channel preferences for prescription update notifications',
    type: () => ChannelPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  prescription_updates?: ChannelPreferencesDto;

  @ApiPropertyOptional({
    description: 'Channel preferences for messaging notifications (new messages, unread reminders)',
    type: () => ChannelPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  message_notifications?: ChannelPreferencesDto;

  @ApiPropertyOptional({
    description: 'Channel preferences for promotional and marketing notifications',
    type: () => ChannelPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  promotional?: ChannelPreferencesDto;

  @ApiPropertyOptional({
    description: 'Quiet hours configuration to suppress notifications during specified times',
    type: () => QuietHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quiet_hours?: QuietHoursDto;

  @ApiPropertyOptional({
    description: 'Timing preferences for messaging-related notification delivery',
    type: () => MessagingTimingDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessagingTimingDto)
  messaging_timing?: MessagingTimingDto;
}

export class NotificationPreferencesResponseDto {
  @ApiProperty({
    description: 'Channel preferences for appointment reminders',
    type: () => ChannelPreferencesDto,
  })
  appointment_reminders: ChannelPreferencesDto;

  @ApiProperty({
    description: 'Channel preferences for appointment updates',
    type: () => ChannelPreferencesDto,
  })
  appointment_updates: ChannelPreferencesDto;

  @ApiProperty({
    description: 'Channel preferences for payment updates',
    type: () => ChannelPreferencesDto,
  })
  payment_updates: ChannelPreferencesDto;

  @ApiProperty({
    description: 'Channel preferences for health reminders',
    type: () => ChannelPreferencesDto,
  })
  health_reminders: ChannelPreferencesDto;

  @ApiProperty({
    description: 'Channel preferences for vitals alerts',
    type: () => ChannelPreferencesDto,
  })
  vitals_alerts: ChannelPreferencesDto;

  @ApiProperty({
    description: 'Channel preferences for prescription updates',
    type: () => ChannelPreferencesDto,
  })
  prescription_updates: ChannelPreferencesDto;

  @ApiProperty({
    description: 'Channel preferences for message notifications',
    type: () => ChannelPreferencesDto,
  })
  message_notifications: ChannelPreferencesDto;

  @ApiProperty({
    description: 'Channel preferences for promotional notifications',
    type: () => ChannelPreferencesDto,
  })
  promotional: ChannelPreferencesDto;
}
