import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartOrderPaymentDto {
  @ApiProperty({ description: 'Payment amount in smallest currency unit (e.g., kobo)', example: 25000 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
