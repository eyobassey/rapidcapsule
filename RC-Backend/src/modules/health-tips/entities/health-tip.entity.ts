import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type HealthTipDocument = HealthTip & Document;

export enum TipCategory {
  VITALS = 'vitals',
  LIFESTYLE = 'lifestyle',
  NUTRITION = 'nutrition',
  FITNESS = 'fitness',
  MENTAL_HEALTH = 'mental_health',
  PREVENTIVE_CARE = 'preventive_care',
  CHRONIC_CONDITION = 'chronic_condition',
  MEDICATION = 'medication',
  SLEEP = 'sleep',
  HYDRATION = 'hydration',
}

export enum TipPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum TipSource {
  RULE_ENGINE = 'rule_engine',
  AI_GENERATED = 'ai_generated',
  CURATED = 'curated',
}

export enum TipStatus {
  ACTIVE = 'active',
  DISMISSED = 'dismissed',
  ACTED_UPON = 'acted_upon',
  EXPIRED = 'expired',
}

@Schema({
  collection: 'health_tips',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class HealthTip {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String })
  action_text: string;

  @Prop({ type: String })
  action_route: string;

  @Prop({
    type: String,
    enum: Object.values(TipCategory),
    required: true,
  })
  category: TipCategory;

  @Prop({
    type: String,
    enum: Object.values(TipPriority),
    default: TipPriority.MEDIUM,
  })
  priority: TipPriority;

  @Prop({
    type: String,
    enum: Object.values(TipSource),
    required: true,
  })
  source: TipSource;

  @Prop({
    type: String,
    enum: Object.values(TipStatus),
    default: TipStatus.ACTIVE,
  })
  status: TipStatus;

  @Prop({ type: String })
  rule_id: string;

  @Prop({ type: String })
  icon: string;

  @Prop({ type: Date, required: true })
  generated_at: Date;

  @Prop({ type: Date })
  expires_at: Date;

  @Prop({ type: Date })
  dismissed_at: Date;

  @Prop({ type: Number, default: 0 })
  display_count: number;

  @Prop({ type: Date })
  last_displayed_at: Date;

  @Prop({
    type: {
      model: { type: String },
      prompt_tokens: { type: Number },
      completion_tokens: { type: Number },
      generation_time_ms: { type: Number },
    },
    default: null,
  })
  ai_metadata: {
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    generation_time_ms: number;
  } | null;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: null,
  })
  data_snapshot: Record<string, any> | null;

  @Prop({ type: [String], default: [] })
  tags: string[];

  created_at: Date;
  updated_at: Date;
}

export const HealthTipSchema = SchemaFactory.createForClass(HealthTip);

// Indexes for efficient queries
HealthTipSchema.index({ user_id: 1, status: 1, priority: -1 });
HealthTipSchema.index({ user_id: 1, category: 1 });
HealthTipSchema.index({ user_id: 1, generated_at: -1 });
HealthTipSchema.index({ user_id: 1, rule_id: 1, generated_at: -1 });
HealthTipSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
