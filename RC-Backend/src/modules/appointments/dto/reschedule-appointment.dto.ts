import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RescheduleAppointmentDto {
  @ApiProperty({ description: 'ID of the appointment to reschedule', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsString()
  appointmentId: Types.ObjectId;

  @ApiProperty({ description: 'New appointment date', example: '2025-07-25' })
  @IsString()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ description: 'New appointment time', example: '14:30' })
  @IsNotEmpty()
  @IsString()
  time: string;

  @ApiPropertyOptional({ description: 'Updated meeting channel', example: 'zoom' })
  @IsOptional()
  @IsString()
  meeting_channel: string;

  @ApiPropertyOptional({ description: 'Reason for rescheduling', example: 'Patient requested a later time due to work conflict' })
  @IsOptional()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Send notification to patient about reschedule', example: true })
  @IsOptional()
  @IsBoolean()
  notify_patient: boolean;
}
