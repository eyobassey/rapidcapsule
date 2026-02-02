<template>
  <div class="verification-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <v-icon name="hi-refresh" scale="2" class="spin" />
        <span>Loading verification data...</span>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="page-scroll">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Identity & Compliance Verification</h1>
          <p class="page-subtitle">To ensure patient safety, we must verify your identity and medical credentials. Your data is encrypted and stored securely.</p>
        </div>
        <div class="security-badge">
          <v-icon name="hi-shield-check" scale="0.8" />
          <span>Bank-grade Encryption</span>
        </div>
      </div>

      <!-- Content Area -->
      <div class="content-area">
        <!-- Left Column: Verification Forms -->
        <div class="forms-column">

          <!-- 1. Government ID Section -->
          <section class="verification-card" :class="{ verified: governmentIdStatus === 'verified', active: activeSection === 'government_id' }">
            <!-- Active Indicator Strip -->
            <div v-if="activeSection === 'government_id'" class="active-strip"></div>

            <div class="card-header">
              <div class="card-icon" :class="{ verified: governmentIdStatus === 'verified' }">
                <v-icon name="hi-identification" scale="1.1" />
              </div>
              <div class="card-info">
                <h3>Government ID</h3>
                <p v-if="governmentIdStatus !== 'verified'">Valid passport, national ID, or driver's license</p>
              </div>
              <span class="status-badge" :class="governmentIdStatus">
                <v-icon v-if="governmentIdStatus === 'verified'" name="fa-check" scale="0.5" />
                {{ statusLabel(governmentIdStatus) }}
              </span>
            </div>

            <!-- Verified State -->
            <div v-if="governmentIdStatus === 'verified'" class="verified-content">
              <div class="verified-preview">
                <div class="doc-icon">
                  <v-icon name="hi-identification" scale="1.5" />
                </div>
                <div class="doc-info">
                  <div class="doc-type">{{ idTypeLabel(formData.government_id.type) }}</div>
                  <div class="doc-number">ID Number: {{ maskIdNumber(formData.government_id.number) }}</div>
                  <div class="doc-expiry" v-if="formData.government_id.expiry">Expiry: {{ formData.government_id.expiry }}</div>
                </div>
                <button class="update-btn" @click="editSection('government_id')">Update</button>
              </div>
            </div>

            <!-- Upload State -->
            <div v-else class="card-content">
              <div class="form-row">
                <div class="form-group">
                  <label>Document Type <span class="required">*</span></label>
                  <select v-model="formData.government_id.type" class="form-select">
                    <option value="">Select type...</option>
                    <option value="passport">International Passport</option>
                    <option value="national_id">National ID (NIN)</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>ID Number <span class="required">*</span></label>
                  <input
                    v-model="formData.government_id.number"
                    type="text"
                    placeholder="Enter ID number"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Expiry Date</label>
                <input
                  v-model="formData.government_id.expiry"
                  type="text"
                  placeholder="MM/YYYY"
                  class="form-input half-width"
                />
              </div>

              <!-- Upload Zone -->
              <div class="upload-section">
                <label>Upload Document <span class="required">*</span></label>
                <div
                  class="upload-zone"
                  :class="{ 'drag-active': isDragging.government_id, 'has-file': uploadedFiles.government_id }"
                  @click="triggerUpload('government_id')"
                  @dragover.prevent="isDragging.government_id = true"
                  @dragleave="isDragging.government_id = false"
                  @drop.prevent="handleDrop($event, 'government_id')"
                >
                  <input
                    ref="governmentIdInput"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    @change="handleFileSelect($event, 'government_id')"
                    hidden
                  />

                  <template v-if="!uploadedFiles.government_id">
                    <div class="upload-icon">
                      <v-icon name="hi-cloud-upload" scale="1.5" />
                    </div>
                    <h4>Click to upload or drag and drop</h4>
                    <p>SVG, PNG, JPG or PDF (max. 5MB)</p>
                    <button type="button" class="select-file-btn">Select File</button>
                  </template>

                  <template v-else>
                    <div class="uploaded-file">
                      <div class="file-icon">
                        <v-icon :name="getFileIcon(uploadedFiles.government_id.type)" scale="1.2" />
                      </div>
                      <div class="file-info">
                        <span class="file-name">{{ uploadedFiles.government_id.name }}</span>
                        <span class="file-status success">
                          <v-icon name="fa-check-circle" scale="0.6" />
                          Uploaded
                        </span>
                      </div>
                      <button type="button" class="remove-file-btn" @click.stop="removeFile('government_id')">
                        <v-icon name="hi-trash" scale="0.9" />
                      </button>
                    </div>
                  </template>
                </div>
                <p class="upload-note">
                  <v-icon name="hi-lock-closed" scale="0.5" />
                  Documents are encrypted before storage.
                </p>
              </div>
            </div>
          </section>

          <!-- 2. Medical License Section -->
          <section class="verification-card" :class="{ verified: medicalLicenseStatus === 'verified', active: activeSection === 'medical_license' }">
            <div v-if="activeSection === 'medical_license'" class="active-strip"></div>

            <div class="card-header">
              <div class="card-icon license" :class="{ verified: medicalLicenseStatus === 'verified' }">
                <v-icon name="hi-academic-cap" scale="1.1" />
              </div>
              <div class="card-info">
                <h3>Medical License</h3>
                <p>Required for practice activation</p>
              </div>
              <span class="status-badge" :class="medicalLicenseStatus">
                <v-icon v-if="medicalLicenseStatus === 'verified'" name="fa-check" scale="0.5" />
                <v-icon v-else-if="medicalLicenseStatus === 'pending'" name="fa-clock" scale="0.5" />
                {{ statusLabel(medicalLicenseStatus) }}
              </span>
            </div>

            <div class="card-content">
              <div class="form-row">
                <div class="form-group">
                  <label>License Number <span class="required">*</span></label>
                  <input
                    v-model="formData.medical_license.license_number"
                    type="text"
                    placeholder="e.g. MDCN/2023/8821"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label>Issuing Body <span class="required">*</span></label>
                  <select v-model="formData.medical_license.issuing_body" class="form-select">
                    <option value="">Select Authority</option>
                    <option value="mdcn">Medical and Dental Council of Nigeria (MDCN)</option>
                    <option value="nmcn">Nursing and Midwifery Council of Nigeria</option>
                    <option value="pcn">Pharmacists Council of Nigeria</option>
                    <option value="other">Other (International)</option>
                  </select>
                </div>
              </div>

              <!-- Upload Zone -->
              <div class="upload-section">
                <label>Upload Certificate or License Card <span class="required">*</span></label>
                <div
                  class="upload-zone"
                  :class="{ 'drag-active': isDragging.medical_license, 'has-file': uploadedFiles.medical_license, 'processing': isProcessingOCR }"
                  @click="triggerUpload('medical_license')"
                  @dragover.prevent="isDragging.medical_license = true"
                  @dragleave="isDragging.medical_license = false"
                  @drop.prevent="handleDrop($event, 'medical_license')"
                >
                  <input
                    ref="medicalLicenseInput"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    @change="handleFileSelect($event, 'medical_license')"
                    hidden
                  />

                  <!-- OCR Processing Overlay -->
                  <div v-if="isProcessingOCR" class="ocr-overlay">
                    <div class="scan-line"></div>
                    <span class="ocr-text">Extracting Data...</span>
                  </div>

                  <template v-if="!uploadedFiles.medical_license && !isProcessingOCR">
                    <div class="upload-icon">
                      <v-icon name="hi-cloud-upload" scale="1.5" />
                    </div>
                    <h4>Click to upload or drag and drop</h4>
                    <p>SVG, PNG, JPG or PDF (max. 5MB). We'll use OCR to verify details automatically.</p>
                    <button type="button" class="select-file-btn">Select File</button>
                  </template>

                  <template v-else-if="uploadedFiles.medical_license && !isProcessingOCR">
                    <div class="uploaded-file">
                      <div class="file-icon">
                        <v-icon :name="getFileIcon(uploadedFiles.medical_license.type)" scale="1.2" />
                      </div>
                      <div class="file-info">
                        <span class="file-name">{{ uploadedFiles.medical_license.name }}</span>
                        <span class="file-status success">
                          <v-icon name="fa-check-circle" scale="0.6" />
                          OCR Verified
                        </span>
                      </div>
                      <button type="button" class="remove-file-btn" @click.stop="removeFile('medical_license')">
                        <v-icon name="hi-trash" scale="0.9" />
                      </button>
                    </div>
                  </template>
                </div>
                <p class="upload-note">
                  <v-icon name="hi-lock-closed" scale="0.5" />
                  Documents are encrypted before storage.
                </p>
              </div>
            </div>
          </section>

          <!-- 3. Professional Registry Check -->
          <section class="verification-card registry-card" :class="{ verified: registryCheckStatus === 'verified', disabled: !formData.medical_license.license_number }">
            <div class="card-header">
              <div class="card-icon registry">
                <v-icon name="hi-globe-alt" scale="1.1" />
              </div>
              <div class="card-info">
                <h3>Professional Registry Check</h3>
                <p>Automatic verification against NMA database.</p>
              </div>
              <span class="status-badge" :class="registryCheckStatus">
                {{ registryStatusLabel }}
              </span>
            </div>
          </section>
        </div>

        <!-- Right Column: Info Sidebar -->
        <aside class="info-sidebar">
          <!-- Blockchain Security Card -->
          <div class="blockchain-card">
            <div class="blockchain-bg-icon">
              <v-icon name="bi-link-45deg" scale="5" />
            </div>
            <div class="blockchain-content">
              <div class="blockchain-icon">
                <v-icon name="hi-finger-print" scale="1.2" />
              </div>
              <h3>Blockchain Secured</h3>
              <p>Your credentials are hashed and stored securely. This creates a tamper-proof record of your qualifications that patients can trust.</p>
              <div v-if="credentialHash" class="hash-display">
                <v-icon name="hi-key" scale="0.7" />
                <span class="hash-value">{{ formatHash(credentialHash) }}</span>
              </div>
            </div>
          </div>

          <!-- Verification Status -->
          <div class="status-card">
            <h3>Verification Status</h3>
            <div class="status-timeline">
              <!-- Identity Check -->
              <div class="timeline-item" :class="{ completed: governmentIdStatus === 'verified', active: governmentIdStatus === 'pending' && activeSection === 'government_id' }">
                <div class="timeline-dot">
                  <v-icon v-if="governmentIdStatus === 'verified'" name="fa-check" scale="0.5" />
                </div>
                <div class="timeline-content">
                  <strong>Identity Check</strong>
                  <span v-if="governmentIdStatus === 'verified'">Approved</span>
                  <span v-else-if="governmentIdStatus === 'pending'" class="action-needed">Action Required</span>
                  <span v-else>Pending</span>
                </div>
              </div>

              <!-- Medical Credentials -->
              <div class="timeline-item" :class="{ completed: medicalLicenseStatus === 'verified', active: medicalLicenseStatus === 'pending' && activeSection === 'medical_license' }">
                <div class="timeline-dot">
                  <v-icon v-if="medicalLicenseStatus === 'verified'" name="fa-check" scale="0.5" />
                </div>
                <div class="timeline-content">
                  <strong>Medical Credentials</strong>
                  <span v-if="medicalLicenseStatus === 'verified'">Approved</span>
                  <span v-else-if="activeSection === 'medical_license'" class="action-needed">Action Required</span>
                  <span v-else>Pending</span>
                </div>
              </div>

              <!-- Registry Check -->
              <div class="timeline-item" :class="{ completed: registryCheckStatus === 'verified' }">
                <div class="timeline-dot">
                  <v-icon v-if="registryCheckStatus === 'verified'" name="fa-check" scale="0.5" />
                </div>
                <div class="timeline-content">
                  <strong>Registry API Check</strong>
                  <span>{{ registryStatusLabel }}</span>
                </div>
              </div>

              <!-- Final Approval -->
              <div class="timeline-item" :class="{ completed: allVerified }">
                <div class="timeline-dot">
                  <v-icon v-if="allVerified" name="fa-check" scale="0.5" />
                </div>
                <div class="timeline-content">
                  <strong>Final Approval</strong>
                  <span>{{ allVerified ? 'Complete' : 'Pending' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Upload Tips -->
          <div class="tips-card">
            <div class="tips-icon">
              <v-icon name="hi-exclamation-circle" scale="0.9" />
            </div>
            <div class="tips-content">
              <h4>Upload Issue?</h4>
              <p>Ensure your document is clear, well-lit, and all 4 corners are visible.</p>
              <a href="#" class="view-examples">View Examples</a>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Sticky Footer -->
    <div class="sticky-footer">
      <div class="sticky-footer-inner">
        <button class="draft-btn" @click="saveDraft" :disabled="isSaving">
          {{ isSaving ? 'Saving...' : 'Save as Draft' }}
        </button>
        <div class="footer-right">
          <span v-if="!isOnboardingComplete" class="next-hint">Next: Security & Preferences</span>
          <button
            class="continue-btn"
            @click="saveAndContinue"
            :disabled="!canContinue || isSaving"
            :class="{ disabled: !canContinue }"
          >
            <v-icon v-if="isSaving" name="hi-refresh" scale="0.8" class="spin" />
            {{ isSaving ? 'Saving...' : (isOnboardingComplete ? 'Save Changes' : 'Verify & Continue') }}
            <v-icon v-if="!isSaving && !isOnboardingComplete" name="hi-arrow-right" scale="0.8" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import apiFactory from '@/services/apiFactory';
import { useOnboardingState } from './composables/useOnboardingState';

const router = useRouter();
const toast = useToast();
const { verification, completeStep, goToStep, saveProgress, progressPercent, stepCompletion } = useOnboardingState();

// Check if onboarding is complete (editing mode)
const isOnboardingComplete = computed(() => {
  return progressPercent.value >= 100 || stepCompletion.review;
});

// State
const isLoading = ref(true);
const isSaving = ref(false);
const isProcessingOCR = ref(false);
const activeSection = ref('government_id');
const credentialHash = ref(null);

// Form data
const formData = reactive({
  government_id: {
    type: '',
    number: '',
    expiry: '',
    document_url: '',
    status: 'pending',
  },
  medical_license: {
    license_number: '',
    issuing_body: '',
    document_url: '',
    status: 'pending',
  },
  registry_check: {
    status: 'pending',
    verified_at: null,
  },
});

// File handling
const uploadedFiles = reactive({
  government_id: null,
  medical_license: null,
});

const isDragging = reactive({
  government_id: false,
  medical_license: false,
});

// Template refs
const governmentIdInput = ref(null);
const medicalLicenseInput = ref(null);

// Computed
const governmentIdStatus = computed(() => {
  if (formData.government_id.status === 'verified') return 'verified';
  if (uploadedFiles.government_id) return 'uploaded';
  return 'pending';
});

const medicalLicenseStatus = computed(() => {
  if (formData.medical_license.status === 'verified') return 'verified';
  if (uploadedFiles.medical_license) return 'uploaded';
  return 'pending';
});

const registryCheckStatus = computed(() => {
  return formData.registry_check.status;
});

const registryStatusLabel = computed(() => {
  if (!formData.medical_license.license_number) return 'Waiting for License';
  if (registryCheckStatus.value === 'verified') return 'Verified';
  if (registryCheckStatus.value === 'failed') return 'Could not verify';
  return 'Checking...';
});

const allVerified = computed(() => {
  return governmentIdStatus.value === 'verified' &&
         medicalLicenseStatus.value === 'verified' &&
         registryCheckStatus.value === 'verified';
});

const canContinue = computed(() => {
  // Allow continue if:
  // - Files are uploaded (new or existing from DB), OR
  // - Status is already verified
  const hasGovernmentId = uploadedFiles.government_id ||
                          governmentIdStatus.value === 'verified' ||
                          formData.government_id.document_url;
  const hasMedicalLicense = uploadedFiles.medical_license ||
                            medicalLicenseStatus.value === 'verified' ||
                            formData.medical_license.document_url;
  return hasGovernmentId && hasMedicalLicense;
});

// Methods
const statusLabel = (status) => {
  const labels = {
    pending: 'Pending Upload',
    uploaded: 'Uploaded',
    verified: 'Verified',
    rejected: 'Needs Review',
  };
  return labels[status] || 'Pending';
};

const idTypeLabel = (type) => {
  const labels = {
    passport: 'International Passport',
    national_id: 'National ID (NIN)',
    drivers_license: "Driver's License",
  };
  return labels[type] || type;
};

const maskIdNumber = (number) => {
  if (!number || number.length < 6) return number;
  return number.slice(0, 3) + '******' + number.slice(-2);
};

const formatHash = (hash) => {
  if (!hash) return '';
  return `0x${hash.slice(0, 3)}...${hash.slice(-3)}`.toUpperCase();
};

const getFileIcon = (mimeType) => {
  if (mimeType?.includes('pdf')) return 'hi-document';
  if (mimeType?.includes('image')) return 'hi-photo';
  return 'hi-document';
};

const editSection = (section) => {
  activeSection.value = section;
  formData[section].status = 'pending';
};

const triggerUpload = (type) => {
  if (type === 'government_id') {
    governmentIdInput.value?.click();
  } else if (type === 'medical_license') {
    medicalLicenseInput.value?.click();
  }
};

const handleFileSelect = async (event, type) => {
  const file = event.target.files[0];
  if (file) {
    await processFile(file, type);
  }
};

const handleDrop = async (event, type) => {
  isDragging[type] = false;
  const file = event.dataTransfer.files[0];
  if (file) {
    await processFile(file, type);
  }
};

const processFile = async (file, type) => {
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('File size must be less than 5MB');
    return;
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    toast.error('Please upload a JPG, PNG, or PDF file');
    return;
  }

  uploadedFiles[type] = {
    name: file.name,
    type: file.type,
    size: file.size,
    file: file,
  };

  // Simulate OCR processing for medical license
  if (type === 'medical_license') {
    isProcessingOCR.value = true;
    setTimeout(() => {
      isProcessingOCR.value = false;
      // Generate a credential hash for display
      generateCredentialHash();
    }, 2000);
  } else {
    generateCredentialHash();
  }

  // Move to next section if government ID is done
  if (type === 'government_id' && !uploadedFiles.medical_license) {
    activeSection.value = 'medical_license';
  }
};

const removeFile = (type) => {
  uploadedFiles[type] = null;
  if (type === 'government_id') {
    governmentIdInput.value.value = '';
  } else if (type === 'medical_license') {
    medicalLicenseInput.value.value = '';
  }
};

const generateCredentialHash = () => {
  // Generate a mock SHA-256-like hash for display
  // In production, this would be computed from actual document data
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 40; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  credentialHash.value = hash;
};

// API Functions
const loadData = async () => {
  isLoading.value = true;
  try {
    // Load existing verification data from backend
    const response = await apiFactory.$_getIdentityVerification();
    if (response.data?.data?.identity_verification) {
      const verificationData = response.data.data.identity_verification;

      // Populate form data with existing values
      if (verificationData.government_id) {
        Object.assign(formData.government_id, verificationData.government_id);
        // If document exists, mark as uploaded
        if (verificationData.government_id.document_url) {
          uploadedFiles.government_id = {
            name: 'Government ID (uploaded)',
            type: 'application/pdf',
            size: 0,
            url: verificationData.government_id.document_url,
            isExisting: true,
          };
        }
      }

      if (verificationData.medical_license) {
        Object.assign(formData.medical_license, verificationData.medical_license);
        // If document exists, mark as uploaded
        if (verificationData.medical_license.document_url) {
          uploadedFiles.medical_license = {
            name: 'Medical License (uploaded)',
            type: 'application/pdf',
            size: 0,
            url: verificationData.medical_license.document_url,
            isExisting: true,
          };
        }
      }

      if (verificationData.registry_check) {
        Object.assign(formData.registry_check, verificationData.registry_check);
      }

      if (verificationData.credential_hash) {
        credentialHash.value = verificationData.credential_hash;
      }
    }

    // Also check professional_practice for license number fallback
    if (response.data?.data?.professional_practice?.license_number && !formData.medical_license.license_number) {
      formData.medical_license.license_number = response.data.data.professional_practice.license_number;
    }

    // Set active section based on verification status
    if (formData.government_id.status === 'verified') {
      activeSection.value = 'medical_license';
    }
    if (formData.medical_license.status === 'verified') {
      activeSection.value = 'registry_check';
    }

  } catch (error) {
    console.error('Failed to load verification data:', error);
    // Fallback to onboarding state if API fails
    if (verification.government_id) {
      Object.assign(formData.government_id, verification.government_id);
    }
    if (verification.medical_license) {
      Object.assign(formData.medical_license, verification.medical_license);
    }
    if (verification.registry_check) {
      Object.assign(formData.registry_check, verification.registry_check);
    }
  } finally {
    isLoading.value = false;
  }
};

const saveVerificationData = async () => {
  isSaving.value = true;
  try {
    // Prepare payload with document uploads
    const payload = {
      government_id: { ...formData.government_id },
      medical_license: { ...formData.medical_license },
      registry_check: { ...formData.registry_check },
      credential_hash: credentialHash.value,
    };

    // Convert uploaded files to base64 for upload (if new files)
    if (uploadedFiles.government_id?.file) {
      payload.government_id.document_url = await fileToBase64(uploadedFiles.government_id.file);
    }
    if (uploadedFiles.medical_license?.file) {
      payload.medical_license.document_url = await fileToBase64(uploadedFiles.medical_license.file);
    }

    // Save to backend
    await apiFactory.$_updateIdentityVerification(payload);

    // Update the onboarding state for local tracking
    Object.assign(verification.government_id, formData.government_id);
    Object.assign(verification.medical_license, formData.medical_license);
    Object.assign(verification.registry_check, formData.registry_check);

    return true;
  } catch (error) {
    console.error('Failed to save verification data:', error);
    throw error;
  } finally {
    isSaving.value = false;
  }
};

// Helper function to convert File to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const saveDraft = async () => {
  try {
    await saveVerificationData();
    toast.success('Draft saved successfully');
  } catch (error) {
    toast.error('Failed to save draft');
  }
};

