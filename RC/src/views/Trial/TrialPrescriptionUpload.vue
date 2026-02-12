<template>
  <div class="trial-prescription">
    <!-- Nav -->
    <div class="trial-nav">
      <router-link to="/" class="trial-nav__logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </router-link>
      <router-link to="/trial/landing" class="trial-nav__back" v-if="sessionStorage.getItem('trial_token')">
        <v-icon name="hi-arrow-left" scale="0.85" />
        Back to Trial
      </router-link>
    </div>

    <!-- Hero -->
    <div class="trial-hero">
      <div class="trial-hero__content">
        <span class="trial-hero__badge">
          <span class="badge-pulse"></span>
          <v-icon name="hi-shield-check" />
          <span>AI Prescription Verifier</span>
        </span>
        <h1 class="trial-hero__title">
          Verify Your <span class="trial-hero__title-accent">Prescription</span>
        </h1>
        <p class="trial-hero__subtitle">
          Upload a prescription image and our AI will analyze its authenticity, verify medications, and detect potential fraud — all in under 2 minutes.
        </p>
        <div class="trial-hero__features">
          <span class="feature-tag"><v-icon name="hi-eye" scale="0.8" /> OCR Text Extraction</span>
          <span class="feature-tag"><v-icon name="hi-shield-check" scale="0.8" /> Fraud Detection</span>
          <span class="feature-tag"><v-icon name="ri-capsule-line" scale="0.8" /> Drug Matching</span>
        </div>
      </div>
      <div class="trial-hero__visual desktop-only">
        <div class="upload-orb">
          <div class="orb-ring orb-ring--1"></div>
          <div class="orb-ring orb-ring--2"></div>
          <div class="orb-ring orb-ring--3"></div>
          <div class="orb-core">
            <v-icon name="hi-document-search" scale="2" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="trial-content">
      <!-- Upload Section -->
      <div v-if="!uploadedId && !uploading" class="upload-section">
        <div class="upload-card">
          <div class="upload-area"
            @dragover.prevent
            @dragenter.prevent
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              style="display: none"
              @change="handleFileSelect"
            />
            <div class="upload-icon-wrapper">
              <div class="upload-icon-bg"></div>
              <v-icon name="hi-cloud-upload" scale="2.5" />
            </div>
            <h4>Upload Prescription</h4>
            <p class="upload-hint">Drag & drop your prescription image or click to browse</p>
            <div class="upload-actions">
              <button class="upload-btn upload-btn--primary" @click="openFilePicker">
                <v-icon name="hi-document" scale="1" />
                Choose File
              </button>
            </div>
            <span class="file-types">
              <v-icon name="hi-information-circle" scale="0.8" />
              JPEG, PNG, WebP, PDF — Max 10MB
            </span>
          </div>
        </div>

        <!-- File Preview -->
        <div v-if="selectedFile" class="preview-card">
          <div class="preview-header">
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
              <v-icon name="hi-document-text" scale="2.5" />
              <span>{{ selectedFile.name }}</span>
            </div>
          </div>
          <div class="file-meta">
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
          <button class="submit-btn" @click="uploadPrescription">
            <v-icon name="hi-cloud-upload" scale="1" />
            Upload & Verify
          </button>
        </div>

        <!-- Requirements -->
        <div class="requirements-card">
          <div class="card-header">
            <v-icon name="hi-information-circle" scale="1.1" />
            <h3>For Best Results</h3>
          </div>
          <ul class="requirements-list">
            <li>
              <div class="check-circle"><v-icon name="hi-check" scale="0.7" /></div>
              <div><strong>Clear Image</strong><span>Good lighting, no blur</span></div>
            </li>
            <li>
              <div class="check-circle"><v-icon name="hi-check" scale="0.7" /></div>
              <div><strong>Doctor's Name</strong><span>Prescriber must be visible</span></div>
            </li>
            <li>
              <div class="check-circle"><v-icon name="hi-check" scale="0.7" /></div>
              <div><strong>Valid Date</strong><span>Prescription date must be visible</span></div>
            </li>
            <li>
              <div class="check-circle"><v-icon name="hi-check" scale="0.7" /></div>
              <div><strong>Medications</strong><span>Drug names and dosages listed</span></div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Uploading State -->
      <div v-if="uploading" class="uploading-section">
        <div class="uploading-card">
          <div class="upload-spinner">
            <div class="spinner-ring"></div>
            <v-icon name="hi-cloud-upload" scale="1.5" class="spinner-icon" />
          </div>
          <h3>Uploading Your Prescription</h3>
          <p>Please wait while we securely upload your file...</p>
          <div class="upload-progress-bar"><div class="progress-fill"></div></div>
        </div>
      </div>

      <!-- Verification Progress + Results -->
      <div v-if="uploadedId" class="results-section">
        <!-- Verification Timeline -->
        <div class="verification-card">
          <div class="status-header" :class="headerClass">
            <div class="status-icon-wrapper">
              <v-icon v-if="finalStatus === 'APPROVED'" name="hi-check-circle" scale="1.8" />
              <v-icon v-else-if="finalStatus === 'REJECTED'" name="hi-x-circle" scale="1.8" />
              <v-icon v-else-if="finalStatus === 'PHARMACIST_REVIEW'" name="hi-clock" scale="1.8" />
              <v-icon v-else name="hi-refresh" scale="1.8" class="spinning" />
            </div>
            <h3>{{ headerTitle }}</h3>
            <p>{{ headerSubtitle }}</p>
          </div>

          <div class="verification-timeline">
            <div class="timeline-step" :class="{ active: step >= 1, completed: step > 1 }">
              <div class="step-indicator">
                <v-icon v-if="step > 1" name="hi-check" scale="0.8" />
                <span v-else>1</span>
              </div>
              <div class="step-content"><h4>Upload Complete</h4><p>File received successfully</p></div>
            </div>
            <div class="timeline-step" :class="{ active: step >= 2, completed: step > 2, processing: step === 2 }">
              <div class="step-indicator">
                <div class="step-spinner" v-if="step === 2"></div>
                <v-icon v-else-if="step > 2" name="hi-check" scale="0.8" />
                <span v-else>2</span>
              </div>
              <div class="step-content"><h4>Initial Checks (Tier 1)</h4><p>OCR, image quality, format validation</p></div>
            </div>
            <div class="timeline-step" :class="{ active: step >= 3, completed: step > 3, processing: step === 3 }">
              <div class="step-indicator">
                <div class="step-spinner" v-if="step === 3"></div>
                <v-icon v-else-if="step > 3" name="hi-check" scale="0.8" />
                <span v-else>3</span>
              </div>
              <div class="step-content"><h4>AI Analysis (Tier 2)</h4><p>Medication validation, doctor verification</p></div>
            </div>
            <div class="timeline-step" :class="{
              active: step >= 4,
              completed: finalStatus === 'APPROVED',
              failed: finalStatus === 'REJECTED',
              review: finalStatus === 'PHARMACIST_REVIEW',
            }">
              <div class="step-indicator">
                <v-icon v-if="finalStatus === 'APPROVED'" name="hi-check" scale="0.8" />
                <v-icon v-else-if="finalStatus === 'REJECTED'" name="hi-x" scale="0.8" />
                <v-icon v-else-if="finalStatus === 'PHARMACIST_REVIEW'" name="hi-user" scale="0.8" />
                <span v-else>4</span>
              </div>
              <div class="step-content">
                <h4>{{ step >= 4 ? (finalStatus === 'APPROVED' ? 'Verified' : finalStatus === 'REJECTED' ? 'Failed' : 'Under Review') : 'Final Result' }}</h4>
                <p>{{ step >= 4 ? (finalStatus === 'APPROVED' ? 'Prescription verified' : finalStatus === 'REJECTED' ? 'Could not verify' : 'Pending pharmacist review') : 'Awaiting result' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Processing Overlay -->
        <div v-if="uploadedId && !isComplete" class="processing-overlay">
          <div class="processing-spinner"></div>
          <h3>AI Verification in Progress</h3>
          <p>Our system is analyzing your prescription across multiple checks...</p>
          <div class="processing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>

        <!-- Transparent Score Breakdown (Trial Exclusive) -->
        <div v-if="verificationData && isComplete" class="score-section">
          <!-- Overall Authenticity Score -->
          <div class="score-card score-card--main">
            <div class="score-card__header">
              <v-icon name="hi-shield-check" scale="1.2" />
              <h3>Authenticity Score</h3>
            </div>
            <div class="score-gauge">
              <div class="score-gauge__circle" :class="scoreClass">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#E2E8F0" stroke-width="8" />
                  <circle cx="60" cy="60" r="52" fill="none" :stroke="scoreColor" stroke-width="8"
                    stroke-linecap="round"
                    :stroke-dasharray="circumference"
                    :stroke-dashoffset="scoreOffset"
                    transform="rotate(-90 60 60)"
                    style="transition: stroke-dashoffset 1s ease"
                  />
                </svg>
                <div class="score-gauge__value">
                  <span class="score-number">{{ effectiveScore }}</span>
                  <span class="score-label">/ 100</span>
                </div>
              </div>
              <div class="score-gauge__info">
                <div class="score-item">
                  <span class="score-item__label">Tier 1 (Quick Checks)</span>
                  <div class="score-bar">
                    <div class="score-bar__fill" :style="{ width: (verificationData.tier1?.score || 0) + '%' }"></div>
                  </div>
                  <span class="score-item__value">{{ verificationData.tier1?.score || 0 }}%</span>
                </div>
                <div class="score-item">
                  <span class="score-item__label">Tier 2 (AI Analysis)</span>
                  <div class="score-bar">
                    <div class="score-bar__fill score-bar__fill--tier2" :style="{ width: (verificationData.tier2?.score || 0) + '%' }"></div>
                  </div>
                  <span class="score-item__value">{{ verificationData.tier2?.score || 0 }}%</span>
                </div>
                <div class="score-item">
                  <span class="score-item__label">OCR Confidence</span>
                  <div class="score-bar">
                    <div class="score-bar__fill score-bar__fill--confidence" :style="{ width: (verificationData.confidenceScore || 0) + '%' }"></div>
                  </div>
                  <span class="score-item__value">{{ verificationData.confidenceScore || 0 }}%</span>
                </div>
                <div v-if="verificationData.totalProcessingTime" class="processing-time">
                  <v-icon name="hi-clock" scale="0.8" />
                  Processed in {{ (verificationData.totalProcessingTime / 1000).toFixed(1) }}s
                </div>
              </div>
            </div>
          </div>

          <!-- Fraud Detection -->
          <div class="score-card score-card--fraud">
            <div class="score-card__header">
              <v-icon name="hi-shield-exclamation" scale="1.2" />
              <h3>Fraud Detection</h3>
              <span class="risk-badge" :class="'risk-badge--' + (verificationData.fraudDetection?.riskLevel || 'LOW').toLowerCase()">
                {{ verificationData.fraudDetection?.riskLevel || 'LOW' }} Risk
              </span>
            </div>
            <div class="fraud-checks">
              <div class="fraud-check" :class="{ flagged: verificationData.fraudDetection?.duplicatePrescription }">
                <v-icon :name="verificationData.fraudDetection?.duplicatePrescription ? 'hi-exclamation-circle' : 'hi-check-circle'" scale="0.9" />
                <span>Duplicate Detection</span>
              </div>
              <div class="fraud-check" :class="{ flagged: verificationData.fraudDetection?.editedDocument }">
                <v-icon :name="verificationData.fraudDetection?.editedDocument ? 'hi-exclamation-circle' : 'hi-check-circle'" scale="0.9" />
                <span>Edit Detection</span>
              </div>
              <div class="fraud-check" :class="{ flagged: verificationData.fraudDetection?.invalidDoctor }">
                <v-icon :name="verificationData.fraudDetection?.invalidDoctor ? 'hi-exclamation-circle' : 'hi-check-circle'" scale="0.9" />
                <span>Doctor Verification</span>
              </div>
              <div class="fraud-check" :class="{ flagged: verificationData.fraudDetection?.suspiciousPattern }">
                <v-icon :name="verificationData.fraudDetection?.suspiciousPattern ? 'hi-exclamation-circle' : 'hi-check-circle'" scale="0.9" />
                <span>Pattern Analysis</span>
              </div>
            </div>
            <div v-if="verificationData.fraudDetection?.flags?.length" class="fraud-flags">
              <div v-for="(flag, i) in verificationData.fraudDetection.flags" :key="i" class="fraud-flag">
                <v-icon name="hi-exclamation" scale="0.8" />
                <span>{{ flag.description }}</span>
              </div>
            </div>
          </div>

          <!-- Tier 1 Checks Breakdown -->
          <div v-if="verificationData.tier1?.checks?.length" class="score-card score-card--checks">
            <div class="score-card__header">
              <v-icon name="hi-clipboard-check" scale="1.2" />
              <h3>Tier 1: Quick Checks</h3>
              <span class="tier-badge" :class="verificationData.tier1.result === 'PASSED' ? 'tier-badge--pass' : 'tier-badge--fail'">
                {{ verificationData.tier1.result }}
              </span>
            </div>
            <div class="checks-grid">
              <div v-for="(check, i) in verificationData.tier1.checks" :key="'t1-' + i"
                class="check-item" :class="{ passed: check.passed, failed: !check.passed }">
                <div class="check-icon">
                  <v-icon :name="check.passed ? 'hi-check-circle' : 'hi-x-circle'" scale="0.9" />
                </div>
                <div class="check-info">
                  <span class="check-name">{{ check.check_name }}</span>
                  <span class="check-details">{{ check.details }}</span>
                </div>
                <span class="check-score">{{ Math.round(check.score) }}%</span>
              </div>
            </div>
          </div>

          <!-- Tier 2 Checks Breakdown -->
          <div v-if="verificationData.tier2?.checks?.length" class="score-card score-card--checks">
            <div class="score-card__header">
              <v-icon name="hi-beaker" scale="1.2" />
              <h3>Tier 2: AI Analysis</h3>
              <span class="tier-badge" :class="verificationData.tier2.result === 'PASSED' ? 'tier-badge--pass' : verificationData.tier2.result === 'NEEDS_REVIEW' ? 'tier-badge--review' : 'tier-badge--fail'">
                {{ verificationData.tier2.result }}
              </span>
            </div>
            <div class="checks-grid">
              <div v-for="(check, i) in verificationData.tier2.checks" :key="'t2-' + i"
                class="check-item" :class="{ passed: check.passed, failed: !check.passed }">
                <div class="check-icon">
                  <v-icon :name="check.passed ? 'hi-check-circle' : 'hi-x-circle'" scale="0.9" />
                </div>
                <div class="check-info">
                  <span class="check-name">{{ check.check_name }}</span>
                  <span class="check-details">{{ check.details }}</span>
                </div>
                <span class="check-score">{{ Math.round(check.score) }}%</span>
              </div>
            </div>
          </div>

          <!-- AI Assessment -->
          <div v-if="verificationData.tier2?.aiAnalysis" class="score-card score-card--ai">
            <div class="score-card__header">
              <v-icon name="hi-sparkles" scale="1.2" />
              <h3>AI Document Analysis</h3>
            </div>
            <p class="ai-summary" v-if="friendlyPatientSummary">{{ friendlyPatientSummary }}</p>
            <p class="ai-assessment" v-if="verificationData.tier2.aiAnalysis.overall_assessment">
              {{ verificationData.tier2.aiAnalysis.overall_assessment }}
            </p>
            <div v-if="verificationData.tier2.aiAnalysis.recommendations?.length" class="ai-recommendations">
              <h4>Recommendations</h4>
              <ul>
                <li v-for="(rec, i) in verificationData.tier2.aiAnalysis.recommendations" :key="i">{{ rec }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Verified Medications -->
        <div v-if="verifiedMedications.length > 0" class="medications-card">
          <div class="card-header">
            <v-icon name="ri-capsule-line" scale="1.1" />
            <h3>Verified Medications</h3>
            <span class="count-badge">{{ verifiedMedications.length }}</span>
          </div>
          <div class="med-list">
            <div v-for="(med, i) in verifiedMedications" :key="i"
              class="med-item" :class="{ valid: med.is_valid, invalid: !med.is_valid }">
              <div class="med-status">
                <v-icon :name="med.is_valid ? 'hi-check-circle' : 'hi-x-circle'" scale="1" />
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

        <!-- Failure Reasons -->
        <div v-if="humanizedFailureReasons?.length" class="failure-card">
          <div class="card-header">
            <v-icon name="hi-exclamation-circle" scale="1.1" />
            <h3>Issues Found</h3>
          </div>
          <div class="failure-list">
            <div v-for="(reason, i) in humanizedFailureReasons" :key="i" class="failure-item"
              :class="'failure-item--' + reason.severity.toLowerCase()">
              <v-icon name="hi-exclamation" scale="0.8" />
              <div>
                <strong>{{ reason.reason }}</strong>
                <span>{{ reason.details }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sign Up CTA -->
        <div v-if="isComplete" class="cta-card">
          <v-icon name="hi-sparkles" scale="1.5" />
          <h3>Impressed by our AI verification?</h3>
          <p>Sign up to verify unlimited prescriptions and access our full pharmacy platform.</p>
          <div class="cta-buttons">
            <router-link to="/signup/patient" class="cta-btn cta-btn--primary">
              Sign Up as Patient
            </router-link>
            <router-link to="/trial/landing" class="cta-btn cta-btn--secondary">
              Try Other Features
            </router-link>
          </div>
        </div>
      </div>

      <!-- Upload Error -->
      <div v-if="uploadError" class="error-card">
        <v-icon name="hi-exclamation-circle" scale="2" />
        <h3>Upload Failed</h3>
        <p>{{ uploadError }}</p>
        <button class="retry-btn" @click="uploadError = null">
          <v-icon name="hi-refresh" scale="0.9" /> Try Again
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import apiFactory from "@/services/apiFactory";

export default defineComponent({
  name: "TrialPrescriptionUpload",
  setup() {
    const router = useRouter();
    const fileInput = ref(null);
    const selectedFile = ref(null);
    const filePreviewUrl = ref(null);
    const uploading = ref(false);
    const uploadError = ref(null);
    const uploadedId = ref(null);
    const step = ref(1);
    const finalStatus = ref(null);
    const verificationData = ref(null);
    const verifiedMedications = ref([]);
    const failureReasons = ref(null);
    const patientSummary = ref(null);
    const pollingInterval = ref(null);

    const circumference = 2 * Math.PI * 52;

    const isPdf = computed(() => selectedFile.value?.type === "application/pdf");

    const isComplete = computed(() =>
      ['APPROVED', 'REJECTED', 'PHARMACIST_REVIEW'].includes(finalStatus.value)
    );

    // Compute effective score — backend only sets overall_score when the full
    // pipeline completes. When Tier 1 fails early, we derive from tier scores.
    const effectiveScore = computed(() => {
      const v = verificationData.value;
      if (!v) return 0;
      if (v.overallScore) return v.overallScore;
      const t1 = v.tier1?.score || 0;
      const t2 = v.tier2?.score || 0;
      // Same weights as backend: 30% tier1, 70% tier2
      return Math.round(t1 * 0.3 + t2 * 0.7);
    });

    const scoreColor = computed(() => {
      const score = effectiveScore.value;
      if (score >= 90) return '#10B981';
      if (score >= 75) return '#F59E0B';
      return '#F43F5E';
    });

    const scoreClass = computed(() => {
      const score = effectiveScore.value;
      if (score >= 90) return 'score-high';
      if (score >= 75) return 'score-medium';
      return 'score-low';
    });

    const scoreOffset = computed(() => {
      const score = effectiveScore.value;
      return circumference - (score / 100) * circumference;
    });

    const headerClass = computed(() => {
      if (finalStatus.value === 'APPROVED') return 'success';
      if (finalStatus.value === 'REJECTED') return 'failed';
      if (finalStatus.value === 'PHARMACIST_REVIEW') return 'review';
      return 'processing';
    });

    const headerTitle = computed(() => {
      if (finalStatus.value === 'APPROVED') return 'Prescription Verified!';
      if (finalStatus.value === 'REJECTED') return 'Verification Failed';
      if (finalStatus.value === 'PHARMACIST_REVIEW') return 'Under Review';
      return 'Verifying Prescription...';
    });

    const headerSubtitle = computed(() => {
      const time = verificationData.value?.totalProcessingTime;
      const timeStr = time ? ` in ${(time / 1000).toFixed(1)}s` : '';
      if (finalStatus.value === 'APPROVED') return `Your prescription has been verified${timeStr}`;
      if (finalStatus.value === 'REJECTED') return `Verification completed${timeStr}`;
      if (finalStatus.value === 'PHARMACIST_REVIEW') return 'Requires pharmacist review — in a real scenario a pharmacist reviews within 24h';
      return 'AI verification is in progress';
    });

    const openFilePicker = () => fileInput.value?.click();

    const handleDrop = (e) => {
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    };

    const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) processFile(file);
    };

    const processFile = (file) => {
      if (file.size > 10 * 1024 * 1024) {
        uploadError.value = "File size exceeds 10MB limit";
        return;
      }
      const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
      if (!allowed.includes(file.type)) {
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
        formData.append("uploadSource", "FILE_UPLOAD");

        const response = await apiFactory.$_trialPrescriptionUpload(formData);
        const data = response.data?.data || response.data?.result;

        if (data?.uploadId) {
          uploadedId.value = data.uploadId;
          step.value = 1;
          startPolling(data.uploadId);
        } else {
          uploadError.value = "Upload failed — no upload ID returned";
        }
      } catch (error) {
        uploadError.value =
          error.response?.data?.message || error.message || "Failed to upload prescription";
      } finally {
        uploading.value = false;
      }
    };

    const startPolling = (id) => {
      pollingInterval.value = setInterval(async () => {
        try {
          const response = await apiFactory.$_trialPrescriptionStatus(id);
          const data = response.data?.data || response.data?.result;

          if (!data) return;

          // Update verification data
          if (data.verification) verificationData.value = data.verification;
          if (data.verifiedMedications?.length) verifiedMedications.value = data.verifiedMedications;
          if (data.failureReasons) failureReasons.value = data.failureReasons;
          if (data.patientSummary) patientSummary.value = data.patientSummary;

          // Update step based on status
          const status = data.status;
          if (status === 'TIER1_PROCESSING') {
            step.value = 2;
          } else if (status === 'TIER1_PASSED') {
            step.value = 2;
          } else if (status === 'TIER1_FAILED') {
            step.value = 4;
            finalStatus.value = 'REJECTED';
            stopPolling();
          } else if (status === 'TIER2_PROCESSING' || status === 'TIER2_PASSED') {
            step.value = 3;
          } else if (status === 'TIER2_FAILED') {
            step.value = 4;
            finalStatus.value = 'REJECTED';
            stopPolling();
          } else if (['APPROVED', 'REJECTED', 'PHARMACIST_REVIEW'].includes(status)) {
            step.value = 4;
            finalStatus.value = status;
            stopPolling();
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 3000);
    };

    const stopPolling = () => {
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
      }
    };

    // Friendly labels for technical check names
    const friendlyCheckNames = {
      'OCR Processing': 'Text Extraction',
      'File Validation': 'File Format Check',
      'Image Quality': 'Image Clarity',
      'Duplicate Detection': 'Duplicate Check',
      'Doctor Verification': 'Prescriber Verification',
      'Medication Validation': 'Medication Database Check',
      'AI Document Analysis': 'AI Vision Analysis',
      'Fraud Pattern Detection': 'Fraud Pattern Analysis',
    };

    // Friendly details for common technical error messages
    const friendlyDetails = (details) => {
      if (!details) return details;
      if (details.includes('unsupported document format'))
        return 'This PDF could not be processed — it may be corrupted or not a true PDF file. Try uploading a photo (JPEG/PNG) of the prescription instead.';
      if (details.includes('Invalid PDF structure'))
        return 'The PDF file has an invalid internal structure. Please try exporting it again or upload a photo of the prescription instead.';
      if (details.includes('OCR failed'))
        return 'Our system was unable to extract text from this image. Please ensure the prescription is clearly visible, well-lit, and not blurry.';
      if (details.includes('No text extracted') || details.includes('no text'))
        return 'No readable text was found in the image. Make sure the entire prescription is visible and the text is legible.';
      if (details.includes('too low') || details.includes('resolution'))
        return 'The image resolution is too low for accurate analysis. Try uploading a higher quality image.';
      if (details.includes('corrupted') || details.includes('invalid file'))
        return 'The file appears to be damaged or invalid. Please try uploading the original file again.';
      return details;
    };

    const humanizedFailureReasons = computed(() => {
      if (!failureReasons.value?.length) return null;
      return failureReasons.value.map((r) => ({
        ...r,
        reason: friendlyCheckNames[r.reason] || r.reason,
        details: friendlyDetails(r.details),
      }));
    });

    const friendlyPatientSummary = computed(() => {
      const raw = patientSummary.value;
      if (!raw) return null;
      if (raw.includes('could not read the text') || raw.includes('unable to read'))
        return 'Our AI could not extract text from this prescription. This usually means the image is too dark, blurry, or in an unsupported format. For best results, upload a clear photo taken in good lighting.';
      return raw;
    });

    onMounted(() => {
      if (!sessionStorage.getItem('trial_token')) {
        router.push('/');
      }
    });

    onUnmounted(() => {
      stopPolling();
      if (filePreviewUrl.value) URL.revokeObjectURL(filePreviewUrl.value);
    });

    return {
      fileInput, selectedFile, filePreviewUrl, uploading, uploadError,
      uploadedId, step, finalStatus, verificationData, verifiedMedications,
      failureReasons, patientSummary, humanizedFailureReasons, friendlyPatientSummary,
      isPdf, isComplete, effectiveScore, scoreColor, scoreClass,
      scoreOffset, circumference, headerClass, headerTitle, headerSubtitle,
      openFilePicker, handleDrop, handleFileSelect, clearSelection,
      formatFileSize, uploadPrescription, sessionStorage,
    };
  },
});
</script>

<style scoped lang="scss">
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
$orange: #FF5C00;

@mixin glass-card {
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
}

.trial-prescription {
  min-height: 100vh;
  background: $bg;
}

// Nav
.trial-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: white;
  border-bottom: 1px solid #F1F5F9;

  &__logo img { height: 32px; }
  &__back {
    display: flex; align-items: center; gap: 6px;
    color: $gray; font-size: 14px; font-weight: 500;
    text-decoration: none;
    &:hover { color: $sky-dark; }
  }
}

// Hero
.trial-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  max-width: 1200px;
  margin: 24px auto;
  padding: 48px 40px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(2,136,209,0.3);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px;
    margin: 16px;
    border-radius: 20px;
  }

  &__content { display: flex; flex-direction: column; justify-content: center; z-index: 2; }
  &__badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; background: rgba(255,255,255,0.15);
    backdrop-filter: blur(10px); border-radius: 24px;
    width: fit-content; margin-bottom: 20px; position: relative;
    .badge-pulse {
      position: absolute; left: 12px; width: 8px; height: 8px;
      background: $emerald; border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }
    svg { width: 16px; height: 16px; color: white; margin-left: 12px; }
    span { font-size: 13px; font-weight: 600; color: white; }
  }
  &__title {
    font-size: 42px; font-weight: 800; color: white;
    line-height: 1.1; margin-bottom: 16px; letter-spacing: -1px;
    @media (max-width: 768px) { font-size: 28px; }
    &-accent {
      background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.7));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
  }
  &__subtitle { font-size: 15px; color: rgba(255,255,255,0.85); line-height: 1.6; max-width: 420px; margin-bottom: 24px; }
  &__features { display: flex; gap: 10px; flex-wrap: wrap; }
  &__visual { display: flex; align-items: center; justify-content: center; @media (max-width: 768px) { display: none; } }
}

