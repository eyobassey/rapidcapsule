import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, Max } from 'class-validator';

export class UpdateRxGPTSettingsDto {
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  is_enabled_for_specialists?: boolean;

  @IsOptional()
  @IsString()
  ai_model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(8000)
  max_tokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsOptional()
  credit_settings?: {
    credits_per_analysis?: number;
    free_monthly_credits?: number;
    allow_specialist_purchase?: boolean;
  };

  @IsOptional()
  features?: {
    allergy_checking?: boolean;
    drug_interactions?: boolean;
    dosage_validation?: boolean;
    alternative_suggestions?: boolean;
    clinical_reasoning?: boolean;
    citations?: boolean;
  };

  @IsOptional()
  data_sources?: {
    use_openfda?: boolean;
    use_claude_ai?: boolean;
    use_local_drug_db?: boolean;
  };

  @IsOptional()
  thresholds?: {
    min_confidence_score?: number;
    interaction_severity_threshold?: string;
    max_alternatives?: number;
  };

  @IsOptional()
  display?: {
    show_citations?: boolean;
    show_confidence_scores?: boolean;
    show_reasoning?: boolean;
    auto_expand_alerts?: boolean;
  };

  @IsOptional()
  @IsString()
  disclaimer_text?: string;
}

export class GiftCreditsToSpecialistDto {
  @IsNumber()
  @Min(1)
  credits: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expiry_days?: number;

  @IsString()
  reason: string;
}

export class GiftUnlimitedToSpecialistDto {
  @IsNumber()
  @Min(1)
  duration_days: number;

  @IsString()
  reason: string;
}

export class RevokeCreditsDto {
  @IsString()
  reason: string;
}

export class BulkGiftCreditsDto {
  @IsArray()
  @IsString({ each: true })
  specialist_ids: string[];

  @IsNumber()
  @Min(1)
  credits: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expiry_days?: number;

  @IsString()
  reason: string;
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;
}
