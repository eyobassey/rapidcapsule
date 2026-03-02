import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type GroupSessionDocument = HydratedDocument<GroupSession>;

export enum GroupType {
  OPEN = 'open',
  CLOSED = 'closed',
  DROP_IN = 'drop_in',
}

export enum SessionCategory {
  TWELVE_STEP = '12_step',
  CBT = 'cbt',
  DBT = 'dbt',
  MOTIVATIONAL = 'motivational_interviewing',
  RELAPSE_PREVENTION = 'relapse_prevention',
  MINDFULNESS = 'mindfulness',
  ART_THERAPY = 'art_therapy',
  FAMILY = 'family',
  GRIEF_LOSS = 'grief_and_loss',
  TRAUMA = 'trauma_informed',
  LIFE_SKILLS = 'life_skills',
  PEER_SUPPORT = 'peer_support',
}

export enum GroupSessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({
  collection: 'group_sessions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class GroupSession {
  @Prop({ type: String, required: true })
  session_name: string;

  @Prop({ type: String })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(GroupType),
    default: GroupType.OPEN,
  })
  group_type: string;

  @Prop({
    type: String,
    enum: Object.values(SessionCategory),
    required: true,
  })
  session_category: string;

  @Prop({
    type: String,
    enum: Object.values(GroupSessionStatus),
    default: GroupSessionStatus.SCHEDULED,
  })
  status: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  facilitator: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  co_facilitator: Types.ObjectId;

  @Prop({ type: Number, default: 12 })
  max_participants: number;

  @Prop({
    type: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        enrolled_at: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['enrolled', 'waitlisted', 'withdrawn'],
          default: 'enrolled',
        },
      },
    ],
    default: [],
  })
  enrolled_participants: Array<{
    user: Types.ObjectId;
    enrolled_at: Date;
    status: string;
  }>;

  @Prop({ type: Date, required: true })
  scheduled_date: Date;

  @Prop({ type: Number, required: true })
  duration_minutes: number;

  @Prop({ type: String })
  location: string;

  @Prop({ type: String })
  meeting_link: string;

  // Recurring config
  @Prop(
    raw({
      is_recurring: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      },
      day_of_week: { type: Number }, // 0=Sun, 6=Sat
      end_date: { type: Date },
      parent_session: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupSession' },
    }),
  )
  recurring: Record<string, any>;

  // Attendance tracking
  @Prop({
    type: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        attended: { type: Boolean, default: false },
        joined_at: { type: Date },
        left_at: { type: Date },
        notes: { type: String },
      },
    ],
    default: [],
  })
  attendance: Array<{
    user: Types.ObjectId;
    attended: boolean;
    joined_at?: Date;
    left_at?: Date;
    notes?: string;
  }>;

  @Prop({ type: String })
  session_notes: string;

  @Prop({ type: [String], default: [] })
  topics_covered: string[];

  @Prop({ type: Boolean, default: false })
  anonymous_mode: boolean;

  @Prop({ type: Boolean, default: true })
  recording_disabled: boolean;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const GroupSessionSchema = SchemaFactory.createForClass(GroupSession);
