# Rapid Capsules Pharmacy Module - Marshal Implementation Plan

## Executive Summary

This document outlines the comprehensive implementation plan for building the Pharmacy Module, mapping the specification requirements against existing code and defining a phased approach to delivery.

---

## Current State Assessment

### What Exists (Can Be Enhanced)

| Component | Current State | Completeness |
|-----------|--------------|--------------|
| **Drug Entity** | Name + Price only | 5% |
| **Pharmacy Entity** | Name, Email, Address only | 10% |
| **Prescription Entity** | Items, patient, prescriber, status | 40% |
| **PrescriptionFile Entity** | Document upload to S3 | 30% |
| **Order Entity** | Full order tracking, payment status | 50% |
| **Payment Integration** | Paystack working | 70% |
| **Patient Prescription UI** | Upload, list, details views | 40% |
| **Patient Orders UI** | List and details views | 40% |
| **Admin Pharmacy Features** | None | 0% |

### What's Missing (Must Build)

1. **Comprehensive Drug Catalog** - Classification, interactions, inventory
2. **Pharmacy Management** - Registration, verification, dashboard
3. **AI Verification Pipeline** - OCR, validation, fraud detection
4. **Prescription Fingerprinting** - Duplicate detection, anti-fraud
5. **E-Prescribing** - Platform doctor prescription creation
6. **OTC Purchase Flow** - Direct drug purchase without prescription
7. **Inventory Management** - Stock, batches, expiry tracking
8. **Pharmacist Dashboard** - Verification queue, dispensing workflow
9. **Admin Oversight** - Compliance, analytics, management
10. **Notification System** - Prescription status, refill reminders

---

## Technology Stack (Maintaining Current)

| Layer | Technology | Notes |
|-------|------------|-------|
| Patient Frontend | Vue.js 3 + Vuex | Existing RC/ project |
| Admin Frontend | Vue.js 3 + Vuetify 3 + Pinia | Existing RC_Admin_UI/ |
| Patient Backend | NestJS + TypeScript | Existing RC-Backend/ |
| Admin Backend | NestJS + TypeScript | Existing RC_Admin_Backend/ |
| Database | MongoDB + Mongoose | Shared database |
| File Storage | AWS S3 | Already integrated |
| OCR Service | AWS Textract | New integration |
| Payments | Paystack | Already integrated |
| SMS | Twilio | Already integrated |
| Email | Brevo SMTP | Already integrated |

---

## Phase 1: Foundation & Drug Catalog (Week 1-2)

### 1.1 Enhanced Drug Entity Schema

**File:** `RC-Backend/src/modules/prescriptions/entities/drug.entity.ts`

```typescript
// New comprehensive Drug schema
{
  // Basic Info
  name: string;                    // Brand name
  generic_name: string;            // Generic/INN name
  manufacturer: string;
  description: string;

  // Classification
  purchase_type: enum;             // OTC_GENERAL, OTC_RESTRICTED, PHARMACY_ONLY, PRESCRIPTION_ONLY, CONTROLLED
  schedule_class: enum;            // OTC, RX_ONLY, SCHEDULE_II, SCHEDULE_III, SCHEDULE_IV, SCHEDULE_V
  atc_code: string;                // Anatomical Therapeutic Chemical code
  categories: string[];            // Pain Relief, Cold & Flu, etc.

  // Product Details
  dosage_form: enum;               // TABLET, CAPSULE, SYRUP, INJECTION, CREAM, etc.
  strength: string;                // "500mg", "10mg/5ml"
  pack_size: number;               // Units per pack
  unit_of_measure: string;         // "tablets", "ml", "capsules"

  // Pricing
  cost_price: number;              // Purchase cost
  selling_price: number;           // Patient price
  currency: string;                // NGN, USD, GBP

  // Regulatory
  nafdac_number: string;           // Nigerian FDA registration
  ndc_code: string;                // National Drug Code (if applicable)
  requires_prescription: boolean;
  requires_pharmacist_approval: boolean;

  // Safety
  contraindications: string[];
  side_effects: string[];
  drug_interactions: string[];     // Drug IDs that interact
  warnings: string[];

  // Controls
  max_quantity_per_order: number;
  max_quantity_per_period: number;
  period_days: number;             // Rolling window for limits
  min_age: number;                 // Age restriction
  health_questionnaire_id: ObjectId;

  // Media
  images: { url: string; is_primary: boolean }[];

  // Status
  is_active: boolean;
  is_available: boolean;

  // Timestamps
  created_at, updated_at
}
```

