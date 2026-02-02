import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';
import { TransactionCategory, EntryType } from '../enums/account-codes.enum';

/**
 * DTO for creating a single ledger entry within a batch
 */
export class CreateEntryDto {
  @IsString()
  account_code: string;

  @IsEnum(EntryType)
  entry_type: EntryType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsMongoId()
  user_id?: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  wallet_id?: Types.ObjectId;
}

/**
 * DTO for creating a transaction batch with its entries
 */
export class CreateBatchDto {
  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @IsString()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEntryDto)
  entries: CreateEntryDto[];

  @IsOptional()
  @IsMongoId()
  from_user?: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  from_wallet?: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  to_user?: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  to_wallet?: Types.ObjectId;

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
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for reversing a batch
 */
export class ReverseBatchDto {
  @IsString()
  batch_id: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsMongoId()
  performed_by?: Types.ObjectId;

  @IsOptional()
  @IsString()
  ip_address?: string;
}
