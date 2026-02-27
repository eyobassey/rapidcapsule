import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeEmailAddressDto {
  @ApiProperty({ description: 'New email address to change to', example: 'newemail@example.com' })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Security question answer for verification', example: 'My first pet name' })
  @IsString()
  @IsNotEmpty()
  answer: string;
}
