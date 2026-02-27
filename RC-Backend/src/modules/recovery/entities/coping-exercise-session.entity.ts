import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CopingExerciseSessionDocument =
  HydratedDocument<CopingExerciseSession>;

@Schema({
  collection: 'coping_exercise_sessions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class CopingExerciseSession {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
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

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EkaConversation' })
  conversation_id: Types.ObjectId;

  @Prop(
    raw([
      {
        role: { type: String, enum: ['user', 'assistant'] },
        content: { type: String },
      },
    ]),
  )
  responses: { role: string; content: string }[];

  @Prop({ type: Date })
  deleted_at: Date;
}

export const CopingExerciseSessionSchema =
  SchemaFactory.createForClass(CopingExerciseSession);
