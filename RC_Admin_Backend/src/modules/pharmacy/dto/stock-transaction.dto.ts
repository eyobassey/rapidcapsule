import { IsString, IsOptional, IsEnum, IsNumber, IsDate, IsMongoId, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionType, ReferenceType } from '../entities/stock-transaction.entity';

export class TransactionQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Results per page', example: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by drug ID', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  drug_id?: string;

  @ApiPropertyOptional({ description: 'Filter by stock batch ID', example: '507f1f77bcf86cd799439012' })
  @IsOptional()
  @IsMongoId()
  batch_id?: string;

  @ApiPropertyOptional({ description: 'Filter by supplier ID', example: '507f1f77bcf86cd799439013' })
  @IsOptional()
  @IsMongoId()
  supplier_id?: string;

  @ApiPropertyOptional({ description: 'Filter by transaction type', enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ description: 'Filter by reference type', enum: ReferenceType })
  @IsOptional()
  @IsEnum(ReferenceType)
  reference_type?: ReferenceType;

  @ApiPropertyOptional({ description: 'Filter by reference number', example: 'PO-2025-001' })
  @IsOptional()
  @IsString()
  reference_number?: string;

  @ApiPropertyOptional({ description: 'Start date filter', example: '2025-01-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from_date?: Date;

  @ApiPropertyOptional({ description: 'End date filter', example: '2025-12-31' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to_date?: Date;

  @ApiPropertyOptional({ description: 'Exclude reversed transactions', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  excludeReversed?: boolean;

  @ApiPropertyOptional({ description: 'Field to sort by', example: 'created_at' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class ReverseTransactionDto {
  @ApiProperty({ description: 'Reason for reversing this transaction', example: 'Incorrect quantity recorded during stock receipt' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Corrected to 50 units from 500' })
  @IsOptional()
  @IsString()
  notes?: string;
}
