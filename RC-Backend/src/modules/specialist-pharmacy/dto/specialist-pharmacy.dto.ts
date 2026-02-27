import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============ PATIENT SEARCH DTOs ============

export enum PatientSearchType {
  MY_PATIENTS = 'my_patients',
  ALL = 'all',
}

export class PatientSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Search by patient name, email, or phone number',
    example: 'Adebayo',
  })
  @IsString()
  @IsOptional()
  search?: string; // Search by name, email, phone

  @ApiPropertyOptional({
    description: 'Filter by patient relationship type',
    enum: PatientSearchType,
    example: PatientSearchType.MY_PATIENTS,
  })
  @IsEnum(PatientSearchType)
  @IsOptional()
  type?: PatientSearchType;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

// ============ DRUG CATALOG DTOs ============

export class DrugCatalogQueryDto {
  @ApiPropertyOptional({
    description: 'Search by drug name or generic name',
    example: 'Amoxicillin',
  })
  @IsString()
  @IsOptional()
  search?: string; // Search by name, generic name

  @ApiPropertyOptional({
    description: 'Filter by drug category ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by manufacturer name',
    example: 'Emzor Pharmaceuticals',
  })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({
    description: 'Filter by stock availability status',
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'all'],
    example: 'in_stock',
  })
  @IsString()
  @IsOptional()
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'all';

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Field to sort results by',
    example: 'selling_price',
  })
  @IsString()
  @IsOptional()
  sort_by?: string;

  @ApiPropertyOptional({
    description: 'Sort order direction',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc';
}

export class DrugBatchQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter batches by status',
    example: 'active',
  })
  @IsString()
  @IsOptional()
  status?: string;
}

// ============ RESPONSE DTOs ============

export class PatientListItemDto {
  @ApiProperty({
    description: 'Patient unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Patient full name',
    example: 'Adebayo Ogunlesi',
  })
  full_name: string;

  @ApiProperty({
    description: 'Patient email address',
    example: 'adebayo.ogunlesi@gmail.com',
  })
  email: string;

  @ApiProperty({
    description: 'Patient phone number',
    example: '+2348012345678',
  })
  phone: string;

  @ApiProperty({
    description: 'Patient gender',
    example: 'Male',
  })
  gender: string;

  @ApiProperty({
    description: 'Patient date of birth',
    example: '1990-05-15T00:00:00.000Z',
  })
  date_of_birth: Date;

  @ApiPropertyOptional({
    description: 'URL to patient profile image',
    example: 'https://rapidcapsules.s3.amazonaws.com/profiles/adebayo.jpg',
  })
  profile_image?: string;

  @ApiPropertyOptional({
    description: 'Date of the most recent appointment',
    example: '2026-02-20T10:30:00.000Z',
  })
  last_appointment_date?: Date;

  @ApiPropertyOptional({
    description: 'Date of the most recent prescription',
    example: '2026-02-18T14:00:00.000Z',
  })
  last_prescription_date?: Date;

  @ApiProperty({
    description: 'Total number of appointments for this patient',
    example: 12,
  })
  total_appointments: number;

  @ApiProperty({
    description: 'Total number of prescriptions for this patient',
    example: 8,
  })
  total_prescriptions: number;
}

export class DrugListItemDto {
  @ApiProperty({
    description: 'Drug unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Drug product name',
    example: 'Amoxicillin Capsule 500mg',
  })
  name: string;

  @ApiProperty({
    description: 'Generic (non-proprietary) name of the drug',
    example: 'Amoxicillin',
  })
  generic_name: string;

  @ApiProperty({
    description: 'Drug strength/dosage amount',
    example: '500mg',
  })
  strength: string;

  @ApiProperty({
    description: 'Pharmaceutical dosage form',
    example: 'Capsule',
  })
  dosage_form: string;

  @ApiProperty({
    description: 'Drug manufacturer name',
    example: 'Emzor Pharmaceuticals',
  })
  manufacturer: string;

  @ApiProperty({
    description: 'Selling price in NGN',
    example: 1500,
  })
  selling_price: number;

  @ApiProperty({
    description: 'Current quantity in stock',
    example: 250,
  })
  quantity: number;

  @ApiProperty({
    description: 'Minimum stock level before reorder is triggered',
    example: 50,
  })
  reorder_level: number;

  @ApiProperty({
    description: 'Whether current stock is below the reorder level',
    example: false,
  })
  is_low_stock: boolean;

  @ApiProperty({
    description: 'Whether the drug is completely out of stock',
    example: false,
  })
  is_out_of_stock: boolean;

  @ApiPropertyOptional({
    description: 'URL to the primary product image',
    example: 'https://rapidcapsules.s3.amazonaws.com/pharmacy/drugs/amoxicillin-500mg.png',
  })
  primary_image?: string;

  @ApiProperty({
    description: 'Whether a prescription is required to dispense this drug',
    example: true,
  })
  requires_prescription: boolean;
}

export class DrugDetailDto extends DrugListItemDto {
  @ApiPropertyOptional({
    description: 'Brand/trade name of the drug',
    example: 'Amoxil',
  })
  brand_name?: string;

