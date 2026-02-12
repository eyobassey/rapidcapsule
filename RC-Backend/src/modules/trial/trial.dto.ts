import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============ TRIAL REQUEST ============

export class RequestTrialDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  last_name: string;
}

// ============ TRIAL SYMPTOM CHECKER ============

export class TrialBeginCheckupDto {
  @IsNumber()
  @IsOptional()
  @Min(12)
  @Max(120)
  age?: number;

  @IsString()
  @IsOptional()
  gender?: string; // 'male' | 'female'
}

export class TrialParseTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  interview_token?: string;
}

export class TrialDiagnosisDto {
  @IsArray()
  evidence: any[];

  @IsNumber()
  @Min(12)
  @Max(120)
  age: number;

  @IsString()
  @IsNotEmpty()
  sex: string;

  @IsString()
  @IsOptional()
  interview_token?: string;

  @IsOptional()
  extras?: Record<string, any>;
}

export class TrialSearchDto {
  @IsString()
  @IsNotEmpty()
  phrase: string;

  @IsString()
  @IsOptional()
  sex?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  interview_token?: string;
}

export class TrialRiskFactorsDto {
  @IsNumber()
  @Min(12)
  @Max(120)
  age: number;

  @IsString()
  @IsOptional()
  interview_token?: string;
}

export class TrialSuggestedSymptomsDto {
  @IsArray()
  evidence: any[];

  @IsNumber()
  @Min(12)
  @Max(120)
  age: number;

  @IsString()
  @IsNotEmpty()
  sex: string;

  @IsString()
  @IsOptional()
  interview_token?: string;

  @IsOptional()
  extras?: Record<string, any>;
}

// ============ TRIAL RXGPT ============

export class TrialCurrentMedicationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsString()
  @IsOptional()
  frequency?: string;
}

export class TrialPatientContextDto {
  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  chronic_conditions?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrialCurrentMedicationDto)
  @IsOptional()
  current_medications?: TrialCurrentMedicationDto[];

  @IsBoolean()
  @IsOptional()
  renal_impairment?: boolean;

  @IsBoolean()
  @IsOptional()
  hepatic_impairment?: boolean;

  @IsBoolean()
  @IsOptional()
  pregnant?: boolean;
}

export class TrialRxGPTDto {
  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @IsString()
  @IsOptional()
  treatment_goal?: string;

  @ValidateNested()
  @Type(() => TrialPatientContextDto)
  @IsOptional()
  patient_context?: TrialPatientContextDto;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  max_suggestions?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  symptoms?: string[];
}

// ============ TRIAL PRESCRIPTION UPLOAD ============

export class TrialPrescriptionUploadDto {
  @IsString()
  @IsOptional()
  uploadSource?: string; // 'MOBILE_CAMERA' | 'FILE_UPLOAD'
}

// ============ TRIAL AI SUMMARY ============

export class TrialAISummaryDto {
  @IsArray()
  conditions: any[];

  @IsArray()
  evidence: any[];

  @IsString()
  @IsOptional()
  triage_level?: string;

  @IsBoolean()
  @IsOptional()
  has_emergency_evidence?: boolean;

  @IsNumber()
  @Min(12)
  @Max(120)
  age: number;

  @IsString()
  @IsNotEmpty()
  sex: string;
}
