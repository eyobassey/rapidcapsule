<template>
  <div class="onboarding-header-wrapper">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-toggle" @click="openDrawer">
        <v-icon name="fa-bars" scale="1" />
      </button>

      <div class="logo-section mobile-logo">
        <div class="logo-img">
          <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
        </div>
        <div class="logo-text">
          <span class="logo-title">Rapid Capsule</span>
          <span class="logo-subtitle">Health Profile</span>
        </div>
      </div>

      <div class="mobile-avatar" @click="goToProfile">
        <img
          v-if="profileImage"
          :src="profileImage"
          :alt="userName"
        />
        <div v-else class="avatar-placeholder">
          <v-icon name="hi-user" scale="0.7" />
        </div>
      </div>
    </header>

    <!-- Desktop Header -->
    <header class="desktop-header">
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
        </div>
      </div>
    </header>

    <!-- Mobile Drawer Overlay -->
    <div
      class="drawer-overlay"
      :class="{ open: drawerOpen }"
      @click="closeDrawer"
    />

    <!-- Mobile Drawer -->
    <aside class="mobile-drawer" :class="{ open: drawerOpen }">
      <div class="drawer-header">
        <div class="logo-section">
          <div class="logo-img small">
            <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
          </div>
          <span class="drawer-title">Menu</span>
        </div>
        <button class="close-btn" @click="closeDrawer">
          <v-icon name="hi-x" scale="1.1" />
        </button>
      </div>

      <!-- User Info Card -->
      <div class="drawer-user">
        <div class="drawer-avatar">
          <img
            v-if="profileImage"
            :src="profileImage"
            :alt="userName"
          />
          <v-icon v-else name="hi-user" scale="1" />
        </div>
        <div class="drawer-user-info">
          <div class="drawer-user-name">{{ userName }}</div>
          <div class="drawer-user-status">
            <span class="status-badge" :class="onboardingStatus.colorClass">{{ onboardingStatus.label }}</span>
          </div>
        </div>
      </div>

      <!-- Progress Section -->
      <div class="drawer-progress">
        <div class="progress-header">
          <span>Setup Progress</span>
          <span class="progress-value">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
        </div>
        <p class="progress-description">{{ onboardingStatus.description }}</p>
      </div>

      <!-- Main Menu -->
      <div class="drawer-section">
        <h3 class="section-label">Main Menu</h3>
        <nav class="drawer-nav">
          <a
            href="#"
            class="nav-item"
            :class="{ active: isOnDashboard }"
            @click.prevent="goToDashboard"
          >
            <v-icon name="fa-rocket" scale="0.9" />
            <span>Setup Dashboard</span>
          </a>
          <a href="#" class="nav-item disabled">
            <v-icon name="ri-calendar-check-line" scale="0.9" />
            <span>Appointments</span>
          </a>
          <a href="#" class="nav-item disabled">
            <v-icon name="hi-heart" scale="0.9" />
            <span>Health Monitor</span>
          </a>
          <a href="#" class="nav-item disabled">
            <v-icon name="hi-document-text" scale="0.9" />
            <span>My Records</span>
          </a>
        </nav>
      </div>

      <!-- Setup Steps -->
      <div class="drawer-section">
        <h3 class="section-label">Setup Steps</h3>
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
            <div class="step-indicator">
              <v-icon v-if="stepCompletion[step.key]" name="fa-check" scale="0.5" />
              <template v-else-if="isCurrentStep(step.key)">
                <div class="current-dot" />
              </template>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="step-content">
              <span class="step-label">{{ step.name }}</span>
              <span v-if="isStepRequired(step.key)" class="step-badge required">Required</span>
              <span v-else class="step-badge optional">Optional</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="drawer-footer">
        <button class="save-btn" @click="saveDraftFromDrawer">
          <v-icon name="hi-save" scale="0.9" />
          Save Draft
        </button>
        <button class="exit-btn" @click="exitSetup">
          <v-icon name="hi-x" scale="0.8" />
          <span>Exit Setup</span>
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { usePatientOnboardingState } from '../composables/usePatientOnboardingState';

const router = useRouter();
const route = useRoute();
const store = useStore();

const {
  progressPercent,
  stepCompletion,
  currentStepInfo,
  onboardingStatus,
  isStepRequired,
  goToStep,
  saveProgress,
} = usePatientOnboardingState();

// Drawer state
const drawerOpen = ref(false);

const userProfile = computed(() => store.getters['userprofile']);

const profileImage = computed(() => {
  const profile = userProfile.value?.profile;
  return profile?.profile_image || profile?.profile_photo || null;
});

const userName = computed(() => {
  const profile = userProfile.value?.profile;
  if (profile?.first_name) {
    return profile.first_name;
  }
  return 'New Patient';
});

const isOnDashboard = computed(() => {
  return route.path.includes('/onboarding/dashboard');
});

const navSteps = [
  { key: 'personalDetails', name: 'Personal Details', icon: 'hi-user', stepNumber: 2 },
  { key: 'addressEmergency', name: 'Address & Emergency', icon: 'hi-location-marker', stepNumber: 3 },
  { key: 'dependants', name: 'Dependants', icon: 'hi-users', stepNumber: 4 },
  { key: 'vitalsMetrics', name: 'Vitals & Metrics', icon: 'hi-heart', stepNumber: 5 },
  { key: 'allergies', name: 'Allergies', icon: 'hi-exclamation-triangle', stepNumber: 6 },
  { key: 'medicalHistory', name: 'Medical History', icon: 'hi-document-text', stepNumber: 7 },
  { key: 'deviceIntegration', name: 'Devices & Apps', icon: 'hi-device-mobile', stepNumber: 8 },
];

