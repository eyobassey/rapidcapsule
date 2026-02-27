import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryVitalDto {
  @ApiPropertyOptional({ description: 'Vital field(s) to select (e.g., "blood_pressure" or ["blood_pressure", "pulse_rate"])', example: 'blood_pressure' })
  @IsOptional()
  readonly fieldsToSelect: string | string[];
}
