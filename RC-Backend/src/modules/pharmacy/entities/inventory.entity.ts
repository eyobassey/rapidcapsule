import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { StockStatus, StorageCondition, DispensingMethod } from '../enums';

export type InventoryDocument = HydratedDocument<Inventory>;

/**
 * Inventory Entity
 * Tracks stock levels, batches, and expiry for each drug at each pharmacy
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Inventory {
  // ============ REFERENCES ============

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true,
    index: true,
  })
  pharmacy: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true,
    index: true,
  })
  drug: mongoose.Types.ObjectId;

  // ============ BATCH INFORMATION ============

  @Prop({ type: String, required: true })
  batch_number: string;

  @Prop({ type: Date, required: true, index: true })
  expiry_date: Date;

  @Prop({ type: Date })
  manufacture_date: Date;

  // ============ STOCK LEVELS ============

  @Prop({ type: Number, required: true, default: 0 })
  quantity_on_hand: number; // Total physical stock

  @Prop({ type: Number, default: 0 })
  quantity_reserved: number; // Reserved for pending orders

  @Prop({ type: Number, default: 0 })
  quantity_damaged: number; // Damaged/unsellable stock

  // ============ THRESHOLDS ============

  @Prop({ type: Number, default: 10 })
  reorder_level: number; // Threshold for reorder alerts

  @Prop({ type: Number, default: 50 })
  reorder_quantity: number; // Suggested reorder amount

  @Prop({ type: Number, default: 100 })
  max_stock_level: number; // Maximum desired stock

  // ============ PRICING (Pharmacy-specific) ============

  @Prop({ type: Number, required: true })
  cost_price: number; // What pharmacy paid

  @Prop({ type: Number, required: true })
  selling_price: number; // Patient-facing price

  @Prop({ type: Number, default: 0 })
  discount_percentage: number;

  // ============ STORAGE ============

  @Prop({ type: String })
  storage_location: string; // Shelf/bin location within pharmacy

  @Prop({
    type: String,
    enum: Object.values(StorageCondition),
    default: StorageCondition.ROOM_TEMPERATURE,
  })
  storage_condition: StorageCondition;

  // ============ DISPENSING ============

  @Prop({
    type: String,
    enum: Object.values(DispensingMethod),
    default: DispensingMethod.FEFO,
  })
  dispensing_method: DispensingMethod;

  // ============ SUPPLIER ============

  @Prop({ type: String })
  supplier_name: string;

  @Prop({ type: String })
  supplier_invoice: string;

  @Prop({ type: Date })
  received_date: Date;

  // ============ STATUS ============

  @Prop({
    type: String,
    enum: Object.values(StockStatus),
    default: StockStatus.IN_STOCK,
    index: true,
  })
  stock_status: StockStatus;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: true })
  is_available_for_sale: boolean;

  // ============ ALERTS ============

  @Prop({ type: Boolean, default: false })
  low_stock_alert_sent: boolean;

  @Prop({ type: Date })
  low_stock_alert_sent_at: Date;

  @Prop({ type: Boolean, default: false })
  expiry_alert_sent: boolean;

  @Prop({ type: Date })
  expiry_alert_sent_at: Date;

  // ============ AUDIT ============

  @Prop({ type: Date })
  last_stock_count_date: Date;

  @Prop({ type: Number })
  last_stock_count_quantity: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  last_stock_count_by: mongoose.Types.ObjectId;

  // ============ METADATA ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: mongoose.Types.ObjectId;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// ============ INDEXES ============

// Compound index for unique batch per pharmacy-drug combination
InventorySchema.index(
  { pharmacy: 1, drug: 1, batch_number: 1 },
  { unique: true },
);

// Index for expiry tracking
InventorySchema.index({ expiry_date: 1, is_active: 1 });

// Index for stock status queries
InventorySchema.index({ pharmacy: 1, stock_status: 1, is_active: 1 });

// Index for low stock queries
InventorySchema.index({ pharmacy: 1, quantity_on_hand: 1, reorder_level: 1 });

// ============ VIRTUALS ============

InventorySchema.virtual('quantity_available').get(function () {
  return Math.max(
    0,
    this.quantity_on_hand - this.quantity_reserved - this.quantity_damaged,
  );
});

InventorySchema.virtual('is_low_stock').get(function () {
  return this.quantity_on_hand <= this.reorder_level;
});

InventorySchema.virtual('is_expired').get(function () {
  return this.expiry_date < new Date();
});

InventorySchema.virtual('days_until_expiry').get(function () {
  const now = new Date();
  const diffTime = this.expiry_date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

InventorySchema.virtual('is_expiring_soon').get(function () {
  const now = new Date();
  const diffTime = this.expiry_date.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 90 && daysUntilExpiry > 0; // Within 90 days
});

InventorySchema.virtual('stock_value').get(function () {
  return this.quantity_on_hand * this.cost_price;
});

InventorySchema.virtual('potential_revenue').get(function () {
  const available = Math.max(
    0,
    this.quantity_on_hand - this.quantity_reserved - this.quantity_damaged,
  );
  return available * this.selling_price;
});

// Ensure virtuals are included in JSON output
InventorySchema.set('toJSON', { virtuals: true });
InventorySchema.set('toObject', { virtuals: true });

// ============ MIDDLEWARE ============

// Auto-update stock status based on quantity
InventorySchema.pre('save', function (next) {
  // Update stock status
  if (this.isModified('quantity_on_hand') || this.isModified('expiry_date')) {
    if (this.expiry_date < new Date()) {
      this.stock_status = StockStatus.EXPIRED;
      this.is_available_for_sale = false;
    } else if (this.quantity_on_hand <= 0) {
      this.stock_status = StockStatus.OUT_OF_STOCK;
    } else if (this.quantity_on_hand <= this.reorder_level) {
      this.stock_status = StockStatus.LOW_STOCK;
    } else {
      this.stock_status = StockStatus.IN_STOCK;
    }
  }
  next();
});
