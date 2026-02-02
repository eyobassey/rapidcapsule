import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PrescriptionPaymentMethod,
  SpecialistPrescriptionStatus,
} from '../entities/specialist-prescription.entity';

// ============ PRESCRIPTION ITEM DTOs ============

export class PrescriptionItemDto {
  @IsMongoId()
  @IsNotEmpty()
  drug_id: string;

  @IsMongoId()
  @IsOptional()
  batch_id?: string; // Optional - specific batch to reserve from

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  dosage: string; // e.g., "1 tablet", "5ml"

  @IsString()
  @IsNotEmpty()
  frequency: string; // e.g., "twice daily", "every 8 hours"

  @IsString()
  @IsNotEmpty()
  duration: string; // e.g., "7 days", "2 weeks"

  @IsString()
  @IsOptional()
  instructions?: string; // Additional instructions
}

// ============ DELIVERY ADDRESS DTOs ============

export class DeliveryAddressDto {
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
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  recipient_name?: string;

  @IsString()
  @IsOptional()
  additional_info?: string;
}

// ============ LINKED RECORDS DTOs ============

export class LinkedClinicalNoteDto {
  @IsMongoId()
  @IsNotEmpty()
  appointment_id: string;

  @IsString()
  @IsNotEmpty()
  note_id: string;
}

export class LinkRecordsDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  appointments?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedClinicalNoteDto)
  @IsOptional()
  clinical_notes?: LinkedClinicalNoteDto[];
}

// ============ CREATE PRESCRIPTION DTO ============

export class CreateSpecialistPrescriptionDto {
  @IsMongoId()
  @IsNotEmpty()
  patient_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  @IsOptional()
  delivery_address?: DeliveryAddressDto;

  @IsEnum(PrescriptionPaymentMethod)
  @IsOptional()
  payment_method?: PrescriptionPaymentMethod;

  @IsString()
  @IsOptional()
  clinical_notes?: string;

  @IsString()
  @IsOptional()
  patient_notes?: string;

  @IsMongoId()
  @IsOptional()
  appointment_id?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_appointments?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedClinicalNoteDto)
  @IsOptional()
  linked_clinical_notes?: LinkedClinicalNoteDto[];

  @IsBoolean()
  @IsOptional()
  submit_immediately?: boolean; // If true, submit for payment immediately

  // ============ PICKUP CENTER OPTIONS ============

  @IsBoolean()
  @IsOptional()
  is_pickup_order?: boolean; // If true, patient will pick up instead of delivery

  @IsMongoId()
  @IsOptional()
  pickup_pharmacy_id?: string; // The pickup center pharmacy ID
}

// ============ UPDATE PRESCRIPTION DTO ============

export class UpdateSpecialistPrescriptionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  @IsOptional()
  items?: PrescriptionItemDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  @IsOptional()
  delivery_address?: DeliveryAddressDto;

  @IsString()
  @IsOptional()
  clinical_notes?: string;

  @IsString()
  @IsOptional()
  patient_notes?: string;

  // ============ PICKUP CENTER OPTIONS ============

  @IsBoolean()
  @IsOptional()
  is_pickup_order?: boolean;

  @IsMongoId()
  @IsOptional()
  pickup_pharmacy_id?: string;
}

// ============ PICKUP DTOs ============

export class SetPickupDto {
  @IsMongoId()
  @IsNotEmpty()
  pickup_pharmacy_id: string; // The pharmacy to pick up from
}

export class ConfirmPickupDto {
  @IsString()
  @IsNotEmpty()
  pickup_code: string; // The code shown by patient

  @IsString()
  @IsOptional()
  notes?: string;
}

export class MarkReadyForPickupDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

// ============ PAYMENT DTOs ============

export class PayFromWalletDto {
  @IsBoolean()
  @IsOptional()
  confirm?: boolean; // Confirmation flag
}

export class PayFromPatientWalletDto {
  @IsBoolean()
  @IsOptional()
  allow_partial?: boolean; // Allow partial wallet payment if balance is insufficient

  @IsString()
  @IsOptional()
  @IsEnum(['online', 'cash'])
  remaining_payment_method?: 'online' | 'cash'; // How to collect remaining amount
}

export class SendPaymentLinkDto {
  @IsString()
  @IsOptional()
  custom_message?: string; // Optional message to include in email
}

export class ProcessPatientPaymentDto {
  @IsString()
  @IsNotEmpty()
  reference: string; // Paystack payment reference
}

// ============ FULFILLMENT DTOs ============

export class DispenseDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ShipDto {
  @IsString()
  @IsNotEmpty()
  shipping_method: string;

  @IsString()
  @IsOptional()
  tracking_number?: string;

  @IsString()
  @IsOptional()
  courier_name?: string;

  @IsDateString()
  @IsOptional()
  estimated_delivery?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class DeliverDto {
  @IsString()
  @IsOptional()
  confirmation?: string; // Delivery confirmation code/signature

  @IsString()
  @IsOptional()
  notes?: string;
}

// ============ CANCEL DTO ============

export class CancelPrescriptionDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// ============ QUERY DTOs ============

export class SpecialistPrescriptionQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(SpecialistPrescriptionStatus)
  @IsOptional()
  status?: SpecialistPrescriptionStatus;

  @IsMongoId()
  @IsOptional()
  patient_id?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

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

// ============ RESPONSE DTOs ============

export class PrescriptionItemResponseDto {
  drug_id: string;
  drug_name: string;
  generic_name?: string;
  drug_strength: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  unit_price: number;
  total_price: number;
  stock_reserved: boolean;
  stock_reservation_expires?: Date;
}

export class SpecialistPrescriptionResponseDto {
  _id: string;
  prescription_number: string;
  specialist_id: string;
  patient_id: string;
  items: PrescriptionItemResponseDto[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total_amount: number;
  currency: string;
  payment_method?: string;
  payment_status: string;
  status: string;
  delivery_address?: DeliveryAddressDto;
  expires_at?: Date;
  time_until_expiry?: number;
  created_at: Date;
  updated_at: Date;
}

export class CreatePrescriptionResponseDto {
  prescription: SpecialistPrescriptionResponseDto;
  stock_reserved: boolean;
  reservation_expires_at?: Date;
  payment_required: boolean;
  payment_amount: number;
}

export class PaymentResponseDto {
  success: boolean;
  prescription_id: string;
  payment_reference?: string;
  payment_url?: string; // For patient online payment
  message: string;
}
