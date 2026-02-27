import {
  IsEmail,
  IsLowercase,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../../core/decorators/match.decorators';

export class CreateLifeguardDto {
  @ApiProperty({
    description: 'First name of the lifeguard',
    example: 'Chinedu',
  })
  @IsNotEmpty()
  @IsString()
  readonly first_name: string;

  @ApiProperty({
    description: 'Last name of the lifeguard',
    example: 'Okafor',
  })
  @IsNotEmpty()
  @IsString()
  readonly last_name: string;

  @ApiProperty({
    description: 'Email address used for lifeguard account login',
    example: 'chinedu.okafor@gmail.com',
  })
  @IsString()
  @IsLowercase()
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({
    description: 'Account password (min 8 characters recommended)',
    example: 'Str0ngP@ss!',
  })
  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @ApiProperty({
    description: 'International dialling code for the phone number',
    example: '+234',
  })
  @IsString()
  @IsNotEmpty()
  readonly country_code: string;

  @ApiProperty({
    description: 'Phone number without country code (exactly 10 digits)',
    example: '8012345678',
  })
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

  @ApiProperty({
    description: 'Must match the password field exactly',
    example: 'Str0ngP@ss!',
  })
  @IsString()
  @IsNotEmpty()
  @Match('password')
  readonly confirm_password: string;
}
