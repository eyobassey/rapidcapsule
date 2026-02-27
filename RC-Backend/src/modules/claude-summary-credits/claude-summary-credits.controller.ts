import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ClaudeSummaryCreditsService } from './claude-summary-credits.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PurchasePlanDto } from './dto/purchase-plan.dto';
import { TransferCreditsDto, SearchPatientsDto } from './dto/transfer-credits.dto';

@ApiTags('Claude Summary Credits')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('claude-summary')
export class ClaudeSummaryCreditsController {
  constructor(private readonly claudeSummaryCreditsService: ClaudeSummaryCreditsService) {}

  /**
   * Get user's credit status
   * GET /claude-summary/credits
   */
  @ApiOperation({ summary: 'Get credit status', description: 'Retrieve the current AI summary credit balance and usage for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Credit status returned' })
  @Get('credits')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  async getCreditStatus(@Request() req) {
    const result = await this.claudeSummaryCreditsService.getCreditStatus(req.user.sub);
    return sendSuccessResponse('Credit status retrieved', result);
  }

  /**
   * Get available plans for purchase
   * GET /claude-summary/plans
   */
  @ApiOperation({ summary: 'Get available plans', description: 'Retrieve all active AI summary credit plans available for purchase' })
  @ApiResponse({ status: 200, description: 'Credit plans returned' })
  @Get('plans')
  async getPlans() {
    const plans = await this.claudeSummaryCreditsService.getActivePlans();
    return sendSuccessResponse('Plans retrieved', plans);
  }

  /**
   * Quick check if user can generate a summary
   * GET /claude-summary/can-generate
   */
  @ApiOperation({ summary: 'Check generation availability', description: 'Quick check if the user has sufficient credits to generate an AI summary' })
  @ApiResponse({ status: 200, description: 'Availability status returned' })
  @Get('can-generate')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  async canGenerateSummary(@Request() req) {
    const result = await this.claudeSummaryCreditsService.canGenerateSummary(req.user.sub);
    return sendSuccessResponse('Availability checked', result);
  }

  /**
   * Purchase a plan via wallet
   * POST /claude-summary/purchase
   */
  @ApiOperation({ summary: 'Purchase credit plan', description: 'Purchase an AI summary credit plan using patient wallet balance' })
  @ApiResponse({ status: 201, description: 'Plan purchased and credits added' })
  @ApiResponse({ status: 400, description: 'Insufficient wallet balance or invalid plan' })
  @Post('purchase')
  async purchasePlan(@Body() purchasePlanDto: PurchasePlanDto, @Request() req) {
    const result = await this.claudeSummaryCreditsService.purchasePlan(
      req.user.sub,
      purchasePlanDto.plan_id,
    );
    return sendSuccessResponse('Plan purchased successfully', result);
  }

  /**
   * Purchase a plan for specialist (debits from specialist wallet)
   * POST /claude-summary/specialist/purchase
   */
  @ApiOperation({ summary: 'Purchase plan for specialist', description: 'Purchase an AI summary credit plan debited from the specialist wallet' })
  @ApiResponse({ status: 201, description: 'Plan purchased for specialist' })
  @ApiResponse({ status: 400, description: 'Insufficient specialist wallet balance or invalid plan' })
  @Post('specialist/purchase')
  async purchasePlanForSpecialist(@Body() purchasePlanDto: PurchasePlanDto, @Request() req) {
    const result = await this.claudeSummaryCreditsService.purchasePlanForSpecialist(
      req.user.sub,
      purchasePlanDto.plan_id,
    );
    return sendSuccessResponse('Plan purchased successfully', result);
  }

  /**
   * Get transaction history
   * GET /claude-summary/transactions
   */
  @ApiOperation({ summary: 'Get transaction history', description: 'Retrieve paginated credit purchase and usage transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history returned' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page', example: '20' })
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
  @ApiOperation({ summary: 'Get sharing settings', description: 'Retrieve credit sharing configuration including transfer limits and policies' })
  @ApiResponse({ status: 200, description: 'Credit sharing settings returned' })
  @Get('sharing/settings')
  async getCreditSharingSettings() {
    const result = await this.claudeSummaryCreditsService.getCreditSharingSettings();
    return sendSuccessResponse('Credit sharing settings retrieved', result);
  }

  /**
   * Search patients for credit sharing
   * GET /claude-summary/sharing/search?query=john
   */
  @ApiOperation({ summary: 'Search patients for sharing', description: 'Search patients by name or email to transfer credits to' })
  @ApiResponse({ status: 200, description: 'Matching patients returned' })
  @ApiQuery({ name: 'query', required: true, description: 'Search by patient name or email', example: 'Adaeze' })
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
  @ApiOperation({ summary: 'Transfer credits', description: 'Transfer AI summary credits to another patient' })
  @ApiResponse({ status: 201, description: 'Credits transferred successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient credits or invalid recipient' })
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
