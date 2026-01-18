import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PharmacyOrderDocument = HydratedDocument<PharmacyOrder>;

// ============ ENUMS ============

export enum PharmacyOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PharmacyOrderPaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PharmacyOrderType {
  PRESCRIPTION = 'PRESCRIPTION',
  OTC = 'OTC',
  MIXED = 'MIXED',
}

export enum DeliveryMethod {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export enum PrescriptionVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  REQUIRES_CLARIFICATION = 'REQUIRES_CLARIFICATION',
}

/**
 * PharmacyOrder Entity
 * Handles drug orders from patients to pharmacies
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class PharmacyOrder {
  // ============ REFERENCES ============

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  patient: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true,
    index: true,
  })
  pharmacy: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
  })
  prescription: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SpecialistPrescription',
    index: true,
  })
  specialist_prescription: mongoose.Types.ObjectId;

  // ============ ORDER INFO ============

  @Prop({ type: String, required: true, unique: true })
  order_number: string;

  @Prop({
    type: String,
    enum: Object.values(PharmacyOrderType),
    required: true,
  })
  order_type: PharmacyOrderType;

  @Prop({
    type: String,
    enum: Object.values(PharmacyOrderStatus),
    default: PharmacyOrderStatus.PENDING,
    index: true,
  })
  status: PharmacyOrderStatus;

  // ============ ORDER ITEMS ============

  @Prop(
    raw([
      {
        drug: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Drug',
          required: true,
        },
        inventory: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Inventory',
        },
        drug_name: { type: String, required: true },
        generic_name: { type: String },
        strength: { type: String },
        dosage_form: { type: String },
        manufacturer: { type: String },
        quantity: { type: Number, required: true },
        unit_price: { type: Number, required: true },
        total_price: { type: Number, required: true },
        discount_applied: { type: Number, default: 0 },
        requires_prescription: { type: Boolean, default: false },
        prescription_verified: { type: Boolean, default: false },
        // Prescription details if applicable
        dosage_instructions: { type: String },
        duration_days: { type: Number },
        refills_remaining: { type: Number, default: 0 },
        // Batch tracking
        batch_number: { type: String },
        expiry_date: { type: Date },
      },
    ]),
  )
  items: {
    drug: mongoose.Types.ObjectId;
    inventory?: mongoose.Types.ObjectId;
    drug_name: string;
    generic_name?: string;
    strength?: string;
    dosage_form?: string;
    manufacturer?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    discount_applied: number;
    requires_prescription: boolean;
    prescription_verified: boolean;
    dosage_instructions?: string;
    duration_days?: number;
    refills_remaining?: number;
    batch_number?: string;
    expiry_date?: Date;
  }[];

  // ============ PRESCRIPTION VERIFICATION ============

  @Prop({
    type: String,
    enum: Object.values(PrescriptionVerificationStatus),
  })
  prescription_verification_status: PrescriptionVerificationStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  verified_by: mongoose.Types.ObjectId;

  @Prop({ type: Date })
  verified_at: Date;

  @Prop({ type: String })
  verification_notes: string;

  @Prop({ type: String })
  rejection_reason: string;

  @Prop({ type: Number })
  verification_score: number;

  // ============ DRUG INTERACTIONS & SAFETY ============

  @Prop(
    raw([
      {
        drug1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug' },
        drug1_name: { type: String },
        drug2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug' },
        drug2_name: { type: String },
        severity: { type: String }, // mild, moderate, severe, critical
        description: { type: String },
        clinical_effects: { type: String },
        recommendation: { type: String },
        source: { type: String }, // claude_ai, openfda, rxnav
        confidence: { type: Number },
      },
    ]),
  )
  drug_interactions: {
    drug1_id?: mongoose.Types.ObjectId;
    drug1_name: string;
    drug2_id?: mongoose.Types.ObjectId;
    drug2_name: string;
    severity: string;
    description: string;
    clinical_effects?: string;
    recommendation?: string;
    source: string;
    confidence?: number;
  }[];

  @Prop({ type: Boolean, default: false })
  has_interaction_warnings: boolean;

  @Prop(
    raw([
      {
        drug_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug' },
        drug_name: { type: String },
        ai_summary: {
          key_points: [{ type: String }],
          common_side_effects: [{ type: String }],
          serious_warnings: [{ type: String }],
          usage_tips: [{ type: String }],
          generated_at: { type: Date },
        },
        boxed_warning: { type: String },
        contraindications: [{ type: String }],
        pregnancy_category: { type: String },
      },
    ]),
  )
  drug_safety_info: {
    drug_id?: mongoose.Types.ObjectId;
    drug_name: string;
    ai_summary?: {
      key_points?: string[];
      common_side_effects?: string[];
      serious_warnings?: string[];
      usage_tips?: string[];
      generated_at?: Date;
    };
    boxed_warning?: string;
    contraindications?: string[];
    pregnancy_category?: string;
  }[];

  // ============ ORDER CONFIRMATION ============

  @Prop({ type: String })
  confirmation_pdf_url: string;

  @Prop({ type: String })
  confirmation_pdf_hash: string;

  @Prop({ type: Date })
  confirmation_email_sent_at: Date;

  @Prop({ type: Boolean, default: false })
  requires_pharmacist_review: boolean;

  @Prop({ type: String })
  pharmacist_review_reason: string;

  // ============ PRICING ============

  @Prop({ type: Number, required: true })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  discount_amount: number;

  @Prop({ type: String })
  discount_code: string;

  @Prop({ type: Number, default: 0 })
  tax_amount: number;

  @Prop({ type: Number, default: 0 })
  delivery_fee: number;

  @Prop({ type: Number, required: true })
  total_amount: number;

  // ============ PAYMENT ============

  @Prop({
    type: String,
    enum: Object.values(PharmacyOrderPaymentStatus),
    default: PharmacyOrderPaymentStatus.PENDING,
    index: true,
  })
  payment_status: PharmacyOrderPaymentStatus;

  @Prop({ type: String })
  payment_method: string;

  @Prop({ type: String })
  payment_reference: string;

  @Prop({ type: Date })
  paid_at: Date;

  @Prop({ type: Number })
  amount_paid: number;

  @Prop({ type: Number, default: 0 })
  wallet_amount_paid: number;

  @Prop({ type: Number, default: 0 })
  card_amount_paid: number;

  @Prop({ type: Number })
  refund_amount: number;

  @Prop({ type: String })
  refund_reason: string;

  @Prop({ type: Date })
  refunded_at: Date;

  // ============ DELIVERY ============

  @Prop({
    type: String,
    enum: Object.values(DeliveryMethod),
    default: DeliveryMethod.DELIVERY,
  })
  delivery_method: DeliveryMethod;

  @Prop(
    raw({
      recipient_name: { type: String },
      phone: { type: String },
      email: { type: String },
      address_line1: { type: String },
      address_line2: { type: String },
      city: { type: String },
      state: { type: String },
      postal_code: { type: String },
      landmark: { type: String },
      delivery_instructions: { type: String },
      coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: [Number],
      },
    }),
  )
  delivery_address: {
    recipient_name: string;
    phone: string;
    email: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code?: string;
    landmark?: string;
    delivery_instructions?: string;
    coordinates?: {
      type: string;
      coordinates: number[];
    };
  };

  @Prop({ type: Date })
  estimated_delivery_date: Date;

  @Prop({ type: Date })
  actual_delivery_date: Date;

  @Prop({ type: String })
  delivery_tracking_number: string;

  @Prop({ type: String })
  delivery_notes: string;

  // ============ PICKUP ============

  @Prop({ type: Date })
  ready_for_pickup_at: Date;

  @Prop({ type: Date })
  pickup_deadline: Date;

  @Prop({ type: Date })
  picked_up_at: Date;

  @Prop({ type: String })
  pickup_code: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  picked_up_by: mongoose.Types.ObjectId;

  // ============ STATUS TRACKING ============

  @Prop(
    raw([
      {
        status: { type: String },
        timestamp: { type: Date },
        note: { type: String },
        updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ]),
  )
  status_history: {
    status: string;
    timestamp: Date;
    note?: string;
    updated_by?: mongoose.Types.ObjectId;
  }[];

  // ============ DISPENSING ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  dispensed_by: mongoose.Types.ObjectId;

  @Prop({ type: Date })
  dispensed_at: Date;

  @Prop({ type: String })
  dispensing_notes: string;

  // ============ PATIENT NOTES ============

  @Prop({ type: String })
  patient_notes: string;

  @Prop({ type: String })
  special_instructions: string;

  // ============ RATINGS ============

  @Prop({ type: Number, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String })
  review: string;

  @Prop({ type: Date })
  rated_at: Date;

  @Prop({ type: Date })
  rating_request_sent_at: Date;

  @Prop({ type: Date })
  rating_reminder_sent_at: Date;

  // ============ METADATA ============

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  cancelled_by: mongoose.Types.ObjectId;

  @Prop({ type: Date })
  cancelled_at: Date;

  @Prop({ type: String })
  cancellation_reason: string;
}

export const PharmacyOrderSchema = SchemaFactory.createForClass(PharmacyOrder);

// ============ INDEXES ============

PharmacyOrderSchema.index({ patient: 1, created_at: -1 });
PharmacyOrderSchema.index({ pharmacy: 1, status: 1, created_at: -1 });
PharmacyOrderSchema.index({ order_number: 1 }, { unique: true });
PharmacyOrderSchema.index({ prescription: 1 });
PharmacyOrderSchema.index({ status: 1, payment_status: 1 });

// ============ VIRTUALS ============

PharmacyOrderSchema.virtual('items_count').get(function () {
  return this.items?.length || 0;
});

PharmacyOrderSchema.virtual('total_quantity').get(function () {
  return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
});

PharmacyOrderSchema.virtual('has_prescription_items').get(function () {
  return this.items?.some((item) => item.requires_prescription) || false;
});

PharmacyOrderSchema.virtual('all_items_verified').get(function () {
  const prescriptionItems = this.items?.filter(
    (item) => item.requires_prescription,
  );
  if (!prescriptionItems?.length) return true;
  return prescriptionItems.every((item) => item.prescription_verified);
});

PharmacyOrderSchema.virtual('can_be_dispensed').get(function () {
  return (
    this.payment_status === PharmacyOrderPaymentStatus.PAID &&
    (this.prescription_verification_status ===
      PrescriptionVerificationStatus.VERIFIED ||
      !this.items?.some((item) => item.requires_prescription))
  );
});

// Ensure virtuals are included in JSON output
PharmacyOrderSchema.set('toJSON', { virtuals: true });
PharmacyOrderSchema.set('toObject', { virtuals: true });

// ============ MIDDLEWARE ============

// Auto-add status history on status change
PharmacyOrderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (!this.status_history) {
      this.status_history = [];
    }
    this.status_history.push({
      status: this.status,
      timestamp: new Date(),
      updated_by: this.updated_by,
    });
  }
  next();
});
