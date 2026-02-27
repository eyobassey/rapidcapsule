import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PhoneVerifyDto {
  @ApiProperty({ description: '6-digit verification code sent via SMS', example: '583012' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  code: string;

  @ApiProperty({ description: 'Phone number that received the code (10-11 digits)', example: '8012345678' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(11)
  phone: string;
}
