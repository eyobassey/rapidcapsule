import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/entities/user.entity';

export type ReferralDocument = HydratedDocument<Referral>;

export enum ReferralStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REWARDED = 'rewarded',
}

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Referral {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  referrer: User;

  @Prop(
    raw([
      {
        referee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        date_referred: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: Object.values(ReferralStatus),
          default: ReferralStatus.PENDING,
        },
        rewarded_at: { type: Date },
        credits_awarded: { type: Number, default: 0 },
        points_awarded: { type: Number, default: 0 },
        _id: false,
      },
    ]),
  )
  referrals: {
    referee: Types.ObjectId;
    date_referred: Date;
    status: ReferralStatus;
    rewarded_at: Date;
    credits_awarded: number;
    points_awarded: number;
  }[];

  @Prop({ type: String, required: true, unique: true, index: true })
  referral_code: string;

  // Statistics - denormalized for quick access
  @Prop({ type: Number, default: 0 })
  total_clicks: number;

  @Prop({ type: Number, default: 0 })
  total_shares: number;

  @Prop({ type: Number, default: 0 })
  total_signups: number;

  @Prop({ type: Number, default: 0 })
  total_credits_earned: number;

  @Prop({ type: Number, default: 0 })
  total_points_earned: number;

  // Share tracking by platform
  @Prop(
    raw({
      whatsapp: { type: Number, default: 0 },
      facebook: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      email: { type: Number, default: 0 },
      copy: { type: Number, default: 0 },
      sms: { type: Number, default: 0 },
    }),
  )
  shares_by_platform: {
    whatsapp: number;
    facebook: number;
    twitter: number;
    linkedin: number;
    email: number;
    copy: number;
    sms: number;
  };

  // Click tracking by platform
  @Prop(
    raw({
      whatsapp: { type: Number, default: 0 },
      facebook: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      email: { type: Number, default: 0 },
      direct: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    }),
  )
  clicks_by_platform: {
    whatsapp: number;
    facebook: number;
    twitter: number;
    linkedin: number;
    email: number;
    direct: number;
    other: number;
  };

  @Prop({ type: Date })
  last_shared_at: Date;

  @Prop({ type: Date })
  last_click_at: Date;

  // Milestones achieved
  @Prop([{ type: Number }])
  milestones_achieved: number[];
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);

// Compound indexes
ReferralSchema.index({ referral_code: 1 });
ReferralSchema.index({ referrer: 1 });
ReferralSchema.index({ total_signups: -1 });
