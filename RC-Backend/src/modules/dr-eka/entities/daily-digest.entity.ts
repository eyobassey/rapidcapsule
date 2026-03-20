import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type DrEkaDailyDigestDocument = DrEkaDailyDigest & Document;

export enum DigestItemType {
  OBSERVATION = 'observation',
  RECOMMENDATION = 'recommendation',
  MEDICATION = 'medication',
  FOLLOW_UP = 'follow_up',
  ONBOARDING = 'onboarding',
  DRUG_INTERACTION = 'drug_interaction',
  RECOVERY = 'recovery',
  TRAVEL = 'travel',
  HEALTH_NEWS = 'health_news',
  MOTIVATION = 'motivation',
}

export enum DigestItemPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Schema({
  collection: 'dr_eka_daily_digests',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class DrEkaDailyDigest {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({ type: Date, required: true, index: true })
  date: Date;

  @Prop(
    raw([
      {
        type: {
          type: String,
          enum: Object.values(DigestItemType),
          required: true,
        },
        title: { type: String, required: true },
        content: { type: String, required: true },
        action_text: { type: String },
        action_url: { type: String },
        category: { type: String },
        priority: {
          type: String,
          enum: Object.values(DigestItemPriority),
          default: DigestItemPriority.MEDIUM,
        },
        icon: { type: String },
      },
    ]),
  )
  items: {
    type: string;
    title: string;
    content: string;
    action_text?: string;
    action_url?: string;
    category?: string;
    priority: string;
    icon?: string;
  }[];

  @Prop(
    raw({
      detected: { type: Boolean, default: false },
      from_location: { type: String },
      to_location: { type: String },
      advice: { type: String },
    }),
  )
  travel_alert?: {
    detected: boolean;
    from_location?: string;
    to_location?: string;
    advice?: string;
  };

  @Prop({ type: String })
  health_joke?: string;

  @Prop({ type: String })
  summary: string;

  @Prop(
    raw({
      model: { type: String },
      tokens: { type: Number },
      time_ms: { type: Number },
    }),
  )
  ai_metadata: {
    model: string;
    tokens: number;
    time_ms: number;
  };

  created_at: Date;
  updated_at: Date;
}

export const DrEkaDailyDigestSchema =
  SchemaFactory.createForClass(DrEkaDailyDigest);

DrEkaDailyDigestSchema.index({ user: 1, date: -1 }, { unique: true });
DrEkaDailyDigestSchema.index({ date: -1 });
