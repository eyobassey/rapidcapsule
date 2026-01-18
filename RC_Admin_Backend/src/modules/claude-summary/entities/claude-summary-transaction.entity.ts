import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type ClaudeSummaryTransactionDocument = ClaudeSummaryTransaction & Document;

export enum TransactionType {
  FREE_USAGE = 'free_usage',
  PURCHASED_USAGE = 'purchased_usage',
  GIFTED_USAGE = 'gifted_usage',
  UNLIMITED_USAGE = 'unlimited_usage',
  BUNDLE_PURCHASE = 'bundle_purchase',
  UNLIMITED_PURCHASE = 'unlimited_purchase',
  ADMIN_GIFT = 'admin_gift',
  ADMIN_GIFT_UNLIMITED = 'admin_gift_unlimited',
  ADMIN_REVOKE = 'admin_revoke',
  MONTHLY_RESET = 'monthly_reset',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  GIFTED_EXPIRED = 'gifted_expired',
}

@Schema({ _id: false })
export class CreditSnapshot {
  @Prop({ type: Number })
  free_credits: number;

  @Prop({ type: Number })
  purchased_credits: number;

  @Prop({ type: Number })
  gifted_credits: number;

  @Prop({ type: Boolean })
  has_unlimited: boolean;
}

export const CreditSnapshotSchema = SchemaFactory.createForClass(CreditSnapshot);

@Schema({
  collection: 'claude_summary_transactions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class ClaudeSummaryTransaction {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(TransactionType), required: true })
  type: TransactionType;

  @Prop({ type: Number, default: 0 })
  credits_delta: number; // Positive for additions, negative for usage

  @Prop({ type: Number, default: null })
  amount: number | null; // Payment amount for purchases

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ClaudeSummaryPlan', default: null })
  plan_id: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  plan_name: string | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'HealthCheckup', default: null })
  health_checkup_id: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  wallet_reference: string | null;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  admin_id: Types.ObjectId | null; // For admin-initiated transactions

  // Snapshot of credit state AFTER this transaction
  @Prop({ type: CreditSnapshotSchema })
  credit_snapshot: CreditSnapshot;

  // Additional metadata
  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata: Record<string, any>;

  created_at: Date;
  updated_at: Date;
}

export const ClaudeSummaryTransactionSchema = SchemaFactory.createForClass(ClaudeSummaryTransaction);

// Indexes for efficient queries
ClaudeSummaryTransactionSchema.index({ userId: 1, created_at: -1 });
ClaudeSummaryTransactionSchema.index({ type: 1, created_at: -1 });
ClaudeSummaryTransactionSchema.index({ created_at: -1 });
ClaudeSummaryTransactionSchema.index({ admin_id: 1, created_at: -1 });
