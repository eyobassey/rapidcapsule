import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpecialistAdvancedFilterDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  @IsNotEmpty()
  currentPage: number;

  @ApiPropertyOptional({ description: 'Results per page', example: 20 })
  @IsOptional()
  pageLimit: number;

  @ApiPropertyOptional({ description: 'Search by specialist name or email', example: 'Dr. Obi' })
  @IsOptional()
  search: string;

  @ApiPropertyOptional({ description: 'Filter by gender', example: 'Male' })
  @IsOptional()
  gender: any;

  @ApiPropertyOptional({ description: 'Filter by country', example: 'Nigeria' })
  @IsOptional()
  country: string;

  @ApiPropertyOptional({ description: 'Filter by state', example: 'Lagos' })
  @IsOptional()
  state: string;

  @ApiPropertyOptional({ description: 'Filter by specialist category', example: 'Cardiology' })
  @IsOptional()
  category: string;

  @ApiPropertyOptional({ description: 'Filter by registration date', example: '2025-01-01' })
  @IsOptional()
  dateReg: Date;

  @ApiPropertyOptional({ description: 'Filter by account status', example: 'Active' })
  @IsOptional()
  status: any;
}
