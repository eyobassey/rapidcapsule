import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailOtpVerifyDto {
  @ApiProperty({ description: '6-digit OTP code sent to email', example: '483921' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Email address that received the OTP', example: 'patient@example.com' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
