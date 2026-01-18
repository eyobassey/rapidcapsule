import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Age } from '../types/health-checkup.types';

export class ParseTextDto {
  @IsOptional()
  sex: string;

  @Type(() => Age)
  age: Age;
  
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  interview_token?: string;

  @IsOptional()
  extras?: {
    enable_typo_tolerance?: boolean;
    enable_enhanced_nlp?: boolean;
    enable_fuzzy_matching?: boolean;
    relaxed_parsing?: boolean;
    max_suggestions?: number;
    include_raw_mentions?: boolean;
  };
}
