import { Types } from 'mongoose';
import { Item } from '../types/prescription.types';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePrescriptionDto {
  @ApiProperty({ description: 'Patient ID to create the prescription for', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @Type(() => Types.ObjectId)
  patient: Types.ObjectId;

  @ApiProperty({ description: 'Prescription line items (medications with dosage, frequency, duration)', type: [Item] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Item)
  items: Item[];
}
