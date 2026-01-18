import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ClaudeSummaryCreditsService } from './claude-summary-credits.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PurchasePlanDto } from './dto/purchase-plan.dto';
import { TransferCreditsDto, SearchPatientsDto } from './dto/transfer-credits.dto';

@UseGuards(JwtAuthGuard)
@Controller('claude-summary')
export class ClaudeSummaryCreditsController {
  constructor(private readonly claudeSummaryCreditsService: ClaudeSummaryCreditsService) {}

  /**
   * Get user's credit status
   * GET /claude-summary/credits
   */
  @Get('credits')
  async getCreditStatus(@Request() req) {
    const result = await this.claudeSummaryCreditsService.getCreditStatus(req.user.sub);
    return sendSuccessResponse('Credit status retrieved', result);
  }

  /**
   * Get available plans for purchase
   * GET /claude-summary/plans
   */
  @Get('plans')
  async getPlans() {
    const plans = await this.claudeSummaryCreditsService.getActivePlans();
    return sendSuccessResponse('Plans retrieved', plans);
  }

  /**
   * Quick check if user can generate a summary
   * GET /claude-summary/can-generate
   */
  @Get('can-generate')
  async canGenerateSummary(@Request() req) {
    const result = await this.claudeSummaryCreditsService.canGenerateSummary(req.user.sub);
    return sendSuccessResponse('Availability checked', result);
  }

  /**
   * Purchase a plan via wallet
   * POST /claude-summary/purchase
   */
  @Post('purchase')
  async purchasePlan(@Body() purchasePlanDto: PurchasePlanDto, @Request() req) {
    const result = await this.claudeSummaryCreditsService.purchasePlan(
      req.user.sub,
      purchasePlanDto.plan_id,
    );
    return sendSuccessResponse('Plan purchased successfully', result);
  }

  /**
   * Get transaction history
   * GET /claude-summary/transactions
   */
  @Get('transactions')
  async getTransactionHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.claudeSummaryCreditsService.getTransactionHistory(
      req.user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return sendSuccessResponse('Transaction history retrieved', result);
  }

  // =====================
  // Credit Sharing Endpoints
  // =====================

  /**
   * Get credit sharing settings
   * GET /claude-summary/sharing/settings
   */
  @Get('sharing/settings')
  async getCreditSharingSettings() {
    const result = await this.claudeSummaryCreditsService.getCreditSharingSettings();
    return sendSuccessResponse('Credit sharing settings retrieved', result);
  }

  /**
   * Search patients for credit sharing
   * GET /claude-summary/sharing/search?query=john
   */
  @Get('sharing/search')
  async searchPatientsForSharing(
    @Request() req,
    @Query('query') query: string,
  ) {
    const patients = await this.claudeSummaryCreditsService.searchPatientsForCreditSharing(
      query,
      req.user.sub,
    );
    return sendSuccessResponse('Patients found', patients);
  }

  /**
   * Transfer credits to another patient
   * POST /claude-summary/sharing/transfer
   */
  @Post('sharing/transfer')
  async transferCredits(
    @Body() transferDto: TransferCreditsDto,
    @Request() req,
  ) {
    const result = await this.claudeSummaryCreditsService.transferCredits(
      req.user.sub,
      transferDto.recipient_id,
      transferDto.credits,
    );
    return sendSuccessResponse(result.message, result);
  }
}
