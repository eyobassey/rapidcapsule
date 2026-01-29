import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ZoomWebhookDocument = HydratedDocument<ZoomWebhook>;

export enum ZoomWebhookEventType {
  MEETING_STARTED = 'meeting.started',
  MEETING_ENDED = 'meeting.ended',
  PARTICIPANT_JOINED = 'meeting.participant_joined',
  PARTICIPANT_LEFT = 'meeting.participant_left',
  RECORDING_COMPLETED = 'recording.completed',
  RECORDING_TRANSCRIPT_COMPLETED = 'recording.transcript_completed',
  MEETING_SUMMARY_COMPLETED = 'meeting.summary_completed',
  URL_VALIDATION = 'endpoint.url_validation',
}

export enum ZoomWebhookStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  IGNORED = 'ignored',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ZoomWebhook {
  @Prop({ type: String, required: true })
  event_type: string;

  @Prop({ type: String })
  event_ts: string;

  @Prop({ type: String })
  meeting_id: string;

  @Prop({ type: String })
  meeting_uuid: string;

  @Prop(raw({}))
  payload: any;

  @Prop({
    type: String,
    enum: [
      ZoomWebhookStatus.PENDING,
      ZoomWebhookStatus.PROCESSED,
      ZoomWebhookStatus.FAILED,
      ZoomWebhookStatus.IGNORED,
    ],
    default: ZoomWebhookStatus.PENDING,
  })
  status: ZoomWebhookStatus;

  @Prop({ type: String })
  error_message: string;

  @Prop({ type: Date })
  processed_at: Date;

  @Prop({ type: Number, default: 0 })
  retry_count: number;
}

export const ZoomWebhookSchema = SchemaFactory.createForClass(ZoomWebhook);

// Index for finding unprocessed webhooks
ZoomWebhookSchema.index({ status: 1, created_at: 1 });
// Index for finding webhooks by meeting
ZoomWebhookSchema.index({ meeting_id: 1 });