.feature-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; background: rgba(255,255,255,0.1);
  border-radius: 20px; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.9);
  svg { width: 14px; height: 14px; }
}

.desktop-only { @media (max-width: 768px) { display: none; } }

.upload-orb {
  position: relative; width: 220px; height: 220px;
  display: flex; align-items: center; justify-content: center;
  .orb-ring {
    position: absolute; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2);
    &--1 { width: 100%; height: 100%; animation: orbit 20s linear infinite; }
    &--2 { width: 80%; height: 80%; animation: orbit 15s linear infinite reverse; }
    &--3 { width: 60%; height: 60%; animation: orbit 10s linear infinite; }
  }
  .orb-core {
    width: 90px; height: 90px; background: rgba(255,255,255,0.2);
    backdrop-filter: blur(20px); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    svg { color: white; }
  }
}

// Content
.trial-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px 100px;
  @media (max-width: 768px) { padding: 0 16px 100px; }
}

// Upload Section
.upload-section {
  display: grid; grid-template-columns: 2fr 1fr; gap: 20px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.upload-card { @include glass-card; }
.upload-area {
  border: 2px dashed rgba($sky, 0.3); border-radius: 16px;
  padding: 40px 20px; text-align: center;
  background: rgba($sky-light, 0.3); transition: all 0.3s;
  &:hover { border-color: $sky; background: rgba($sky-light, 0.5); }

  .upload-icon-wrapper {
    position: relative; display: inline-flex; margin-bottom: 16px;
    .upload-icon-bg {
      position: absolute; inset: -12px; background: rgba($sky, 0.1);
      border-radius: 50%; animation: pulse 2s ease-in-out infinite;
    }
    svg { color: $sky; position: relative; }
  }
  h4 { font-size: 18px; font-weight: 600; color: $navy; margin-bottom: 8px; }
  .upload-hint { font-size: 14px; color: $gray; margin-bottom: 24px; }
  .upload-actions { display: flex; gap: 12px; justify-content: center; margin-bottom: 20px; }
  .file-types { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: $gray; }
}

.upload-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 28px; border-radius: 12px; font-size: 15px;
  font-weight: 600; cursor: pointer; transition: all 0.2s; border: none;
  &--primary {
    background: linear-gradient(135deg, $sky, $sky-dark); color: white;
    box-shadow: 0 4px 14px rgba($sky, 0.3);
    &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba($sky, 0.4); }
  }
}

