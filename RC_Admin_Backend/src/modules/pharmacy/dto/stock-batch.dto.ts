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
import { BatchStatus } from '../entities/stock-batch.entity';

class StorageDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  temperature_requirement?: string;

  @IsOptional()
  @IsString()
  special_instructions?: string;
}

export class ReceiveStockDto {
  @IsMongoId()
  drug_id: string;

  @IsMongoId()
  supplier_id: string;

  @IsMongoId()
  pharmacy_id: string;

  @IsString()
  batch_number: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  cost_price: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiry_date?: Date;

  @IsOptional()
  @IsBoolean()
  no_expiry?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  manufacture_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  received_date?: Date;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  selling_price_override?: number;

  @IsOptional()
  @IsString()
  purchase_order_number?: string;

  @IsOptional()
  @IsString()
  invoice_number?: string;

  @IsOptional()
  @IsString()
  delivery_note_number?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StorageDto)
  storage?: StorageDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBatchDto {
  @IsOptional()
  @IsString()
  batch_number?: string;

  @IsOptional()
  @IsMongoId()
  supplier_id?: string;

  @IsOptional()
  @IsMongoId()
  pharmacy_id?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiry_date?: Date;

  @IsOptional()
  @IsBoolean()
  no_expiry?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  manufacture_date?: Date;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cost_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  selling_price_override?: number;

  @IsOptional()
  @IsString()
  purchase_order_number?: string;

  @IsOptional()
  @IsString()
  invoice_number?: string;

  @IsOptional()
  @IsString()
  delivery_note_number?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StorageDto)
  storage?: StorageDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ChangeBatchStatusDto {
  @IsEnum(BatchStatus)
  status: BatchStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdjustBatchStockDto {
  @IsEnum(['add', 'subtract'])
  adjustment_type: 'add' | 'subtract';

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  reference_number?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReturnToSupplierDto {
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  return_authorization_number?: string;

  @IsOptional()
  @IsString()
  credit_note_number?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refund_amount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class WriteOffBatchDto {
  @IsEnum(['expired', 'damaged'])
  writeoff_type: 'expired' | 'damaged';

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number; // If not provided, write off entire available quantity

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecallBatchDto {
  @IsString()
  recall_number: string;

  @IsString()
  recall_reason: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity?: number; // If not provided, recall entire available quantity

  @IsOptional()
  @IsString()
  recall_class?: string; // Class I, II, III

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DispenseStockDto {
  @IsMongoId()
  drug_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsMongoId()
  batch_id?: string; // If not provided, use FEFO

  @IsOptional()
  @IsMongoId()
  customer_id?: string;

  @IsOptional()
  @IsString()
  prescription_id?: string;

  @IsOptional()
  @IsString()
  order_number?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  selling_price?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReserveStockDto {
  @IsMongoId()
  drug_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsMongoId()
  batch_id?: string; // If not provided, use FEFO

  @IsString()
  order_number: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BatchQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsMongoId()
  drug_id?: string;

  @IsOptional()
  @IsMongoId()
  supplier_id?: string;

  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @IsOptional()
  @IsString()
  batch_number?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasStock?: boolean; // Only batches with available stock

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  expiringWithinDays?: number; // Batches expiring within N days

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  expired?: boolean; // Only expired batches

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class FEFOPreviewDto {
  @IsMongoId()
  drug_id: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}
