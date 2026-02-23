import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './entities/conversation.entity';
import { Message, MessageDocument } from './entities/message.entity';
import { MessageAuditLog, MessageAuditLogDocument } from './entities/message-audit-log.entity';

@Injectable()
export class MessagingAdminService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    @InjectModel(MessageAuditLog.name)
    private auditLogModel: Model<MessageAuditLogDocument>,
  ) {}

  /**
   * List all conversations with filtering
   */
  async getConversations(filters: {
    type?: string;
    userId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};
    if (filters.type) query.type = filters.type;
    if (filters.userId) {
      query['participants.user'] = new Types.ObjectId(filters.userId);
    }
    if (filters.from || filters.to) {
      query.created_at = {};
      if (filters.from) query.created_at.$gte = new Date(filters.from);
      if (filters.to) query.created_at.$lte = new Date(filters.to);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.conversationModel
        .find(query)
        .populate('participants.user', 'profile.first_name profile.last_name email user_type')
        .sort({ updated_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.conversationModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single conversation with full details
   */
  async getConversation(conversationId: string) {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate('participants.user', 'profile.first_name profile.last_name email user_type profile.profile_photo');

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Get message count
    const messageCount = await this.messageModel.countDocuments({
      conversation: new Types.ObjectId(conversationId),
    });

    return { ...conversation.toObject(), message_count: messageCount };
  }

  /**
   * Get messages for a conversation (paginated)
   */
  async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.messageModel
        .find({ conversation: new Types.ObjectId(conversationId) })
        .populate('sender', 'profile.first_name profile.last_name email user_type')
        .sort({ created_at: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({
        conversation: new Types.ObjectId(conversationId),
      }).exec(),
    ]);

    return {
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Platform messaging stats
   */
  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const [
      totalConversations,
      activeConversations,
      messagesToday,
      messagesWeek,
      messagesMonth,
      totalMessages,
      messagesByType,
    ] = await Promise.all([
      this.conversationModel.countDocuments().exec(),
      this.conversationModel.countDocuments({ is_active: true, is_archived: false }).exec(),
      this.messageModel.countDocuments({ created_at: { $gte: todayStart } }).exec(),
      this.messageModel.countDocuments({ created_at: { $gte: weekStart } }).exec(),
      this.messageModel.countDocuments({ created_at: { $gte: monthStart } }).exec(),
      this.messageModel.countDocuments().exec(),
      this.messageModel.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      conversations: { total: totalConversations, active: activeConversations },
      messages: {
        total: totalMessages,
        today: messagesToday,
        this_week: messagesWeek,
        this_month: messagesMonth,
        by_type: messagesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    };
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};
    if (filters.userId) query.actor = new Types.ObjectId(filters.userId);
    if (filters.action) query.action = filters.action;
    if (filters.from || filters.to) {
      query.created_at = {};
      if (filters.from) query.created_at.$gte = new Date(filters.from);
      if (filters.to) query.created_at.$lte = new Date(filters.to);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .populate('actor', 'profile.first_name profile.last_name email user_type')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }
}
