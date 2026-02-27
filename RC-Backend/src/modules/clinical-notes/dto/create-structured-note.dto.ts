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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VitalSignsDto {
  @ApiPropertyOptional({
    description: 'Blood pressure reading in systolic/diastolic format',
    example: '120/80',
  })
  @IsString()
  @IsOptional()
  blood_pressure?: string;

  @ApiPropertyOptional({
    description: 'Heart rate in beats per minute',
    example: 72,
  })
  @IsNumber()
  @IsOptional()
  pulse?: number;

  @ApiPropertyOptional({
    description: 'Body temperature value',
    example: 37.2,
  })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Temperature measurement unit',
    enum: ['C', 'F'],
    example: 'C',
  })
  @IsString()
  @IsOptional()
  @IsEnum(['C', 'F'])
  temperature_unit?: 'C' | 'F';

  @ApiPropertyOptional({
    description: 'Respiratory rate in breaths per minute',
    example: 16,
  })
  @IsNumber()
  @IsOptional()
  respiratory_rate?: number;
}

export class PhysicalExaminationDto {
  @ApiPropertyOptional({
    description: 'General appearance of the patient',
    example: 'Alert, oriented, no acute distress',
  })
  @IsString()
  @IsOptional()
  general_appearance?: string;

  @ApiPropertyOptional({
    description: 'Patient level of consciousness',
    example: 'Alert and oriented x4',
  })
  @IsString()
  @IsOptional()
  level_of_consciousness?: string;

  @ApiPropertyOptional({
    description: 'Recorded vital signs during examination',
    type: () => VitalSignsDto,
  })
  @ValidateNested()
  @Type(() => VitalSignsDto)
  @IsOptional()
  vital_signs?: VitalSignsDto;

  @ApiPropertyOptional({
    description: 'Additional physical examination findings',
    example: 'Mild tenderness in right lower quadrant. No rebound or guarding.',
  })
  @IsString()
  @IsOptional()
  additional_findings?: string;
}