### 1.2 Enhanced Pharmacy Entity Schema

**File:** `RC-Backend/src/modules/prescriptions/entities/pharmacy.entity.ts`

```typescript
{
  // Basic Info
  name: string;
  registration_number: string;     // PCN registration
  license_number: string;

  // Contact
  email: string;
  phone: string;

  // Location
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    coordinates: { lat: number; lng: number };
  };

  // Operations
  operating_hours: {
    day: string;
    open: string;
    close: string;
    is_closed: boolean;
  }[];
  delivery_zones: string[];        // Areas served
  delivery_fee: number;
  min_order_amount: number;

  // Verification
  verification_status: enum;       // PENDING, VERIFIED, SUSPENDED, REJECTED
  verified_at: Date;
  verified_by: ObjectId;
  documents: {
    type: string;                  // LICENSE, REGISTRATION, ID
    url: string;
    verified: boolean;
  }[];

  // Ratings
  average_rating: number;
  total_ratings: number;

  // Banking (for payouts)
  bank_details: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };

  // Settings
  accepts_insurance: boolean;
  accepted_payment_methods: string[];

  // Status
  is_active: boolean;
  is_online: boolean;              // Currently accepting orders

  // Timestamps
  created_at, updated_at
}
```

### 1.3 New Inventory Entity Schema

**File:** `RC-Backend/src/modules/pharmacy/entities/inventory.entity.ts`

```typescript
{
  pharmacy: ObjectId;              // Reference to Pharmacy
  drug: ObjectId;                  // Reference to Drug

  // Stock Info
  batch_number: string;
  expiry_date: Date;
  quantity_on_hand: number;
  quantity_reserved: number;       // For pending orders
  quantity_available: number;      // Computed: on_hand - reserved

  // Pricing (pharmacy-specific)
  cost_price: number;
  selling_price: number;

  // Thresholds
  reorder_level: number;
  reorder_quantity: number;

  // Location
  storage_location: string;        // Shelf/bin location
  storage_conditions: string;      // Room temp, refrigerated, etc.

  // Status
  is_active: boolean;

  // Timestamps
  created_at, updated_at
}
```

### 1.4 Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 1.1.1 | Update Drug entity with comprehensive schema | 4h |
| 1.1.2 | Create migration script for existing drug data | 2h |
| 1.1.3 | Update Pharmacy entity with full schema | 4h |
| 1.1.4 | Create Inventory entity | 3h |
| 1.1.5 | Create Drug CRUD service & controller | 6h |
| 1.1.6 | Create Pharmacy CRUD service & controller | 6h |
| 1.1.7 | Create Inventory service & controller | 6h |
| 1.1.8 | Create DTOs with validation | 4h |
| 1.1.9 | Add drug search endpoint (by name, category, symptom) | 4h |
| 1.1.10 | Seed initial drug catalog (common medications) | 4h |

**Deliverables:**
- Enhanced database schemas
- Full CRUD APIs for drugs, pharmacies, inventory
- Drug search functionality
- Initial drug catalog data

---

## Phase 2: OTC Purchase Flow (Week 2-3)

### 2.1 Patient OTC Shopping Experience

**New Frontend Components (RC/):**

