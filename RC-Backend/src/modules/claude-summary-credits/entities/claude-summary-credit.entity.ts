import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type ClaudeSummaryCreditDocument = ClaudeSummaryCredit & Document;

@Schema({ _id: false })
export class UnlimitedSubscription {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ClaudeSummaryPlan' })
  plan_id: Types.ObjectId;

  @Prop({ type: String })
  plan_name: string;

  @Prop({ type: Date })
  started_at: Date;

  @Prop({ type: Date })
  expires_at: Date;

  @Prop({ type: Boolean, default: false })
  is_active: boolean;
}

export const UnlimitedSubscriptionSchema = SchemaFactory.createForClass(UnlimitedSubscription);

export enum CreditUserType {
  PATIENT = 'Patient',
  SPECIALIST = 'Specialist',
}

@Schema({
  collection: 'claude_summary_credits',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class ClaudeSummaryCredit {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  // User type to distinguish between patients and specialists
  @Prop({
    type: String,
    enum: Object.values(CreditUserType),
    default: CreditUserType.PATIENT,
    index: true,
  })
  user_type: CreditUserType;

  // Monthly free credits tracking
  @Prop({ type: Number, default: 5 })
  free_credits_remaining: number;

  @Prop({ type: Date, required: true })
  free_credits_reset_date: Date; // First day of next month

  // Purchased bundle credits (never expire)
  @Prop({ type: Number, default: 0 })
  purchased_credits: number;

  // Gifted credits from admin
  @Prop({ type: Number, default: 0 })
  gifted_credits: number;

  @Prop({ type: Date, default: null })
  gifted_credits_expiry: Date | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  gifted_by: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  gift_reason: string | null;

  // Active unlimited subscription
  @Prop({ type: UnlimitedSubscriptionSchema, default: null })
  unlimited_subscription: UnlimitedSubscription | null;

  // Stats
  @Prop({ type: Number, default: 0 })
  total_summaries_generated: number;

  @Prop({ type: Number, default: 0 })
  total_amount_spent: number;

  // RxGPT-specific tracking (for specialists)
  @Prop({ type: Number, default: 0 })
  rxgpt_credits_used: number;

  @Prop({ type: Date, default: null })
  rxgpt_last_used_at: Date | null;

  @Prop({ type: Number, default: 0 })
  total_rxgpt_analyses: number;

  created_at: Date;
  updated_at: Date;
}

export const ClaudeSummaryCreditSchema = SchemaFactory.createForClass(ClaudeSummaryCredit);

// Indexes
ClaudeSummaryCreditSchema.index({ free_credits_reset_date: 1 });
ClaudeSummaryCreditSchema.index({ 'unlimited_subscription.expires_at': 1 });
