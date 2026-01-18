# Patient Pharmacy Module - Implementation Plan

## Executive Summary

This document outlines the implementation plan for enhancing the patient-facing pharmacy feature on Rapid Capsule. The plan builds upon existing infrastructure while adding crucial features for cart management, wallet payments, prescription handling, abuse prevention, and order tracking.

---

## Current State Analysis

### Existing Implementation (What We Have)

#### Frontend Components (RC/src/views/Mainapp/Pharmacy/)
| Component | Status | Description |
|-----------|--------|-------------|
| `Cart.vue` | ✅ Complete | Cart with Vuex store, localStorage persistence |
| `Checkout.vue` | ⚠️ Partial | Order flow without wallet payment |
| `DrugDetails.vue` | ✅ Complete | OTC add-to-cart, Rx drug notice |
| `PrescriptionOrder.vue` | ⚠️ Partial | 4-step wizard, upload support, mock data |
| `OrderDetails.vue` | ✅ Complete | Timeline, items, pharmacy, payment info |
| `SelectPharmacy.vue` | ✅ Complete | Pharmacy selection with geolocation |
| `OrdersList.vue` | ✅ Complete | User's order history |

#### Vuex Store (RC/src/store/modules/pharmacy.js)
- ✅ Cart CRUD operations with localStorage
- ✅ OTC order creation
- ✅ Prescription order creation
- ✅ Drug search and category browsing
- ✅ Pharmacy search and selection
- ✅ Order tracking and cancellation
- ❌ Missing: Wallet payment integration
- ❌ Missing: Abuse prevention checks

#### Backend API (RC-Backend)
- ✅ Drug catalog endpoints (`/drugs/*`)
- ✅ Pharmacy endpoints (`/pharmacies/*`)
- ✅ Basic pharmacy order endpoints (`/pharmacy-orders/*`)
- ⚠️ Partial: Prescription integration with pharmacy orders
- ❌ Missing: Wallet payment for pharmacy orders
- ❌ Missing: Abuse prevention system

---

## Implementation Requirements

### 1. Wallet Payment Integration
- Add wallet as payment option at checkout
- Display wallet balance
- Handle insufficient balance scenarios
- Support split payment (wallet + card)

### 2. Non-OTC Drug Handling
- Clear visual differentiation for Rx drugs
- Block direct purchase without prescription
- Require prescription upload or selection before checkout
- Verify prescription validity

### 3. Abuse Prevention System
- Per-drug quantity limits
- Per-category quantity limits
- Rolling window purchase tracking (7-day, 30-day)
- Flagged drug monitoring (controlled substances)
- Alert system for suspicious patterns

### 4. Prescription Management
- View specialist-created prescriptions
- Upload external prescriptions
- Prescription-first purchase flow
- Prescription expiration handling

### 5. Order Timeline Enhancement
- Real-time status updates
- Push notifications
- Detailed timeline with timestamps
- Tracking integration

---

## Implementation Phases

## Phase 1: Wallet Payment Integration

### Priority: HIGH
### Estimated Effort: Medium

#### 1.1 Backend Changes (RC-Backend)

**File: `RC-Backend/src/modules/pharmacy-orders/pharmacy-orders.service.ts`**
```typescript
// Add wallet payment processing
async processWalletPayment(
  orderId: string,
  userId: string,
  amount: number,
): Promise<PaymentResult> {
  // 1. Check wallet balance
  // 2. Deduct from wallet
  // 3. Create transaction record
  // 4. Update order payment status
}

// Add split payment support
async processSplitPayment(
  orderId: string,
  userId: string,
  walletAmount: number,
  cardAmount: number,
  cardReference: string,
): Promise<PaymentResult> {
  // Handle combination of wallet + card payment
}
```

**New Endpoint:**
- `POST /pharmacy-orders/:id/pay-with-wallet` - Wallet payment
- `POST /pharmacy-orders/:id/pay-split` - Split wallet + card payment

#### 1.2 Frontend Changes (RC)

**File: `RC/src/views/Mainapp/Pharmacy/Checkout.vue`**

Add payment method selection:
```vue
<!-- Payment Method Selection -->
<div class="section payment-method-section">
  <h3 class="section-title">Payment Method</h3>
  <div class="payment-options">
    <label :class="['payment-option', { selected: paymentMethod === 'wallet' }]">
      <input type="radio" v-model="paymentMethod" value="wallet" :disabled="walletBalance < totalAmount" />
      <div class="option-content">
        <RCIcon name="wallet" />
        <div class="option-info">
          <span class="option-name">Wallet</span>
          <span class="option-balance">Balance: {{ formatPrice(walletBalance) }}</span>
        </div>
      </div>
    </label>
    <label :class="['payment-option', { selected: paymentMethod === 'card' }]">
      <input type="radio" v-model="paymentMethod" value="card" />
      <div class="option-content">
        <RCIcon name="credit-card" />
        <div class="option-info">
          <span class="option-name">Card Payment</span>
          <span class="option-desc">Pay with Paystack</span>
        </div>
      </div>
    </label>
    <label :class="['payment-option', { selected: paymentMethod === 'split' }]" v-if="walletBalance > 0 && walletBalance < totalAmount">
      <input type="radio" v-model="paymentMethod" value="split" />
      <div class="option-content">
        <RCIcon name="layers" />
        <div class="option-info">
          <span class="option-name">Split Payment</span>
          <span class="option-desc">{{ formatPrice(walletBalance) }} wallet + {{ formatPrice(totalAmount - walletBalance) }} card</span>
        </div>
      </div>
    </label>
  </div>
</div>
```

**File: `RC/src/store/modules/pharmacy.js`**

Add wallet payment action:
```javascript
async payWithWallet({ commit }, { orderId, amount }) {
  try {
    commit("SET_LOADING", true);
    const response = await axios.post(`pharmacy-orders/${orderId}/pay-with-wallet`, { amount });
    if (response.status === 200) {
      commit("SET_CURRENT_ORDER", response.data.result);
    }
    return response.data;
  } catch (error) {
    throw error;
  } finally {
    commit("SET_LOADING", false);
  }
}
```

---

## Phase 2: Non-OTC Drug Classification & Handling

### Priority: HIGH
### Estimated Effort: Medium

#### 2.1 Drug Classification Schema

**Drug Categories:**
| Category | Code | Requires Prescription | Purchase Limits |
|----------|------|----------------------|-----------------|
| OTC (Over-the-Counter) | `OTC` | No | Standard limits |
| BTC (Behind-the-Counter) | `BTC` | No (pharmacist consult) | Moderate limits |
| POM (Prescription Only) | `POM` | Yes | Strict limits |
| Controlled Substance | `CTRL` | Yes + Special handling | Very strict |

#### 2.2 Frontend Drug Card Enhancement

**File: `RC/src/views/Mainapp/Pharmacy/DrugCatalog.vue`**

Add visual classification badges:
```vue
<div class="drug-card">
  <div class="drug-badge-container">
    <span v-if="drug.requires_prescription" class="rx-badge">Rx</span>
    <span v-if="drug.is_controlled" class="controlled-badge">Controlled</span>
  </div>
  <!-- ... existing drug card content ... -->

  <div class="drug-card__actions">
    <!-- OTC drugs: Add to Cart -->
    <rc-button
      v-if="!drug.requires_prescription"
      type="primary"
      label="Add to Cart"
      @click="addToCart(drug)"
      :disabled="!drug.is_available"
    />

    <!-- Rx drugs: Order with Prescription -->
    <rc-button
      v-else
      type="secondary"
      label="Need Prescription"
      @click="orderWithPrescription(drug)"
    />
  </div>
</div>
```

#### 2.3 Cart Validation for Rx Drugs

**File: `RC/src/views/Mainapp/Pharmacy/Cart.vue`**

Add prescription requirement check:
```vue
<template>
  <!-- Rx Warning Banner -->
  <div v-if="hasRxItems" class="rx-warning-banner">
    <RCIcon name="alert-triangle" />
    <div class="warning-content">
      <strong>Prescription Required</strong>
      <p>{{ rxItemCount }} item(s) in your cart require a valid prescription.</p>
    </div>
    <rc-button type="secondary" size="small" label="Upload Prescription" @click="uploadPrescription" />
  </div>

  <!-- Cart Items with Rx indicator -->
  <div v-for="item in cart" :key="item.drugId" class="cart-item">
    <span v-if="item.requiresPrescription" class="rx-indicator">Rx</span>
    <!-- ... existing item content ... -->
  </div>
</template>

<script>
const hasRxItems = computed(() => {
  return cart.value.some(item => item.requiresPrescription);
});

const rxItemCount = computed(() => {
  return cart.value.filter(item => item.requiresPrescription).length;
});

const proceedToCheckout = () => {
  if (hasRxItems.value && !prescriptionUploaded.value) {
    // Block checkout, show prescription upload modal
    showPrescriptionModal.value = true;
    return;
  }
  router.push("/app/patient/pharmacy/checkout");
};
</script>
```

---

## Phase 3: Abuse Prevention System

### Priority: HIGH
### Estimated Effort: High

#### 3.1 Backend Abuse Prevention Module

