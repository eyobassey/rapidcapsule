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
                Let's set up your health profile. Complete the steps below to get personalized care.
              </p>
            </div>
            <div class="welcome-badge" v-if="progressPercent < 100">
              <v-icon name="hi-lightning-bolt" scale="0.8" />
              <span>{{ remainingSteps }} steps remaining</span>
            </div>
          </div>

          <!-- Mobile Quick Actions -->
          <div class="mobile-quick-actions">
            <button class="draft-btn" @click="saveDraft">
              Save Draft
            </button>
            <button class="resume-btn" @click="goToNextStep">
              Resume Setup
              <v-icon name="hi-arrow-right" scale="0.7" />
            </button>
          </div>

          <!-- Outstanding Requirements Alert (Mobile) -->
          <div class="outstanding-alert" v-if="!requiredStepsCompleted">
            <div class="alert-icon">
              <v-icon name="hi-exclamation" scale="0.9" />
            </div>
            <div class="alert-content">
              <h3>Required Steps</h3>
              <p>Complete <strong>Personal Details</strong> and <strong>Emergency Contact</strong> to access all features.</p>
            </div>
          </div>

          <!-- Setup Cards Grid -->
          <div class="cards-grid">
            <!-- Personal Details - Required -->
            <SetupCard
              title="Personal Details"
              description="Add your basic information, date of birth, and contact details"
              icon="hi-user"
              :status="getCardStatus('personalDetails')"
              badge="Required"
              badge-type="required"
              :progress="getProgress('personalDetails')"
              @click="goToStep(2)"
            />

            <!-- Address & Emergency Contact - Required -->
            <SetupCard
              title="Address & Emergency Contact"
              description="Add your address and emergency contact information"
              icon="hi-location-marker"
              :status="getCardStatus('addressEmergency')"
              badge="Required"
              badge-type="required"
              :progress="getProgress('addressEmergency')"
              @click="goToStep(3)"
            />

            <!-- Dependants - Optional -->
            <SetupCard
              title="Dependants & Family"
              description="Add family members you manage health for"
              icon="hi-users"
              :status="getCardStatus('dependants')"
              badge="Optional"
              badge-type="optional"
              :summary="dependantsSummary"
              @click="goToStep(4)"
            />

            <!-- Vitals & Metrics - Optional -->
            <SetupCard
              title="Vitals & Health Metrics"
              description="Record your height, weight, blood pressure, and other vitals"
              icon="hi-heart"
              :status="getCardStatus('vitalsMetrics')"
              badge="Optional"
              badge-type="optional"
              :summary="vitalsSummary"
              @click="goToStep(5)"
            />

            <!-- Allergies - Optional but Important -->
            <SetupCard
              title="Allergies & Drug Reactions"
              description="Document any allergies to medications, foods, or environment"
              icon="hi-exclamation-triangle"
              :status="getCardStatus('allergies')"
              :badge="allergies.has_allergies ? 'Has Allergies' : 'Optional'"
              :badge-type="allergies.has_allergies ? 'warning' : 'optional'"
              :summary="allergiesSummary"
              @click="goToStep(6)"
            />

            <!-- Medical History - Optional -->
            <SetupCard
              title="Medical History"
              description="Add chronic conditions, past surgeries, medications, and family history"
              icon="hi-document-text"
              :status="getCardStatus('medicalHistory')"
              badge="Optional"
              badge-type="optional"
              :summary="medicalHistorySummary"
              @click="goToStep(7)"
            />

            <!-- Device Integration - Optional -->
            <SetupCard
              title="Devices & Health Apps"
              description="Connect fitness trackers, health apps, and monitoring devices"
              icon="hi-device-mobile"
              :status="getCardStatus('deviceIntegration')"
              badge="Optional"
              badge-type="optional"
              :summary="devicesSummary"
              @click="goToStep(8)"
            />

            <!-- Wallet & Credits - Optional -->
            <SetupCard
              title="Wallet & AI Credits"
              description="Fund your wallet and purchase AI health summary credits"
              icon="hi-sparkles"
              :status="getCardStatus('walletCredits')"
              badge="Optional"
              badge-type="optional"
              :summary="walletCreditsSummary"
              @click="goToStep(9)"
            />
          </div>
        </div>

        <!-- Right Column: Progress & Tips -->
        <div class="side-column">
          <!-- Progress Card -->
          <div class="progress-card">
            <div class="progress-card-header">
              <h3>Profile Progress</h3>
              <span class="status-badge" :class="onboardingStatus.key">
                {{ onboardingStatus.label }}
              </span>
            </div>
            <div class="progress-ring-wrapper">
              <ProgressRing
                :percent="progressPercent"
                :size="120"
                :stroke-width="10"
                :progress-color="progressColor"
                bg-color="#E2E8F0"
              >
                <div class="progress-center">
                  <span class="progress-value">{{ progressPercent }}%</span>
                  <span class="progress-label">Complete</span>
                </div>
              </ProgressRing>
            </div>
            <div class="progress-timeline">
              <div
                v-for="(item, index) in checklistItems"
                :key="item.key"
                class="timeline-item"
                :class="{
                  completed: stepCompletion[item.key],
                  current: isCurrentStep(item.key),
                  required: item.required
                }"
                @click="goToStep(item.stepNumber)"
              >
                <!-- Connecting line -->
                <div
                  v-if="index < checklistItems.length - 1"
                  class="timeline-line"
                  :class="{ completed: stepCompletion[item.key] }"
                />
                <!-- Step indicator -->
                <div class="timeline-indicator">
                  <v-icon v-if="stepCompletion[item.key]" name="fa-check" scale="0.5" />
                  <div v-else-if="isCurrentStep(item.key)" class="current-pulse" />
                  <span v-else class="step-num">{{ index + 1 }}</span>
                </div>
                <!-- Label -->
                <span class="timeline-label">{{ item.label }}</span>
                <span v-if="item.required && !stepCompletion[item.key]" class="required-badge">Required</span>
              </div>
            </div>
          </div>

          <!-- Health Tips Card -->
          <div class="tip-card">
            <div class="tip-icon">
              <v-icon name="hi-light-bulb" scale="1" />
            </div>
            <div class="tip-content">
              <h4>Health Tip</h4>
              <p>
                Patients with complete health profiles receive
                <strong>more accurate diagnoses</strong> and
                <strong>personalized treatment plans</strong>.
              </p>
            </div>
          </div>

          <!-- Emergency Info Card -->
          <div class="emergency-card" v-if="!stepCompletion.addressEmergency">
            <div class="emergency-icon">
              <v-icon name="hi-phone" scale="1" />
            </div>
            <div class="emergency-content">
              <h4>Emergency Contact</h4>
              <p>Add an emergency contact so we can reach someone on your behalf if needed.</p>
              <button class="emergency-btn" @click="goToStep(3)">
                <v-icon name="hi-plus" scale="0.7" />
                Add Contact
              </button>
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
import { usePatientOnboardingState } from './composables/usePatientOnboardingState';

