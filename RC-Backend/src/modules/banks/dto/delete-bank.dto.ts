import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteBankDto {
  @ApiProperty({ description: 'ID of the bank account to delete', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  readonly bankId: Types.ObjectId;
}
