import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  tokenId: string; // Unique identifier for this session's token

  @Prop({ required: true })
  deviceName: string; // e.g., "iPhone", "Chrome on Windows"

  @Prop({ required: true })
  deviceType: string; // "mobile", "desktop", "tablet"

  @Prop()
  browser: string; // e.g., "Safari", "Chrome", "Firefox"

  @Prop()
  os: string; // e.g., "iOS 17", "Windows 11", "Android 14"

  @Prop()
  ipAddress: string;

  @Prop()
  city: string; // e.g., "Lagos"

  @Prop()
  country: string; // e.g., "Nigeria"

  @Prop()
  location: string; // e.g., "Lagos, Nigeria" (combined for display)

  @Prop({ default: Date.now })
  lastActiveAt: Date;

  @Prop({ default: false })
  isRevoked: boolean;

  @Prop()
  revokedAt: Date;

  @Prop({ default: false })
  isCurrent: boolean; // Marks the current session for the request

  created_at: Date;
  updated_at: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Index for efficient queries
SessionSchema.index({ userId: 1, isRevoked: 1, created_at: -1 });
SessionSchema.index({ tokenId: 1 }, { unique: true });

// TTL index to auto-delete old revoked sessions after 30 days
SessionSchema.index({ revokedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
