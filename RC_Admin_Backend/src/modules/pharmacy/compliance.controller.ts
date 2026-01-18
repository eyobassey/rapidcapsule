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
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    const result = await this.auditLogService.findAll(query);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('audit-logs/entity/:entityType/:entityId')
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
  async getUserAuditLogs(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.auditLogService.findByUser(userId, { page, limit });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('audit-logs/recent')
  async getRecentActivity(@Query('limit') limit?: number) {
    const result = await this.auditLogService.getRecentActivity(limit);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('audit-logs/stats')
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
  async getFraudAlerts(@Query() query: FraudAlertQueryDto) {
    const result = await this.fraudAlertService.findAll(query);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('fraud-alerts/stats')
  async getFraudAlertStats() {
    const result = await this.fraudAlertService.getStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('fraud-alerts/unassigned')
  async getUnassignedAlerts() {
    const result = await this.fraudAlertService.getUnassigned();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('fraud-alerts/:id')
  async getFraudAlert(@Param('id') id: string) {
    const result = await this.fraudAlertService.findById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('fraud-alerts')
  async createFraudAlert(@Body() dto: CreateFraudAlertDto, @Request() req) {
    const result = await this.fraudAlertService.create(dto);
    return sendSuccessResponse('Fraud alert created successfully', result);
  }

  @Patch('fraud-alerts/:id')
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
  async getPatientFraudAlerts(@Param('patientId') patientId: string) {
    const result = await this.fraudAlertService.getPatientAlerts(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============================================
  // COMPLIANCE DASHBOARD
  // ============================================

  @Get('dashboard')
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
