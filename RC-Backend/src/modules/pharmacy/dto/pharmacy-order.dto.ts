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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PharmacyOrderStatus,
  PharmacyOrderType,
  DeliveryMethod,
  PrescriptionVerificationStatus,
} from '../entities/pharmacy-order.entity';

// ============ ORDER ITEM DTOs ============

export class OrderItemDto {
  @ApiProperty({ description: 'Drug ID from pharmacy catalog', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsNotEmpty()
  drug: string;

  @ApiProperty({ description: 'Quantity to order (minimum 1)', example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Dosage instructions for the patient', example: '1 tablet twice daily after meals' })
  @IsOptional()
  @IsString()
  dosage_instructions?: string;

  @ApiPropertyOptional({ description: 'Duration of treatment in days', example: 7 })
  @IsOptional()
  @IsNumber()
  duration_days?: number;

  @ApiPropertyOptional({ description: 'Specific inventory batch ID to use', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  @IsOptional()
  @IsMongoId()
  batch_id?: string;
}

export class DeliveryAddressDto {
  @ApiProperty({ description: 'Full name of the recipient', example: 'Adaeze Obi' })
  @IsString()
  @IsNotEmpty()
  recipient_name: string;

  @ApiProperty({ description: 'Recipient phone number', example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ description: 'Recipient email address', example: 'adaeze@example.com' })
  @ValidateIf((o) => o.email && o.email.length > 0)
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Primary address line', example: '15 Admiralty Way, Lekki Phase 1' })
  @IsString()
  @IsNotEmpty()
  address_line1: string;

  @ApiPropertyOptional({ description: 'Secondary address line (apartment, suite, etc.)', example: 'Block C, Flat 5' })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiProperty({ description: 'City', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '101233' })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional({ description: 'Nearby landmark for easier delivery', example: 'Opposite Shoprite Mall' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional({ description: 'Special delivery instructions', example: 'Call before delivery. Gate code: 1234' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  delivery_instructions?: string;

  @ApiPropertyOptional({ description: 'Delivery latitude coordinate', example: 6.4541 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Delivery longitude coordinate', example: 3.4192 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

// ============ CREATE ORDER DTOs ============

export class CreatePharmacyOrderDto {
  @ApiProperty({ description: 'Pharmacy ID to order from', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsNotEmpty()
  pharmacy: string;

  @ApiPropertyOptional({ description: 'Uploaded prescription ID (for prescription orders)', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  @IsOptional()
  @IsMongoId()
  prescription?: string;

  @ApiPropertyOptional({ description: 'Specialist prescription ID (for specialist-issued orders)', example: '64c3d4e5f6a7b8c9d0e1f2a3' })
  @IsOptional()
  @IsMongoId()
  specialist_prescription?: string;

  @ApiProperty({ description: 'Array of items to order', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ description: 'Delivery method', enum: DeliveryMethod, example: 'delivery' })
  @IsEnum(DeliveryMethod)
  @IsOptional()
  delivery_method?: DeliveryMethod;

  @ApiPropertyOptional({ description: 'Delivery address details', type: DeliveryAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  delivery_address?: DeliveryAddressDto;

  @ApiPropertyOptional({ description: 'Notes from the patient', example: 'Please include package insert with instructions.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  patient_notes?: string;

  @ApiPropertyOptional({ description: 'Special handling instructions', example: 'Keep medications refrigerated during delivery.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  special_instructions?: string;

  @ApiPropertyOptional({ description: 'Discount/promo code to apply', example: 'FIRSTORDER10' })
  @IsOptional()
  @IsString()
  discount_code?: string;
}

export class CreateOTCOrderDto {
  @ApiProperty({ description: 'Pharmacy ID to order from', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsNotEmpty()
  pharmacy: string;

  @ApiProperty({ description: 'Array of OTC items to order', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ description: 'Delivery method', enum: DeliveryMethod, example: 'delivery' })
  @IsEnum(DeliveryMethod)
  @IsOptional()
  delivery_method?: DeliveryMethod;

  @ApiPropertyOptional({ description: 'Delivery address details', type: DeliveryAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  delivery_address?: DeliveryAddressDto;

  @ApiPropertyOptional({ description: 'Notes from the patient', example: 'Leave at front desk if not home.' })
  @IsOptional()
  @IsString()
  patient_notes?: string;

  @ApiPropertyOptional({ description: 'Discount/promo code', example: 'OTC20OFF' })
  @IsOptional()
  @IsString()
  discount_code?: string;
}

export class CreatePrescriptionOrderDto {
  @ApiProperty({ description: 'Pharmacy ID to order from', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsNotEmpty()
  pharmacy: string;

  @ApiPropertyOptional({ description: 'Uploaded prescription ID', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  @IsOptional()
  @IsMongoId()
  prescription?: string;

  @ApiPropertyOptional({ description: 'Specialist prescription ID', example: '64c3d4e5f6a7b8c9d0e1f2a3' })
  @IsOptional()
  @IsMongoId()
  specialist_prescription?: string;

  @ApiProperty({ description: 'Array of prescription items to order', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ description: 'Delivery method', enum: DeliveryMethod, example: 'delivery' })
  @IsEnum(DeliveryMethod)
  @IsOptional()
  delivery_method?: DeliveryMethod;

  @ApiPropertyOptional({ description: 'Delivery address details', type: DeliveryAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  delivery_address?: DeliveryAddressDto;

  @ApiPropertyOptional({ description: 'Notes from the patient', example: 'Urgent — patient running low on medication.' })
  @IsOptional()
  @IsString()
  patient_notes?: string;

  @ApiPropertyOptional({ description: 'Special handling instructions', example: 'Controlled substance — requires ID verification on delivery.' })
  @IsOptional()
  @IsString()
  special_instructions?: string;
}

// ============ UPDATE ORDER DTOs ============

export class UpdatePharmacyOrderStatusDto {
  @ApiProperty({ description: 'New order status', enum: PharmacyOrderStatus, example: 'confirmed' })
  @IsEnum(PharmacyOrderStatus)
  @IsNotEmpty()
  status: PharmacyOrderStatus;

  @ApiPropertyOptional({ description: 'Status update note', example: 'Order confirmed and being prepared.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class VerifyPrescriptionDto {
  @ApiProperty({ description: 'Prescription verification result', enum: PrescriptionVerificationStatus, example: 'verified' })
  @IsEnum(PrescriptionVerificationStatus)
  @IsNotEmpty()
  verification_status: PrescriptionVerificationStatus;

  @ApiPropertyOptional({ description: 'Pharmacist verification notes', example: 'Prescription verified. All medications are appropriate for patient.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  verification_notes?: string;

  @ApiPropertyOptional({ description: 'Reason for rejection (if rejected)', example: 'Prescription expired. Patient needs new prescription from specialist.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejection_reason?: string;
}

export class ProcessPaymentDto {
  @ApiProperty({ description: 'Paystack payment reference', example: 'ref_abc123xyz456' })
  @IsString()
  @IsNotEmpty()
  payment_reference: string;

  @ApiProperty({ description: 'Payment method used', example: 'card' })
  @IsString()
  @IsNotEmpty()
  payment_method: string;

  @ApiProperty({ description: 'Payment amount in smallest currency unit', example: 25000 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class AssignDeliveryDto {
  @ApiPropertyOptional({ description: 'Shipment tracking number', example: 'GIG-2024-987654' })
  @IsOptional()
  @IsString()
  tracking_number?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery date (ISO 8601)', example: '2024-12-20T14:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  estimated_delivery_date?: string;

  @ApiPropertyOptional({ description: 'Delivery notes for the rider', example: 'Fragile items — handle with care.' })
  @IsOptional()
  @IsString()
  delivery_notes?: string;
}

export class DispenseItemDto {
  @ApiProperty({ description: 'Drug ID being dispensed', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsNotEmpty()
  drug: string;

  @ApiProperty({ description: 'Inventory batch ID to deduct from', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  @IsMongoId()
  @IsNotEmpty()
  inventory: string;

  @ApiProperty({ description: 'Batch number being dispensed', example: 'BATCH-2024-001' })
  @IsString()
  @IsNotEmpty()
  batch_number: string;

  @ApiProperty({ description: 'Quantity being dispensed', example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class DispenseOrderDto {
  @ApiProperty({ description: 'Items being dispensed with batch details', type: [DispenseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispenseItemDto)
  items: DispenseItemDto[];

  @ApiPropertyOptional({ description: 'Pharmacist dispensing notes', example: 'Patient counseled on proper antibiotic usage.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  dispensing_notes?: string;
}

export class CompletePickupDto {
  @ApiProperty({ description: 'Pickup verification code from the patient', example: 'PKP-2024-7X3M' })
  @IsString()
  @IsNotEmpty()
  pickup_code: string;

  @ApiPropertyOptional({ description: 'Notes about the pickup', example: 'Patient ID verified successfully.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelOrderDto {
  @ApiProperty({ description: 'Reason for cancelling the order', example: 'Patient requested cancellation — found medication at local pharmacy.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  cancellation_reason: string;
}

export class RefundOrderDto {
  @ApiProperty({ description: 'Amount to refund in smallest currency unit', example: 15000 })
  @IsNumber()
  @Min(0)
  refund_amount: number;

  @ApiProperty({ description: 'Reason for the refund', example: 'Item out of stock — partial refund issued.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  refund_reason: string;
}

export class RateOrderDto {
  @ApiProperty({ description: 'Rating from 1 to 5 stars', example: 4 })
  @IsNumber()
  @Min(1)
  rating: number;

  @ApiPropertyOptional({ description: 'Written review', example: 'Fast delivery, well-packaged medications. Would order again.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  review?: string;
}

// ============ SEARCH/FILTER DTOs ============

export class SearchPharmacyOrdersDto {
  @ApiPropertyOptional({ description: 'Filter by patient ID', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsOptional()
  @IsMongoId()
  patient?: string;

  @ApiPropertyOptional({ description: 'Filter by pharmacy ID', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  @IsOptional()
  @IsMongoId()
  pharmacy?: string;

  @ApiPropertyOptional({ description: 'Filter by order status', enum: PharmacyOrderStatus, example: 'confirmed' })
  @IsOptional()
  @IsEnum(PharmacyOrderStatus)
  status?: PharmacyOrderStatus;

  @ApiPropertyOptional({ description: 'Filter by order type', enum: PharmacyOrderType, example: 'prescription' })
  @IsOptional()
  @IsEnum(PharmacyOrderType)
  order_type?: PharmacyOrderType;

  @ApiPropertyOptional({ description: 'Filter by payment status', example: 'paid' })
  @IsOptional()
  @IsString()
  payment_status?: string;

  @ApiPropertyOptional({ description: 'Search by order number', example: 'ORD-2024-001234' })
  @IsOptional()
  @IsString()
  order_number?: string;

  @ApiPropertyOptional({ description: 'Filter orders from this date (ISO 8601)', example: '2024-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter orders until this date (ISO 8601)', example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ description: 'Filter orders that have a prescription attached', example: true })
  @IsOptional()
  @IsBoolean()
  has_prescription?: boolean;

  @ApiPropertyOptional({ description: 'Filter by prescription verification status', enum: PrescriptionVerificationStatus, example: 'verified' })
  @IsOptional()
  @IsEnum(PrescriptionVerificationStatus)
  prescription_verification_status?: PrescriptionVerificationStatus;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Results per page', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Field to sort by', example: 'created_at' })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';
}

export class GetPatientOrdersDto {
  @ApiPropertyOptional({ description: 'Filter by order status', enum: PharmacyOrderStatus, example: 'delivered' })
  @IsOptional()
  @IsEnum(PharmacyOrderStatus)
  status?: PharmacyOrderStatus;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Results per page', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class GetPharmacyOrdersDto {
  @ApiPropertyOptional({ description: 'Filter by order status', enum: PharmacyOrderStatus, example: 'pending' })
  @IsOptional()
  @IsEnum(PharmacyOrderStatus)
  status?: PharmacyOrderStatus;

  @ApiPropertyOptional({ description: 'Only show orders pending prescription verification', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pending_verification?: boolean;

  @ApiPropertyOptional({ description: 'Only show orders ready to dispense', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ready_to_dispense?: boolean;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Results per page', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ============ CART VALIDATION DTOs ============

export class CartItemValidationDto {
  @ApiProperty({ description: 'Drug ID to validate', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsNotEmpty()
  drugId: string;

  @ApiProperty({ description: 'Desired quantity', example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ValidateCartDto {
  @ApiProperty({ description: 'Cart items to validate for stock, restrictions, and interactions', type: [CartItemValidationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemValidationDto)
  items: CartItemValidationDto[];

  @ApiPropertyOptional({ description: 'Patient age for age-restricted drug validation', example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  patientAge?: number;
}

export class GetRemainingAllowanceDto {
  @ApiProperty({ description: 'Drug ID to check purchase allowance for', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  @IsNotEmpty()
  drugId: string;
}

export class GetPurchaseHistoryDto {
  @ApiPropertyOptional({ description: 'Number of days to look back for purchase history', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  days?: number;
}

// ============ WALLET PAYMENT DTOs ============

export class PayWithWalletDto {
  @ApiProperty({ description: 'Amount to pay from wallet in smallest currency unit', example: 25000 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class SplitPaymentDto {
  @ApiProperty({ description: 'Amount to deduct from wallet', example: 10000 })
  @IsNumber()
  @Min(0)
  wallet_amount: number;

  @ApiProperty({ description: 'Paystack payment reference for the card portion', example: 'ref_abc123xyz456' })
  @IsString()
  @IsNotEmpty()
  card_payment_reference: string;

  @ApiProperty({ description: 'Amount charged to card', example: 15000 })
  @IsNumber()
  @Min(0)
  card_amount: number;
}

// ============ PATIENT DELIVERY ADDRESS DTOs ============

export class CreatePatientDeliveryAddressDto {
  @ApiProperty({ description: 'Address label for easy identification', example: 'Home' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Full name of the recipient', example: 'Adaeze Obi' })
  @IsString()
  @IsNotEmpty()
  recipient_name: string;

  @ApiProperty({ description: 'Recipient phone number', example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Street address', example: '15 Admiralty Way, Lekki Phase 1' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'City', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({ description: 'Country', example: 'Nigeria' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '101233' })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiPropertyOptional({ description: 'Additional info or landmark', example: 'Second gate on the left, opposite yellow building' })
  @IsString()
  @IsOptional()
  additional_info?: string;

  @ApiPropertyOptional({ description: 'Set as default delivery address', example: true })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}

export class UpdatePatientDeliveryAddressDto {
  @ApiPropertyOptional({ description: 'Address label', example: 'Office' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ description: 'Recipient name', example: 'Adaeze Obi' })
  @IsString()
  @IsOptional()
  recipient_name?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+2348012345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Street address', example: '25 Broad Street, Marina' })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Lagos' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State', example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'Nigeria' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '101233' })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiPropertyOptional({ description: 'Additional info or landmark', example: 'Near Silverbird Galleria' })
  @IsString()
  @IsOptional()
  additional_info?: string;

  @ApiPropertyOptional({ description: 'Set as default delivery address', example: false })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
