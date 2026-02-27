import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type EkaConversationDocument = EkaConversation & Document;

@Schema({
  collection: 'eka_conversations',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class EkaConversation {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop(
    raw([
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        tools_used: [{ type: String }],
        created_at: { type: Date, default: Date.now },
      },
    ]),
  )
  messages: {
    role: 'user' | 'assistant';
    content: string;
    tools_used?: string[];
    created_at: Date;
  }[];

  @Prop({ type: String, default: '' })
  title: string;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  created_at: Date;
  updated_at: Date;
}

export const EkaConversationSchema = SchemaFactory.createForClass(EkaConversation);

EkaConversationSchema.index({ user: 1, is_active: 1, updated_at: -1 });
EkaConversationSchema.index({ user: 1, is_active: 1, tags: 1, updated_at: -1 });
