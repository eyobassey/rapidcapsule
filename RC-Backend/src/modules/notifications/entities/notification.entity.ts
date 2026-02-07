import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  DeliveryStatus,
  UserTypeNotification,
  DeliveryStatusEntry,
} from '../types/notification.types';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'notifications',
})
export class Notification {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(UserTypeNotification),
    required: true,
    index: true,
  })
  user_type: UserTypeNotification;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    index: true,
  })
  type: NotificationType;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  data: Record<string, any>;

  @Prop({ type: String })
  action_url: string;

  @Prop({
    type: String,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Prop({ type: Boolean, default: false, index: true })
  is_read: boolean;

  @Prop({ type: Date })
  read_at: Date;

  @Prop(
    raw([
      {
        channel: {
          type: String,
          enum: Object.values(NotificationChannel),
          required: true,
        },
        status: {
          type: String,
          enum: Object.values(DeliveryStatus),
          default: DeliveryStatus.PENDING,
        },
        sent_at: { type: Date },
        delivered_at: { type: Date },
        error: { type: String },
      },
    ]),
  )
  delivery_status: DeliveryStatusEntry[];

  @Prop({ type: Date })
  scheduled_for: Date;

  @Prop({ type: Boolean, default: false })
  is_scheduled: boolean;

  @Prop({ type: Date, index: true })
  expires_at: Date;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: Date })
  deleted_at: Date;

  created_at: Date;
  updated_at: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Compound indexes for common queries
NotificationSchema.index({ userId: 1, is_read: 1, created_at: -1 });
NotificationSchema.index({ userId: 1, type: 1, created_at: -1 });
NotificationSchema.index({ userId: 1, is_deleted: 1, created_at: -1 });
NotificationSchema.index({ is_scheduled: 1, scheduled_for: 1 });

// TTL index for automatic deletion of expired notifications
NotificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
