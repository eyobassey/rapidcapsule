import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WhatsAppPrescriptionQueue,
  WhatsAppPrescriptionQueueDocument,
  QueueStatus,
  QueuePriority,
  QueueType,
  ReviewAction,
} from './whatsapp-prescription-queue.entity';
import { GupshupService } from '../../common/external/gupshup';

interface FetchOptions {
  queueType?: QueueType;
  priority?: QueuePriority;
  status?: QueueStatus;
  includeAll?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class WhatsAppQueueService {
  private readonly logger = new Logger(WhatsAppQueueService.name);

  constructor(
    @InjectModel(WhatsAppPrescriptionQueue.name)
    private queueModel: Model<WhatsAppPrescriptionQueueDocument>,
    private gupshupService: GupshupService,
  ) {}

  /**
   * Fetch pending queue items with filters
   */
  async fetchPendingItems(options: FetchOptions = {}) {
    const {
      queueType,
      priority,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'asc',
    } = options;

    const query: any = {
      status: { $in: [QueueStatus.PENDING, QueueStatus.IN_PROGRESS] },
    };

    if (queueType) {
      query.queue_type = queueType;
    }

    if (priority) {
      query.priority = priority;
    }

    const sortOptions: any = {};
    // Always sort by priority first (URGENT > HIGH > NORMAL > LOW)
    sortOptions.priority = -1;
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [items, total] = await Promise.all([
      this.queueModel
        .find(query)
        .sort(sortOptions)
        .skip(offset)
        .limit(limit)
        .populate('patient_id', 'profile email')
        .populate('assigned_to', 'profile email')
        .lean()
        .exec(),
      this.queueModel.countDocuments(query).exec(),
    ]);

    return { result: { items, total } };
  }

  /**
   * Fetch queue items assigned to a specific pharmacist
   */
  async fetchMyQueue(pharmacistId: string, options: FetchOptions = {}) {
    const { status, includeAll, limit = 20, offset = 0 } = options;

    const query: any = {
      assigned_to: new Types.ObjectId(pharmacistId),
    };

    if (status) {
      query.status = status;
    } else if (!includeAll) {
      // By default, only show pending/in-progress items
      query.status = { $in: [QueueStatus.PENDING, QueueStatus.IN_PROGRESS] };
    }
    // If includeAll is true, don't filter by status - show all items assigned to this pharmacist

    const [items, total] = await Promise.all([
      this.queueModel
        .find(query)
        .sort({ updated_at: -1, priority: -1 })
        .skip(offset)
        .limit(limit)
        .populate('patient_id', 'profile email')
        .lean()
        .exec(),
      this.queueModel.countDocuments(query).exec(),
    ]);

    return { result: { items, total } };
  }

  /**
   * Fetch escalated queue items (for senior pharmacists to pick up)
   */
  async fetchEscalatedItems(options: FetchOptions = {}) {
    const { queueType, priority, limit = 20, offset = 0 } = options;

    const query: any = {
      status: QueueStatus.ESCALATED,
    };

    if (queueType) {
      query.queue_type = queueType;
    }

    if (priority) {
      query.priority = priority;
    }

    const [items, total] = await Promise.all([
      this.queueModel
        .find(query)
        .sort({ priority: -1, created_at: 1 })
        .skip(offset)
        .limit(limit)
        .populate('patient_id', 'profile email')
        .populate('assigned_to', 'profile email')
        .lean()
        .exec(),
      this.queueModel.countDocuments(query).exec(),
    ]);

    return { result: { items, total } };
  }

  /**
   * Fetch a specific queue item by ID
   */
  async fetchQueueItem(id: string) {
    const item = await this.queueModel
      .findById(id)
      .populate('patient_id', 'profile email')
      .populate('assigned_to', 'profile email')
      .populate('reviewed_by', 'profile email')
      .populate('completed_by', 'profile email')
      .lean()
      .exec();
    return { result: item };
  }

  /**
   * Fetch queue statistics
   */
  async fetchStats(options: { queueType?: QueueType; dateFrom?: Date; dateTo?: Date } = {}) {
    const { queueType, dateFrom, dateTo } = options;

    const matchStage: any = {};
    if (queueType) {
      matchStage.queue_type = queueType;
    }
    if (dateFrom || dateTo) {
      matchStage.created_at = {};
      if (dateFrom) matchStage.created_at.$gte = dateFrom;
      if (dateTo) matchStage.created_at.$lte = dateTo;
    }

    // Get counts by status
    const statusCounts = await this.queueModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate stats
    const stats: Record<string, number> = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      escalated: 0,
      rejected: 0,
      breached: 0,
    };

    statusCounts.forEach((item) => {
      switch (item._id) {
        case QueueStatus.PENDING:
          stats.pending = item.count;
          break;
        case QueueStatus.IN_PROGRESS:
          stats.inProgress = item.count;
          break;
        case QueueStatus.COMPLETED:
          stats.completed = item.count;
          break;
        case QueueStatus.ESCALATED:
          stats.escalated = item.count;
          break;
        case QueueStatus.REJECTED:
          stats.rejected = item.count;
          break;
      }
    });

    // Get SLA breached count
    const breachedCount = await this.queueModel.countDocuments({
      ...matchStage,
      sla_breached: true,
    });
    stats.breached = breachedCount;

    // Calculate average wait time for completed items today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const avgWaitTimeResult = await this.queueModel.aggregate([
      {
        $match: {
          status: QueueStatus.COMPLETED,
          completed_at: { $gte: todayStart },
        },
      },
      {
        $project: {
          waitTime: {
            $subtract: ['$assigned_at', '$created_at'],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgWaitTime: { $avg: '$waitTime' },
        },
      },
    ]);