**New File: `RC-Backend/src/modules/pharmacy-orders/abuse-prevention.service.ts`**

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AbusePrevention Service {
  constructor(
    @InjectModel('PharmacyOrder') private orderModel: Model<any>,
    @InjectModel('Drug') private drugModel: Model<any>,
  ) {}

  // Purchase limits by drug category
  private readonly PURCHASE_LIMITS = {
    OTC: { perOrder: 10, per7Days: 30, per30Days: 100 },
    BTC: { perOrder: 5, per7Days: 15, per30Days: 40 },
    POM: { perOrder: 1, per7Days: 3, per30Days: 6 },
    CTRL: { perOrder: 1, per7Days: 1, per30Days: 2 },
  };

  // Flagged drug IDs requiring special monitoring
  private readonly FLAGGED_DRUGS = [
    // Codeine-containing products
    // High-abuse potential drugs
  ];

  async validatePurchase(
    userId: string,
    items: Array<{ drugId: string; quantity: number }>,
  ): Promise<ValidationResult> {
    const validationResults = [];

    for (const item of items) {
      const drug = await this.drugModel.findById(item.drugId);
      if (!drug) continue;

      // 1. Check per-order limit
      const orderLimit = this.PURCHASE_LIMITS[drug.category]?.perOrder || 10;
      if (item.quantity > orderLimit) {
        validationResults.push({
          drugId: item.drugId,
          drugName: drug.name,
          issue: 'EXCEEDS_ORDER_LIMIT',
          message: `Maximum ${orderLimit} units per order for ${drug.name}`,
          allowed: orderLimit,
          requested: item.quantity,
        });
        continue;
      }

      // 2. Check 7-day rolling window
      const sevenDayPurchases = await this.getPurchaseHistory(userId, item.drugId, 7);
      const sevenDayLimit = this.PURCHASE_LIMITS[drug.category]?.per7Days || 30;
      if (sevenDayPurchases + item.quantity > sevenDayLimit) {
        validationResults.push({
          drugId: item.drugId,
          drugName: drug.name,
          issue: 'EXCEEDS_7DAY_LIMIT',
          message: `You have purchased ${sevenDayPurchases} units of ${drug.name} in the last 7 days. Maximum allowed: ${sevenDayLimit}`,
          allowed: sevenDayLimit - sevenDayPurchases,
          requested: item.quantity,
        });
        continue;
      }

      // 3. Check 30-day rolling window
      const thirtyDayPurchases = await this.getPurchaseHistory(userId, item.drugId, 30);
      const thirtyDayLimit = this.PURCHASE_LIMITS[drug.category]?.per30Days || 100;
      if (thirtyDayPurchases + item.quantity > thirtyDayLimit) {
        validationResults.push({
          drugId: item.drugId,
          drugName: drug.name,
          issue: 'EXCEEDS_30DAY_LIMIT',
          message: `You have purchased ${thirtyDayPurchases} units of ${drug.name} in the last 30 days. Maximum allowed: ${thirtyDayLimit}`,
          allowed: thirtyDayLimit - thirtyDayPurchases,
          requested: item.quantity,
        });
      }

      // 4. Check if flagged drug
      if (this.FLAGGED_DRUGS.includes(item.drugId)) {
        await this.logFlaggedPurchaseAttempt(userId, item);
      }
    }

    return {
      valid: validationResults.length === 0,
      issues: validationResults,
    };
  }

  private async getPurchaseHistory(
    userId: string,
    drugId: string,
    days: number,
  ): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.orderModel.aggregate([
      {
        $match: {
          patient: new mongoose.Types.ObjectId(userId),
          created_at: { $gte: startDate },
          status: { $nin: ['CANCELLED', 'REFUNDED'] },
        },
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.drug': new mongoose.Types.ObjectId(drugId),
        },
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
    ]);

    return orders[0]?.totalQuantity || 0;
  }

  private async logFlaggedPurchaseAttempt(
    userId: string,
    item: { drugId: string; quantity: number },
  ): Promise<void> {
    // Log for admin review
    // Could trigger admin notification for review
  }
}
```

#### 3.2 API Integration

**File: `RC-Backend/src/modules/pharmacy-orders/pharmacy-orders.controller.ts`**

Add validation endpoint:
```typescript
@Post('validate-cart')
async validateCart(
  @Req() req,
  @Body() body: { items: Array<{ drugId: string; quantity: number }> },
) {
  const result = await this.abusePreventionService.validatePurchase(
    req.user._id,
    body.items,
  );
  return {
    statusCode: 200,
    message: result.valid ? 'Cart validated' : 'Validation issues found',
    data: result,
  };
}
```

#### 3.3 Frontend Cart Validation

**File: `RC/src/store/modules/pharmacy.js`**

Add validation action:
```javascript
async validateCart({ commit, state }) {
  try {
    const items = state.cart.map(item => ({
      drugId: item.drugId,
      quantity: item.quantity,
    }));

    const response = await axios.post('pharmacy-orders/validate-cart', { items });
    return response.data.data;
  } catch (error) {
    console.error('Cart validation error:', error);
    throw error;
  }
}
```

**File: `RC/src/views/Mainapp/Pharmacy/Cart.vue`**

Add validation before checkout:
```javascript
const proceedToCheckout = async () => {
  // Validate cart for abuse prevention
  const validation = await validateCart();

  if (!validation.valid) {
    // Show validation issues modal
    validationIssues.value = validation.issues;
    showValidationModal.value = true;
    return;
  }

  // Check for Rx items
  if (hasRxItems.value && !prescriptionUploaded.value) {
    showPrescriptionModal.value = true;
    return;
  }

  router.push("/app/patient/pharmacy/checkout");
};
```

---

## Phase 4: Prescription Upload with AI Verification

### Priority: HIGH
### Estimated Effort: High

This phase implements the complete prescription upload flow with OCR processing, AI verification, fingerprinting for duplicate detection, and fraud prevention.

### 4.1 Database Entities

#### 4.1.1 Prescription File Entity

**File:** `RC-Backend/src/modules/prescriptions/entities/prescription-file.entity.ts`

```typescript
{
  _id: ObjectId,
  patient: ObjectId,                    // Patient who uploaded

  // File Info
  file_url: String,                     // S3 URL
  file_type: 'IMAGE' | 'PDF',
  original_filename: String,
  file_size: Number,                    // bytes

  // Source & Status
  upload_source: 'PATIENT_UPLOAD' | 'SPECIALIST_CREATED' | 'CAMERA_SCAN',
  status: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'REJECTED' | 'MANUAL_REVIEW',

  // Patient-provided metadata (optional)
  patient_metadata: {
    prescriber_name: String,
    prescription_date: Date,
    facility_name: String,
    notes: String,
  },

  // Processing tracking
  processing_started_at: Date,
  processing_completed_at: Date,
  processing_duration_ms: Number,

  // Linked entities
  fingerprint: ObjectId,                // PrescriptionFingerprint
  verification: ObjectId,               // PrescriptionVerification

  // Usage tracking
  used_for_orders: [ObjectId],          // PharmacyOrder references
  remaining_refills: Number,
  expiry_date: Date,

  // Timestamps
  created_at: Date,
  updated_at: Date,
}
```

#### 4.1.2 Prescription Fingerprint Entity

**File:** `RC-Backend/src/modules/prescriptions/entities/prescription-fingerprint.entity.ts`

```typescript
{
  _id: ObjectId,
  prescription: ObjectId,               // PrescriptionFile reference

  // Image Fingerprints (for duplicate detection)
  image_hash_sha256: String,            // Exact file hash
  image_hash_md5: String,               // Quick comparison hash
  perceptual_hash: String,              // pHash for similar image detection
  content_hash: String,                 // Hash of extracted text content

  // OCR Extracted Data
  extracted_data: {
    prescriber_name: String,
    prescriber_license: String,
    prescriber_address: String,
    prescriber_phone: String,
    prescriber_signature_detected: Boolean,

    patient_name: String,
    patient_age: String,
    patient_address: String,

    prescription_date: Date,
    prescription_number: String,

    drugs: [{
      name: String,
      generic_name: String,
      dosage: String,
      quantity: String,
      frequency: String,
      duration: String,
      instructions: String,
      confidence: Number,             // 0-100 per drug
    }],

    facility_name: String,
    facility_address: String,
    facility_stamp_detected: Boolean,

    raw_text: String,                 // Full extracted text
  },

  // OCR Metadata
  ocr_provider: 'AWS_TEXTRACT',
  ocr_confidence: Number,              // 0-100 overall
  ocr_word_count: Number,
  ocr_processed_at: Date,
  ocr_processing_time_ms: Number,

  // Timestamps
  created_at: Date,
  updated_at: Date,
}
```

#### 4.1.3 Prescription Verification Entity

**File:** `RC-Backend/src/modules/prescriptions/entities/prescription-verification.entity.ts`

```typescript
{
  _id: ObjectId,
  prescription: ObjectId,               // PrescriptionFile reference

  // Overall Verification Result
  verification_status: 'AUTO_APPROVED' | 'APPROVED_WITH_FLAGS' | 'MANUAL_REVIEW' | 'REJECTED',
  overall_confidence_score: Number,     // 0-100 weighted score

  // Tier Processing Results
  tier_1: {
    completed: Boolean,
    started_at: Date,
    completed_at: Date,
    duration_ms: Number,
    passed: Boolean,
    result: {
      has_required_fields: Boolean,
      ocr_quality_acceptable: Boolean,
      date_valid: Boolean,
      not_expired: Boolean,
    },
  },

  tier_2: {
    completed: Boolean,
    started_at: Date,
    completed_at: Date,
    duration_ms: Number,
    passed: Boolean,
    result: {
      prescriber_validation: Object,
      drug_validation: Object,
      duplicate_check: Object,
      fraud_analysis: Object,
    },
  },

  // Individual Field Scores (weighted scoring)
  field_scores: {
    prescriber_name: { score: Number, weight: 15, notes: String },
    prescriber_license: { score: Number, weight: 20, notes: String },
    prescriber_address: { score: Number, weight: 5, notes: String },
    patient_name: { score: Number, weight: 10, notes: String },
    prescription_date: { score: Number, weight: 10, notes: String },
    drug_names: { score: Number, weight: 10, notes: String },
    dosage_instructions: { score: Number, weight: 10, notes: String },
    signature_present: { score: Number, weight: 15, notes: String },
    contact_info: { score: Number, weight: 5, notes: String },
  },

  // Flags & Warnings
  flags: [{
    type: String,                       // 'MISSING_FIELD', 'EXPIRED', 'DUPLICATE', etc.
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    field: String,
    message: String,
    auto_resolvable: Boolean,
  }],

  // Duplicate Detection
  duplicate_detection: {
    is_duplicate: Boolean,
    duplicate_prescription_id: ObjectId,
    similarity_score: Number,           // 0-100
    match_type: 'EXACT' | 'SIMILAR' | 'PARTIAL',
  },

  // Fraud Risk Assessment
  fraud_assessment: {
    risk_score: Number,                 // 0-100
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    indicators: [{
      type: String,
      description: String,
      weight: Number,
    }],
  },

  // Manual Review (if required)
  manual_review: {
    required: Boolean,
    reason: String,
    assigned_to: ObjectId,              // Pharmacist/Admin
    reviewed_at: Date,
    reviewer_notes: String,
    reviewer_decision: 'APPROVED' | 'REJECTED',
    rejection_reason: String,
  },

  // Timestamps
  created_at: Date,
  updated_at: Date,
}
```

### 4.2 AWS Textract Integration

**File:** `RC-Backend/src/common/external/aws-textract/textract.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { TextractClient, AnalyzeDocumentCommand, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class TextractService {
  private readonly logger = new Logger(TextractService.name);
  private textractClient: TextractClient;
  private s3Client: S3Client;

  constructor() {
    this.textractClient = new TextractClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      },
    });

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      },
    });
  }

  /**
   * Analyze document from S3 URL
   */
  async analyzeDocument(s3Key: string): Promise<TextractAnalysisResult> {
    const startTime = Date.now();

    try {
      const command = new AnalyzeDocumentCommand({
        Document: {
          S3Object: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Name: s3Key,
          },
        },
        FeatureTypes: ['FORMS', 'TABLES'],
      });

      const response = await this.textractClient.send(command);

      return {
        success: true,
        blocks: response.Blocks,
        processingTime: Date.now() - startTime,
        metadata: response.DocumentMetadata,
      };
    } catch (error) {
      this.logger.error('Textract analysis failed:', error);
      throw error;
    }
  }

  /**
   * Extract prescription-specific data from Textract response
   */
  extractPrescriptionData(blocks: any[]): ExtractedPrescriptionData {
    const textBlocks = blocks.filter(b => b.BlockType === 'LINE');
    const rawText = textBlocks.map(b => b.Text).join('\n');

    return {
      prescriber_name: this.extractField(rawText, ['Dr.', 'Doctor', 'Physician']),
      prescriber_license: this.extractLicenseNumber(rawText),
      patient_name: this.extractPatientName(rawText),
      prescription_date: this.extractDate(rawText),
      drugs: this.extractDrugs(rawText, blocks),
      signature_present: this.detectSignature(blocks),
      raw_text: rawText,
      confidence: this.calculateOverallConfidence(textBlocks),
    };
  }

  private extractField(text: string, keywords: string[]): string | null {
    // Pattern matching logic for field extraction
    // Returns extracted value or null
  }

  private extractLicenseNumber(text: string): string | null {
    // Nigerian medical license format: MDCN/R/XXXXX
    const licensePattern = /MDCN\/R\/\d{5}/i;
    const match = text.match(licensePattern);
    return match ? match[0] : null;
  }

  private extractDrugs(text: string, blocks: any[]): ExtractedDrug[] {
    // Extract drug names, dosages, quantities from text
    // Use drug database for validation
  }

  private detectSignature(blocks: any[]): boolean {
    // Check for signature region in document
    // Look for specific patterns or regions
  }

  private calculateOverallConfidence(textBlocks: any[]): number {
    if (textBlocks.length === 0) return 0;
    const avgConfidence = textBlocks.reduce((sum, b) => sum + (b.Confidence || 0), 0) / textBlocks.length;
    return Math.round(avgConfidence);
  }
}
```

### 4.3 Image Fingerprinting Service

**File:** `RC-Backend/src/modules/prescriptions/services/fingerprint.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as sharp from 'sharp';

