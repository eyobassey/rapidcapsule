/**
 * Wallet Controller
 *
 * Handles user wallet operations (balance, top-up, transfer, etc.)
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Types } from 'mongoose';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UnifiedWalletService } from '../services/unified-wallet.service';
import {
  WalletTransactionsQueryDto,
  TransferFundsDto,
  HoldFundsDto,
} from '../dto/wallet-operations.dto';
import { WalletOwnerType, TransactionCategory } from '../enums/account-codes.enum';

interface AuthenticatedRequest {
  user: {
    _id: Types.ObjectId;
    user_type: string;
  };
  ip: string;
}

@ApiTags('Accounting Wallet')
@ApiBearerAuth('JWT-auth')
@Controller('api/wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: UnifiedWalletService) {}

  /**
   * Get wallet balance
   */
  @ApiOperation({ summary: 'Get wallet balance', description: 'Retrieves the current balance for the authenticated user\'s wallet. Creates a wallet automatically if one does not exist.' })
  @ApiResponse({ status: 200, description: 'Wallet balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get()
  async getBalance(@Req() req: AuthenticatedRequest) {
    const ownerType = this.getOwnerType(req.user.user_type);
    const wallet = await this.walletService.getOrCreateWallet(
      req.user._id,
      ownerType,
    );
    return this.walletService.getBalance(wallet.wallet_id);
  }

  /**
   * Get transaction history
   */
  @ApiOperation({ summary: 'Get transaction history', description: 'Retrieves paginated transaction history for the authenticated user\'s wallet. Supports filtering by category and date range.' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('transactions')
  async getTransactions(
    @Req() req: AuthenticatedRequest,
    @Query() query: WalletTransactionsQueryDto,
  ) {
    const ownerType = this.getOwnerType(req.user.user_type);
    const wallet = await this.walletService.getOrCreateWallet(
      req.user._id,
      ownerType,
    );
    return this.walletService.getTransactionHistory(wallet.wallet_id, query);
  }

  /**
   * Initialize wallet top-up (Paystack)
   * Returns Paystack authorization URL
   */
  @ApiOperation({ summary: 'Initialize wallet top-up', description: 'Initializes a wallet top-up via Paystack. Returns an authorization URL for the user to complete payment.' })
  @ApiResponse({ status: 200, description: 'Top-up initialized, Paystack authorization URL returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Post('topup/initialize')
  @HttpCode(HttpStatus.OK)
  async initializeTopup(
    @Req() req: AuthenticatedRequest,
    @Body() body: { amount: number },
  ) {
    // This would integrate with Paystack service
    // For now, return a placeholder
    const ownerType = this.getOwnerType(req.user.user_type);
    const wallet = await this.walletService.getOrCreateWallet(
      req.user._id,
      ownerType,
    );

    return {
      wallet_id: wallet.wallet_id,
      amount: body.amount,
      message: 'Top-up initialization endpoint - integrate with Paystack',
    };
  }

  /**
   * Verify top-up payment (Paystack callback)
   */
  @ApiOperation({ summary: 'Verify top-up payment', description: 'Verifies a Paystack top-up payment using the transaction reference and credits the wallet on success.' })
  @ApiResponse({ status: 200, description: 'Payment verified and wallet credited' })
  @ApiResponse({ status: 400, description: 'Invalid or failed payment reference' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Post('topup/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTopup(
    @Req() req: AuthenticatedRequest,
    @Body() body: { reference: string },
  ) {
    // This would verify with Paystack and credit the wallet
    // For now, return a placeholder
    const ownerType = this.getOwnerType(req.user.user_type);
    const wallet = await this.walletService.getOrCreateWallet(
      req.user._id,
      ownerType,
    );

    return {
      wallet_id: wallet.wallet_id,
      reference: body.reference,
      message: 'Top-up verification endpoint - integrate with Paystack',
    };
  }

  /**
   * Transfer to another user's wallet
   */
  @ApiOperation({ summary: 'Transfer funds to another wallet', description: 'Transfers NGN funds from the authenticated user\'s wallet to another user\'s wallet.' })
  @ApiResponse({ status: 200, description: 'Transfer completed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid wallet' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  async transfer(
    @Req() req: AuthenticatedRequest,
    @Body() body: { to_wallet_id: string; amount: number; description?: string },
  ) {
    const ownerType = this.getOwnerType(req.user.user_type);
    const fromWallet = await this.walletService.getOrCreateWallet(
      req.user._id,
      ownerType,
    );

    const batch = await this.walletService.transfer({
      from_wallet_id: fromWallet.wallet_id,
      to_wallet_id: body.to_wallet_id,
      amount: body.amount,
      description: body.description || 'Wallet transfer',
      performed_by: req.user._id,
    });

    return {
      success: true,
      batch_id: batch.batch_id,
      from_wallet: fromWallet.wallet_id,
      to_wallet: body.to_wallet_id,
      amount: body.amount,
    };
  }

  /**
   * Hold funds (specialists only - for prescriptions)
   */
  @ApiOperation({ summary: 'Hold funds in wallet', description: 'Places a hold on funds in the specialist\'s wallet, typically for prescription escrow. Only available for specialist users.' })
  @ApiResponse({ status: 200, description: 'Funds held successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - only specialists can hold funds' })
  @Post('hold')
  @HttpCode(HttpStatus.OK)
  async holdFunds(@Req() req: AuthenticatedRequest, @Body() body: HoldFundsDto) {
    if (req.user.user_type !== 'Specialist') {
      return {
        success: false,
        message: 'Hold operation only available for specialists',
      };
    }

    const wallet = await this.walletService.getOrCreateWallet(
      req.user._id,
      WalletOwnerType.SPECIALIST,
    );

    const batch = await this.walletService.hold({
      ...body,
      wallet_id: wallet.wallet_id,
      performed_by: req.user._id,
    });

    return {
      success: true,
      batch_id: batch.batch_id,
      wallet_id: wallet.wallet_id,
      amount: body.amount,
    };
  }

  /**
   * Release held funds (specialists only)
   */
  @ApiOperation({ summary: 'Release held funds', description: 'Releases previously held funds in the specialist\'s wallet, identified by reference type and ID. Only available for specialist users.' })
  @ApiResponse({ status: 200, description: 'Held funds released successfully' })
  @ApiResponse({ status: 400, description: 'No matching hold found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - only specialists can release funds' })
  @ApiParam({ name: 'referenceType', description: 'Type of the original hold reference (e.g. prescription)', example: 'prescription' })
  @ApiParam({ name: 'referenceId', description: 'ID of the original hold reference', example: '507f1f77bcf86cd799439011' })
  @Post('release/:referenceType/:referenceId')
  @HttpCode(HttpStatus.OK)
  async releaseFunds(
    @Req() req: AuthenticatedRequest,
    @Param('referenceType') referenceType: string,
    @Param('referenceId') referenceId: string,
    @Body() body: { reason?: string },
  ) {
    if (req.user.user_type !== 'Specialist') {
      return {
        success: false,
        message: 'Release operation only available for specialists',
      };
    }

    const wallet = await this.walletService.getOrCreateWallet(
      req.user._id,
      WalletOwnerType.SPECIALIST,
    );

    const batch = await this.walletService.release({
      wallet_id: wallet.wallet_id,
      hold_reference_type: referenceType,
      hold_reference_id: new Types.ObjectId(referenceId),
      reason: body.reason,
      performed_by: req.user._id,
    });

    return {
      success: true,
      batch_id: batch.batch_id,
      wallet_id: wallet.wallet_id,
    };
  }

  /**
   * Withdraw to bank account
   */
  @ApiOperation({ summary: 'Withdraw to bank account', description: 'Initiates a withdrawal from the user\'s wallet to their bank account via Paystack transfers.' })
  @ApiResponse({ status: 200, description: 'Withdrawal initiated successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid bank details' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  async withdraw(
    @Req() req: AuthenticatedRequest,
    @Body() body: { amount: number; bank_code: string; account_number: string },
  ) {
    // This would integrate with Paystack transfers
    const ownerType = this.getOwnerType(req.user.user_type);
    const wallet = await this.walletService.getOrCreateWallet(
      req.user._id,
      ownerType,
    );

    return {
      wallet_id: wallet.wallet_id,
      amount: body.amount,
      message: 'Withdrawal endpoint - integrate with Paystack transfers',
    };
  }

  /**
   * Map user type to wallet owner type
   */
  private getOwnerType(userType: string): WalletOwnerType {
    switch (userType) {
      case 'Specialist':
        return WalletOwnerType.SPECIALIST;
      case 'Patient':
      default:
        return WalletOwnerType.PATIENT;
    }
  }
}
