import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { PlanType } from '../entities/claude-summary-plan.entity';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsEnum(PlanType)
  type: PlanType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  credits?: number; // Required for bundle, optional for unlimited

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration_days?: number; // Required for unlimited plans

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
