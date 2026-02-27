import { Frequency, Interval } from '../entities/reminder.entity';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReminderDto {
  @ApiProperty({
    description: 'Title of the reminder',
    example: 'Take medication',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The date when the reminder should start',
    example: '2026-03-15',
  })
  @IsNotEmpty()
  @Type(() => Date)
  start_date: Date;

  @ApiProperty({
    description: 'The time when the reminder should trigger',
    example: '2026-03-15T08:00:00.000Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  start_time: Date;

  @ApiProperty({
    description: 'How often the reminder should repeat',
    enum: Frequency,
    example: Frequency.DAILY,
  })
  @IsEnum(Frequency)
  frequency: Frequency;

  @ApiProperty({
    description: 'The interval unit for the reminder period. Required when period is specified.',
    enum: Interval,
    example: Interval.DAYS,
  })
  @ValidateIf((o) => o.interval !== null)
  @IsEnum(Interval)
  interval: Interval;

  @ApiPropertyOptional({
    description: 'Number of intervals between each reminder occurrence',
    example: 2,
  })
  @IsOptional()
  period: number;

  @ApiPropertyOptional({
    description: 'Whether the reminder is an all-day event',
    example: false,
  })
  @IsOptional()
  is_all_day: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata or context for the reminder',
    example: { note: 'Adaeze should take 500mg of paracetamol after meals' },
  })
  @IsOptional()
  data: any;
}
