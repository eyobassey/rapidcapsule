import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDrugCategoryDto {
  @ApiProperty({ description: 'Drug category name', example: 'Analgesics & Antipyretics' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Unique category code (auto-generated from name if not provided)', example: 'ANALGESICS' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Description of the category', example: 'Pain relievers and fever reducers including paracetamol, ibuprofen, and aspirin' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'ri-heart-pulse-line' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Category image URL', example: 'https://s3.amazonaws.com/rapidcapsules/categories/analgesics.png' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 1 })
  @IsNumber()
  @IsOptional()
  display_order?: number;
}

export class UpdateDrugCategoryDto {
  @ApiPropertyOptional({ description: 'Drug category name', example: 'Antibiotics' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the category', example: 'Anti-infective agents for treating bacterial infections' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'ri-bug-line' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Category image URL', example: 'https://s3.amazonaws.com/rapidcapsules/categories/antibiotics.png' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({ description: 'Whether this category is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 3 })
  @IsNumber()
  @IsOptional()
  display_order?: number;
}
