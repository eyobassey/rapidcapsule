<template>
  <div class="upload-prescription">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
      </button>
      <h1>Upload Prescription</h1>
    </div>

    <div class="upload-content">
      <!-- Upload Section - shown when no file selected -->
      <div class="upload-section" v-if="!selectedFile && !uploading && !uploadedPrescription">
        <!-- Upload Area -->
        <div class="upload-area">
          <div class="upload-icon-wrapper">
            <svg class="upload-main-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <h3>Upload Your Prescription</h3>
          <p class="upload-subtitle">Take a photo or select an image/PDF of your prescription</p>

          <div class="upload-buttons">
            <button class="upload-btn primary" @click="openFilePicker">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Choose File
            </button>
            <button class="upload-btn secondary" @click="openCamera">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Take Photo
            </button>
          </div>

          <p class="file-types">Supported: JPG, PNG, WebP, PDF (Max 10MB)</p>
        </div>

        <!-- Requirements -->
        <div class="requirements-card">
          <h4>For best results:</h4>
          <ul class="requirements-list">
            <li>
              <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Ensure image is clear and readable
            </li>
            <li>
              <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Include doctor's signature
            </li>
            <li>
              <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Prescription date must be visible
            </li>
          </ul>
          <div class="time-notice">
            <svg class="clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Verification takes up to 2 minutes</span>
          </div>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          @change="handleFileSelect"
          style="display: none"
        />
        <input
          ref="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          @change="handleFileSelect"
          style="display: none"
        />
      </div>

      <!-- Selected File Preview - hide once upload is complete -->
      <div class="file-preview" v-if="selectedFile && !uploading && !uploadedPrescription">
        <div class="preview-header">
          <h3>Selected File</h3>
          <button class="clear-btn" @click="clearSelection">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="preview-content">
          <img
            v-if="filePreviewUrl && !isPdf"
            :src="filePreviewUrl"
            alt="Prescription preview"
            class="preview-image"
          />
          <div v-else-if="isPdf" class="pdf-preview">
            <svg class="pdf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>{{ selectedFile.name }}</span>
          </div>
        </div>
        <div class="file-info">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
        </div>
        <button class="submit-btn" @click="uploadPrescription" :disabled="uploading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload Prescription
        </button>
      </div>

      <!-- Uploading State -->
      <div class="uploading-state" v-if="uploading">
        <div class="upload-progress">
          <div class="spinner"></div>
          <h3>Uploading...</h3>
          <p>This may take up to 2 minutes</p>
        </div>
      </div>

      <!-- Verification Progress/Results -->
      <div class="verification-progress" v-if="uploadedPrescription">
        <div class="status-header" :class="getHeaderClass()">
          <div class="status-icon">
            <!-- Check circle for approved -->
            <svg v-if="verificationStatus === 'APPROVED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <!-- Alert circle for rejected -->
            <svg v-else-if="verificationStatus === 'REJECTED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <!-- Clock for review -->
            <svg v-else-if="verificationStatus === 'PHARMACIST_REVIEW'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <!-- Loader for processing -->
            <svg v-else class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
            </svg>
          </div>
          <h3>{{ getHeaderTitle() }}</h3>
          <p>{{ getHeaderSubtitle() }}</p>
        </div>

        <!-- Verification Timeline -->
        <div class="verification-timeline">
          <div
            class="timeline-step"
            :class="{
              active: verificationStep >= 1,
              completed: verificationStep > 1,
            }"
          >
            <div class="step-indicator">
              <svg v-if="verificationStep > 1" class="step-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span v-else>1</span>
            </div>
            <div class="step-content">
              <h4>Upload Complete</h4>
              <p>File received successfully</p>
            </div>
          </div>

          <div
            class="timeline-step"
            :class="{
              active: verificationStep >= 2,
              completed: verificationStep > 2,
            }"
          >
            <div class="step-indicator">
              <div class="step-spinner" v-if="verificationStep === 2"></div>
              <svg v-else-if="verificationStep > 2" class="step-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span v-else>2</span>
            </div>
            <div class="step-content">
              <h4>Initial Checks (Tier 1)</h4>
              <p>OCR, image quality, format validation</p>
            </div>
          </div>

          <div
            class="timeline-step"
            :class="{
              active: verificationStep >= 3,
              completed: verificationStep > 3,
            }"
          >
            <div class="step-indicator">
              <div class="step-spinner" v-if="verificationStep === 3"></div>
              <svg v-else-if="verificationStep > 3" class="step-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span v-else>3</span>
            </div>
            <div class="step-content">
              <h4>AI Analysis (Tier 2)</h4>
              <p>Medication validation, doctor verification</p>
            </div>
          </div>

          <div
            class="timeline-step"
            :class="{
              active: verificationStep >= 4,
              completed: verificationStatus === 'APPROVED',
              failed: verificationStatus === 'REJECTED',
              review: verificationStatus === 'PHARMACIST_REVIEW',
            }"
          >
            <div class="step-indicator">
              <svg v-if="verificationStatus === 'APPROVED'" class="step-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else-if="verificationStatus === 'REJECTED'" class="step-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              <svg v-else-if="verificationStatus === 'PHARMACIST_REVIEW'" class="step-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span v-else>4</span>
            </div>
            <div class="step-content">
              <h4>
                {{ getStatusTitle() }}
              </h4>
              <p>{{ getStatusDescription() }}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons - hide when rejected since rejection section has its own button -->
        <div class="action-buttons" v-if="verificationStatus !== 'REJECTED'">
          <button class="secondary-btn" @click="viewDetails" v-if="verificationStatus === 'APPROVED' || verificationStatus === 'PHARMACIST_REVIEW'">
            View Details
          </button>
          <button class="primary-btn" @click="uploadAnother">
            Upload Another
          </button>
        </div>

        <!-- Review Reasons Section - Show why prescription needs pharmacist review -->
        <div class="review-reasons-section" v-if="verificationStatus === 'PHARMACIST_REVIEW'">
          <div class="review-header">
            <svg class="review-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <h4>Prescription Under Review</h4>
          </div>

          <!-- Patient-friendly summary -->
          <p class="review-summary" v-if="patientSummary">
            {{ patientSummary }}
          </p>
          <p class="review-summary" v-else>
            Your prescription requires verification by our pharmacy team before it can be used.
          </p>

          <p class="review-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            A pharmacist will review within 24 hours. We'll notify you once it's complete.
          </p>
        </div>

        <!-- Coverage Status Section -->
        <div class="coverage-section" v-if="verificationStatus === 'APPROVED' || verificationStatus === 'PHARMACIST_REVIEW'">
          <!-- Verified Medications from Prescription -->
          <div class="verified-meds" v-if="verifiedMedications.length > 0">
            <h4>📋 Medications on Prescription</h4>
            <div class="med-list">
              <div
                v-for="(med, index) in verifiedMedications"
                :key="index"
                :class="['med-item', { valid: med.is_valid, invalid: !med.is_valid }]"
              >
                <span class="med-status">{{ med.is_valid ? '✓' : '✗' }}</span>
                <div class="med-details">
                  <span class="med-name">{{ med.prescription_medication_name }}</span>
                  <span class="med-match" v-if="med.is_valid && med.matched_drug_name">
                    → {{ med.matched_drug_name }}
                  </span>
                  <span class="med-dosage" v-if="med.dosage">{{ med.dosage }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Cart Coverage Status -->
          <div class="cart-coverage" v-if="rxCartItems.length > 0">
            <h4>🛒 Cart Coverage Status</h4>

            <!-- All Covered -->
            <div v-if="coverageStatus.allCovered" class="coverage-success">
              <div class="coverage-icon">✅</div>
              <div class="coverage-message">
                <strong>All prescription items covered!</strong>
                <p>Your prescription covers all {{ coverageStatus.covered.length }} RX item(s) in your cart.</p>
              </div>
            </div>

            <!-- Partial Coverage -->
            <div v-else-if="coverageStatus.covered.length > 0" class="coverage-partial">
              <div class="coverage-summary">
                <span class="covered-count">{{ coverageStatus.covered.length }} covered</span>
                <span class="separator">|</span>
                <span class="uncovered-count">{{ coverageStatus.uncovered.length }} need prescription</span>
              </div>

              <!-- Covered Items -->
              <div class="covered-items" v-if="coverageStatus.covered.length">
                <h5>✓ Covered Items</h5>
                <div class="item-chips">
                  <span v-for="item in coverageStatus.covered" :key="item.drugId" class="item-chip covered">
                    {{ item.name }}
                  </span>
                </div>
              </div>

              <!-- Uncovered Items -->
              <div class="uncovered-items" v-if="coverageStatus.uncovered.length">
                <h5>⚠️ Still Needs Prescription</h5>
                <div class="item-chips">
                  <span v-for="item in coverageStatus.uncovered" :key="item.drugId" class="item-chip uncovered">
                    {{ item.name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- No Coverage -->
            <div v-else class="coverage-none">
              <div class="coverage-icon">⚠️</div>
              <div class="coverage-message">
                <strong>Prescription doesn't cover cart items</strong>
                <p>The medications on this prescription don't match the RX items in your cart.</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons Based on Coverage -->
          <div class="coverage-actions">
            <!-- Returning to checkout flow -->
            <template v-if="returnTo">
              <template v-if="coverageStatus.allCovered">
                <!-- Countdown redirect UI -->
                <div class="redirect-countdown" v-if="redirectCountdown !== null">
                  <div class="countdown-header">
                    <svg class="countdown-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>All items covered!</span>
                  </div>
                  <p class="countdown-text">Redirecting to checkout in <strong>{{ redirectCountdown }}</strong> seconds...</p>
                  <div class="countdown-progress">
                    <div class="countdown-bar" :style="{ width: (redirectCountdown / 10) * 100 + '%' }"></div>
                  </div>
                  <div class="countdown-actions">
                    <button class="countdown-btn secondary" @click="cancelRedirect">
                      Stay Here
                    </button>
                    <button class="countdown-btn primary" @click="redirectNow">
                      Go Now
                    </button>
                  </div>
                </div>
                <!-- User cancelled redirect -->
                <div v-else class="redirect-cancelled">
                  <p>Take your time to review the verification results.</p>
                  <button class="action-btn primary" @click="redirectNow">
                    Continue to Checkout
                  </button>
                </div>
              </template>
              <template v-else-if="coverageStatus.uncovered.length > 0">
                <div class="action-options">
                  <button class="action-btn primary" @click="proceedToCheckout">
                    Continue with Covered Items
                  </button>
                  <button class="action-btn secondary" @click="uploadAnother">
                    Upload Another Prescription
                  </button>
                  <button class="action-btn danger" @click="removeUncoveredItems">
                    Remove Uncovered Items & Checkout
                  </button>
                </div>
              </template>
            </template>

            <!-- Not from checkout - general navigation -->
            <template v-else>
              <template v-if="verificationStatus === 'PHARMACIST_REVIEW'">
                <p class="review-note">Once the pharmacist approves your prescription, you'll be able to use it for orders.</p>
                <button class="action-btn secondary" @click="$router.push('/app/patient/prescriptions')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  View My Prescriptions
                </button>
              </template>
              <template v-else-if="rxCartItems.length > 0">
                <button class="action-btn primary" @click="proceedToCheckout">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  Go to Cart
                </button>
              </template>
              <template v-else>
                <p>Prescription approved! You can now use it for your orders.</p>
                <button class="action-btn primary" @click="$router.push('/app/patient/pharmacy')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  Browse Medications
                </button>
              </template>
            </template>
          </div>
        </div>

        <!-- Rejection Details Section -->
        <div class="rejected-section" v-else-if="verificationStatus === 'REJECTED'">
          <!-- Patient-friendly rejection summary -->
          <p class="rejection-summary" v-if="patientSummary">
            {{ patientSummary }}
          </p>
          <p class="rejection-summary" v-else>
            Your prescription could not be verified. Please try uploading a clearer image or contact support.
          </p>

          <button class="browse-btn" @click="uploadAnother">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Try Again
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div class="error-state" v-if="uploadError">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3>Upload Failed</h3>
        <p>{{ uploadError }}</p>
        <button class="retry-btn" @click="retryUpload">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Try Again
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import axios from "@/services/http";

export default defineComponent({
  name: "UploadPrescription",
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    const fileInput = ref(null);
    const cameraInput = ref(null);
    const selectedFile = ref(null);
    const filePreviewUrl = ref(null);
    const uploading = ref(false);
    const uploadError = ref(null);
    const uploadedPrescription = ref(null);
    const verificationStep = ref(1);
    const verificationStatus = ref(null);
    const pollingInterval = ref(null);
    const returnTo = ref(null); // Store return URL from checkout
    const verifiedMedications = ref([]); // Medications verified from prescription
    const failureReasons = ref([]); // Reasons why prescription was rejected (admin detail)
    const patientSummary = ref(null); // Patient-friendly summary from AI
    const processingTimeMs = ref(null); // Time taken to verify in milliseconds
    const redirectCountdown = ref(null); // Countdown timer for redirect
    const redirectIntervalId = ref(null); // Interval ID for countdown
    const fraudDetection = ref(null); // Fraud detection results
    const verificationData = ref(null); // Full verification data

    // Get cart items from store
    const cart = computed(() => store.getters['pharmacy/getCart'] || []);
    const rxCartItems = computed(() => cart.value.filter(item => item.requiresPrescription));

    // Calculate coverage - which RX items in cart are covered by this prescription
    const coverageStatus = computed(() => {
      if (!verifiedMedications.value.length || !rxCartItems.value.length) {
        return { covered: [], uncovered: rxCartItems.value, allCovered: false };
      }

      const validMeds = verifiedMedications.value.filter(m => m.is_valid && m.matched_drug_id);
      const validDrugIds = validMeds.map(m => m.matched_drug_id?.toString() || m.matched_drug_id);

      const covered = [];
      const uncovered = [];

      for (const item of rxCartItems.value) {
        const drugId = item.drugId?.toString() || item.drugId;
        if (validDrugIds.includes(drugId)) {
          covered.push(item);
        } else {
          uncovered.push(item);
        }
      }

      return {
        covered,
        uncovered,
        allCovered: uncovered.length === 0 && covered.length > 0,
      };
    });

    const isPdf = computed(() => {
      return selectedFile.value?.type === "application/pdf";
    });

    const openCamera = () => {
      cameraInput.value?.click();
    };

    const openFilePicker = () => {
      fileInput.value?.click();
    };

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        uploadError.value = "File size exceeds 10MB limit";
        return;
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        uploadError.value = "Invalid file type. Please upload JPEG, PNG, WebP, or PDF";
        return;
      }

      selectedFile.value = file;
      uploadError.value = null;

      // Create preview URL for images
      if (file.type.startsWith("image/")) {
        filePreviewUrl.value = URL.createObjectURL(file);
      }
    };

    const clearSelection = () => {
      selectedFile.value = null;
      filePreviewUrl.value = null;
      if (fileInput.value) fileInput.value.value = "";
      if (cameraInput.value) cameraInput.value.value = "";
    };

    const formatFileSize = (bytes) => {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const uploadPrescription = async () => {
      if (!selectedFile.value) return;

      uploading.value = true;
      uploadError.value = null;

      try {
        const formData = new FormData();
        formData.append("prescription", selectedFile.value);
        formData.append(
          "uploadSource",
          cameraInput.value?.value ? "MOBILE_CAMERA" : "FILE_UPLOAD"
        );

        const response = await axios.post(
          "/pharmacy/prescriptions/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // Backend returns { success: true, data: {...} } or { statusCode: 200, data: {...} }
        console.log("Upload response:", response);
        console.log("Response data:", response.data);

        const isSuccess = response.status === 200 || response.status === 201 ||
                          response.data?.statusCode === 200 || response.data?.statusCode === 201 ||
                          response.data?.success === true;

        const uploadData = response.data?.data;
        console.log("isSuccess:", isSuccess, "uploadData:", uploadData);

        if (isSuccess && uploadData && uploadData.uploadId) {
          uploadedPrescription.value = uploadData;
          verificationStep.value = 2;
          startPollingVerification(uploadData.uploadId);
        } else {
          console.error("Upload validation failed - isSuccess:", isSuccess, "uploadData:", uploadData, "uploadId:", uploadData?.uploadId);
          throw new Error(response.data?.message || "Upload failed - invalid response");
        }
      } catch (error) {
        uploadError.value =
          error.response?.data?.message || error.message || "Failed to upload prescription";
      } finally {
        uploading.value = false;
      }
    };

    const startPollingVerification = (uploadId) => {
      // Poll every 3 seconds for verification status
      pollingInterval.value = setInterval(async () => {
        try {
          const response = await axios.get(
            `/pharmacy/prescriptions/${uploadId}/verification`
          );

          if (response.status === 200 || response.data.statusCode === 200) {
            const data = response.data.data || response.data.result;
            verificationStatus.value = data.status;

            // Store verified medications when available
            if (data.verifiedMedications && data.verifiedMedications.length > 0) {
              verifiedMedications.value = data.verifiedMedications;
            }

            // Store processing time when available
            if (data.verification?.totalProcessingTime) {
              processingTimeMs.value = data.verification.totalProcessingTime;
            }

            // Store fraud detection data
            if (data.verification?.fraudDetection) {
              fraudDetection.value = data.verification.fraudDetection;
            }

            // Store full verification data for display
            verificationData.value = data.verification;

            // Store failure reasons (for review and rejection - admin detail)
            if (data.failureReasons && data.failureReasons.length > 0) {
              failureReasons.value = data.failureReasons;
            }

            // Store patient-friendly summary from AI
            if (data.patientSummary) {
              patientSummary.value = data.patientSummary;
            }

            // Update step based on status
            if (data.status === "TIER1_PROCESSING") {
              verificationStep.value = 2;
            } else if (data.status === "TIER1_PASSED") {
              verificationStep.value = 2;
            } else if (data.status === "TIER1_FAILED") {
              // Tier 1 failure is a final state - show as rejected
              verificationStep.value = 4;
              verificationStatus.value = "REJECTED";
              if (data.failureReasons) {
                failureReasons.value = data.failureReasons;
              }
              stopPolling();
            } else if (
              data.status === "TIER2_PROCESSING" ||
              data.status === "TIER2_PASSED"
            ) {
              verificationStep.value = 3;
            } else if (data.status === "TIER2_FAILED") {
              // Tier 2 failure is a final state - show as rejected
              verificationStep.value = 4;
              verificationStatus.value = "REJECTED";
              if (data.failureReasons) {
                failureReasons.value = data.failureReasons;
              }
              stopPolling();
            } else if (
              data.status === "APPROVED" ||
              data.status === "REJECTED" ||
              data.status === "PHARMACIST_REVIEW"
            ) {
              verificationStep.value = 4;
              stopPolling();
            }
          }
        } catch (error) {
          console.error("Error polling verification status:", error);
        }
      }, 3000);
    };

    const stopPolling = () => {
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
      }
    };

    // Watch for approval and auto-redirect if came from checkout
    watch(verificationStatus, (newStatus) => {
      if (newStatus === 'APPROVED' && returnTo.value) {
        // Store the approved prescription ID for checkout to use
        const prescriptionId = uploadedPrescription.value?.uploadId;
        if (prescriptionId) {
          store.commit('setSelectedPrescription', prescriptionId);
        }

        // Start 10-second countdown before redirect
        redirectCountdown.value = 10;
        redirectIntervalId.value = setInterval(() => {
          redirectCountdown.value--;
          if (redirectCountdown.value <= 0) {
            clearInterval(redirectIntervalId.value);
            redirectIntervalId.value = null;
            const redirectUrl = returnTo.value.includes('?')
              ? `${returnTo.value}&prescriptionId=${prescriptionId}`
              : `${returnTo.value}?prescriptionId=${prescriptionId}`;
            router.push(redirectUrl);
          }
        }, 1000);
      }
    });

    // Cancel redirect countdown
    const cancelRedirect = () => {
      if (redirectIntervalId.value) {
        clearInterval(redirectIntervalId.value);
        redirectIntervalId.value = null;
      }
      redirectCountdown.value = null;
    };

    // Redirect now (skip countdown)
    const redirectNow = () => {
      if (redirectIntervalId.value) {
        clearInterval(redirectIntervalId.value);
        redirectIntervalId.value = null;
      }
      const prescriptionId = uploadedPrescription.value?.uploadId;
      const redirectUrl = returnTo.value.includes('?')
        ? `${returnTo.value}&prescriptionId=${prescriptionId}`
        : `${returnTo.value}?prescriptionId=${prescriptionId}`;
      router.push(redirectUrl);
    };

    const getStatusTitle = () => {
      switch (verificationStatus.value) {
        case "APPROVED":
          return "Verification Complete";
        case "REJECTED":
          return "Verification Failed";
        case "PHARMACIST_REVIEW":
          return "Pending Review";
        default:
          return "Verification Complete";
      }
    };

    const getStatusDescription = () => {
      switch (verificationStatus.value) {
        case "APPROVED":
          return "Your prescription has been approved";
        case "REJECTED":
          return "Prescription could not be verified";
        case "PHARMACIST_REVIEW":
          return "A pharmacist will review your prescription";
        default:
          return "Final verification status";
      }
    };

    // Header helper functions for dynamic status display
    const getHeaderClass = () => {
      switch (verificationStatus.value) {
        case "APPROVED":
          return "success";
        case "REJECTED":
          return "failed";
        case "PHARMACIST_REVIEW":
          return "review";
        default:
          return "processing";
      }
    };

    const getHeaderIcon = () => {
      switch (verificationStatus.value) {
        case "APPROVED":
          return "check-circle";
        case "REJECTED":
          return "alert-circle";
        case "PHARMACIST_REVIEW":
          return "clock";
        default:
          return "loader";
      }
    };

    const getHeaderTitle = () => {
      switch (verificationStatus.value) {
        case "APPROVED":
          return "Prescription Approved!";
        case "REJECTED":
          return "Verification Failed";
        case "PHARMACIST_REVIEW":
          return "Under Review";
        default:
          return "Verifying Prescription...";
      }
    };

    // Format processing time for display
    const formattedProcessingTime = computed(() => {
      if (!processingTimeMs.value) return null;
      const seconds = (processingTimeMs.value / 1000).toFixed(1);
      return `${seconds}s`;
    });

    // Get CSS class for fraud score
    const getFraudScoreClass = () => {
      if (!fraudDetection.value) return '';
      const score = fraudDetection.value.score || 0;
      if (score >= 80) return 'critical';
      if (score >= 60) return 'high';
      if (score >= 40) return 'medium';
      return 'low';
    };

    // Format risk level for display
    const formatRiskLevel = (level) => {
      if (!level) return 'Unknown';
      const labels = {
        'CRITICAL': 'Critical Risk',
        'HIGH': 'High Risk',
        'MEDIUM': 'Medium Risk',
        'LOW': 'Low Risk',
        'MINIMAL': 'Minimal Risk'
      };
      return labels[level] || level.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    };

    const getHeaderSubtitle = () => {
      const timeStr = formattedProcessingTime.value ? ` in ${formattedProcessingTime.value}` : '';
      switch (verificationStatus.value) {
        case "APPROVED":
          return `Your prescription has been verified${timeStr}`;
        case "REJECTED":
          return `Verification completed${timeStr}`;
        case "PHARMACIST_REVIEW":
          return "A pharmacist will review your prescription shortly";
        default:
          return "AI verification is in progress";
      }
    };

    // De-duplicate failure reasons (avoid showing same issue from both tier checks and fraud flags)
    const dedupedFailureReasons = computed(() => {
      if (!failureReasons.value || failureReasons.value.length === 0) return [];

      const seen = new Set();
      const deduped = [];

      for (const reason of failureReasons.value) {
        // Create a key based on the type of issue (normalize similar names)
        const normalizedReason = reason.reason.toLowerCase().replace(/[^a-z]/g, '');
        const key = normalizedReason.includes('duplicate') ? 'duplicate' : normalizedReason;

        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(reason);
        }
      }

      return deduped;
    });

    const viewDetails = () => {
      if (uploadedPrescription.value?.uploadId) {
        router.push(
          `/pharmacy/prescriptions/${uploadedPrescription.value.uploadId}`
        );
      }
    };

    const uploadAnother = () => {
      stopPolling();
      selectedFile.value = null;
      filePreviewUrl.value = null;
      uploadedPrescription.value = null;
      verificationStep.value = 1;
      verificationStatus.value = null;
      uploadError.value = null;
      failureReasons.value = [];
      patientSummary.value = null;
      processingTimeMs.value = null;
    };

    const retryUpload = () => {
      uploadError.value = null;
    };

    onMounted(() => {
      // Check if we came from checkout (or another page) and need to return
      returnTo.value = route.query.returnTo || null;

      // Check if we need to show camera directly
      const showCamera = route.query.camera;
      if (showCamera === "true") {
        setTimeout(() => openCamera(), 300);
      }
    });

    onUnmounted(() => {
      stopPolling();
      if (redirectIntervalId.value) {
        clearInterval(redirectIntervalId.value);
      }
      if (filePreviewUrl.value) {
        URL.revokeObjectURL(filePreviewUrl.value);
      }
    });

    // Navigation functions for coverage actions
    const goToCart = () => {
      router.push('/app/patient/pharmacy/cart');
    };

    const removeUncoveredItems = async () => {
      // Remove all uncovered RX items from cart
      for (const item of coverageStatus.value.uncovered) {
        await store.dispatch('pharmacy/removeFromCart', item.drugId);
      }
      // Then go to cart
      goToCart();
    };

    const proceedToCheckout = () => {
      // Store the prescription and go to cart
      const prescriptionId = uploadedPrescription.value?.uploadId;
      if (prescriptionId) {
        router.push(`/app/patient/pharmacy/cart?prescriptionId=${prescriptionId}`);
      } else {
        router.push('/app/patient/pharmacy/cart');
      }
    };

    return {
      fileInput,
      cameraInput,
      selectedFile,
      filePreviewUrl,
      uploading,
      uploadError,
      uploadedPrescription,
      verificationStep,
      verificationStatus,
      returnTo,
      verifiedMedications,
      rxCartItems,
      coverageStatus,
      isPdf,
      openCamera,
      openFilePicker,
      handleFileSelect,
      clearSelection,
      formatFileSize,
      uploadPrescription,
      getStatusTitle,
      getStatusDescription,
      getHeaderClass,
      getHeaderIcon,
      getHeaderTitle,
      getHeaderSubtitle,
      dedupedFailureReasons,
      processingTimeMs,
      formattedProcessingTime,
      viewDetails,
      uploadAnother,
      retryUpload,
      goToCart,
      removeUncoveredItems,
      proceedToCheckout,
      failureReasons,
      patientSummary,
      redirectCountdown,
      cancelRedirect,
      redirectNow,
      fraudDetection,
      verificationData,
      getFraudScoreClass,
      formatRiskLevel,
    };
  },
});
</script>

