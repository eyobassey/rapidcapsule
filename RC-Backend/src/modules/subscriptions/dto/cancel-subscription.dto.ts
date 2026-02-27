import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiProperty({ description: 'ID of the subscription to cancel', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  subscriptionId: Types.ObjectId;
}
