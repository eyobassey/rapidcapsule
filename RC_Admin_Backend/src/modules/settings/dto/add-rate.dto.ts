import { Rate } from '../types/settings.types';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddRateDto {
  @ApiProperty({ description: 'Specialist category for this rate', example: 'General Practice' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: 'Medical specialization within the category', example: 'Family Medicine' })
  @IsNotEmpty()
  @IsString()
  specialization: string;

  @ApiProperty({ description: 'Rate object containing the numeric value and currency unit', type: () => Rate, example: { number: 15000, unit: 'NGN' } })
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => Rate)
  rate: Rate;

  @ApiProperty({ description: 'The admin settings document ID to attach this rate to', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  settingId: string;
}
