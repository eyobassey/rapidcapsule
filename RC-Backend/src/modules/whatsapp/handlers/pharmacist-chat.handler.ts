import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FlowType } from '../entities/whatsapp-session.entity';
import {
  BaseFlowHandler,
  FlowHandlerResult,
  FlowContext,
  FlowAction,
} from './base-flow.handler';
import {
  WhatsAppPrescriptionQueue,
  WhatsAppPrescriptionQueueDocument,
  QueueType,
  QueuePriority,
  QueueStatus,
} from '../entities/whatsapp-prescription-queue.entity';
import { MESSAGES } from '../constants/messages.constant';

/**
 * Handles the pharmacist chat flow for human handoff
 *
 * This flow is entered when:
 * 1. User requests to speak with a pharmacist
 * 2. A prescription needs manual review
 * 3. An order has issues requiring pharmacist attention
 *
 * Flow behavior:
 * - Creates a queue item for pharmacist assignment
 * - Forwards all user messages to the assigned pharmacist
 * - Handles pharmacist responses back to user
 * - Allows user to exit back to bot when done
 */
@Injectable()
export class PharmacistChatHandler extends BaseFlowHandler {
  readonly flowType = FlowType.PHARMACIST_CHAT;
  private readonly logger = new Logger(PharmacistChatHandler.name);

  constructor(
    @InjectModel(WhatsAppPrescriptionQueue.name)
    private readonly queueModel: Model<WhatsAppPrescriptionQueueDocument>,
  ) {
    super();
  }

  async onEnter(context: FlowContext): Promise<FlowHandlerResult> {
    // Create queue item for pharmacist assignment
    const queueItem = await this.createQueueItem(context);

    return {
      response: MESSAGES.QUEUE_PHARMACIST_ESCALATION,
      newFlowData: {
        queue_id: queueItem._id.toString(),
        queue_created_at: new Date().toISOString(),
        is_assigned: false,
      },
    };
  }

  async handle(context: FlowContext): Promise<FlowHandlerResult> {
    const { message, session } = context;
    const text = message.body?.trim().toLowerCase() || '';

    // Check for exit commands
    if (text === 'cancel' || text === 'menu' || text === 'exit' || text === 'done') {
      await this.closeQueueItem(context);
      return this.endFlow(
        'Chat with pharmacist ended. ' + MESSAGES.MENU()
      );
    }

    // Check if user is asking about queue position
    if (text.includes('wait') || text.includes('queue') || text.includes('position')) {
      return this.showQueueStatus(context);
    }

    // Forward message to pharmacist queue
    const queueId = this.getFlowData<string>(context, 'queue_id');
    const isAssigned = this.getFlowData<boolean>(context, 'is_assigned');

    if (queueId) {
      await this.addMessageToQueue(queueId, {
        from: 'patient',
        message: message.body || '',
        timestamp: new Date(),
        type: message.type,
        media_url: message.media?.[0]?.url,
      });
    }

    if (isAssigned) {
      // Message will be forwarded to pharmacist
      return {
        response: null, // Don't auto-respond when pharmacist is assigned
        actions: [
          {
            type: 'LOG_EVENT',
            payload: {
              event: 'PHARMACIST_CHAT_MESSAGE',
              details: {
                queue_id: queueId,
                message_type: message.type,
              },
            },
          },
        ],
      };
    }

    // Not yet assigned - acknowledge message
    return this.respond(
      "I've added your message to the queue. A pharmacist will respond shortly.\n\n" +
      "Send 'cancel' to return to the main menu."
    );
  }

  async onExit(context: FlowContext): Promise<void> {
    // Mark queue item as completed when exiting flow
    await this.closeQueueItem(context);
  }

  /**
   * Create a queue item for pharmacist assignment
   */
  private async createQueueItem(
    context: FlowContext,
  ): Promise<WhatsAppPrescriptionQueueDocument> {
    const { message, session, identity } = context;

    // Determine reason for escalation from flow data
    const escalationReason = this.getFlowData<string>(context, 'escalation_reason') ||
      'Patient requested to speak with pharmacist';
    const prescriptionId = this.getFlowData<string>(context, 'prescription_id');
    const orderId = this.getFlowData<string>(context, 'order_id');

    const queueData = {
      whatsapp_number: message.from,
      patient_id: context.patientId,
      queue_type: QueueType.PHARMACIST_ESCALATION,
      priority: QueuePriority.NORMAL,
      status: QueueStatus.PENDING,
      prescription_upload_id: prescriptionId ? new Types.ObjectId(prescriptionId) : undefined,
      escalation_reason: escalationReason,
      queue_reason: escalationReason,
      session_id: session._id,
      messages: [{
        from: 'system' as const,
        message: `Patient ${identity.is_verified ? 'verified' : 'unverified'} requested pharmacist chat`,
        timestamp: new Date(),
        type: 'text',
      }],
      sla_deadline: new Date(Date.now() + 30 * 60 * 1000), // 30 minute SLA
    };

    const queueItem = await this.queueModel.create(queueData);
    this.logger.log(`Pharmacist chat queue item created: ${queueItem._id}`);

    return queueItem;
  }