.preview-card {
  @include glass-card; margin-top: 20px; grid-column: span 2;
  @media (max-width: 768px) { grid-column: span 1; }

  .preview-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; svg { color: $sky; } h3 { font-size: 16px; font-weight: 600; color: $navy; flex: 1; } }
  .clear-btn { width: 32px; height: 32px; border-radius: 8px; border: none; background: $rose-light; color: $rose; display: flex; align-items: center; justify-content: center; cursor: pointer; &:hover { background: $rose; color: white; } }
  .preview-content { margin-bottom: 16px; border-radius: 12px; overflow: hidden; background: #F1F5F9; }
  .preview-image { width: 100%; max-height: 300px; object-fit: contain; }
  .pdf-preview { padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; color: $rose; span { font-size: 14px; color: $slate; } }
  .file-meta { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: $bg; border-radius: 10px; margin-bottom: 20px; }
  .file-name { font-size: 14px; font-weight: 500; color: $slate; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .file-size { font-size: 13px; color: $gray; }
}

.submit-btn {
  width: 100%; display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 16px; background: linear-gradient(135deg, $sky, $sky-dark);
  color: white; border: none; border-radius: 14px; font-size: 16px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba($sky, 0.3);
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba($sky, 0.4); }
}

.requirements-card {
  @include glass-card;
  .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; svg { color: $sky; } h3 { font-size: 16px; font-weight: 600; color: $navy; } }
  .requirements-list {
    list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px;
    li { display: flex; align-items: flex-start; gap: 12px; }
    .check-circle { width: 24px; height: 24px; border-radius: 50%; background: $emerald-light; color: $emerald; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    div { display: flex; flex-direction: column; gap: 2px; strong { font-size: 14px; font-weight: 600; color: $navy; } span { font-size: 13px; color: $gray; } }
  }
}

