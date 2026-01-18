import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type DrugDocument = HydratedDocument<DrugEntity>;

/**
 * Comprehensive Drug Entity
 * Supports all classification tiers from OTC to Controlled Substances
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class DrugEntity {
  // ============ BASIC INFORMATION ============

  @Prop({ type: String, required: true, index: true })
  name: string; // Brand/trade name (e.g., "Tylenol", "Advil")

  @Prop({ type: String, required: true, index: true })
  generic_name: string; // Active ingredient / INN name (e.g., "Paracetamol", "Ibuprofen")

  @Prop({ type: String })
  brand_name: string; // Manufacturer's brand name

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ManufacturerEntity' })
  manufacturer: mongoose.Types.ObjectId; // Reference to ManufacturerEntity

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', index: true })
  pharmacy_id: mongoose.Types.ObjectId; // Reference to owning pharmacy

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  short_description: string; // For card displays

  // ============ CLASSIFICATION & CATEGORIZATION ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'DrugClassificationEntity', required: true })
  classification: mongoose.Types.ObjectId; // Links to DrugClassificationEntity (OTC, POM, Controlled, etc.)

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DrugCategoryEntity' }], default: [] })
  categories: mongoose.Types.ObjectId[]; // Links to DrugCategoryEntity (Pain Relief, Cold & Flu, etc.)

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'DosageFormEntity' })
  dosage_form: mongoose.Types.ObjectId; // Links to DosageFormEntity (Tablet, Capsule, etc.)

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'DrugRouteEntity' })
  route: mongoose.Types.ObjectId; // Links to DrugRouteEntity (Oral, Topical, etc.)

  @Prop({ type: [String], default: [] })
  tags: string[]; // Additional searchable tags

  // ============ PRODUCT DETAILS ============

  @Prop({ type: String, required: true })
  strength: string; // e.g., "500mg", "10mg/5ml", "200mg"

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
  discount_percentage: number;

  // ============ INVENTORY ============

  @Prop({ type: Number, default: 0 })
  quantity: number; // Current stock

  @Prop({ type: Number, default: 10 })
  reorder_level: number; // Low stock threshold

  @Prop({ type: Number, default: 100 })
  max_stock_level: number;

  // ============ REGULATORY ============

  @Prop({ type: String })
  nafdac_number: string; // Nigerian FDA registration

  @Prop({ type: String })
  ndc_code: string; // National Drug Code

  @Prop({ type: Date })
  registration_expiry: Date;

  @Prop({ type: Date })
  expiry_date: Date; // Product expiry date

  // ============ RESTRICTIONS & CONTROLS ============

  @Prop({ type: Boolean, default: false })
  requires_prescription: boolean;

  @Prop({ type: Boolean, default: false })
  requires_pharmacist_approval: boolean;

  @Prop({ type: Boolean, default: false })
  requires_health_screening: boolean; // For OTC-Restricted items

  @Prop({ type: Boolean, default: false })
  requires_id_verification: boolean;

  @Prop({ type: Boolean, default: false })
  requires_purchase_tracking: boolean; // For abuse-potential drugs

  @Prop({ type: Number, default: 0 })
  min_age: number; // Minimum age requirement (0 = no restriction)

  @Prop({ type: Number, default: 10 })
  max_quantity_per_order: number;

  @Prop({ type: Number, default: 0 })
  max_quantity_per_period: number; // Max in rolling window (0 = unlimited)

  @Prop({ type: Number, default: 30 })
  period_days: number; // Rolling window in days

  @Prop({ type: Number, default: 0 })
  purchase_gap_hours: number; // Minimum hours between purchases (for restricted items)

  @Prop({ type: String })
  restriction_reason: string; // Why this drug is restricted

  @Prop({ type: [String], default: [] })
  special_controls: string[]; // Special handling requirements

  // ============ SAFETY INFORMATION ============

  @Prop({ type: [String], default: [] })
  contraindications: string[];

  @Prop({ type: [String], default: [] })
  side_effects: string[];

  @Prop({ type: [String], default: [] })
  warnings: string[];

  @Prop({ type: [String], default: [] })
  precautions: string[];

  @Prop({ type: String })
  pregnancy_category: string; // A, B, C, D, X

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DrugEntity' }],
    default: [],
  })
  drug_interactions: mongoose.Types.ObjectId[];

  // ============ PHARMACIST NOTES ============

  @Prop({ type: String })
  pharmacist_counseling_points: string; // Key points for pharmacist consultation

  @Prop({ type: String })
  patient_information: string; // Info to provide to patient

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
        dose: { type: String },
        frequency: { type: String },
        max_daily_dose: { type: String },
        instructions: { type: String },
      },
      pediatric: {
        dose: { type: String },
        frequency: { type: String },
        min_age_months: { type: Number },
        instructions: { type: String },
      },
      elderly: {
        dose: { type: String },
        frequency: { type: String },
        instructions: { type: String },
      },
    }),
  )
  dosage_guidance: {
    adult?: {
      dose?: string;
      frequency?: string;
      max_daily_dose?: string;
      instructions?: string;
    };
    pediatric?: {
      dose?: string;
      frequency?: string;
      min_age_months?: number;
      instructions?: string;
    };
    elderly?: {
      dose?: string;
      frequency?: string;
      instructions?: string;
    };
  };

  // ============ STATUS ============

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: true })
  is_available: boolean;

  @Prop({ type: Boolean, default: false })
  is_featured: boolean;

  @Prop({ type: Boolean, default: false })
  is_sample_data: boolean; // True for seeded example data

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
  search_keywords: string[];

  @Prop({ type: [String], default: [] })
  symptoms_treated: string[];

  // ============ METADATA ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: mongoose.Types.ObjectId;
}

export const DrugSchema = SchemaFactory.createForClass(DrugEntity);

// Indexes
DrugSchema.index({ name: 'text', generic_name: 'text', brand_name: 'text', search_keywords: 'text' });
DrugSchema.index({ classification: 1, is_active: 1 });
DrugSchema.index({ categories: 1, is_active: 1 });
DrugSchema.index({ selling_price: 1 });
DrugSchema.index({ quantity: 1 });
DrugSchema.index({ pharmacy_id: 1, is_active: 1 }); // Pharmacy-specific queries
DrugSchema.index({ pharmacy_id: 1, name: 1 }); // Unique drug per pharmacy

// Virtuals
DrugSchema.virtual('primary_image').get(function () {
  if (!this.images || this.images.length === 0) return null;
  const primary = this.images.find((img) => img.is_primary);
  return primary ? primary.url : this.images[0].url;
});

DrugSchema.virtual('is_low_stock').get(function () {
  return this.quantity <= this.reorder_level;
});

DrugSchema.virtual('is_out_of_stock').get(function () {
  return this.quantity <= 0;
});

DrugSchema.set('toJSON', { virtuals: true });
DrugSchema.set('toObject', { virtuals: true });
