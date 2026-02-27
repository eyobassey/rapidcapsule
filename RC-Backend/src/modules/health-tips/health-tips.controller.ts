import { Controller, Get, Post, Param, Query, UseGuards, Request, Header } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HealthTipsService } from './health-tips.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';

@ApiTags('Health Tips')
@ApiBearerAuth('JWT-auth')
@Controller('health-tips')
@UseGuards(JwtAuthGuard)
export class HealthTipsController {
  constructor(private readonly healthTipsService: HealthTipsService) {}

  /**
   * GET /health-tips
   * Fetch active health tips for the authenticated user
   */
  @Get()
  @ApiOperation({
    summary: 'Get health tips',
    description: 'Fetch active health tips for the authenticated user. Tips can be filtered by category and priority, with optional pagination.',
  })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter tips by category', example: 'nutrition' })
  @ApiQuery({ name: 'priority', required: false, type: String, description: 'Filter tips by priority level', example: 'high' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Maximum number of tips to return', example: '10' })
  @ApiQuery({ name: 'include_dismissed', required: false, type: String, description: 'Whether to include dismissed tips', example: 'false' })
  @ApiResponse({ status: 200, description: 'Health tips retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  async getHealthTips(
    @Request() req,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('limit') limit?: string,
    @Query('include_dismissed') includeDismissed?: string,
  ) {
    const result = await this.healthTipsService.getUserTips(req.user.sub, {
      category,
      priority,
      limit: limit ? parseInt(limit, 10) : 10,
      includeDismissed: includeDismissed === 'true',
    });
    return sendSuccessResponse('Health tips retrieved', result);
  }

  /**
   * GET /health-tips/summary
   * Get a summary of tips by category and priority
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get tips summary',
    description: 'Retrieve a summary of health tips grouped by category and priority for the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Tips summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  async getTipsSummary(@Request() req) {
    const result = await this.healthTipsService.getTipsSummary(req.user.sub);
    return sendSuccessResponse('Tips summary retrieved', result);
  }

  /**
   * GET /health-tips/featured
   * Get top priority tips for dashboard display (max 3)
   */
  @Get('featured')
  @ApiOperation({
    summary: 'Get featured tips',
    description: 'Retrieve top-priority health tips suitable for dashboard display. Returns up to 3 tips by default.',
  })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Maximum number of featured tips to return (default: 3)', example: '3' })
  @ApiResponse({ status: 200, description: 'Featured tips retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  async getFeaturedTips(@Request() req, @Query('limit') limit?: string) {
    const result = await this.healthTipsService.getFeaturedTips(req.user.sub, limit ? parseInt(limit, 10) : 3);
    return sendSuccessResponse('Featured tips retrieved', result);
  }

  /**
   * GET /health-tips/history
   * Get history of all tips for the user (paginated)
   */
  @Get('history')
  @ApiOperation({
    summary: 'Get tip history',
    description: 'Retrieve the paginated history of all health tips for the authenticated user, including dismissed and acted-upon tips.',
  })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number for pagination (default: 1)', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Number of tips per page (default: 20)', example: '20' })
  @ApiResponse({ status: 200, description: 'Tip history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getTipHistory(@Request() req, @Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.healthTipsService.getTipHistory(req.user.sub, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return sendSuccessResponse('Tip history retrieved', result);
  }

  /**
   * POST /health-tips/:id/dismiss
   * Dismiss a health tip
   */
  @Post(':id/dismiss')
  @ApiOperation({
    summary: 'Dismiss a health tip',
    description: 'Dismiss a specific health tip so it no longer appears in the user\'s active tips list.',
  })
  @ApiParam({ name: 'id', description: 'The ID of the health tip to dismiss', example: '664f1b2e3a1b8c4e5d6f7a8b' })
  @ApiResponse({ status: 200, description: 'Health tip dismissed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Health tip not found' })
  async dismissTip(@Request() req, @Param('id') tipId: string) {
    const result = await this.healthTipsService.dismissTip(req.user.sub, tipId);
    return sendSuccessResponse(result.message, null);
  }

  /**
   * POST /health-tips/:id/acted
   * Mark a tip as acted upon
   */
  @Post(':id/acted')
  @ApiOperation({
    summary: 'Mark tip as acted upon',
    description: 'Record that the user has acted upon a specific health tip, e.g. followed the recommended advice.',
  })
  @ApiParam({ name: 'id', description: 'The ID of the health tip to mark as acted upon', example: '664f1b2e3a1b8c4e5d6f7a8b' })
  @ApiResponse({ status: 200, description: 'Health tip marked as acted upon successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Health tip not found' })
  async markAsActedUpon(@Request() req, @Param('id') tipId: string) {
    const result = await this.healthTipsService.markAsActedUpon(req.user.sub, tipId);
    return sendSuccessResponse(result.message, null);
  }

  /**
   * POST /health-tips/:id/viewed
   * Track that a tip was displayed to the user
   */
  @Post(':id/viewed')
  @ApiOperation({
    summary: 'Track tip view',
    description: 'Record that a specific health tip was displayed to the user for analytics and engagement tracking.',
  })
  @ApiParam({ name: 'id', description: 'The ID of the health tip that was viewed', example: '664f1b2e3a1b8c4e5d6f7a8b' })
  @ApiResponse({ status: 200, description: 'Tip view tracked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Health tip not found' })
  async trackTipView(@Request() req, @Param('id') tipId: string) {
    const result = await this.healthTipsService.trackTipView(req.user.sub, tipId);
    return sendSuccessResponse(result.message, null);
  }

  /**
   * POST /health-tips/generate
   * Manually trigger tip generation (for testing or on-demand refresh)
   */
  @Post('generate')
  @ApiOperation({
    summary: 'Generate health tips',
    description: 'Manually trigger health tip generation for the authenticated user. Useful for on-demand refresh or testing.',
  })
  @ApiResponse({ status: 201, description: 'Health tips generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async generateTips(@Request() req) {
    const result = await this.healthTipsService.generateTipsOnDemand(req.user.sub);
    return sendSuccessResponse(result.message, result);
  }
}
