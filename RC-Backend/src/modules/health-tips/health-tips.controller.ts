import { Controller, Get, Post, Param, Query, UseGuards, Request, Header } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HealthTipsService } from './health-tips.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';

@Controller('health-tips')
@UseGuards(JwtAuthGuard)
export class HealthTipsController {
  constructor(private readonly healthTipsService: HealthTipsService) {}

  /**
   * GET /health-tips
   * Fetch active health tips for the authenticated user
   */
  @Get()
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
  async dismissTip(@Request() req, @Param('id') tipId: string) {
    const result = await this.healthTipsService.dismissTip(req.user.sub, tipId);
    return sendSuccessResponse(result.message, null);
  }

  /**
   * POST /health-tips/:id/acted
   * Mark a tip as acted upon
   */
  @Post(':id/acted')
  async markAsActedUpon(@Request() req, @Param('id') tipId: string) {
    const result = await this.healthTipsService.markAsActedUpon(req.user.sub, tipId);
    return sendSuccessResponse(result.message, null);
  }

  /**
   * POST /health-tips/:id/viewed
   * Track that a tip was displayed to the user
   */
  @Post(':id/viewed')
  async trackTipView(@Request() req, @Param('id') tipId: string) {
    const result = await this.healthTipsService.trackTipView(req.user.sub, tipId);
    return sendSuccessResponse(result.message, null);
  }

  /**
   * POST /health-tips/generate
   * Manually trigger tip generation (for testing or on-demand refresh)
   */
  @Post('generate')
  async generateTips(@Request() req) {
    const result = await this.healthTipsService.generateTipsOnDemand(req.user.sub);
    return sendSuccessResponse(result.message, result);
  }
}
