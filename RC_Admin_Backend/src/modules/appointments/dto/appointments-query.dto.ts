import { AppointmentStatus, MeetingType } from '../entities/appointment.entity';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppointmentsQueryDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  @IsNotEmpty()
  currentPage: number;

  @ApiPropertyOptional({ description: 'Results per page', example: 20 })
  @IsOptional()
  pageLimit: number;

  @ApiProperty({ description: 'Filter by appointment status', example: 'All' })
  @IsNotEmpty()
  @IsString()
  status: AppointmentStatus | string;

  @ApiPropertyOptional({ description: 'Filter by meeting medium', enum: MeetingType })
  @ValidateIf((o) => o.medium !== undefined)
  @IsEnum(MeetingType)
  medium: MeetingType;

  @ApiPropertyOptional({ description: 'Filter by date', example: '2025-10-15' })
  @IsOptional()
  date: Date;

  @ApiPropertyOptional({ description: 'Filter by meeting class', example: 'consultation' })
  @IsOptional()
  meeting_class: string;
}
