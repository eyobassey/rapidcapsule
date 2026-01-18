import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';
import {
  HealthDomain,
  QuestionType,
  QuestionOption,
  ScaleConfig,
} from '../types/advanced-score.types';

export type AdvancedScoreQuestionDocument = AdvancedScoreQuestion & Document;

@Schema({
  collection: 'advanced_score_questions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class AdvancedScoreQuestion {
  @Prop({
    type: String,
    required: true,
    enum: Object.values(HealthDomain),
  })
  domain: HealthDomain;

  @Prop({ type: Number, required: true })
  domain_order: number;

  @Prop({ type: Number, required: true })
  question_order: number;

  @Prop({ type: String, required: true })
  question_text: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(QuestionType),
  })
  question_type: QuestionType;

  @Prop({
    type: [
      {
        value: { type: String, required: true },
        label: { type: String, required: true },
        score_weight: { type: Number, default: 0 },
      },
    ],
    default: [],
  })
  options: QuestionOption[];

  @Prop({
    type: {
      min: { type: Number },
      max: { type: Number },
      min_label: { type: String },
      max_label: { type: String },
    },
    default: null,
  })
  scale_config: ScaleConfig | null;

  @Prop({ type: Boolean, default: true })
  is_required: boolean;

  @Prop({ type: String, default: '' })
  help_text: string;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: Types.ObjectId;

  created_at: Date;
  updated_at: Date;
}

export const AdvancedScoreQuestionSchema = SchemaFactory.createForClass(AdvancedScoreQuestion);

// Indexes
AdvancedScoreQuestionSchema.index({ domain: 1, question_order: 1 });
AdvancedScoreQuestionSchema.index({ is_active: 1 });
AdvancedScoreQuestionSchema.index({ domain_order: 1, question_order: 1 });
