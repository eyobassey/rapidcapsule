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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============ PRESCRIPTION ITEM DTOs ============

export class PrescriptionItemDto {
  @ApiPropertyOptional({ description: 'Drug ID from pharmacy inventory', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsOptional()
  drug_id?: string;

  @ApiPropertyOptional({ description: 'Specific inventory batch ID to reserve', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  @IsMongoId()
  @IsOptional()
  batch_id?: string;

  @ApiPropertyOptional({ description: 'Drug name (required for external medications)', example: 'Amoxicillin' })
  @IsString()
  @IsOptional()
  drug_name?: string;

  @ApiPropertyOptional({ description: 'Generic/active ingredient name', example: 'Amoxicillin Trihydrate' })
  @IsString()
  @IsOptional()
  generic_name?: string;

  @ApiPropertyOptional({ description: 'Drug strength', example: '500mg' })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiProperty({ description: 'Quantity to dispense (minimum 1)', example: 21 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Dosage per administration', example: '1 capsule' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ description: 'How often to take', example: 'Three times daily' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ description: 'Treatment duration', example: '7 days' })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiPropertyOptional({ description: 'Special instructions', example: 'Take after meals with plenty of water' })
  @IsString()
  @IsOptional()
  instructions?: string;

  // ============ SOURCE TRACKING (for RxGPT integration) ============

  @ApiPropertyOptional({ description: 'Medication source', example: 'inventory', enum: ['inventory', 'external', 'ai_suggested'] })
  @IsString()
  @IsOptional()
  source?: 'inventory' | 'external' | 'ai_suggested';

  @ApiPropertyOptional({ description: 'Whether the drug is in pharmacy inventory', example: true })
  @IsBoolean()
  @IsOptional()
  is_in_inventory?: boolean;

  @ApiPropertyOptional({ description: 'Whether RxGPT AI suggested this medication', example: false })
  @IsBoolean()
  @IsOptional()
  rxgpt_suggested?: boolean;

  @ApiPropertyOptional({ description: 'AI reasoning for this medication suggestion', example: 'First-line antibiotic for suspected bacterial pharyngitis' })
  @IsString()
  @IsOptional()
  rxgpt_reasoning?: string;
}

// ============ DELIVERY ADDRESS DTOs ============

export class DeliveryAddressDto {
  @ApiProperty({ description: 'Street address for delivery', example: '15 Admiralty Way, Lekki Phase 1' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'City name', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State or region', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({ description: 'Country name', example: 'Nigeria' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal or ZIP code', example: '101233' })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiProperty({ description: 'Contact phone number for delivery', example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ description: 'Name of the person receiving the delivery', example: 'Adaeze Obi' })
  @IsString()
  @IsOptional()
  recipient_name?: string;

  @ApiPropertyOptional({ description: 'Additional delivery instructions or landmarks', example: 'Second gate on the left, opposite the yellow building' })
  @IsString()
  @IsOptional()
  additional_info?: string;
}

// ============ LINKED RECORDS DTOs ============

export class LinkedClinicalNoteDto {
  @ApiProperty({ description: 'Appointment ID the clinical note belongs to', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsNotEmpty()
  appointment_id: string;

  @ApiProperty({ description: 'Clinical note identifier', example: 'note_20240115_001' })
  @IsString()
  @IsNotEmpty()
  note_id: string;
}

export class LinkRecordsDto {
  @ApiPropertyOptional({ description: 'Array of appointment IDs to link', example: ['64a1b2c3d4e5f6a7b8c9d0e1'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  appointments?: string[];

  @ApiPropertyOptional({ description: 'Array of health checkup IDs to link', example: ['64b2c3d4e5f6a7b8c9d0e1f2'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  health_checkups?: string[];

  @ApiPropertyOptional({ description: 'Array of linked clinical notes', type: [LinkedClinicalNoteDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedClinicalNoteDto)
  @IsOptional()
  clinical_notes?: LinkedClinicalNoteDto[];
}

// ============ CREATE PRESCRIPTION DTO ============

export class CreateSpecialistPrescriptionDto {
  @ApiProperty({ description: 'Patient ID to prescribe for', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsNotEmpty()
  patient_id: string;

  @ApiProperty({ description: 'Array of prescription items/medications', type: [PrescriptionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];

  @ApiPropertyOptional({ description: 'Delivery address for the prescription', type: DeliveryAddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  @IsOptional()
  delivery_address?: DeliveryAddressDto;

  @ApiPropertyOptional({ description: 'Payment method for the prescription', enum: PrescriptionPaymentMethod, example: 'wallet' })
  @IsEnum(PrescriptionPaymentMethod)
  @IsOptional()
  payment_method?: PrescriptionPaymentMethod;

  @ApiPropertyOptional({ description: 'Clinical notes from the specialist', example: 'Patient presents with bacterial pharyngitis. Prescribed 7-day course of antibiotics.' })
  @IsString()
  @IsOptional()
  clinical_notes?: string;

  @ApiPropertyOptional({ description: 'Notes visible to the patient', example: 'Complete the full course of antibiotics even if symptoms improve.' })
  @IsString()
  @IsOptional()
  patient_notes?: string;

  @ApiPropertyOptional({ description: 'Appointment ID this prescription originates from', example: '64c3d4e5f6a7b8c9d0e1f2a3' })
  @IsMongoId()
  @IsOptional()
  appointment_id?: string;

  @ApiPropertyOptional({ description: 'Additional appointment IDs to link', example: ['64a1b2c3d4e5f6a7b8c9d0e1'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_appointments?: string[];

  @ApiPropertyOptional({ description: 'Health checkup IDs to link to this prescription', example: ['64b2c3d4e5f6a7b8c9d0e1f2'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_health_checkups?: string[];

  @ApiPropertyOptional({ description: 'Clinical notes to link', type: [LinkedClinicalNoteDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedClinicalNoteDto)
  @IsOptional()
  linked_clinical_notes?: LinkedClinicalNoteDto[];

  @ApiPropertyOptional({ description: 'If true, submit for payment immediately after creation', example: false })
  @IsBoolean()
  @IsOptional()
  submit_immediately?: boolean;

  // ============ PICKUP CENTER OPTIONS ============

  @ApiPropertyOptional({ description: 'If true, patient will pick up instead of delivery', example: false })
  @IsBoolean()
  @IsOptional()
  is_pickup_order?: boolean;

  @ApiPropertyOptional({ description: 'The pickup center pharmacy ID', example: '64d4e5f6a7b8c9d0e1f2a3b4' })
  @IsMongoId()
  @IsOptional()
  pickup_pharmacy_id?: string;
}

// ============ UPDATE PRESCRIPTION DTO ============

export class UpdateSpecialistPrescriptionDto {
  @ApiPropertyOptional({ description: 'Updated array of prescription items', type: [PrescriptionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  @IsOptional()
  items?: PrescriptionItemDto[];

  @ApiPropertyOptional({ description: 'Updated delivery address', type: DeliveryAddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  @IsOptional()
  delivery_address?: DeliveryAddressDto;

  @ApiPropertyOptional({ description: 'Updated clinical notes', example: 'Adjusted dosage based on follow-up labs.' })
  @IsString()
  @IsOptional()
  clinical_notes?: string;

  @ApiPropertyOptional({ description: 'Updated notes for the patient', example: 'Reduce dosage to once daily from tomorrow.' })
  @IsString()
  @IsOptional()
  patient_notes?: string;

  // ============ PICKUP CENTER OPTIONS ============

  @ApiPropertyOptional({ description: 'Switch to pickup order', example: true })
  @IsBoolean()
  @IsOptional()
  is_pickup_order?: boolean;

  @ApiPropertyOptional({ description: 'Pickup center pharmacy ID', example: '64d4e5f6a7b8c9d0e1f2a3b4' })
  @IsMongoId()
  @IsOptional()
  pickup_pharmacy_id?: string;
}

// ============ PICKUP DTOs ============

export class SetPickupDto {
  @ApiProperty({ description: 'The pharmacy ID where the patient will pick up', example: '64d4e5f6a7b8c9d0e1f2a3b4' })
  @IsMongoId()
  @IsNotEmpty()
  pickup_pharmacy_id: string;
}

export class ConfirmPickupDto {
  @ApiProperty({ description: 'Pickup verification code shown by the patient', example: 'PKP-2024-7X3M' })
  @IsString()
  @IsNotEmpty()
  pickup_code: string;

  @ApiPropertyOptional({ description: 'Additional notes about the pickup', example: 'Patient ID verified, all items dispensed.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class MarkReadyForPickupDto {
  @ApiPropertyOptional({ description: 'Notes about pickup readiness', example: 'All items packed and labeled. Available at counter 3.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// ============ PAYMENT DTOs ============

export class PayFromWalletDto {
  @ApiPropertyOptional({ description: 'Confirmation flag to proceed with wallet payment', example: true })
  @IsBoolean()
  @IsOptional()
  confirm?: boolean;
}

export class PayFromPatientWalletDto {
  @ApiPropertyOptional({ description: 'Allow partial wallet payment if balance is insufficient', example: true })
  @IsBoolean()
  @IsOptional()
  allow_partial?: boolean;

  @ApiPropertyOptional({ description: 'How to collect the remaining amount after partial wallet payment', enum: ['online', 'cash'], example: 'online' })
  @IsString()
  @IsOptional()
  @IsEnum(['online', 'cash'])
  remaining_payment_method?: 'online' | 'cash';
}

export class SendPaymentLinkDto {
  @ApiPropertyOptional({ description: 'Custom message to include in the payment link email', example: 'Please complete payment for your prescription before pickup.' })
  @IsString()
  @IsOptional()
  custom_message?: string;
}

export class ProcessPatientPaymentDto {
  @ApiProperty({ description: 'Paystack payment reference to verify', example: 'ref_abc123xyz456' })
  @IsString()
  @IsNotEmpty()
  reference: string;
}

// ============ FULFILLMENT DTOs ============

export class DispenseDto {
  @ApiPropertyOptional({ description: 'Dispensing notes from the pharmacist', example: 'All items dispensed as prescribed. Patient counseled on usage.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ShipDto {
  @ApiProperty({ description: 'Shipping method used', example: 'Express Delivery' })
  @IsString()
  @IsNotEmpty()
  shipping_method: string;

  @ApiPropertyOptional({ description: 'Shipment tracking number', example: 'GIG-2024-987654' })
  @IsString()
  @IsOptional()
  tracking_number?: string;

  @ApiPropertyOptional({ description: 'Name of the courier or delivery service', example: 'GIG Logistics' })
  @IsString()
  @IsOptional()
  courier_name?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery date (ISO 8601)', example: '2024-12-20T14:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  estimated_delivery?: string;

  @ApiPropertyOptional({ description: 'Shipping notes', example: 'Fragile items — handle with care. Keep refrigerated.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class DeliverDto {
  @ApiPropertyOptional({ description: 'Delivery confirmation code or signature reference', example: 'DEL-CONF-8K2M' })
  @IsString()
  @IsOptional()
  confirmation?: string;

  @ApiPropertyOptional({ description: 'Delivery notes', example: 'Delivered to recipient at front desk.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// ============ CANCEL DTO ============

export class CancelPrescriptionDto {
  @ApiProperty({ description: 'Reason for cancelling the prescription', example: 'Patient requested alternative medication due to allergy.' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// ============ QUERY DTOs ============

export class SpecialistPrescriptionQueryDto {
  @ApiPropertyOptional({ description: 'Search by prescription number, patient name, or drug name', example: 'RX-2024' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by prescription status', enum: SpecialistPrescriptionStatus, example: 'pending_payment' })
  @IsEnum(SpecialistPrescriptionStatus)
  @IsOptional()
  status?: SpecialistPrescriptionStatus;

  @ApiPropertyOptional({ description: 'Filter by patient ID', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsOptional()
  patient_id?: string;

  @ApiPropertyOptional({ description: 'Filter prescriptions from this date (ISO 8601)', example: '2024-01-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Filter prescriptions until this date (ISO 8601)', example: '2024-12-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of results per page', example: 20 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Field to sort by', example: 'created_at' })
  @IsString()
  @IsOptional()
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], example: 'desc' })
  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc';
}

// ============ RESPONSE DTOs ============

export class PrescriptionItemResponseDto {
  @ApiProperty({ description: 'Drug ID', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  drug_id: string;

  @ApiProperty({ description: 'Drug name', example: 'Amoxicillin' })
  drug_name: string;

  @ApiPropertyOptional({ description: 'Generic/active ingredient name', example: 'Amoxicillin Trihydrate' })
  generic_name?: string;

  @ApiProperty({ description: 'Drug strength', example: '500mg' })
  drug_strength: string;

  @ApiProperty({ description: 'Quantity dispensed', example: 21 })
  quantity: number;

  @ApiProperty({ description: 'Dosage per administration', example: '1 capsule' })
  dosage: string;

  @ApiProperty({ description: 'Frequency of administration', example: 'Three times daily' })
  frequency: string;

  @ApiProperty({ description: 'Treatment duration', example: '7 days' })
  duration: string;

  @ApiPropertyOptional({ description: 'Special instructions', example: 'Take after meals' })
  instructions?: string;

  @ApiProperty({ description: 'Price per unit in smallest currency unit', example: 150 })
  unit_price: number;

  @ApiProperty({ description: 'Total price for this item', example: 3150 })
  total_price: number;

  @ApiProperty({ description: 'Whether stock has been reserved for this item', example: true })
  stock_reserved: boolean;

  @ApiPropertyOptional({ description: 'When the stock reservation expires' })
  stock_reservation_expires?: Date;
}

export class SpecialistPrescriptionResponseDto {
  @ApiProperty({ description: 'Prescription ID', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  _id: string;

  @ApiProperty({ description: 'Unique prescription number', example: 'RX-20241217-0001' })
  prescription_number: string;

  @ApiProperty({ description: 'Prescribing specialist ID', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  specialist_id: string;

  @ApiProperty({ description: 'Patient ID', example: '64c3d4e5f6a7b8c9d0e1f2a3' })
  patient_id: string;

  @ApiProperty({ description: 'Prescribed items', type: [PrescriptionItemResponseDto] })
  items: PrescriptionItemResponseDto[];

  @ApiProperty({ description: 'Subtotal before discount and fees', example: 6300 })
  subtotal: number;

  @ApiProperty({ description: 'Discount amount applied', example: 0 })
  discount: number;

  @ApiProperty({ description: 'Delivery fee', example: 1500 })
  delivery_fee: number;

  @ApiProperty({ description: 'Total amount payable', example: 7800 })
  total_amount: number;

  @ApiProperty({ description: 'Currency code', example: 'NGN' })
  currency: string;

  @ApiPropertyOptional({ description: 'Payment method used', example: 'wallet' })
  payment_method?: string;

  @ApiProperty({ description: 'Payment status', example: 'pending' })
  payment_status: string;

  @ApiProperty({ description: 'Prescription status', example: 'pending_payment' })
  status: string;

  @ApiPropertyOptional({ description: 'Delivery address', type: DeliveryAddressDto })
  delivery_address?: DeliveryAddressDto;

  @ApiPropertyOptional({ description: 'Prescription expiration date' })
  expires_at?: Date;

  @ApiPropertyOptional({ description: 'Time until expiry in milliseconds', example: 86400000 })
  time_until_expiry?: number;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;
}

export class CreatePrescriptionResponseDto {
  @ApiProperty({ description: 'The created prescription', type: SpecialistPrescriptionResponseDto })
  prescription: SpecialistPrescriptionResponseDto;

  @ApiProperty({ description: 'Whether stock was reserved for items', example: true })
  stock_reserved: boolean;

  @ApiPropertyOptional({ description: 'When the stock reservation expires' })
  reservation_expires_at?: Date;

  @ApiProperty({ description: 'Whether payment is required before fulfillment', example: true })
  payment_required: boolean;

  @ApiProperty({ description: 'Total payment amount due', example: 7800 })
  payment_amount: number;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'Whether the payment operation succeeded', example: true })
  success: boolean;

  @ApiProperty({ description: 'Prescription ID', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  prescription_id: string;

  @ApiPropertyOptional({ description: 'Payment reference number', example: 'ref_abc123xyz456' })
  payment_reference?: string;

  @ApiPropertyOptional({ description: 'Payment URL for patient online payment', example: 'https://checkout.paystack.com/abc123' })
  payment_url?: string;

  @ApiProperty({ description: 'Payment result message', example: 'Payment processed successfully' })
  message: string;
}
