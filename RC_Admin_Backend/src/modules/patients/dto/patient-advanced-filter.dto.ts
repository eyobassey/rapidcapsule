import { Gender } from '../../users/types/profile.types';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientAdvancedFilterDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  @IsNotEmpty()
  currentPage: number;

  @ApiPropertyOptional({ description: 'Results per page', example: 20 })
  @IsOptional()
  pageLimit: number;

  @ApiPropertyOptional({ description: 'Search by patient name, email, or phone', example: 'Adaeze' })
  @IsOptional()
  search: string;

  @ApiPropertyOptional({ description: 'Filter by gender', enum: Gender, example: 'Female' })
  @IsOptional()
  gender: Gender;

  @ApiPropertyOptional({ description: 'Filter by country', example: 'Nigeria' })
  @IsOptional()
  country: string;

  @ApiPropertyOptional({ description: 'Filter by state', example: 'Lagos' })
  @IsOptional()
  state: string;

  @ApiPropertyOptional({ description: 'Minimum number of dependants', example: 0 })
  @IsOptional()
  minDependant: number;

  @ApiPropertyOptional({ description: 'Maximum number of dependants', example: 5 })
  @IsOptional()
  maxDependant: number;

  @ApiPropertyOptional({ description: 'Filter by registration date', example: '2025-01-01' })
  @IsOptional()
  dateReg: Date;

  @ApiPropertyOptional({ description: 'Filter by subscription plan', example: 'Premium' })
  @IsOptional()
  plan: string;

  @ApiProperty({ description: 'Filter by account status', example: 'Active' })
  @IsNotEmpty()
  status: string;
}
