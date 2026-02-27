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
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'URL of the drug product image', example: 'https://s3.amazonaws.com/rapidcapsules/pharmacy/drugs/amoxicillin-500mg.png' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary display image', example: true })
  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @ApiPropertyOptional({ description: 'Alt text for accessibility', example: 'Amoxicillin 500mg Capsule - GlaxoSmithKline' })
  @IsString()
  @IsOptional()
  alt_text?: string;
}

/**
 * Dosage Guidance DTO
 */
export class DosageGuidanceDto {
  @ApiPropertyOptional({ description: 'Minimum recommended dose', example: '250mg' })
  @IsString()
  @IsOptional()
  min_dose?: string;

  @ApiPropertyOptional({ description: 'Maximum recommended dose', example: '500mg' })
  @IsString()
  @IsOptional()
  max_dose?: string;

  @ApiPropertyOptional({ description: 'Dosing frequency', example: 'Every 8 hours (3 times daily)' })
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Additional dosing instructions', example: 'Take with food. Complete the full course even if symptoms improve.' })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class PediatricDosageGuidanceDto extends DosageGuidanceDto {
  @ApiPropertyOptional({ description: 'Minimum age in months for pediatric dosage', example: 24 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  min_age_months?: number;
}

export class AllDosageGuidanceDto {
  @ApiPropertyOptional({ description: 'Adult dosage guidance', type: DosageGuidanceDto })
  @ValidateNested()
  @Type(() => DosageGuidanceDto)
  @IsOptional()
  adult?: DosageGuidanceDto;

  @ApiPropertyOptional({ description: 'Pediatric dosage guidance with minimum age requirement', type: PediatricDosageGuidanceDto })
  @ValidateNested()
  @Type(() => PediatricDosageGuidanceDto)
  @IsOptional()
  pediatric?: PediatricDosageGuidanceDto;

  @ApiPropertyOptional({ description: 'Elderly dosage guidance', type: DosageGuidanceDto })
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

  @ApiProperty({ description: 'Brand or product name of the drug', example: 'Amoxicillin Capsule 500mg' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Generic (non-proprietary) name of the drug', example: 'Amoxicillin' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  generic_name: string;

  @ApiProperty({ description: 'Dosage form of the medication', enum: DosageForm, example: DosageForm.CAPSULE })
  @IsEnum(DosageForm)
  @IsNotEmpty()
  dosage_form: DosageForm;

  @ApiProperty({ description: 'Drug strength or concentration', example: '500mg' })
  @IsString()
  @IsNotEmpty()
  strength: string;

  @ApiProperty({ description: 'Wholesale cost price in the smallest currency unit', example: 1500 })
  @IsNumber()
  @Min(0)
  cost_price: number;

  @ApiProperty({ description: 'Retail selling price displayed to patients', example: 2500 })
  @IsNumber()
  @Min(0)
  selling_price: number;

  // ============ OPTIONAL FIELDS ============

  @ApiPropertyOptional({ description: 'Name of the drug manufacturer', example: 'GlaxoSmithKline' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Full product description including usage and benefits', example: 'Amoxicillin is a penicillin-type antibiotic used to treat a wide variety of bacterial infections. It works by stopping the growth of bacteria.' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Brief one-line product summary for listing cards', example: 'Broad-spectrum antibiotic for bacterial infections' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  short_description?: string;

  @ApiPropertyOptional({ description: 'Purchase flow type determining buying requirements', enum: PurchaseType, example: PurchaseType.PHARMACY_ONLY })
  @IsEnum(PurchaseType)
  @IsOptional()
  purchase_type?: PurchaseType;

  @ApiPropertyOptional({ description: 'Regulatory schedule class for controlled substance classification', enum: ScheduleClass, example: ScheduleClass.RX_ONLY })
  @IsEnum(ScheduleClass)
  @IsOptional()
  schedule_class?: ScheduleClass;

  @ApiPropertyOptional({ description: 'Anatomical Therapeutic Chemical classification code', example: 'J01CA04' })
  @IsString()
  @IsOptional()
  atc_code?: string;

  @ApiPropertyOptional({ description: 'Drug categories for browsing and filtering', enum: DrugCategory, isArray: true, example: [DrugCategory.ANTIBIOTICS] })
  @IsArray()
  @IsEnum(DrugCategory, { each: true })
  @IsOptional()
  categories?: DrugCategory[];

  @ApiPropertyOptional({ description: 'Searchable tags for improved discoverability', example: ['antibiotic', 'penicillin', 'infection', 'bacteria'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Number of units per pack', example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  pack_size?: number;

  @ApiPropertyOptional({ description: 'Unit of measure for the drug', example: 'capsules' })
  @IsString()
  @IsOptional()
  unit_of_measure?: string;

  @ApiPropertyOptional({ description: 'Stock Keeping Unit identifier', example: 'AMX-500-CAP-10' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Barcode number (EAN/UPC)', example: '5012345678901' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ description: 'Currency code for pricing', example: 'NGN' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Discount percentage applied to selling price', example: 10, minimum: 0, maximum: 100 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discount_percentage?: number;

  @ApiPropertyOptional({ description: 'NAFDAC registration number for Nigerian regulatory compliance', example: 'A4-1234' })
  @IsString()
  @IsOptional()
  nafdac_number?: string;

  @ApiPropertyOptional({ description: 'National Drug Code for US regulatory compliance', example: '0029-6060-39' })
  @IsString()
  @IsOptional()
  ndc_code?: string;

  @ApiPropertyOptional({ description: 'Whether a valid prescription is required before purchase', example: true })
  @IsBoolean()
  @IsOptional()
  requires_prescription?: boolean;

  @ApiPropertyOptional({ description: 'Whether pharmacist review and approval is required before dispensing', example: true })
  @IsBoolean()
  @IsOptional()
  requires_pharmacist_approval?: boolean;

  @ApiPropertyOptional({ description: 'NAFDAC or regulatory registration expiry date in ISO 8601 format', example: '2027-12-31' })
  @IsDateString()
  @IsOptional()
  registration_expiry?: string;

  @ApiPropertyOptional({ description: 'Conditions or factors where the drug should not be used', example: ['Penicillin allergy', 'Severe renal impairment', 'Infectious mononucleosis'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contraindications?: string[];

  @ApiPropertyOptional({ description: 'Known side effects associated with the drug', example: ['Nausea', 'Diarrhoea', 'Skin rash', 'Vomiting'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  side_effects?: string[];

  @ApiPropertyOptional({ description: 'Known drug-drug interactions', example: ['Methotrexate - increased toxicity', 'Warfarin - enhanced anticoagulant effect', 'Probenecid - increased amoxicillin levels'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  drug_interactions?: string[];

  @ApiPropertyOptional({ description: 'Important warnings for healthcare providers and patients', example: ['May cause allergic reactions in penicillin-sensitive patients', 'Prolonged use may result in overgrowth of non-susceptible organisms'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  warnings?: string[];

  @ApiPropertyOptional({ description: 'Precautions to observe during use', example: ['Monitor renal function in patients with kidney disease', 'Use with caution in patients with a history of gastrointestinal disease'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  precautions?: string[];

  @ApiPropertyOptional({ description: 'FDA pregnancy risk category (A, B, C, D, X)', example: 'B' })
  @IsString()
  @IsOptional()
  pregnancy_category?: string;

  @ApiPropertyOptional({ description: 'Maximum number of packs allowed per single order', example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  max_quantity_per_order?: number;

  @ApiPropertyOptional({ description: 'Maximum number of packs allowed within the specified period', example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  max_quantity_per_period?: number;

  @ApiPropertyOptional({ description: 'Number of days for the quantity-limiting period', example: 30 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  period_days?: number;

  @ApiPropertyOptional({ description: 'Minimum patient age in years required to purchase', example: 18 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  min_age?: number;

  @ApiPropertyOptional({ description: 'ID of the health screening questionnaire required before purchase (for OTC_RESTRICTED drugs)', example: '64a7f2b3e4b0c1d2e3f4a5b6' })
  @IsString()
  @IsOptional()
  health_questionnaire?: string;

  @ApiPropertyOptional({ description: 'Product images with primary flag', type: [DrugImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrugImageDto)
  @IsOptional()
  images?: DrugImageDto[];

  @ApiPropertyOptional({ description: 'Dosage guidance broken down by patient group (adult, pediatric, elderly)', type: AllDosageGuidanceDto })
  @ValidateNested()
  @Type(() => AllDosageGuidanceDto)
  @IsOptional()
  dosage_guidance?: AllDosageGuidanceDto;

  @ApiPropertyOptional({ description: 'Current availability status of the drug', enum: DrugStatus, example: DrugStatus.ACTIVE })
  @IsEnum(DrugStatus)
  @IsOptional()
  status?: DrugStatus;

  @ApiPropertyOptional({ description: 'Whether the drug listing is active in the catalogue', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Whether the drug is currently available for purchase', example: true })
  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @ApiPropertyOptional({ description: 'Whether the drug is featured on the storefront homepage', example: false })
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @ApiPropertyOptional({ description: 'Additional keywords to improve search relevance', example: ['amoxil', 'penicillin', 'broad spectrum', 'bacterial infection'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  search_keywords?: string[];

  @ApiPropertyOptional({ description: 'Symptoms or conditions the drug is commonly used to treat', example: ['Bacterial infection', 'Urinary tract infection', 'Ear infection', 'Throat infection'] })
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
  @ApiPropertyOptional({ description: 'Free-text search query matching drug name, generic name, or keywords', example: 'amoxicillin' })
  @IsString()
  @IsOptional()
  query?: string; // Text search

  @ApiPropertyOptional({ description: 'Filter by purchase type', enum: PurchaseType, example: PurchaseType.OTC_GENERAL })
  @IsEnum(PurchaseType)
  @IsOptional()
  purchase_type?: PurchaseType;

  @ApiPropertyOptional({ description: 'Filter by category ID or slug', example: 'ANTIBIOTICS' })
  @IsString()
  @IsOptional()
  category?: string; // Can be category ID or slug

  @ApiPropertyOptional({ description: 'Filter by manufacturer name', example: 'GlaxoSmithKline' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Filter for over-the-counter drugs only', example: true })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  is_otc?: boolean;

  @ApiPropertyOptional({ description: 'Filter for prescription-only drugs', example: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  requires_prescription?: boolean;

  @ApiPropertyOptional({ description: 'Minimum selling price filter', example: 500 })
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  @IsOptional()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({ description: 'Maximum selling price filter', example: 5000 })
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  @IsOptional()
  max_price?: number;

  @ApiPropertyOptional({ description: 'Filter for currently available drugs only', example: true })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @ApiPropertyOptional({ description: 'Filter for featured drugs only', example: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @ApiPropertyOptional({ description: 'Page number for pagination (1-based)', example: 1, minimum: 1 })
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of results per page', example: 20, minimum: 1, maximum: 100 })
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Field to sort results by', example: 'selling_price' })
  @IsString()
  @IsOptional()
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Sort direction', example: 'asc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Display currency code for price conversion', example: 'NGN' })
  @IsString()
  @IsOptional()
  currency?: string; // Display currency (USD, GBP, EUR, NGN)
}

/**
 * Drug Response DTO for API responses
 */
export class DrugResponseDto {
  @ApiProperty({ description: 'Unique drug identifier', example: '64a7f2b3e4b0c1d2e3f4a5b6' })
  id: string;

  @ApiProperty({ description: 'Brand or product name of the drug', example: 'Amoxicillin Capsule 500mg' })
  name: string;

  @ApiProperty({ description: 'Generic (non-proprietary) name', example: 'Amoxicillin' })
  generic_name: string;

  @ApiProperty({ description: 'Drug manufacturer name', example: 'GlaxoSmithKline' })
  manufacturer: string;

  @ApiProperty({ description: 'Full product description', example: 'Amoxicillin is a penicillin-type antibiotic used to treat a wide variety of bacterial infections.' })
  description: string;

  @ApiProperty({ description: 'Brief one-line product summary', example: 'Broad-spectrum antibiotic for bacterial infections' })
  short_description: string;

  @ApiProperty({ description: 'Purchase flow type', enum: PurchaseType, example: PurchaseType.PHARMACY_ONLY })
  purchase_type: PurchaseType;

  @ApiProperty({ description: 'Regulatory schedule classification', enum: ScheduleClass, example: ScheduleClass.RX_ONLY })
  schedule_class: ScheduleClass;

  @ApiProperty({ description: 'Dosage form of the medication', enum: DosageForm, example: DosageForm.CAPSULE })
  dosage_form: DosageForm;

  @ApiProperty({ description: 'Drug strength or concentration', example: '500mg' })
  strength: string;

  @ApiProperty({ description: 'Number of units per pack', example: 10 })
  pack_size: number;

  @ApiProperty({ description: 'Unit of measure for the drug', example: 'capsules' })
  unit_of_measure: string;

  @ApiProperty({ description: 'Retail selling price', example: 2500 })
  selling_price: number;

  @ApiProperty({ description: 'Currency code', example: 'NGN' })
  currency: string;

  @ApiProperty({ description: 'Active discount percentage', example: 10 })
  discount_percentage: number;

  @ApiProperty({ description: 'Drug categories', enum: DrugCategory, isArray: true, example: [DrugCategory.ANTIBIOTICS] })
  categories: DrugCategory[];

  @ApiProperty({ description: 'Whether a prescription is required', example: true })
  requires_prescription: boolean;

  @ApiProperty({ description: 'Whether pharmacist approval is required', example: true })
  requires_pharmacist_approval: boolean;

  @ApiProperty({ description: 'Product images', type: [DrugImageDto] })
  images: DrugImageDto[];

  @ApiProperty({ description: 'URL of the primary product image', example: 'https://s3.amazonaws.com/rapidcapsules/pharmacy/drugs/amoxicillin-500mg.png' })
  primary_image: string;

  @ApiProperty({ description: 'Whether the drug is available over the counter', example: false })
  is_otc: boolean;

  @ApiProperty({ description: 'Whether the drug is currently available for purchase', example: true })
  is_available: boolean;

  @ApiProperty({ description: 'Whether the drug is featured on the storefront', example: false })
  is_featured: boolean;

  @ApiProperty({ description: 'Formatted display name combining name and strength', example: 'Amoxicillin Capsule 500mg (Pack of 10)' })
  display_name: string;

  @ApiProperty({ description: 'Record creation timestamp', example: '2024-07-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ description: 'Record last updated timestamp', example: '2024-07-20T14:45:00.000Z' })
  updated_at: Date;
}
