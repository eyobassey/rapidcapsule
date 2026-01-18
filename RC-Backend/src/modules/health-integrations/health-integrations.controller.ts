import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HealthIntegrationsService } from './health-integrations.service';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';
import { SyncHealthDataDto } from './dto/sync-health-data.dto';
import { UpdateSyncSettingsDto } from './dto/update-sync-settings.dto';
import { IntegrationProvider } from './schemas/health-integration.schema';

@Controller('health-integrations')
@UseGuards(JwtAuthGuard)
export class HealthIntegrationsController {
  constructor(private readonly healthIntegrationsService: HealthIntegrationsService) {}

  @Get()
  async getUserIntegrations(@Request() req) {
    return this.healthIntegrationsService.getUserIntegrations(req.user.id);
  }

  @Get('status/:provider')
  async getIntegrationStatus(
    @Request() req,
    @Param('provider') provider: IntegrationProvider,
  ) {
    return this.healthIntegrationsService.getIntegrationStatus(req.user.id, provider);
  }

  @Get('debug/google-fit-config')
  async debugGoogleFitConfig() {
    return this.healthIntegrationsService.debugGoogleFitConfig();
  }

  @Post('connect')
  async connectIntegration(
    @Request() req,
    @Body() connectDto: ConnectIntegrationDto,
  ) {
    return this.healthIntegrationsService.connectIntegration(
      req.user.id,
      connectDto,
    );
  }

  @Post('google-fit/callback')
  async handleGoogleFitCallback(
    @Request() req,
    @Body() body: { code: string; state?: string },
  ) {
    return this.healthIntegrationsService.handleGoogleFitCallback(
      req.user.id,
      body.code,
    );
  }

  @Post('samsung-health/callback')
  async handleSamsungHealthCallback(
    @Request() req,
    @Body() body: { code: string; state?: string },
  ) {
    return this.healthIntegrationsService.handleSamsungHealthCallback(
      req.user.id,
      body.code,
    );
  }

  @Post('apple-health/callback')
  async handleAppleHealthCallback(
    @Request() req,
    @Body() body: { authData: any },
  ) {
    return this.healthIntegrationsService.handleAppleHealthCallback(
      req.user.id,
      body.authData,
    );
  }

  @Post('sync/:provider')
  async syncHealthData(
    @Request() req,
    @Param('provider') provider: IntegrationProvider,
    @Body() syncDto: SyncHealthDataDto,
  ) {
    return this.healthIntegrationsService.syncHealthData(
      req.user.id,
      provider,
      syncDto,
    );
  }

  @Get('data')
  async getHealthData(
    @Request() req,
    @Query('provider') provider?: IntegrationProvider,
    @Query('dataType') dataType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.healthIntegrationsService.getHealthData(req.user.id, {
      provider,
      dataType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Patch(':provider/settings')
  async updateSyncSettings(
    @Request() req,
    @Param('provider') provider: IntegrationProvider,
    @Body() updateDto: UpdateSyncSettingsDto,
  ) {
    return this.healthIntegrationsService.updateSyncSettings(
      req.user.id,
      provider,
      updateDto,
    );
  }

  @Delete(':provider')
  async disconnectIntegration(
    @Request() req,
    @Param('provider') provider: IntegrationProvider,
  ) {
    return this.healthIntegrationsService.disconnectIntegration(
      req.user.id,
      provider,
    );
  }

  @Post('push-to-vitals')
  async pushToVitals(
    @Request() req,
    @Body() body: { dataIds: string[] },
  ) {
    return this.healthIntegrationsService.pushToVitals(req.user.id, body.dataIds);
  }
}