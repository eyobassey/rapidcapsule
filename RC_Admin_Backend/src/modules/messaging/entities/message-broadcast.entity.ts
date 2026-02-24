import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MessageBroadcastDocument = HydratedDocument<MessageBroadcast>;

@Schema({
  collection: 'message_broadcasts',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class MessageBroadcast {
  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true })
  admin_id: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: String })
  recipient_type: string;

  @Prop({ type: String, default: '' })
  content: string;

  @Prop({ type: Boolean, default: false })
  has_attachment: boolean;

  @Prop({ type: String })
  attachment_filename: string;

  @Prop({ type: String })
  attachment_type: string;

  @Prop({ type: Number, default: 0 })
  total_recipients: number;

  @Prop({ type: Number, default: 0 })
  sent_count: number;

  @Prop({ type: Number, default: 0 })
  failed_count: number;

  @Prop({ type: Number, default: 0 })
  current_batch: number;

  @Prop({ type: Number, default: 0 })
  total_batches: number;

  @Prop({
    type: [{ recipient_id: String, error: String, batch: Number }],
    default: [],
  })
  errors: { recipient_id: string; error: string; batch: number }[];

  @Prop({ type: Date })
  started_at: Date;

  @Prop({ type: Date })
  completed_at: Date;

  created_at: Date;
  updated_at: Date;
}

export const MessageBroadcastSchema =
  SchemaFactory.createForClass(MessageBroadcast);
