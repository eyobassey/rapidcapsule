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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ConsultationServicesService } from './consultation-services.service';
import { CreateConsultationServiceDto } from './dto/create-consultation-service.dto';
import { UpdateConsultationServiceDto } from './dto/update-consultation-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@ApiTags('Admin Consultation Services')
@ApiBearerAuth('JWT-auth')
@Controller('consultation-services')
@UseGuards(JwtAuthGuard)
export class ConsultationServicesController {
  constructor(private readonly consultationServicesService: ConsultationServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create consultation service', description: 'Create a new consultation service type (e.g. General Consultation, Mental Health)' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate slug' })
  async create(@Body() createDto: CreateConsultationServiceDto) {
    const result = await this.consultationServicesService.create(createDto);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Get()
  @ApiOperation({ summary: 'List consultation services', description: 'Retrieve all consultation services, optionally including inactive ones' })
  @ApiQuery({ name: 'include_inactive', required: false, description: 'Include inactive services', example: 'false' })
  @ApiResponse({ status: 200, description: 'List of services returned' })
  async findAll(@Query('include_inactive') includeInactive: string) {
    const result = await this.consultationServicesService.findAll(includeInactive === 'true');
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('seed')
  @ApiOperation({ summary: 'Seed default services', description: 'Populate the database with default consultation service types' })
  @ApiResponse({ status: 200, description: 'Default services seeded' })
  async seedDefaults() {
    const result = await this.consultationServicesService.seedDefaultServices();
    return sendSuccessResponse('Default services seeded', result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID', description: 'Retrieve a single consultation service by its ID' })
  @ApiParam({ name: 'id', description: 'Consultation service ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Service details returned' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(@Param('id') id: string) {
    const result = await this.consultationServicesService.findOne(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder services', description: 'Update the display order of consultation services' })
  @ApiBody({ schema: { type: 'object', properties: { orderedIds: { type: 'array', items: { type: 'string' }, example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] } } } })
  @ApiResponse({ status: 200, description: 'Services reordered successfully' })
  async reorder(@Body() body: { orderedIds: string[] }) {
    const result = await this.consultationServicesService.reorder(body.orderedIds);
    return sendSuccessResponse('Services reordered', result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update consultation service', description: 'Update an existing consultation service' })
  @ApiParam({ name: 'id', description: 'Consultation service ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateConsultationServiceDto,
  ) {
    const result = await this.consultationServicesService.update(id, updateDto);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete consultation service', description: 'Permanently remove a consultation service' })
  @ApiParam({ name: 'id', description: 'Consultation service ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(@Param('id') id: string) {
    const result = await this.consultationServicesService.remove(id);
    return sendSuccessResponse(Messages.DELETED, result);
  }

  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft-delete consultation service', description: 'Deactivate a consultation service without permanently removing it' })
  @ApiParam({ name: 'id', description: 'Consultation service ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Service deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async softDelete(@Param('id') id: string) {
    const result = await this.consultationServicesService.softDelete(id);
    return sendSuccessResponse('Service deactivated', result);
  }
}
