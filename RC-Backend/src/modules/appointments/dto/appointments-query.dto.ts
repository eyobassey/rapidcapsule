import { AppointmentStatus, MeetingType } from '../entities/appointment.entity';
import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppointmentsQueryDto {
  @ApiProperty({ description: 'Current page number (1-based)', example: 1 })
  @IsNotEmpty()
  currentPage: number;

  @ApiPropertyOptional({ description: 'Number of results per page', example: 20 })
  @IsOptional()
  pageLimit: number;

  @ApiProperty({ description: 'Filter by appointment status', enum: AppointmentStatus, example: 'Upcoming' })
  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Filter by meeting type/medium', enum: MeetingType, example: 'Video' })
  @ValidateIf((o) => o.medium !== undefined)
  @IsEnum(MeetingType)
  medium: MeetingType;

  @ApiPropertyOptional({ description: 'Filter by specific date', example: '2025-07-15' })
  @IsOptional()
  date: Date;

  @ApiPropertyOptional({ description: 'Filter by meeting class (routine/urgent)', example: 'routine' })
  @IsOptional()
  meeting_class: string;
}
