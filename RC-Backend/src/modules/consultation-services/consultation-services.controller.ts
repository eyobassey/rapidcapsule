import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ConsultationServicesService } from './consultation-services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@Controller('consultation-services')
export class ConsultationServicesController {
  constructor(private readonly consultationServicesService: ConsultationServicesService) {}

  @Get()
  async findAll() {
    const result = await this.consultationServicesService.findAll();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('defaults')
  async findDefaults() {
    const result = await this.consultationServicesService.findDefaults();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const result = await this.consultationServicesService.findBySlug(slug);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
