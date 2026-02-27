import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDosageFormDto {
  @ApiProperty({ description: 'Dosage form name', example: 'Tablet' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Unique dosage form code', example: 'TAB' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Description of this dosage form', example: 'Solid oral dosage form made by compression or moulding' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'ri-medicine-bottle-line' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Default unit of measure', example: 'mg' })
  @IsString()
  @IsOptional()
  default_unit?: string;

  @ApiPropertyOptional({ description: 'Route IDs compatible with this dosage form', example: ['507f1f77bcf86cd799439011'] })
  @IsArray()
  @IsOptional()
  compatible_routes?: string[];

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 1 })
  @IsNumber()
  @IsOptional()
  display_order?: number;
}

export class UpdateDosageFormDto {
  @ApiPropertyOptional({ description: 'Dosage form name', example: 'Capsule' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of this dosage form', example: 'Solid oral dosage enclosed in a gelatin shell' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'ri-capsule-line' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Default unit of measure', example: 'mg' })
  @IsString()
  @IsOptional()
  default_unit?: string;

  @ApiPropertyOptional({ description: 'Route IDs compatible with this dosage form', example: ['507f1f77bcf86cd799439011'] })
  @IsArray()
  @IsOptional()
  compatible_routes?: string[];

  @ApiPropertyOptional({ description: 'Whether this dosage form is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 2 })
  @IsNumber()
  @IsOptional()
  display_order?: number;
}
