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
  @IsOptional()
  @IsEnum(PatientFilter)
  filter?: PatientFilter = PatientFilter.MY_PATIENTS;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PatientSort)
  sort?: PatientSort = PatientSort.LAST_VISIT;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
