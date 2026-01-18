# Prescription Review System - Comprehensive Implementation Plan

## Overview

This plan extends the existing prescription management system to provide a complete workflow for reviewing uploaded prescriptions that require pharmacist attention. It leverages existing admin and patient dashboards rather than creating new pages.

---

## Current System Analysis

### Existing Components

#### Admin Side (RC_Admin_UI)
| Page | Path | Purpose |
|------|------|---------|
| Prescriptions List | `/pharmacy/prescriptions/index.vue` | View all prescriptions with filtering |
| Prescription Detail | `/pharmacy/prescriptions/[id].vue` | Individual prescription details |
| Fraud Alerts | `/pharmacy/compliance/fraud-alerts.vue` | Fraud detection alert management |
| Orders | `/pharmacy/orders/index.vue` | Pharmacy order management |

#### Patient Side (RC)
| Page | Path | Purpose |
|------|------|---------|
| My Prescriptions | `/views/Mainapp/Prescriptions/Patient.vue` | List all patient prescriptions |
| Prescription Details | `/views/Mainapp/Prescriptions/PatientDetails.vue` | View individual prescription |
| Upload Prescription | `/views/Mainapp/Pharmacy/UploadPrescription.vue` | Upload new prescriptions with verification flow |

#### Backend (RC-Backend)
| Service | Path | Purpose |
|---------|------|---------|
| Verification Service | `/modules/pharmacy/services/prescription-verification.service.ts` | Multi-tier verification pipeline |
| Upload Controller | `/modules/pharmacy/controllers/prescription-upload.controller.ts` | Handle prescription uploads |
| Entity | `/modules/pharmacy/entities/patient-prescription-upload.entity.ts` | Prescription data schema |

### Verification Status Flow
```
PENDING → TIER1_PROCESSING → TIER1_PASSED → TIER2_PROCESSING → TIER2_PASSED → APPROVED
                          ↓                                  ↓
                    TIER1_FAILED                        TIER2_FAILED
                                                             ↓
                                                    PHARMACIST_REVIEW → APPROVED/REJECTED
```

---

## Phase 1: Admin Dashboard - Pharmacist Review Queue

### 1.1 Extend Prescriptions List (index.vue)

**File:** `/RC_Admin_UI/src/pages/pharmacy/prescriptions/index.vue`

**Add new features:**

1. **Review Queue Tab/Filter**
   - Add "Needs Review" filter tab that shows `verification_status = PHARMACIST_REVIEW`
   - Show badge count of pending reviews in navigation

2. **New Status Filter Options**
   ```javascript
   const statusOptions = [
     // Existing statuses...
     { title: 'Needs Pharmacist Review', value: 'PHARMACIST_REVIEW' },
     { title: 'Tier 1 Failed', value: 'TIER1_FAILED' },
     { title: 'Tier 2 Failed', value: 'TIER2_FAILED' },
   ]
   ```

3. **Risk Indicator Column**
   - Show fraud score as color-coded badge (green/yellow/orange/red)
   - Show risk level chip (MINIMAL/LOW/MEDIUM/HIGH/CRITICAL)

4. **Quick Actions**
   - "Review" button that opens detail page with review panel
   - "Approve" quick action for low-risk items
   - "Reject" quick action with reason modal

### 1.2 Extend Prescription Detail Page ([id].vue)

**File:** `/RC_Admin_UI/src/pages/pharmacy/prescriptions/[id].vue`

**Add new sections:**

1. **AI Analysis Panel**
   ```vue
   <VCard v-if="prescription.verification_status === 'PHARMACIST_REVIEW'">
     <VCardTitle>AI Verification Analysis</VCardTitle>
     <VCardText>
       <!-- Fraud Score Gauge -->
       <VProgressCircular :model-value="fraudScore" :color="fraudColor" size="100">
         {{ fraudScore }}/100
       </VProgressCircular>

       <!-- Risk Level -->
       <VChip :color="riskColor">{{ riskLevel }}</VChip>

       <!-- Detected Issues -->
       <VList>
         <VListItem v-for="flag in fraudFlags">
           <VListItemTitle>{{ flag.flag }}</VListItemTitle>
           <VListItemSubtitle>{{ flag.description }}</VListItemSubtitle>
           <VChip :color="severityColor(flag.severity)">{{ flag.severity }}</VChip>
         </VListItem>
       </VList>
     </VCardText>
   </VCard>
   ```

2. **OCR Data Display**
   - Show extracted doctor name, clinic, medications
   - Side-by-side comparison with prescription image
   - Edit capability for OCR corrections

