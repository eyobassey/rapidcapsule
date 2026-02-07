import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto, MarkMultipleAsReadDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import {
  NotificationChannel,
  DeliveryStatus,
  CreateNotificationPayload,
} from './types/notification.types';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const channels = createNotificationDto.channels || [NotificationChannel.IN_APP];

    const deliveryStatus = channels.map((channel) => ({
      channel,
      status: DeliveryStatus.PENDING,
    }));

    const notification = new this.notificationModel({
      ...createNotificationDto,
      userId: new Types.ObjectId(createNotificationDto.userId),
      delivery_status: deliveryStatus,
      is_scheduled: !!createNotificationDto.scheduled_for,
    });

    const saved = await notification.save();

    // If not scheduled, send immediately via WebSocket
    if (!createNotificationDto.scheduled_for) {
      await this.sendRealTimeNotification(saved);
    }

    return saved;
  }

  async createFromPayload(payload: CreateNotificationPayload): Promise<Notification> {
    const channels = payload.channels || [NotificationChannel.IN_APP];

    const deliveryStatus = channels.map((channel) => ({
      channel,
      status: DeliveryStatus.PENDING,
    }));

    const notification = new this.notificationModel({
      userId: new Types.ObjectId(payload.userId),
      user_type: payload.user_type,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      action_url: payload.action_url,
      priority: payload.priority,
      expires_at: payload.expires_at,
      scheduled_for: payload.scheduled_for,
      is_scheduled: !!payload.scheduled_for,
      delivery_status: deliveryStatus,
    });

    const saved = await notification.save();

    // If not scheduled, send immediately via WebSocket
    if (!payload.scheduled_for) {
      await this.sendRealTimeNotification(saved);
    }

    return saved;
  }

  private async sendRealTimeNotification(notification: NotificationDocument): Promise<void> {
    try {
      // Send via WebSocket
      this.notificationsGateway.sendToUser(
        notification.userId.toString(),
        'notification',
        {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          action_url: notification.action_url,
          priority: notification.priority,
          is_read: notification.is_read,
          created_at: notification.created_at,
        },
      );

      // Update delivery status for in_app channel
      await this.updateDeliveryStatus(
        notification._id.toString(),
        NotificationChannel.IN_APP,
        DeliveryStatus.SENT,
      );
    } catch (error) {
      console.error('Failed to send real-time notification:', error);
    }
  }

  async findAllForUser(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<{ notifications: Notification[]; total: number; page: number; pages: number }> {
    const { page = 1, limit = 20, is_read, type, priority, search, sort_by, sort_order } = query;
    const skip = (page - 1) * limit;

    const filter: any = {
      userId: new Types.ObjectId(userId),
      is_deleted: { $ne: true },
    };

    if (is_read !== undefined) {
      filter.is_read = is_read;
    }

    if (type) {
      filter.type = type;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions: any = {};
    sortOptions[sort_by || 'created_at'] = sort_order === 'asc' ? 1 : -1;

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
      is_deleted: { $ne: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      is_read: false,
      is_deleted: { $ne: true },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      },
      {
        is_read: true,
        read_at: new Date(),
      },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Notify client about the update
    this.notificationsGateway.sendToUser(userId, 'notification:read', {
      notificationId: id,
    });

    return notification;
  }

  async markMultipleAsRead(userId: string, dto: MarkMultipleAsReadDto): Promise<{ modified: number }> {
    const filter: any = {
      userId: new Types.ObjectId(userId),
      is_read: false,
    };

    if (!dto.mark_all && dto.notification_ids?.length) {
      filter._id = { $in: dto.notification_ids.map((id) => new Types.ObjectId(id)) };
    }

    const result = await this.notificationModel.updateMany(filter, {
      is_read: true,
      read_at: new Date(),
    });

    // Notify client
    this.notificationsGateway.sendToUser(userId, 'notifications:read-all', {
      count: result.modifiedCount,
    });

    return { modified: result.modifiedCount };
  }

  async markAllAsRead(userId: string): Promise<{ modified: number }> {
    const result = await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        is_read: false,
        is_deleted: { $ne: true },
      },
      {
        is_read: true,
        read_at: new Date(),
      },
    );

    // Notify client
    this.notificationsGateway.sendToUser(userId, 'notifications:read-all', {
      count: result.modifiedCount,
    });

    return { modified: result.modifiedCount };
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.notificationModel.updateOne(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      },
      {
        is_deleted: true,
        deleted_at: new Date(),
      },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException('Notification not found');
    }

    // Notify client
    this.notificationsGateway.sendToUser(userId, 'notification:deleted', {
      notificationId: id,
    });
  }

  async deleteMultiple(userId: string, notificationIds: string[]): Promise<{ deleted: number }> {
    const result = await this.notificationModel.updateMany(
      {
        _id: { $in: notificationIds.map((id) => new Types.ObjectId(id)) },
        userId: new Types.ObjectId(userId),
      },
      {
        is_deleted: true,
        deleted_at: new Date(),
      },
    );

    return { deleted: result.modifiedCount };
  }

  async updateDeliveryStatus(
    notificationId: string,
    channel: NotificationChannel,
    status: DeliveryStatus,
    error?: string,
  ): Promise<void> {
    const update: any = {
      $set: {
        'delivery_status.$[elem].status': status,
      },
    };

    if (status === DeliveryStatus.SENT) {
      update.$set['delivery_status.$[elem].sent_at'] = new Date();
    } else if (status === DeliveryStatus.DELIVERED) {
      update.$set['delivery_status.$[elem].delivered_at'] = new Date();
    }

    if (error) {
      update.$set['delivery_status.$[elem].error'] = error;
    }

    await this.notificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId) },
      update,
      { arrayFilters: [{ 'elem.channel': channel }] },
    );
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    by_type: Record<string, number>;
    by_priority: Record<string, number>;
  }> {
    const baseFilter = {
      userId: new Types.ObjectId(userId),
      is_deleted: { $ne: true },
    };

    const [total, unread, byType, byPriority] = await Promise.all([
      this.notificationModel.countDocuments(baseFilter),
      this.notificationModel.countDocuments({ ...baseFilter, is_read: false }),
      this.notificationModel.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.notificationModel.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

    const by_type: Record<string, number> = {};
    byType.forEach((item) => {
      by_type[item._id] = item.count;
    });

    const by_priority: Record<string, number> = {};
    byPriority.forEach((item) => {
      by_priority[item._id] = item.count;
    });

    return { total, unread, by_type, by_priority };
  }

  // Scheduled notification processing
  async processScheduledNotifications(): Promise<void> {
    const now = new Date();

    const scheduledNotifications = await this.notificationModel.find({
      is_scheduled: true,
      scheduled_for: { $lte: now },
      is_deleted: { $ne: true },
    });

    for (const notification of scheduledNotifications) {
      await this.sendRealTimeNotification(notification);
      await this.notificationModel.updateOne(
        { _id: notification._id },
        { is_scheduled: false },
      );
    }
  }
}
