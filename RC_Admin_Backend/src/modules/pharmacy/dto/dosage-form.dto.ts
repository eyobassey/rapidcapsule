import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class CreateDosageFormDto {
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
  icon?: string;

  @IsString()
  @IsOptional()
  default_unit?: string;

  @IsArray()
  @IsOptional()
  compatible_routes?: string[];

  @IsNumber()
  @IsOptional()
  display_order?: number;
}

export class UpdateDosageFormDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  default_unit?: string;

  @IsArray()
  @IsOptional()
  compatible_routes?: string[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @IsOptional()
  display_order?: number;
}
