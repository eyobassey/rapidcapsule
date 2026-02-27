import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Patient email address', example: 'patient@example.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  readonly email: string;

  @ApiProperty({ description: 'Account password (min 6 characters)', example: 'SecurePassword123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly password: string;
}
