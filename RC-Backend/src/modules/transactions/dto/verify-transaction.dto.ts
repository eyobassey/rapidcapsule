import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTransactionDto {
  @ApiProperty({ description: 'Paystack payment reference to verify', example: 'T507f1f77bcf86cd799439011_1695000000' })
  @IsNotEmpty()
  @IsString()
  reference: string;
}
