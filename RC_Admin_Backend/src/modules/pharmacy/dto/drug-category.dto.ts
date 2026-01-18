import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateDrugCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  code?: string; // Will be auto-generated from name if not provided

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsNumber()
  @IsOptional()
  display_order?: number;
}

export class UpdateDrugCategoryDto {
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
  image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @IsOptional()
  display_order?: number;
}
