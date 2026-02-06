<template>
  <div class="upload-prescription-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$router.back()">
        <v-icon name="hi-arrow-left" scale="1.2" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="notification-btn" @click="$router.push('/app/patient/notifications')">
        <v-icon name="hi-bell" scale="1.1" />
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link desktop-only" @click="$router.back()">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <div class="badge-pulse"></div>
            <v-icon name="hi-upload" />
            <span>AI-Powered Verification</span>
          </div>
          <h1 class="hero__title">
            Upload<br/>
            <span class="hero__title-accent">Prescription</span>
          </h1>
          <p class="hero__subtitle">
            Upload your prescription and our AI will verify it instantly. Get medications delivered to your door.
          </p>
          <div class="hero__features" v-if="!uploadedPrescription">
            <div class="feature-tag">
              <v-icon name="hi-lightning-bolt" scale="0.8" />
              <span>2 min verification</span>
            </div>
            <div class="feature-tag">
              <v-icon name="hi-shield-check" scale="0.8" />
              <span>Secure & private</span>
            </div>
            <div class="feature-tag">
              <v-icon name="hi-clock" scale="0.8" />
              <span>24/7 service</span>
            </div>
          </div>
        </div>
        <div class="hero__visual">
          <div class="upload-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-document-text" v-if="!uploading && !uploadedPrescription" />
              <v-icon name="hi-refresh" class="spinning" v-else-if="uploading || (uploadedPrescription && verificationStep < 4)" />
              <v-icon name="hi-check-circle" v-else-if="verificationStatus === 'APPROVED'" />
              <v-icon name="hi-x-circle" v-else-if="verificationStatus === 'REJECTED'" />
              <v-icon name="hi-clock" v-else />
            </div>
          </div>
          <div class="floating-icons">
            <div class="float-icon float-icon--1"><v-icon name="hi-camera" /></div>
            <div class="float-icon float-icon--2"><v-icon name="hi-photograph" /></div>
            <div class="float-icon float-icon--3"><v-icon name="ri-capsule-line" /></div>
          </div>
        </div>
      </section>

      <!-- Bento Grid -->
      <section class="bento-grid">
        <!-- Upload Section Card - shown when no file selected -->
        <div class="bento-card upload-card" v-if="!selectedFile && !uploading && !uploadedPrescription">
          <div class="card-header">
            <v-icon name="hi-cloud-upload" scale="1.1" />
            <h3>Select Your Prescription</h3>
          </div>

          <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
            <div class="upload-icon-wrapper">
              <div class="upload-icon-bg"></div>
              <v-icon name="hi-upload" scale="2" />
            </div>
            <h4>Drag & drop your file here</h4>
            <p class="upload-hint">or use the buttons below</p>

            <div class="upload-actions">
              <button class="upload-btn upload-btn--primary" @click="openFilePicker">
                <v-icon name="hi-photograph" scale="1" />
                <span>Choose File</span>
              </button>
              <button class="upload-btn upload-btn--secondary" @click="openCamera">
                <v-icon name="hi-camera" scale="1" />
                <span>Take Photo</span>
              </button>
            </div>

            <p class="file-types">
              <v-icon name="hi-information-circle" scale="0.8" />
              Supports: JPG, PNG, WebP, PDF (Max 10MB)
            </p>
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

        <!-- Requirements Card -->
        <div class="bento-card requirements-card" v-if="!selectedFile && !uploading && !uploadedPrescription">
          <div class="card-header">
            <v-icon name="hi-clipboard-check" scale="1.1" />
            <h3>Requirements</h3>
          </div>

          <ul class="requirements-list">
            <li>
              <div class="check-circle">
                <v-icon name="hi-check" scale="0.7" />
              </div>
              <div class="requirement-text">
                <strong>Clear & Readable</strong>
                <span>Ensure text is visible and not blurry</span>
              </div>
            </li>
            <li>
              <div class="check-circle">
                <v-icon name="hi-check" scale="0.7" />
              </div>
              <div class="requirement-text">
                <strong>Doctor's Signature</strong>
                <span>Must include prescriber's signature</span>
              </div>
            </li>
            <li>
              <div class="check-circle">
                <v-icon name="hi-check" scale="0.7" />
              </div>
              <div class="requirement-text">
                <strong>Valid Date</strong>
                <span>Prescription date must be visible</span>
              </div>
            </li>
            <li>
              <div class="check-circle">
                <v-icon name="hi-check" scale="0.7" />
              </div>
              <div class="requirement-text">
                <strong>Complete Information</strong>
                <span>Patient name and medications listed</span>
              </div>
            </li>
          </ul>

          <div class="time-notice">
            <div class="time-icon">
              <v-icon name="hi-clock" scale="0.9" />
            </div>
            <div class="time-text">
              <strong>Fast Verification</strong>
              <span>AI verification takes up to 2 minutes</span>
            </div>
          </div>
        </div>

        <!-- File Preview Card -->
        <div class="bento-card preview-card" v-if="selectedFile && !uploading && !uploadedPrescription">
          <div class="card-header">
            <v-icon name="hi-document" scale="1.1" />
            <h3>Selected File</h3>
            <button class="clear-btn" @click="clearSelection">
              <v-icon name="hi-x" scale="0.9" />
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
              <div class="pdf-icon">
                <v-icon name="hi-document-text" scale="2.5" />
              </div>
              <span class="pdf-name">{{ selectedFile.name }}</span>
            </div>
          </div>

          <div class="file-meta">
            <div class="file-info">
              <v-icon name="hi-document" scale="0.9" />
              <span class="file-name">{{ selectedFile.name }}</span>
            </div>
            <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
          </div>

          <button class="submit-btn" @click="uploadPrescription" :disabled="uploading">
            <v-icon name="hi-cloud-upload" scale="1" />
            <span>Upload & Verify</span>
          </button>
        </div>

        <!-- Uploading State Card -->
        <div class="bento-card uploading-card" v-if="uploading">
          <div class="uploading-content">
            <div class="upload-spinner">
              <div class="spinner-ring"></div>
              <v-icon name="hi-cloud-upload" scale="1.5" class="spinner-icon" />
            </div>
            <h3>Uploading Your Prescription</h3>
            <p>Please wait while we securely upload your file...</p>
            <div class="upload-progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>
        </div>

        <!-- Verification Progress Card -->
        <div class="bento-card verification-card" v-if="uploadedPrescription">
          <div class="status-header" :class="getHeaderClass()">
            <div class="status-icon-wrapper">
              <v-icon v-if="verificationStatus === 'APPROVED'" name="hi-check-circle" scale="1.8" />
              <v-icon v-else-if="verificationStatus === 'REJECTED'" name="hi-x-circle" scale="1.8" />
              <v-icon v-else-if="verificationStatus === 'PHARMACIST_REVIEW'" name="hi-clock" scale="1.8" />
              <v-icon v-else name="hi-refresh" scale="1.8" class="spinning" />
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
                <v-icon v-if="verificationStep > 1" name="hi-check" scale="0.8" />
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
                processing: verificationStep === 2,
              }"
            >
              <div class="step-indicator">
                <div class="step-spinner" v-if="verificationStep === 2"></div>
                <v-icon v-else-if="verificationStep > 2" name="hi-check" scale="0.8" />
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
                processing: verificationStep === 3,
              }"
            >
              <div class="step-indicator">
                <div class="step-spinner" v-if="verificationStep === 3"></div>
                <v-icon v-else-if="verificationStep > 3" name="hi-check" scale="0.8" />
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
                <v-icon v-if="verificationStatus === 'APPROVED'" name="hi-check" scale="0.8" />
                <v-icon v-else-if="verificationStatus === 'REJECTED'" name="hi-x" scale="0.8" />
                <v-icon v-else-if="verificationStatus === 'PHARMACIST_REVIEW'" name="hi-user" scale="0.8" />
                <span v-else>4</span>
              </div>
              <div class="step-content">
                <h4>{{ getStatusTitle() }}</h4>
                <p>{{ getStatusDescription() }}</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons" v-if="verificationStatus !== 'REJECTED'">
            <button class="action-btn action-btn--secondary" @click="viewDetails" v-if="verificationStatus === 'APPROVED' || verificationStatus === 'PHARMACIST_REVIEW'">
              <v-icon name="hi-eye" scale="0.9" />
              View Details
            </button>
            <button class="action-btn action-btn--primary" @click="uploadAnother">
              <v-icon name="hi-plus" scale="0.9" />
              Upload Another
            </button>
          </div>
        </div>

        <!-- Review Notice Card -->
        <div class="bento-card review-card" v-if="verificationStatus === 'PHARMACIST_REVIEW'">
          <div class="review-header">
            <div class="review-icon">
              <v-icon name="hi-user-circle" scale="1.3" />
            </div>
            <h4>Prescription Under Review</h4>
          </div>

          <p class="review-summary" v-if="patientSummary">{{ patientSummary }}</p>
          <p class="review-summary" v-else>
            Your prescription requires verification by our pharmacy team before it can be used.
          </p>

          <div class="review-notice">
            <v-icon name="hi-clock" scale="0.9" />
            <span>A pharmacist will review within 24 hours. We'll notify you once it's complete.</span>
          </div>
        </div>

        <!-- Verified Medications Card -->
        <div class="bento-card medications-card" v-if="(verificationStatus === 'APPROVED' || verificationStatus === 'PHARMACIST_REVIEW') && verifiedMedications.length > 0">
          <div class="card-header">
            <v-icon name="ri-capsule-line" scale="1.1" />
            <h3>Verified Medications</h3>
            <span class="count-badge">{{ verifiedMedications.length }}</span>
          </div>

          <div class="med-list">
            <div
              v-for="(med, index) in verifiedMedications"
              :key="index"
              :class="['med-item', { valid: med.is_valid, invalid: !med.is_valid }]"
            >
              <div class="med-status">
                <v-icon v-if="med.is_valid" name="hi-check-circle" scale="1" />
                <v-icon v-else name="hi-x-circle" scale="1" />
              </div>
              <div class="med-details">
                <span class="med-name">{{ med.prescription_medication_name }}</span>
                <span class="med-match" v-if="med.is_valid && med.matched_drug_name">
                  Matched: {{ med.matched_drug_name }}
                </span>
                <span class="med-dosage" v-if="med.dosage">{{ med.dosage }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart Coverage Card -->
        <div class="bento-card coverage-card" v-if="(verificationStatus === 'APPROVED' || verificationStatus === 'PHARMACIST_REVIEW') && rxCartItems.length > 0">
          <div class="card-header">
            <v-icon name="hi-shopping-cart" scale="1.1" />
            <h3>Cart Coverage</h3>
          </div>

          <!-- All Covered -->
          <div v-if="coverageStatus.allCovered" class="coverage-success">
            <div class="coverage-icon">
              <v-icon name="hi-check-circle" scale="1.5" />
            </div>
            <div class="coverage-message">
              <strong>All prescription items covered!</strong>
              <p>Your prescription covers all {{ coverageStatus.covered.length }} RX item(s) in your cart.</p>
            </div>
            <button class="coverage-btn" @click="proceedToCheckout">
              <v-icon name="hi-arrow-right" scale="0.9" />
              Proceed to Checkout
            </button>
          </div>

          <!-- Partial Coverage -->
          <div v-else-if="coverageStatus.covered.length > 0" class="coverage-partial">
            <div class="coverage-icon warning">
              <v-icon name="hi-exclamation" scale="1.5" />
            </div>
            <div class="coverage-message">
              <strong>Partial coverage</strong>
              <p>{{ coverageStatus.covered.length }} of {{ rxCartItems.length }} RX items are covered.</p>
            </div>
            <div class="coverage-actions">
              <button class="coverage-btn secondary" @click="removeUncoveredItems">Remove Uncovered</button>
              <button class="coverage-btn primary" @click="goToCart">Review Cart</button>
            </div>
          </div>

          <!-- No Coverage -->
          <div v-else class="coverage-none">
            <div class="coverage-icon error">
              <v-icon name="hi-x-circle" scale="1.5" />
            </div>
            <div class="coverage-message">
              <strong>No items covered</strong>
              <p>This prescription doesn't cover items in your cart.</p>
            </div>
            <button class="coverage-btn" @click="goToCart">
              <v-icon name="hi-shopping-cart" scale="0.9" />
              Go to Cart
            </button>
          </div>
        </div>

        <!-- Rejection Card -->
        <div class="bento-card rejection-card" v-if="verificationStatus === 'REJECTED'">
          <div class="rejection-header">
            <div class="rejection-icon">
              <v-icon name="hi-x-circle" scale="1.5" />
            </div>
            <h4>Verification Failed</h4>
            <p>We couldn't verify your prescription</p>
          </div>

          <div class="failure-reasons" v-if="dedupedFailureReasons.length > 0">
            <h5>Reasons:</h5>
            <ul>
              <li v-for="(reason, index) in dedupedFailureReasons" :key="index">
                <v-icon name="hi-exclamation-circle" scale="0.8" />
                <span>{{ reason.reason }}</span>
              </li>
            </ul>
          </div>

          <div class="rejection-actions">
            <button class="action-btn action-btn--primary" @click="uploadAnother">
              <v-icon name="hi-refresh" scale="0.9" />
              Try Again
            </button>
          </div>
        </div>

        <!-- Redirect Countdown Card -->
        <div class="bento-card redirect-card" v-if="redirectCountdown !== null && returnTo">
          <div class="redirect-content">
            <v-icon name="hi-arrow-circle-right" scale="1.5" />
            <p>Returning to checkout in <strong>{{ redirectCountdown }}</strong> seconds...</p>
            <div class="redirect-actions">
              <button class="redirect-btn secondary" @click="cancelRedirect">Stay Here</button>
              <button class="redirect-btn primary" @click="redirectNow">Go Now</button>
            </div>
          </div>
        </div>

        <!-- Error State Card -->
        <div class="bento-card error-card" v-if="uploadError">
          <div class="error-content">
            <div class="error-icon">
              <v-icon name="hi-exclamation-circle" scale="2" />
            </div>
            <h3>Upload Failed</h3>
            <p>{{ uploadError }}</p>
            <button class="retry-btn" @click="retryUpload">
              <v-icon name="hi-refresh" scale="0.9" />
              Try Again
            </button>
          </div>
        </div>
      </section>
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
    const returnTo = ref(null);
    const verifiedMedications = ref([]);
    const failureReasons = ref([]);
    const patientSummary = ref(null);
    const processingTimeMs = ref(null);
    const redirectCountdown = ref(null);
    const redirectIntervalId = ref(null);
    const fraudDetection = ref(null);
    const verificationData = ref(null);

    const cart = computed(() => store.getters['pharmacy/getCart'] || []);
    const rxCartItems = computed(() => cart.value.filter(item => item.requiresPrescription));

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

    const handleDrop = (event) => {
      const file = event.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    };

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        processFile(file);
      }
    };

    const processFile = (file) => {
      if (file.size > 10 * 1024 * 1024) {
        uploadError.value = "File size exceeds 10MB limit";
        return;
      }

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        uploadError.value = "Invalid file type. Please upload JPEG, PNG, WebP, or PDF";
        return;
      }

      selectedFile.value = file;
      uploadError.value = null;

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
          cameraInput.value?.files?.[0] ? "MOBILE_CAMERA" : "FILE_UPLOAD"
        );

        const response = await axios.post(
          "/pharmacy/prescriptions/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (response.status === 200 || response.status === 201) {
          const data = response.data.data || response.data.result;
          uploadedPrescription.value = data;
          verificationStep.value = 1;

          if (data.status) {
            verificationStatus.value = data.status;
            if (data.status === "TIER1_PROCESSING") {
              verificationStep.value = 2;
            }
          }

          startPolling(data.uploadId);
        } else {
          uploadError.value = response.data.message || "Upload failed";
        }
      } catch (error) {
        console.error("Upload error:", error);
        uploadError.value =
          error.response?.data?.message ||
          error.message ||
          "Failed to upload prescription";
      } finally {
        uploading.value = false;
      }
    };

    const startPolling = (uploadId) => {
      pollingInterval.value = setInterval(async () => {
        try {
          const response = await axios.get(
            `/pharmacy/prescriptions/${uploadId}/verification`
          );

          if (response.status === 200 || response.data.statusCode === 200) {
            const data = response.data.data || response.data.result;
            verificationStatus.value = data.status;

            if (data.verifiedMedications && data.verifiedMedications.length > 0) {
              verifiedMedications.value = data.verifiedMedications;
            }

            if (data.verification?.totalProcessingTime) {
              processingTimeMs.value = data.verification.totalProcessingTime;
            }

            if (data.verification?.fraudDetection) {
              fraudDetection.value = data.verification.fraudDetection;
            }

            verificationData.value = data.verification;

            if (data.failureReasons && data.failureReasons.length > 0) {
              failureReasons.value = data.failureReasons;
            }

            if (data.patientSummary) {
              patientSummary.value = data.patientSummary;
            }

            if (data.status === "TIER1_PROCESSING") {
              verificationStep.value = 2;
            } else if (data.status === "TIER1_PASSED") {
              verificationStep.value = 2;
            } else if (data.status === "TIER1_FAILED") {
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

    watch(verificationStatus, (newStatus) => {
      if (newStatus === 'APPROVED' && returnTo.value) {
        const prescriptionId = uploadedPrescription.value?.uploadId;
        if (prescriptionId) {
          store.commit('setSelectedPrescription', prescriptionId);
        }

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

    const cancelRedirect = () => {
      if (redirectIntervalId.value) {
        clearInterval(redirectIntervalId.value);
        redirectIntervalId.value = null;
      }
      redirectCountdown.value = null;
    };

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

    const formattedProcessingTime = computed(() => {
      if (!processingTimeMs.value) return null;
      const seconds = (processingTimeMs.value / 1000).toFixed(1);
      return `${seconds}s`;
    });

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

    const dedupedFailureReasons = computed(() => {
      if (!failureReasons.value || failureReasons.value.length === 0) return [];

      const seen = new Set();
      const deduped = [];

      for (const reason of failureReasons.value) {
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
        router.push(`/app/patient/prescriptions/details/${uploadedPrescription.value.uploadId}`);
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
      returnTo.value = route.query.returnTo || null;

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

    const goToCart = () => {
      router.push('/app/patient/pharmacy/cart');
    };

    const removeUncoveredItems = async () => {
      for (const item of coverageStatus.value.uncovered) {
        await store.dispatch('pharmacy/removeFromCart', item.drugId);
      }
      goToCart();
    };

    const proceedToCheckout = () => {
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
      handleDrop,
      handleFileSelect,
      clearSelection,
      formatFileSize,
      uploadPrescription,
      getStatusTitle,
      getStatusDescription,
      getHeaderClass,
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
    };
  },
});
</script>

<style scoped lang="scss">
// Design Tokens (matching prescriptions page)
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.upload-prescription-page {
  width: 100%;
  min-height: 100vh;
  background: $bg;
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 16px;
  background: white;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    display: flex;
  }

  .menu-btn, .notification-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $bg;
    color: $slate;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:active {
      background: #E2E8F0;
    }
  }

  .header-logo {
    img {
      height: 28px;
      width: auto;
    }
  }
}

// Page Content
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 120px;
  }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  position: relative;
  overflow: visible;
  min-height: 400px;
  margin-bottom: 24px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px;
    gap: 0;
    text-align: center;
    min-height: auto;
    border-radius: 20px;
    margin-bottom: 16px;
  }

  .hero__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.1);
    border: none;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    width: fit-content;
    margin-bottom: 16px;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
  }

  .desktop-only {
    @media (max-width: 768px) {
      display: none;
    }
  }

  .hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    width: fit-content;
    margin-bottom: 20px;
    position: relative;

    @media (max-width: 768px) {
      margin: 0 auto 12px;
      padding: 6px 14px;
    }

    .badge-pulse {
      position: absolute;
      left: 12px;
      width: 8px;
      height: 8px;
      background: $emerald;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;

      &::after {
        content: '';
        position: absolute;
        inset: -4px;
        background: rgba($emerald, 0.4);
        border-radius: 50%;
        animation: pulse-ring 2s ease-out infinite;
      }
    }

    svg {
      width: 16px;
      height: 16px;
      color: white;
      margin-left: 12px;
    }

    span {
      font-size: 13px;
      font-weight: 600;
      color: white;
    }
  }

  .hero__title {
    font-size: 48px;
    font-weight: 800;
    color: white;
    line-height: 1.1;
    margin-bottom: 16px;
    letter-spacing: -1px;

    @media (max-width: 768px) {
      font-size: 32px;
      margin-bottom: 12px;
    }

    &-accent {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.7));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .hero__subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.6;
    max-width: 400px;
    margin-bottom: 24px;

    @media (max-width: 768px) {
      font-size: 14px;
      margin: 0 auto 20px;
    }
  }

  .hero__features {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      justify-content: center;
      gap: 8px;
    }

    .feature-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);

      svg {
        width: 14px;
        height: 14px;
      }
    }
  }
}

