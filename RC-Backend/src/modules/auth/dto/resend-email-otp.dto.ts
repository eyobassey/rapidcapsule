import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendEmailOtpDto {
  @ApiProperty({ description: 'Email address to resend OTP to', example: 'patient@example.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  readonly email: string;
}
