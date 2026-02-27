import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType } from '../entities/claude-summary-plan.entity';

export class CreatePlanDto {
  @ApiProperty({ description: 'Display name of the summary plan', example: 'Starter Bundle' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Plan type determining billing model', enum: PlanType, example: PlanType.BUNDLE })
  @IsEnum(PlanType)
  type: PlanType;

  @ApiPropertyOptional({ description: 'Number of summary credits included in the plan. Required for bundle plans, optional for unlimited plans.', example: 10, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  credits?: number; // Required for bundle, optional for unlimited

  @ApiProperty({ description: 'Plan price in the base currency (NGN)', example: 2500, minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Currency code for the plan price', example: 'NGN', default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Duration in days for unlimited plans (e.g., 30 for monthly, 365 for yearly). Required for unlimited plans.', example: 30, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration_days?: number; // Required for unlimited plans

  @ApiPropertyOptional({ description: 'Whether the plan is visible and available for purchase', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting plans in the storefront (lower numbers appear first)', example: 1, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sort_order?: number;

  @ApiPropertyOptional({ description: 'Short description of the plan displayed to patients', example: 'Perfect for patients who need occasional AI health summaries' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Multi-currency pricing object keyed by currency code', example: { USD: { price: 5 }, GBP: { price: 4 }, NGN: { price: 2500 } } })
  @IsOptional()
  @IsObject()
  prices?: Record<string, { price: number }>;
}
