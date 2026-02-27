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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes
} from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { DashboardService } from './dashboard.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { QueryIntervalDto } from '../patients/dto/query-interval.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('specialists')
  @ApiOperation({ summary: 'Get specialist analytics', description: 'Retrieves analytics data for all specialists on the platform including performance metrics and activity summaries.' })
  @ApiResponse({ status: 200, description: 'Specialist analytics retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getSpecialistAnalytics() {
    const result = await this.dashboardService.dashboardSpecialistAnalytics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patients')
  @ApiOperation({ summary: 'Get patient analytics', description: 'Retrieves analytics data for patients filtered by the specified query interval.' })
  @ApiResponse({ status: 200, description: 'Patient analytics retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getPatientAnalytics(@Body() queryIntervalDto: QueryIntervalDto) {
    const result = await this.dashboardService.dashboardPatientAnalytics(
      queryIntervalDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get comprehensive admin metrics', description: 'Retrieves comprehensive platform metrics including user counts, appointment statistics, revenue data, and system health indicators.' })
  @ApiResponse({ status: 200, description: 'Comprehensive metrics retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getComprehensiveMetrics() {
    const result = await this.dashboardService.getComprehensiveMetrics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get weekly trends', description: 'Retrieves weekly trend data for the specified date range. Defaults to the last 7 days if no dates are provided.' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date for the trend period (ISO 8601 format, e.g. 2025-01-01)', example: '2025-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date for the trend period (ISO 8601 format, e.g. 2025-01-07)', example: '2025-01-07' })
  @ApiResponse({ status: 200, description: 'Weekly trends retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getWeeklyTrends(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const result = await this.dashboardService.getWeeklyTrends(startDate, endDate);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('health-checkup-trends')
  @ApiOperation({ summary: 'Get health checkup trends', description: 'Retrieves trend data for health checkups including triage levels, condition distributions, and completion rates over the specified date range.' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date for the trend period (ISO 8601 format)', example: '2025-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date for the trend period (ISO 8601 format)', example: '2025-01-07' })
  @ApiResponse({ status: 200, description: 'Health checkup trends retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getHealthCheckupTrends(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const result = await this.dashboardService.getHealthCheckupTrends(startDate, endDate);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('recent-activities')
  @ApiOperation({ summary: 'Get recent activities', description: 'Retrieves a list of recent platform activities including logins, appointments, health checkups, and account changes.' })
  @ApiResponse({ status: 200, description: 'Recent activities retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getRecentActivities() {
    const result = await this.dashboardService.getRecentActivities();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/health-checkups')
  @ApiOperation({ summary: 'Get patient health checkups', description: 'Retrieves all health checkup records for a specific patient including symptoms, diagnoses, and triage levels.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient health checkups retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async getPatientHealthCheckups(@Param('patientId') patientId: string) {
    const result = await this.dashboardService.getPatientHealthCheckups(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('health-checkup/:checkupId')
  @ApiOperation({ summary: 'Get health checkup report', description: 'Retrieves the full detailed report for a specific health checkup including conditions, triage assessment, and specialist recommendations.' })
  @ApiParam({ name: 'checkupId', type: String, description: 'The MongoDB ObjectId of the health checkup', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'Health checkup report retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Health checkup not found.' })
  async getHealthCheckupReport(@Param('checkupId') checkupId: string) {
    const result = await this.dashboardService.getHealthCheckupReport(checkupId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/activity-timeline')
  @ApiOperation({ summary: 'Get patient activity timeline', description: 'Retrieves a chronological timeline of all patient interactions and activities on the platform.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient activity timeline retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async getPatientActivityTimeline(@Param('patientId') patientId: string) {
    const result = await this.dashboardService.getPatientActivityTimeline(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('patient/:patientId/suspend')
  @ApiOperation({ summary: 'Suspend patient account', description: 'Suspends a patient account with a specified reason. The patient will be unable to access the platform until reactivated.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: 'Violated terms of service' }, suspended_by: { type: 'string', example: '507f1f77bcf86cd799439011' } }, required: ['reason', 'suspended_by'] } })
  @ApiResponse({ status: 200, description: 'Patient account suspended successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async suspendPatient(
    @Param('patientId') patientId: string,
    @Body() suspendData: { reason: string; suspended_by: string }
  ) {
    const result = await this.dashboardService.suspendPatient(patientId, suspendData);
    return sendSuccessResponse('Patient account suspended successfully', result);
  }

  @Patch('patient/:patientId/deactivate')
  @ApiOperation({ summary: 'Deactivate patient account', description: 'Permanently deactivates a patient account with a specified reason. This action may require additional steps to reverse.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: 'Account closure requested by patient' }, deactivated_by: { type: 'string', example: '507f1f77bcf86cd799439011' } }, required: ['reason', 'deactivated_by'] } })
  @ApiResponse({ status: 200, description: 'Patient account deactivated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async deactivatePatient(
    @Param('patientId') patientId: string,
    @Body() deactivateData: { reason: string; deactivated_by: string }
  ) {
    const result = await this.dashboardService.deactivatePatient(patientId, deactivateData);
    return sendSuccessResponse('Patient account deactivated successfully', result);
  }

  @Get('patient/:patientId/vitals')
  @ApiOperation({ summary: 'Get patient vitals', description: 'Retrieves all recorded vital signs for a specific patient including blood pressure, heart rate, temperature, and other measurements.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient vitals retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async getPatientVitals(@Param('patientId') patientId: string) {
    const result = await this.dashboardService.getPatientVitals(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('patient/:patientId/status')
  @ApiOperation({ summary: 'Update patient status', description: 'Updates the account status of a patient. Supports Active, Suspended, Deactivated, and Pending statuses with optional user notification and temporary flag.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string', example: 'Suspended', enum: ['Active', 'Suspended', 'Deactivated', 'Pending'] }, reason: { type: 'string', example: 'Repeated policy violations' }, notify_user: { type: 'boolean', example: true }, temporary: { type: 'boolean', example: false }, admin_id: { type: 'string', example: '507f1f77bcf86cd799439011' } }, required: ['status', 'reason', 'admin_id'] } })
  @ApiResponse({ status: 200, description: 'Patient status updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
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
  @ApiOperation({ summary: 'Send password reset email', description: 'Triggers a password reset email to be sent to the specified patient. The action is logged with the admin ID for audit purposes.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { admin_id: { type: 'string', example: '507f1f77bcf86cd799439011' } }, required: ['admin_id'] } })
  @ApiResponse({ status: 201, description: 'Password reset email sent successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async sendPasswordReset(
    @Param('patientId') patientId: string,
    @Body() data: { admin_id: string }
  ) {
    const result = await this.dashboardService.sendPasswordReset(patientId, data.admin_id);
    return sendSuccessResponse('Password reset email sent successfully', result);
  }

  @Post('patient/:patientId/send-verification')
  @ApiOperation({ summary: 'Send verification email', description: 'Triggers a verification email to be sent to the specified patient. Used when a patient has not yet verified their email address.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { admin_id: { type: 'string', example: '507f1f77bcf86cd799439011' } }, required: ['admin_id'] } })
  @ApiResponse({ status: 201, description: 'Verification email sent successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async sendVerificationEmail(
    @Param('patientId') patientId: string,
    @Body() data: { admin_id: string }
  ) {
    const result = await this.dashboardService.sendVerificationEmail(patientId, data.admin_id);
    return sendSuccessResponse('Verification email sent successfully', result);
  }

  @Get('patient/:patientId/stats')
  @ApiOperation({ summary: 'Get patient account stats', description: 'Retrieves aggregated account statistics for a specific patient including appointment counts, health checkup history, and activity metrics.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient account stats retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async getPatientAccountStats(@Param('patientId') patientId: string) {
    const result = await this.dashboardService.getPatientAccountStats(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/clinical-notes')
  @ApiOperation({ summary: 'Get patient clinical notes', description: 'Retrieves all clinical notes recorded for a specific patient by specialists and the system.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient clinical notes retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async getPatientClinicalNotes(@Param('patientId') patientId: string) {
    const result = await this.dashboardService.getPatientClinicalNotes(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('patient/:patientId/update-profile')
  @ApiOperation({ summary: 'Update patient profile', description: 'Updates the profile information for a specific patient. Accepts any profile fields including name, contact details, medical history, and emergency contacts.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', description: 'Patient profile fields to update. Accepts any valid profile properties.', properties: { first_name: { type: 'string', example: 'John' }, last_name: { type: 'string', example: 'Doe' }, phone_number: { type: 'string', example: '+2348012345678' }, date_of_birth: { type: 'string', example: '1990-05-15' }, gender: { type: 'string', example: 'Male' } } } })
  @ApiResponse({ status: 200, description: 'Patient profile updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async updatePatientProfile(
    @Param('patientId') patientId: string,
    @Body() updateData: any
  ) {
    const result = await this.dashboardService.updatePatientProfile(patientId, updateData);
    return sendSuccessResponse('Patient profile updated successfully', result);
  }

  @Post('patient/:patientId/create-appointment')
  @ApiOperation({ summary: 'Create appointment for patient', description: 'Creates a new appointment on behalf of a patient. The admin can specify the specialist, date, time, and appointment type.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', description: 'Appointment details. Accepts any valid appointment properties.', properties: { specialist_id: { type: 'string', example: '507f1f77bcf86cd799439012' }, date: { type: 'string', example: '2025-06-15' }, time: { type: 'string', example: '10:00' }, type: { type: 'string', example: 'video_consultation' }, reason: { type: 'string', example: 'Follow-up consultation' } } } })
  @ApiResponse({ status: 201, description: 'Appointment created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async createAppointmentForPatient(
    @Param('patientId') patientId: string,
    @Body() appointmentData: any
  ) {
    const result = await this.dashboardService.createAppointmentForPatient(patientId, appointmentData);
    return sendSuccessResponse('Appointment created successfully', result);
  }

  @Get('specialists/active')
  @ApiOperation({ summary: 'Get active specialists', description: 'Retrieves a list of all currently active specialists on the platform, useful for appointment scheduling and admin oversight.' })
  @ApiResponse({ status: 200, description: 'Active specialists retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getActiveSpecialists() {
    const result = await this.dashboardService.getActiveSpecialists();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('patient/:patientId/send-message')
  @ApiOperation({ summary: 'Send message to patient', description: 'Sends a direct message to a specific patient from the admin panel. The message includes a subject line and is logged with the admin ID.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { subject: { type: 'string', example: 'Appointment Reminder' }, message: { type: 'string', example: 'Your upcoming appointment is scheduled for tomorrow at 10:00 AM.' }, admin_id: { type: 'string', example: '507f1f77bcf86cd799439011' } }, required: ['subject', 'message', 'admin_id'] } })
  @ApiResponse({ status: 201, description: 'Message sent to patient successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async sendMessageToPatient(
    @Param('patientId') patientId: string,
    @Body() messageData: { subject: string; message: string; admin_id: string }
  ) {
    const result = await this.dashboardService.sendMessageToPatient(patientId, messageData);
    return sendSuccessResponse('Message sent successfully', result);
  }

  @Get('patients/active')
  @ApiOperation({ summary: 'Get active patients', description: 'Retrieves a list of all currently active patients on the platform.' })
  @ApiResponse({ status: 200, description: 'Active patients retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getActivePatients() {
    const result = await this.dashboardService.getActivePatients();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('specialist/:specialistId/send-message')
  @ApiOperation({ summary: 'Send message to specialist', description: 'Sends a direct message to a specific specialist from the admin panel. The message includes a subject line and is logged with the admin ID.' })
  @ApiParam({ name: 'specialistId', type: String, description: 'The MongoDB ObjectId of the specialist', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ schema: { type: 'object', properties: { subject: { type: 'string', example: 'Schedule Update' }, message: { type: 'string', example: 'Please review your availability for next week.' }, admin_id: { type: 'string', example: '507f1f77bcf86cd799439011' } }, required: ['subject', 'message', 'admin_id'] } })
  @ApiResponse({ status: 201, description: 'Message sent to specialist successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Specialist not found.' })
  async sendMessageToSpecialist(
    @Param('specialistId') specialistId: string,
    @Body() messageData: { subject: string; message: string; admin_id: string }
  ) {
    const result = await this.dashboardService.sendMessageToSpecialist(specialistId, messageData);
    return sendSuccessResponse('Message sent successfully', result);
  }

  @Patch('specialist/:specialistId/suspend')
  @ApiOperation({ summary: 'Suspend specialist account', description: 'Suspends a specialist account with a specified reason. The specialist will be unable to access the platform or receive appointments until reactivated.' })
  @ApiParam({ name: 'specialistId', type: String, description: 'The MongoDB ObjectId of the specialist', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: 'Pending license verification' }, suspended_by: { type: 'string', example: '507f1f77bcf86cd799439011' } }, required: ['reason', 'suspended_by'] } })
  @ApiResponse({ status: 200, description: 'Specialist account suspended successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Specialist not found.' })
  async suspendSpecialist(
    @Param('specialistId') specialistId: string,
    @Body() suspendData: { reason: string; suspended_by: string }
  ) {
    const result = await this.dashboardService.suspendSpecialist(specialistId, suspendData);
    return sendSuccessResponse('Specialist account suspended successfully', result);
  }

  @Patch('specialist/:specialistId/deactivate')
  @ApiOperation({ summary: 'Deactivate specialist account', description: 'Permanently deactivates a specialist account with a specified reason. This removes the specialist from active scheduling.' })
  @ApiParam({ name: 'specialistId', type: String, description: 'The MongoDB ObjectId of the specialist', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: 'Specialist resigned from platform' }, deactivated_by: { type: 'string', example: '507f1f77bcf86cd799439011' } }, required: ['reason', 'deactivated_by'] } })
  @ApiResponse({ status: 200, description: 'Specialist account deactivated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Specialist not found.' })
  async deactivateSpecialist(
    @Param('specialistId') specialistId: string,
    @Body() deactivateData: { reason: string; deactivated_by: string }
  ) {
    const result = await this.dashboardService.deactivateSpecialist(specialistId, deactivateData);
    return sendSuccessResponse('Specialist account deactivated successfully', result);
  }

  @Patch('specialist/:specialistId/status')
  @ApiOperation({ summary: 'Update specialist status', description: 'Updates the account status of a specialist. Supports Active, Suspended, Deactivated, and Pending statuses with optional user notification and temporary flag.' })
  @ApiParam({ name: 'specialistId', type: String, description: 'The MongoDB ObjectId of the specialist', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string', example: 'Active', enum: ['Active', 'Suspended', 'Deactivated', 'Pending'] }, reason: { type: 'string', example: 'License verified successfully' }, notify_user: { type: 'boolean', example: true }, temporary: { type: 'boolean', example: false }, admin_id: { type: 'string', example: '507f1f77bcf86cd799439011' } }, required: ['status', 'reason', 'admin_id'] } })
  @ApiResponse({ status: 200, description: 'Specialist status updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Specialist not found.' })
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
  @ApiOperation({ summary: 'Update specialist profile', description: 'Updates the profile information for a specific specialist including support for file uploads such as profile images and certification documents.' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'specialistId', type: String, description: 'The MongoDB ObjectId of the specialist', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ schema: { type: 'object', description: 'Specialist profile fields to update. Supports multipart/form-data for file uploads.', properties: { first_name: { type: 'string', example: 'Dr. Jane' }, last_name: { type: 'string', example: 'Smith' }, specialization: { type: 'string', example: 'Cardiology' }, phone_number: { type: 'string', example: '+2348012345678' }, profile_image: { type: 'string', format: 'binary', description: 'Profile image file' }, certification: { type: 'string', format: 'binary', description: 'Certification document file' } } } })
  @ApiResponse({ status: 200, description: 'Specialist profile updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Specialist not found.' })
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
  @ApiOperation({ summary: 'Create appointment for specialist', description: 'Creates a new appointment on behalf of a specialist. The admin can specify the patient, date, time, and appointment type.' })
  @ApiParam({ name: 'specialistId', type: String, description: 'The MongoDB ObjectId of the specialist', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ schema: { type: 'object', description: 'Appointment details. Accepts any valid appointment properties.', properties: { patient_id: { type: 'string', example: '507f1f77bcf86cd799439011' }, date: { type: 'string', example: '2025-06-15' }, time: { type: 'string', example: '14:00' }, type: { type: 'string', example: 'video_consultation' }, reason: { type: 'string', example: 'Initial consultation' } } } })
  @ApiResponse({ status: 201, description: 'Appointment created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Specialist not found.' })
  async createAppointmentForSpecialist(
    @Param('specialistId') specialistId: string,
    @Body() appointmentData: any
  ) {
    const result = await this.dashboardService.createAppointmentForSpecialist(specialistId, appointmentData);
    return sendSuccessResponse('Appointment created successfully', result);
  }

  @Get('specialist/:specialistId/appointments')
  @ApiOperation({ summary: 'Get specialist appointments', description: 'Retrieves appointments for a specific specialist with optional filtering by status and date range.' })
  @ApiParam({ name: 'specialistId', type: String, description: 'The MongoDB ObjectId of the specialist', example: '507f1f77bcf86cd799439012' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by appointment status (e.g. scheduled, completed, cancelled)', example: 'scheduled' })
  @ApiQuery({ name: 'from_date', required: false, type: String, description: 'Filter appointments from this date onwards (ISO 8601 format)', example: '2025-06-01' })
  @ApiResponse({ status: 200, description: 'Specialist appointments retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Specialist not found.' })
  async getSpecialistAppointments(
    @Param('specialistId') specialistId: string,
    @Query('status') status?: string,
    @Query('from_date') fromDate?: string
  ) {
    const result = await this.dashboardService.getSpecialistAppointments(specialistId, status, fromDate);
    return sendSuccessResponse('Specialist appointments retrieved', result);
  }

  @Patch('patient/:patientId/claude-health-summary')
  @ApiOperation({ summary: 'Toggle Claude AI health summary', description: 'Enables or disables the Claude AI-powered health summary feature for a specific patient. When enabled, AI-generated health insights will be available on the patient profile.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { enabled: { type: 'boolean', example: true, description: 'Whether to enable or disable the Claude health summary' }, admin_id: { type: 'string', example: '507f1f77bcf86cd799439011', description: 'The admin performing this action' } }, required: ['enabled', 'admin_id'] } })
  @ApiResponse({ status: 200, description: 'Claude AI Health Summary toggled successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
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
  @ApiOperation({ summary: 'Get Claude AI health summary status', description: 'Retrieves the current status of the Claude AI health summary feature for a specific patient, including whether it is enabled and the last generation timestamp.' })
  @ApiParam({ name: 'patientId', type: String, description: 'The MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Claude Health Summary status retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Patient not found.' })
  async getClaudeHealthSummaryStatus(
    @Param('patientId') patientId: string
  ) {
    const result = await this.dashboardService.getClaudeHealthSummaryStatus(patientId);
    return sendSuccessResponse('Claude Health Summary status retrieved', result);
  }
}
