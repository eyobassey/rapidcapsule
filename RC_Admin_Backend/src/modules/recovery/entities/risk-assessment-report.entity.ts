import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RiskAssessmentReportDocument = RiskAssessmentReport & Document;

@Schema({
  collection: 'risk_assessment_reports',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RiskAssessmentReport {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Number, required: true })
  score: number;

  @Prop({ type: String, required: true })
  level: string;

  @Prop({ type: Object })
  categories: Record<string, any>;

  @Prop({ type: [Object] })
  top_factors: Record<string, any>[];

  @Prop({ type: Object })
  trend: Record<string, any>;

  @Prop({ type: [Object] })
  history: Record<string, any>[];

  @Prop({ type: Types.ObjectId, ref: 'EkaConversation' })
  conversation_id: Types.ObjectId;

  @Prop({ type: [Object] })
  suggestions: Record<string, any>[];

  @Prop({ type: Number })
  previous_score: number;

  @Prop({ type: String })
  previous_level: string;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const RiskAssessmentReportSchema = SchemaFactory.createForClass(RiskAssessmentReport);