<style scoped lang="scss">
.upload-prescription {
  min-height: 100vh;
  background: $color-g-95;
  padding-bottom: $size-80;
  overflow-y: auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-16;
  background: $color-white;
  border-bottom: 1px solid $color-g-85;
  position: sticky;
  top: 0;
  z-index: 10;

  .back-btn {
    width: $size-40;
    height: $size-40;
    border-radius: 50%;
    border: none;
    background: $color-g-95;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    svg {
      width: $size-20;
      height: $size-20;
      color: $color-g-21;
    }
  }

  h1 {
    font-size: $size-18;
    font-weight: 600;
    color: $color-g-21;
  }
}

.upload-content {
  padding: $size-16;
}

// New Upload Section Styles
.upload-section {
  .upload-area {
    background: $color-white;
    border-radius: $size-16;
    padding: $size-32 $size-24;
    text-align: center;
    margin-bottom: $size-16;
    border: 2px dashed $color-g-85;

    .upload-icon-wrapper {
      width: $size-64;
      height: $size-64;
      border-radius: 50%;
      background: rgba($color-pri, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto $size-16;

      .upload-main-icon {
        width: $size-32;
        height: $size-32;
        color: $color-pri;
      }
    }

    h3 {
      font-size: $size-18;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: $size-8;
    }

    .upload-subtitle {
      font-size: $size-14;
      color: $color-g-67;
      margin-bottom: $size-20;
    }

    .upload-buttons {
      display: flex;
      gap: $size-12;
      justify-content: center;
      margin-bottom: $size-16;

      .upload-btn {
        display: flex;
        align-items: center;
        gap: $size-8;
        padding: $size-12 $size-20;
        border-radius: $size-10;
        font-size: $size-14;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;

        svg {
          width: $size-18;
          height: $size-18;
          flex-shrink: 0;
        }

        &.primary {
          background: $color-pri;
          color: white;

          &:hover {
            background: darken($color-pri, 8%);
          }
        }

        &.secondary {
          background: $color-g-95;
          color: $color-g-21;

          &:hover {
            background: $color-g-90;
          }
        }
      }
    }

    .file-types {
      font-size: $size-12;
      color: $color-g-67;
      margin: 0;
    }
  }

  .requirements-card {
    background: $color-white;
    border-radius: $size-12;
    padding: $size-16;

    h4 {
      font-size: $size-14;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: $size-12;
    }

    .requirements-list {
      list-style: none;
      padding: 0;
      margin: 0 0 $size-16 0;

      li {
        display: flex;
        align-items: center;
        gap: $size-8;
        font-size: $size-13;
        color: $color-g-44;
        padding: $size-6 0;

        .check-icon {
          width: $size-16;
          height: $size-16;
          flex-shrink: 0;
          stroke: $color-denote-green;
        }
      }
    }

    .time-notice {
      display: flex;
      align-items: center;
      gap: $size-8;
      padding: $size-12;
      background: rgba($color-pri, 0.05);
      border-radius: $size-8;
      font-size: $size-13;
      color: $color-pri;

      .clock-icon {
        width: $size-16;
        height: $size-16;
        flex-shrink: 0;
        stroke: $color-pri;
      }
    }
  }
}

// Legacy styles (keeping for backwards compatibility)
.upload-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $size-16;

  .upload-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $size-12;
    padding: $size-24;
    background: $color-white;
    border: 2px dashed $color-g-85;
    border-radius: $size-16;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: $color-pri;
      background: rgba($color-pri, 0.02);
    }

    .option-icon {
      width: $size-56;
      height: $size-56;
      border-radius: 50%;
      background: rgba($color-pri, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: $size-28;
        height: $size-28;
        color: $color-pri;
      }
    }

    span {
      font-size: $size-14;
      font-weight: 500;
      color: $color-g-21;
    }
  }
}

