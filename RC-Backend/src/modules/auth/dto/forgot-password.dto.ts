import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email address associated with the account', example: 'patient@example.com' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