@Injectable()
export class FingerprintService {

  /**
   * Generate SHA256 hash of file
   */
  async generateSHA256(buffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate MD5 hash for quick comparison
   */
  async generateMD5(buffer: Buffer): Promise<string> {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Generate perceptual hash (pHash) for similar image detection
   * This allows finding prescriptions that are visually similar
   * even if they're resized, compressed, or slightly modified
   */
  async generatePerceptualHash(buffer: Buffer): Promise<string> {
    // 1. Convert to grayscale and resize to 32x32
    const resized = await sharp(buffer)
      .grayscale()
      .resize(32, 32, { fit: 'fill' })
      .raw()
      .toBuffer();

    // 2. Compute DCT (Discrete Cosine Transform)
    const dct = this.computeDCT(resized, 32);

    // 3. Take top-left 8x8 (low frequencies)
    const lowFreq = this.extractLowFrequencies(dct, 8);

    // 4. Compute median
    const median = this.computeMedian(lowFreq);

    // 5. Generate hash: 1 if > median, 0 otherwise
    let hash = '';
    for (const value of lowFreq) {
      hash += value > median ? '1' : '0';
    }

    // Convert binary to hex
    return BigInt('0b' + hash).toString(16).padStart(16, '0');
  }

  /**
   * Generate content hash from extracted text
   */
  generateContentHash(extractedText: string): string {
    // Normalize text (lowercase, remove extra spaces, sort words)
    const normalized = extractedText
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Compare two perceptual hashes and return similarity (0-100)
   */
  comparePerceptualHashes(hash1: string, hash2: string): number {
    const binary1 = BigInt('0x' + hash1).toString(2).padStart(64, '0');
    const binary2 = BigInt('0x' + hash2).toString(2).padStart(64, '0');

    let hammingDistance = 0;
    for (let i = 0; i < binary1.length; i++) {
      if (binary1[i] !== binary2[i]) hammingDistance++;
    }

    // Convert to similarity percentage
    return Math.round((1 - hammingDistance / 64) * 100);
  }

  private computeDCT(buffer: Buffer, size: number): number[][] {
    // DCT implementation for perceptual hashing
    // ... implementation details
  }

  private extractLowFrequencies(dct: number[][], size: number): number[] {
    const result = [];
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        result.push(dct[i][j]);
      }
    }
    return result;
  }

  private computeMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}
```

### 4.4 Verification Pipeline Service

**File:** `RC-Backend/src/modules/prescriptions/services/verification-pipeline.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { TextractService } from '../../../common/external/aws-textract/textract.service';
import { FingerprintService } from './fingerprint.service';

@Injectable()
export class VerificationPipelineService {
  private readonly logger = new Logger(VerificationPipelineService.name);

  // Weighted scoring configuration
  private readonly FIELD_WEIGHTS = {
    prescriber_name: 15,
    prescriber_license: 20,
    prescriber_address: 5,
    patient_name: 10,
    prescription_date: 10,
    drug_names: 10,
    dosage_instructions: 10,
    signature_present: 15,
    contact_info: 5,
  };

  // Thresholds
  private readonly THRESHOLDS = {
    AUTO_APPROVE: 80,           // Score >= 80: Auto approve
    APPROVE_WITH_FLAGS: 60,     // Score 60-79: Approve with warnings
    MANUAL_REVIEW: 40,          // Score 40-59: Needs manual review
    REJECT: 40,                 // Score < 40: Auto reject
    DUPLICATE_SIMILARITY: 85,   // pHash similarity for duplicate detection
    FRAUD_HIGH_RISK: 70,        // Fraud score threshold
  };

