import { IsString, IsOptional, IsEnum, IsNumber, IsDate, IsMongoId, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, ReferenceType } from '../entities/stock-transaction.entity';

export class TransactionQueryDto {
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
  batch_id?: string;

  @IsOptional()
  @IsMongoId()
  supplier_id?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(ReferenceType)
  reference_type?: ReferenceType;

  @IsOptional()
  @IsString()
  reference_number?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to_date?: Date;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  excludeReversed?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class ReverseTransactionDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
