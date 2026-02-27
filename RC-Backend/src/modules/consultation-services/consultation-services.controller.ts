import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConsultationServicesService } from './consultation-services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@ApiTags('Consultation Services')
@Controller('consultation-services')
export class ConsultationServicesController {
  constructor(private readonly consultationServicesService: ConsultationServicesService) {}

  @ApiOperation({ summary: 'Get all consultation services', description: 'Retrieve all available consultation service types' })
  @ApiResponse({ status: 200, description: 'Consultation services returned' })
  @Get()
  async findAll() {
    const result = await this.consultationServicesService.findAll();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get default services', description: 'Retrieve the default consultation service configuration' })
  @ApiResponse({ status: 200, description: 'Default consultation services returned' })
  @Get('defaults')
  async findDefaults() {
    const result = await this.consultationServicesService.findDefaults();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get service by slug', description: 'Retrieve a specific consultation service by its URL slug' })
  @ApiResponse({ status: 200, description: 'Consultation service returned' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiParam({ name: 'slug', description: 'Service URL slug', example: 'general-consultation' })
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const result = await this.consultationServicesService.findBySlug(slug);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
