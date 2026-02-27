import { Role } from '../types/profile.types';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Admin first name', example: 'Bassey' })
  @IsNotEmpty()
  @IsString()
  readonly first_name: string;

  @ApiProperty({ description: 'Admin last name', example: 'Eyo' })
  @IsNotEmpty()
  @IsString()
  readonly last_name: string;

  @ApiProperty({ description: 'Admin email address', example: 'admin@rapidcapsule.com' })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({ description: 'Account password', example: 'Str0ngP@ss!' })
  @IsNotEmpty()
  @IsString()
  readonly password: string;

  @ApiProperty({ description: 'Admin role', enum: Role, example: 'Admin' })
  @IsNotEmpty()
  @IsEnum(Role)
  readonly role: Role;

  @ApiProperty({ description: 'Country dialling code', example: '+234' })
  @IsString()
  @IsNotEmpty()
  readonly country_code: string;

  @ApiProperty({ description: 'Phone number (10 digits)', example: '8012345678' })
  @IsString()
  @MinLength(10, {
    message:
      'Phone number is too short. Minimal length is $constraint1 characters, but actual is $value',
  })
  @MaxLength(10, {
    message:
      'Phone number is too long. Minimal length is $constraint1 characters, but actual is $value',
  })
  @IsNotEmpty()
  readonly phone: string;
}