.file-preview {
  background: $color-white;
  border-radius: $size-16;
  overflow: hidden;

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-16;
    border-bottom: 1px solid $color-g-95;

    h3 {
      font-size: $size-16;
      font-weight: 600;
      color: $color-g-21;
    }

    .clear-btn {
      width: $size-32;
      height: $size-32;
      border-radius: 50%;
      border: none;
      background: $color-g-95;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      svg {
        width: $size-16;
        height: $size-16;
        color: $color-g-44;
      }
    }
  }

  .preview-content {
    padding: $size-16;

    .preview-image {
      width: 100%;
      max-height: 300px;
      object-fit: contain;
      border-radius: $size-8;
    }

    .pdf-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $size-12;
      padding: $size-32;
      background: $color-g-95;
      border-radius: $size-8;

      svg {
        width: $size-48;
        height: $size-48;
        color: $color-pri;
      }

      span {
        font-size: $size-14;
        color: $color-g-44;
      }
    }
  }

  .file-info {
    display: flex;
    justify-content: space-between;
    padding: 0 $size-16;
    margin-bottom: $size-16;

    .file-name {
      font-size: $size-14;
      color: $color-g-21;
      font-weight: 500;
    }

    .file-size {
      font-size: $size-14;
      color: $color-g-67;
    }
  }

  .submit-btn {
    width: calc(100% - $size-32);
    margin: 0 $size-16 $size-16;
    padding: $size-14;
    background: $color-pri;
    color: white;
    border: none;
    border-radius: $size-12;
    font-size: $size-16;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover:not(:disabled) {
      background: darken($color-pri, 10%);
    }

    &:disabled {
      background: $color-g-85;
      cursor: not-allowed;
    }

    svg {
      width: $size-20;
      height: $size-20;
    }
  }
}