3. **Review Actions Panel**
   ```vue
   <VCard>
     <VCardTitle>Pharmacist Review</VCardTitle>
     <VCardText>
       <VTextarea v-model="reviewNotes" label="Review Notes" />

       <!-- Medication Verification Checklist -->
       <VList>
         <VListItem v-for="med in medications">
           <VCheckbox v-model="med.verified" />
           <span>{{ med.name }} - {{ med.dosage }}</span>
           <VSelect v-model="med.matched_drug_id" :items="drugMatches" />
         </VListItem>
       </VList>
     </VCardText>
     <VCardActions>
       <VBtn color="success" @click="approvePrescription">
         <VIcon>mdi-check</VIcon> Approve
       </VBtn>
       <VBtn color="warning" @click="requestClarification">
         <VIcon>mdi-comment-question</VIcon> Request Clarification
       </VBtn>
       <VBtn color="error" @click="rejectPrescription">
         <VIcon>mdi-close</VIcon> Reject
       </VBtn>
     </VCardActions>
   </VCard>
   ```

4. **Prescription Image Viewer**
   - Zoomable image/PDF viewer
   - Annotation capability
   - Download original file

### 1.3 Backend API Endpoints (Admin)

**New Endpoints:**

```typescript
// Get prescriptions needing review
GET /admin-api/pharmacy/prescriptions/pending-review
Query: { page, limit, risk_level?, fraud_score_min? }
Response: { prescriptions: [], total, pending_count }

// Get prescription review details
GET /admin-api/pharmacy/prescriptions/:id/review-details
Response: {
  prescription,
  verification,
  fraudDetection: { score, risk_level, flags, ai_analysis },
  ocrData,
  prescriptionImage
}

// Submit pharmacist review
POST /admin-api/pharmacy/prescriptions/:id/review
Body: {
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_CLARIFICATION',
  notes: string,
  rejection_reason?: string,
  clarification_request?: string,
  verified_medications?: [{ medication_id, matched_drug_id, verified: boolean }]
}

// Get review queue count (for badge)
GET /admin-api/pharmacy/prescriptions/review-queue-count
Response: { count: number, by_risk: { high: 0, medium: 0, low: 0 } }
```

---

## Phase 2: Patient Dashboard - Status Visibility

### 2.1 Extend My Prescriptions Page (Patient.vue)

**File:** `/RC/src/views/Mainapp/Prescriptions/Patient.vue`

**Add new features:**

1. **Review Status Tab**
   - Add "Under Review" filter tab
   - Show prescriptions with `verification_status` in review states

2. **Status Badge Updates**
   ```javascript
   const statusMap = {
     // Existing...
     'PHARMACIST_REVIEW': 'Under Review',
     'TIER1_FAILED': 'Verification Failed',
     'TIER2_FAILED': 'Additional Review Needed',
     'NEEDS_CLARIFICATION': 'Action Required',
   };
   ```

3. **Action Required Indicator**
   - Show notification dot for prescriptions needing patient action
   - Display clarification requests prominently

### 2.2 Extend Prescription Details Page (PatientDetails.vue)

**File:** `/RC/src/views/Mainapp/Prescriptions/PatientDetails.vue`

**Already implemented (from previous session):**
- "Why This Needs Review" section showing fraud detection results
- Review reasons display with risk level

**Additional features to add:**

1. **Clarification Response Form**
   ```vue
   <div v-if="prescription.verification_status === 'NEEDS_CLARIFICATION'" class="clarification-section">
     <h3>Action Required</h3>
     <p class="clarification-request">{{ prescription.clarification_request }}</p>

     <form @submit.prevent="submitClarification">
       <textarea v-model="clarificationResponse" placeholder="Your response..." />
       <input type="file" @change="handleAdditionalDoc" accept="image/*,application/pdf" />
       <button type="submit">Submit Response</button>
     </form>
   </div>
   ```

2. **Status Timeline Enhancement**
   - Show verification progress steps
   - Display when pharmacist started review
   - Show estimated review time

### 2.3 Extend Upload Prescription Page (UploadPrescription.vue)

**File:** `/RC/src/views/Mainapp/Pharmacy/UploadPrescription.vue`

**Already partially implemented. Complete the following:**

1. **Review Pending State UI**
   - Clear explanation of what "Under Review" means
   - Expected timeframe message
   - Contact support option

2. **Clarification Request Handling**
   - Show clarification request prominently
   - Allow response submission
   - Upload additional documents

---

## Phase 3: Email Notifications

### 3.1 New Email Templates

**Location:** `/RC-Backend/src/core/emails/mails/prescriptionEmails.ts`

