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
import { AppointmentsService } from './appointments.service';
import { AppointmentsQueryDto } from './dto/appointments-query.dto';
import { CreateAdminAppointmentDto } from './dto/create-admin-appointment.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createAdminAppointment(
    @Body() createAdminAppointmentDto: CreateAdminAppointmentDto,
  ) {
    const result = await this.appointmentsService.createAdminAppointment(
      createAdminAppointmentDto,
    );
    return sendSuccessResponse('Appointment created successfully', result);
  }

  @Get('stats')
  async getAppointmentStats() {
    const result = await this.appointmentsService.getAppointmentStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get()
  async getAppointments(@Query() appointmentsQueryDto: AppointmentsQueryDto) {
    const result = await this.appointmentsService.getAppointments(
      appointmentsQueryDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
