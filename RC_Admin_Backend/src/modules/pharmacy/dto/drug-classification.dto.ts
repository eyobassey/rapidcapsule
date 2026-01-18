import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class CreateDrugClassificationDto {
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
  short_code?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  requires_prescription?: boolean;

  @IsBoolean()
  @IsOptional()
  requires_pharmacist_approval?: boolean;

  @IsBoolean()
  @IsOptional()
  is_controlled?: boolean;

  @IsBoolean()
  @IsOptional()
  is_poison?: boolean;

  @IsNumber()
  @IsOptional()
  restriction_level?: number;

  @IsArray()
  @IsOptional()
  special_requirements?: string[];

  @IsNumber()
  @IsOptional()
  display_order?: number;
}

export class UpdateDrugClassificationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  short_code?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  requires_prescription?: boolean;

  @IsBoolean()
  @IsOptional()
  requires_pharmacist_approval?: boolean;

  @IsBoolean()
  @IsOptional()
  is_controlled?: boolean;

  @IsBoolean()
  @IsOptional()
  is_poison?: boolean;

  @IsNumber()
  @IsOptional()
  restriction_level?: number;

  @IsArray()
  @IsOptional()
  special_requirements?: string[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @IsOptional()
  display_order?: number;
}
