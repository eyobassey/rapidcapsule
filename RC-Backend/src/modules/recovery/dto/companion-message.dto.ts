import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanionMessageDto {
  @ApiProperty({
    description: 'The message text to send to the AI recovery companion',
    example: 'I am feeling strong cravings this evening and I do not know what to do',
  })
  @IsNotEmpty()
  @IsString()
  readonly message: string;
}

export class StartCompanionDto {
  @ApiPropertyOptional({
    description: 'Optional context to prime the conversation (e.g. current mood, situation, or reason for reaching out)',
    example: 'I just had a difficult day at work and I am worried about relapsing',
  })
  @IsOptional()
  @IsString()
  readonly context?: string;
}