```
src/views/Mainapp/Pharmacy/
├── index.vue                      # Main pharmacy page
├── DrugCatalog.vue               # Browse/search drugs
├── DrugDetails.vue               # Single drug view
├── Cart.vue                      # Shopping cart
├── Checkout.vue                  # Payment flow
├── components/
│   ├── DrugCard.vue              # Drug listing card
│   ├── DrugSearch.vue            # Search component
│   ├── CategoryFilter.vue        # Category sidebar
│   ├── QuantitySelector.vue      # +/- quantity control
│   ├── CartSummary.vue           # Cart mini-view
│   ├── HealthQuestionnaire.vue   # For restricted OTC
│   └── AgeVerification.vue       # Age check modal
```

### 2.2 Cart & Order Entity Enhancement

**File:** `RC-Backend/src/modules/pharmacy/entities/cart.entity.ts`

```typescript
{
  patient: ObjectId;
  items: [{
    drug: ObjectId;
    quantity: number;
    unit_price: number;
    requires_questionnaire: boolean;
    questionnaire_completed: boolean;
    questionnaire_responses: object;
  }];

  // Computed
  sub_total: number;

  // Status
  is_active: boolean;              // False after checkout

  // Timestamps
  created_at, updated_at
}
```

### 2.3 Health Questionnaire Entity

**File:** `RC-Backend/src/modules/pharmacy/entities/health-questionnaire.entity.ts`

```typescript
{
  name: string;                    // "Pseudoephedrine Purchase Screening"
  drug_categories: string[];       // Which drugs trigger this

  questions: [{
    id: string;
    text: string;
    type: enum;                    // YES_NO, SINGLE_CHOICE, MULTIPLE_CHOICE, TEXT
    options: string[];
    required: boolean;
    disqualifying_answers: string[]; // Answers that block purchase
  }];

  // Status
  is_active: boolean;

  // Timestamps
  created_at, updated_at
}
```

### 2.4 Abuse Prevention Controls

**Implementation in Cart/Order Service:**

```typescript
// Controls to implement
- Per-transaction quantity limits (from drug.max_quantity_per_order)
- Rolling window purchase tracking (7/30/90 days)
- Combination detection (multiple paracetamol products)
- Age verification against user DOB
- Health questionnaire gating
- Account flagging for suspicious patterns
```

### 2.5 Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 2.1.1 | Create Pharmacy main page with search | 6h |
| 2.1.2 | Create DrugCatalog browse component | 6h |
| 2.1.3 | Create DrugDetails page | 4h |
| 2.1.4 | Create Cart entity and service | 4h |
| 2.1.5 | Create Cart UI component | 4h |
| 2.1.6 | Create Checkout flow | 6h |
| 2.1.7 | Implement quantity limit checks | 3h |
| 2.1.8 | Implement rolling window purchase tracking | 4h |
| 2.1.9 | Create HealthQuestionnaire entity & service | 4h |
| 2.1.10 | Create HealthQuestionnaire UI component | 4h |
| 2.1.11 | Implement age verification | 2h |
| 2.1.12 | Add cart persistence (localStorage + DB) | 3h |
| 2.1.13 | Integrate with existing payment flow | 4h |

**Deliverables:**
- Full OTC shopping experience
- Cart management
- Abuse prevention controls
- Health questionnaire system
- Checkout with Paystack

---

## Phase 3: E-Prescribing for Platform Doctors (Week 3-4)

### 3.1 E-Prescription Entity

**File:** `RC-Backend/src/modules/prescriptions/entities/e-prescription.entity.ts`

