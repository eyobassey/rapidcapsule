import { PromotionType, RewardType } from '../entities/promotion.entity';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CreatePromotionDto {
  @ApiProperty({ description: 'Promotion type', enum: PromotionType })
  @IsNotEmpty()
  @IsEnum(PromotionType)
  readonly type: PromotionType;

  @ApiProperty({ description: 'Type of reward', enum: RewardType })
  @IsNotEmpty()
  @IsEnum(RewardType)
  readonly reward_type: RewardType;

  @ApiPropertyOptional({ description: 'Promotion code', example: 'NEWUSER2025' })
  @IsOptional()
  readonly code: string;

  @ApiPropertyOptional({ description: 'Promotion start date', example: '2025-01-01' })
  @IsOptional()
  readonly start_date: Date;

  @ApiPropertyOptional({ description: 'Promotion end date', example: '2025-06-30' })
  @IsOptional()
  readonly end_date: Date;

  @ApiProperty({ description: 'Target user class', example: 'Patient' })
  @IsNotEmpty()
  @IsString()
  readonly user_class: string;

  @ApiPropertyOptional({ description: 'Fixed reward value in NGN', example: 2000 })
  @IsOptional()
  readonly value: number;

  @ApiPropertyOptional({ description: 'Percentage discount', example: 15 })
  @IsOptional()
  readonly percent_off: number;

  @ApiPropertyOptional({ description: 'Promotion ID (for updates)' })
  readonly promotionId: Types.ObjectId;
}
