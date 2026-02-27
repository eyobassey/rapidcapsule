import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SharePlatform {
  WHATSAPP = 'whatsapp',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  EMAIL = 'email',
  COPY = 'copy',
  SMS = 'sms',
}

export class TrackShareDto {
  @ApiProperty({ description: 'Platform where the referral link was shared', enum: SharePlatform, example: SharePlatform.WHATSAPP })
  @IsNotEmpty()
  @IsEnum(SharePlatform)
  platform: SharePlatform;
}
