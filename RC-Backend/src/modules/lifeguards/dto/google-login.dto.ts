import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'OAuth token received from Google Sign-In on the client',
    example: 'ya29.a0AfH6SMB...',
  })
  @IsNotEmpty()
  @IsString()
  readonly token: string;
}
