import { Interval } from "../../patients/dto/query-interval.dto";
import { PatientsAnalyticsFilter } from "../../patients/dto/patient-analytics.dto";
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AppointmentAnalyticsFilter {
  ALL = 'All',
  CANCELLED_APPOINTMENTS = 'Cancelled Appointments',
  COMPLETED_APPOINTMENTS = 'Completed Appointments',
}
export class AppointmentsAnalyticsDto {
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

  @ApiProperty({ description: 'Appointment filter criteria', enum: AppointmentAnalyticsFilter, example: AppointmentAnalyticsFilter.ALL })
  @IsNotEmpty()
  filter: AppointmentAnalyticsFilter | AppointmentAnalyticsFilter[];
}