  constructor(
    @InjectModel('PrescriptionFile') private prescriptionFileModel: Model<any>,
    @InjectModel('PrescriptionFingerprint') private fingerprintModel: Model<any>,
    @InjectModel('PrescriptionVerification') private verificationModel: Model<any>,
    @InjectConnection() private connection: Connection,
    private textractService: TextractService,
    private fingerprintService: FingerprintService,
  ) {}

  /**
   * Main entry point: Process uploaded prescription
   */
  async processPrescription(prescriptionId: string): Promise<VerificationResult> {
    const startTime = Date.now();

    // Update status to PROCESSING
    await this.prescriptionFileModel.findByIdAndUpdate(prescriptionId, {
      status: 'PROCESSING',
      processing_started_at: new Date(),
    });

    try {
      // Get prescription file
      const prescription = await this.prescriptionFileModel.findById(prescriptionId);
      if (!prescription) throw new Error('Prescription not found');

      // Get file buffer from S3
      const fileBuffer = await this.getFileFromS3(prescription.file_url);

      // Step 1: Generate fingerprints
      const fingerprint = await this.generateFingerprints(prescriptionId, fileBuffer);

      // Step 2: Check for duplicates FIRST (quick check)
      const duplicateResult = await this.checkForDuplicates(fingerprint);
      if (duplicateResult.is_duplicate && duplicateResult.match_type === 'EXACT') {
        return this.handleExactDuplicate(prescriptionId, duplicateResult);
      }

      // Step 3: Run Tier 1 verification (quick validation ~60 sec)
      const tier1Result = await this.runTier1Verification(prescriptionId, fingerprint);

      if (!tier1Result.passed) {
        return this.handleTier1Failure(prescriptionId, tier1Result);
      }

      // Step 4: Run Tier 2 verification (deep analysis ~120 sec)
      const tier2Result = await this.runTier2Verification(prescriptionId, fingerprint, duplicateResult);

      // Step 5: Calculate final score and determine status
      const finalResult = await this.calculateFinalResult(prescriptionId, tier1Result, tier2Result);

      // Update prescription status
      await this.prescriptionFileModel.findByIdAndUpdate(prescriptionId, {
        status: finalResult.status,
        processing_completed_at: new Date(),
        processing_duration_ms: Date.now() - startTime,
      });

      return finalResult;
    } catch (error) {
      this.logger.error(`Verification failed for ${prescriptionId}:`, error);

      await this.prescriptionFileModel.findByIdAndUpdate(prescriptionId, {
        status: 'MANUAL_REVIEW',
        processing_completed_at: new Date(),
      });

      throw error;
    }
  }

  /**
   * Generate all fingerprints for the prescription
   */
  private async generateFingerprints(
    prescriptionId: string,
    fileBuffer: Buffer,
  ): Promise<any> {
    // Generate image hashes
    const [sha256, md5, perceptualHash] = await Promise.all([
      this.fingerprintService.generateSHA256(fileBuffer),
      this.fingerprintService.generateMD5(fileBuffer),
      this.fingerprintService.generatePerceptualHash(fileBuffer),
    ]);

    // Extract S3 key from URL
    const prescription = await this.prescriptionFileModel.findById(prescriptionId);
    const s3Key = this.extractS3Key(prescription.file_url);

    // Run OCR with AWS Textract
    const textractResult = await this.textractService.analyzeDocument(s3Key);
    const extractedData = this.textractService.extractPrescriptionData(textractResult.blocks);

    // Generate content hash from extracted text
    const contentHash = this.fingerprintService.generateContentHash(extractedData.raw_text);

    // Save fingerprint
    const fingerprint = await this.fingerprintModel.create({
      prescription: prescriptionId,
      image_hash_sha256: sha256,
      image_hash_md5: md5,
      perceptual_hash: perceptualHash,
      content_hash: contentHash,
      extracted_data: extractedData,
      ocr_provider: 'AWS_TEXTRACT',
      ocr_confidence: extractedData.confidence,
      ocr_word_count: extractedData.raw_text.split(/\s+/).length,
      ocr_processed_at: new Date(),
      ocr_processing_time_ms: textractResult.processingTime,
    });

    // Update prescription with fingerprint reference
    await this.prescriptionFileModel.findByIdAndUpdate(prescriptionId, {
      fingerprint: fingerprint._id,
    });

    return fingerprint;
  }

  /**
   * Check for duplicate prescriptions
   */
  private async checkForDuplicates(fingerprint: any): Promise<DuplicateCheckResult> {
    // 1. Check exact match (SHA256)
    const exactMatch = await this.fingerprintModel.findOne({
      _id: { $ne: fingerprint._id },
      image_hash_sha256: fingerprint.image_hash_sha256,
    });

    if (exactMatch) {
      return {
        is_duplicate: true,
        duplicate_prescription_id: exactMatch.prescription,
        similarity_score: 100,
        match_type: 'EXACT',
      };
    }

    // 2. Check perceptual similarity (pHash)
    const allFingerprints = await this.fingerprintModel.find({
      _id: { $ne: fingerprint._id },
    }).select('prescription perceptual_hash');

    for (const fp of allFingerprints) {
      const similarity = this.fingerprintService.comparePerceptualHashes(
        fingerprint.perceptual_hash,
        fp.perceptual_hash,
      );

      if (similarity >= this.THRESHOLDS.DUPLICATE_SIMILARITY) {
        return {
          is_duplicate: true,
          duplicate_prescription_id: fp.prescription,
          similarity_score: similarity,
          match_type: 'SIMILAR',
        };
      }
    }

    // 3. Check content hash (text similarity)
    const contentMatch = await this.fingerprintModel.findOne({
      _id: { $ne: fingerprint._id },
      content_hash: fingerprint.content_hash,
    });

    if (contentMatch) {
      return {
        is_duplicate: true,
        duplicate_prescription_id: contentMatch.prescription,
        similarity_score: 95,
        match_type: 'PARTIAL',
      };
    }

    return {
      is_duplicate: false,
      duplicate_prescription_id: null,
      similarity_score: 0,
      match_type: null,
    };
  }

  /**
   * Tier 1: Quick validation (~60 seconds)
   */
  private async runTier1Verification(
    prescriptionId: string,
    fingerprint: any,
  ): Promise<Tier1Result> {
    const startTime = Date.now();
    const extracted = fingerprint.extracted_data;

    const result = {
      has_required_fields: this.checkRequiredFields(extracted),
      ocr_quality_acceptable: fingerprint.ocr_confidence >= 60,
      date_valid: this.validatePrescriptionDate(extracted.prescription_date),
      not_expired: this.checkNotExpired(extracted.prescription_date),
    };

    const passed = Object.values(result).every(v => v === true);

    // Save Tier 1 result
    await this.verificationModel.findOneAndUpdate(
      { prescription: prescriptionId },
      {
        $set: {
          'tier_1.completed': true,
          'tier_1.started_at': new Date(startTime),
          'tier_1.completed_at': new Date(),
          'tier_1.duration_ms': Date.now() - startTime,
          'tier_1.passed': passed,
          'tier_1.result': result,
        },
      },
      { upsert: true },
    );

    return { passed, result, duration_ms: Date.now() - startTime };
  }

  /**
   * Tier 2: Deep validation (~120 seconds)
   */
  private async runTier2Verification(
    prescriptionId: string,
    fingerprint: any,
    duplicateResult: DuplicateCheckResult,
  ): Promise<Tier2Result> {
    const startTime = Date.now();
    const extracted = fingerprint.extracted_data;

    // Parallel validation checks
    const [prescriberValidation, drugValidation, fraudAnalysis] = await Promise.all([
      this.validatePrescriber(extracted),
      this.validateDrugs(extracted.drugs),
      this.analyzeFraudRisk(prescriptionId, fingerprint, duplicateResult),
    ]);

    const result = {
      prescriber_validation: prescriberValidation,
      drug_validation: drugValidation,
      duplicate_check: duplicateResult,
      fraud_analysis: fraudAnalysis,
    };

    const passed = prescriberValidation.valid &&
                   drugValidation.valid &&
                   fraudAnalysis.risk_score < this.THRESHOLDS.FRAUD_HIGH_RISK;

    // Save Tier 2 result
    await this.verificationModel.findOneAndUpdate(
      { prescription: prescriptionId },
      {
        $set: {
          'tier_2.completed': true,
          'tier_2.started_at': new Date(startTime),
          'tier_2.completed_at': new Date(),
          'tier_2.duration_ms': Date.now() - startTime,
          'tier_2.passed': passed,
          'tier_2.result': result,
        },
      },
    );

    return { passed, result, duration_ms: Date.now() - startTime };
  }

  /**
   * Validate prescriber information
   */
  private async validatePrescriber(extracted: any): Promise<PrescriberValidation> {
    const flags = [];
    let valid = true;

    // Check prescriber name
    if (!extracted.prescriber_name) {
      flags.push({ field: 'prescriber_name', issue: 'MISSING', severity: 'HIGH' });
      valid = false;
    }

    // Check license number format (Nigerian MDCN format)
    if (!extracted.prescriber_license) {
      flags.push({ field: 'prescriber_license', issue: 'MISSING', severity: 'HIGH' });
      valid = false;
    } else if (!/^MDCN\/R\/\d{5}$/i.test(extracted.prescriber_license)) {
      flags.push({ field: 'prescriber_license', issue: 'INVALID_FORMAT', severity: 'MEDIUM' });
    }

    // TODO: Validate against MDCN database (future enhancement)
    // const mdcnValid = await this.validateWithMDCN(extracted.prescriber_license);

    // Check signature
    if (!extracted.prescriber_signature_detected) {
      flags.push({ field: 'signature', issue: 'NOT_DETECTED', severity: 'MEDIUM' });
    }

    return { valid, flags };
  }

