import { Interval } from "../../patients/dto/query-interval.dto";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SpecialistAnalyticsFilter {
  ALL = 'All',
  MEDICAL_DOCTOR = 'Medical Doctor',
  THERAPIST = 'Therapist',
  PHARMACIST = 'Pharmacist'
}

export class SpecialistsAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date for analytics period', example: '2025-01-01' })
  start_date: Date;

  @ApiPropertyOptional({ description: 'End date for analytics period', example: '2025-12-31' })
  end_date: Date;

  @ApiProperty({ description: 'Time interval for data grouping', enum: Interval, example: Interval.MONTH })
  interval: Interval;

  @ApiProperty({ description: 'Specialist type filter', enum: SpecialistAnalyticsFilter, example: SpecialistAnalyticsFilter.ALL })
  filter: SpecialistAnalyticsFilter | SpecialistAnalyticsFilter[];
}