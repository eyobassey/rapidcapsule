import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../users/entities/user.entity';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google OAuth ID token from client-side sign-in', example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsNotEmpty()
  @IsString()
  readonly token: string;

  @ApiProperty({ description: 'User type for registration', enum: UserType, example: 'Patient' })
  @IsNotEmpty()
  @IsString()
  @IsEnum(UserType)
  readonly user_type: UserType;
}
