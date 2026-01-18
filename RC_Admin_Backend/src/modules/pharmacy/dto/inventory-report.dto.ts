import { IsOptional, IsString, IsDateString, IsEnum, IsNumber, Min, Max, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReportFilter {
  ALL = 'all',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
}

export class InventoryReportQueryDto {
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsMongoId()
  category_id?: string;

  @IsOptional()
  @IsMongoId()
  supplier_id?: string;

  @IsOptional()
  @IsMongoId()
  manufacturer?: string;

  @IsOptional()
  @IsEnum(ReportFilter)
  filter?: ReportFilter;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  expiry_days?: number; // For expiry report - default 90

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number; // For limiting results in tables
}

// Response types for type safety
export interface StockValuationSummary {
  total_products: number;
  total_batches: number;
  total_stock_units: number;
  total_cost_value: number;
  total_retail_value: number;
  potential_profit: number;
  profit_margin_percent: number;
}

export interface CategoryValuation {
  category_id: string;
  category_name: string;
  product_count: number;
  units: number;
  cost_value: number;
  retail_value: number;
}

export interface SupplierValuation {
  supplier_id: string;
  supplier_name: string;
  batch_count: number;
  units: number;
  cost_value: number;
}

export interface ProductValuation {
  drug_id: string;
  drug_name: string;
  drug_code: string;
  category: string;
  total_units: number;
  avg_cost: number;
  total_cost_value: number;
  total_retail_value: number;
  batch_count: number;
  profit_margin: number;
}

export interface StockValuationReport {
  summary: StockValuationSummary;
  by_category: CategoryValuation[];
  by_supplier: SupplierValuation[];
  products: ProductValuation[];
  generated_at: Date;
  filters_applied: {
    start_date?: string;
    end_date?: string;
    category_id?: string;
    supplier_id?: string;
    manufacturer?: string;
  };
}

export interface ExpiryBatchSummary {
  total_batches: number;
  active_batches: number;
  expired_batches: number;
  expiring_30_days: number;
  expiring_60_days: number;
  expiring_90_days: number;
  quarantined_batches: number;
  recalled_batches: number;
  no_expiry_batches: number;
}

export interface ExpiryTimelinePeriod {
  period: string;
  batch_count: number;
  units: number;
  value_at_risk: number;
}

export interface CriticalBatch {
  batch_id: string;
  internal_batch_id: string;
  batch_number: string;
  drug_id: string;
  drug_name: string;
  drug_code: string;
  supplier_name: string;
  expiry_date: Date;
  days_until_expiry: number;
  quantity_available: number;
  cost_price: number;
  value_at_risk: number;
  status: string;
}

export interface BatchStatusCount {
  status: string;
  count: number;
  units: number;
}

export interface ExpiryBatchReport {
  summary: ExpiryBatchSummary;
  expiry_timeline: ExpiryTimelinePeriod[];
  critical_batches: CriticalBatch[];
  batches_by_status: BatchStatusCount[];
  generated_at: Date;
  filters_applied: {
    start_date?: string;
    end_date?: string;
    category_id?: string;
    supplier_id?: string;
    manufacturer?: string;
    expiry_days?: number;
  };
}

export interface TransactionSummary {
  total_transactions: number;
  total_received: number;
  total_sold: number;
  total_adjusted_add: number;
  total_adjusted_subtract: number;
  total_returned: number;
  total_written_off: number;
  total_recalled: number;
  net_movement: number;
  total_value_in: number;
  total_value_out: number;
}

export interface TransactionTypeCount {
  type: string;
  count: number;
  units: number;
  value: number;
}

export interface DailyTransactionVolume {
  date: string;
  received: number;
  sold: number;
  adjusted: number;
  returned: number;
  other: number;
}

export interface TopMovingDrug {
  drug_id: string;
  drug_name: string;
  drug_code: string;
  total_in: number;
  total_out: number;
  net_change: number;
  transaction_count: number;
}

export interface RecentTransaction {
  transaction_id: string;
  type: string;
  drug_name: string;
  batch_number: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  reason?: string;
  performed_by: string;
  created_at: Date;
}

export interface TransactionReport {
  summary: TransactionSummary;
  by_type: TransactionTypeCount[];
  by_day: DailyTransactionVolume[];
  top_moving_drugs: TopMovingDrug[];
  recent_transactions: RecentTransaction[];
  generated_at: Date;
  filters_applied: {
    start_date?: string;
    end_date?: string;
    category_id?: string;
    supplier_id?: string;
    manufacturer?: string;
  };
}
