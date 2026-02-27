import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
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
import { TrialAdminService } from './trial-admin.service';
import { UpdateTrialSettingsDto } from './dto/update-trial-settings.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';

@ApiTags('Trial Management')
@ApiBearerAuth('JWT-auth')
@Controller('trial')
@UseGuards(JwtAuthGuard)
export class TrialAdminController {
  constructor(private readonly trialAdminService: TrialAdminService) {}

  // ============ SETTINGS ============

  @Get('settings')
  @ApiOperation({ summary: 'Get trial settings', description: 'Retrieve the current trial feature configuration including duration limits, allowed features, and Eka AI message caps.' })
  @ApiResponse({ status: 200, description: 'Trial settings retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getSettings() {
    const result = await this.trialAdminService.getSettings();
    return sendSuccessResponse('Trial settings retrieved', result);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update trial settings', description: 'Update the trial feature configuration such as session duration, message limits, allowed features, and whether trial mode is globally enabled.' })
  @ApiResponse({ status: 200, description: 'Trial settings updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async updateSettings(@Body() dto: UpdateTrialSettingsDto) {
    const result = await this.trialAdminService.updateSettings(dto);
    return sendSuccessResponse('Trial settings updated', result);
  }

  // ============ SESSIONS ============

  @Get('sessions')
  @ApiOperation({ summary: 'List trial sessions', description: 'Retrieve a paginated list of all trial sessions with optional filtering by search term, status, feature, and sort order.' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number for pagination', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Number of sessions per page', example: '20' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by session ID, patient name, or email', example: 'adaeze@example.com' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by session status (e.g. active, expired, completed)', example: 'active' })
  @ApiQuery({ name: 'feature', required: false, type: String, description: 'Filter by trial feature used (e.g. eka_chat, health_checkup)', example: 'eka_chat' })
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Sort field and direction (e.g. created_at:desc)', example: 'created_at:desc' })
  @ApiResponse({ status: 200, description: 'Trial sessions retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async listSessions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('feature') feature?: string,
    @Query('sort') sort?: string,
  ) {
    const result = await this.trialAdminService.listSessions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
      feature,
      sort,
    });
    return sendSuccessResponse('Trial sessions retrieved', result);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get trial session details', description: 'Retrieve full details for a specific trial session including usage metrics, feature access logs, and expiry information.' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the trial session', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Trial session details retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Trial session not found.' })
  async getSession(@Param('id') id: string) {
    const result = await this.trialAdminService.getSession(id);
    return sendSuccessResponse('Trial session retrieved', result);
  }

  @Patch('sessions/:id')
  @ApiOperation({ summary: 'Update trial session', description: 'Update a trial session by modifying its status, Eka message count, or extending the session duration by a given number of hours.' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the trial session', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string', description: 'New session status', example: 'active' }, eka_message_count: { type: 'number', description: 'Override the Eka AI message count', example: 25 }, extend_hours: { type: 'number', description: 'Number of hours to extend the session by', example: 24 } } } })
  @ApiResponse({ status: 200, description: 'Trial session updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Trial session not found.' })
  async updateSession(
    @Param('id') id: string,
    @Body() body: { status?: string; eka_message_count?: number; extend_hours?: number },
  ) {
    const result = await this.trialAdminService.updateSession(id, body);
    return sendSuccessResponse('Trial session updated', result);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete trial session', description: 'Permanently delete a trial session record from the system. This action cannot be undone.' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the trial session', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Trial session deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Trial session not found.' })
  async deleteSession(@Param('id') id: string) {
    const result = await this.trialAdminService.deleteSession(id);
    return sendSuccessResponse('Trial session deleted', result);
  }

  // ============ ANALYTICS ============

  @Get('analytics')
  @ApiOperation({ summary: 'Get trial analytics', description: 'Retrieve aggregate analytics for the trial system including total sessions, conversion rates, popular features, and usage trends.' })
  @ApiResponse({ status: 200, description: 'Trial analytics retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getAnalytics() {
    const result = await this.trialAdminService.getAnalytics();
    return sendSuccessResponse('Trial analytics retrieved', result);
  }
}
