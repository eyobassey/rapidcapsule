<template>
  <div class="step-container">
    <div class="step-scroll">
      <div class="step-content">
        <div class="step-header">
          <div class="step-header-row">
            <button class="back-btn" @click="goBack">
              <v-icon name="hi-arrow-left" scale="0.9" />
              <span>Back</span>
            </button>
            <span class="step-badge optional">Step 8 of 9 - Optional</span>
          </div>
          <div class="step-info">
            <h1 class="step-title">Devices & Health Apps</h1>
            <p class="step-description">
              Connect your health devices and apps to automatically sync your health data.
            </p>
          </div>
        </div>

        <div class="form-sections">
          <!-- Health Apps -->
          <div class="form-section">
            <h2 class="section-title">Health Apps</h2>
            <p class="section-description">Connect popular health and fitness apps.</p>
            <div class="app-grid">
              <div
                v-for="app in healthApps"
                :key="app.id"
                class="app-card"
                :class="{ connected: isAppConnected(app.id), connecting: connectingApp === app.id }"
                @click="connectApp(app.id)"
              >
                <div class="app-icon" :style="{ background: app.color }">
                  <v-icon :name="app.icon" scale="1.2" />
                </div>
                <div class="app-info">
                  <h4>{{ app.name }}</h4>
                  <p>{{ isAppConnected(app.id) ? 'Connected' : app.description }}</p>
                </div>
                <div class="app-status">
                  <v-icon v-if="isAppConnected(app.id)" name="hi-check-circle" scale="1" />
                  <span v-else-if="connectingApp === app.id" class="connecting-text">Connecting...</span>
                  <span v-else>Connect</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Info Note -->
          <div class="form-section" v-if="connectedProviders.length > 0">
            <div class="info-note">
              <v-icon name="hi-information-circle" scale="1" />
              <p>Your health data will sync automatically. You can manage sync settings anytime from <a @click.prevent="$router.push('/app/patient/devices-and-apps')">Devices & Apps</a>.</p>
            </div>
          </div>
        </div>

        <div class="step-footer">
          <button class="btn-skip" @click="skipStep">
            Skip for now
          </button>
          <div class="footer-actions">
            <button class="btn-secondary" @click="saveAndExit">
              Save & Exit
            </button>
            <button class="btn-primary" @click="saveAndContinue">
              <span>Continue</span>
              <v-icon name="hi-arrow-right" scale="0.8" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { usePatientOnboardingState } from './composables/usePatientOnboardingState';

const router = useRouter();
const store = useStore();
const $http = inject('$http');
const { deviceIntegration, completeStep, saveProgress, goToStep } = usePatientOnboardingState();

const isSaving = ref(false);
const connectingApp = ref(null);

const healthApps = [
  { id: 'apple_health', name: 'Apple Health', description: 'iOS health data', icon: 'fa-apple', color: '#FF3B30' },
  { id: 'google_fit', name: 'Google Fit', description: 'Android fitness', icon: 'fa-google', color: '#4285F4' },
  { id: 'fitbit', name: 'Fitbit', description: 'Activity tracking', icon: 'hi-heart', color: '#00B0B9' },
  { id: 'samsung_health', name: 'Samsung Health', description: 'Samsung devices', icon: 'hi-device-mobile', color: '#1428A0' },
];

// Real connected integrations from the store
const connectedProviders = computed(() => {
  const integrations = store.getters['healthIntegrations/connectedDevices'] || [];
  return integrations.map(i => i.provider);
});

const goBack = () => goToStep(7);

const isAppConnected = (appId) => {
  return connectedProviders.value.includes(appId);
};

// Initiate real OAuth connection
const connectApp = async (appId) => {
  if (isAppConnected(appId)) return; // Already connected
  connectingApp.value = appId;

  // Store return path so devices-and-apps page can redirect back
  sessionStorage.setItem('onboarding_return', '/app/patient/onboarding/device-integration');

  const result = await store.dispatch('healthIntegrations/connectProvider', {
    provider: appId,
    autoSync: true,
  });

  if (result?.redirected) {
    // User is being redirected to OAuth provider — page will unload
    return;
  }

  if (result?.requiresNativeApp) {
    connectingApp.value = null;
    alert(`${appId} requires the mobile app. Please use the Rapid Capsule mobile app to connect.`);
    return;
  }

  connectingApp.value = null;
};

// Save preferences (consents & notifications) to user profile
const savePreferencesToBackend = async () => {
  const hasPrefs =
    deviceIntegration.data_sharing_consents.vitals_auto_sync ||
    deviceIntegration.data_sharing_consents.activity_tracking ||
    deviceIntegration.data_sharing_consents.sleep_tracking ||
    deviceIntegration.notification_preferences.health_reminders ||
    deviceIntegration.notification_preferences.medication_reminders ||
    deviceIntegration.notification_preferences.wellness_tips;

  if (!hasPrefs && connectedProviders.value.length === 0) return true;

  try {
    isSaving.value = true;
    await $http.$_updateUser({
      device_integration: {
        health_apps_connected: connectedProviders.value,
        devices_connected: [],
        data_sharing_consents: deviceIntegration.data_sharing_consents,
        notification_preferences: deviceIntegration.notification_preferences,
      },
    });
    await store.dispatch('authenticate', localStorage.getItem('token') || sessionStorage.getItem('token'));
    return true;
  } catch (error) {
    console.error('Failed to save device integration preferences:', error);
    return false;
  } finally {
    isSaving.value = false;
  }
};

const skipStep = () => {
  saveProgress();
  goToStep(9);
};

const saveAndExit = async () => {
  await savePreferencesToBackend();
  saveProgress();
  router.push({ name: 'Patient Dashboard' });
};

const saveAndContinue = async () => {
  const saved = await savePreferencesToBackend();
  if (connectedProviders.value.length > 0 && saved) {
    completeStep('deviceIntegration');
  }
  saveProgress();
  goToStep(9);
};

// On mount: load real integrations from backend
onMounted(async () => {
  await store.dispatch('healthIntegrations/fetchIntegrations');
});
</script>

<style scoped lang="scss">
@import './styles/step-common.scss';

.app-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.app-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #F8FAFC;
  border: 2px solid #E2E8F0;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #CBD5E1;
  }

  &.connected {
    background: #E1F5FE;
    border-color: #4FC3F7;
    cursor: default;
  }

  &.connecting {
    opacity: 0.7;
    pointer-events: none;
  }
}

.app-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.app-info {
  flex: 1;

  h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1A365D;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.75rem;
    color: #64748B;
    margin: 0;
  }
}

.app-status {
  color: #64748B;
  font-size: 0.875rem;
  font-weight: 600;

  .connected & {
    color: #10B981;
  }

  .connecting-text {
    color: #4285F4;
    font-style: italic;
  }
}

.info-note {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #E1F5FE;
  border-radius: 0.75rem;
  color: #0288D1;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    font-size: 0.875rem;
    margin: 0;
    line-height: 1.5;

    a {
      color: #0277BD;
      font-weight: 600;
      text-decoration: underline;
      cursor: pointer;
    }
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .app-card {
    padding: 0.875rem;
    gap: 0.75rem;
  }

  .app-icon {
    width: 40px;
    height: 40px;
    border-radius: 0.625rem;
  }

  .app-info {
    h4 {
      font-size: 0.875rem;
    }

    p {
      font-size: 0.6875rem;
    }
  }

  .app-status {
    font-size: 0.8125rem;
  }

}
</style>
