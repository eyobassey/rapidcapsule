import { IsArray, ValidateNested } from 'class-validator';
import { TimeAvailability } from '../types/preference.types';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SpecialistAvailabilityDto {
  @ApiProperty({
    description: 'Weekly time availability slots for the specialist',
    type: [TimeAvailability],
    example: [{ day: 'Monday', start_time: '09:00', end_time: '17:00', is_available: true }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeAvailability)
  time_availability: TimeAvailability[];
}