```typescript
{
  // Source
  prescriber: ObjectId;            // Platform doctor
  patient: ObjectId;
  consultation: ObjectId;          // Link to telemedicine session

  // Prescription Details
  items: [{
    drug: ObjectId;
    dosage: string;                // "500mg"
    frequency: string;             // "Twice daily"
    duration: string;              // "7 days"
    quantity: number;              // Total units
    instructions: string;          // "Take with food"
    refills_authorized: number;    // 0-12
    substitution_allowed: boolean;
  }];

  // Clinical Notes
  diagnosis: string;
  clinical_notes: string;

  // Digital Signature
  digital_signature: {
    signature_hash: string;
    signed_at: Date;
    certificate_id: string;
  };

  // Lifecycle
  status: enum;                    // DRAFT, SIGNED, SENT, FILLED, PARTIALLY_FILLED, EXPIRED, CANCELLED
  valid_from: Date;
  valid_until: Date;               // Typically 6 months

  // Refill Tracking
  refills_used: number;
  last_filled_date: Date;
  next_refill_eligible_date: Date;

  // Trust
  trust_level: enum;               // HIGHEST (platform), HIGH (external e-rx), MEDIUM, LOW
  verification_status: enum;       // AUTO_VERIFIED, VERIFIED, PENDING, REJECTED

  // Timestamps
  created_at, updated_at
}
```

### 3.2 Prescriber Privileges Entity

**File:** `RC-Backend/src/modules/prescriptions/entities/prescriber-privileges.entity.ts`

```typescript
{
  user: ObjectId;                  // Specialist user

  // License Info
  license_number: string;
  license_state: string;
  license_expiry: Date;
  license_verified: boolean;

  // Prescribing Rights
  can_prescribe: boolean;
  allowed_drug_schedules: string[]; // ['OTC', 'RX_ONLY', 'SCHEDULE_IV', 'SCHEDULE_V']
  restricted_drugs: ObjectId[];    // Specific drugs they cannot prescribe

  // DEA (for controlled substances)
  dea_number: string;
  dea_expiry: Date;
  dea_verified: boolean;

  // Digital Signature
  signature_certificate: string;
  signature_pin_hash: string;

  // Status
  is_active: boolean;
  suspended_reason: string;
  suspended_at: Date;

  // Timestamps
  created_at, updated_at
}
```

### 3.3 Specialist Prescription UI

**New Frontend Components (RC/):**

```
src/views/Mainapp/SpecialistApp/Prescribing/
├── CreatePrescription.vue        # Main prescription form
├── DrugSelector.vue              # Drug search/selection
├── DosageForm.vue                # Dosage configuration
├── SignPrescription.vue          # Digital signature modal
├── PrescriptionHistory.vue       # Past prescriptions
├── components/
│   ├── DrugInteractionAlert.vue  # Warning display
│   ├── AllergyAlert.vue          # Patient allergy warning
│   ├── DosageCalculator.vue      # Dosage helper
│   └── RefillSettings.vue        # Refill configuration
```

### 3.4 Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 3.1.1 | Create E-Prescription entity | 4h |
| 3.1.2 | Create PrescriberPrivileges entity | 3h |
| 3.1.3 | Create E-Prescribing service | 8h |
| 3.1.4 | Create E-Prescribing controller & endpoints | 4h |
| 3.1.5 | Implement digital signature system | 6h |
| 3.1.6 | Add drug interaction checking | 6h |
| 3.1.7 | Add allergy checking against patient profile | 3h |
| 3.1.8 | Create CreatePrescription UI | 8h |
| 3.1.9 | Create DrugSelector with autocomplete | 4h |
| 3.1.10 | Create SignPrescription modal | 4h |
| 3.1.11 | Integrate with consultation workflow | 4h |
| 3.1.12 | Send prescription notification to patient | 2h |
| 3.1.13 | Create prescription preview/print view | 3h |

**Deliverables:**
- Full e-prescribing workflow
- Digital signature system
- Drug interaction checking
- Patient notification
- Integration with consultations

---

## Phase 4: Prescription Upload & AI Verification (Week 4-6)

### 4.1 Prescription Fingerprint Entity

**File:** `RC-Backend/src/modules/prescriptions/entities/prescription-fingerprint.entity.ts`

