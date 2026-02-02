import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min } from 'class-validator';

export class CreateConsultationServiceDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  icon_color?: string;

  @IsOptional()
  @IsString()
  icon_bg_color?: string;

  @IsOptional()
  @IsEnum(['flat', 'routine_urgent'])
  pricing_type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_rate?: number;

  @IsOptional()
  @IsString()
  default_currency?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  display_order?: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsOptional()
  @IsString()
  info_text?: string;

  @IsOptional()
  @IsBoolean()
  show_ai_badge?: boolean;
}
