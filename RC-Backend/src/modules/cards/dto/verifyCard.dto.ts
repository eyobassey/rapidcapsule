import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyCardDto {
  @ApiProperty({ description: 'Paystack transaction reference to verify card addition', example: 'trx_ref_abc123def456' })
  @IsNotEmpty()
  @IsString()
  reference: string;
}
