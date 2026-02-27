import {
  IsEmail,
  IsEnum,
  IsLowercase,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Match } from '../../../core/decorators/match.decorators';
import { Type } from 'class-transformer';
import { UserType } from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User first name', example: 'Adaeze' })
  @IsNotEmpty()
  @IsString()
  readonly first_name: string;

  @ApiProperty({ description: 'User last name', example: 'Obi' })
  @IsNotEmpty()
  @IsString()
  readonly last_name: string;

  @ApiProperty({ description: 'User email address (lowercase)', example: 'adaeze.obi@gmail.com' })
  @IsString()
  @IsLowercase()
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({ description: 'Country dialling code', example: '+234' })
  @IsString()
  @IsNotEmpty()
  readonly country_code: string;

  @ApiProperty({ description: 'Phone number without country code (10 digits)', example: '8012345678' })
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

  @ApiProperty({ description: 'Account password (min 6 chars, at least 1 number and 1 lowercase)', example: 'Secure1pass' })
  @IsString()
  @IsNotEmpty()
  // @IsStrongPassword({ minLength: 6, minNumbers: 1, minLowercase: 1 })
  readonly password: string;

  @ApiProperty({ description: 'Must match password field exactly', example: 'Secure1pass' })
  @IsString()
  @IsNotEmpty()
  @Match('password')
  readonly confirm_password: string;

  @ApiProperty({ description: 'Date of birth (required for patients)', example: '1990-05-15' })
  @ValidateIf((o) => o.user_type === UserType.PATIENT)
  @IsNotEmpty()
  readonly date_of_birth: Date;

  @ApiProperty({ description: 'Accepted terms and conditions', example: true })
  @Type(() => Boolean)
  readonly terms: boolean;

  @ApiProperty({ description: 'Opted in to marketing communications', example: false })
  @Type(() => Boolean)
  readonly marketing: boolean;

  @ApiProperty({ description: 'Type of user account', enum: UserType, example: 'Patient' })
  @IsEnum(UserType)
  @IsNotEmpty()
  readonly user_type: UserType;
}
