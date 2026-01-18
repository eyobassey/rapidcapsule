import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ReferralClickDocument = HydratedDocument<ReferralClick>;

export enum ClickSource {
  WHATSAPP = 'whatsapp',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  EMAIL = 'email',
  COPY = 'copy',
  DIRECT = 'direct',
  OTHER = 'other',
}

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'referral_clicks',
})
export class ReferralClick {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Referral', required: true, index: true })
  referral_id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  referrer_id: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  referral_code: string;

  @Prop({ type: String, enum: Object.values(ClickSource), default: ClickSource.DIRECT })
  source: ClickSource;

  @Prop({ type: String })
  ip_address: string;

  @Prop({ type: String })
  user_agent: string;

  @Prop({ type: String })
  country: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: Boolean, default: false })
  converted: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  converted_user_id: Types.ObjectId;

  @Prop({ type: Date })
  converted_at: Date;
}

export const ReferralClickSchema = SchemaFactory.createForClass(ReferralClick);
