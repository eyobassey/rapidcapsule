import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecoveryPlanDocument = RecoveryPlan & Document;

@Schema({
  collection: 'recovery_plans',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RecoveryPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String })
  plan_name: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: String })
  current_stage: string;

  @Prop(raw([{ stage_name: { type: String }, status: { type: String }, started_at: { type: Date }, completed_at: { type: Date } }]))
  stages: Record<string, any>[];

  @Prop(raw([{ title: { type: String }, status: { type: String }, target_date: { type: Date }, completed_at: { type: Date }, category: { type: String } }]))
  goals: Record<string, any>[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  created_by: Types.ObjectId;

  @Prop({ type: String })
  generation_method: string;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const RecoveryPlanSchema = SchemaFactory.createForClass(RecoveryPlan);
