import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManufacturerDto {
  @ApiProperty({ description: 'Manufacturer name', example: 'Emzor Pharmaceutical Industries' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Unique manufacturer code', example: 'EMZOR' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Short display name', example: 'Emzor' })
  @IsString()
  @IsOptional()
  short_name?: string;

  @ApiPropertyOptional({ description: 'Country of origin', example: 'Nigeria' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Manufacturer website', example: 'https://emzorpharma.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Logo image URL', example: 'https://s3.amazonaws.com/rapidcapsules/manufacturers/emzor-logo.png' })
  @IsString()
  @IsOptional()
  logo_url?: string;

  @ApiPropertyOptional({ description: 'Description of the manufacturer', example: 'Leading Nigerian pharmaceutical manufacturer established in 1977' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the manufacturer is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 1 })
  @IsNumber()
  @IsOptional()
  display_order?: number;
}

export class UpdateManufacturerDto {
  @ApiPropertyOptional({ description: 'Manufacturer name', example: 'GlaxoSmithKline Nigeria' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Short display name', example: 'GSK' })
  @IsString()
  @IsOptional()
  short_name?: string;

  @ApiPropertyOptional({ description: 'Country of origin', example: 'United Kingdom' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Manufacturer website', example: 'https://www.gsk.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Logo image URL', example: 'https://s3.amazonaws.com/rapidcapsules/manufacturers/gsk-logo.png' })
  @IsString()
  @IsOptional()
  logo_url?: string;

  @ApiPropertyOptional({ description: 'Description of the manufacturer', example: 'Global pharmaceutical and healthcare company' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the manufacturer is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting', example: 2 })
  @IsNumber()
  @IsOptional()
  display_order?: number;
}
