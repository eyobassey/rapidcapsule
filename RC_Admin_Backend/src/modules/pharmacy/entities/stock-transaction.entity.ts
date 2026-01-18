import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type StockTransactionDocument = HydratedDocument<StockTransactionEntity>;

export enum TransactionType {
  RECEIVED = 'RECEIVED', // Stock received from supplier
  SOLD = 'SOLD', // Sold/dispensed to customer
  ADJUSTMENT_ADD = 'ADJUSTMENT_ADD', // Manual stock increase (e.g., found items)
  ADJUSTMENT_SUBTRACT = 'ADJUSTMENT_SUBTRACT', // Manual stock decrease (e.g., correction)
  RETURN_TO_SUPPLIER = 'RETURN_TO_SUPPLIER', // Returned to supplier
  RETURN_FROM_CUSTOMER = 'RETURN_FROM_CUSTOMER', // Customer return
  EXPIRED = 'EXPIRED', // Written off as expired
  DAMAGED = 'DAMAGED', // Written off as damaged
  RECALLED = 'RECALLED', // Recalled from inventory
  TRANSFER_OUT = 'TRANSFER_OUT', // Transferred to another location
  TRANSFER_IN = 'TRANSFER_IN', // Received from another location
  RESERVED = 'RESERVED', // Reserved for pending order
  UNRESERVED = 'UNRESERVED', // Released reservation
}

export enum ReferenceType {
  PURCHASE_ORDER = 'purchase_order',
  SALES_ORDER = 'sales_order',
  PRESCRIPTION = 'prescription',
  RETURN_ORDER = 'return_order',
  ADJUSTMENT = 'adjustment',
  RECALL = 'recall',
  TRANSFER = 'transfer',
  EXPIRY_WRITEOFF = 'expiry_writeoff',
  DAMAGE_WRITEOFF = 'damage_writeoff',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class StockTransactionEntity {
  // ============ IDENTIFICATION ============

  @Prop({ type: String, required: true, unique: true })
  transaction_id: string; // Auto-generated: TXN-YYYYMMDD-0001

  // ============ REFERENCES ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'DrugEntity', required: true, index: true })
  drug_id: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'StockBatchEntity', required: true, index: true })
  batch_id: mongoose.Types.ObjectId;

  // ============ TRANSACTION TYPE ============

  @Prop({ type: String, enum: TransactionType, required: true })
  type: TransactionType;

  // ============ QUANTITIES ============

  @Prop({ type: Number, required: true })
  quantity: number; // Positive for additions, negative for subtractions

  @Prop({ type: Number, required: true })
  quantity_before: number; // Batch quantity before transaction

  @Prop({ type: Number, required: true })
  quantity_after: number; // Batch quantity after transaction

  // ============ PRICING ============

  @Prop({ type: Number })
  unit_cost: number; // Cost per unit at time of transaction

  @Prop({ type: Number })
  unit_price: number; // Selling price per unit (for sales)

  @Prop({ type: Number })
  total_value: number; // Total value of transaction

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  // ============ REFERENCE INFORMATION ============

  @Prop(
    raw({
      type: { type: String, enum: ReferenceType },
      id: { type: mongoose.Schema.Types.ObjectId },
      number: { type: String }, // Reference number (PO#, Invoice#, etc.)
    }),
  )
  reference: {
    type?: ReferenceType;
    id?: mongoose.Types.ObjectId;
    number?: string;
  };

  // ============ REASON & NOTES ============

  @Prop({ type: String })
  reason: string; // Reason for adjustment, return, etc.

  @Prop({ type: String })
  notes: string;

  // ============ RELATED PARTIES ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SupplierEntity' })
  supplier_id: mongoose.Types.ObjectId; // For supplier-related transactions

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  customer_id: mongoose.Types.ObjectId; // For customer-related transactions

  // ============ RETURN INFORMATION ============

  @Prop(
    raw({
      return_authorization_number: { type: String },
      return_reason: { type: String },
      credit_note_number: { type: String },
      refund_amount: { type: Number },
    }),
  )
  return_info: {
    return_authorization_number?: string;
    return_reason?: string;
    credit_note_number?: string;
    refund_amount?: number;
  };

  // ============ REVERSAL TRACKING ============

  @Prop({ type: Boolean, default: false })
  is_reversal: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'StockTransactionEntity' })
  reverses_transaction: mongoose.Types.ObjectId; // If this is a reversal, reference to original

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'StockTransactionEntity' })
  reversed_by_transaction: mongoose.Types.ObjectId; // If this was reversed, reference to reversal

  @Prop({ type: Boolean, default: false })
  is_reversed: boolean;

  // ============ METADATA ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true })
  performed_by: mongoose.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  transaction_date: Date;

  // ============ TIMESTAMPS (from schema options) ============
  created_at: Date;
  updated_at: Date;
}

export const StockTransactionSchema = SchemaFactory.createForClass(StockTransactionEntity);

// Indexes for efficient queries
StockTransactionSchema.index({ drug_id: 1, created_at: -1 });
StockTransactionSchema.index({ batch_id: 1, created_at: -1 });
StockTransactionSchema.index({ type: 1, created_at: -1 });
StockTransactionSchema.index({ supplier_id: 1, created_at: -1 });
StockTransactionSchema.index({ transaction_date: -1 });
StockTransactionSchema.index({ 'reference.type': 1, 'reference.number': 1 });

// Virtuals
StockTransactionSchema.virtual('drug', {
  ref: 'DrugEntity',
  localField: 'drug_id',
  foreignField: '_id',
  justOne: true,
});

StockTransactionSchema.virtual('batch', {
  ref: 'StockBatchEntity',
  localField: 'batch_id',
  foreignField: '_id',
  justOne: true,
});

StockTransactionSchema.virtual('supplier', {
  ref: 'SupplierEntity',
  localField: 'supplier_id',
  foreignField: '_id',
  justOne: true,
});

StockTransactionSchema.virtual('performed_by_user', {
  ref: 'Admin',
  localField: 'performed_by',
  foreignField: '_id',
  justOne: true,
});

StockTransactionSchema.set('toJSON', { virtuals: true });
StockTransactionSchema.set('toObject', { virtuals: true });
