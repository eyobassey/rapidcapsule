import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of records per page', example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 20)
  limit?: number = 20;
}

export class WalletFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by wallet owner type', enum: WalletOwnerType, example: 'PATIENT' })
  @IsOptional()
  @IsEnum(WalletOwnerType)
  owner_type?: WalletOwnerType;

  @ApiPropertyOptional({ description: 'Filter by wallet status', enum: WalletStatus, example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;

  @ApiPropertyOptional({ description: 'Search by owner name, email, or wallet ID', example: 'adebayo@example.com' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Field to sort results by', example: 'created_at', default: 'created_at' })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], example: 'desc', default: 'desc' })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}

export class TransactionFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by transaction category', enum: TransactionCategory, example: 'WALLET_TOPUP' })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @ApiPropertyOptional({ description: 'Filter by transaction batch status', enum: BatchStatus, example: 'POSTED' })
  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @ApiPropertyOptional({ description: 'Filter by wallet identifier', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  wallet_id?: string;

  @ApiPropertyOptional({ description: 'Filter by user MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Start date for date range filter (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for date range filter (ISO 8601)', example: '2026-02-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Search by Paystack reference, batch ID, or description', example: 'PAY_abcdef123456' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class LedgerFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by chart-of-accounts code', example: '1100.001.000' })
  @IsOptional()
  @IsString()
  account_code?: string;

  @ApiPropertyOptional({ description: 'Filter by transaction batch identifier', example: 'TXN-1709136000000-abc123' })
  @IsOptional()
  @IsString()
  batch_id?: string;

  @ApiPropertyOptional({ description: 'Filter by user MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Start date for date range filter (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for date range filter (ISO 8601)', example: '2026-02-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  end_date?: string;
}

export class AdminWalletCreditDto {
  @ApiProperty({ description: 'Wallet identifier to credit', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  wallet_id: string;

  @ApiProperty({ description: 'Amount to credit in NGN (kobo precision handled internally)', example: 5000, minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Reason for the admin credit', example: 'Promotional credit for new user onboarding campaign' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Source of the credit funds', enum: AdminCreditSource, example: 'OPERATING_FUND', default: 'OPERATING_FUND' })
  @IsOptional()
  @IsEnum(AdminCreditSource)
  source: AdminCreditSource = AdminCreditSource.OPERATING_FUND;

  @ApiPropertyOptional({ description: 'Additional notes for the credit operation', example: 'Approved by finance lead - ticket #RC-4521' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdminWalletDebitDto {
  @ApiProperty({ description: 'Wallet identifier to debit', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  wallet_id: string;

  @ApiProperty({ description: 'Amount to debit in NGN', example: 2500, minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Reason for the admin debit', example: 'Recovery of duplicate Paystack top-up credited in error' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Destination for the debited funds', enum: AdminDebitDestination, example: 'OPERATING_FUND', default: 'OPERATING_FUND' })
  @IsOptional()
  @IsEnum(AdminDebitDestination)
  destination: AdminDebitDestination = AdminDebitDestination.OPERATING_FUND;

  @ApiPropertyOptional({ description: 'Additional notes for the debit operation', example: 'Ref: Paystack duplicate TXN_ref_abc123' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WalletStatusUpdateDto {
  @ApiProperty({ description: 'New wallet status', enum: WalletStatus, example: 'SUSPENDED' })
  @IsNotEmpty()
  @IsEnum(WalletStatus)
  status: WalletStatus;

  @ApiProperty({ description: 'Reason for the status change', example: 'Suspicious activity detected - pending fraud investigation' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class ReportFilterDto {
  @ApiPropertyOptional({ description: 'Start date for the report period (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for the report period (ISO 8601)', example: '2026-02-27T23:59:59.999Z' })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Aggregation period for the report', enum: ['daily', 'weekly', 'monthly', 'yearly'], example: 'monthly' })
  @IsOptional()
  @IsString()
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// ==================== MANUAL JOURNAL ENTRIES ====================

export class JournalEntryLineDto {
  @ApiProperty({ description: 'Chart-of-accounts code for this line', example: '1100.001.000' })
  @IsNotEmpty()
  @IsString()
  account_code: string;

  @ApiProperty({ description: 'Whether this line is a debit or credit', enum: EntryType, example: 'DEBIT' })
  @IsNotEmpty()
  @IsEnum(EntryType)
  entry_type: EntryType; // DEBIT or CREDIT

  @ApiProperty({ description: 'Amount for this line entry in NGN', example: 15000, minimum: 0.01 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Optional description for this line entry', example: 'Debit patient wallet pool for refund adjustment' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ description: 'Description of the journal entry', example: 'Manual adjustment for Paystack reconciliation discrepancy' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Transaction category for this journal entry', enum: TransactionCategory, example: 'ADJUSTMENT', default: 'ADJUSTMENT' })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory = TransactionCategory.ADJUSTMENT;

  @ApiProperty({ description: 'Array of journal entry lines (minimum 2, debits must equal credits)', type: [JournalEntryLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  @ArrayMinSize(2)
  entries: JournalEntryLineDto[];

  @ApiPropertyOptional({ description: 'Type of external reference (e.g., PaystackTransaction, Appointment)', example: 'PaystackTransaction' })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ description: 'External reference ID', example: 'PAY_ref_abc123def456' })
  @IsOptional()
  @IsString()
  reference_id?: string;

  @ApiPropertyOptional({ description: 'Additional notes for the journal entry', example: 'Approved by CFO on 2026-02-27' })
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
  @ApiProperty({ description: 'Unique account code following hierarchical format', example: '5300.003.001' })
  @IsNotEmpty()
  @IsString()
  code: string; // e.g., "5300.003.001"

  @ApiProperty({ description: 'Human-readable account name', example: 'Server Hosting Costs' })
  @IsNotEmpty()
  @IsString()
  name: string; // e.g., "Server Hosting Costs"

  @ApiPropertyOptional({ description: 'Detailed description of the account purpose', example: 'Monthly AWS and server infrastructure costs for the Rapid Capsule platform' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Primary account type in the chart of accounts', enum: AccountType, example: 'EXPENSE' })
  @IsNotEmpty()
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({ description: 'Sub-type for further classification', enum: AccountSubType, example: 'OPERATIONAL' })
  @IsOptional()
  @IsEnum(AccountSubType)
  sub_type?: AccountSubType;

  @ApiPropertyOptional({ description: 'Parent account code for hierarchical grouping', example: '5300.000.000' })
  @IsOptional()
  @IsString()
  parent_code?: string; // e.g., "5300.000.000"
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ description: 'Updated account name', example: 'Cloud Infrastructure Costs' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated account description', example: 'All cloud hosting and infrastructure expenses including AWS, Cloudflare, and MongoDB Atlas' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Updated account sub-type', enum: AccountSubType, example: 'OPERATIONAL' })
  @IsOptional()
  @IsEnum(AccountSubType)
  sub_type?: AccountSubType;

  @ApiPropertyOptional({ description: 'Whether the account is active', example: true })
  @IsOptional()
  is_active?: boolean;
}

// ==================== FUND PLATFORM OPERATING ACCOUNT ====================

export class FundOperatingAccountDto {
  @ApiProperty({ description: 'Amount to fund the operating account in NGN', example: 500000, minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Source of the funding', enum: ['BANK_TRANSFER', 'RETAINED_EARNINGS', 'CAPITAL_INJECTION'], example: 'BANK_TRANSFER' })
  @IsNotEmpty()
  @IsString()
  source: 'BANK_TRANSFER' | 'RETAINED_EARNINGS' | 'CAPITAL_INJECTION';

  @ApiProperty({ description: 'Description of the funding operation', example: 'Monthly operating fund top-up from GTBank business account' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'External reference number (e.g., bank transfer reference)', example: 'GTB-TRF-20260227-001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Additional notes about the funding', example: 'Approved by CEO - Q1 2026 operating budget allocation' })
  @IsOptional()
  @IsString()
  notes?: string;
}
