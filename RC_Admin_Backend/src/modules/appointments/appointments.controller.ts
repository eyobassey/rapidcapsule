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
  HttpCode,
  HttpStatus
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { AppointmentsQueryDto } from './dto/appointments-query.dto';
import { CreateAdminAppointmentDto } from './dto/create-admin-appointment.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags('Admin Appointments')
@ApiBearerAuth('JWT-auth')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create appointment', description: 'Admin-created appointment between a patient and specialist with specified date, time, and channel' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or scheduling conflict' })
  async createAdminAppointment(
    @Body() createAdminAppointmentDto: CreateAdminAppointmentDto,
  ) {
    const result = await this.appointmentsService.createAdminAppointment(
      createAdminAppointmentDto,
    );
    return sendSuccessResponse('Appointment created successfully', result);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get appointment statistics', description: 'Retrieve aggregated appointment counts by status, type, and time period' })
  @ApiResponse({ status: 200, description: 'Appointment statistics returned' })
  async getAppointmentStats() {
    const result = await this.appointmentsService.getAppointmentStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get()
  @ApiOperation({ summary: 'List appointments', description: 'Retrieve paginated appointments with optional filters for status, medium, date, and meeting class' })
  @ApiResponse({ status: 200, description: 'Paginated appointment list returned' })
  async getAppointments(@Query() appointmentsQueryDto: AppointmentsQueryDto) {
    const result = await this.appointmentsService.getAppointments(
      appointmentsQueryDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