const store = useStore();
const {
  stepCompletion,
  progressPercent,
  requiredStepsCompleted,
  onboardingStatus,
  dependants,
  vitalsMetrics,
  allergies,
  medicalHistory,
  deviceIntegration,
  walletCredits,
  bmi,
  bmiCategory,
  goToStep,
  saveProgress,
} = usePatientOnboardingState();

// Note: User profile initialization is handled in the parent index.vue
const userProfile = computed(() => store.getters['userprofile']);

const userName = computed(() => {
  const profile = userProfile.value?.profile;
  if (profile?.first_name) {
    return profile.first_name;
  }
  return 'there';
});

const remainingSteps = computed(() => {
  const keys = ['personalDetails', 'addressEmergency', 'dependants', 'vitalsMetrics', 'allergies', 'medicalHistory', 'deviceIntegration', 'walletCredits'];
  return keys.filter(k => !stepCompletion[k]).length;
});

const goToNextStep = () => {
  // Find first incomplete required step first, then optional
  const requiredOrder = ['personalDetails', 'addressEmergency'];
  const optionalOrder = ['dependants', 'vitalsMetrics', 'allergies', 'medicalHistory', 'deviceIntegration', 'walletCredits'];
  const stepMap = {
    personalDetails: 2,
    addressEmergency: 3,
    dependants: 4,
    vitalsMetrics: 5,
    allergies: 6,
    medicalHistory: 7,
    deviceIntegration: 8,
    walletCredits: 9,
  };

  // Check required first
  for (const k of requiredOrder) {
    if (!stepCompletion[k]) {
      goToStep(stepMap[k]);
      return;
    }
  }

  // Then optional
  for (const k of optionalOrder) {
    if (!stepCompletion[k]) {
      goToStep(stepMap[k]);
      return;
    }
  }
};

const saveDraft = () => {
  saveProgress();
  // TODO: Show toast notification
};

const progressColor = computed(() => {
  if (progressPercent.value >= 80) return '#10B981';
  if (progressPercent.value >= 50) return '#4FC3F7';
  return '#F59E0B';
});

