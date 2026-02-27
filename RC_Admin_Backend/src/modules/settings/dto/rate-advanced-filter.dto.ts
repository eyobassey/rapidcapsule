import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RateAdvancedFilterDto {
  @ApiProperty({ description: 'Specialist category to filter rates by', example: 'General Practice' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Medical specialization to narrow the filter', example: 'Family Medicine' })
  @IsOptional()
  specialization: string;

  @ApiPropertyOptional({ description: 'Minimum rate value in NGN', example: 5000 })
  @IsOptional()
  minRate: number;

  @ApiPropertyOptional({ description: 'Maximum rate value in NGN', example: 50000 })
  @IsOptional()
  maxRate: number;
}