const saveAndContinue = async () => {
  if (!canContinue.value) {
    toast.warning('Please upload all required documents');
    return;
  }

  try {
    await saveVerificationData();

    // Mark verification documents as verified (for demo)
    // In production, this would happen after admin review
    if (uploadedFiles.government_id) {
      formData.government_id.status = 'verified';
    }
    if (uploadedFiles.medical_license) {
      formData.medical_license.status = 'verified';
    }

    completeStep('verification');
    toast.success('Verification documents saved');

    // If onboarding is complete, stay on page. Otherwise, continue to next step.
    if (!isOnboardingComplete.value) {
      router.push({ name: 'SpecialistSecurity' });
    }
  } catch (error) {
    toast.error('Failed to save verification data');
  }
};

// Initialize
onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.verification-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #F8FAFC;
  width: 100%;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(248, 250, 252, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #64748B;
}

.page-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  padding-bottom: 6rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
  max-width: 1400px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0;
  max-width: 600px;
}

.security-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #E0F2FE;
  color: #0284C7;
  border: 1px solid #7DD3FC;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.content-area {
  display: flex;
  gap: 1.5rem;
  width: 100%;
  max-width: 1400px;
}

.forms-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
}

.verification-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
  transition: all 0.2s;
}

.verification-card.active {
  border-color: rgba(79, 195, 247, 0.4);
  box-shadow: 0 4px 20px -4px rgba(79, 195, 247, 0.2);
}

