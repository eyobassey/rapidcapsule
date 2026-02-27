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
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

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
  @ApiPropertyOptional({ description: 'Drug ID from the inventory. Optional for external medications not in the system.', example: '665a1f3b2e4d8c001f3a9b12' })
  @IsString()
  @IsOptional()
  drug_id?: string; // Optional for external medications

  @ApiProperty({ description: 'Brand or trade name of the drug', example: 'Amoxicillin Capsule' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'International non-proprietary name (generic name) of the drug', example: 'Amoxicillin' })
  @IsString()
  @IsOptional()
  generic_name?: string;

  @ApiProperty({ description: 'Strength/concentration of the drug', example: '500mg' })
  @IsString()
  @IsNotEmpty()
  strength: string;

  @ApiProperty({ description: 'Dosage per administration', example: '500mg' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ description: 'Frequency of administration', example: 'Three times daily' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiPropertyOptional({ description: 'Duration of treatment in days', example: 7 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  duration_days?: number;

  @ApiPropertyOptional({ description: 'Special instructions for taking the medication', example: 'Take after meals with a full glass of water' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({ description: 'Total quantity of units to dispense', example: 21 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class PatientAllergyDto {
  @ApiProperty({ description: 'Name of the allergen (drug, substance, or food)', example: 'Penicillin' })
  @IsString()
  @IsNotEmpty()
  allergen: string;

  @ApiPropertyOptional({ description: 'Type of allergic reaction experienced', example: 'Anaphylaxis' })
  @IsString()
  @IsOptional()
  reaction?: string;

  @ApiPropertyOptional({ description: 'Severity of the allergic reaction', example: 'severe' })
  @IsString()
  @IsOptional()
  severity?: string;
}

export class CurrentMedicationDto {
  @ApiProperty({ description: 'Name of the medication the patient is currently taking', example: 'Metformin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Dosage of the current medication', example: '500mg' })
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiPropertyOptional({ description: 'How often the medication is taken', example: 'Twice daily' })
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Reason or condition the medication is prescribed for', example: 'Type 2 Diabetes management' })
  @IsString()
  @IsOptional()
  reason?: string;
}

// ============ ANALYZE REQUEST ============

export class RxGPTAnalyzeDto {
  @ApiProperty({ description: 'MongoDB ID of the patient to analyze prescriptions for', example: '665a1f3b2e4d8c001f3a9b12' })
  @IsMongoId()
  @IsNotEmpty()
  patient_id: string;

  @ApiProperty({ description: 'List of drugs being proposed for the prescription', type: [ProposedDrugDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedDrugDto)
  proposed_drugs: ProposedDrugDto[];

  @ApiPropertyOptional({ description: 'Appointment IDs linked to this prescription for clinical context', example: ['665a1f3b2e4d8c001f3a9c01', '665a1f3b2e4d8c001f3a9c02'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_appointments?: string[];

  @ApiPropertyOptional({ description: 'Clinical note IDs linked to this prescription', example: ['665a1f3b2e4d8c001f3a9d01'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_clinical_notes?: string[];

  @ApiPropertyOptional({ description: 'Health checkup IDs linked to this prescription', example: ['665a1f3b2e4d8c001f3a9e01'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_health_checkups?: string[];

  @ApiPropertyOptional({ description: 'Whether to include alternative drug suggestions in the analysis', example: true })
  @IsBoolean()
  @IsOptional()
  include_alternatives?: boolean;

  @ApiPropertyOptional({ description: 'Skip cached results and force a fresh AI analysis', example: false })
  @IsBoolean()
  @IsOptional()
  skip_cache?: boolean;
}

export class RxGPTQuickCheckDto {
  @ApiProperty({ description: 'MongoDB ID of the patient for the quick safety check', example: '665a1f3b2e4d8c001f3a9b12' })
  @IsMongoId()
  @IsNotEmpty()
  patient_id: string;

  @ApiProperty({ description: 'Name of the drug to check', example: 'Ciprofloxacin' })
  @IsString()
  @IsNotEmpty()
  drug_name: string;

  @ApiPropertyOptional({ description: 'Generic name of the drug', example: 'Ciprofloxacin' })
  @IsString()
  @IsOptional()
  generic_name?: string;

  @ApiPropertyOptional({ description: 'Strength of the drug', example: '500mg' })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiPropertyOptional({ description: 'Dosage to validate', example: '500mg twice daily' })
  @IsString()
  @IsOptional()
  dosage?: string;
}

// ============ RESPONSE DTOs ============

export class RxGPTAlertDto {
  @ApiProperty({ description: 'Type of safety alert detected', enum: RxGPTAlertType, example: RxGPTAlertType.INTERACTION })
  @IsEnum(RxGPTAlertType)
  type: RxGPTAlertType;

  @ApiProperty({ description: 'Severity level of the alert', enum: RxGPTAlertSeverity, example: RxGPTAlertSeverity.WARNING })
  @IsEnum(RxGPTAlertSeverity)
  severity: RxGPTAlertSeverity;

  @ApiProperty({ description: 'Name of the drug that triggered the alert', example: 'Warfarin' })
  @IsString()
  drug_name: string;

  @ApiProperty({ description: 'Human-readable alert message', example: 'Potential interaction between Warfarin and Aspirin increases bleeding risk' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Clinical reasoning behind the alert', example: 'Both drugs inhibit platelet aggregation through different mechanisms, leading to additive anticoagulant effects' })
  @IsString()
  reasoning: string;

  @ApiPropertyOptional({ description: 'Citation or reference supporting the alert', example: 'FDA Drug Safety Communication 2019; BNF Interactions Database' })
  @IsString()
  @IsOptional()
  citation?: string;

  @ApiProperty({ description: 'Recommended action for the prescriber', example: 'Monitor INR closely or consider alternative analgesic' })
  @IsString()
  action_required: string;
}

export class RxGPTRecommendationDto {
  @ApiProperty({ description: 'Type of recommendation', enum: RxGPTRecommendationType, example: RxGPTRecommendationType.DOSAGE_ADJUSTMENT })
  @IsEnum(RxGPTRecommendationType)
  type: RxGPTRecommendationType;

  @ApiPropertyOptional({ description: 'Drug name the recommendation applies to', example: 'Metformin' })
  @IsString()
  @IsOptional()
  drug_name?: string;

  @ApiProperty({ description: 'The recommendation text', example: 'Consider reducing Metformin dose to 500mg due to mild renal impairment (eGFR 45-59)' })
  @IsString()
  recommendation: string;

  @ApiProperty({ description: 'Clinical reasoning behind the recommendation', example: 'Metformin is renally excreted and accumulation may cause lactic acidosis in patients with reduced eGFR' })
  @IsString()
  reasoning: string;

  @ApiProperty({ description: 'Supporting citations or references', example: ['NICE CG87: Type 2 diabetes in adults', 'BNF Renal Impairment Appendix'] })
  @IsArray()
  @IsString({ each: true })
  citations: string[];

  @ApiProperty({ description: 'AI confidence score for this recommendation (0-100)', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;

  @ApiProperty({ description: 'Priority level of the recommendation', enum: RxGPTPriority, example: RxGPTPriority.HIGH })
  @IsEnum(RxGPTPriority)
  priority: RxGPTPriority;
}

export class DrugAnalysisDto {
  @ApiPropertyOptional({ description: 'Drug ID from the inventory. Optional for external medications.', example: '665a1f3b2e4d8c001f3a9b12' })
  @IsString()
  @IsOptional()
  drug_id?: string; // Optional for external medications

  @ApiProperty({ description: 'Name of the drug analyzed', example: 'Amoxicillin 500mg Capsule' })
  @IsString()
  drug_name: string;

  @ApiProperty({ description: 'Whether the drug is appropriate for this patient', example: true })
  @IsBoolean()
  is_appropriate: boolean;

  @ApiProperty({ description: 'Confidence score of the analysis (0-100)', example: 92 })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;

  @ApiProperty({ description: 'Clinical reasoning for the appropriateness assessment', example: 'Amoxicillin is first-line treatment for bacterial upper respiratory tract infections in adults without penicillin allergy' })
  @IsString()
  reasoning: string;

  @ApiProperty({ description: 'Safety alerts found for this drug', type: [RxGPTAlertDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RxGPTAlertDto)
  alerts: RxGPTAlertDto[];

  @ApiPropertyOptional({ description: 'Supporting citations for the analysis', example: ['WHO Model List of Essential Medicines 2023', 'NICE Antimicrobial prescribing guidelines'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  citations?: string[];
}

export class RxGPTResponseDto {
  @ApiProperty({ description: 'Whether the overall prescription is deemed safe', example: true })
  @IsBoolean()
  is_safe: boolean;

  @ApiProperty({ description: 'Overall risk level of the prescription', enum: RxGPTRiskLevel, example: RxGPTRiskLevel.LOW })
  @IsEnum(RxGPTRiskLevel)
  overall_risk_level: RxGPTRiskLevel;

  @ApiProperty({ description: 'List of safety alerts detected across all drugs', type: [RxGPTAlertDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RxGPTAlertDto)
  alerts: RxGPTAlertDto[];

  @ApiProperty({ description: 'Clinical recommendations from the AI analysis', type: [RxGPTRecommendationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RxGPTRecommendationDto)
  recommendations: RxGPTRecommendationDto[];

  @ApiProperty({ description: 'Per-drug analysis results', type: [DrugAnalysisDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrugAnalysisDto)
  drug_analyses: DrugAnalysisDto[];

  @ApiProperty({ description: 'AI-generated clinical summary of the full prescription analysis', example: 'Prescription for Amoxicillin 500mg TDS and Ibuprofen 400mg TDS is generally safe. No drug interactions detected. Patient has no known allergies to these medications.' })
  @IsString()
  clinical_summary: string;

  @ApiProperty({ description: 'Medical disclaimer for the AI analysis', example: 'This analysis is AI-generated and should be reviewed by a qualified healthcare professional before clinical decisions are made.' })
  @IsString()
  disclaimer: string;

  @ApiProperty({ description: 'Timestamp when the analysis was generated', example: '2025-09-15T10:30:00.000Z' })
  generated_at: Date;

  @ApiProperty({ description: 'AI model used for the analysis', example: 'claude-sonnet-4-20250514' })
  @IsString()
  model: string;

  @ApiProperty({ description: 'Overall confidence score for the analysis (0-100)', example: 88 })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence_score: number;

  @ApiProperty({ description: 'Number of RxGPT credits consumed by this analysis', example: 1 })
  @IsNumber()
  credits_used: number;

  @ApiProperty({ description: 'Remaining RxGPT credits for the specialist', example: 49 })
  @IsNumber()
  credits_remaining: number;

  @ApiPropertyOptional({ description: 'Whether this result was served from cache', example: false })
  @IsBoolean()
  @IsOptional()
  cached?: boolean;

  @ApiPropertyOptional({ description: 'Low-credit warning information', example: { level: 'low', message: 'You have 5 credits remaining this month', credits_remaining: 5 } })
  @IsOptional()
  warning?: {
    level: 'low' | 'critical';
    message: string;
    credits_remaining: number;
  };
}

// ============ SETTINGS DTOs ============

export class RxGPTCreditSettingsDto {
  @ApiPropertyOptional({ description: 'Number of credits consumed per analysis', example: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  credits_per_analysis?: number;

  @ApiPropertyOptional({ description: 'Number of free credits allocated to each specialist per month', example: 50 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  free_monthly_credits?: number;

  @ApiPropertyOptional({ description: 'Whether specialists can purchase additional credits', example: true })
  @IsBoolean()
  @IsOptional()
  allow_specialist_purchase?: boolean;
}

export class RxGPTFeaturesDto {
  @ApiPropertyOptional({ description: 'Enable allergy cross-checking against patient profile', example: true })
  @IsBoolean()
  @IsOptional()
  allergy_checking?: boolean;

  @ApiPropertyOptional({ description: 'Enable drug-drug interaction detection', example: true })
  @IsBoolean()
  @IsOptional()
  drug_interactions?: boolean;

  @ApiPropertyOptional({ description: 'Enable dosage validation against FDA and BNF guidelines', example: true })
  @IsBoolean()
  @IsOptional()
  dosage_validation?: boolean;

  @ApiPropertyOptional({ description: 'Enable alternative drug suggestions when issues are found', example: true })
  @IsBoolean()
  @IsOptional()
  alternative_suggestions?: boolean;

  @ApiPropertyOptional({ description: 'Include detailed clinical reasoning in the analysis output', example: true })
  @IsBoolean()
  @IsOptional()
  clinical_reasoning?: boolean;

  @ApiPropertyOptional({ description: 'Include citations from medical literature and guidelines', example: true })
  @IsBoolean()
  @IsOptional()
  citations?: boolean;
}

export class RxGPTDataSourcesDto {
  @ApiPropertyOptional({ description: 'Use OpenFDA database for drug information and safety labeling', example: true })
  @IsBoolean()
  @IsOptional()
  use_openfda?: boolean;

  @ApiPropertyOptional({ description: 'Use Claude AI for clinical reasoning and analysis', example: true })
  @IsBoolean()
  @IsOptional()
  use_claude_ai?: boolean;

  @ApiPropertyOptional({ description: 'Use the local pharmacy drug database for inventory matching', example: true })
  @IsBoolean()
  @IsOptional()
  use_local_drug_db?: boolean;
}

export class RxGPTThresholdsDto {
  @ApiPropertyOptional({ description: 'Minimum confidence score required for analysis results to be shown (0-100)', example: 70 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  min_confidence_score?: number;

  @ApiPropertyOptional({ description: 'Minimum severity threshold for interaction alerts', example: 'moderate' })
  @IsString()
  @IsOptional()
  interaction_severity_threshold?: 'low' | 'moderate' | 'high';

  @ApiPropertyOptional({ description: 'Maximum number of alternative drugs to suggest per flagged drug', example: 3 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  max_alternatives?: number;
}

export class RxGPTDisplayDto {
  @ApiPropertyOptional({ description: 'Show citations from medical literature in the UI', example: true })
  @IsBoolean()
  @IsOptional()
  show_citations?: boolean;

  @ApiPropertyOptional({ description: 'Show confidence scores alongside recommendations', example: true })
  @IsBoolean()
  @IsOptional()
  show_confidence_scores?: boolean;

  @ApiPropertyOptional({ description: 'Show detailed clinical reasoning for each drug', example: true })
  @IsBoolean()
  @IsOptional()
  show_reasoning?: boolean;

  @ApiPropertyOptional({ description: 'Automatically expand alert cards in the UI', example: false })
  @IsBoolean()
  @IsOptional()
  auto_expand_alerts?: boolean;
}

export class RxGPTUsageLimitsDto {
  @ApiPropertyOptional({ description: 'Maximum number of analyses per specialist per day (0 = unlimited)', example: 100 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  daily_limit?: number;

  @ApiPropertyOptional({ description: 'Maximum number of analyses per specialist per month (0 = unlimited)', example: 500 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  monthly_limit?: number;

  @ApiPropertyOptional({ description: 'Maximum number of analysis requests per minute to prevent abuse', example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(60)
  rate_limit_per_minute?: number;

  @ApiPropertyOptional({ description: 'Credit threshold at which a low-credit warning is shown', example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  low_credit_warning_threshold?: number;

  @ApiPropertyOptional({ description: 'Credit threshold at which a critical warning is shown', example: 3 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  critical_credit_warning_threshold?: number;
}

export class UpdateRxGPTSettingsDto {
  @ApiPropertyOptional({ description: 'Enable or disable the RxGPT feature globally', example: true })
  @IsBoolean()
  @IsOptional()
  is_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable or disable RxGPT access for specialists', example: true })
  @IsBoolean()
  @IsOptional()
  is_enabled_for_specialists?: boolean;

  @ApiPropertyOptional({ description: 'AI model to use for prescription analysis', example: 'claude-sonnet-4-20250514' })
  @IsString()
  @IsOptional()
  ai_model?: string;

  @ApiPropertyOptional({ description: 'Maximum number of tokens for AI model response (256-16384)', example: 4096 })
  @IsNumber()
  @IsOptional()
  @Min(256)
  @Max(16384)
  max_tokens?: number;

  @ApiPropertyOptional({ description: 'AI model temperature for response variability (0-1)', example: 0.3 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Credit allocation and purchasing settings', type: RxGPTCreditSettingsDto })
  @ValidateNested()
  @Type(() => RxGPTCreditSettingsDto)
  @IsOptional()
  credit_settings?: RxGPTCreditSettingsDto;

  @ApiPropertyOptional({ description: 'Feature toggles for different analysis capabilities', type: RxGPTFeaturesDto })
  @ValidateNested()
  @Type(() => RxGPTFeaturesDto)
  @IsOptional()
  features?: RxGPTFeaturesDto;

  @ApiPropertyOptional({ description: 'Data source configuration for drug information', type: RxGPTDataSourcesDto })
  @ValidateNested()
  @Type(() => RxGPTDataSourcesDto)
  @IsOptional()
  data_sources?: RxGPTDataSourcesDto;

  @ApiPropertyOptional({ description: 'Threshold settings for alerts and confidence scores', type: RxGPTThresholdsDto })
  @ValidateNested()
  @Type(() => RxGPTThresholdsDto)
  @IsOptional()
  thresholds?: RxGPTThresholdsDto;

  @ApiPropertyOptional({ description: 'UI display preferences for analysis results', type: RxGPTDisplayDto })
  @ValidateNested()
  @Type(() => RxGPTDisplayDto)
  @IsOptional()
  display?: RxGPTDisplayDto;

  @ApiPropertyOptional({ description: 'Usage and rate limiting configuration', type: RxGPTUsageLimitsDto })
  @ValidateNested()
  @Type(() => RxGPTUsageLimitsDto)
  @IsOptional()
  usage_limits?: RxGPTUsageLimitsDto;

  @ApiPropertyOptional({ description: 'Custom disclaimer text shown with analysis results', example: 'This analysis is AI-generated and should be reviewed by a qualified healthcare professional.' })
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
  @ApiProperty({ description: 'Name of the drug being reviewed', example: 'Amoxicillin 500mg' })
  @IsString()
  @IsNotEmpty()
  drug_name: string;

  @ApiProperty({ description: 'Whether the specialist agrees the drug analysis was appropriate', example: true })
  @IsBoolean()
  was_appropriate: boolean;

  @ApiPropertyOptional({ description: 'Additional comments about the drug analysis', example: 'The dosage suggestion was accurate for this patient weight' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class SubmitRxGPTFeedbackDto {
  @ApiProperty({ description: 'MongoDB ID of the RxGPT analysis being reviewed', example: '665a1f3b2e4d8c001f3a9f01' })
  @IsMongoId()
  @IsNotEmpty()
  analysis_id: string;

  @ApiProperty({ description: 'Overall rating of the analysis quality', enum: RxGPTFeedbackRatingEnum, example: RxGPTFeedbackRatingEnum.HELPFUL })
  @IsEnum(RxGPTFeedbackRatingEnum)
  rating: RxGPTFeedbackRatingEnum;

  @ApiPropertyOptional({ description: 'Whether the safety assessment was clinically correct', example: true })
  @IsBoolean()
  @IsOptional()
  safety_assessment_correct?: boolean;

  @ApiPropertyOptional({ description: 'Whether the alerts were clinically relevant', example: true })
  @IsBoolean()
  @IsOptional()
  alerts_relevant?: boolean;

  @ApiPropertyOptional({ description: 'Whether the recommendations were useful in clinical practice', example: true })
  @IsBoolean()
  @IsOptional()
  recommendations_useful?: boolean;

  @ApiPropertyOptional({ description: 'Per-drug feedback from the specialist', type: [DrugFeedbackDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrugFeedbackDto)
  @IsOptional()
  drug_feedback?: DrugFeedbackDto[];

  @ApiPropertyOptional({ description: 'Issues the AI missed that should have been flagged', example: ['Patient has a history of QT prolongation not detected', 'Missed potential interaction with herbal supplement'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  missed_issues?: string[];

  @ApiPropertyOptional({ description: 'Alerts that were flagged but are not clinically significant', example: ['Mild interaction between Paracetamol and Vitamin C is not clinically relevant'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  false_positives?: string[];

  @ApiPropertyOptional({ description: 'General comments from the specialist about the analysis', example: 'Overall helpful analysis but missed the renal impairment context' })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({ description: 'Action the specialist took after reviewing the analysis', enum: RxGPTActionTakenEnum, example: RxGPTActionTakenEnum.MODIFIED_PRESCRIPTION })
  @IsEnum(RxGPTActionTakenEnum)
  @IsOptional()
  action_taken?: RxGPTActionTakenEnum;

  @ApiPropertyOptional({ description: 'Description of modifications made to the prescription based on the analysis', example: 'Reduced Metformin dose from 1000mg to 500mg due to renal impairment' })
  @IsString()
  @IsOptional()
  modifications_made?: string;
}

// ============ ANALYTICS DTOs ============

export class RxGPTAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Start date for the analytics period (ISO 8601)', example: '2025-01-01' })
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for the analytics period (ISO 8601)', example: '2025-09-30' })
  @IsString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Filter analytics to a specific specialist', example: '665a1f3b2e4d8c001f3a9a01' })
  @IsMongoId()
  @IsOptional()
  specialist_id?: string;
}

export class RxGPTAnalyticsSummaryDto {
  @ApiProperty({ description: 'Total number of RxGPT analyses performed in the period', example: 1250 })
  total_analyses: number;

  @ApiProperty({ description: 'Total number of safety alerts generated', example: 340 })
  total_alerts: number;

  @ApiProperty({ description: 'Number of critical severity alerts', example: 15 })
  critical_alerts: number;

  @ApiProperty({ description: 'Number of warning severity alerts', example: 120 })
  warning_alerts: number;

  @ApiProperty({ description: 'Number of informational alerts', example: 205 })
  info_alerts: number;

  @ApiProperty({ description: 'Average confidence score across all analyses (0-100)', example: 87.5 })
  average_confidence: number;

  @ApiProperty({ description: 'Number of unique specialists who used RxGPT', example: 24 })
  unique_specialists: number;

  @ApiProperty({ description: 'Total credits consumed in the period', example: 1250 })
  total_credits_used: number;

  @ApiProperty({ description: 'Breakdown of alerts by type', example: { allergy: 45, interaction: 120, contraindication: 30, dosage: 80, age: 25, pregnancy: 40 } })
  alerts_by_type: {
    allergy: number;
    interaction: number;
    contraindication: number;
    dosage: number;
    age: number;
    pregnancy: number;
  };

  @ApiProperty({ description: 'Daily usage trend data', example: [{ date: '2025-09-01', count: 42 }, { date: '2025-09-02', count: 38 }] })
  usage_trend: {
    date: string;
    count: number;
  }[];

  @ApiProperty({ description: 'Top specialists by analysis volume', example: [{ specialist_id: '665a1f3b2e4d8c001f3a9a01', specialist_name: 'Dr. Chinedu Okafor', analyses_count: 85 }] })
  top_specialists: {
    specialist_id: string;
    specialist_name: string;
    analyses_count: number;
  }[];

  @ApiProperty({ description: 'Most commonly detected drug-drug interactions', example: [{ drug_pair: 'Warfarin + Aspirin', count: 18 }, { drug_pair: 'Metformin + Furosemide', count: 12 }] })
  common_interactions: {
    drug_pair: string;
    count: number;
  }[];
}

// ============ STANDALONE ANALYSIS DTOs ============

export class InlinePatientContextDto {
  @ApiPropertyOptional({ description: 'Patient age in years', example: 35 })
  @IsNumber()
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({ description: 'Patient gender', example: 'Female' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: 'Patient weight in kilograms', example: 68 })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: 'List of known patient allergies', example: ['Penicillin', 'Sulfonamides'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional({ description: 'List of chronic conditions the patient has', example: ['Hypertension', 'Type 2 Diabetes'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  chronic_conditions?: string[];

  @ApiPropertyOptional({ description: 'Medications the patient is currently taking', type: [CurrentMedicationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrentMedicationDto)
  @IsOptional()
  current_medications?: CurrentMedicationDto[];

  @ApiPropertyOptional({ description: 'Whether the patient has renal impairment', example: false })
  @IsBoolean()
  @IsOptional()
  renal_impairment?: boolean;

  @ApiPropertyOptional({ description: 'Whether the patient has hepatic impairment', example: false })
  @IsBoolean()
  @IsOptional()
  hepatic_impairment?: boolean;

  @ApiPropertyOptional({ description: 'Whether the patient is pregnant', example: false })
  @IsBoolean()
  @IsOptional()
  pregnant?: boolean;
}

export class RxGPTStandaloneAnalyzeDto {
  @ApiProperty({ description: 'Primary diagnosis or clinical condition', example: 'Acute bacterial sinusitis' })
  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @ApiPropertyOptional({ description: 'Name of the patient or subject for reference', example: 'Adaeze Obi' })
  @IsString()
  @IsOptional()
  subject_name?: string;

  @ApiPropertyOptional({ description: 'Treatment goal or desired outcome', example: 'Eradicate bacterial infection and relieve sinus congestion' })
  @IsString()
  @IsOptional()
  treatment_goal?: string;

  @ApiPropertyOptional({ description: 'Inline patient context when no patient_id is available', type: InlinePatientContextDto })
  @ValidateNested()
  @Type(() => InlinePatientContextDto)
  @IsOptional()
  patient_context?: InlinePatientContextDto;

  @ApiPropertyOptional({ description: 'Drugs the specialist is considering prescribing', type: [ProposedDrugDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedDrugDto)
  @IsOptional()
  proposed_drugs?: ProposedDrugDto[];

  @ApiPropertyOptional({ description: 'Maximum number of drug suggestions to return (1-10)', example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  max_suggestions?: number;

  @ApiPropertyOptional({ description: 'Prioritize medications available in the pharmacy inventory', example: true })
  @IsBoolean()
  @IsOptional()
  prefer_inventory?: boolean;

  @ApiPropertyOptional({ description: 'List of symptoms the patient is presenting with', example: ['Facial pain', 'Nasal congestion', 'Purulent nasal discharge', 'Fever'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  symptoms?: string[];
}

// ============ RE-RUN DTO ============

export class RxGPTRerunAnalysisDto {
  @ApiProperty({ description: 'MongoDB ID of the original analysis to re-run with fresh data', example: '665a1f3b2e4d8c001f3a9f01' })
  @IsMongoId()
  @IsNotEmpty()
  source_analysis_id: string;
}

// ============ MEDICATION SUGGESTION DTOs ============

export class RxGPTSuggestMedicationsDto {
  @ApiProperty({ description: 'MongoDB ID of the patient to suggest medications for', example: '665a1f3b2e4d8c001f3a9b12' })
  @IsMongoId()
  @IsNotEmpty()
  patient_id: string;

  @ApiPropertyOptional({ description: 'Linked appointment IDs for clinical context', example: ['665a1f3b2e4d8c001f3a9c01'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_appointments?: string[];

  @ApiPropertyOptional({ description: 'Linked clinical note IDs for additional context', example: ['665a1f3b2e4d8c001f3a9d01'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_clinical_notes?: string[];

  @ApiPropertyOptional({ description: 'Linked health checkup IDs for diagnostic history', example: ['665a1f3b2e4d8c001f3a9e01'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  linked_health_checkups?: string[];

  @ApiPropertyOptional({ description: 'Primary diagnosis or clinical condition', example: 'Community-acquired pneumonia' })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Presenting symptoms', example: ['Productive cough', 'Fever', 'Chest pain', 'Shortness of breath'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  symptoms?: string[];

  @ApiPropertyOptional({ description: 'Desired treatment outcome', example: 'Resolve pneumonia and prevent complications' })
  @IsString()
  @IsOptional()
  treatment_goal?: string;

  @ApiPropertyOptional({ description: 'Preferred dosage forms for the patient', example: ['tablet', 'capsule', 'oral suspension'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferred_dosage_forms?: string[];

  @ApiPropertyOptional({ description: 'Maximum number of medication suggestions to return (1-10)', example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  max_suggestions?: number;

  @ApiPropertyOptional({ description: 'Include alternative medications for each suggestion', example: true })
  @IsBoolean()
  @IsOptional()
  include_alternatives?: boolean;

  @ApiPropertyOptional({ description: 'Prioritize medications available in the pharmacy inventory', example: true })
  @IsBoolean()
  @IsOptional()
  prefer_inventory?: boolean; // Prioritize medications in inventory
}

export class SuggestedMedicationDto {
  @ApiPropertyOptional({ description: 'Drug ID from inventory, null if not in inventory', example: '665a1f3b2e4d8c001f3a9b12' })
  drug_id?: string;               // Null if not in inventory

  @ApiProperty({ description: 'Brand or trade name of the suggested drug', example: 'Augmentin' })
  drug_name: string;

  @ApiPropertyOptional({ description: 'Generic/INN name of the drug', example: 'Amoxicillin/Clavulanic Acid' })
  generic_name?: string;

  @ApiProperty({ description: 'Strength of the medication', example: '625mg' })
  strength: string;

  @ApiProperty({ description: 'Dosage form of the medication', example: 'Tablet' })
  dosage_form: string;

  @ApiProperty({ description: 'Recommended dosage per administration', example: '625mg' })
  suggested_dosage: string;

  @ApiProperty({ description: 'Recommended frequency of administration', example: 'Three times daily' })
  suggested_frequency: string;

  @ApiPropertyOptional({ description: 'Recommended duration of treatment', example: '7 days' })
  suggested_duration?: string;

  @ApiPropertyOptional({ description: 'Special administration instructions', example: 'Take at the start of a meal to reduce GI side effects' })
  instructions?: string;

  @ApiProperty({ description: 'Suggested total quantity to dispense', example: 21 })
  suggested_quantity: number;

  // Inventory information
  @ApiProperty({ description: 'Whether this drug is available in the pharmacy inventory', example: true })
  is_in_inventory: boolean;

  @ApiPropertyOptional({ description: 'Current inventory stock status', example: 'available' })
  inventory_status?: 'available' | 'low_stock' | 'out_of_stock';

  @ApiPropertyOptional({ description: 'Quantity available in inventory', example: 150 })
  available_quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price of the drug', example: 350.00 })
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Currency for the unit price', example: 'NGN' })
  currency?: string;

  // AI reasoning
  @ApiProperty({ description: 'Clinical reasoning for suggesting this medication', example: 'Amoxicillin/Clavulanic Acid is first-line therapy for community-acquired pneumonia in adults per NICE guidelines, covering both typical and atypical pathogens' })
  reasoning: string;

  @ApiProperty({ description: 'AI confidence score adjusted by evidence (0-100)', example: 91 })
  confidence: number;              // 0-100 (AI confidence adjusted by evidence)

  @ApiProperty({ description: 'Priority classification of this suggestion', example: 'primary' })
  priority: 'primary' | 'alternative' | 'supplementary';

  @ApiPropertyOptional({ description: 'Supporting medical literature citations', example: ['NICE CG191: Pneumonia in adults', 'WHO Model List of Essential Medicines 2023'] })
  citations?: string[];

  // Evidence-based confidence breakdown
  // Note: AI confidence is the BASE, evidence ADJUSTS it (doesn't replace it)
  // If no evidence data available, original AI confidence is preserved
  @ApiPropertyOptional({
    description: 'Evidence-based confidence breakdown showing how AI confidence was adjusted by clinical evidence sources',
    example: {
      final_score: 91,
      base_score: 85,
      adjustments: [
        { source: 'fda_approved', adjustment: 3, reason: 'Drug is FDA-approved for this indication' },
        { source: 'nice_recommended', adjustment: 3, reason: 'NICE first-line recommendation for community-acquired pneumonia' },
      ],
      evidence_level: 'high',
      evidence_summary: 'Strong clinical evidence from multiple trusted sources',
      is_off_label: false,
      grounded_in_evidence: true,
    },
  })
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
  @ApiPropertyOptional({ description: 'Safety alerts specific to this drug for this patient', type: [RxGPTAlertDto] })
  safety_alerts?: RxGPTAlertDto[];

  @ApiPropertyOptional({
    description: 'Contraindication check result for this drug',
    example: { is_safe: true, warnings: [] },
  })
  contraindication_check?: {
    is_safe: boolean;
    warnings: string[];
  };

  // Alternatives if this drug is not available
  @ApiPropertyOptional({
    description: 'Alternative drugs if this medication is unavailable or contraindicated',
    example: [
      { drug_id: '665a1f3b2e4d8c001f3a9b15', drug_name: 'Cefuroxime 500mg', generic_name: 'Cefuroxime', is_in_inventory: true, reason: 'Second-line alternative for penicillin-intolerant patients' },
    ],
  })
  alternatives?: {
    drug_id?: string;
    drug_name: string;
    generic_name?: string;
    is_in_inventory: boolean;
    reason: string;
  }[];

  // Verification status (Fact-Check Layer)
  @ApiPropertyOptional({
    description: 'Drug verification status from trusted pharmaceutical databases',
    example: {
      is_verified: true,
      verified_sources: ['local_inventory', 'openfda'],
      fda_approved: true,
      verification_warnings: [],
      verified_at: '2025-09-15T10:30:00.000Z',
    },
  })
  verification?: {
    is_verified: boolean;           // True if drug found in trusted databases
    verified_sources: string[];     // Which databases verified this drug (e.g., ['local_inventory', 'openfda'])
    fda_approved: boolean;          // True if found in FDA database
    verification_warnings: string[]; // Warnings if drug could not be fully verified
    verified_at?: Date;
  };

  // Dosage Validation against FDA guidelines
  @ApiPropertyOptional({
    description: 'Dosage validation results against FDA and population-specific guidelines',
    example: {
      status: 'safe',
      fda_dosage_info: {
        adult: { min_dose: '250mg', max_dose: '875mg', typical_dose: '500mg', max_daily_dose: '2625mg', frequency: 'Every 8 hours' },
      },
      warnings: [],
      validated_for_patient: { age: 35, weight: 68, population: 'adult' },
      validated_at: '2025-09-15T10:30:00.000Z',
    },
  })
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
  @ApiPropertyOptional({
    description: 'PubMed citations supporting the use of this drug for the diagnosis',
    example: {
      total_found: 3,
      citations: [
        { pmid: '34567890', title: 'Amoxicillin-clavulanate for community-acquired pneumonia: a systematic review', authors_short: 'Okonkwo et al.', journal: 'Lancet Infect Dis', year: '2024', url: 'https://pubmed.ncbi.nlm.nih.gov/34567890', evidence_level: 'high', relevance_score: 95 },
      ],
      evidence_summary: { high_quality_count: 2, moderate_quality_count: 1, low_quality_count: 0 },
      search_condition: 'community-acquired pneumonia',
    },
  })
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
  @ApiPropertyOptional({
    description: 'NICE clinical guidelines compliance check for this drug and indication',
    example: {
      is_compliant: true,
      compliance_level: 'full',
      recommendation_type: 'recommended',
      line_of_treatment: 'first_line',
      guideline_references: [{ id: 'CG191', title: 'Pneumonia in adults: diagnosis and management', url: 'https://www.nice.org.uk/guidance/cg191' }],
      warnings: [],
      recommendation_text: 'Amoxicillin/clavulanic acid is recommended as first-line treatment for moderate-severity community-acquired pneumonia',
    },
  })
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
  @ApiPropertyOptional({
    description: 'British National Formulary (BNF) validation data for this drug',
    example: {
      found_in_bnf: true,
      uk_approved: true,
      drug_class: 'Penicillins, broad-spectrum with beta-lactamase inhibitor',
      bnf_url: 'https://bnf.nice.org.uk/drugs/co-amoxiclav/',
      indications: ['Infections due to beta-lactamase-producing strains', 'Community-acquired pneumonia'],
      indication_match: true,
      dosage_appropriate: true,
      dosage_warnings: [],
      cautions: ['Hepatic impairment - monitor liver function'],
      contraindications: ['History of co-amoxiclav-associated jaundice'],
      interactions: [],
      side_effects: { common: ['Diarrhoea', 'Nausea'], uncommon: ['Skin rashes'], rare: ['Hepatitis'] },
      special_population_warnings: ['Use with caution in patients with hepatic impairment'],
    },
  })
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
  @ApiPropertyOptional({
    description: 'WHO Essential Medicines List (EML) validation for this drug',
    example: {
      found_in_eml: true,
      list_type: 'core',
      atc_code: 'J01CR02',
      section: '6.2.1',
      category: 'Beta-lactam medicines',
      matching_indications: ['Pneumonia', 'Upper respiratory tract infections'],
      formulations: [{ route: 'oral', form: 'tablet', strength: '500mg + 125mg' }],
      age_group_appropriate: true,
    },
  })
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
  @ApiProperty({ description: 'List of suggested medications with full analysis', type: [SuggestedMedicationDto] })
  suggestions: SuggestedMedicationDto[];

  @ApiProperty({
    description: 'Clinical context used for generating suggestions',
    example: { diagnosis: 'Community-acquired pneumonia', symptoms: ['Productive cough', 'Fever'], primary_condition: 'Pneumonia', triage_level: 'consultation' },
  })
  clinical_context: {
    diagnosis?: string;
    symptoms?: string[];
    primary_condition?: string;
    triage_level?: string;
  };

  @ApiProperty({
    description: 'Patient considerations factored into the suggestions',
    example: { allergies: ['Penicillin'], current_medications: ['Metformin 500mg'], chronic_conditions: ['Type 2 Diabetes'], age: 35, gender: 'Female' },
  })
  patient_considerations: {
    allergies: string[];
    current_medications: string[];
    chronic_conditions: string[];
    age: number;
    gender: string;
  };

  @ApiProperty({ description: 'AI-generated clinical summary of the medication suggestions', example: 'Based on the diagnosis of community-acquired pneumonia in a 35-year-old female with penicillin allergy, Azithromycin 500mg is recommended as first-line therapy. Cefuroxime 500mg is included as an alternative.' })
  clinical_summary: string;

  @ApiProperty({ description: 'Medical disclaimer for the AI-generated suggestions', example: 'These suggestions are AI-generated and must be reviewed by a qualified healthcare professional before prescribing.' })
  disclaimer: string;

  @ApiProperty({ description: 'Timestamp when the suggestions were generated', example: '2025-09-15T10:30:00.000Z' })
  generated_at: Date;

  @ApiProperty({ description: 'AI model used for generating the suggestions', example: 'claude-sonnet-4-20250514' })
  model: string;

  @ApiProperty({ description: 'Overall confidence score for the suggestions (0-100)', example: 88 })
  confidence_score: number;        // Overall confidence

  @ApiProperty({ description: 'Number of RxGPT credits consumed', example: 1 })
  credits_used: number;

  @ApiProperty({ description: 'Remaining RxGPT credits for the specialist', example: 49 })
  credits_remaining: number;

  // Fact-Check Layer summary
  @ApiPropertyOptional({
    description: 'Summary of drug verification across trusted pharmaceutical databases',
    example: { total_suggestions: 3, verified_count: 3, unverified_count: 0, fda_approved_count: 3, has_unverified_drugs: false },
  })
  verification_summary?: {
    total_suggestions: number;
    verified_count: number;
    unverified_count: number;
    fda_approved_count: number;
    has_unverified_drugs: boolean;
    warning?: string;
  };

  // Dosage Validation summary
  @ApiPropertyOptional({
    description: 'Summary of dosage validation results across all suggested drugs',
    example: { total_validated: 3, safe_count: 3, warning_count: 0, danger_count: 0, has_dosage_concerns: false },
  })
  dosage_validation_summary?: {
    total_validated: number;
    safe_count: number;
    warning_count: number;
    danger_count: number;
    has_dosage_concerns: boolean;
    warning?: string;
  };

  // PubMed Evidence summary
  @ApiPropertyOptional({
    description: 'Summary of PubMed evidence supporting the suggested medications',
    example: { total_drugs_with_evidence: 3, total_citations: 8, high_quality_evidence_count: 5, drugs_without_evidence: [], has_strong_evidence: true },
  })
  pubmed_evidence_summary?: {
    total_drugs_with_evidence: number;
    total_citations: number;
    high_quality_evidence_count: number;
    drugs_without_evidence: string[];
    has_strong_evidence: boolean;
  };

  // NICE Guidelines Compliance summary (UK)
  @ApiPropertyOptional({
    description: 'Summary of NICE clinical guidelines compliance across all suggested drugs',
    example: {
      total_drugs_checked: 3,
      fully_compliant: 2,
      partially_compliant: 1,
      non_compliant: 0,
      no_guidance_available: 0,
      has_compliance_issues: false,
      guidelines_referenced: [{ id: 'CG191', title: 'Pneumonia in adults', url: 'https://www.nice.org.uk/guidance/cg191' }],
    },
  })
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
  @ApiPropertyOptional({
    description: 'Summary of BNF (British National Formulary) compliance across all suggested drugs',
    example: { total_drugs_checked: 3, uk_approved_count: 3, not_uk_approved: [], dosage_warnings_count: 0, caution_flags_count: 1, interaction_alerts_count: 0, has_uk_compliance_issues: false },
  })
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
  @ApiPropertyOptional({
    description: 'Summary of WHO Essential Medicines List compliance across all suggested drugs',
    example: { total_drugs_checked: 3, eml_listed_count: 3, core_count: 2, complementary_count: 1, not_in_eml: [], has_eml_issues: false },
  })
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
  @ApiPropertyOptional({
    description: 'Aggregated evidence-based confidence summary across all suggestions',
    example: {
      overall_evidence_score: 88,
      overall_evidence_level: 'high',
      drugs_with_strong_evidence: 2,
      drugs_with_weak_evidence: 0,
      off_label_count: 0,
      evidence_sources_used: ['FDA', 'NICE', 'PubMed', 'BNF', 'WHO EML'],
      confidence_methodology: 'Base AI confidence adjusted by evidence from FDA, NICE, PubMed, BNF, and WHO EML databases',
    },
  })
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
  @ApiPropertyOptional({
    description: 'AI hallucination detection report verifying the integrity of generated suggestions',
    example: {
      passed: true,
      total_flags: 0,
      critical_count: 0,
      high_count: 0,
      medium_count: 0,
      low_count: 0,
      suspicion_score: 5,
      recommendation: 'safe',
      summary: 'All suggested medications verified against trusted databases. No hallucination concerns detected.',
    },
  })
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
