import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { HealthDomain } from '../types/advanced-score.types';

class AnswerDto {
  @ApiProperty({ description: 'ID of the question being answered', example: 'q_nutrition_001' })
  @IsString()
  @IsNotEmpty()
  question_id: string;

  @ApiProperty({ description: 'Health domain the question belongs to', enum: HealthDomain, example: 'nutrition' })
  @IsEnum(HealthDomain)
  domain: HealthDomain;

  @ApiProperty({ description: 'Full text of the question', example: 'How many servings of fruits and vegetables do you eat daily?' })
  @IsString()
  @IsNotEmpty()
  question_text: string;

  @ApiProperty({ description: 'Answer value (string, string array, or number)', example: '3' })
  @IsNotEmpty()
  answer_value: string | string[] | number;

  @ApiProperty({ description: 'Human-readable label for the answer', example: '3-4 servings' })
  @IsString()
  @IsNotEmpty()
  answer_label: string;
}

class CheckupSelectionDto {
  @ApiProperty({ description: 'Health checkup ID to include or exclude', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  checkup_id: string;

  @ApiProperty({ description: 'Whether to include (still affecting) or exclude (resolved) this checkup', enum: ['include', 'exclude'], example: 'include' })
  @IsString()
  @IsNotEmpty()
  status: 'include' | 'exclude';
}

export class SubmitAssessmentDto {
  @ApiProperty({ description: 'Array of answered assessment questions', type: () => [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiPropertyOptional({ description: 'IDs of previously uploaded supporting documents', example: ['doc_abc123', 'doc_def456'] })
  @IsArray()
  @IsOptional()
  document_ids?: string[];

  @ApiPropertyOptional({ description: 'Patient selections for which health checkups to include in the assessment', type: () => [CheckupSelectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckupSelectionDto)
  @IsOptional()
  checkup_selections?: CheckupSelectionDto[];
}
