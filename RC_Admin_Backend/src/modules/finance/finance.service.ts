import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { UnifiedWallet, UnifiedWalletDocument, WalletOwnerType, WalletStatus } from './entities/unified-wallet.entity';
import { LedgerEntry, LedgerEntryDocument, EntryType, EntryStatus } from './entities/ledger-entry.entity';
import { TransactionBatch, TransactionBatchDocument, TransactionCategory, BatchStatus } from './entities/transaction-batch.entity';
import { Account, AccountDocument, AccountType, NormalBalance } from './entities/account.entity';
import {
  WalletFilterDto,
  TransactionFilterDto,
  LedgerFilterDto,
  AdminWalletCreditDto,
  AdminWalletDebitDto,
  WalletStatusUpdateDto,
  ReportFilterDto,
  AdminCreditSource,
  AdminDebitDestination,
  CreateJournalEntryDto,
  FundOperatingAccountDto,
  CreateAccountDto,
  UpdateAccountDto,
} from './dto/finance.dto';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectModel(UnifiedWallet.name) private walletModel: Model<UnifiedWalletDocument>,
    @InjectModel(LedgerEntry.name) private ledgerModel: Model<LedgerEntryDocument>,
    @InjectModel(TransactionBatch.name) private batchModel: Model<TransactionBatchDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  // ==================== DASHBOARD ====================

  async getDashboardMetrics() {
    const [
      totalWallets,
      walletsByType,
      totalBalance,
      recentTransactions,
      transactionsByCategory,
      accountBalances,
    ] = await Promise.all([
      this.walletModel.countDocuments(),
      this.walletModel.aggregate([
        { $group: { _id: '$owner_type', count: { $sum: 1 }, total_balance: { $sum: { $add: ['$available_balance', '$held_balance', '$pending_balance'] } } } },
      ]),
      this.walletModel.aggregate([
        { $group: { _id: null, total: { $sum: { $add: ['$available_balance', '$held_balance', '$pending_balance'] } } } },
      ]),
      this.batchModel.find({ status: BatchStatus.POSTED }).sort({ created_at: -1 }).limit(10).lean(),
      this.batchModel.aggregate([
        { $match: { status: BatchStatus.POSTED } },
        { $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$total_debits' } } },
        { $sort: { count: -1 } },
      ]),
      this.accountModel.find({ is_active: true }).select('code name type current_balance').lean(),
    ]);

    // Get 30-day transaction volume
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactionVolume = await this.batchModel.aggregate([
      { $match: { status: BatchStatus.POSTED, created_at: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, count: { $sum: 1 }, volume: { $sum: '$total_debits' } } },
      { $sort: { _id: 1 } },
    ]);

    return {
      summary: {
        total_wallets: totalWallets,
        total_balance: totalBalance[0]?.total || 0,
        wallets_by_type: walletsByType.reduce((acc, w) => {
          acc[w._id] = { count: w.count, balance: w.total_balance };
          return acc;
        }, {}),
      },
      transactions: {
        by_category: transactionsByCategory,
        recent: recentTransactions,
        volume_30d: transactionVolume,
      },
      accounts: {
        balances: accountBalances,
      },
    };
  }

  // ==================== WALLETS ====================

  async getWallets(filters: WalletFilterDto) {
    const { page = 1, limit = 20, owner_type, status, search, sort_by = 'created_at', sort_order = 'desc' } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (owner_type) query.owner_type = owner_type;
    if (status) query.status = status;

    const [wallets, total] = await Promise.all([
      this.walletModel
        .find(query)
        .populate('owner_id', 'email profile')
        .sort({ [sort_by]: sort_order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.walletModel.countDocuments(query),
    ]);

    return {
      data: wallets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getWalletById(walletId: string) {
    const wallet = await this.walletModel
      .findOne({ wallet_id: walletId })
      .populate('owner_id', 'email profile professional_practice user_type')
      .lean();

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Get recent transactions for this wallet
    const recentTransactions = await this.batchModel
      .find({
        $or: [{ from_wallet: wallet._id }, { to_wallet: wallet._id }],
        status: BatchStatus.POSTED,
      })
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    // Get transaction stats
    const stats = await this.batchModel.aggregate([
      {
        $match: {
          $or: [{ from_wallet: wallet._id }, { to_wallet: wallet._id }],
          status: BatchStatus.POSTED,
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          total: { $sum: '$total_debits' },
        },
      },
    ]);

    return {
      wallet,
      recent_transactions: recentTransactions,
      transaction_stats: stats,
    };
  }

  async getWalletByUserId(userId: string, ownerType: WalletOwnerType) {
    const wallet = await this.walletModel
      .findOne({ owner_id: new Types.ObjectId(userId), owner_type: ownerType })
      .populate('owner_id', 'email profile professional_practice user_type')
      .lean();

    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    return this.getWalletById(wallet.wallet_id);
  }

  async updateWalletStatus(walletId: string, dto: WalletStatusUpdateDto, adminId: string) {
    const wallet = await this.walletModel.findOne({ wallet_id: walletId });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    wallet.status = dto.status;
    wallet.status_reason = dto.reason;
    wallet.status_changed_at = new Date();
    wallet.status_changed_by = new Types.ObjectId(adminId);

    await wallet.save();

    this.logger.log(`Wallet ${walletId} status updated to ${dto.status} by admin ${adminId}`);

    return wallet;
  }

  async adminCreditWallet(dto: AdminWalletCreditDto, adminId: string) {
    const wallet = await this.walletModel.findOne({ wallet_id: dto.wallet_id });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new BadRequestException('Cannot credit inactive wallet');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Generate batch and entry IDs
      const batchId = await this.generateBatchId();
      const entryId1 = await this.generateEntryId();
      const entryId2 = await this.generateEntryId();

      // Determine accounts based on wallet type and credit source
      const liabilityAccountCode = this.getWalletLiabilityAccount(wallet.owner_type);
      const sourceAccountCode = this.getAdminCreditSourceAccount(dto.source || AdminCreditSource.OPERATING_FUND);

      // Get current account balances
      const [liabilityAccount, sourceAccount] = await Promise.all([
        this.accountModel.findOne({ code: liabilityAccountCode }).session(session),
        this.accountModel.findOne({ code: sourceAccountCode }).session(session),
      ]);

      if (!liabilityAccount || !sourceAccount) {
        throw new BadRequestException('Required accounts not found');
      }

      // Determine if source is an expense (increases with debit) or asset (decreases with credit)
      const isExpenseSource = sourceAccount.type === AccountType.EXPENSE;

      // Create the batch
      const batch = new this.batchModel({
        batch_id: batchId,
        category: TransactionCategory.ADMIN_CREDIT,
        description: `Admin credit: ${dto.reason}`,
        total_debits: dto.amount,
        total_credits: dto.amount,
        is_balanced: true,
        entry_count: 2,
        currency: 'NGN',
        status: BatchStatus.POSTED,
        to_user: wallet.owner_id,
        to_wallet: wallet._id,
        performed_by: new Types.ObjectId(adminId),
        posted_at: new Date(),
        notes: dto.notes,
        metadata: { admin_action: true, credit_source: dto.source || AdminCreditSource.OPERATING_FUND },
      });

      await batch.save({ session });

      // Create ledger entries
      // For expense accounts: DEBIT increases the expense (money spent)
      // For asset accounts (Operating Fund): CREDIT decreases the asset (money leaving)
      const entries = [
        {
          entry_id: entryId1,
          batch_id: batchId,
          account_code: sourceAccountCode,
          entry_type: isExpenseSource ? EntryType.DEBIT : EntryType.CREDIT,
          amount: dto.amount,
          currency: 'NGN',
          balance_before: sourceAccount.current_balance,
          balance_after: isExpenseSource
            ? sourceAccount.current_balance + dto.amount  // Expense increases
            : sourceAccount.current_balance - dto.amount, // Asset decreases
          description: `Admin credit to ${wallet.wallet_id}: ${dto.reason}`,
          status: EntryStatus.POSTED,
          user_id: wallet.owner_id,
          wallet_id: wallet._id,
          performed_by: new Types.ObjectId(adminId),
        },
        {
          entry_id: entryId2,
          batch_id: batchId,
          account_code: liabilityAccountCode,
          entry_type: EntryType.CREDIT,
          amount: dto.amount,
          currency: 'NGN',
          balance_before: liabilityAccount.current_balance,
          balance_after: liabilityAccount.current_balance + dto.amount,
          description: `Admin credit to ${wallet.wallet_id}: ${dto.reason}`,
          status: EntryStatus.POSTED,
          user_id: wallet.owner_id,
          wallet_id: wallet._id,
          performed_by: new Types.ObjectId(adminId),
        },
      ];

      await this.ledgerModel.insertMany(entries, { session });

      // Update account balances
      await this.accountModel.updateOne(
        { code: sourceAccountCode },
        {
          $inc: { current_balance: isExpenseSource ? dto.amount : -dto.amount },
          balance_updated_at: new Date(),
        },
        { session },
      );

      await this.accountModel.updateOne(
        { code: liabilityAccountCode },
        { $inc: { current_balance: dto.amount }, balance_updated_at: new Date() },
        { session },
      );

      // Update wallet balance
      wallet.available_balance += dto.amount;
      wallet.total_credited += dto.amount;
      wallet.last_credit_at = new Date();
      wallet.last_transaction_at = new Date();
      wallet.transaction_count += 1;

      await wallet.save({ session });

      await session.commitTransaction();

      this.logger.log(`Admin ${adminId} credited wallet ${dto.wallet_id} with ₦${dto.amount} from ${dto.source || 'OPERATING_FUND'}`);

      return { success: true, batch_id: batchId, new_balance: wallet.available_balance, source: dto.source || AdminCreditSource.OPERATING_FUND };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async adminDebitWallet(dto: AdminWalletDebitDto, adminId: string) {
    const wallet = await this.walletModel.findOne({ wallet_id: dto.wallet_id });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new BadRequestException('Cannot debit inactive wallet');
    }

    if (wallet.available_balance < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const batchId = await this.generateBatchId();
      const entryId1 = await this.generateEntryId();
      const entryId2 = await this.generateEntryId();

      const liabilityAccountCode = this.getWalletLiabilityAccount(wallet.owner_type);
      const destinationAccountCode = this.getAdminDebitDestinationAccount(dto.destination || AdminDebitDestination.OPERATING_FUND);

      const [liabilityAccount, destinationAccount] = await Promise.all([
        this.accountModel.findOne({ code: liabilityAccountCode }).session(session),
        this.accountModel.findOne({ code: destinationAccountCode }).session(session),
      ]);

      if (!liabilityAccount || !destinationAccount) {
        throw new BadRequestException('Required accounts not found');
      }

      // Determine if destination is revenue (increases with credit) or asset (increases with debit)
      const isRevenueDestination = destinationAccount.type === AccountType.REVENUE;

      const batch = new this.batchModel({
        batch_id: batchId,
        category: TransactionCategory.ADMIN_DEBIT,
        description: `Admin debit: ${dto.reason}`,
        total_debits: dto.amount,
        total_credits: dto.amount,
        is_balanced: true,
        entry_count: 2,
        currency: 'NGN',
        status: BatchStatus.POSTED,
        from_user: wallet.owner_id,
        from_wallet: wallet._id,
        performed_by: new Types.ObjectId(adminId),
        posted_at: new Date(),
        notes: dto.notes,
        metadata: { admin_action: true, debit_destination: dto.destination || AdminDebitDestination.OPERATING_FUND },
      });

      await batch.save({ session });

      // Create ledger entries
      // Liability decreases (DEBIT)
      // For revenue accounts: CREDIT increases the revenue (money received)
      // For asset accounts (Operating Fund): DEBIT increases the asset (money coming in)
      const entries = [
        {
          entry_id: entryId1,
          batch_id: batchId,
          account_code: liabilityAccountCode,
          entry_type: EntryType.DEBIT,
          amount: dto.amount,
          currency: 'NGN',
          balance_before: liabilityAccount.current_balance,
          balance_after: liabilityAccount.current_balance - dto.amount,
          description: `Admin debit from ${wallet.wallet_id}: ${dto.reason}`,
          status: EntryStatus.POSTED,
          user_id: wallet.owner_id,
          wallet_id: wallet._id,
          performed_by: new Types.ObjectId(adminId),
        },
        {
          entry_id: entryId2,
          batch_id: batchId,
          account_code: destinationAccountCode,
          entry_type: isRevenueDestination ? EntryType.CREDIT : EntryType.DEBIT,
          amount: dto.amount,
          currency: 'NGN',
          balance_before: destinationAccount.current_balance,
          balance_after: destinationAccount.current_balance + dto.amount, // Both revenue and asset increase
          description: `Admin debit from ${wallet.wallet_id}: ${dto.reason}`,
          status: EntryStatus.POSTED,
          user_id: wallet.owner_id,
          wallet_id: wallet._id,
          performed_by: new Types.ObjectId(adminId),
        },
      ];

      await this.ledgerModel.insertMany(entries, { session });

      await this.accountModel.updateOne(
        { code: liabilityAccountCode },
        { $inc: { current_balance: -dto.amount }, balance_updated_at: new Date() },
        { session },
      );

      await this.accountModel.updateOne(
        { code: destinationAccountCode },
        { $inc: { current_balance: dto.amount }, balance_updated_at: new Date() },
        { session },
      );

      wallet.available_balance -= dto.amount;
      wallet.total_debited += dto.amount;
      wallet.last_debit_at = new Date();
      wallet.last_transaction_at = new Date();
      wallet.transaction_count += 1;

      await wallet.save({ session });

      await session.commitTransaction();

      this.logger.log(`Admin ${adminId} debited wallet ${dto.wallet_id} by ₦${dto.amount} to ${dto.destination || 'OPERATING_FUND'}`);

      return { success: true, batch_id: batchId, new_balance: wallet.available_balance, destination: dto.destination || AdminDebitDestination.OPERATING_FUND };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ==================== TRANSACTIONS ====================

  async getTransactions(filters: TransactionFilterDto) {
    const { page = 1, limit = 20, category, status, wallet_id, user_id, start_date, end_date, search } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (category) query.category = category;
    if (status) query.status = status;

    if (wallet_id) {
      const wallet = await this.walletModel.findOne({ wallet_id }).select('_id');
      if (wallet) {
        query.$or = [{ from_wallet: wallet._id }, { to_wallet: wallet._id }];
      }
    }

    if (user_id) {
      const userId = new Types.ObjectId(user_id);
      query.$or = [...(query.$or || []), { from_user: userId }, { to_user: userId }];
    }

    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) query.created_at.$gte = new Date(start_date);
      if (end_date) query.created_at.$lte = new Date(end_date);
    }

    if (search) {
      query.$or = [
        { batch_id: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { external_reference: { $regex: search, $options: 'i' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      this.batchModel
        .find(query)
        .populate('from_user', 'email profile')
        .populate('to_user', 'email profile')
        .populate('performed_by', 'email profile')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.batchModel.countDocuments(query),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionById(batchId: string) {
    const batch = await this.batchModel
      .findOne({ batch_id: batchId })
      .populate('from_user', 'email profile')
      .populate('to_user', 'email profile')
      .populate('performed_by', 'email profile')
      .lean();

    if (!batch) {
      throw new NotFoundException('Transaction not found');
    }

    const entries = await this.ledgerModel
      .find({ batch_id: batchId })
      .sort({ entry_type: 1 })
      .lean();

    return {
      batch,
      entries,
    };
  }

  // ==================== LEDGER ====================

  async getLedgerEntries(filters: LedgerFilterDto) {
    const { page = 1, limit = 50, account_code, batch_id, user_id, start_date, end_date } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (account_code) query.account_code = account_code;
    if (batch_id) query.batch_id = batch_id;
    if (user_id) query.user_id = new Types.ObjectId(user_id);

    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) query.created_at.$gte = new Date(start_date);
      if (end_date) query.created_at.$lte = new Date(end_date);
    }

    const [entries, total] = await Promise.all([
      this.ledgerModel
        .find(query)
        .populate('user_id', 'email profile')
        .populate('performed_by', 'email profile')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.ledgerModel.countDocuments(query),
    ]);

    return {
      data: entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== ACCOUNTS ====================

  async getAccounts() {
    return this.accountModel.find({ is_active: true }).sort({ code: 1 }).lean();
  }

  async getAccountByCode(code: string) {
    const account = await this.accountModel.findOne({ code }).lean();
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async createAccount(dto: CreateAccountDto, adminId: string) {
    // Validate account code format (XXXX.XXX.XXX)
    const codeRegex = /^\d{4}\.\d{3}\.\d{3}$/;
    if (!codeRegex.test(dto.code)) {
      throw new BadRequestException('Account code must be in format XXXX.XXX.XXX (e.g., 5300.003.001)');
    }

    // Check if account code already exists
    const existing = await this.accountModel.findOne({ code: dto.code });
    if (existing) {
      throw new BadRequestException(`Account with code ${dto.code} already exists`);
    }

    // Determine normal balance based on account type
    const normalBalance = this.getNormalBalanceForType(dto.type);

    // Create the account
    const account = new this.accountModel({
      code: dto.code,
      name: dto.name,
      description: dto.description || '',
      type: dto.type,
      sub_type: dto.sub_type,
      normal_balance: normalBalance,
      parent_code: dto.parent_code,
      currency: 'NGN',
      is_active: true,
      is_system_account: false, // User-created accounts are not system accounts
      current_balance: 0,
    });

    await account.save();

    this.logger.log(`Account ${dto.code} created by admin ${adminId}`);

    return account;
  }

  async updateAccount(code: string, dto: UpdateAccountDto, adminId: string) {
    const account = await this.accountModel.findOne({ code });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Don't allow updating system accounts' critical fields
    if (account.is_system_account && dto.is_active === false) {
      throw new BadRequestException('Cannot deactivate system accounts');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.sub_type) updateData.sub_type = dto.sub_type;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    const updated = await this.accountModel.findOneAndUpdate(
      { code },
      { $set: updateData },
      { new: true },
    );

    this.logger.log(`Account ${code} updated by admin ${adminId}`);

    return updated;
  }

  async deleteAccount(code: string) {
    const account = await this.accountModel.findOne({ code });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Don't allow deleting system accounts
    if (account.is_system_account) {
      throw new BadRequestException('Cannot delete system accounts');
    }

    // Check if account has any ledger entries
    const hasEntries = await this.ledgerModel.exists({ account_code: code });
    if (hasEntries) {
      throw new BadRequestException('Cannot delete account with existing ledger entries. Deactivate it instead.');
    }

    // Check if account has non-zero balance
    if (account.current_balance !== 0) {
      throw new BadRequestException('Cannot delete account with non-zero balance');
    }

    await this.accountModel.deleteOne({ code });

    return { deleted: true, code };
  }

  private getNormalBalanceForType(type: string): string {
    // Assets and Expenses have DEBIT normal balance
    // Liabilities, Equity, and Revenue have CREDIT normal balance
    if (type === 'ASSET' || type === 'EXPENSE') {
      return 'DEBIT';
    }
    return 'CREDIT';
  }

  async getAccountStatement(accountCode: string, filters: ReportFilterDto) {
    const account = await this.accountModel.findOne({ code: accountCode });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const query: any = { account_code: accountCode };

    if (filters.start_date || filters.end_date) {
      query.created_at = {};
      if (filters.start_date) query.created_at.$gte = new Date(filters.start_date);
      if (filters.end_date) query.created_at.$lte = new Date(filters.end_date);
    }

    const entries = await this.ledgerModel
      .find(query)
      .sort({ created_at: 1 })
      .lean();

    // Calculate running balance
    let runningBalance = 0;
    const statementEntries = entries.map((entry) => {
      if (entry.entry_type === EntryType.DEBIT) {
        runningBalance += account.normal_balance === NormalBalance.DEBIT ? entry.amount : -entry.amount;
      } else {
        runningBalance += account.normal_balance === NormalBalance.CREDIT ? entry.amount : -entry.amount;
      }

      return {
        ...entry,
        running_balance: runningBalance,
      };
    });

    return {
      account,
      entries: statementEntries,
      summary: {
        opening_balance: 0,
        total_debits: entries.filter((e) => e.entry_type === EntryType.DEBIT).reduce((sum, e) => sum + e.amount, 0),
        total_credits: entries.filter((e) => e.entry_type === EntryType.CREDIT).reduce((sum, e) => sum + e.amount, 0),
        closing_balance: account.current_balance,
      },
    };
  }

  // ==================== REPORTS ====================

  async getTrialBalance() {
    const accounts = await this.accountModel.find({ is_active: true }).sort({ code: 1 }).lean();

    let totalDebits = 0;
    let totalCredits = 0;

    const balances = accounts.map((account) => {
      const balance = account.current_balance;
      const debit = account.normal_balance === NormalBalance.DEBIT ? balance : 0;
      const credit = account.normal_balance === NormalBalance.CREDIT ? balance : 0;

      totalDebits += debit;
      totalCredits += credit;

      return {
        code: account.code,
        name: account.name,
        type: account.type,
        debit,
        credit,
        balance,
      };
    });

    return {
      generated_at: new Date(),
      accounts: balances,
      totals: {
        debits: totalDebits,
        credits: totalCredits,
        is_balanced: Math.abs(totalDebits - totalCredits) < 0.01,
      },
    };
  }

  async getRevenueReport(filters: ReportFilterDto) {
    const query: any = { status: BatchStatus.POSTED };

    if (filters.start_date || filters.end_date) {
      query.created_at = {};
      if (filters.start_date) query.created_at.$gte = new Date(filters.start_date);
      if (filters.end_date) query.created_at.$lte = new Date(filters.end_date);
    }

    const revenueAccounts = await this.accountModel.find({ type: AccountType.REVENUE, is_active: true }).lean();

    const revenueByCategory = await this.batchModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          total: { $sum: '$total_debits' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const dailyRevenue = await this.batchModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
          total: { $sum: '$total_debits' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      generated_at: new Date(),
      period: {
        start: filters.start_date || 'All time',
        end: filters.end_date || 'Present',
      },
      revenue_accounts: revenueAccounts.map((a) => ({
        code: a.code,
        name: a.name,
        balance: a.current_balance,
      })),
      by_category: revenueByCategory,
      daily: dailyRevenue,
      total_revenue: revenueAccounts.reduce((sum, a) => sum + a.current_balance, 0),
    };
  }

  async getReconciliationReport() {
    // Compare wallet balances with liability account balances
    const [walletTotals, liabilityAccounts] = await Promise.all([
      this.walletModel.aggregate([
        {
          $group: {
            _id: '$owner_type',
            total_available: { $sum: '$available_balance' },
            total_held: { $sum: '$held_balance' },
            total_pending: { $sum: '$pending_balance' },
            wallet_count: { $sum: 1 },
          },
        },
      ]),
      this.accountModel.find({ sub_type: 'WALLET_LIABILITY', is_active: true }).lean(),
    ]);

    const reconciliation = walletTotals.map((wt) => {
      const liabilityAccount = liabilityAccounts.find((a) =>
        a.code.includes(wt._id.toLowerCase() === 'patient' ? '001.001' : '002.001'),
      );

      const walletTotal = wt.total_available + wt.total_held + wt.total_pending;
      const accountBalance = liabilityAccount?.current_balance || 0;
      const difference = walletTotal - accountBalance;

      return {
        owner_type: wt._id,
        wallet_count: wt.wallet_count,
        wallet_balances: {
          available: wt.total_available,
          held: wt.total_held,
          pending: wt.total_pending,
          total: walletTotal,
        },
        liability_account: {
          code: liabilityAccount?.code,
          name: liabilityAccount?.name,
          balance: accountBalance,
        },
        difference,
        is_reconciled: Math.abs(difference) < 0.01,
      };
    });

    return {
      generated_at: new Date(),
      reconciliation,
      is_fully_reconciled: reconciliation.every((r) => r.is_reconciled),
    };
  }

  // ==================== HELPERS ====================

  private getWalletLiabilityAccount(ownerType: WalletOwnerType): string {
    switch (ownerType) {
      case WalletOwnerType.PATIENT:
        return '2100.001.001';
      case WalletOwnerType.SPECIALIST:
        return '2100.002.001';
      case WalletOwnerType.PHARMACY:
        return '2100.003.001';
      default:
        return '2100.001.001';
    }
  }

  private getAdminCreditSourceAccount(source: AdminCreditSource): string {
    switch (source) {
      case AdminCreditSource.PROMOTIONAL:
        return '5400.001.001'; // Promotional Credits Expense
      case AdminCreditSource.ADJUSTMENT:
        return '5400.002.001'; // Admin Adjustments Expense
      case AdminCreditSource.OPERATING_FUND:
        return '1300.003.001'; // Platform Operating Fund (Asset)
      default:
        return '1300.003.001';
    }
  }

  private getAdminDebitDestinationAccount(destination: AdminDebitDestination): string {
    switch (destination) {
      case AdminDebitDestination.RECOVERY:
        return '4400.001.001'; // Admin Debit Recovery (Revenue)
      case AdminDebitDestination.ADJUSTMENT:
        return '4400.001.001'; // Also goes to recovery revenue
      case AdminDebitDestination.OPERATING_FUND:
        return '1300.003.001'; // Platform Operating Fund (Asset)
      default:
        return '1300.003.001';
    }
  }

  private async generateBatchId(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TB-${dateStr}-${timestamp}-${random}`;
  }

  private async generateEntryId(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LE-${dateStr}-${timestamp}-${random}`;
  }

  // ==================== MANUAL JOURNAL ENTRIES ====================

  async createJournalEntry(dto: CreateJournalEntryDto, adminId: string) {
    // Validate that debits equal credits
    const totalDebits = dto.entries
      .filter((e) => e.entry_type === EntryType.DEBIT)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalCredits = dto.entries
      .filter((e) => e.entry_type === EntryType.CREDIT)
      .reduce((sum, e) => sum + e.amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new BadRequestException(
        `Journal entry not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`,
      );
    }

    // Validate all account codes exist
    const accountCodes = [...new Set(dto.entries.map((e) => e.account_code))];
    const accounts = await this.accountModel.find({ code: { $in: accountCodes } });

    if (accounts.length !== accountCodes.length) {
      const foundCodes = accounts.map((a) => a.code);
      const missingCodes = accountCodes.filter((c) => !foundCodes.includes(c));
      throw new BadRequestException(`Invalid account codes: ${missingCodes.join(', ')}`);
    }

    const accountMap = accounts.reduce((map, a) => {
      map[a.code] = a;
      return map;
    }, {} as Record<string, AccountDocument>);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const batchId = await this.generateBatchId();

      // Create the batch
      const batch = new this.batchModel({
        batch_id: batchId,
        category: dto.category || TransactionCategory.ADJUSTMENT,
        description: dto.description,
        total_debits: totalDebits,
        total_credits: totalCredits,
        is_balanced: true,
        entry_count: dto.entries.length,
        currency: 'NGN',
        status: BatchStatus.POSTED,
        reference_type: dto.reference_type,
        reference_id: dto.reference_id ? new Types.ObjectId(dto.reference_id) : undefined,
        performed_by: new Types.ObjectId(adminId),
        posted_at: new Date(),
        notes: dto.notes,
        metadata: { manual_entry: true },
      });

      await batch.save({ session });

      // Create ledger entries and update account balances
      const ledgerEntries = [];

      for (let i = 0; i < dto.entries.length; i++) {
        const entry = dto.entries[i];
        const account = accountMap[entry.account_code];
        const entryId = await this.generateEntryId();

        // Calculate balance change based on account type and entry type
        const balanceChange = this.calculateBalanceChange(account, entry.entry_type, entry.amount);
        const balanceBefore = account.current_balance;
        const balanceAfter = balanceBefore + balanceChange;

        ledgerEntries.push({
          entry_id: entryId,
          batch_id: batchId,
          account_code: entry.account_code,
          entry_type: entry.entry_type,
          amount: entry.amount,
          currency: 'NGN',
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: entry.description || dto.description,
          status: EntryStatus.POSTED,
          performed_by: new Types.ObjectId(adminId),
        });

        // Update account balance
        await this.accountModel.updateOne(
          { code: entry.account_code },
          { $inc: { current_balance: balanceChange }, balance_updated_at: new Date() },
          { session },
        );

        // Update in-memory account for subsequent entries
        account.current_balance = balanceAfter;
      }

      await this.ledgerModel.insertMany(ledgerEntries, { session });

      await session.commitTransaction();

      this.logger.log(`Manual journal entry ${batchId} created by admin ${adminId}`);

      return {
        success: true,
        batch_id: batchId,
        total_debits: totalDebits,
        total_credits: totalCredits,
        entry_count: dto.entries.length,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async fundOperatingAccount(dto: FundOperatingAccountDto, adminId: string) {
    // All funding sources credit equity accounts since money is coming INTO the platform
    // from external sources (not internal transfers between platform accounts)
    let sourceAccountCode: string;
    let sourceAccountName: string;

    switch (dto.source) {
      case 'BANK_TRANSFER':
        // Money transferred from company's external bank into the platform
        // Credits equity since it's new money entering the system
        sourceAccountCode = '3000.001.001'; // Retained Earnings (company funds)
        sourceAccountName = 'Bank Transfer';
        break;
      case 'RETAINED_EARNINGS':
        sourceAccountCode = '3000.001.001'; // Retained Earnings
        sourceAccountName = 'Retained Earnings';
        break;
      case 'CAPITAL_INJECTION':
        sourceAccountCode = '3000.001.001'; // Retained Earnings (capital goes here too)
        sourceAccountName = 'Capital Injection';
        break;
      default:
        throw new BadRequestException('Invalid funding source');
    }

    const operatingFundCode = '1300.003.001';

    // Create journal entry
    const journalEntry: CreateJournalEntryDto = {
      description: dto.description || `Fund Platform Operating Account: ${sourceAccountName}`,
      category: TransactionCategory.ADJUSTMENT,
      entries: [
        {
          account_code: operatingFundCode,
          entry_type: EntryType.DEBIT,
          amount: dto.amount,
          description: `Received from ${sourceAccountName}`,
        },
        {
          account_code: sourceAccountCode,
          entry_type: EntryType.CREDIT,
          amount: dto.amount,
          description: `Transfer to Operating Fund`,
        },
      ],
      notes: dto.notes,
    };

    const result = await this.createJournalEntry(journalEntry, adminId);

    return {
      ...result,
      source: dto.source,
      operating_fund_account: operatingFundCode,
    };
  }

  // Calculate how a transaction affects account balance based on account type
  private calculateBalanceChange(
    account: AccountDocument,
    entryType: EntryType,
    amount: number,
  ): number {
    // Normal balance rules:
    // ASSET & EXPENSE accounts: DEBIT increases, CREDIT decreases
    // LIABILITY, EQUITY & REVENUE accounts: CREDIT increases, DEBIT decreases

    const isDebitNormal =
      account.type === AccountType.ASSET || account.type === AccountType.EXPENSE;

    if (isDebitNormal) {
      return entryType === EntryType.DEBIT ? amount : -amount;
    } else {
      return entryType === EntryType.CREDIT ? amount : -amount;
    }
  }

  // ==================== COMMON TRANSACTION HELPERS ====================

  // Helper for external services to record transactions
  async recordTransaction(params: {
    category: TransactionCategory;
    description: string;
    entries: Array<{
      account_code: string;
      entry_type: EntryType;
      amount: number;
      description?: string;
      user_id?: string;
      wallet_id?: string;
    }>;
    from_user?: string;
    from_wallet?: string;
    to_user?: string;
    to_wallet?: string;
    reference_type?: string;
    reference_id?: string;
    external_reference?: string;
    performed_by?: string;
    notes?: string;
    metadata?: Record<string, any>;
  }) {
    const {
      category,
      description,
      entries,
      from_user,
      from_wallet,
      to_user,
      to_wallet,
      reference_type,
      reference_id,
      external_reference,
      performed_by,
      notes,
      metadata,
    } = params;

    // Validate balance
    const totalDebits = entries
      .filter((e) => e.entry_type === EntryType.DEBIT)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalCredits = entries
      .filter((e) => e.entry_type === EntryType.CREDIT)
      .reduce((sum, e) => sum + e.amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new BadRequestException(
        `Transaction not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`,
      );
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const batchId = await this.generateBatchId();

      // Create the batch
      const batch = new this.batchModel({
        batch_id: batchId,
        category,
        description,
        total_debits: totalDebits,
        total_credits: totalCredits,
        is_balanced: true,
        entry_count: entries.length,
        currency: 'NGN',
        status: BatchStatus.POSTED,
        from_user: from_user ? new Types.ObjectId(from_user) : undefined,
        from_wallet: from_wallet ? new Types.ObjectId(from_wallet) : undefined,
        to_user: to_user ? new Types.ObjectId(to_user) : undefined,
        to_wallet: to_wallet ? new Types.ObjectId(to_wallet) : undefined,
        reference_type,
        reference_id: reference_id ? new Types.ObjectId(reference_id) : undefined,
        external_reference,
        performed_by: performed_by ? new Types.ObjectId(performed_by) : undefined,
        posted_at: new Date(),
        notes,
        metadata,
      });

      await batch.save({ session });

      // Create ledger entries
      const ledgerEntries = [];

      for (const entry of entries) {
        const account = await this.accountModel.findOne({ code: entry.account_code }).session(session);
        if (!account) {
          throw new BadRequestException(`Account not found: ${entry.account_code}`);
        }

        const entryId = await this.generateEntryId();
        const balanceChange = this.calculateBalanceChange(account, entry.entry_type, entry.amount);

        ledgerEntries.push({
          entry_id: entryId,
          batch_id: batchId,
          account_code: entry.account_code,
          entry_type: entry.entry_type,
          amount: entry.amount,
          currency: 'NGN',
          balance_before: account.current_balance,
          balance_after: account.current_balance + balanceChange,
          description: entry.description || description,
          status: EntryStatus.POSTED,
          user_id: entry.user_id ? new Types.ObjectId(entry.user_id) : undefined,
          wallet_id: entry.wallet_id ? new Types.ObjectId(entry.wallet_id) : undefined,
          performed_by: performed_by ? new Types.ObjectId(performed_by) : undefined,
        });

        // Update account balance
        await this.accountModel.updateOne(
          { code: entry.account_code },
          { $inc: { current_balance: balanceChange }, balance_updated_at: new Date() },
          { session },
        );
      }

      await this.ledgerModel.insertMany(ledgerEntries, { session });

      await session.commitTransaction();

      return { success: true, batch_id: batchId };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
