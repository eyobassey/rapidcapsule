import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Age } from '../types/health-checkup.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParseTextDto {
  @ApiPropertyOptional({ description: 'Patient biological sex', example: 'female', enum: ['male', 'female'] })
  @IsOptional()
  sex: string;

  @ApiProperty({ description: 'Patient age object', example: { value: 32 } })
  @Type(() => Age)
  age: Age;

  @ApiProperty({ description: 'Free-text symptom description from the patient', example: 'I have a headache and feeling nauseous since yesterday' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Infermedica interview token for session continuity', example: 'itk_abc123' })
  @IsOptional()
  @IsString()
  interview_token?: string;

  @ApiPropertyOptional({
    description: 'NLP parsing options',
    example: { enable_typo_tolerance: true, enable_enhanced_nlp: true, max_suggestions: 10 },
  })
  @IsOptional()
  extras?: {
    enable_typo_tolerance?: boolean;
    enable_enhanced_nlp?: boolean;
    enable_fuzzy_matching?: boolean;
    relaxed_parsing?: boolean;
    max_suggestions?: number;
    include_raw_mentions?: boolean;
  };
}
