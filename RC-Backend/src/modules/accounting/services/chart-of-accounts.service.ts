/**
 * Chart of Accounts Service
 *
 * Manages the chart of accounts and provides seeding functionality.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Account, AccountDocument } from '../entities/account.entity';
import {
  AccountCode,
  AccountType,
  AccountSubType,
  NormalBalance,
  getNormalBalance,
} from '../enums/account-codes.enum';

interface AccountSeedData {
  code: string;
  name: string;
  description: string;
  type: AccountType;
  sub_type: AccountSubType;
  parent_code?: string;
}

@Injectable()
export class ChartOfAccountsService implements OnModuleInit {
  private readonly logger = new Logger(ChartOfAccountsService.name);

  constructor(
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
  ) {}

  /**
   * Seed accounts on module initialization if they don't exist
   */
  async onModuleInit() {
    const count = await this.accountModel.countDocuments();
    if (count === 0) {
      this.logger.log('No accounts found, seeding chart of accounts...');
      await this.seedAccounts();
    } else {
      this.logger.log(`Chart of accounts already seeded with ${count} accounts`);
      // Check for and add any missing accounts
      await this.addMissingAccounts();
    }
  }

  /**
   * Add any missing accounts that may have been added after initial seeding
   */
  private async addMissingAccounts(): Promise<void> {
    const accountData = this.getAccountSeedData();
    let addedCount = 0;

    for (const data of accountData) {
      const exists = await this.accountModel.findOne({ code: data.code });
      if (!exists) {
        const normalBalance = getNormalBalance(data.type);
        await this.accountModel.create({
          code: data.code,
          name: data.name,
          description: data.description,
          type: data.type,
          sub_type: data.sub_type,
          normal_balance: normalBalance,
          parent_code: data.parent_code,
          currency: 'NGN',
          is_active: true,
          is_system_account: true,
          current_balance: 0,
        });
        addedCount++;
        this.logger.log(`Added missing account: ${data.code} - ${data.name}`);
      }
    }

    if (addedCount > 0) {
      this.logger.log(`Added ${addedCount} missing accounts to chart of accounts`);
    }
  }

  /**
   * Get all system account seed data
   */
  private getAccountSeedData(): AccountSeedData[] {
    return [
      // ============ ASSETS (1000) ============

      // Cash & Bank (1100)
      {
        code: AccountCode.CASH_PAYSTACK,
        name: 'Cash - Paystack Balance',
        description: 'Funds held in Paystack settlement account',
        type: AccountType.ASSET,
        sub_type: AccountSubType.CASH,
        parent_code: '1100.000.000',
      },
      {
        code: AccountCode.CASH_BANK_NGN,
        name: 'Cash - Bank NGN',
        description: 'Nigerian Naira bank account balance',
        type: AccountType.ASSET,
        sub_type: AccountSubType.CASH,
        parent_code: '1100.000.000',
      },
      {
        code: AccountCode.CASH_BANK_USD,
        name: 'Cash - Bank USD',
        description: 'US Dollar bank account balance (future)',
        type: AccountType.ASSET,
        sub_type: AccountSubType.CASH,
        parent_code: '1100.000.000',
      },

      // Receivables (1200)
      {
        code: AccountCode.RECEIVABLE_PENDING_PAYMENTS,
        name: 'Pending Payment Verifications',
        description: 'Payments initiated but not yet verified with Paystack',
        type: AccountType.ASSET,
        sub_type: AccountSubType.RECEIVABLE,
        parent_code: '1200.000.000',
      },
      {
        code: AccountCode.RECEIVABLE_REFUNDS,
        name: 'Refunds Due from Paystack',
        description: 'Refunds requested but not yet received from Paystack',
        type: AccountType.ASSET,
        sub_type: AccountSubType.RECEIVABLE,
        parent_code: '1200.000.000',
      },

      // Wallet Pools (1300)
      {
        code: AccountCode.PATIENT_WALLET_POOL,
        name: 'Patient Wallet Pool',
        description: 'Total funds held on behalf of patients',
        type: AccountType.ASSET,
        sub_type: AccountSubType.WALLET_POOL,
        parent_code: '1300.000.000',
      },
      {
        code: AccountCode.SPECIALIST_WALLET_POOL,
        name: 'Specialist Wallet Pool',
        description: 'Total funds held on behalf of specialists',
        type: AccountType.ASSET,
        sub_type: AccountSubType.WALLET_POOL,
        parent_code: '1300.000.000',
      },
      {
        code: AccountCode.SPECIALIST_HELD_FUNDS,
        name: 'Specialist Held Funds',
        description: 'Specialist funds on hold for pending transactions',
        type: AccountType.ASSET,
        sub_type: AccountSubType.WALLET_POOL,
        parent_code: '1300.000.000',
      },
      {
        code: AccountCode.APPOINTMENT_ESCROW_POOL,
        name: 'Appointment Escrow Pool',
        description: 'Funds held in escrow for pending appointments',
        type: AccountType.ASSET,
        sub_type: AccountSubType.WALLET_POOL,
        parent_code: '1300.000.000',
      },

      // ============ LIABILITIES (2000) ============

      // Wallet Liabilities (2100)
      {
        code: AccountCode.LIABILITY_PATIENT_WALLETS,
        name: 'Patient Wallet Balances',
        description: 'Total amount owed to patients (wallet balances)',
        type: AccountType.LIABILITY,
        sub_type: AccountSubType.WALLET_LIABILITY,
        parent_code: '2100.000.000',
      },
      {
        code: AccountCode.LIABILITY_SPECIALIST_WALLETS,
        name: 'Specialist Wallet Balances',
        description: 'Total amount owed to specialists (wallet balances)',
        type: AccountType.LIABILITY,
        sub_type: AccountSubType.WALLET_LIABILITY,
        parent_code: '2100.000.000',
      },
      {
        code: AccountCode.LIABILITY_SPECIALIST_HELD,
        name: 'Specialist Held Balances',
        description: 'Specialist funds on hold (pending prescription payments)',
        type: AccountType.LIABILITY,
        sub_type: AccountSubType.WALLET_LIABILITY,
        parent_code: '2100.000.000',
      },
      {
        code: AccountCode.LIABILITY_APPOINTMENT_ESCROW,
        name: 'Appointment Escrow Balances',
        description: 'Funds held in escrow until appointment completes or is cancelled',
        type: AccountType.LIABILITY,
        sub_type: AccountSubType.WALLET_LIABILITY,
        parent_code: '2100.000.000',
      },

      // Payables (2200)
      {
        code: AccountCode.PAYABLE_PHARMACY,
        name: 'Payable to Pharmacies',
        description: 'Amount owed to pharmacies for orders',
        type: AccountType.LIABILITY,
        sub_type: AccountSubType.PAYABLE,
        parent_code: '2200.000.000',
      },
      {
        code: AccountCode.PAYABLE_WITHDRAWALS,
        name: 'Pending Withdrawals',
        description: 'Withdrawal requests pending transfer',
        type: AccountType.LIABILITY,
        sub_type: AccountSubType.PAYABLE,
        parent_code: '2200.000.000',
      },
      {
        code: AccountCode.PAYABLE_REFUNDS,
        name: 'Pending Refunds',
        description: 'Refunds pending to be processed',
        type: AccountType.LIABILITY,
        sub_type: AccountSubType.PAYABLE,
        parent_code: '2200.000.000',
      },

      // Deferred Revenue (2300)
      {
        code: AccountCode.DEFERRED_SUBSCRIPTION,
        name: 'Prepaid Subscriptions',
        description: 'Subscription revenue received but not yet earned',
        type: AccountType.LIABILITY,
        sub_type: AccountSubType.DEFERRED,
        parent_code: '2300.000.000',
      },

      // ============ EQUITY (3000) ============

      {
        code: AccountCode.RETAINED_EARNINGS,
        name: 'Retained Earnings',
        description: 'Accumulated profits retained in the business',
        type: AccountType.EQUITY,
        sub_type: AccountSubType.RETAINED,
      },
      {
        code: AccountCode.OPENING_BALANCE,
        name: 'Opening Balances',
        description: 'Opening balances from migration',
        type: AccountType.EQUITY,
        sub_type: AccountSubType.OPENING,
      },

      // ============ REVENUE (4000) ============

      // Service Fees (4100)
      {
        code: AccountCode.REVENUE_APPOINTMENT_FEE,
        name: 'Appointment Fees',
        description: 'Revenue from appointment bookings',
        type: AccountType.REVENUE,
        sub_type: AccountSubType.SERVICE_FEE,
        parent_code: '4100.000.000',
      },
      {
        code: AccountCode.REVENUE_PRESCRIPTION_FEE,
        name: 'Prescription Fees',
        description: 'Revenue from prescription processing fees',
        type: AccountType.REVENUE,
        sub_type: AccountSubType.SERVICE_FEE,
        parent_code: '4100.000.000',
      },
      {
        code: AccountCode.REVENUE_PLATFORM_COMMISSION,
        name: 'Platform Commission',
        description: 'Commission earned on transactions',
        type: AccountType.REVENUE,
        sub_type: AccountSubType.SERVICE_FEE,
        parent_code: '4100.000.000',
      },
      {
        code: AccountCode.REVENUE_DELIVERY_FEE,
        name: 'Delivery Fees',
        description: 'Revenue from delivery charges',
        type: AccountType.REVENUE,
        sub_type: AccountSubType.SERVICE_FEE,
        parent_code: '4100.000.000',
      },

      // Product Revenue (4200)
      {
        code: AccountCode.REVENUE_AI_SUMMARY,
        name: 'AI Summary Revenue',
        description: 'Revenue from AI health summary purchases',
        type: AccountType.REVENUE,
        sub_type: AccountSubType.PRODUCT_SALE,
        parent_code: '4200.000.000',
      },
      {
        code: AccountCode.REVENUE_SUBSCRIPTION,
        name: 'Subscription Revenue',
        description: 'Revenue from subscription plans',
        type: AccountType.REVENUE,
        sub_type: AccountSubType.PRODUCT_SALE,
        parent_code: '4200.000.000',
      },

      // Other Revenue (4300)
      {
        code: AccountCode.REVENUE_INTEREST,
        name: 'Interest Income',
        description: 'Interest earned on held funds',
        type: AccountType.REVENUE,
        sub_type: AccountSubType.OTHER_INCOME,
        parent_code: '4300.000.000',
      },
      {
        code: AccountCode.REVENUE_PENALTY_FEES,
        name: 'Penalty Fees',
        description: 'Late fees and penalty charges',
        type: AccountType.REVENUE,
        sub_type: AccountSubType.OTHER_INCOME,
        parent_code: '4300.000.000',
      },

      // ============ EXPENSES (5000) ============

      // Payment Processing (5100)
      {
        code: AccountCode.EXPENSE_PAYSTACK_FEES,
        name: 'Paystack Processing Fees',
        description: 'Fees charged by Paystack for transactions',
        type: AccountType.EXPENSE,
        sub_type: AccountSubType.PROCESSING_FEE,
        parent_code: '5100.000.000',
      },
      {
        code: AccountCode.EXPENSE_BANK_CHARGES,
        name: 'Bank Charges',
        description: 'Bank fees and charges',
        type: AccountType.EXPENSE,
        sub_type: AccountSubType.PROCESSING_FEE,
        parent_code: '5100.000.000',
      },
      {
        code: AccountCode.EXPENSE_TRANSFER_FEES,
        name: 'Transfer Fees',
        description: 'Fees for bank transfers and withdrawals',
        type: AccountType.EXPENSE,
        sub_type: AccountSubType.PROCESSING_FEE,
        parent_code: '5100.000.000',
      },

      // Refunds & Losses (5200)
      {
        code: AccountCode.EXPENSE_REFUNDS,
        name: 'Refunds Expense',
        description: 'Loss from refunding commission on cancelled orders',
        type: AccountType.EXPENSE,
        sub_type: AccountSubType.REFUND_EXPENSE,
        parent_code: '5200.000.000',
      },
      {
        code: AccountCode.EXPENSE_CHARGEBACKS,
        name: 'Chargebacks',
        description: 'Losses from payment chargebacks',
        type: AccountType.EXPENSE,
        sub_type: AccountSubType.REFUND_EXPENSE,
        parent_code: '5200.000.000',
      },

      // Operational (5300)
      {
        code: AccountCode.EXPENSE_SMS,
        name: 'SMS Expenses',
        description: 'Cost of sending SMS notifications',
        type: AccountType.EXPENSE,
        sub_type: AccountSubType.OPERATIONAL,
        parent_code: '5300.000.000',
      },
      {
        code: AccountCode.EXPENSE_AI_API,
        name: 'AI API Costs',
        description: 'Costs for AI services (Infermedica, Claude)',
        type: AccountType.EXPENSE,
        sub_type: AccountSubType.OPERATIONAL,
        parent_code: '5300.000.000',
      },
    ];
  }

  /**
   * Seed the chart of accounts
   */
  async seedAccounts(): Promise<void> {
    const accountData = this.getAccountSeedData();

    for (const data of accountData) {
      const normalBalance = getNormalBalance(data.type);

      await this.accountModel.create({
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        sub_type: data.sub_type,
        normal_balance: normalBalance,
        parent_code: data.parent_code,
        currency: 'NGN',
        is_active: true,
        is_system_account: true,
        current_balance: 0,
      });
    }

    this.logger.log(`Seeded ${accountData.length} accounts`);
  }

  /**
   * Get all accounts
   */
  async getAllAccounts(): Promise<AccountDocument[]> {
    return this.accountModel.find({ is_active: true }).sort({ code: 1 });
  }

  /**
   * Get account by code
   */
  async getAccountByCode(code: string): Promise<AccountDocument | null> {
    return this.accountModel.findOne({ code });
  }

  /**
   * Get accounts by type
   */
  async getAccountsByType(type: AccountType): Promise<AccountDocument[]> {
    return this.accountModel.find({ type, is_active: true }).sort({ code: 1 });
  }

  /**
   * Get account hierarchy
   */
  async getAccountHierarchy(): Promise<Record<string, AccountDocument[]>> {
    const accounts = await this.getAllAccounts();

    const hierarchy: Record<string, AccountDocument[]> = {
      [AccountType.ASSET]: [],
      [AccountType.LIABILITY]: [],
      [AccountType.EQUITY]: [],
      [AccountType.REVENUE]: [],
      [AccountType.EXPENSE]: [],
    };

    for (const account of accounts) {
      hierarchy[account.type].push(account);
    }

    return hierarchy;
  }

  /**
   * Create a custom account (non-system)
   */
  async createAccount(data: {
    code: string;
    name: string;
    description: string;
    type: AccountType;
    sub_type: AccountSubType;
    parent_code?: string;
  }): Promise<AccountDocument> {
    // Validate code format
    if (!/^\d{4}\.\d{3}\.\d{3}$/.test(data.code)) {
      throw new Error('Invalid account code format. Use XXXX.XXX.XXX');
    }

    // Check if account already exists
    const existing = await this.accountModel.findOne({ code: data.code });
    if (existing) {
      throw new Error(`Account with code ${data.code} already exists`);
    }

    const normalBalance = getNormalBalance(data.type);

    return this.accountModel.create({
      ...data,
      normal_balance: normalBalance,
      currency: 'NGN',
      is_active: true,
      is_system_account: false,
      current_balance: 0,
    });
  }

  /**
   * Deactivate an account (only non-system accounts)
   */
  async deactivateAccount(code: string): Promise<void> {
    const account = await this.accountModel.findOne({ code });

    if (!account) {
      throw new Error(`Account not found: ${code}`);
    }

    if (account.is_system_account) {
      throw new Error('Cannot deactivate system account');
    }

    if (account.current_balance !== 0) {
      throw new Error('Cannot deactivate account with non-zero balance');
    }

    await this.accountModel.updateOne({ code }, { is_active: false });
  }
}
