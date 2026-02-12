import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RxGPTSettingsDocument = HydratedDocument<RxGPTSettings>;

/**
 * RxGPT Settings Entity
 * Admin-configurable settings for the RxGPT AI prescription assistant
 */
@Schema({
  collection: 'rxgpt_settings',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RxGPTSettings {
  // ============ FEATURE STATUS ============

  @Prop({ type: Boolean, default: true })
  is_enabled: boolean; // Global enable/disable

  @Prop({ type: Boolean, default: true })
  is_enabled_for_specialists: boolean; // Enable for specialists

  // ============ AI MODEL CONFIGURATION ============

  @Prop({ type: String, default: 'claude-sonnet-4-20250514' })
  ai_model: string; // claude-sonnet-4, claude-opus-4, etc.

  @Prop({ type: Number, default: 4096 })
  max_tokens: number; // Token limit for responses

  @Prop({ type: Number, default: 0.3 })
  temperature: number; // AI temperature (0.0 - 1.0)

  // ============ CREDIT/COST CONFIGURATION ============

  @Prop(
    raw({
      credits_per_analysis: { type: Number, default: 1 },
      free_monthly_credits: { type: Number, default: 0 },
      allow_specialist_purchase: { type: Boolean, default: true },
    }),
  )
  credit_settings: {
    credits_per_analysis: number; // Admin can change cost per RxGPT call
    free_monthly_credits: number; // Free credits per month for specialists
    allow_specialist_purchase: boolean; // Allow specialists to buy credits
  };

  // ============ USAGE LIMITS ============

  @Prop(
    raw({
      daily_limit: { type: Number, default: 0 }, // 0 = unlimited
      monthly_limit: { type: Number, default: 0 }, // 0 = unlimited
      rate_limit_per_minute: { type: Number, default: 10 }, // Max requests per minute
      low_credit_warning_threshold: { type: Number, default: 5 }, // Warn when credits drop below this
      critical_credit_warning_threshold: { type: Number, default: 2 }, // Critical warning when below this
    }),
  )
  usage_limits: {
    daily_limit: number; // Max analyses per day per specialist (0 = unlimited)
    monthly_limit: number; // Max analyses per month per specialist (0 = unlimited)
    rate_limit_per_minute: number; // Max requests per minute to prevent abuse
    low_credit_warning_threshold: number; // Show warning when credits below this
    critical_credit_warning_threshold: number; // Show critical warning when below this
  };

  // ============ FEATURE TOGGLES ============

  @Prop(
    raw({
      allergy_checking: { type: Boolean, default: true },
      drug_interactions: { type: Boolean, default: true },
      dosage_validation: { type: Boolean, default: true },
      alternative_suggestions: { type: Boolean, default: true },
      clinical_reasoning: { type: Boolean, default: true },
      citations: { type: Boolean, default: true },
    }),
  )
  features: {
    allergy_checking: boolean;
    drug_interactions: boolean;
    dosage_validation: boolean;
    alternative_suggestions: boolean;
    clinical_reasoning: boolean;
    citations: boolean;
  };

  // ============ DATA SOURCES ============

  @Prop(
    raw({
      use_openfda: { type: Boolean, default: true },
      use_claude_ai: { type: Boolean, default: true },
      use_local_drug_db: { type: Boolean, default: true },
      use_pubmed: { type: Boolean, default: true },
      use_nice_guidelines: { type: Boolean, default: false },
      use_bnf: { type: Boolean, default: false },
      use_who_eml: { type: Boolean, default: false },
      use_hallucination_detection: { type: Boolean, default: true },
    }),
  )
  data_sources: {
    use_openfda: boolean;
    use_claude_ai: boolean;
    use_local_drug_db: boolean;
    use_pubmed: boolean;
    use_nice_guidelines: boolean;
    use_bnf: boolean;
    use_who_eml: boolean;
    use_hallucination_detection: boolean;
  };

  // ============ THRESHOLDS ============

  @Prop(
    raw({
      min_confidence_score: { type: Number, default: 70 },
      interaction_severity_threshold: { type: String, default: 'moderate' },
      max_alternatives: { type: Number, default: 3 },
    }),
  )
  thresholds: {
    min_confidence_score: number; // Min confidence to show recommendation (0-100)
    interaction_severity_threshold: 'low' | 'moderate' | 'high';
    max_alternatives: number; // Max alternative drugs to suggest
  };

  // ============ DISPLAY SETTINGS ============

  @Prop(
    raw({
      show_citations: { type: Boolean, default: true },
      show_confidence_scores: { type: Boolean, default: true },
      show_reasoning: { type: Boolean, default: true },
      auto_expand_alerts: { type: Boolean, default: true },
    }),
  )
  display: {
    show_citations: boolean;
    show_confidence_scores: boolean;
    show_reasoning: boolean;
    auto_expand_alerts: boolean;
  };

  // ============ DISCLAIMER ============

  @Prop({
    type: String,
    default:
      'RxGPT is an AI-powered assistant designed to support clinical decision-making. All recommendations should be reviewed and verified by a licensed healthcare professional. This tool does not replace professional medical judgment.',
  })
  disclaimer_text: string;

  // ============ ADMIN TRACKING ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  last_updated_by: Types.ObjectId;

  created_at: Date;
  updated_at: Date;
}

export const RxGPTSettingsSchema = SchemaFactory.createForClass(RxGPTSettings);

// Ensure only one settings document exists (singleton pattern)
RxGPTSettingsSchema.index({}, { unique: true });
