import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type TrialConversationDocument = TrialConversation & Document;

@Schema({
  collection: 'trial_conversations',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class TrialConversation {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'TrialSession', required: true, index: true })
  trial_session: Types.ObjectId;

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

  created_at: Date;
  updated_at: Date;
}

export const TrialConversationSchema = SchemaFactory.createForClass(TrialConversation);

TrialConversationSchema.index({ trial_session: 1, is_active: 1, updated_at: -1 });