// Hero Visual
.hero__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    display: none;
  }
}

.upload-orb {
  position: relative;
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;

  .orb-ring {
    position: absolute;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);

    &--1 {
      width: 100%;
      height: 100%;
      animation: orbit 20s linear infinite;
    }

    &--2 {
      width: 80%;
      height: 80%;
      animation: orbit 15s linear infinite reverse;
    }

    &--3 {
      width: 60%;
      height: 60%;
      animation: orbit 10s linear infinite;
    }
  }

  .orb-core {
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    svg {
      width: 40px;
      height: 40px;
      color: white;
    }
  }
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .float-icon {
    position: absolute;
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: float 6s ease-in-out infinite;

    svg {
      width: 20px;
      height: 20px;
      color: white;
    }

    &--1 {
      top: 10%;
      right: 5%;
      animation-delay: 0s;
    }

    &--2 {
      bottom: 20%;
      right: 0;
      animation-delay: 2s;
    }

    &--3 {
      bottom: 10%;
      left: 5%;
      animation-delay: 4s;
    }
  }
}

// ============================================
// BENTO GRID
// ============================================
.bento-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;

    svg {
      color: $sky;
    }

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: $navy;
      flex: 1;
    }

    .count-badge {
      background: $sky-light;
      color: $sky-dark;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .clear-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: $rose-light;
      color: $rose;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: $rose;
        color: white;
      }
    }
  }
}