// Uploading
.uploading-section { margin-top: 20px; }
.uploading-card {
  @include glass-card; text-align: center; padding: 48px 24px;
  .upload-spinner {
    position: relative; width: 80px; height: 80px; margin: 0 auto 24px;
    .spinner-ring { position: absolute; inset: 0; border: 4px solid $sky-light; border-top-color: $sky; border-radius: 50%; animation: spin 1s linear infinite; }
    .spinner-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: $sky; }
  }
  h3 { font-size: 20px; font-weight: 600; color: $navy; margin-bottom: 8px; }
  p { font-size: 14px; color: $gray; margin-bottom: 24px; }
  .upload-progress-bar { height: 6px; background: $sky-light; border-radius: 3px; overflow: hidden; max-width: 300px; margin: 0 auto; .progress-fill { height: 100%; width: 60%; background: linear-gradient(90deg, $sky, $sky-dark); border-radius: 3px; animation: progress-indeterminate 1.5s ease-in-out infinite; } }
}

// Results
.results-section { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; }

.verification-card {
  @include glass-card;
  .status-header {
    text-align: center; padding: 24px; border-radius: 16px; margin-bottom: 24px;
    &.processing { background: linear-gradient(135deg, $sky-light, rgba($sky, 0.2)); }
    &.success { background: linear-gradient(135deg, $emerald-light, rgba($emerald, 0.2)); }
    &.failed { background: linear-gradient(135deg, $rose-light, rgba($rose, 0.2)); }
    &.review { background: linear-gradient(135deg, $amber-light, rgba($amber, 0.2)); }
    .status-icon-wrapper { width: 64px; height: 64px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); svg { color: $sky; } }
    &.success .status-icon-wrapper svg { color: $emerald; }
    &.failed .status-icon-wrapper svg { color: $rose; }
    &.review .status-icon-wrapper svg { color: $amber; }
    h3 { font-size: 20px; font-weight: 700; color: $navy; margin-bottom: 6px; }
    p { font-size: 14px; color: $gray; }
  }
}