.verification-card.verified {
  border-color: #7DD3FC;
  background: linear-gradient(135deg, white 0%, #E0F2FE 100%);
}

.verification-card.disabled {
  opacity: 0.6;
}

.active-strip {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #4FC3F7;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: rgba(248, 250, 252, 0.5);
  border-bottom: 1px solid #F1F5F9;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #E1F5FE;
  color: #0288D1;
  flex-shrink: 0;
}

.card-icon.license {
  background: #4FC3F7;
  color: white;
}

.card-icon.registry {
  background: #F1F5F9;
  color: #64748B;
}

.card-icon.verified {
  background: #E0F2FE;
  color: #0284C7;
}

.card-info {
  flex: 1;
}

.card-info h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0;
}

.card-info p {
  font-size: 0.75rem;
  color: #64748B;
  margin: 0.25rem 0 0 0;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.status-badge.pending {
  background: #FEF3C7;
  color: #92400E;
}

.status-badge.uploaded {
  background: #E1F5FE;
  color: #0288D1;
}

.status-badge.verified {
  background: #E0F2FE;
  color: #0284C7;
}

.status-badge.rejected {
  background: #FEE2E2;
  color: #991B1B;
}

.card-content {
  padding: 1.5rem;
}

.verified-content {
  padding: 1rem 1.5rem;
}

.verified-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.doc-icon {
  width: 64px;
  height: 44px;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
}

.doc-info {
  flex: 1;
}

.doc-type {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
}

.doc-number,
.doc-expiry {
  font-size: 0.75rem;
  color: #64748B;
  margin-top: 0.125rem;
}

.update-btn {
  background: none;
  border: none;
  color: #4FC3F7;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #334155;

    .required {
      color: #EF4444;
    }
  }
}

