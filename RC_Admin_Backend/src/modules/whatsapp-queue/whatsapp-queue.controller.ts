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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { QueueType, QueuePriority, QueueStatus } from './whatsapp-prescription-queue.entity';
import { GupshupService } from '../../common/external/gupshup';

@Controller('whatsapp/queue')
@UseGuards(JwtAuthGuard)
export class WhatsAppQueueController {
  constructor(
    private readonly queueService: WhatsAppQueueService,
    private readonly gupshupService: GupshupService,
  ) {}

  /**
   * Get WhatsApp service configuration status
   */
  @Get('config/status')
  async getConfigStatus() {
    return this.gupshupService.getConfigStatus();
  }

  /**
   * Get pending queue items
   */
  @Get('pending')
  async getPendingItems(
    @Query('queueType') queueType?: QueueType,
    @Query('priority') priority?: QueuePriority,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.queueService.fetchPendingItems({
      queueType,
      priority,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
      sortBy,
      sortOrder,
    });
  }

  /**
   * Get queue items assigned to current pharmacist
   */
  @Get('my-queue')
  async getMyQueue(
    @Request() req,
    @Query('status') status?: QueueStatus,
    @Query('includeAll') includeAll?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const pharmacistId = req.user.sub;
    return this.queueService.fetchMyQueue(pharmacistId, {
      status,
      includeAll: includeAll === 'true',
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  /**
   * Get escalated queue items (for senior pharmacists)
   */
  @Get('escalated')
  async getEscalatedItems(
    @Query('queueType') queueType?: QueueType,
    @Query('priority') priority?: QueuePriority,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.queueService.fetchEscalatedItems({
      queueType,
      priority,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  /**
   * Get queue statistics
   * NOTE: This must come BEFORE the :id route to avoid 'stats' being treated as an ID
   */
  @Get('stats/overview')
  async getStats(
    @Query('queueType') queueType?: QueueType,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.queueService.fetchStats({
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
    @Request() req,
    @Body('preferredTypes') preferredTypes?: QueueType[],
  ) {
    const pharmacistId = req.user.sub;
    return this.queueService.claimNextItem(pharmacistId, preferredTypes || []);
  }

  /**
   * Assign a specific queue item to current pharmacist
   */
  @Post(':id/assign')
  async assignItem(@Param('id') id: string, @Request() req) {
    const pharmacistId = req.user.sub;
    return this.queueService.assignItem(id, pharmacistId);
  }

  /**
   * Send a message to patient
   */
  @Post(':id/message')
  async sendMessage(
    @Param('id') id: string,
    @Request() req,
    @Body('message') message: string,
  ) {
    const pharmacistId = req.user.sub;
    return this.queueService.sendMessage(id, pharmacistId, message);
  }

  /**
   * Get chat messages for a queue item
   */
  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    return this.queueService.getMessages(id);
  }

  /**
   * Complete a queue item
   */
  @Patch(':id/complete')
  async completeItem(
    @Param('id') id: string,
    @Request() req,
    @Body('resolution') resolution?: string,
  ) {
    const pharmacistId = req.user.sub;
    return this.queueService.completeItem(id, pharmacistId, resolution || '');
  }

  /**
   * Escalate a queue item
   */
  @Patch(':id/escalate')
  async escalateItem(
    @Param('id') id: string,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    const pharmacistId = req.user.sub;
    return this.queueService.escalateItem(id, pharmacistId, reason);
  }

  /**
   * Get a specific queue item
   * NOTE: This must come AFTER all other specific routes to avoid catching them
   */
  @Get(':id')
  async getQueueItem(@Param('id') id: string) {
    return this.queueService.fetchQueueItem(id);
  }
}