```typescript
{
  prescription: ObjectId;          // PrescriptionFile reference

  // Fingerprints
  image_hash_sha256: string;       // Exact file hash
  image_hash_md5: string;
  perceptual_hash: string;         // pHash for similar image detection
  content_hash: string;            // Hash of extracted text

  // Extracted Data
  extracted_data: {
    prescriber_name: string;
    prescriber_license: string;
    prescriber_address: string;
    patient_name: string;
    prescription_date: Date;
    drugs: [{
      name: string;
      dosage: string;
      quantity: string;
      instructions: string;
    }];
    signature_present: boolean;
    raw_text: string;
  };

  // OCR Metadata
  ocr_confidence: number;          // 0-100
  ocr_provider: string;            // 'AWS_TEXTRACT'
  ocr_processed_at: Date;

  // Timestamps
  created_at, updated_at
}
```

### 4.2 Prescription Verification Entity

**File:** `RC-Backend/src/modules/prescriptions/entities/prescription-verification.entity.ts`

```typescript
{
  prescription: ObjectId;

  // Verification Result
  verification_status: enum;       // AUTO_APPROVED, APPROVED_WITH_FLAGS, MANUAL_REVIEW, REJECTED
  confidence_score: number;        // 0-100

  // Tier Processing
  tier_1_completed: boolean;
  tier_1_result: object;
  tier_1_duration_ms: number;

  tier_2_completed: boolean;
  tier_2_result: object;
  tier_2_duration_ms: number;

  // Validation Scores (weighted)
  scores: {
    prescriber_name: number;       // 15%
    license_number: number;        // 20%
    practice_address: number;      // 5%
    patient_name: number;          // 10%
    prescription_date: number;     // 10%
    drug_name: number;             // 10%
    dosage_instructions: number;   // 10%
    signature: number;             // 15%
    contact_info: number;          // 5%
  };

  // Flags
  flags: [{
    type: string;
    severity: enum;                // LOW, MEDIUM, HIGH, CRITICAL
    message: string;
  }];

  // Fraud Detection
  duplicate_detected: boolean;
  duplicate_prescription_id: ObjectId;
  fraud_risk_score: number;        // 0-100
  fraud_indicators: string[];

  // Manual Review
  manual_review_required: boolean;
  manual_review_reason: string;
  reviewed_by: ObjectId;           // Pharmacist
  reviewed_at: Date;
  review_notes: string;

  // Timestamps
  created_at, updated_at
}
```

### 4.3 AWS Textract Integration

**File:** `RC-Backend/src/common/external/aws-textract/textract.service.ts`

```typescript
// Service to handle OCR processing
- analyzeDocument(imageBuffer): Promise<TextractResponse>
- extractPrescriptionData(textractResponse): PrescriptionData
- calculateConfidence(textractResponse): number
```

### 4.4 Verification Pipeline Service

**File:** `RC-Backend/src/modules/prescriptions/services/verification-pipeline.service.ts`

```typescript
// Tiered verification logic
- runTier1Verification(prescription): Promise<Tier1Result>  // 60 sec
- runTier2Verification(prescription): Promise<Tier2Result>  // 120 sec
- calculateConfidenceScore(validationResults): number
- checkForDuplicates(fingerprint): Promise<DuplicateResult>
- flagForManualReview(prescription, reason): Promise<void>
```

### 4.5 Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 4.1.1 | Create PrescriptionFingerprint entity | 3h |
| 4.1.2 | Create PrescriptionVerification entity | 3h |
| 4.1.3 | Integrate AWS Textract | 8h |
| 4.1.4 | Build OCR data extraction service | 8h |
| 4.1.5 | Implement image hashing (SHA256, MD5) | 2h |
| 4.1.6 | Implement perceptual hashing (pHash) | 4h |
| 4.1.7 | Build content hash from extracted text | 2h |
| 4.1.8 | Create Tier 1 verification pipeline | 8h |
| 4.1.9 | Create Tier 2 verification pipeline | 8h |
| 4.1.10 | Implement confidence scoring algorithm | 4h |
| 4.1.11 | Build duplicate detection engine | 6h |
| 4.1.12 | Create fraud detection rules | 6h |
| 4.1.13 | Update prescription upload flow | 4h |
| 4.1.14 | Add real-time status updates (SSE/WebSocket) | 4h |
| 4.1.15 | Create verification status UI for patients | 4h |

