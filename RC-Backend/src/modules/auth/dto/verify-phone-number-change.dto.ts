import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneNumberChangeDto {
  @ApiProperty({ description: 'Country dialling code', example: '+234' })
  @IsString()
  @IsNotEmpty()
  country_code: string;

  @ApiProperty({ description: 'New phone number being verified (10 digits)', example: '8012345678' })
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

  @ApiProperty({ description: '6-digit OTP code sent via SMS to the new number', example: '401823' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
