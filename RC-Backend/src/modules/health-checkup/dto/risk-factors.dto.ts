import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RiskFactorsDto {
  @ApiProperty({ description: 'Patient age in years (minimum 12)', example: 35 })
  @IsNotEmpty()
  @IsNumber()
  age: number;

  @ApiPropertyOptional({ description: 'Infermedica interview token', example: 'itk_abc123' })
  @IsOptional()
  @IsString()
  interview_token?: string;
}
