/**
 * Transaction Batch Entity
 *
 * Groups related ledger entries into an atomic transaction.
 * A batch must be balanced (total debits = total credits) to be posted.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { BatchStatus, TransactionCategory } from '../enums/account-codes.enum';

export type TransactionBatchDocument = HydratedDocument<TransactionBatch>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'transaction_batches',
})
export class TransactionBatch {
  @Prop({ type: String, required: true, unique: true, index: true })
  batch_id: string; // TB-YYYYMMDD-XXXXXX

  @Prop({ type: String, enum: Object.values(TransactionCategory), required: true })
  category: TransactionCategory;

  @Prop({ type: String, required: true })
  description: string;

  // ============ BALANCE VALIDATION ============

  @Prop({ type: Number, required: true, default: 0 })
  total_debits: number;

  @Prop({ type: Number, required: true, default: 0 })
  total_credits: number;

  @Prop({ type: Boolean, required: true, default: false })
  is_balanced: boolean; // total_debits === total_credits

  @Prop({ type: Number, required: true, default: 0 })
  entry_count: number;

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  @Prop({ type: String, enum: Object.values(BatchStatus), default: BatchStatus.PENDING })
  status: BatchStatus;

  // ============ PARTIES ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  from_user: mongoose.Types.ObjectId; // Payer

  @Prop({ type: String })
  from_name: string; // Payer name (for non-user entities)

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UnifiedWallet' })
  from_wallet: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  to_user: mongoose.Types.ObjectId; // Payee

  @Prop({ type: String })
  to_name: string; // Payee name (for non-user entities like pharmacies)

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UnifiedWallet' })
  to_wallet: mongoose.Types.ObjectId;

  // ============ REFERENCES ============

  @Prop({ type: String }) // 'pharmacy_order', 'appointment', 'prescription', etc.
  reference_type: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  reference_id: mongoose.Types.ObjectId;

  @Prop({ type: String }) // External reference (Paystack, etc.)
  external_reference: string;

  // ============ REVERSAL ============

  @Prop({ type: String }) // If reversed, points to the reversing batch
  reversed_by_batch: string;

  @Prop({ type: String }) // If this is a reversal, points to original batch
  reverses_batch: string;

  @Prop({ type: Date })
  reversed_at: Date;

  @Prop({ type: String })
  reversal_reason: string;

  // ============ AUDIT ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  performed_by: mongoose.Types.ObjectId;

  @Prop({ type: Date })
  posted_at: Date;

  @Prop({ type: String })
  ip_address: string;

  @Prop({ type: String })
  notes: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata: Record<string, any>;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export const TransactionBatchSchema = SchemaFactory.createForClass(TransactionBatch);

// Indexes
TransactionBatchSchema.index({ category: 1, status: 1, created_at: -1 });
TransactionBatchSchema.index({ from_user: 1, created_at: -1 });
TransactionBatchSchema.index({ to_user: 1, created_at: -1 });
TransactionBatchSchema.index({ reference_type: 1, reference_id: 1 });
TransactionBatchSchema.index({ external_reference: 1 });
TransactionBatchSchema.index({ status: 1 });
TransactionBatchSchema.index({ posted_at: -1 });