  /**
   * Validate drugs against database
   */
  private async validateDrugs(drugs: any[]): Promise<DrugValidation> {
    const flags = [];
    let valid = true;

    if (!drugs || drugs.length === 0) {
      flags.push({ field: 'drugs', issue: 'NO_DRUGS_FOUND', severity: 'CRITICAL' });
      return { valid: false, flags, validated_drugs: [] };
    }

    const DrugModel = this.connection.collection('drugs');
    const validatedDrugs = [];

    for (const drug of drugs) {
      // Search for drug in database
      const dbDrug = await DrugModel.findOne({
        $or: [
          { name: { $regex: drug.name, $options: 'i' } },
          { generic_name: { $regex: drug.name, $options: 'i' } },
        ],
      });

      if (dbDrug) {
        validatedDrugs.push({
          extracted_name: drug.name,
          matched_drug_id: dbDrug._id,
          matched_name: dbDrug.name,
          requires_prescription: dbDrug.requires_prescription,
          is_controlled: dbDrug.is_controlled,
          confidence: drug.confidence,
        });

        // Check if controlled substance
        if (dbDrug.is_controlled) {
          flags.push({
            field: 'drug',
            drug_name: drug.name,
            issue: 'CONTROLLED_SUBSTANCE',
            severity: 'HIGH',
          });
        }
      } else {
        flags.push({
          field: 'drug',
          drug_name: drug.name,
          issue: 'NOT_IN_DATABASE',
          severity: 'MEDIUM',
        });
      }
    }

    return { valid, flags, validated_drugs: validatedDrugs };
  }

  /**
   * Analyze fraud risk
   */
  private async analyzeFraudRisk(
    prescriptionId: string,
    fingerprint: any,
    duplicateResult: DuplicateCheckResult,
  ): Promise<FraudAnalysis> {
    const indicators = [];
    let riskScore = 0;

    // Indicator 1: Duplicate detected
    if (duplicateResult.is_duplicate) {
      riskScore += 30;
      indicators.push({
        type: 'DUPLICATE',
        description: `Similar prescription found (${duplicateResult.similarity_score}% match)`,
        weight: 30,
      });
    }

    // Indicator 2: Low OCR confidence (possibly edited)
    if (fingerprint.ocr_confidence < 70) {
      riskScore += 15;
      indicators.push({
        type: 'LOW_OCR_CONFIDENCE',
        description: `Low OCR confidence: ${fingerprint.ocr_confidence}%`,
        weight: 15,
      });
    }

    // Indicator 3: Missing signature
    if (!fingerprint.extracted_data.prescriber_signature_detected) {
      riskScore += 20;
      indicators.push({
        type: 'NO_SIGNATURE',
        description: 'No signature detected',
        weight: 20,
      });
    }

    // Indicator 4: Prescription date issues
    const prescDate = new Date(fingerprint.extracted_data.prescription_date);
    const daysSinceIssue = (Date.now() - prescDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceIssue > 30) {
      riskScore += 10;
      indicators.push({
        type: 'OLD_PRESCRIPTION',
        description: `Prescription is ${Math.round(daysSinceIssue)} days old`,
        weight: 10,
      });
    }

    // Indicator 5: Multiple controlled substances
    const controlledCount = fingerprint.extracted_data.drugs?.filter(
      d => d.is_controlled
    ).length || 0;

    if (controlledCount > 1) {
      riskScore += 25;
      indicators.push({
        type: 'MULTIPLE_CONTROLLED',
        description: `${controlledCount} controlled substances`,
        weight: 25,
      });
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (riskScore >= 70) riskLevel = 'CRITICAL';
    else if (riskScore >= 50) riskLevel = 'HIGH';
    else if (riskScore >= 30) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    return {
      risk_score: Math.min(riskScore, 100),
      risk_level: riskLevel,
      indicators,
    };
  }

  /**
   * Calculate final verification result
   */
  private async calculateFinalResult(
    prescriptionId: string,
    tier1Result: Tier1Result,
    tier2Result: Tier2Result,
  ): Promise<VerificationResult> {
    const fingerprint = await this.fingerprintModel.findOne({ prescription: prescriptionId });
    const extracted = fingerprint.extracted_data;

    // Calculate field scores
    const fieldScores = {
      prescriber_name: this.scoreField(extracted.prescriber_name, 15),
      prescriber_license: this.scoreField(extracted.prescriber_license, 20),
      prescriber_address: this.scoreField(extracted.prescriber_address, 5),
      patient_name: this.scoreField(extracted.patient_name, 10),
      prescription_date: this.scoreField(extracted.prescription_date, 10),
      drug_names: this.scoreField(extracted.drugs?.length > 0, 10),
      dosage_instructions: this.scoreField(extracted.drugs?.[0]?.instructions, 10),
      signature_present: this.scoreField(extracted.prescriber_signature_detected, 15),
      contact_info: this.scoreField(extracted.prescriber_phone, 5),
    };

    // Calculate overall score
    const overallScore = Object.values(fieldScores).reduce(
      (sum, f) => sum + f.score, 0
    );

    // Collect all flags
    const allFlags = [
      ...this.generateTier1Flags(tier1Result),
      ...tier2Result.result.prescriber_validation.flags,
      ...tier2Result.result.drug_validation.flags,
    ];

    // Determine final status
    let status: 'AUTO_APPROVED' | 'APPROVED_WITH_FLAGS' | 'MANUAL_REVIEW' | 'REJECTED';
    let manualReviewRequired = false;
    let manualReviewReason = '';

    const fraudScore = tier2Result.result.fraud_analysis.risk_score;

    if (fraudScore >= this.THRESHOLDS.FRAUD_HIGH_RISK) {
      status = 'MANUAL_REVIEW';
      manualReviewRequired = true;
      manualReviewReason = 'High fraud risk detected';
    } else if (overallScore >= this.THRESHOLDS.AUTO_APPROVE && allFlags.length === 0) {
      status = 'VERIFIED';
    } else if (overallScore >= this.THRESHOLDS.APPROVE_WITH_FLAGS) {
      status = 'VERIFIED'; // But with flags
    } else if (overallScore >= this.THRESHOLDS.MANUAL_REVIEW) {
      status = 'MANUAL_REVIEW';
      manualReviewRequired = true;
      manualReviewReason = 'Score below auto-approval threshold';
    } else {
      status = 'REJECTED';
    }

    // Save verification result
    await this.verificationModel.findOneAndUpdate(
      { prescription: prescriptionId },
      {
        verification_status: status,
        overall_confidence_score: overallScore,
        field_scores: fieldScores,
        flags: allFlags,
        duplicate_detection: tier2Result.result.duplicate_check,
        fraud_assessment: tier2Result.result.fraud_analysis,
        'manual_review.required': manualReviewRequired,
        'manual_review.reason': manualReviewReason,
      },
    );

    return {
      prescriptionId,
      status,
      overallScore,
      flags: allFlags,
      fraudRiskLevel: tier2Result.result.fraud_analysis.risk_level,
      manualReviewRequired,
    };
  }

  // Helper methods
  private checkRequiredFields(extracted: any): boolean {
    return !!(
      extracted.prescriber_name &&
      extracted.prescription_date &&
      extracted.drugs?.length > 0
    );
  }

  private validatePrescriptionDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime()) && date <= new Date();
  }

  private checkNotExpired(dateStr: string): boolean {
    const date = new Date(dateStr);
    const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 90; // 90 days validity
  }

