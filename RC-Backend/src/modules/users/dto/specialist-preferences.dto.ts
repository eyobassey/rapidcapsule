import { IsObject, IsNotEmptyObject, ValidateNested, IsOptional, IsArray, IsString } from 'class-validator';
import {
  Preferences,
  RateCards,
  TwoFactorSettings,
  NotificationPreferences,
  ChannelIntegrations,
  PrivacyConsents,
} from '../types/preference.types';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SpecialistPreferencesDto {
  @ApiPropertyOptional({ description: 'General specialist preferences (consultation mode, auto-accept, etc.)', type: Preferences })
  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => Preferences)
  preferences?: Preferences;

  @ApiPropertyOptional({ description: 'Consultation rate cards', type: RateCards })
  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => RateCards)
  rate_cards?: RateCards;

  @ApiPropertyOptional({
    description: 'Per-service rate configuration',
    example: { 'General Consultation': { enabled: true, routine_rate: 15000, urgent_rate: 25000 }, 'Follow-up': { enabled: true, flat_rate: 8000 } },
  })
  @IsOptional()
  @IsObject()
  service_rates?: Record<string, {
    enabled: boolean;
    routine_rate?: number;
    urgent_rate?: number;
    flat_rate?: number;
  }>;

  @ApiPropertyOptional({ description: 'Two-factor authentication settings' })
  @IsOptional()
  @IsObject()
  two_factor?: TwoFactorSettings;

  @ApiPropertyOptional({ description: 'Notification preferences (email, SMS, push)' })
  @IsOptional()
  @IsObject()
  notifications?: NotificationPreferences;

  @ApiPropertyOptional({ description: 'Channel integrations (Zoom, WhatsApp, etc.)' })
  @IsOptional()
  @IsObject()
  channels?: ChannelIntegrations;

  @ApiPropertyOptional({ description: 'Languages for patient communication', example: ['English', 'Hausa'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  communication_languages?: string[];

  @ApiPropertyOptional({ description: 'Privacy and data sharing consents' })
  @IsOptional()
  @IsObject()
  privacy_consents?: PrivacyConsents;

  @ApiPropertyOptional({
    description: 'Final regulatory consents required before activation',
    example: { code_of_conduct: true, professional_indemnity: true, accepted_at: '2025-06-15T10:30:00Z' },
  })
  @IsOptional()
  @IsObject()
  final_consents?: {
    code_of_conduct: boolean;
    professional_indemnity: boolean;
    accepted_at?: string;
  };
}
