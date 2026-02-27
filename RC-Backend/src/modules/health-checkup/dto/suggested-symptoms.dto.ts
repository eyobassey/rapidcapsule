import { IsArray, IsOptional, IsString } from 'class-validator';
import { Age } from '../types/health-checkup.types';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuggestedSymptomsDto {
  @ApiPropertyOptional({ description: 'Patient biological sex', example: 'female', enum: ['male', 'female'] })
  @IsOptional()
  sex: string;

  @ApiProperty({ description: 'Patient age', example: { value: 32 } })
  @Type(() => Age)
  age: Age;

  @ApiProperty({ description: 'Current evidence (symptoms already reported)', example: [{ id: 's_21', choice_id: 'present', source: 'initial' }] })
  @IsArray()
  evidence: any[];

  @ApiPropertyOptional({ description: 'Infermedica interview token', example: 'itk_abc123' })
  @IsOptional()
  @IsString()
  interview_token?: string;
}