// Card status helpers
const getCardStatus = (key) => {
  if (stepCompletion[key]) return 'completed';

  // First incomplete required step is "current"
  const requiredOrder = ['personalDetails', 'addressEmergency'];
  for (const k of requiredOrder) {
    if (!stepCompletion[k]) {
      return k === key ? 'current' : 'pending';
    }
  }

  // Then check optional
  const optionalOrder = ['dependants', 'vitalsMetrics', 'allergies', 'medicalHistory', 'deviceIntegration', 'walletCredits'];
  for (const k of optionalOrder) {
    if (!stepCompletion[k]) {
      return k === key ? 'current' : 'pending';
    }
  }

  return 'pending';
};

const getProgress = (key) => {
  if (stepCompletion[key]) return null;

  // Calculate partial progress based on filled fields
  switch (key) {
    case 'personalDetails':
      let personalFields = 0;
      const profile = userProfile.value?.profile || {};
      if (profile.first_name) personalFields++;
      if (profile.last_name) personalFields++;
      if (profile.date_of_birth) personalFields++;
      if (profile.gender) personalFields++;
      if (profile.contact?.phone?.number) personalFields++;
      return Math.round((personalFields / 5) * 100);
    case 'addressEmergency':
      let addressFields = 0;
      const contacts = userProfile.value?.emergency_contacts || [];
      if (contacts.length > 0) addressFields += 50;
      const contact = userProfile.value?.profile?.contact || {};
      if (contact.address1) addressFields += 25;
      if (contact.state) addressFields += 25;
      return addressFields;
    default:
      return 0;
  }
};

// Summary helpers
const dependantsSummary = computed(() => {
  if (!stepCompletion.dependants) return null;
  const count = dependants.dependants?.length || 0;
  return [
    { icon: 'hi-users', text: `${count} dependant${count !== 1 ? 's' : ''} added` },
  ];
});

const vitalsSummary = computed(() => {
  if (!stepCompletion.vitalsMetrics) return null;
  const items = [];
  if (bmi.value) {
    items.push({ icon: 'hi-scale', text: `BMI: ${bmi.value} (${bmiCategory.value?.label})` });
  }
  if (vitalsMetrics.height) {
    items.push({ icon: 'hi-arrow-up', text: `${vitalsMetrics.height} cm` });
  }
  return items.length > 0 ? items : null;
});

const allergiesSummary = computed(() => {
  if (!stepCompletion.allergies) return null;
  if (allergies.has_allergies === false) {
    return [{ icon: 'hi-shield-check', text: 'No known allergies' }];
  }
  const totalAllergies =
    (allergies.drug_allergies?.length || 0) +
    (allergies.food_allergies?.length || 0) +
    (allergies.environmental_allergies?.length || 0);
  if (totalAllergies > 0) {
    return [{ icon: 'hi-exclamation-triangle', text: `${totalAllergies} allerg${totalAllergies !== 1 ? 'ies' : 'y'} documented` }];
  }
  return null;
});

const medicalHistorySummary = computed(() => {
  if (!stepCompletion.medicalHistory) return null;
  const items = [];
  const conditionsCount = medicalHistory.chronic_conditions?.length || 0;
  const medsCount = medicalHistory.current_medications?.length || 0;
  if (conditionsCount > 0) {
    items.push({ icon: 'hi-clipboard-list', text: `${conditionsCount} condition${conditionsCount !== 1 ? 's' : ''}` });
  }
  if (medsCount > 0) {
    items.push({ icon: 'bi-capsule', text: `${medsCount} medication${medsCount !== 1 ? 's' : ''}` });
  }
  return items.length > 0 ? items : null;
});

const devicesSummary = computed(() => {
  if (!stepCompletion.deviceIntegration) return null;
  const devicesCount = deviceIntegration.devices_connected?.length || 0;
  const appsCount = deviceIntegration.health_apps_connected?.length || 0;
  const total = devicesCount + appsCount;
  if (total > 0) {
    return [{ icon: 'hi-link', text: `${total} connection${total !== 1 ? 's' : ''} active` }];
  }
  return null;
});