| Template | Recipient | Trigger | Content |
|----------|-----------|---------|---------|
| `prescriptionUnderReview` | Patient | Status → PHARMACIST_REVIEW | Explanation of review process, expected timeline |
| `prescriptionApproved` | Patient | Status → APPROVED | Confirmation, link to proceed with order |
| `prescriptionRejected` | Patient | Status → REJECTED | Rejection reason, guidance on next steps |
| `clarificationNeeded` | Patient | Request clarification | What info is needed, how to respond |
| `clarificationReceived` | Patient | Patient submits response | Confirmation of receipt |
| `newPrescriptionToReview` | Pharmacist | New PHARMACIST_REVIEW | Alert with quick link to review |
| `dailyReviewSummary` | Pharmacists | Daily @ 9am | Summary of pending reviews |

### 3.2 Email Template Content

**prescriptionUnderReview.ts:**
```typescript
export const prescriptionUnderReviewEmail = (data: {
  patientName: string;
  prescriptionNumber: string;
  uploadDate: string;
  estimatedReviewTime: string;
}) => ({
  subject: 'Your Prescription is Under Review',
  html: `
    <h1>Prescription Review in Progress</h1>
    <p>Dear ${data.patientName},</p>
    <p>Your prescription <strong>${data.prescriptionNumber}</strong> uploaded on ${data.uploadDate}
       requires additional verification by our pharmacist team.</p>

    <h2>What This Means</h2>
    <ul>
      <li>Our AI system flagged some items that need human verification</li>
      <li>This is a standard safety procedure to ensure prescription accuracy</li>
      <li>Your prescription will be reviewed within ${data.estimatedReviewTime}</li>
    </ul>

    <h2>What You Can Do</h2>
    <p>No action is required from you at this time. We'll notify you once the review is complete.</p>

    <a href="https://rapidcapsule.com/app/patient/prescriptions" class="button">
      View Prescription Status
    </a>
  `,
});
```

**prescriptionApproved.ts:**
```typescript
export const prescriptionApprovedEmail = (data: {
  patientName: string;
  prescriptionNumber: string;
  medications: Array<{ name: string; dosage: string }>;
  validUntil: string;
}) => ({
  subject: 'Your Prescription Has Been Approved!',
  html: `
    <h1>Prescription Approved</h1>
    <p>Dear ${data.patientName},</p>
    <p>Great news! Your prescription <strong>${data.prescriptionNumber}</strong> has been
       verified and approved.</p>

    <h2>Approved Medications</h2>
    <ul>
      ${data.medications.map(m => `<li>${m.name} - ${m.dosage}</li>`).join('')}
    </ul>

    <p>This prescription is valid until <strong>${data.validUntil}</strong>.</p>

    <h2>Next Steps</h2>
    <p>You can now add these medications to your cart and complete your order.</p>

    <a href="https://rapidcapsule.com/app/patient/prescriptions" class="button">
      Order Medications
    </a>
  `,
});
```

### 3.3 Email Trigger Points

**Add to verification service:**
```typescript
// In prescription-verification.service.ts

async transitionToPharmacistReview(uploadId: string) {
  await this.uploadModel.findByIdAndUpdate(uploadId, {
    verification_status: VerificationStatus.PHARMACIST_REVIEW,
  });

  const upload = await this.uploadModel.findById(uploadId).populate('patient');

  // Send patient email
  await this.emailService.sendEmail({
    to: upload.patient.email,
    template: 'prescriptionUnderReview',
    data: {
      patientName: upload.patient.profile.first_name,
      prescriptionNumber: upload.digital_signature?.reference_number,
      uploadDate: upload.created_at,
      estimatedReviewTime: '24-48 hours',
    },
  });

  // Alert pharmacists
  await this.emailService.sendToRole('pharmacist', {
    template: 'newPrescriptionToReview',
    data: { uploadId, fraudScore: upload.fraud_score },
  });
}

async approvePrescription(uploadId: string, reviewerId: string, notes: string) {
  const upload = await this.uploadModel.findByIdAndUpdate(uploadId, {
    verification_status: VerificationStatus.APPROVED,
    reviewed_by: reviewerId,
    reviewed_at: new Date(),
    review_notes: notes,
  }).populate('patient');

  // Send approval email
  await this.emailService.sendEmail({
    to: upload.patient.email,
    template: 'prescriptionApproved',
    data: {
      patientName: upload.patient.profile.first_name,
      prescriptionNumber: upload.digital_signature?.reference_number,
      medications: upload.verified_medications,
      validUntil: upload.valid_until,
    },
  });
}
```

---

## Phase 4: Inventory Integration

### 4.1 Inventory Check on Approval

When a prescription is approved, check medication availability:

