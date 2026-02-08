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
  @Get('settings')
  async getSettings() {
    const result = await this.rxgptAdminService.getSettings();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Update RxGPT settings
   * PATCH /rxgpt/settings
   */
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
  @Get('specialists/:id/credits')
  async getSpecialistCredits(@Param('id') specialistId: string) {
    const result = await this.rxgptAdminService.getSpecialistCreditDetails(specialistId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Gift credits to specialist
   * POST /rxgpt/specialists/:id/gift-credits
   */
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
