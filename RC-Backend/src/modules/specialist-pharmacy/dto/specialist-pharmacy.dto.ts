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

// ============ PATIENT SEARCH DTOs ============

export enum PatientSearchType {
  MY_PATIENTS = 'my_patients',
  ALL = 'all',
}

export class PatientSearchQueryDto {
  @IsString()
  @IsOptional()
  search?: string; // Search by name, email, phone

  @IsEnum(PatientSearchType)
  @IsOptional()
  type?: PatientSearchType;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

// ============ DRUG CATALOG DTOs ============

export class DrugCatalogQueryDto {
  @IsString()
  @IsOptional()
  search?: string; // Search by name, generic name

  @IsMongoId()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'all';

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsString()
  @IsOptional()
  sort_by?: string;

  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc';
}

export class DrugBatchQueryDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsString()
  @IsOptional()
  status?: string;
}

// ============ RESPONSE DTOs ============

export class PatientListItemDto {
  _id: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: Date;
  profile_image?: string;
  last_appointment_date?: Date;
  last_prescription_date?: Date;
  total_appointments: number;
  total_prescriptions: number;
}

export class DrugListItemDto {
  _id: string;
  name: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  selling_price: number;
  quantity: number;
  reorder_level: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  primary_image?: string;
  requires_prescription: boolean;
}

export class DrugDetailDto extends DrugListItemDto {
  brand_name?: string;
  description?: string;
  categories: string[];
  contraindications: string[];
  side_effects: string[];
  warnings: string[];
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
  images: { url: string; is_primary: boolean }[];
}

export class DashboardStatsDto {
  prescriptions_today: number;
  prescriptions_this_week: number;
  prescriptions_this_month: number;
  pending_payment: number;
  pending_dispensing: number;
  total_prescriptions: number;
  total_patients: number;
  wallet_balance: number;
  recent_prescriptions: any[];
}

// ============ DELIVERY ADDRESS DTOs ============

export class CreateDeliveryAddressDto {
  @IsString()
  @IsNotEmpty()
  label: string; // e.g., "Home", "Office"

  @IsString()
  @IsNotEmpty()
  recipient_name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  @IsOptional()
  additional_info?: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}

export class UpdateDeliveryAddressDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  recipient_name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  @IsOptional()
  additional_info?: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
