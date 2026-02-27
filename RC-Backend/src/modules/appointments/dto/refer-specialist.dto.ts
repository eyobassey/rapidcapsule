import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';
import { ReferralType } from '../types/referral-types';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReferSpecialistDto {
  @ApiProperty({ description: 'Specialists to refer the patient to', type: [ReferralType] })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReferralType)
  specialists: ReferralType[];

  @ApiProperty({ description: 'Referral reason and clinical notes for the receiving specialist', example: 'Patient requires ENT evaluation for chronic sinusitis not responding to first-line treatment.' })
  @IsNotEmpty()
  @IsString()
  referral_note: string;

  @ApiProperty({ description: 'Patient ID being referred', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsString()
  patient: Types.ObjectId;

  @ApiProperty({ description: 'Original appointment ID that triggered the referral', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  @IsNotEmpty()
  @IsString()
  appointment: Types.ObjectId;
}