```typescript
// In prescription-verification.service.ts

async approvePrescription(uploadId: string, reviewerId: string, notes: string) {
  const upload = await this.uploadModel.findById(uploadId);

  // Check inventory for each medication
  const inventoryStatus = await Promise.all(
    upload.verified_medications
      .filter(m => m.matched_drug_id)
      .map(async (med) => {
        const drug = await this.drugModel.findById(med.matched_drug_id);
        const inventory = await this.inventoryModel.findOne({
          drug: med.matched_drug_id,
          pharmacy: defaultPharmacyId, // or patient's preferred pharmacy
        });

        return {
          drug_id: med.matched_drug_id,
          drug_name: med.matched_drug_name,
          requested_quantity: parseInt(med.quantity) || 1,
          available_quantity: inventory?.quantity || 0,
          in_stock: (inventory?.quantity || 0) >= (parseInt(med.quantity) || 1),
          unit_price: drug?.price || 0,
        };
      })
  );

  // Store inventory status with prescription
  await this.uploadModel.findByIdAndUpdate(uploadId, {
    verification_status: VerificationStatus.APPROVED,
    reviewed_by: reviewerId,
    reviewed_at: new Date(),
    review_notes: notes,
    inventory_status: inventoryStatus,
    all_in_stock: inventoryStatus.every(i => i.in_stock),
  });

  return { upload, inventoryStatus };
}
```

### 4.2 Inventory Status Display (Patient Side)

Show inventory status on PatientDetails.vue:

```vue
<template>
  <div v-if="prescription.verification_status === 'approved' && prescription.inventory_status" class="inventory-section">
    <h3>Medication Availability</h3>

    <div v-for="item in prescription.inventory_status" :key="item.drug_id" class="inventory-item">
      <span class="drug-name">{{ item.drug_name }}</span>
      <span :class="['stock-status', item.in_stock ? 'in-stock' : 'out-of-stock']">
        {{ item.in_stock ? 'In Stock' : 'Limited Stock' }}
      </span>
      <span class="price">NGN {{ formatCurrency(item.unit_price) }}</span>
    </div>

    <div v-if="prescription.all_in_stock" class="action-section">
      <button class="btn btn-primary" @click="addAllToCart">
        Add All to Cart - NGN {{ totalPrice }}
      </button>
    </div>
    <div v-else class="partial-stock-notice">
      <p>Some medications have limited availability. You can order available items now.</p>
      <button class="btn btn-secondary" @click="addAvailableToCart">
        Add Available Items to Cart
      </button>
    </div>
  </div>
</template>
```

---

## Phase 5: Add to Cart / Checkout Integration

### 5.1 Cart Integration

**Endpoint to add approved prescription to cart:**

```typescript
// POST /api/cart/add-from-prescription
@Post('add-from-prescription')
async addPrescriptionToCart(
  @Body() dto: { prescriptionId: string; selectedMedications?: string[] },
  @Request() req,
) {
  const upload = await this.uploadModel.findById(dto.prescriptionId);

  // Verify prescription is approved and belongs to patient
  if (upload.verification_status !== VerificationStatus.APPROVED) {
    throw new BadRequestException('Prescription not yet approved');
  }
  if (upload.patient.toString() !== req.user.sub) {
    throw new ForbiddenException('Not your prescription');
  }

  // Get medications to add (all or selected)
  const medsToAdd = dto.selectedMedications?.length
    ? upload.verified_medications.filter(m => dto.selectedMedications.includes(m.matched_drug_id?.toString()))
    : upload.verified_medications.filter(m => m.matched_drug_id && m.is_valid);

  // Add each medication to cart
  for (const med of medsToAdd) {
    await this.cartService.addItem({
      patient: req.user.sub,
      drug: med.matched_drug_id,
      quantity: parseInt(med.quantity) || 1,
      prescription_upload_id: upload._id,
    });
  }

  return { message: 'Items added to cart', itemCount: medsToAdd.length };
}
```

### 5.2 Checkout Prescription Link

When checking out with prescription items:

```typescript
// In checkout service
async createOrder(cartItems, prescriptionUploadId) {
  const order = await this.orderModel.create({
    // ... order details
    linked_prescription_upload: prescriptionUploadId,
  });

  // Update prescription usage
  if (prescriptionUploadId) {
    await this.uploadModel.findByIdAndUpdate(prescriptionUploadId, {
      $inc: { usage_count: 1 },
      $push: { used_in_orders: order._id },
    });
  }

  return order;
}
```

---

## Phase 6: Implementation Order

### Backend First (Phases 3-5)

