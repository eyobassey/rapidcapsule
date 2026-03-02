import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddictionScreeningDocument = AddictionScreening & Document;

@Schema({
  collection: 'addiction_screenings',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class AddictionScreening {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  administered_by: Types.ObjectId;

  @Prop({ type: String })
  instrument: string;

  @Prop({ type: String })
  screening_type: string;

  @Prop({ type: Object })
  answers: Record<string, any>;

  @Prop({ type: Number })
  total_score: number;

  @Prop({ type: Object })
  subscale_scores: Record<string, number>;

  @Prop({ type: String })
  risk_level: string;

  @Prop({ type: String })
  risk_zone_label: string;

  @Prop({ type: [String] })
  substances_identified: string[];

  @Prop({ type: Object })
  ai_interpretation: Record<string, any>;

  @Prop({ type: Number })
  duration_ms: number;

  @Prop({ type: Boolean, default: false })
  is_baseline: boolean;

  @Prop({ type: Date })
  next_screening_due: Date;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const AddictionScreeningSchema = SchemaFactory.createForClass(AddictionScreening);
