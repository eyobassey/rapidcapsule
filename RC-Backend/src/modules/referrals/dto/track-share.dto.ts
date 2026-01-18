import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

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
  @IsNotEmpty()
  @IsEnum(SharePlatform)
  platform: SharePlatform;
}
