import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';
import { WhatsAppQueueService, QueueStats } from '../services/whatsapp-queue.service';
import { PharmacistChatHandler } from '../handlers/pharmacist-chat.handler';
import {
  QueueType,
  QueuePriority,
  QueueStatus,
  WhatsAppPrescriptionQueueDocument,
} from '../entities/whatsapp-prescription-queue.entity';

/**
 * Admin/Pharmacist endpoints for managing the WhatsApp prescription queue
 */
@Controller('whatsapp/queue')
@UseGuards(JwtAuthGuard)
export class WhatsAppQueueController {
  constructor(
    private readonly queueService: WhatsAppQueueService,
    private readonly chatHandler: PharmacistChatHandler,
  ) {}

  /**
   * Get pending queue items for pharmacist dashboard
   */
  @Get('pending')
  async getPendingItems(
    @Query('queueType') queueType?: QueueType,
    @Query('priority') priority?: QueuePriority,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<{ items: WhatsAppPrescriptionQueueDocument[]; total: number }> {
    return this.queueService.getPendingItems({
      queueType,
      priority,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy,
      sortOrder,
    });
  }

  /**
   * Get queue items assigned to the current pharmacist
   */
  @Get('my-queue')
  async getMyQueue(
    @Request() req: any,
    @Query('status') status?: QueueStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ items: WhatsAppPrescriptionQueueDocument[]; total: number }> {
    const pharmacistId = new Types.ObjectId(req.user._id);
    return this.queueService.getPharmacistQueue(pharmacistId, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * Get a specific queue item by ID
   */
  @Get(':id')
  async getQueueItem(
    @Param('id') id: string,
  ): Promise<WhatsAppPrescriptionQueueDocument> {
    return this.queueService.getQueueItem(id);
  }

  /**
   * Get queue statistics
   */
  @Get('stats/overview')
  async getQueueStats(
    @Query('queueType') queueType?: QueueType,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<QueueStats> {
    return this.queueService.getQueueStats({
      queueType,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  /**
   * Claim the next available queue item
   */
  @Post('claim-next')
  async claimNextItem(
    @Request() req: any,
    @Body('preferredTypes') preferredTypes?: QueueType[],
  ): Promise<{ item: WhatsAppPrescriptionQueueDocument | null; message: string }> {
    const pharmacistId = new Types.ObjectId(req.user._id);
    const item = await this.queueService.getNextQueueItem(pharmacistId, preferredTypes);

    if (!item) {
      return { item: null, message: 'No pending queue items available' };
    }

    return { item, message: 'Queue item claimed successfully' };
  }

  /**
   * Assign a specific queue item to the current pharmacist
   */
  @Post(':id/assign')
  async assignToMe(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WhatsAppPrescriptionQueueDocument> {
    const pharmacistId = new Types.ObjectId(req.user._id);
    const pharmacistName = `${req.user.profile?.first_name || ''} ${req.user.profile?.last_name || ''}`.trim() || 'Pharmacist';

    return this.queueService.assignToPharmacist(id, pharmacistId, pharmacistName);
  }

  /**
   * Send a message to the patient in a queue item
   */
  @Post(':id/message')
  async sendMessage(
    @Param('id') id: string,
    @Request() req: any,
    @Body('message') message: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!message?.trim()) {
      throw new BadRequestException('Message cannot be empty');
    }

    const pharmacistId = new Types.ObjectId(req.user._id);
    const pharmacistName = `${req.user.profile?.first_name || ''} ${req.user.profile?.last_name || ''}`.trim() || 'Pharmacist';

    return this.queueService.sendPharmacistMessage(id, pharmacistId, message.trim(), pharmacistName);
  }

  /**
   * Complete/close a queue item
   */
  @Patch(':id/complete')
  async completeItem(
    @Param('id') id: string,
    @Request() req: any,
    @Body('resolution') resolution?: string,
  ): Promise<WhatsAppPrescriptionQueueDocument> {
    const pharmacistId = new Types.ObjectId(req.user._id);
    return this.queueService.completeQueueItem(id, pharmacistId, resolution);
  }

  /**
   * Escalate a queue item to higher priority
   */
  @Patch(':id/escalate')
  async escalateItem(
    @Param('id') id: string,
    @Request() req: any,
    @Body('reason') reason: string,
  ): Promise<WhatsAppPrescriptionQueueDocument> {
    if (!reason?.trim()) {
      throw new BadRequestException('Escalation reason is required');
    }

    const pharmacistId = new Types.ObjectId(req.user._id);
    return this.queueService.escalateQueueItem(id, pharmacistId, reason.trim());
  }

  /**
   * Get chat history for a queue item (for PHARMACIST_ESCALATION type)
   */
  @Get(':id/messages')
  async getChatMessages(
    @Param('id') id: string,
  ): Promise<{ messages: any[]; queueType: QueueType }> {
    const item = await this.queueService.getQueueItem(id);
    return {
      messages: item.messages || [],
      queueType: item.queue_type,
    };
  }

  /**
   * Manually trigger SLA breach check and auto-escalation
   * (This would typically be called by a cron job)
   */
  @Post('check-sla-breaches')
  async checkSlaBreaches(): Promise<{ escalatedCount: number }> {
    const escalatedCount = await this.queueService.checkAndEscalateSlaBreaches();
    return { escalatedCount };
  }
}
