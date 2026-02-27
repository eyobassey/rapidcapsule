import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthIntegrationsService } from './health-integrations.service';

@ApiTags('Debug')
@Controller('debug/health-integrations')
export class DebugController {
  constructor(private readonly healthIntegrationsService: HealthIntegrationsService) {}

  @ApiOperation({ summary: 'Debug Google Fit config', description: 'Retrieve the current Google Fit OAuth configuration for debugging purposes' })
  @ApiResponse({ status: 200, description: 'Google Fit config returned' })
  @Get('google-fit-config')
  async debugGoogleFitConfig() {
    return this.healthIntegrationsService.debugGoogleFitConfig();
  }
}