// Upload Card
.upload-card {
  grid-column: span 2;

  @media (max-width: 768px) {
    grid-column: span 1;
  }
}

.upload-area {
  border: 2px dashed rgba($sky, 0.3);
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  background: rgba($sky-light, 0.3);
  transition: all 0.3s;

  &:hover {
    border-color: $sky;
    background: rgba($sky-light, 0.5);
  }

  .upload-icon-wrapper {
    position: relative;
    display: inline-flex;
    margin-bottom: 16px;

    .upload-icon-bg {
      position: absolute;
      inset: -12px;
      background: rgba($sky, 0.1);
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    svg {
      color: $sky;
      position: relative;
    }
  }

  h4 {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin-bottom: 8px;
  }

  .upload-hint {
    font-size: 14px;
    color: $gray;
    margin-bottom: 24px;
  }

  .upload-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 20px;

    @media (max-width: 480px) {
      flex-direction: column;
    }
  }

  .upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;

    &--primary {
      background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
      color: white;
      box-shadow: 0 4px 14px rgba($sky, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba($sky, 0.4);
      }
    }

    &--secondary {
      background: white;
      color: $slate;
      border: 1px solid #E2E8F0;

      &:hover {
        border-color: $sky;
        color: $sky-dark;
      }
    }
  }

  .file-types {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    color: $gray;

    svg {
      color: $light-gray;
    }
  }
}

