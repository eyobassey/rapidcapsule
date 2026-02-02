import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConsultationServicesService } from './consultation-services.service';
import { CreateConsultationServiceDto } from './dto/create-consultation-service.dto';
import { UpdateConsultationServiceDto } from './dto/update-consultation-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@Controller('consultation-services')
@UseGuards(JwtAuthGuard)
export class ConsultationServicesController {
  constructor(private readonly consultationServicesService: ConsultationServicesService) {}

  @Post()
  async create(@Body() createDto: CreateConsultationServiceDto) {
    const result = await this.consultationServicesService.create(createDto);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Get()
  async findAll(@Query('include_inactive') includeInactive: string) {
    const result = await this.consultationServicesService.findAll(includeInactive === 'true');
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('seed')
  async seedDefaults() {
    const result = await this.consultationServicesService.seedDefaultServices();
    return sendSuccessResponse('Default services seeded', result);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.consultationServicesService.findOne(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('reorder')
  async reorder(@Body() body: { orderedIds: string[] }) {
    const result = await this.consultationServicesService.reorder(body.orderedIds);
    return sendSuccessResponse('Services reordered', result);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateConsultationServiceDto,
  ) {
    const result = await this.consultationServicesService.update(id, updateDto);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.consultationServicesService.remove(id);
    return sendSuccessResponse(Messages.DELETED, result);
  }

  @Patch(':id/soft-delete')
  async softDelete(@Param('id') id: string) {
    const result = await this.consultationServicesService.softDelete(id);
    return sendSuccessResponse('Service deactivated', result);
  }
}
