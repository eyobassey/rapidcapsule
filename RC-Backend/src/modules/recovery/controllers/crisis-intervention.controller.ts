import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CrisisInterventionService } from '../services/crisis-intervention.service';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';
import { CrisisType, CrisisSeverity } from '../entities/crisis-event.entity';

@ApiTags('Recovery - Crisis Intervention')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/crisis')
export class CrisisInterventionController {
  constructor(
    private readonly crisisService: CrisisInterventionService,
  ) {}

  @ApiOperation({
    summary: 'Trigger emergency alert (panic button)',
    description:
      'Patient-initiated emergency crisis button. Immediately creates a crisis event, alerts all care team members and emergency contacts.',
  })
  @ApiResponse({ status: 201, description: 'Emergency alert triggered' })
  @Post('emergency')
  async triggerEmergency(
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    const result = await this.crisisService.triggerEmergencyAlert(
      req.user.sub,
      body.reason,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Initiate a crisis event',
    description:
      'Creates a new crisis event for a patient. Can be initiated by specialist, system, or companion AI.',
  })
  @ApiResponse({ status: 201, description: 'Crisis event created' })
  @Post()
  async initiate(
    @Body()
    body: {
      patient_id: string;
      crisis_type: CrisisType;
      trigger_source: string;
      detection_data?: Record<string, any>;
      severity?: CrisisSeverity;
    },
    @Request() req,
  ) {
    const result = await this.crisisService.initiateCrisis(
      body.patient_id,
      body.crisis_type,
      body.trigger_source,
      body.detection_data,
      body.severity,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Respond to a crisis event',
    description:
      'Specialist acknowledges a crisis event and marks it as being responded to.',
  })
  @ApiParam({ name: 'id', description: 'Crisis event ID' })
  @ApiResponse({ status: 200, description: 'Crisis response acknowledged' })
  @Post(':id/respond')
  async respond(@Param('id') id: string, @Request() req) {
    const result = await this.crisisService.respondToCrisis(id, req.user.sub);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Resolve a crisis event',
    description:
      'Marks a crisis as resolved with resolution notes and optional follow-up plan.',
  })
  @ApiParam({ name: 'id', description: 'Crisis event ID' })
  @ApiResponse({ status: 200, description: 'Crisis resolved' })
  @Post(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @Body() body: { notes: string; follow_up_plan?: string },
    @Request() req,
  ) {
    const result = await this.crisisService.resolveCrisis(
      id,
      req.user.sub,
      body.notes,
      body.follow_up_plan,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Escalate a crisis event',
    description:
      'Escalates a crisis to all care team members, admin, and emergency contacts.',
  })
  @ApiParam({ name: 'id', description: 'Crisis event ID' })
  @ApiResponse({ status: 200, description: 'Crisis escalated' })
  @Post(':id/escalate')
  async escalate(@Param('id') id: string, @Request() req) {
    const result = await this.crisisService.escalateCrisis(id, req.user.sub);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Get crisis event by ID',
    description: 'Returns full details of a crisis event including response timeline.',
  })
  @ApiParam({ name: 'id', description: 'Crisis event ID' })
  @ApiResponse({ status: 200, description: 'Crisis event returned' })
  @ApiResponse({ status: 404, description: 'Crisis event not found' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.crisisService.getCrisisById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get active crises for specialist',
    description:
      "Returns all active/responding/escalated crises for the specialist's patients.",
  })
  @ApiResponse({ status: 200, description: 'Active crises returned' })
  @Get('specialist/active')
  async getActiveCrises(@Request() req) {
    const result = await this.crisisService.getActiveCrises(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get my crisis history',
    description: 'Returns paginated crisis event history for the authenticated patient.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Crisis history returned' })
  @Get('patient/history')
  async getMyHistory(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    const result = await this.crisisService.getCrisisHistory(
      req.user.sub,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get patient crisis history (specialist view)',
    description: 'Returns paginated crisis history for a specific patient.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Patient crisis history returned' })
  @Get('patient/:patientId/history')
  async getPatientHistory(
    @Param('patientId') patientId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const result = await this.crisisService.getCrisisHistory(
      patientId,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
