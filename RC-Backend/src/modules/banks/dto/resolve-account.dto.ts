import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveAccountDto {
  @ApiProperty({ description: 'Bank account number to resolve (NUBAN)', example: '0123456789' })
  @IsNotEmpty()
  @IsString()
  readonly account_number: string;

  @ApiProperty({ description: 'Paystack bank code for the account', example: '011' })
  @IsNotEmpty()
  @IsString()
  readonly bank_code: string;
}
