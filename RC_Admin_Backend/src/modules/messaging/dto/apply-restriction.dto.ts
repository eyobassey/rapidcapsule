import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DurationDto {
  @ApiProperty({ example: 24 })
  @IsNumber()
  @Min(1)
  value: number;

  @ApiProperty({ enum: ['hours', 'days', 'weeks', 'months'] })
  @IsEnum(['hours', 'days', 'weeks', 'months'])
  unit: 'hours' | 'days' | 'weeks' | 'months';
}

export class ApplyRestrictionDto {
  @ApiProperty({ description: 'User IDs to restrict', example: ['64abc...'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  user_ids: string[];

  @ApiProperty({ enum: ['read_only', 'blocked'] })
  @IsEnum(['read_only', 'blocked'])
  type: 'read_only' | 'blocked';

  @ApiPropertyOptional({ description: 'Reason for restriction' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Duration (null = indefinite)' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DurationDto)
  duration?: DurationDto;
}

export class SetMessageCapDto {
  @ApiProperty({ description: 'User IDs to set cap for', example: ['64abc...'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  user_ids: string[];

  @ApiProperty({ description: 'Message limit', example: 50 })
  @IsNumber()
  @Min(1)
  limit: number;

  @ApiProperty({ enum: ['daily', 'monthly'] })
  @IsEnum(['daily', 'monthly'])
  period: 'daily' | 'monthly';
}
