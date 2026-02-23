import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class UploadAttachmentDto {
  @ApiProperty({ enum: [MessageType.IMAGE, MessageType.FILE, MessageType.VIDEO, MessageType.VOICE_NOTE] })
  @IsEnum(MessageType)
  @IsNotEmpty()
  type: MessageType;

  @ApiPropertyOptional({ description: 'Optional text caption' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds for voice/video' })
  @IsOptional()
  @IsNumber()
  duration_seconds?: number;

  @ApiPropertyOptional({ description: 'ID of the message being replied to' })
  @IsOptional()
  @IsString()
  reply_to?: string;
}
