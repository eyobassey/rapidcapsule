import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({ description: 'Symptom or condition search phrase', example: 'headache' })
  @IsString()
  phrase: string;

  @ApiProperty({ description: 'Patient age (0-130)', example: 35 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(130)
  age: number;

  @ApiPropertyOptional({ description: 'Maximum number of results (1-20)', example: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  max_results: number;

  @ApiPropertyOptional({ description: 'Patient biological sex', example: 'female', enum: ['male', 'female'] })
  @IsString()
  @IsOptional()
  sex: string;

  @ApiPropertyOptional({ description: 'Infermedica interview token', example: 'itk_abc123' })
  @IsOptional()
  @IsString()
  interview_token?: string;

  @ApiPropertyOptional({
    description: 'Search enhancement options',
    example: { enable_typo_tolerance: true, enable_fuzzy_matching: true, minimum_confidence: 0.5 },
  })
  @IsOptional()
  extras?: {
    enable_typo_tolerance?: boolean;
    enable_fuzzy_matching?: boolean;
    include_synonyms?: boolean;
    relaxed_matching?: boolean;
    minimum_confidence?: number;
  };
}
