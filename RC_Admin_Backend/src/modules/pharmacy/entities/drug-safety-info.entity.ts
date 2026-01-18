import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type DrugSafetyInfoDocument = HydratedDocument<DrugSafetyInfo>;

/**
 * Drug Safety Information Entity
 * Stores FDA drug labeling data including side effects, warnings, and interactions
 * Data is synced from OpenFDA API every 30 days
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'drugsafetyinfo',
})
export class DrugSafetyInfo {
  // ============ DRUG REFERENCE ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Drug', index: true })
  drug_id: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  generic_name: string; // Used for FDA lookup

  @Prop({ type: String })
  brand_name: string;

  // ============ FDA DATA ============

  @Prop({ type: [String], default: [] })
  adverse_reactions: string[]; // Side effects from FDA labeling

  @Prop({ type: [String], default: [] })
  warnings: string[]; // General warnings

  @Prop({ type: [String], default: [] })
  warnings_and_cautions: string[]; // Detailed warnings

  @Prop({ type: [String], default: [] })
  boxed_warning: string[]; // Black box warnings (most serious)

  @Prop({ type: [String], default: [] })
  contraindications: string[]; // When NOT to use

  @Prop({ type: [String], default: [] })
  drug_interactions: string[]; // Interactions with other drugs

  @Prop({ type: [String], default: [] })
  food_safety_warning: string[]; // Food interactions and warnings

  @Prop({ type: [String], default: [] })
  pregnancy_or_breastfeeding: string[]; // Pregnancy/nursing warnings

  @Prop({ type: [String], default: [] })
  geriatric_use: string[]; // Elderly patient considerations

  @Prop({ type: [String], default: [] })
  pediatric_use: string[]; // Pediatric considerations

  @Prop({ type: [String], default: [] })
  overdosage: string[]; // Overdose information

  // ============ ADMIN CUSTOMIZATIONS ============

  @Prop(
    raw([
      {
        title: { type: String },
        content: { type: String },
        severity: {
          type: String,
          enum: ['info', 'warning', 'danger'],
          default: 'info',
        },
      },
    ]),
  )
  custom_warnings: {
    title: string;
    content: string;
    severity: 'info' | 'warning' | 'danger';
  }[];

  @Prop(
    raw([
      {
        name: { type: String },
        frequency: { type: String }, // common, uncommon, rare
        severity: { type: String }, // mild, moderate, severe
        description: { type: String },
      },
    ]),
  )
  custom_side_effects: {
    name: string;
    frequency?: string;
    severity?: string;
    description?: string;
  }[];

  @Prop({ type: String })
  admin_notes: string; // Internal notes from admin

  // ============ DISPLAY SETTINGS ============

  @Prop(
    raw({
      show_adverse_reactions: { type: Boolean, default: true },
      show_warnings: { type: Boolean, default: true },
      show_boxed_warning: { type: Boolean, default: true },
      show_contraindications: { type: Boolean, default: true },
      show_drug_interactions: { type: Boolean, default: true },
      show_pregnancy_info: { type: Boolean, default: true },
      show_custom_warnings: { type: Boolean, default: true },
    }),
  )
  display_settings: {
    show_adverse_reactions: boolean;
    show_warnings: boolean;
    show_boxed_warning: boolean;
    show_contraindications: boolean;
    show_drug_interactions: boolean;
    show_pregnancy_info: boolean;
    show_custom_warnings: boolean;
  };

  // Patient display mode: what version of safety info to show
  // - 'ai_only': Show only the AI-generated summary (default)
  // - 'fda_only': Show only the raw FDA data
  // - 'both': Show AI summary with option to view full FDA data
  @Prop({
    type: String,
    enum: ['ai_only', 'fda_only', 'both'],
    default: 'both',
  })
  patient_display_mode: 'ai_only' | 'fda_only' | 'both';

  // ============ SYNC METADATA ============

  @Prop({ type: String, default: 'OpenFDA' })
  source: string;

  @Prop({ type: String })
  source_url: string; // FDA API URL used

  @Prop({ type: String })
  fda_spl_id: string; // Structured Product Labeling ID

  @Prop({ type: Date })
  last_synced_at: Date;

  @Prop({ type: Date })
  next_sync_due: Date; // 30 days from last sync

  @Prop({ type: String })
  sync_status: 'pending' | 'synced' | 'failed' | 'no_data';

  @Prop({ type: String })
  sync_error: string; // Last sync error message

  @Prop({ type: Number, default: 0 })
  sync_attempts: number;

  // ============ AI SUMMARY ============

  @Prop(
    raw({
      overview: { type: String }, // Brief overview of the drug
      key_warnings: [{ type: String }], // Critical warnings in plain language
      common_side_effects: [{ type: String }], // Most common side effects
      serious_side_effects: [{ type: String }], // Serious side effects requiring attention
      who_should_avoid: [{ type: String }], // Who should not take this drug
      drug_interactions_summary: [{ type: String }], // Key drug interactions
      food_interactions_summary: [{ type: String }], // Food and beverage interactions
      pregnancy_summary: { type: String }, // Pregnancy/breastfeeding in plain language
      usage_tips: [{ type: String }], // Helpful tips for taking the medication
    }),
  )
  ai_summary: {
    overview: string;
    key_warnings: string[];
    common_side_effects: string[];
    serious_side_effects: string[];
    who_should_avoid: string[];
    drug_interactions_summary: string[];
    food_interactions_summary: string[];
    pregnancy_summary: string;
    usage_tips: string[];
  };

  @Prop({ type: Date })
  ai_summary_generated_at: Date;

  @Prop({ type: String })
  ai_model_used: string; // Track which Claude model was used

  @Prop({ type: Boolean, default: false })
  has_ai_summary: boolean;

  // ============ STATUS ============

  @Prop({ type: Boolean, default: true })
  is_enabled: boolean; // Admin toggle to show/hide

  @Prop({ type: Boolean, default: false })
  is_manually_curated: boolean; // If admin has customized

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  last_modified_by: mongoose.Types.ObjectId;

  // ============ RAW FDA RESPONSE ============

  @Prop({ type: mongoose.Schema.Types.Mixed })
  raw_fda_data: Record<string, any>; // Store complete FDA response for reference
}

export const DrugSafetyInfoSchema = SchemaFactory.createForClass(DrugSafetyInfo);

// ============ INDEXES ============

DrugSafetyInfoSchema.index({ drug_id: 1 }, { unique: true, sparse: true });
DrugSafetyInfoSchema.index({ generic_name: 1 });
DrugSafetyInfoSchema.index({ next_sync_due: 1, sync_status: 1 });
DrugSafetyInfoSchema.index({ is_enabled: 1 });

// Text search on generic and brand names
DrugSafetyInfoSchema.index(
  { generic_name: 'text', brand_name: 'text' },
  { name: 'drug_safety_text_search' },
);
