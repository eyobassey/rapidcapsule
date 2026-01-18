import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WhatsAppPrescriptionQueue,
  WhatsAppPrescriptionQueueDocument,
  QueueType,
  QueuePriority,
  QueueStatus,
} from '../entities/whatsapp-prescription-queue.entity';
import { WhatsAppNotificationService, NotificationType } from './whatsapp-notification.service';
import { SLA_CONFIG, getSLAMinutes } from '../constants/sla.constant';

/**
 * Queue statistics interface
 */
export interface QueueStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  breached: number;
  averageWaitTime: number;
  averageResolutionTime: number;
}

/**
 * Service for managing the WhatsApp pharmacist queue
 */
@Injectable()
export class WhatsAppQueueService {
  private readonly logger = new Logger(WhatsAppQueueService.name);

  constructor(
    @InjectModel(WhatsAppPrescriptionQueue.name)
    private readonly queueModel: Model<WhatsAppPrescriptionQueueDocument>,
    private readonly notificationService: WhatsAppNotificationService,
  ) {}

  /**
   * Create a new queue item
   */
  async createQueueItem(data: {
    whatsappNumber: string;
    patientId?: Types.ObjectId;
    queueType: QueueType;
    priority?: QueuePriority;
    prescriptionId?: Types.ObjectId;
    orderId?: Types.ObjectId;
    sessionId?: Types.ObjectId;
    escalationReason?: string;
    ocrData?: Record<string, any>;
    verificationData?: Record<string, any>;
  }): Promise<WhatsAppPrescriptionQueueDocument> {
    const priority = data.priority || QueuePriority.NORMAL;
    const slaMinutes = this.getSlaMinutes(data.queueType, priority);

    const queueData = {
      whatsapp_number: data.whatsappNumber,
      patient_id: data.patientId,
      queue_type: data.queueType,
      priority,
      status: QueueStatus.PENDING,
      prescription_upload_id: data.prescriptionId,
      session_id: data.sessionId,
      escalation_reason: data.escalationReason,
      queue_reason: data.escalationReason || `Queue item: ${data.queueType}`,
      ocr_data: data.ocrData,
      sla_deadline: new Date(Date.now() + slaMinutes * 60 * 1000),
      messages: [{
        from: 'system' as const,
        message: `Queue item created: ${data.queueType}`,
        timestamp: new Date(),
        type: 'text',
      }],
    };

    const queueItem = await this.queueModel.create(queueData);
    this.logger.log(`Queue item created: ${queueItem._id} (${data.queueType})`);

    return queueItem;
  }

  /**
   * Get SLA minutes based on queue type and priority
   */
  private getSlaMinutes(queueType: QueueType, priority: QueuePriority): number {
    return getSLAMinutes(queueType, priority);
  }

  /**
   * Get queue item by ID
   */
  async getQueueItem(queueId: string): Promise<WhatsAppPrescriptionQueueDocument> {
    const item = await this.queueModel
      .findById(queueId)
      .populate('patient_id', 'profile.first_name profile.last_name profile.contact.email')
      .populate('assigned_to', 'profile.first_name profile.last_name')
      .exec();

    if (!item) {
      throw new NotFoundException(`Queue item ${queueId} not found`);
    }

    return item;
  }

