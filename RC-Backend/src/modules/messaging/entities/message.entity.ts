import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VIDEO = 'video',
  VOICE_NOTE = 'voice_note',
  SYSTEM = 'system',
}

@Schema({
  collection: 'messages',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Message {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversation: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  sender: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(MessageType),
    required: true,
  })
  type: MessageType;

  @Prop({ type: String, default: '' })
  content: string;

  @Prop(
    raw([
      {
        original_name: { type: String, required: true },
        s3_key: { type: String, required: true },
        url: { type: String, required: true },
        mime_type: { type: String, required: true },
        size_bytes: { type: Number, required: true },
        duration_seconds: { type: Number },
        thumbnail_url: { type: String },
        thumbnail_s3_key: { type: String },
      },
    ]),
  )
  attachments: {
    original_name: string;
    s3_key: string;
    url: string;
    mime_type: string;
    size_bytes: number;
    duration_seconds?: number;
    thumbnail_url?: string;
    thumbnail_s3_key?: string;
  }[];

  @Prop(
    raw([
      {
        url: { type: String, required: true },
        title: { type: String },
        description: { type: String },
        image: { type: String },
        domain: { type: String },
        site_name: { type: String },
        type: { type: String }, // 'website', 'video.other', 'article', etc.
        video_embed_url: { type: String }, // YouTube/Vimeo embed URL
      },
    ]),
  )
  link_previews: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    domain?: string;
    site_name?: string;
    type?: string;
    video_embed_url?: string;
  }[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message' })
  reply_to: Types.ObjectId;

  @Prop(
    raw({
      sent_at: { type: Date, default: Date.now },
      delivered_at: { type: Date },
      read_at: { type: Date },
    }),
  )
  status: {
    sent_at: Date;
    delivered_at: Date;
    read_at: Date;
  };

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: Date })
  deleted_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  deleted_by: Types.ObjectId;

  created_at: Date;
  updated_at: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversation: 1, created_at: -1 });
MessageSchema.index({ conversation: 1, 'status.read_at': 1 });
