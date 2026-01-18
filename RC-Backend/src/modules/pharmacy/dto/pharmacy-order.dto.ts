import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
  IsMongoId,
  ValidateNested,
  Min,
  IsDateString,
  IsEmail,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PharmacyOrderStatus,
  PharmacyOrderType,
  DeliveryMethod,
  PrescriptionVerificationStatus,
} from '../entities/pharmacy-order.entity';

// ============ ORDER ITEM DTOs ============

export class OrderItemDto {
  @IsMongoId()
  @IsNotEmpty()
  drug: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  dosage_instructions?: string;

  @IsOptional()
  @IsNumber()
  duration_days?: number;

  @IsOptional()
  @IsMongoId()
  batch_id?: string;
}

export class DeliveryAddressDto {
  @IsString()
  @IsNotEmpty()
  recipient_name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @ValidateIf((o) => o.email && o.email.length > 0)
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  address_line1: string;

  @IsOptional()
  @IsString()
  address_line2?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  delivery_instructions?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

// ============ CREATE ORDER DTOs ============

export class CreatePharmacyOrderDto {
  @IsMongoId()
  @IsNotEmpty()
  pharmacy: string;

  @IsOptional()
  @IsMongoId()
  prescription?: string;

  @IsOptional()
  @IsMongoId()
  specialist_prescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(DeliveryMethod)
  @IsOptional()
  delivery_method?: DeliveryMethod;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  delivery_address?: DeliveryAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  patient_notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  special_instructions?: string;

  @IsOptional()
  @IsString()
  discount_code?: string;
}

export class CreateOTCOrderDto {
  @IsMongoId()
  @IsNotEmpty()
  pharmacy: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(DeliveryMethod)
  @IsOptional()
  delivery_method?: DeliveryMethod;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  delivery_address?: DeliveryAddressDto;

  @IsOptional()
  @IsString()
  patient_notes?: string;

  @IsOptional()
  @IsString()
  discount_code?: string;
}

export class CreatePrescriptionOrderDto {
  @IsMongoId()
  @IsNotEmpty()
  pharmacy: string;

  @IsOptional()
  @IsMongoId()
  prescription?: string;

  @IsOptional()
  @IsMongoId()
  specialist_prescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(DeliveryMethod)
  @IsOptional()
  delivery_method?: DeliveryMethod;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  delivery_address?: DeliveryAddressDto;

  @IsOptional()
  @IsString()
  patient_notes?: string;

  @IsOptional()
  @IsString()
  special_instructions?: string;
}

// ============ UPDATE ORDER DTOs ============

export class UpdatePharmacyOrderStatusDto {
  @IsEnum(PharmacyOrderStatus)
  @IsNotEmpty()
  status: PharmacyOrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class VerifyPrescriptionDto {
  @IsEnum(PrescriptionVerificationStatus)
  @IsNotEmpty()
  verification_status: PrescriptionVerificationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  verification_notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejection_reason?: string;
}

export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty()
  payment_reference: string;

  @IsString()
  @IsNotEmpty()
  payment_method: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class AssignDeliveryDto {
  @IsOptional()
  @IsString()
  tracking_number?: string;

  @IsOptional()
  @IsDateString()
  estimated_delivery_date?: string;

  @IsOptional()
  @IsString()
  delivery_notes?: string;
}

export class DispenseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispenseItemDto)
  items: DispenseItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  dispensing_notes?: string;
}

export class DispenseItemDto {
  @IsMongoId()
  @IsNotEmpty()
  drug: string;

  @IsMongoId()
  @IsNotEmpty()
  inventory: string;

  @IsString()
  @IsNotEmpty()
  batch_number: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CompletePickupDto {
  @IsString()
  @IsNotEmpty()
  pickup_code: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  cancellation_reason: string;
}

export class RefundOrderDto {
  @IsNumber()
  @Min(0)
  refund_amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  refund_reason: string;
}

export class RateOrderDto {
  @IsNumber()
  @Min(1)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  review?: string;
}

// ============ SEARCH/FILTER DTOs ============

export class SearchPharmacyOrdersDto {
  @IsOptional()
  @IsMongoId()
  patient?: string;

  @IsOptional()
  @IsMongoId()
  pharmacy?: string;

  @IsOptional()
  @IsEnum(PharmacyOrderStatus)
  status?: PharmacyOrderStatus;

  @IsOptional()
  @IsEnum(PharmacyOrderType)
  order_type?: PharmacyOrderType;

  @IsOptional()
  @IsString()
  payment_status?: string;

  @IsOptional()
  @IsString()
  order_number?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @IsBoolean()
  has_prescription?: boolean;

  @IsOptional()
  @IsEnum(PrescriptionVerificationStatus)
  prescription_verification_status?: PrescriptionVerificationStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';
}

export class GetPatientOrdersDto {
  @IsOptional()
  @IsEnum(PharmacyOrderStatus)
  status?: PharmacyOrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class GetPharmacyOrdersDto {
  @IsOptional()
  @IsEnum(PharmacyOrderStatus)
  status?: PharmacyOrderStatus;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pending_verification?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ready_to_dispense?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ============ CART VALIDATION DTOs ============

export class CartItemValidationDto {
  @IsMongoId()
  @IsNotEmpty()
  drugId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ValidateCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemValidationDto)
  items: CartItemValidationDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  patientAge?: number;
}

export class GetRemainingAllowanceDto {
  @IsMongoId()
  @IsNotEmpty()
  drugId: string;
}

export class GetPurchaseHistoryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  days?: number;
}

// ============ WALLET PAYMENT DTOs ============

export class PayWithWalletDto {
  @IsNumber()
  @Min(0)
  amount: number;
}

export class SplitPaymentDto {
  @IsNumber()
  @Min(0)
  wallet_amount: number;

  @IsString()
  @IsNotEmpty()
  card_payment_reference: string;

  @IsNumber()
  @Min(0)
  card_amount: number;
}

// ============ PATIENT DELIVERY ADDRESS DTOs ============

export class CreatePatientDeliveryAddressDto {
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

export class UpdatePatientDeliveryAddressDto {
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
