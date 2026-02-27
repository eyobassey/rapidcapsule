import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class ChangePromotionStatusDto {
  @ApiProperty({ description: 'Promotion ID to activate/deactivate', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  promotionId: Types.ObjectId;
}
