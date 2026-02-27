import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { RecipientType } from '../entities/bank.entity';

export class CreateBankDto {
  @ApiProperty({ description: 'Bank account number (NUBAN)', example: '0123456789' })
  @IsNotEmpty()
  @IsString()
  readonly account_number: string;

  @ApiProperty({ description: 'Account holder name as registered with the bank', example: 'Adaeze Obi' })
  @IsNotEmpty()
  @IsString()
  readonly account_name: string;

  @ApiProperty({ description: 'Name of the bank', example: 'First Bank of Nigeria' })
  @IsNotEmpty()
  @IsString()
  readonly bank_name: string;

  @ApiProperty({ description: 'Paystack bank code', example: '011' })
  @IsNotEmpty()
  @IsString()
  readonly bank_code: string;

  @ApiProperty({ description: 'Paystack recipient type', example: 'nuban', enum: ['nuban', 'ghipss', 'mobile_money', 'basa'] })
  @IsNotEmpty()
  @IsString()
  readonly recipient_type: RecipientType;
}
