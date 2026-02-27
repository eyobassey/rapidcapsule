import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RatingFilter {
  ONE_STAR_AND_ABOVE = '1 star and above',
  TWO_STARS_AND_ABOVE = '2 stars and above',
  THREE_STARS_AND_ABOVE = '3 stars and above',
  FOUR_STARS_AND_ABOVE = '4 stars and above',
  FIVE_STARS = '5 stars',
}
export class AvailabilityParam {
  @ApiProperty({ description: 'Preferred date', example: '2025-07-20' })
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ description: 'Preferred time slot', example: '10:00' })
  @IsString()
  time: string;
}

export class AvailableSpecialistDto {
  @ApiProperty({ description: 'Professional category (e.g., Doctor, Nurse)', example: 'Doctor' })
  @IsNotEmpty()
  @IsString()
  professional_category: string;

  @ApiProperty({ description: 'Specialist category ID', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsString()
  specialist_category: string;

  @ApiPropertyOptional({ description: 'Filter by specialist gender', example: 'Female' })
  @IsOptional()
  gender: string;

  @ApiPropertyOptional({ description: 'Minimum rating filter', enum: RatingFilter, example: '3 stars and above' })
  @IsOptional()
  rating: RatingFilter;

  @ApiPropertyOptional({ description: 'Patient timezone for availability matching', example: 'Africa/Lagos' })
  @IsOptional()
  time_zone: string;

  @ApiPropertyOptional({ description: 'Filter by appointment urgency', example: 'routine', enum: ['routine', 'urgent'] })
  @IsOptional()
  @IsString()
  @IsIn(['routine', 'urgent'])
  urgency?: string;

  @ApiPropertyOptional({ description: 'Preferred dates and times to check availability', type: [AvailabilityParam] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityParam)
  availabilityDates?: AvailabilityParam[];

  @ApiPropertyOptional({ description: 'Filter for diaspora specialists only', example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_diaspora?: boolean;

  @ApiPropertyOptional({ description: 'Filter by language IDs spoken', example: ['64a1b2c3d4e5f6a7b8c9d0e1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];
}
