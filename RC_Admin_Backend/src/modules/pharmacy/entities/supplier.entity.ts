import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SupplierDocument = HydratedDocument<SupplierEntity>;

export enum PaymentTerms {
  COD = 'cod',
  NET_7 = 'net_7',
  NET_15 = 'net_15',
  NET_30 = 'net_30',
  NET_60 = 'net_60',
  PREPAID = 'prepaid',
}

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class SupplierEntity {
  // ============ BASIC INFORMATION ============

  @Prop({ type: String, required: true, index: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  supplier_code: string; // Auto-generated: SUP-001, SUP-002, etc.

  @Prop({ type: String })
  short_name: string;

  @Prop({ type: String })
  description: string;

  // ============ CONTACT INFORMATION ============

  @Prop(
    raw({
      phone: { type: String },
      alternate_phone: { type: String },
      email: { type: String },
      contact_person: { type: String },
      contact_person_title: { type: String },
      contact_person_phone: { type: String },
      website: { type: String },
    }),
  )
  contact: {
    phone?: string;
    alternate_phone?: string;
    email?: string;
    contact_person?: string;
    contact_person_title?: string;
    contact_person_phone?: string;
    website?: string;
  };

  // ============ ADDRESS ============

  @Prop(
    raw({
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String, default: 'Nigeria' },
      postal_code: { type: String },
    }),
  )
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };

  // ============ LICENSE & VERIFICATION ============

  @Prop(
    raw({
      number: { type: String },
      type: { type: String }, // e.g., "Wholesale Pharmacy License", "Drug Distributor License"
      issuing_authority: { type: String },
      issue_date: { type: Date },
      expiry_date: { type: Date },
      is_verified: { type: Boolean, default: false },
      verified_at: { type: Date },
      verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      document_url: { type: String },
    }),
  )
  license: {
    number?: string;
    type?: string;
    issuing_authority?: string;
    issue_date?: Date;
    expiry_date?: Date;
    is_verified?: boolean;
    verified_at?: Date;
    verified_by?: mongoose.Types.ObjectId;
    document_url?: string;
  };

  // ============ BANKING INFORMATION ============

  @Prop(
    raw({
      bank_name: { type: String },
      account_number: { type: String },
      account_name: { type: String },
      bank_code: { type: String },
    }),
  )
  banking: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    bank_code?: string;
  };

  // ============ FINANCIAL TERMS ============

  @Prop({ type: String, enum: PaymentTerms, default: PaymentTerms.COD })
  payment_terms: PaymentTerms;

  @Prop({ type: Number, default: 0 })
  credit_limit: number;

  @Prop({ type: Number, default: 0 })
  current_balance: number; // Outstanding balance owed to supplier

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  // ============ PRODUCT CATEGORIES ============

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DrugCategoryEntity' }], default: [] })
  product_categories: mongoose.Types.ObjectId[]; // Categories this supplier provides

  // ============ PERFORMANCE METRICS ============

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ type: Number, default: 0 })
  total_orders: number;

  @Prop({ type: Number, default: 0 })
  on_time_delivery_rate: number; // Percentage

  @Prop({ type: Date })
  last_order_date: Date;

  // ============ STATUS ============

  @Prop({ type: String, enum: SupplierStatus, default: SupplierStatus.PENDING_APPROVAL })
  status: SupplierStatus;

  @Prop({ type: String })
  status_reason: string;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  // ============ NOTES ============

  @Prop({ type: String })
  notes: string;

  // ============ METADATA ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' })
  created_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' })
  updated_by: mongoose.Types.ObjectId;
}

export const SupplierSchema = SchemaFactory.createForClass(SupplierEntity);

// Indexes
SupplierSchema.index({ name: 'text', supplier_code: 'text' });
SupplierSchema.index({ status: 1, is_active: 1 });
SupplierSchema.index({ 'license.expiry_date': 1 });

// Virtual for license expiry status
SupplierSchema.virtual('is_license_expired').get(function () {
  if (!this.license?.expiry_date) return null;
  return new Date(this.license.expiry_date) < new Date();
});

SupplierSchema.virtual('days_until_license_expiry').get(function () {
  if (!this.license?.expiry_date) return null;
  const now = new Date();
  const expiry = new Date(this.license.expiry_date);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

SupplierSchema.set('toJSON', { virtuals: true });
SupplierSchema.set('toObject', { virtuals: true });
