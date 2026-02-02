<template>
  <div class="patient-onboarding-layout">
    <!-- Header with mobile drawer support -->
    <OnboardingHeader @draft-saved="showDraftSavedToast" />

    <!-- Horizontal Step Progress (Desktop only) -->
    <StepProgress v-if="!isSetupDashboard" />

    <!-- Page Content -->
    <main class="onboarding-content">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Toast Notification -->
    <transition name="toast">
      <div v-if="showToast" class="toast-notification" :class="toastType">
        <v-icon :name="toastIcon" scale="0.9" />
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, computed, watch, ref, inject } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { usePatientOnboardingState } from './composables/usePatientOnboardingState';
import OnboardingHeader from './components/OnboardingHeader.vue';
import StepProgress from './components/StepProgress.vue';

const store = useStore();
const route = useRoute();
const $api = inject('$http'); // apiFactory with named methods
const { loadProgress, deriveCompletionFromProfile } = usePatientOnboardingState();

const userProfile = computed(() => store.getters['userprofile']);
const recentVitals = computed(() => store.getters['recentVitals']);
const isInitialized = ref(false);

// Wallet and credits data
const walletCreditsData = ref({
  walletBalance: 0,
  credits: {
    free_remaining: 0,
    free_total: 5,
    purchased: 0,
    gifted: 0,
  },
});

// Fetch wallet balance using apiFactory method
const fetchWalletBalance = async () => {
  try {
    const res = await $api.$_getWalletBalance();
    const data = res.data?.data || res.data;
    walletCreditsData.value.walletBalance = data?.currentBalance || data?.balance || 0;
  } catch (e) {
    console.error('Error fetching wallet balance:', e);
  }
};

// Fetch health credits using apiFactory method
const fetchHealthCredits = async () => {
  try {
    const res = await $api.$_getClaudeSummaryCredits();
    const data = res.data?.data || res.data;
    walletCreditsData.value.credits = {
      free_remaining: data.free_credits_remaining || 0,
      free_total: 5,
      purchased: data.purchased_credits || 0,
      gifted: data.gifted_credits || 0,
    };
  } catch (e) {
    console.error('Error fetching health credits:', e);
  }
};

// Check if we're on the setup dashboard (don't show step progress there)
const isSetupDashboard = computed(() => {
  return route.name === 'PatientSetupDashboard' || route.path.endsWith('/onboarding') || route.path.endsWith('/onboarding/');
});

// Toast notification state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'hi-check-circle' : 'hi-exclamation-circle';
});

const showDraftSavedToast = () => {
  toastMessage.value = 'Draft saved successfully!';
  toastType.value = 'success';
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// Initialize onboarding state
const initializeState = async () => {
  // Fetch wallet and credits data
  await Promise.all([fetchWalletBalance(), fetchHealthCredits()]);

  // Load from localStorage and derive from user profile, vitals, and wallet/credits if available
  loadProgress(userProfile.value, recentVitals.value, walletCreditsData.value);
  isInitialized.value = true;
};

onMounted(() => {
  initializeState();
});

// Watch for user profile changes (e.g., after login or data fetch)
watch(userProfile, (newProfile) => {
  if (newProfile) {
    // Re-derive from profile when it becomes available or changes
    deriveCompletionFromProfile(newProfile, recentVitals.value, walletCreditsData.value);
  }
}, { immediate: true });

// Watch for vitals changes
watch(recentVitals, (newVitals) => {
  if (newVitals && userProfile.value) {
    // Re-derive when vitals become available
    deriveCompletionFromProfile(userProfile.value, newVitals, walletCreditsData.value);
  }
}, { immediate: true });
</script>

<style scoped lang="scss">
.patient-onboarding-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-width: 0;
  background: #F8FAFC;
  font-family: 'Inter', system-ui, sans-serif;
}

.onboarding-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
}

// Mobile: white background for edge-to-edge content
@media (max-width: 1024px) {
  .patient-onboarding-layout {
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .onboarding-content {
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
    border-radius: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

// Toast Notification
.toast-notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: #1A365D;
  color: white;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1000;

  &.success {
    background: #10B981;
  }

  &.error {
    background: #EF4444;
  }

  svg {
    flex-shrink: 0;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
