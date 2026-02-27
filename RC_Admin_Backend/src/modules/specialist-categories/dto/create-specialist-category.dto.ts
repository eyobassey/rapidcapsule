import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionalCategoryType } from '../entities/specialist-category.entity';

export class CreateSpecialistCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Cardiology' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug', example: 'cardiology' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Category description', example: 'Specialists in heart and cardiovascular conditions' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'ri-heart-pulse-line' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Professional category type', enum: ProfessionalCategoryType })
  @IsEnum(ProfessionalCategoryType)
  @IsOptional()
  professional_category?: ProfessionalCategoryType;

  @ApiPropertyOptional({ description: 'Whether this is a popular/featured category', example: true })
  @IsBoolean()
  @IsOptional()
  is_popular?: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 1 })
  @IsNumber()
  @IsOptional()
  display_order?: number;

  @ApiPropertyOptional({ description: 'Whether this category is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