**Deliverables:**
- OCR integration with AWS Textract
- Multi-tier verification pipeline
- Fingerprinting system
- Duplicate detection
- Real-time verification status

---

## Phase 5: Pharmacist Dashboard & Dispensing (Week 6-7)

### 5.1 Pharmacist User Role

**Update User Entity:**
- Add `user_type: 'Pharmacist'`
- Add pharmacist-specific profile fields
- Link to Pharmacy entity

### 5.2 Manual Review Queue Entity

**File:** `RC-Backend/src/modules/pharmacy/entities/review-queue.entity.ts`

```typescript
{
  prescription: ObjectId;
  pharmacy: ObjectId;

  // Queue Info
  priority: enum;                  // LOW, NORMAL, HIGH, URGENT
  queued_at: Date;

  // Assignment
  assigned_to: ObjectId;           // Pharmacist
  assigned_at: Date;

  // Review
  status: enum;                    // PENDING, IN_REVIEW, APPROVED, REJECTED, ESCALATED
  review_started_at: Date;
  review_completed_at: Date;

  // Decision
  decision: enum;                  // APPROVE, REJECT, REQUEST_CALLBACK
  decision_reason: string;

  // Callback (if needed)
  callback_required: boolean;
  callback_number: string;
  callback_completed: boolean;
  callback_notes: string;

  // Timestamps
  created_at, updated_at
}
```

### 5.3 Dispensing Record Entity

**File:** `RC-Backend/src/modules/pharmacy/entities/dispensing-record.entity.ts`

```typescript
{
  order: ObjectId;
  prescription: ObjectId;
  pharmacy: ObjectId;
  pharmacist: ObjectId;

  // Items Dispensed
  items: [{
    drug: ObjectId;
    batch_number: string;
    quantity_dispensed: number;
    expiry_date: Date;
  }];

  // Labels
  labels_printed: boolean;
  label_data: object;

  // Verification
  verified_by: ObjectId;           // Second pharmacist check
  verified_at: Date;

  // Dispensing
  dispensed_at: Date;
  collection_method: enum;         // PICKUP, DELIVERY

  // Patient Counseling
  counseling_provided: boolean;
  counseling_notes: string;

  // Timestamps
  created_at, updated_at
}
```

### 5.4 Pharmacist Dashboard UI

**New Frontend Components (RC_Admin_UI/ or new Pharmacist Portal):**

```
src/views/Pharmacist/
├── Dashboard.vue                  # Overview & metrics
├── ReviewQueue.vue               # Prescriptions to review
├── PrescriptionReview.vue        # Single prescription review
├── DispensingWorkflow.vue        # Fulfill orders
├── Inventory.vue                 # Stock management
├── components/
│   ├── QueueItem.vue             # Queue list item
│   ├── VerificationChecklist.vue # Review checklist
│   ├── CallbackModal.vue         # Prescriber callback
│   ├── LabelPreview.vue          # Medication label
│   └── PatientHistory.vue        # Patient's Rx history
```

### 5.5 Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 5.1.1 | Add Pharmacist user type | 3h |
| 5.1.2 | Create ReviewQueue entity & service | 4h |
| 5.1.3 | Create DispensingRecord entity & service | 4h |
| 5.1.4 | Build pharmacist authentication/authorization | 4h |
| 5.1.5 | Create pharmacist dashboard API endpoints | 6h |
| 5.1.6 | Create Dashboard overview UI | 4h |
| 5.1.7 | Create ReviewQueue UI | 6h |
| 5.1.8 | Create PrescriptionReview workflow UI | 8h |
| 5.1.9 | Create DispensingWorkflow UI | 6h |
| 5.1.10 | Implement label generation | 4h |
| 5.1.11 | Add pharmacist notes/counseling | 3h |
| 5.1.12 | Create inventory view for pharmacist | 4h |

