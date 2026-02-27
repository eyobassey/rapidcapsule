import { IsBoolean, IsNumber, IsObject, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ShareMessagesDto {
  @ApiPropertyOptional({ description: 'WhatsApp share message template', example: 'Join RapidCapsule with my referral code {code} and get free health credits!' })
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional({ description: 'Twitter share message template', example: 'Get quality healthcare on @RapidCapsule. Use my code {code}' })
  @IsOptional()
  twitter?: string;

  @ApiPropertyOptional({ description: 'Facebook share message template', example: 'I recommend RapidCapsule for telemedicine! Use code {code}' })
  @IsOptional()
  facebook?: string;

  @ApiPropertyOptional({ description: 'LinkedIn share message template', example: 'Check out RapidCapsule for digital healthcare. Referral: {code}' })
  @IsOptional()
  linkedin?: string;

  @ApiPropertyOptional({ description: 'Email subject line template', example: 'Your friend invited you to RapidCapsule' })
  @IsOptional()
  email_subject?: string;

  @ApiPropertyOptional({ description: 'Email body template', example: 'Hi! I have been using RapidCapsule for my health needs. Join with code {code}.' })
  @IsOptional()
  email_body?: string;

  @ApiPropertyOptional({ description: 'SMS share message template', example: 'Join RapidCapsule with code {code}. Visit rapidcapsule.com' })
  @IsOptional()
  sms?: string;
}

class HeroBannerDto {
  @ApiPropertyOptional({ description: 'Banner title text', example: 'Refer & Earn' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Banner subtitle text', example: 'Share RapidCapsule with friends and earn health credits' })
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Banner background colour', example: '#1565C0' })
  @IsOptional()
  background_color?: string;

  @ApiPropertyOptional({ description: 'Banner text colour', example: '#FFFFFF' })
  @IsOptional()
  text_color?: string;

  @ApiPropertyOptional({ description: 'Whether to show referral stats on the banner', example: true })
  @IsOptional()
  @IsBoolean()
  show_stats?: boolean;
}

class MilestoneDto {
  @ApiProperty({ description: 'Number of referrals needed to reach this milestone', example: 5 })
  @IsNumber()
  referrals_required: number;

  @ApiPropertyOptional({ description: 'Type of reward for this milestone', example: 'credits' })
  @IsOptional()
  reward_type?: string;

  @ApiPropertyOptional({ description: 'Reward value', example: 500 })
  @IsOptional()
  @IsNumber()
  reward_value?: number;

  @ApiPropertyOptional({ description: 'Badge name earned at this milestone', example: 'Health Advocate' })
  @IsOptional()
  badge_name?: string;

  @ApiPropertyOptional({ description: 'Badge icon identifier', example: 'ri-medal-line' })
  @IsOptional()
  badge_icon?: string;
}

export class UpdateReferralSettingsDto {
  @ApiPropertyOptional({ description: 'Whether the referral programme is enabled', example: true })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Credits awarded to the referrer', example: 100 })
  @IsOptional()
  @IsNumber()
  referrer_credits?: number;

  @ApiPropertyOptional({ description: 'Credits awarded to the referred user', example: 50 })
  @IsOptional()
  @IsNumber()
  referee_credits?: number;

  @ApiPropertyOptional({ description: 'Points awarded to the referrer', example: 10 })
  @IsOptional()
  @IsNumber()
  referrer_points?: number;

  @ApiPropertyOptional({ description: 'Points awarded to the referred user', example: 5 })
  @IsOptional()
  @IsNumber()
  referee_points?: number;

  @ApiPropertyOptional({ description: 'Whether to reward on signup', example: true })
  @IsOptional()
  @IsBoolean()
  reward_on_signup?: boolean;

  @ApiPropertyOptional({ description: 'Whether to reward on first appointment', example: false })
  @IsOptional()
  @IsBoolean()
  reward_on_first_appointment?: boolean;

  @ApiPropertyOptional({ description: 'Share message templates for each platform', type: ShareMessagesDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ShareMessagesDto)
  share_messages?: ShareMessagesDto;

  @ApiPropertyOptional({ description: 'Hero banner configuration for referral page', type: HeroBannerDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => HeroBannerDto)
  hero_banner?: HeroBannerDto;

  @ApiPropertyOptional({ description: 'Referral milestones and rewards', type: [MilestoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];
}
