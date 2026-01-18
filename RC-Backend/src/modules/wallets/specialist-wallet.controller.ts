import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SpecialistWalletService } from './specialist-wallet.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  TopUpWalletDto,
  VerifyTopUpDto,
  SpecialistWalletTransactionQueryDto,
} from './dto/specialist-wallet.dto';

@UseGuards(JwtAuthGuard)
@Controller('specialist/wallet')
export class SpecialistWalletController {
  constructor(
    private readonly specialistWalletService: SpecialistWalletService,
  ) {}

  /**
   * GET /api/specialist/wallet
   * Get wallet balance and summary
   */
  @Get()
  async getWallet(@Request() req) {
    const result = await this.specialistWalletService.getWalletBalance(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/wallet/stats
   * Get wallet statistics
   */
  @Get('stats')
  async getWalletStats(@Request() req) {
    const result = await this.specialistWalletService.getWalletStats(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/wallet/transactions
   * Get transaction history with pagination and filters
   */
  @Get('transactions')
  async getTransactions(
    @Request() req,
    @Query() query: SpecialistWalletTransactionQueryDto,
  ) {
    const result = await this.specialistWalletService.getTransactions(
      req.user.sub,
      query,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * POST /api/specialist/wallet/topup
   * Initialize wallet top-up payment
   */
  @Post('topup')
  async initializeTopUp(@Request() req, @Body() dto: TopUpWalletDto) {
    const result = await this.specialistWalletService.initializeTopUp(
      req.user.sub,
      req.user.email,
      dto,
    );
    return sendSuccessResponse(Messages.TRANSACTION_INITIALIZED, result);
  }

  /**
   * POST /api/specialist/wallet/topup/verify
   * Verify top-up payment and credit wallet
   */
  @Post('topup/verify')
  async verifyTopUp(@Request() req, @Body() dto: VerifyTopUpDto) {
    const result = await this.specialistWalletService.verifyTopUp(
      req.user.sub,
      dto.reference,
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

  /**
   * GET /api/specialist/wallet/check-balance
   * Check if sufficient balance for an amount
   */
  @Get('check-balance')
  async checkBalance(@Request() req, @Query('amount') amount: string) {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return sendSuccessResponse(Messages.RETRIEVED, {
        sufficient: false,
        message: 'Invalid amount',
      });
    }

    const hasSufficient = await this.specialistWalletService.hasSufficientBalance(
      req.user.sub,
      amountNum,
    );

    const wallet = await this.specialistWalletService.getWalletBalance(req.user.sub);

    return sendSuccessResponse(Messages.RETRIEVED, {
      sufficient: hasSufficient,
      available_balance: wallet.available_balance,
      required_amount: amountNum,
      shortfall: hasSufficient ? 0 : amountNum - wallet.available_balance,
    });
  }
}
