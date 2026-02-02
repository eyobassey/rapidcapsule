<template>
  <div class="review-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading your profile data...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="page-scroll">
      <div class="page-content">
        <!-- Left Column: Review Sections -->
        <div class="review-column">
          <!-- Page Header -->
          <div class="page-header">
            <div class="header-content">
              <h1 class="page-title">Final Review</h1>
              <p class="page-subtitle">Verify your information before going live. Your profile will be visible to patients immediately upon activation.</p>
            </div>
            <div class="completion-badge" v-if="allStepsComplete">
              <v-icon name="hi-badge-check" scale="0.7" />
              All Steps Complete
            </div>
          </div>

          <!-- Review Sections -->
          <div class="review-sections">
            <!-- 1. Professional Profile -->
            <div class="review-card">
              <div class="card-header">
                <h3>
                  <v-icon name="fa-user-md" scale="0.9" />
                  Professional Profile
                </h3>
                <button class="edit-btn" @click="goToStep(4)">
                  Edit <v-icon name="hi-pencil" scale="0.6" />
                </button>
              </div>
              <div class="card-content profile-summary">
                <div class="profile-avatar">
                  <img
                    v-if="profilePhoto"
                    :src="profilePhoto"
                    alt="Profile"
                  />
                  <v-icon v-else name="hi-user" scale="1.5" />
                </div>
                <div class="profile-details">
                  <div class="detail-row">
                    <span class="label">Full Name</span>
                    <span class="value">{{ displayName }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Specialization{{ allSpecializations.length > 1 ? 's' : '' }}</span>
                    <div class="specialization-tags">
                      <span v-for="(spec, index) in allSpecializations" :key="index" class="spec-tag">
                        {{ spec }}
                      </span>
                      <span v-if="allSpecializations.length === 0" class="spec-tag empty">Not set</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <span class="label">Languages</span>
                    <div class="language-tags">
                      <span v-for="lang in displayLanguages" :key="lang" class="tag">
                        {{ lang }}
                      </span>
                      <span v-if="displayLanguages.length === 0" class="tag empty">Not set</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <span class="label">Bio Preview</span>
                    <span class="value truncate">{{ truncatedBio }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Credentials & Compliance -->
            <div class="review-card">
              <div class="card-header">
                <h3>
                  <v-icon name="hi-badge-check" scale="0.9" />
                  Credentials & Compliance
                </h3>
                <div class="header-right">
                  <span v-if="isFullyVerified" class="verified-badge">
                    <v-icon name="hi-shield-check" scale="0.6" />
                    Verified
                  </span>
                  <span v-else class="pending-badge">
                    <v-icon name="hi-clock" scale="0.6" />
                    Pending
                  </span>
                  <button class="edit-btn" @click="goToStep(7)">
                    Edit <v-icon name="hi-pencil" scale="0.6" />
                  </button>
                </div>
              </div>
              <div class="card-content">
                <div class="credentials-grid">
                  <div class="credential-item">
                    <div class="credential-icon">
                      <v-icon name="hi-identification" scale="0.9" />
                    </div>
                    <div>
                      <span class="credential-label">Medical License</span>
                      <span class="credential-value">{{ licenseDisplay }}</span>
                    </div>
                    <v-icon
                      :name="licenseVerified ? 'fa-check-circle' : 'hi-clock'"
                      :class="licenseVerified ? 'check-icon' : 'pending-icon'"
                      scale="0.8"
                    />
                  </div>
                  <div class="credential-item">
                    <div class="credential-icon">
                      <v-icon name="hi-identification" scale="0.9" />
                    </div>
                    <div>
                      <span class="credential-label">Identity</span>
                      <span class="credential-value">{{ identityDisplay }}</span>
                    </div>
                    <v-icon
                      :name="identityVerified ? 'fa-check-circle' : 'hi-clock'"
                      :class="identityVerified ? 'check-icon' : 'pending-icon'"
                      scale="0.8"
                    />
                  </div>
                  <div class="credential-item">
                    <div class="credential-icon">
                      <v-icon name="hi-academic-cap" scale="0.9" />
                    </div>
                    <div>
                      <span class="credential-label">Degree</span>
                      <span class="credential-value">{{ degreeDisplay }}</span>
                    </div>
                    <v-icon name="fa-check-circle" class="check-icon" scale="0.8" />
                  </div>
                </div>
                <div class="security-note">
                  <v-icon name="hi-lock-closed" scale="0.7" />
                  Credentials secured via Blockchain & NDPR compliant storage.
                </div>
              </div>
            </div>

            <!-- 3. Availability & Pricing -->
            <div class="review-card">
              <div class="card-header">
                <h3>
                  <v-icon name="ri-calendar-check-line" scale="0.9" />
                  Availability & Pricing
                </h3>
                <button class="edit-btn" @click="goToStep(5)">
                  Edit <v-icon name="hi-pencil" scale="0.6" />
                </button>
              </div>
              <div class="card-content availability-summary">
                <div class="summary-left">
                  <h4>Weekly Schedule</h4>
                  <div class="day-pills">
                    <span
                      v-for="day in weekDays"
                      :key="day.key"
                      class="day-pill"
                      :class="{ active: isDayEnabled(day.key) }"
                    >
                      {{ day.short }}
                    </span>
                  </div>
                  <p class="schedule-time">{{ scheduleTimeDisplay }}</p>
                </div>
                <div class="summary-right">
                  <h4>Service Rates</h4>
                  <div class="rate-rows">
                    <div class="rate-row">
                      <span>Video Consult ({{ slotDuration }}m)</span>
                      <span class="rate-value">{{ formatRate(videoRate) }}</span>
                    </div>
                    <div class="rate-row">
                      <span>Chat Consult</span>
                      <span class="rate-value">{{ formatRate(chatRate) }}</span>
                    </div>
                    <div class="rate-row urgent">
                      <span>Urgent Triage</span>
                      <span class="rate-value">+20%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Payout & Security -->
            <div class="review-card">
              <div class="card-header">
                <h3>
                  <v-icon name="bi-wallet2" scale="0.9" />
                  Payout & Security
                </h3>
                <button class="edit-btn" @click="goToStep(8)">
                  Edit <v-icon name="hi-pencil" scale="0.6" />
                </button>
              </div>
              <div class="card-content payout-summary">
                <div class="bank-info">
                  <div class="bank-icon">
                    <v-icon name="hi-office-building" scale="1" />
                  </div>
                  <div v-if="hasBankAccount">
                    <span class="bank-name">{{ bankDisplay }}</span>
                    <span class="payout-schedule">Scheduled: Weekly (Fridays)</span>
                  </div>
                  <div v-else>
                    <span class="bank-name not-set">No bank account configured</span>
                    <button class="add-bank-btn" @click="showBankModal = true">
                      <v-icon name="hi-plus" scale="0.6" />
                      Add Bank Account
                    </button>
                  </div>
                </div>
                <div class="security-info">
                  <div class="security-item">
                    <span class="security-label">Security</span>
                    <span class="security-value" :class="securityStrength.class">
                      <v-icon name="hi-shield-check" scale="0.6" />
                      {{ securityStrength.label }}
                    </span>
                  </div>
                  <div class="security-item">
                    <span class="security-label">2FA Method</span>
                    <span class="security-value">{{ twoFADisplay }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Readiness Score Sidebar -->
        <aside class="readiness-column">
          <!-- Readiness Score Card -->
          <div class="readiness-card">
            <div class="card-bg-icon">
              <v-icon name="fa-rocket" scale="4" />
            </div>
            <h3 class="readiness-title">Practice Readiness Score</h3>
            <div class="readiness-ring">
              <svg viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" class="ring-bg" />
                <circle cx="64" cy="64" r="56" class="ring-progress" :style="ringStyle" />
              </svg>
              <div class="readiness-value">
                <span class="score-value">{{ readinessScore }}%</span>
                <span class="score-label">{{ readinessLabel }}</span>
              </div>
            </div>
            <div v-if="suggestions.length > 0" class="suggestion-box">
              <v-icon name="hi-exclamation" scale="0.7" />
              <div>
                <strong class="suggestion-count">{{ suggestions.length }} Suggestion{{ suggestions.length > 1 ? 's' : '' }}</strong>
                <p class="suggestion-text">{{ suggestions[0] }}</p>
              </div>
            </div>
          </div>

          <!-- Final Consents -->
          <div class="consents-card">
            <h3>Final Agreements</h3>
            <div class="consent-list">
              <label class="consent-item">
                <input type="checkbox" v-model="localConsents.code_of_conduct" />
                <span>
                  I agree to the <a href="#" @click.prevent="showCodeOfConduct">Code of Conduct</a> for Specialists.
                </span>
              </label>
              <label class="consent-item">
                <input type="checkbox" v-model="localConsents.professional_indemnity" />
                <span>
                  I accept the <a href="#" @click.prevent="showIndemnityTerms">Professional Indemnity Terms</a>.
                </span>
              </label>
            </div>
          </div>

          <!-- Trust Badges -->
          <div class="trust-badges">
            <span class="trust-badge">
              <v-icon name="hi-shield-check" scale="0.6" />
              NDPR
            </span>
            <span class="trust-badge">
              <v-icon name="fa-robot" scale="0.6" />
              AI Verified
            </span>
          </div>
        </aside>
      </div>
    </div>

    <!-- Sticky Footer -->
    <div class="sticky-footer">
      <div class="sticky-footer-inner">
        <button class="back-btn" @click="goToStep(8)">
          <v-icon name="hi-arrow-left" scale="0.8" />
          <span>Back to Security</span>
        </button>
        <div class="footer-right">
          <div v-if="!canActivate" class="action-hint">
            <span class="hint-label">Action Required</span>
            <span class="hint-text">{{ activationHint }}</span>
          </div>
          <button
            class="activate-btn"
            :class="{ enabled: canActivate }"
            :disabled="!canActivate || isActivating"
            @click="activatePractice"
          >
            <span v-if="isActivating">Activating...</span>
            <span v-else>Go Live & Start Practice</span>
            <v-icon name="fa-rocket" scale="0.8" />
          </button>
        </div>
      </div>
    </div>

    <!-- Bank Account Modal -->
    <div v-if="showBankModal" class="modal-overlay" @click.self="showBankModal = false">
      <div class="bank-modal">
        <div class="modal-header">
          <h3>Add Bank Account</h3>
          <button class="close-btn" @click="showBankModal = false">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Select Bank</label>
            <select v-model="bankForm.bank_code" @change="onBankChange">
              <option value="">Choose a bank...</option>
              <option v-for="bank in bankList" :key="bank.code" :value="bank.code">
                {{ bank.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Account Number</label>
            <input
              type="text"
              v-model="bankForm.account_number"
              placeholder="Enter 10-digit account number"
              maxlength="10"
              @input="onAccountNumberChange"
            />
          </div>
          <div v-if="isResolvingAccount" class="resolving-status">
            <div class="mini-spinner"></div>
            <span>Verifying account...</span>
          </div>
          <div v-if="resolvedAccountName && !resolveError" class="resolved-account">
            <v-icon name="fa-check-circle" scale="0.8" />
            <span>{{ resolvedAccountName }}</span>
          </div>
          <div v-if="resolveError" class="resolve-error-section">
            <div class="resolve-error">
              <v-icon name="hi-exclamation-circle" scale="0.8" />
              <span>{{ resolveError }}</span>
            </div>
            <div class="form-group manual-name">
              <label>Account Holder Name <span class="required">*</span></label>
              <input
                type="text"
                v-model="bankForm.account_name"
                placeholder="Enter account holder name"
              />
              <small class="help-text">Enter the name as it appears on your bank account</small>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showBankModal = false">Cancel</button>
          <button
            class="save-btn"
            :disabled="!canSaveBank || isSavingBank"
            @click="saveBankAccount"
          >
            {{ isSavingBank ? 'Saving...' : 'Save Bank Account' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, inject, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useOnboardingState } from './composables/useOnboardingState';

const router = useRouter();
const $http = inject('$http');
const $toast = inject('$toast');

const {
  stepCompletion,
  availability,
  rateCards,
  verification,
  security,
  finalConsents,
  progressPercent,
  goToStep,
  completeStep,
  saveProgress,
} = useOnboardingState();

// Local state
const isLoading = ref(true);
const isActivating = ref(false);
const showBankModal = ref(false);
const localConsents = reactive({
  code_of_conduct: finalConsents.code_of_conduct,
  professional_indemnity: finalConsents.professional_indemnity,
});

// Profile data from API
const profileData = ref(null);
const availabilityData = ref(null);
const bankAccounts = ref([]);

// Bank form state
const bankList = ref([]);
const bankForm = reactive({
  bank_code: '',
  bank_name: '',
  account_number: '',
  account_name: '', // Manual entry when verification fails
});
const isResolvingAccount = ref(false);
const resolvedAccountName = ref('');
const resolveError = ref('');
const isSavingBank = ref(false);

// Week days configuration
const weekDays = [
  { key: 'monday', short: 'M' },
  { key: 'tuesday', short: 'T' },
  { key: 'wednesday', short: 'W' },
  { key: 'thursday', short: 'T' },
  { key: 'friday', short: 'F' },
  { key: 'saturday', short: 'S' },
  { key: 'sunday', short: 'S' },
];

// Computed: Display Name
const displayName = computed(() => {
  const profile = profileData.value?.profile;
  if (profile?.first_name && profile?.last_name) {
    return `Dr. ${profile.first_name} ${profile.last_name}`;
  }
  return 'Not set';
});

// Computed: Profile Photo
const profilePhoto = computed(() => {
  return profileData.value?.profile?.profile_photo || null;
});

// Computed: All Specializations (show all categories)
const allSpecializations = computed(() => {
  const practice = profileData.value?.professional_practice;
  const categories = profileData.value?.specialist_categories;
  const specs = [];

  // Add all specialist categories
  if (categories?.length > 0) {
    categories.forEach(cat => {
      if (cat?.name) specs.push(cat.name);
    });
  }

  // Fallback to professional practice category if no specialist_categories
  if (specs.length === 0 && practice?.category) {
    specs.push(practice.category);
  }

  // Add area of specialty if different
  if (practice?.area_of_specialty && !specs.includes(practice.area_of_specialty)) {
    specs.push(practice.area_of_specialty);
  }

  return specs;
});

// Computed: Languages
const displayLanguages = computed(() => {
  const languages = profileData.value?.languages;
  if (languages?.length > 0) {
    return languages.map(l => l.name || l);
  }

  // Fallback to preferences
  const prefLang = profileData.value?.specialist_preferences?.preferences?.language;
  if (prefLang) {
    return [prefLang];
  }

  return [];
});

// Computed: Truncated Bio
const truncatedBio = computed(() => {
  const bio = profileData.value?.profile?.professional_bio ||
              profileData.value?.professional_practice?.area_of_specialty ||
              'No bio provided yet...';
  return bio.length > 50 ? bio.substring(0, 50) + '...' : bio;
});

// Computed: License Display
const licenseDisplay = computed(() => {
  const iv = profileData.value?.identity_verification;
  const practice = profileData.value?.professional_practice;
  return iv?.medical_license?.license_number ||
         practice?.license_number ||
         verification.medical_license?.license_number ||
         'Not submitted';
});

// Computed: License Verified
const licenseVerified = computed(() => {
  const iv = profileData.value?.identity_verification;
  return iv?.medical_license?.status === 'verified' ||
         verification.medical_license?.status === 'verified';
});

// Computed: Identity Display
const identityDisplay = computed(() => {
  const iv = profileData.value?.identity_verification;
  const type = iv?.government_id?.type || verification.government_id?.type;
  const verified = iv?.government_id?.status === 'verified' ||
                   verification.government_id?.status === 'verified';

  if (type) {
    const typeLabels = {
      'passport': 'Passport',
      'national_id': 'National ID',
      'drivers_license': "Driver's License"
    };
    return verified ? `${typeLabels[type] || type} Verified` : `${typeLabels[type] || type} Pending`;
  }
  return 'Not submitted';
});

// Computed: Identity Verified
const identityVerified = computed(() => {
  const iv = profileData.value?.identity_verification;
  return iv?.government_id?.status === 'verified' ||
         verification.government_id?.status === 'verified';
});

// Computed: Degree Display
const degreeDisplay = computed(() => {
  const university = profileData.value?.professional_practice?.university;
  if (university?.name) {
    return `MBBS (${university.name})`;
  }
  return 'Not provided';
});

// Computed: Is Fully Verified
const isFullyVerified = computed(() => {
  return licenseVerified.value && identityVerified.value;
});

// Computed: Is Day Enabled - reads from time_availability array
const isDayEnabled = (dayKey) => {
  // Map day key to display name
  const dayMap = {
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday',
  };
  const dayName = dayMap[dayKey];

  // Check time_availability array from API
  const timeAvail = availabilityData.value?.time_availability;
  if (timeAvail?.length > 0) {
    return timeAvail.some(slot => slot.day === dayName);
  }

  // Fallback to onboarding state
  return availability.weekly_schedule?.[dayKey]?.enabled || false;
};

// Computed: Schedule Time Display
const scheduleTimeDisplay = computed(() => {
  // Check time_availability array from API
  const timeAvail = availabilityData.value?.time_availability;
  if (timeAvail?.length > 0) {
    // Get the first slot to show time range
    const firstSlot = timeAvail[0];
    if (firstSlot?.start_time && firstSlot?.end_time) {
      return `${formatTime(firstSlot.start_time)} - ${formatTime(firstSlot.end_time)} (WAT)`;
    }
  }

  // Fallback to onboarding state
  const schedule = availability.weekly_schedule;
  for (const [dayName, dayData] of Object.entries(schedule || {})) {
    if (dayData?.enabled && dayData?.start && dayData?.end) {
      return `${formatTime(dayData.start)} - ${formatTime(dayData.end)} (WAT)`;
    }
  }
  return 'Not configured';
});

// Computed: Slot Duration
const slotDuration = computed(() => {
  return availabilityData.value?.preferences?.slot_duration ||
         availability.slot_duration || 30;
});

// Computed: Video Rate
const videoRate = computed(() => {
  // Check rate_cards from specialist_preferences API
  const rateCardsData = availabilityData.value?.rate_cards;
  if (rateCardsData?.video_consultation?.routine_rate) {
    return rateCardsData.video_consultation.routine_rate;
  }

  // Check service_rates from specialist_preferences API
  const serviceRates = availabilityData.value?.service_rates;
  if (serviceRates?.video_consultation?.routine_rate) {
    return serviceRates.video_consultation.routine_rate;
  }

  // Check consultation_rates from profile
  const rates = profileData.value?.consultation_rates;
  if (rates?.length > 0) {
    const videoRateItem = rates.find(r => r.type === 'video' || r.type === 'video_consultation');
    if (videoRateItem?.rate) return videoRateItem.rate;
  }

  // Fallback to onboarding state
  return rateCards.video_consultation?.routine_rate || null;
});

// Computed: Chat Rate
const chatRate = computed(() => {
  // Check rate_cards from specialist_preferences API
  const rateCardsData = availabilityData.value?.rate_cards;
  if (rateCardsData?.chat_consultation?.flat_rate) {
    return rateCardsData.chat_consultation.flat_rate;
  }

  // Check service_rates from specialist_preferences API
  const serviceRates = availabilityData.value?.service_rates;
  if (serviceRates?.chat_consultation?.flat_rate) {
    return serviceRates.chat_consultation.flat_rate;
  }

  // Check consultation_rates from profile
  const rates = profileData.value?.consultation_rates;
  if (rates?.length > 0) {
    const chatRateItem = rates.find(r => r.type === 'chat' || r.type === 'chat_consultation');
    if (chatRateItem?.rate) return chatRateItem.rate;
  }

  // Fallback to onboarding state
  return rateCards.chat_consultation?.flat_rate || null;
});

// Computed: Has Bank Account
const hasBankAccount = computed(() => {
  return bankAccounts.value?.length > 0;
});

// Computed: Bank Display
const bankDisplay = computed(() => {
  if (bankAccounts.value?.length > 0) {
    const defaultBank = bankAccounts.value.find(b => b.is_default) || bankAccounts.value[0];
    const last4 = defaultBank.account_number?.slice(-4) || '****';
    return `${defaultBank.bank_name} •••• ${last4}`;
  }
  return 'Not configured';
});

// Computed: 2FA Display
const twoFADisplay = computed(() => {
  // Check specialist_preferences from availability API
  const twoFactor = availabilityData.value?.two_factor || security.two_factor;

  if (twoFactor?.authenticator_app) return 'Authenticator Active';
  if (twoFactor?.sms) return 'SMS Active';
  if (twoFactor?.email) return 'Email Active';
  return 'Not configured';
});

// Computed: Security Strength
const securityStrength = computed(() => {
  // Check specialist_preferences from availability API
  const twoFactor = availabilityData.value?.two_factor || security.two_factor;

  let score = 0;
  if (twoFactor?.email) score += 1;
  if (twoFactor?.sms) score += 2;
  if (twoFactor?.authenticator_app) score += 3;

  if (score >= 3) return { label: 'Strong', class: 'strong' };
  if (score >= 1) return { label: 'Medium', class: 'medium' };
  return { label: 'Weak', class: 'weak' };
});

// Computed: Readiness Score - Calculate based on actual data completeness
const readinessScore = computed(() => {
  let score = 0;
  const maxScore = 100;

  // Profile completeness (25 points)
  if (profileData.value?.profile?.first_name && profileData.value?.profile?.last_name) score += 5;
  if (profileData.value?.profile?.profile_photo) score += 5;
  if (profileData.value?.professional_practice?.category) score += 5;
  if (displayLanguages.value.length > 0) score += 5;
  if (profileData.value?.profile?.professional_bio || profileData.value?.professional_practice?.area_of_specialty) score += 5;

  // Credentials (25 points)
  if (licenseVerified.value) score += 15;
  else if (licenseDisplay.value !== 'Not submitted') score += 5;
  if (identityVerified.value) score += 10;
  else if (identityDisplay.value !== 'Not submitted') score += 3;

  // Availability (20 points)
  const timeAvail = availabilityData.value?.time_availability;
  if (timeAvail?.length > 0) {
    // Count unique days with availability
    const uniqueDays = new Set(timeAvail.map(slot => slot.day));
    score += Math.min(20, uniqueDays.size * 4);
  } else if (availability.weekly_schedule) {
    // Fallback to onboarding state
    const enabledDays = Object.values(availability.weekly_schedule).filter(d => d?.enabled).length;
    score += Math.min(20, enabledDays * 4);
  }

  // Rates (15 points)
  if (videoRate.value) score += 10;
  if (chatRate.value) score += 5;

  // Bank Account (10 points)
  if (hasBankAccount.value) score += 10;

  // Security (5 points)
  const twoFactor = availabilityData.value?.two_factor || security.two_factor;
  if (twoFactor?.email || twoFactor?.sms || twoFactor?.authenticator_app) score += 5;

  return Math.min(maxScore, score);
});

// Computed: Readiness Label
const readinessLabel = computed(() => {
  if (readinessScore.value >= 90) return 'Excellent';
  if (readinessScore.value >= 70) return 'Good';
  if (readinessScore.value >= 50) return 'Fair';
  return 'Needs Work';
});

// Computed: Ring Style for SVG
const ringStyle = computed(() => {
  const circumference = 2 * Math.PI * 56;
  const offset = circumference - (readinessScore.value / 100) * circumference;
  return {
    strokeDasharray: `${circumference}`,
    strokeDashoffset: offset,
  };
});

// Computed: Suggestions - Based on what's missing
const suggestions = computed(() => {
  const items = [];

  if (!profileData.value?.profile?.profile_photo) {
    items.push('Add a professional profile photo to increase patient trust by 60%.');
  }

  if (displayLanguages.value.length === 0) {
    items.push('Add the languages you speak to match with more patients.');
  }

  const timeAvail = availabilityData.value?.time_availability;
  const enabledDays = timeAvail?.length > 0
    ? new Set(timeAvail.map(slot => slot.day)).size
    : Object.values(availability.weekly_schedule || {}).filter(d => d?.enabled).length;
  if (enabledDays < 3) {
    items.push('Add more availability days to increase patient matching opportunities.');
  }

  if (!videoRate.value && !chatRate.value) {
    items.push('Set your consultation rates to start accepting bookings.');
  }

  if (!hasBankAccount.value) {
    items.push('Add your bank account to receive payments for consultations.');
  }

  if (!licenseVerified.value) {
    items.push('Complete your credential verification to build patient confidence.');
  }

  return items;
});

// Computed: All Steps Complete
const allStepsComplete = computed(() => {
  return stepCompletion.profileConfig &&
         stepCompletion.availability &&
         stepCompletion.rateCards &&
         stepCompletion.verification &&
         stepCompletion.security;
});

// Computed: Can Activate
const canActivate = computed(() => {
  return localConsents.code_of_conduct && localConsents.professional_indemnity;
});

// Computed: Activation Hint
const activationHint = computed(() => {
  if (!localConsents.code_of_conduct && !localConsents.professional_indemnity) {
    return 'Accept all terms to activate';
  }
  if (!localConsents.code_of_conduct) {
    return 'Accept Code of Conduct';
  }
  if (!localConsents.professional_indemnity) {
    return 'Accept Indemnity Terms';
  }
  return '';
});

// Computed: Can Save Bank - allow with verified name OR manual entry
const canSaveBank = computed(() => {
  const hasBasicInfo = bankForm.bank_code && bankForm.account_number?.length === 10;
  const hasVerifiedName = resolvedAccountName.value && !resolveError.value;
  const hasManualName = resolveError.value && bankForm.account_name?.trim().length > 2;

  return hasBasicInfo && (hasVerifiedName || hasManualName);
});

// Helper: Format Time
const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes || '00'} ${ampm}`;
};

// Helper: Format Rate
const formatRate = (rate) => {
  if (!rate) return '---';
  return `₦${Number(rate).toLocaleString()}`;
};

// Bank methods
const onBankChange = () => {
  const selectedBank = bankList.value.find(b => b.code === bankForm.bank_code);
  bankForm.bank_name = selectedBank?.name || '';
  resolvedAccountName.value = '';
  resolveError.value = '';

  if (bankForm.account_number?.length === 10) {
    resolveAccount();
  }
};

const onAccountNumberChange = () => {
  resolvedAccountName.value = '';
  resolveError.value = '';

  if (bankForm.account_number?.length === 10 && bankForm.bank_code) {
    resolveAccount();
  }
};

const resolveAccount = async () => {
  if (!bankForm.bank_code || bankForm.account_number?.length !== 10) return;

  isResolvingAccount.value = true;
  resolveError.value = '';
  resolvedAccountName.value = '';

  try {
    const response = await $http.$_resolveBankAccount({
      account_number: bankForm.account_number,
      bank_code: bankForm.bank_code,
    });
    resolvedAccountName.value = response.data?.data?.account_name || response.data?.account_name || 'Account verified';
  } catch (error) {
    resolveError.value = error.response?.data?.message || 'Could not verify account. Please check details.';
  } finally {
    isResolvingAccount.value = false;
  }
};

const saveBankAccount = async () => {
  if (!canSaveBank.value) return;

  // Use verified name if available, otherwise use manual entry
  const accountName = resolvedAccountName.value && !resolveError.value
    ? resolvedAccountName.value
    : bankForm.account_name.trim();

  isSavingBank.value = true;
  try {
    await $http.$_addBankAccount({
      bank_code: bankForm.bank_code,
      bank_name: bankForm.bank_name,
      account_number: bankForm.account_number,
      account_name: accountName,
      recipient_type: 'nuban', // Nigerian bank account type
    });

    $toast.success('Bank account added successfully');
    showBankModal.value = false;

    // Refresh bank accounts
    await loadBankAccounts();

    // Reset form
    bankForm.bank_code = '';
    bankForm.bank_name = '';
    bankForm.account_number = '';
    bankForm.account_name = '';
    resolvedAccountName.value = '';
    resolveError.value = '';
  } catch (error) {
    $toast.error(error.response?.data?.message || 'Failed to add bank account');
  } finally {
    isSavingBank.value = false;
  }
};

// Show Code of Conduct modal
const showCodeOfConduct = () => {
  $toast.info('Code of Conduct document would open here');
};

// Show Indemnity Terms modal
const showIndemnityTerms = () => {
  $toast.info('Professional Indemnity Terms would open here');
};

// Activate Practice
const activatePractice = async () => {
  if (!canActivate.value) return;

  isActivating.value = true;
  try {
    // Save final consents to preferences
    const payload = {
      final_consents: {
        code_of_conduct: localConsents.code_of_conduct,
        professional_indemnity: localConsents.professional_indemnity,
        accepted_at: new Date().toISOString(),
      },
    };

    await $http.$_specialistPreference(payload);

    // Update local state
    finalConsents.code_of_conduct = localConsents.code_of_conduct;
    finalConsents.professional_indemnity = localConsents.professional_indemnity;

    // Mark review step as complete
    completeStep('review');
    saveProgress();

    $toast.success('Congratulations! Your practice is now live.');

    // Redirect to specialist dashboard
    setTimeout(() => {
      router.push({ name: 'SpecialistDashboard' });
    }, 1500);
  } catch (error) {
    console.error('Failed to activate practice:', error);
    $toast.error('Failed to activate. Please try again.');
    isActivating.value = false;
  }
};

// Load bank accounts
const loadBankAccounts = async () => {
  try {
    const response = await $http.$_userBankAccounts();
    bankAccounts.value = response.data?.data || response.data || [];
  } catch (error) {
    console.error('Failed to load bank accounts:', error);
  }
};

// Load bank list
const loadBankList = async () => {
  try {
    const response = await $http.$_getBankLists();
    bankList.value = response.data?.data || response.data || [];
  } catch (error) {
    console.error('Failed to load bank list:', error);
  }
};

// Load data on mount
onMounted(async () => {
  try {
    // Fetch all data in parallel
    const [profileRes, availabilityRes] = await Promise.all([
      $http.$_getCurrentUser(),
      $http.$_getSpecialistAvailability().catch(() => ({ data: null })),
    ]);

    profileData.value = profileRes.data?.data || profileRes.data;
    availabilityData.value = availabilityRes.data?.data || availabilityRes.data;

    // Load bank accounts and bank list
    await Promise.all([
      loadBankAccounts(),
      loadBankList(),
    ]);

    // Sync local consents with store
    localConsents.code_of_conduct = finalConsents.code_of_conduct;
    localConsents.professional_indemnity = finalConsents.professional_indemnity;
  } catch (error) {
    console.error('Failed to load profile:', error);
    $toast.error('Failed to load profile data');
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped lang="scss">
.review-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #F8FAFC;
}

.loading-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.loading-overlay p {
  color: #64748B;
  font-size: 0.875rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E2E8F0;
  border-top-color: #4FC3F7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.page-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  padding-bottom: 8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-content {
  max-width: 1400px;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 2rem;
  align-items: flex-start;
}

.review-column {
  flex: 1 1 0%;
  min-width: 0;
  max-width: 100%;
}

@media (min-width: 1024px) {
  .review-column {
    max-width: calc(100% - 352px);
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0;
  max-width: 500px;
}

.completion-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.review-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.2s;
}

.review-card:hover {
  border-color: #4FC3F7;
  box-shadow: 0 4px 20px -5px rgba(79, 195, 247, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #FAFAFA;
  border-bottom: 1px solid #F1F5F9;
}

.card-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0;
  flex: 1;
}

.card-header h3 svg {
  color: #94A3B8;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: #D1FAE5;
  color: #059669;
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 9999px;
  border: 1px solid #A7F3D0;
}

.pending-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: #FEF3C7;
  color: #D97706;
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 9999px;
  border: 1px solid #FDE68A;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: rgba(79, 195, 247, 0.1);
  border: 1px solid rgba(79, 195, 247, 0.3);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #4FC3F7;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #4FC3F7;
  color: white;
}

.card-content {
  padding: 1.25rem;
}

.profile-summary {
  display: flex;
  gap: 1.25rem;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 0.75rem;
  background: #F1F5F9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  flex-shrink: 0;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-details {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem 1.5rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.detail-row .label {
  font-size: 0.625rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.detail-row .value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1E293B;
}

.detail-row .value .sub-specialty {
  font-weight: 400;
  color: #64748B;
}

.detail-row .value.truncate {
  font-weight: 400;
  color: #64748B;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.language-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tag {
  padding: 0.125rem 0.5rem;
  background: #F1F5F9;
  color: #64748B;
  font-size: 0.625rem;
  font-weight: 500;
  border-radius: 0.25rem;
}

.tag.empty {
  color: #94A3B8;
  font-style: italic;
}

.specialization-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.spec-tag {
  padding: 0.25rem 0.625rem;
  background: linear-gradient(135deg, #E1F5FE 0%, #F3E5F5 100%);
  color: #1A365D;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: 9999px;
  border: 1px solid rgba(79, 195, 247, 0.2);
}

.spec-tag.empty {
  background: #F1F5F9;
  color: #94A3B8;
  font-style: italic;
}

.credentials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.credential-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 0.5rem;
}

.credential-icon {
  width: 32px;
  height: 32px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
}

.credential-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
}

.credential-value {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
}

.check-icon {
  margin-left: auto;
  color: #4CAF50;
}

.pending-icon {
  margin-left: auto;
  color: #F59E0B;
}

.security-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.625rem;
  color: #94A3B8;
}

.availability-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.summary-left,
.summary-right {
  padding-right: 1.5rem;
}

.summary-right {
  border-left: 1px solid #F1F5F9;
  padding-left: 1.5rem;
  padding-right: 0;
}

.availability-summary h4 {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  margin: 0 0 0.5rem 0;
}

.day-pills {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.day-pill {
  width: 24px;
  height: 24px;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  background: #F1F5F9;
  color: #94A3B8;
}

.day-pill.active {
  background: #4FC3F7;
  color: white;
}

.schedule-time {
  font-size: 0.75rem;
  color: #64748B;
  margin: 0;
}

.rate-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rate-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748B;
}

.rate-value {
  font-weight: 700;
  color: #1A365D;
}

.rate-row.urgent .rate-value {
  color: #FF9800;
}

.payout-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bank-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bank-icon {
  width: 40px;
  height: 40px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
}

.bank-name {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1E293B;
}

.bank-name.not-set {
  color: #94A3B8;
  font-weight: 500;
}

.add-bank-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #4FC3F7;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.add-bank-btn:hover {
  background: #0288D1;
}

.payout-schedule {
  display: block;
  font-size: 0.625rem;
  color: #94A3B8;
}

.security-info {
  display: flex;
  gap: 1.5rem;
}

.security-item {
  text-align: right;
}

.security-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
}

.security-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
}

.security-value.strong {
  color: #4CAF50;
}

.security-value.medium {
  color: #FF9800;
}

.security-value.weak {
  color: #EF4444;
}

/* Readiness Column - Right Sidebar */
.readiness-column {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 2rem;
  align-self: flex-start;
}

/* Hide on mobile, show on desktop */
@media (max-width: 1023px) {
  .page-content {
    flex-direction: column;
  }

  .review-column {
    max-width: 100%;
    order: 1;
  }

  .readiness-column {
    width: 100%;
    position: static;
    order: 2;
    margin-top: 1.5rem;
  }
}

.readiness-card {
  background: linear-gradient(135deg, #1A365D 0%, #0F172A 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.card-bg-icon {
  position: absolute;
  right: -1.5rem;
  top: -1.5rem;
  color: rgba(255, 255, 255, 0.05);
}

.readiness-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
  position: relative;
}

.readiness-ring {
  position: relative;
  width: 128px;
  height: 128px;
  margin: 0 auto 1rem;
}

.readiness-ring svg {
  transform: rotate(-90deg);
}

.ring-bg {
  fill: transparent;
  stroke: #334155;
  stroke-width: 8;
}

.ring-progress {
  fill: transparent;
  stroke: #4CAF50;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.readiness-value {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
}

.score-label {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
}

.suggestion-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  text-align: left;
}

.suggestion-box svg {
  color: #FF9800;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.suggestion-count {
  display: block;
  font-size: 0.75rem;
  color: white;
}

.suggestion-text {
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0.25rem 0 0 0;
  line-height: 1.4;
}

.consents-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.25rem;
}

.consents-card h3 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 1rem 0;
}

.consent-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.consent-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.consent-item input {
  width: 20px;
  height: 20px;
  accent-color: #4FC3F7;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.consent-item span {
  font-size: 0.75rem;
  color: #64748B;
  line-height: 1.5;
}

.consent-item a {
  color: #4FC3F7;
  font-weight: 700;
  text-decoration: none;
}

.consent-item a:hover {
  text-decoration: underline;
}

.trust-badges {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0.7;
}

.trust-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 700;
  color: #64748B;
}

.trust-badge svg:first-child {
  color: #4CAF50;
}

/* Sticky Footer */
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
}

.sticky-footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1400px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #F8FAFC;
  color: #1E293B;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.action-hint {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.hint-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #FF9800;
  animation: pulse 2s infinite;
}

.hint-text {
  font-size: 0.625rem;
  color: #94A3B8;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.activate-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: #CBD5E1;
  color: #94A3B8;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: not-allowed;
  transition: all 0.2s;
}

.activate-btn.enabled {
  background: #FF9800;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 152, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); }
}

.activate-btn.enabled:hover {
  background: #F57C00;
}

.activate-btn:disabled {
  cursor: not-allowed;
}

/* Bank Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.bank-modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  margin: 1rem;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #E2E8F0;
}

.modal-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #64748B;
  cursor: pointer;
  padding: 0.25rem;
}

.close-btn:hover {
  color: #1A365D;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748B;
  margin-bottom: 0.5rem;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1A365D;
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: #4FC3F7;
  box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.1);
}

.resolving-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  color: #64748B;
  font-size: 0.75rem;
}

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #E2E8F0;
  border-top-color: #4FC3F7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.resolved-account {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #D1FAE5;
  color: #059669;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.resolve-error-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.resolve-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #FEF3C7;
  color: #B45309;
  border-radius: 0.5rem;
  font-size: 0.75rem;
}

.form-group.manual-name {
  margin-bottom: 0;
}

.form-group .required {
  color: #DC2626;
}

.form-group .help-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.6875rem;
  color: #94A3B8;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #E2E8F0;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #F8FAFC;
}

.save-btn {
  padding: 0.5rem 1rem;
  background: #4FC3F7;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
}

.save-btn:hover:not(:disabled) {
  background: #0288D1;
}

.save-btn:disabled {
  background: #CBD5E1;
  cursor: not-allowed;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .page-scroll {
    padding: 1rem;
    padding-bottom: 6rem;
  }

  .page-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .profile-summary {
    flex-direction: column;
    gap: 1rem;
  }

  .profile-details {
    grid-template-columns: 1fr;
  }

  .credentials-grid {
    grid-template-columns: 1fr;
  }

  .availability-summary {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .summary-right {
    border-left: none;
    border-top: 1px solid #F1F5F9;
    padding-left: 0;
    padding-top: 1rem;
  }

  .payout-summary {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .security-info {
    width: 100%;
    justify-content: space-between;
  }

  .sticky-footer {
    padding: 0.75rem 1rem;
    left: 0;
  }

  .sticky-footer-inner {
    width: 100%;
  }

  .back-btn span {
    display: none;
  }

  .action-hint {
    display: none;
  }

  .activate-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.8125rem;
  }
}
</style>