  @ApiPropertyOptional({
    description: 'Detailed drug description and usage information',
    example: 'A broad-spectrum penicillin antibiotic used to treat various bacterial infections.',
  })
  description?: string;

  @ApiProperty({
    description: 'List of drug category names',
    type: [String],
    example: ['Antibiotics', 'Anti-infectives'],
  })
  categories: string[];

  @ApiProperty({
    description: 'List of contraindications for the drug',
    type: [String],
    example: ['Penicillin allergy', 'Severe renal impairment'],
  })
  contraindications: string[];

  @ApiProperty({
    description: 'List of known side effects',
    type: [String],
    example: ['Nausea', 'Diarrhoea', 'Skin rash'],
  })
  side_effects: string[];

  @ApiProperty({
    description: 'Important warnings and precautions',
    type: [String],
    example: ['May cause allergic reactions in penicillin-sensitive patients'],
  })
  warnings: string[];

  @ApiPropertyOptional({
    description: 'Dosage guidance for adult and paediatric patients',
    example: {
      adult: { dose: '500mg', frequency: 'Three times daily', max_daily_dose: '3g', instructions: 'Take with or without food' },
      pediatric: { dose: '250mg', frequency: 'Three times daily', min_age_months: 24, instructions: 'May be mixed with milk or juice' },
    },
  })
  dosage_guidance?: {
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
  };

  @ApiProperty({
    description: 'Array of product images with primary flag',
    type: 'array',
    example: [
      { url: 'https://rapidcapsules.s3.amazonaws.com/pharmacy/drugs/amoxicillin-500mg.png', is_primary: true },
    ],
  })
  images: { url: string; is_primary: boolean }[];
}

export class DashboardStatsDto {
  @ApiProperty({
    description: 'Number of prescriptions created today',
    example: 5,
  })
  prescriptions_today: number;

  @ApiProperty({
    description: 'Number of prescriptions created this week',
    example: 23,
  })
  prescriptions_this_week: number;

  @ApiProperty({
    description: 'Number of prescriptions created this month',
    example: 87,
  })
  prescriptions_this_month: number;

  @ApiProperty({
    description: 'Number of prescriptions awaiting patient payment',
    example: 3,
  })
  pending_payment: number;

  @ApiProperty({
    description: 'Number of prescriptions awaiting dispensing',
    example: 7,
  })
  pending_dispensing: number;

  @ApiProperty({
    description: 'Total number of prescriptions issued by the specialist',
    example: 412,
  })
  total_prescriptions: number;

  @ApiProperty({
    description: 'Total number of unique patients served',
    example: 156,
  })
  total_patients: number;

  @ApiProperty({
    description: 'Current wallet balance in NGN',
    example: 125000,
  })
  wallet_balance: number;

  @ApiProperty({
    description: 'List of recent prescriptions with summary details',
    type: 'array',
    example: [],
  })
  recent_prescriptions: any[];
}

// ============ DELIVERY ADDRESS DTOs ============

export class CreateDeliveryAddressDto {
  @ApiProperty({
    description: 'Label for the address (e.g., Home, Office)',
    example: 'Home',
  })
  @IsString()
  @IsNotEmpty()
  label: string; // e.g., "Home", "Office"

  @ApiProperty({
    description: 'Full name of the recipient at this address',
    example: 'Adebayo Ogunlesi',
  })
  @IsString()
  @IsNotEmpty()
  recipient_name: string;

  @ApiProperty({
    description: 'Recipient phone number',
    example: '+2348012345678',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Street address',
    example: '15 Awolowo Road',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    description: 'City name',
    example: 'Ikeja',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'State or region',
    example: 'Lagos',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({
    description: 'Country name',
    example: 'Nigeria',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Postal or ZIP code',
    example: '100271',
  })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiPropertyOptional({
    description: 'Additional delivery instructions or landmarks',
    example: 'Opposite GTBank branch, beside the yellow building',
  })
  @IsString()
  @IsOptional()
  additional_info?: string;

  @ApiPropertyOptional({
    description: 'Whether this should be set as the default delivery address',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}

export class UpdateDeliveryAddressDto {
  @ApiPropertyOptional({
    description: 'Label for the address (e.g., Home, Office)',
    example: 'Office',
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({
    description: 'Full name of the recipient at this address',
    example: 'Adebayo Ogunlesi',
  })
  @IsString()
  @IsOptional()
  recipient_name?: string;

  @ApiPropertyOptional({
    description: 'Recipient phone number',
    example: '+2348098765432',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: '22 Adeola Odeku Street',
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'Victoria Island',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'State or region',
    example: 'Lagos',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'Country name',
    example: 'Nigeria',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Postal or ZIP code',
    example: '101241',
  })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiPropertyOptional({
    description: 'Additional delivery instructions or landmarks',
    example: 'Third floor, Suite 305',
  })
  @IsString()
  @IsOptional()
  additional_info?: string;

  @ApiPropertyOptional({
    description: 'Whether this should be set as the default delivery address',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
