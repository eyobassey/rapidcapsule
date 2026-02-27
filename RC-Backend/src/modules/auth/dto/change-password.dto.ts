import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../../core/decorators/match.decorators';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current account password', example: 'OldPassword123!' })
  @IsString()
  @IsNotEmpty()
  current_password: string;

  @ApiProperty({ description: 'New password (min 8 characters)', example: 'NewSecurePassword456!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  new_password: string;

  @ApiProperty({ description: 'Must match new_password', example: 'NewSecurePassword456!' })
  @IsString()
  @IsNotEmpty()
  @Match('new_password', { message: 'Passwords do not match' })
  confirm_password: string;
}
