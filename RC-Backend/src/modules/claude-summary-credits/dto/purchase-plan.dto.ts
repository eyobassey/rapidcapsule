import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchasePlanDto {
  @ApiProperty({ description: 'ID of the credit plan to purchase', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  plan_id: string;
}
