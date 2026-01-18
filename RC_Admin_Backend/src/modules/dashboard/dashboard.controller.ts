import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles
} from "@nestjs/common";
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { DashboardService } from './dashboard.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { QueryIntervalDto } from '../patients/dto/query-interval.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('specialists')
  async getSpecialistAnalytics() {
    const result = await this.dashboardService.dashboardSpecialistAnalytics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patients')
  async getPatientAnalytics(@Body() queryIntervalDto: QueryIntervalDto) {
    const result = await this.dashboardService.dashboardPatientAnalytics(
      queryIntervalDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('metrics')
  async getComprehensiveMetrics() {
    const result = await this.dashboardService.getComprehensiveMetrics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('trends')
  async getWeeklyTrends(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const result = await this.dashboardService.getWeeklyTrends(startDate, endDate);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('health-checkup-trends')
  async getHealthCheckupTrends(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const result = await this.dashboardService.getHealthCheckupTrends(startDate, endDate);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('recent-activities')
  async getRecentActivities() {
    const result = await this.dashboardService.getRecentActivities();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/health-checkups')
  async getPatientHealthCheckups(@Param('patientId') patientId: string) {
    const result = await this.dashboardService.getPatientHealthCheckups(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('health-checkup/:checkupId')
  async getHealthCheckupReport(@Param('checkupId') checkupId: string) {
    const result = await this.dashboardService.getHealthCheckupReport(checkupId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/activity-timeline')
  async getPatientActivityTimeline(@Param('patientId') patientId: string) {
    const result = await this.dashboardService.getPatientActivityTimeline(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('patient/:patientId/suspend')
  async suspendPatient(
    @Param('patientId') patientId: string,
    @Body() suspendData: { reason: string; suspended_by: string }
  ) {
    const result = await this.dashboardService.suspendPatient(patientId, suspendData);
    return sendSuccessResponse('Patient account suspended successfully', result);
  }

  @Patch('patient/:patientId/deactivate')
  async deactivatePatient(
    @Param('patientId') patientId: string,
    @Body() deactivateData: { reason: string; deactivated_by: string }
  ) {
    const result = await this.dashboardService.deactivatePatient(patientId, deactivateData);
    return sendSuccessResponse('Patient account deactivated successfully', result);
  }

  @Get('patient/:patientId/vitals')
  async getPatientVitals(@Param('patientId') patientId: string) {
    const result = await this.dashboardService.getPatientVitals(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('patient/:patientId/status')
  async updatePatientStatus(
    @Param('patientId') patientId: string,
    @Body() statusData: { 
      status: string; 
      reason: string; 
      notify_user: boolean; 
      temporary: boolean; 
      admin_id: string 
    }
  ) {
    const result = await this.dashboardService.updatePatientStatus(patientId, statusData);
    return sendSuccessResponse('Patient status updated successfully', result);
  }

  @Post('patient/:patientId/reset-password')
  async sendPasswordReset(
    @Param('patientId') patientId: string,
    @Body() data: { admin_id: string }
  ) {
    const result = await this.dashboardService.sendPasswordReset(patientId, data.admin_id);
    return sendSuccessResponse('Password reset email sent successfully', result);
  }

  @Post('patient/:patientId/send-verification')
  async sendVerificationEmail(
    @Param('patientId') patientId: string,
    @Body() data: { admin_id: string }
  ) {
    const result = await this.dashboardService.sendVerificationEmail(patientId, data.admin_id);
    return sendSuccessResponse('Verification email sent successfully', result);
  }

  @Get('patient/:patientId/stats')
  async getPatientAccountStats(@Param('patientId') patientId: string) {
    const result = await this.dashboardService.getPatientAccountStats(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/clinical-notes')
  async getPatientClinicalNotes(@Param('patientId') patientId: string) {
    const result = await this.dashboardService.getPatientClinicalNotes(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('patient/:patientId/update-profile')
  async updatePatientProfile(
    @Param('patientId') patientId: string,
    @Body() updateData: any
  ) {
    const result = await this.dashboardService.updatePatientProfile(patientId, updateData);
    return sendSuccessResponse('Patient profile updated successfully', result);
  }

  @Post('patient/:patientId/create-appointment')
  async createAppointmentForPatient(
    @Param('patientId') patientId: string,
    @Body() appointmentData: any
  ) {
    const result = await this.dashboardService.createAppointmentForPatient(patientId, appointmentData);
    return sendSuccessResponse('Appointment created successfully', result);
  }

  @Get('specialists/active')
  async getActiveSpecialists() {
    const result = await this.dashboardService.getActiveSpecialists();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('patient/:patientId/send-message')
  async sendMessageToPatient(
    @Param('patientId') patientId: string,
    @Body() messageData: { subject: string; message: string; admin_id: string }
  ) {
    const result = await this.dashboardService.sendMessageToPatient(patientId, messageData);
    return sendSuccessResponse('Message sent successfully', result);
  }

  @Get('patients/active')
  async getActivePatients() {
    const result = await this.dashboardService.getActivePatients();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('specialist/:specialistId/send-message')
  async sendMessageToSpecialist(
    @Param('specialistId') specialistId: string,
    @Body() messageData: { subject: string; message: string; admin_id: string }
  ) {
    const result = await this.dashboardService.sendMessageToSpecialist(specialistId, messageData);
    return sendSuccessResponse('Message sent successfully', result);
  }

  @Patch('specialist/:specialistId/suspend')
  async suspendSpecialist(
    @Param('specialistId') specialistId: string,
    @Body() suspendData: { reason: string; suspended_by: string }
  ) {
    const result = await this.dashboardService.suspendSpecialist(specialistId, suspendData);
    return sendSuccessResponse('Specialist account suspended successfully', result);
  }

  @Patch('specialist/:specialistId/deactivate')
  async deactivateSpecialist(
    @Param('specialistId') specialistId: string,
    @Body() deactivateData: { reason: string; deactivated_by: string }
  ) {
    const result = await this.dashboardService.deactivateSpecialist(specialistId, deactivateData);
    return sendSuccessResponse('Specialist account deactivated successfully', result);
  }

  @Patch('specialist/:specialistId/status')
  async updateSpecialistStatus(
    @Param('specialistId') specialistId: string,
    @Body() statusData: {
      status: string;
      reason: string;
      notify_user: boolean;
      temporary: boolean;
      admin_id: string
    }
  ) {
    const result = await this.dashboardService.updateSpecialistStatus(specialistId, statusData);
    return sendSuccessResponse('Specialist status updated successfully', result);
  }

  @Patch('specialist/:specialistId/update-profile')
  @UseInterceptors(AnyFilesInterceptor())
  async updateSpecialistProfile(
    @Param('specialistId') specialistId: string,
    @Body() updateData: any,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    console.log('Controller received updateData:', JSON.stringify(updateData, null, 2));
    console.log('Controller received files:', files?.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, size: f.size })));
    const result = await this.dashboardService.updateSpecialistProfile(specialistId, updateData, files);
    return sendSuccessResponse('Specialist profile updated successfully', result);
  }

  @Post('specialist/:specialistId/create-appointment')
  async createAppointmentForSpecialist(
    @Param('specialistId') specialistId: string,
    @Body() appointmentData: any
  ) {
    const result = await this.dashboardService.createAppointmentForSpecialist(specialistId, appointmentData);
    return sendSuccessResponse('Appointment created successfully', result);
  }

  @Get('specialist/:specialistId/appointments')
  async getSpecialistAppointments(
    @Param('specialistId') specialistId: string,
    @Query('status') status?: string,
    @Query('from_date') fromDate?: string
  ) {
    const result = await this.dashboardService.getSpecialistAppointments(specialistId, status, fromDate);
    return sendSuccessResponse('Specialist appointments retrieved', result);
  }

  @Patch('patient/:patientId/claude-health-summary')
  async toggleClaudeHealthSummary(
    @Param('patientId') patientId: string,
    @Body() toggleData: { enabled: boolean; admin_id: string }
  ) {
    const result = await this.dashboardService.toggleClaudeHealthSummary(
      patientId,
      toggleData.enabled,
      toggleData.admin_id
    );
    return sendSuccessResponse(
      `Claude AI Health Summary ${toggleData.enabled ? 'enabled' : 'disabled'} successfully`,
      result
    );
  }

  @Get('patient/:patientId/claude-health-summary-status')
  async getClaudeHealthSummaryStatus(
    @Param('patientId') patientId: string
  ) {
    const result = await this.dashboardService.getClaudeHealthSummaryStatus(patientId);
    return sendSuccessResponse('Claude Health Summary status retrieved', result);
  }
}
