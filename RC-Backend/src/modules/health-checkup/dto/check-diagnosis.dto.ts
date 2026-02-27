import { IsArray, IsBoolean, IsOptional, IsNumber, IsString, IsObject } from 'class-validator';
import { Age } from '../types/health-checkup.types';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckDiagnosisDto {
  @ApiPropertyOptional({ description: 'Patient biological sex', example: 'female', enum: ['male', 'female'] })
  @IsOptional()
  sex: string;

  @ApiProperty({ description: 'Patient age', example: { value: 32 } })
  @Type(() => Age)
  age: Age;

  @ApiProperty({
    description: 'Accumulated evidence (symptoms, risk factors, lab results)',
    example: [
      { id: 's_21', choice_id: 'present', source: 'initial' },
      { id: 's_98', choice_id: 'absent', source: 'interview' },
    ],
  })
  @IsArray()
  evidence: any[];

  @ApiProperty({ description: 'Whether the interview should stop (true = request final diagnosis)', example: false })
  @IsBoolean()
  should_stop: boolean;

  @ApiPropertyOptional({ description: 'Interview duration in seconds so far', example: 120 })
  @IsOptional()
  @IsNumber()
  interview_duration?: number;

  @ApiPropertyOptional({ description: 'Number of diagnoses considered so far', example: 5 })
  @IsOptional()
  @IsNumber()
  considered_diagnoses?: number;

  @ApiPropertyOptional({ description: 'Infermedica interview token', example: 'itk_abc123' })
  @IsOptional()
  @IsString()
  interview_token?: string;

  @ApiPropertyOptional({
    description: 'Infermedica API extras configuration',
    example: { enable_symptom_duration: true, triage_focused: true },
  })
  @IsOptional()
  @IsObject()
  extras?: {
    enable_symptom_duration?: boolean;
    triage_focused?: boolean;
    disable_groups?: boolean;
  };
}
