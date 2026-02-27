import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { PatientAnalyticsDto } from '../patients/dto/patient-analytics.dto';
import { AppointmentsAnalyticsDto } from '../appointments/dto/appointments-analytics.dto';
import { SpecialistsAnalyticsDto } from '../specialists/dto/specialists-analytics.dto';

@ApiTags('Admin Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('patients')
  @ApiOperation({ summary: 'Get patient analytics summary', description: 'Retrieve aggregated patient registration and subscription statistics' })
  @ApiResponse({ status: 200, description: 'Patient analytics data returned' })
  async getPatientsAnalyticsData() {
    const result = await this.analyticsService.getPatientsAnalyticsData();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patients-graph')
  @ApiOperation({ summary: 'Get patient analytics graph data', description: 'Retrieve time-series patient data for chart rendering with interval grouping' })
  @ApiResponse({ status: 200, description: 'Patient graph data returned' })
  async getPatientsAnalyticsGraphData(
    @Query() patientAnalyticsDto: PatientAnalyticsDto,
  ) {
    const result = await this.analyticsService.getPatientsAnalyticsGraphData(
      patientAnalyticsDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get appointment analytics summary', description: 'Retrieve aggregated appointment counts and completion statistics' })
  @ApiResponse({ status: 200, description: 'Appointment analytics data returned' })
  async getAppointmentsAnalyticsData() {
    const result = await this.analyticsService.getAppointmentsAnalyticsData();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('appointments-graph')
  @ApiOperation({ summary: 'Get appointment analytics graph data', description: 'Retrieve time-series appointment data for chart rendering with interval grouping' })
  @ApiResponse({ status: 200, description: 'Appointment graph data returned' })
  async getAppointmentsAnalyticsGraphData(
    @Query() appointmentsAnalyticsDto: AppointmentsAnalyticsDto,
  ) {
    const result =
      await this.analyticsService.getAppointmentsAnalyticsGraphData(
        appointmentsAnalyticsDto,
      );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('specialists')
  @ApiOperation({ summary: 'Get specialist analytics summary', description: 'Retrieve aggregated specialist registration and activity statistics' })
  @ApiResponse({ status: 200, description: 'Specialist analytics data returned' })
  async getSpecialistsAnalyticsData() {
    const result = await this.analyticsService.getSpecialistsAnalyticsData();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('specialists-graph')
  @ApiOperation({ summary: 'Get specialist analytics graph data', description: 'Retrieve time-series specialist data for chart rendering with interval grouping' })
  @ApiResponse({ status: 200, description: 'Specialist graph data returned' })
  async getSpecialistsAnalyticsGraphData(
    @Query() specialistsAnalyticsDto: SpecialistsAnalyticsDto,
  ) {
    const result = await this.analyticsService.getSpecialistsAnalyticsGraphData(
      specialistsAnalyticsDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
