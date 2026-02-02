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

@Controller('api/wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: UnifiedWalletService) {}

  /**
   * Get wallet balance
   */
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
