import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecoveryAdminService } from './recovery-admin.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@ApiTags('Admin Recovery')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery')
export class RecoveryAdminController {
  constructor(private readonly recoveryService: RecoveryAdminService) {}

  // ─── G2: Dashboard Endpoints ──────────────────────────────────────

  @Get('metrics')
  @ApiOperation({
    summary: 'Get recovery programme metrics',
    description:
      'Returns total enrolled, active, status breakdown, avg sobriety, relapses, crises, screenings, milestones.',
  })
  @ApiResponse({ status: 200, description: 'Recovery metrics returned' })
  async getMetrics() {
    const result = await this.recoveryService.getMetrics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('cohort')
  @ApiOperation({
    summary: 'Get recovery cohort',
    description:
      'Filterable list of recovery patients with risk levels, substance, status.',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by recovery status' })
  @ApiQuery({ name: 'risk_level', required: false, description: 'Filter by risk level (low, moderate, high, critical)' })
  @ApiQuery({ name: 'substance', required: false, description: 'Filter by primary substance' })
  @ApiQuery({ name: 'care_level', required: false, description: 'Filter by care level' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recovery cohort returned' })
  async getCohort(
    @Query('status') status?: string,
    @Query('risk_level') risk_level?: string,
    @Query('substance') substance?: string,
    @Query('care_level') care_level?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.recoveryService.getCohort({
      status,
      risk_level,
      substance,
      care_level,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('risk-overview')
  @ApiOperation({
    summary: 'Get risk level overview',
    description:
      'Risk distribution across active patients, recent escalations, weekly trend.',
  })
  @ApiResponse({ status: 200, description: 'Risk overview returned' })
  async getRiskOverview() {
    const result = await this.recoveryService.getRiskOverview();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('screenings/trends')
  @ApiOperation({
    summary: 'Get screening trends',
    description:
      'Screening completion rates, score trends, type breakdown over the last 90 days.',
  })
  @ApiResponse({ status: 200, description: 'Screening trends returned' })
  async getScreeningTrends() {
    const result = await this.recoveryService.getScreeningTrends();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('milestones/recent')
  @ApiOperation({
    summary: 'Get recent milestones',
    description: 'Returns recently achieved milestones across all patients.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent milestones returned' })
  async getRecentMilestones(@Query('limit') limit?: string) {
    const result = await this.recoveryService.getRecentMilestones(
      parseInt(limit) || 20,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('crisis/active')
  @ApiOperation({
    summary: 'Get active crisis events',
    description: 'Returns all active, responding, or escalated crisis events.',
  })
  @ApiResponse({ status: 200, description: 'Active crises returned' })
  async getActiveCrises() {
    const result = await this.recoveryService.getActiveCrises();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('crisis/history')
  @ApiOperation({
    summary: 'Get crisis event history',
    description: 'Paginated, filterable history of all crisis events.',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'crisis_type', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Crisis history returned' })
  async getCrisisHistory(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('crisis_type') crisis_type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.recoveryService.getCrisisHistory({
      status,
      severity,
      crisis_type,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('group-sessions')
  @ApiOperation({
    summary: 'Get group sessions',
    description: 'All group sessions with attendance rates and enrolment counts.',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'session_category', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Group sessions returned' })
  async getGroupSessions(
    @Query('status') status?: string,
    @Query('session_category') session_category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.recoveryService.getGroupSessions({
      status,
      session_category,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ─── G3: Patient Recovery Endpoints ───────────────────────────────

  @Get('patient/:patientId/profile')
  @ApiOperation({
    summary: 'Get patient recovery profile',
    description:
      'Full recovery profile including sobriety counter, risk gauge, care team, counts.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient user ID' })
  @ApiResponse({ status: 200, description: 'Patient recovery profile returned' })
  @ApiResponse({ status: 404, description: 'Recovery profile not found' })
  async getPatientProfile(@Param('patientId') patientId: string) {
    const result = await this.recoveryService.getPatientProfile(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/risk-history')
  @ApiOperation({
    summary: 'Get patient risk score history',
    description: 'Historical risk scores with signal breakdowns for charting.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Risk history returned' })
  async getPatientRiskHistory(
    @Param('patientId') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.recoveryService.getPatientRiskHistory(
      patientId,
      parseInt(page) || 1,
      parseInt(limit) || 50,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/sobriety-timeline')
  @ApiOperation({
    summary: 'Get patient sobriety timeline',
    description: 'Paginated daily sobriety check-in logs.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Sobriety timeline returned' })
  async getPatientSobrietyTimeline(
    @Param('patientId') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.recoveryService.getPatientSobrietyTimeline(
      patientId,
      parseInt(page) || 1,
      parseInt(limit) || 30,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/treatment-progress')
  @ApiOperation({
    summary: 'Get patient treatment progress',
    description:
      'Recovery plans, screenings, milestones, and 30-day engagement metrics.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient user ID' })
  @ApiResponse({ status: 200, description: 'Treatment progress returned' })
  async getPatientTreatmentProgress(
    @Param('patientId') patientId: string,
  ) {
    const result =
      await this.recoveryService.getPatientTreatmentProgress(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('patient/:patientId/status')
  @ApiOperation({
    summary: 'Update patient recovery status',
    description:
      'Admin management of enrolment status (active, paused, completed, discharged, archived).',
  })
  @ApiParam({ name: 'patientId', description: 'Patient user ID' })
  @ApiResponse({ status: 200, description: 'Recovery status updated' })
  async updatePatientStatus(
    @Param('patientId') patientId: string,
    @Body() body: { status: string; reason?: string },
  ) {
    const result = await this.recoveryService.updatePatientStatus(
      patientId,
      body.status,
      body.reason,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Get('patient/:patientId/screenings')
  @ApiOperation({
    summary: 'Get patient screenings',
    description: 'All addiction screenings for a specific patient.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Patient screenings returned' })
  async getPatientScreenings(
    @Param('patientId') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.recoveryService.getPatientScreenings(
      patientId,
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/crises')
  @ApiOperation({
    summary: 'Get patient crisis history',
    description: 'All crisis events for a specific patient.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Patient crises returned' })
  async getPatientCrises(
    @Param('patientId') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.recoveryService.getPatientCrises(
      patientId,
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ─── Withdrawal Assessments ───────────────────────────────────────

  @Get('withdrawal/overview')
  @ApiOperation({
    summary: 'Get withdrawal assessment overview',
    description:
      'Dashboard metrics for COWS and CIWA-Ar withdrawal assessments: totals, severity distribution, trends.',
  })
  @ApiResponse({ status: 200, description: 'Withdrawal overview returned' })
  async getWithdrawalOverview() {
    const result = await this.recoveryService.getWithdrawalOverview();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('withdrawal/assessments')
  @ApiOperation({
    summary: 'Get withdrawal assessments',
    description:
      'Paginated, filterable list of all COWS and CIWA-Ar withdrawal assessments.',
  })
  @ApiQuery({ name: 'instrument', required: false, description: 'Filter by scale: cows or ciwa_ar' })
  @ApiQuery({ name: 'risk_level', required: false, description: 'Filter by severity level' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Withdrawal assessments returned' })
  async getWithdrawalAssessments(
    @Query('instrument') instrument?: string,
    @Query('risk_level') risk_level?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.recoveryService.getWithdrawalAssessments({
      instrument,
      risk_level,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ─── G4: MAT & Reporting Endpoints ────────────────────────────────

  @Get('mat/compliance')
  @ApiOperation({
    summary: 'Get MAT compliance overview',
    description:
      'MAT adherence rates: check-in compliance, screening frequency, per-patient.',
  })
  @ApiResponse({ status: 200, description: 'MAT compliance returned' })
  async getMATCompliance() {
    const result = await this.recoveryService.getMATCompliance();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('mat/suspicious-activity')
  @ApiOperation({
    summary: 'Get suspicious activity logs',
    description:
      'Controlled substance monitoring: multi-specialist, multi-pharmacy, dose escalation.',
  })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity (low, medium, high, critical)' })
  @ApiQuery({ name: 'activity_type', required: false, description: 'Filter by activity type' })
  @ApiQuery({ name: 'reviewed', required: false, description: 'Filter by review status (true/false)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Suspicious activity logs returned' })
  async getSuspiciousActivity(
    @Query('severity') severity?: string,
    @Query('activity_type') activity_type?: string,
    @Query('reviewed') reviewed?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.recoveryService.getSuspiciousActivity({
      severity,
      activity_type,
      reviewed,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('mat/suspicious-activity/:id/review')
  @ApiOperation({
    summary: 'Review suspicious activity',
    description: 'Admin reviews and resolves a suspicious activity log entry.',
  })
  @ApiParam({ name: 'id', description: 'Suspicious activity log ID' })
  @ApiResponse({ status: 200, description: 'Activity reviewed' })
  async reviewSuspiciousActivity(
    @Param('id') id: string,
    @Body() body: { resolution: string },
    @Request() req,
  ) {
    const result = await this.recoveryService.reviewSuspiciousActivity(
      id,
      req.user.sub,
      body.resolution,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Get('outcomes')
  @ApiOperation({
    summary: 'Get recovery outcome metrics',
    description:
      'Aggregated outcome data for grant reporting: enrolment, substances, risk improvement, engagement.',
  })
  @ApiResponse({ status: 200, description: 'Outcome metrics returned' })
  async getOutcomeMetrics() {
    const result = await this.recoveryService.getOutcomeMetrics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('outcomes/export')
  @ApiOperation({
    summary: 'Export recovery outcomes',
    description: 'Export outcome data as CSV or JSON for external reporting.',
  })
  @ApiQuery({ name: 'format', required: false, description: 'Export format: json or csv', example: 'csv' })
  @ApiResponse({ status: 200, description: 'Outcomes exported' })
  async exportOutcomes(@Query('format') format?: string) {
    const exportFormat = format === 'csv' ? 'csv' : 'json';
    const result = await this.recoveryService.exportOutcomes(exportFormat);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ─── Patient Activity Report ───────────────────────────────────────

  @Get('patient/:patientId/report')
  @ApiOperation({
    summary: 'Get patient activity report',
    description:
      'Comprehensive report of all patient recovery activities and specialist activities for PDF generation.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient user ID' })
  @ApiResponse({ status: 200, description: 'Patient activity report returned' })
  async getPatientActivityReport(@Param('patientId') patientId: string) {
    const result =
      await this.recoveryService.getPatientActivityReport(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
