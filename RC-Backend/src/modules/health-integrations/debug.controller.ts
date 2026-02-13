import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthIntegrationsService } from './health-integrations.service';

@ApiTags('Debug')
@Controller('debug/health-integrations')
export class DebugController {
  constructor(private readonly healthIntegrationsService: HealthIntegrationsService) {}

  @Get('google-fit-config')
  async debugGoogleFitConfig() {
    return this.healthIntegrationsService.debugGoogleFitConfig();
  }
}