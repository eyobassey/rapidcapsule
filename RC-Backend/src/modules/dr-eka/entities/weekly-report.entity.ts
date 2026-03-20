import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type DrEkaWeeklyReportDocument = DrEkaWeeklyReport & Document;

@Schema({
  collection: 'dr_eka_weekly_reports',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class DrEkaWeeklyReport {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({ type: Date, required: true })
  week_start: Date;

  @Prop({ type: Date, required: true })
  week_end: Date;

  @Prop({ type: String })
  summary: string;

  @Prop(
    raw({
      current: { type: Number },
      previous: { type: Number },
      change: { type: Number },
      trend: { type: String },
    }),
  )
  health_score: {
    current: number;
    previous: number;
    change: number;
    trend: string;
  };

  @Prop({ type: mongoose.Schema.Types.Mixed })
  vitals_snapshot: Record<string, any>;

  @Prop(
    raw([
      {
        name: { type: String },
        dose: { type: String },
        status: { type: String },
        adherence_note: { type: String },
      },
    ]),
  )
  medications: {
    name: string;
    dose: string;
    status: string;
    adherence_note?: string;
  }[];

  @Prop(
    raw({
      completed: { type: Number, default: 0 },
      upcoming: { type: Number, default: 0 },
      overdue_follow_ups: { type: Number, default: 0 },
    }),
  )
  appointments: {
    completed: number;
    upcoming: number;
    overdue_follow_ups: number;
  };

  @Prop(
    raw({
      sobriety_days: { type: Number },
      mood_avg: { type: Number },
      craving_avg: { type: Number },
      milestones_achieved: { type: Number },
    }),
  )
  recovery?: {
    sobriety_days: number;
    mood_avg: number;
    craving_avg: number;
    milestones_achieved: number;
  };

  @Prop(
    raw([
      {
        title: { type: String },
        content: { type: String },
        action_url: { type: String },
      },
    ]),
  )
  recommendations: {
    title: string;
    content: string;
    action_url?: string;
  }[];

  @Prop(
    raw([
      {
        title: { type: String },
        summary: { type: String },
        relevance_note: { type: String },
      },
    ]),
  )
  health_news: {
    title: string;
    summary: string;
    relevance_note?: string;
  }[];

  @Prop({ type: String })
  doctors_note: string;

  @Prop({ type: Boolean, default: false })
  email_sent: boolean;

  @Prop({ type: Date })
  email_sent_at: Date;

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

export const DrEkaWeeklyReportSchema =
  SchemaFactory.createForClass(DrEkaWeeklyReport);

DrEkaWeeklyReportSchema.index(
  { user: 1, week_start: -1 },
  { unique: true },
);
DrEkaWeeklyReportSchema.index({ week_start: -1 });
DrEkaWeeklyReportSchema.index({ email_sent: 1, week_end: -1 });