// Requirements Card
.requirements-card {
  .requirements-list {
    list-style: none;
    padding: 0;
    margin: 0 0 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .check-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: $emerald-light;
      color: $emerald;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .requirement-text {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        font-size: 14px;
        font-weight: 600;
        color: $navy;
      }

      span {
        font-size: 13px;
        color: $gray;
      }
    }
  }

  .time-notice {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: $sky-light;
    border-radius: 12px;

    .time-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $sky;
    }

    .time-text {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        font-size: 14px;
        font-weight: 600;
        color: $navy;
      }

      span {
        font-size: 12px;
        color: $gray;
      }
    }
  }
}

// Preview Card
.preview-card {
  grid-column: span 2;

  @media (max-width: 768px) {
    grid-column: span 1;
  }

  .preview-content {
    margin-bottom: 16px;
    border-radius: 12px;
    overflow: hidden;
    background: #F1F5F9;

    .preview-image {
      width: 100%;
      max-height: 300px;
      object-fit: contain;
    }

    .pdf-preview {
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      .pdf-icon {
        color: $rose;
      }

      .pdf-name {
        font-size: 14px;
        color: $slate;
        font-weight: 500;
      }
    }
  }

  .file-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: $bg;
    border-radius: 10px;
    margin-bottom: 20px;

    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: $gray;

      .file-name {
        font-size: 14px;
        font-weight: 500;
        color: $slate;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .file-size {
      font-size: 13px;
      color: $gray;
      font-weight: 500;
    }
  }

  .submit-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba($sky, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($sky, 0.4);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}

// Uploading Card
.uploading-card {
  grid-column: span 2;

  @media (max-width: 768px) {
    grid-column: span 1;
  }

  .uploading-content {
    text-align: center;
    padding: 40px 20px;

    .upload-spinner {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;

      .spinner-ring {
        position: absolute;
        inset: 0;
        border: 4px solid $sky-light;
        border-top-color: $sky;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .spinner-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: $sky;
      }
    }

    h3 {
      font-size: 20px;
      font-weight: 600;
      color: $navy;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      color: $gray;
      margin-bottom: 24px;
    }

    .upload-progress-bar {
      height: 6px;
      background: $sky-light;
      border-radius: 3px;
      overflow: hidden;
      max-width: 300px;
      margin: 0 auto;

      .progress-fill {
        height: 100%;
        width: 60%;
        background: linear-gradient(90deg, $sky, $sky-dark);
        border-radius: 3px;
        animation: progress-indeterminate 1.5s ease-in-out infinite;
      }
    }
  }
}

// Verification Card
.verification-card {
  grid-column: span 2;

  @media (max-width: 768px) {
    grid-column: span 1;
  }

  .status-header {
    text-align: center;
    padding: 24px;
    border-radius: 16px;
    margin-bottom: 24px;

    &.processing {
      background: linear-gradient(135deg, $sky-light, rgba($sky, 0.2));
    }

    &.success {
      background: linear-gradient(135deg, $emerald-light, rgba($emerald, 0.2));
    }

    &.failed {
      background: linear-gradient(135deg, $rose-light, rgba($rose, 0.2));
    }

    &.review {
      background: linear-gradient(135deg, $amber-light, rgba($amber, 0.2));
    }

    .status-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      svg {
        color: $sky;
      }
    }

    &.success .status-icon-wrapper svg {
      color: $emerald;
    }

    &.failed .status-icon-wrapper svg {
      color: $rose;
    }

    &.review .status-icon-wrapper svg {
      color: $amber;
    }

    h3 {
      font-size: 20px;
      font-weight: 700;
      color: $navy;
      margin-bottom: 6px;
    }

    p {
      font-size: 14px;
      color: $gray;
    }
  }
}