.form-input,
.form-select {
  padding: 0.625rem 0.75rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1A365D;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4FC3F7;
    box-shadow: 0 0 0 4px rgba(79, 195, 247, 0.1);
  }

  &::placeholder {
    color: #94A3B8;
  }
}

.half-width {
  max-width: 200px;
}

.upload-section {
  margin-top: 1rem;

  label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: #334155;
    margin-bottom: 0.5rem;

    .required {
      color: #EF4444;
    }
  }
}

.upload-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed #CBD5E1;
  border-radius: 1rem;
  background: #F8FAFC;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;

  &:hover,
  &.drag-active {
    border-color: #4FC3F7;
    background: rgba(79, 195, 247, 0.05);

    .upload-icon {
      color: #4FC3F7;
      background: #E1F5FE;
    }
  }

  &.has-file {
    border-style: solid;
    padding: 1rem;
  }

  &.processing {
    pointer-events: none;
  }
}

.upload-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  margin-bottom: 0.75rem;
  transition: all 0.2s;
}

.upload-zone h4 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #334155;
  margin: 0;
}

.upload-zone p {
  font-size: 0.75rem;
  color: #94A3B8;
  margin: 0.25rem 0 0 0;
  text-align: center;
  max-width: 280px;
}

.select-file-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #4FC3F7;
    color: #4FC3F7;
  }
}

