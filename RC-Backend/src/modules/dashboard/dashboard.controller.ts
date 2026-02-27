import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Get specialist dashboard', description: 'Retrieve specialist dashboard data including patient counts, upcoming appointments, and revenue summary' })
  @ApiResponse({ status: 200, description: 'Dashboard data returned' })
  @Get('specialist')
  async specialistDashboard(@Request() req) {
    const result = await this.dashboardService.specialistDashboard(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get enhanced specialist dashboard', description: 'Retrieve enhanced specialist dashboard with additional metrics like patient satisfaction, prescription stats, and revenue trends' })
  @ApiResponse({ status: 200, description: 'Enhanced dashboard data returned' })
  @Get('specialist/enhanced')
  async specialistDashboardEnhanced(@Request() req) {
    const result = await this.dashboardService.specialistDashboardEnhanced(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get specialist analytics', description: 'Retrieve detailed analytics for the specialist over a configurable time period' })
  @ApiResponse({ status: 200, description: 'Analytics data returned' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period for analytics', example: '30d' })
  @Get('specialist/analytics')
  async specialistAnalytics(
    @Request() req,
    @Query('period') period: string = '30d',
  ) {
    const result = await this.dashboardService.getSpecialistAnalytics(
      req.user.sub,
      period,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
