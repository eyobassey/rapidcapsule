import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class DrugImageDto {
  @IsString()
  url: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @IsString()
  @IsOptional()
  alt_text?: string;
}

export class UpdateDrugImagesDto {
  @IsArray()
  images: DrugImageDto[];
}

export class SetPrimaryImageDto {
  @IsString()
  image_url: string;
}

export class DeleteDrugImageDto {
  @IsString()
  image_url: string;
}
