import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RiskAssessmentReportDocument = HydratedDocument<RiskAssessmentReport>;

@Schema({
  collection: 'risk_assessment_reports',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RiskAssessmentReport {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  score: number;

  @Prop({ type: String, enum: ['low', 'moderate', 'high', 'critical'], required: true })
  level: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  categories: Record<string, any>;

  @Prop(raw([{
    _id: false,
    signal: { type: String },
    label: { type: String },
    category: { type: String },
    contribution: { type: Number },
    recommendation: { type: String },
  }]))
  top_factors: Record<string, any>[];

  @Prop(raw({
    direction: { type: String, enum: ['increasing', 'decreasing', 'stable', 'up', 'down'] },
    change_7d: { type: Number },
    change_30d: { type: Number },
  }))
  trend: Record<string, any>;

  @Prop(raw([{
    _id: false,
    score: { type: Number },
    level: { type: String },
    calculated_at: { type: Date },
  }]))
  history: Record<string, any>[];

  @Prop({ type: String })
  context_summary: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EkaConversation' })
  conversation_id: Types.ObjectId;

  @Prop(raw([{
    _id: false,
    text: { type: String },
    action: { type: String },
  }]))
  suggestions: Record<string, any>[];

  @Prop({ type: Number })
  previous_score: number;

  @Prop({ type: String })
  previous_level: string;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const RiskAssessmentReportSchema = SchemaFactory.createForClass(RiskAssessmentReport);

RiskAssessmentReportSchema.index({ user: 1, created_at: -1 });
