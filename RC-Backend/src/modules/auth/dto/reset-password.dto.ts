import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../../core/decorators/match.decorators';

export class ResetPasswordDto {
  @ApiProperty({ description: 'New password', example: 'NewSecurePassword456!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Must match the password field', example: 'NewSecurePassword456!' })
  @IsString()
  @IsNotEmpty()
  @Match('password')
  confirm_password: string;

  @ApiProperty({ description: 'Password reset token received via email', example: 'abc123def456' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'User ID from the reset link', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
