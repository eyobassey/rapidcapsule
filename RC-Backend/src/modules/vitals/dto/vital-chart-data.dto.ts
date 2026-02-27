import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VitalChartDataDto {
  @ApiProperty({ description: 'Vital type to chart (e.g., blood_pressure, pulse_rate, body_temp)', example: 'blood_pressure' })
  @IsNotEmpty()
  readonly vitalToSelect: string;

  @ApiPropertyOptional({ description: 'Chart start date', example: '2025-06-01' })
  @IsOptional()
  readonly start_date: Date;

  @ApiPropertyOptional({ description: 'Chart end date', example: '2025-06-30' })
  @IsOptional()
  readonly end_date: Date;

  @ApiPropertyOptional({ description: 'Duration shortcut (e.g., "7d", "30d", "3m")', example: '30d' })
  readonly duration?: string;
}
