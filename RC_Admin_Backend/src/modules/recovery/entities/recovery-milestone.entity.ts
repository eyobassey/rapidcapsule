import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecoveryMilestoneDocument = RecoveryMilestone & Document;

@Schema({
  collection: 'recovery_milestones',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RecoveryMilestone {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String, required: true })
  milestone_type: string;

  @Prop({ type: String, required: true })
  milestone_name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number })
  milestone_value: number;

  @Prop({ type: Date, required: true })
  achieved_at: Date;

  @Prop({ type: Boolean, default: false })
  celebrated: boolean;

  @Prop({ type: Number, default: 0 })
  reward_points: number;

  @Prop({ type: Boolean, default: false })
  shared_with_care_team: boolean;

  @Prop({ type: String })
  celebration_message: string;
}

export const RecoveryMilestoneSchema = SchemaFactory.createForClass(RecoveryMilestone);
