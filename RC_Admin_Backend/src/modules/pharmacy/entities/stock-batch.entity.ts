import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type StockBatchDocument = HydratedDocument<StockBatchEntity>;

export enum BatchStatus {
  ACTIVE = 'active',
  QUARANTINE = 'quarantine',
  EXPIRED = 'expired',
  RECALLED = 'recalled',
  DEPLETED = 'depleted',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class StockBatchEntity {
  // ============ IDENTIFICATION ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true })
  pharmacy_id: mongoose.Types.ObjectId; // Reference to owning pharmacy

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'DrugEntity', required: true, index: true })
  drug_id: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  batch_number: string; // Manufacturer's batch/lot number

  @Prop({ type: String, required: true, unique: true })
  internal_batch_id: string; // Auto-generated: BTH-YYYYMMDD-001

  // ============ SUPPLIER INFORMATION ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SupplierEntity', required: true })
  supplier_id: mongoose.Types.ObjectId;

  @Prop({ type: String })
  manufacturer: string; // Can differ from drug's default manufacturer

  // ============ DATES ============

  @Prop({ type: Date })
  expiry_date: Date;

  @Prop({ type: Boolean, default: false })
  no_expiry: boolean; // For items that don't expire (e.g., some medical supplies)

  @Prop({ type: Date })
  manufacture_date: Date;

  @Prop({ type: Date, required: true })
  received_date: Date;

  // ============ QUANTITIES ============

  @Prop({ type: Number, required: true, min: 0 })
  quantity_received: number; // Original quantity received

  @Prop({ type: Number, required: true, min: 0 })
  quantity_available: number; // Current available quantity

  @Prop({ type: Number, default: 0, min: 0 })
  quantity_reserved: number; // Reserved for pending orders

  @Prop({ type: Number, default: 0, min: 0 })
  quantity_sold: number; // Total quantity sold/dispensed

  @Prop({ type: Number, default: 0, min: 0 })
  quantity_damaged: number; // Written off as damaged

  @Prop({ type: Number, default: 0, min: 0 })
  quantity_returned: number; // Returned to supplier

  // ============ PRICING ============

  @Prop({ type: Number, required: true })
  cost_price: number; // Cost per unit from supplier

  @Prop({ type: Number })
  selling_price_override: number; // Override selling price for this batch (optional)

  @Prop({ type: Number })
  total_cost: number; // quantity_received * cost_price

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  // ============ PURCHASE DETAILS ============

  @Prop({ type: String })
  purchase_order_number: string;

  @Prop({ type: String })
  invoice_number: string;

  @Prop({ type: String })
  delivery_note_number: string;

  // ============ STORAGE ============

  @Prop(
    raw({
      location: { type: String }, // e.g., "Shelf A-3", "Refrigerator 1"
      temperature_requirement: { type: String }, // e.g., "2-8°C", "Room Temperature"
      special_instructions: { type: String },
    }),
  )
  storage: {
    location?: string;
    temperature_requirement?: string;
    special_instructions?: string;
  };

  // ============ STATUS ============

  @Prop({ type: String, enum: BatchStatus, default: BatchStatus.ACTIVE })
  status: BatchStatus;

  @Prop({ type: String })
  status_reason: string;

  @Prop({ type: Date })
  status_changed_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' })
  status_changed_by: mongoose.Types.ObjectId;

  // ============ RECALL INFORMATION ============

  @Prop(
    raw({
      recall_number: { type: String },
      recall_date: { type: Date },
      recall_reason: { type: String },
      recall_class: { type: String }, // Class I, II, III
      recalled_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    }),
  )
  recall_info: {
    recall_number?: string;
    recall_date?: Date;
    recall_reason?: string;
    recall_class?: string;
    recalled_by?: mongoose.Types.ObjectId;
  };

  // ============ NOTES ============

  @Prop({ type: String })
  notes: string;

  // ============ METADATA ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true })
  received_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' })
  updated_by: mongoose.Types.ObjectId;
}

export const StockBatchSchema = SchemaFactory.createForClass(StockBatchEntity);

// Indexes for efficient queries
StockBatchSchema.index({ pharmacy_id: 1, drug_id: 1, status: 1 }); // Pharmacy-specific queries
StockBatchSchema.index({ pharmacy_id: 1, status: 1, expiry_date: 1 }); // Pharmacy expiry alerts
StockBatchSchema.index({ drug_id: 1, status: 1, expiry_date: 1 });
StockBatchSchema.index({ drug_id: 1, quantity_available: 1 });
StockBatchSchema.index({ expiry_date: 1, status: 1 });
StockBatchSchema.index({ supplier_id: 1, received_date: -1 });
StockBatchSchema.index({ batch_number: 1 });
StockBatchSchema.index({ status: 1, expiry_date: 1 }); // For expiry alerts

// Virtuals
StockBatchSchema.virtual('days_until_expiry').get(function () {
  if (this.no_expiry || !this.expiry_date) return null;
  const now = new Date();
  const expiry = new Date(this.expiry_date);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

StockBatchSchema.virtual('is_expired').get(function () {
  if (this.no_expiry || !this.expiry_date) return false;
  return new Date(this.expiry_date) < new Date();
});

StockBatchSchema.virtual('expiry_status').get(function () {
  if (this.no_expiry) return 'no_expiry';
  if (!this.expiry_date) return 'unknown';

  const daysUntilExpiry = this['days_until_expiry'];
  if (daysUntilExpiry === null) return 'unknown';
  if (daysUntilExpiry <= 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'critical';
  if (daysUntilExpiry <= 60) return 'warning';
  if (daysUntilExpiry <= 90) return 'attention';
  return 'ok';
});

StockBatchSchema.virtual('utilization_percentage').get(function () {
  if (!this.quantity_received || this.quantity_received === 0) return 0;
  return Math.round(((this.quantity_received - this.quantity_available) / this.quantity_received) * 100);
});

StockBatchSchema.virtual('drug', {
  ref: 'DrugEntity',
  localField: 'drug_id',
  foreignField: '_id',
  justOne: true,
});

StockBatchSchema.virtual('supplier', {
  ref: 'SupplierEntity',
  localField: 'supplier_id',
  foreignField: '_id',
  justOne: true,
});

StockBatchSchema.set('toJSON', { virtuals: true });
StockBatchSchema.set('toObject', { virtuals: true });