  private scoreField(value: any, weight: number): { score: number; weight: number } {
    return {
      score: value ? weight : 0,
      weight,
    };
  }
}
```

### 4.5 Frontend Upload Flow with Verification Status

**New File: `RC/src/views/Mainapp/Pharmacy/UploadPrescription.vue`**

```vue
<template>
  <div class="page-content">
    <top-bar type="title-with-back" title="Upload Prescription" />

    <div class="page-content__body">
      <!-- Step 1: Upload -->
      <div v-if="step === 'upload'" class="upload-step">
        <div class="upload-instructions">
          <h2>Upload Your Prescription</h2>
          <p>Take a clear photo or upload an image of your prescription.</p>

          <div class="requirements">
            <h4>Requirements:</h4>
            <ul>
              <li>Prescription must be clearly readable</li>
              <li>Doctor's name and signature visible</li>
              <li>Prescription date visible</li>
              <li>Medication details visible</li>
            </ul>
          </div>
        </div>

        <!-- Camera/Upload Options -->
        <div class="upload-options">
          <button class="upload-option camera" @click="openCamera">
            <RCIcon name="camera" size="lg" />
            <span>Take Photo</span>
          </button>
          <button class="upload-option gallery" @click="openGallery">
            <RCIcon name="image" size="lg" />
            <span>Choose from Gallery</span>
          </button>
          <button class="upload-option file" @click="openFilePicker">
            <RCIcon name="file" size="lg" />
            <span>Upload PDF</span>
          </button>
        </div>

        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          accept="image/*,.pdf"
          hidden
        />

        <!-- Preview -->
        <div v-if="previewUrl" class="preview-section">
          <h3>Preview</h3>
          <div class="preview-container">
            <img :src="previewUrl" alt="Prescription preview" />
            <button class="remove-btn" @click="clearFile">
              <RCIcon name="x" />
            </button>
          </div>

          <rc-button
            type="primary"
            label="Submit for Verification"
            @click="submitPrescription"
            :loading="uploading"
          />
        </div>
      </div>

      <!-- Step 2: Processing -->
      <div v-if="step === 'processing'" class="processing-step">
        <div class="processing-animation">
          <div class="scanner-line"></div>
          <RCIcon name="file-text" size="xl" />
        </div>

        <h2>Verifying Your Prescription</h2>
        <p>{{ processingMessage }}</p>

        <div class="verification-stages">
          <div
            v-for="(stage, index) in verificationStages"
            :key="stage.id"
            :class="['stage', {
              completed: stage.status === 'completed',
              active: stage.status === 'active',
              pending: stage.status === 'pending'
            }]"
          >
            <div class="stage-indicator">
              <RCIcon v-if="stage.status === 'completed'" name="check" />
              <div v-else-if="stage.status === 'active'" class="spinner"></div>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="stage-info">
              <span class="stage-title">{{ stage.title }}</span>
              <span class="stage-subtitle">{{ stage.subtitle }}</span>
            </div>
          </div>
        </div>

        <p class="processing-note">This usually takes 1-2 minutes</p>
      </div>

      <!-- Step 3: Result -->
      <div v-if="step === 'result'" class="result-step">
        <!-- Verified -->
        <div v-if="verificationResult.status === 'VERIFIED'" class="result-card success">
          <div class="result-icon">
            <RCIcon name="check-circle" size="xl" />
          </div>
          <h2>Prescription Verified!</h2>
          <p>Your prescription has been verified and is ready to use.</p>

          <!-- Extracted Info -->
          <div class="extracted-info">
            <h4>Prescription Details</h4>
            <div class="info-item">
              <span class="label">Doctor:</span>
              <span class="value">{{ verificationResult.extracted.prescriber_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">Date:</span>
              <span class="value">{{ formatDate(verificationResult.extracted.prescription_date) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Medications:</span>
              <ul class="medications">
                <li v-for="drug in verificationResult.extracted.drugs" :key="drug.name">
                  {{ drug.name }} - {{ drug.dosage }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Warnings if any -->
          <div v-if="verificationResult.flags.length > 0" class="warnings">
            <h4>Notes</h4>
            <div v-for="flag in verificationResult.flags" :key="flag.message" class="warning-item">
              <RCIcon name="alert-circle" />
              <span>{{ flag.message }}</span>
            </div>
          </div>

          <rc-button
            type="primary"
            label="Order Medications"
            @click="orderFromPrescription"
          />
        </div>

        <!-- Manual Review -->
        <div v-else-if="verificationResult.status === 'MANUAL_REVIEW'" class="result-card pending">
          <div class="result-icon">
            <RCIcon name="clock" size="xl" />
          </div>
          <h2>Manual Review Required</h2>
          <p>Your prescription needs additional verification by our pharmacy team.</p>
          <p class="eta">Estimated time: 2-4 hours</p>

          <div class="review-reason">
            <strong>Reason:</strong> {{ verificationResult.manualReviewReason }}
          </div>

          <rc-button
            type="secondary"
            label="We'll Notify You"
            disabled
          />
          <rc-button
            type="outline"
            label="Upload Different Prescription"
            @click="resetUpload"
          />
        </div>

        <!-- Rejected -->
        <div v-else-if="verificationResult.status === 'REJECTED'" class="result-card error">
          <div class="result-icon">
            <RCIcon name="x-circle" size="xl" />
          </div>
          <h2>Verification Failed</h2>
          <p>We couldn't verify this prescription. Please check the issues below.</p>

          <div class="issues">
            <div v-for="flag in verificationResult.flags" :key="flag.message" class="issue-item">
              <RCIcon name="alert-triangle" />
              <span>{{ flag.message }}</span>
            </div>
          </div>

          <rc-button
            type="primary"
            label="Try Again"
            @click="resetUpload"
          />
          <rc-button
            type="outline"
            label="Contact Support"
            @click="contactSupport"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import { mapActions as useMapActions } from "@/utilities/utilityStore";
import io from "socket.io-client";

export default {
  name: "UploadPrescription",
  components: { TopBar, RcButton, RCIcon },
  setup() {
    const router = useRouter();
    const fileInput = ref(null);
    const step = ref('upload');
    const selectedFile = ref(null);
    const previewUrl = ref(null);
    const uploading = ref(false);
    const processingMessage = ref('Uploading prescription...');
    const verificationResult = ref(null);
    const socket = ref(null);

    const {
      "prescriptions/uploadPrescription": uploadPrescriptionAction,
    } = useMapActions();

    const verificationStages = reactive([
      { id: 'upload', title: 'Uploading', subtitle: 'Sending to server', status: 'pending' },
      { id: 'ocr', title: 'Reading Text', subtitle: 'Extracting prescription details', status: 'pending' },
      { id: 'fingerprint', title: 'Security Check', subtitle: 'Checking for duplicates', status: 'pending' },
      { id: 'validation', title: 'Validating', subtitle: 'Verifying prescription data', status: 'pending' },
      { id: 'complete', title: 'Complete', subtitle: 'Processing finished', status: 'pending' },
    ]);

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert("File size must be less than 10MB");
          return;
        }
        selectedFile.value = file;
        previewUrl.value = URL.createObjectURL(file);
      }
    };

    const submitPrescription = async () => {
      if (!selectedFile.value) return;

      uploading.value = true;
      step.value = 'processing';
      updateStage('upload', 'active');

      try {
        // Upload file
        const formData = new FormData();
        formData.append('prescription', selectedFile.value);

        const response = await uploadPrescriptionAction(formData);
        const prescriptionId = response.data._id;

        updateStage('upload', 'completed');
        updateStage('ocr', 'active');
        processingMessage.value = 'Reading prescription text...';

        // Connect to WebSocket for real-time updates
        connectToSocket(prescriptionId);

      } catch (error) {
        console.error('Upload failed:', error);
        step.value = 'upload';
        alert('Upload failed. Please try again.');
      } finally {
        uploading.value = false;
      }
    };

    const connectToSocket = (prescriptionId) => {
      const token = JSON.parse(localStorage.getItem('token') || '{}');

      socket.value = io(process.env.VUE_APP_SOCKET_URL, {
        auth: { token: token.access_token },
      });

      socket.value.emit('subscribe-prescription-verification', { prescriptionId });

      socket.value.on('verification-progress', (data) => {
        handleVerificationProgress(data);
      });

      socket.value.on('verification-complete', (data) => {
        handleVerificationComplete(data);
      });
    };

    const handleVerificationProgress = (data) => {
      processingMessage.value = data.message;

      switch (data.stage) {
        case 'ocr':
          updateStage('ocr', 'active');
          break;
        case 'fingerprint':
          updateStage('ocr', 'completed');
          updateStage('fingerprint', 'active');
          break;
        case 'validation':
          updateStage('fingerprint', 'completed');
          updateStage('validation', 'active');
          break;
      }
    };

    const handleVerificationComplete = (data) => {
      updateStage('validation', 'completed');
      updateStage('complete', 'completed');

      verificationResult.value = data;
      step.value = 'result';

      if (socket.value) {
        socket.value.disconnect();
      }
    };

    const updateStage = (stageId, status) => {
      const stage = verificationStages.find(s => s.id === stageId);
      if (stage) stage.status = status;
    };

    const orderFromPrescription = () => {
      router.push({
        path: '/app/patient/pharmacy/prescription-order',
        query: { prescriptionId: verificationResult.value.prescriptionId },
      });
    };

    const resetUpload = () => {
      step.value = 'upload';
      selectedFile.value = null;
      previewUrl.value = null;
      verificationResult.value = null;
      verificationStages.forEach(s => s.status = 'pending');
    };

    onUnmounted(() => {
      if (socket.value) socket.value.disconnect();
    });

    return {
      fileInput,
      step,
      previewUrl,
      uploading,
      processingMessage,
      verificationStages,
      verificationResult,
      handleFileSelect,
      submitPrescription,
      orderFromPrescription,
      resetUpload,
      openCamera: () => { /* Camera API */ },
      openGallery: () => fileInput.value?.click(),
      openFilePicker: () => fileInput.value?.click(),
      clearFile: () => { selectedFile.value = null; previewUrl.value = null; },
      formatDate: (d) => new Date(d).toLocaleDateString(),
      contactSupport: () => router.push('/app/support'),
    };
  },
};
</script>
```

### 4.6 Implementation Tasks

| Task ID | Description | Effort | Dependencies |
|---------|-------------|--------|--------------|
| 4.1.1 | Create PrescriptionFile entity | 3h | - |
| 4.1.2 | Create PrescriptionFingerprint entity | 3h | 4.1.1 |
| 4.1.3 | Create PrescriptionVerification entity | 3h | 4.1.1 |
| 4.2.1 | Set up AWS SDK for Textract | 2h | - |
| 4.2.2 | Implement TextractService | 8h | 4.2.1 |
| 4.2.3 | Implement prescription data extraction | 8h | 4.2.2 |
| 4.3.1 | Implement SHA256/MD5 hashing | 2h | - |
| 4.3.2 | Implement perceptual hashing (pHash) | 6h | - |
| 4.3.3 | Implement content hash generation | 2h | 4.2.3 |
| 4.4.1 | Implement Tier 1 verification | 6h | 4.2.3, 4.3.x |
| 4.4.2 | Implement Tier 2 verification | 8h | 4.4.1 |
| 4.4.3 | Implement duplicate detection | 6h | 4.3.2 |
| 4.4.4 | Implement fraud risk scoring | 6h | 4.4.2 |
| 4.4.5 | Implement scoring algorithm | 4h | 4.4.2 |
| 4.5.1 | Create upload API endpoint | 4h | 4.1.x |
| 4.5.2 | Add WebSocket events for progress | 4h | 4.4.x |
| 4.6.1 | Create UploadPrescription.vue | 6h | - |
| 4.6.2 | Implement verification status UI | 4h | 4.6.1 |
| 4.6.3 | Add camera capture support | 4h | 4.6.1 |
| 4.7.1 | Integration testing | 8h | All above |
| 4.7.2 | Error handling & edge cases | 4h | 4.7.1 |

**Total Estimated Effort: ~100 hours (2.5 weeks)**

### 4.7 Deliverables

1. **Database Entities**
   - PrescriptionFile schema
   - PrescriptionFingerprint schema
   - PrescriptionVerification schema

2. **Backend Services**
   - AWS Textract integration
   - Fingerprinting service (SHA256, MD5, pHash)
   - Multi-tier verification pipeline
   - Duplicate detection engine
   - Fraud risk assessment

3. **Frontend Components**
   - Upload prescription page with camera support
   - Real-time verification progress UI
   - Verification result display
   - Integration with order flow

4. **Real-time Updates**
   - WebSocket events for verification progress
   - Push notifications for manual review completion

---

#### 4.2 View Specialist Prescriptions

**New File: `RC/src/views/Mainapp/Pharmacy/MyPrescriptions.vue`**

```vue
<template>
  <div class="page-content">
    <top-bar type="title-with-back" title="My Prescriptions" />

    <div class="page-content__body">
      <!-- Tabs: All | Active | Expired -->
      <div class="prescription-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="['tab', { active: activeTab === tab.value }]"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Prescriptions List -->
      <div class="prescriptions-list">
        <div
          v-for="prescription in filteredPrescriptions"
          :key="prescription._id"
          class="prescription-card"
        >
          <div class="prescription-header">
            <span class="prescription-number">{{ prescription.prescription_number }}</span>
            <span :class="['status', prescription.status.toLowerCase()]">
              {{ prescription.status }}
            </span>
          </div>

          <div class="prescription-doctor">
            <RCIcon name="user" />
            <span>Dr. {{ prescription.specialist?.profile?.first_name }} {{ prescription.specialist?.profile?.last_name }}</span>
          </div>

          <div class="prescription-date">
            <RCIcon name="calendar" />
            <span>{{ formatDate(prescription.created_at) }}</span>
            <span v-if="prescription.expiry_date" class="expiry">
              Expires: {{ formatDate(prescription.expiry_date) }}
            </span>
          </div>

          <div class="prescription-items">
            <span>{{ prescription.medications?.length }} medication(s)</span>
          </div>

          <div class="prescription-actions">
            <rc-button
              type="primary"
              size="small"
              label="Order Medications"
              @click="orderFromPrescription(prescription)"
              :disabled="prescription.status !== 'ACTIVE'"
            />
            <rc-button
              type="outline"
              size="small"
              label="View Details"
              @click="viewPrescription(prescription._id)"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredPrescriptions.length === 0" class="empty-state">
        <RCIcon name="file-text" />
        <h3>No Prescriptions Found</h3>
        <p>You don't have any {{ activeTab !== 'all' ? activeTab : '' }} prescriptions yet.</p>
      </div>
    </div>
  </div>
</template>
```

#### 4.3 Two Purchase Flows

**Flow 1: Catalog-First (OTC and Rx)**
```
Drug Catalog → Drug Details → Add to Cart → Cart Review
                                               ↓
                                     [If Rx items exist]
                                               ↓
                              Prescription Upload/Selection
                                               ↓
                                    Select Pharmacy → Checkout → Payment
```

**Flow 2: Prescription-First**
```
My Prescriptions → Select Prescription → Review Medications
                         ↓
                 [Or Upload New]
                         ↓
        Select Pharmacy → Checkout → Payment
```

---

## Phase 5: Enhanced Order Timeline

### Priority: MEDIUM
### Estimated Effort: Medium

#### 5.1 Order Status Timeline Enhancement

**File: `RC/src/views/Mainapp/Pharmacy/OrderDetails.vue`**

Enhanced timeline with detailed steps:
```vue
<div class="enhanced-timeline">
  <div
    v-for="(event, index) in orderEvents"
    :key="event._id"
    :class="['timeline-event', {
      completed: event.completed,
      current: event.current,
      pending: event.pending
    }]"
  >
    <div class="event-connector" v-if="index > 0">
      <div class="connector-line" :class="{ filled: event.completed }"></div>
    </div>

    <div class="event-indicator">
      <div class="indicator-circle">
        <RCIcon v-if="event.completed" name="check" />
        <RCIcon v-else-if="event.current" name="loader" class="spinning" />
        <span v-else>{{ index + 1 }}</span>
      </div>
    </div>

    <div class="event-content">
      <div class="event-header">
        <span class="event-title">{{ event.title }}</span>
        <span v-if="event.timestamp" class="event-time">
          {{ formatTime(event.timestamp) }}
        </span>
      </div>
      <p v-if="event.description" class="event-description">
        {{ event.description }}
      </p>

      <!-- Actor info if available -->
      <div v-if="event.actor" class="event-actor">
        <RCIcon name="user" />
        <span>{{ event.actor }}</span>
      </div>

      <!-- Additional details -->
      <div v-if="event.details" class="event-details">
        <div v-for="(detail, key) in event.details" :key="key" class="detail-item">
          <span class="detail-label">{{ key }}:</span>
          <span class="detail-value">{{ detail }}</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 5.2 Real-time Updates (WebSocket)

