import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PhoneTokenDto {
  @ApiProperty({ description: 'Phone number to send verification SMS to (10-11 digits)', example: '8012345678' })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(11)
  readonly phone: string;
}