// Verification Timeline
.verification-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 24px;

  .timeline-step {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 0;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 15px;
      top: 48px;
      bottom: 0;
      width: 2px;
      background: #E2E8F0;
    }

    &:last-child::before {
      display: none;
    }

    &.active::before {
      background: $sky;
    }

    &.completed::before {
      background: $emerald;
    }

    .step-indicator {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: $gray;
      flex-shrink: 0;
      position: relative;
      z-index: 1;

      .step-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba($sky, 0.3);
        border-top-color: $sky;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }

    &.active .step-indicator {
      background: $sky-light;
      color: $sky-dark;
    }

    &.completed .step-indicator {
      background: $emerald;
      color: white;
    }

    &.failed .step-indicator {
      background: $rose;
      color: white;
    }

    &.review .step-indicator {
      background: $amber;
      color: white;
    }

    &.processing .step-indicator {
      background: $sky;
    }

    .step-content {
      flex: 1;
      padding-top: 4px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: $navy;
        margin-bottom: 4px;
      }

      p {
        font-size: 13px;
        color: $gray;
      }
    }
  }
}

// Action Buttons
.action-buttons {
  display: flex;
  gap: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
  }

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;

    &--primary {
      background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
      color: white;
      box-shadow: 0 4px 14px rgba($sky, 0.3);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba($sky, 0.4);
      }
    }

    &--secondary {
      background: white;
      color: $slate;
      border: 1px solid #E2E8F0;

      &:hover {
        border-color: $sky;
        color: $sky-dark;
      }
    }
  }
}

