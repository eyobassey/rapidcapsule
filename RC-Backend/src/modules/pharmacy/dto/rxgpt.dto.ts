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

// ============ STANDALONE ANALYSIS DTOs ============

export class InlinePatientContextDto {
  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  chronic_conditions?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrentMedicationDto)
  @IsOptional()
  current_medications?: CurrentMedicationDto[];

  @IsBoolean()
  @IsOptional()
  renal_impairment?: boolean;

  @IsBoolean()
  @IsOptional()
  hepatic_impairment?: boolean;

  @IsBoolean()
  @IsOptional()
  pregnant?: boolean;
}

export class RxGPTStandaloneAnalyzeDto {
  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @IsString()
  @IsOptional()
  subject_name?: string;

  @IsString()
  @IsOptional()
  treatment_goal?: string;

  @ValidateNested()
  @Type(() => InlinePatientContextDto)
  @IsOptional()
  patient_context?: InlinePatientContextDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedDrugDto)
  @IsOptional()
  proposed_drugs?: ProposedDrugDto[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  max_suggestions?: number;

  @IsBoolean()
  @IsOptional()
  prefer_inventory?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  symptoms?: string[];
}

// ============ RE-RUN DTO ============

export class RxGPTRerunAnalysisDto {
  @IsMongoId()
  @IsNotEmpty()
  source_analysis_id: string;
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
  confidence: number;              // 0-100 (AI confidence adjusted by evidence)
  priority: 'primary' | 'alternative' | 'supplementary';
  citations?: string[];

  // Evidence-based confidence breakdown
  // Note: AI confidence is the BASE, evidence ADJUSTS it (doesn't replace it)
  // If no evidence data available, original AI confidence is preserved
  evidence_confidence?: {
    final_score: number;           // Final adjusted confidence (0-100)
    base_score: number;            // Original AI-generated confidence (preserved for reference)
    adjustments: Array<{
      source: string;              // e.g., 'fda_approved', 'nice_recommended', 'pubmed_high_quality'
      adjustment: number;          // Points added or subtracted
      reason: string;              // Human-readable explanation
    }>;
    evidence_level: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
    evidence_summary: string;      // Brief summary of evidence strength
    is_off_label: boolean;         // Whether use is off-label
    grounded_in_evidence: boolean; // True if backed by at least one trusted source
  };

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

  // Verification status (Fact-Check Layer)
  verification?: {
    is_verified: boolean;           // True if drug found in trusted databases
    verified_sources: string[];     // Which databases verified this drug (e.g., ['local_inventory', 'openfda'])
    fda_approved: boolean;          // True if found in FDA database
    verification_warnings: string[]; // Warnings if drug could not be fully verified
    verified_at?: Date;
  };

  // Dosage Validation against FDA guidelines
  dosage_validation?: {
    status: 'safe' | 'warning' | 'danger';  // Overall dosage safety status
    fda_dosage_info?: {                      // FDA dosage guidelines used for validation
      adult?: {
        min_dose?: string;
        max_dose?: string;
        typical_dose?: string;
        max_daily_dose?: string;
        frequency?: string;
      };
      pediatric?: {
        min_dose?: string;
        max_dose?: string;
        dose_per_kg?: string;
        max_daily_dose?: string;
        min_age?: string;
        max_age?: string;
      };
      geriatric?: {
        min_dose?: string;
        max_dose?: string;
        typical_dose?: string;
        frequency?: string;
      };
    };
    warnings: string[];                       // Specific dosage warnings
    validated_for_patient: {                  // Patient context used for validation
      age: number;
      weight?: number;
      population: 'pediatric' | 'adult' | 'geriatric';
    };
    validated_at: Date;
  };

  // PubMed Evidence Citations
  pubmed_citations?: {
    total_found: number;
    citations: Array<{
      pmid: string;
      title: string;
      authors_short: string;
      journal: string;
      year: string;
      url: string;
      evidence_level: 'high' | 'moderate' | 'low' | 'unknown';
      relevance_score: number;
    }>;
    evidence_summary?: {
      high_quality_count: number;
      moderate_quality_count: number;
      low_quality_count: number;
    };
    search_condition?: string;
  };

