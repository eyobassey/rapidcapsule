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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionCategory, EntryType } from '../enums/account-codes.enum';

/**
 * DTO for creating a single ledger entry within a batch
 */
export class CreateEntryDto {
  @ApiProperty({ description: 'Chart of accounts code for this entry', example: '1100' })
  @IsString()
  account_code: string;

  @ApiProperty({ description: 'Entry type (debit or credit)', enum: EntryType, example: EntryType.DEBIT })
  @IsEnum(EntryType)
  entry_type: EntryType;

  @ApiProperty({ description: 'Entry amount in NGN (minimum 0.01)', minimum: 0.01, example: 5000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Description of this ledger entry', example: 'Patient wallet debit for appointment payment' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Associated user ID', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  user_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Associated wallet ID', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  wallet_id?: Types.ObjectId;
}

/**
 * DTO for creating a transaction batch with its entries
 */
export class CreateBatchDto {
  @ApiProperty({ description: 'Transaction category', enum: TransactionCategory, example: TransactionCategory.APPOINTMENT_PAYMENT })
  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @ApiProperty({ description: 'Batch description', example: 'Appointment payment from patient to specialist' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Array of ledger entries (must balance: total debits = total credits)', type: [CreateEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEntryDto)
  entries: CreateEntryDto[];

  @ApiPropertyOptional({ description: 'Source user ID (sender)', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  from_user?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Source user display name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  from_name?: string;

  @ApiPropertyOptional({ description: 'Source wallet ID', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  from_wallet?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Destination user ID (receiver)', example: '507f1f77bcf86cd799439022' })
  @IsOptional()
  @IsMongoId()
  to_user?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Destination user display name', example: 'Dr. Jane Smith' })
  @IsOptional()
  @IsString()
  to_name?: string;

  @ApiPropertyOptional({ description: 'Destination wallet ID', example: '507f1f77bcf86cd799439022' })
  @IsOptional()
  @IsMongoId()
  to_wallet?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Type of the referenced entity', example: 'appointment' })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ description: 'ID of the referenced entity', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  reference_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'External reference (e.g. Paystack reference)', example: 'PSK_abc123def456' })
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

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Patient requested express processing' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object', example: { source: 'mobile_app' } })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for reversing a batch
 */
export class ReverseBatchDto {
  @ApiProperty({ description: 'ID of the batch to reverse', example: 'BATCH-1709012345678-abc123' })
  @IsString()
  batch_id: string;

  @ApiProperty({ description: 'Reason for the reversal', example: 'Duplicate transaction detected' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'ID of the user performing the reversal', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  performed_by?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'IP address of the requester', example: '192.168.1.100' })
  @IsOptional()
  @IsString()
  ip_address?: string;
}
