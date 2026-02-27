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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClaudeSummaryAdminService } from './claude-summary-admin.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { GiftCreditsDto, GiftUnlimitedDto, RevokeGiftedCreditsDto } from './dto/gift-credits.dto';

@ApiTags('Claude Summary')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Create a new summary plan', description: 'Creates a new AI health summary plan that patients can purchase. Supports bundle (fixed credits) and unlimited (time-based) plan types with multi-currency pricing.' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid plan data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get all summary plans', description: 'Retrieves all AI health summary plans. By default only active plans are returned; set include_inactive to true to see deactivated plans as well.' })
  @ApiQuery({ name: 'include_inactive', required: false, type: String, description: 'Set to "true" to include deactivated plans', example: 'true' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('plans')
  async getPlans(@Query('include_inactive') includeInactive?: string) {
    const plans = await this.claudeSummaryAdminService.getPlans(includeInactive === 'true');
    return sendSuccessResponse(Messages.RETRIEVED, plans);
  }

  /**
   * Get a single plan
   * GET /claude-summary/plans/:id
   */
  @ApiOperation({ summary: 'Get a single plan by ID', description: 'Retrieves full details of a specific AI health summary plan including pricing, credit allowance, and activation status.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the plan', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Plan retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @Get('plans/:id')
  async getPlan(@Param('id') planId: string) {
    const plan = await this.claudeSummaryAdminService.getPlanById(planId);
    return sendSuccessResponse(Messages.RETRIEVED, plan);
  }

  /**
   * Update a plan
   * PATCH /claude-summary/plans/:id
   */
  @ApiOperation({ summary: 'Update an existing plan', description: 'Partially updates a summary plan. Only provided fields are modified. Can be used to adjust pricing, rename, change credit amounts, or deactivate a plan.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the plan to update', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid plan data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @Patch('plans/:id')
  async updatePlan(@Param('id') planId: string, @Body() updatePlanDto: UpdatePlanDto) {
    const result = await this.claudeSummaryAdminService.updatePlan(planId, updatePlanDto);
    return sendSuccessResponse('Plan updated successfully', result);
  }

  /**
   * Delete a plan
   * DELETE /claude-summary/plans/:id
   */
  @ApiOperation({ summary: 'Delete a plan', description: 'Permanently removes a summary plan from the system. Consider deactivating the plan instead if patients have active subscriptions tied to it.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the plan to delete', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @Delete('plans/:id')
  async deletePlan(@Param('id') planId: string) {
    const result = await this.claudeSummaryAdminService.deletePlan(planId);
    return sendSuccessResponse('Plan deleted successfully', result);
  }

  /**
   * Seed default plans
   * POST /claude-summary/plans/seed
   */
  @ApiOperation({ summary: 'Seed default plans', description: 'Populates the database with a set of default AI health summary plans (e.g., Starter Bundle, Monthly Unlimited). Useful for initial setup or resetting the plan catalogue to defaults.' })
  @ApiResponse({ status: 201, description: 'Default plans seeded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get patient credit balance', description: 'Retrieves the current AI health summary credit balance for a specific patient, including purchased credits, gifted credits, and any active unlimited access period.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient credits retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Get('patient/:id/credits')
  async getPatientCredits(@Param('id') patientId: string) {
    const result = await this.claudeSummaryAdminService.getPatientCredits(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient transaction history
   * GET /claude-summary/patient/:id/transactions
   */
  @ApiOperation({ summary: 'Get patient transaction history', description: 'Retrieves a paginated list of all credit transactions (purchases, gifts, usages, revocations) for a specific patient, ordered by most recent first.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number for pagination (default: 1)', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Number of records per page (default: 20)', example: '20' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
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
  @ApiOperation({ summary: 'Gift credits to a patient', description: 'Awards complimentary AI health summary credits to a specific patient. The admin must provide a reason which is recorded in the audit log. Optionally set an expiry period.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the patient to receive credits', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 201, description: 'Credits gifted successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid gift data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
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
  @ApiOperation({ summary: 'Gift unlimited access to a patient', description: 'Grants a patient unlimited AI health summary access for a specified number of days. Useful for VIP patients, promotional campaigns, or compensating for service issues.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the patient to receive unlimited access', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 201, description: 'Unlimited access gifted successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid gift data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
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
  @ApiOperation({ summary: 'Revoke gifted credits from a patient', description: 'Removes all previously gifted (complimentary) credits from a patient. Only affects admin-gifted credits, not purchased credits. The reason is recorded in the audit log.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the patient whose gifted credits will be revoked', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Gifted credits revoked successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid revocation data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
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
  @ApiOperation({ summary: 'Get analytics overview', description: 'Returns high-level statistics for the AI health summary feature including total summaries generated, active users, revenue totals, and credit utilization rates.' })
  @ApiResponse({ status: 200, description: 'Overview stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('analytics/overview')
  async getOverviewStats() {
    const result = await this.claudeSummaryAdminService.getOverviewStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get usage analytics
   * GET /claude-summary/analytics/usage
   */
  @ApiOperation({ summary: 'Get usage analytics', description: 'Returns detailed usage metrics for the AI health summary feature over a date range, including summaries generated, credits consumed, and average usage per patient.' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date for the analytics period (ISO 8601)', example: '2026-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date for the analytics period (ISO 8601)', example: '2026-02-27' })
  @ApiResponse({ status: 200, description: 'Usage analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get daily usage trends', description: 'Returns time-series data of daily summary generation volumes over a date range. Useful for charting adoption trends and identifying peak usage days.' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date for the trend period (ISO 8601)', example: '2026-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date for the trend period (ISO 8601)', example: '2026-02-27' })
  @ApiResponse({ status: 200, description: 'Daily trends retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get revenue report', description: 'Returns revenue analytics for AI health summary plan purchases over a date range, including total revenue (NGN), breakdown by plan type, and payment method distribution.' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date for the revenue period (ISO 8601)', example: '2026-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date for the revenue period (ISO 8601)', example: '2026-02-27' })
  @ApiResponse({ status: 200, description: 'Revenue report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get top users by summary usage', description: 'Returns a ranked list of patients with the highest AI health summary usage, including total summaries generated and credits consumed.' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Maximum number of top users to return (default: 10)', example: '10' })
  @ApiResponse({ status: 200, description: 'Top users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('analytics/top-users')
  async getTopUsers(@Query('limit') limit?: string) {
    const result = await this.claudeSummaryAdminService.getTopUsers(
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
