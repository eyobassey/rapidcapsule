import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Status } from '../../payments/entities/payment.entity';

export type AppointmentDocument = HydratedDocument<Appointment>;

export enum MeetingType {
  AUDIO = 'Audio only',
  VIDEO_AUDIO = 'Video and audio',
}

export enum AppointmentStatus {
  COMPLETED = 'COMPLETED',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  ONGOING = 'ONGOING',
  RESCHEDULED = 'RESCHEDULED',
  MISSED = 'MISSED',
}

export enum AttendanceStatus {
  NONE = 'none',
  PATIENT_ONLY = 'patient_only',
  SPECIALIST_ONLY = 'specialist_only',
  BOTH = 'both',
  UNKNOWN = 'unknown', // Meeting happened but couldn't determine who attended
}

export enum RecordingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  AVAILABLE = 'available',
  EXPIRED = 'expired',
  DELETED = 'deleted',
}

export enum MeetingChannel {
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google_meet',
  MICROSOFT_TEAMS = 'microsoft_teams',
  WHATSAPP = 'whatsapp',
  PHONE = 'phone',
  IN_PERSON = 'in_person',
}

export enum AppointmentUrgency {
  ROUTINE = 'routine',
  URGENT = 'urgent',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Appointment {
  @Prop({ type: String, required: true })
  category: string;

  @Prop({ type: Date, required: true })
  start_time: Date;

  @Prop({ type: String })
  timezone: string;

  @Prop({ type: String, required: true })
  appointment_type: string;

  @Prop({
    type: String,
    enum: {
      values: [AppointmentUrgency.ROUTINE, AppointmentUrgency.URGENT],
    },
    default: AppointmentUrgency.ROUTINE,
  })
  urgency: AppointmentUrgency;

  @Prop(
    raw({
      time_taken: { type: Number, default: 0 },
      unit: { type: String, default: 'Minutes' },
      formatted_string: { type: String },
    }),
  )
  call_duration: any;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  patient: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Referral' })
  referral: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  specialist: Types.ObjectId;

  @Prop({ type: String })
  join_url: string;

  @Prop({ type: String })
  start_url: string;

  @Prop({ type: String })
  meeting_id: string;

  @Prop({ type: String })
  meeting_class: string;

  @Prop({
    type: String,
    enum: {
      values: [
        MeetingChannel.ZOOM,
        MeetingChannel.GOOGLE_MEET,
        MeetingChannel.MICROSOFT_TEAMS,
        MeetingChannel.WHATSAPP,
        MeetingChannel.PHONE,
        MeetingChannel.IN_PERSON,
      ],
    },
    default: MeetingChannel.ZOOM,
  })
  meeting_channel: MeetingChannel;

  @Prop(
    raw({
      zoom_meeting_uuid: { type: String },
      alternative_host_email: { type: String },
      actual_start_time: { type: Date },
      actual_end_time: { type: Date },
      actual_duration_minutes: { type: Number },
    }),
  )
  meeting_platform_data: {
    zoom_meeting_uuid?: string;
    alternative_host_email?: string;
    actual_start_time?: Date;
    actual_end_time?: Date;
    actual_duration_minutes?: number;
  };

  @Prop(
    raw({
      patient_joined: { type: Boolean, default: false },
      patient_joined_at: { type: Date },
      patient_left_at: { type: Date },
      specialist_joined: { type: Boolean, default: false },
      specialist_joined_at: { type: Date },
      specialist_left_at: { type: Date },
      both_joined: { type: Boolean, default: false },
      attendance_status: {
        type: String,
        enum: [
          AttendanceStatus.NONE,
          AttendanceStatus.PATIENT_ONLY,
          AttendanceStatus.SPECIALIST_ONLY,
          AttendanceStatus.BOTH,
          AttendanceStatus.UNKNOWN,
        ],
        default: AttendanceStatus.NONE,
      },
    }),
  )
  attendance: {
    patient_joined: boolean;
    patient_joined_at?: Date;
    patient_left_at?: Date;
    specialist_joined: boolean;
    specialist_joined_at?: Date;
    specialist_left_at?: Date;
    both_joined: boolean;
    attendance_status: AttendanceStatus;
  };

  @Prop(
    raw([
      {
        participant_id: { type: String },
        name: { type: String },
        email: { type: String },
        user_type: { type: String, enum: ['patient', 'specialist', 'unknown'] },
        join_time: { type: Date },
        leave_time: { type: Date },
        duration_minutes: { type: Number },
      },
    ]),
  )
  participants: Array<{
    participant_id: string;
    name: string;
    email?: string;
    user_type: 'patient' | 'specialist' | 'unknown';
    join_time: Date;
    leave_time?: Date;
    duration_minutes?: number;
  }>;

  @Prop(
    raw({
      recording_url: { type: String },
      recording_password: { type: String },
      recording_download_url: { type: String },
      recording_duration_minutes: { type: Number },
      recording_file_size: { type: String },
      recording_status: {
        type: String,
        enum: [
          RecordingStatus.PENDING,
          RecordingStatus.PROCESSING,
          RecordingStatus.AVAILABLE,
          RecordingStatus.EXPIRED,
          RecordingStatus.DELETED,
        ],
        default: RecordingStatus.PENDING,
      },
      recording_expires_at: { type: Date },
    }),
  )
  recording: {
    recording_url?: string;
    recording_password?: string;
    recording_download_url?: string;
    recording_duration_minutes?: number;
    recording_file_size?: string;
    recording_status: RecordingStatus;
    recording_expires_at?: Date;
  };

  @Prop(
    raw({
      transcript_url: { type: String },
      transcript_text: { type: String },
      transcript_status: {
        type: String,
        enum: ['pending', 'processing', 'available', 'failed'],
        default: 'pending',
      },
    }),
  )
  transcript: {
    transcript_url?: string;
    transcript_text?: string;
    transcript_status?: 'pending' | 'processing' | 'available' | 'failed';
  };

  @Prop(
    raw({
      summary: { type: String },
      next_steps: [{ type: String }],
      ai_generated: { type: Boolean, default: false },
    }),
  )
  meeting_summary: {
    summary?: string;
    next_steps?: string[];
    ai_generated?: boolean;
  };

  @Prop(
    raw([
      {
        note_id: { type: String },
        content: { type: String },
        created_at: { type: Date, default: () => new Date() },
        updated_at: { type: Date },
        completed: { type: Boolean, default: false },
        created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        platform: { type: String, default: 'custom' }, // 'zoom', 'custom'
      },
    ]),
  )
  clinical_notes: any[];

  @Prop({ type: Number })
  appointment_fee: number;

  @Prop({
    type: String,
    enum: { values: [Status.SUCCESSFUL, Status.FAILED, Status.PENDING] },
    default: Status.PENDING,
  })
  payment_status: Status;

  @Prop({
    type: String,
    enum: {
      values: [
        AppointmentStatus.CLOSED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.FAILED,
        AppointmentStatus.OPEN,
        AppointmentStatus.ONGOING,
        AppointmentStatus.RESCHEDULED,
        AppointmentStatus.MISSED,
      ],
    },
    default: AppointmentStatus.OPEN,
  })
  status: AppointmentStatus;

  @Prop({
    type: String,
    enum: {
      values: [MeetingType.AUDIO, MeetingType.VIDEO_AUDIO],
    },
    default: MeetingType.VIDEO_AUDIO,
  })
  meeting_type: MeetingType;

  @Prop(
    raw([
      {
        content: { type: String },
        createdAt: { type: Date, default: new Date() },
      },
    ]),
  )
  notes: string[];

  @Prop({ type: String })
  patient_notes: string;

  @Prop({ type: String })
  private_notes: string;

  @Prop(
    raw([
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
        size: { type: String },
        shared_by: { type: String, enum: ['specialist', 'patient'] },
        uploaded_at: { type: Date, default: Date.now },
      },
    ]),
  )
  shared_documents: Array<{
    name: string;
    url: string;
    type: string;
    size: string;
    shared_by: string;
    uploaded_at: Date;
  }>;

  @Prop(
    raw({
      score: { type: Number, min: 1, max: 5 },
      review: { type: String },
      rated_at: { type: Date },
    }),
  )
  rating: {
    score: number;
    review?: string;
    rated_at?: Date;
  };

  @Prop({ type: Number })
  duration_minutes: number;

  @Prop({ type: Date })
  rescheduled_at: Date;
}
const AppointmentSchema = SchemaFactory.createForClass(Appointment);
AppointmentSchema.pre('find', function (next) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (this?.options._recursed) {
    return next();
  }
  this.populate({
    path: 'specialist patient',
    options: { _recursed: true },
    select: '-profile.password -profile.twoFA_secret -security',
  });
  next();
});

export { AppointmentSchema };