// Review Card
.review-card {
  .review-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .review-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: $amber-light;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $amber;
    }

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: $navy;
    }
  }

  .review-summary {
    font-size: 14px;
    color: $slate;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .review-notice {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
    background: $amber-light;
    border-radius: 10px;
    font-size: 13px;
    color: darken($amber, 15%);

    svg {
      flex-shrink: 0;
    }
  }
}

// Medications Card
.medications-card {
  .med-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .med-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    border-radius: 12px;
    background: $bg;

    &.valid {
      border-left: 3px solid $emerald;

      .med-status svg {
        color: $emerald;
      }
    }

    &.invalid {
      border-left: 3px solid $rose;

      .med-status svg {
        color: $rose;
      }
    }

    .med-status {
      flex-shrink: 0;
    }

    .med-details {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .med-name {
        font-size: 14px;
        font-weight: 600;
        color: $navy;
      }

      .med-match {
        font-size: 12px;
        color: $emerald;
      }

      .med-dosage {
        font-size: 12px;
        color: $gray;
      }
    }
  }
}

// Coverage Card
.coverage-card {
  .coverage-success,
  .coverage-partial,
  .coverage-none {
    padding: 20px;
    border-radius: 14px;
    text-align: center;
  }

  .coverage-success {
    background: linear-gradient(135deg, $emerald-light, rgba($emerald, 0.15));

    .coverage-icon svg {
      color: $emerald;
    }
  }

  .coverage-partial {
    background: linear-gradient(135deg, $amber-light, rgba($amber, 0.15));

    .coverage-icon svg {
      color: $amber;
    }
  }

  .coverage-none {
    background: linear-gradient(135deg, $rose-light, rgba($rose, 0.15));

    .coverage-icon svg {
      color: $rose;
    }
  }

  .coverage-icon {
    margin-bottom: 12px;
  }

  .coverage-message {
    margin-bottom: 16px;

    strong {
      display: block;
      font-size: 16px;
      color: $navy;
      margin-bottom: 4px;
    }

    p {
      font-size: 13px;
      color: $gray;
    }
  }

  .coverage-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;

    &.secondary {
      background: white;
      color: $slate;
      border: 1px solid #E2E8F0;
    }

    &.primary {
      background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
      color: white;
    }
  }

  .coverage-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}

