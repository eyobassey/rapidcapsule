import { IsNumber, IsOptional, IsString, IsPositive, Min } from 'class-validator';

export class FundWalletDto {
  @IsNumber()
  @IsPositive()
  @Min(100) // Minimum top-up amount in Naira
  amount: number;

  @IsString()
  @IsOptional()
  callback_url?: string;
}

export class VerifyFundingDto {
  @IsString()
  reference: string;
}