.verification-timeline {
  display: flex; flex-direction: column;
  .timeline-step {
    display: flex; align-items: flex-start; gap: 16px; padding: 16px 0; position: relative;
    &::before { content: ''; position: absolute; left: 15px; top: 48px; bottom: 0; width: 2px; background: #E2E8F0; }
    &:last-child::before { display: none; }
    &.active::before { background: $sky; }
    &.completed::before { background: $emerald; }
    .step-indicator {
      width: 32px; height: 32px; border-radius: 50%; background: #E2E8F0;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 600; color: $gray; flex-shrink: 0; position: relative; z-index: 1;
      .step-spinner { width: 20px; height: 20px; border: 2px solid rgba($sky, 0.3); border-top-color: $sky; border-radius: 50%; animation: spin 1s linear infinite; }
    }
    &.active .step-indicator { background: $sky-light; color: $sky-dark; }
    &.completed .step-indicator { background: $emerald; color: white; }
    &.failed .step-indicator { background: $rose; color: white; }
    &.review .step-indicator { background: $amber; color: white; }
    &.processing .step-indicator { background: $sky; }
    .step-content { flex: 1; padding-top: 4px; h4 { font-size: 14px; font-weight: 600; color: $navy; margin-bottom: 4px; } p { font-size: 13px; color: $gray; } }
  }
}

// Processing Overlay
.processing-overlay {
  @include glass-card;
  text-align: center;
  padding: 60px 32px;
  margin-bottom: 24px;

  h3 {
    font-size: 20px;
    font-weight: 700;
    color: $navy;
    margin: 20px 0 8px;
  }

  p {
    font-size: 15px;
    color: $gray;
    margin: 0;
  }
}

.processing-spinner {
  width: 56px;
  height: 56px;
  border: 4px solid rgba($sky, 0.2);
  border-top-color: $sky;
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 1s linear infinite;
}

.processing-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $sky;
    opacity: 0.3;
    animation: dotPulse 1.4s ease-in-out infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
  40% { opacity: 1; transform: scale(1.3); }
}

