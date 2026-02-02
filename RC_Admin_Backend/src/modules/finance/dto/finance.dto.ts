import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { WalletOwnerType, WalletStatus } from '../entities/unified-wallet.entity';
import { TransactionCategory, BatchStatus } from '../entities/transaction-batch.entity';
import { EntryType } from '../entities/ledger-entry.entity';

// Admin credit source - where does the money come from?
export enum AdminCreditSource {
  PROMOTIONAL = 'PROMOTIONAL',           // Promotional bonus/credit (Expense)
  ADJUSTMENT = 'ADJUSTMENT',             // Error correction (Expense)
  OPERATING_FUND = 'OPERATING_FUND',     // From platform operating fund (Asset)
}

// Admin debit destination - where does the money go?
export enum AdminDebitDestination {
  RECOVERY = 'RECOVERY',                 // Recovering incorrectly credited funds (Revenue)
  ADJUSTMENT = 'ADJUSTMENT',             // Correction/adjustment (Revenue)
  OPERATING_FUND = 'OPERATING_FUND',     // To platform operating fund (Asset)
}

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 20)
  limit?: number = 20;
}

export class WalletFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(WalletOwnerType)
  owner_type?: WalletOwnerType;

  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}

export class TransactionFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @IsOptional()
  @IsString()
  wallet_id?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class LedgerFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  account_code?: string;

  @IsOptional()
  @IsString()
  batch_id?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;
}

export class AdminWalletCreditDto {
  @IsNotEmpty()
  @IsString()
  wallet_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsEnum(AdminCreditSource)
  source: AdminCreditSource = AdminCreditSource.OPERATING_FUND;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdminWalletDebitDto {
  @IsNotEmpty()
  @IsString()
  wallet_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsEnum(AdminDebitDestination)
  destination: AdminDebitDestination = AdminDebitDestination.OPERATING_FUND;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class WalletStatusUpdateDto {
  @IsNotEmpty()
  @IsEnum(WalletStatus)
  status: WalletStatus;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class ReportFilterDto {
  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsString()
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// ==================== MANUAL JOURNAL ENTRIES ====================

export class JournalEntryLineDto {
  @IsNotEmpty()
  @IsString()
  account_code: string;

  @IsNotEmpty()
  @IsEnum(EntryType)
  entry_type: EntryType; // DEBIT or CREDIT

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateJournalEntryDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory = TransactionCategory.ADJUSTMENT;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  @ArrayMinSize(2)
  entries: JournalEntryLineDto[];

  @IsOptional()
  @IsString()
  reference_type?: string;

  @IsOptional()
  @IsString()
  reference_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ==================== ACCOUNT MANAGEMENT ====================

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum AccountSubType {
  CASH = 'CASH',
  RECEIVABLE = 'RECEIVABLE',
  WALLET_POOL = 'WALLET_POOL',
  WALLET_LIABILITY = 'WALLET_LIABILITY',
  PAYABLE = 'PAYABLE',
  DEFERRED_REVENUE = 'DEFERRED_REVENUE',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  SERVICE_FEE = 'SERVICE_FEE',
  PRODUCT_REVENUE = 'PRODUCT_REVENUE',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  REFUNDS_LOSSES = 'REFUNDS_LOSSES',
  OPERATIONAL = 'OPERATIONAL',
}

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  code: string; // e.g., "5300.003.001"

  @IsNotEmpty()
  @IsString()
  name: string; // e.g., "Server Hosting Costs"

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsEnum(AccountSubType)
  sub_type?: AccountSubType;

  @IsOptional()
  @IsString()
  parent_code?: string; // e.g., "5300.000.000"
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AccountSubType)
  sub_type?: AccountSubType;

  @IsOptional()
  is_active?: boolean;
}

// ==================== FUND PLATFORM OPERATING ACCOUNT ====================

export class FundOperatingAccountDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty()
  @IsString()
  source: 'BANK_TRANSFER' | 'RETAINED_EARNINGS' | 'CAPITAL_INJECTION';

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
