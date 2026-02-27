import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyAppointmentTransaction {
  @ApiProperty({ description: 'Paystack payment reference to verify', example: 'ref_abc123xyz456' })
  @IsNotEmpty()
  @IsString()
  reference: string;
}
