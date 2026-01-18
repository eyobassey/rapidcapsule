import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AuditLog,
  AuditLogDocument,
  AuditAction,
  AuditEntityType,
  AuditLogChange,
} from '../entities/audit-log.entity';

export interface CreateAuditLogDto {
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: Types.ObjectId | string;
  performed_by?: Types.ObjectId | string;
  performed_by_role?: string;
  performed_by_name?: string;
  performed_by_email?: string;
  changes?: AuditLogChange[];
  description?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  is_system_action?: boolean;
}

export interface AuditLogQueryDto {
  entity_type?: AuditEntityType;
  entity_id?: string;
  action?: AuditAction;
  performed_by?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLogDocument> {
    try {
      const auditLog = new this.auditLogModel({
        ...dto,
        entity_id: new Types.ObjectId(dto.entity_id),
        performed_by: dto.performed_by
          ? new Types.ObjectId(dto.performed_by)
          : undefined,
      });
      return await auditLog.save();
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      // Don't throw - audit logging should not break the main flow
      return null;
    }
  }

  async logAction(
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string | Types.ObjectId,
    userId?: string | Types.ObjectId,
    options?: Partial<CreateAuditLogDto>,
  ): Promise<AuditLogDocument> {
    return this.create({
      action,
      entity_type: entityType,
      entity_id: entityId,
      performed_by: userId,
      ...options,
    });
  }

  async logChanges(
    entityType: AuditEntityType,
    entityId: string | Types.ObjectId,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    userId?: string | Types.ObjectId,
    options?: Partial<CreateAuditLogDto>,
  ): Promise<AuditLogDocument> {
    const changes: AuditLogChange[] = [];

    // Compare old and new data to find changes
    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {}),
    ]);

    for (const key of allKeys) {
      // Skip internal fields
      if (['_id', '__v', 'createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(key)) {
        continue;
      }

      const oldValue = oldData?.[key];
      const newValue = newData?.[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          old_value: oldValue,
          new_value: newValue,
        });
      }
    }

    if (changes.length === 0) {
      return null; // No changes to log
    }

    return this.create({
      action: AuditAction.UPDATE,
      entity_type: entityType,
      entity_id: entityId,
      performed_by: userId,
      changes,
      ...options,
    });
  }

  async findAll(query: AuditLogQueryDto): Promise<{
    docs: AuditLogDocument[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const {
      entity_type,
      entity_id,
      action,
      performed_by,
      start_date,
      end_date,
      page = 1,
      limit = 20,
    } = query;

    const filter: any = {};

    if (entity_type) {
      filter.entity_type = entity_type;
    }

    if (entity_id) {
      filter.entity_id = new Types.ObjectId(entity_id);
    }

    if (action) {
      filter.action = action;
    }

    if (performed_by) {
      filter.performed_by = new Types.ObjectId(performed_by);
    }

    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) {
        filter.created_at.$gte = new Date(start_date);
      }
      if (end_date) {
        filter.created_at.$lte = new Date(end_date);
      }
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.auditLogModel.countDocuments(filter),
    ]);

    return {
      docs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findByEntity(
    entityType: AuditEntityType,
    entityId: string,
    limit = 50,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({
        entity_type: entityType,
        entity_id: new Types.ObjectId(entityId),
      })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findByUser(
    userId: string,
    options?: { page?: number; limit?: number },
  ): Promise<AuditLogDocument[]> {
    const { page = 1, limit = 50 } = options || {};
    const skip = (page - 1) * limit;

    return this.auditLogModel
      .find({ performed_by: new Types.ObjectId(userId) })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  async getRecentActivity(limit = 100): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async getActivityStats(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total: number;
    by_action: Record<string, number>;
    by_entity_type: Record<string, number>;
    by_user: { user_id: string; count: number }[];
  }> {
    const filter = {
      created_at: { $gte: startDate, $lte: endDate },
    };

    const [total, byAction, byEntityType, byUser] = await Promise.all([
      this.auditLogModel.countDocuments(filter),
      this.auditLogModel.aggregate([
        { $match: filter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
      this.auditLogModel.aggregate([
        { $match: filter },
        { $group: { _id: '$entity_type', count: { $sum: 1 } } },
      ]),
      this.auditLogModel.aggregate([
        { $match: { ...filter, performed_by: { $exists: true } } },
        { $group: { _id: '$performed_by', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      total,
      by_action: byAction.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
      by_entity_type: byEntityType.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
      by_user: byUser.map((item) => ({
        user_id: item._id?.toString(),
        count: item.count,
      })),
    };
  }

  // Convenience methods for common actions
  async logCreate(
    entityType: AuditEntityType,
    entityId: string | Types.ObjectId,
    userId?: string | Types.ObjectId,
    description?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLogDocument> {
    return this.logAction(AuditAction.CREATE, entityType, entityId, userId, {
      description,
      metadata,
    });
  }

  async logDelete(
    entityType: AuditEntityType,
    entityId: string | Types.ObjectId,
    userId?: string | Types.ObjectId,
    description?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLogDocument> {
    return this.logAction(AuditAction.DELETE, entityType, entityId, userId, {
      description,
      metadata,
    });
  }

  async logView(
    entityType: AuditEntityType,
    entityId: string | Types.ObjectId,
    userId?: string | Types.ObjectId,
  ): Promise<AuditLogDocument> {
    return this.logAction(AuditAction.VIEW, entityType, entityId, userId);
  }

  async logStatusChange(
    entityType: AuditEntityType,
    entityId: string | Types.ObjectId,
    oldStatus: string,
    newStatus: string,
    userId?: string | Types.ObjectId,
    description?: string,
  ): Promise<AuditLogDocument> {
    return this.logAction(
      AuditAction.STATUS_CHANGE,
      entityType,
      entityId,
      userId,
      {
        changes: [
          {
            field: 'status',
            old_value: oldStatus,
            new_value: newStatus,
          },
        ],
        description,
      },
    );
  }
}
