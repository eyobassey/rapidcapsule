import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SpecialistPatientsService } from './specialist-patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { GetPatientsQueryDto } from './dto/get-patients-query.dto';
import { StarPatientDto } from './dto/star-patient.dto';
import { AccessType } from './entities/patient-access-log.entity';

@ApiTags('Specialist Patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('specialist/patients')
export class SpecialistPatientsController {
  constructor(
    private readonly specialistPatientsService: SpecialistPatientsService,
  ) {}

  /**
   * Get paginated list of patients for the specialist
   */
  @ApiOperation({ summary: 'Get patients', description: 'Retrieve paginated list of patients for the specialist with search, filter, and sort options' })
  @ApiResponse({ status: 200, description: 'Patient list returned' })
  @Get()
  async getPatients(@Request() req, @Query() query: GetPatientsQueryDto) {
    const result = await this.specialistPatientsService.getPatients(
      req.user.sub,
      query,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient statistics for the specialist
   */
  @ApiOperation({ summary: 'Get patient statistics', description: 'Retrieve aggregate patient statistics including total patients, recent visits, and starred counts' })
  @ApiResponse({ status: 200, description: 'Patient statistics returned' })
  @Get('stats')
  async getPatientStats(@Request() req) {
    const result = await this.specialistPatientsService.getPatientStats(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get starred patients
   */
  @ApiOperation({ summary: 'Get starred patients', description: 'Retrieve patients that the specialist has starred for quick access' })
  @ApiResponse({ status: 200, description: 'Starred patients returned' })
  @Get('starred')
  async getStarredPatients(@Request() req) {
    const query: GetPatientsQueryDto = { filter: 'starred' as any };
    const result = await this.specialistPatientsService.getPatients(
      req.user.sub,
      query,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get detailed patient information
   */
  @ApiOperation({ summary: 'Get patient details', description: 'Retrieve detailed patient profile, medical history, and relationship data. Logs access for non-related patients.' })
  @ApiResponse({ status: 200, description: 'Patient details returned' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @Get(':patientId')
  async getPatientDetails(
    @Param('patientId') patientId: string,
    @Request() req,
  ) {
    // Log access if not own patient
    const hasRelationship =
      await this.specialistPatientsService.checkPatientRelationship(
        req.user.sub,
        patientId,
      );

    if (!hasRelationship) {
      await this.specialistPatientsService.logPatientAccess(
        req.user.sub,
        patientId,
        AccessType.VIEW_PROFILE,
        req.ip,
        req.headers['user-agent'],
      );
    }

    const result = await this.specialistPatientsService.getPatientDetails(
      patientId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient overview for dashboard
   */
  @ApiOperation({ summary: 'Get patient overview', description: 'Retrieve a compact patient overview for the specialist dashboard including recent activity and key health metrics' })
  @ApiResponse({ status: 200, description: 'Patient overview returned' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @Get(':patientId/overview')
  async getPatientOverview(
    @Param('patientId') patientId: string,
    @Request() req,
  ) {
    const result = await this.specialistPatientsService.getPatientOverview(
      patientId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient health records
   */
  @ApiOperation({ summary: 'Get patient health records', description: 'Retrieve paginated health checkup records for a patient. Logs access for audit.' })
  @ApiResponse({ status: 200, description: 'Health records returned' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  @Get(':patientId/health-records')
  async getPatientHealthRecords(
    @Param('patientId') patientId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Request() req,
  ) {
    // Log access for health records
    const hasRelationship =
      await this.specialistPatientsService.checkPatientRelationship(
        req.user.sub,
        patientId,
      );

    if (!hasRelationship) {
      await this.specialistPatientsService.logPatientAccess(
        req.user.sub,
        patientId,
        AccessType.VIEW_HEALTH_RECORDS,
        req.ip,
        req.headers['user-agent'],
      );
    }

    const result = await this.specialistPatientsService.getPatientHealthRecords(
      patientId,
      parseInt(page),
      parseInt(limit),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient prescriptions
   */
  @ApiOperation({ summary: 'Get patient prescriptions', description: 'Retrieve patient prescriptions filtered by type (all, written by specialist, or uploaded)' })
  @ApiResponse({ status: 200, description: 'Prescriptions returned' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'type', required: false, enum: ['all', 'written', 'uploaded'], example: 'all' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  @Get(':patientId/prescriptions')
  async getPatientPrescriptions(
    @Param('patientId') patientId: string,
    @Query('type') type: 'all' | 'written' | 'uploaded' = 'all',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Request() req,
  ) {
    const result = await this.specialistPatientsService.getPatientPrescriptions(
      patientId,
      req.user.sub,
      type,
      parseInt(page),
      parseInt(limit),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient appointments with this specialist
   */
  @ApiOperation({ summary: 'Get patient appointments', description: 'Retrieve appointment history between the specialist and patient with status filtering' })
  @ApiResponse({ status: 200, description: 'Appointments returned' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by appointment status', example: 'completed' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  @Get(':patientId/appointments')
  async getPatientAppointments(
    @Param('patientId') patientId: string,
    @Query('status') status: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Request() req,
  ) {
    const result = await this.specialistPatientsService.getPatientAppointments(
      patientId,
      req.user.sub,
      status,
      parseInt(page),
      parseInt(limit),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient pharmacy orders/purchases
   */
  @ApiOperation({ summary: 'Get patient purchases', description: 'Retrieve pharmacy orders and purchases for a patient' })
  @ApiResponse({ status: 200, description: 'Purchases returned' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  @Get(':patientId/purchases')
  async getPatientPurchases(
    @Param('patientId') patientId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const result = await this.specialistPatientsService.getPatientPurchases(
      patientId,
      parseInt(page),
      parseInt(limit),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient activity timeline
   */
  @ApiOperation({ summary: 'Get patient timeline', description: 'Retrieve chronological activity timeline for a patient including appointments, prescriptions, and health events' })
  @ApiResponse({ status: 200, description: 'Timeline returned' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '20' })
  @Get(':patientId/timeline')
  async getPatientTimeline(
    @Param('patientId') patientId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ) {
    const result = await this.specialistPatientsService.getPatientTimeline(
      patientId,
      req.user.sub,
      parseInt(page),
      parseInt(limit),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient dependents
   */
  @ApiOperation({ summary: 'Get patient dependents', description: 'Retrieve family members or dependents registered under the patient account' })
  @ApiResponse({ status: 200, description: 'Dependents returned' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @Get(':patientId/dependents')
  async getPatientDependents(@Param('patientId') patientId: string) {
    const result =
      await this.specialistPatientsService.getPatientDependents(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Star or unstar a patient
   */
  @ApiOperation({ summary: 'Toggle star patient', description: 'Star or unstar a patient for quick access, optionally adding notes and categories' })
  @ApiResponse({ status: 200, description: 'Patient star status updated' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @Post(':patientId/star')
  async toggleStarPatient(
    @Param('patientId') patientId: string,
    @Body() dto: StarPatientDto,
    @Request() req,
  ) {
    const result = await this.specialistPatientsService.toggleStarPatient(
      patientId,
      req.user.sub,
      dto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
