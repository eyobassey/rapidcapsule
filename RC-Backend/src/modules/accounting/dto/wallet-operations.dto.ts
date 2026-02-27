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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionCategory, WalletOwnerType } from '../enums/account-codes.enum';

/**
 * DTO for creating a new wallet
 */
export class CreateWalletDto {
  @ApiProperty({ description: 'Owner user or entity ID', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  owner_id: Types.ObjectId;

  @ApiProperty({ description: 'Type of wallet owner', enum: WalletOwnerType, example: WalletOwnerType.PATIENT })
  @IsEnum(WalletOwnerType)
  owner_type: WalletOwnerType;

  @ApiPropertyOptional({ description: 'Wallet currency code', default: 'NGN', example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;
}

/**
 * Base options for wallet operations
 */
export class WalletOperationOptions {
  @ApiPropertyOptional({ description: 'Transaction category', enum: TransactionCategory, example: TransactionCategory.WALLET_TOPUP })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @ApiProperty({ description: 'Human-readable description of the operation', example: 'Wallet top-up via Paystack' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Type of the referenced entity (e.g. appointment, prescription)', example: 'appointment' })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ description: 'ID of the referenced entity', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  reference_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'External reference such as a Paystack transaction reference', example: 'PSK_abc123def456' })
  @IsOptional()
  @IsString()
  external_reference?: string;

  @ApiPropertyOptional({ description: 'ID of the user who performed this operation', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  performed_by?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'IP address of the requester', example: '192.168.1.100' })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the operation', type: 'object', example: { source: 'mobile_app' } })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for crediting a wallet
 */
export class CreditWalletDto extends WalletOperationOptions {
  @ApiProperty({ description: 'Target wallet ID', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
  @IsString()
  wallet_id: string;

  @ApiProperty({ description: 'Amount to credit in NGN (minimum 0.01)', minimum: 0.01, example: 5000 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}

/**
 * DTO for debiting a wallet
 */
export class DebitWalletDto extends WalletOperationOptions {
  @ApiProperty({ description: 'Target wallet ID', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
  @IsString()
  wallet_id: string;

  @ApiProperty({ description: 'Amount to debit in NGN (minimum 0.01)', minimum: 0.01, example: 2500 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Allow balance to go negative (admin override)', default: false, example: false })
  @IsOptional()
  allow_negative?: boolean;
}

/**
 * DTO for holding funds in a wallet
 */
export class HoldFundsDto {
  @ApiProperty({ description: 'Wallet ID to hold funds on', example: 'WAL-SPC-507f1f77bcf86cd799439011' })
  @IsString()
  wallet_id: string;

  @ApiProperty({ description: 'Amount to hold in NGN', minimum: 0.01, example: 10000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Reason for holding funds', example: 'Prescription escrow hold' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Type of the referenced entity', example: 'prescription' })
  @IsString()
  reference_type: string;

  @ApiProperty({ description: 'ID of the referenced entity', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  reference_id: Types.ObjectId;

  @ApiPropertyOptional({ description: 'ID of the user performing the hold', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  performed_by?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Auto-release date/time for the hold', example: '2026-03-15T12:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expires_at?: Date; // Auto-release after this time
}

/**
 * DTO for releasing held funds
 */
export class ReleaseFundsDto {
  @ApiProperty({ description: 'Wallet ID to release funds from', example: 'WAL-SPC-507f1f77bcf86cd799439011' })
  @IsString()
  wallet_id: string;

  @ApiProperty({ description: 'Reference type of the original hold', example: 'prescription' })
  @IsString()
  hold_reference_type: string;

  @ApiProperty({ description: 'Reference ID of the original hold', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  hold_reference_id: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Reason for releasing the hold', example: 'Prescription fulfilled' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'ID of the user performing the release', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  performed_by?: Types.ObjectId;
}

/**
 * DTO for wallet-to-wallet transfer
 */
export class TransferFundsDto {
  @ApiProperty({ description: 'Source wallet ID', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
  @IsString()
  from_wallet_id: string;

  @ApiProperty({ description: 'Destination wallet ID', example: 'WAL-SPC-507f1f77bcf86cd799439022' })
  @IsString()
  to_wallet_id: string;

  @ApiProperty({ description: 'Transfer amount in NGN', minimum: 0.01, example: 15000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Transfer description', example: 'Payment for consultation' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Platform commission percentage (0-100)', minimum: 0, example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commission_rate?: number; // Platform commission percentage (0-100)

  @ApiPropertyOptional({ description: 'Type of the referenced entity', example: 'appointment' })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ description: 'ID of the referenced entity', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  reference_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'ID of the user performing the transfer', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  performed_by?: Types.ObjectId;
}

/**
 * DTO for admin wallet adjustment
 */
export class AdminAdjustmentDto {
  @ApiProperty({ description: 'Target wallet ID', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
  @IsString()
  wallet_id: string;

  @ApiProperty({ description: 'Adjustment amount in NGN. Positive for credit, negative for debit', example: 5000 })
  @IsNumber()
  amount: number; // Positive for credit, negative for debit

  @ApiProperty({ description: 'Reason for the admin adjustment', example: 'Refund for cancelled appointment' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'ID of the admin performing the adjustment', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  admin_id: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Additional notes about the adjustment', example: 'Customer complained about service quality' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for wallet balance response
 */
export class WalletBalanceResponse {
  @ApiProperty({ description: 'Wallet ID', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
  wallet_id: string;

  @ApiProperty({ description: 'Type of wallet owner', enum: WalletOwnerType, example: WalletOwnerType.PATIENT })
  owner_type: WalletOwnerType;

  @ApiProperty({ description: 'Available balance in NGN (after holds)', example: 25000 })
  available_balance: number;

  @ApiProperty({ description: 'Total held/escrowed balance in NGN', example: 10000 })
  held_balance: number;

  @ApiProperty({ description: 'Pending balance in NGN (unconfirmed transactions)', example: 0 })
  pending_balance: number;

  @ApiProperty({ description: 'Total balance in NGN (available + held + pending)', example: 35000 })
  total_balance: number;

  @ApiProperty({ description: 'Wallet currency code', example: 'NGN' })
  currency: string;

  @ApiProperty({ description: 'Timestamp of the last transaction', example: '2026-02-27T10:30:00.000Z' })
  last_transaction_at: Date;
}

/**
 * Query DTO for wallet transactions
 */
export class WalletTransactionsQueryDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1, minimum: 1, example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of transactions per page', default: 20, minimum: 1, maximum: 100, example: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by transaction category', enum: TransactionCategory, example: TransactionCategory.WALLET_TOPUP })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @ApiPropertyOptional({ description: 'Filter transactions from this date', example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date?: Date;

  @ApiPropertyOptional({ description: 'Filter transactions up to this date', example: '2026-02-28T23:59:59.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_date?: Date;
}
