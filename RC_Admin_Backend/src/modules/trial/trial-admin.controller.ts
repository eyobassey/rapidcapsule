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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
  async getSettings() {
    const result = await this.trialAdminService.getSettings();
    return sendSuccessResponse('Trial settings retrieved', result);
  }

  @Patch('settings')
  async updateSettings(@Body() dto: UpdateTrialSettingsDto) {
    const result = await this.trialAdminService.updateSettings(dto);
    return sendSuccessResponse('Trial settings updated', result);
  }

  // ============ SESSIONS ============

  @Get('sessions')
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
  async getSession(@Param('id') id: string) {
    const result = await this.trialAdminService.getSession(id);
    return sendSuccessResponse('Trial session retrieved', result);
  }

  @Patch('sessions/:id')
  async updateSession(
    @Param('id') id: string,
    @Body() body: { status?: string; eka_message_count?: number; extend_hours?: number },
  ) {
    const result = await this.trialAdminService.updateSession(id, body);
    return sendSuccessResponse('Trial session updated', result);
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string) {
    const result = await this.trialAdminService.deleteSession(id);
    return sendSuccessResponse('Trial session deleted', result);
  }

  // ============ ANALYTICS ============

  @Get('analytics')
  async getAnalytics() {
    const result = await this.trialAdminService.getAnalytics();
    return sendSuccessResponse('Trial analytics retrieved', result);
  }
}
