import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CopingExerciseSessionDocument = CopingExerciseSession & Document;

@Schema({
  collection: 'coping_exercise_sessions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class CopingExerciseSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  exercise_id: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  category: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number })
  estimated_minutes: number;

  @Prop({ type: [String] })
  steps: string[];

  @Prop({ type: String })
  evidence_base: string;

  @Prop({ type: String, default: 'eka' })
  source: string;

  @Prop({ type: Boolean, default: false })
  completed: boolean;

  @Prop({ type: [Number], default: [] })
  completed_steps: number[];

  @Prop({ type: String })
  outcome: string;

  @Prop({ type: Date })
  completed_at: Date;

  @Prop({ type: Types.ObjectId, ref: 'EkaConversation' })
  conversation_id: Types.ObjectId;

  @Prop({ type: [Object] })
  responses: Record<string, any>[];

  @Prop({ type: Number })
  craving_before: number;

  @Prop({ type: Number })
  craving_after: number;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const CopingExerciseSessionSchema =
  SchemaFactory.createForClass(CopingExerciseSession);
