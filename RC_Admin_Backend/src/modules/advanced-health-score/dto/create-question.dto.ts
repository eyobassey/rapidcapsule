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
import { HealthDomain, QuestionType } from '../types/advanced-score.types';

class QuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @Min(-10)
  @Max(10)
  score_weight: number;
}

class ScaleConfigDto {
  @IsNumber()
  min: number;

  @IsNumber()
  max: number;

  @IsString()
  min_label: string;

  @IsString()
  max_label: string;
}

export class CreateQuestionDto {
  @IsEnum(HealthDomain)
  domain: HealthDomain;

  @IsNumber()
  @Min(1)
  @Max(10)
  domain_order: number;

  @IsNumber()
  @Min(1)
  @Max(50)
  question_order: number;

  @IsString()
  @IsNotEmpty()
  question_text: string;

  @IsEnum(QuestionType)
  question_type: QuestionType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @IsOptional()
  options?: QuestionOptionDto[];

  @ValidateNested()
  @Type(() => ScaleConfigDto)
  @IsOptional()
  scale_config?: ScaleConfigDto;

  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @IsString()
  @IsOptional()
  help_text?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
