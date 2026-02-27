import { IsString, IsOptional, IsMongoId, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EkaChatDto {
  @ApiProperty({
    description: 'User message to send to the Eka AI companion',
    example: 'I have been having headaches for the past 3 days',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of an existing conversation to continue',
    example: '665a1b2c3d4e5f6a7b8c9d0e',
  })
  @IsOptional()
  @IsMongoId()
  conversation_id?: string;

  @ApiPropertyOptional({
    description: 'Preferred language for the AI response (ISO 639-1 code)',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Tags to categorise the conversation (e.g. health-checkup, prescription)',
    example: ['health-checkup', 'general'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