// Score Section
.score-section { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; @media (max-width: 768px) { grid-template-columns: 1fr; } }
.score-card {
  @include glass-card;
  &--main, &--checks, &--ai { grid-column: span 2; @media (max-width: 768px) { grid-column: span 1; } }
  &__header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; svg { color: $sky; } h3 { font-size: 16px; font-weight: 600; color: $navy; flex: 1; } }
}

.score-gauge {
  display: flex; gap: 32px; align-items: center;
  @media (max-width: 768px) { flex-direction: column; gap: 20px; }

  &__circle {
    position: relative; width: 140px; height: 140px; flex-shrink: 0;
    svg { width: 100%; height: 100%; }
    &.score-high circle:last-child { stroke: $emerald; }
    &.score-medium circle:last-child { stroke: $amber; }
    &.score-low circle:last-child { stroke: $rose; }
  }
  &__value {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;
    .score-number { font-size: 32px; font-weight: 800; color: $navy; display: block; }
    .score-label { font-size: 13px; color: $gray; }
  }
  &__info { flex: 1; display: flex; flex-direction: column; gap: 14px; }
}

.score-item {
  display: flex; align-items: center; gap: 12px;
  &__label { font-size: 13px; color: $gray; width: 130px; flex-shrink: 0; }
  &__value { font-size: 13px; font-weight: 600; color: $navy; width: 40px; text-align: right; }
}