**File: `RC/src/services/orderTracking.js`**

```javascript
import io from 'socket.io-client';

class OrderTrackingService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    this.socket = io(process.env.VUE_APP_SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Order tracking connected');
    });

    this.socket.on('order-status-update', (data) => {
      this.notifyListeners('status', data);
    });

    this.socket.on('order-location-update', (data) => {
      this.notifyListeners('location', data);
    });
  }

  subscribeToOrder(orderId) {
    if (this.socket) {
      this.socket.emit('subscribe-order', { orderId });
    }
  }

  unsubscribeFromOrder(orderId) {
    if (this.socket) {
      this.socket.emit('unsubscribe-order', { orderId });
    }
  }

  onStatusUpdate(callback) {
    this.addListener('status', callback);
  }

  onLocationUpdate(callback) {
    this.addListener('location', callback);
  }

  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new OrderTrackingService();
```

---

## Phase 6: Backend API Enhancements

### Priority: HIGH
### Estimated Effort: High

#### 6.1 New/Modified Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/pharmacy-orders/validate-cart` | Abuse prevention validation |
| `POST` | `/pharmacy-orders/:id/pay-with-wallet` | Wallet payment |
| `POST` | `/pharmacy-orders/:id/pay-split` | Split payment |
| `POST` | `/prescriptions/upload` | Upload external prescription |
| `GET` | `/prescriptions/my-prescriptions` | Get user's prescriptions |
| `GET` | `/prescriptions/:id/can-order` | Check if prescription can be used |
| `PATCH` | `/pharmacy-orders/:id/link-prescription` | Link prescription to order |

#### 6.2 Database Schema Updates

**Prescription Schema Enhancement:**
```typescript
{
  // ... existing fields
  uploaded_file: String, // S3 URL for uploaded prescriptions
  upload_source: 'SPECIALIST' | 'PATIENT_UPLOAD',
  verified: Boolean,
  verified_by: ObjectId, // Admin/Pharmacist who verified
  verified_at: Date,
  rejection_reason: String,
  expiry_date: Date,
  used_for_orders: [ObjectId], // Orders that used this prescription
  remaining_refills: Number,
}
```