.uploading-state {
  background: $color-white;
  border-radius: $size-16;
  padding: $size-48;
  text-align: center;

  .upload-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $size-16;

    .spinner {
      width: $size-48;
      height: $size-48;
      border: 3px solid $color-g-85;
      border-top-color: $color-pri;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    h3 {
      font-size: $size-18;
      font-weight: 600;
      color: $color-g-21;
    }

    p {
      font-size: $size-14;
      color: $color-g-67;
    }
  }
}

.verification-progress {
  background: $color-white;
  border-radius: $size-16;
  overflow: visible;

  .status-header {
    text-align: center;
    padding: $size-24;
    border-bottom: 1px solid $color-g-95;
    border-radius: $size-16 $size-16 0 0;

    .status-icon {
      width: $size-56;
      height: $size-56;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto $size-12;

      svg {
        width: $size-28;
        height: $size-28;
      }
    }

    h3 {
      font-size: $size-18;
      font-weight: 600;
      margin-bottom: $size-4;
    }

    p {
      font-size: $size-14;
      color: $color-g-67;
    }

    // Processing state (default)
    &.processing {
      background: rgba($color-pri, 0.05);

      .status-icon {
        background: rgba($color-pri, 0.1);
        svg { color: $color-pri; }
      }
      h3 { color: $color-pri; }
    }

    // Success state
    &.success {
      background: rgba($color-denote-green, 0.05);

      .status-icon {
        background: rgba($color-denote-green, 0.1);
        svg { color: $color-denote-green; }
      }
      h3 { color: $color-denote-green; }
    }

    // Failed state
    &.failed {
      background: rgba($color-denote-red, 0.05);

      .status-icon {
        background: rgba($color-denote-red, 0.1);
        svg { color: $color-denote-red; }
      }
      h3 { color: $color-denote-red; }
    }

    // Review state
    &.review {
      background: rgba($color-denote-yellow, 0.05);

      .status-icon {
        background: rgba($color-denote-yellow, 0.1);
        svg { color: darken($color-denote-yellow, 10%); }
      }
      h3 { color: darken($color-denote-yellow, 10%); }
    }
  }

  .verification-timeline {
    padding: $size-24;

    .timeline-step {
      display: flex;
      gap: $size-16;
      padding-bottom: $size-24;
      position: relative;

      &:not(:last-child)::before {
        content: "";
        position: absolute;
        left: $size-15;
        top: $size-36;
        width: 2px;
        height: calc(100% - $size-32);
        background: $color-g-85;
      }

      &.completed::before {
        background: $color-denote-green;
      }

      &.active .step-indicator {
        background: $color-pri;
        color: white;
      }

      &.completed .step-indicator {
        background: $color-denote-green;
        color: white;
      }

      &.failed .step-indicator {
        background: $color-denote-red;
        color: white;
      }

      &.review .step-indicator {
        background: $color-denote-yellow;
        color: $color-g-21;
      }

      .step-indicator {
        width: $size-32;
        height: $size-32;
        border-radius: 50%;
        background: $color-g-85;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: $size-14;
        font-weight: 600;
        color: $color-g-67;
        flex-shrink: 0;

        .step-spinner {
          width: $size-16;
          height: $size-16;
          border: 2px solid rgba(white, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        svg {
          width: $size-16;
          height: $size-16;
        }
      }

      .step-content {
        flex: 1;
        padding-top: $size-4;

        h4 {
          font-size: $size-14;
          font-weight: 600;
          color: $color-g-21;
          margin-bottom: $size-2;
        }

        p {
          font-size: $size-12;
          color: $color-g-67;
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: $size-12;
    padding: 0 $size-24 $size-16;

    button {
      flex: 1;
      padding: $size-12;
      border-radius: $size-10;
      font-size: $size-14;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .secondary-btn {
      background: $color-g-95;
      border: none;
      color: $color-g-21;

      &:hover {
        background: $color-g-85;
      }
    }

    .primary-btn {
      background: $color-pri;
      border: none;
      color: white;

      &:hover {
        background: darken($color-pri, 10%);
      }
    }
  }

  .quick-navigate {
    padding: $size-16 $size-24 $size-24;
    text-align: center;
    border-top: 1px solid $color-g-95;

    p {
      font-size: $size-14;
      color: $color-g-44;
      margin-bottom: $size-12;
    }

    .browse-btn {
      display: inline-flex;
      align-items: center;
      gap: $size-8;
      padding: $size-12 $size-24;
      background: rgba($color-pri, 0.1);
      color: $color-pri;
      border: none;
      border-radius: $size-10;
      font-size: $size-14;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover {
        background: rgba($color-pri, 0.15);
      }

      svg {
        width: $size-18;
        height: $size-18;
      }
    }

    .redirect-spinner {
      width: $size-24;
      height: $size-24;
      border: 3px solid $color-g-85;
      border-top-color: $color-denote-green;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: $size-12 auto 0;
    }
  }
}

.error-state {
  background: $color-white;
  border-radius: $size-16;
  padding: $size-48;
  text-align: center;

  .error-icon {
    width: $size-56;
    height: $size-56;
    border-radius: 50%;
    background: rgba($color-denote-red, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $size-16;

    svg {
      width: $size-28;
      height: $size-28;
      color: $color-denote-red;
    }
  }

  h3 {
    font-size: $size-18;
    font-weight: 600;
    color: $color-g-21;
    margin-bottom: $size-8;
  }

  p {
    font-size: $size-14;
    color: $color-g-67;
    margin-bottom: $size-24;
  }

  .retry-btn {
    display: inline-flex;
    align-items: center;
    gap: $size-8;
    padding: $size-12 $size-24;
    background: $color-pri;
    color: white;
    border: none;
    border-radius: $size-10;
    font-size: $size-14;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: darken($color-pri, 10%);
    }

    svg {
      width: $size-18;
      height: $size-18;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Coverage Section Styles
.coverage-section {
  padding: $size-16;
  background: $color-white;
  border-radius: $size-12;
  margin-top: $size-16;

  .verified-meds {
    margin-bottom: $size-20;

    h4 {
      font-size: $size-14;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: $size-12;
    }

    .med-list {
      display: flex;
      flex-direction: column;
      gap: $size-8;
    }

    .med-item {
      display: flex;
      align-items: flex-start;
      gap: $size-10;
      padding: $size-10;
      border-radius: $size-8;
      background: $color-g-95;

      &.valid {
        background: rgba($color-denote-green, 0.08);

        .med-status {
          color: $color-denote-green;
        }
      }

      &.invalid {
        background: rgba($color-denote-red, 0.08);

        .med-status {
          color: $color-denote-red;
        }
      }

      .med-status {
        font-weight: 600;
        font-size: $size-16;
      }

      .med-details {
        flex: 1;

        .med-name {
          font-weight: 500;
          color: $color-g-21;
          display: block;
        }

        .med-match {
          font-size: $size-12;
          color: $color-denote-green;
          display: block;
        }

        .med-dosage {
          font-size: $size-12;
          color: $color-g-67;
        }
      }
    }
  }

  .cart-coverage {
    border-top: 1px solid $color-g-90;
    padding-top: $size-16;

    h4 {
      font-size: $size-14;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: $size-12;
    }

    .coverage-success,
    .coverage-none {
      display: flex;
      align-items: flex-start;
      gap: $size-12;
      padding: $size-14;
      border-radius: $size-10;
    }

    .coverage-success {
      background: rgba($color-denote-green, 0.08);

      .coverage-icon {
        font-size: $size-24;
      }

      .coverage-message {
        strong {
          color: $color-denote-green;
          display: block;
          margin-bottom: $size-4;
        }

        p {
          font-size: $size-13;
          color: $color-g-44;
          margin: 0;
        }
      }
    }

    .coverage-none {
      background: rgba($color-denote-yellow, 0.08);

      .coverage-icon {
        font-size: $size-24;
      }

      .coverage-message {
        strong {
          color: $color-denote-yellow;
          display: block;
          margin-bottom: $size-4;
        }

        p {
          font-size: $size-13;
          color: $color-g-44;
          margin: 0;
        }
      }
    }

    .coverage-partial {
      .coverage-summary {
        display: flex;
        align-items: center;
        gap: $size-12;
        padding: $size-12;
        background: $color-g-95;
        border-radius: $size-8;
        margin-bottom: $size-12;

        .covered-count {
          color: $color-denote-green;
          font-weight: 600;
        }

        .separator {
          color: $color-g-77;
        }

        .uncovered-count {
          color: $color-denote-yellow;
          font-weight: 600;
        }
      }

      .covered-items,
      .uncovered-items {
        margin-bottom: $size-12;

        h5 {
          font-size: $size-13;
          font-weight: 500;
          color: $color-g-44;
          margin-bottom: $size-8;
        }

        .item-chips {
          display: flex;
          flex-wrap: wrap;
          gap: $size-8;

          .item-chip {
            padding: $size-6 $size-12;
            border-radius: $size-16;
            font-size: $size-12;
            font-weight: 500;

            &.covered {
              background: rgba($color-denote-green, 0.1);
              color: $color-denote-green;
            }

            &.uncovered {
              background: rgba($color-denote-yellow, 0.1);
              color: $color-denote-yellow;
            }
          }
        }
      }
    }
  }

  .coverage-actions {
    margin-top: $size-20;
    padding-top: $size-16;
    border-top: 1px solid $color-g-90;

    .redirect-message {
      text-align: center;
      color: $color-denote-green;
      font-weight: 500;
      margin-bottom: $size-8;
    }

    .redirect-spinner {
      width: $size-24;
      height: $size-24;
      border: 3px solid $color-g-85;
      border-top-color: $color-denote-green;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    .redirect-countdown {
      background: rgba($color-denote-green, 0.06);
      border: 1px solid rgba($color-denote-green, 0.2);
      border-radius: $size-12;
      padding: $size-20;
      text-align: center;

      .countdown-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: $size-8;
        margin-bottom: $size-12;

        .countdown-check {
          width: $size-24;
          height: $size-24;
          color: $color-denote-green;
        }

        span {
          font-size: $size-16;
          font-weight: 600;
          color: $color-denote-green;
        }
      }

      .countdown-text {
        font-size: $size-14;
        color: $color-g-44;
        margin-bottom: $size-16;

        strong {
          font-size: $size-18;
          color: $color-pri;
        }
      }

      .countdown-progress {
        height: 4px;
        background: $color-g-90;
        border-radius: 2px;
        margin-bottom: $size-16;
        overflow: hidden;

        .countdown-bar {
          height: 100%;
          background: $color-pri;
          border-radius: 2px;
          transition: width 1s linear;
        }
      }

      .countdown-actions {
        display: flex;
        gap: $size-12;
        justify-content: center;

        .countdown-btn {
          padding: $size-10 $size-20;
          border-radius: $size-8;
          font-size: $size-14;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;

          &.primary {
            background: $color-pri;
            color: white;

            &:hover {
              background: darken($color-pri, 8%);
            }
          }

          &.secondary {
            background: $color-white;
            color: $color-g-44;
            border: 1px solid $color-g-85;

            &:hover {
              background: $color-g-95;
            }
          }
        }
      }
    }

    .redirect-cancelled {
      text-align: center;

      p {
        color: $color-g-44;
        margin-bottom: $size-16;
      }
    }

    .action-options {
      display: flex;
      flex-direction: column;
      gap: $size-10;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $size-8;
      padding: $size-12 $size-20;
      border-radius: $size-10;
      font-size: $size-14;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;

      svg {
        width: $size-18;
        height: $size-18;
      }

      &.primary {
        background: $color-pri;
        color: white;

        &:hover {
          background: darken($color-pri, 8%);
        }
      }

      &.secondary {
        background: $color-g-95;
        color: $color-g-21;

        &:hover {
          background: $color-g-90;
        }
      }

      &.danger {
        background: rgba($color-denote-red, 0.1);
        color: $color-denote-red;

        &:hover {
          background: rgba($color-denote-red, 0.15);
        }
      }
    }

    p {
      text-align: center;
      color: $color-g-67;
      font-size: $size-14;
      margin-bottom: $size-12;
    }
  }
}

// Rejection Section Styles
.rejected-section {
  padding: $size-16 $size-24 $size-24;
  text-align: left;

  .rejection-summary {
    font-size: $size-14;
    color: $color-g-44;
    margin-bottom: $size-20;
    line-height: 1.6;
    padding: $size-14 $size-16;
    background: rgba($color-denote-red, 0.05);
    border-radius: $size-8;
    border-left: 3px solid $color-denote-red;
  }

  .rejection-reasons {
    background: rgba($color-denote-red, 0.04);
    border: 1px solid rgba($color-denote-red, 0.15);
    border-radius: $size-12;
    padding: $size-16;
    margin-bottom: $size-20;

    .reasons-intro {
      font-size: $size-14;
      color: $color-g-44;
      margin-bottom: $size-12;
    }

    .reasons-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: $size-12;

      .reason-item {
        display: flex;
        align-items: flex-start;
        gap: $size-10;
        padding: $size-12;
        background: $color-white;
        border-radius: $size-8;
        border-left: 3px solid $color-g-67;

        &.critical {
          border-left-color: $color-denote-red;
        }

        &.high {
          border-left-color: #e67e22;
        }

        &.medium {
          border-left-color: $color-denote-yellow;
        }

        &.low {
          border-left-color: $color-g-67;
        }

        .reason-badge {
          flex-shrink: 0;
          padding: $size-4 $size-8;
          border-radius: $size-4;
          font-size: $size-10;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;

          &.critical {
            background: rgba($color-denote-red, 0.12);
            color: $color-denote-red;
          }

          &.high {
            background: rgba(#e67e22, 0.12);
            color: #e67e22;
          }

          &.medium {
            background: rgba($color-denote-yellow, 0.12);
            color: darken($color-denote-yellow, 10%);
          }

          &.low {
            background: $color-g-95;
            color: $color-g-44;
          }
        }

        .reason-content {
          flex: 1;
          min-width: 0;

          strong {
            display: block;
            font-size: $size-14;
            font-weight: 600;
            color: $color-g-21;
            margin-bottom: $size-4;
          }

          p {
            font-size: $size-13;
            color: $color-g-44;
            margin: 0;
            line-height: 1.4;
          }
        }
      }
    }
  }

  .generic-message {
    font-size: $size-14;
    color: $color-g-44;
    margin-bottom: $size-16;
    line-height: 1.5;
    text-align: center;
  }

  .browse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    width: 100%;
    margin-top: $size-16;
    padding: $size-14;
    background: $color-pri;
    color: white;
    border: none;
    border-radius: $size-12;
    font-size: $size-14;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: darken($color-pri, 8%);
    }

    svg {
      width: $size-18;
      height: $size-18;
    }
  }
}

// Review Reasons Section (for PHARMACIST_REVIEW status)
.review-reasons-section {
  background: rgba(#f59e0b, 0.08);
  border: 1px solid rgba(#f59e0b, 0.25);
  border-radius: $size-12;
  padding: $size-16;
  margin: $size-16 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;

  .review-header {
    display: flex;
    align-items: center;
    gap: $size-10;
    margin-bottom: $size-12;

    .review-icon {
      width: $size-20;
      height: $size-20;
      color: #d97706;
    }

    h4 {
      margin: 0;
      font-size: $size-15;
      font-weight: 600;
      color: #92400e;
    }
  }

  .review-intro {
    font-size: $size-13;
    color: $color-g-44;
    margin-bottom: $size-14;
    line-height: 1.5;
  }

  .review-summary {
    font-size: $size-14;
    color: $color-g-44;
    margin-bottom: $size-14;
    line-height: 1.6;
    padding: $size-12 $size-14;
    background: rgba(#f59e0b, 0.05);
    border-radius: $size-8;
    border-left: 3px solid #f59e0b;
  }

  .fraud-summary {
    display: flex;
    align-items: center;
    gap: $size-12;
    padding: $size-12;
    background: rgba(#ef4444, 0.08);
    border-radius: $size-8;
    margin-bottom: $size-14;

    .fraud-score {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $size-8 $size-12;
      background: white;
      border-radius: $size-6;
      border: 1px solid rgba(#ef4444, 0.2);

      .score-label {
        font-size: $size-10;
        color: $color-g-54;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .score-value {
        font-size: $size-16;
        font-weight: 700;
        color: #ef4444;
      }

      &.critical .score-value { color: #dc2626; }
      &.high .score-value { color: #ea580c; }
      &.medium .score-value { color: #d97706; }
      &.low .score-value { color: #65a30d; }
    }

    .risk-level {
      font-size: $size-12;
      font-weight: 600;
      padding: $size-4 $size-10;
      border-radius: $size-4;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.critical { background: rgba(#dc2626, 0.15); color: #dc2626; }
      &.high { background: rgba(#ea580c, 0.15); color: #ea580c; }
      &.medium { background: rgba(#d97706, 0.15); color: #d97706; }
      &.low { background: rgba(#65a30d, 0.15); color: #65a30d; }
    }
  }

  .review-reasons-list {
    list-style: none;
    padding: 0;
    margin: 0 0 $size-14;
    display: flex;
    flex-direction: column;
    gap: $size-10;

    .review-reason-item {
      display: flex;
      align-items: flex-start;
      gap: $size-10;
      padding: $size-12;
      background: white;
      border-radius: $size-8;
      border-left: 3px solid #d97706;

      &.critical, &.high { border-left-color: #dc2626; }
      &.medium { border-left-color: #d97706; }
      &.low, &.info { border-left-color: #3b82f6; }

      .reason-icon {
        flex-shrink: 0;
        width: $size-18;
        height: $size-18;
        color: #d97706;

        &.critical, &.high { color: #dc2626; }
        &.medium { color: #d97706; }
        &.low, &.info { color: #3b82f6; }

        svg {
          width: 100%;
          height: 100%;
        }
      }

      .reason-text {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        word-break: break-word;

        strong {
          display: block;
          font-size: $size-13;
          font-weight: 600;
          color: $color-g-21;
          margin-bottom: $size-2;
        }

        p {
          font-size: $size-12;
          color: $color-g-44;
          margin: 0;
          line-height: 1.4;
          word-break: break-word;
        }
      }
    }
  }

  .review-note {
    display: flex;
    align-items: center;
    gap: $size-8;
    font-size: $size-12;
    color: #92400e;
    padding: $size-10;
    background: rgba(#f59e0b, 0.12);
    border-radius: $size-6;
    margin: 0;

    svg {
      flex-shrink: 0;
      width: $size-16;
      height: $size-16;
    }
  }
}
</style>
