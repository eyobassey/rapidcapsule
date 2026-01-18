import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsMongoId } from 'class-validator';

export class DrugImageDto {
  @IsString()
  url: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @IsString()
  @IsOptional()
  alt_text?: string;
}

export class DosageGuidanceDto {
  adult?: {
    dose?: string;
    frequency?: string;
    max_daily_dose?: string;
    instructions?: string;
  };
  pediatric?: {
    dose?: string;
    frequency?: string;
    min_age_months?: number;
    instructions?: string;
  };
  elderly?: {
    dose?: string;
    frequency?: string;
    instructions?: string;
  };
}

export class CreateDrugDto {
  @IsString()
  name: string;

  @IsString()
  generic_name: string;

  @IsString()
  @IsOptional()
  brand_name?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  short_description?: string;

  @IsMongoId()
  classification: string;

  @IsArray()
  @IsOptional()
  categories?: string[];

  @IsMongoId()
  @IsOptional()
  dosage_form?: string;

  @IsMongoId()
  @IsOptional()
  route?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  strength: string;

  @IsNumber()
  @IsOptional()
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

  @IsNumber()
  cost_price: number;

  @IsNumber()
  selling_price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  discount_percentage?: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  reorder_level?: number;

  @IsNumber()
  @IsOptional()
  max_stock_level?: number;

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

  @IsBoolean()
  @IsOptional()
  requires_health_screening?: boolean;

  @IsBoolean()
  @IsOptional()
  requires_id_verification?: boolean;

  @IsBoolean()
  @IsOptional()
  requires_purchase_tracking?: boolean;

  @IsNumber()
  @IsOptional()
  min_age?: number;

  @IsNumber()
  @IsOptional()
  max_quantity_per_order?: number;

  @IsNumber()
  @IsOptional()
  max_quantity_per_period?: number;

  @IsNumber()
  @IsOptional()
  period_days?: number;

  @IsNumber()
  @IsOptional()
  purchase_gap_hours?: number;

  @IsString()
  @IsOptional()
  restriction_reason?: string;

  @IsArray()
  @IsOptional()
  special_controls?: string[];

  @IsArray()
  @IsOptional()
  contraindications?: string[];

  @IsArray()
  @IsOptional()
  side_effects?: string[];

  @IsArray()
  @IsOptional()
  warnings?: string[];

  @IsArray()
  @IsOptional()
  precautions?: string[];

  @IsString()
  @IsOptional()
  pregnancy_category?: string;

  @IsString()
  @IsOptional()
  pharmacist_counseling_points?: string;

  @IsString()
  @IsOptional()
  patient_information?: string;

  @IsArray()
  @IsOptional()
  images?: DrugImageDto[];

  @IsOptional()
  dosage_guidance?: DosageGuidanceDto;

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
  @IsOptional()
  search_keywords?: string[];

  @IsArray()
  @IsOptional()
  symptoms_treated?: string[];
}

export class UpdateDrugDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  generic_name?: string;

  @IsString()
  @IsOptional()
  brand_name?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  short_description?: string;

  @IsMongoId()
  @IsOptional()
  classification?: string;

  @IsArray()
  @IsOptional()
  categories?: string[];

  @IsMongoId()
  @IsOptional()
  dosage_form?: string;

  @IsMongoId()
  @IsOptional()
  route?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  strength?: string;

  @IsNumber()
  @IsOptional()
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

  @IsNumber()
  @IsOptional()
  cost_price?: number;

  @IsNumber()
  @IsOptional()
  selling_price?: number;

  @IsNumber()
  @IsOptional()
  discount_percentage?: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  reorder_level?: number;

  @IsString()
  @IsOptional()
  nafdac_number?: string;

  @IsBoolean()
  @IsOptional()
  requires_prescription?: boolean;

  @IsBoolean()
  @IsOptional()
  requires_pharmacist_approval?: boolean;

  @IsBoolean()
  @IsOptional()
  requires_health_screening?: boolean;

  @IsBoolean()
  @IsOptional()
  requires_id_verification?: boolean;

  @IsBoolean()
  @IsOptional()
  requires_purchase_tracking?: boolean;

  @IsNumber()
  @IsOptional()
  min_age?: number;

  @IsNumber()
  @IsOptional()
  max_quantity_per_order?: number;

  @IsString()
  @IsOptional()
  restriction_reason?: string;

  @IsArray()
  @IsOptional()
  special_controls?: string[];

  @IsArray()
  @IsOptional()
  contraindications?: string[];

  @IsArray()
  @IsOptional()
  side_effects?: string[];

  @IsArray()
  @IsOptional()
  warnings?: string[];

  @IsString()
  @IsOptional()
  pharmacist_counseling_points?: string;

  @IsArray()
  @IsOptional()
  images?: DrugImageDto[];

  @IsOptional()
  dosage_guidance?: DosageGuidanceDto;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;
}

export class UpdateDrugStockDto {
  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  adjustment_type?: 'add' | 'subtract' | 'set';

  @IsString()
  @IsOptional()
  reason?: string;
}

export class DrugQueryDto {
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  classification?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsString()
  @IsOptional()
  stockStatus?: 'available' | 'low' | 'out';

  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;

  @IsBoolean()
  @IsOptional()
  includeSampleData?: boolean;
}
