import {
  Controller,
  Post,
  Get,
  Patch,
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
import { RecoveryPlanService } from '../services/recovery-plan.service';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';
import { StageStatus } from '../entities/recovery-plan.entity';

@ApiTags('Recovery - Plans')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/plans')
export class RecoveryPlanController {
  constructor(private readonly planService: RecoveryPlanService) {}

  @ApiOperation({
    summary: 'Create a recovery plan',
    description:
      'Creates a new recovery plan for the authenticated patient. Only one active plan is allowed at a time.',
  })
  @ApiResponse({ status: 201, description: 'Recovery plan created' })
  @ApiResponse({ status: 400, description: 'Active plan already exists' })
  @Post()
  async create(@Body() dto: any, @Request() req) {
    const result = await this.planService.create(dto, req.user.sub);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Create a plan for a patient (specialist)',
    description:
      'Allows a specialist to create a recovery plan on behalf of a patient.',
  })
  @ApiResponse({ status: 201, description: 'Recovery plan created for patient' })
  @Post('for-patient')
  async createForPatient(
    @Body() dto: any & { patient_id: string },
    @Request() req,
  ) {
    const result = await this.planService.create(
      dto,
      dto.patient_id,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Generate an AI-powered recovery plan',
    description:
      'Uses Claude AI to analyse patient recovery data and generate a comprehensive, editable recovery plan. Consumes 1 AI credit.',
  })
  @ApiResponse({ status: 200, description: 'AI plan generated successfully' })
  @ApiResponse({ status: 400, description: 'No AI credits or service unavailable' })
  @Post('generate-ai')
  async generateAIPlan(
    @Body() body: { patient_id: string },
    @Request() req,
  ) {
    const result = await this.planService.generateAIPlan(
      body.patient_id,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get active recovery plan',
    description:
      'Returns the active recovery plan with computed progress metrics (stage completion, goal tracking).',
  })
  @ApiResponse({ status: 200, description: 'Active plan with progress returned' })
  @ApiResponse({ status: 404, description: 'No active plan found' })
  @Get('active')
  async getActivePlan(@Request() req) {
    const result = await this.planService.getActivePlan(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get plan history',
    description: 'Returns all recovery plans (active, completed, abandoned) for the authenticated user.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Plan history returned' })
  @Get('history')
  async getPlanHistory(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    const result = await this.planService.getPlanHistory(
      req.user.sub,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Activate a draft plan',
    description: 'Transitions a draft plan to active status and starts the first stage.',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan activated' })
  @Post(':id/activate')
  async activate(@Param('id') id: string, @Request() req) {
    const result = await this.planService.activate(req.user.sub, id);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Abandon a plan',
    description: 'Marks a draft or active plan as abandoned.',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan abandoned' })
  @Post(':id/abandon')
  async abandon(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    const result = await this.planService.abandon(req.user.sub, id, body.reason);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Update stage status',
    description: 'Updates the status of a stage within the active plan (e.g. start, complete, skip).',
  })
  @ApiParam({ name: 'stageId', description: 'Stage ID within the plan' })
  @ApiResponse({ status: 200, description: 'Stage status updated' })
  @Patch('stages/:stageId/status')
  async updateStageStatus(
    @Param('stageId') stageId: string,
    @Body() body: { status: StageStatus },
    @Request() req,
  ) {
    const result = await this.planService.updateStageStatus(
      req.user.sub,
      stageId,
      body.status,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Update goal status',
    description: 'Tracks progress on a specific goal within a stage. Optionally include evidence of completion.',
  })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  @ApiParam({ name: 'goalId', description: 'Goal ID' })
  @ApiResponse({ status: 200, description: 'Goal status updated' })
  @Patch('stages/:stageId/goals/:goalId')
  async updateGoalStatus(
    @Param('stageId') stageId: string,
    @Param('goalId') goalId: string,
    @Body() body: { status: StageStatus; evidence?: string },
    @Request() req,
  ) {
    const result = await this.planService.updateGoalStatus(
      req.user.sub,
      stageId,
      goalId,
      body.status,
      body.evidence,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Schedule a plan review',
    description: 'Sets or updates the next review date for a recovery plan.',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Review date scheduled' })
  @Post(':id/schedule-review')
  async scheduleReview(
    @Param('id') id: string,
    @Body() body: { review_date: string },
    @Request() req,
  ) {
    const result = await this.planService.scheduleReview(
      req.user.sub,
      id,
      new Date(body.review_date),
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
