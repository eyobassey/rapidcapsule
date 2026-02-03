import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type HealthTipGenerationDocument = HealthTipGeneration & Document;

export enum GenerationType {
  DAILY_RULES = 'daily_rules',
  WEEKLY_AI = 'weekly_ai',
  ON_DEMAND = 'on_demand',
}

@Schema({
  collection: 'health_tip_generations',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class HealthTipGeneration {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user_id: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(GenerationType),
    required: true,
  })
  generation_type: GenerationType;

  @Prop({ type: Number, default: 0 })
  tips_generated: number;

  @Prop({ type: Number, default: 0 })
  rules_evaluated: number;

  @Prop({ type: Number, default: 0 })
  rules_triggered: number;

  @Prop({ type: [String], default: [] })
  triggered_rule_ids: string[];

  @Prop({ type: Number, default: 0 })
  processing_time_ms: number;

  @Prop({ type: String })
  error_message: string;

  @Prop({ type: Boolean, default: true })
  success: boolean;

  @Prop({
    type: {
      prompt_tokens: { type: Number },
      completion_tokens: { type: Number },
      model: { type: String },
    },
    default: null,
  })
  ai_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    model: string;
  } | null;

  created_at: Date;
  updated_at: Date;
}

export const HealthTipGenerationSchema = SchemaFactory.createForClass(HealthTipGeneration);

HealthTipGenerationSchema.index({ user_id: 1, generation_type: 1, created_at: -1 });
