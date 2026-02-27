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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
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
@ApiTags('WhatsApp Queue')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({
    summary: 'List pending queue items',
    description: 'Retrieves pending WhatsApp prescription queue items for the pharmacist dashboard. Supports filtering by queue type and priority, with pagination and sorting.',
  })
  @ApiQuery({ name: 'queueType', required: false, enum: ['PRESCRIPTION_UPLOAD', 'PHARMACIST_ESCALATION', 'ORDER_REVIEW', 'DELIVERY_ISSUE'], description: 'Filter by queue type' })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], description: 'Filter by priority level' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Maximum number of items to return', example: '20' })
  @ApiQuery({ name: 'offset', required: false, type: String, description: 'Number of items to skip for pagination', example: '0' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field name to sort by', example: 'created_at' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort direction' })
  @ApiResponse({ status: 200, description: 'Pending queue items retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
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
  @ApiOperation({
    summary: 'List queue items assigned to the current pharmacist',
    description: 'Retrieves WhatsApp prescription queue items that are assigned to the currently authenticated pharmacist. Supports filtering by status and pagination.',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'ESCALATED', 'CANCELLED'], description: 'Filter by queue item status' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Maximum number of items to return', example: '20' })
  @ApiQuery({ name: 'offset', required: false, type: String, description: 'Number of items to skip for pagination', example: '0' })
  @ApiResponse({ status: 200, description: 'Pharmacist queue items retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
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
  @ApiOperation({
    summary: 'Get a queue item by ID',
    description: 'Retrieves the full details of a specific WhatsApp prescription queue item including its messages, status history, and assigned pharmacist.',
  })
  @ApiParam({ name: 'id', description: 'Queue item MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Queue item retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @Get(':id')
  async getQueueItem(
    @Param('id') id: string,
  ): Promise<WhatsAppPrescriptionQueueDocument> {
    return this.queueService.getQueueItem(id);
  }

  /**
   * Get queue statistics
   */
  @ApiOperation({
    summary: 'Get queue statistics overview',
    description: 'Returns aggregate statistics for the WhatsApp prescription queue including counts by status, average resolution times, and SLA compliance metrics. Supports filtering by queue type and date range.',
  })
  @ApiQuery({ name: 'queueType', required: false, enum: ['PRESCRIPTION_UPLOAD', 'PHARMACIST_ESCALATION', 'ORDER_REVIEW', 'DELIVERY_ISSUE'], description: 'Filter statistics by queue type' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Start date for the statistics period (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'End date for the statistics period (ISO 8601)', example: '2026-02-28T23:59:59.999Z' })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
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
  @ApiOperation({
    summary: 'Claim the next available queue item',
    description: 'Automatically assigns the highest-priority pending queue item to the current pharmacist. Optionally accepts preferred queue types to prioritize. Returns null if no items are available.',
  })
  @ApiResponse({ status: 200, description: 'Next queue item claimed successfully, or no items available' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
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
  @ApiOperation({
    summary: 'Assign a queue item to the current pharmacist',
    description: 'Assigns a specific pending WhatsApp prescription queue item to the currently authenticated pharmacist. The item must be in PENDING status.',
  })
  @ApiParam({ name: 'id', description: 'Queue item MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Queue item assigned to pharmacist successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
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
  @ApiOperation({
    summary: 'Send a message to the patient for a queue item',
    description: 'Sends a WhatsApp message from the pharmacist to the patient associated with the given queue item. The message is recorded in the queue item chat history.',
  })
  @ApiParam({ name: 'id', description: 'Queue item MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Message sent to patient successfully' })
  @ApiResponse({ status: 400, description: 'Message cannot be empty' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
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
  @ApiOperation({
    summary: 'Complete and close a queue item',
    description: 'Marks a WhatsApp prescription queue item as completed with an optional resolution note. Only the assigned pharmacist can complete the item.',
  })
  @ApiParam({ name: 'id', description: 'Queue item MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Queue item completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
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
  @ApiOperation({
    summary: 'Escalate a queue item to higher priority',
    description: 'Escalates a WhatsApp prescription queue item to a higher priority level with a mandatory reason. The item will be reassigned or flagged for senior review.',
  })
  @ApiParam({ name: 'id', description: 'Queue item MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Queue item escalated successfully' })
  @ApiResponse({ status: 400, description: 'Escalation reason is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
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
  @ApiOperation({
    summary: 'Get chat message history for a queue item',
    description: 'Retrieves the full chat message history between the pharmacist and patient for a specific queue item. Includes both inbound and outbound messages with timestamps.',
  })
  @ApiParam({ name: 'id', description: 'Queue item MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Chat messages retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
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
  @ApiOperation({
    summary: 'Check for SLA breaches and auto-escalate',
    description: 'Scans all open queue items for SLA violations and automatically escalates breached items to higher priority. Typically triggered by a cron job but can be invoked manually.',
  })
  @ApiResponse({ status: 200, description: 'SLA breach check completed with escalation count returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  @Post('check-sla-breaches')
  async checkSlaBreaches(): Promise<{ escalatedCount: number }> {
    const escalatedCount = await this.queueService.checkAndEscalateSlaBreaches();
    return { escalatedCount };
  }
}
