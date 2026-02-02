<template>
  <div class="onboarding-layout">
    <!-- Header with mobile drawer support -->
    <OnboardingHeader />

    <!-- Page Content -->
    <main class="onboarding-content">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { onMounted, computed, watch, ref, inject } from 'vue';
import { useStore } from 'vuex';
import { useOnboardingState } from './composables/useOnboardingState';
import OnboardingHeader from './components/OnboardingHeader.vue';

const store = useStore();
const $http = inject('$http');
const { loadProgress, deriveCompletionFromProfile } = useOnboardingState();

const userProfile = computed(() => store.getters['userprofile']);
const specialistPrefs = ref(null);
const isInitialized = ref(false);

// Fetch specialist preferences from API
const fetchSpecialistPrefs = async () => {
  try {
    const response = await $http.$_getSpecialistAvailability();
    specialistPrefs.value = response.data?.data || response.data;
    return specialistPrefs.value;
  } catch (error) {
    console.warn('Failed to fetch specialist preferences:', error);
    return null;
  }
};

// Initialize onboarding state
const initializeState = async () => {
  // Load from localStorage first
  loadProgress();

  // Fetch specialist preferences from API
  await fetchSpecialistPrefs();

  // Then derive from user profile if available
  if (userProfile.value) {
    deriveCompletionFromProfile(userProfile.value, specialistPrefs.value);
  }

  isInitialized.value = true;
};

onMounted(() => {
  initializeState();
});

// Watch for user profile changes (e.g., after login or data fetch)
// Only trigger after initialization to avoid race conditions
watch(userProfile, async (newProfile) => {
  if (newProfile && isInitialized.value) {
    // Ensure we have specialist prefs
    if (!specialistPrefs.value) {
      await fetchSpecialistPrefs();
    }
    deriveCompletionFromProfile(newProfile, specialistPrefs.value);
  }
});
</script>

<style scoped lang="scss">
.onboarding-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-width: 0; // Allow flex shrinking
  background: #F8FAFC;
  font-family: 'Inter', system-ui, sans-serif;
}

.onboarding-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  min-width: 0; // Allow flex shrinking
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
}

// Mobile: white background for edge-to-edge content
@media (max-width: 1024px) {
  .onboarding-layout {
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
</style>
