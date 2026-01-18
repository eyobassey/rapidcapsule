import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsDateString,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  PurchaseType,
  ScheduleClass,
  DosageForm,
  DrugCategory,
  DrugStatus,
} from '../enums';

/**
 * Drug Image DTO
 */
export class DrugImageDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @IsString()
  @IsOptional()
  alt_text?: string;
}

/**
 * Dosage Guidance DTO
 */
export class DosageGuidanceDto {
  @IsString()
  @IsOptional()
  min_dose?: string;

  @IsString()
  @IsOptional()
  max_dose?: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  instructions?: string;
}

export class PediatricDosageGuidanceDto extends DosageGuidanceDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  min_age_months?: number;
}

export class AllDosageGuidanceDto {
  @ValidateNested()
  @Type(() => DosageGuidanceDto)
  @IsOptional()
  adult?: DosageGuidanceDto;

  @ValidateNested()
  @Type(() => PediatricDosageGuidanceDto)
  @IsOptional()
  pediatric?: PediatricDosageGuidanceDto;

  @ValidateNested()
  @Type(() => DosageGuidanceDto)
  @IsOptional()
  elderly?: DosageGuidanceDto;
}

/**
 * Create Drug DTO
 */
export class CreateDrugDto {
  // ============ REQUIRED FIELDS ============

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  generic_name: string;

  @IsEnum(DosageForm)
  @IsNotEmpty()
  dosage_form: DosageForm;

  @IsString()
  @IsNotEmpty()
  strength: string;

  @IsNumber()
  @Min(0)
  cost_price: number;

  @IsNumber()
  @Min(0)
  selling_price: number;

  // ============ OPTIONAL FIELDS ============

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  short_description?: string;

  @IsEnum(PurchaseType)
  @IsOptional()
  purchase_type?: PurchaseType;

  @IsEnum(ScheduleClass)
  @IsOptional()
  schedule_class?: ScheduleClass;

  @IsString()
  @IsOptional()
  atc_code?: string;

  @IsArray()
  @IsEnum(DrugCategory, { each: true })
  @IsOptional()
  categories?: DrugCategory[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  pack_size?: number;

  @IsString()
  @IsOptional()
  unit_of_measure?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discount_percentage?: number;

  @IsString()
  @IsOptional()
  nafdac_number?: string;

  @IsString()
  @IsOptional()
  ndc_code?: string;

  @IsBoolean()
  @IsOptional()
  requires_prescription?: boolean;

  @IsBoolean()
  @IsOptional()
  requires_pharmacist_approval?: boolean;

  @IsDateString()
  @IsOptional()
  registration_expiry?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contraindications?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  side_effects?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  drug_interactions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  warnings?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  precautions?: string[];

  @IsString()
  @IsOptional()
  pregnancy_category?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  max_quantity_per_order?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  max_quantity_per_period?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  period_days?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  min_age?: number;

  @IsString()
  @IsOptional()
  health_questionnaire?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrugImageDto)
  @IsOptional()
  images?: DrugImageDto[];

  @ValidateNested()
  @Type(() => AllDosageGuidanceDto)
  @IsOptional()
  dosage_guidance?: AllDosageGuidanceDto;

  @IsEnum(DrugStatus)
  @IsOptional()
  status?: DrugStatus;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  search_keywords?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  symptoms_treated?: string[];
}

/**
 * Update Drug DTO - All fields optional
 */
export class UpdateDrugDto extends PartialType(CreateDrugDto) {}

/**
 * Search Drugs DTO
 */
export class SearchDrugsDto {
  @IsString()
  @IsOptional()
  query?: string; // Text search

  @IsEnum(PurchaseType)
  @IsOptional()
  purchase_type?: PurchaseType;

  @IsString()
  @IsOptional()
  category?: string; // Can be category ID or slug

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  is_otc?: boolean;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  requires_prescription?: boolean;

  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  @IsOptional()
  @Min(0)
  min_price?: number;

  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  @IsOptional()
  max_price?: number;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsString()
  @IsOptional()
  sort_by?: string;

  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc';
}

/**
 * Drug Response DTO for API responses
 */
export class DrugResponseDto {
  id: string;
  name: string;
  generic_name: string;
  manufacturer: string;
  description: string;
  short_description: string;
  purchase_type: PurchaseType;
  schedule_class: ScheduleClass;
  dosage_form: DosageForm;
  strength: string;
  pack_size: number;
  unit_of_measure: string;
  selling_price: number;
  currency: string;
  discount_percentage: number;
  categories: DrugCategory[];
  requires_prescription: boolean;
  requires_pharmacist_approval: boolean;
  images: DrugImageDto[];
  primary_image: string;
  is_otc: boolean;
  is_available: boolean;
  is_featured: boolean;
  display_name: string;
  created_at: Date;
  updated_at: Date;
}
