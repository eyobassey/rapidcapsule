import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @ApiProperty({ description: 'Subscription plan name', example: 'Premium Monthly' })
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty({ description: 'Unique plan code', example: 'PREMIUM_MONTHLY' })
  @IsNotEmpty()
  @IsString()
  readonly code: string;

  @ApiProperty({ description: 'Plan amount in NGN', example: 5000 })
  @IsNotEmpty()
  @Type(() => Number)
  readonly amount: number;

  @ApiPropertyOptional({ description: 'Free trial period in days', example: 14 })
  @IsOptional()
  @Type(() => Number)
  readonly trial_days: number;
}
