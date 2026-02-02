/**
 * Unified Financial Architecture - Account Codes and Enums
 *
 * Account Code Format: XXXX.XXX.XXX
 * - First 4 digits: Category (1000=Assets, 2000=Liabilities, 3000=Equity, 4000=Revenue, 5000=Expenses)
 * - Next 3 digits: Sub-category
 * - Final 3 digits: Specific account
 */

// ============ ACCOUNT TYPE ENUMS ============

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum AccountSubType {
  // Asset subtypes
  CASH = 'CASH',
  RECEIVABLE = 'RECEIVABLE',
  WALLET_POOL = 'WALLET_POOL',

  // Liability subtypes
  WALLET_LIABILITY = 'WALLET_LIABILITY',
  PAYABLE = 'PAYABLE',
  DEFERRED = 'DEFERRED',

  // Revenue subtypes
  SERVICE_FEE = 'SERVICE_FEE',
  PRODUCT_SALE = 'PRODUCT_SALE',
  OTHER_INCOME = 'OTHER_INCOME',

  // Expense subtypes
  PROCESSING_FEE = 'PROCESSING_FEE',
  OPERATIONAL = 'OPERATIONAL',
  ADJUSTMENT = 'ADJUSTMENT',
  REFUND_EXPENSE = 'REFUND_EXPENSE',

  // Equity subtypes
  RETAINED = 'RETAINED',
  OPENING = 'OPENING',
}

export enum NormalBalance {
  DEBIT = 'DEBIT', // Assets, Expenses increase with debit
  CREDIT = 'CREDIT', // Liabilities, Equity, Revenue increase with credit
}

// ============ ACCOUNT CODES ============

export enum AccountCode {
  // ============ ASSETS (1000) ============

  // Cash & Bank (1100)
  CASH_PAYSTACK = '1100.001.001', // Paystack settlement account
  CASH_BANK_NGN = '1100.001.002', // Bank account (NGN)
  CASH_BANK_USD = '1100.001.003', // Bank account (USD) - future

  // Receivables (1200)
  RECEIVABLE_PENDING_PAYMENTS = '1200.001.001', // Pending Paystack verifications
  RECEIVABLE_REFUNDS = '1200.002.001', // Refunds due from Paystack

  // Platform Wallet Assets (1300) - Money held on behalf of users
  PATIENT_WALLET_POOL = '1300.001.001', // Total patient wallet funds
  SPECIALIST_WALLET_POOL = '1300.002.001', // Total specialist wallet funds
  SPECIALIST_HELD_FUNDS = '1300.002.002', // Specialist funds on hold
  APPOINTMENT_ESCROW_POOL = '1300.003.001', // Appointment funds held in escrow

  // ============ LIABILITIES (2000) ============

  // User Wallet Liabilities (2100) - Owed to users
  LIABILITY_PATIENT_WALLETS = '2100.001.001', // Owed to patients
  LIABILITY_SPECIALIST_WALLETS = '2100.002.001', // Owed to specialists
  LIABILITY_SPECIALIST_HELD = '2100.002.002', // Held specialist funds liability
  LIABILITY_APPOINTMENT_ESCROW = '2100.003.001', // Appointment escrow (held until completion)

  // Payables (2200)
  PAYABLE_PHARMACY = '2200.001.001', // Owed to pharmacies
  PAYABLE_WITHDRAWALS = '2200.002.001', // Pending withdrawal requests
  PAYABLE_REFUNDS = '2200.003.001', // Pending refunds to users

  // Deferred Revenue (2300)
  DEFERRED_SUBSCRIPTION = '2300.001.001', // Prepaid subscriptions

  // ============ EQUITY (3000) ============

  RETAINED_EARNINGS = '3000.001.001',
  OPENING_BALANCE = '3000.002.001', // Migration opening balances

  // ============ REVENUE (4000) ============

  // Service Fees (4100)
  REVENUE_APPOINTMENT_FEE = '4100.001.001',
  REVENUE_PRESCRIPTION_FEE = '4100.002.001',
  REVENUE_PLATFORM_COMMISSION = '4100.003.001', // Commission on payments
  REVENUE_DELIVERY_FEE = '4100.004.001',

  // Product Revenue (4200)
  REVENUE_AI_SUMMARY = '4200.001.001', // AI health summary purchases
  REVENUE_SUBSCRIPTION = '4200.002.001', // Subscription revenue

  // Other Revenue (4300)
  REVENUE_INTEREST = '4300.001.001',
  REVENUE_PENALTY_FEES = '4300.002.001',

  // ============ EXPENSES (5000) ============

