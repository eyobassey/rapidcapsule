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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HealthIntegrationsService } from './health-integrations.service';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';
import { SyncHealthDataDto } from './dto/sync-health-data.dto';
import { UpdateSyncSettingsDto } from './dto/update-sync-settings.dto';
import { IntegrationProvider } from './schemas/health-integration.schema';

const SUCCESS = 'success';

@ApiTags('Health Integrations')
@ApiBearerAuth('JWT-auth')
@Controller('health-integrations')
@UseGuards(JwtAuthGuard)
export class HealthIntegrationsController {
  constructor(private readonly healthIntegrationsService: HealthIntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all connected integrations for the user' })
  async getUserIntegrations(@Request() req) {
    const result = await this.healthIntegrationsService.getUserIntegrations(req.user.sub);
    return { message: SUCCESS, result };
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get all available health providers' })
  async getAvailableProviders() {
    const result = await this.healthIntegrationsService.getAvailableProviders();
    return { message: SUCCESS, result };
  }

  @Get('status/:provider')
  @ApiOperation({ summary: 'Get integration status for a specific provider' })
  async getIntegrationStatus(
    @Request() req,
    @Param('provider') provider: IntegrationProvider,
  ) {
    const result = await this.healthIntegrationsService.getIntegrationStatus(req.user.sub, provider);
    return { message: SUCCESS, result };
  }

  @Get('debug/google-fit-config')
  @ApiOperation({ summary: 'Debug Google Fit configuration' })
  async debugGoogleFitConfig() {
    const result = await this.healthIntegrationsService.debugGoogleFitConfig();
    return { message: SUCCESS, result };
  }

  @Post('connect')
  @ApiOperation({ summary: 'Initiate connection to a health provider' })
  async connectIntegration(
    @Request() req,
    @Body() connectDto: ConnectIntegrationDto,
  ) {
    const result = await this.healthIntegrationsService.connectIntegration(req.user.sub, connectDto);
    return { message: SUCCESS, result };
  }

  @Post('callback/:provider')
  @ApiOperation({ summary: 'Handle OAuth callback from a health provider' })
  async handleOAuthCallback(
    @Request() req,
    @Param('provider') provider: string,
    @Body() body: { code: string; state?: string },
  ) {
    const result = await this.healthIntegrationsService.handleOAuthCallback(
      req.user.sub,
      provider,
      body.code,
    );
    return { message: SUCCESS, result };
  }

  // Keep legacy callback endpoints for backward compatibility
  @Post('google-fit/callback')
  @ApiOperation({ summary: 'Handle Google Fit OAuth callback (legacy)' })
  async handleGoogleFitCallback(
    @Request() req,
    @Body() body: { code: string; state?: string },
  ) {
    const result = await this.healthIntegrationsService.handleOAuthCallback(
      req.user.sub,
      'google_fit',
      body.code,
    );
    return { message: SUCCESS, result };
  }

  @Post('samsung-health/callback')
  @ApiOperation({ summary: 'Handle Samsung Health OAuth callback (legacy)' })
  async handleSamsungHealthCallback(
    @Request() req,
    @Body() body: { code: string; state?: string },
  ) {
    const result = await this.healthIntegrationsService.handleOAuthCallback(
      req.user.sub,
      'samsung_health',
      body.code,
    );
    return { message: SUCCESS, result };
  }

  @Post('apple-health/callback')
  @ApiOperation({ summary: 'Handle Apple Health data push callback' })
  async handleAppleHealthCallback(
    @Request() req,
    @Body() body: { authData: any },
  ) {
    const result = await this.healthIntegrationsService.handleAppleHealthCallback(
      req.user.sub,
      body.authData,
    );
    return { message: SUCCESS, result };
  }

  @Post('sync/:provider')
  @ApiOperation({ summary: 'Sync health data from a provider' })
  async syncHealthData(
    @Request() req,
    @Param('provider') provider: IntegrationProvider,
    @Body() syncDto: SyncHealthDataDto,
  ) {
    const result = await this.healthIntegrationsService.syncHealthData(req.user.sub, provider, syncDto);
    return { message: SUCCESS, result };
  }

  @Get('data')
  @ApiOperation({ summary: 'Get synced health data' })
  async getHealthData(
    @Request() req,
    @Query('provider') provider?: IntegrationProvider,
    @Query('dataType') dataType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.healthIntegrationsService.getHealthData(req.user.sub, {
      provider,
      dataType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return { message: SUCCESS, result };
  }

  @Get('sync-logs')
  @ApiOperation({ summary: 'Get sync history' })
  async getSyncLogs(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    const result = await this.healthIntegrationsService.getSyncLogs(req.user.sub, limit);
    return { message: SUCCESS, result };
  }

  @Patch(':provider/settings')
  @ApiOperation({ summary: 'Update sync settings for a provider' })
  async updateSyncSettings(
    @Request() req,
    @Param('provider') provider: IntegrationProvider,
    @Body() updateDto: UpdateSyncSettingsDto,
  ) {
    const result = await this.healthIntegrationsService.updateSyncSettings(
      req.user.sub,
      provider,
      updateDto,
    );
    return { message: SUCCESS, result };
  }

  @Delete(':provider')
  @ApiOperation({ summary: 'Disconnect a health provider' })
  async disconnectIntegration(
    @Request() req,
    @Param('provider') provider: IntegrationProvider,
  ) {
    const result = await this.healthIntegrationsService.disconnectIntegration(req.user.sub, provider);
    return { message: SUCCESS, result };
  }

  @Post('push-to-vitals')
  @ApiOperation({ summary: 'Push health data to vitals' })
  async pushToVitals(
    @Request() req,
    @Body() body: { dataIds: string[] },
  ) {
    const result = await this.healthIntegrationsService.pushToVitals(req.user.sub, body.dataIds);
    return { message: SUCCESS, result };
  }
}
