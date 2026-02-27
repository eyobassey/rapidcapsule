import { Types } from 'mongoose';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawFundDto {
  @ApiProperty({
    description: 'ID of the saved bank account to withdraw to',
    example: '507f1f77bcf86cd799439022',
  })
  @IsNotEmpty()
  @IsString()
  bankId: Types.ObjectId;

  @ApiProperty({
    description: 'Amount to withdraw in NGN',
    example: 15000,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
