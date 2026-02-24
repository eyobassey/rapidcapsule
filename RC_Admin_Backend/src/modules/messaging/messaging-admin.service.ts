import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './entities/conversation.entity';
import { Message, MessageDocument } from './entities/message.entity';
import { MessageAuditLog, MessageAuditLogDocument } from './entities/message-audit-log.entity';
import { User } from '../patients/entities/patient.entity';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@Injectable()
export class MessagingAdminService {
  private readonly logger = new Logger(MessagingAdminService.name);

  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    @InjectModel(MessageAuditLog.name)
    private auditLogModel: Model<MessageAuditLogDocument>,
    @InjectModel(User.name)
    private userModel: Model<any>,
    private readonly fileUploadHelper: FileUploadHelper,
  ) {}

  /**
   * List all conversations with filtering
   */
  async getConversations(filters: {
    type?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};
    if (filters.type) query.type = filters.type;

    // Search by email or name
    if (filters.search) {
      const searchTerm = filters.search.trim();

      // Check if it looks like a MongoDB ObjectId (24 hex chars) — keep backward compat
      if (/^[a-fA-F0-9]{24}$/.test(searchTerm)) {
        query['participants.user'] = new Types.ObjectId(searchTerm);
      } else {
        // Search users by email or name (email exists at both root and profile.contact.email)
        const searchRegex = new RegExp(searchTerm, 'i');
        const matchingUsers = await this.userModel
          .find({
            $or: [
              { email: searchRegex },
              { 'profile.contact.email': searchRegex },
              { 'profile.first_name': searchRegex },
              { 'profile.last_name': searchRegex },
            ],
          })
          .select('_id')
          .limit(50)
          .lean();

        const userIds = matchingUsers.map((u) => u._id);
        this.logger.log(`Search "${searchTerm}" matched ${matchingUsers.length} users: ${userIds.map(id => id.toString()).join(', ')}`);
        if (userIds.length > 0) {
          query['participants.user'] = { $in: userIds };
        } else {
          // No users matched — return empty result
          return {
            data: [],
            pagination: { total: 0, page: filters.page || 1, limit: filters.limit || 20, pages: 0 },
          };
        }
      }
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
        .lean()
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

    const [rawData, total] = await Promise.all([
      this.messageModel
        .find({ conversation: new Types.ObjectId(conversationId) })
        .populate('sender', 'profile.first_name profile.last_name email user_type')
        .sort({ created_at: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.messageModel.countDocuments({
        conversation: new Types.ObjectId(conversationId),
      }).exec(),
    ]);

    // Resolve S3 attachment URLs to presigned URLs
    const data = await Promise.all(
      rawData.map((msg) => this.resolveAttachmentUrls(msg)),
    );

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

  /**
   * Get a presigned download URL for a specific attachment
   */
  async getAttachmentDownloadUrl(
    conversationId: string,
    messageId: string,
    attachmentIndex: number,
  ) {
    const message = await this.messageModel
      .findOne({
        _id: new Types.ObjectId(messageId),
        conversation: new Types.ObjectId(conversationId),
      })
      .lean()
      .exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const attachment = message.attachments?.[attachmentIndex];
    if (!attachment?.url) {
      throw new NotFoundException('Attachment not found');
    }

    const url = await this.fileUploadHelper.getPresignedUrl(attachment.url, 3600);

    return {
      url,
      original_name: attachment.original_name,
      mime_type: attachment.mime_type,
      size_bytes: attachment.size_bytes,
    };
  }

  /**
   * Export a full conversation transcript
   */
  async exportConversation(conversationId: string, format: 'json' | 'csv' = 'json') {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate('participants.user', 'profile.first_name profile.last_name email user_type')
      .lean()
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const messages = await this.messageModel
      .find({ conversation: new Types.ObjectId(conversationId) })
      .populate('sender', 'profile.first_name profile.last_name email user_type')
      .sort({ created_at: 1 })
      .lean()
      .exec();

    const getSenderName = (msg: any) => {
      const sender = msg.sender;
      if (!sender) return 'System';
      if (sender.profile?.first_name) {
        return `${sender.profile.first_name} ${sender.profile.last_name || ''}`.trim();
      }
      return sender.email || 'Unknown';
    };

    const getParticipantNames = () => {
      return (conversation as any).participants
        ?.map((p: any) => {
          const u = p.user;
          if (u?.profile?.first_name) {
            return `${u.profile.first_name} ${u.profile.last_name || ''}`.trim();
          }
          return u?.email || 'Unknown';
        })
        .join(' & ') || 'Unknown';
    };

    if (format === 'csv') {
      const headers = ['Timestamp', 'Sender', 'Role', 'Type', 'Content', 'Attachments', 'Status'];
      const rows = messages.map((msg: any) => {
        const attachments = msg.attachments
          ?.map((a: any) => a.original_name || 'file')
          .join('; ') || '';
        const status = msg.is_deleted ? 'Deleted' : msg.status?.read_at ? 'Read' : msg.status?.delivered_at ? 'Delivered' : 'Sent';
        return [
          new Date(msg.created_at).toISOString(),
          getSenderName(msg),
          msg.sender?.user_type || 'system',
          msg.type || 'text',
          (msg.content || '').replace(/"/g, '""'),
          attachments,
          status,
        ];
      });

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      return {
        content: csvContent,
        filename: `conversation-${conversationId}-${new Date().toISOString().split('T')[0]}.csv`,
        participants: getParticipantNames(),
        type: (conversation as any).type,
        message_count: messages.length,
      };
    }

    // JSON format
    return {
      conversation: {
        id: conversationId,
        type: (conversation as any).type,
        participants: getParticipantNames(),
        created_at: (conversation as any).created_at,
        message_count: messages.length,
      },
      messages: messages.map((msg: any) => ({
        sender: getSenderName(msg),
        sender_role: msg.sender?.user_type || 'system',
        type: msg.type || 'text',
        content: msg.content || '',
        attachments: msg.attachments?.map((a: any) => ({
          name: a.original_name,
          type: a.mime_type,
          size_bytes: a.size_bytes,
        })) || [],
        status: msg.is_deleted ? 'deleted' : msg.status?.read_at ? 'read' : msg.status?.delivered_at ? 'delivered' : 'sent',
        timestamp: msg.created_at,
      })),
      exported_at: new Date().toISOString(),
    };
  }

  /**
   * Resolve S3 attachment URLs to presigned URLs
   */
  private async resolveAttachmentUrls(message: any) {
    if (!message?.attachments?.length) return message;

    for (const att of message.attachments) {
      if (att.url) {
        try {
          att.url = await this.fileUploadHelper.getPresignedUrl(
            att.url,
            3600,
            att.mime_type || undefined,
          );
        } catch (e) {
          this.logger.warn(`Failed to presign attachment URL: ${e.message}`);
        }
      }
      if (att.thumbnail_url) {
        try {
          att.thumbnail_url = await this.fileUploadHelper.getPresignedUrl(
            att.thumbnail_url,
            3600,
            'image/jpeg',
          );
        } catch (e) {
          this.logger.warn(`Failed to presign thumbnail URL: ${e.message}`);
        }
      }
    }

    return message;
  }
}
