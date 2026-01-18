import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @IsString()
  phrase: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(130)
  age: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  max_results: number;

  @IsString()
  @IsOptional()
  sex: string;

  @IsOptional()
  @IsString()
  interview_token?: string;

  @IsOptional()
  extras?: {
    enable_typo_tolerance?: boolean;
    enable_fuzzy_matching?: boolean;
    include_synonyms?: boolean;
    relaxed_matching?: boolean;
    minimum_confidence?: number;
  };
}
