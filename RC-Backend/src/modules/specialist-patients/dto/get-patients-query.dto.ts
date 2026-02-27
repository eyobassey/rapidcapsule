import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PatientFilter {
  MY_PATIENTS = 'my_patients',
  RECENT = 'recent',
  STARRED = 'starred',
  ALL = 'all',
}

export enum PatientSort {
  LAST_VISIT = 'last_visit',
  NAME = 'name',
  RISK_LEVEL = 'risk_level',
  CREATED = 'created',
}

export class GetPatientsQueryDto {
  @ApiPropertyOptional({ description: 'Filter patients by relationship type', enum: PatientFilter, default: PatientFilter.MY_PATIENTS, example: 'my_patients' })
  @IsOptional()
  @IsEnum(PatientFilter)
  filter?: PatientFilter = PatientFilter.MY_PATIENTS;

  @ApiPropertyOptional({ description: 'Search by patient name, email, or phone', example: 'Adaeze' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort order for results', enum: PatientSort, default: PatientSort.LAST_VISIT, example: 'last_visit' })
  @IsOptional()
  @IsEnum(PatientSort)
  sort?: PatientSort = PatientSort.LAST_VISIT;

  @ApiPropertyOptional({ description: 'Page number', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Results per page', default: 20, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
