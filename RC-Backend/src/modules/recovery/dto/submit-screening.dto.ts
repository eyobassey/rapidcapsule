import { IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitScreeningDto {
  @ApiProperty({
    description: 'Map of question identifiers to numeric answer values. Keys are question IDs (e.g. "q1", "q2") and values are the selected option scores.',
    example: { q1: 2, q2: 1, q3: 0, q4: 3, q5: 1, q6: 0, q7: 2, q8: 1, q9: 0, q10: 1 },
  })
  @IsNotEmpty()
  @IsObject()
  readonly answers: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Time in milliseconds the patient spent completing the screening',
    example: 145000,
  })
  @IsOptional()
  @IsNumber()
  readonly duration_ms?: number;
}
