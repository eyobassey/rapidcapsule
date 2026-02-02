import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SpecialistPrescriptionDocument =
  HydratedDocument<SpecialistPrescription>;

// ============ ENUMS ============

export enum PrescriptionPaymentMethod {
  SPECIALIST_WALLET = 'specialist_wallet',
  PATIENT_ONLINE = 'patient_online',
  PATIENT_CASH = 'patient_cash',
  PATIENT_WALLET = 'patient_wallet',               // Full wallet payment from patient
  PATIENT_WALLET_PARTIAL = 'patient_wallet_partial', // Partial wallet + remainder via online/cash
  SEND_TO_PATIENT = 'send_to_patient',             // Send to patient for self-service (accept/decline/pay)
}

export enum PrescriptionPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum SpecialistPrescriptionStatus {
  DRAFT = 'draft',
  PENDING_ACCEPTANCE = 'pending_acceptance', // Sent to patient, awaiting acceptance
  ACCEPTED = 'accepted',                     // Patient accepted, pending payment
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  PROCESSING = 'processing',
  DISPENSED = 'dispensed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum PatientResponse {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PARTIAL = 'partial',
  DECLINED = 'declined',
}

export enum StockReservationStatus {
  ACTIVE = 'active',
  CONFIRMED = 'confirmed',
  RELEASED = 'released',
  EXPIRED = 'expired',
}

// ============ SUB-SCHEMAS ============

export interface PrescriptionItem {
  drug_id: mongoose.Types.ObjectId;
  drug_name: string;
  generic_name?: string;
  drug_strength: string;
  manufacturer?: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  unit_price: number;
  total_price: number;
  batch_id?: mongoose.Types.ObjectId;
  stock_reserved: boolean;
  stock_reservation_id?: string;
  stock_reservation_expires?: Date;
  // Patient acceptance tracking
  patient_accepted?: boolean;
  patient_declined_reason?: string;
  // Price tracking for recalculation
  original_unit_price?: number;
  price_updated_at?: Date;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  phone: string;
  recipient_name?: string;
  additional_info?: string;
}

export interface StatusHistoryEntry {
  status: SpecialistPrescriptionStatus;
  changed_at: Date;
  changed_by: mongoose.Types.ObjectId;
  notes?: string;
}

