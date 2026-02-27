import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDate,
  ValidateNested,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BatchStatus } from '../entities/stock-batch.entity';

class StorageDto {
  @ApiPropertyOptional({ description: 'Physical storage location within the pharmacy', example: 'Shelf B3, Row 2 - Main Dispensary' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Required storage temperature', example: 'Store below 25°C in a dry place' })
  @IsOptional()
  @IsString()
  temperature_requirement?: string;

  @ApiPropertyOptional({ description: 'Special storage instructions', example: 'Keep away from direct sunlight. Do not refrigerate.' })
  @IsOptional()
  @IsString()
  special_instructions?: string;
}

export class ReceiveStockDto {
  @ApiProperty({ description: 'Drug ObjectId to receive stock for', example: '65a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  drug_id: string;

  @ApiProperty({ description: 'Supplier ObjectId who provided the stock', example: '65a1b2c3d4e5f6a7b8c9d0e2' })
  @IsMongoId()
  supplier_id: string;

  @ApiProperty({ description: 'Pharmacy ObjectId receiving the stock', example: '693f961ebb4dc1fec542610a' })
  @IsMongoId()
  pharmacy_id: string;

  @ApiProperty({ description: 'Manufacturer batch number from packaging', example: 'BN-EMZ-2025-0847' })
  @IsString()
  batch_number: string;

  @ApiProperty({ description: 'Number of units received', example: 500 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Cost price per unit in NGN', example: 450.00 })
  @IsNumber()
  @Min(0)
  cost_price: number;

  @ApiPropertyOptional({ description: 'Batch expiry date', example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiry_date?: Date;

  @ApiPropertyOptional({ description: 'Whether this product does not expire', example: false })
  @IsOptional()
  @IsBoolean()
  no_expiry?: boolean;

  @ApiPropertyOptional({ description: 'Date the batch was manufactured', example: '2025-01-15T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  manufacture_date?: Date;

  @ApiPropertyOptional({ description: 'Date the stock was physically received', example: '2025-06-20T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  received_date?: Date;

  @ApiPropertyOptional({ description: 'Manufacturer name', example: 'Emzor Pharmaceutical Industries Ltd' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Override selling price per unit in NGN for this batch', example: 750.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  selling_price_override?: number;

  @ApiPropertyOptional({ description: 'Purchase order reference number', example: 'PO-RC-2025-0342' })
  @IsOptional()
  @IsString()
  purchase_order_number?: string;

  @ApiPropertyOptional({ description: 'Supplier invoice number', example: 'INV-EMZ-2025-1587' })
  @IsOptional()
  @IsString()
  invoice_number?: string;

  @ApiPropertyOptional({ description: 'Delivery note reference number', example: 'DN-EMZ-2025-0847' })
  @IsOptional()
  @IsString()
  delivery_note_number?: string;

  @ApiPropertyOptional({ description: 'Storage details for this batch', type: StorageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StorageDto)
  storage?: StorageDto;

  @ApiPropertyOptional({ description: 'Additional notes about the received stock', example: 'Inspected on arrival. All units in good condition.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBatchDto {
  @ApiPropertyOptional({ description: 'Updated batch number', example: 'BN-EMZ-2025-0847-REV' })
  @IsOptional()
  @IsString()
  batch_number?: string;

  @ApiPropertyOptional({ description: 'Updated supplier ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0e2' })
  @IsOptional()
  @IsMongoId()
  supplier_id?: string;

  @ApiPropertyOptional({ description: 'Updated pharmacy ObjectId', example: '693f961ebb4dc1fec542610a' })
  @IsOptional()
  @IsMongoId()
  pharmacy_id?: string;

  @ApiPropertyOptional({ description: 'Updated expiry date', example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiry_date?: Date;

  @ApiPropertyOptional({ description: 'Whether this product does not expire', example: false })
  @IsOptional()
  @IsBoolean()
  no_expiry?: boolean;

  @ApiPropertyOptional({ description: 'Updated manufacture date', example: '2025-01-15T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  manufacture_date?: Date;

  @ApiPropertyOptional({ description: 'Updated manufacturer name', example: 'Emzor Pharmaceutical Industries Ltd' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Updated cost price per unit in NGN', example: 460.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cost_price?: number;

  @ApiPropertyOptional({ description: 'Updated selling price override in NGN', example: 780.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  selling_price_override?: number;

  @ApiPropertyOptional({ description: 'Updated purchase order reference', example: 'PO-RC-2025-0342' })
  @IsOptional()
  @IsString()
  purchase_order_number?: string;

  @ApiPropertyOptional({ description: 'Updated supplier invoice number', example: 'INV-EMZ-2025-1587' })
  @IsOptional()
  @IsString()
  invoice_number?: string;

  @ApiPropertyOptional({ description: 'Updated delivery note reference', example: 'DN-EMZ-2025-0847' })
  @IsOptional()
  @IsString()
  delivery_note_number?: string;

  @ApiPropertyOptional({ description: 'Updated storage details', type: StorageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StorageDto)
  storage?: StorageDto;

  @ApiPropertyOptional({ description: 'Updated notes', example: 'Batch details corrected after supplier confirmation.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ChangeBatchStatusDto {
  @ApiProperty({ description: 'New batch status', enum: BatchStatus, example: 'quarantined' })
  @IsEnum(BatchStatus)
  status: BatchStatus;

  @ApiPropertyOptional({ description: 'Reason for status change', example: 'Quality concern reported - pending lab analysis' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdjustBatchStockDto {
  @ApiProperty({ description: 'Type of stock adjustment', enum: ['add', 'subtract'], example: 'subtract' })
  @IsEnum(['add', 'subtract'])
  adjustment_type: 'add' | 'subtract';

  @ApiProperty({ description: 'Number of units to adjust', example: 10 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Reason for the adjustment', example: 'Physical count discrepancy found during stocktake' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Reference number for audit trail', example: 'ADJ-RC-2025-0091' })
  @IsOptional()
  @IsString()
  reference_number?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Verified by supervising pharmacist' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReturnToSupplierDto {
  @ApiProperty({ description: 'Number of units to return', example: 25 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Reason for returning stock to supplier', example: 'Damaged packaging discovered during inspection' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Supplier return authorization number', example: 'RMA-EMZ-2025-0134' })
  @IsOptional()
  @IsString()
  return_authorization_number?: string;

  @ApiPropertyOptional({ description: 'Credit note number from supplier', example: 'CN-EMZ-2025-0089' })
  @IsOptional()
  @IsString()
  credit_note_number?: string;

  @ApiPropertyOptional({ description: 'Expected refund amount in NGN', example: 11250.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refund_amount?: number;

  @ApiPropertyOptional({ description: 'Additional notes about the return', example: 'Supplier confirmed replacement shipment in 5 business days' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WriteOffBatchDto {
  @ApiProperty({ description: 'Type of write-off', enum: ['expired', 'damaged'], example: 'expired' })
  @IsEnum(['expired', 'damaged'])
  writeoff_type: 'expired' | 'damaged';

  @ApiPropertyOptional({ description: 'Number of units to write off. If not provided, writes off entire available quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number; // If not provided, write off entire available quantity

  @ApiProperty({ description: 'Reason for the write-off', example: 'Batch expired on 2025-03-31. Confirmed by pharmacist.' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Units segregated for NAFDAC-approved disposal' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecallBatchDto {
  @ApiProperty({ description: 'Official recall reference number', example: 'NAFDAC-RCL-2025-0023' })
  @IsString()
  recall_number: string;

  @ApiProperty({ description: 'Reason for the recall', example: 'Manufacturer-initiated recall due to contamination risk in production lot' })
  @IsString()
  recall_reason: string;

  @ApiPropertyOptional({ description: 'Number of units to recall. If not provided, recalls entire available quantity', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity?: number; // If not provided, recall entire available quantity

  @ApiPropertyOptional({ description: 'Recall severity class (Class I, II, or III)', example: 'Class II' })
  @IsOptional()
  @IsString()
  recall_class?: string; // Class I, II, III

  @ApiPropertyOptional({ description: 'Additional recall notes', example: 'Affected lot numbers: L2025-001 through L2025-015' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DispenseStockDto {
  @ApiProperty({ description: 'Drug ObjectId to dispense', example: '65a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  drug_id: string;

  @ApiProperty({ description: 'Number of units to dispense', example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Specific batch ObjectId. If not provided, FEFO (First Expiry First Out) is used', example: '65a1b2c3d4e5f6a7b8c9d0f1' })
  @IsOptional()
  @IsMongoId()
  batch_id?: string; // If not provided, use FEFO

  @ApiPropertyOptional({ description: 'Customer/patient ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0f2' })
  @IsOptional()
  @IsMongoId()
  customer_id?: string;

  @ApiPropertyOptional({ description: 'Associated prescription reference', example: 'RX-RC-2025-04521' })
  @IsOptional()
  @IsString()
  prescription_id?: string;

  @ApiPropertyOptional({ description: 'Associated order number', example: 'ORD-RC-2025-8734' })
  @IsOptional()
  @IsString()
  order_number?: string;

  @ApiPropertyOptional({ description: 'Selling price per unit in NGN (overrides default)', example: 750.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  selling_price?: number;

  @ApiPropertyOptional({ description: 'Dispensing notes', example: 'Patient counseled on completing full course' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReserveStockDto {
  @ApiProperty({ description: 'Drug ObjectId to reserve', example: '65a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  drug_id: string;

  @ApiProperty({ description: 'Number of units to reserve', example: 3 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Specific batch ObjectId. If not provided, FEFO is used', example: '65a1b2c3d4e5f6a7b8c9d0f1' })
  @IsOptional()
  @IsMongoId()
  batch_id?: string; // If not provided, use FEFO

  @ApiProperty({ description: 'Order number the stock is reserved for', example: 'ORD-RC-2025-8734' })
  @IsString()
  order_number: string;

  @ApiPropertyOptional({ description: 'Reservation notes', example: 'Reserved for pending online order - delivery to Lekki' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BatchQueryDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by drug ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0e1' })
  @IsOptional()
  @IsMongoId()
  drug_id?: string;

  @ApiPropertyOptional({ description: 'Filter by supplier ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0e2' })
  @IsOptional()
  @IsMongoId()
  supplier_id?: string;

  @ApiPropertyOptional({ description: 'Filter by batch status', enum: BatchStatus, example: 'active' })
  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @ApiPropertyOptional({ description: 'Filter by batch number', example: 'BN-EMZ-2025-0847' })
  @IsOptional()
  @IsString()
  batch_number?: string;

  @ApiPropertyOptional({ description: 'Only return batches with available stock', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasStock?: boolean; // Only batches with available stock

  @ApiPropertyOptional({ description: 'Return batches expiring within N days', example: 90 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  expiringWithinDays?: number; // Batches expiring within N days

  @ApiPropertyOptional({ description: 'Only return expired batches', example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  expired?: boolean; // Only expired batches

  @ApiPropertyOptional({ description: 'Field to sort by', example: 'expiry_date' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], example: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class FEFOPreviewDto {
  @ApiProperty({ description: 'Drug ObjectId to preview FEFO allocation for', example: '65a1b2c3d4e5f6a7b8c9d0e1' })
  @IsMongoId()
  drug_id: string;

  @ApiProperty({ description: 'Quantity to preview allocation for', example: 10 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}
