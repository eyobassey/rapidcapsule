import { IsArray, IsBoolean, IsOptional, IsNumber, IsString, IsObject } from 'class-validator';
import { Age } from '../types/health-checkup.types';
import { Type } from 'class-transformer';

export class CheckDiagnosisDto {
  @IsOptional()
  sex: string;

  @Type(() => Age)
  age: Age;

  @IsArray()
  evidence: any[];

  @IsBoolean()
  should_stop: boolean;

  @IsOptional()
  @IsNumber()
  interview_duration?: number;

  @IsOptional()
  @IsNumber()
  considered_diagnoses?: number;

  @IsOptional()
  @IsString()
  interview_token?: string;

  @IsOptional()
  @IsObject()
  extras?: {
    enable_symptom_duration?: boolean;
    triage_focused?: boolean;
    disable_groups?: boolean;
  };
}
