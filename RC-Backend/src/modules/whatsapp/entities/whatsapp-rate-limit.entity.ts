import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WhatsAppRateLimitDocument = HydratedDocument<WhatsAppRateLimit>;

@Schema({
  collection: 'whatsapp_rate_limits',
  timestamps: false,
})
export class WhatsAppRateLimit {
  // Composite key: action:number:window (e.g., "PRESCRIPTION_UPLOAD:+2348012345678:2025-01-15")
  @Prop({ type: String, required: true, unique: true, index: true })
  key: string;

  @Prop({ type: Number, default: 0 })
  count: number;

  @Prop({ type: Date, required: true })
  window_start: Date;

  @Prop({ type: Date, required: true, index: true })
  window_end: Date;

  // For pattern detection
  @Prop({ type: [Date], default: [] })
  timestamps: Date[];
}

export const WhatsAppRateLimitSchema = SchemaFactory.createForClass(WhatsAppRateLimit);

// TTL index - auto-delete after window expires (1 hour buffer)
WhatsAppRateLimitSchema.index({ window_end: 1 }, { expireAfterSeconds: 3600 });
