import { Type } from 'class-transformer';
import { IsArray, IsIn, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimesParam {
  @ApiProperty({ description: 'Date to check available time slots', example: '2025-07-20' })
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;
}

export class AvailableTimesDto {
  @ApiProperty({ description: 'Dates to check for available time slots', type: [TimesParam] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimesParam)
  preferredDates: TimesParam[];

  @ApiPropertyOptional({ description: 'Specialist ID to check availability for', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsOptional()
  @IsMongoId()
  specialistId?: string;

  @ApiPropertyOptional({ description: 'Patient ID to check for double-booking conflicts', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Filter slots by urgency type', example: 'routine', enum: ['routine', 'urgent'] })
  @IsOptional()
  @IsString()
  @IsIn(['routine', 'urgent'])
  urgency?: string;
}
