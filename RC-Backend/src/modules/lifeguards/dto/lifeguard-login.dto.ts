import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LifeguardLoginDto {
  @ApiProperty({
    description: 'Registered lifeguard email address',
    example: 'chinedu.okafor@gmail.com',
  })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Account password',
    example: 'Str0ngP@ss!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