export class MedicationDto {
  @ApiProperty({
    description: 'Name of the prescribed medication',
    example: 'Amoxicillin',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Medication dosage',
    example: '500mg',
  })
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiPropertyOptional({
    description: 'How often the medication should be taken',
    example: 'Three times daily',
  })
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({
    description: 'Duration of the medication course',
    example: '7 days',
  })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional({
    description: 'Special instructions for taking the medication',
    example: 'Take with food. Complete full course even if symptoms improve.',
  })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class TreatmentPlanDto {
  @ApiPropertyOptional({
    description: 'List of medications prescribed during the visit',
    type: () => [MedicationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  @IsOptional()
  medications_prescribed?: MedicationDto[];

  @ApiPropertyOptional({
    description: 'Laboratory tests ordered for the patient',
    example: 'CBC, CMP, Urinalysis',
  })
  @IsString()
  @IsOptional()
  lab_tests_ordered?: string;

  @ApiPropertyOptional({
    description: 'Instructions provided to the patient',
    example: 'Rest, increase fluid intake, return if symptoms worsen or fever develops.',
  })
  @IsString()
  @IsOptional()
  patient_instructions?: string;

  @ApiPropertyOptional({
    description: 'Whether a follow-up visit is required',
    example: 'Yes',
  })
  @IsString()
  @IsOptional()
  follow_up_required?: string;

  @ApiPropertyOptional({
    description: 'Timeframe for the follow-up appointment',
    example: '2 weeks',
  })
  @IsString()
  @IsOptional()
  follow_up_timeframe?: string;
}

export class AssessmentDiagnosisDto {
  @ApiPropertyOptional({
    description: 'Primary diagnosis based on clinical findings',
    example: 'Acute upper respiratory infection (J06.9)',
  })
  @IsString()
  @IsOptional()
  primary_diagnosis?: string;

  @ApiPropertyOptional({
    description: 'Differential diagnoses under consideration',
    example: 'Allergic rhinitis, early bacterial sinusitis',
  })
  @IsString()
  @IsOptional()
  differential_diagnosis?: string;

  @ApiPropertyOptional({
    description: 'Overall clinical impression and reasoning',
    example:
      'Symptoms consistent with viral URI. No signs of bacterial superinfection at this time.',
  })
  @IsString()
  @IsOptional()
  clinical_impression?: string;
}

export class CreateStructuredNoteDto {
  @ApiProperty({
    description: 'ID of the appointment this structured note belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  // Legacy field (optional for backward compatibility)
  @ApiPropertyOptional({
    description: 'Legacy free-text content field for backward compatibility',
    example: 'Follow-up visit for hypertension management.',
  })
  @IsString()
  @IsOptional()
  content?: string;

  // Structured fields
  @ApiPropertyOptional({
    description: 'The primary reason for the patient visit',
    example: 'Persistent headache and dizziness for 3 days',
  })
  @IsString()
  @IsOptional()
  chief_complaint?: string;

  @ApiPropertyOptional({
    description: 'Detailed history of the presenting illness',
    example:
      'Patient reports onset of frontal headache 3 days ago, rated 6/10, with associated dizziness. No visual changes or nausea. OTC ibuprofen provides partial relief.',
  })
  @IsString()
  @IsOptional()
  history_of_present_illness?: string;

  @ApiPropertyOptional({
    description: 'Physical examination findings',
    type: () => PhysicalExaminationDto,
  })
  @ValidateNested()
  @Type(() => PhysicalExaminationDto)
  @IsOptional()
  physical_examination?: PhysicalExaminationDto;

  @ApiPropertyOptional({
    description: 'Assessment and diagnosis details',
    type: () => AssessmentDiagnosisDto,
  })
  @ValidateNested()
  @Type(() => AssessmentDiagnosisDto)
  @IsOptional()
  assessment_diagnosis?: AssessmentDiagnosisDto;

  @ApiPropertyOptional({
    description: 'Treatment plan including medications and follow-up',
    type: () => TreatmentPlanDto,
  })
  @ValidateNested()
  @Type(() => TreatmentPlanDto)
  @IsOptional()
  treatment_plan?: TreatmentPlanDto;

  @ApiPropertyOptional({
    description: 'Any additional notes or observations',
    example: 'Patient educated on stress management techniques and sleep hygiene.',
  })
  @IsString()
  @IsOptional()
  additional_notes?: string;

  @ApiPropertyOptional({
    description: 'Whether this note is saved as a draft',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_draft?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the specialist has confirmed the note is accurate',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  confirmed_accurate?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the clinical note is finalized',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class UpdateStructuredNoteDto {
  @ApiPropertyOptional({
    description: 'Legacy free-text content field for backward compatibility',
    example: 'Updated follow-up notes after lab results review.',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'The primary reason for the patient visit',
    example: 'Persistent headache and dizziness for 3 days',
  })
  @IsString()
  @IsOptional()
  chief_complaint?: string;

  @ApiPropertyOptional({
    description: 'Detailed history of the presenting illness',
    example:
      'Patient reports onset of frontal headache 3 days ago, rated 6/10, with associated dizziness.',
  })
  @IsString()
  @IsOptional()
  history_of_present_illness?: string;

  @ApiPropertyOptional({
    description: 'Physical examination findings',
    type: () => PhysicalExaminationDto,
  })
  @ValidateNested()
  @Type(() => PhysicalExaminationDto)
  @IsOptional()
  physical_examination?: PhysicalExaminationDto;

  @ApiPropertyOptional({
    description: 'Assessment and diagnosis details',
    type: () => AssessmentDiagnosisDto,
  })
  @ValidateNested()
  @Type(() => AssessmentDiagnosisDto)
  @IsOptional()
  assessment_diagnosis?: AssessmentDiagnosisDto;

  @ApiPropertyOptional({
    description: 'Treatment plan including medications and follow-up',
    type: () => TreatmentPlanDto,
  })
  @ValidateNested()
  @Type(() => TreatmentPlanDto)
  @IsOptional()
  treatment_plan?: TreatmentPlanDto;

  @ApiPropertyOptional({
    description: 'Any additional notes or observations',
    example: 'Patient educated on stress management techniques and sleep hygiene.',
  })
  @IsString()
  @IsOptional()
  additional_notes?: string;

  @ApiPropertyOptional({
    description: 'Whether this note is saved as a draft',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  is_draft?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the specialist has confirmed the note is accurate',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  confirmed_accurate?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the clinical note is finalized',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
