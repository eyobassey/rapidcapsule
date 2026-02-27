import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
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
import { AuditLogService, AuditLogQueryDto } from './services/audit-log.service';
import {
  FraudAlertService,
  FraudAlertQueryDto,
  CreateFraudAlertDto,
  UpdateFraudAlertDto,
} from './services/fraud-alert.service';
import { FraudAlertStatus } from './entities/fraud-alert.entity';
import { AuditEntityType } from './entities/audit-log.entity';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@ApiTags('Admin Compliance')
@ApiBearerAuth('JWT-auth')
@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly fraudAlertService: FraudAlertService,
  ) {}

  // ============================================
  // AUDIT LOG ENDPOINTS
  // ============================================

  @Get('audit-logs')
  @ApiOperation({ summary: 'List audit logs', description: 'Retrieve paginated audit logs with optional filters for action type, entity, date range, etc.' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    const result = await this.auditLogService.findAll(query);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('audit-logs/entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get audit logs for a specific entity', description: 'Retrieve all audit log entries related to a specific entity type and ID (e.g., a prescription, order, or drug).' })
  @ApiParam({ name: 'entityType', description: 'Type of entity to retrieve logs for', enum: ['Prescription', 'Order', 'Drug', 'Pharmacy', 'Patient', 'Specialist', 'Inventory', 'StockBatch', 'Payment', 'Refund', 'User', 'Admin', 'Setting'], example: 'Order' })
  @ApiParam({ name: 'entityId', description: 'MongoDB ObjectId of the entity', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of audit log entries to return', example: 50 })
  @ApiResponse({ status: 200, description: 'Entity audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getEntityAuditLogs(
    @Param('entityType') entityType: AuditEntityType,
    @Param('entityId') entityId: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.auditLogService.findByEntity(
      entityType,
      entityId,
      limit,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('audit-logs/user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a specific user', description: 'Retrieve paginated audit log entries for actions performed by or on a specific user.' })
  @ApiParam({ name: 'userId', description: 'MongoDB ObjectId of the user', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records per page', example: 20 })
  @ApiResponse({ status: 200, description: 'User audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getUserAuditLogs(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.auditLogService.findByUser(userId, { page, limit });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('audit-logs/recent')
  @ApiOperation({ summary: 'Get recent audit activity', description: 'Retrieve the most recent audit log entries across all entities and users.' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of recent entries to return', example: 20 })
  @ApiResponse({ status: 200, description: 'Recent audit activity retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getRecentActivity(@Query('limit') limit?: number) {
    const result = await this.auditLogService.getRecentActivity(limit);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('audit-logs/stats')
  @ApiOperation({ summary: 'Get audit log statistics', description: 'Retrieve aggregated audit activity statistics within a specified date range, including action counts and breakdowns.' })
  @ApiQuery({ name: 'start_date', required: true, type: String, description: 'Start date for the statistics period (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  @ApiQuery({ name: 'end_date', required: true, type: String, description: 'End date for the statistics period (ISO 8601)', example: '2026-02-01T00:00:00.000Z' })
  @ApiResponse({ status: 200, description: 'Audit statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getAuditStats(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    const result = await this.auditLogService.getActivityStats(
      new Date(startDate),
      new Date(endDate),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============================================
  // FRAUD ALERT ENDPOINTS
  // ============================================

  @Get('fraud-alerts')
  @ApiOperation({ summary: 'List fraud alerts', description: 'Retrieve paginated fraud alerts with optional filters for status, severity, type, and date range.' })
  @ApiResponse({ status: 200, description: 'Fraud alerts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getFraudAlerts(@Query() query: FraudAlertQueryDto) {
    const result = await this.fraudAlertService.findAll(query);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('fraud-alerts/stats')
  @ApiOperation({ summary: 'Get fraud alert statistics', description: 'Retrieve summary statistics for fraud alerts including counts by status, severity, and type.' })
  @ApiResponse({ status: 200, description: 'Fraud alert statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getFraudAlertStats() {
    const result = await this.fraudAlertService.getStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('fraud-alerts/unassigned')
  @ApiOperation({ summary: 'Get unassigned fraud alerts', description: 'Retrieve all fraud alerts that have not yet been assigned to an investigator.' })
  @ApiResponse({ status: 200, description: 'Unassigned fraud alerts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getUnassignedAlerts() {
    const result = await this.fraudAlertService.getUnassigned();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('fraud-alerts/:id')
  @ApiOperation({ summary: 'Get a single fraud alert', description: 'Retrieve full details of a specific fraud alert by its ID, including actions history and resolution info.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the fraud alert', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Fraud alert retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Fraud alert not found' })
  async getFraudAlert(@Param('id') id: string) {
    const result = await this.fraudAlertService.findById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('fraud-alerts')
  @ApiOperation({ summary: 'Create a fraud alert', description: 'Manually create a new fraud alert for a suspicious prescription or patient activity.' })
  @ApiResponse({ status: 201, description: 'Fraud alert created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async createFraudAlert(@Body() dto: CreateFraudAlertDto, @Request() req) {
    const result = await this.fraudAlertService.create(dto);
    return sendSuccessResponse('Fraud alert created successfully', result);
  }

  @Patch('fraud-alerts/:id')
  @ApiOperation({ summary: 'Update a fraud alert', description: 'Update an existing fraud alert with new information such as status, severity, or investigation notes.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the fraud alert', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Fraud alert updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Fraud alert not found' })
  async updateFraudAlert(
    @Param('id') id: string,
    @Body() dto: UpdateFraudAlertDto,
    @Request() req,
  ) {
    const userName = req.user?.profile
      ? `${req.user.profile.first_name} ${req.user.profile.last_name}`
      : req.user?.email;
    const result = await this.fraudAlertService.update(
      id,
      dto,
      req.user.sub,
      userName,
    );
    return sendSuccessResponse('Fraud alert updated successfully', result);
  }

  @Post('fraud-alerts/:id/assign')
  @ApiOperation({ summary: 'Assign a fraud alert to an investigator', description: 'Assign a fraud alert to a specific admin user for investigation.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the fraud alert', example: '507f1f77bcf86cd799439011' })
  @ApiBody({
    description: 'Assignee details',
    schema: {
      type: 'object',
      required: ['assignee_id', 'assignee_name'],
      properties: {
        assignee_id: { type: 'string', description: 'MongoDB ObjectId of the admin to assign', example: '507f1f77bcf86cd799439012' },
        assignee_name: { type: 'string', description: 'Full name of the assignee', example: 'Dr. Adebayo Ogunlesi' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Fraud alert assigned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Fraud alert not found' })
  async assignFraudAlert(
    @Param('id') id: string,
    @Body() body: { assignee_id: string; assignee_name: string },
    @Request() req,
  ) {
    const result = await this.fraudAlertService.assignTo(
      id,
      body.assignee_id,
      body.assignee_name,
      req.user.sub,
    );
    return sendSuccessResponse('Fraud alert assigned successfully', result);
  }

  @Post('fraud-alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve a fraud alert', description: 'Mark a fraud alert as resolved, false positive, or confirmed fraud with a resolution note.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the fraud alert', example: '507f1f77bcf86cd799439011' })
  @ApiBody({
    description: 'Resolution details',
    schema: {
      type: 'object',
      required: ['status', 'resolution'],
      properties: {
        status: { type: 'string', enum: ['RESOLVED', 'FALSE_POSITIVE', 'CONFIRMED_FRAUD'], description: 'Resolution status for the fraud alert', example: 'RESOLVED' },
        resolution: { type: 'string', description: 'Explanation of the resolution outcome', example: 'Investigated and confirmed the prescription was legitimate. Patient has a valid refill schedule.' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Fraud alert resolved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Fraud alert not found' })
  async resolveFraudAlert(
    @Param('id') id: string,
    @Body()
    body: {
      status: FraudAlertStatus.RESOLVED | FraudAlertStatus.FALSE_POSITIVE | FraudAlertStatus.CONFIRMED_FRAUD;
      resolution: string;
    },
    @Request() req,
  ) {
    const userName = req.user?.profile
      ? `${req.user.profile.first_name} ${req.user.profile.last_name}`
      : req.user?.email;
    const result = await this.fraudAlertService.resolve(
      id,
      body.status,
      body.resolution,
      req.user.sub,
      userName,
    );
    return sendSuccessResponse('Fraud alert resolved successfully', result);
  }

  @Post('fraud-alerts/:id/action')
  @ApiOperation({ summary: 'Add an action to a fraud alert', description: 'Record an investigative action taken on a fraud alert, such as contacting the patient or reviewing records.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the fraud alert', example: '507f1f77bcf86cd799439011' })
  @ApiBody({
    description: 'Action details',
    schema: {
      type: 'object',
      required: ['action'],
      properties: {
        action: { type: 'string', description: 'Description of the action taken', example: 'Contacted the prescribing physician to verify prescription authenticity' },
        notes: { type: 'string', description: 'Optional additional notes about the action', example: 'Physician confirmed the prescription was issued on 2026-02-15' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Action added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Fraud alert not found' })
  async addFraudAlertAction(
    @Param('id') id: string,
    @Body() body: { action: string; notes?: string },
    @Request() req,
  ) {
    const userName = req.user?.profile
      ? `${req.user.profile.first_name} ${req.user.profile.last_name}`
      : req.user?.email;
    const result = await this.fraudAlertService.addAction(
      id,
      body.action,
      req.user.sub,
      userName,
      body.notes,
    );
    return sendSuccessResponse('Action added successfully', result);
  }

  @Post('fraud-alerts/:id/block-patient')
  @ApiOperation({ summary: 'Block a patient linked to a fraud alert', description: 'Block/suspend the patient associated with a fraud alert, preventing further orders and prescriptions.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the fraud alert', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient blocked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Fraud alert not found' })
  async blockPatient(@Param('id') id: string, @Request() req) {
    const userName = req.user?.profile
      ? `${req.user.profile.first_name} ${req.user.profile.last_name}`
      : req.user?.email;
    const result = await this.fraudAlertService.blockPatient(
      id,
      req.user.sub,
      userName,
    );
    return sendSuccessResponse('Patient blocked successfully', result);
  }

  @Get('fraud-alerts/patient/:patientId')
  @ApiOperation({ summary: 'Get fraud alerts for a specific patient', description: 'Retrieve all fraud alerts associated with a particular patient by their user ID.' })
  @ApiParam({ name: 'patientId', description: 'MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient fraud alerts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getPatientFraudAlerts(@Param('patientId') patientId: string) {
    const result = await this.fraudAlertService.getPatientAlerts(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============================================
  // COMPLIANCE DASHBOARD
  // ============================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get compliance dashboard overview', description: 'Retrieve the compliance dashboard with aggregated fraud alert statistics and recent audit activity.' })
  @ApiResponse({ status: 200, description: 'Compliance dashboard data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getComplianceDashboard() {
    const [fraudStats, recentActivity] = await Promise.all([
      this.fraudAlertService.getStats(),
      this.auditLogService.getRecentActivity(20),
    ]);

    return sendSuccessResponse(Messages.RETRIEVED, {
      fraud_alerts: fraudStats,
      recent_activity: recentActivity,
    });
  }
}
