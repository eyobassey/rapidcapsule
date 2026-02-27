import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class VerifySubTransactionDto {
  @ApiProperty({ description: 'Paystack payment reference to verify', example: 'trx_ref_sub_abc123' })
  @IsNotEmpty()
  @IsString()
  reference: string;

  @ApiProperty({ description: 'ID of the subscription being paid for', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  subscriptionId: Types.ObjectId;
}
