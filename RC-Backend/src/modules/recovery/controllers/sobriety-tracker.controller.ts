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
import { SobrietyTrackerService } from '../services/sobriety-tracker.service';
import { LogSobrietyDto } from '../dto/log-sobriety.dto';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';

@ApiTags('Recovery - Sobriety Tracker')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/sobriety')
export class SobrietyTrackerController {
  constructor(
    private readonly sobrietyService: SobrietyTrackerService,
  ) {}

  @ApiOperation({
    summary: 'Log daily sobriety check-in',
    description:
      'Records the patient\'s daily sobriety check-in including mood, cravings, sleep quality, triggers, coping strategies used, and optional relapse details. This is the core daily tracking mechanism for the recovery programme.',
  })
  @ApiResponse({ status: 201, description: 'Daily sobriety log recorded successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate log for the date' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Post('log')
  async logDaily(@Body() dto: LogSobrietyDto, @Request() req) {
    const result = await this.sobrietyService.logDaily(dto, req.user.sub);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Get sobriety logs',
    description:
      'Retrieves the patient\'s sobriety log entries, optionally filtered by date range. Returns logs ordered by date descending.',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    description: 'ISO 8601 start date to filter logs from',
    example: '2026-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    description: 'ISO 8601 end date to filter logs until',
    example: '2026-02-28T23:59:59.000Z',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of logs to return (default: 30)',
    example: '30',
  })
  @ApiResponse({ status: 200, description: 'Sobriety logs returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get('logs')
  async getLogs(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    const result = await this.sobrietyService.getLogs(
      req.user.sub,
      startDate,
      endDate,
      limit ? parseInt(limit) : 30,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get chart data for a sobriety metric',
    description:
      'Returns time-series data points for a specific metric (e.g. mood_score, craving_intensity, sleep_quality) over a configurable number of days. Designed for rendering line or bar charts in the frontend.',
  })
  @ApiQuery({
    name: 'metric',
    required: false,
    description: 'The metric to chart (default: mood_score). Available: mood_score, craving_intensity, energy_level, sleep_quality, sleep_hours, anxiety_level',
    example: 'mood_score',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to look back (default: 30)',
    example: '30',
  })
  @ApiResponse({ status: 200, description: 'Chart data points returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get('chart')
  async getChartData(
    @Query('metric') metric: string,
    @Query('days') days: string,
    @Request() req,
  ) {
    const result = await this.sobrietyService.getChartData(
      req.user.sub,
      metric || 'mood_score',
      days ? parseInt(days) : 30,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get sobriety statistics',
    description:
      'Returns aggregated sobriety statistics including current streak, longest streak, total sober days, total relapse count, average mood, and average craving intensity.',
  })
  @ApiResponse({ status: 200, description: 'Sobriety statistics returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get('stats')
  async getSobrietyStats(@Request() req) {
    const result = await this.sobrietyService.getSobrietyStats(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get sobriety milestones',
    description:
      'Retrieves the patient\'s sobriety milestones (e.g. 1 day, 1 week, 30 days, 90 days, 1 year) with achieved status, dates, and celebration flags.',
  })
  @ApiResponse({ status: 200, description: 'List of milestones returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get('milestones')
  async getMilestones(@Request() req) {
    const result = await this.sobrietyService.getMilestones(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Celebrate a milestone',
    description:
      'Marks a specific sobriety milestone as celebrated by the patient. This is a one-time action that records the celebration timestamp.',
  })
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the milestone to celebrate',
    example: '663f961ebb4dc1fec5426abc',
  })
  @ApiResponse({ status: 200, description: 'Milestone marked as celebrated' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Patch('milestones/:id/celebrate')
  async celebrateMilestone(@Param('id') id: string, @Request() req) {
    const result = await this.sobrietyService.celebrateMilestone(
      id,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
