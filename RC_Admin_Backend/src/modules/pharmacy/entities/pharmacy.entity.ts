import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import {
  PharmacyVerificationStatus,
  PharmacyDocumentType,
  DayOfWeek,
  PaymentMethod,
  PharmacyType,
} from '../enums/pharmacy.enums';

export type PharmacyDocument = HydratedDocument<Pharmacy>;

/**
 * Comprehensive Pharmacy Entity
 * Supports full pharmacy operations, verification, and management
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Pharmacy {
  // ============ BASIC INFORMATION ============

  @Prop({ type: String, required: true, index: true })
  name: string;

  @Prop({ type: String, unique: true, sparse: true, index: true })
  slug: string;

  @Prop({ type: String })
  trading_name: string;

  @Prop({ type: String })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(PharmacyType),
    default: PharmacyType.RETAIL,
  })
  pharmacy_type: PharmacyType;

  @Prop({ type: Boolean, default: false })
  is_platform_default: boolean;

  // ============ REGISTRATION & LICENSE ============

  @Prop({ type: String, required: true, unique: true })
  registration_number: string;

  @Prop({ type: String })
  license_number: string;

  @Prop({ type: Date })
  license_expiry: Date;

  @Prop({ type: String })
  cac_registration: string;

  @Prop({ type: String })
  tax_id: string;

  // ============ CONTACT INFORMATION ============

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String })
  alternate_phone: string;

  @Prop({ type: String })
  website: string;

  // ============ ADDRESS ============

  @Prop(
    raw({
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: 'Nigeria' },
      postal_code: { type: String },
      landmark: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    }),
  )
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code?: string;
    landmark?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  // ============ OPERATING HOURS ============

  @Prop(
    raw([
      {
        day: {
          type: String,
          enum: Object.values(DayOfWeek),
          required: true,
        },
        is_open: { type: Boolean, default: true },
        open_time: { type: String },
        close_time: { type: String },
        break_start: { type: String },
        break_end: { type: String },
      },
    ]),
  )
  operating_hours: {
    day: DayOfWeek;
    is_open: boolean;
    open_time?: string;
    close_time?: string;
    break_start?: string;
    break_end?: string;
  }[];

  @Prop({ type: Boolean, default: false })
  is_24_hours: boolean;

  // ============ DELIVERY SETTINGS ============

  @Prop({ type: Boolean, default: true })
  offers_delivery: boolean;

  @Prop({ type: [String], default: [] })
  delivery_zones: string[];

  @Prop({ type: Number, default: 0 })
  delivery_fee: number;

  @Prop({ type: Number, default: 0 })
  free_delivery_threshold: number;

  @Prop({ type: Number, default: 0 })
  min_order_amount: number;

  @Prop({ type: String })
  estimated_delivery_time: string;

  @Prop({ type: Number, default: 10 })
  delivery_radius_km: number;

  // ============ PICKUP SETTINGS ============

  @Prop({ type: Boolean, default: true })
  offers_pickup: boolean;

  @Prop({ type: String })
  pickup_instructions: string;

  // ============ VERIFICATION ============

  @Prop({
    type: String,
    enum: Object.values(PharmacyVerificationStatus),
    default: PharmacyVerificationStatus.PENDING,
    index: true,
  })
  verification_status: PharmacyVerificationStatus;

  @Prop({ type: Date })
  verified_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  verified_by: mongoose.Types.ObjectId;

  @Prop({ type: String })
  verification_notes: string;

  @Prop(
    raw([
      {
        document_type: {
          type: String,
          enum: Object.values(PharmacyDocumentType),
          required: true,
        },
        url: { type: String, required: true },
        file_name: { type: String },
        uploaded_at: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
        verified_at: { type: Date },
        verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rejection_reason: { type: String },
      },
    ]),
  )
  documents: {
    document_type: PharmacyDocumentType;
    url: string;
    file_name?: string;
    uploaded_at: Date;
    verified: boolean;
    verified_at?: Date;
    verified_by?: mongoose.Types.ObjectId;
    rejection_reason?: string;
  }[];

  // ============ SUPERINTENDENT PHARMACIST ============

  @Prop(
    raw({
      name: { type: String },
      license_number: { type: String },
      phone: { type: String },
      email: { type: String },
    }),
  )
  superintendent_pharmacist: {
    name?: string;
    license_number?: string;
    phone?: string;
    email?: string;
  };

  // ============ RATINGS & REVIEWS ============

  @Prop({ type: Number, default: 0 })
  average_rating: number;

  @Prop({ type: Number, default: 0 })
  total_ratings: number;

  @Prop({ type: Number, default: 0 })
  total_orders: number;

  // ============ BANKING & PAYOUTS ============

  @Prop(
    raw({
      bank_name: { type: String },
      bank_code: { type: String },
      account_number: { type: String },
      account_name: { type: String },
      verified: { type: Boolean, default: false },
    }),
  )
  bank_details: {
    bank_name?: string;
    bank_code?: string;
    account_number?: string;
    account_name?: string;
    verified: boolean;
  };

  @Prop({ type: Number, default: 0 })
  commission_rate: number;

  @Prop({ type: Number, default: 0 })
  wallet_balance: number;

  // ============ PAYMENT SETTINGS ============

  @Prop({
    type: [String],
    enum: Object.values(PaymentMethod),
    default: [PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER],
  })
  accepted_payment_methods: PaymentMethod[];

  @Prop({ type: Boolean, default: false })
  accepts_insurance: boolean;

  @Prop({ type: [String], default: [] })
  accepted_insurance_providers: string[];

  // ============ CAPABILITIES ============

  @Prop({ type: Boolean, default: false })
  offers_consultation: boolean;

  @Prop({ type: Number, default: 0 })
  consultation_fee: number;

  @Prop({ type: Boolean, default: false })
  can_dispense_controlled: boolean;

  @Prop({ type: Boolean, default: false })
  offers_compounding: boolean;

  // ============ STATUS ============

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: true })
  is_online: boolean;

  @Prop({ type: Date })
  last_online_at: Date;

  @Prop({ type: String })
  offline_reason: string;

  @Prop({ type: Boolean, default: false })
  is_featured: boolean;

  // ============ SUSPENSION ============

  @Prop({ type: Boolean, default: false })
  is_suspended: boolean;

  @Prop({ type: String })
  suspension_reason: string;

  @Prop({ type: Date })
  suspended_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  suspended_by: mongoose.Types.ObjectId;

  // ============ OWNER/ADMIN ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  staff: mongoose.Types.ObjectId[];

  // ============ METADATA ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: mongoose.Types.ObjectId;
}

export const PharmacySchema = SchemaFactory.createForClass(Pharmacy);

// ============ INDEXES ============

PharmacySchema.index({ 'address.coordinates': '2dsphere' });
PharmacySchema.index({ verification_status: 1, is_active: 1, is_online: 1 });
PharmacySchema.index({ 'address.state': 1, 'address.city': 1 });
PharmacySchema.index({ delivery_zones: 1 });

PharmacySchema.index(
  { name: 'text', trading_name: 'text', 'address.city': 'text' },
  { name: 'pharmacy_text_search' },
);

// ============ VIRTUALS ============

PharmacySchema.virtual('is_verified').get(function () {
  return this.verification_status === PharmacyVerificationStatus.VERIFIED;
});

PharmacySchema.virtual('is_accepting_orders').get(function () {
  return (
    this.is_active &&
    this.is_online &&
    !this.is_suspended &&
    this.verification_status === PharmacyVerificationStatus.VERIFIED
  );
});

PharmacySchema.virtual('full_address').get(function () {
  if (!this.address) return '';
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.country,
  ].filter(Boolean);
  return parts.join(', ');
});

PharmacySchema.set('toJSON', { virtuals: true });
PharmacySchema.set('toObject', { virtuals: true });

// ============ MIDDLEWARE ============

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

PharmacySchema.pre('save', async function (next) {
  if (!this.slug || this.isModified('name')) {
    let baseSlug = generateSlug(this.name);
    let slug = baseSlug;
    let counter = 1;

    const PharmacyModel = this.constructor as any;
    while (true) {
      const existing = await PharmacyModel.findOne({
        slug: slug,
        _id: { $ne: this._id },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }

  if (this.isModified('is_online') && this.is_online) {
    this.last_online_at = new Date();
  }
  next();
});