**PharmacyOrder Schema Enhancement:**
```typescript
{
  // ... existing fields
  prescription: ObjectId, // Reference to prescription used
  prescription_file: String, // Direct upload for this order
  payment_method: 'CARD' | 'WALLET' | 'SPLIT',
  wallet_amount: Number,
  card_amount: Number,
  validation_result: {
    passed: Boolean,
    warnings: [{
      drugId: ObjectId,
      issue: String,
      message: String,
    }],
  },
  timeline_events: [{
    status: String,
    timestamp: Date,
    description: String,
    actor: String,
    details: Object,
  }],
}
```

---

## Implementation Order & Dependencies

```
Phase 1: Wallet Payment ──────────────┐
                                      │
Phase 2: Rx Drug Handling ────────────┼──→ Phase 4: Prescription Upload & AI Verification
                                      │           │
Phase 3: Abuse Prevention ────────────┘           │
                                                  ↓
                                      Phase 5: My Prescriptions & Purchase Flow
                                                  │
                                                  ↓
                                      Phase 6: Order Timeline
                                                  │
                                                  ↓
                                      Phase 7: Backend API Consolidation
```

### Recommended Implementation Sequence:

1. **Week 1-2: Phase 3 (Abuse Prevention)**
   - Backend abuse prevention service
   - Database schema for purchase tracking
   - API endpoint for validation
   - Frontend cart validation integration

2. **Week 2-3: Phase 2 (Rx Drug Handling)**
   - Drug classification display (OTC/BTC/POM/CTRL badges)
   - Cart blocking for Rx items without prescription
   - Prescription requirement enforcement UI

3. **Week 3-5: Phase 4 (Prescription Upload & AI Verification)** ⭐ NEW
   - Database entities (PrescriptionFile, Fingerprint, Verification)
   - AWS Textract integration for OCR
   - Fingerprinting service (SHA256, MD5, pHash)
   - Tier 1 verification pipeline (quick validation)
   - Tier 2 verification pipeline (deep analysis)
   - Duplicate detection engine
   - Fraud risk assessment
   - WebSocket real-time progress updates
   - Upload prescription page with camera support
   - Verification status UI

4. **Week 5-6: Phase 5 (My Prescriptions & Purchase Flow)**
   - My Prescriptions page (specialist-created + uploaded)
   - Prescription-first purchase flow
   - Integration with pharmacy order flow
   - Prescription selection at checkout for Rx items

5. **Week 6-7: Phase 1 (Wallet Payment)**
   - Wallet balance fetch
   - Payment method selection UI (Wallet/Card/Split)
   - Backend wallet payment processing
   - Split payment support

6. **Week 7-8: Phase 6 & 7 (Timeline & Backend)**
   - Enhanced order timeline UI
   - WebSocket integration for order updates
   - All backend API consolidation
   - Integration testing & bug fixes

---

## Testing Checklist

### Functional Tests
- [ ] Cart add/remove/update for OTC drugs
- [ ] Cart blocking for Rx drugs without prescription
- [ ] Prescription upload and validation
- [ ] Abuse prevention limits (per-order, 7-day, 30-day)
- [ ] Wallet payment with sufficient balance
- [ ] Wallet payment with insufficient balance
- [ ] Split payment calculation and processing
- [ ] Order timeline updates
- [ ] Prescription-first purchase flow
- [ ] Catalog-first purchase flow with Rx items

### AI Verification Tests (Phase 4)
- [ ] Prescription image upload (JPG, PNG, PDF)
- [ ] Camera capture functionality
- [ ] OCR text extraction accuracy
- [ ] Prescriber name extraction
- [ ] License number extraction (MDCN format)
- [ ] Patient name extraction
- [ ] Prescription date extraction
- [ ] Drug name extraction and matching
- [ ] Signature detection
- [ ] SHA256/MD5 hash generation
- [ ] Perceptual hash (pHash) generation
- [ ] Content hash from extracted text
- [ ] Exact duplicate detection (SHA256 match)
- [ ] Similar image detection (pHash similarity >= 85%)
- [ ] Content duplicate detection (text hash match)
- [ ] Tier 1 verification pass/fail scenarios
- [ ] Tier 2 verification pass/fail scenarios
- [ ] Fraud risk scoring accuracy
- [ ] Auto-approval flow (score >= 80)
- [ ] Approval with flags flow (score 60-79)
- [ ] Manual review flow (score 40-59)
- [ ] Auto-rejection flow (score < 40)
- [ ] WebSocket progress updates
- [ ] Real-time verification status UI
- [ ] Manual review notification

### Edge Cases
- [ ] Zero wallet balance
- [ ] Wallet balance equals order total exactly
- [ ] Multiple Rx items from same prescription
- [ ] Expired prescription handling (> 90 days)
- [ ] Controlled substance purchase limits
- [ ] Order cancellation and wallet refund
- [ ] Network failure during payment
- [ ] File upload failures
- [ ] Blurry/low quality prescription images
- [ ] Handwritten prescriptions
- [ ] Multiple prescriptions in one image
- [ ] Prescriptions from different countries
- [ ] Very old prescriptions (> 30 days)
- [ ] Multiple controlled substances on one prescription
- [ ] Prescription with unrecognized drug names
- [ ] OCR failure / low confidence (< 60%)

### Security Tests
- [ ] Prescription verification bypass attempts
- [ ] Quantity limit manipulation
- [ ] Wallet balance manipulation
- [ ] Cross-user prescription access
- [ ] Duplicate prescription reuse attempt
- [ ] Modified image upload (same prescription edited)
- [ ] Fake prescription detection
- [ ] Invalid MDCN license format
- [ ] SQL/NoSQL injection in prescription metadata
- [ ] XSS in prescription details display

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Prescription forgery** | CRITICAL | Multi-tier AI verification, fingerprinting, fraud scoring, manual review escalation |
| **Duplicate prescription abuse** | HIGH | SHA256 exact matching, perceptual hashing for similar images, content hash for text similarity |
| **OCR accuracy issues** | HIGH | Confidence scoring, manual review for low confidence, multiple extraction attempts |
| **AWS Textract costs** | MEDIUM | Rate limiting, caching results, batch processing for efficiency |
| Abuse prevention bypass | HIGH | Server-side validation, rate limiting, rolling window tracking |
| Payment failures | MEDIUM | Transaction rollback, wallet balance restoration, error logging |
| Controlled substance misuse | HIGH | Strict quantity limits, flagged drug monitoring, admin alerts |
| Performance with large cart | LOW | Pagination, lazy loading, caching |
| WebSocket connection issues | MEDIUM | Fallback polling, reconnection logic, status API endpoint |
| Manual review backlog | MEDIUM | Escalation alerts, SLA tracking, pharmacist dashboard |

---

## Future Enhancements (Post-MVP)

1. **AI Prescription Verification** - OCR + ML for automatic prescription validation
2. **Drug Interaction Checker** - Warn patients about potential interactions
3. **Subscription Medications** - Auto-refill for chronic medications
4. **Family Account Management** - Order medications for family members
5. **Insurance Integration** - Process insurance claims automatically
6. **Delivery Tracking Map** - Real-time GPS tracking for deliveries

---

## Summary

This implementation plan covers all critical aspects of the patient pharmacy module:

| Phase | Feature | Priority | Effort | Status |
|-------|---------|----------|--------|--------|
| 1 | Wallet Payment | HIGH | Medium | Planned |
| 2 | Non-OTC Drug Handling | HIGH | Medium | Planned |
| 3 | Abuse Prevention | HIGH | High | Planned |
| 4 | **Prescription Upload & AI Verification** | **CRITICAL** | **High (~100h)** | **Planned** |
| 5 | My Prescriptions & Purchase Flow | HIGH | Medium | Planned |
| 6 | Order Timeline Enhancement | MEDIUM | Medium | Planned |
| 7 | Backend API Consolidation | HIGH | Medium | Planned |

### Key Highlights

**Phase 4 (Prescription Upload & AI Verification)** is the most critical and complex phase:

1. **OCR Processing** - AWS Textract for text extraction from prescription images
2. **Fingerprinting** - SHA256, MD5, and perceptual hashing for duplicate detection
3. **Multi-Tier Verification**:
   - Tier 1: Quick validation (~60 sec) - required fields, OCR quality, date validity
   - Tier 2: Deep analysis (~120 sec) - prescriber validation, drug matching, fraud detection
4. **Fraud Prevention** - Risk scoring based on multiple indicators
5. **Real-time Progress** - WebSocket updates for verification stages

### Total Implementation Timeline

| Week | Phase(s) | Focus |
|------|----------|-------|
| 1-2 | 3 | Abuse Prevention System |
| 2-3 | 2 | Rx Drug Handling |
| 3-5 | 4 | **AI Verification Pipeline** |
| 5-6 | 5 | Prescription Management & Flows |
| 6-7 | 1 | Wallet Payment Integration |
| 7-8 | 6, 7 | Timeline & API Consolidation |

**Estimated Total: 8 weeks**

The implementation follows a logical dependency order, ensuring each phase builds upon the previous one while maintaining a functional system throughout development.

---

**Document Version:** 2.0
**Created:** December 2025
**Author:** Bassey Eyo
**Last Updated:** December 2025
**Major Update:** Added comprehensive Prescription Upload & AI Verification (Phase 4)