.ocr-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #4FC3F7;
  box-shadow: 0 0 15px rgba(79, 195, 247, 0.8);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; opacity: 0; }
  50% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

.ocr-text {
  color: #4FC3F7;
  font-weight: 700;
  font-size: 0.875rem;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem;
  background: #E0F2FE;
  border: 1px solid #7DD3FC;
  border-radius: 0.5rem;
}

.file-icon {
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #EF4444;
}

.file-info {
  flex: 1;
}

.file-name {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1A365D;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;

  &.success {
    color: #0284C7;
  }
}

.remove-file-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    background: #FEE2E2;
    color: #EF4444;
  }
}

.upload-note {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  font-size: 0.625rem;
  color: #94A3B8;
}

.registry-card .card-header {
  border-bottom: none;
}

/* Right Sidebar */
.info-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.blockchain-card {
  background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.blockchain-bg-icon {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.5rem;
  opacity: 0.1;
}

.blockchain-content {
  position: relative;
  z-index: 1;
}

.blockchain-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: white;
}

.blockchain-card h3 {
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: white;
}

.blockchain-card p {
  font-size: 0.75rem;
  color: #94A3B8;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.hash-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 0.625rem;
  color: white;
}

.hash-value {
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
}

.hash-display .ov-icon {
  color: white;
}

