import { Gender } from '../types/profile.types';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientAdvancedFilterDto {
  @ApiProperty({ description: 'Current page number (1-based)', example: 1 })
  @IsNotEmpty()
  currentPage: number;

  @ApiPropertyOptional({ description: 'Number of results per page', example: 20 })
  @IsOptional()
  pageLimit: number;

  @ApiPropertyOptional({ description: 'Search by name, email, or phone', example: 'Adaeze' })
  @IsOptional()
  search: string;

  @ApiPropertyOptional({ description: 'Filter by gender', enum: Gender, example: 'Female' })
  @IsOptional()
  gender: Gender;

  @ApiPropertyOptional({ description: 'Filter by country', example: 'Nigeria' })
  @IsOptional()
  country: string;

  @ApiPropertyOptional({ description: 'Filter by state/region', example: 'Lagos' })
  @IsOptional()
  state: string;

  @ApiPropertyOptional({ description: 'Minimum number of dependants', example: 1 })
  @IsOptional()
  minDependant: number;

  @ApiPropertyOptional({ description: 'Maximum number of dependants', example: 5 })
  @IsOptional()
  maxDependant: number;

  @ApiPropertyOptional({ description: 'Filter by registration date (on or after)', example: '2025-01-01' })
  @IsOptional()
  dateReg: Date;

  @ApiPropertyOptional({ description: 'Filter by subscription plan', example: 'Premium' })
  @IsOptional()
  plan: string;
}
