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
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Latitude of the pharmacy location', example: 6.4541 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude of the pharmacy location', example: 3.4192 })
  @IsNumber()
  longitude: number;
}

/**
 * Address DTO
 */
export class PharmacyAddressDto {
  @ApiProperty({ description: 'Street address of the pharmacy', example: '15 Admiralty Way, Lekki Phase 1' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'City where the pharmacy is located', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State where the pharmacy is located', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({ description: 'Country where the pharmacy is located', example: 'Nigeria' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal or ZIP code', example: '101233' })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiPropertyOptional({ description: 'Nearby landmark for easy location', example: 'Opposite Shoprite Mall' })
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiPropertyOptional({ description: 'GPS coordinates of the pharmacy', type: CoordinatesDto })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsOptional()
  coordinates?: CoordinatesDto;
}

/**
 * Operating Hours DTO
 */
export class OperatingHoursDto {
  @ApiProperty({ description: 'Day of the week', enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  day: DayOfWeek;

  @ApiPropertyOptional({ description: 'Whether the pharmacy is open on this day', example: true })
  @IsBoolean()
  @IsOptional()
  is_open?: boolean;

  @ApiPropertyOptional({ description: 'Opening time in HH:MM format', example: '08:00' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'open_time must be in HH:MM format',
  })
  open_time?: string;

  @ApiPropertyOptional({ description: 'Closing time in HH:MM format', example: '21:00' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'close_time must be in HH:MM format',
  })
  close_time?: string;

  @ApiPropertyOptional({ description: 'Break start time in HH:MM format', example: '13:00' })
  @IsString()
  @IsOptional()
  break_start?: string;

  @ApiPropertyOptional({ description: 'Break end time in HH:MM format', example: '14:00' })
  @IsString()
  @IsOptional()
  break_end?: string;
}

/**
 * Pharmacy Document DTO
 */
export class PharmacyDocumentDto {
  @ApiProperty({ description: 'Type of pharmacy verification document', enum: PharmacyDocumentType, example: PharmacyDocumentType.PHARMACY_LICENSE })
  @IsEnum(PharmacyDocumentType)
  @IsNotEmpty()
  document_type: PharmacyDocumentType;

  @ApiProperty({ description: 'URL of the uploaded document', example: 'https://s3.amazonaws.com/rapidcapsules/pharmacy/docs/pcn-license.pdf' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ description: 'Original file name of the document', example: 'pcn-license-2024.pdf' })
  @IsString()
  @IsOptional()
  file_name?: string;
}

/**
 * Superintendent Pharmacist DTO
 */
export class SuperintendentPharmacistDto {
  @ApiPropertyOptional({ description: 'Full name of the superintendent pharmacist', example: 'Pharm. Adebayo Ogunlesi' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'PCN license number of the superintendent pharmacist', example: 'PCN/SP/2024/005678' })
  @IsString()
  @IsOptional()
  license_number?: string;

  @ApiPropertyOptional({ description: 'Phone number of the superintendent pharmacist', example: '+2348098765432' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address of the superintendent pharmacist', example: 'adebayo.ogunlesi@medpluspharmacy.ng' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

/**
 * Bank Details DTO
 */
export class BankDetailsDto {
  @ApiPropertyOptional({ description: 'Name of the bank', example: 'First Bank of Nigeria' })
  @IsString()
  @IsOptional()
  bank_name?: string;

  @ApiPropertyOptional({ description: 'Bank code for payment processing', example: '011' })
  @IsString()
  @IsOptional()
  bank_code?: string;

  @ApiPropertyOptional({ description: 'Bank account number', example: '2033456789' })
  @IsString()
  @IsOptional()
  account_number?: string;

  @ApiPropertyOptional({ description: 'Name on the bank account', example: 'MedPlus Pharmacy Ltd' })
  @IsString()
  @IsOptional()
  account_name?: string;
}

/**
 * Create Pharmacy DTO
 */
export class CreatePharmacyDto {
  // ============ REQUIRED FIELDS ============

  @ApiProperty({ description: 'Official registered name of the pharmacy', example: 'MedPlus Pharmacy' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'PCN or regulatory registration number', example: 'PCN/2024/001234' })
  @IsString()
  @IsNotEmpty()
  registration_number: string;

  @ApiProperty({ description: 'Primary contact email address', example: 'info@medpluspharmacy.ng' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Primary contact phone number', example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Physical address of the pharmacy', type: PharmacyAddressDto })
  @ValidateNested()
  @Type(() => PharmacyAddressDto)
  @IsNotEmpty()
  address: PharmacyAddressDto;

  // ============ OPTIONAL FIELDS ============

  @ApiPropertyOptional({ description: 'Trading or brand name if different from registered name', example: 'MedPlus' })
  @IsString()
  @IsOptional()
  trading_name?: string;

  @ApiPropertyOptional({ description: 'Brief description of the pharmacy and its services', example: 'Full-service community pharmacy offering prescription dispensing, OTC medications, and health consultations in Lekki.' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Type or classification of the pharmacy', enum: PharmacyType, example: PharmacyType.COMMUNITY })
  @IsEnum(PharmacyType)
  @IsOptional()
  pharmacy_type?: PharmacyType;

  @ApiPropertyOptional({ description: 'PCN premises license number', example: 'PCN/PL/2024/009876' })
  @IsString()
  @IsOptional()
  license_number?: string;

  @ApiPropertyOptional({ description: 'License expiry date in ISO 8601 format', example: '2025-12-31' })
  @IsDateString()
  @IsOptional()
  license_expiry?: string;

  @ApiPropertyOptional({ description: 'Corporate Affairs Commission registration number', example: 'RC-1234567' })
  @IsString()
  @IsOptional()
  cac_registration?: string;

  @ApiPropertyOptional({ description: 'Tax identification number', example: '12345678-0001' })
  @IsString()
  @IsOptional()
  tax_id?: string;

  @ApiPropertyOptional({ description: 'Alternative phone number for the pharmacy', example: '+2349087654321' })
  @IsString()
  @IsOptional()
  alternate_phone?: string;

  @ApiPropertyOptional({ description: 'Pharmacy website URL', example: 'https://www.medpluspharmacy.ng' })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Weekly operating hours schedule', type: [OperatingHoursDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursDto)
  @IsOptional()
  operating_hours?: OperatingHoursDto[];

  @ApiPropertyOptional({ description: 'Whether the pharmacy operates 24 hours', example: false })
  @IsBoolean()
  @IsOptional()
  is_24_hours?: boolean;

  @ApiPropertyOptional({ description: 'Whether the pharmacy offers delivery services', example: true })
  @IsBoolean()
  @IsOptional()
  offers_delivery?: boolean;

  @ApiPropertyOptional({ description: 'List of areas or zones the pharmacy delivers to', example: ['Lekki', 'Victoria Island', 'Ikoyi', 'Ajah'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  delivery_zones?: string[];

  @ApiPropertyOptional({ description: 'Delivery fee in Naira', example: 1500 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_fee?: number;

  @ApiPropertyOptional({ description: 'Order amount in Naira above which delivery is free', example: 10000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  free_delivery_threshold?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount in Naira for delivery', example: 2000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  min_order_amount?: number;

  @ApiPropertyOptional({ description: 'Estimated delivery time as a human-readable string', example: '30-60 minutes' })
  @IsString()
  @IsOptional()
  estimated_delivery_time?: string;

  @ApiPropertyOptional({ description: 'Maximum delivery radius in kilometres', example: 15 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_radius_km?: number;

  @ApiPropertyOptional({ description: 'Whether the pharmacy allows in-store pickup', example: true })
  @IsBoolean()
  @IsOptional()
  offers_pickup?: boolean;

  @ApiPropertyOptional({ description: 'Instructions for customers picking up orders', example: 'Please come to the dispensary counter with your order ID and a valid ID card.' })
  @IsString()
  @IsOptional()
  pickup_instructions?: string;

  @ApiPropertyOptional({ description: 'Verification documents submitted by the pharmacy', type: [PharmacyDocumentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PharmacyDocumentDto)
  @IsOptional()
  documents?: PharmacyDocumentDto[];

  @ApiPropertyOptional({ description: 'Details of the superintendent pharmacist in charge', type: SuperintendentPharmacistDto })
  @ValidateNested()
  @Type(() => SuperintendentPharmacistDto)
  @IsOptional()
  superintendent_pharmacist?: SuperintendentPharmacistDto;

  @ApiPropertyOptional({ description: 'Bank account details for payouts', type: BankDetailsDto })
  @ValidateNested()
  @Type(() => BankDetailsDto)
  @IsOptional()
  bank_details?: BankDetailsDto;

  @ApiPropertyOptional({ description: 'Payment methods accepted by the pharmacy', enum: PaymentMethod, isArray: true, example: [PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.CASH_ON_DELIVERY] })
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  @IsOptional()
  accepted_payment_methods?: PaymentMethod[];

  @ApiPropertyOptional({ description: 'Whether the pharmacy accepts health insurance', example: true })
  @IsBoolean()
  @IsOptional()
  accepts_insurance?: boolean;

  @ApiPropertyOptional({ description: 'List of accepted health insurance providers', example: ['HMO HealthPlus', 'Leadway Health', 'AXA Mansard', 'Hygeia HMO'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  accepted_insurance_providers?: string[];

  @ApiPropertyOptional({ description: 'Whether the pharmacy offers pharmacist consultations', example: true })
  @IsBoolean()
  @IsOptional()
  offers_consultation?: boolean;

  @ApiPropertyOptional({ description: 'Consultation fee in Naira', example: 2500 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  consultation_fee?: number;

  @ApiPropertyOptional({ description: 'Whether the pharmacy is licensed to dispense controlled substances', example: false })
  @IsBoolean()
  @IsOptional()
  can_dispense_controlled?: boolean;

  @ApiPropertyOptional({ description: 'Whether the pharmacy offers compounding services', example: false })
  @IsBoolean()
  @IsOptional()
  offers_compounding?: boolean;
}

/**
 * Update Pharmacy DTO - All fields optional
 */
export class UpdatePharmacyDto extends PartialType(CreatePharmacyDto) {
  @ApiPropertyOptional({ description: 'Whether the pharmacy is active on the platform', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Whether the pharmacy is currently online and accepting orders', example: true })
  @IsBoolean()
  @IsOptional()
  is_online?: boolean;

  @ApiPropertyOptional({ description: 'Reason for going offline (when is_online is false)', example: 'Temporary closure for inventory restocking' })
  @IsString()
  @IsOptional()
  offline_reason?: string;

  @ApiPropertyOptional({ description: 'Whether the pharmacy is featured or promoted on the platform', example: false })
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;
}

/**
 * Verify Pharmacy DTO
 */
export class VerifyPharmacyDto {
  @ApiProperty({ description: 'New verification status for the pharmacy', enum: PharmacyVerificationStatus, example: PharmacyVerificationStatus.VERIFIED })
  @IsEnum(PharmacyVerificationStatus)
  @IsNotEmpty()
  verification_status: PharmacyVerificationStatus;

  @ApiPropertyOptional({ description: 'Notes or comments regarding the verification decision', example: 'All documents verified. PCN license and CAC registration confirmed valid.' })
  @IsString()
  @IsOptional()
  verification_notes?: string;
}

/**
 * Suspend Pharmacy DTO
 */
export class SuspendPharmacyDto {
  @ApiProperty({ description: 'Reason for suspending the pharmacy', example: 'Expired PCN license. Pharmacy must renew before resuming operations.' })
  @IsString()
  @IsNotEmpty()
  suspension_reason: string;
}

/**
 * Search Pharmacies DTO
 */
export class SearchPharmaciesDto {
  @ApiPropertyOptional({ description: 'Search query to match against pharmacy name or description', example: 'MedPlus' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by city', example: 'Lagos' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state', example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by delivery zone coverage', example: 'Lekki' })
  @IsString()
  @IsOptional()
  delivery_zone?: string;

  @ApiPropertyOptional({ description: 'Filter by online status', example: true })
  @IsBoolean()
  @IsOptional()
  is_online?: boolean;

  @ApiPropertyOptional({ description: 'Filter by verification status', example: true })
  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;

  @ApiPropertyOptional({ description: 'Filter by pharmacies that offer delivery', example: true })
  @IsBoolean()
  @IsOptional()
  offers_delivery?: boolean;

  @ApiPropertyOptional({ description: 'Filter by 24-hour pharmacies', example: false })
  @IsBoolean()
  @IsOptional()
  is_24_hours?: boolean;

  @ApiPropertyOptional({ description: 'Latitude for proximity-based search', example: 6.4541 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for proximity-based search', example: 3.4192 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Search radius in kilometres (used with latitude/longitude)', example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  radius_km?: number;

  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of results per page (max 100)', example: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Field name to sort results by', example: 'average_rating' })
  @IsString()
  @IsOptional()
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Sort direction', example: 'desc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc';
}

/**
 * Pharmacy Response DTO
 */
export class PharmacyResponseDto {
  @ApiProperty({ description: 'Unique identifier of the pharmacy', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  id: string;

  @ApiProperty({ description: 'Official registered name of the pharmacy', example: 'MedPlus Pharmacy' })
  name: string;

  @ApiProperty({ description: 'Trading or brand name', example: 'MedPlus' })
  trading_name: string;

  @ApiProperty({ description: 'Brief description of the pharmacy', example: 'Full-service community pharmacy offering prescription dispensing, OTC medications, and health consultations in Lekki.' })
  description: string;

  @ApiProperty({ description: 'Type or classification of the pharmacy', enum: PharmacyType, example: PharmacyType.COMMUNITY })
  pharmacy_type: PharmacyType;

  @ApiProperty({ description: 'Primary contact email', example: 'info@medpluspharmacy.ng' })
  email: string;

  @ApiProperty({ description: 'Primary contact phone number', example: '+2348012345678' })
  phone: string;

  @ApiProperty({ description: 'Physical address of the pharmacy', type: PharmacyAddressDto })
  address: PharmacyAddressDto;

  @ApiProperty({ description: 'Weekly operating hours schedule', type: [OperatingHoursDto] })
  operating_hours: OperatingHoursDto[];

  @ApiProperty({ description: 'Whether the pharmacy operates 24 hours', example: false })
  is_24_hours: boolean;

  @ApiProperty({ description: 'Whether the pharmacy offers delivery', example: true })
  offers_delivery: boolean;

  @ApiProperty({ description: 'Delivery fee in Naira', example: 1500 })
  delivery_fee: number;

  @ApiProperty({ description: 'Order amount in Naira above which delivery is free', example: 10000 })
  free_delivery_threshold: number;

  @ApiProperty({ description: 'Estimated delivery time', example: '30-60 minutes' })
  estimated_delivery_time: string;

  @ApiProperty({ description: 'Whether the pharmacy allows in-store pickup', example: true })
  offers_pickup: boolean;

  @ApiProperty({ description: 'Current verification status of the pharmacy', enum: PharmacyVerificationStatus, example: PharmacyVerificationStatus.VERIFIED })
  verification_status: PharmacyVerificationStatus;

  @ApiProperty({ description: 'Average customer rating (0-5)', example: 4.6 })
  average_rating: number;

  @ApiProperty({ description: 'Total number of customer ratings received', example: 238 })
  total_ratings: number;

  @ApiProperty({ description: 'Payment methods accepted by the pharmacy', enum: PaymentMethod, isArray: true, example: [PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.CASH_ON_DELIVERY] })
  accepted_payment_methods: PaymentMethod[];

  @ApiProperty({ description: 'Whether the pharmacy accepts health insurance', example: true })
  accepts_insurance: boolean;

  @ApiProperty({ description: 'Whether pharmacist consultations are available', example: true })
  offers_consultation: boolean;

  @ApiProperty({ description: 'Consultation fee in Naira', example: 2500 })
  consultation_fee: number;

  @ApiProperty({ description: 'Whether the pharmacy is active on the platform', example: true })
  is_active: boolean;

  @ApiProperty({ description: 'Whether the pharmacy is currently online', example: true })
  is_online: boolean;

  @ApiProperty({ description: 'Whether the pharmacy has been verified', example: true })
  is_verified: boolean;

  @ApiProperty({ description: 'Whether the pharmacy is currently accepting orders', example: true })
  is_accepting_orders: boolean;

  @ApiProperty({ description: 'Full formatted address string', example: '15 Admiralty Way, Lekki Phase 1, Lagos, Lagos, Nigeria' })
  full_address: string;

  @ApiProperty({ description: 'Date the pharmacy was registered on the platform', example: '2024-03-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ description: 'Date the pharmacy record was last updated', example: '2024-06-20T14:45:00.000Z' })
  updated_at: Date;
}
