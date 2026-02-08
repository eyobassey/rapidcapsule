import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

// ============ ENUMS ============

export enum RxGPTAlertType {
  ALLERGY = 'allergy',
  INTERACTION = 'interaction',
  CONTRAINDICATION = 'contraindication',
  DOSAGE = 'dosage',
  AGE = 'age',
  PREGNANCY = 'pregnancy',
}

export enum RxGPTAlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum RxGPTRiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RxGPTRecommendationType {
  SUGGESTED_DRUG = 'suggested_drug',
  DOSAGE_ADJUSTMENT = 'dosage_adjustment',
  ALTERNATIVE = 'alternative',
  MONITORING = 'monitoring',
}

export enum RxGPTPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// ============ NESTED DTOs ============

export class ProposedDrugDto {
  @IsString()
  @IsOptional()
  drug_id?: string; // Optional for external medications

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  generic_name?: string;

  @IsString()
  @IsNotEmpty()
  strength: string;

  @IsString()
  @IsNotEmpty()
  dosage: string;

  @IsString()
  @IsNotEmpty()
  frequency: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  duration_days?: number;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class PatientAllergyDto {
  @IsString()
  @IsNotEmpty()
  allergen: string;

  @IsString()
  @IsOptional()
  reaction?: string;

  @IsString()
  @IsOptional()
  severity?: string;
}

export class CurrentMedicationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

// ============ ANALYZE REQUEST ============

export class RxGPTAnalyzeDto {
  @IsMongoId()
  @IsNotEmpty()
  patient_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedDrugDto)
  proposed_drugs: ProposedDrugDto[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_appointments?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_clinical_notes?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_health_checkups?: string[];

  @IsBoolean()
  @IsOptional()
  include_alternatives?: boolean;

  @IsBoolean()
  @IsOptional()
  skip_cache?: boolean;
}

export class RxGPTQuickCheckDto {
  @IsMongoId()
  @IsNotEmpty()
  patient_id: string;

  @IsString()
  @IsNotEmpty()
  drug_name: string;

  @IsString()
  @IsOptional()
  generic_name?: string;

  @IsString()
  @IsOptional()
  strength?: string;

  @IsString()
  @IsOptional()
  dosage?: string;
}

// ============ RESPONSE DTOs ============

export class RxGPTAlertDto {
  @IsEnum(RxGPTAlertType)
  type: RxGPTAlertType;

  @IsEnum(RxGPTAlertSeverity)
  severity: RxGPTAlertSeverity;

  @IsString()
  drug_name: string;

  @IsString()
  message: string;

  @IsString()
  reasoning: string;

  @IsString()
  @IsOptional()
  citation?: string;

  @IsString()
  action_required: string;
}

export class RxGPTRecommendationDto {
  @IsEnum(RxGPTRecommendationType)
  type: RxGPTRecommendationType;

  @IsString()
  @IsOptional()
  drug_name?: string;

  @IsString()
  recommendation: string;

  @IsString()
  reasoning: string;

  @IsArray()
  @IsString({ each: true })
  citations: string[];

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;

  @IsEnum(RxGPTPriority)
  priority: RxGPTPriority;
}

export class DrugAnalysisDto {
  @IsString()
  @IsOptional()
  drug_id?: string; // Optional for external medications

  @IsString()
  drug_name: string;

  @IsBoolean()
  is_appropriate: boolean;

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;

  @IsString()
  reasoning: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RxGPTAlertDto)
  alerts: RxGPTAlertDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  citations?: string[];
}

export class RxGPTResponseDto {
  @IsBoolean()
  is_safe: boolean;

  @IsEnum(RxGPTRiskLevel)
  overall_risk_level: RxGPTRiskLevel;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RxGPTAlertDto)
  alerts: RxGPTAlertDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RxGPTRecommendationDto)
  recommendations: RxGPTRecommendationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrugAnalysisDto)
  drug_analyses: DrugAnalysisDto[];

  @IsString()
  clinical_summary: string;

  @IsString()
  disclaimer: string;

  generated_at: Date;

  @IsString()
  model: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence_score: number;

  @IsNumber()
  credits_used: number;

  @IsNumber()
  credits_remaining: number;

  @IsBoolean()
  @IsOptional()
  cached?: boolean;

  @IsOptional()
  warning?: {
    level: 'low' | 'critical';
    message: string;
    credits_remaining: number;
  };
}

