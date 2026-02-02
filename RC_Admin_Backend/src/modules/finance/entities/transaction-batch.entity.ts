import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TransactionCategory {
  WALLET_TOPUP = 'WALLET_TOPUP',
  WALLET_WITHDRAWAL = 'WALLET_WITHDRAWAL',
  WALLET_TRANSFER = 'WALLET_TRANSFER',
  ADMIN_CREDIT = 'ADMIN_CREDIT',
  ADMIN_DEBIT = 'ADMIN_DEBIT',
  APPOINTMENT_PAYMENT = 'APPOINTMENT_PAYMENT',
  PRESCRIPTION_PAYMENT = 'PRESCRIPTION_PAYMENT',
  PHARMACY_ORDER_PAYMENT = 'PHARMACY_ORDER_PAYMENT',
  SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT',
  AI_SUMMARY_PURCHASE = 'AI_SUMMARY_PURCHASE',
  SPECIALIST_HOLD = 'SPECIALIST_HOLD',
  SPECIALIST_RELEASE = 'SPECIALIST_RELEASE',
  SPECIALIST_SETTLE = 'SPECIALIST_SETTLE',
  REFUND = 'REFUND',
  CHARGEBACK = 'CHARGEBACK',
  FEE_COLLECTION = 'FEE_COLLECTION',
  COMMISSION_COLLECTION = 'COMMISSION_COLLECTION',
  MIGRATION = 'MIGRATION',
  ADJUSTMENT = 'ADJUSTMENT',
  REVERSAL = 'REVERSAL',
}

export enum BatchStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

export type TransactionBatchDocument = TransactionBatch & Document;

@Schema({ collection: 'transaction_batches', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class TransactionBatch {
  @Prop({ required: true, unique: true })
  batch_id: string;

  @Prop({ type: String, enum: TransactionCategory, required: true })
  category: TransactionCategory;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  total_debits: number;

  @Prop({ required: true })
  total_credits: number;

  @Prop({ required: true })
  is_balanced: boolean;

  @Prop({ required: true })
  entry_count: number;

  @Prop({ default: 'NGN' })
  currency: string;

  @Prop({ type: String, enum: BatchStatus, default: BatchStatus.PENDING })
  status: BatchStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  from_user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UnifiedWallet' })
  from_wallet: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  to_user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UnifiedWallet' })
  to_wallet: Types.ObjectId;

  @Prop()
  reference_type: string;

  @Prop({ type: Types.ObjectId })
  reference_id: Types.ObjectId;

  @Prop()
  external_reference: string;

  @Prop()
  reversed_by_batch: string;

  @Prop()
  reverses_batch: string;

  @Prop()
  reversed_at: Date;

  @Prop()
  reversal_reason: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  performed_by: Types.ObjectId;

  @Prop()
  posted_at: Date;

  @Prop()
  ip_address: string;

  @Prop()
  notes: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const TransactionBatchSchema = SchemaFactory.createForClass(TransactionBatch);

TransactionBatchSchema.index({ batch_id: 1 }, { unique: true });
TransactionBatchSchema.index({ category: 1, created_at: -1 });
TransactionBatchSchema.index({ status: 1 });
TransactionBatchSchema.index({ from_user: 1 });
TransactionBatchSchema.index({ to_user: 1 });
TransactionBatchSchema.index({ reference_type: 1, reference_id: 1 });
