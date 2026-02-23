import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @ApiProperty({ enum: MessageType, description: 'Type of message' })
  @IsEnum(MessageType)
  @IsNotEmpty()
  type: MessageType;

  @ApiProperty({ description: 'Text content of the message', maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'ID of the message being replied to' })
  @IsOptional()
  @IsString()
  reply_to?: string;
}
