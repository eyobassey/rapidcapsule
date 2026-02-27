import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RecoveryMilestoneDocument = HydratedDocument<RecoveryMilestone>;

export enum MilestoneType {
  SOBRIETY_DAYS = 'sobriety_days',
  SCREENING_IMPROVEMENT = 'screening_improvement',
  GOALS_ACHIEVED = 'goals_achieved',
  JOURNAL_STREAK = 'journal_streak',
  APPOINTMENT_STREAK = 'appointment_streak',
  COMPANION_SESSIONS = 'companion_sessions',
  EXERCISE_STREAK = 'exercise_streak',
  CUSTOM = 'custom',
}

@Schema({
  collection: 'recovery_milestones',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RecoveryMilestone {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: {
      values: [
        MilestoneType.SOBRIETY_DAYS,
        MilestoneType.SCREENING_IMPROVEMENT,
        MilestoneType.GOALS_ACHIEVED,
        MilestoneType.JOURNAL_STREAK,
        MilestoneType.APPOINTMENT_STREAK,
        MilestoneType.COMPANION_SESSIONS,
        MilestoneType.EXERCISE_STREAK,
        MilestoneType.CUSTOM,
      ],
    },
  })
  milestone_type: MilestoneType;

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

export const RecoveryMilestoneSchema =
  SchemaFactory.createForClass(RecoveryMilestone);