// ============ MAIN SCHEMA ============

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class SpecialistPrescription {
  // ============ IDENTIFICATION ============

  @Prop({ type: String, required: true, unique: true, index: true })
  prescription_number: string; // Auto: RX-YYYYMMDD-0001

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  specialist_id: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  patient_id: mongoose.Types.ObjectId;

  // ============ PRESCRIPTION ITEMS ============

  @Prop(
    raw([
      {
        drug_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DrugEntity',
          required: true,
        },
        drug_name: { type: String, required: true },
        generic_name: { type: String },
        drug_strength: { type: String, required: true },
        manufacturer: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String },
        unit_price: { type: Number, required: true },
        total_price: { type: Number, required: true },
        batch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StockBatchEntity' },
        stock_reserved: { type: Boolean, default: false },
        stock_reservation_id: { type: String },
        stock_reservation_expires: { type: Date },
        // Patient acceptance tracking
        patient_accepted: { type: Boolean },
        patient_declined_reason: { type: String },
        // Price tracking
        original_unit_price: { type: Number },
        price_updated_at: { type: Date },
      },
    ]),
  )
  items: PrescriptionItem[];

  // ============ PRICING ============

  @Prop({ type: Number, required: true, default: 0 })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: Number, default: 0 })
  delivery_fee: number;

  @Prop({ type: Number, required: true, default: 0 })
  total_amount: number;

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  // ============ PAYMENT ============

  @Prop({
    type: String,
    enum: Object.values(PrescriptionPaymentMethod),
  })
  payment_method: PrescriptionPaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PrescriptionPaymentStatus),
    default: PrescriptionPaymentStatus.PENDING,
  })
  payment_status: PrescriptionPaymentStatus;

  @Prop({ type: String })
  payment_reference: string;

  @Prop({ type: Date })
  paid_at: Date;

  @Prop({ type: String })
  paid_by: string; // 'specialist' or 'patient'

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SpecialistWalletTransaction' })
  wallet_transaction_id: mongoose.Types.ObjectId;

  // Patient wallet payment tracking
  @Prop({ type: Number, default: 0 })
  wallet_amount_paid: number; // Amount deducted from patient wallet

  @Prop({ type: Number, default: 0 })
  remaining_amount: number; // Amount still owed (for partial payments)

  @Prop({ type: String })
  remaining_payment_method: string; // 'online' or 'cash' for remainder

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction' })
  patient_wallet_transaction_id: mongoose.Types.ObjectId; // Reference to patient wallet transaction

  // ============ DELIVERY ============

  @Prop(
    raw({
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String, default: 'Nigeria' },
      postal_code: { type: String },
      phone: { type: String },
      recipient_name: { type: String },
      additional_info: { type: String },
    }),
  )
  delivery_address: DeliveryAddress;

  // ============ STATUS ============

  @Prop({
    type: String,
    enum: Object.values(SpecialistPrescriptionStatus),
    default: SpecialistPrescriptionStatus.DRAFT,
    index: true,
  })
  status: SpecialistPrescriptionStatus;

  @Prop(
    raw([
      {
        status: { type: String, enum: Object.values(SpecialistPrescriptionStatus) },
        changed_at: { type: Date, default: Date.now },
        changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String },
      },
    ]),
  )
  status_history: StatusHistoryEntry[];

  // ============ PHARMACY ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', index: true })
  pharmacy_id: mongoose.Types.ObjectId; // The pharmacy fulfilling this prescription

  // ============ PICKUP CENTER ============
  // When patient chooses pickup instead of delivery, they can select a pickup center

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', index: true })
  pickup_pharmacy_id: mongoose.Types.ObjectId; // The pharmacy where patient will pick up (if different from fulfilling pharmacy)

  @Prop({ type: Boolean, default: false })
  is_pickup_order: boolean; // Whether this is a pickup order vs delivery

  @Prop({ type: String })
  pickup_code: string; // Unique code for patient to show when picking up

  @Prop({ type: Date })
  ready_for_pickup_at: Date; // When order was marked ready for pickup

  @Prop({ type: Date })
  picked_up_at: Date; // When patient picked up the order

  @Prop({ type: String })
  pickup_confirmed_by: string; // Staff who confirmed pickup

  // ============ DISPENSING ============

  @Prop({ type: Date })
  dispensed_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  dispensed_by: mongoose.Types.ObjectId;

  @Prop({ type: String })
  dispensing_notes: string;

  // ============ SHIPPING ============

  @Prop({ type: Date })
  shipped_at: Date;

  @Prop({ type: String })
  shipping_method: string;

  @Prop({ type: String })
  tracking_number: string;

  @Prop({ type: String })
  courier_name: string;

  @Prop({ type: Date })
  estimated_delivery: Date;

  @Prop({ type: Date })
  delivered_at: Date;

  @Prop({ type: String })
  delivery_confirmation: string;

  // ============ NOTES ============

  @Prop({ type: String })
  clinical_notes: string; // Specialist notes

  @Prop({ type: String })
  pharmacy_notes: string; // Pharmacy staff notes

  @Prop({ type: String })
  patient_notes: string; // Notes for patient

  // ============ EXPIRY & REMINDERS ============

  @Prop({ type: Date, index: true })
  expires_at: Date; // 6 hours from creation for payment

  @Prop({ type: Number, default: 0 })
  payment_reminders_sent: number;

  @Prop({ type: Date })
  last_reminder_sent_at: Date;

  // ============ CANCELLATION ============

  @Prop({ type: String })
  cancellation_reason: string;

  @Prop({ type: Date })
  cancelled_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  cancelled_by: mongoose.Types.ObjectId;

  // ============ PDF & DIGITAL PRESCRIPTION ============

  @Prop({ type: String })
  pdf_url: string;

  @Prop({ type: String })
  pdf_hash: string;

  @Prop({ type: Date })
  pdf_generated_at: Date;

  // ============ PATIENT SELF-SERVICE ============

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'partial', 'declined'],
    default: 'pending',
  })
  patient_response: string;

  @Prop({ type: Date })
  patient_responded_at: Date;

  @Prop({ type: String })
  patient_decline_reason: string;

  @Prop({ type: Date, index: true })
  acceptance_expires_at: Date; // 48 hours from sending to patient

  @Prop({ type: Number, default: 0 })
  original_total: number; // Total at creation time

  @Prop({ type: Number, default: 0 })
  final_total: number; // Total at payment time (after price updates)

  @Prop({ type: Boolean, default: false })
  prices_recalculated: boolean;

  @Prop({ type: Date })
  prices_recalculated_at: Date;

  @Prop({ type: Date })
  sent_to_patient_at: Date;

  // ============ LINKED PHARMACY ORDER ============
  // When patient pays for prescription items via pharmacy cart checkout,
  // the pharmacy order is linked here for reference

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyOrder', index: true })
  linked_pharmacy_order: mongoose.Types.ObjectId;

  @Prop({ type: String })
  linked_pharmacy_order_number: string; // Denormalized for easy display

  @Prop({ type: Date })
  linked_at: Date; // When the pharmacy order was linked

  // ============ REFILL MANAGEMENT ============

  @Prop({ type: Boolean, default: false })
  is_refillable: boolean; // Whether this prescription can be refilled

  @Prop({ type: Number, default: 0 })
  refill_count: number; // Total number of refills allowed

  @Prop({ type: Number, default: 0 })
  refills_used: number; // Number of refills already used

  @Prop({ type: Number })
  days_supply: number; // How many days the medication supply lasts

  @Prop({ type: Date })
  last_fill_date: Date; // When the prescription was last filled

  @Prop({ type: Date, index: true })
  next_refill_date: Date; // Earliest date patient can request refill

  @Prop({ type: Date })
  prescription_valid_until: Date; // When the prescription itself expires (e.g., 1 year from creation)

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SpecialistPrescription' })
  original_prescription_id: mongoose.Types.ObjectId; // Reference to original prescription (for refills)

  @Prop({ type: Boolean, default: false })
  is_refill: boolean; // Whether this is a refill of another prescription

  @Prop({ type: Date })
  refill_reminder_sent_at: Date; // When last refill reminder was sent

  @Prop({ type: Number, default: 0 })
  refill_reminders_sent: number; // How many refill reminders have been sent

  // ============ PHARMACY RATING ============

  @Prop({ type: Number, min: 1, max: 5 })
  rating: number; // 1-5 star rating

  @Prop({ type: String, maxlength: 500 })
  review: string; // Optional review text

  @Prop({ type: Date })
  rated_at: Date;

  @Prop({ type: Date })
  rating_request_sent_at: Date; // When the initial rating request email was sent

  @Prop({ type: Date })
  rating_reminder_sent_at: Date; // When the follow-up rating reminder was sent

  // ============ RELATED ENTITIES ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' })
  appointment_id: mongoose.Types.ObjectId;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }])
  linked_appointments: mongoose.Types.ObjectId[];

  @Prop(
    raw([
      {
        appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
        note_id: { type: String },
      },
    ]),
  )
  linked_clinical_notes: Array<{
    appointment_id: mongoose.Types.ObjectId;
    note_id: string;
  }>;

  // ============ METADATA ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: mongoose.Types.ObjectId;
}

