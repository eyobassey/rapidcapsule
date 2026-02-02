import { IsString, IsNotEmpty, IsOptional, IsBoolean, Length } from 'class-validator';

export class CreateLanguageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 5)
  code: string;

  @IsString()
  @IsOptional()
  native_name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
