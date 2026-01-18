import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import {
  PharmacyVerificationStatus,
  PharmacyDocumentType,
  DayOfWeek,
  PaymentMethod,
  PharmacyType,
} from '../enums';

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
  slug: string; // URL-friendly identifier (e.g., "rapid-capsule-pharmacy")

  @Prop({ type: String })
  trading_name: string; // "Doing business as" name

  @Prop({ type: String })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(PharmacyType),
    default: PharmacyType.RETAIL,
  })
  pharmacy_type: PharmacyType;

  // ============ REGISTRATION & LICENSE ============

  @Prop({ type: String, required: true, unique: true })
  registration_number: string; // PCN registration number

  @Prop({ type: String })
  license_number: string; // Pharmacy license

  @Prop({ type: Date })
  license_expiry: Date;

  @Prop({ type: String })
  cac_registration: string; // Corporate Affairs Commission number

  @Prop({ type: String })
  tax_id: string; // Tax Identification Number

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
        open_time: { type: String }, // "08:00"
        close_time: { type: String }, // "20:00"
        break_start: { type: String }, // Optional break
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
  delivery_zones: string[]; // Areas/LGAs served

  @Prop({ type: Number, default: 0 })
  delivery_fee: number;

  @Prop({ type: Number, default: 0 })
  free_delivery_threshold: number; // Order amount for free delivery

  @Prop({ type: Number, default: 0 })
  min_order_amount: number;

  @Prop({ type: String })
  estimated_delivery_time: string; // "1-2 hours", "Same day"

  @Prop({ type: Number, default: 10 })
  delivery_radius_km: number; // Delivery radius in kilometers

  // ============ PICKUP SETTINGS ============

  @Prop({ type: Boolean, default: true })
  offers_pickup: boolean;

  @Prop({ type: String })
  pickup_instructions: string;

  // ============ PICKUP CENTER SETTINGS ============
  // When enabled, this pharmacy can serve as a pickup location for orders
  // from OTHER pharmacies (not just their own orders)

  @Prop({ type: Boolean, default: false })
  is_pickup_center: boolean;

  @Prop(
    raw({
      accepts_external_orders: { type: Boolean, default: true }, // Accept orders from other pharmacies
      max_daily_pickups: { type: Number, default: 50 }, // Daily capacity limit
      storage_capacity: { type: String }, // "small", "medium", "large"
      accepts_refrigerated: { type: Boolean, default: false }, // Can store refrigerated items
      pickup_hours_same_as_operating: { type: Boolean, default: true },
      pickup_hours: [
        {
          day: { type: String },
          is_open: { type: Boolean, default: true },
          open_time: { type: String },
          close_time: { type: String },
        },
      ],
      external_pickup_instructions: { type: String }, // Special instructions for external orders
      handling_fee: { type: Number, default: 0 }, // Fee charged for handling external pickups
      notification_email: { type: String }, // Email for pickup notifications
      notification_phone: { type: String }, // Phone for pickup notifications
    }),
  )
  pickup_center_settings: {
    accepts_external_orders: boolean;
    max_daily_pickups: number;
    storage_capacity?: string;
    accepts_refrigerated: boolean;
    pickup_hours_same_as_operating: boolean;
    pickup_hours?: {
      day: string;
      is_open: boolean;
      open_time?: string;
      close_time?: string;
    }[];
    external_pickup_instructions?: string;
    handling_fee: number;
    notification_email?: string;
    notification_phone?: string;
  };

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
  commission_rate: number; // Platform commission percentage

  @Prop({ type: Number, default: 0 })
  wallet_balance: number; // Pending payouts

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
  offers_consultation: boolean; // Pharmacist consultation

  @Prop({ type: Number, default: 0 })
  consultation_fee: number;

  @Prop({ type: Boolean, default: false })
  can_dispense_controlled: boolean; // Licensed for controlled substances

  @Prop({ type: Boolean, default: false })
  offers_compounding: boolean; // Custom medication preparation

  // ============ STATUS ============

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: true })
  is_online: boolean; // Currently accepting orders

  @Prop({ type: Date })
  last_online_at: Date;

  @Prop({ type: String })
  offline_reason: string; // Why pharmacy is offline

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
  owner: mongoose.Types.ObjectId; // Primary account owner

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  staff: mongoose.Types.ObjectId[]; // Staff with access

  // ============ METADATA ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: mongoose.Types.ObjectId;
}

export const PharmacySchema = SchemaFactory.createForClass(Pharmacy);

// ============ INDEXES ============

// Geospatial index for location-based queries
PharmacySchema.index({ 'address.coordinates': '2dsphere' });

// Compound indexes for common queries
PharmacySchema.index({ verification_status: 1, is_active: 1, is_online: 1 });
PharmacySchema.index({ 'address.state': 1, 'address.city': 1 });
PharmacySchema.index({ delivery_zones: 1 });

// Pickup center index for finding available pickup locations
PharmacySchema.index({ is_pickup_center: 1, is_active: 1, 'address.state': 1 });

// Text index for search
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

PharmacySchema.virtual('is_available_as_pickup_center').get(function () {
  return (
    this.is_pickup_center &&
    this.is_active &&
    !this.is_suspended &&
    this.verification_status === PharmacyVerificationStatus.VERIFIED &&
    this.pickup_center_settings?.accepts_external_orders !== false
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

// Ensure virtuals are included in JSON output
PharmacySchema.set('toJSON', { virtuals: true });
PharmacySchema.set('toObject', { virtuals: true });

// ============ MIDDLEWARE ============

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Auto-generate slug and update last_online_at
PharmacySchema.pre('save', async function (next) {
  // Generate slug from name if not set or if name changed
  if (!this.slug || this.isModified('name')) {
    let baseSlug = generateSlug(this.name);
    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness and add counter if needed
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

  // Update last_online_at when is_online changes to true
  if (this.isModified('is_online') && this.is_online) {
    this.last_online_at = new Date();
  }
  next();
});
