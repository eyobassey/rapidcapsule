import { Types } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SpecialistAverageRating {
  @ApiProperty({ description: 'Specialist user ID to get average rating for', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  readonly specialistId: Types.ObjectId;
}