    stats.averageWaitTime = avgWaitTimeResult[0]?.avgWaitTime
      ? Math.round(avgWaitTimeResult[0].avgWaitTime / 60000) // Convert to minutes
      : 0;

    return { result: stats };
  }

  /**
   * Claim the next available queue item
   */
  async claimNextItem(pharmacistId: string, preferredTypes: QueueType[] = []) {
    // Build priority order for queue types
    const priorityOrder = preferredTypes.length > 0 ? preferredTypes : Object.values(QueueType);

    // Find unassigned items, sorted by priority and SLA deadline
    const query: any = {
      status: QueueStatus.PENDING,
      assigned_to: { $exists: false },
    };

    // Try preferred types first
    for (const queueType of priorityOrder) {
      const item = await this.queueModel
        .findOneAndUpdate(
          { ...query, queue_type: queueType },
          {
            $set: {
              assigned_to: new Types.ObjectId(pharmacistId),
              assigned_at: new Date(),
              status: QueueStatus.IN_PROGRESS,
            },
          },
          {
            new: true,
            sort: { priority: -1, sla_deadline: 1 },
          },
        )
        .populate('patient_id', 'profile email')
        .exec();

      if (item) {
        return { result: { item, message: 'Item claimed successfully' } };
      }
    }

    return { result: { item: null, message: 'No items available in queue' } };
  }

  /**
   * Assign a specific queue item to a pharmacist
   */
  async assignItem(id: string, pharmacistId: string) {
    const item = await this.queueModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            assigned_to: new Types.ObjectId(pharmacistId),
            assigned_at: new Date(),
            status: QueueStatus.IN_PROGRESS,
          },
        },
        { new: true },
      )
      .populate('patient_id', 'profile email')
      .exec();

    return { result: item };
  }

  /**
   * Send a message to patient via WhatsApp
   */
  async sendMessage(id: string, pharmacistId: string, message: string) {
    // First get the queue item with patient info to get phone number
    const queueItem = await this.queueModel
      .findById(id)
      .populate('patient_id', 'profile email')
      .exec();

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    // Get patient phone number (check profile first, then queue item's whatsapp_number)
    const patient = queueItem.patient_id as any;
    const phoneNumber = patient?.profile?.phone_number || queueItem.whatsapp_number;

    let whatsappSent = false;
    let whatsappMessageId: string | undefined;
    let whatsappError: string | undefined;

    // Send via WhatsApp if phone number available and Gupshup configured
    if (phoneNumber && this.gupshupService.isConfigured()) {
      const result = await this.gupshupService.sendTextMessage(phoneNumber, message);
      whatsappSent = result.success;
      whatsappMessageId = result.messageId;
      whatsappError = result.error;

      if (result.success) {
        this.logger.log(`WhatsApp message sent to ${phoneNumber}: ${result.messageId}`);
      } else {
        this.logger.warn(`Failed to send WhatsApp message: ${result.error}`);
      }
    } else if (!phoneNumber) {
      this.logger.warn(`No phone number available for patient in queue item ${id}`);
      whatsappError = 'No phone number available';
    } else {
      this.logger.warn('Gupshup not configured, message stored but not sent via WhatsApp');
      whatsappError = 'WhatsApp service not configured';
    }

    // Store message in database
    const item = await this.queueModel.findByIdAndUpdate(
      id,
      {
        $push: {
          messages: {
            from: 'pharmacist',
            message,
            timestamp: new Date(),
            type: 'text',
            whatsapp_sent: whatsappSent,
            whatsapp_message_id: whatsappMessageId,
          },
        },
      },
      { new: true },
    );

    return {
      result: {
        item,
        whatsapp: {
          sent: whatsappSent,
          messageId: whatsappMessageId,
          error: whatsappError,
        },
      },
    };
  }

  /**
   * Complete a queue item
   */
  async completeItem(id: string, pharmacistId: string, resolution: string) {
    // First get the queue item with patient info to get phone number
    const queueItem = await this.queueModel
      .findById(id)
      .populate('patient_id', 'profile email')
      .exec();

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    // Get patient phone number for WhatsApp notification (check profile first, then queue item's whatsapp_number)
    const patient = queueItem.patient_id as any;
    const phoneNumber = patient?.profile?.phone_number || queueItem.whatsapp_number;
    const patientName = patient?.profile?.first_name || 'Patient';

    let whatsappSent = false;
    let whatsappMessageId: string | undefined;
    let whatsappError: string | undefined;

    // Send WhatsApp notification about completion
    if (phoneNumber && this.gupshupService.isConfigured()) {
      const completionMessage = resolution
        ? `Hello ${patientName}, your prescription request has been completed.\n\n${resolution}\n\nThank you for using Rapid Capsule!\n\n- Rapid Capsule Team`
        : `Hello ${patientName}, your prescription request has been completed and processed.\n\nThank you for using Rapid Capsule!\n\n- Rapid Capsule Team`;

      const result = await this.gupshupService.sendTextMessage(phoneNumber, completionMessage);
      whatsappSent = result.success;
      whatsappMessageId = result.messageId;
      whatsappError = result.error;

      if (result.success) {
        this.logger.log(`Completion WhatsApp notification sent to ${phoneNumber}: ${result.messageId}`);
      } else {
        this.logger.warn(`Failed to send completion WhatsApp notification: ${result.error}`);
      }
    } else if (!phoneNumber) {
      this.logger.warn(`No phone number available for patient in queue item ${id}`);
      whatsappError = 'No phone number available';
    } else {
      this.logger.warn('Gupshup not configured, completion notification not sent via WhatsApp');
      whatsappError = 'WhatsApp service not configured';
    }

    // Update the queue item status
    const item = await this.queueModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: QueueStatus.COMPLETED,
            completed_at: new Date(),
            completed_by: new Types.ObjectId(pharmacistId),
            resolution_notes: resolution,
            review_action: ReviewAction.APPROVED,
            reviewed_by: new Types.ObjectId(pharmacistId),
            reviewed_at: new Date(),
          },
          $push: {
            messages: {
              from: 'system',
              message: `Completed: ${resolution || 'Prescription processed'}`,
              timestamp: new Date(),
              type: 'completion',
              whatsapp_sent: whatsappSent,
              whatsapp_message_id: whatsappMessageId,
            },
          },
        },
        { new: true },
      )
      .populate('patient_id', 'profile email')
      .exec();

    return {
      result: {
        item,
        whatsapp: {
          sent: whatsappSent,
          messageId: whatsappMessageId,
          error: whatsappError,
        },
      },
    };
  }

  /**
   * Escalate a queue item
   */
  async escalateItem(id: string, pharmacistId: string, reason: string) {
    // First get the queue item with patient info to get phone number
    const queueItem = await this.queueModel
      .findById(id)
      .populate('patient_id', 'profile email')
      .exec();

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    // Get patient phone number for WhatsApp notification (check profile first, then queue item's whatsapp_number)
    const patient = queueItem.patient_id as any;
    const phoneNumber = patient?.profile?.phone_number || queueItem.whatsapp_number;
    const patientName = patient?.profile?.first_name || 'Patient';

    let whatsappSent = false;
    let whatsappMessageId: string | undefined;
    let whatsappError: string | undefined;

    // Send WhatsApp notification about escalation
    if (phoneNumber && this.gupshupService.isConfigured()) {
      const escalationMessage = `Hello ${patientName}, your prescription request has been escalated to a senior pharmacist for further review.\n\nReason: ${reason}\n\nWe will get back to you shortly. Thank you for your patience.\n\n- Rapid Capsule Team`;

      const result = await this.gupshupService.sendTextMessage(phoneNumber, escalationMessage);
      whatsappSent = result.success;
      whatsappMessageId = result.messageId;
      whatsappError = result.error;

      if (result.success) {
        this.logger.log(`Escalation WhatsApp notification sent to ${phoneNumber}: ${result.messageId}`);
      } else {
        this.logger.warn(`Failed to send escalation WhatsApp notification: ${result.error}`);
      }
    } else if (!phoneNumber) {
      this.logger.warn(`No phone number available for patient in queue item ${id}`);
      whatsappError = 'No phone number available';
    } else {
      this.logger.warn('Gupshup not configured, escalation notification not sent via WhatsApp');
      whatsappError = 'WhatsApp service not configured';
    }

    // Update the queue item status
    const item = await this.queueModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: QueueStatus.ESCALATED,
            review_action: ReviewAction.ESCALATED,
          },
          $push: {
            escalation_history: {
              from_user: new Types.ObjectId(pharmacistId),
              reason,
              escalated_at: new Date(),
            },
            messages: {
              from: 'system',
              message: `Escalated: ${reason}`,
              timestamp: new Date(),
              type: 'escalation',
              whatsapp_sent: whatsappSent,
              whatsapp_message_id: whatsappMessageId,
            },
          },
        },
        { new: true },
      )
      .populate('patient_id', 'profile email')
      .exec();

    return {
      result: {
        item,
        whatsapp: {
          sent: whatsappSent,
          messageId: whatsappMessageId,
          error: whatsappError,
        },
      },
    };
  }

  /**
   * Get chat messages for a queue item
   */
  async getMessages(id: string) {
    const item = await this.queueModel.findById(id).select('messages queue_type').lean().exec();

    return {
      result: {
        messages: item?.messages || [],
        queueType: item?.queue_type,
      },
    };
  }
}
