import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AppleAuthorization,
  AppleUser,
} from '../strategies/appleAuth.strategy';
import { Type } from 'class-transformer';

export class AppleLoginDto {
  @ApiProperty({
    description: 'Apple authorization response containing the identity token and authorization code',
    example: { id_token: 'eyJraWQiOiI...', code: 'c1234567890abcdef' },
  })
  @IsNotEmpty()
  @Type(() => AppleAuthorization)
  readonly authorization: AppleAuthorization;

  @ApiPropertyOptional({
    description: 'Apple user info (only provided on first sign-in)',
    example: { name: { firstName: 'Adaeze', lastName: 'Obi' }, email: 'adaeze@icloud.com' },
  })
  @IsOptional()
  @Type(() => AppleUser)
  readonly user?: AppleUser;
}
