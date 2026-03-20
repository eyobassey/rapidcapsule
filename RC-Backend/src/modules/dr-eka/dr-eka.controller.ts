import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DrEkaService } from './services/dr-eka.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';

@ApiTags('Dr. Eka')
@ApiBearerAuth('JWT-auth')
@Controller('dr-eka')
@UseGuards(JwtAuthGuard)
export class DrEkaController {
  constructor(private readonly drEkaService: DrEkaService) {}

  /**
   * GET /dr-eka/daily
   * Get today's digest for the authenticated user
   */
  @Get('daily')
  @ApiOperation({
    summary: "Get today's daily digest",
    description:
      "Retrieve today's personalized daily health digest from Dr. Eka for the authenticated user. Returns null if not yet generated.",
  })
  @ApiResponse({
    status: 200,
    description: 'Daily digest retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  async getTodaysDigest(@Request() req) {
    const digest = await this.drEkaService.getTodaysDigest(req.user.sub);
    return sendSuccessResponse(
      digest
        ? 'Daily digest retrieved'
        : 'No digest available yet for today',
      digest,
    );
  }

  /**
   * GET /dr-eka/daily/history
   * Get paginated digest history
   */
  @Get('daily/history')
  @ApiOperation({
    summary: 'Get daily digest history',
    description:
      'Retrieve paginated history of daily health digests from Dr. Eka for the authenticated user.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Page number for pagination (default: 1)',
    example: '1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Number of digests per page (default: 10)',
    example: '10',
  })
  @ApiResponse({
    status: 200,
    description: 'Digest history retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getDigestHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.drEkaService.getDigestHistory(
      req.user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse('Digest history retrieved', result);
  }

  /**
   * POST /dr-eka/daily/generate
   * Manually trigger daily digest generation
   */
  @Post('daily/generate')
  @ApiOperation({
    summary: 'Generate daily digest',
    description:
      'Manually trigger daily digest generation from Dr. Eka for the authenticated user. Useful for on-demand refresh or first-time generation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Daily digest generated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async generateDailyDigest(@Request() req) {
    const digest = await this.drEkaService.generateDailyDigest(
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse('Daily digest generated', digest);
  }

  /**
   * GET /dr-eka/weekly
   * Get latest weekly report
   */
  @Get('weekly')
  @ApiOperation({
    summary: 'Get latest weekly report',
    description:
      "Retrieve the most recent weekly health report from Dr. Eka for the authenticated user.",
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly report retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  async getLatestWeeklyReport(@Request() req) {
    const report = await this.drEkaService.getLatestWeeklyReport(req.user.sub);
    return sendSuccessResponse(
      report
        ? 'Weekly report retrieved'
        : 'No weekly report available yet',
      report,
    );
  }

  /**
   * GET /dr-eka/weekly/history
   * Get paginated weekly report history
   */
  @Get('weekly/history')
  @ApiOperation({
    summary: 'Get weekly report history',
    description:
      'Retrieve paginated history of weekly health reports from Dr. Eka for the authenticated user.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Page number for pagination (default: 1)',
    example: '1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Number of reports per page (default: 10)',
    example: '10',
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly report history retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getWeeklyReportHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.drEkaService.getWeeklyReports(
      req.user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse('Weekly report history retrieved', result);
  }

  /**
   * POST /dr-eka/weekly/generate
   * Manually trigger weekly report generation
   */
  @Post('weekly/generate')
  @ApiOperation({
    summary: 'Generate weekly report',
    description:
      'Manually trigger weekly health report generation from Dr. Eka for the authenticated user. Useful for on-demand generation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Weekly report generated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async generateWeeklyReport(@Request() req) {
    const report = await this.drEkaService.generateWeeklyReport(
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse('Weekly report generated', report);
  }
}
