<template>
  <header class="onboarding-header">
    <div class="header-content">
      <!-- Logo / Brand -->
      <div class="brand">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" class="logo" />
        <span class="brand-text">Health Profile Setup</span>
      </div>

      <!-- Progress indicator (desktop) -->
      <div class="progress-indicator">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
        </div>
        <span class="progress-text">{{ progressPercent }}% complete</span>
      </div>

      <!-- Actions -->
      <div class="header-actions">
        <button class="save-draft-btn" @click="saveDraft">
          <v-icon name="hi-save" scale="0.8" />
          <span>Save Draft</span>
        </button>
        <button class="menu-btn" @click="toggleMobileMenu">
          <v-icon name="hi-menu" scale="1" />
        </button>
      </div>
    </div>

    <!-- Mobile Menu Drawer -->
    <transition name="slide-down">
      <div v-if="showMobileMenu" class="mobile-menu">
        <div class="mobile-progress">
          <ProgressRing
            :percent="progressPercent"
            :size="80"
            :stroke-width="8"
            :progress-color="progressColor"
          >
            <div class="progress-center">
              <span class="progress-value">{{ progressPercent }}%</span>
            </div>
          </ProgressRing>
          <div class="mobile-progress-text">
            <h4>Profile Setup Progress</h4>
            <p>{{ onboardingStatus.description }}</p>
          </div>
        </div>

        <!-- Timeline Steps -->
        <div class="steps-timeline">
          <h3 class="timeline-title">Setup Steps</h3>
          <div class="steps-list">
            <div
              v-for="(step, index) in navSteps"
              :key="step.key"
              class="step-item"
              :class="{
                completed: stepCompletion[step.key],
                current: isCurrentStep(step.key),
              }"
              @click="navigateToStep(step.stepNumber)"
            >
              <!-- Connecting line (not for last item) -->
              <div v-if="index < navSteps.length - 1" class="step-line" :class="{ completed: stepCompletion[step.key] }" />

              <!-- Step indicator circle -->
              <div class="step-indicator">
                <v-icon v-if="stepCompletion[step.key]" name="fa-check" scale="0.5" />
                <template v-else-if="isCurrentStep(step.key)">
                  <div class="current-dot" />
                </template>
                <span v-else class="step-number">{{ index + 1 }}</span>
              </div>

              <!-- Step content -->
              <div class="step-content">
                <span class="step-label">{{ step.name }}</span>
                <span v-if="isStepRequired(step.key)" class="step-badge required">Required</span>
                <span v-else class="step-badge optional">Optional</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mobile-menu-footer">
          <button class="exit-btn" @click="exitSetup">
            <v-icon name="hi-x" scale="0.8" />
            <span>Exit Setup</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- Overlay for mobile menu -->
    <transition name="fade">
      <div v-if="showMobileMenu" class="mobile-overlay" @click="toggleMobileMenu" />
    </transition>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePatientOnboardingState } from '../composables/usePatientOnboardingState';
import ProgressRing from './ProgressRing.vue';

const router = useRouter();
const {
  progressPercent,
  stepCompletion,
  currentStepInfo,
  onboardingStatus,
  isStepRequired,
  goToStep,
  saveProgress,
} = usePatientOnboardingState();

const showMobileMenu = ref(false);

const navSteps = [
  { key: 'personalDetails', name: 'Personal Details', icon: 'hi-user', stepNumber: 2 },
  { key: 'addressEmergency', name: 'Address & Emergency', icon: 'hi-location-marker', stepNumber: 3 },
  { key: 'dependants', name: 'Dependants', icon: 'hi-users', stepNumber: 4 },
  { key: 'vitalsMetrics', name: 'Vitals & Metrics', icon: 'hi-heart', stepNumber: 5 },
  { key: 'allergies', name: 'Allergies', icon: 'hi-exclamation-triangle', stepNumber: 6 },
  { key: 'medicalHistory', name: 'Medical History', icon: 'hi-document-text', stepNumber: 7 },
  { key: 'deviceIntegration', name: 'Devices & Apps', icon: 'hi-device-mobile', stepNumber: 8 },
];

const progressColor = computed(() => {
  if (progressPercent.value >= 80) return '#10B981';
  if (progressPercent.value >= 50) return '#4FC3F7';
  return '#F59E0B';
});

// Check if step is the current (first incomplete) step
const isCurrentStep = (key) => {
  for (const step of navSteps) {
    if (!stepCompletion[step.key]) {
      return step.key === key;
    }
  }
  return false;
};

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const navigateToStep = (stepNumber) => {
  goToStep(stepNumber);
  showMobileMenu.value = false;
};

const emit = defineEmits(['draft-saved']);

const saveDraft = () => {
  saveProgress();
  emit('draft-saved');
};

const exitSetup = () => {
  saveProgress();
  router.push({ name: 'Patient Dashboard' });
};
</script>

<style scoped lang="scss">
.onboarding-header {
  background: white;
  border-bottom: 1px solid #E2E8F0;
  position: relative;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  height: 32px;
  width: auto;
}

.brand-text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1A365D;

  @media (max-width: 768px) {
    display: none;
  }
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;

  @media (max-width: 1024px) {
    display: none;
  }
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #E2E8F0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4FC3F7 0%, #0288D1 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748B;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.save-draft-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #E2E8F0;
    color: #1A365D;
  }

  @media (max-width: 768px) {
    span {
      display: none;
    }
    padding: 0.5rem;
  }
}

.menu-btn {
  display: none;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #64748B;
  cursor: pointer;

  @media (max-width: 1024px) {
    display: flex;
  }
}

// Mobile Menu
.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid #E2E8F0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 60px);
  overflow-y: auto;
  z-index: 200;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 99;
}

.mobile-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
  color: white;
}

.progress-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-value {
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

.mobile-progress-text h4 {
  font-size: 0.9375rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.mobile-progress-text p {
  font-size: 0.8125rem;
  opacity: 0.9;
  margin: 0;
}

// Timeline Steps
.steps-timeline {
  padding: 1rem 1.5rem;
}

.timeline-title {
  font-size: 0.625rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0.5rem;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.step-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0.5rem;

  &:hover {
    background: #F8FAFC;

    .step-label {
      color: #1A365D;
    }
  }

  // Completed state
  &.completed {
    .step-indicator {
      background: #10B981;
      border-color: #10B981;
      color: white;
    }

    .step-label {
      color: #94A3B8;
      text-decoration: line-through;
    }
  }

  // Current state
  &.current {
    .step-indicator {
      background: white;
      border-color: #4FC3F7;
      box-shadow: 0 0 0 4px rgba(79, 195, 247, 0.2);
    }

    .step-label {
      font-weight: 700;
      color: #1A365D;
    }
  }
}

// Connecting line between steps
.step-line {
  position: absolute;
  left: calc(0.5rem + 12px);
  top: calc(0.75rem + 28px);
  width: 2px;
  height: calc(100% - 4px);
  background: #E2E8F0;
  transition: background 0.3s ease;

  &.completed {
    background: #10B981;
  }
}

.step-indicator {
  width: 28px;
  height: 28px;
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

.step-number {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #94A3B8;
}

.current-dot {
  width: 10px;
  height: 10px;
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
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.step-label {
  font-size: 0.875rem;
  color: #64748B;
  transition: color 0.2s;
}

.step-badge {
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;

  &.required {
    color: #DC2626;
  }

  &.optional {
    color: #94A3B8;
  }
}

.mobile-menu-footer {
  padding: 1rem;
  border-top: 1px solid #E2E8F0;
}

.exit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: #FEE2E2;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #DC2626;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #FECACA;
  }
}

// Transitions
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
