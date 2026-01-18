import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SpecialistTransactionType,
  SpecialistTransactionReference,
} from '../entities/specialist-wallet-transaction.entity';

export class TopUpWalletDto {
  @IsNumber()
  @IsPositive()
  @Min(100) // Minimum top-up amount
  amount: number;

  @IsString()
  @IsOptional()
  callback_url?: string;
}

export class VerifyTopUpDto {
  @IsString()
  reference: string;
}

export class DebitWalletDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(SpecialistTransactionReference)
  reference_type: SpecialistTransactionReference;

  @IsString()
  @IsOptional()
  reference_id?: string;

  @IsString()
  description: string;
}

export class HoldFundsDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  reference_id: string; // Prescription ID

  @IsString()
  @IsOptional()
  description?: string;
}

export class ReleaseFundsDto {
  @IsString()
  reference_id: string; // Prescription ID

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ConfirmHoldDto {
  @IsString()
  reference_id: string; // Prescription ID
}

export class SpecialistWalletTransactionQueryDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsEnum(SpecialistTransactionType)
  @IsOptional()
  type?: SpecialistTransactionType;

  @IsEnum(SpecialistTransactionReference)
  @IsOptional()
  reference_type?: SpecialistTransactionReference;

  @IsString()
  @IsOptional()
  start_date?: string;

  @IsString()
  @IsOptional()
  end_date?: string;
}

export class AdminCreditWalletDto {
  @IsString()
  specialist_id: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class AdminDebitWalletDto {
  @IsString()
  specialist_id: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
