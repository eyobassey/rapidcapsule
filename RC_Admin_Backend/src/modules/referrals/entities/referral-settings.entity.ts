import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ReferralSettingsDocument = HydratedDocument<ReferralSettings>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'referral_settings',
})
export class ReferralSettings {
  @Prop({ type: Boolean, default: true })
  is_enabled: boolean;

  @Prop({ type: Number, default: 1 })
  referrer_credits: number;

  @Prop({ type: Number, default: 1 })
  referee_credits: number;

  @Prop({ type: Number, default: 50 })
  referrer_points: number;

  @Prop({ type: Number, default: 25 })
  referee_points: number;

  @Prop({ type: Boolean, default: true })
  reward_on_signup: boolean;

  @Prop({ type: Boolean, default: false })
  reward_on_first_appointment: boolean;

  @Prop(
    raw({
      whatsapp: { type: String },
      twitter: { type: String },
      facebook: { type: String },
      linkedin: { type: String },
      email_subject: { type: String },
      email_body: { type: String },
      sms: { type: String },
    }),
  )
  share_messages: {
    whatsapp: string;
    twitter: string;
    facebook: string;
    linkedin: string;
    email_subject: string;
    email_body: string;
    sms: string;
  };

  @Prop(
    raw({
      title: { type: String },
      subtitle: { type: String },
      background_color: { type: String },
      text_color: { type: String },
      show_stats: { type: Boolean, default: true },
    }),
  )
  hero_banner: {
    title: string;
    subtitle: string;
    background_color: string;
    text_color: string;
    show_stats: boolean;
  };

  @Prop(
    raw([
      {
        referrals_required: { type: Number },
        reward_type: { type: String },
        reward_value: { type: Number },
        badge_name: { type: String },
        badge_icon: { type: String },
        _id: false,
      },
    ]),
  )
  milestones: {
    referrals_required: number;
    reward_type: string;
    reward_value: number;
    badge_name: string;
    badge_icon: string;
  }[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: Types.ObjectId;
}

export const ReferralSettingsSchema = SchemaFactory.createForClass(ReferralSettings);
