import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FinishAddPaymentMethodDto {
  @ApiProperty({
    description: 'Paystack transaction reference returned after card tokenisation',
    example: 'ref_abc123xyz456',
  })
  @IsNotEmpty()
  @IsString()
  reference: string;
}