**Deliverables:**
- Pharmacist user role
- Manual review queue system
- Dispensing workflow
- Label generation
- Pharmacist dashboard

---

## Phase 6: Admin Management & Compliance (Week 7-8)

### 6.1 Admin Pharmacy Management

**New Admin Pages (RC_Admin_UI/):**

```
src/pages/pharmacy/
├── index.vue                      # Pharmacy list
├── [id].vue                       # Pharmacy details
├── drugs/
│   ├── index.vue                  # Drug catalog management
│   └── [id].vue                   # Drug details/edit
├── orders/
│   ├── index.vue                  # All orders
│   └── [id].vue                   # Order details
├── prescriptions/
│   ├── index.vue                  # All prescriptions
│   └── [id].vue                   # Prescription details
├── compliance/
│   ├── index.vue                  # Compliance dashboard
│   ├── fraud-alerts.vue           # Fraud detection alerts
│   └── audit-log.vue              # Audit trail
├── analytics/
│   └── index.vue                  # Pharmacy analytics
```

### 6.2 Audit Log Entity

**File:** `RC-Backend/src/modules/pharmacy/entities/audit-log.entity.ts`

```typescript
{
  // Action
  action: enum;                    // CREATE, UPDATE, DELETE, VIEW, DISPENSE, VERIFY, etc.
  entity_type: string;             // 'Prescription', 'Order', 'Drug', etc.
  entity_id: ObjectId;

  // Actor
  performed_by: ObjectId;
  performed_by_role: string;

  // Details
  changes: {
    field: string;
    old_value: any;
    new_value: any;
  }[];

  // Context
  ip_address: string;
  user_agent: string;

  // Timestamps
  created_at
}
```

### 6.3 Fraud Alert Entity

**File:** `RC-Backend/src/modules/pharmacy/entities/fraud-alert.entity.ts`

```typescript
{
  // Source
  prescription: ObjectId;
  patient: ObjectId;

  // Alert
  alert_type: enum;                // DUPLICATE, DOCTOR_SHOPPING, EARLY_REFILL, QUANTITY_ABUSE, FORGERY
  severity: enum;                  // LOW, MEDIUM, HIGH, CRITICAL

  // Details
  description: string;
  evidence: object;
  related_prescriptions: ObjectId[];

  // Investigation
  status: enum;                    // NEW, INVESTIGATING, CONFIRMED_FRAUD, FALSE_POSITIVE, RESOLVED
  assigned_to: ObjectId;

  // Resolution
  resolution: string;
  resolved_by: ObjectId;
  resolved_at: Date;

  // Actions Taken
  actions: [{
    action: string;
    performed_by: ObjectId;
    performed_at: Date;
  }];

  // Timestamps
  created_at, updated_at
}
```

### 6.4 Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 6.1.1 | Create admin pharmacy endpoints | 6h |
| 6.1.2 | Create AuditLog entity & service | 4h |
| 6.1.3 | Create FraudAlert entity & service | 4h |
| 6.1.4 | Build pharmacy list admin page | 4h |
| 6.1.5 | Build pharmacy details admin page | 4h |
| 6.1.6 | Build drug catalog admin pages | 6h |
| 6.1.7 | Build orders admin pages | 4h |
| 6.1.8 | Build prescriptions admin pages | 4h |
| 6.1.9 | Build compliance dashboard | 6h |
| 6.1.10 | Build fraud alerts page | 4h |
| 6.1.11 | Build audit log viewer | 4h |
| 6.1.12 | Create pharmacy analytics dashboard | 6h |
| 6.1.13 | Implement audit logging middleware | 4h |

**Deliverables:**
- Full admin pharmacy management
- Audit logging system
- Fraud alert management
- Compliance dashboard
- Analytics

---

## Phase 7: Notifications & Refill Management (Week 8-9)

### 7.1 Notification Templates

