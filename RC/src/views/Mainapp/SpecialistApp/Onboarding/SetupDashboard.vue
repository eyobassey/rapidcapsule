<template>
  <div class="setup-dashboard">
    <!-- Scrollable Content -->
    <div class="dashboard-scroll">
      <div class="dashboard-container">
        <!-- Left Column: Welcome & Cards -->
        <div class="main-column">
          <!-- Welcome Section -->
          <div class="welcome-section">
            <div class="welcome-content">
              <h1 class="welcome-title">Welcome, {{ userName }}!</h1>
              <p class="welcome-text">
                Let's get your practice set up. Complete the steps below to start accepting patients.
              </p>
            </div>
            <div class="welcome-badge" v-if="progressPercent < 100">
              <v-icon name="hi-lightning-bolt" scale="0.8" />
              <span>{{ remainingSteps }} steps remaining</span>
            </div>
          </div>

          <!-- Mobile Quick Actions -->
          <div class="mobile-quick-actions">
            <button class="draft-btn">
              Save Draft
            </button>
            <button class="resume-btn" @click="goToNextStep">
              Resume Setup
              <v-icon name="hi-arrow-right" scale="0.7" />
            </button>
          </div>

          <!-- Outstanding Requirements Alert (Mobile) -->
          <div class="outstanding-alert" v-if="remainingSteps > 0">
            <div class="alert-icon">
              <v-icon name="hi-exclamation" scale="0.9" />
            </div>
            <div class="alert-content">
              <h3>Outstanding Requirements</h3>
              <p>You have <strong>{{ remainingMandatorySteps }} mandatory steps</strong> remaining before you can go live.</p>
            </div>
          </div>

          <!-- Setup Cards Grid -->
          <div class="cards-grid">
            <!-- Profile Configuration -->
            <SetupCard
              title="Profile Configuration"
              description="Add your bio, languages, and specializations"
              icon="hi-user-circle"
              :status="getCardStatus('profileConfig')"
              :badge="getCardStatus('profileConfig') === 'pending' ? 'Next Step' : ''"
              badge-type="info"
              :progress="getProgress('profileConfig')"
              @click="goToStep(4)"
            />

            <!-- Availability Setup -->
            <SetupCard
              title="Availability Setup"
              description="Set your working hours and consultation slots"
              icon="ri-calendar-check-line"
              :status="getCardStatus('availability')"
              :summary="availabilitySummary"
              @click="goToStep(5)"
            />

            <!-- Rate Cards -->
            <SetupCard
              title="Rate Cards"
              description="Configure your consultation fees and services"
              icon="bi-currency-dollar"
              :status="getCardStatus('rateCards')"
              :summary="ratesSummary"
              @click="goToStep(6)"
            />

            <!-- Identity & Compliance -->
            <SetupCard
              title="Identity & Compliance"
              description="Verify your medical credentials and ID"
              icon="hi-shield-check"
              :status="getCardStatus('verification')"
              badge="Mandatory"
              badge-type="mandatory"
              :progress="verificationProgress"
              @click="goToStep(7)"
            />

            <!-- Security & Communication -->
            <SetupCard
              title="Security & Communication"
              description="Set up 2FA and notification preferences"
              icon="hi-lock-closed"
              :status="getCardStatus('security')"
              :summary="securitySummary"
              @click="goToStep(8)"
            />

            <!-- Review & Activation -->
            <SetupCard
              title="Review & Activation"
              description="Final review before going live"
              icon="fa-rocket"
              :status="stepCompletion.review ? 'completed' : (isVerificationComplete ? 'pending' : 'locked')"
              :badge="stepCompletion.review ? '' : (isVerificationComplete ? 'Final Step' : 'Locked')"
              :badge-type="stepCompletion.review ? '' : (isVerificationComplete ? 'success' : 'warning')"
              @click="isVerificationComplete && goToStep(9)"
            />
          </div>
        </div>

        <!-- Right Column: Progress & Tips -->
        <div class="side-column">
          <!-- Progress Card -->
          <div class="progress-card">
            <div class="progress-card-header">
              <h3>Setup Progress</h3>
              <span class="estimated-time" v-if="progressPercent < 100">
                <v-icon name="hi-clock" scale="0.7" />
                ~15 min remaining
              </span>
            </div>
            <div class="progress-ring-wrapper">
              <ProgressRing
                :percent="progressPercent"
                :size="120"
                :stroke-width="10"
                :progress-color="progressColor"
              >
                <div class="progress-center">
                  <span class="progress-value">{{ progressPercent }}%</span>
                  <span class="progress-label">Complete</span>
                </div>
              </ProgressRing>
            </div>
            <div class="progress-checklist">
              <div
                v-for="item in checklistItems"
                :key="item.key"
                class="checklist-item"
                :class="{ completed: stepCompletion[item.key] }"
              >
                <div class="checklist-icon">
                  <v-icon
                    :name="stepCompletion[item.key] ? 'fa-check' : 'fa-circle'"
                    :scale="stepCompletion[item.key] ? 0.6 : 0.3"
                  />
                </div>
                <span>{{ item.label }}</span>
              </div>
            </div>
          </div>

          <!-- WhatsApp Verification Card -->
          <div class="whatsapp-card" v-if="!whatsappVerified">
            <div class="whatsapp-icon">
              <v-icon name="fa-whatsapp" scale="1.2" />
            </div>
            <div class="whatsapp-content">
              <h4>Get Alerts on WhatsApp</h4>
              <p>Receive instant notifications about new bookings</p>
              <button class="whatsapp-btn">
                <v-icon name="hi-plus" scale="0.7" />
                Connect WhatsApp
              </button>
            </div>
          </div>

          <!-- AI Tip Card -->
          <div class="tip-card">
            <div class="tip-icon">
              <v-icon name="hi-light-bulb" scale="1" />
            </div>
            <div class="tip-content">
              <h4>Pro Tip</h4>
              <p>
                Specialists who complete their profile with a professional photo
                and detailed bio receive <strong>3x more bookings</strong> in their first month.
              </p>
            </div>
          </div>

          <!-- Support Card -->
          <div class="support-card">
            <v-icon name="hi-chat" scale="1" />
            <div class="support-content">
              <span class="support-title">Need help?</span>
              <span class="support-text">Our team is here 24/7</span>
            </div>
            <button class="support-btn">Chat</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import SetupCard from './components/SetupCard.vue';
