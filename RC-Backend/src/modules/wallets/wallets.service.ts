import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Wallet, WalletDocument } from './entities/wallet.entity';
import { Model, Types } from 'mongoose';
import { create, find, findOne, updateOne } from 'src/common/crud/crud';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { Messages } from '../../core/messages/messages';
import { WithdrawFundDto } from './dto/withdraw-wallet-fund.dto';
import { FundWalletDto } from './dto/fund-wallet.dto';
import {
  TransactionType,
  WalletTransaction,
  WalletTransactionDocument,
} from './entities/wallet-transactions.entity';
import currency = require('currency.js');
import { PaymentHandler } from '../../common/external/payment/payment.handler';
import { BanksService } from '../banks/banks.service';
import { SUCCESS } from '../../core/constants';
import * as moment from 'moment/moment';
import { UnifiedWalletService } from '../accounting/services/unified-wallet.service';
import { WalletOwnerType, TransactionCategory, AccountCode } from '../accounting/enums/account-codes.enum';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name)
    private walletTxnModel: Model<WalletTransactionDocument>,
    private readonly generalHelpers: GeneralHelpers,
    private readonly paymentHandler: PaymentHandler,
    private readonly bankService: BanksService,
    private readonly unifiedWalletService: UnifiedWalletService,
  ) {}
  async create(userId: Types.ObjectId) {
    return create(this.walletModel, { userId });
  }

  async getWalletTransactions(
    userId: Types.ObjectId,
    page = 1,
    limit = 10,
  ) {
    // Fetch from both legacy and unified wallet, then merge
    let allTransactions: any[] = [];
    let legacyTotal = 0;
    let unifiedTotal = 0;

    // 1. Fetch legacy transactions
    try {
      const [legacyTransactions, legacyCount] = await Promise.all([
        this.walletTxnModel
          .find({ userId })
          .sort({ created_at: -1 })
          .lean()
          .exec(),
        this.walletTxnModel.countDocuments({ userId }),
      ]);
      legacyTotal = legacyCount;

      // Transform legacy transactions to a common format
      allTransactions = legacyTransactions.map((txn: any) => ({
        _id: txn._id,
        type: txn.type, // 'credit' or 'debit'
        amount: txn.amount,
        narration: txn.narration || txn.description,
        description: txn.narration || txn.description,
        reference: txn.reference,
        created_at: txn.created_at,
        source: 'legacy',
      }));
    } catch (error) {
      this.logger.warn(`Failed to fetch legacy wallet transactions: ${error.message}`);
    }

    // 2. Fetch unified wallet transactions
    try {
      let unifiedWallet = await this.unifiedWalletService.getWalletByOwner(userId, WalletOwnerType.PATIENT);
      if (!unifiedWallet) {
        unifiedWallet = await this.unifiedWalletService.getWalletByOwner(userId, WalletOwnerType.SPECIALIST);
      }

      if (unifiedWallet) {
        // Fetch all unified transactions (we'll paginate the merged result)
        const unifiedHistory = await this.unifiedWalletService.getTransactionHistory(
          unifiedWallet.wallet_id,
          { page: 1, limit: 1000 }, // Get all for merging
        );

        if (unifiedHistory?.transactions) {
          // Determine the liability account code for this wallet type
          const liabilityAccountCode = unifiedWallet.owner_type === WalletOwnerType.PATIENT
            ? AccountCode.LIABILITY_PATIENT_WALLETS
            : AccountCode.LIABILITY_SPECIALIST_WALLETS;

          // Filter to only show entries that affect the wallet's liability account
          // This excludes revenue/expense entries from the double-entry pair
          const walletEntries = unifiedHistory.transactions.filter((txn: any) =>
            txn.account_code === liabilityAccountCode
          );

          unifiedTotal = walletEntries.length;

          // Transform unified transactions to common format
          // For liability accounts:
          // - DEBIT means money leaving (wallet balance decreases) = show as 'debit' (-)
          // - CREDIT means money coming in (wallet balance increases) = show as 'credit' (+)
          const unifiedTransactions = walletEntries.map((txn: any) => ({
            _id: txn._id,
            type: txn.entry_type === 'DEBIT' ? 'debit' : 'credit',
            amount: txn.amount,
            narration: txn.description,
            description: txn.description,
            reference: txn.external_reference || txn.batch_id,
            category: txn.category,
            created_at: txn.created_at,
            source: 'unified',
          }));

          allTransactions = [...allTransactions, ...unifiedTransactions];
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch unified wallet transactions: ${error.message}`);
    }

    // 3. Remove duplicates (by reference) and sort by date
    const seen = new Set();
    const uniqueTransactions = allTransactions.filter((txn) => {
      // Use reference or _id as unique identifier
      const key = txn.reference || txn._id?.toString();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    // Sort by created_at descending
    uniqueTransactions.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    // 4. Paginate the merged results
    const total = uniqueTransactions.length;
    const skip = (page - 1) * limit;
    const paginatedTransactions = uniqueTransactions.slice(skip, skip + limit);

    return {
      transactions: paginatedTransactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  reduce(arr) {
    return arr.reduce((prevVal, currVal) => prevVal + currVal?.amount, 0);
  }

  async getUserEarnings(userId: Types.ObjectId) {
    // Try unified wallet first (source of truth after migration)
    try {
      const unifiedWallet = await this.unifiedWalletService.getWalletByOwner(
        userId,
        WalletOwnerType.PATIENT,
      );
      if (unifiedWallet && (unifiedWallet.available_balance > 0 || unifiedWallet.total_credited > 0)) {
        return {
          totalEarnings: unifiedWallet.total_credited,
          totalWithdrawals: unifiedWallet.total_debited,
          currentBalance: unifiedWallet.available_balance,
        };
      }
    } catch (error) {
      // Fall through to legacy
    }

    // Fallback to legacy wallet
    const [earnings, withdrawals, wallet] = await Promise.all([
      find(this.walletTxnModel, {
        type: TransactionType.CREDIT,
        userId,
      }),
      find(this.walletTxnModel, {
        type: TransactionType.DEBIT,
        userId,
      }),
      findOne(this.walletModel, { userId }),
    ]);

    const totalCredits = this.reduce(earnings) || 0;
    const totalDebits = this.reduce(withdrawals) || 0;

    // Use wallet balance if available, otherwise calculate from transactions
    const calculatedBalance = totalCredits - totalDebits;
    const walletBalance = wallet?.available_balance || 0;

    return {
      totalEarnings: totalCredits,
      totalWithdrawals: totalDebits,
      // Use calculated balance if wallet balance is 0 but transactions exist
      currentBalance: walletBalance > 0 ? walletBalance : calculatedBalance,
    };
  }

  async getUserWallet(userId: Types.ObjectId): Promise<WalletDocument> {
    const wallet = await findOne(this.walletModel, { userId });
    if (!wallet) throw new NotFoundException(Messages.NOT_FOUND);
    return wallet;
  }

  async withdrawFromWallet(
    withdrawFundDto: WithdrawFundDto,
    userId: Types.ObjectId,
  ) {
    const { amount, bankId } = withdrawFundDto;
    const bank = await this.bankService.getBank(bankId);
    const reference = this.generalHelpers.genTxReference();
    const narration = 'Fund Removal';

    // Try legacy wallet first
    let wallet: WalletDocument | null = null;
    try {
      wallet = await findOne(this.walletModel, { userId });
    } catch (err) {
      // No legacy wallet
    }

    if (wallet) {
      // Legacy wallet path
      if (+amount > +wallet.available_balance)
        throw new BadRequestException(Messages.WALLET_BALANCE_LOW);

      const response = await this.paymentHandler.transferToRecipient({
        recipient: bank,
        amount,
        reference,
        reason: narration,
      });

      if (response?.status === SUCCESS) {
        await create(this.walletTxnModel, {
          amount,
          type: TransactionType.DEBIT,
          walletId: wallet._id,
          userId,
          narration,
          reference,
          bankId,
        });
        await updateOne(
          this.walletModel,
          { _id: wallet._id },
          {
            available_balance: currency(wallet.available_balance).subtract(amount),
            ledger_balance: currency(wallet.available_balance).subtract(amount),
          },
        );

        // Also record in unified accounting
        try {
          const unifiedWallet = await this.unifiedWalletService.getOrCreateWallet(
            userId,
            WalletOwnerType.PATIENT,
          );
          await this.unifiedWalletService.debit({
            wallet_id: unifiedWallet.wallet_id,
            amount,
            description: narration,
            category: TransactionCategory.WALLET_WITHDRAWAL,
            reference_type: 'bank_withdrawal',
            reference_id: userId,
            external_reference: reference,
          });
        } catch (error) {
          this.logger.error(`Failed to record withdrawal in unified accounting: ${error.message}`);
        }

        return { success: true, reference };
      }
      throw new InternalServerErrorException();
    }

    // Unified wallet path (no legacy wallet)
    const unifiedWallet = await this.unifiedWalletService.getWalletByOwner(userId, WalletOwnerType.PATIENT);
    if (!unifiedWallet) {
      throw new NotFoundException('Patient does not have a wallet');
    }

    if (+amount > +unifiedWallet.available_balance)
      throw new BadRequestException(Messages.WALLET_BALANCE_LOW);

    const response = await this.paymentHandler.transferToRecipient({
      recipient: bank,
      amount,
      reference,
      reason: narration,
    });

    if (response?.status === SUCCESS) {
      await this.unifiedWalletService.debit({
        wallet_id: unifiedWallet.wallet_id,
        amount,
        description: narration,
        category: TransactionCategory.WALLET_WITHDRAWAL,
        reference_type: 'bank_withdrawal',
        reference_id: userId,
        external_reference: reference,
      });

      // Create legacy transaction record for compatibility
      await create(this.walletTxnModel, {
        amount,
        type: TransactionType.DEBIT,
        walletId: unifiedWallet._id,
        userId,
        narration,
        reference,
        bankId,
      });

      return { success: true, reference };
    }
    throw new InternalServerErrorException();
  }

  async totalEarningsData(userId: Types.ObjectId) {
    // Try unified wallet first
    try {
      const unifiedWallet = await this.unifiedWalletService.getWalletByOwner(
        userId,
        WalletOwnerType.SPECIALIST,
      );
      if (unifiedWallet && (unifiedWallet.total_credited > 0 || unifiedWallet.available_balance > 0)) {
        return {
          totalEarnings: unifiedWallet.total_credited,
          earningsThisWeek: unifiedWallet.total_credited, // Unified doesn't track weekly, use total
        };
      }
    } catch (error) {
      // Fall through to legacy
    }

    // Also try as patient wallet
    try {
      const patientWallet = await this.unifiedWalletService.getWalletByOwner(
        userId,
        WalletOwnerType.PATIENT,
      );
      if (patientWallet && (patientWallet.total_credited > 0 || patientWallet.available_balance > 0)) {
        return {
          totalEarnings: patientWallet.total_credited,
          earningsThisWeek: patientWallet.total_credited,
        };
      }
    } catch (error) {
      // Fall through to legacy
    }

    // Fallback to legacy wallet transactions
    const [totalEarnings, earningsThisWeek] = await Promise.all([
      find(this.walletTxnModel, {
        type: TransactionType.CREDIT,
        userId,
      }),
      find(this.walletTxnModel, {
        type: TransactionType.CREDIT,
        userId,
        created_at: {
          $gte: moment().startOf('week').toDate(),
          $lt: moment().endOf('week').toDate(),
        },
      }),
    ]);
    return {
      totalEarnings: this.reduce(totalEarnings),
      earningsThisWeek: this.reduce(earningsThisWeek),
    };
  }

  /**
   * Debit wallet for a purchase (pharmacy order, etc.)
   * Unlike withdrawFromWallet, this doesn't transfer to a bank - it just deducts for purchase
   * Now also records the transaction in the unified accounting system
   */
  async debitWalletForPurchase(
    userId: Types.ObjectId,
    amount: number,
    reference: string,
    narration: string,
    category: TransactionCategory = TransactionCategory.PHARMACY_ORDER_PAYMENT,
  ): Promise<{ newBalance: number; transaction: any }> {
    // Try legacy wallet first
    let wallet: WalletDocument | null = null;
    try {
      wallet = await this.getUserWallet(userId);
    } catch (err) {
      // Legacy wallet not found - check unified wallet
    }

    if (wallet) {
      // Legacy wallet path
      if (+amount > +wallet.available_balance) {
        throw new BadRequestException(Messages.WALLET_BALANCE_LOW);
      }

      const transaction = await create(this.walletTxnModel, {
        amount,
        type: TransactionType.DEBIT,
        walletId: wallet._id,
        userId,
        narration,
        reference,
      });

      const newBalance = currency(wallet.available_balance).subtract(amount).value;
      await updateOne(
        this.walletModel,
        { _id: wallet._id },
        {
          available_balance: newBalance,
          ledger_balance: newBalance,
        },
      );

      // Also record in unified accounting
      try {
        const unifiedWallet = await this.unifiedWalletService.getOrCreateWallet(
          userId,
          WalletOwnerType.PATIENT,
        );
        await this.unifiedWalletService.debit({
          wallet_id: unifiedWallet.wallet_id,
          amount,
          description: narration,
          category,
          reference_type: 'wallet_transaction',
          reference_id: transaction._id,
          external_reference: reference,
        });
      } catch (error) {
        this.logger.error(`Failed to record in unified accounting: ${error.message}`);
      }

      return { newBalance, transaction };
    }

    // Unified wallet path (no legacy wallet)
    const unifiedWallet = await this.unifiedWalletService.getWalletByOwner(userId, WalletOwnerType.PATIENT);
    if (!unifiedWallet) {
      throw new NotFoundException('Patient does not have a wallet');
    }

    if (+amount > +unifiedWallet.available_balance) {
      throw new BadRequestException(Messages.WALLET_BALANCE_LOW);
    }

    const txResult = await this.unifiedWalletService.debit({
      wallet_id: unifiedWallet.wallet_id,
      amount,
      description: narration,
      category,
      reference_type: 'prescription_payment',
      reference_id: userId,
      external_reference: reference,
    });

    const newBalance = currency(unifiedWallet.available_balance).subtract(amount).value;

    // Create a legacy transaction record for compatibility
    const transaction = await create(this.walletTxnModel, {
      amount,
      type: TransactionType.DEBIT,
      walletId: unifiedWallet._id,
      userId,
      narration,
      reference,
    });

    return { newBalance, transaction };
  }

  /**
   * Credit wallet (for top-ups from Paystack)
   * Records in both legacy and unified accounting systems
   */
  async creditWallet(
    userId: Types.ObjectId,
    amount: number,
    reference: string,
    narration: string,
    category: TransactionCategory = TransactionCategory.WALLET_TOPUP,
  ): Promise<{ newBalance: number; transaction: WalletTransactionDocument }> {
    let wallet = await findOne(this.walletModel, { userId });

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await this.create(userId);
    }

    // Create the transaction record (legacy)
    const transaction = await create(this.walletTxnModel, {
      amount,
      type: TransactionType.CREDIT,
      walletId: wallet._id,
      userId,
      narration,
      reference,
    });

    // Update wallet balance (legacy)
    const newBalance = currency(wallet.available_balance || 0).add(amount).value;
    await updateOne(
      this.walletModel,
      { _id: wallet._id },
      {
        available_balance: newBalance,
        ledger_balance: newBalance,
      },
    );

    // Record in unified accounting system
    try {
      const unifiedWallet = await this.unifiedWalletService.getOrCreateWallet(
        userId,
        WalletOwnerType.PATIENT,
      );

      await this.unifiedWalletService.credit({
        wallet_id: unifiedWallet.wallet_id,
        amount,
        description: narration,
        category,
        reference_type: 'wallet_transaction',
        reference_id: transaction._id,
        external_reference: reference,
      });

      this.logger.log(`Recorded credit in unified accounting: ${reference}`);
    } catch (error) {
      this.logger.error(`Failed to record in unified accounting: ${error.message}`);
      // Don't fail the transaction - legacy system is primary for now
    }

    return { newBalance, transaction };
  }

  /**
   * Initialize wallet funding via Paystack
   */
  async initializeFunding(
    userId: Types.ObjectId,
    email: string,
    dto: FundWalletDto,
  ) {
    const reference = this.generalHelpers.genTxReference();

    // Initialize payment with Paystack
    // Note: Paystack provider already converts to kobo, so pass amount in Naira
    const paymentResponse = await this.paymentHandler.initializeTransaction(
      email,
      dto.amount,
      reference,
      {
        type: 'patient_wallet_topup',
        user_id: userId.toString(),
        callback_url: dto.callback_url,
      },
    );

    this.logger.log(`Paystack response: ${JSON.stringify(paymentResponse)}`);

    return {
      authorization_url: paymentResponse.data?.data?.authorization_url,
      reference,
      amount: dto.amount,
    };
  }

  /**
   * Verify wallet funding and credit wallet
   */
  async verifyFunding(userId: Types.ObjectId, reference: string) {
    // Check if already processed
    const existingTxn = await this.walletTxnModel.findOne({
      reference,
      userId,
      type: TransactionType.CREDIT,
    });

    if (existingTxn) {
      const wallet = await findOne(this.walletModel, { userId });
      return {
        success: true,
        message: 'Payment already processed',
        transaction: existingTxn,
        new_balance: wallet?.available_balance || 0,
      };
    }

    // Verify with Paystack
    const verification = await this.paymentHandler.verifyTransaction(reference);

    if (verification.data?.status !== 'success') {
      throw new BadRequestException('Payment verification failed');
    }

    const amount = verification.data.amount / 100; // Convert from kobo

    // Credit wallet using existing method
    const { newBalance, transaction } = await this.creditWallet(
      userId,
      amount,
      reference,
      'Wallet top-up via Paystack',
    );

    return {
      success: true,
      message: 'Wallet credited successfully',
      transaction,
      new_balance: newBalance,
    };
  }
}
