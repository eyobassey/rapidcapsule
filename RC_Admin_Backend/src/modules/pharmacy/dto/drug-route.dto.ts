import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class CreateDrugRouteDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  abbreviation?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @IsOptional()
  applicable_dosage_forms?: string[];

  @IsBoolean()
  @IsOptional()
  requires_professional?: boolean;

  @IsNumber()
  @IsOptional()
  display_order?: number;
}

export class UpdateDrugRouteDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  abbreviation?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @IsOptional()
  applicable_dosage_forms?: string[];

  @IsBoolean()
  @IsOptional()
  requires_professional?: boolean;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @IsOptional()
  display_order?: number;
}
