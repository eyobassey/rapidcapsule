import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  IsEmail,
  Min,
  Max,
  ValidateNested,
  IsDateString,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  PharmacyVerificationStatus,
  PharmacyDocumentType,
  DayOfWeek,
  PaymentMethod,
  PharmacyType,
} from '../enums';

/**
 * Coordinates DTO
 */
export class CoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

/**
 * Address DTO
 */
export class PharmacyAddressDto {
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
  landmark?: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsOptional()
  coordinates?: CoordinatesDto;
}

/**
 * Operating Hours DTO
 */
export class OperatingHoursDto {
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  day: DayOfWeek;

  @IsBoolean()
  @IsOptional()
  is_open?: boolean;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'open_time must be in HH:MM format',
  })
  open_time?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'close_time must be in HH:MM format',
  })
  close_time?: string;

  @IsString()
  @IsOptional()
  break_start?: string;

  @IsString()
  @IsOptional()
  break_end?: string;
}

/**
 * Pharmacy Document DTO
 */
export class PharmacyDocumentDto {
  @IsEnum(PharmacyDocumentType)
  @IsNotEmpty()
  document_type: PharmacyDocumentType;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  file_name?: string;
}

/**
 * Superintendent Pharmacist DTO
 */
export class SuperintendentPharmacistDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  license_number?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

/**
 * Bank Details DTO
 */
export class BankDetailsDto {
  @IsString()
  @IsOptional()
  bank_name?: string;

  @IsString()
  @IsOptional()
  bank_code?: string;

  @IsString()
  @IsOptional()
  account_number?: string;

  @IsString()
  @IsOptional()
  account_name?: string;
}

/**
 * Create Pharmacy DTO
 */
export class CreatePharmacyDto {
  // ============ REQUIRED FIELDS ============

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  registration_number: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @ValidateNested()
  @Type(() => PharmacyAddressDto)
  @IsNotEmpty()
  address: PharmacyAddressDto;

  // ============ OPTIONAL FIELDS ============

  @IsString()
  @IsOptional()
  trading_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(PharmacyType)
  @IsOptional()
  pharmacy_type?: PharmacyType;

  @IsString()
  @IsOptional()
  license_number?: string;

  @IsDateString()
  @IsOptional()
  license_expiry?: string;

  @IsString()
  @IsOptional()
  cac_registration?: string;

  @IsString()
  @IsOptional()
  tax_id?: string;

  @IsString()
  @IsOptional()
  alternate_phone?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursDto)
  @IsOptional()
  operating_hours?: OperatingHoursDto[];

  @IsBoolean()
  @IsOptional()
  is_24_hours?: boolean;

  @IsBoolean()
  @IsOptional()
  offers_delivery?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  delivery_zones?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_fee?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  free_delivery_threshold?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  min_order_amount?: number;

  @IsString()
  @IsOptional()
  estimated_delivery_time?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_radius_km?: number;

  @IsBoolean()
  @IsOptional()
  offers_pickup?: boolean;

  @IsString()
  @IsOptional()
  pickup_instructions?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PharmacyDocumentDto)
  @IsOptional()
  documents?: PharmacyDocumentDto[];

  @ValidateNested()
  @Type(() => SuperintendentPharmacistDto)
  @IsOptional()
  superintendent_pharmacist?: SuperintendentPharmacistDto;

  @ValidateNested()
  @Type(() => BankDetailsDto)
  @IsOptional()
  bank_details?: BankDetailsDto;

  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  @IsOptional()
  accepted_payment_methods?: PaymentMethod[];

  @IsBoolean()
  @IsOptional()
  accepts_insurance?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  accepted_insurance_providers?: string[];

  @IsBoolean()
  @IsOptional()
  offers_consultation?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  consultation_fee?: number;

  @IsBoolean()
  @IsOptional()
  can_dispense_controlled?: boolean;

  @IsBoolean()
  @IsOptional()
  offers_compounding?: boolean;
}

/**
 * Update Pharmacy DTO - All fields optional
 */
export class UpdatePharmacyDto extends PartialType(CreatePharmacyDto) {
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_online?: boolean;

  @IsString()
  @IsOptional()
  offline_reason?: string;

  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;
}

/**
 * Verify Pharmacy DTO
 */
export class VerifyPharmacyDto {
  @IsEnum(PharmacyVerificationStatus)
  @IsNotEmpty()
  verification_status: PharmacyVerificationStatus;

  @IsString()
  @IsOptional()
  verification_notes?: string;
}

/**
 * Suspend Pharmacy DTO
 */
export class SuspendPharmacyDto {
  @IsString()
  @IsNotEmpty()
  suspension_reason: string;
}

/**
 * Search Pharmacies DTO
 */
export class SearchPharmaciesDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  delivery_zone?: string;

  @IsBoolean()
  @IsOptional()
  is_online?: boolean;

  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;

  @IsBoolean()
  @IsOptional()
  offers_delivery?: boolean;

  @IsBoolean()
  @IsOptional()
  is_24_hours?: boolean;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  radius_km?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

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
 * Pharmacy Response DTO
 */
export class PharmacyResponseDto {
  id: string;
  name: string;
  trading_name: string;
  description: string;
  pharmacy_type: PharmacyType;
  email: string;
  phone: string;
  address: PharmacyAddressDto;
  operating_hours: OperatingHoursDto[];
  is_24_hours: boolean;
  offers_delivery: boolean;
  delivery_fee: number;
  free_delivery_threshold: number;
  estimated_delivery_time: string;
  offers_pickup: boolean;
  verification_status: PharmacyVerificationStatus;
  average_rating: number;
  total_ratings: number;
  accepted_payment_methods: PaymentMethod[];
  accepts_insurance: boolean;
  offers_consultation: boolean;
  consultation_fee: number;
  is_active: boolean;
  is_online: boolean;
  is_verified: boolean;
  is_accepting_orders: boolean;
  full_address: string;
  created_at: Date;
  updated_at: Date;
}
