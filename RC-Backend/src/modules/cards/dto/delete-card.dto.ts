import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteCardDto {
  @ApiProperty({ description: 'ID of the card to delete', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  cardId: string;
}