  /**
   * Add a message to the queue conversation
   */
  private async addMessageToQueue(
    queueId: string,
    message: {
      from: 'patient' | 'pharmacist' | 'system';
      message: string;
      timestamp: Date;
      type: string;
      media_url?: string;
    },
  ): Promise<void> {
    try {
      await this.queueModel.findByIdAndUpdate(
        queueId,
        {
          $push: { messages: message },
          $set: { updated_at: new Date() },
        },
      );
    } catch (error) {
      this.logger.error(`Error adding message to queue ${queueId}:`, error);
    }
  }

  /**
   * Show queue status to user
   */
  private async showQueueStatus(
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const queueId = this.getFlowData<string>(context, 'queue_id');

    if (!queueId) {
      return this.respond(
        "You're in the queue. A pharmacist will be with you shortly.\n\n" +
        "Send 'cancel' to return to the main menu."
      );
    }

    try {
      const queueItem = await this.queueModel.findById(queueId).exec();

      if (!queueItem) {
        return this.respond(
          "You're in the queue. A pharmacist will be with you shortly."
        );
      }

      if (queueItem.status === QueueStatus.IN_PROGRESS) {
        return this.respond(
          "You're currently connected with a pharmacist. They will respond shortly."
        );
      }

      // Count position in queue
      const position = await this.queueModel.countDocuments({
        status: QueueStatus.PENDING,
        queue_type: QueueType.PHARMACIST_ESCALATION,
        created_at: { $lt: queueItem.created_at },
      });

      const estimatedWait = (position + 1) * 5; // ~5 mins per person

      return this.respond(
        `*Queue Status*\n\n` +
        `Position: ${position + 1}\n` +
        `Estimated wait: ${estimatedWait} minutes\n\n` +
        `We appreciate your patience! A pharmacist will be with you soon.\n\n` +
        `Send 'cancel' to return to the main menu.`
      );
    } catch (error) {
      this.logger.error('Error getting queue status:', error);
      return this.respond(
        "You're in the queue. A pharmacist will be with you shortly."
      );
    }
  }

  /**
   * Close/complete the queue item
   */
  private async closeQueueItem(context: FlowContext): Promise<void> {
    const queueId = this.getFlowData<string>(context, 'queue_id');

    if (!queueId) return;

    try {
      await this.queueModel.findByIdAndUpdate(
        queueId,
        {
          $set: {
            status: QueueStatus.COMPLETED,
            completed_at: new Date(),
            updated_at: new Date(),
          },
          $push: {
            messages: {
              from: 'system',
              message: 'Patient exited chat',
              timestamp: new Date(),
              type: 'text',
            },
          },
        },
      );
      this.logger.log(`Queue item ${queueId} closed`);
    } catch (error) {
      this.logger.error(`Error closing queue item ${queueId}:`, error);
    }
  }

  /**
   * Handle pharmacist response to patient
   * Called by admin/pharmacist interface
   */
  async handlePharmacistResponse(
    queueId: string,
    pharmacistId: Types.ObjectId,
    message: string,
  ): Promise<{
    success: boolean;
    whatsappNumber?: string;
    error?: string;
  }> {
    try {
      const queueItem = await this.queueModel.findById(queueId).exec();

      if (!queueItem) {
        return { success: false, error: 'Queue item not found' };
      }

      if (queueItem.status === QueueStatus.COMPLETED) {
        return { success: false, error: 'Chat has been closed by patient' };
      }

      // If not assigned, assign to this pharmacist
      if (queueItem.status === QueueStatus.PENDING) {
        await this.queueModel.findByIdAndUpdate(queueId, {
          $set: {
            status: QueueStatus.IN_PROGRESS,
            assigned_to: pharmacistId,
            assigned_at: new Date(),
          },
        });
      }

      // Add message to queue
      await this.addMessageToQueue(queueId, {
        from: 'pharmacist',
        message,
        timestamp: new Date(),
        type: 'text',
      });

      return {
        success: true,
        whatsappNumber: queueItem.whatsapp_number,
      };
    } catch (error) {
      this.logger.error('Error handling pharmacist response:', error);
      return { success: false, error: 'Internal error' };
    }
  }

  /**
   * Get pending queue items for pharmacist dashboard
   */
  async getPendingQueueItems(
    options: {
      limit?: number;
      offset?: number;
      type?: QueueType;
      priority?: QueuePriority;
    } = {},
  ): Promise<{ items: WhatsAppPrescriptionQueueDocument[]; total: number }> {
    const { limit = 20, offset = 0, type, priority } = options;

    const filter: any = {
      status: { $in: [QueueStatus.PENDING, QueueStatus.IN_PROGRESS] },
    };

    if (type) filter.queue_type = type;
    if (priority) filter.priority = priority;

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
}
