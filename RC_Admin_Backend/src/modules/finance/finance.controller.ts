import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { MigrationService } from './services/migration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  WalletFilterDto,
  TransactionFilterDto,
  LedgerFilterDto,
  AdminWalletCreditDto,
  AdminWalletDebitDto,
  WalletStatusUpdateDto,
  ReportFilterDto,
  CreateJournalEntryDto,
  FundOperatingAccountDto,
  CreateAccountDto,
  UpdateAccountDto,
} from './dto/finance.dto';
import { WalletOwnerType } from './entities/unified-wallet.entity';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly migrationService: MigrationService,
  ) {}

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  async getDashboard() {
    const result = await this.financeService.getDashboardMetrics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ==================== WALLETS ====================

  @Get('wallets')
  async getWallets(@Query() filters: WalletFilterDto) {
    const result = await this.financeService.getWallets(filters);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('wallets/:walletId')
  async getWallet(@Param('walletId') walletId: string) {
    const result = await this.financeService.getWalletById(walletId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('wallets/user/:userId')
  async getWalletByUser(
    @Param('userId') userId: string,
    @Query('owner_type') ownerType: WalletOwnerType,
  ) {
    const result = await this.financeService.getWalletByUserId(userId, ownerType);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('wallets/:walletId/status')
  async updateWalletStatus(
    @Param('walletId') walletId: string,
    @Body() dto: WalletStatusUpdateDto,
    @Request() req,
  ) {
    const result = await this.financeService.updateWalletStatus(walletId, dto, req.user.id);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Post('wallets/credit')
  async creditWallet(@Body() dto: AdminWalletCreditDto, @Request() req) {
    const result = await this.financeService.adminCreditWallet(dto, req.user.id);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Post('wallets/debit')
  async debitWallet(@Body() dto: AdminWalletDebitDto, @Request() req) {
    const result = await this.financeService.adminDebitWallet(dto, req.user.id);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  // ==================== TRANSACTIONS ====================

  @Get('transactions')
  async getTransactions(@Query() filters: TransactionFilterDto) {
    const result = await this.financeService.getTransactions(filters);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('transactions/:batchId')
  async getTransaction(@Param('batchId') batchId: string) {
    const result = await this.financeService.getTransactionById(batchId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ==================== LEDGER ====================

  @Get('ledger')
  async getLedgerEntries(@Query() filters: LedgerFilterDto) {
    const result = await this.financeService.getLedgerEntries(filters);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ==================== ACCOUNTS ====================

  @Get('accounts')
  async getAccounts() {
    const result = await this.financeService.getAccounts();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('accounts/:code')
  async getAccount(@Param('code') code: string) {
    const result = await this.financeService.getAccountByCode(code);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('accounts')
  async createAccount(@Body() dto: CreateAccountDto, @Request() req) {
    const result = await this.financeService.createAccount(dto, req.user.id);
    return sendSuccessResponse('Account created', result);
  }

  @Patch('accounts/:code')
  async updateAccount(
    @Param('code') code: string,
    @Body() dto: UpdateAccountDto,
    @Request() req,
  ) {
    const result = await this.financeService.updateAccount(code, dto, req.user.id);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Delete('accounts/:code')
  async deleteAccount(@Param('code') code: string) {
    const result = await this.financeService.deleteAccount(code);
    return sendSuccessResponse('Account deleted', result);
  }

  @Get('accounts/:code/statement')
  async getAccountStatement(
    @Param('code') code: string,
    @Query() filters: ReportFilterDto,
  ) {
    const result = await this.financeService.getAccountStatement(code, filters);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ==================== JOURNAL ENTRIES ====================

  @Post('journal-entry')
  async createJournalEntry(@Body() dto: CreateJournalEntryDto, @Request() req) {
    const result = await this.financeService.createJournalEntry(dto, req.user.id);
    return sendSuccessResponse('Journal entry created', result);
  }

  @Post('fund-operating-account')
  async fundOperatingAccount(@Body() dto: FundOperatingAccountDto, @Request() req) {
    const result = await this.financeService.fundOperatingAccount(dto, req.user.id);
    return sendSuccessResponse('Operating account funded', result);
  }

  // ==================== REPORTS ====================

  @Get('reports/trial-balance')
  async getTrialBalance() {
    const result = await this.financeService.getTrialBalance();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('reports/revenue')
  async getRevenueReport(@Query() filters: ReportFilterDto) {
    const result = await this.financeService.getRevenueReport(filters);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('reports/reconciliation')
  async getReconciliationReport() {
    const result = await this.financeService.getReconciliationReport();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ==================== MIGRATION ====================

  @Get('migration/status')
  async getMigrationStatus() {
    const result = await this.migrationService.getMigrationStatus();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('migration/run')
  async runMigration() {
    const result = await this.migrationService.runFullMigration();
    return sendSuccessResponse('Migration completed', result);
  }
}
