import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ProfessionalCategoryType } from '../entities/specialist-category.entity';

export class CreateSpecialistCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsEnum(ProfessionalCategoryType)
  @IsOptional()
  professional_category?: ProfessionalCategoryType;

  @IsBoolean()
  @IsOptional()
  is_popular?: boolean;

  @IsNumber()
  @IsOptional()
  display_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
