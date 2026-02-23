import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MessageAuditLogDocument = HydratedDocument<MessageAuditLog>;

export enum AuditAction {
  MESSAGE_SENT = 'message_sent',
  MESSAGE_READ = 'message_read',
  MESSAGE_DELETED = 'message_deleted',
  FILE_ACCESSED = 'file_accessed',
  FILE_DOWNLOADED = 'file_downloaded',
  CONVERSATION_CREATED = 'conversation_created',
  CONVERSATION_ARCHIVED = 'conversation_archived',
  CONSENT_GIVEN = 'consent_given',
}

@Schema({
  collection: 'message_audit_logs',
  timestamps: { createdAt: 'created_at', updatedAt: false },
})
export class MessageAuditLog {
  @Prop({
    type: String,
    enum: Object.values(AuditAction),
    required: true,
    index: true,
  })
  action: AuditAction;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  actor: Types.ObjectId;

  @Prop({ type: String, required: true })
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

MessageAuditLogSchema.index({ actor: 1, created_at: -1 });
MessageAuditLogSchema.index({ conversation: 1, created_at: -1 });
MessageAuditLogSchema.index({ action: 1, created_at: -1 });
