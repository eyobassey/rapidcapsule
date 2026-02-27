import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmOrderDto {
  @ApiProperty({ description: 'Order ID to confirm', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsString()
  orderId: Types.ObjectId;
}
