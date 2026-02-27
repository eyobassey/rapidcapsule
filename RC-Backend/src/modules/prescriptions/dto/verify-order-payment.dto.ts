import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOrderPaymentDto {
  @ApiProperty({ description: 'Paystack payment reference to verify', example: 'ref_abc123xyz456' })
  @IsNotEmpty()
  @IsString()
  reference: string;

  @ApiProperty({ description: 'Order ID the payment is for', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsString()
  orderId: Types.ObjectId;
}
