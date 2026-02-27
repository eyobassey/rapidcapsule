import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class EmailVerificationTokenDto {
  @ApiProperty({ description: 'User ID to generate verification token for', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  readonly userId: Types.ObjectId;
}
