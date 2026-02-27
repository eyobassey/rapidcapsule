import { Interval } from './query-interval.dto';
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PatientsAnalyticsFilter {
  ALL = 'All',
  WITH_SUBSCRIPTION = 'With Subscription',
  WITHOUT_SUBSCRIPTION = 'Without Subscription',
}

export class PatientAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date for analytics period', example: '2025-01-01' })
  @IsOptional()
  start_date: Date;

  @ApiPropertyOptional({ description: 'End date for analytics period', example: '2025-12-31' })
  @IsOptional()
  end_date: Date;

  @ApiProperty({ description: 'Time interval for data grouping', enum: Interval, example: Interval.MONTH })
  @IsNotEmpty()
  @IsEnum(Interval)
  interval: Interval;

  @ApiProperty({ description: 'Patient filter criteria', enum: PatientsAnalyticsFilter, example: PatientsAnalyticsFilter.ALL })
  @IsNotEmpty()
  filter: PatientsAnalyticsFilter | PatientsAnalyticsFilter[];
}
