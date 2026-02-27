import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HealthIntegrationsAdminService } from './health-integrations-admin.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin Health Integrations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('health-integrations')
export class HealthIntegrationsAdminController {
  constructor(
    private readonly healthIntegrationsAdminService: HealthIntegrationsAdminService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get integration overview', description: 'Retrieve platform-wide health integration statistics and connected device counts' })
  @ApiResponse({ status: 200, description: 'Integration overview stats returned' })
  async getOverviewStats() {
    const result = await this.healthIntegrationsAdminService.getOverviewStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get patient integrations', description: 'Retrieve all connected health integrations for a specific patient' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient integrations returned' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async getPatientIntegrations(@Param('patientId') patientId: string) {
    const result = await this.healthIntegrationsAdminService.getPatientIntegrations(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/sync-logs')
  @ApiOperation({ summary: 'Get patient sync logs', description: 'Retrieve health data synchronisation logs for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of logs to return', example: 50 })
  @ApiResponse({ status: 200, description: 'Sync logs returned' })
  async getPatientSyncLogs(
    @Param('patientId') patientId: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.healthIntegrationsAdminService.getPatientSyncLogs(
      patientId,
      limit || 50,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Delete(':integrationId')
  @ApiOperation({ summary: 'Disconnect integration', description: 'Admin-disconnect a patient health integration (e.g. Google Fit, Apple Health)' })
  @ApiParam({ name: 'integrationId', description: 'Integration record ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Integration disconnected successfully' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async disconnectIntegration(@Param('integrationId') integrationId: string) {
    const result = await this.healthIntegrationsAdminService.disconnectIntegration(integrationId);
    return sendSuccessResponse('Integration disconnected', result);
  }
}
