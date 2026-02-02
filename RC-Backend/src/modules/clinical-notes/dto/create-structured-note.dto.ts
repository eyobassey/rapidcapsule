import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VitalSignsDto {
  @IsString()
  @IsOptional()
  blood_pressure?: string;

  @IsNumber()
  @IsOptional()
  pulse?: number;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsString()
  @IsOptional()
  @IsEnum(['C', 'F'])
  temperature_unit?: 'C' | 'F';

  @IsNumber()
  @IsOptional()
  respiratory_rate?: number;
}

export class PhysicalExaminationDto {
  @IsString()
  @IsOptional()
  general_appearance?: string;

  @IsString()
  @IsOptional()
  level_of_consciousness?: string;

  @ValidateNested()
  @Type(() => VitalSignsDto)
  @IsOptional()
  vital_signs?: VitalSignsDto;

  @IsString()
  @IsOptional()
  additional_findings?: string;
}

export class MedicationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  instructions?: string;
}

export class TreatmentPlanDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  @IsOptional()
  medications_prescribed?: MedicationDto[];

  @IsString()
  @IsOptional()
  lab_tests_ordered?: string;

  @IsString()
  @IsOptional()
  patient_instructions?: string;

  @IsString()
  @IsOptional()
  follow_up_required?: string;

  @IsString()
  @IsOptional()
  follow_up_timeframe?: string;
}

export class AssessmentDiagnosisDto {
  @IsString()
  @IsOptional()
  primary_diagnosis?: string;

  @IsString()
  @IsOptional()
  differential_diagnosis?: string;

  @IsString()
  @IsOptional()
  clinical_impression?: string;
}

export class CreateStructuredNoteDto {
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  // Legacy field (optional for backward compatibility)
  @IsString()
  @IsOptional()
  content?: string;

  // Structured fields
  @IsString()
  @IsOptional()
  chief_complaint?: string;

  @IsString()
  @IsOptional()
  history_of_present_illness?: string;

  @ValidateNested()
  @Type(() => PhysicalExaminationDto)
  @IsOptional()
  physical_examination?: PhysicalExaminationDto;

  @ValidateNested()
  @Type(() => AssessmentDiagnosisDto)
  @IsOptional()
  assessment_diagnosis?: AssessmentDiagnosisDto;

  @ValidateNested()
  @Type(() => TreatmentPlanDto)
  @IsOptional()
  treatment_plan?: TreatmentPlanDto;

  @IsString()
  @IsOptional()
  additional_notes?: string;

  @IsBoolean()
  @IsOptional()
  is_draft?: boolean;

  @IsBoolean()
  @IsOptional()
  confirmed_accurate?: boolean;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class UpdateStructuredNoteDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  chief_complaint?: string;

  @IsString()
  @IsOptional()
  history_of_present_illness?: string;

  @ValidateNested()
  @Type(() => PhysicalExaminationDto)
  @IsOptional()
  physical_examination?: PhysicalExaminationDto;

  @ValidateNested()
  @Type(() => AssessmentDiagnosisDto)
  @IsOptional()
  assessment_diagnosis?: AssessmentDiagnosisDto;

  @ValidateNested()
  @Type(() => TreatmentPlanDto)
  @IsOptional()
  treatment_plan?: TreatmentPlanDto;

  @IsString()
  @IsOptional()
  additional_notes?: string;

  @IsBoolean()
  @IsOptional()
  is_draft?: boolean;

  @IsBoolean()
  @IsOptional()
  confirmed_accurate?: boolean;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
