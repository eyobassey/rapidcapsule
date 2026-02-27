import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendPhoneOtpDto {
  @ApiProperty({ description: 'Email address linked to the phone number', example: 'patient@example.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  readonly email: string;
}
