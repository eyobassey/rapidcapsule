import {
  Controller,
  Get,
  Body,
  Request,
  UseGuards,
  Post,
  Query,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WithdrawFundDto } from './dto/withdraw-wallet-fund.dto';
import { FundWalletDto, VerifyFundingDto } from './dto/fund-wallet.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Wallets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @ApiOperation({
    summary: 'Get wallet balance',
    description: 'Retrieve the current wallet balance and earnings summary for the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Wallet balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('balance')
  async getWalletBalance(@Request() req) {
    const result = await this.walletsService.getUserEarnings(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get wallet transactions',
    description: 'Retrieve paginated wallet transaction history for the authenticated user.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (defaults to 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Records per page (defaults to 10)', example: 10 })
  @ApiResponse({ status: 200, description: 'Wallet transactions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get()
  async getUserWalletTransaction(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.walletsService.getWalletTransactions(
      req.user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Withdraw from wallet',
    description: 'Withdraw funds from the wallet to a saved bank account. Amount is in NGN.',
  })
  @ApiResponse({ status: 201, description: 'Withdrawal initiated successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid bank account' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Post('withdraw')
  async withdrawFromWallet(
    @Body() withdrawFundDto: WithdrawFundDto,
    @Request() req,
  ) {
    const result = await this.walletsService.withdrawFromWallet(
      withdrawFundDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.WITHDRAW_SUCCESSFUL, result);
  }

  @ApiOperation({
    summary: 'Initialize wallet funding',
    description: 'Initialize a Paystack payment transaction to fund the wallet. Returns an authorization URL for payment. Minimum amount is 100 NGN.',
  })
  @ApiResponse({ status: 201, description: 'Funding transaction initialized - returns Paystack authorization URL' })
  @ApiResponse({ status: 400, description: 'Invalid amount or below minimum' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Post('fund')
  async initializeFunding(@Body() fundWalletDto: FundWalletDto, @Request() req) {
    const result = await this.walletsService.initializeFunding(
      req.user.sub,
      req.user.email,
      fundWalletDto,
    );
    return sendSuccessResponse(Messages.TRANSACTION_INITIALIZED, result);
  }

  @ApiOperation({
    summary: 'Verify wallet funding',
    description: 'Verify a Paystack payment reference and credit the wallet upon successful verification.',
  })
  @ApiResponse({ status: 201, description: 'Funding verified and wallet credited successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or already used payment reference' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Post('fund/verify')
  async verifyFunding(@Body() verifyFundingDto: VerifyFundingDto, @Request() req) {
    const result = await this.walletsService.verifyFunding(
      req.user.sub,
      verifyFundingDto.reference,
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }
}