import ProgressRing from './components/ProgressRing.vue';
import { useOnboardingState } from './composables/useOnboardingState';

const store = useStore();
const {
  stepCompletion,
  progressPercent,
  isVerificationComplete,
  verification,
  availability,
  rateCards,
  security,
  weeklyHours,
  goToStep,
} = useOnboardingState();

const whatsappVerified = ref(false);

const userProfile = computed(() => store.getters['userprofile']);

const userName = computed(() => {
  const profile = userProfile.value?.profile;
  if (profile?.first_name) {
    return `Dr. ${profile.first_name}`;
  }
  return 'Doctor';
});

const remainingSteps = computed(() => {
  const keys = ['profileConfig', 'availability', 'rateCards', 'verification', 'security', 'review'];
  return keys.filter(k => !stepCompletion[k]).length;
});

const remainingMandatorySteps = computed(() => {
  // Verification is mandatory
  const mandatoryKeys = ['verification', 'profileConfig'];
  return mandatoryKeys.filter(k => !stepCompletion[k]).length;
});

const goToNextStep = () => {
  // Find first incomplete step and navigate to it
  const order = ['profileConfig', 'availability', 'rateCards', 'verification', 'security'];
  const stepMap = {
    profileConfig: 4,
    availability: 5,
    rateCards: 6,
    verification: 7,
    security: 8,
  };
  for (const k of order) {
    if (!stepCompletion[k]) {
      goToStep(stepMap[k]);
      return;
    }
  }
  // All done, go to review
  goToStep(9);
};

const progressColor = computed(() => {
  if (progressPercent.value >= 80) return '#4CAF50';
  if (progressPercent.value >= 50) return '#4FC3F7';
  return '#FF9800';
});

// Card status helpers
const getCardStatus = (key) => {
  if (stepCompletion[key]) return 'completed';

  // First incomplete step is "current"
  const order = ['profileConfig', 'availability', 'rateCards', 'verification', 'security'];
  for (const k of order) {
    if (!stepCompletion[k]) {
      return k === key ? 'current' : 'pending';
    }
  }
  return 'pending';
};

const getProgress = (key) => {
  // Return null for completed items
  if (stepCompletion[key]) return null;

  // Calculate partial progress based on filled fields
  switch (key) {
    case 'profileConfig':
      let profileFields = 0;
      const profile = userProfile.value?.profile || {};
      if (profile.professional_bio) profileFields++;
      if (profile.languages?.length) profileFields++;
      if (profile.professional_practice?.area_of_specialty) profileFields++;
      return Math.round((profileFields / 3) * 100);
    default:
      return 0;
  }
};

// Verification progress
const verificationProgress = computed(() => {
  if (stepCompletion.verification) return null;

  let completed = 0;
  if (verification.government_id.status === 'verified') completed++;
  if (verification.medical_license.status === 'verified') completed++;
  return Math.round((completed / 2) * 100);
});

// Summary helpers
const availabilitySummary = computed(() => {
  if (!stepCompletion.availability) return null;
  return [
    { icon: 'hi-clock', text: `${weeklyHours.value} hrs/week` },
    { icon: 'hi-calendar', text: 'Mon-Fri' },
  ];
});