**Prescription Notifications:**
- Upload received
- Verification in progress
- Auto-verified / Manual review queued
- Approved / Rejected
- Ready for pickup / Out for delivery
- Delivered

**Refill Notifications:**
- Refill eligible reminder (3 days before)
- Refill available
- Too early for refill
- No refills remaining
- Prescription expiring soon

### 7.2 Refill Management Service

**File:** `RC-Backend/src/modules/prescriptions/services/refill.service.ts`

```typescript
// Refill logic
- checkRefillEligibility(prescriptionId): RefillEligibility
- requestRefill(prescriptionId): Promise<Order>
- calculateNextRefillDate(prescription): Date
- sendRefillReminder(prescription): Promise<void>
```

### 7.3 Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 7.1.1 | Create prescription email templates | 4h |
| 7.1.2 | Create SMS notification service | 3h |
| 7.1.3 | Implement real-time notifications (WebSocket) | 4h |
| 7.1.4 | Build refill eligibility checking | 4h |
| 7.1.5 | Build refill request flow | 4h |
| 7.1.6 | Create refill reminder cron job | 3h |
| 7.1.7 | Update patient prescription UI for refills | 4h |
| 7.1.8 | Add push notification support | 4h |

**Deliverables:**
- Email/SMS notifications
- Real-time status updates
- Refill management
- Reminder system

---

## Phase 8: Testing & Optimization (Week 9-10)

### 8.1 Testing Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 8.1.1 | Unit tests for verification pipeline | 8h |
| 8.1.2 | Unit tests for fingerprinting | 4h |
| 8.1.3 | Integration tests for order flow | 6h |
| 8.1.4 | E2E tests for patient purchase flow | 6h |
| 8.1.5 | E2E tests for pharmacist workflow | 6h |
| 8.1.6 | Load testing for verification pipeline | 4h |
| 8.1.7 | Security audit | 8h |

### 8.2 Optimization Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 8.2.1 | Add Redis caching for drug catalog | 4h |
| 8.2.2 | Optimize fingerprint matching queries | 4h |
| 8.2.3 | Add database indexes | 2h |
| 8.2.4 | Optimize image processing | 4h |
| 8.2.5 | Performance monitoring setup | 4h |

---

## Summary: Effort Estimation

| Phase | Description | Duration | Effort |
|-------|-------------|----------|--------|
| 1 | Foundation & Drug Catalog | Week 1-2 | ~43h |
| 2 | OTC Purchase Flow | Week 2-3 | ~54h |
| 3 | E-Prescribing | Week 3-4 | ~59h |
| 4 | AI Verification Pipeline | Week 4-6 | ~74h |
| 5 | Pharmacist Dashboard | Week 6-7 | ~56h |
| 6 | Admin & Compliance | Week 7-8 | ~64h |
| 7 | Notifications & Refills | Week 8-9 | ~30h |
| 8 | Testing & Optimization | Week 9-10 | ~56h |
| **Total** | | **10 weeks** | **~436h** |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| AWS Textract accuracy | Implement fallback to manual review; train custom models if needed |
| Fraud detection false positives | Start conservative, tune based on data |
| Pharmacist adoption | Build intuitive UI; provide training materials |
| Regulatory compliance | Consult legal; implement audit trails from start |
| Performance at scale | Design for async processing; use queues |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Tier 1 Auto-Verification Rate | 70% |
| Tier 1+2 Combined Verification | 90% |
| Average Verification Time | < 45 seconds |
| Duplicate Detection Accuracy | 98% |
| False Positive Rate (Fraud) | < 2% |
| Patient Checkout Completion | 85% |
| System Uptime | 99.9% |

---

## Next Steps

1. **Review & Approve Plan** - Confirm scope and priorities
2. **Set Up Development Environment** - AWS Textract credentials, test data
3. **Begin Phase 1** - Database schema updates and drug catalog
4. **Weekly Check-ins** - Track progress, adjust as needed

---

*Document Version: 1.0*
*Created: December 2025*
*Author: Bassey Eyo*
