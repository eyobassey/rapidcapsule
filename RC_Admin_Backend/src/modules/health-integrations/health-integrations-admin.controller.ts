import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HealthIntegrationsAdminService } from './health-integrations-admin.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('health-integrations')
export class HealthIntegrationsAdminController {
  constructor(
    private readonly healthIntegrationsAdminService: HealthIntegrationsAdminService,
  ) {}

  /**
   * Get platform-wide integration statistics
   * GET /health-integrations/overview
   */
  @Get('overview')
  async getOverviewStats() {
    const result = await this.healthIntegrationsAdminService.getOverviewStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient's connected integrations
   * GET /health-integrations/patient/:patientId
   */
  @Get('patient/:patientId')
  async getPatientIntegrations(@Param('patientId') patientId: string) {
    const result = await this.healthIntegrationsAdminService.getPatientIntegrations(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get sync logs for a patient
   * GET /health-integrations/patient/:patientId/sync-logs
   */
  @Get('patient/:patientId/sync-logs')
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

  /**
   * Admin disconnect a patient's integration
   * DELETE /health-integrations/:integrationId
   */
  @Delete(':integrationId')
  async disconnectIntegration(@Param('integrationId') integrationId: string) {
    const result = await this.healthIntegrationsAdminService.disconnectIntegration(integrationId);
    return sendSuccessResponse('Integration disconnected', result);
  }
}