// ============ SETTINGS DTOs ============

export class RxGPTCreditSettingsDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  credits_per_analysis?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  free_monthly_credits?: number;

  @IsBoolean()
  @IsOptional()
  allow_specialist_purchase?: boolean;
}

export class RxGPTFeaturesDto {
  @IsBoolean()
  @IsOptional()
  allergy_checking?: boolean;

  @IsBoolean()
  @IsOptional()
  drug_interactions?: boolean;

  @IsBoolean()
  @IsOptional()
  dosage_validation?: boolean;

  @IsBoolean()
  @IsOptional()
  alternative_suggestions?: boolean;

  @IsBoolean()
  @IsOptional()
  clinical_reasoning?: boolean;

  @IsBoolean()
  @IsOptional()
  citations?: boolean;
}

export class RxGPTDataSourcesDto {
  @IsBoolean()
  @IsOptional()
  use_openfda?: boolean;

  @IsBoolean()
  @IsOptional()
  use_claude_ai?: boolean;

  @IsBoolean()
  @IsOptional()
  use_local_drug_db?: boolean;
}

export class RxGPTThresholdsDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  min_confidence_score?: number;

  @IsString()
  @IsOptional()
  interaction_severity_threshold?: 'low' | 'moderate' | 'high';

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  max_alternatives?: number;
}

export class RxGPTDisplayDto {
  @IsBoolean()
  @IsOptional()
  show_citations?: boolean;

  @IsBoolean()
  @IsOptional()
  show_confidence_scores?: boolean;

  @IsBoolean()
  @IsOptional()
  show_reasoning?: boolean;

  @IsBoolean()
  @IsOptional()
  auto_expand_alerts?: boolean;
}

export class RxGPTUsageLimitsDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  daily_limit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  monthly_limit?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(60)
  rate_limit_per_minute?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  low_credit_warning_threshold?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  critical_credit_warning_threshold?: number;
}

export class UpdateRxGPTSettingsDto {
  @IsBoolean()
  @IsOptional()
  is_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  is_enabled_for_specialists?: boolean;

  @IsString()
  @IsOptional()
  ai_model?: string;

  @IsNumber()
  @IsOptional()
  @Min(256)
  @Max(16384)
  max_tokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ValidateNested()
  @Type(() => RxGPTCreditSettingsDto)
  @IsOptional()
  credit_settings?: RxGPTCreditSettingsDto;

  @ValidateNested()
  @Type(() => RxGPTFeaturesDto)
  @IsOptional()
  features?: RxGPTFeaturesDto;

  @ValidateNested()
  @Type(() => RxGPTDataSourcesDto)
  @IsOptional()
  data_sources?: RxGPTDataSourcesDto;

  @ValidateNested()
  @Type(() => RxGPTThresholdsDto)
  @IsOptional()
  thresholds?: RxGPTThresholdsDto;

  @ValidateNested()
  @Type(() => RxGPTDisplayDto)
  @IsOptional()
  display?: RxGPTDisplayDto;

  @ValidateNested()
  @Type(() => RxGPTUsageLimitsDto)
  @IsOptional()
  usage_limits?: RxGPTUsageLimitsDto;

  @IsString()
  @IsOptional()
  disclaimer_text?: string;
}

// ============ FEEDBACK DTOs ============

export enum RxGPTFeedbackRatingEnum {
  HELPFUL = 'helpful',
  NOT_HELPFUL = 'not_helpful',
  INCORRECT = 'incorrect',
  MISSED_ISSUE = 'missed_issue',
  TOO_CAUTIOUS = 'too_cautious',
}

export enum RxGPTActionTakenEnum {
  PROCEEDED_AS_IS = 'proceeded_as_is',
  MODIFIED_PRESCRIPTION = 'modified_prescription',
  CANCELLED_PRESCRIPTION = 'cancelled_prescription',
  SOUGHT_SECOND_OPINION = 'sought_second_opinion',
}

export class DrugFeedbackDto {
  @IsString()
  @IsNotEmpty()
  drug_name: string;