// Rejection Card
.rejection-card {
  grid-column: span 2;

  @media (max-width: 768px) {
    grid-column: span 1;
  }

  .rejection-header {
    text-align: center;
    padding: 24px;
    background: linear-gradient(135deg, $rose-light, rgba($rose, 0.15));
    border-radius: 14px;
    margin-bottom: 20px;

    .rejection-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      svg {
        color: $rose;
      }
    }

    h4 {
      font-size: 18px;
      font-weight: 700;
      color: $navy;
      margin-bottom: 6px;
    }

    p {
      font-size: 14px;
      color: $gray;
    }
  }

  .failure-reasons {
    margin-bottom: 20px;

    h5 {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
      margin-bottom: 12px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;

      li {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        background: $rose-light;
        border-radius: 10px;
        font-size: 13px;
        color: darken($rose, 15%);

        svg {
          flex-shrink: 0;
          color: $rose;
        }
      }
    }
  }

  .rejection-actions {
    display: flex;
    justify-content: center;
  }
}

// Redirect Card
.redirect-card {
  grid-column: span 2;

  @media (max-width: 768px) {
    grid-column: span 1;
  }

  .redirect-content {
    text-align: center;
    padding: 20px;
    background: $sky-light;
    border-radius: 14px;

    svg {
      color: $sky;
      margin-bottom: 12px;
    }

    p {
      font-size: 14px;
      color: $slate;
      margin-bottom: 16px;

      strong {
        color: $sky-dark;
        font-size: 18px;
      }
    }

    .redirect-actions {
      display: flex;
      gap: 12px;
      justify-content: center;

      .redirect-btn {
        padding: 10px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;

        &.secondary {
          background: white;
          color: $slate;
        }

        &.primary {
          background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
          color: white;
        }
      }
    }
  }
}

// Error Card
.error-card {
  grid-column: span 2;

  @media (max-width: 768px) {
    grid-column: span 1;
  }

  .error-content {
    text-align: center;
    padding: 40px 20px;

    .error-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: $rose-light;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;

      svg {
        color: $rose;
      }
    }

    h3 {
      font-size: 20px;
      font-weight: 600;
      color: $navy;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      color: $gray;
      margin-bottom: 24px;
    }

    .retry-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

// Animations
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.spinning {
  animation: spin 1s linear infinite;
}
</style>
