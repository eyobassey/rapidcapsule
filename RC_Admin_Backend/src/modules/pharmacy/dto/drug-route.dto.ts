import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDrugRouteDto {
  @ApiProperty({ description: 'Route of administration name', example: 'Oral' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Unique route code', example: 'PO' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Description of this route', example: 'Administered by mouth' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Medical abbreviation', example: 'PO' })
  @IsString()
  @IsOptional()
  abbreviation?: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'ri-capsule-line' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Dosage form IDs compatible with this route', example: ['507f1f77bcf86cd799439011'] })
  @IsArray()
  @IsOptional()
  applicable_dosage_forms?: string[];

  @ApiPropertyOptional({ description: 'Whether this route requires a healthcare professional to administer', example: false })
  @IsBoolean()
  @IsOptional()
  requires_professional?: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 1 })
  @IsNumber()
  @IsOptional()
  display_order?: number;
}

export class UpdateDrugRouteDto {
  @ApiPropertyOptional({ description: 'Route of administration name', example: 'Intravenous' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of this route', example: 'Administered directly into the vein' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Medical abbreviation', example: 'IV' })
  @IsString()
  @IsOptional()
  abbreviation?: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'ri-syringe-line' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Dosage form IDs compatible with this route', example: ['507f1f77bcf86cd799439011'] })
  @IsArray()
  @IsOptional()
  applicable_dosage_forms?: string[];

  @ApiPropertyOptional({ description: 'Whether this route requires a healthcare professional', example: true })
  @IsBoolean()
  @IsOptional()
  requires_professional?: boolean;

  @ApiPropertyOptional({ description: 'Whether this route is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 3 })
  @IsNumber()
  @IsOptional()
  display_order?: number;
}
