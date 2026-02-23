import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({
  collection: 'messages',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Message {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true })
  conversation: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  sender: Types.ObjectId;

  @Prop({ type: String })
  type: string;

  @Prop({ type: String, default: '' })
  content: string;

  @Prop(raw([{ original_name: String, s3_key: String, url: String, mime_type: String, size_bytes: Number, duration_seconds: Number }]))
  attachments: any[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message' })
  reply_to: Types.ObjectId;

  @Prop(raw({ sent_at: Date, delivered_at: Date, read_at: Date }))
  status: { sent_at: Date; delivered_at: Date; read_at: Date };

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  created_at: Date;
  updated_at: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