  // NICE Guidelines Compliance (UK)
  nice_compliance?: {
    is_compliant: boolean;
    compliance_level: 'full' | 'partial' | 'none' | 'unknown';
    recommendation_type?: 'recommended' | 'consider' | 'do_not_offer' | 'caution';
    line_of_treatment?: 'first_line' | 'second_line' | 'third_line' | 'adjunct';
    guideline_references: Array<{
      id: string;
      title: string;
      url: string;
    }>;
    warnings: string[];
    recommendation_text?: string;
  };

  // BNF (British National Formulary) Validation
  bnf_info?: {
    found_in_bnf: boolean;
    uk_approved: boolean;
    drug_class?: string;
    bnf_url?: string;
    indications: string[];
    indication_match: boolean;
    dosage_appropriate: boolean;
    dosage_warnings: string[];
    cautions: string[];
    contraindications: string[];
    interactions: Array<{
      drug: string;
      severity: 'severe' | 'moderate' | 'mild' | 'unknown';
      effect: string;
      action: string;
    }>;
    side_effects?: {
      common?: string[];
      uncommon?: string[];
      rare?: string[];
    };
    special_population_warnings: string[];
  };

  // WHO Essential Medicines List (EML) Validation
  who_info?: {
    found_in_eml: boolean;
    list_type?: 'core' | 'complementary';
    atc_code?: string;
    section?: string;
    category?: string;
    matching_indications: string[];
    formulations: Array<{
      route: string;
      form: string;
      strength: string;
    }>;
    age_group_appropriate: boolean;
  };
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

  // Fact-Check Layer summary
  verification_summary?: {
    total_suggestions: number;
    verified_count: number;
    unverified_count: number;
    fda_approved_count: number;
    has_unverified_drugs: boolean;
    warning?: string;
  };

  // Dosage Validation summary
  dosage_validation_summary?: {
    total_validated: number;
    safe_count: number;
    warning_count: number;
    danger_count: number;
    has_dosage_concerns: boolean;
    warning?: string;
  };

  // PubMed Evidence summary
  pubmed_evidence_summary?: {
    total_drugs_with_evidence: number;
    total_citations: number;
    high_quality_evidence_count: number;
    drugs_without_evidence: string[];
    has_strong_evidence: boolean;
  };

  // NICE Guidelines Compliance summary (UK)
  nice_compliance_summary?: {
    total_drugs_checked: number;
    fully_compliant: number;
    partially_compliant: number;
    non_compliant: number;
    no_guidance_available: number;
    has_compliance_issues: boolean;
    warning?: string;
    guidelines_referenced: Array<{
      id: string;
      title: string;
      url: string;
    }>;
  };

  // BNF (British National Formulary) summary
  bnf_compliance_summary?: {
    total_drugs_checked: number;
    uk_approved_count: number;
    not_uk_approved: string[];
    dosage_warnings_count: number;
    caution_flags_count: number;
    interaction_alerts_count: number;
    has_uk_compliance_issues: boolean;
    warning?: string;
  };

  // WHO EML (Essential Medicines List) summary
  who_eml_compliance_summary?: {
    total_drugs_checked: number;
    eml_listed_count: number;
    core_count: number;
    complementary_count: number;
    not_in_eml: string[];
    has_eml_issues: boolean;
    warning?: string;
  };

  // Evidence-based confidence summary (replaces AI-generated overall confidence)
  evidence_summary?: {
    overall_evidence_score: number;      // Average evidence-based confidence
    overall_evidence_level: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
    drugs_with_strong_evidence: number;  // Count of drugs with high/very_high evidence
    drugs_with_weak_evidence: number;    // Count of drugs with low/very_low evidence
    off_label_count: number;             // Count of off-label uses
    evidence_sources_used: string[];     // e.g., ['FDA', 'NICE', 'PubMed', 'BNF']
    confidence_methodology: string;      // Explanation of how confidence is calculated
  };

  // Hallucination Detection Report
  hallucination_check?: {
    passed: boolean;                     // True if no critical/high severity issues
    total_flags: number;                 // Total number of potential issues detected
    critical_count: number;              // Issues that could cause harm
    high_count: number;                  // Likely hallucinations
    medium_count: number;                // Possible hallucinations
    low_count: number;                   // Minor concerns
    suspicion_score: number;             // Overall suspicion score (0-100)
    recommendation: 'safe' | 'review_required' | 'reject';
    summary: string;                     // Human-readable summary
    flagged_drugs?: Array<{
      drug_name: string;
      issues: Array<{
        type: string;
        severity: string;
        reason: string;
      }>;
    }>;
  };
}
