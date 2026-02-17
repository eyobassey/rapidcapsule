import { IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTrialSettingsDto {
  @ApiPropertyOptional({ description: 'Eka message limit per trial session', minimum: 5, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(100)
  eka_message_limit?: number;

  @ApiPropertyOptional({ description: 'Whether Eka chat is enabled for trial users' })
  @IsOptional()
  @IsBoolean()
  eka_enabled?: boolean;
}
