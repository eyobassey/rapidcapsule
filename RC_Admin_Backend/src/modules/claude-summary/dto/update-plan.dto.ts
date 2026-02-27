import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType } from '../entities/claude-summary-plan.entity';

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: 'Updated display name of the summary plan', example: 'Premium Bundle' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated plan type determining billing model', enum: PlanType, example: PlanType.UNLIMITED_MONTHLY })
  @IsOptional()
  @IsEnum(PlanType)
  type?: PlanType;

  @ApiPropertyOptional({ description: 'Updated number of summary credits included in the plan', example: 25, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  credits?: number;

  @ApiPropertyOptional({ description: 'Updated plan price in the base currency (NGN)', example: 5000, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Updated currency code for the plan price', example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Updated duration in days for unlimited plans', example: 365, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration_days?: number;

  @ApiPropertyOptional({ description: 'Whether the plan is visible and available for purchase', example: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Updated display order for sorting plans in the storefront', example: 3, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sort_order?: number;

  @ApiPropertyOptional({ description: 'Updated short description of the plan', example: 'Best value for frequent users needing unlimited AI health summaries' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Updated multi-currency pricing object keyed by currency code', example: { USD: { price: 10 }, GBP: { price: 8 }, NGN: { price: 5000 } } })
  @IsOptional()
  @IsObject()
  prices?: Record<string, { price: number }>;
}
