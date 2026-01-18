import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import {
  PurchaseType,
  ScheduleClass,
  DosageForm,
  DrugCategory,
  DrugStatus,
} from '../enums';

export type DrugDocument = HydratedDocument<Drug>;

/**
 * Comprehensive Drug Entity
 * Supports OTC, prescription, and controlled substances with full regulatory compliance
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'drugentities',
})
export class Drug {
  // ============ BASIC INFORMATION ============

  @Prop({ type: String, required: true, index: true })
  name: string; // Brand/trade name

  @Prop({ type: String, required: true, index: true })
  generic_name: string; // Active ingredient / INN name

  @Prop({ type: String })
  manufacturer: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', index: true })
  pharmacy_id: mongoose.Types.ObjectId; // Reference to owning pharmacy

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  short_description: string; // For card displays

  // ============ CLASSIFICATION ============

  @Prop({
    type: String,
    enum: Object.values(PurchaseType),
    default: PurchaseType.PRESCRIPTION_ONLY,
    index: true,
  })
  purchase_type: PurchaseType;

  @Prop({
    type: String,
    enum: Object.values(ScheduleClass),
    default: ScheduleClass.RX_ONLY,
  })
  schedule_class: ScheduleClass;

  @Prop({ type: String })
  atc_code: string; // Anatomical Therapeutic Chemical code

  @Prop({
    type: [String],
    enum: Object.values(DrugCategory),
    default: [],
    index: true,
  })
  categories: DrugCategory[];

  @Prop({ type: [String], default: [] })
  tags: string[]; // Additional searchable tags

  // ============ PRODUCT DETAILS ============

  @Prop({
    type: String,
    enum: Object.values(DosageForm),
    required: true,
  })
  dosage_form: DosageForm;

  @Prop({ type: String, required: true })
  strength: string; // e.g., "500mg", "10mg/5ml"

  @Prop({ type: Number, default: 1 })
  pack_size: number; // Units per pack

  @Prop({ type: String, default: 'units' })
  unit_of_measure: string; // "tablets", "ml", "capsules"

  @Prop({ type: String })
  sku: string; // Stock Keeping Unit

  @Prop({ type: String })
  barcode: string; // EAN/UPC barcode

  // ============ PRICING ============

  @Prop({ type: Number, required: true })
  cost_price: number; // Purchase cost (internal)

  @Prop({ type: Number, required: true })
  selling_price: number; // Patient-facing price

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  @Prop({ type: Number, default: 0 })
  discount_percentage: number; // Optional discount

  // ============ REGULATORY ============

  @Prop({ type: String })
  nafdac_number: string; // Nigerian FDA registration

  @Prop({ type: String })
  ndc_code: string; // National Drug Code (US)

  @Prop({ type: Boolean, default: true })
  requires_prescription: boolean;

  @Prop({ type: Boolean, default: false })
  requires_pharmacist_approval: boolean;

  @Prop({ type: Date })
  registration_expiry: Date; // When NAFDAC registration expires

  // ============ SAFETY INFORMATION ============

  @Prop({ type: [String], default: [] })
  contraindications: string[]; // Conditions where drug should not be used

  @Prop({ type: [String], default: [] })
  side_effects: string[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drug' }],
    default: [],
  })
  drug_interactions: mongoose.Types.ObjectId[]; // Drugs that interact with this one

  @Prop({ type: [String], default: [] })
  warnings: string[];

  @Prop({ type: [String], default: [] })
  precautions: string[];

  @Prop({ type: String })
  pregnancy_category: string; // A, B, C, D, X

  // ============ PURCHASE CONTROLS ============

  @Prop({ type: Number, default: 10 })
  max_quantity_per_order: number; // Max units per transaction

  @Prop({ type: Number, default: 0 })
  max_quantity_per_period: number; // Max units in rolling window (0 = unlimited)

  @Prop({ type: Number, default: 30 })
  period_days: number; // Rolling window in days

  @Prop({ type: Number, default: 0 })
  min_age: number; // Minimum age requirement (0 = no restriction)

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'HealthQuestionnaire' })
  health_questionnaire: mongoose.Types.ObjectId; // Linked screening questionnaire

  // ============ MEDIA ============

  @Prop(
    raw([
      {
        url: { type: String, required: true },
        is_primary: { type: Boolean, default: false },
        alt_text: { type: String },
      },
    ]),
  )
  images: {
    url: string;
    is_primary: boolean;
    alt_text?: string;
  }[];

  // ============ DOSAGE GUIDANCE ============

  @Prop(
    raw({
      adult: {
        min_dose: { type: String },
        max_dose: { type: String },
        frequency: { type: String },
        instructions: { type: String },
      },
      pediatric: {
        min_dose: { type: String },
        max_dose: { type: String },
        frequency: { type: String },
        instructions: { type: String },
        min_age_months: { type: Number },
      },
      elderly: {
        min_dose: { type: String },
        max_dose: { type: String },
        frequency: { type: String },
        instructions: { type: String },
      },
    }),
  )
  dosage_guidance: {
    adult?: {
      min_dose?: string;
      max_dose?: string;
      frequency?: string;
      instructions?: string;
    };
    pediatric?: {
      min_dose?: string;
      max_dose?: string;
      frequency?: string;
      instructions?: string;
      min_age_months?: number;
    };
    elderly?: {
      min_dose?: string;
      max_dose?: string;
      frequency?: string;
      instructions?: string;
    };
  };

  // ============ STATUS ============

  @Prop({
    type: String,
    enum: Object.values(DrugStatus),
    default: DrugStatus.ACTIVE,
    index: true,
  })
  status: DrugStatus;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: true })
  is_available: boolean; // Can be purchased (vs just viewable)

  @Prop({ type: Boolean, default: false })
  is_featured: boolean; // Show in featured sections

  // ============ SIMILAR DRUGS ============

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DrugEntity' }],
    default: [],
  })
  manually_linked_drugs: mongoose.Types.ObjectId[]; // Admin-defined similar drugs

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DrugEntity' }],
    default: [],
  })
  excluded_similar_drugs: mongoose.Types.ObjectId[]; // Drugs excluded from auto-matching

  // ============ SEARCH OPTIMIZATION ============

  @Prop({ type: [String], default: [] })
  search_keywords: string[]; // Additional search terms

  @Prop({ type: [String], default: [] })
  symptoms_treated: string[]; // For symptom-based search

  // ============ METADATA ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: mongoose.Types.ObjectId;
}

export const DrugSchema = SchemaFactory.createForClass(Drug);

// ============ INDEXES ============

// Text index for search
DrugSchema.index(
  {
    name: 'text',
    generic_name: 'text',
    description: 'text',
    search_keywords: 'text',
    symptoms_treated: 'text',
    tags: 'text',
  },
  {
    weights: {
      name: 10,
      generic_name: 8,
      symptoms_treated: 5,
      search_keywords: 3,
      tags: 2,
      description: 1,
    },
    name: 'drug_text_search',
  },
);

// Compound indexes for common queries
DrugSchema.index({ purchase_type: 1, is_active: 1, status: 1 });
DrugSchema.index({ categories: 1, is_active: 1 });
DrugSchema.index({ selling_price: 1 });
DrugSchema.index({ manufacturer: 1 });

// ============ VIRTUALS ============

DrugSchema.virtual('primary_image').get(function () {
  if (!this.images || this.images.length === 0) return null;
  const primary = this.images.find((img) => img.is_primary);
  return primary ? primary.url : this.images[0].url;
});

DrugSchema.virtual('is_otc').get(function () {
  return [PurchaseType.OTC_GENERAL, PurchaseType.OTC_RESTRICTED].includes(
    this.purchase_type,
  );
});

DrugSchema.virtual('display_name').get(function () {
  return `${this.name} ${this.strength} ${this.dosage_form}`;
});

// Ensure virtuals are included in JSON output
DrugSchema.set('toJSON', { virtuals: true });
DrugSchema.set('toObject', { virtuals: true });
