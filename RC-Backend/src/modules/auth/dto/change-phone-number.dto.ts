import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePhoneNumberDto {
  @ApiProperty({ description: 'Country dialling code', example: '+234' })
  @IsString()
  @IsNotEmpty()
  country_code: string;

  @ApiProperty({ description: 'New phone number (10 digits)', example: '8012345678' })
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
  phone: string;

  @ApiProperty({ description: 'Security question answer for verification', example: 'My first pet name' })
  @IsString()
  @IsNotEmpty()
  answer: string;
}
