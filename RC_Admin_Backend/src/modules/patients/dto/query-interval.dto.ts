import { ApiProperty } from '@nestjs/swagger';

export enum Interval {
  WEEK = 'Week',
  MONTH = 'Month',
  DAY = 'Day',
  YEAR = 'Year'
}

export class QueryIntervalDto {
  @ApiProperty({ description: 'Time interval for grouping analytics data', enum: Interval, example: Interval.MONTH })
  interval: Interval;
}
