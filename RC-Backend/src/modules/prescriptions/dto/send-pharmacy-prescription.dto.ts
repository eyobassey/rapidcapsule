import { Types } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPharmacyPrescriptionDto {
  @ApiProperty({ description: 'Pharmacy ID to send the prescription to', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  @IsNotEmpty()
  @IsString()
  pharmacy: Types.ObjectId;

  @ApiProperty({ description: 'Prescription ID to send', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsString()
  prescriptionId: Types.ObjectId;
}
