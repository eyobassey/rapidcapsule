import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RxGPTAdminService } from './rxgpt-admin.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import {
  UpdateRxGPTSettingsDto,
  GiftCreditsToSpecialistDto,
  GiftUnlimitedToSpecialistDto,
  RevokeCreditsDto,
  BulkGiftCreditsDto,
} from './dto/rxgpt-admin.dto';

@ApiTags('RxGPT')
@ApiBearerAuth('JWT-auth')
@Controller('rxgpt')
export class RxGPTAdminController {
  constructor(private readonly rxgptAdminService: RxGPTAdminService) {}

  // =====================
  // Settings Management
  // =====================

  /**
   * Get RxGPT settings
   * GET /rxgpt/settings
   */
  @ApiOperation({ summary: 'Get RxGPT settings', description: 'Retrieves the current RxGPT configuration including AI model parameters, feature toggles, data source settings, credit policies, display preferences, and disclaimer text.' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('settings')
  async getSettings() {
    const result = await this.rxgptAdminService.getSettings();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Update RxGPT settings
   * PATCH /rxgpt/settings
   */
  @ApiOperation({ summary: 'Update RxGPT settings', description: 'Partially updates the RxGPT configuration. Only provided fields are modified. Supports updating AI model, feature toggles, data sources, thresholds, display options, and credit settings.' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid settings values' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Patch('settings')
  async updateSettings(
    @Body() updateSettingsDto: UpdateRxGPTSettingsDto,
    @Request() req: any,
  ) {
    const result = await this.rxgptAdminService.updateSettings(
      updateSettingsDto,
      req.user?._id,
    );
    return sendSuccessResponse('Settings updated successfully', result);
  }

  // =====================
  // Analytics
  // =====================

  /**
   * Get RxGPT analytics overview
   * GET /rxgpt/analytics
   */
  @ApiOperation({ summary: 'Get RxGPT analytics overview', description: 'Returns comprehensive analytics for the RxGPT feature over a date range, including total analyses performed, alert counts, average confidence scores, and specialist adoption rates.' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date for the analytics period (ISO 8601)', example: '2026-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date for the analytics period (ISO 8601)', example: '2026-02-27' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('analytics')
  async getAnalytics(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const result = await this.rxgptAdminService.getAnalytics(startDate, endDate);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get daily usage trends
   * GET /rxgpt/analytics/trends
   */
  @ApiOperation({ summary: 'Get daily usage trends', description: 'Returns time-series data of daily RxGPT analysis volumes over a date range. Useful for charting adoption trends and identifying peak usage periods among specialists.' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date for the trend period (ISO 8601)', example: '2026-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date for the trend period (ISO 8601)', example: '2026-02-27' })
  @ApiResponse({ status: 200, description: 'Daily trends retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('analytics/trends')
  async getDailyTrends(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const result = await this.rxgptAdminService.getDailyTrends(startDate, endDate);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get alert breakdown
   * GET /rxgpt/analytics/alerts
   */
  @ApiOperation({ summary: 'Get alert breakdown', description: 'Returns a breakdown of RxGPT alerts by type (drug interactions, allergy warnings, dosage issues, contraindications) and severity level over a date range.' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date for the alert analysis period (ISO 8601)', example: '2026-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date for the alert analysis period (ISO 8601)', example: '2026-02-27' })
  @ApiResponse({ status: 200, description: 'Alert breakdown retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('analytics/alerts')
  async getAlertBreakdown(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const result = await this.rxgptAdminService.getAlertBreakdown(startDate, endDate);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get top flagged drugs
   * GET /rxgpt/analytics/top-drugs
   */
  @ApiOperation({ summary: 'Get top flagged drugs', description: 'Returns a ranked list of drugs most frequently flagged by RxGPT for alerts (interactions, dosage issues, contraindications). Helps identify commonly problematic medications.' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Maximum number of top drugs to return (default: 10)', example: '10' })
  @ApiResponse({ status: 200, description: 'Top flagged drugs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('analytics/top-drugs')
  async getTopDrugs(@Query('limit') limit?: string) {
    const result = await this.rxgptAdminService.getTopFlaggedDrugs(
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get top specialists by usage
   * GET /rxgpt/analytics/top-specialists
   */
  @ApiOperation({ summary: 'Get top specialists by RxGPT usage', description: 'Returns a ranked list of specialists with the highest RxGPT analysis usage, including total analyses performed and credits consumed.' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Maximum number of top specialists to return (default: 10)', example: '10' })
  @ApiResponse({ status: 200, description: 'Top specialists retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('analytics/top-specialists')
  async getTopSpecialists(@Query('limit') limit?: string) {
    const result = await this.rxgptAdminService.getTopSpecialists(
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // =====================
  // Specialist Credit Management
  // =====================

  /**
   * Get all specialists with credit info
   * GET /rxgpt/specialists
   */
  @ApiOperation({ summary: 'Get specialists with credit info', description: 'Retrieves a paginated list of all specialists with their RxGPT credit balances, usage statistics, and account status. Supports text search by name or email.' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number for pagination (default: 1)', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Number of records per page (default: 20)', example: '20' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by specialist name or email', example: 'Adebayo' })
  @ApiResponse({ status: 200, description: 'Specialists list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('specialists')
  async getSpecialists(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.rxgptAdminService.getSpecialistsWithCredits(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get specialist credit details
   * GET /rxgpt/specialists/:id/credits
   */
  @ApiOperation({ summary: 'Get specialist credit details', description: 'Retrieves detailed RxGPT credit information for a specific specialist, including current balance, gifted credits, purchased credits, usage history, and any active unlimited access period.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the specialist', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Specialist credit details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Specialist not found' })
  @Get('specialists/:id/credits')
  async getSpecialistCredits(@Param('id') specialistId: string) {
    const result = await this.rxgptAdminService.getSpecialistCreditDetails(specialistId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Gift credits to specialist
   * POST /rxgpt/specialists/:id/gift-credits
   */
  @ApiOperation({ summary: 'Gift RxGPT credits to a specialist', description: 'Awards complimentary RxGPT analysis credits to a specific specialist. The admin must provide a reason which is recorded in the audit log. Optionally set an expiry period for the gifted credits.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the specialist to receive credits', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 201, description: 'Credits gifted successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid gift data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Specialist not found' })
  @Post('specialists/:id/gift-credits')
  async giftCredits(
    @Param('id') specialistId: string,
    @Body() giftCreditsDto: GiftCreditsToSpecialistDto,
    @Request() req: any,
  ) {
    const result = await this.rxgptAdminService.giftCreditsToSpecialist(
      specialistId,
      giftCreditsDto.credits,
      giftCreditsDto.expiry_days || null,
      giftCreditsDto.reason,
      req.user?._id,
    );
    return sendSuccessResponse('Credits gifted successfully', result);
  }

  /**
   * Gift unlimited access to specialist
   * POST /rxgpt/specialists/:id/gift-unlimited
   */
  @ApiOperation({ summary: 'Gift unlimited RxGPT access to a specialist', description: 'Grants a specialist unlimited RxGPT analysis access for a specified number of days. Useful for onboarding incentives, beta testers, or high-volume prescribers.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the specialist to receive unlimited access', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 201, description: 'Unlimited access granted successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid gift data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Specialist not found' })
  @Post('specialists/:id/gift-unlimited')
  async giftUnlimited(
    @Param('id') specialistId: string,
    @Body() giftUnlimitedDto: GiftUnlimitedToSpecialistDto,
    @Request() req: any,
  ) {
    const result = await this.rxgptAdminService.giftUnlimitedToSpecialist(
      specialistId,
      giftUnlimitedDto.duration_days,
      giftUnlimitedDto.reason,
      req.user?._id,
    );
    return sendSuccessResponse('Unlimited access granted successfully', result);
  }

  /**
   * Revoke gifted credits from specialist
   * POST /rxgpt/specialists/:id/revoke-credits
   */
  @ApiOperation({ summary: 'Revoke gifted credits from a specialist', description: 'Removes all previously gifted (complimentary) RxGPT credits from a specialist. Only affects admin-gifted credits, not purchased credits. The reason is recorded in the audit log.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the specialist whose credits will be revoked', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Credits revoked successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid revocation data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Specialist not found' })
  @Post('specialists/:id/revoke-credits')
  async revokeCredits(
    @Param('id') specialistId: string,
    @Body() revokeDto: RevokeCreditsDto,
    @Request() req: any,
  ) {
    const result = await this.rxgptAdminService.revokeSpecialistCredits(
      specialistId,
      revokeDto.reason,
      req.user?._id,
    );
    return sendSuccessResponse('Credits revoked successfully', result);
  }

  /**
   * Bulk gift credits to multiple specialists
   * POST /rxgpt/specialists/bulk-gift
   */
  @ApiOperation({ summary: 'Bulk gift credits to multiple specialists', description: 'Awards complimentary RxGPT analysis credits to multiple specialists in a single operation. All recipients receive the same credit amount and expiry. Useful for team rewards or promotional campaigns.' })
  @ApiResponse({ status: 201, description: 'Credits gifted to all specialists successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid bulk gift data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Post('specialists/bulk-gift')
  async bulkGiftCredits(
    @Body() bulkGiftDto: BulkGiftCreditsDto,
    @Request() req: any,
  ) {
    const result = await this.rxgptAdminService.bulkGiftCredits(
      bulkGiftDto.specialist_ids,
      bulkGiftDto.credits,
      bulkGiftDto.expiry_days || null,
      bulkGiftDto.reason,
      req.user?._id,
    );
    return sendSuccessResponse('Credits gifted to all specialists successfully', result);
  }
}
