import { Gender } from '../types/profile.types';
import { ProfileStatus } from '../entities/user.entity';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpecialistAdvancedFilterDto {
  @ApiProperty({ description: 'Current page number (1-based)', example: 1 })
  @IsNotEmpty()
  currentPage: number;

  @ApiPropertyOptional({ description: 'Number of results per page', example: 20 })
  @IsOptional()
  pageLimit: number;

  @ApiPropertyOptional({ description: 'Search by name, email, or phone', example: 'Dr. Emeka' })
  @IsOptional()
  search: string;

  @ApiPropertyOptional({ description: 'Filter by gender', enum: Gender, example: 'Male' })
  @IsOptional()
  gender: Gender;

  @ApiPropertyOptional({ description: 'Filter by country', example: 'Nigeria' })
  @IsOptional()
  country: string;

  @ApiPropertyOptional({ description: 'Filter by state/region', example: 'Abuja' })
  @IsOptional()
  state: string;

  @ApiPropertyOptional({ description: 'Filter by specialist category ID', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsOptional()
  category: string;

  @ApiPropertyOptional({ description: 'Filter by registration date (on or after)', example: '2025-01-01' })
  @IsOptional()
  dateReg: Date;

  @ApiPropertyOptional({ description: 'Filter by profile approval status', enum: ProfileStatus, example: 'Approved' })
  @IsOptional()
  status: ProfileStatus;
}
