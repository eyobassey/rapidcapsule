import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsultationServiceDto {
  @ApiProperty({ description: 'Service name', example: 'General Consultation' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'general-consultation' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Service description', example: 'Standard medical consultation with a general practitioner' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'ri-stethoscope-line' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Icon colour', example: '#1E88E5' })
  @IsOptional()
  @IsString()
  icon_color?: string;

  @ApiPropertyOptional({ description: 'Icon background colour', example: '#E3F2FD' })
  @IsOptional()
  @IsString()
  icon_bg_color?: string;

  @ApiPropertyOptional({ description: 'Pricing model type', enum: ['flat', 'routine_urgent'], example: 'routine_urgent' })
  @IsOptional()
  @IsEnum(['flat', 'routine_urgent'])
  pricing_type?: string;

  @ApiPropertyOptional({ description: 'Minimum consultation rate in NGN', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_rate?: number;

  @ApiPropertyOptional({ description: 'Maximum consultation rate in NGN', example: 25000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_rate?: number;

  @ApiPropertyOptional({ description: 'Default currency code', example: 'NGN' })
  @IsOptional()
  @IsString()
  default_currency?: string;

  @ApiPropertyOptional({ description: 'Whether this service is active', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 1 })
  @IsOptional()
  @IsNumber()
  display_order?: number;

  @ApiPropertyOptional({ description: 'Whether this is a default service', example: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({ description: 'Additional info text shown to users', example: 'Includes follow-up within 48 hours' })
  @IsOptional()
  @IsString()
  info_text?: string;

  @ApiPropertyOptional({ description: 'Whether to show AI-powered badge', example: true })
  @IsOptional()
  @IsBoolean()
  show_ai_badge?: boolean;

  @ApiPropertyOptional({ description: 'Currency-specific rate overrides', example: { NGN: { min_rate: 5000, max_rate: 25000 }, USD: { min_rate: 10, max_rate: 50 } } })
  @IsOptional()
  @IsObject()
  rates?: Record<string, { min_rate: number; max_rate: number }>;
}
