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
import { SpecialistPatientsService } from './specialist-patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { GetPatientsQueryDto } from './dto/get-patients-query.dto';
import { StarPatientDto } from './dto/star-patient.dto';
import { AccessType } from './entities/patient-access-log.entity';

@UseGuards(JwtAuthGuard)
@Controller('specialist/patients')
export class SpecialistPatientsController {
  constructor(
    private readonly specialistPatientsService: SpecialistPatientsService,
  ) {}

  /**
   * Get paginated list of patients for the specialist
   */
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
  @Get(':patientId/dependents')
  async getPatientDependents(@Param('patientId') patientId: string) {
    const result =
      await this.specialistPatientsService.getPatientDependents(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Star or unstar a patient
   */
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
