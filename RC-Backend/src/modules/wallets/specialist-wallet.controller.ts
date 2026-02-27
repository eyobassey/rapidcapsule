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
  SpecialistWithdrawDto,
} from './dto/specialist-wallet.dto';
import {
  SpecialistTransactionType,
  SpecialistTransactionReference,
} from './entities/specialist-wallet-transaction.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Wallets (Specialist)')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({
    summary: 'Get wallet balance and summary',
    description: 'Retrieve the specialist wallet balance, held balance, and available balance summary.',
  })
  @ApiResponse({ status: 200, description: 'Wallet balance and summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({
    summary: 'Get wallet statistics',
    description: 'Retrieve aggregated wallet statistics including total earnings, total withdrawals, and transaction counts.',
  })
  @ApiResponse({ status: 200, description: 'Wallet statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({
    summary: 'Get transaction history',
    description: 'Retrieve paginated transaction history with optional filters for type, reference type, and date range.',
  })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({
    summary: 'Initialize wallet top-up',
    description: 'Initialize a Paystack payment transaction to top up the specialist wallet. Returns an authorization URL for payment. Minimum amount is 100 NGN.',
  })
  @ApiResponse({ status: 201, description: 'Top-up transaction initialized - returns Paystack authorization URL' })
  @ApiResponse({ status: 400, description: 'Invalid amount or below minimum (100 NGN)' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({
    summary: 'Verify top-up payment',
    description: 'Verify a Paystack payment reference and credit the specialist wallet upon successful verification.',
  })
  @ApiResponse({ status: 201, description: 'Top-up verified and wallet credited successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or already used payment reference' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Post('topup/verify')
  async verifyTopUp(@Request() req, @Body() dto: VerifyTopUpDto) {
    const result = await this.specialistWalletService.verifyTopUp(
      req.user.sub,
      dto.reference,
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

  /**
   * POST /api/specialist/wallet/withdraw
   * Withdraw funds to bank account
   */
  @ApiOperation({
    summary: 'Withdraw to bank account',
    description: 'Withdraw funds from the specialist wallet to a saved bank account. Minimum withdrawal is 100 NGN. Funds must be available (not held).',
  })
  @ApiResponse({ status: 201, description: 'Withdrawal initiated successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient available balance or invalid bank account' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Post('withdraw')
  async withdrawToBank(@Request() req, @Body() dto: SpecialistWithdrawDto) {
    const result = await this.specialistWalletService.withdrawToBank(
      req.user.sub,
      dto.bankId,
      dto.amount,
    );
    return sendSuccessResponse(Messages.WITHDRAW_SUCCESSFUL, result);
  }

  /**
   * GET /api/specialist/wallet/withdrawals
   * Get withdrawal history
   */
  @ApiOperation({
    summary: 'Get withdrawal history',
    description: 'Retrieve paginated history of all withdrawals from the specialist wallet.',
  })
  @ApiResponse({ status: 200, description: 'Withdrawal history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('withdrawals')
  async getWithdrawals(
    @Request() req,
    @Query() query: SpecialistWalletTransactionQueryDto,
  ) {
    const result = await this.specialistWalletService.getTransactions(
      req.user.sub,
      {
        ...query,
        type: SpecialistTransactionType.DEBIT,
        reference_type: SpecialistTransactionReference.WITHDRAWAL,
      },
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/wallet/check-balance
   * Check if sufficient balance for an amount
   */
  @ApiOperation({
    summary: 'Check sufficient balance',
    description: 'Check whether the specialist has sufficient available balance for a given amount. Returns the available balance, required amount, and any shortfall.',
  })
  @ApiQuery({ name: 'amount', required: true, type: Number, description: 'Amount in NGN to check against available balance', example: 5000 })
  @ApiResponse({ status: 200, description: 'Balance check completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
