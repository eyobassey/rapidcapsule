import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type WhatsAppSessionDocument = HydratedDocument<WhatsAppSession>;

export enum FlowType {
  IDLE = 'IDLE',
  VERIFICATION = 'VERIFICATION',
  PRESCRIPTION_UPLOAD = 'PRESCRIPTION_UPLOAD',
  ORDER_CREATION = 'ORDER_CREATION',
  PAYMENT = 'PAYMENT',
  PHARMACIST_CHAT = 'PHARMACIST_CHAT',
  SUPPORT = 'SUPPORT',
  ACCOUNT_LINK = 'ACCOUNT_LINK',
}

@Schema({
  collection: 'whatsapp_sessions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class WhatsAppSession {
  @Prop({ type: String, required: true, index: true })
  whatsapp_number: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  patient_id: Types.ObjectId;

  // Conversation state
  @Prop({ type: String, enum: FlowType, default: FlowType.IDLE })
  current_flow: FlowType;

  @Prop({ type: Number, default: 0 })
  flow_step: number;

  // Flow-specific data (flexible schema)
  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  flow_data: Record<string, any>;
  /*
   * Examples:
   * PRESCRIPTION_UPLOAD: { prescription_id, uploaded_images: [], awaiting_more: boolean }
   * ORDER_CREATION: { prescription_id, cart_items: [], selected_pharmacy_id, delivery_method }
   * PAYMENT: { order_id, payment_method, payment_reference }
   * PHARMACIST_CHAT: { assigned_pharmacist_id, chat_started_at }
   */

  // Message context
  @Prop({ type: String })
  last_bot_message_id: string;

  @Prop({ type: String })
  last_bot_message_type: string; // 'MENU', 'QUESTION', 'CONFIRMATION', etc.

  @Prop({ type: [String], default: [] })
  expected_responses: string[]; // Valid button/list responses

  // Timing
  @Prop({ type: Date, required: true })
  last_message_at: Date;

  @Prop({ type: Date, required: true })
  session_started_at: Date;

  @Prop({ type: Date, required: true, index: true })
  expires_at: Date; // TTL index will use this

  @Prop({ type: Boolean, default: false })
  is_expired: boolean;

  @Prop({ type: Boolean, default: false })
  timeout_warning_sent: boolean;

  // Session stats
  @Prop({ type: Number, default: 0 })
  messages_in_session: number;

  // Handoff to human
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  assigned_pharmacist: Types.ObjectId;

  @Prop({ type: Date })
  handoff_at: Date;

  @Prop({ type: String })
  handoff_reason: string;

  @Prop({ type: Boolean, default: false })
  is_human_takeover: boolean;

  // Timestamps (auto-managed)
  created_at: Date;
  updated_at: Date;
}

export const WhatsAppSessionSchema = SchemaFactory.createForClass(WhatsAppSession);

// TTL index - auto-delete expired sessions after 24 hours
WhatsAppSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 86400 });

// Active session lookup
WhatsAppSessionSchema.index({ whatsapp_number: 1, is_expired: 1 });
