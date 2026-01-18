import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClaudeSummaryAdminService } from './claude-summary-admin.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { GiftCreditsDto, GiftUnlimitedDto, RevokeGiftedCreditsDto } from './dto/gift-credits.dto';

@UseGuards(JwtAuthGuard)
@Controller('claude-summary')
export class ClaudeSummaryAdminController {
  constructor(private readonly claudeSummaryAdminService: ClaudeSummaryAdminService) {}

  // =====================
  // Plan Management
  // =====================

  /**
   * Create a new plan
   * POST /claude-summary/plans
   */
  @Post('plans')
  async createPlan(
    @Body() createPlanDto: CreatePlanDto,
    @Body('admin_id') adminId: string,
  ) {
    const result = await this.claudeSummaryAdminService.createPlan(createPlanDto, adminId);
    return sendSuccessResponse('Plan created successfully', result);
  }

  /**
   * Get all plans
   * GET /claude-summary/plans
   */
  @Get('plans')
  async getPlans(@Query('include_inactive') includeInactive?: string) {
    const plans = await this.claudeSummaryAdminService.getPlans(includeInactive === 'true');
    return sendSuccessResponse(Messages.RETRIEVED, plans);
  }

  /**
   * Get a single plan
   * GET /claude-summary/plans/:id
   */
  @Get('plans/:id')
  async getPlan(@Param('id') planId: string) {
    const plan = await this.claudeSummaryAdminService.getPlanById(planId);
    return sendSuccessResponse(Messages.RETRIEVED, plan);
  }

  /**
   * Update a plan
   * PATCH /claude-summary/plans/:id
   */
  @Patch('plans/:id')
  async updatePlan(@Param('id') planId: string, @Body() updatePlanDto: UpdatePlanDto) {
    const result = await this.claudeSummaryAdminService.updatePlan(planId, updatePlanDto);
    return sendSuccessResponse('Plan updated successfully', result);
  }

  /**
   * Delete a plan
   * DELETE /claude-summary/plans/:id
   */
  @Delete('plans/:id')
  async deletePlan(@Param('id') planId: string) {
    const result = await this.claudeSummaryAdminService.deletePlan(planId);
    return sendSuccessResponse('Plan deleted successfully', result);
  }

  /**
   * Seed default plans
   * POST /claude-summary/plans/seed
   */
  @Post('plans/seed')
  async seedDefaultPlans(@Body('admin_id') adminId: string) {
    const result = await this.claudeSummaryAdminService.seedDefaultPlans(adminId);
    return sendSuccessResponse('Default plans seeded successfully', result);
  }

  // =====================
  // Patient Credit Management
  // =====================

  /**
   * Get patient credits
   * GET /claude-summary/patient/:id/credits
   */
  @Get('patient/:id/credits')
  async getPatientCredits(@Param('id') patientId: string) {
    const result = await this.claudeSummaryAdminService.getPatientCredits(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient transaction history
   * GET /claude-summary/patient/:id/transactions
   */
  @Get('patient/:id/transactions')
  async getPatientTransactions(
    @Param('id') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.claudeSummaryAdminService.getPatientTransactionHistory(
      patientId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Gift credits to patient
   * POST /claude-summary/patient/:id/gift-credits
   */
  @Post('patient/:id/gift-credits')
  async giftCredits(@Param('id') patientId: string, @Body() giftCreditsDto: GiftCreditsDto) {
    const result = await this.claudeSummaryAdminService.giftCreditsToPatient(
      patientId,
      giftCreditsDto.credits,
      giftCreditsDto.expiry_days || null,
      giftCreditsDto.reason,
      giftCreditsDto.admin_id,
    );
    return sendSuccessResponse('Credits gifted successfully', result);
  }

  /**
   * Gift unlimited access to patient
   * POST /claude-summary/patient/:id/gift-unlimited
   */
  @Post('patient/:id/gift-unlimited')
  async giftUnlimited(@Param('id') patientId: string, @Body() giftUnlimitedDto: GiftUnlimitedDto) {
    const result = await this.claudeSummaryAdminService.giftUnlimitedToPatient(
      patientId,
      giftUnlimitedDto.duration_days,
      giftUnlimitedDto.reason,
      giftUnlimitedDto.admin_id,
    );
    return sendSuccessResponse('Unlimited access gifted successfully', result);
  }

  /**
   * Revoke gifted credits from patient
   * POST /claude-summary/patient/:id/revoke-gifted
   */
  @Post('patient/:id/revoke-gifted')
  async revokeGifted(
    @Param('id') patientId: string,
    @Body() revokeDto: RevokeGiftedCreditsDto,
  ) {
    const result = await this.claudeSummaryAdminService.revokeGiftedCredits(
      patientId,
      revokeDto.reason,
      revokeDto.admin_id,
    );
    return sendSuccessResponse('Gifted credits revoked successfully', result);
  }

  // =====================
  // Analytics
  // =====================

  /**
   * Get overview stats
   * GET /claude-summary/analytics/overview
   */
  @Get('analytics/overview')
  async getOverviewStats() {
    const result = await this.claudeSummaryAdminService.getOverviewStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get usage analytics
   * GET /claude-summary/analytics/usage
   */
  @Get('analytics/usage')
  async getUsageAnalytics(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const result = await this.claudeSummaryAdminService.getUsageAnalytics(startDate, endDate);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get daily usage trends
   * GET /claude-summary/analytics/trends
   */
  @Get('analytics/trends')
  async getDailyUsageTrends(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const result = await this.claudeSummaryAdminService.getDailyUsageTrends(startDate, endDate);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get revenue report
   * GET /claude-summary/analytics/revenue
   */
  @Get('analytics/revenue')
  async getRevenueReport(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const result = await this.claudeSummaryAdminService.getRevenueReport(startDate, endDate);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get top users
   * GET /claude-summary/analytics/top-users
   */
  @Get('analytics/top-users')
  async getTopUsers(@Query('limit') limit?: string) {
    const result = await this.claudeSummaryAdminService.getTopUsers(
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
