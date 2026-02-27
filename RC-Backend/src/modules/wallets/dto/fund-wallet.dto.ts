import { IsNumber, IsOptional, IsString, IsPositive, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FundWalletDto {
  @ApiProperty({
    description: 'Amount to fund wallet in NGN (minimum 100)',
    example: 5000,
  })
  @IsNumber()
  @IsPositive()
  @Min(100) // Minimum top-up amount in Naira
  amount: number;

  @ApiPropertyOptional({
    description: 'Paystack callback URL after payment completion',
    example: 'https://rapidcapsule.com/wallet/fund/callback',
  })
  @IsString()
  @IsOptional()
  callback_url?: string;
}

export class VerifyFundingDto {
  @ApiProperty({
    description: 'Paystack payment reference to verify',
    example: 'PAY-FUND-1706123456789',
  })
  @IsString()
  reference: string;
}
