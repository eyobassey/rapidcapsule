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
          <span class="logo-subtitle">Specialist</span>
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
        <!-- Logo -->
        <div class="logo-section">
          <div class="logo-img desktop">
            <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
          </div>
          <div class="logo-text">
            <span class="logo-title">Rapid Capsule</span>
            <span class="logo-subtitle">Specialist Portal</span>
          </div>
        </div>

        <!-- Progress Tracker (Desktop) -->
        <div class="progress-tracker" v-if="showProgress">
          <div class="progress-info">
            <span class="progress-label">Setup Progress</span>
            <span class="progress-step">Step {{ currentStep }} of {{ totalSteps }} &bull; {{ currentStepInfo.name }}</span>
          </div>
          <ProgressRing
            :percent="progressPercent"
            :size="48"
            :stroke-width="6"
          >
            <span class="progress-percent">{{ progressPercent }}%</span>
          </ProgressRing>
        </div>

        <!-- Right Section -->
        <div class="header-right">
          <!-- Help Dropdown -->
          <button class="help-btn" @click="toggleHelp">
            <v-icon name="ri-question-line" scale="0.9" />
            <span>Help Center</span>
            <v-icon name="hi-chevron-down" scale="0.6" />
          </button>

          <!-- Help Dropdown Menu -->
          <div v-if="showHelp" class="help-dropdown" v-click-outside="closeHelp">
            <a href="#" class="help-item">
              <v-icon name="hi-book-open" scale="0.9" />
              <span>Getting Started Guide</span>
            </a>
            <a href="#" class="help-item">
              <v-icon name="hi-chat" scale="0.9" />
              <span>Live Chat Support</span>
            </a>
            <a href="#" class="help-item">
              <v-icon name="fa-whatsapp" scale="0.9" />
              <span>WhatsApp Support</span>
            </a>
          </div>

          <div class="divider" />

          <!-- User Profile -->
          <div class="user-section">
            <div class="user-avatar">
              <img
                v-if="profileImage"
                :src="profileImage"
                :alt="userName"
              />
              <div v-else class="avatar-placeholder">
                <v-icon name="hi-user" scale="0.9" />
              </div>
              <div v-if="showOnlineIndicator" class="online-indicator" />
            </div>
            <div class="user-info">
              <span class="user-name">{{ userName }}</span>
              <span class="user-status" :class="statusClass">{{ statusText }}</span>
            </div>
          </div>
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
            <span class="status-badge" :class="statusClass">{{ statusText }}</span>
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
            <v-icon name="hi-user-group" scale="0.9" />
            <span>Patient Queue</span>
          </a>
          <a href="#" class="nav-item disabled">
            <v-icon name="hi-currency-dollar" scale="0.9" />
            <span>Earnings</span>
          </a>
        </nav>
      </div>

      <!-- Setup Steps -->
      <div class="drawer-section">
        <h3 class="section-label">Setup Steps</h3>
        <div class="steps-list">
          <div
            v-for="(step, index) in setupSteps"
            :key="step.key"
            class="step-item"
            :class="{
              completed: stepCompletion[step.key],
              current: isCurrentStep(step.key),
            }"
            @click="goToStepFromDrawer(step.stepNumber)"
          >
            <div class="step-indicator">
              <v-icon v-if="stepCompletion[step.key]" name="fa-check" scale="0.5" />
              <template v-else-if="isCurrentStep(step.key)">
                <div class="current-dot" />
              </template>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="drawer-footer">
        <button class="settings-btn" @click="goToSettings">
          <v-icon name="hi-cog" scale="0.9" />
          Settings
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import ProgressRing from './ProgressRing.vue';
import { useOnboardingState } from '../composables/useOnboardingState';

const props = defineProps({
  showProgress: {
    type: Boolean,
    default: true,
  },
  showOnlineIndicator: {
    type: Boolean,
    default: false,
  },
});

const store = useStore();
const router = useRouter();
const route = useRoute();

const {
  currentStep,
  totalSteps,
  progressPercent,
  currentStepInfo,
  isVerificationComplete,
  stepCompletion,
  goToStep,
  practiceStatus,
} = useOnboardingState();

// Drawer state
const drawerOpen = ref(false);
const showHelp = ref(false);

const userProfile = computed(() => store.getters['userprofile']);

const profileImage = computed(() => {
  const profile = userProfile.value?.profile;
  return profile?.profile_image || profile?.profile_photo || null;
});

const userName = computed(() => {
  const profile = userProfile.value?.profile;
  const practice = userProfile.value?.professional_practice;
  const title = practice?.category === 'Medical Doctor' ? 'Dr. ' : '';
  if (profile?.first_name) {
    return `${title}${profile.first_name}`;
  }
  return 'New Specialist';
});

const statusText = computed(() => {
  return practiceStatus.value?.label || 'Setup In Progress';
});

const statusClass = computed(() => {
  const colorMap = {
    'green': 'active',
    'blue': 'ready',
    'yellow': 'pending',
    'orange': 'in-progress',
    'red': 'suspended',
    'gray': 'inactive',
  };
  return colorMap[practiceStatus.value?.color] || 'in-progress';
});

const isOnDashboard = computed(() => {
  return route.path.includes('/onboarding/dashboard');
});

