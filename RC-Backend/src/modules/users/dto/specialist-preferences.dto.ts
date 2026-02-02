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

export class SpecialistPreferencesDto {
  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => Preferences)
  preferences?: Preferences;

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => RateCards)
  rate_cards?: RateCards;

  @IsOptional()
  @IsObject()
  service_rates?: Record<string, {
    enabled: boolean;
    routine_rate?: number;
    urgent_rate?: number;
    flat_rate?: number;
  }>;

  @IsOptional()
  @IsObject()
  two_factor?: TwoFactorSettings;

  @IsOptional()
  @IsObject()
  notifications?: NotificationPreferences;

  @IsOptional()
  @IsObject()
  channels?: ChannelIntegrations;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  communication_languages?: string[];

  @IsOptional()
  @IsObject()
  privacy_consents?: PrivacyConsents;

  @IsOptional()
  @IsObject()
  final_consents?: {
    code_of_conduct: boolean;
    professional_indemnity: boolean;
    accepted_at?: string;
  };
}
