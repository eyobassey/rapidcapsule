import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { Recurrence } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'ID of the subscription plan to subscribe to', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  planId: Types.ObjectId;

  @ApiProperty({ description: 'ID of the saved payment card to charge', example: '507f1f77bcf86cd799439012' })
  @IsNotEmpty()
  @IsString()
  cardId: Types.ObjectId;

  @ApiProperty({ description: 'Billing recurrence period', enum: Recurrence, example: 'monthly' })
  @IsNotEmpty()
  @IsEnum(Recurrence)
  recurrence: Recurrence;
}
