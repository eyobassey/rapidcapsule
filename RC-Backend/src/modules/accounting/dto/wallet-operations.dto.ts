import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  IsMongoId,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';
import { TransactionCategory, WalletOwnerType } from '../enums/account-codes.enum';

/**
 * DTO for creating a new wallet
 */
export class CreateWalletDto {
  @IsMongoId()
  owner_id: Types.ObjectId;

  @IsEnum(WalletOwnerType)
  owner_type: WalletOwnerType;

  @IsOptional()
  @IsString()
  currency?: string;
}

/**
 * Base options for wallet operations
 */
export class WalletOperationOptions {
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  reference_type?: string;

  @IsOptional()
  @IsMongoId()
  reference_id?: Types.ObjectId;

  @IsOptional()
  @IsString()
  external_reference?: string;

  @IsOptional()
  @IsMongoId()
  performed_by?: Types.ObjectId;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for crediting a wallet
 */
export class CreditWalletDto extends WalletOperationOptions {
  @IsString()
  wallet_id: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

/**
 * DTO for debiting a wallet
 */
export class DebitWalletDto extends WalletOperationOptions {
  @IsString()
  wallet_id: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  allow_negative?: boolean;
}

/**
 * DTO for holding funds in a wallet
 */
export class HoldFundsDto {
  @IsString()
  wallet_id: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  description: string;

  @IsString()
  reference_type: string;

  @IsMongoId()
  reference_id: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  performed_by?: Types.ObjectId;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expires_at?: Date; // Auto-release after this time
}

/**
 * DTO for releasing held funds
 */
export class ReleaseFundsDto {
  @IsString()
  wallet_id: string;

  @IsString()
  hold_reference_type: string;

  @IsMongoId()
  hold_reference_id: Types.ObjectId;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsMongoId()
  performed_by?: Types.ObjectId;
}

/**
 * DTO for wallet-to-wallet transfer
 */
export class TransferFundsDto {
  @IsString()
  from_wallet_id: string;

  @IsString()
  to_wallet_id: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commission_rate?: number; // Platform commission percentage (0-100)

  @IsOptional()
  @IsString()
  reference_type?: string;

  @IsOptional()
  @IsMongoId()
  reference_id?: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  performed_by?: Types.ObjectId;
}

/**
 * DTO for admin wallet adjustment
 */
export class AdminAdjustmentDto {
  @IsString()
  wallet_id: string;

  @IsNumber()
  amount: number; // Positive for credit, negative for debit

  @IsString()
  reason: string;

  @IsMongoId()
  admin_id: Types.ObjectId;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for wallet balance response
 */
export class WalletBalanceResponse {
  wallet_id: string;
  owner_type: WalletOwnerType;
  available_balance: number;
  held_balance: number;
  pending_balance: number;
  total_balance: number;
  currency: string;
  last_transaction_at: Date;
}

/**
 * Query DTO for wallet transactions
 */
export class WalletTransactionsQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_date?: Date;
}
