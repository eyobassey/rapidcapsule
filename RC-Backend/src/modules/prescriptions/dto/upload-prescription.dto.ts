import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Documents } from '../../users/types/profile.types';
import { Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadPrescriptionDto {
  @ApiProperty({ description: 'Specialist ID who issued the prescription', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsString()
  specialist: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Uploaded prescription document files (images/PDFs)', type: [Documents] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Documents)
  documents?: Documents[];
}
