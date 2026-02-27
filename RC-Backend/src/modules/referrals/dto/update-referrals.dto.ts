import { Types } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReferralsDto {
  @ApiProperty({ description: 'User ID of the referee (person being referred)', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  referee: Types.ObjectId;

  @ApiProperty({ description: 'Referral code used during signup', example: 'ADAEZE-RC2025' })
  @IsNotEmpty()
  @IsString()
  referral_code: string;
}
