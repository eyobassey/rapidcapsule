import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ClickSource } from '../entities/referral-click.entity';

export class TrackClickDto {
  @IsOptional()
  @IsEnum(ClickSource)
  source?: ClickSource;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}
