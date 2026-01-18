import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type ClaudeSummaryPlanDocument = ClaudeSummaryPlan & Document;

export enum PlanType {
  BUNDLE = 'bundle',
  UNLIMITED_MONTHLY = 'unlimited_monthly',
  UNLIMITED_YEARLY = 'unlimited_yearly',
}

@Schema({
  collection: 'claude_summary_plans',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class ClaudeSummaryPlan {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, enum: Object.values(PlanType) })
  type: PlanType;

  @Prop({ type: Number, default: null })
  credits: number | null; // null for unlimited plans

  @Prop({ type: Number, required: true })
  price: number; // in NGN

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  @Prop({ type: Number, default: null })
  duration_days: number | null; // 30 for monthly, 365 for yearly, null for bundles

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Number, default: 0 })
  sort_order: number;

  @Prop({ type: String })
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: Types.ObjectId;

  created_at: Date;
  updated_at: Date;
}

export const ClaudeSummaryPlanSchema = SchemaFactory.createForClass(ClaudeSummaryPlan);

// Indexes
ClaudeSummaryPlanSchema.index({ type: 1, is_active: 1 });
ClaudeSummaryPlanSchema.index({ sort_order: 1 });
