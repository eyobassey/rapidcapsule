import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNoteDto {
  @ApiPropertyOptional({
    description: 'Updated clinical note content',
    example:
      'Patient revisited. Cough resolving. Continue current medication. Follow up in 1 week if symptoms persist.',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'Whether the clinical note is finalized',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
