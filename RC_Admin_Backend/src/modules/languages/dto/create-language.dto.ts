import { IsString, IsNotEmpty, IsOptional, IsBoolean, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLanguageDto {
  @ApiProperty({ description: 'Language name in English', example: 'Yoruba' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'ISO language code (2-5 characters)', example: 'yo', minLength: 2, maxLength: 5 })
  @IsString()
  @IsNotEmpty()
  @Length(2, 5)
  code: string;

  @ApiPropertyOptional({ description: 'Name in the native language', example: 'Èdè Yorùbá' })
  @IsString()
  @IsOptional()
  native_name?: string;

  @ApiPropertyOptional({ description: 'Whether this language is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
