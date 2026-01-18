import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HealthDomain } from '../types/advanced-score.types';

class AnswerDto {
  @IsString()
  @IsNotEmpty()
  question_id: string;

  @IsEnum(HealthDomain)
  domain: HealthDomain;

  @IsString()
  @IsNotEmpty()
  question_text: string;

  @IsNotEmpty()
  answer_value: string | string[] | number;

  @IsString()
  @IsNotEmpty()
  answer_label: string;
}

class CheckupSelectionDto {
  @IsString()
  @IsNotEmpty()
  checkup_id: string;

  @IsString()
  @IsNotEmpty()
  status: 'include' | 'exclude'; // 'include' = still affecting, 'exclude' = resolved
}

export class SubmitAssessmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @IsArray()
  @IsOptional()
  document_ids?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckupSelectionDto)
  @IsOptional()
  checkup_selections?: CheckupSelectionDto[]; // Patient's selections for which checkups to include
}
