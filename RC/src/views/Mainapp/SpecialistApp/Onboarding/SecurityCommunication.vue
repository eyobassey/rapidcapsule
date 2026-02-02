<template>
  <div class="security-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading preferences...</p>
    </div>

    <div v-else class="page-scroll">
      <div class="page-content">
        <div class="form-column">
          <!-- Page Header -->
          <div class="page-header">
            <div class="header-left">
              <h1 class="page-title">Security & Communication Preferences</h1>
              <p class="page-subtitle">Configure how we protect your account and how you want to be notified about patient appointments and updates.</p>
            </div>
            <div class="secure-badge">
              <v-icon name="hi-lock-closed" scale="0.7" />
              <span>Secure Configuration</span>
            </div>
          </div>

          <!-- Two-Factor Authentication -->
          <div class="settings-card">
            <div class="card-header">
              <h2 class="card-title">
                <v-icon name="hi-shield-check" scale="1" />
                Two-Factor Authentication (2FA)
              </h2>
              <p class="card-description">Add an extra layer of security to your account.</p>
            </div>

            <div class="option-list">
              <!-- Email Verification (Recommended) -->
              <div class="option-item" :class="{ active: security.two_factor.email }">
                <div class="option-info">
                  <div class="option-icon">
                    <v-icon name="hi-mail" scale="1" />
                  </div>
                  <div>
                    <h4>Email Verification</h4>
                    <p>Code sent to your email address</p>
                  </div>
                </div>
                <div class="option-actions">
                  <span class="recommended-badge">Recommended</span>
                  <label class="toggle">
                    <input type="checkbox" v-model="security.two_factor.email" />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              <!-- Authenticator App -->
              <div class="option-item" :class="{ active: security.two_factor.authenticator_app }">
                <div class="option-info">
                  <div class="option-icon">
                    <v-icon name="hi-device-mobile" scale="1" />
                  </div>
                  <div>
                    <h4>Authenticator App</h4>
                    <p>Google Auth, Authy, or similar</p>
                  </div>
                </div>
                <label class="toggle">
                  <input type="checkbox" v-model="security.two_factor.authenticator_app" />
                  <span class="slider"></span>
                </label>
              </div>
              <!-- SMS Verification -->
              <div class="option-item" :class="{ active: security.two_factor.sms }">
                <div class="option-info">
                  <div class="option-icon">
                    <v-icon name="hi-chat" scale="1" />
                  </div>
                  <div>
                    <h4>SMS Verification</h4>
                    <p>Code sent to your phone number</p>
                  </div>
                </div>
                <label class="toggle">
                  <input type="checkbox" v-model="security.two_factor.sms" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Notification Preferences -->
          <div class="settings-card">
            <div class="card-header with-action">
              <div>
                <h2 class="card-title">
                  <v-icon name="hi-bell" scale="1" class="orange-icon" />
                  Notification Preferences
                </h2>
                <p class="card-description">Choose how you want to be alerted for different events.</p>
              </div>
              <button class="test-alert-btn" @click="sendTestAlert">Send Test Alert</button>
            </div>

            <div class="notification-matrix">
              <div class="matrix-header">
                <span class="matrix-label">Event Type</span>
                <span class="channel-header">Email</span>
                <span class="channel-header">SMS</span>
                <span class="channel-header">Push</span>
                <span class="channel-header">WhatsApp</span>
              </div>

              <!-- New Appointment -->
              <div class="matrix-row">
                <div class="matrix-event">
                  <span class="event-name">New Appointment</span>
                  <span class="event-desc">When a patient books a slot</span>
                </div>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.new_appointment.email" />
                </label>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.new_appointment.sms" />
                </label>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.new_appointment.push" />
                </label>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.new_appointment.whatsapp" />
                </label>
              </div>

              <!-- Urgent Triage -->
              <div class="matrix-row urgent">
                <div class="matrix-event">
                  <div class="event-name-row">
                    <span class="event-name">Urgent Triage Match</span>
                    <span class="pulse-dot"></span>
                  </div>
                  <span class="event-desc">High priority AI matches</span>
                </div>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.urgent_triage.email" disabled />
                </label>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.urgent_triage.sms" disabled />
                </label>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.urgent_triage.push" disabled />
                </label>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.urgent_triage.whatsapp" />
                </label>
              </div>

              <!-- Earnings -->
              <div class="matrix-row">
                <div class="matrix-event">
                  <span class="event-name">Earnings & Payouts</span>
                  <span class="event-desc">Weekly summaries & alerts</span>
                </div>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.earnings.email" />
                </label>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.earnings.sms" />
                </label>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.earnings.push" />
                </label>
                <label class="matrix-checkbox">
                  <input type="checkbox" v-model="security.notifications.earnings.whatsapp" />
                </label>
              </div>
            </div>
          </div>

          <!-- Consultation Channels & Language -->
          <div class="settings-card">
            <div class="card-header">
              <h2 class="card-title">
                <v-icon name="hi-phone" scale="1" />
                Consultation Channels & Language
              </h2>
              <p class="card-description">Integrate your preferred tools and languages for patient interaction.</p>
            </div>

            <div class="channels-section">
              <label class="section-label">Active Integration Channels</label>
              <div class="channel-grid">
                <!-- Rapid Video (Default) -->
                <div class="channel-card active">
                  <div class="channel-check">
                    <v-icon name="hi-check-circle" scale="0.8" />
                  </div>
                  <div class="channel-icon rapid">
                    <v-icon name="hi-video-camera" scale="1" />
                  </div>
                  <div class="channel-name">Rapid Video</div>
                  <div class="channel-desc">Native Secure Call</div>
                </div>

                <!-- Zoom -->
                <div
                  class="channel-card clickable"
                  :class="{ connected: security.channels.zoom }"
                  @click="security.channels.zoom = !security.channels.zoom"
                >
                  <div v-if="security.channels.zoom" class="channel-check">
                    <v-icon name="hi-check-circle" scale="0.8" />
                  </div>
                  <div class="channel-icon zoom">
                    <v-icon name="hi-video-camera" scale="1" />
                  </div>
                  <div class="channel-name">Zoom Meeting</div>
                  <div class="channel-desc">{{ security.channels.zoom ? 'Connected' : 'Click to Connect' }}</div>
                </div>

                <!-- WhatsApp -->
                <div
                  class="channel-card clickable"
                  :class="{ connected: security.channels.whatsapp }"
                  @click="security.channels.whatsapp = !security.channels.whatsapp"
                >
                  <div v-if="security.channels.whatsapp" class="channel-check">
                    <v-icon name="hi-check-circle" scale="0.8" />
                  </div>
                  <div class="channel-icon whatsapp">
                    <v-icon name="fa-whatsapp" scale="1.2" />
                  </div>
                  <div class="channel-name">WhatsApp</div>
                  <div class="channel-desc">{{ security.channels.whatsapp ? 'Connected' : 'Connect Account' }}</div>
                </div>
              </div>
            </div>

            <div class="languages-section">
              <label class="section-label">Preferred Communication Languages</label>
              <div class="language-tags">
                <span
                  v-for="(lang, index) in security.communication_languages"
                  :key="index"
                  class="language-tag"
                  :class="{ primary: index === 0 }"
                >
                  {{ lang }}
                  <button class="remove-lang" @click="removeLanguage(index)" v-if="security.communication_languages.length > 1">
                    <v-icon name="hi-x" scale="0.6" />
                  </button>
                </span>
                <div class="add-language-wrapper" v-if="showAddLanguage">
                  <select class="language-select" v-model="selectedLanguage" @change="addLanguage">
                    <option value="">Select language...</option>
                    <option
                      v-for="lang in availableLanguagesFiltered"
                      :key="lang._id"
                      :value="lang.name"
                    >
                      {{ lang.name }} ({{ lang.native_name }})
                    </option>
                  </select>
                  <button class="cancel-add-btn" @click="showAddLanguage = false">
                    <v-icon name="hi-x" scale="0.7" />
                  </button>
                </div>
                <button v-else class="add-language-btn" @click="openLanguageSelector">
                  + Add Language
                </button>
              </div>
            </div>
          </div>

          <!-- Data Privacy & Compliance -->
          <div class="settings-card">
            <div class="card-header">
              <h2 class="card-title">
                <v-icon name="hi-document-check" scale="1" />
                Data Privacy & Compliance
              </h2>
              <p class="card-description">NDPR & GDPR inspired controls for data handling.</p>
            </div>

            <div class="consent-list">
              <label class="consent-item">
                <div class="checkbox-wrapper">
                  <input type="checkbox" v-model="security.privacy_consents.ndpr" />
                  <span class="custom-checkbox">
                    <v-icon name="fa-check" scale="0.6" />
                  </span>
                </div>
                <div class="consent-text">
                  I consent to the processing of my personal and professional data in accordance with the
                  <a href="#" class="link">NDPR Policy</a>.
                </div>
              </label>
              <label class="consent-item">
                <div class="checkbox-wrapper">
                  <input type="checkbox" v-model="security.privacy_consents.ai_processing" />
                  <span class="custom-checkbox">
                    <v-icon name="fa-check" scale="0.6" />
                  </span>
                </div>
                <div class="consent-text">
                  I agree to allow Rapid Capsule's AI to process anonymized patient data during my consultations for
                  <a href="#" class="link">Triage Optimization</a>.
                </div>
              </label>
            </div>

            <div class="info-box">
              <v-icon name="hi-information-circle" scale="0.8" />
              <p>Your data is encrypted at rest and in transit. You can download a copy of your data or request deletion from the Settings menu after activation.</p>
            </div>
          </div>
        </div>

        <!-- Right Sidebar -->
        <aside class="score-column">
          <!-- Security Score Card -->
          <div class="security-score-card">
            <div class="score-watermark">
              <v-icon name="hi-shield-check" scale="4" />
            </div>
            <div class="score-content">
              <h3 class="score-label">Account Security Score</h3>
              <div class="score-display">
                <span class="score-value" :class="scoreClass">{{ scoreLabel }}</span>
                <span class="score-status">/ Protected</span>
              </div>

              <div class="score-breakdown">
                <div class="score-item active">
                  <v-icon name="hi-check-circle" scale="0.7" />
                  <span>Strong Password</span>
                </div>
                <div class="score-item" :class="{ active: is2FAEnabled }">
                  <v-icon name="hi-check-circle" scale="0.7" />
                  <span>2FA Enabled {{ twoFactorMethod }}</span>
                </div>
                <div class="score-item" :class="{ active: isIdentityVerified }">
                  <v-icon name="hi-check-circle" scale="0.7" />
                  <span>Identity {{ isIdentityVerified ? 'Verified' : 'Pending' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Patient View Preview -->
          <div class="preview-card">
            <h4>Patient View Preview</h4>
            <div class="preview-content">
              <div class="preview-doctor">
                <div class="doctor-avatar">
                  <img :src="profilePhoto" alt="Doctor" />
                </div>
                <div class="doctor-info">
                  <div class="doctor-name">{{ displayName }}</div>
                  <div class="doctor-specialty">{{ specialty }}</div>
                </div>
              </div>
              <div class="preview-channels">
                <span class="preview-channel active">
                  <v-icon name="hi-video-camera" scale="0.6" />
                  Video
                </span>
                <span class="preview-channel" :class="{ active: security.channels.zoom }">
                  <v-icon name="hi-video-camera" scale="0.6" />
                  Zoom
                </span>
                <span class="preview-channel" :class="{ active: security.channels.whatsapp }">
                  <v-icon name="hi-chat" scale="0.6" />
                  Chat
                </span>
              </div>
              <div class="preview-languages">
                <v-icon name="hi-globe-alt" scale="0.7" />
                <span>Speaks: {{ displayLanguages }}</span>
              </div>
            </div>
            <p class="preview-note">This is how patients will see your availability options.</p>
          </div>

          <!-- Help Box -->
          <div class="help-box">
            <v-icon name="hi-question-mark-circle" scale="0.9" />
            <div>
              <h4>Why enable WhatsApp?</h4>
              <p>Many patients in low-bandwidth areas prefer WhatsApp for text-based consultations. It can increase your reach by 40%.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Sticky Footer -->
    <div v-if="!isLoading" class="sticky-footer">
      <div class="sticky-footer-inner">
        <button class="draft-btn" @click="saveDraft" :disabled="isSaving">
          {{ isSaving ? 'Saving...' : 'Save as Draft' }}
        </button>
        <div class="footer-right">
          <span v-if="!isOnboardingComplete" class="next-hint">Next: Review & Activation</span>
          <button class="continue-btn" @click="saveAndContinue" :disabled="isSaving">
            {{ isSaving ? 'Saving...' : (isOnboardingComplete ? 'Save Changes' : 'Save & Continue') }}
            <v-icon v-if="!isSaving && !isOnboardingComplete" name="hi-arrow-right" scale="0.8" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toast-notification';
import { useOnboardingState } from './composables/useOnboardingState';

const store = useStore();
const $toast = useToast();
const $http = inject('$http');
const { security, completeStep, goToStep, saveProgress, progressPercent, stepCompletion } = useOnboardingState();

// Check if onboarding is complete (editing mode)
const isOnboardingComplete = computed(() => {
  return progressPercent.value >= 100 || stepCompletion.review;
});

const showAddLanguage = ref(false);
const isLoading = ref(false);
const isSaving = ref(false);
const availableLanguages = ref([]);
const selectedLanguage = ref('');

// Load preferences from backend on mount
onMounted(async () => {
  // Refresh user profile to get latest data with populated languages
  await store.dispatch('initializeUser');
  await loadPreferences();
});

const loadPreferences = async () => {
  isLoading.value = true;
  try {
    // Load specialist preferences
    const response = await $http.$_getSpecialistAvailability();
    if (response?.data?.data) {
      const prefs = response.data.data;

      // Map backend data to local security state
      if (prefs.two_factor) {
        Object.assign(security.two_factor, prefs.two_factor);
      }
      if (prefs.notifications) {
        Object.assign(security.notifications, prefs.notifications);
      }
      if (prefs.channels) {
        Object.assign(security.channels, prefs.channels);
      }
      if (prefs.privacy_consents) {
        Object.assign(security.privacy_consents, prefs.privacy_consents);
      }
    }

    // Load languages from user profile (populated language objects)
    const profile = userProfile.value;
    if (profile?.languages && profile.languages.length > 0) {
      // Languages are now populated objects with 'name' field
      const langNames = profile.languages
        .map(lang => typeof lang === 'object' ? lang.name : lang)
        .filter(Boolean);
      if (langNames.length > 0) {
        security.communication_languages = langNames;
      }
    }
  } catch (error) {
    console.error('Failed to load preferences:', error);
    // Use defaults from composable if load fails
  } finally {
    isLoading.value = false;
  }
};

// Initialize default languages if empty
if (!security.communication_languages || security.communication_languages.length === 0) {
  security.communication_languages = ['English'];
}

// Initialize email 2FA if not exists
if (security.two_factor.email === undefined) {
  security.two_factor.email = true; // Default enabled as recommended
}

// 2FA computed properties
const is2FAEnabled = computed(() => {
  return security.two_factor.email || security.two_factor.sms || security.two_factor.authenticator_app;
});

const twoFactorMethod = computed(() => {
  if (security.two_factor.email) return '(Email)';
  if (security.two_factor.sms) return '(SMS)';
  if (security.two_factor.authenticator_app) return '(App)';
  return '';
});

// User profile data
const userProfile = computed(() => store.getters['userprofile']);

const profilePhoto = computed(() => {
  return userProfile.value?.profile?.profile_photo ||
         'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg';
});

const displayName = computed(() => {
  const profile = userProfile.value?.profile;
  if (profile?.first_name && profile?.last_name) {
    return `Dr. ${profile.first_name} ${profile.last_name}`;
  }
  return 'Dr. Specialist';
});

const specialty = computed(() => {
  // Try specialist categories first, then fall back to professional_practice
  const categories = userProfile.value?.specialist_categories;
  if (categories && categories.length > 0) {
    return categories.map(c => c.name).join(', ');
  }
  return userProfile.value?.professional_practice?.area_of_specialty || 'General Practitioner';
});

const displayLanguages = computed(() => {
  if (security.communication_languages && security.communication_languages.length > 0) {
    return security.communication_languages.join(', ');
  }
  return 'English';
});

// Identity verification status
const isIdentityVerified = computed(() => {
  const verification = userProfile.value?.identity_verification;
  return verification?.overall_status === 'verified' ||
         (verification?.government_id?.status === 'verified' &&
          verification?.medical_license?.status === 'verified');
});

// Security score calculations
const securityScore = computed(() => {
  let score = 30; // Base score for having account
  if (security.two_factor.email) score += 15;
  if (security.two_factor.sms) score += 10;
  if (security.two_factor.authenticator_app) score += 15;
  if (security.privacy_consents.ndpr) score += 10;
  if (security.privacy_consents.ai_processing) score += 5;
  if (isIdentityVerified.value) score += 15;
  return Math.min(100, score);
});

const scoreClass = computed(() => {
  if (securityScore.value >= 80) return 'high';
  if (securityScore.value >= 50) return 'medium';
  return 'low';
});

const scoreLabel = computed(() => {
  if (securityScore.value >= 80) return 'High';
  if (securityScore.value >= 50) return 'Good';
  return 'Low';
});

// Filtered languages (exclude already selected)
const availableLanguagesFiltered = computed(() => {
  return availableLanguages.value.filter(
    lang => !security.communication_languages.includes(lang.name)
  );
});

// Load available languages from API
const loadAvailableLanguages = async () => {
  try {
    const response = await $http.$_getLanguages();
    if (response?.data?.data) {
      availableLanguages.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};

// Actions
const openLanguageSelector = async () => {
  if (availableLanguages.value.length === 0) {
    await loadAvailableLanguages();
  }
  showAddLanguage.value = true;
};

const addLanguage = () => {
  if (selectedLanguage.value && !security.communication_languages.includes(selectedLanguage.value)) {
    security.communication_languages.push(selectedLanguage.value);
    selectedLanguage.value = '';
    showAddLanguage.value = false;
  }
};

const removeLanguage = (index) => {
  if (security.communication_languages.length > 1) {
    security.communication_languages.splice(index, 1);
  }
};

const sendTestAlert = () => {
  $toast.info('Test notification sent!');
};

// Build payload for saving to backend
const buildPayload = () => {
  return {
    two_factor: {
      email: security.two_factor.email,
      sms: security.two_factor.sms,
      authenticator_app: security.two_factor.authenticator_app,
    },
    notifications: {
      new_appointment: { ...security.notifications.new_appointment },
      urgent_triage: { ...security.notifications.urgent_triage },
      earnings: { ...security.notifications.earnings },
    },
    channels: {
      rapid_video: true, // Always enabled
      zoom: security.channels.zoom,
      whatsapp: security.channels.whatsapp,
    },
    communication_languages: [...security.communication_languages],
    privacy_consents: {
      ndpr: security.privacy_consents.ndpr,
      ai_processing: security.privacy_consents.ai_processing,
    },
  };
};

const saveDraft = async () => {
  isSaving.value = true;
  try {
    const payload = buildPayload();
    await $http.$_specialistPreference(payload);
    saveProgress(); // Also save to localStorage
    $toast.success('Draft saved successfully');
  } catch (error) {
    console.error('Failed to save draft:', error);
    $toast.error('Failed to save draft. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

const saveAndContinue = async () => {
  isSaving.value = true;
  try {
    const payload = buildPayload();
    await $http.$_specialistPreference(payload);

    // Mark step as complete FIRST (this also saves to localStorage)
    completeStep('security');

    $toast.success('Settings saved successfully');

    // If onboarding is complete, stay on page. Otherwise, continue to next step.
    if (!isOnboardingComplete.value) {
      // Small delay to ensure reactive state updates before navigation
      await nextTick();
      goToStep(9);
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    $toast.error('Failed to save settings. Please try again.');
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped lang="scss">
.security-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: #F8FAFC;
  width: 100%;
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
  padding: 2rem;
  padding-bottom: 6rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-content {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 2rem;
  max-width: 1400px;
  align-items: flex-start;
  width: 100%;
}

.form-column {
  flex: 1 1 0%;
  min-width: 0;
  max-width: calc(100% - 352px); /* 320px sidebar + 32px gap */
}

@media (max-width: 1024px) {
  .page-content {
    flex-direction: column;
    flex-wrap: nowrap;
  }

  .form-column {
    max-width: 100%;
    width: 100%;
    order: 1;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 0.5rem 0;
  font-family: 'Poppins', system-ui, sans-serif;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0;
  max-width: 600px;
}

.secure-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #EFF6FF;
  color: #1D4ED8;
  border: 1px solid #BFDBFE;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.settings-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  overflow: hidden;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  padding: 1.25rem 1.5rem;
  background: #F8FAFC;
  border-bottom: 1px solid #F1F5F9;
}

.card-header.with-action {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0;
}

.card-title svg {
  color: #4FC3F7;
}

.card-title .orange-icon {
  color: #FF9800;
}

.card-description {
  font-size: 0.75rem;
  color: #64748B;
  margin: 0.25rem 0 0 1.5rem;
}

.test-alert-btn {
  background: none;
  border: none;
  color: #4FC3F7;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.test-alert-btn:hover {
  text-decoration: underline;
}

/* Option Items (2FA) */
.option-list {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.option-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.option-item.active {
  border-color: #4FC3F7;
  background: #F0F9FF;
}

.option-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.option-icon {
  width: 40px;
  height: 40px;
  background: #F1F5F9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
}

.option-info h4 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
}

.option-info p {
  font-size: 0.75rem;
  color: #64748B;
  margin: 0;
}

.option-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.recommended-badge {
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  background: #D1FAE5;
  color: #059669;
  border-radius: 4px;
}

/* Toggle Switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle .slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #CBD5E1;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle .slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle input:checked + .slider {
  background-color: #4FC3F7;
}

.toggle input:checked + .slider:before {
  transform: translateX(20px);
}

/* Notification Matrix */
.notification-matrix {
  overflow: hidden;
}

.matrix-header {
  display: grid;
  grid-template-columns: 1fr repeat(4, 70px);
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #F8FAFC;
  border-bottom: 1px solid #F1F5F9;
}

.matrix-header .matrix-label {
  font-size: 0.625rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.channel-header {
  font-size: 0.625rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}

.matrix-row {
  display: grid;
  grid-template-columns: 1fr repeat(4, 70px);
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #F1F5F9;
  transition: background 0.2s;
}

.matrix-row:hover {
  background: #F8FAFC;
}

.matrix-row:last-child {
  border-bottom: none;
}

.matrix-row.urgent {
  background: #FEF2F2;
}

.matrix-row.urgent:hover {
  background: #FEE2E2;
}

.matrix-event {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.event-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.event-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.event-desc {
  font-size: 0.75rem;
  color: #64748B;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #EF4444;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.matrix-checkbox {
  display: flex;
  justify-content: center;
}

.matrix-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: #4FC3F7;
  cursor: pointer;
}

.matrix-checkbox input:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

/* Consultation Channels */
.channels-section {
  padding: 1.5rem;
  border-bottom: 1px solid #F1F5F9;
}

.section-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 1rem;
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.channel-card {
  position: relative;
  padding: 1rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.channel-card.clickable {
  cursor: pointer;
}

.channel-card.clickable:hover {
  border-color: #4FC3F7;
  transform: translateY(-2px);
}

.channel-card.active {
  border-color: #4FC3F7;
  background: #F0F9FF;
}

.channel-card.connected {
  border-color: #4FC3F7;
  background: #F0F9FF;
}

.channel-check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: #4FC3F7;
}

.channel-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 0.75rem;
}

.channel-icon.rapid {
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
}

.channel-icon.zoom {
  background: #2D8CFF;
}

.channel-icon.whatsapp {
  background: #25D366;
}

.channel-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
}

.channel-desc {
  font-size: 0.75rem;
  color: #94A3B8;
  margin-top: 0.125rem;
}

/* Languages Section */
.languages-section {
  padding: 1.5rem;
}

.language-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.language-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #F1F5F9;
  color: #475569;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.language-tag.primary {
  background: #4FC3F7;
  color: white;
}

.remove-lang {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  display: flex;
  align-items: center;
}

.remove-lang:hover {
  opacity: 1;
}

.add-language-btn {
  padding: 0.375rem 0.75rem;
  background: none;
  border: 1px dashed #CBD5E1;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.2s;
}

.add-language-btn:hover {
  border-color: #4FC3F7;
  color: #4FC3F7;
}

.add-language-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.language-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #CBD5E1;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: #334155;
  background: white;
  cursor: pointer;
  min-width: 180px;
}

.language-select:focus {
  outline: none;
  border-color: #4FC3F7;
  box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.2);
}

.cancel-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #F1F5F9;
  border: none;
  border-radius: 50%;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-add-btn:hover {
  background: #E2E8F0;
  color: #EF4444;
}

/* Privacy Consents */
.consent-list {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.consent-item {
  display: flex;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-wrapper {
  position: relative;
  flex-shrink: 0;
}

.checkbox-wrapper input {
  position: absolute;
  opacity: 0;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #CBD5E1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: white;
}

.custom-checkbox svg {
  color: white;
  opacity: 0;
}

.checkbox-wrapper input:checked + .custom-checkbox {
  background: #4FC3F7;
  border-color: #4FC3F7;
}

.checkbox-wrapper input:checked + .custom-checkbox svg {
  opacity: 1;
}

.consent-text {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.5;
}

.consent-text .link {
  color: #4FC3F7;
  font-weight: 600;
  text-decoration: none;
}

.consent-text .link:hover {
  text-decoration: underline;
}

.info-box {
  display: flex;
  gap: 0.75rem;
  margin: 0 1.5rem 1.5rem;
  padding: 1rem;
  background: #EFF6FF;
  border-radius: 0.75rem;
}

.info-box svg {
  color: #3B82F6;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-box p {
  font-size: 0.75rem;
  color: #1E40AF;
  margin: 0;
  line-height: 1.5;
}

/* Right Sidebar */
.score-column {
  width: 320px;
  min-width: 320px;
  flex-shrink: 0;
  flex-grow: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 2rem;
  height: fit-content;
}

@media (max-width: 1024px) {
  .score-column {
    display: flex;
    position: relative;
    top: 0;
    width: 100%;
    min-width: 100%;
    margin-top: 1.5rem;
    order: 2;
  }
}

.security-score-card {
  background: linear-gradient(135deg, #1A365D 0%, #0F172A 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.score-watermark {
  position: absolute;
  right: -20px;
  bottom: -20px;
  opacity: 0.05;
  color: white;
}

.score-content {
  position: relative;
  z-index: 1;
}

.score-label {
  font-size: 0.625rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem 0;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.score-value {
  font-size: 2.5rem;
  font-weight: 700;
}

.score-value.high {
  color: #4CAF50;
}

.score-value.medium {
  color: #FF9800;
}

.score-value.low {
  color: #EF4444;
}

.score-status {
  font-size: 0.875rem;
  color: #94A3B8;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.score-item span {
  color: #CBD5E1;
}

.score-item svg {
  flex-shrink: 0;
  color: #64748B;
}

.score-item.active span {
  color: #CBD5E1;
}

.score-item.active svg {
  color: white;
}

/* Preview Card */
.preview-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.25rem;
}

.preview-card h4 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 1rem 0;
}

.preview-content {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 1rem;
}

.preview-doctor {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.doctor-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #E2E8F0;
}

.doctor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.doctor-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1E293B;
}

.doctor-specialty {
  font-size: 0.625rem;
  color: #64748B;
}

.preview-channels {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.preview-channel {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 4px;
  font-size: 0.625rem;
  color: #64748B;
}

.preview-channel.active {
  color: #4FC3F7;
}

.preview-channel.active svg {
  color: #4FC3F7;
}

.preview-languages {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding-top: 0.5rem;
  border-top: 1px solid #E2E8F0;
  font-size: 0.625rem;
  color: #64748B;
}

.preview-languages svg {
  color: #94A3B8;
}

.preview-note {
  font-size: 0.625rem;
  color: #94A3B8;
  text-align: center;
  margin: 0.75rem 0 0 0;
}

/* Help Box */
.help-box {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #FFF7ED;
  border: 1px solid #FFEDD5;
  border-radius: 0.75rem;
}

.help-box > svg {
  color: #F97316;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.help-box h4 {
  font-size: 0.75rem;
  font-weight: 700;
  color: #C2410C;
  margin: 0 0 0.25rem 0;
}

.help-box p {
  font-size: 0.6875rem;
  color: #475569;
  margin: 0;
  line-height: 1.4;
}

/* Sticky Footer */
.sticky-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-top: 1px solid #E2E8F0;
  position: fixed;
  bottom: 0;
  left: 260px;
  right: 0;
  z-index: 100;
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
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  color: #64748B;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.draft-btn:hover {
  background: #F1F5F9;
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
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  transition: all 0.2s;
}

.continue-btn:hover:not(:disabled) {
  background: #F57C00;
  box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
}

.continue-btn:disabled,
.draft-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .page-scroll {
    padding: 0;
    padding-bottom: 8rem;
  }

  .page-content {
    flex-direction: column;
  }

  .form-column {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    padding: 1rem;
    background: white;
    margin-bottom: 1rem;
  }

  .secure-badge {
    align-self: flex-start;
    margin-top: 0.5rem;
  }

  .channel-grid {
    grid-template-columns: 1fr;
  }

  .matrix-header,
  .matrix-row {
    grid-template-columns: 1fr repeat(4, 50px);
  }

  .channel-header {
    font-size: 0.5rem;
  }

  .next-hint {
    display: none;
  }

  .sticky-footer {
    left: 0;
    padding: 1rem;
  }

  .sticky-footer-inner {
    width: 100%;
  }

  .continue-btn {
    padding: 0.75rem 1.5rem;
  }
}

/* Mobile Full Width Fix */
@media screen and (max-width: 1024px) {
  .security-page {
    width: 100vw !important;
    max-width: 100vw !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: white !important;
    position: relative !important;
    left: 0 !important;
    right: 0 !important;
  }

  .page-scroll {
    background: white !important;
  }

  .settings-card {
    border-radius: 0.75rem;
    margin-left: 0;
    margin-right: 0;
  }
}
</style>
