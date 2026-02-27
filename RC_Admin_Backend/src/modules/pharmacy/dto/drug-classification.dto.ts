import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDrugClassificationDto {
  @ApiProperty({ description: 'Classification name', example: 'Prescription Only Medicine (POM)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Unique classification code', example: 'POM' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Detailed description of this classification', example: 'Medicines that can only be sold with a valid prescription from a licensed practitioner' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Short code for display', example: 'POM' })
  @IsString()
  @IsOptional()
  short_code?: string;

  @ApiPropertyOptional({ description: 'Display colour hex code', example: '#E53935' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'ri-capsule-line' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Whether drugs in this class require a prescription', example: true })
  @IsBoolean()
  @IsOptional()
  requires_prescription?: boolean;

  @ApiPropertyOptional({ description: 'Whether drugs require pharmacist approval before dispensing', example: true })
  @IsBoolean()
  @IsOptional()
  requires_pharmacist_approval?: boolean;

  @ApiPropertyOptional({ description: 'Whether this is a controlled substance classification', example: false })
  @IsBoolean()
  @IsOptional()
  is_controlled?: boolean;

  @ApiPropertyOptional({ description: 'Whether drugs in this class are classified as poison', example: false })
  @IsBoolean()
  @IsOptional()
  is_poison?: boolean;

  @ApiPropertyOptional({ description: 'Restriction level (0 = none, higher = more restricted)', example: 2 })
  @IsNumber()
  @IsOptional()
  restriction_level?: number;

  @ApiPropertyOptional({ description: 'Special requirements for dispensing', example: ['Valid NAFDAC registration', 'ID verification'] })
  @IsArray()
  @IsOptional()
  special_requirements?: string[];

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 1 })
  @IsNumber()
  @IsOptional()
  display_order?: number;
}

export class UpdateDrugClassificationDto {
  @ApiPropertyOptional({ description: 'Classification name', example: 'Over The Counter (OTC)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Detailed description', example: 'Medicines available without prescription' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Short code for display', example: 'OTC' })
  @IsString()
  @IsOptional()
  short_code?: string;

  @ApiPropertyOptional({ description: 'Display colour hex code', example: '#43A047' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'ri-medicine-bottle-line' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Whether drugs require a prescription', example: false })
  @IsBoolean()
  @IsOptional()
  requires_prescription?: boolean;

  @ApiPropertyOptional({ description: 'Whether drugs require pharmacist approval', example: false })
  @IsBoolean()
  @IsOptional()
  requires_pharmacist_approval?: boolean;

  @ApiPropertyOptional({ description: 'Whether this is a controlled substance', example: false })
  @IsBoolean()
  @IsOptional()
  is_controlled?: boolean;

  @ApiPropertyOptional({ description: 'Whether classified as poison', example: false })
  @IsBoolean()
  @IsOptional()
  is_poison?: boolean;

  @ApiPropertyOptional({ description: 'Restriction level', example: 0 })
  @IsNumber()
  @IsOptional()
  restriction_level?: number;

  @ApiPropertyOptional({ description: 'Special requirements for dispensing', example: ['Keep records of sales'] })
  @IsArray()
  @IsOptional()
  special_requirements?: string[];

  @ApiPropertyOptional({ description: 'Whether this classification is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 2 })
  @IsNumber()
  @IsOptional()
  display_order?: number;
}