1. **Email Templates** (1-2 days)
   - Create new email template files
   - Add email trigger logic to verification service
   - Test email delivery

2. **Review API Endpoints** (2-3 days)
   - Add admin review endpoints
   - Add clarification request/response endpoints
   - Add inventory check integration
   - Add cart integration endpoint

3. **Inventory Integration** (1-2 days)
   - Add inventory status to approval flow
   - Update entity with inventory_status field
   - Add pricing calculation

### Frontend Second (Phases 1-2)

4. **Admin Dashboard Extensions** (3-4 days)
   - Add review queue to prescriptions list
   - Add AI analysis panel to detail page
   - Add review actions panel
   - Add image viewer

5. **Patient Dashboard Extensions** (2-3 days)
   - Extend status displays
   - Add clarification response form
   - Add inventory display
   - Add "Add to Cart" functionality

### Testing

6. **Full Flow Testing** (2 days)
   - Test upload → verification → review → approve/reject flow
   - Test email delivery at each stage
   - Test inventory checking
   - Test cart integration
   - Test edge cases (expired prescriptions, partial stock)

---

## Database Schema Updates

### patient_prescription_uploads Collection

Add new fields:

```javascript
{
  // Existing fields...

  // New fields for clarification flow
  clarification_request: String,
  clarification_response: String,
  clarification_documents: [{ s3_key: String, s3_url: String, uploaded_at: Date }],
  clarification_requested_at: Date,
  clarification_responded_at: Date,

  // New fields for inventory integration
  inventory_status: [{
    drug_id: ObjectId,
    drug_name: String,
    requested_quantity: Number,
    available_quantity: Number,
    in_stock: Boolean,
    unit_price: Number,
    checked_at: Date,
  }],
  all_in_stock: Boolean,
  estimated_total: Number,

  // Cart integration
  added_to_cart_at: Date,
  cart_session_id: String,
}
```

---

## API Summary

### New Admin Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin-api/pharmacy/prescriptions/pending-review` | Get review queue |
| GET | `/admin-api/pharmacy/prescriptions/review-queue-count` | Get queue count for badge |
| GET | `/admin-api/pharmacy/prescriptions/:id/review-details` | Get full review data |
| POST | `/admin-api/pharmacy/prescriptions/:id/review` | Submit review decision |
| POST | `/admin-api/pharmacy/prescriptions/:id/request-clarification` | Request info from patient |

### New Patient Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/pharmacy/prescriptions/:id/clarification` | Submit clarification response |
| GET | `/api/pharmacy/prescriptions/:id/inventory-status` | Check medication availability |
| POST | `/api/cart/add-from-prescription` | Add prescription items to cart |

---

## File Change Summary

### Backend (RC-Backend)

| File | Action | Changes |
|------|--------|---------|
| `prescription-verification.service.ts` | Modify | Add review methods, email triggers, inventory check |
| `prescription-upload.controller.ts` | Modify | Add clarification endpoint |
| `patient-prescription-upload.entity.ts` | Modify | Add new fields |
| `prescriptionEmails.ts` | Create/Modify | Add 7 new email templates |
| `cart.service.ts` | Modify | Add prescription cart integration |

### Admin Frontend (RC_Admin_UI)

| File | Action | Changes |
|------|--------|---------|
| `pharmacy/prescriptions/index.vue` | Modify | Add review queue tab, risk indicators |
| `pharmacy/prescriptions/[id].vue` | Modify | Add AI analysis panel, review actions |
| `components/PrescriptionReviewPanel.vue` | Create | Review UI component |
| `components/FraudAnalysisDisplay.vue` | Create | Fraud score display |

### Patient Frontend (RC)

| File | Action | Changes |
|------|--------|---------|
| `Prescriptions/Patient.vue` | Modify | Add review status tab |
| `Prescriptions/PatientDetails.vue` | Modify | Add clarification form, inventory display |
| `Pharmacy/UploadPrescription.vue` | Minor | Already has review info (from previous session) |
| `components/ClarificationForm.vue` | Create | Patient clarification submission |
| `components/InventoryStatus.vue` | Create | Medication availability display |

---

## Success Metrics

1. **Pharmacist Efficiency**
   - Average review time < 5 minutes
   - 90% of reviews completed within 24 hours

2. **Patient Experience**
   - 100% of patients receive status update emails
   - < 10% clarification requests
   - Clear understanding of process (via feedback)

3. **Fraud Prevention**
   - 100% of high-risk prescriptions reviewed
   - < 1% false positive rate
   - Documented rejection reasons

4. **Order Conversion**
   - 80%+ of approved prescriptions result in orders
   - < 5% cart abandonment due to inventory issues
