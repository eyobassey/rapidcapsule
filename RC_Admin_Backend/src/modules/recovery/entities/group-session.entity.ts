import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GroupSessionDocument = GroupSession & Document;

@Schema({
  collection: 'group_sessions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class GroupSession {
  @Prop({ type: String, required: true })
  session_name: string;

  @Prop({ type: String })
  group_type: string;

  @Prop({ type: String })
  session_category: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  facilitator: Types.ObjectId;

  @Prop({ type: Number, default: 20 })
  max_participants: number;

  @Prop(raw([{ user: { type: Types.ObjectId, ref: 'User' }, enrolled_at: { type: Date }, status: { type: String } }]))
  enrolled_participants: Record<string, any>[];

  @Prop({ type: String })
  status: string;

  @Prop({ type: Date })
  scheduled_at: Date;

  @Prop({ type: Number })
  duration_minutes: number;

  @Prop(raw([{ user: { type: Types.ObjectId, ref: 'User' }, attended: { type: Boolean }, joined_at: { type: Date } }]))
  attendance: Record<string, any>[];

  @Prop({ type: Date })
  deleted_at: Date;
}

export const GroupSessionSchema = SchemaFactory.createForClass(GroupSession);
