import { Rate } from '../types/settings.types';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddSplitRatioDto {
  @ApiProperty({ description: 'Display name for the split ratio recipient', example: 'Platform Commission' })
  @IsNotEmpty()
  @IsString()
  display_name: string;

  @ApiProperty({ description: 'Percentage share for this split ratio (0-100)', example: 20 })
  @IsNotEmpty()
  @IsNumber()
  percentage: number;

  @ApiProperty({ description: 'The admin settings document ID to attach this split ratio to', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  settingId: string;
}