  @IsBoolean()
  was_appropriate: boolean;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class SubmitRxGPTFeedbackDto {
  @IsMongoId()
  @IsNotEmpty()
  analysis_id: string;

  @IsEnum(RxGPTFeedbackRatingEnum)
  rating: RxGPTFeedbackRatingEnum;

  @IsBoolean()
  @IsOptional()
  safety_assessment_correct?: boolean;

  @IsBoolean()
  @IsOptional()
  alerts_relevant?: boolean;

  @IsBoolean()
  @IsOptional()
  recommendations_useful?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrugFeedbackDto)
  @IsOptional()
  drug_feedback?: DrugFeedbackDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  missed_issues?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  false_positives?: string[];

  @IsString()
  @IsOptional()
  comments?: string;

  @IsEnum(RxGPTActionTakenEnum)
  @IsOptional()
  action_taken?: RxGPTActionTakenEnum;

  @IsString()
  @IsOptional()
  modifications_made?: string;
}

// ============ ANALYTICS DTOs ============

export class RxGPTAnalyticsQueryDto {
  @IsString()
  @IsOptional()
  start_date?: string;

  @IsString()
  @IsOptional()
  end_date?: string;

  @IsMongoId()
  @IsOptional()
  specialist_id?: string;
}

export class RxGPTAnalyticsSummaryDto {
  total_analyses: number;
  total_alerts: number;
  critical_alerts: number;
  warning_alerts: number;
  info_alerts: number;
  average_confidence: number;
  unique_specialists: number;
  total_credits_used: number;

  alerts_by_type: {
    allergy: number;
    interaction: number;
    contraindication: number;
    dosage: number;
    age: number;
    pregnancy: number;
  };

  usage_trend: {
    date: string;
    count: number;
  }[];

  top_specialists: {
    specialist_id: string;
    specialist_name: string;
    analyses_count: number;
  }[];

  common_interactions: {
    drug_pair: string;
    count: number;
  }[];
}

// ============ MEDICATION SUGGESTION DTOs ============

export class RxGPTSuggestMedicationsDto {
  @IsMongoId()
  @IsNotEmpty()
  patient_id: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_appointments?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_clinical_notes?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_health_checkups?: string[];

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  symptoms?: string[];

  @IsString()
  @IsOptional()
  treatment_goal?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferred_dosage_forms?: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  max_suggestions?: number;

  @IsBoolean()
  @IsOptional()
  include_alternatives?: boolean;

  @IsBoolean()
  @IsOptional()
  prefer_inventory?: boolean; // Prioritize medications in inventory
}

export class SuggestedMedicationDto {
  drug_id?: string;               // Null if not in inventory
  drug_name: string;
  generic_name?: string;
  strength: string;
  dosage_form: string;
  suggested_dosage: string;
  suggested_frequency: string;
  suggested_duration?: string;
  instructions?: string;
  suggested_quantity: number;

  // Inventory information
  is_in_inventory: boolean;
  inventory_status?: 'available' | 'low_stock' | 'out_of_stock';
  available_quantity?: number;
  unit_price?: number;
  currency?: string;

  // AI reasoning
  reasoning: string;
  confidence: number;              // 0-100
  priority: 'primary' | 'alternative' | 'supplementary';
  citations?: string[];

  // Safety information
  safety_alerts?: RxGPTAlertDto[];
  contraindication_check?: {
    is_safe: boolean;
    warnings: string[];
  };

  // Alternatives if this drug is not available
  alternatives?: {
    drug_id?: string;
    drug_name: string;
    generic_name?: string;
    is_in_inventory: boolean;
    reason: string;
  }[];
}

export class RxGPTSuggestMedicationsResponseDto {
  suggestions: SuggestedMedicationDto[];
  clinical_context: {
    diagnosis?: string;
    symptoms?: string[];
    primary_condition?: string;
    triage_level?: string;
  };
  patient_considerations: {
    allergies: string[];
    current_medications: string[];
    chronic_conditions: string[];
    age: number;
    gender: string;
  };
  clinical_summary: string;
  disclaimer: string;
  generated_at: Date;
  model: string;
  confidence_score: number;        // Overall confidence
  credits_used: number;
  credits_remaining: number;
}