  // Payment Processing (5100)
  EXPENSE_PAYSTACK_FEES = '5100.001.001',
  EXPENSE_BANK_CHARGES = '5100.002.001',
  EXPENSE_TRANSFER_FEES = '5100.003.001',

  // Refunds & Chargebacks (5200)
  EXPENSE_REFUNDS = '5200.001.001',
  EXPENSE_CHARGEBACKS = '5200.002.001',

  // Operational (5300)
  EXPENSE_SMS = '5300.001.001',
  EXPENSE_AI_API = '5300.002.001', // Infermedica, Claude API costs
}

// ============ LEDGER ENTRY ENUMS ============

export enum EntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum EntryStatus {
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

// ============ TRANSACTION BATCH ENUMS ============

export enum BatchStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
  PARTIALLY_REVERSED = 'PARTIALLY_REVERSED',
}

export enum TransactionCategory {
  // Wallet Operations
  WALLET_TOPUP = 'WALLET_TOPUP',
  WALLET_WITHDRAWAL = 'WALLET_WITHDRAWAL',
  WALLET_TRANSFER = 'WALLET_TRANSFER',
  ADMIN_CREDIT = 'ADMIN_CREDIT',
  ADMIN_DEBIT = 'ADMIN_DEBIT',

  // Payments
  APPOINTMENT_PAYMENT = 'APPOINTMENT_PAYMENT',
  PRESCRIPTION_PAYMENT = 'PRESCRIPTION_PAYMENT',
  PHARMACY_ORDER_PAYMENT = 'PHARMACY_ORDER_PAYMENT',
  SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT',
  AI_SUMMARY_PURCHASE = 'AI_SUMMARY_PURCHASE',

  // Specialist specific
  SPECIALIST_HOLD = 'SPECIALIST_HOLD',
  SPECIALIST_RELEASE = 'SPECIALIST_RELEASE',
  SPECIALIST_SETTLE = 'SPECIALIST_SETTLE',

  // Appointment lifecycle
  APPOINTMENT_ESCROW_HOLD = 'APPOINTMENT_ESCROW_HOLD', // Funds held when booking confirmed
  APPOINTMENT_ESCROW_REFUND = 'APPOINTMENT_ESCROW_REFUND', // Refund on cancellation
  APPOINTMENT_ESCROW_SETTLE = 'APPOINTMENT_ESCROW_SETTLE', // Settlement on completion
  APPOINTMENT_NO_SHOW_SETTLE = 'APPOINTMENT_NO_SHOW_SETTLE', // Settlement on no-show

  // Refunds
  REFUND = 'REFUND',
  CHARGEBACK = 'CHARGEBACK',

  // Internal
  FEE_COLLECTION = 'FEE_COLLECTION',
  COMMISSION_COLLECTION = 'COMMISSION_COLLECTION',

  // System
  MIGRATION = 'MIGRATION',
  ADJUSTMENT = 'ADJUSTMENT',
  REVERSAL = 'REVERSAL',
}

// ============ WALLET ENUMS ============

export enum WalletOwnerType {
  PATIENT = 'PATIENT',
  SPECIALIST = 'SPECIALIST',
  LIFEGUARD = 'LIFEGUARD',
  PHARMACY = 'PHARMACY',
  PLATFORM = 'PLATFORM', // System wallets
}

export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  FROZEN = 'FROZEN', // All operations blocked
  CLOSED = 'CLOSED',
}

// ============ HELPER FUNCTIONS ============

/**
 * Get the normal balance for an account type
 */
export function getNormalBalance(accountType: AccountType): NormalBalance {
  switch (accountType) {
    case AccountType.ASSET:
    case AccountType.EXPENSE:
      return NormalBalance.DEBIT;
    case AccountType.LIABILITY:
    case AccountType.EQUITY:
    case AccountType.REVENUE:
      return NormalBalance.CREDIT;
    default:
      return NormalBalance.DEBIT;
  }
}

/**
 * Get account type from account code prefix
 */
export function getAccountTypeFromCode(code: string): AccountType {
  const prefix = code.substring(0, 1);
  switch (prefix) {
    case '1':
      return AccountType.ASSET;
    case '2':
      return AccountType.LIABILITY;
    case '3':
      return AccountType.EQUITY;
    case '4':
      return AccountType.REVENUE;
    case '5':
      return AccountType.EXPENSE;
    default:
      throw new Error(`Invalid account code prefix: ${prefix}`);
  }
}

/**
 * Validate account code format
 */
export function isValidAccountCode(code: string): boolean {
  return /^\d{4}\.\d{3}\.\d{3}$/.test(code);
}
