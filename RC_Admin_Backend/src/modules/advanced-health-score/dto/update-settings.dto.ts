import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Number of credits required per health score assessment', example: 5, minimum: 1, maximum: 100 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  credit_cost?: number;

  @ApiPropertyOptional({ description: 'Whether the advanced health score feature is enabled platform-wide', example: true })
  @IsBoolean()
  @IsOptional()
  is_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of documents a patient can upload per assessment', example: 5, minimum: 1, maximum: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  max_documents?: number;

  @ApiPropertyOptional({ description: 'List of accepted file MIME types for document uploads', example: ['application/pdf', 'image/jpeg', 'image/png'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowed_file_types?: string[];

  @ApiPropertyOptional({ description: 'Maximum allowed file size for uploads in megabytes', example: 10, minimum: 1, maximum: 50 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  max_file_size_mb?: number;

  // Health Checkup Inclusion Settings
  @ApiPropertyOptional({ description: 'Number of days within which recent health checkups are automatically included in assessments', example: 30, minimum: 1, maximum: 90 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(90)
  checkup_auto_include_days?: number;

  @ApiPropertyOptional({ description: 'Number of days after which old health checkups are automatically excluded from assessments', example: 90, minimum: 7, maximum: 180 })
  @IsNumber()
  @IsOptional()
  @Min(7)
  @Max(180)
  checkup_auto_exclude_days?: number;

  @ApiPropertyOptional({ description: 'Whether patients can manually exclude specific health checkups from their assessment', example: true })
  @IsBoolean()
  @IsOptional()
  allow_patient_checkup_exclusion?: boolean;

  @ApiPropertyOptional({ description: 'Whether to exclude health checkups with self-care triage level from assessments', example: false })
  @IsBoolean()
  @IsOptional()
  exclude_self_care_triage?: boolean;

  // Credit Sharing Settings
  @ApiPropertyOptional({ description: 'Whether patients can share credits with other patients on the platform', example: true })
  @IsBoolean()
  @IsOptional()
  credit_sharing_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Minimum number of credits that can be shared in a single transfer', example: 1, minimum: 1, maximum: 100 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  credit_sharing_min_amount?: number;

  @ApiPropertyOptional({ description: 'Maximum number of credits that can be shared in a single transfer', example: 50, minimum: 1, maximum: 500 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(500)
  credit_sharing_max_amount?: number;
}
