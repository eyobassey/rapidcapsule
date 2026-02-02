/**
 * Admin Wallet Controller
 *
 * Handles administrative wallet operations
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UnifiedWalletService } from '../services/unified-wallet.service';
import { MigrationService } from '../services/migration.service';
import { ChartOfAccountsService } from '../services/chart-of-accounts.service';
import { AccountingService } from '../services/accounting.service';
import {
  UnifiedWallet,
  UnifiedWalletDocument,
} from '../entities/unified-wallet.entity';
import {
  AdminAdjustmentDto,
  WalletTransactionsQueryDto,
} from '../dto/wallet-operations.dto';
import { WalletOwnerType, WalletStatus } from '../enums/account-codes.enum';

interface AdminAuthenticatedRequest {
  user: {
    _id: Types.ObjectId;
    user_type: string;
  };
  ip: string;
}

@Controller('admin-api/wallets')
@UseGuards(JwtAuthGuard)
export class AdminWalletController {
  constructor(
    @InjectModel(UnifiedWallet.name)
    private walletModel: Model<UnifiedWalletDocument>,
    private readonly walletService: UnifiedWalletService,
    private readonly migrationService: MigrationService,
    private readonly chartOfAccountsService: ChartOfAccountsService,
    private readonly accountingService: AccountingService,
  ) {}

  /**
   * List all wallets with pagination
   */
  @Get()
  async listWallets(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('owner_type') ownerType?: WalletOwnerType,
    @Query('status') status?: WalletStatus,
  ) {
    const filter: any = {};
    if (ownerType) filter.owner_type = ownerType;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [wallets, total] = await Promise.all([
      this.walletModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('owner_id', 'email profile.first_name profile.last_name'),
      this.walletModel.countDocuments(filter),
    ]);

    return {
      wallets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Get wallet details by ID
   */
  @Get(':id')
  async getWallet(@Param('id') id: string) {
    const wallet = await this.walletModel
      .findOne({ wallet_id: id })
      .populate('owner_id', 'email profile.first_name profile.last_name user_type');

    if (!wallet) {
      return { error: 'Wallet not found' };
    }

    const balance = await this.walletService.getBalance(wallet.wallet_id);
    return { wallet, balance };
  }

  /**
   * Get wallet transactions
   */
  @Get(':id/transactions')
  async getWalletTransactions(
    @Param('id') id: string,
    @Query() query: WalletTransactionsQueryDto,
  ) {
    return this.walletService.getTransactionHistory(id, query);
  }

  /**
   * Admin credit wallet
   */
  @Post(':id/credit')
  @HttpCode(HttpStatus.OK)
  async creditWallet(
    @Req() req: AdminAuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { amount: number; reason: string; notes?: string },
  ) {
    const batch = await this.walletService.adminAdjustment({
      wallet_id: id,
      amount: body.amount,
      reason: body.reason,
      admin_id: req.user._id,
      notes: body.notes,
    });

    return {
      success: true,
      batch_id: batch.batch_id,
      wallet_id: id,
      amount: body.amount,
      type: 'credit',
    };
  }

  /**
   * Admin debit wallet
   */
  @Post(':id/debit')
  @HttpCode(HttpStatus.OK)
  async debitWallet(
    @Req() req: AdminAuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { amount: number; reason: string; notes?: string },
  ) {
    const batch = await this.walletService.adminAdjustment({
      wallet_id: id,
      amount: -body.amount, // Negative for debit
      reason: body.reason,
      admin_id: req.user._id,
      notes: body.notes,
    });

    return {
      success: true,
      batch_id: batch.batch_id,
      wallet_id: id,
      amount: body.amount,
      type: 'debit',
    };
  }

  /**
   * Freeze wallet
   */
  @Post(':id/freeze')
  @HttpCode(HttpStatus.OK)
  async freezeWallet(
    @Req() req: AdminAuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    await this.walletService.freezeWallet(id, body.reason, req.user._id);
    return {
      success: true,
      wallet_id: id,
      status: WalletStatus.FROZEN,
    };
  }

  /**
   * Unfreeze wallet
   */
  @Post(':id/unfreeze')
  @HttpCode(HttpStatus.OK)
  async unfreezeWallet(
    @Req() req: AdminAuthenticatedRequest,
    @Param('id') id: string,
  ) {
    await this.walletService.unfreezeWallet(id, req.user._id);
    return {
      success: true,
      wallet_id: id,
      status: WalletStatus.ACTIVE,
    };
  }

  /**
   * Suspend wallet
   */
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendWallet(
    @Req() req: AdminAuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    await this.walletService.suspendWallet(id, body.reason, req.user._id);
    return {
      success: true,
      wallet_id: id,
      status: WalletStatus.SUSPENDED,
    };
  }

  /**
   * Get chart of accounts
   */
  @Get('/system/accounts')
  async getChartOfAccounts() {
    return this.chartOfAccountsService.getAccountHierarchy();
  }

  /**
   * Get account balance by code
   */
  @Get('/system/accounts/:code/balance')
  async getAccountBalance(@Param('code') code: string) {
    const balance = await this.accountingService.getAccountBalance(code);
    const account = await this.chartOfAccountsService.getAccountByCode(code);
    return {
      account,
      balance,
    };
  }

  /**
   * Run migration (one-time)
   */
  @Post('/system/migrate')
  @HttpCode(HttpStatus.OK)
  async runMigration(@Req() req: AdminAuthenticatedRequest) {
    const result = await this.migrationService.runMigration();
    return result;
  }

  /**
   * Verify migration
   */
  @Get('/system/migration/verify')
  async verifyMigration() {
    return this.migrationService.verifyMigration();
  }

  /**
   * Check if migration is complete
   */
  @Get('/system/migration/status')
  async getMigrationStatus() {
    const isComplete = await this.migrationService.isMigrationComplete();
    return {
      migrationComplete: isComplete,
    };
  }

  /**
   * Get wallet stats summary
   */
  @Get('/system/stats')
  async getWalletStats() {
    const [patientStats, specialistStats] = await Promise.all([
      this.walletModel.aggregate([
        { $match: { owner_type: WalletOwnerType.PATIENT } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total_balance: { $sum: '$available_balance' },
            total_credited: { $sum: '$total_credited' },
            total_debited: { $sum: '$total_debited' },
          },
        },
      ]),
      this.walletModel.aggregate([
        { $match: { owner_type: WalletOwnerType.SPECIALIST } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total_balance: { $sum: '$available_balance' },
            total_held: { $sum: '$held_balance' },
            total_credited: { $sum: '$total_credited' },
            total_debited: { $sum: '$total_debited' },
          },
        },
      ]),
    ]);

    return {
      patient: patientStats[0] || {
        count: 0,
        total_balance: 0,
        total_credited: 0,
        total_debited: 0,
      },
      specialist: specialistStats[0] || {
        count: 0,
        total_balance: 0,
        total_held: 0,
        total_credited: 0,
        total_debited: 0,
      },
    };
  }
}