.score-bar {
  flex: 1; height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden;
  &__fill {
    height: 100%; border-radius: 4px; transition: width 1s ease;
    background: linear-gradient(90deg, $sky, $sky-dark);
    &--tier2 { background: linear-gradient(90deg, $violet, darken($violet, 10%)); }
    &--confidence { background: linear-gradient(90deg, $emerald, darken($emerald, 10%)); }
  }
}

.processing-time {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: $gray; padding-top: 4px;
  svg { color: $light-gray; }
}

// Fraud Detection
.risk-badge {
  padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;
  &--low { background: $emerald-light; color: darken($emerald, 10%); }
  &--medium { background: $amber-light; color: darken($amber, 15%); }
  &--high { background: $rose-light; color: darken($rose, 10%); }
  &--critical { background: $rose; color: white; }
}

.fraud-checks {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
}

.fraud-check {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  background: $emerald-light; border-radius: 10px; font-size: 13px; color: darken($emerald, 10%);
  svg { flex-shrink: 0; }
  &.flagged { background: $rose-light; color: darken($rose, 10%); }
}

.fraud-flags { display: flex; flex-direction: column; gap: 8px; }
.fraud-flag {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  background: $amber-light; border-radius: 10px; font-size: 13px; color: darken($amber, 15%);
  svg { flex-shrink: 0; color: $amber; }
}