// Check if step is the current (first incomplete) step
const isCurrentStep = (key) => {
  for (const step of navSteps) {
    if (!stepCompletion[step.key]) {
      return step.key === key;
    }
  }
  return false;
};

// Drawer methods
const openDrawer = () => {
  drawerOpen.value = true;
  document.body.style.overflow = 'hidden';
};

const closeDrawer = () => {
  drawerOpen.value = false;
  document.body.style.overflow = '';
};

const navigateToStep = (stepNumber) => {
  closeDrawer();
  goToStep(stepNumber);
};

const emit = defineEmits(['draft-saved']);

const saveDraft = () => {
  saveProgress();
  emit('draft-saved');
};

const saveDraftFromDrawer = () => {
  closeDrawer();
  saveDraft();
};

const goToDashboard = () => {
  closeDrawer();
  router.push('/app/patient/onboarding/dashboard');
};

const goToProfile = () => {
  router.push('/app/patient/profile');
};

const exitSetup = () => {
  saveProgress();
  closeDrawer();
  router.push({ name: 'Patient Dashboard' });
};
</script>

<style scoped lang="scss">
.onboarding-header-wrapper {
  position: relative;
  z-index: 100;
}

/* Mobile Header */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #F1F5F9;
  position: sticky;
  top: 0;
  z-index: 40;

  @media (min-width: 1024px) {
    display: none;
  }
}

.menu-toggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #1A365D;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background 0.2s;

  &:hover {
    background: #F1F5F9;
  }
}

.mobile-logo {
  .logo-title {
    font-size: 1rem;
    line-height: 1;
  }

  .logo-subtitle {
    font-size: 0.5rem;
  }
}

.mobile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #E2E8F0;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94A3B8;
  }
}

/* Desktop Header */
.desktop-header {
  display: none;
  background: white;
  border-bottom: 1px solid #E2E8F0;
  position: relative;
  z-index: 100;

  @media (min-width: 1024px) {
    display: block;
  }
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
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;
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
}

/* Logo Section */
.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-img {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &.small {
    width: 28px;
    height: 28px;
  }
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1A365D;
  font-family: 'Poppins', system-ui, sans-serif;
  letter-spacing: -0.025em;
  line-height: 1;
}

.logo-subtitle {
  font-size: 0.625rem;
  font-weight: 500;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Drawer Overlay */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 45;

  &.open {
    opacity: 1;
    pointer-events: auto;
  }

  @media (min-width: 1024px) {
    display: none;
  }
}

/* Mobile Drawer */
.mobile-drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: 288px;
  max-width: 85vw;
  height: 100%;
  background: white;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 50;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  &.open {
    transform: translateX(0);
  }

  @media (min-width: 1024px) {
    display: none;
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #F1F5F9;
}

.drawer-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1A365D;
  font-family: 'Poppins', system-ui, sans-serif;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: #F1F5F9;
    color: #64748B;
  }
}

.drawer-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(79, 195, 247, 0.1) 0%, rgba(2, 136, 209, 0.1) 100%);
  margin: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(79, 195, 247, 0.2);
}

.drawer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #E2E8F0;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.drawer-user-info {
  flex: 1;
  min-width: 0;
}

.drawer-user-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
}

.status-badge {
  display: inline-block;
  font-size: 0.5625rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  margin-top: 0.25rem;
  background: #FFF3E0;
  color: #F57C00;

  &.in-progress {
    background: #FFF3E0;
    color: #F57C00;
  }

  &.ready {
    background: #E3F2FD;
    color: #1976D2;
  }

  &.complete {
    background: #E8F5E9;
    color: #4CAF50;
  }

  &.pending {
    background: #FFFDE7;
    color: #F9A825;
  }
}

.drawer-progress {
  padding: 0 1rem;
  margin-bottom: 1rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #64748B;
  margin-bottom: 0.5rem;
}

.progress-value {
  font-weight: 700;
  color: #0288D1;
}

.progress-description {
  font-size: 0.6875rem;
  color: #94A3B8;
  margin: 0.5rem 0 0 0;
}

.drawer-section {
  padding: 0 1rem;
  margin-bottom: 1.5rem;
}

.section-label {
  font-size: 0.625rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.75rem 0.5rem;
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: #64748B;
  text-decoration: none;
  transition: all 0.2s;

  &:hover:not(.disabled) {
    background: #F8FAFC;
    color: #1A365D;
  }

  &.active {
    background: rgba(79, 195, 247, 0.1);
    color: #0288D1;
    font-weight: 700;
    border: 1px solid rgba(79, 195, 247, 0.2);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    flex-shrink: 0;
  }
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0.5rem;

  &:hover {
    background: #F8FAFC;

    .step-label {
      color: #1A365D;
    }
  }

  &.completed .step-indicator {
    background: #10B981;
    border-color: #10B981;
    color: white;
  }

  &.completed .step-label {
    color: #94A3B8;
    text-decoration: line-through;
  }

  &.current .step-indicator {
    background: white;
    border-color: #4FC3F7;
    box-shadow: 0 0 0 4px rgba(79, 195, 247, 0.2);
  }

  &.current .step-label {
    font-weight: 700;
    color: #1A365D;
  }
}

.step-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #F1F5F9;
  border: 2px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  color: #94A3B8;
  flex-shrink: 0;
}

.current-dot {
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
  font-size: 0.8125rem;
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

.drawer-footer {
  margin-top: auto;
  padding: 1rem;
  border-top: 1px solid #F1F5F9;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.save-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);

  &:hover {
    box-shadow: 0 6px 16px rgba(79, 195, 247, 0.4);
  }
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
</style>
