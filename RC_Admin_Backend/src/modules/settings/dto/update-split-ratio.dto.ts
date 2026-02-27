import {
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SpecialistRate, SplitRatio } from '../types/settings.types';

export class UpdateSplitRatioDto {
  @ApiProperty({ description: 'The ID of the split ratio to update', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  splitRatioId: Types.ObjectId;

  @ApiProperty({ description: 'Updated split ratio object with display name and percentage', type: () => SplitRatio })
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => SplitRatio)
  splitRatio: SplitRatio;
}
