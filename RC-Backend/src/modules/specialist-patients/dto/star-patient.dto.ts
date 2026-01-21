import { IsBoolean, IsOptional, IsString, IsArray } from 'class-validator';

export class StarPatientDto {
  @IsBoolean()
  starred: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}
