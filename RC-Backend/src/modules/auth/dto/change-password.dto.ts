import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../../core/decorators/match.decorators';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  current_password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  new_password: string;

  @IsString()
  @IsNotEmpty()
  @Match('new_password', { message: 'Passwords do not match' })
  confirm_password: string;
}
