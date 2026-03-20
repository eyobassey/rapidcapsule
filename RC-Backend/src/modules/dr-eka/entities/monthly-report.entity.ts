import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type DrEkaMonthlyReportDocument = DrEkaMonthlyReport & Document;

@Schema({
  collection: 'dr_eka_monthly_reports',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class DrEkaMonthlyReport {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({ type: Date, required: true })
  month_start: Date;

  @Prop({ type: Date, required: true })
  month_end: Date;

  @Prop({ type: String })
  month_label: string; // e.g. "March 2026"

  @Prop({ type: String })
  executive_summary: string;

  @Prop(
    raw({
      current: { type: Number },
      month_start_score: { type: Number },
      change: { type: Number },
      trend: { type: String },
      best_score: { type: Number },
      worst_score: { type: Number },
    }),
  )
  health_score: {
    current: number;
    month_start_score: number;
    change: number;
    trend: string;
    best_score: number;
    worst_score: number;
  };

  @Prop({ type: mongoose.Schema.Types.Mixed })
  vitals_summary: Record<string, any>;

  @Prop(
    raw({
      total_steps: { type: Number },
      avg_daily_steps: { type: Number },
      avg_sleep_hours: { type: Number },
      avg_stress: { type: Number },
      active_days: { type: Number },
      total_days: { type: Number },
    }),
  )
  activity_summary: {
    total_steps: number;
    avg_daily_steps: number;
    avg_sleep_hours: number;
    avg_stress: number;
    active_days: number;
    total_days: number;
  };

  @Prop(
    raw([
      {
        name: { type: String },
        dose: { type: String },
        adherence_summary: { type: String },
      },
    ]),
  )
  medications: {
    name: string;
    dose: string;
    adherence_summary: string;
  }[];

  @Prop(
    raw({
      total_appointments: { type: Number },
      completed: { type: Number },
      cancelled: { type: Number },
      missed: { type: Number },
      specialists_seen: { type: [String] },
    }),
  )
  appointments_summary: {
    total_appointments: number;
    completed: number;
    cancelled: number;
    missed: number;
    specialists_seen: string[];
  };

  @Prop(
    raw({
      checkups_completed: { type: Number },
      conditions_found: { type: [String] },
      highest_triage: { type: String },
    }),
  )
  checkups_summary: {
    checkups_completed: number;
    conditions_found: string[];
    highest_triage: string;
  };

  @Prop(
    raw({
      sobriety_days_start: { type: Number },
      sobriety_days_end: { type: Number },
      avg_mood: { type: Number },
      avg_craving: { type: Number },
      check_ins_completed: { type: Number },
      milestones: { type: [String] },
      progress_note: { type: String },
    }),
  )
  recovery_summary?: {
    sobriety_days_start: number;
    sobriety_days_end: number;
    avg_mood: number;
    avg_craving: number;
    check_ins_completed: number;
    milestones: string[];
    progress_note: string;
  };

  @Prop(
    raw([
      {
        title: { type: String },
        description: { type: String },
        icon: { type: String },
      },
    ]),
  )
  achievements: {
    title: string;
    description: string;
    icon: string;
  }[];

  @Prop(
    raw([
      {
        title: { type: String },
        content: { type: String },
        action_url: { type: String },
      },
    ]),
  )
  goals_for_next_month: {
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

export const DrEkaMonthlyReportSchema =
  SchemaFactory.createForClass(DrEkaMonthlyReport);

DrEkaMonthlyReportSchema.index(
  { user: 1, month_start: -1 },
  { unique: true },
);
DrEkaMonthlyReportSchema.index({ month_start: -1 });
