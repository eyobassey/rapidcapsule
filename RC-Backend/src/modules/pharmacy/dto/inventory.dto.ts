import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  IsMongoId,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import {
  StockStatus,
  StorageCondition,
  DispensingMethod,
  AdjustmentReason,
} from '../enums';

/**
 * Create Inventory DTO
 */
export class CreateInventoryDto {
  // ============ REQUIRED FIELDS ============

  @IsMongoId()
  @IsNotEmpty()
  pharmacy: string;

  @IsMongoId()
  @IsNotEmpty()
  drug: string;

  @IsString()
  @IsNotEmpty()
  batch_number: string;

  @IsDateString()
  @IsNotEmpty()
  expiry_date: string;

  @IsNumber()
  @Min(0)
  quantity_on_hand: number;

  @IsNumber()
  @Min(0)
  cost_price: number;

  @IsNumber()
  @Min(0)
  selling_price: number;

  // ============ OPTIONAL FIELDS ============

  @IsDateString()
  @IsOptional()
  manufacture_date?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reorder_level?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reorder_quantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  max_stock_level?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discount_percentage?: number;

  @IsString()
  @IsOptional()
  storage_location?: string;

  @IsEnum(StorageCondition)
  @IsOptional()
  storage_condition?: StorageCondition;

  @IsEnum(DispensingMethod)
  @IsOptional()
  dispensing_method?: DispensingMethod;

  @IsString()
  @IsOptional()
  supplier_name?: string;

  @IsString()
  @IsOptional()
  supplier_invoice?: string;

  @IsDateString()
  @IsOptional()
  received_date?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_available_for_sale?: boolean;
}

/**
 * Update Inventory DTO
 */
export class UpdateInventoryDto extends PartialType(CreateInventoryDto) {}

/**
 * Adjust Inventory DTO
 * Used for stock adjustments (receiving, damaged, sold, etc.)
 */
export class AdjustInventoryDto {
  @IsEnum(AdjustmentReason)
  @IsNotEmpty()
  reason: AdjustmentReason;

  @IsNumber()
  @IsNotEmpty()
  quantity_change: number; // Positive for additions, negative for reductions

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  reference_type?: string;

  @IsMongoId()
  @IsOptional()
  reference_id?: string;

  @IsString()
  @IsOptional()
  reference_number?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  unit_cost?: number;
}

/**
 * Receive Stock DTO
 * Simplified DTO for receiving new stock
 */
export class ReceiveStockDto {
  @IsMongoId()
  @IsNotEmpty()
  pharmacy: string;

  @IsMongoId()
  @IsNotEmpty()
  drug: string;

  @IsString()
  @IsNotEmpty()
  batch_number: string;

  @IsDateString()
  @IsNotEmpty()
  expiry_date: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  cost_price: number;

  @IsNumber()
  @Min(0)
  selling_price: number;

  @IsString()
  @IsOptional()
  supplier_name?: string;

  @IsString()
  @IsOptional()
  supplier_invoice?: string;

  @IsDateString()
  @IsOptional()
  manufacture_date?: string;

  @IsString()
  @IsOptional()
  storage_location?: string;

  @IsEnum(StorageCondition)
  @IsOptional()
  storage_condition?: StorageCondition;
}

/**
 * Reserve Stock DTO
 * Used when creating orders to reserve stock
 */
export class ReserveStockDto {
  @IsMongoId()
  @IsNotEmpty()
  inventory_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsMongoId()
  @IsOptional()
  order_id?: string;
}

/**
 * Release Stock DTO
 * Used to release reserved stock (order cancelled, etc.)
 */
export class ReleaseStockDto {
  @IsMongoId()
  @IsNotEmpty()
  inventory_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsMongoId()
  @IsOptional()
  order_id?: string;
}

/**
 * Stock Count DTO
 * Used for physical inventory counts
 */
export class StockCountDto {
  @IsNumber()
  @Min(0)
  counted_quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Search Inventory DTO
 */
export class SearchInventoryDto {
  @IsMongoId()
  @IsOptional()
  pharmacy?: string;

  @IsMongoId()
  @IsOptional()
  drug?: string;

  @IsEnum(StockStatus)
  @IsOptional()
  stock_status?: StockStatus;

  @IsBoolean()
  @IsOptional()
  is_low_stock?: boolean;

  @IsBoolean()
  @IsOptional()
  is_expiring_soon?: boolean;

  @IsBoolean()
  @IsOptional()
  is_expired?: boolean;

  @IsBoolean()
  @IsOptional()
  is_available_for_sale?: boolean;

  @IsString()
  @IsOptional()
  batch_number?: string;

  @IsDateString()
  @IsOptional()
  expiry_before?: string;

  @IsDateString()
  @IsOptional()
  expiry_after?: string;

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
 * Inventory Response DTO
 */
export class InventoryResponseDto {
  id: string;
  pharmacy: string;
  drug: string;
  batch_number: string;
  expiry_date: Date;
  manufacture_date: Date;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  quantity_damaged: number;
  reorder_level: number;
  cost_price: number;
  selling_price: number;
  storage_location: string;
  storage_condition: StorageCondition;
  stock_status: StockStatus;
  is_low_stock: boolean;
  is_expired: boolean;
  is_expiring_soon: boolean;
  days_until_expiry: number;
  stock_value: number;
  potential_revenue: number;
  is_active: boolean;
  is_available_for_sale: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Inventory Summary DTO
 * Aggregated inventory data for a pharmacy or drug
 */
export class InventorySummaryDto {
  total_items: number;
  total_quantity: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  expiring_soon_count: number;
  expired_count: number;
}

/**
 * Low Stock Alert DTO
 */
export class LowStockAlertDto {
  inventory_id: string;
  pharmacy_id: string;
  pharmacy_name: string;
  drug_id: string;
  drug_name: string;
  batch_number: string;
  quantity_on_hand: number;
  reorder_level: number;
  reorder_quantity: number;
}

/**
 * Expiry Alert DTO
 */
export class ExpiryAlertDto {
  inventory_id: string;
  pharmacy_id: string;
  pharmacy_name: string;
  drug_id: string;
  drug_name: string;
  batch_number: string;
  quantity_on_hand: number;
  expiry_date: Date;
  days_until_expiry: number;
}