// Tier checks
.tier-badge {
  padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;
  &--pass { background: $emerald-light; color: darken($emerald, 10%); }
  &--fail { background: $rose-light; color: darken($rose, 10%); }
  &--review { background: $amber-light; color: darken($amber, 15%); }
}

.checks-grid { display: flex; flex-direction: column; gap: 8px; }
.check-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  background: $bg; border-radius: 12px; border-left: 3px solid #E2E8F0;
  &.passed { border-left-color: $emerald; .check-icon svg { color: $emerald; } }
  &.failed { border-left-color: $rose; .check-icon svg { color: $rose; } }
  .check-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .check-name { font-size: 13px; font-weight: 600; color: $navy; }
  .check-details { font-size: 12px; color: $gray; }
  .check-score { font-size: 14px; font-weight: 700; color: $navy; }
}

// AI Assessment
.ai-summary, .ai-assessment { font-size: 14px; line-height: 1.6; color: $slate; margin-bottom: 16px; }
.ai-recommendations {
  h4 { font-size: 14px; font-weight: 600; color: $navy; margin-bottom: 10px; }
  ul { padding-left: 20px; li { font-size: 13px; color: $slate; line-height: 1.6; margin-bottom: 6px; } }
}

// Medications
.medications-card {
  @include glass-card;
  .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; svg { color: $sky; } h3 { font-size: 16px; font-weight: 600; color: $navy; flex: 1; } }
  .count-badge { background: $sky-light; color: $sky-dark; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
}

.med-list { display: flex; flex-direction: column; gap: 10px; }
.med-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px; border-radius: 12px; background: $bg;
  &.valid { border-left: 3px solid $emerald; .med-status svg { color: $emerald; } }
  &.invalid { border-left: 3px solid $rose; .med-status svg { color: $rose; } }
  .med-details { display: flex; flex-direction: column; gap: 4px; }
  .med-name { font-size: 14px; font-weight: 600; color: $navy; }
  .med-match { font-size: 12px; color: $emerald; }
  .med-dosage { font-size: 12px; color: $gray; }
}

// Failure reasons
.failure-card {
  @include glass-card;
  .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; svg { color: $rose; } h3 { font-size: 16px; font-weight: 600; color: $navy; } }
}

.failure-list { display: flex; flex-direction: column; gap: 8px; }
.failure-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px; border-radius: 10px;
  font-size: 13px;
  svg { flex-shrink: 0; margin-top: 2px; }
  div { display: flex; flex-direction: column; gap: 2px; }
  strong { font-size: 13px; }
  span { font-size: 12px; color: $gray; }
  &--warning { background: $amber-light; color: darken($amber, 15%); svg { color: $amber; } }
  &--error { background: $rose-light; color: darken($rose, 10%); svg { color: $rose; } }
  &--critical { background: $rose-light; color: darken($rose, 10%); svg { color: $rose; } }
  &--low, &--medium { background: $amber-light; color: darken($amber, 15%); svg { color: $amber; } }
  &--high { background: $rose-light; color: darken($rose, 10%); svg { color: $rose; } }
}

// CTA
.cta-card {
  @include glass-card; text-align: center;
  background: linear-gradient(135deg, rgba($orange, 0.05), rgba($sky, 0.05));
  border: 1px solid rgba($orange, 0.15);
  svg { color: $orange; margin-bottom: 12px; }
  h3 { font-size: 20px; font-weight: 700; color: $navy; margin-bottom: 8px; }
  p { font-size: 14px; color: $gray; margin-bottom: 24px; max-width: 400px; margin-left: auto; margin-right: auto; }
}

.cta-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.cta-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px;
  border-radius: 12px; font-size: 15px; font-weight: 600; text-decoration: none; transition: all 0.2s;
  &--primary { background: $orange; color: white; box-shadow: 0 4px 14px rgba($orange, 0.3); &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba($orange, 0.4); } }
  &--secondary { background: white; color: $slate; border: 1px solid #E2E8F0; &:hover { border-color: $sky; color: $sky-dark; } }
}

// Error
.error-card {
  @include glass-card; text-align: center; margin-top: 20px;
  svg { color: $rose; margin-bottom: 16px; }
  h3 { font-size: 20px; font-weight: 600; color: $navy; margin-bottom: 8px; }
  p { font-size: 14px; color: $gray; margin-bottom: 24px; }
}

.retry-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px;
  background: linear-gradient(135deg, $sky, $sky-dark); color: white;
  border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer;
  &:hover { transform: translateY(-2px); }
}

// Animations
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes progress-indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
.spinning { animation: spin 1s linear infinite; }
</style>
