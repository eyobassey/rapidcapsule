import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Age } from '../types/health-checkup.types';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExplainConditionDto {
  @ApiPropertyOptional({ description: 'Patient biological sex', example: 'female', enum: ['male', 'female'] })
  @IsOptional()
  sex: string;

  @ApiProperty({ description: 'Patient age', example: { value: 32 } })
  @Type(() => Age)
  age: Age;

  @ApiProperty({ description: 'Condition ID to explain (Infermedica condition code)', example: 'c_87' })
  @IsNotEmpty()
  @IsString()
  target: string;

  @ApiProperty({ description: 'Current evidence used for the explanation context', example: [{ id: 's_21', choice_id: 'present' }] })
  @IsArray()
  evidence: any[];

  @ApiPropertyOptional({ description: 'Infermedica interview token', example: 'itk_abc123' })
  @IsOptional()
  @IsString()
  interview_token?: string;
}
