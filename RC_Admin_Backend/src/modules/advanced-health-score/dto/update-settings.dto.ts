import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  credit_cost?: number;

  @IsBoolean()
  @IsOptional()
  is_enabled?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  max_documents?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowed_file_types?: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  max_file_size_mb?: number;

  // Health Checkup Inclusion Settings
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(90)
  checkup_auto_include_days?: number;

  @IsNumber()
  @IsOptional()
  @Min(7)
  @Max(180)
  checkup_auto_exclude_days?: number;

  @IsBoolean()
  @IsOptional()
  allow_patient_checkup_exclusion?: boolean;

  @IsBoolean()
  @IsOptional()
  exclude_self_care_triage?: boolean;

  // Credit Sharing Settings
  @IsBoolean()
  @IsOptional()
  credit_sharing_enabled?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  credit_sharing_min_amount?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(500)
  credit_sharing_max_amount?: number;
}
