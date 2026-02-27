import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExtendedDiagnosisDto {
  @ApiProperty({ description: 'Infermedica interview token from the active session', example: 'itk_abc123' })
  @IsString()
  interview_token: string;

  @ApiPropertyOptional({ description: 'Minimum probability threshold (0.01-1.0). Lower values return more conditions.', example: 0.01, default: 0.01 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(1)
  min_probability?: number = 0.01;

  @ApiPropertyOptional({ description: 'Maximum number of conditions to return (10-50)', example: 30, default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(50)
  limit?: number = 30;
}