const walletCreditsSummary = computed(() => {
  if (!stepCompletion.walletCredits) return null;
  const items = [];

  // Show wallet balance if positive
  if (walletCredits.walletBalance > 0) {
    const formatted = new Intl.NumberFormat('en-NG').format(walletCredits.walletBalance);
    items.push({ icon: 'bi-wallet2', text: `\u20A6${formatted} balance` });
  }

  // Show total credits
  const totalCredits =
    (walletCredits.credits?.free_remaining || 0) +
    (walletCredits.credits?.purchased || 0) +
    (walletCredits.credits?.gifted || 0);
  if (totalCredits > 0) {
    items.push({ icon: 'hi-sparkles', text: `${totalCredits} AI credit${totalCredits !== 1 ? 's' : ''}` });
  }

  return items.length > 0 ? items : [{ icon: 'hi-check', text: 'Setup complete' }];
});

// Check if step is the current (first incomplete) step
const isCurrentStep = (key) => {
  for (const item of checklistItems) {
    if (!stepCompletion[item.key]) {
      return item.key === key;
    }
  }
  return false;
};

// Checklist items with step numbers for navigation
const checklistItems = [
  { key: 'personalDetails', label: 'Personal details', required: true, stepNumber: 2 },
  { key: 'addressEmergency', label: 'Emergency contact', required: true, stepNumber: 3 },
  { key: 'dependants', label: 'Dependants', required: false, stepNumber: 4 },
  { key: 'vitalsMetrics', label: 'Health metrics', required: false, stepNumber: 5 },
  { key: 'allergies', label: 'Allergies', required: false, stepNumber: 6 },
  { key: 'medicalHistory', label: 'Medical history', required: false, stepNumber: 7 },
  { key: 'deviceIntegration', label: 'Connected devices', required: false, stepNumber: 8 },
  { key: 'walletCredits', label: 'Wallet & Credits', required: false, stepNumber: 9 },
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
  justify-content: center;
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
  background: #E1F5FE;
  color: #0288D1;
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
    display: none;
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

.status-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;

  &.setup {
    background: #FFF3E0;
    color: #F57C00;
  }

  &.ready {
    background: #E1F5FE;
    color: #0288D1;
  }

  &.complete {
    background: #E8F5E9;
    color: #4CAF50;
  }
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

// Progress Timeline
.progress-timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    .timeline-label {
      color: #1A365D;
    }
  }

  // Completed state
  &.completed {
    .timeline-indicator {
      background: #10B981;
      border-color: #10B981;
      color: white;
    }

    .timeline-label {
      color: #94A3B8;
      text-decoration: line-through;
    }
  }

  // Current state
  &.current {
    .timeline-indicator {
      background: white;
      border-color: #4FC3F7;
      box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.2);
    }

    .timeline-label {
      font-weight: 700;
      color: #1A365D;
    }
  }

  // Required state (not completed)
  &.required:not(.completed) {
    .timeline-label {
      color: #1A365D;
    }
  }
}

// Connecting line between steps
.timeline-line {
  position: absolute;
  left: 11px;
  top: calc(0.5rem + 24px);
  width: 2px;
  height: calc(100% + 0.5rem);
  background: #E2E8F0;
  transition: background 0.3s ease;

  &.completed {
    background: #10B981;
  }
}

.timeline-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #F1F5F9;
  border: 2px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  z-index: 1;
}

.step-num {
  font-size: 0.625rem;
  font-weight: 700;
  color: #94A3B8;
}

.current-pulse {
  width: 8px;
  height: 8px;
  background: #4FC3F7;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

.timeline-label {
  flex: 1;
  font-size: 0.8125rem;
  color: #64748B;
  transition: color 0.2s;
}

.required-badge {
  font-size: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #EF4444;
  background: #FEE2E2;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.tip-card {
  background: #E1F5FE;
  border: 1px solid #B3E5FC;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
}

.tip-icon {
  width: 40px;
  height: 40px;
  background: #B3E5FC;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0288D1;
  flex-shrink: 0;
}

.tip-content h4 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0277BD;
  margin: 0 0 0.375rem 0;
}

.tip-content p {
  font-size: 0.8125rem;
  color: #01579B;
  margin: 0;
  line-height: 1.5;
}

.emergency-card {
  background: #FFF3E0;
  border: 1px solid #FFCC80;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
}

.emergency-icon {
  width: 40px;
  height: 40px;
  background: #FFE0B2;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F57C00;
  flex-shrink: 0;
}

.emergency-content h4 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #E65100;
  margin: 0 0 0.375rem 0;
}

.emergency-content p {
  font-size: 0.8125rem;
  color: #BF360C;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.emergency-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #F57C00;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #EF6C00;
  }
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

  &:hover {
    background: #0288D1;
  }
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
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
  border: none;
  border-radius: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 6px 16px rgba(79, 195, 247, 0.4);
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