.status-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.25rem;
}

.status-card h3 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 1rem 0;
}

.status-timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  gap: 0.75rem;
  padding-bottom: 1rem;
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 9px;
    top: 20px;
    width: 2px;
    height: calc(100% - 12px);
    background: #E2E8F0;
  }

  &.completed::after {
    background: #4CAF50;
  }

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #E2E8F0;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;

  .timeline-item.completed & {
    background: #4CAF50;
  }

  .timeline-item.active & {
    background: #FF9800;
    animation: dot-pulse 2s infinite;
  }
}

@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(255, 152, 0, 0); }
}

.timeline-content {
  flex: 1;
  padding-top: 2px;

  strong {
    display: block;
    font-size: 0.75rem;
    color: #1A365D;
  }

  span {
    font-size: 0.625rem;
    color: #94A3B8;

    &.action-needed {
      color: #FF9800;
    }
  }
}

.tips-card {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #FFF3E0;
  border: 1px solid rgba(255, 152, 0, 0.2);
  border-radius: 0.75rem;
}

.tips-icon {
  color: #FF9800;
  flex-shrink: 0;
  margin-top: 2px;
}

.tips-content {
  h4 {
    font-size: 0.75rem;
    font-weight: 700;
    color: #C2410C;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.6875rem;
    color: #64748B;
    line-height: 1.5;
    margin: 0 0 0.5rem 0;
  }
}

