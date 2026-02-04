# Rapid Capsule - Paystack & Accounting Integration Guide

**Author:** Bassey Eyo (eyobassey@gmail.com)
**Version:** 1.0
**Last Updated:** February 4, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Paystack Integration](#paystack-integration)
   - [Configuration](#configuration)
   - [Payment Flow Architecture](#payment-flow-architecture)
   - [Initialize Payment](#initialize-payment)
   - [Verify Payment](#verify-payment)
   - [Webhook Handling](#webhook-handling)
3. [Wallet System](#wallet-system)
   - [Unified Wallet Service](#unified-wallet-service)
   - [Wallet Top-up Flow](#wallet-top-up-flow)
   - [Wallet Payment Flow](#wallet-payment-flow)
4. [Chart of Accounts](#chart-of-accounts)
   - [Account Structure](#account-structure)
   - [Account Codes](#account-codes)
   - [Double-Entry Accounting Principles](#double-entry-accounting-principles)
5. [Accounting Service](#accounting-service)
   - [Transaction Batches](#transaction-batches)
   - [Ledger Entries](#ledger-entries)
   - [Recording Transactions](#recording-transactions)
6. [Implementation Examples](#implementation-examples)
   - [Example 1: Prescription Card Payment](#example-1-prescription-card-payment)
   - [Example 2: Wallet Top-up](#example-2-wallet-top-up)
   - [Example 3: Wallet Payment](#example-3-wallet-payment)
   - [Example 4: Appointment Payment](#example-4-appointment-payment)
7. [Troubleshooting](#troubleshooting)
8. [Quick Reference](#quick-reference)

---

## Overview

This document provides a comprehensive guide for integrating payment functionality into the Rapid Capsule platform. It covers:

- **Paystack Integration**: Card payments via Paystack payment gateway
- **Wallet System**: Internal wallet for patients and specialists
- **Chart of Accounts**: Double-entry bookkeeping for all financial transactions

### Key Principles

1. **All payments must be recorded in the Chart of Accounts**
2. **Double-entry accounting**: Every transaction has equal debits and credits
3. **Webhook reliability**: Don't rely solely on frontend verification; webhooks are the source of truth
4. **Idempotency**: Prevent duplicate processing of the same payment

---

## Paystack Integration

### Configuration

**Environment Variables** (in `ecosystem.config.js`):

```javascript
PAYSTACK_SECRET_KEY: "sk_test_xxxxx",  // or sk_live_xxxxx for production
PAYSTACK_PUBLIC_KEY: "pk_test_xxxxx",  // or pk_live_xxxxx for production
```

**Paystack Dashboard Settings**:
- **Webhook URL**: `https://api.rapidcapsule.com/api/webhooks/paystack`
- **Callback URL**: Set per transaction (where user returns after payment)

### Payment Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CARD PAYMENT FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Frontend                    2. Backend                   3. Paystack    │
│  ┌──────────┐                  ┌──────────┐                 ┌──────────┐   │
│  │ User     │ ──Initialize──▶  │ Create   │ ──API Call──▶  │ Create   │   │
│  │ Clicks   │                  │ Payment  │                 │ Checkout │   │
│  │ Pay      │                  │ Record   │ ◀─Auth URL──    │ Session  │   │
│  └──────────┘                  └──────────┘                 └──────────┘   │
│       │                                                           │         │
│       │ ◀──────────────── Redirect to Paystack ──────────────────┘         │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────┐                                               ┌──────────┐   │
│  │ User     │ ────────────── Completes Payment ──────────▶  │ Process  │   │
│  │ Pays on  │                                               │ Payment  │   │
│  │ Paystack │                                               └──────────┘   │
│  └──────────┘                                                     │         │
│       │                                                           │         │
│       │ ◀──────────────── Redirect to Callback URL ───────────────┘         │
│       │                                                           │         │
│       ▼                                                           ▼         │
│  ┌──────────┐                  ┌──────────┐                 ┌──────────┐   │
│  │ Frontend │ ──Verify Call──▶ │ Backend  │                 │ Webhook  │   │
│  │ Calls    │                  │ Verify   │                 │ Sent to  │   │
│  │ Verify   │                  │ w/retry  │                 │ Backend  │   │
│  └──────────┘                  └──────────┘                 └──────────┘   │
│       │                              │                            │         │
│       │                              ▼                            ▼         │
│       │                        ┌──────────┐                 ┌──────────┐   │
│       │                        │ Update   │ ◀───Either───▶  │ Update   │   │
│       │                        │ Status   │    Path Works   │ Status   │   │
│       │                        └──────────┘                 └──────────┘   │
│       │                              │                            │         │
│       │                              ▼                            ▼         │
│       │                        ┌─────────────────────────────────────┐     │
│       │                        │     Record in Chart of Accounts     │     │
│       │                        │     (Double-Entry Bookkeeping)      │     │
│       │                        └─────────────────────────────────────┘     │
│       │                                        │                            │
│       ◀──────────────── Return Updated Entity ─┘                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Initialize Payment

**File**: `src/common/external/payment/providers/paystack.ts`

```typescript
async initializeTransaction(
  email: string,
  amount: number,        // Amount in Naira (NOT kobo)
  reference: string,     // Unique reference
  metadata?: any,        // Custom data for tracking
) {
  const url = `${this.baseUrl}${this.initializeTransactionUrl}`;
  const data: any = {
    email,
    amount: (+amount * 100).toString(),  // Convert to kobo here
    reference,
    metadata,
    channels: ['card'],
  };

  if (metadata?.callback_url) {
    data.callback_url = metadata.callback_url;
  }

  const response = await post(url, data, { headers: this.headers });
  return response;
}
```

**Usage in Service**:

```typescript
// 1. Generate unique reference
const reference = this.generalHelpers.genTxReference();

// 2. Create payment record BEFORE calling Paystack
await this.paymentsService.create(
  userId,
  reference,
  amount,
  PaymentFor.PRESCRIPTION,  // or WALLET_TOPUP, APPOINTMENT, etc.
);

// 3. Initialize Paystack payment
const callbackUrl = `https://rapidcapsule.com/app/patient/prescriptions/details/${id}?payment=success&reference=${reference}`;

const paymentResponse = await this.paymentHandler.initializeTransaction(
  userEmail,
  amount,  // In Naira
  reference,
  {
    type: 'prescription_self_payment',
    prescription_id: id.toString(),
    patient_id: userId.toString(),
    callback_url: callbackUrl,
  },
);

// 4. Return authorization URL to frontend
return {
  authorization_url: paymentResponse.data?.data?.authorization_url,
  reference,
  amount,
};
```

### Verify Payment

**File**: `src/common/external/payment/providers/paystack.ts`

```typescript
async verifyTransaction(reference: string) {
  const url = `${this.baseUrl}${this.verifyTransactionUrl}${reference}`;
  try {
    const { data } = await get(url, this.headers);
    return data;  // Returns { status: true, data: { status: 'success', amount: ... } }
  } catch (error) {
    this.logger.error(error);
    return error;  // Returns error object
  }
}
```

**Verification Response Structure**:

```javascript
// Success Response
{
  status: true,
  message: "Verification successful",
  data: {
    status: "success",        // Payment status
    reference: "xxx",
    amount: 100000,           // In kobo
    currency: "NGN",
    metadata: { ... },
    customer: { ... },
    authorization: { ... },   // Card details (reusable)
    paid_at: "2026-02-04T15:00:50.000Z"
  }
}

// Failed/Pending Response
{
  status: true,
  data: {
    status: "failed" | "pending" | "abandoned",
    ...
  }
}
```

**Best Practice - Verification with Retry**:

```typescript
async verifyPayment(reference: string, entityId: ObjectId) {
  // Check if already paid
  const entity = await this.model.findById(entityId);
  if (entity.payment_status === 'PAID') {
    return { success: true, entity };
  }

  // Verify with Paystack
  const verification = await this.paymentHandler.verifyTransaction(reference);
  const paystackStatus = verification?.data?.status;

  if (paystackStatus === 'success') {
    const amount = verification.data.amount / 100;  // Convert from kobo

    // Update entity
    await this.model.updateOne(
      { _id: entityId },
      { payment_status: 'PAID', paid_at: new Date() }
    );

    // Record in accounting
    await this.accountingService.recordPayment({ ... });

    return { success: true, payment_status: 'PAID', entity: await this.model.findById(entityId) };
  }

  if (paystackStatus === 'pending' || paystackStatus === 'abandoned') {
    // Re-fetch entity in case webhook updated it
    const updatedEntity = await this.model.findById(entityId);
    return {
      success: updatedEntity.payment_status === 'PAID',
      status: updatedEntity.payment_status === 'PAID' ? 'success' : 'pending',
      entity: updatedEntity,
    };
  }

  if (paystackStatus === 'failed') {
    await this.model.updateOne({ _id: entityId }, { payment_status: 'FAILED' });
    throw new BadRequestException('Payment failed');
  }

  return { success: false, status: 'pending' };
}
```

### Webhook Handling

**Webhook URL**: `POST /api/webhooks/paystack`

**File**: `src/modules/whatsapp/controllers/whatsapp-payment-webhook.controller.ts`

The webhook controller receives ALL Paystack events and routes them appropriately:

```typescript
@Post()
@HttpCode(HttpStatus.OK)
async handlePaystackWebhook(
  @Body() payload: any,
  @Headers('x-paystack-signature') signature: string,
) {
  // 1. Verify webhook signature
  if (!this.verifySignature(payload, signature)) {
    return { status: 'error', message: 'Invalid signature' };
  }

  const { event, data } = payload;

  switch (event) {
    case 'charge.success':
      await this.handleChargeSuccess(data, payload);
      break;
    case 'charge.failed':
      await this.handleChargeFailed(data);
      break;
  }

  return { status: 'success' };
}

private async handleChargeSuccess(data: any, fullPayload: any) {
  const { reference, metadata } = data;

  // Route based on payment type
  if (metadata?.source === 'WHATSAPP') {
    // Handle WhatsApp order payment
    await this.handleWhatsAppPayment(data);
  } else {
    // Forward to general webhook service for wallet, prescriptions, appointments
    await this.webhooksService.createWebhook(fullPayload);
  }
}
```

**General Webhook Service** (`src/modules/webhooks/webhooks.service.ts`):

```typescript
async handleTransactionSuccess(webhook: WebhookDocument) {
  const payment = await this.paymentService.findPaymentByReference(webhook.data.reference);
  const amount = Number(webhook.data.amount) / 100;

  // Update payment status
  await this.paymentService.updatePayment(webhook.data.reference, {
    status: Status.SUCCESSFUL,
  });

  // Route based on payment type
  switch (payment.payment_for) {
    case PaymentFor.WALLET_TOPUP:
      await this.walletsService.creditWallet(userId, amount, reference, 'Wallet top-up');
      break;

    case PaymentFor.PRESCRIPTION:
      await this.handlePrescriptionPayment(webhook, payment, amount);
      break;

    case PaymentFor.APPOINTMENT:
      // Handle appointment payment
      break;
  }
}
```

**Signature Verification**:

```typescript
private verifySignature(payload: any, signature: string): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hash === signature;
}
```

---

## Wallet System

### Unified Wallet Service

**File**: `src/modules/accounting/services/unified-wallet.service.ts`

The unified wallet service provides a single interface for wallet operations with automatic accounting integration.

```typescript
// Credit wallet
async creditWallet(
  ownerId: Types.ObjectId,
  ownerType: WalletOwnerType,
  amount: number,
  category: TransactionCategory,
  description: string,
  reference?: string,
): Promise<{ wallet: UnifiedWallet; batch: TransactionBatch }>

// Debit wallet
async debitWallet(
  ownerId: Types.ObjectId,
  ownerType: WalletOwnerType,
  amount: number,
  category: TransactionCategory,
  description: string,
  reference?: string,
): Promise<{ wallet: UnifiedWallet; batch: TransactionBatch }>

// Check balance
async getBalance(ownerId: Types.ObjectId, ownerType: WalletOwnerType): Promise<number>

// Check if has sufficient balance
async hasSufficientBalance(
  ownerId: Types.ObjectId,
  ownerType: WalletOwnerType,
  amount: number,
): Promise<boolean>
```

### Wallet Top-up Flow

**File**: `src/modules/wallets/wallets.service.ts`

```typescript
// Initialize funding
async initializeFunding(userId: Types.ObjectId, email: string, dto: FundWalletDto) {
  const reference = this.generalHelpers.genTxReference();

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

  return {
    authorization_url: paymentResponse.data?.data?.authorization_url,
    reference,
    amount: dto.amount,
  };
}

// Verify funding
async verifyFunding(userId: Types.ObjectId, reference: string) {
  // Check if already processed
  const existingTxn = await this.walletTxnModel.findOne({ reference, userId });
  if (existingTxn) {
    return { success: true, message: 'Payment already processed' };
  }

  // Verify with Paystack
  const verification = await this.paymentHandler.verifyTransaction(reference);
  if (verification.data?.status !== 'success') {
    throw new BadRequestException('Payment verification failed');
  }

  const amount = verification.data.amount / 100;

  // Credit wallet (automatically records in accounting)
  const { newBalance } = await this.creditWallet(userId, amount, reference, 'Wallet top-up');

  return { success: true, new_balance: newBalance };
}
```

### Wallet Payment Flow

**Example: Paying for Prescription with Wallet**

```typescript
async payWithWallet(prescriptionId: Types.ObjectId, patientId: Types.ObjectId) {
  const prescription = await this.prescriptionModel.findById(prescriptionId);

  // Check balance
  const hasSufficientBalance = await this.unifiedWalletService.hasSufficientBalance(
    patientId,
    WalletOwnerType.PATIENT,
    prescription.total_amount,
  );

  if (!hasSufficientBalance) {
    throw new BadRequestException('Insufficient wallet balance');
  }

  // Debit wallet (automatically records in accounting)
  await this.unifiedWalletService.debitWallet(
    patientId,
    WalletOwnerType.PATIENT,
    prescription.total_amount,
    TransactionCategory.PRESCRIPTION_PAYMENT,
    `Payment for prescription ${prescription.prescription_number}`,
    prescriptionId.toString(),
  );

  // Update prescription status
  await this.prescriptionModel.updateOne(
    { _id: prescriptionId },
    {
      payment_status: 'PAID',
      payment_method: 'PATIENT_WALLET',
      paid_at: new Date(),
    }
  );

  return { success: true };
}
```

---

## Chart of Accounts

### Account Structure

The chart of accounts follows a hierarchical structure:

```
XXXX.XXX.XXX
│    │   │
│    │   └── Sub-account (specific purpose)
│    └────── Account category
└─────────── Account type (1xxx=Assets, 2xxx=Liabilities, 4xxx=Revenue, 5xxx=Expenses)
```

### Account Codes

**File**: `src/modules/accounting/enums/account-codes.enum.ts`

```typescript
export enum AccountCode {
  // Assets (1xxx)
  CASH_PAYSTACK = '1100.001.001',           // Cash received via Paystack
  CASH_BANK = '1100.001.002',               // Cash in bank account
  ACCOUNTS_RECEIVABLE = '1200.001.001',     // Money owed to us

  // Liabilities (2xxx)
  PATIENT_WALLET = '2100.001.001',          // Patient wallet balances (we owe patients)
  SPECIALIST_WALLET = '2100.002.001',       // Specialist wallet balances
  ESCROW_APPOINTMENTS = '2200.001.001',     // Escrow for pending appointments
  ESCROW_PRESCRIPTIONS = '2200.001.002',    // Escrow for pending prescriptions

  // Revenue (4xxx)
  REVENUE_CONSULTATION = '4100.001.001',    // Revenue from consultations
  REVENUE_PRESCRIPTION_FEE = '4100.002.001', // Revenue from prescription fees
  REVENUE_PLATFORM_FEE = '4100.003.001',    // Platform/service fees

  // Expenses (5xxx)
  EXPENSE_PAYMENT_PROCESSING = '5100.001.001', // Paystack fees
  EXPENSE_REFUNDS = '5100.002.001',         // Customer refunds
}
```

### Double-Entry Accounting Principles

**The Golden Rule**: Every transaction must have equal DEBITS and CREDITS.

**Account Type Rules**:

| Account Type | Increases With | Decreases With |
|--------------|----------------|----------------|
| Assets       | DEBIT          | CREDIT         |
| Liabilities  | CREDIT         | DEBIT          |
| Revenue      | CREDIT         | DEBIT          |
| Expenses     | DEBIT          | CREDIT         |

**Common Transaction Patterns**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CARD PAYMENT RECEIVED                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  DEBIT   Cash/Paystack (Asset ↑)              NGN 1,000                 │
│  CREDIT  Revenue/Prescription Fee (Revenue ↑)  NGN 1,000                │
│                                                ─────────                 │
│                                    Balanced:   NGN 1,000 = NGN 1,000    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    WALLET TOP-UP                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  DEBIT   Cash/Paystack (Asset ↑)              NGN 5,000                 │
│  CREDIT  Patient Wallet (Liability ↑)          NGN 5,000                │
│                                                ─────────                 │
│                                    Balanced:   NGN 5,000 = NGN 5,000    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    WALLET PAYMENT FOR PRESCRIPTION                       │
├─────────────────────────────────────────────────────────────────────────┤
│  DEBIT   Patient Wallet (Liability ↓)          NGN 1,000                │
│  CREDIT  Revenue/Prescription Fee (Revenue ↑)  NGN 1,000                │
│                                                ─────────                 │
│                                    Balanced:   NGN 1,000 = NGN 1,000    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    APPOINTMENT WITH ESCROW                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Step 1: Payment Received (held in escrow)                              │
│  DEBIT   Cash/Paystack (Asset ↑)              NGN 10,000                │
│  CREDIT  Escrow/Appointments (Liability ↑)     NGN 10,000               │
│                                                                          │
│  Step 2: After consultation completed (release from escrow)             │
│  DEBIT   Escrow/Appointments (Liability ↓)     NGN 10,000               │
│  CREDIT  Specialist Wallet (Liability ↑)       NGN 8,500  (85%)         │
│  CREDIT  Revenue/Platform Fee (Revenue ↑)      NGN 1,500  (15%)         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Accounting Service

### Transaction Batches

**File**: `src/modules/accounting/entities/transaction-batch.entity.ts`

A transaction batch groups related ledger entries together:

```typescript
{
  batch_id: "TB-20260204-000006",      // Auto-generated
  category: "PRESCRIPTION_PAYMENT",    // Transaction category
  description: "Prescription payment: RX-20260204-0009",
  total_debits: 1000,
  total_credits: 1000,
  is_balanced: true,                   // Must be true
  entry_count: 2,
  currency: "NGN",
  status: "POSTED",                    // DRAFT → POSTED
  from_user: ObjectId,                 // Who initiated
  reference_type: "prescription",      // Entity type
  reference_id: ObjectId,              // Entity ID
  external_reference: "xxx",           // Paystack reference
  metadata: { ... }
}
```

### Ledger Entries

**File**: `src/modules/accounting/entities/ledger-entry.entity.ts`

Individual accounting entries:

```typescript
{
  batch_id: ObjectId,
  account_code: "1100.001.001",
  entry_type: "DEBIT" | "CREDIT",
  amount: 1000,
  description: "Card payment received - RX-20260204-0009",
  user_id: ObjectId,                   // Related user
  currency: "NGN",
  created_at: Date
}
```

### Recording Transactions

**File**: `src/modules/accounting/services/accounting.service.ts`

```typescript
// Generic method to create and post a batch
async createAndPostBatch(params: {
  category: TransactionCategory;
  description: string;
  entries: Array<{
    account_code: AccountCode;
    entry_type: EntryType;
    amount: number;
    description: string;
    user_id?: Types.ObjectId;
  }>;
  from_user?: Types.ObjectId;
  to_user?: Types.ObjectId;
  reference_type?: string;
  reference_id?: Types.ObjectId;
  external_reference?: string;
  metadata?: Record<string, any>;
}): Promise<TransactionBatchDocument>

// Specific method for prescription card payment
async recordPrescriptionCardPayment(data: {
  prescriptionId: Types.ObjectId;
  prescriptionNumber: string;
  patientId: Types.ObjectId;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
}): Promise<TransactionBatchDocument> {
  return this.createAndPostBatch({
    category: TransactionCategory.PRESCRIPTION_PAYMENT,
    description: `Prescription payment: ${data.prescriptionNumber}`,
    entries: [
      {
        account_code: AccountCode.CASH_PAYSTACK,
        entry_type: EntryType.DEBIT,
        amount: data.amount,
        description: `Card payment received - ${data.prescriptionNumber}`,
        user_id: data.patientId,
      },
      {
        account_code: AccountCode.REVENUE_PRESCRIPTION_FEE,
        entry_type: EntryType.CREDIT,
        amount: data.amount,
        description: `Revenue from prescription - ${data.prescriptionNumber}`,
        user_id: data.patientId,
      },
    ],
    from_user: data.patientId,
    reference_type: 'prescription',
    reference_id: data.prescriptionId,
    external_reference: data.paymentReference,
    metadata: {
      prescription_number: data.prescriptionNumber,
      payment_method: data.paymentMethod,
    },
  });
}
```

---

## Implementation Examples

### Example 1: Prescription Card Payment

**Complete flow for adding card payment to a new feature:**

**Step 1: Create Payment Record**

```typescript
// In your service file
import { PaymentsService } from '../payments/payments.service';
import { PaymentFor } from '../payments/entities/payment.entity';
import { PaymentHandler } from '../../common/external/payment/payment.handler';
import { AccountingService } from '../accounting/services/accounting.service';

@Injectable()
export class YourFeatureService {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentHandler: PaymentHandler,
    private readonly accountingService: AccountingService,
    private readonly generalHelpers: GeneralHelpers,
  ) {}

  async initiateCardPayment(entityId: Types.ObjectId, userId: Types.ObjectId) {
    const entity = await this.yourModel.findById(entityId);
    const user = await this.usersService.findById(userId);

    // Generate unique reference
    const reference = this.generalHelpers.genTxReference();

    // Create payment record for webhook routing
    await this.paymentsService.create(
      userId,
      reference,
      entity.amount,
      PaymentFor.YOUR_FEATURE,  // Add to PaymentFor enum
    );

    // Initialize Paystack
    const callbackUrl = `https://rapidcapsule.com/app/your-feature/${entityId}?payment=success&reference=${reference}`;

    const paymentResponse = await this.paymentHandler.initializeTransaction(
      user.email,
      entity.amount,
      reference,
      {
        type: 'your_feature_payment',
        entity_id: entityId.toString(),
        user_id: userId.toString(),
        callback_url: callbackUrl,
      },
    );

    // Update entity with payment reference
    await this.yourModel.updateOne(
      { _id: entityId },
      { payment_reference: reference }
    );

    return {
      authorization_url: paymentResponse.data?.data?.authorization_url,
      reference,
      amount: entity.amount,
    };
  }
}
```

**Step 2: Add Verify Endpoint**

```typescript
async verifyCardPayment(entityId: Types.ObjectId, userId: Types.ObjectId, reference: string) {
  let entity = await this.yourModel.findOne({ _id: entityId, user_id: userId });

  if (!entity) {
    throw new NotFoundException('Entity not found');
  }

  // Already paid?
  if (entity.payment_status === 'PAID') {
    return { success: true, payment_status: 'PAID', entity };
  }

  // Verify with Paystack
  const verification = await this.paymentHandler.verifyTransaction(reference);
  const paystackStatus = verification?.data?.status;

  if (paystackStatus === 'success') {
    const amount = verification.data.amount / 100;

    // Update entity
    await this.yourModel.updateOne(
      { _id: entityId },
      {
        payment_status: 'PAID',
        paid_at: new Date(),
      }
    );

    // Record in accounting
    await this.accountingService.createAndPostBatch({
      category: TransactionCategory.YOUR_CATEGORY,
      description: `Your feature payment: ${entity.reference_number}`,
      entries: [
        {
          account_code: AccountCode.CASH_PAYSTACK,
          entry_type: EntryType.DEBIT,
          amount,
          description: `Card payment received - ${entity.reference_number}`,
          user_id: userId,
        },
        {
          account_code: AccountCode.REVENUE_YOUR_FEATURE,
          entry_type: EntryType.CREDIT,
          amount,
          description: `Revenue from your feature - ${entity.reference_number}`,
          user_id: userId,
        },
      ],
      from_user: userId,
      reference_type: 'your_feature',
      reference_id: entityId,
      external_reference: reference,
    });

    return { success: true, payment_status: 'PAID', entity: await this.yourModel.findById(entityId) };
  }

  // Handle pending/failed
  if (paystackStatus === 'pending' || paystackStatus === 'abandoned' || !paystackStatus) {
    entity = await this.yourModel.findById(entityId);
    return {
      success: entity.payment_status === 'PAID',
      status: entity.payment_status === 'PAID' ? 'success' : 'pending',
      payment_status: entity.payment_status,
      entity,
    };
  }

  if (paystackStatus === 'failed') {
    await this.yourModel.updateOne({ _id: entityId }, { payment_status: 'FAILED' });
    throw new BadRequestException('Payment failed');
  }

  return { success: false, status: 'pending' };
}
```

**Step 3: Handle in Webhook Service**

Add to `webhooks.service.ts`:

```typescript
case PaymentFor.YOUR_FEATURE:
  await this.handleYourFeaturePayment(webhook, payment, amount);
  break;

private async handleYourFeaturePayment(webhook: WebhookDocument, payment: any, amount: number) {
  const entityId = webhook.data.metadata?.entity_id;

  if (!entityId) {
    this.logger.error('No entity_id in webhook metadata');
    return;
  }

  const entity = await this.yourModel.findOne({
    _id: new Types.ObjectId(entityId),
    payment_reference: webhook.data.reference,
  });

  if (!entity || entity.payment_status === 'PAID') {
    return;
  }

  // Update entity
  await this.yourModel.updateOne(
    { _id: entity._id },
    {
      payment_status: 'PAID',
      paid_at: new Date(),
    }
  );

  // Record in accounting
  await this.accountingService.createAndPostBatch({ ... });

  this.logger.log(`Your feature ${entity.reference_number} marked as paid`);
}
```

**Step 4: Frontend Integration**

```javascript
// Initialize payment
async payWithCard() {
  try {
    const response = await api.initializePayment(entityId);
    const authUrl = response.data?.data?.authorization_url;
    if (authUrl) {
      localStorage.setItem('pending_payment', entityId);
      window.location.href = authUrl;
    }
  } catch (err) {
    this.$toast.error('Failed to initiate payment');
  }
}

// On mounted - check for payment callback
async mounted() {
  const paymentStatus = this.$route.query.payment;
  const reference = this.$route.query.reference || this.$route.query.trxref;

  if ((paymentStatus === 'success' || this.$route.query.trxref) && reference) {
    await this.verifyPayment(reference);
  } else {
    await this.fetchEntity();
  }
}

// Verify with retries
async verifyPayment(reference, retryCount = 0) {
  this.loading = true;
  try {
    const response = await api.verifyPayment(this.entityId, reference);
    const result = response.data?.data;

    const isPaid = result?.payment_status === 'PAID' || result?.success === true;

    if (!isPaid && result?.status === 'pending' && retryCount < 6) {
      this.$toast.info(`Verifying payment... (${retryCount + 1}/6)`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return this.verifyPayment(reference, retryCount + 1);
    }

    this.$router.replace({ path: this.$route.path });
    localStorage.removeItem('pending_payment');

    if (isPaid) {
      this.$toast.success('Payment verified!');
      if (result?.entity) {
        this.entity = result.entity;
      } else {
        await this.fetchEntity();
      }
    } else {
      this.$toast.info('Payment processing...');
      await this.fetchEntity();
    }
  } catch (err) {
    this.$toast.error('Verifying payment...');
    this.$router.replace({ path: this.$route.path });
    await this.fetchEntity();
  } finally {
    this.loading = false;
  }
}
```

### Example 2: Wallet Top-up

```typescript
// Accounting entries for wallet top-up
await this.accountingService.createAndPostBatch({
  category: TransactionCategory.WALLET_TOPUP,
  description: 'Wallet top-up via Paystack',
  entries: [
    {
      account_code: AccountCode.CASH_PAYSTACK,
      entry_type: EntryType.DEBIT,
      amount,
      description: 'Wallet top-up via Paystack',
      user_id: userId,
    },
    {
      account_code: AccountCode.PATIENT_WALLET,
      entry_type: EntryType.CREDIT,
      amount,
      description: 'Wallet top-up via Paystack',
      user_id: userId,
    },
  ],
  from_user: userId,
  reference_type: 'wallet_topup',
  external_reference: reference,
});
```

### Example 3: Wallet Payment

```typescript
// Accounting entries for wallet payment
await this.accountingService.createAndPostBatch({
  category: TransactionCategory.PRESCRIPTION_PAYMENT,
  description: `Prescription payment: ${prescriptionNumber}`,
  entries: [
    {
      account_code: AccountCode.PATIENT_WALLET,
      entry_type: EntryType.DEBIT,  // Reduce liability (we owe less)
      amount,
      description: `Wallet payment - ${prescriptionNumber}`,
      user_id: patientId,
    },
    {
      account_code: AccountCode.REVENUE_PRESCRIPTION_FEE,
      entry_type: EntryType.CREDIT,
      amount,
      description: `Revenue from prescription - ${prescriptionNumber}`,
      user_id: patientId,
    },
  ],
  from_user: patientId,
  reference_type: 'prescription',
  reference_id: prescriptionId,
});
```

### Example 4: Appointment Payment with Escrow

```typescript
// Step 1: Payment received - hold in escrow
await this.accountingService.createAndPostBatch({
  category: TransactionCategory.APPOINTMENT_PAYMENT,
  description: `Appointment payment - ${appointmentId}`,
  entries: [
    {
      account_code: AccountCode.CASH_PAYSTACK,
      entry_type: EntryType.DEBIT,
      amount: totalAmount,
      description: 'Appointment payment received',
    },
    {
      account_code: AccountCode.ESCROW_APPOINTMENTS,
      entry_type: EntryType.CREDIT,
      amount: totalAmount,
      description: 'Held in escrow pending consultation',
    },
  ],
});

// Step 2: After consultation - release from escrow
const platformFee = totalAmount * 0.15;
const specialistAmount = totalAmount - platformFee;

await this.accountingService.createAndPostBatch({
  category: TransactionCategory.ESCROW_RELEASE,
  description: `Escrow release - ${appointmentId}`,
  entries: [
    {
      account_code: AccountCode.ESCROW_APPOINTMENTS,
      entry_type: EntryType.DEBIT,
      amount: totalAmount,
      description: 'Released from escrow',
    },
    {
      account_code: AccountCode.SPECIALIST_WALLET,
      entry_type: EntryType.CREDIT,
      amount: specialistAmount,
      description: 'Specialist earnings',
    },
    {
      account_code: AccountCode.REVENUE_PLATFORM_FEE,
      entry_type: EntryType.CREDIT,
      amount: platformFee,
      description: 'Platform fee',
    },
  ],
});
```

---

## Troubleshooting

### Common Issues

**1. Webhook not received**
- Check Paystack dashboard webhook URL: `https://api.rapidcapsule.com/api/webhooks/paystack`
- Check server logs for incoming webhook requests
- Verify signature validation isn't failing

**2. Verify returns 400 from Paystack**
- This is normal if called too quickly after payment
- Implement retry logic with delays (3 seconds, 6 retries)
- Webhook will update status even if verify fails

**3. Payment stuck on pending**
- Check if webhook was received and processed
- Check if PaymentFor type is handled in webhook service
- Manually verify with Paystack API:
  ```bash
  curl -X GET "https://api.paystack.co/transaction/verify/REFERENCE" \
    -H "Authorization: Bearer sk_test_xxx"
  ```

**4. Accounting entries not balanced**
- Ensure total debits = total credits
- Check that amounts are consistent across entries
- Use `createAndPostBatch` which validates balance

**5. Duplicate payments**
- Check for existing payment before processing
- Use unique references
- Check `payment_status` before updating

### Debug Queries

```javascript
// Check payment record
db.payments.findOne({ reference: 'xxx' })

// Check prescription status
db.specialistprescriptions.findOne({ _id: ObjectId('xxx') })

// Check transaction batch
db.transaction_batches.findOne({ external_reference: 'xxx' })

// Check ledger entries
db.ledger_entries.find({ batch_id: ObjectId('xxx') })

// Verify double-entry balance
db.ledger_entries.aggregate([
  { $match: { batch_id: ObjectId('xxx') } },
  { $group: {
    _id: '$entry_type',
    total: { $sum: '$amount' }
  }}
])
```

---

## Quick Reference

### Payment Flow Checklist

- [ ] Generate unique reference
- [ ] Create payment record with correct `PaymentFor` type
- [ ] Initialize Paystack with callback URL
- [ ] Return authorization URL to frontend
- [ ] Handle verify endpoint with retry logic
- [ ] Handle in webhook service
- [ ] Record in chart of accounts
- [ ] Update entity status
- [ ] Return updated entity to frontend

### Account Codes Quick Reference

| Code | Name | Type | Use For |
|------|------|------|---------|
| 1100.001.001 | Cash/Paystack | Asset | Card payments received |
| 2100.001.001 | Patient Wallet | Liability | Patient wallet balances |
| 2100.002.001 | Specialist Wallet | Liability | Specialist earnings |
| 2200.001.001 | Escrow/Appointments | Liability | Held appointment payments |
| 4100.001.001 | Revenue/Consultation | Revenue | Consultation fees |
| 4100.002.001 | Revenue/Prescription | Revenue | Prescription fees |
| 4100.003.001 | Revenue/Platform | Revenue | Platform fees |

### Entry Type Rules

| When... | Account Type | Entry Type |
|---------|--------------|------------|
| Asset increases | Asset | DEBIT |
| Asset decreases | Asset | CREDIT |
| Liability increases | Liability | CREDIT |
| Liability decreases | Liability | DEBIT |
| Revenue increases | Revenue | CREDIT |
| Expense increases | Expense | DEBIT |

### Key Files

| Purpose | File Path |
|---------|-----------|
| Paystack Provider | `src/common/external/payment/providers/paystack.ts` |
| Payment Handler | `src/common/external/payment/payment.handler.ts` |
| Payments Service | `src/modules/payments/payments.service.ts` |
| Webhooks Controller | `src/modules/whatsapp/controllers/whatsapp-payment-webhook.controller.ts` |
| Webhooks Service | `src/modules/webhooks/webhooks.service.ts` |
| Accounting Service | `src/modules/accounting/services/accounting.service.ts` |
| Unified Wallet Service | `src/modules/accounting/services/unified-wallet.service.ts` |
| Account Codes Enum | `src/modules/accounting/enums/account-codes.enum.ts` |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-04 | Initial document |

---

*This document should be updated whenever payment or accounting features are modified.*