const ratesSummary = computed(() => {
  if (!stepCompletion.rateCards) return null;
  const rate = rateCards.video_consultation.routine_rate;
  return [
    { icon: 'bi-currency-dollar', text: rate ? `₦${rate.toLocaleString()}/session` : 'Not set' },
  ];
});

const securitySummary = computed(() => {
  if (!stepCompletion.security) return null;
  return [
    { icon: 'hi-shield-check', text: security.two_factor.sms ? '2FA Enabled' : '2FA Off' },
  ];
});

// Checklist items
const checklistItems = [
  { key: 'profileConfig', label: 'Profile configured' },
  { key: 'availability', label: 'Availability set' },
  { key: 'rateCards', label: 'Rates defined' },
  { key: 'verification', label: 'Identity verified' },
  { key: 'security', label: 'Security configured' },
  { key: 'review', label: 'Review & Activation' },
];
</script>

<style scoped lang="scss">
.setup-dashboard {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
}

.dashboard-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  width: 100%;
  display: flex;
  justify-content: center; // Center the container
}

.dashboard-container {
  width: 100%;
  max-width: 1400px;
  display: flex;
  gap: 2rem;
}

.main-column {
  flex: 1;
  min-width: 0;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1A365D;
  font-family: 'Poppins', system-ui, sans-serif;
  margin: 0 0 0.5rem 0;
}

.welcome-text {
  font-size: 0.9375rem;
  color: #64748B;
  margin: 0;
  max-width: 500px;
}

.welcome-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #FFF3E0;
  color: #F57C00;
  border-radius: 2rem;
  font-size: 0.8125rem;
  font-weight: 600;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.side-column {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .dashboard-container {
    flex-direction: column;
  }

  .side-column {
    display: none; // Progress is now in mobile drawer
  }

  .dashboard-scroll {
    padding: 1rem;
  }

  .welcome-title {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  .welcome-text {
    font-size: 0.8125rem;
  }

  .welcome-badge {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }

  .cards-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

.progress-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid #E2E8F0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.progress-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.progress-card-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0;
}

.estimated-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #64748B;
}

.progress-ring-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.progress-center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1A365D;
}

.progress-label {
  font-size: 0.75rem;
  color: #64748B;
}

.progress-checklist {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #64748B;
}

.checklist-item.completed {
  color: #4CAF50;
}

.checklist-item.completed span {
  text-decoration: line-through;
  color: #94A3B8;
}

.checklist-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F1F5F9;
  color: #94A3B8;
}

.checklist-item.completed .checklist-icon {
  background: #4CAF50;
  color: white;
}

.whatsapp-card {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  border-radius: 1rem;
  padding: 1.25rem;
  color: white;
  display: flex;
  gap: 1rem;
}

.whatsapp-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.whatsapp-content h4 {
  font-size: 0.9375rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.whatsapp-content p {
  font-size: 0.8125rem;
  opacity: 0.9;
  margin: 0 0 0.75rem 0;
}

.whatsapp-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: white;
  color: #128C7E;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.whatsapp-btn:hover {
  background: #F0FDF4;
  transform: translateY(-1px);
}

.tip-card {
  background: #FFF7ED;
  border: 1px solid #FDBA74;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
}

.tip-icon {
  width: 40px;
  height: 40px;
  background: #FFEDD5;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #EA580C;
  flex-shrink: 0;
}

.tip-content h4 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #9A3412;
  margin: 0 0 0.375rem 0;
}

.tip-content p {
  font-size: 0.8125rem;
  color: #78350F;
  margin: 0;
  line-height: 1.5;
}

.support-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.support-card > svg {
  color: #4FC3F7;
}

.support-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.support-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1A365D;
}

.support-text {
  font-size: 0.75rem;
  color: #64748B;
}

.support-btn {
  padding: 0.5rem 1rem;
  background: #4FC3F7;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.support-btn:hover {
  background: #0288D1;
}

/* Mobile Quick Actions */
.mobile-quick-actions {
  display: none;
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (max-width: 1024px) {
    display: flex;
  }
}

.draft-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F8FAFC;
    border-color: #CBD5E1;
  }
}

.resume-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #FF9800;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  transition: all 0.2s;

  &:hover {
    background: #F57C00;
  }
}

/* Outstanding Alert */
.outstanding-alert {
  display: none;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #FFF3E0;
  border: 1px solid rgba(255, 152, 0, 0.2);
  border-radius: 0.75rem;
  margin-bottom: 1rem;

  @media (max-width: 1024px) {
    display: flex;
  }
}

.alert-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F57C00;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 0.75rem;
    font-weight: 700;
    color: #F57C00;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.6875rem;
    color: #64748B;
    margin: 0;
    line-height: 1.4;

    strong {
      color: #334155;
    }
  }
}
</style>
