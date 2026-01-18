import { Controller, Get } from '@nestjs/common';
import { HealthIntegrationsService } from './health-integrations.service';

@Controller('debug/health-integrations')
export class DebugController {
  constructor(private readonly healthIntegrationsService: HealthIntegrationsService) {}

  @Get('google-fit-config')
  async debugGoogleFitConfig() {
    return this.healthIntegrationsService.debugGoogleFitConfig();
  }
}