  /**
   * Get pending queue items for pharmacist dashboard
   */
  async getPendingItems(options: {
    queueType?: QueueType;
    priority?: QueuePriority;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ items: WhatsAppPrescriptionQueueDocument[]; total: number }> {
    const {
      queueType,
      priority,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'asc',
    } = options;

    const filter: any = {
      status: { $in: [QueueStatus.PENDING, QueueStatus.IN_PROGRESS] },
    };

    if (queueType) filter.queue_type = queueType;
    if (priority) filter.priority = priority;

    const sortObj: any = {};
    // Always prioritize by priority first
    sortObj.priority = -1;
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.queueModel
        .find(filter)
        .sort(sortObj)
        .skip(offset)
        .limit(limit)
        .populate('patient_id', 'profile.first_name profile.last_name')
        .populate('assigned_to', 'profile.first_name profile.last_name')
        .exec(),
      this.queueModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  /**
   * Get queue items assigned to a pharmacist
   */
  async getPharmacistQueue(
    pharmacistId: Types.ObjectId,
    options: {
      status?: QueueStatus;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ items: WhatsAppPrescriptionQueueDocument[]; total: number }> {
    const { status, limit = 20, offset = 0 } = options;

    const filter: any = {
      assigned_to: pharmacistId,
    };

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: [QueueStatus.PENDING, QueueStatus.IN_PROGRESS] };
    }

    const [items, total] = await Promise.all([
      this.queueModel
        .find(filter)
        .sort({ priority: -1, created_at: 1 })
        .skip(offset)
        .limit(limit)
        .populate('patient_id', 'profile.first_name profile.last_name')
        .exec(),
      this.queueModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  /**
   * Assign a queue item to a pharmacist
   */
  async assignToPharmacist(
    queueId: string,
    pharmacistId: Types.ObjectId,
    pharmacistName?: string,
  ): Promise<WhatsAppPrescriptionQueueDocument> {
    const item = await this.queueModel.findByIdAndUpdate(
      queueId,
      {
        $set: {
          assigned_to: pharmacistId,
          assigned_at: new Date(),
          status: QueueStatus.IN_PROGRESS,
        },
        $push: {
          messages: {
            from: 'system',
            message: `Assigned to pharmacist: ${pharmacistName || pharmacistId}`,
            timestamp: new Date(),
            type: 'text',
          },
        },
      },
      { new: true },
    ).exec();

    if (!item) {
      throw new NotFoundException(`Queue item ${queueId} not found`);
    }

    // Notify patient that pharmacist is assigned
    if (item.queue_type === QueueType.PHARMACIST_ESCALATION) {
      await this.notificationService.sendNotification(
        item.whatsapp_number,
        NotificationType.PHARMACIST_ASSIGNED,
        { pharmacistName: pharmacistName || 'Our Pharmacist' },
      );
    }

    this.logger.log(`Queue item ${queueId} assigned to pharmacist ${pharmacistId}`);

    return item;
  }

  /**
   * Send a message from pharmacist to patient
   */
  async sendPharmacistMessage(
    queueId: string,
    pharmacistId: Types.ObjectId,
    message: string,
    pharmacistName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const item = await this.getQueueItem(queueId);

    // Verify pharmacist is assigned
    if (!item.assigned_to ||
        item.assigned_to.toString() !== pharmacistId.toString()) {
      return { success: false, error: 'You are not assigned to this queue item' };
    }

    if (item.status === QueueStatus.COMPLETED) {
      return { success: false, error: 'This queue item is already closed' };
    }

    // Add message to queue history
    await this.queueModel.findByIdAndUpdate(queueId, {
      $push: {
        messages: {
          from: 'pharmacist',
          message,
          timestamp: new Date(),
          type: 'text',
        },
      },
      $set: { updated_at: new Date() },
    });

    // Send message to patient via WhatsApp
    const result = await this.notificationService.sendPharmacistMessage(
      item.whatsapp_number,
      pharmacistName || 'Pharmacist',
      message,
    );

    return result;
  }

  /**
   * Complete/close a queue item
   */
  async completeQueueItem(
    queueId: string,
    completedBy: Types.ObjectId,
    resolution?: string,
  ): Promise<WhatsAppPrescriptionQueueDocument> {
    const item = await this.queueModel.findByIdAndUpdate(
      queueId,
      {
        $set: {
          status: QueueStatus.COMPLETED,
          completed_at: new Date(),
          completed_by: completedBy,
          resolution_notes: resolution,
        },
        $push: {
          messages: {
            from: 'system',
            message: `Queue item completed. ${resolution || ''}`,
            timestamp: new Date(),
            type: 'text',
          },
        },
      },
      { new: true },
    ).exec();

    if (!item) {
      throw new NotFoundException(`Queue item ${queueId} not found`);
    }

    this.logger.log(`Queue item ${queueId} completed`);

    return item;
  }

  /**
   * Escalate a queue item to higher priority
   */
  async escalateQueueItem(
    queueId: string,
    escalatedBy: Types.ObjectId,
    reason: string,
  ): Promise<WhatsAppPrescriptionQueueDocument> {
    const item = await this.getQueueItem(queueId);

    let newPriority = item.priority;
    if (item.priority === QueuePriority.LOW) {
      newPriority = QueuePriority.NORMAL;
    } else if (item.priority === QueuePriority.NORMAL) {
      newPriority = QueuePriority.HIGH;
    } else if (item.priority === QueuePriority.HIGH) {
      newPriority = QueuePriority.URGENT;
    }

    const updatedItem = await this.queueModel.findByIdAndUpdate(
      queueId,
      {
        $set: {
          priority: newPriority,
          escalation_reason: reason,
          // Recalculate SLA deadline based on new priority
          sla_deadline: new Date(
            Date.now() + this.getSlaMinutes(item.queue_type, newPriority) * 60 * 1000
          ),
        },
        $push: {
          escalation_history: {
            from_user: item.assigned_to,
            to_user: escalatedBy,
            reason: reason,
            escalated_at: new Date(),
          },
          messages: {
            from: 'system',
            message: `Escalated to ${newPriority} priority: ${reason}`,
            timestamp: new Date(),
            type: 'text',
          },
        },
      },
      { new: true },
    ).exec();

    this.logger.log(`Queue item ${queueId} escalated to ${newPriority}`);

    return updatedItem!;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(options: {
    queueType?: QueueType;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}): Promise<QueueStats> {
    const { queueType, dateFrom, dateTo } = options;

    const baseFilter: any = {};
    if (queueType) baseFilter.queue_type = queueType;
    if (dateFrom || dateTo) {
      baseFilter.created_at = {};
      if (dateFrom) baseFilter.created_at.$gte = dateFrom;
      if (dateTo) baseFilter.created_at.$lte = dateTo;
    }

    const [counts, avgTimes] = await Promise.all([
      // Get counts by status
      this.queueModel.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      // Get average times
      this.queueModel.aggregate([
        {
          $match: {
            ...baseFilter,
            status: QueueStatus.COMPLETED,
            completed_at: { $exists: true },
          },
        },
        {
          $project: {
            waitTime: {
              $subtract: [
                { $ifNull: ['$assigned_at', '$completed_at'] },
                '$created_at',
              ],
            },
            resolutionTime: {
              $subtract: ['$completed_at', '$created_at'],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgWaitTime: { $avg: '$waitTime' },
            avgResolutionTime: { $avg: '$resolutionTime' },
          },
        },
      ]),
    ]);

    // Convert counts to object
    const statusCounts = counts.reduce((acc: any, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    // Count SLA breaches
    const breached = await this.queueModel.countDocuments({
      ...baseFilter,
      $expr: {
        $and: [
          { $gt: ['$completed_at', '$sla_deadline'] },
        ],
      },
    });

    return {
      total: Object.values(statusCounts).reduce((a: number, b: any) => a + b, 0) as number,
      pending: statusCounts[QueueStatus.PENDING] || 0,
      inProgress: statusCounts[QueueStatus.IN_PROGRESS] || 0,
      completed: statusCounts[QueueStatus.COMPLETED] || 0,
      breached,
      averageWaitTime: Math.round((avgTimes[0]?.avgWaitTime || 0) / 60000), // Convert to minutes
      averageResolutionTime: Math.round((avgTimes[0]?.avgResolutionTime || 0) / 60000),
    };
  }

  /**
   * Check for SLA breaches and escalate if needed
   */
  async checkAndEscalateSlaBreaches(): Promise<number> {
    const now = new Date();

    // Find items at risk of breaching (within 5 minutes of deadline)
    const atRiskItems = await this.queueModel.find({
      status: { $in: [QueueStatus.PENDING, QueueStatus.IN_PROGRESS] },
      sla_deadline: {
        $lte: new Date(now.getTime() + 5 * 60 * 1000),
        $gt: now,
      },
      priority: { $ne: QueuePriority.URGENT },
    }).exec();

    let escalatedCount = 0;

    for (const item of atRiskItems) {
      await this.escalateQueueItem(
        item._id.toString(),
        new Types.ObjectId(), // System escalation
        'Auto-escalated due to SLA breach risk',
      );
      escalatedCount++;
    }

    if (escalatedCount > 0) {
      this.logger.log(`Auto-escalated ${escalatedCount} items due to SLA breach risk`);
    }

    return escalatedCount;
  }

  /**
   * Get next available queue item for pharmacist
   */
  async getNextQueueItem(
    pharmacistId: Types.ObjectId,
    preferredTypes?: QueueType[],
  ): Promise<WhatsAppPrescriptionQueueDocument | null> {
    const filter: any = {
      status: QueueStatus.PENDING,
      assigned_to: { $exists: false },
    };

    if (preferredTypes && preferredTypes.length > 0) {
      filter.queue_type = { $in: preferredTypes };
    }

    // Get the highest priority, oldest item
    const item = await this.queueModel
      .findOneAndUpdate(
        filter,
        {
          $set: {
            assigned_to: pharmacistId,
            assigned_at: new Date(),
            status: QueueStatus.IN_PROGRESS,
          },
        },
        {
          new: true,
          sort: { priority: -1, created_at: 1 },
        },
      )
      .populate('patient_id', 'profile.first_name profile.last_name')
      .exec();

    if (item) {
      this.logger.log(`Queue item ${item._id} auto-assigned to pharmacist ${pharmacistId}`);
    }

    return item;
  }
}
