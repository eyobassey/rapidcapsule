import { IsBoolean, IsNumber, IsObject, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ShareMessagesDto {
  @IsOptional()
  whatsapp?: string;

  @IsOptional()
  twitter?: string;

  @IsOptional()
  facebook?: string;

  @IsOptional()
  linkedin?: string;

  @IsOptional()
  email_subject?: string;

  @IsOptional()
  email_body?: string;

  @IsOptional()
  sms?: string;
}

class HeroBannerDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  subtitle?: string;

  @IsOptional()
  background_color?: string;

  @IsOptional()
  text_color?: string;

  @IsOptional()
  @IsBoolean()
  show_stats?: boolean;
}

class MilestoneDto {
  @IsNumber()
  referrals_required: number;

  @IsOptional()
  reward_type?: string;

  @IsOptional()
  @IsNumber()
  reward_value?: number;

  @IsOptional()
  badge_name?: string;

  @IsOptional()
  badge_icon?: string;
}

export class UpdateReferralSettingsDto {
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  referrer_credits?: number;

  @IsOptional()
  @IsNumber()
  referee_credits?: number;

  @IsOptional()
  @IsNumber()
  referrer_points?: number;

  @IsOptional()
  @IsNumber()
  referee_points?: number;

  @IsOptional()
  @IsBoolean()
  reward_on_signup?: boolean;

  @IsOptional()
  @IsBoolean()
  reward_on_first_appointment?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ShareMessagesDto)
  share_messages?: ShareMessagesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => HeroBannerDto)
  hero_banner?: HeroBannerDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];
}
