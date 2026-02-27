import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailChangeDto {
  @ApiProperty({ description: 'New email address being verified', example: 'newemail@example.com' })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '6-digit OTP code sent to the new email', example: '291034' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
