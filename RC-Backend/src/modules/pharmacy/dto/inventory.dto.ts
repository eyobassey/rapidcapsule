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
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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

  @ApiProperty({ description: 'MongoDB ID of the pharmacy that holds this inventory', example: '693f961ebb4dc1fec542610a' })
  @IsMongoId()
  @IsNotEmpty()
  pharmacy: string;

  @ApiProperty({ description: 'MongoDB ID of the drug product in this inventory record', example: '664a1f2e3b9c4d5e6f7a8b9c' })
  @IsMongoId()
  @IsNotEmpty()
  drug: string;

  @ApiProperty({ description: 'Unique batch or lot number assigned by the manufacturer', example: 'BATCH-2024-001' })
  @IsString()
  @IsNotEmpty()
  batch_number: string;

  @ApiProperty({ description: 'Expiration date of this batch in ISO 8601 format', example: '2025-12-31T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  expiry_date: string;

  @ApiProperty({ description: 'Current quantity of units physically on hand', example: 500 })
  @IsNumber()
  @Min(0)
  quantity_on_hand: number;

  @ApiProperty({ description: 'Unit cost price paid to the supplier (in minor currency unit)', example: 1500 })
  @IsNumber()
  @Min(0)
  cost_price: number;

  @ApiProperty({ description: 'Unit selling price to the customer (in minor currency unit)', example: 2500 })
  @IsNumber()
  @Min(0)
  selling_price: number;

  // ============ OPTIONAL FIELDS ============

  @ApiPropertyOptional({ description: 'Date the batch was manufactured in ISO 8601 format', example: '2024-03-15T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  manufacture_date?: string;

  @ApiPropertyOptional({ description: 'Minimum stock threshold that triggers a reorder alert', example: 50 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  reorder_level?: number;

  @ApiPropertyOptional({ description: 'Recommended quantity to order when stock reaches the reorder level', example: 200 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  reorder_quantity?: number;

  @ApiPropertyOptional({ description: 'Maximum stock level allowed for this item in the pharmacy', example: 1000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  max_stock_level?: number;

  @ApiPropertyOptional({ description: 'Discount percentage applied to the selling price (0-100)', example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discount_percentage?: number;

  @ApiPropertyOptional({ description: 'Physical location within the pharmacy where this stock is stored', example: 'Shelf A-12' })
  @IsString()
  @IsOptional()
  storage_location?: string;

  @ApiPropertyOptional({ description: 'Required storage condition for this medication', enum: StorageCondition, example: StorageCondition.ROOM_TEMPERATURE })
  @IsEnum(StorageCondition)
  @IsOptional()
  storage_condition?: StorageCondition;

  @ApiPropertyOptional({ description: 'Dispensing method used for stock rotation', enum: DispensingMethod, example: DispensingMethod.FEFO })
  @IsEnum(DispensingMethod)
  @IsOptional()
  dispensing_method?: DispensingMethod;

  @ApiPropertyOptional({ description: 'Name of the pharmaceutical supplier or distributor', example: 'Chi Pharmaceuticals Ltd' })
  @IsString()
  @IsOptional()
  supplier_name?: string;

  @ApiPropertyOptional({ description: 'Invoice or receipt reference number from the supplier', example: 'INV-2024-5678' })
  @IsString()
  @IsOptional()
  supplier_invoice?: string;

  @ApiPropertyOptional({ description: 'Date this stock was received at the pharmacy in ISO 8601 format', example: '2024-06-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  received_date?: string;

  @ApiPropertyOptional({ description: 'Whether this inventory record is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Whether this stock is available for sale to customers', example: true })
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
  @ApiProperty({ description: 'Reason for the inventory adjustment', enum: AdjustmentReason, example: AdjustmentReason.RECEIVED })
  @IsEnum(AdjustmentReason)
  @IsNotEmpty()
  reason: AdjustmentReason;

  @ApiProperty({ description: 'Quantity change to apply. Positive for additions, negative for reductions', example: 50 })
  @IsNumber()
  @IsNotEmpty()
  quantity_change: number; // Positive for additions, negative for reductions

  @ApiPropertyOptional({ description: 'Additional notes or comments explaining the adjustment', example: 'Received new shipment from supplier' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Type of the related entity (e.g. order, prescription, transfer)', example: 'PharmacyOrder' })
  @IsString()
  @IsOptional()
  reference_type?: string;

  @ApiPropertyOptional({ description: 'MongoDB ID of the related entity that triggered this adjustment', example: '664b2a3c4d5e6f7a8b9c0d1e' })
  @IsMongoId()
  @IsOptional()
  reference_id?: string;

  @ApiPropertyOptional({ description: 'Human-readable reference number for the adjustment source', example: 'ORD-2024-1234' })
  @IsString()
  @IsOptional()
  reference_number?: string;

  @ApiPropertyOptional({ description: 'Unit cost of items in this adjustment (in minor currency unit)', example: 1500 })
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
  @ApiProperty({ description: 'MongoDB ID of the pharmacy receiving the stock', example: '693f961ebb4dc1fec542610a' })
  @IsMongoId()
  @IsNotEmpty()
  pharmacy: string;

  @ApiProperty({ description: 'MongoDB ID of the drug being received', example: '664a1f2e3b9c4d5e6f7a8b9c' })
  @IsMongoId()
  @IsNotEmpty()
  drug: string;

  @ApiProperty({ description: 'Batch or lot number from the manufacturer or supplier', example: 'BATCH-2024-001' })
  @IsString()
  @IsNotEmpty()
  batch_number: string;

  @ApiProperty({ description: 'Expiration date of the received batch in ISO 8601 format', example: '2025-12-31T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  expiry_date: string;

  @ApiProperty({ description: 'Number of units received in this shipment', example: 300 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Cost price per unit paid to the supplier (in minor currency unit)', example: 1500 })
  @IsNumber()
  @Min(0)
  cost_price: number;

  @ApiProperty({ description: 'Selling price per unit to the customer (in minor currency unit)', example: 2500 })
  @IsNumber()
  @Min(0)
  selling_price: number;

  @ApiPropertyOptional({ description: 'Name of the pharmaceutical supplier or distributor', example: 'Chi Pharmaceuticals Ltd' })
  @IsString()
  @IsOptional()
  supplier_name?: string;

  @ApiPropertyOptional({ description: 'Invoice or receipt reference number from the supplier', example: 'INV-2024-5678' })
  @IsString()
  @IsOptional()
  supplier_invoice?: string;

  @ApiPropertyOptional({ description: 'Date the batch was manufactured in ISO 8601 format', example: '2024-03-15T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  manufacture_date?: string;

  @ApiPropertyOptional({ description: 'Physical storage location within the pharmacy', example: 'Shelf A-12' })
  @IsString()
  @IsOptional()
  storage_location?: string;

  @ApiPropertyOptional({ description: 'Required storage condition for the received stock', enum: StorageCondition, example: StorageCondition.ROOM_TEMPERATURE })
  @IsEnum(StorageCondition)
  @IsOptional()
  storage_condition?: StorageCondition;
}

/**
 * Reserve Stock DTO
 * Used when creating orders to reserve stock
 */
export class ReserveStockDto {
  @ApiProperty({ description: 'MongoDB ID of the inventory record to reserve stock from', example: '664c3b4d5e6f7a8b9c0d1e2f' })
  @IsMongoId()
  @IsNotEmpty()
  inventory_id: string;

  @ApiProperty({ description: 'Number of units to reserve for the pending order', example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'MongoDB ID of the order this reservation is linked to', example: '664d4c5e6f7a8b9c0d1e2f3a' })
  @IsMongoId()
  @IsOptional()
  order_id?: string;
}

/**
 * Release Stock DTO
 * Used to release reserved stock (order cancelled, etc.)
 */
export class ReleaseStockDto {
  @ApiProperty({ description: 'MongoDB ID of the inventory record to release reserved stock from', example: '664c3b4d5e6f7a8b9c0d1e2f' })
  @IsMongoId()
  @IsNotEmpty()
  inventory_id: string;

  @ApiProperty({ description: 'Number of previously reserved units to release back to available stock', example: 3 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'MongoDB ID of the cancelled or modified order', example: '664d4c5e6f7a8b9c0d1e2f3a' })
  @IsMongoId()
  @IsOptional()
  order_id?: string;
}

/**
 * Stock Count DTO
 * Used for physical inventory counts
 */
export class StockCountDto {
  @ApiProperty({ description: 'Actual quantity counted during physical inventory audit', example: 487 })
  @IsNumber()
  @Min(0)
  counted_quantity: number;

  @ApiPropertyOptional({ description: 'Notes explaining any discrepancy between counted and recorded quantities', example: 'Discrepancy of 13 units — likely dispensing errors over the month' })
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Search Inventory DTO
 */
export class SearchInventoryDto {
  @ApiPropertyOptional({ description: 'Filter by pharmacy MongoDB ID', example: '693f961ebb4dc1fec542610a' })
  @IsMongoId()
  @IsOptional()
  pharmacy?: string;

  @ApiPropertyOptional({ description: 'Filter by drug MongoDB ID', example: '664a1f2e3b9c4d5e6f7a8b9c' })
  @IsMongoId()
  @IsOptional()
  drug?: string;

  @ApiPropertyOptional({ description: 'Filter by current stock status', enum: StockStatus, example: StockStatus.IN_STOCK })
  @IsEnum(StockStatus)
  @IsOptional()
  stock_status?: StockStatus;

  @ApiPropertyOptional({ description: 'Filter to show only items below their reorder level', example: true })
  @IsBoolean()
  @IsOptional()
  is_low_stock?: boolean;

  @ApiPropertyOptional({ description: 'Filter to show only items expiring within 90 days', example: false })
  @IsBoolean()
  @IsOptional()
  is_expiring_soon?: boolean;

  @ApiPropertyOptional({ description: 'Filter to show only items that have already expired', example: false })
  @IsBoolean()
  @IsOptional()
  is_expired?: boolean;

  @ApiPropertyOptional({ description: 'Filter to show only items available for customer purchase', example: true })
  @IsBoolean()
  @IsOptional()
  is_available_for_sale?: boolean;

  @ApiPropertyOptional({ description: 'Filter by specific batch or lot number', example: 'BATCH-2024-001' })
  @IsString()
  @IsOptional()
  batch_number?: string;

  @ApiPropertyOptional({ description: 'Filter items expiring before this date (ISO 8601)', example: '2025-06-30T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  expiry_before?: string;

  @ApiPropertyOptional({ description: 'Filter items expiring after this date (ISO 8601)', example: '2025-01-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  expiry_after?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination (starts at 1)', example: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of results per page (1-100)', example: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Field name to sort results by', example: 'expiry_date' })
  @IsString()
  @IsOptional()
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Sort direction: ascending or descending', example: 'asc' })
  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc';
}

/**
 * Inventory Response DTO
 */
export class InventoryResponseDto {
  @ApiProperty({ description: 'Unique identifier of the inventory record', example: '664c3b4d5e6f7a8b9c0d1e2f' })
  id: string;

  @ApiProperty({ description: 'MongoDB ID of the pharmacy', example: '693f961ebb4dc1fec542610a' })
  pharmacy: string;

  @ApiProperty({ description: 'MongoDB ID of the drug product', example: '664a1f2e3b9c4d5e6f7a8b9c' })
  drug: string;

  @ApiProperty({ description: 'Batch or lot number assigned by the manufacturer', example: 'BATCH-2024-001' })
  batch_number: string;

  @ApiProperty({ description: 'Expiration date of this batch', example: '2025-12-31T00:00:00.000Z' })
  expiry_date: Date;

  @ApiProperty({ description: 'Date the batch was manufactured', example: '2024-03-15T00:00:00.000Z' })
  manufacture_date: Date;

  @ApiProperty({ description: 'Total quantity of units physically on hand', example: 500 })
  quantity_on_hand: number;

  @ApiProperty({ description: 'Quantity currently reserved for pending orders', example: 25 })
  quantity_reserved: number;

  @ApiProperty({ description: 'Quantity available for new orders (on_hand minus reserved)', example: 475 })
  quantity_available: number;

  @ApiProperty({ description: 'Quantity recorded as damaged or unusable', example: 3 })
  quantity_damaged: number;

  @ApiProperty({ description: 'Stock threshold that triggers a reorder alert', example: 50 })
  reorder_level: number;

  @ApiProperty({ description: 'Unit cost price paid to the supplier (in minor currency unit)', example: 1500 })
  cost_price: number;

  @ApiProperty({ description: 'Unit selling price to the customer (in minor currency unit)', example: 2500 })
  selling_price: number;

  @ApiProperty({ description: 'Physical storage location within the pharmacy', example: 'Shelf A-12' })
  storage_location: string;

  @ApiProperty({ description: 'Required storage condition for the medication', enum: StorageCondition, example: StorageCondition.ROOM_TEMPERATURE })
  storage_condition: StorageCondition;

  @ApiProperty({ description: 'Current computed stock status', enum: StockStatus, example: StockStatus.IN_STOCK })
  stock_status: StockStatus;

  @ApiProperty({ description: 'Whether current stock is below the reorder level', example: false })
  is_low_stock: boolean;

  @ApiProperty({ description: 'Whether this batch has passed its expiry date', example: false })
  is_expired: boolean;

  @ApiProperty({ description: 'Whether this batch is expiring within 90 days', example: true })
  is_expiring_soon: boolean;

  @ApiProperty({ description: 'Number of days remaining until the batch expires', example: 45 })
  days_until_expiry: number;

  @ApiProperty({ description: 'Total value of on-hand stock at cost price (quantity_on_hand * cost_price)', example: 750000 })
  stock_value: number;

  @ApiProperty({ description: 'Total potential revenue at selling price (quantity_on_hand * selling_price)', example: 1250000 })
  potential_revenue: number;

  @ApiProperty({ description: 'Whether this inventory record is active', example: true })
  is_active: boolean;

  @ApiProperty({ description: 'Whether this stock is available for sale to customers', example: true })
  is_available_for_sale: boolean;

  @ApiProperty({ description: 'Timestamp when the inventory record was created', example: '2024-06-01T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ description: 'Timestamp when the inventory record was last updated', example: '2024-06-15T14:22:00.000Z' })
  updated_at: Date;
}

/**
 * Inventory Summary DTO
 * Aggregated inventory data for a pharmacy or drug
 */
export class InventorySummaryDto {
  @ApiProperty({ description: 'Total number of distinct inventory records', example: 142 })
  total_items: number;

  @ApiProperty({ description: 'Sum of all quantities on hand across all inventory records', example: 12500 })
  total_quantity: number;

  @ApiProperty({ description: 'Total value of all stock at cost price', example: 8750000 })
  total_value: number;

  @ApiProperty({ description: 'Number of items currently below their reorder level', example: 8 })
  low_stock_count: number;

  @ApiProperty({ description: 'Number of items with zero available stock', example: 3 })
  out_of_stock_count: number;

  @ApiProperty({ description: 'Number of items expiring within 90 days', example: 12 })
  expiring_soon_count: number;

  @ApiProperty({ description: 'Number of items that have already expired', example: 2 })
  expired_count: number;
}

/**
 * Low Stock Alert DTO
 */
export class LowStockAlertDto {
  @ApiProperty({ description: 'MongoDB ID of the inventory record triggering the alert', example: '664c3b4d5e6f7a8b9c0d1e2f' })
  inventory_id: string;

  @ApiProperty({ description: 'MongoDB ID of the pharmacy with low stock', example: '693f961ebb4dc1fec542610a' })
  pharmacy_id: string;

  @ApiProperty({ description: 'Display name of the pharmacy', example: 'Rapid Capsule Pharmacy Lagos' })
  pharmacy_name: string;

  @ApiProperty({ description: 'MongoDB ID of the drug that is running low', example: '664a1f2e3b9c4d5e6f7a8b9c' })
  drug_id: string;

  @ApiProperty({ description: 'Name of the drug product running low', example: 'Amoxicillin 500mg Capsule' })
  drug_name: string;

  @ApiProperty({ description: 'Batch number of the low-stock inventory', example: 'BATCH-2024-001' })
  batch_number: string;

  @ApiProperty({ description: 'Current quantity on hand (below reorder level)', example: 12 })
  quantity_on_hand: number;

  @ApiProperty({ description: 'Configured reorder threshold for this item', example: 50 })
  reorder_level: number;

  @ApiProperty({ description: 'Recommended quantity to order from the supplier', example: 200 })
  reorder_quantity: number;
}

/**
 * Expiry Alert DTO
 */
export class ExpiryAlertDto {
  @ApiProperty({ description: 'MongoDB ID of the inventory record triggering the expiry alert', example: '664c3b4d5e6f7a8b9c0d1e2f' })
  inventory_id: string;

  @ApiProperty({ description: 'MongoDB ID of the pharmacy holding the expiring stock', example: '693f961ebb4dc1fec542610a' })
  pharmacy_id: string;

  @ApiProperty({ description: 'Display name of the pharmacy', example: 'Rapid Capsule Pharmacy Lagos' })
  pharmacy_name: string;

  @ApiProperty({ description: 'MongoDB ID of the drug that is expiring', example: '664a1f2e3b9c4d5e6f7a8b9c' })
  drug_id: string;

  @ApiProperty({ description: 'Name of the drug product expiring soon', example: 'Metformin 850mg Tablet' })
  drug_name: string;

  @ApiProperty({ description: 'Batch number of the expiring inventory', example: 'BATCH-2024-001' })
  batch_number: string;

  @ApiProperty({ description: 'Quantity of units remaining in this expiring batch', example: 150 })
  quantity_on_hand: number;

  @ApiProperty({ description: 'Expiration date of the batch', example: '2025-03-31T00:00:00.000Z' })
  expiry_date: Date;

  @ApiProperty({ description: 'Number of days remaining until the batch expires (negative if already expired)', example: 30 })
  days_until_expiry: number;
}
