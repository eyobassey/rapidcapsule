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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
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

@ApiTags('Admin Finance')
@ApiBearerAuth('JWT-auth')
@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly migrationService: MigrationService,
  ) {}

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get finance dashboard', description: 'Retrieve key financial metrics including total wallet balances, transaction volumes, revenue summary, and outstanding liabilities.' })
  @ApiResponse({ status: 200, description: 'Finance dashboard metrics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getDashboard() {
    const result = await this.financeService.getDashboardMetrics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ==================== WALLETS ====================

  @Get('wallets')
  @ApiOperation({ summary: 'List wallets', description: 'Retrieve paginated list of all unified wallets with optional filters for owner type, status, and search.' })
  @ApiResponse({ status: 200, description: 'Wallets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getWallets(@Query() filters: WalletFilterDto) {
    const result = await this.financeService.getWallets(filters);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('wallets/:walletId')
  @ApiOperation({ summary: 'Get wallet by ID', description: 'Retrieve full details of a specific wallet including balance, status, and owner information.' })
  @ApiParam({ name: 'walletId', description: 'Unique wallet identifier', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getWallet(@Param('walletId') walletId: string) {
    const result = await this.financeService.getWalletById(walletId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('wallets/user/:userId')
  @ApiOperation({ summary: 'Get wallet by user ID', description: 'Retrieve the wallet belonging to a specific user, filtered by owner type (patient, specialist, pharmacy, or platform).' })
  @ApiParam({ name: 'userId', description: 'MongoDB ObjectId of the wallet owner', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'owner_type', required: true, enum: ['PATIENT', 'SPECIALIST', 'PHARMACY', 'PLATFORM'], description: 'Type of wallet owner', example: 'PATIENT' })
  @ApiResponse({ status: 200, description: 'User wallet retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Wallet not found for this user' })
  async getWalletByUser(
    @Param('userId') userId: string,
    @Query('owner_type') ownerType: WalletOwnerType,
  ) {
    const result = await this.financeService.getWalletByUserId(userId, ownerType);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('wallets/:walletId/status')
  @ApiOperation({ summary: 'Update wallet status', description: 'Change a wallet status (e.g., suspend, freeze, or reactivate) with a mandatory reason.' })
  @ApiParam({ name: 'walletId', description: 'Unique wallet identifier', example: 'WAL-PAT-507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Wallet status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async updateWalletStatus(
    @Param('walletId') walletId: string,
    @Body() dto: WalletStatusUpdateDto,
    @Request() req,
  ) {
    const result = await this.financeService.updateWalletStatus(walletId, dto, req.user.id);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Post('wallets/credit')
  @ApiOperation({ summary: 'Admin credit wallet', description: 'Credit a wallet with funds from an admin source (promotional, adjustment, or operating fund). Creates double-entry ledger records.' })
  @ApiResponse({ status: 200, description: 'Wallet credited successfully' })
  @ApiResponse({ status: 400, description: 'Invalid credit data or insufficient operating funds' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async creditWallet(@Body() dto: AdminWalletCreditDto, @Request() req) {
    const result = await this.financeService.adminCreditWallet(dto, req.user.id);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Post('wallets/debit')
  @ApiOperation({ summary: 'Admin debit wallet', description: 'Debit funds from a wallet for recovery, adjustment, or transfer to operating fund. Creates double-entry ledger records.' })
  @ApiResponse({ status: 200, description: 'Wallet debited successfully' })
  @ApiResponse({ status: 400, description: 'Invalid debit data or insufficient wallet balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async debitWallet(@Body() dto: AdminWalletDebitDto, @Request() req) {
    const result = await this.financeService.adminDebitWallet(dto, req.user.id);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  // ==================== TRANSACTIONS ====================

  @Get('transactions')
  @ApiOperation({ summary: 'List transactions', description: 'Retrieve paginated transaction batches with optional filters for category, status, wallet, user, date range, and search.' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getTransactions(@Query() filters: TransactionFilterDto) {
    const result = await this.financeService.getTransactions(filters);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('transactions/:batchId')
  @ApiOperation({ summary: 'Get transaction by batch ID', description: 'Retrieve full details of a specific transaction batch including all associated ledger entries.' })
  @ApiParam({ name: 'batchId', description: 'Unique transaction batch identifier', example: 'TXN-1709136000000-abc123' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Transaction batch not found' })
  async getTransaction(@Param('batchId') batchId: string) {
    const result = await this.financeService.getTransactionById(batchId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ==================== LEDGER ====================

  @Get('ledger')
  @ApiOperation({ summary: 'List ledger entries', description: 'Retrieve paginated ledger entries with optional filters for account code, batch ID, user, and date range.' })
  @ApiResponse({ status: 200, description: 'Ledger entries retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getLedgerEntries(@Query() filters: LedgerFilterDto) {
    const result = await this.financeService.getLedgerEntries(filters);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ==================== ACCOUNTS ====================

  @Get('accounts')
  @ApiOperation({ summary: 'List chart of accounts', description: 'Retrieve all accounts in the chart of accounts with their balances, types, and hierarchy.' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getAccounts() {
    const result = await this.financeService.getAccounts();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('accounts/:code')
  @ApiOperation({ summary: 'Get account by code', description: 'Retrieve details of a specific account by its account code (e.g., 1100.001.000 for Patient Wallet Pool).' })
  @ApiParam({ name: 'code', description: 'Account code in the chart of accounts', example: '1100.001.000' })
  @ApiResponse({ status: 200, description: 'Account retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccount(@Param('code') code: string) {
    const result = await this.financeService.getAccountByCode(code);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create a new account', description: 'Add a new account to the chart of accounts with a unique code, name, type, and optional parent for hierarchy.' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid account data or duplicate code' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async createAccount(@Body() dto: CreateAccountDto, @Request() req) {
    const result = await this.financeService.createAccount(dto, req.user.id);
    return sendSuccessResponse('Account created', result);
  }

  @Patch('accounts/:code')
  @ApiOperation({ summary: 'Update an account', description: 'Update the name, description, sub-type, or active status of an existing account.' })
  @ApiParam({ name: 'code', description: 'Account code to update', example: '5300.003.001' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateAccount(
    @Param('code') code: string,
    @Body() dto: UpdateAccountDto,
    @Request() req,
  ) {
    const result = await this.financeService.updateAccount(code, dto, req.user.id);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Delete('accounts/:code')
  @ApiOperation({ summary: 'Delete an account', description: 'Permanently remove an account from the chart of accounts. Only allowed for accounts with no ledger entries.' })
  @ApiParam({ name: 'code', description: 'Account code to delete', example: '5300.003.001' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Account has existing ledger entries and cannot be deleted' })
  async deleteAccount(@Param('code') code: string) {
    const result = await this.financeService.deleteAccount(code);
    return sendSuccessResponse('Account deleted', result);
  }

  @Get('accounts/:code/statement')
  @ApiOperation({ summary: 'Get account statement', description: 'Retrieve a statement of all ledger entries for a specific account within an optional date range and period.' })
  @ApiParam({ name: 'code', description: 'Account code to generate statement for', example: '4100.001.000' })
  @ApiResponse({ status: 200, description: 'Account statement retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountStatement(
    @Param('code') code: string,
    @Query() filters: ReportFilterDto,
  ) {
    const result = await this.financeService.getAccountStatement(code, filters);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ==================== JOURNAL ENTRIES ====================

  @Post('journal-entry')
  @ApiOperation({ summary: 'Create a manual journal entry', description: 'Create a double-entry journal entry with at least two lines that must balance (total debits = total credits). Used for adjustments and corrections.' })
  @ApiResponse({ status: 201, description: 'Journal entry created and posted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid journal entry - lines do not balance or missing required fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async createJournalEntry(@Body() dto: CreateJournalEntryDto, @Request() req) {
    const result = await this.financeService.createJournalEntry(dto, req.user.id);
    return sendSuccessResponse('Journal entry created', result);
  }

  @Post('fund-operating-account')
  @ApiOperation({ summary: 'Fund the platform operating account', description: 'Add funds to the platform operating account from an external source such as bank transfer, retained earnings, or capital injection.' })
  @ApiResponse({ status: 200, description: 'Operating account funded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid funding data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async fundOperatingAccount(@Body() dto: FundOperatingAccountDto, @Request() req) {
    const result = await this.financeService.fundOperatingAccount(dto, req.user.id);
    return sendSuccessResponse('Operating account funded', result);
  }

  // ==================== REPORTS ====================

  @Get('reports/trial-balance')
  @ApiOperation({ summary: 'Get trial balance', description: 'Retrieve the trial balance report showing all account balances grouped by type. Debits and credits must be equal.' })
  @ApiResponse({ status: 200, description: 'Trial balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getTrialBalance() {
    const result = await this.financeService.getTrialBalance();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('reports/revenue')
  @ApiOperation({ summary: 'Get revenue report', description: 'Retrieve revenue breakdown by category and period with optional date range filtering. Amounts in NGN.' })
  @ApiResponse({ status: 200, description: 'Revenue report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getRevenueReport(@Query() filters: ReportFilterDto) {
    const result = await this.financeService.getRevenueReport(filters);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('reports/reconciliation')
  @ApiOperation({ summary: 'Get reconciliation report', description: 'Retrieve the reconciliation report comparing wallet balances against ledger totals to identify discrepancies.' })
  @ApiResponse({ status: 200, description: 'Reconciliation report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getReconciliationReport() {
    const result = await this.financeService.getReconciliationReport();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ==================== MIGRATION ====================

  @Get('migration/status')
  @ApiOperation({ summary: 'Get migration status', description: 'Check the status of the legacy-to-unified finance data migration including progress counts and any errors.' })
  @ApiResponse({ status: 200, description: 'Migration status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getMigrationStatus() {
    const result = await this.migrationService.getMigrationStatus();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('migration/run')
  @ApiOperation({ summary: 'Run full migration', description: 'Execute the full migration from legacy wallet and transaction data to the unified finance system. This is idempotent and safe to re-run.' })
  @ApiResponse({ status: 200, description: 'Migration completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 500, description: 'Migration failed - check error details' })
  async runMigration() {
    const result = await this.migrationService.runFullMigration();
    return sendSuccessResponse('Migration completed', result);
  }
}
