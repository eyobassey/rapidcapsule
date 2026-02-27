import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SpecialistTransactionType,
  SpecialistTransactionReference,
} from '../entities/specialist-wallet-transaction.entity';

export class TopUpWalletDto {
  @ApiProperty({
    description: 'Amount to top up in NGN (minimum 100)',
    example: 5000,
  })
  @IsNumber()
  @IsPositive()
  @Min(100) // Minimum top-up amount
  amount: number;

  @ApiPropertyOptional({
    description: 'Paystack callback URL after payment completion',
    example: 'https://rapidcapsule.com/specialist/wallet/topup/callback',
  })
  @IsString()
  @IsOptional()
  callback_url?: string;
}

export class VerifyTopUpDto {
  @ApiProperty({
    description: 'Paystack payment reference to verify',
    example: 'PAY-TOP-1706123456789',
  })
  @IsString()
  reference: string;
}

export class DebitWalletDto {
  @ApiProperty({
    description: 'Amount to debit from wallet in NGN',
    example: 3500,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Type of transaction reference',
    enum: SpecialistTransactionReference,
    example: SpecialistTransactionReference.PRESCRIPTION,
  })
  @IsEnum(SpecialistTransactionReference)
  reference_type: SpecialistTransactionReference;

  @ApiPropertyOptional({
    description: 'ID of the related resource (e.g. prescription or appointment)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  reference_id?: string;

  @ApiProperty({
    description: 'Human-readable description of the debit transaction',
    example: 'Payment for prescription #RX-20260101-0012',
  })
  @IsString()
  description: string;
}

export class HoldFundsDto {
  @ApiProperty({
    description: 'Amount to hold in NGN',
    example: 7500,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Prescription ID for which funds are being held',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  reference_id: string; // Prescription ID

  @ApiPropertyOptional({
    description: 'Optional description for the hold',
    example: 'Funds held for pending prescription fulfilment',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class ReleaseFundsDto {
  @ApiProperty({
    description: 'Prescription ID for which held funds should be released',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  reference_id: string; // Prescription ID

  @ApiPropertyOptional({
    description: 'Reason for releasing the held funds',
    example: 'Prescription cancelled by patient',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ConfirmHoldDto {
  @ApiProperty({
    description: 'Prescription ID to confirm the hold and complete the debit',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  reference_id: string; // Prescription ID
}

export class SpecialistWithdrawDto {
  @ApiProperty({
    description: 'ID of the saved bank account to withdraw to',
    example: '507f1f77bcf86cd799439022',
  })
  @IsString()
  @IsNotEmpty()
  bankId: string;

  @ApiProperty({
    description: 'Amount to withdraw in NGN (minimum 100)',
    example: 15000,
  })
  @IsNumber()
  @IsPositive()
  @Min(100)
  amount: number;
}

export class SpecialistWalletTransactionQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 20,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: SpecialistTransactionType,
    example: SpecialistTransactionType.CREDIT,
  })
  @IsEnum(SpecialistTransactionType)
  @IsOptional()
  type?: SpecialistTransactionType;

  @ApiPropertyOptional({
    description: 'Filter by transaction reference type',
    enum: SpecialistTransactionReference,
    example: SpecialistTransactionReference.TOPUP,
  })
  @IsEnum(SpecialistTransactionReference)
  @IsOptional()
  reference_type?: SpecialistTransactionReference;

  @ApiPropertyOptional({
    description: 'Filter transactions from this date (ISO 8601)',
    example: '2026-01-01',
  })
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Filter transactions up to this date (ISO 8601)',
    example: '2026-02-28',
  })
  @IsString()
  @IsOptional()
  end_date?: string;
}

export class AdminCreditWalletDto {
  @ApiProperty({
    description: 'ID of the specialist to credit',
    example: '507f1f77bcf86cd799439033',
  })
  @IsString()
  specialist_id: string;

  @ApiProperty({
    description: 'Amount to credit in NGN',
    example: 10000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Reason for the admin credit',
    example: 'Bonus payment for completed consultations',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Internal admin notes',
    example: 'Approved by Dr. Adeyemi on 2026-02-15',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AdminDebitWalletDto {
  @ApiProperty({
    description: 'ID of the specialist to debit',
    example: '507f1f77bcf86cd799439033',
  })
  @IsString()
  specialist_id: string;

  @ApiProperty({
    description: 'Amount to debit in NGN',
    example: 2500,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Reason for the admin debit',
    example: 'Reversal of duplicate payment',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Internal admin notes',
    example: 'Debit authorized per support ticket #4521',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