// Setup steps for drawer
const setupSteps = [
  { key: 'quickBio', label: 'Quick Bio', stepNumber: 2 },
  { key: 'profileConfig', label: 'Profile Configuration', stepNumber: 4 },
  { key: 'availability', label: 'Availability', stepNumber: 5 },
  { key: 'rateCards', label: 'Rate Cards', stepNumber: 6 },
  { key: 'verification', label: 'Identity & Compliance', stepNumber: 7 },
  { key: 'security', label: 'Security & Comms', stepNumber: 8 },
  { key: 'review', label: 'Review & Activation', stepNumber: 9 },
];

const isCurrentStep = (key) => {
  // Find first incomplete step
  for (const step of setupSteps) {
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

const toggleHelp = () => {
  showHelp.value = !showHelp.value;
};

const closeHelp = () => {
  showHelp.value = false;
};

const goToDashboard = () => {
  closeDrawer();
  router.push('/app/specialist/onboarding/dashboard');
};

const goToStepFromDrawer = (stepNumber) => {
  closeDrawer();
  goToStep(stepNumber);
};

const goToProfile = () => {
  router.push('/app/specialist/profile');
};

const goToSettings = () => {
  closeDrawer();
  router.push('/app/specialist/settings');
};

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutsideHandler = (e) => {
      if (!el.contains(e.target)) {
        binding.value();
      }
    };
    document.addEventListener('click', el._clickOutsideHandler, true);
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutsideHandler, true);
  },
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
  .logo-icon {
    width: 32px;
    height: 32px;
  }

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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #F1F5F9;
  height: 80px;
  position: sticky;
  top: 0;
  z-index: 40;
  flex-shrink: 0;

  @media (min-width: 1024px) {
    display: block;
  }
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  max-width: 1440px;
  margin: 0 auto;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 0 15px rgba(79, 195, 247, 0.3);

  &.small {
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
  }
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

  &.desktop {
    width: 40px;
    height: 40px;
  }
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 1.5rem;
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

.progress-tracker {
  display: none;
  align-items: center;
  gap: 1rem;
  background: #F8FAFC;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #F1F5F9;
}

@media (min-width: 768px) {
  .progress-tracker {
    display: flex;
  }
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.progress-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1A365D;
}

.progress-step {
  font-size: 0.625rem;
  color: #64748B;
}

.progress-percent {
  font-size: 0.625rem;
  font-weight: 700;
  color: #1A365D;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
}

.help-btn {
  display: none;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #64748B;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;

  @media (min-width: 768px) {
    display: flex;
  }

  &:hover {
    color: #1A365D;
  }
}

.help-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 220px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  z-index: 50;
}

.help-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #64748B;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #F8FAFC;
    color: #1A365D;
  }

  svg {
    color: #94A3B8;
  }
}

.divider {
  width: 1px;
  height: 2rem;
  background: #E2E8F0;
  display: none;

  @media (min-width: 768px) {
    display: block;
  }
}

.user-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #4CAF50;
  border: 2px solid white;
  border-radius: 50%;
}

.user-info {
  display: none;
  flex-direction: column;

  @media (min-width: 1024px) {
    display: flex;
  }
}

.user-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
  line-height: 1.2;
}

.user-status {
  display: inline-block;
  font-size: 0.625rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  margin-top: 0.125rem;

  &.in-progress {
    background: #FFF3E0;
    color: #F57C00;
  }

  &.ready {
    background: #E3F2FD;
    color: #1976D2;
  }

  &.active {
    background: #E8F5E9;
    color: #4CAF50;
  }

  &.pending {
    background: #FFFDE7;
    color: #F9A825;
  }

  &.suspended {
    background: #FFEBEE;
    color: #D32F2F;
  }

  &.inactive {
    background: #ECEFF1;
    color: #78909C;
  }
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
  background: #F8FAFC;
  margin: 1rem;
  border-radius: 0.75rem;
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

  &.active {
    background: #E8F5E9;
    color: #4CAF50;
  }

  &.pending {
    background: #FFFDE7;
    color: #F9A825;
  }

  &.suspended {
    background: #FFEBEE;
    color: #D32F2F;
  }

  &.inactive {
    background: #ECEFF1;
    color: #78909C;
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
  font-size: 0.625rem;
  color: #64748B;
  margin-bottom: 0.375rem;
}

.progress-value {
  font-weight: 700;
  color: #1A365D;
}

.progress-bar {
  height: 6px;
  background: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4FC3F7 0%, #0288D1 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
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
  gap: 0.75rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover .step-label {
    color: #1A365D;
  }

  &.completed .step-indicator {
    background: #4CAF50;
    border-color: #4CAF50;
    color: white;
  }

  &.completed .step-label {
    color: #94A3B8;
    text-decoration: line-through;
  }

  &.current .step-indicator {
    background: white;
    border-color: #4FC3F7;
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
}

.step-label {
  font-size: 0.875rem;
  color: #64748B;
  transition: color 0.2s;
}

.drawer-footer {
  margin-top: auto;
  padding: 1rem;
  border-top: 1px solid #F1F5F9;
}

.settings-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: none;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F8FAFC;
    color: #1A365D;
  }
}
</style>
