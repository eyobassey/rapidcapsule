import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DrugImageDto {
  @ApiProperty({ description: 'Image URL', example: 'https://s3.amazonaws.com/rapidcapsules/pharmacy/drugs/paracetamol-500mg.png' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary display image', example: true })
  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @ApiPropertyOptional({ description: 'Alt text for accessibility', example: 'Paracetamol 500mg tablet blister pack' })
  @IsString()
  @IsOptional()
  alt_text?: string;
}

export class UpdateDrugImagesDto {
  @ApiProperty({ description: 'Array of drug images', type: [DrugImageDto] })
  @IsArray()
  images: DrugImageDto[];
}

export class SetPrimaryImageDto {
  @ApiProperty({ description: 'URL of the image to set as primary', example: 'https://s3.amazonaws.com/rapidcapsules/pharmacy/drugs/amoxicillin-250mg.png' })
  @IsString()
  image_url: string;
}

export class DeleteDrugImageDto {
  @ApiProperty({ description: 'URL of the image to delete', example: 'https://s3.amazonaws.com/rapidcapsules/pharmacy/drugs/old-image.png' })
  @IsString()
  image_url: string;
}
