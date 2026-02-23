import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MessageAuditLog,
  MessageAuditLogDocument,
  AuditAction,
} from './entities/message-audit-log.entity';

interface AuditLogParams {
  action: AuditAction;
  actor: Types.ObjectId | string;
  actor_type: string;
  conversation?: Types.ObjectId | string;
  message?: Types.ObjectId | string;
  metadata?: Record<string, any>;
}

@Injectable()
export class MessagingAuditService {
  private readonly logger = new Logger(MessagingAuditService.name);

  constructor(
    @InjectModel(MessageAuditLog.name)
    private auditLogModel: Model<MessageAuditLogDocument>,
  ) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.auditLogModel.create({
        action: params.action,
        actor: new Types.ObjectId(params.actor.toString()),
        actor_type: params.actor_type,
        conversation: params.conversation
          ? new Types.ObjectId(params.conversation.toString())
          : undefined,
        message: params.message
          ? new Types.ObjectId(params.message.toString())
          : undefined,
        metadata: params.metadata || {},
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }

  async getAuditLogs(filters: {
    conversation?: string;
    actor?: string;
    action?: AuditAction;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};

    if (filters.conversation) {
      query.conversation = new Types.ObjectId(filters.conversation);
    }
    if (filters.actor) {
      query.actor = new Types.ObjectId(filters.actor);
    }
    if (filters.action) {
      query.action = filters.action;
    }
    if (filters.from || filters.to) {
      query.created_at = {};
      if (filters.from) query.created_at.$gte = filters.from;
      if (filters.to) query.created_at.$lte = filters.to;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
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
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