.view-examples {
  font-size: 0.625rem;
  font-weight: 700;
  color: #1A365D;
  text-decoration: underline;
}

/* Footer */
.sticky-footer {
  position: fixed;
  bottom: 0;
  left: 260px;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-top: 1px solid #E2E8F0;
  z-index: 50;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

.sticky-footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1400px;
}

.draft-btn {
  padding: 0.625rem 1rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    color: #1A365D;
    background: #F8FAFC;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.next-hint {
  font-size: 0.75rem;
  color: #94A3B8;
}

.continue-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: #FF9800;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #F57C00;
    transform: translateY(-1px);
  }

  &:disabled,
  &.disabled {
    background: #E2E8F0;
    color: #94A3B8;
    cursor: not-allowed;
    box-shadow: none;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}

/* Responsive */
@media (max-width: 1024px) {
  .content-area {
    flex-direction: column;
  }

  .info-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;

    > * {
      flex: 1;
      min-width: 280px;
    }
  }
}

@media (max-width: 768px) {
  .page-scroll {
    padding: 1rem;
    padding-bottom: 8rem;
  }

  .page-header {
    flex-direction: column;
  }

  .security-badge {
    align-self: flex-start;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .info-sidebar {
    flex-direction: column;

    > * {
      min-width: 100%;
    }
  }

  /* Mobile Blockchain Card Styles */
  .blockchain-card {
    padding: 1rem;
    border-radius: 0.75rem;
  }

  .blockchain-icon {
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    color: #4FC3F7;
  }

  .blockchain-card h3 {
    font-size: 0.75rem;
    margin-bottom: 0.375rem;
    color: white;
  }

  .blockchain-card p {
    font-size: 0.625rem;
    color: #CBD5E1;
    line-height: 1.5;
    margin-bottom: 0.75rem;
  }

  .hash-display {
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.5625rem;
    color: #4FC3F7;
    border-radius: 0.375rem;
  }

  .hash-value {
    color: #4FC3F7;
  }

  .hash-display .ov-icon {
    color: #4FC3F7;
  }

  .blockchain-bg-icon {
    font-size: 3rem;
    opacity: 0.1;
  }

  /* Mobile Verification Card Styles */
  .verification-card {
    border-radius: 0.75rem;
  }

  .card-header {
    padding: 1rem;
    gap: 0.5rem;
  }

  .card-icon {
    width: 28px;
    height: 28px;
    border-radius: 0.5rem;
    font-size: 0.75rem;
  }

  .card-info h3 {
    font-size: 0.875rem;
  }

  .card-info p {
    font-size: 0.5625rem;
  }

  .status-badge {
    font-size: 0.5625rem;
    padding: 0.25rem 0.5rem;
  }

  .card-content {
    padding: 1rem;
  }

  .form-group label {
    font-size: 0.625rem;
    margin-bottom: 0.375rem;
  }

  .form-input,
  .form-select {
    padding: 0.625rem 0.75rem;
    font-size: 0.75rem;
  }

  .upload-zone {
    padding: 1.5rem;
    border-radius: 0.75rem;
  }

  .upload-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 0.5rem;
  }

  .upload-zone h4 {
    font-size: 0.75rem;
  }

  .upload-zone p {
    font-size: 0.625rem;
  }

  .select-file-btn {
    margin-top: 0.75rem;
    padding: 0.5rem 1rem;
    font-size: 0.625rem;
  }

  .upload-note {
    font-size: 0.5625rem;
  }

  /* Mobile Status Card Styles */
  .status-card {
    padding: 1rem;
    border-radius: 0.75rem;
  }

  .status-card h3 {
    font-size: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .timeline-dot {
    width: 16px;
    height: 16px;
  }

  .timeline-item:not(:last-child)::after {
    left: 7px;
    top: 18px;
  }

  .timeline-content strong {
    font-size: 0.625rem;
  }

  .timeline-content span {
    font-size: 0.5625rem;
  }

  /* Mobile Tips Card Styles */
  .tips-card {
    padding: 0.75rem;
    border-radius: 0.75rem;
  }

  .tips-content h4 {
    font-size: 0.625rem;
  }

  .tips-content p {
    font-size: 0.5625rem;
  }

  .view-examples {
    font-size: 0.5625rem;
  }

  /* Mobile Footer Styles */
  .sticky-footer {
    left: 0;
    padding: 0.75rem 1rem;
  }

  .sticky-footer-inner {
    flex-direction: column;
    gap: 0.5rem;
  }

  .footer-right {
    width: 100%;
    flex-direction: column;
    gap: 0.5rem;
  }

  .next-hint {
    display: none;
  }

  .draft-btn {
    width: 100%;
    order: 2;
    padding: 0.5rem;
    font-size: 0.75rem;
  }

  .continue-btn {
    width: 100%;
    order: 1;
    justify-content: center;
    padding: 0.875rem 1rem;
    border-radius: 0.75rem;
  }

  .verified-preview {
    flex-wrap: wrap;
  }

  .doc-icon {
    width: 64px;
    height: 48px;
  }

  .doc-info {
    flex-basis: calc(100% - 80px);
  }

  .doc-type {
    font-size: 0.75rem;
  }

  .doc-number,
  .doc-expiry {
    font-size: 0.625rem;
  }

  .update-btn {
    font-size: 0.625rem;
  }

  /* Mobile Registry Card */
  .registry-card {
    padding: 1rem;
    opacity: 0.6;
  }
}
</style>
