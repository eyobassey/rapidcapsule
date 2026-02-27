import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClickSource } from '../entities/referral-click.entity';

export class TrackClickDto {
  @ApiPropertyOptional({ description: 'Source platform of the referral click', enum: ClickSource, example: 'whatsapp' })
  @IsOptional()
  @IsEnum(ClickSource)
  source?: ClickSource;

  @ApiPropertyOptional({ description: 'IP address of the clicking user', example: '102.89.23.45' })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional({ description: 'Browser user agent string', example: 'Mozilla/5.0 (Linux; Android 12)' })
  @IsOptional()
  @IsString()
  user_agent?: string;
}
