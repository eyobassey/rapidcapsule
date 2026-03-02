import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CrisisEventDocument = CrisisEvent & Document;

@Schema({
  collection: 'crisis_events',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class CrisisEvent {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String, required: true })
  crisis_type: string;

  @Prop({ type: String, default: 'active' })
  status: string;

  @Prop({ type: String })
  severity: string;

  @Prop({ type: String })
  trigger_source: string;

  @Prop({ type: Object })
  detection_data: Record<string, any>;

  @Prop(raw([{ action: { type: String }, actor: { type: String }, timestamp: { type: Date }, details: { type: String } }]))
  response_timeline: Record<string, any>[];

  @Prop(raw([{ recipient: { type: Types.ObjectId, ref: 'User' }, channel: { type: String }, sent_at: { type: Date } }]))
  notifications_sent: Record<string, any>[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolved_by: Types.ObjectId;

  @Prop({ type: Date })
  resolved_at: Date;

  @Prop({ type: String })
  resolution_notes: string;

  @Prop({ type: String })
  follow_up_plan: string;

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  follow_up_appointment: Types.ObjectId;
}

export const CrisisEventSchema = SchemaFactory.createForClass(CrisisEvent);