export const SpecialistPrescriptionSchema = SchemaFactory.createForClass(
  SpecialistPrescription,
);

// ============ INDEXES ============

SpecialistPrescriptionSchema.index({ specialist_id: 1, created_at: -1 });
SpecialistPrescriptionSchema.index({ patient_id: 1, created_at: -1 });
SpecialistPrescriptionSchema.index({ pharmacy_id: 1, status: 1, created_at: -1 }); // For pharmacy performance queries
SpecialistPrescriptionSchema.index({ status: 1, expires_at: 1 }); // For expiry job
SpecialistPrescriptionSchema.index({ payment_status: 1, status: 1 });
SpecialistPrescriptionSchema.index({
  'items.stock_reservation_expires': 1,
  'items.stock_reserved': 1,
}); // For reservation cleanup
SpecialistPrescriptionSchema.index({
  next_refill_date: 1,
  is_refillable: 1,
  status: 1,
}); // For refill reminder job
SpecialistPrescriptionSchema.index({
  original_prescription_id: 1,
  is_refill: 1,
}); // For finding refill history
SpecialistPrescriptionSchema.index({
  pickup_pharmacy_id: 1,
  is_pickup_order: 1,
  status: 1,
}); // For pickup center queries

// ============ VIRTUALS ============

SpecialistPrescriptionSchema.virtual('specialist', {
  ref: 'User',
  localField: 'specialist_id',
  foreignField: '_id',
  justOne: true,
});

SpecialistPrescriptionSchema.virtual('patient', {
  ref: 'User',
  localField: 'patient_id',
  foreignField: '_id',
  justOne: true,
});

SpecialistPrescriptionSchema.virtual('pickup_pharmacy', {
  ref: 'Pharmacy',
  localField: 'pickup_pharmacy_id',
  foreignField: '_id',
  justOne: true,
});

SpecialistPrescriptionSchema.virtual('item_count').get(function () {
  return this.items?.length || 0;
});

SpecialistPrescriptionSchema.virtual('is_expired').get(function () {
  if (!this.expires_at) return false;
  return new Date() > new Date(this.expires_at);
});

SpecialistPrescriptionSchema.virtual('time_until_expiry').get(function () {
  if (!this.expires_at) return null;
  const now = new Date();
  const expiry = new Date(this.expires_at);
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60)); // Return minutes
});

SpecialistPrescriptionSchema.set('toJSON', { virtuals: true });
SpecialistPrescriptionSchema.set('toObject', { virtuals: true });

// ============ PRE HOOKS ============

SpecialistPrescriptionSchema.pre('find', function (next) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (this?.options._recursed) {
    return next();
  }
  this.populate({
    path: 'specialist_id patient_id',
    options: { _recursed: true },
    select: '-profile.password -profile.twoFA_secret -security',
  });
  next();
});

SpecialistPrescriptionSchema.pre('findOne', function (next) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (this?.options._recursed) {
    return next();
  }
  this.populate({
    path: 'specialist_id patient_id',
    options: { _recursed: true },
    select: '-profile.password -profile.twoFA_secret -security',
  });
  next();
});
