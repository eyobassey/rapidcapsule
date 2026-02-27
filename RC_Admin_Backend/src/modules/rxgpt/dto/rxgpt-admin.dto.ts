import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRxGPTSettingsDto {
  @ApiPropertyOptional({ description: 'Whether RxGPT prescription analysis is enabled platform-wide', example: true })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Whether specialists can access RxGPT for prescription verification', example: true })
  @IsOptional()
  @IsBoolean()
  is_enabled_for_specialists?: boolean;

  @ApiPropertyOptional({ description: 'AI model used for prescription analysis', example: 'claude-sonnet-4-20250514' })
  @IsOptional()
  @IsString()
  ai_model?: string;

  @ApiPropertyOptional({ description: 'Maximum tokens for AI response generation', example: 4000, minimum: 1000, maximum: 8000 })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(8000)
  max_tokens?: number;

  @ApiPropertyOptional({ description: 'AI temperature controlling response randomness (0 = deterministic, 1 = creative)', example: 0.3, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Credit configuration for RxGPT usage',
    example: { credits_per_analysis: 1, free_monthly_credits: 5, allow_specialist_purchase: true },
  })
  @IsOptional()
  credit_settings?: {
    credits_per_analysis?: number;
    free_monthly_credits?: number;
    allow_specialist_purchase?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Feature toggles for RxGPT analysis capabilities',
    example: { allergy_checking: true, drug_interactions: true, dosage_validation: true, alternative_suggestions: true, clinical_reasoning: true, citations: true },
  })
  @IsOptional()
  features?: {
    allergy_checking?: boolean;
    drug_interactions?: boolean;
    dosage_validation?: boolean;
    alternative_suggestions?: boolean;
    clinical_reasoning?: boolean;
    citations?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Data source toggles for prescription analysis',
    example: { use_openfda: true, use_claude_ai: true, use_local_drug_db: true, use_pubmed: false, use_nice_guidelines: false, use_bnf: false, use_who_eml: true, use_hallucination_detection: true },
  })
  @IsOptional()
  data_sources?: {
    use_openfda?: boolean;
    use_claude_ai?: boolean;
    use_local_drug_db?: boolean;
    use_pubmed?: boolean;
    use_nice_guidelines?: boolean;
    use_bnf?: boolean;
    use_who_eml?: boolean;
    use_hallucination_detection?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Threshold settings for analysis alerts and scoring',
    example: { min_confidence_score: 0.7, interaction_severity_threshold: 'moderate', max_alternatives: 5 },
  })
  @IsOptional()
  thresholds?: {
    min_confidence_score?: number;
    interaction_severity_threshold?: string;
    max_alternatives?: number;
  };

  @ApiPropertyOptional({
    description: 'Display preferences for specialist-facing analysis results',
    example: { show_citations: true, show_confidence_scores: true, show_reasoning: true, auto_expand_alerts: false },
  })
  @IsOptional()
  display?: {
    show_citations?: boolean;
    show_confidence_scores?: boolean;
    show_reasoning?: boolean;
    auto_expand_alerts?: boolean;
  };

  @ApiPropertyOptional({ description: 'Legal disclaimer text displayed below analysis results', example: 'RxGPT analysis is for informational purposes only and does not replace professional clinical judgement. Always verify with NAFDAC-approved drug references.' })
  @IsOptional()
  @IsString()
  disclaimer_text?: string;
}

export class GiftCreditsToSpecialistDto {
  @ApiProperty({ description: 'Number of RxGPT analysis credits to gift', example: 20, minimum: 1 })
  @IsNumber()
  @Min(1)
  credits: number;

  @ApiPropertyOptional({ description: 'Number of days until the gifted credits expire. If omitted, credits never expire.', example: 60, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiry_days?: number;

  @ApiProperty({ description: 'Administrative reason for gifting credits (recorded in audit log)', example: 'Onboarding bonus for newly verified specialist at Lagos University Teaching Hospital' })
  @IsString()
  reason: string;
}

export class GiftUnlimitedToSpecialistDto {
  @ApiProperty({ description: 'Number of days the unlimited RxGPT access will last', example: 30, minimum: 1 })
  @IsNumber()
  @Min(1)
  duration_days: number;

  @ApiProperty({ description: 'Administrative reason for granting unlimited access', example: 'Complimentary access for specialist participating in Rapid Capsule beta programme' })
  @IsString()
  reason: string;
}

export class RevokeCreditsDto {
  @ApiProperty({ description: 'Administrative reason for revoking the gifted credits', example: 'Specialist account flagged for review - temporarily revoking gifted credits' })
  @IsString()
  reason: string;
}

export class BulkGiftCreditsDto {
  @ApiProperty({ description: 'Array of MongoDB ObjectIds for specialists to receive credits', example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  specialist_ids: string[];

  @ApiProperty({ description: 'Number of RxGPT analysis credits to gift to each specialist', example: 15, minimum: 1 })
  @IsNumber()
  @Min(1)
  credits: number;

  @ApiPropertyOptional({ description: 'Number of days until the gifted credits expire. If omitted, credits never expire.', example: 90, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiry_days?: number;

  @ApiProperty({ description: 'Administrative reason for the bulk gift (recorded in audit log for all recipients)', example: 'Q1 2026 specialist appreciation - thank you for over 100 consultations' })
  @IsString()
  reason: string;
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Start date for the analytics period (ISO 8601)', example: '2026-01-01' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for the analytics period (ISO 8601)', example: '2026-02-27' })
  @IsOptional()
  @IsString()
  end_date?: string;
}
