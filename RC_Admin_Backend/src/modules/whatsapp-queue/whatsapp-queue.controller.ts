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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { QueueType, QueuePriority, QueueStatus } from './whatsapp-prescription-queue.entity';
import { GupshupService } from '../../common/external/gupshup';

@ApiTags('WhatsApp Queue')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Get WhatsApp config status', description: 'Retrieve the current Gupshup WhatsApp service configuration status including API connectivity and template availability.' })
  @ApiResponse({ status: 200, description: 'WhatsApp configuration status returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getConfigStatus() {
    return this.gupshupService.getConfigStatus();
  }

  /**
   * Get pending queue items
   */
  @Get('pending')
  @ApiOperation({ summary: 'Get pending queue items', description: 'Retrieve prescription queue items awaiting pharmacist review, with optional filtering by queue type and priority.' })
  @ApiQuery({ name: 'queueType', required: false, enum: QueueType, description: 'Filter by queue type (e.g. OCR_REVIEW, CONTROLLED_SUBSTANCE)' })
  @ApiQuery({ name: 'priority', required: false, enum: QueuePriority, description: 'Filter by priority level', example: 'NORMAL' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Number of items per page', example: '20' })
  @ApiQuery({ name: 'offset', required: false, type: String, description: 'Number of items to skip for pagination', example: '0' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort results by', example: 'created_at' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort direction', example: 'desc' })
  @ApiResponse({ status: 200, description: 'Pending queue items retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
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
  @ApiOperation({ summary: 'Get my queue items', description: 'Retrieve prescription queue items currently assigned to the authenticated pharmacist, with optional status filtering.' })
  @ApiQuery({ name: 'status', required: false, enum: QueueStatus, description: 'Filter by item status (e.g. IN_PROGRESS, COMPLETED)' })
  @ApiQuery({ name: 'includeAll', required: false, type: String, description: 'Set to "true" to include items of all statuses', example: 'false' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Number of items per page', example: '20' })
  @ApiQuery({ name: 'offset', required: false, type: String, description: 'Number of items to skip for pagination', example: '0' })
  @ApiResponse({ status: 200, description: 'Pharmacist queue items retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
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
  @ApiOperation({ summary: 'Get escalated queue items', description: 'Retrieve prescription queue items that have been escalated to senior pharmacists for further review.' })
  @ApiQuery({ name: 'queueType', required: false, enum: QueueType, description: 'Filter escalated items by queue type' })
  @ApiQuery({ name: 'priority', required: false, enum: QueuePriority, description: 'Filter escalated items by priority level' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Number of items per page', example: '20' })
  @ApiQuery({ name: 'offset', required: false, type: String, description: 'Number of items to skip for pagination', example: '0' })
  @ApiResponse({ status: 200, description: 'Escalated queue items retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
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
  @ApiOperation({ summary: 'Get queue statistics', description: 'Retrieve aggregate statistics for the prescription queue including counts by status, average processing times, and SLA breach rates.' })
  @ApiQuery({ name: 'queueType', required: false, enum: QueueType, description: 'Filter statistics by queue type' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Start date for statistics period (ISO 8601)', example: '2025-01-01' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'End date for statistics period (ISO 8601)', example: '2025-01-31' })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
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
  @ApiOperation({ summary: 'Claim next queue item', description: 'Automatically claim the next available prescription queue item for the authenticated pharmacist, optionally filtered by preferred queue types.' })
  @ApiBody({ schema: { type: 'object', properties: { preferredTypes: { type: 'array', items: { type: 'string', enum: ['OCR_REVIEW', 'MANUAL_ENTRY', 'CONTROLLED_SUBSTANCE', 'VERIFICATION_FAILED', 'PHARMACIST_ESCALATION', 'CLARIFICATION_RESPONSE'] }, description: 'Preferred queue types to claim from', example: ['OCR_REVIEW', 'MANUAL_ENTRY'] } } } })
  @ApiResponse({ status: 201, description: 'Queue item claimed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'No available queue items to claim.' })
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
  @ApiOperation({ summary: 'Assign queue item', description: 'Assign a specific prescription queue item to the authenticated pharmacist for review and processing.' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the queue item', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 201, description: 'Queue item assigned to pharmacist successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Queue item not found.' })
  async assignItem(@Param('id') id: string, @Request() req) {
    const pharmacistId = req.user.sub;
    return this.queueService.assignItem(id, pharmacistId);
  }

  /**
   * Send a message to patient
   */
  @Post(':id/message')
  @ApiOperation({ summary: 'Send message to patient', description: 'Send a WhatsApp message to the patient associated with a specific queue item. Used for clarification requests or status updates.' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the queue item', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { message: { type: 'string', description: 'Message text to send to the patient', example: 'Good afternoon, please confirm the dosage on your prescription for Amoxicillin.' } }, required: ['message'] } })
  @ApiResponse({ status: 201, description: 'Message sent to patient successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Queue item not found.' })
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
  @ApiOperation({ summary: 'Get queue item messages', description: 'Retrieve the full chat message history for a specific prescription queue item, including patient, pharmacist, and system messages.' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the queue item', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Queue item messages retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Queue item not found.' })
  async getMessages(@Param('id') id: string) {
    return this.queueService.getMessages(id);
  }

  /**
   * Complete a queue item
   */
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete queue item', description: 'Mark a prescription queue item as completed with optional resolution notes describing the outcome.' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the queue item', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { resolution: { type: 'string', description: 'Resolution notes describing how the item was processed', example: 'Prescription verified. Amoxicillin 500mg dispensed to patient.' } } } })
  @ApiResponse({ status: 200, description: 'Queue item completed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Queue item not found.' })
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
  @ApiOperation({ summary: 'Escalate queue item', description: 'Escalate a prescription queue item to a senior pharmacist with a mandatory reason for the escalation.' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the queue item', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', description: 'Reason for escalating the queue item', example: 'Controlled substance requires senior pharmacist verification per NAFDAC guidelines.' } }, required: ['reason'] } })
  @ApiResponse({ status: 200, description: 'Queue item escalated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Queue item not found.' })
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
  @ApiOperation({ summary: 'Get queue item details', description: 'Retrieve full details for a specific prescription queue item including OCR data, messages, assignment history, and review status.' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the queue item', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Queue item details retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Queue item not found.' })
  async getQueueItem(@Param('id') id: string) {
    return this.queueService.fetchQueueItem(id);
  }
}
