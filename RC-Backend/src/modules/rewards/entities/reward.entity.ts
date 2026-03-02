import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export enum RewardActivity {
  SIGN_UP = 'Sign up',
  COMPLETED_PROFILE = 'Completed Profile',
  COMPLETED_APPOINTMENT = 'Completed appointment',
  REFERRAL = 'Referral',
  NEWSLETTER_SUBSCRIPTION = 'Newsletter Subscription',
  // Recovery activities
  SOBRIETY_MILESTONE = 'Sobriety Milestone',
  DAILY_CHECK_IN_STREAK = 'Daily Check-in Streak',
  SCREENING_COMPLETED = 'Screening Completed',
  RECOVERY_PLAN_GOAL_ACHIEVED = 'Recovery Plan Goal Achieved',
  GROUP_SESSION_ATTENDED = 'Group Session Attended',
  COMPANION_SESSION_COMPLETED = 'Companion Session Completed',
  JOURNAL_ENTRY_STREAK = 'Journal Entry Streak',
  EXERCISE_STREAK = 'Exercise Streak',
  PEER_CHECK_IN_COMPLETED = 'Peer Check-in Completed',
}

export type RewardDocument = HydratedDocument<Reward>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Reward {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: {
      values: Object.values(RewardActivity),
    },
  })
  activity: RewardActivity;

  @Prop({ type: Number, default: 0 })
  points: number;

  @Prop({ type: Number, default: 0 })
  free_checkups: number;

  @Prop({ type: Number, default: 0 })
  dependant_free_checkups: number;

  @Prop({ type: Number, default: 0 })
  cashback: number;

  @Prop({ type: Date })
  expiry_date: number;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
