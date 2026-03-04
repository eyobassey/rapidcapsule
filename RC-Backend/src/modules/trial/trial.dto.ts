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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============ TRIAL REQUEST ============

export class RequestTrialDto {
  @ApiProperty({
    description: 'Email address for the trial account',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'First name of the trial user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  first_name: string;

  @ApiProperty({
    description: 'Last name of the trial user',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  last_name: string;
}

// ============ TRIAL SYMPTOM CHECKER ============

export class TrialBeginCheckupDto {
  @ApiPropertyOptional({
    description: 'Age of the patient (minimum 12)',
    example: 30,
  })
  @IsNumber()
  @IsOptional()
  @Min(12)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({
    description: 'Gender of the patient',
    example: 'male',
  })
  @IsString()
  @IsOptional()
  gender?: string; // 'male' | 'female'
}

export class TrialParseTextDto {
  @ApiProperty({
    description: 'Free text describing symptoms to parse via Infermedica NLP',
    example: 'I have a headache and feel nauseous since yesterday',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'Infermedica interview token for session continuity',
    example: 'abc123-interview-token',
  })
  @IsString()
  @IsOptional()
  interview_token?: string;
}

export class TrialDiagnosisDto {
  @ApiProperty({
    description: 'Array of evidence objects with symptom IDs and choice IDs',
    example: [{ id: 's_21', choice_id: 'present', source: 'initial' }],
  })
  @IsArray()
  evidence: any[];

  @ApiProperty({
    description: 'Age of the patient (minimum 12)',
    example: 30,
  })
  @IsNumber()
  @Min(12)
  @Max(120)
  age: number;

  @ApiProperty({
    description: 'Biological sex of the patient',
    example: 'male',
  })
  @IsString()
  @IsNotEmpty()
  sex: string;

  @ApiPropertyOptional({
    description: 'Infermedica interview token for session continuity',
    example: 'abc123-interview-token',
  })
  @IsString()
  @IsOptional()
  interview_token?: string;

  @ApiPropertyOptional({
    description: 'Extra parameters for the Infermedica API (e.g. enable_symptom_duration)',
    example: { enable_symptom_duration: true },
  })
  @IsOptional()
  extras?: Record<string, any>;
}

export class TrialSearchDto {
  @ApiProperty({
    description: 'Search phrase for symptoms or conditions',
    example: 'headache',
  })
  @IsString()
  @IsNotEmpty()
  phrase: string;

  @ApiPropertyOptional({
    description: 'Biological sex to filter results',
    example: 'male',
  })
  @IsString()
  @IsOptional()
  sex?: string;

  @ApiPropertyOptional({
    description: 'Age to filter results',
    example: 30,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({
    description: 'Infermedica interview token for session continuity',
    example: 'abc123-interview-token',
  })
  @IsString()
  @IsOptional()
  interview_token?: string;
}

export class TrialRiskFactorsDto {
  @ApiProperty({
    description: 'Age of the patient (minimum 12)',
    example: 30,
  })
  @IsNumber()
  @Min(12)
  @Max(120)
  age: number;

  @ApiPropertyOptional({
    description: 'Infermedica interview token for session continuity',
    example: 'abc123-interview-token',
  })
  @IsString()
  @IsOptional()
  interview_token?: string;
}

export class TrialSuggestedSymptomsDto {
  @ApiProperty({
    description: 'Array of evidence objects with symptom IDs and choice IDs',
    example: [{ id: 's_21', choice_id: 'present', source: 'initial' }],
  })
  @IsArray()
  evidence: any[];

  @ApiProperty({
    description: 'Age of the patient (minimum 12)',
    example: 30,
  })
  @IsNumber()
  @Min(12)
  @Max(120)
  age: number;

  @ApiProperty({
    description: 'Biological sex of the patient',
    example: 'male',
  })
  @IsString()
  @IsNotEmpty()
  sex: string;

  @ApiPropertyOptional({
    description: 'Infermedica interview token for session continuity',
    example: 'abc123-interview-token',
  })
  @IsString()
  @IsOptional()
  interview_token?: string;

  @ApiPropertyOptional({
    description: 'Extra parameters for the Infermedica API',
    example: { enable_symptom_duration: true },
  })
  @IsOptional()
  extras?: Record<string, any>;
}

// ============ TRIAL RXGPT ============

export class TrialCurrentMedicationDto {
  @ApiProperty({
    description: 'Name of the current medication',
    example: 'Metformin',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Dosage of the medication',
    example: '500mg',
  })
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiPropertyOptional({
    description: 'Frequency of medication intake',
    example: 'twice daily',
  })
  @IsString()
  @IsOptional()
  frequency?: string;
}

export class TrialPatientContextDto {
  @ApiPropertyOptional({
    description: 'Age of the patient',
    example: 45,
  })
  @IsNumber()
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({
    description: 'Gender of the patient',
    example: 'female',
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Weight of the patient in kg',
    example: 70,
  })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({
    description: 'List of known allergies',
    example: ['Penicillin', 'Sulfa'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional({
    description: 'List of chronic conditions',
    example: ['Type 2 Diabetes', 'Hypertension'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  chronic_conditions?: string[];

  @ApiPropertyOptional({
    description: 'List of current medications the patient is taking',
    type: [TrialCurrentMedicationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrialCurrentMedicationDto)
  @IsOptional()
  current_medications?: TrialCurrentMedicationDto[];

  @ApiPropertyOptional({
    description: 'Whether the patient has renal impairment',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  renal_impairment?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the patient has hepatic impairment',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  hepatic_impairment?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the patient is pregnant',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  pregnant?: boolean;
}

export class TrialRxGPTDto {
  @ApiProperty({
    description: 'Diagnosis or condition to analyze for treatment recommendations',
    example: 'Type 2 Diabetes Mellitus',
  })
  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @ApiPropertyOptional({
    description: 'Desired treatment goal or outcome',
    example: 'Blood glucose control',
  })
  @IsString()
  @IsOptional()
  treatment_goal?: string;

  @ApiPropertyOptional({
    description: 'Patient context including demographics, allergies, and current medications',
    type: TrialPatientContextDto,
  })
  @ValidateNested()
  @Type(() => TrialPatientContextDto)
  @IsOptional()
  patient_context?: TrialPatientContextDto;

  @ApiPropertyOptional({
    description: 'Maximum number of drug suggestions to return (1-10)',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  max_suggestions?: number;

  @ApiPropertyOptional({
    description: 'List of symptoms associated with the diagnosis',
    example: ['frequent urination', 'increased thirst', 'fatigue'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  symptoms?: string[];
}

// ============ CONVERSATIONAL OTP ONBOARDING ============

export class RequestTrialWithOtpDto {
  @ApiProperty({
    description: 'Email address for the trial account',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'First name of the trial user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  first_name: string;

  @ApiProperty({
    description: 'Last name of the trial user',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  last_name: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email address the OTP was sent to',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '6-digit OTP code received via email',
    example: '482901',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  otp_code: string;
}

export class ResendOtpDto {
  @ApiProperty({
    description: 'Email address to resend the OTP to',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// ============ TRIAL PRESCRIPTION UPLOAD ============

export class TrialPrescriptionUploadDto {
  @ApiPropertyOptional({
    description: 'Source of the prescription upload',
    example: 'FILE_UPLOAD',
  })
  @IsString()
  @IsOptional()
  uploadSource?: string; // 'MOBILE_CAMERA' | 'FILE_UPLOAD'
}

// ============ TRIAL AI SUMMARY ============

export class TrialAISummaryDto {
  @ApiProperty({
    description: 'Array of diagnosed conditions from the symptom checker',
    example: [{ id: 'c_49', name: 'Migraine', common_name: 'Migraine', probability: 0.85 }],
  })
  @IsArray()
  conditions: any[];

  @ApiProperty({
    description: 'Array of evidence objects used in the diagnosis',
    example: [{ id: 's_21', choice_id: 'present', source: 'initial' }],
  })
  @IsArray()
  evidence: any[];

  @ApiPropertyOptional({
    description: 'Triage level from the symptom checker assessment',
    example: 'consultation',
  })
  @IsString()
  @IsOptional()
  triage_level?: string;

  @ApiPropertyOptional({
    description: 'Whether emergency evidence was detected',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  has_emergency_evidence?: boolean;

  @ApiProperty({
    description: 'Age of the patient (minimum 12)',
    example: 30,
  })
  @IsNumber()
  @Min(12)
  @Max(120)
  age: number;

  @ApiProperty({
    description: 'Biological sex of the patient',
    example: 'male',
  })
  @IsString()
  @IsNotEmpty()
  sex: string;
}
