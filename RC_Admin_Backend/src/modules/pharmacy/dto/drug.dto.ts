import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DrugImageDto {
  @ApiProperty({ description: 'URL of the drug product image', example: 'https://rapidcapsules.s3.us-east-2.amazonaws.com/pharmacy/drugs/paracetamol-500mg.png' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary display image', example: true })
  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @ApiPropertyOptional({ description: 'Alt text for accessibility', example: 'Paracetamol 500mg tablet blister pack' })
  @IsString()
  @IsOptional()
  alt_text?: string;
}

export class DosageGuidanceDto {
  @ApiPropertyOptional({
    description: 'Adult dosage guidance',
    type: 'object',
    example: { dose: '500mg - 1g', frequency: 'Every 4-6 hours', max_daily_dose: '4g', instructions: 'Take with or after food' },
  })
  adult?: {
    dose?: string;
    frequency?: string;
    max_daily_dose?: string;
    instructions?: string;
  };
  @ApiPropertyOptional({
    description: 'Pediatric dosage guidance',
    type: 'object',
    example: { dose: '10-15mg/kg', frequency: 'Every 4-6 hours', min_age_months: 3, instructions: 'Use oral syringe for accurate dosing' },
  })
  pediatric?: {
    dose?: string;
    frequency?: string;
    min_age_months?: number;
    instructions?: string;
  };
  @ApiPropertyOptional({
    description: 'Elderly dosage guidance',
    type: 'object',
    example: { dose: '500mg', frequency: 'Every 6-8 hours', instructions: 'Reduced dose for hepatic impairment' },
  })
  elderly?: {
    dose?: string;
    frequency?: string;
    instructions?: string;
  };
}

export class CreateDrugDto {
  @ApiProperty({ description: 'Drug product name', example: 'Paracetamol 500mg Tablets' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'International Non-proprietary Name (INN)', example: 'Paracetamol' })
  @IsString()
  generic_name: string;

  @ApiPropertyOptional({ description: 'Proprietary brand name', example: 'Emzor Paracetamol' })
  @IsString()
  @IsOptional()
  brand_name?: string;

  @ApiPropertyOptional({ description: 'Drug manufacturer name', example: 'Emzor Pharmaceutical Industries Ltd' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Detailed drug description', example: 'Paracetamol is a widely used analgesic and antipyretic for the relief of mild to moderate pain and fever.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Brief description for product cards', example: 'Pain and fever relief tablets' })
  @IsString()
  @IsOptional()
  short_description?: string;

  @ApiProperty({ description: 'Drug classification ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  classification: string;

  @ApiPropertyOptional({ description: 'Array of category ObjectIds', example: ['65a1b2c3d4e5f6a7b8c9d0e2', '65a1b2c3d4e5f6a7b8c9d0e3'] })
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ description: 'Dosage form ObjectId (e.g. tablet, capsule)', example: '65a1b2c3d4e5f6a7b8c9d0e4' })
  @IsMongoId()
  @IsOptional()
  dosage_form?: string;

  @ApiPropertyOptional({ description: 'Route of administration ObjectId (e.g. oral)', example: '65a1b2c3d4e5f6a7b8c9d0e5' })
  @IsMongoId()
  @IsOptional()
  route?: string;

  @ApiPropertyOptional({ description: 'Searchable tags for the drug', example: ['analgesic', 'antipyretic', 'pain relief', 'fever'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Drug strength/concentration', example: '500mg' })
  @IsString()
  strength: string;

  @ApiPropertyOptional({ description: 'Number of units per pack', example: 96 })
  @IsNumber()
  @IsOptional()
  pack_size?: number;

  @ApiPropertyOptional({ description: 'Unit of measure for dispensing', example: 'tablet' })
  @IsString()
  @IsOptional()
  unit_of_measure?: string;

  @ApiPropertyOptional({ description: 'Stock-keeping unit code', example: 'DRG-PARA-500MG-096' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Product barcode / GTIN', example: '8901234567890' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ description: 'Wholesale cost price in NGN', example: 450.00 })
  @IsNumber()
  cost_price: number;

  @ApiProperty({ description: 'Retail selling price in NGN', example: 750.00 })
  @IsNumber()
  selling_price: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'NGN' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Discount percentage to apply', example: 5 })
  @IsNumber()
  @IsOptional()
  discount_percentage?: number;

  @ApiPropertyOptional({ description: 'Channel-specific pricing overrides', example: { online: { cost_price: 430, selling_price: 700 } } })
  @IsOptional()
  prices?: Record<string, { cost_price?: number; selling_price?: number }>;

  @ApiPropertyOptional({ description: 'Current stock quantity', example: 500 })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Minimum stock level before reorder alert', example: 50 })
  @IsNumber()
  @IsOptional()
  reorder_level?: number;

  @ApiPropertyOptional({ description: 'Maximum stock capacity', example: 2000 })
  @IsNumber()
  @IsOptional()
  max_stock_level?: number;

  @ApiPropertyOptional({ description: 'NAFDAC registration number', example: 'A4-0123' })
  @IsString()
  @IsOptional()
  nafdac_number?: string;

  @ApiPropertyOptional({ description: 'National Drug Code', example: '12345-678-90' })
  @IsString()
  @IsOptional()
  ndc_code?: string;

  @ApiPropertyOptional({ description: 'Whether a valid prescription is required for purchase', example: false })
  @IsBoolean()
  @IsOptional()
  requires_prescription?: boolean;

  @ApiPropertyOptional({ description: 'Whether pharmacist approval is required before dispensing', example: false })
  @IsBoolean()
  @IsOptional()
  requires_pharmacist_approval?: boolean;

  @ApiPropertyOptional({ description: 'Whether health screening is required before purchase', example: false })
  @IsBoolean()
  @IsOptional()
  requires_health_screening?: boolean;

  @ApiPropertyOptional({ description: 'Whether customer ID verification is required', example: false })
  @IsBoolean()
  @IsOptional()
  requires_id_verification?: boolean;

  @ApiPropertyOptional({ description: 'Whether purchases are tracked for abuse prevention', example: false })
  @IsBoolean()
  @IsOptional()
  requires_purchase_tracking?: boolean;

  @ApiPropertyOptional({ description: 'Minimum age in years to purchase', example: 18 })
  @IsNumber()
  @IsOptional()
  min_age?: number;

  @ApiPropertyOptional({ description: 'Maximum quantity allowed per single order', example: 10 })
  @IsNumber()
  @IsOptional()
  max_quantity_per_order?: number;

  @ApiPropertyOptional({ description: 'Maximum quantity allowed within the restriction period', example: 20 })
  @IsNumber()
  @IsOptional()
  max_quantity_per_period?: number;

  @ApiPropertyOptional({ description: 'Number of days for the purchase quantity restriction period', example: 30 })
  @IsNumber()
  @IsOptional()
  period_days?: number;

  @ApiPropertyOptional({ description: 'Minimum hours between repeat purchases', example: 24 })
  @IsNumber()
  @IsOptional()
  purchase_gap_hours?: number;

  @ApiPropertyOptional({ description: 'Reason for purchase restrictions', example: 'Controlled substance - codeine content' })
  @IsString()
  @IsOptional()
  restriction_reason?: string;

  @ApiPropertyOptional({ description: 'Special regulatory controls', example: ['Schedule 2', 'Record keeping required'] })
  @IsArray()
  @IsOptional()
  special_controls?: string[];

  @ApiPropertyOptional({ description: 'Known contraindications', example: ['Severe hepatic impairment', 'Hypersensitivity to paracetamol'] })
  @IsArray()
  @IsOptional()
  contraindications?: string[];

  @ApiPropertyOptional({ description: 'Known side effects', example: ['Nausea', 'Allergic skin reactions', 'Thrombocytopenia (rare)'] })
  @IsArray()
  @IsOptional()
  side_effects?: string[];

  @ApiPropertyOptional({ description: 'Drug warnings', example: ['Do not exceed recommended dose', 'Avoid alcohol consumption'] })
  @IsArray()
  @IsOptional()
  warnings?: string[];

  @ApiPropertyOptional({ description: 'Drug precautions', example: ['Use with caution in hepatic impairment', 'Caution in chronic malnutrition'] })
  @IsArray()
  @IsOptional()
  precautions?: string[];

  @ApiPropertyOptional({ description: 'FDA pregnancy risk category', example: 'B' })
  @IsString()
  @IsOptional()
  pregnancy_category?: string;

  @ApiPropertyOptional({ description: 'Key points for pharmacist counseling', example: 'Advise patient not to take with other paracetamol-containing products. Maximum 8 tablets in 24 hours.' })
  @IsString()
  @IsOptional()
  pharmacist_counseling_points?: string;

  @ApiPropertyOptional({ description: 'Patient-facing information leaflet text', example: 'Take 1-2 tablets every 4-6 hours as needed. Do not take more than 8 tablets in 24 hours.' })
  @IsString()
  @IsOptional()
  patient_information?: string;

  @ApiPropertyOptional({ description: 'Product images', type: [DrugImageDto] })
  @IsArray()
  @IsOptional()
  images?: DrugImageDto[];

  @ApiPropertyOptional({ description: 'Dosage guidance for different populations', type: DosageGuidanceDto })
  @IsOptional()
  dosage_guidance?: DosageGuidanceDto;

  @ApiPropertyOptional({ description: 'Whether the drug is active in the catalogue', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Whether the drug is currently available for purchase', example: true })
  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @ApiPropertyOptional({ description: 'Whether the drug is featured on storefront', example: false })
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @ApiPropertyOptional({ description: 'Additional keywords for search indexing', example: ['panadol', 'tylenol', 'acetaminophen'] })
  @IsArray()
  @IsOptional()
  search_keywords?: string[];

  @ApiPropertyOptional({ description: 'Symptoms this drug is commonly used to treat', example: ['headache', 'fever', 'body pain', 'toothache'] })
  @IsArray()
  @IsOptional()
  symptoms_treated?: string[];
}

export class UpdateDrugDto {
  @ApiPropertyOptional({ description: 'Drug product name', example: 'Amoxicillin 500mg Capsules' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'International Non-proprietary Name (INN)', example: 'Amoxicillin' })
  @IsString()
  @IsOptional()
  generic_name?: string;

  @ApiPropertyOptional({ description: 'Proprietary brand name', example: 'Amoxil' })
  @IsString()
  @IsOptional()
  brand_name?: string;

  @ApiPropertyOptional({ description: 'Drug manufacturer name', example: 'GlaxoSmithKline Nigeria' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Detailed drug description', example: 'Broad-spectrum penicillin antibiotic used to treat various bacterial infections.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Brief description for product cards', example: 'Broad-spectrum antibiotic capsules' })
  @IsString()
  @IsOptional()
  short_description?: string;

  @ApiPropertyOptional({ description: 'Drug classification ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsOptional()
  classification?: string;

  @ApiPropertyOptional({ description: 'Array of category ObjectIds', example: ['65a1b2c3d4e5f6a7b8c9d0e2'] })
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ description: 'Dosage form ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0e4' })
  @IsMongoId()
  @IsOptional()
  dosage_form?: string;

  @ApiPropertyOptional({ description: 'Route of administration ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0e5' })
  @IsMongoId()
  @IsOptional()
  route?: string;

  @ApiPropertyOptional({ description: 'Searchable tags', example: ['antibiotic', 'penicillin', 'infection'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Drug strength/concentration', example: '500mg' })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiPropertyOptional({ description: 'Number of units per pack', example: 100 })
  @IsNumber()
  @IsOptional()
  pack_size?: number;

  @ApiPropertyOptional({ description: 'Unit of measure for dispensing', example: 'capsule' })
  @IsString()
  @IsOptional()
  unit_of_measure?: string;

  @ApiPropertyOptional({ description: 'Stock-keeping unit code', example: 'DRG-AMOX-500MG-100' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Product barcode / GTIN', example: '8901234567891' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ description: 'Wholesale cost price in NGN', example: 1200.00 })
  @IsNumber()
  @IsOptional()
  cost_price?: number;

  @ApiPropertyOptional({ description: 'Retail selling price in NGN', example: 1800.00 })
  @IsNumber()
  @IsOptional()
  selling_price?: number;

  @ApiPropertyOptional({ description: 'Discount percentage to apply', example: 0 })
  @IsNumber()
  @IsOptional()
  discount_percentage?: number;

  @ApiPropertyOptional({ description: 'Channel-specific pricing overrides', example: { online: { cost_price: 1150, selling_price: 1700 } } })
  @IsOptional()
  prices?: Record<string, { cost_price?: number; selling_price?: number }>;

  @ApiPropertyOptional({ description: 'Current stock quantity', example: 300 })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Minimum stock level before reorder alert', example: 40 })
  @IsNumber()
  @IsOptional()
  reorder_level?: number;

  @ApiPropertyOptional({ description: 'NAFDAC registration number', example: 'A4-5678' })
  @IsString()
  @IsOptional()
  nafdac_number?: string;

  @ApiPropertyOptional({ description: 'Whether a valid prescription is required', example: true })
  @IsBoolean()
  @IsOptional()
  requires_prescription?: boolean;

  @ApiPropertyOptional({ description: 'Whether pharmacist approval is required', example: true })
  @IsBoolean()
  @IsOptional()
  requires_pharmacist_approval?: boolean;

  @ApiPropertyOptional({ description: 'Whether health screening is required before purchase', example: false })
  @IsBoolean()
  @IsOptional()
  requires_health_screening?: boolean;

  @ApiPropertyOptional({ description: 'Whether customer ID verification is required', example: false })
  @IsBoolean()
  @IsOptional()
  requires_id_verification?: boolean;

  @ApiPropertyOptional({ description: 'Whether purchases are tracked for abuse prevention', example: false })
  @IsBoolean()
  @IsOptional()
  requires_purchase_tracking?: boolean;

  @ApiPropertyOptional({ description: 'Minimum age in years to purchase', example: 0 })
  @IsNumber()
  @IsOptional()
  min_age?: number;

  @ApiPropertyOptional({ description: 'Maximum quantity allowed per single order', example: 5 })
  @IsNumber()
  @IsOptional()
  max_quantity_per_order?: number;

  @ApiPropertyOptional({ description: 'Reason for purchase restrictions', example: 'Prescription-only antibiotic' })
  @IsString()
  @IsOptional()
  restriction_reason?: string;

  @ApiPropertyOptional({ description: 'Special regulatory controls', example: ['Prescription only'] })
  @IsArray()
  @IsOptional()
  special_controls?: string[];

  @ApiPropertyOptional({ description: 'Known contraindications', example: ['Penicillin allergy', 'Infectious mononucleosis'] })
  @IsArray()
  @IsOptional()
  contraindications?: string[];

  @ApiPropertyOptional({ description: 'Known side effects', example: ['Diarrhoea', 'Nausea', 'Skin rash'] })
  @IsArray()
  @IsOptional()
  side_effects?: string[];

  @ApiPropertyOptional({ description: 'Drug warnings', example: ['Complete full course of treatment', 'May reduce effectiveness of oral contraceptives'] })
  @IsArray()
  @IsOptional()
  warnings?: string[];

  @ApiPropertyOptional({ description: 'Key points for pharmacist counseling', example: 'Advise patient to complete the full course even if symptoms improve. Take at evenly spaced intervals.' })
  @IsString()
  @IsOptional()
  pharmacist_counseling_points?: string;

  @ApiPropertyOptional({ description: 'Product images', type: [DrugImageDto] })
  @IsArray()
  @IsOptional()
  images?: DrugImageDto[];

  @ApiPropertyOptional({ description: 'Dosage guidance for different populations', type: DosageGuidanceDto })
  @IsOptional()
  dosage_guidance?: DosageGuidanceDto;

  @ApiPropertyOptional({ description: 'Whether the drug is active in the catalogue', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Whether the drug is currently available for purchase', example: true })
  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @ApiPropertyOptional({ description: 'Whether the drug is featured on storefront', example: false })
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;
}

export class UpdateDrugStockDto {
  @ApiProperty({ description: 'Quantity to adjust', example: 50 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Type of stock adjustment', enum: ['add', 'subtract', 'set'], example: 'add' })
  @IsString()
  @IsOptional()
  adjustment_type?: 'add' | 'subtract' | 'set';

  @ApiPropertyOptional({ description: 'Reason for stock adjustment', example: 'New shipment received from Emzor warehouse' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class DrugQueryDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Search term to filter drugs by name, generic name, or SKU', example: 'paracetamol' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by drug classification ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0e1' })
  @IsString()
  @IsOptional()
  classification?: string;

  @ApiPropertyOptional({ description: 'Filter by category ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0e2' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by manufacturer name', example: 'Emzor Pharmaceutical Industries Ltd' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Filter by supplier ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0e6' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ description: 'Filter by stock availability status', enum: ['available', 'low', 'out'], example: 'available' })
  @IsString()
  @IsOptional()
  stockStatus?: 'available' | 'low' | 'out';

  @ApiPropertyOptional({ description: 'Include inactive/discontinued drugs', example: false })
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;

  @ApiPropertyOptional({ description: 'Include sample/test data in results', example: false })
  @IsBoolean()
  @IsOptional()
  includeSampleData?: boolean;
}
