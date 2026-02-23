import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MessageAuditLogDocument = HydratedDocument<MessageAuditLog>;

@Schema({
  collection: 'message_audit_logs',
  timestamps: { createdAt: 'created_at', updatedAt: false },
})
export class MessageAuditLog {
  @Prop({ type: String, index: true })
  action: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  actor: Types.ObjectId;

  @Prop({ type: String })
  actor_type: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' })
  conversation: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message' })
  message: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata: Record<string, any>;

  created_at: Date;
}

export const MessageAuditLogSchema = SchemaFactory.createForClass(MessageAuditLog);
