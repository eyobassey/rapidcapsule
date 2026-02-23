import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({
  collection: 'conversations',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Conversation {
  @Prop(raw([{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: { type: String } }]))
  participants: { user: Types.ObjectId; role: string }[];

  @Prop({ type: String })
  type: string;

  @Prop(raw({ content: { type: String }, sender: { type: mongoose.Schema.Types.ObjectId }, sent_at: { type: Date }, type: { type: String } }))
  last_message: { content: string; sender: Types.ObjectId; sent_at: Date; type: string };

  @Prop({ type: Map, of: Number, default: {} })
  unread_counts: Map<string, number>;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: false })
  is_archived: boolean;

  created_at: Date;
  updated_at: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
