import { Types } from 'mongoose';
import { Rate, SpecialistRate } from '../types/settings.types';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRateDto {
  @ApiProperty({ description: 'The ID of the specialist rate to update', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  rateId: Types.ObjectId;

  @ApiProperty({ description: 'Updated specialist rate object with category, specialization, and rate details', type: () => SpecialistRate })
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => SpecialistRate)
  specialistRate: SpecialistRate;
}
