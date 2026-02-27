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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
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

@ApiTags('Accounting Admin Wallet')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'List all wallets', description: 'Returns a paginated list of all wallets on the platform. Supports filtering by owner type and wallet status.' })
  @ApiResponse({ status: 200, description: 'Wallets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: '20' })
  @ApiQuery({ name: 'owner_type', required: false, description: 'Filter by owner type', enum: WalletOwnerType })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by wallet status', enum: WalletStatus })
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
  @ApiOperation({ summary: 'Get wallet details', description: 'Retrieves detailed information about a specific wallet including owner details and current balance.' })
  @ApiResponse({ status: 200, description: 'Wallet details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiParam({ name: 'id', description: 'Wallet ID', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
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
  @ApiOperation({ summary: 'Get wallet transactions', description: 'Retrieves paginated transaction history for a specific wallet. Supports filtering by category and date range.' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiParam({ name: 'id', description: 'Wallet ID', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
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
  @ApiOperation({ summary: 'Credit a wallet', description: 'Adds funds (NGN) to a wallet as an administrative adjustment. Records the admin ID and reason for audit.' })
  @ApiResponse({ status: 200, description: 'Wallet credited successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiParam({ name: 'id', description: 'Wallet ID to credit', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
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
  @ApiOperation({ summary: 'Debit a wallet', description: 'Removes funds (NGN) from a wallet as an administrative adjustment. Records the admin ID and reason for audit.' })
  @ApiResponse({ status: 200, description: 'Wallet debited successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiParam({ name: 'id', description: 'Wallet ID to debit', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
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
  @ApiOperation({ summary: 'Freeze a wallet', description: 'Freezes a wallet to block all operations. Requires a reason for audit purposes.' })
  @ApiResponse({ status: 200, description: 'Wallet frozen successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiParam({ name: 'id', description: 'Wallet ID to freeze', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
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
  @ApiOperation({ summary: 'Unfreeze a wallet', description: 'Removes the freeze on a wallet, restoring it to active status and re-enabling all operations.' })
  @ApiResponse({ status: 200, description: 'Wallet unfrozen successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiParam({ name: 'id', description: 'Wallet ID to unfreeze', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
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
  @ApiOperation({ summary: 'Suspend a wallet', description: 'Suspends a wallet, disabling transactions until reactivated. Requires a reason for audit purposes.' })
  @ApiResponse({ status: 200, description: 'Wallet suspended successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiParam({ name: 'id', description: 'Wallet ID to suspend', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
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
  @ApiOperation({ summary: 'Get chart of accounts', description: 'Returns the full chart of accounts hierarchy used by the double-entry accounting system.' })
  @ApiResponse({ status: 200, description: 'Chart of accounts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('/system/accounts')
  async getChartOfAccounts() {
    return this.chartOfAccountsService.getAccountHierarchy();
  }

  /**
   * Get account balance by code
   */
  @ApiOperation({ summary: 'Get account balance', description: 'Returns the current balance for a specific account in the chart of accounts, identified by its account code.' })
  @ApiResponse({ status: 200, description: 'Account balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'code', description: 'Account code from the chart of accounts', example: '1100' })
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
  @ApiOperation({ summary: 'Run wallet migration', description: 'Executes the one-time migration to move legacy wallet data into the unified accounting system. Should only be run once.' })
  @ApiResponse({ status: 200, description: 'Migration completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Post('/system/migrate')
  @HttpCode(HttpStatus.OK)
  async runMigration(@Req() req: AdminAuthenticatedRequest) {
    const result = await this.migrationService.runMigration();
    return result;
  }

  /**
   * Verify migration
   */
  @ApiOperation({ summary: 'Verify migration integrity', description: 'Validates the integrity of the migration by comparing legacy and unified wallet data to detect any discrepancies.' })
  @ApiResponse({ status: 200, description: 'Migration verification results returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('/system/migration/verify')
  async verifyMigration() {
    return this.migrationService.verifyMigration();
  }

  /**
   * Check if migration is complete
   */
  @ApiOperation({ summary: 'Get migration status', description: 'Returns whether the wallet migration from the legacy system has been completed.' })
  @ApiResponse({ status: 200, description: 'Migration status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get wallet stats summary', description: 'Returns aggregate statistics for all wallets grouped by owner type (patient vs specialist), including total balances, credits, and debits in NGN.' })
  @ApiResponse({ status: 200, description: 'Wallet statistics returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
