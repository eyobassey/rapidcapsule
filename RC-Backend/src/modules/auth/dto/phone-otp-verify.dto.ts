import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PhoneOtpVerifyDto {
  @ApiProperty({ description: '6-digit OTP code sent via SMS', example: '739201' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  code: string;

  @ApiProperty({ description: 'Email address associated with the account', example: 'patient@example.com' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
