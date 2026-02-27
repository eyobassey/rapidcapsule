import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HealthDomain, QuestionType } from '../types/advanced-score.types';

class QuestionOptionDto {
  @ApiProperty({ description: 'Unique value identifier for the option', example: 'rarely' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ description: 'Display label shown to the patient', example: 'Rarely (less than once a week)' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Scoring weight assigned to this option, from -10 (negative impact) to 10 (positive impact)', example: 3, minimum: -10, maximum: 10 })
  @IsNumber()
  @Min(-10)
  @Max(10)
  score_weight: number;
}

class ScaleConfigDto {
  @ApiProperty({ description: 'Minimum value on the scale', example: 1 })
  @IsNumber()
  min: number;

  @ApiProperty({ description: 'Maximum value on the scale', example: 10 })
  @IsNumber()
  max: number;

  @ApiProperty({ description: 'Label displayed at the minimum end of the scale', example: 'Very poor' })
  @IsString()
  min_label: string;

  @ApiProperty({ description: 'Label displayed at the maximum end of the scale', example: 'Excellent' })
  @IsString()
  max_label: string;
}

export class CreateQuestionDto {
  @ApiProperty({ description: 'Health domain the question belongs to', enum: HealthDomain, example: HealthDomain.CARDIOVASCULAR })
  @IsEnum(HealthDomain)
  domain: HealthDomain;

  @ApiProperty({ description: 'Display order of the domain (1-10)', example: 1, minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  domain_order: number;

  @ApiProperty({ description: 'Display order of the question within its domain (1-50)', example: 3, minimum: 1, maximum: 50 })
  @IsNumber()
  @Min(1)
  @Max(50)
  question_order: number;

  @ApiProperty({ description: 'The question text presented to the patient', example: 'How often do you experience chest pain or discomfort during physical activity?' })
  @IsString()
  @IsNotEmpty()
  question_text: string;

  @ApiProperty({ description: 'Type of response expected from the patient', enum: QuestionType, example: QuestionType.SINGLE_CHOICE })
  @IsEnum(QuestionType)
  question_type: QuestionType;

  @ApiPropertyOptional({ description: 'Available options for single/multiple choice questions', type: [QuestionOptionDto], example: [{ value: 'never', label: 'Never', score_weight: 5 }, { value: 'sometimes', label: 'Sometimes', score_weight: 2 }, { value: 'frequently', label: 'Frequently', score_weight: -3 }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @IsOptional()
  options?: QuestionOptionDto[];

  @ApiPropertyOptional({ description: 'Configuration for scale-type questions', type: ScaleConfigDto })
  @ValidateNested()
  @Type(() => ScaleConfigDto)
  @IsOptional()
  scale_config?: ScaleConfigDto;

  @ApiPropertyOptional({ description: 'Whether the question must be answered before submission', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @ApiPropertyOptional({ description: 'Additional guidance text displayed below the question', example: 'Consider activities like walking, climbing stairs, or exercising' })
  @IsString()
  @IsOptional()
  help_text?: string;

  @ApiPropertyOptional({ description: 'Whether the question is currently active and visible in assessments', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
