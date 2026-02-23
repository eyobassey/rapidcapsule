import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

export enum ConversationType {
  PATIENT_SPECIALIST = 'patient_specialist',
  PATIENT_ADMIN = 'patient_admin',
  SPECIALIST_ADMIN = 'specialist_admin',
}

export enum ParticipantRole {
  PATIENT = 'patient',
  SPECIALIST = 'specialist',
  ADMIN = 'admin',
}

@Schema({
  collection: 'conversations',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Conversation {
  @Prop(
    raw([
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: {
          type: String,
          enum: Object.values(ParticipantRole),
          required: true,
        },
      },
    ]),
  )
  participants: {
    user: Types.ObjectId;
    role: ParticipantRole;
  }[];

  @Prop({
    type: String,
    enum: Object.values(ConversationType),
    required: true,
    index: true,
  })
  type: ConversationType;

  @Prop(
    raw({
      content: { type: String },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sent_at: { type: Date },
      type: { type: String, enum: ['text', 'image', 'file', 'video', 'voice_note', 'system'] },
    }),
  )
  last_message: {
    content: string;
    sender: Types.ObjectId;
    sent_at: Date;
    type: string;
  };

  @Prop({ type: Map, of: Number, default: {} })
  unread_counts: Map<string, number>;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: false })
  is_archived: boolean;

  @Prop(
    raw([
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        given_at: { type: Date, default: Date.now },
        ip_address: { type: String },
      },
    ]),
  )
  consent_given: {
    user: Types.ObjectId;
    given_at: Date;
    ip_address: string;
  }[];

  created_at: Date;
  updated_at: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ 'participants.user': 1, updated_at: -1 });
ConversationSchema.index({ 'participants.user': 1, is_archived: 1, updated_at: -1 });
