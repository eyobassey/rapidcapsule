import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MakeCardDefaultDto {
  @ApiProperty({ description: 'ID of the card to set as default payment method', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  cardId: string;
}
