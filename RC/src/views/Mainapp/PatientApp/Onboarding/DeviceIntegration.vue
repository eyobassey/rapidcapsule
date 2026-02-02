<template>
  <div class="step-container">
    <div class="step-scroll">
      <div class="step-content">
        <div class="step-header">
          <button class="back-btn" @click="goBack">
            <v-icon name="hi-arrow-left" scale="0.9" />
            <span>Back</span>
          </button>
          <div class="step-info">
            <span class="step-badge optional">Step 8 of 9 - Optional</span>
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
                :class="{ connected: isAppConnected(app.id) }"
                @click="toggleApp(app.id)"
              >
                <div class="app-icon" :style="{ background: app.color }">
                  <v-icon :name="app.icon" scale="1.2" />
                </div>
                <div class="app-info">
                  <h4>{{ app.name }}</h4>
                  <p>{{ app.description }}</p>
                </div>
                <div class="app-status">
                  <v-icon v-if="isAppConnected(app.id)" name="hi-check-circle" scale="1" />
                  <span v-else>Connect</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Data Sharing -->
          <div class="form-section">
            <h2 class="section-title">Data Sharing Preferences</h2>
            <p class="section-description">Choose what health data to sync automatically.</p>
            <div class="toggle-list">
              <label class="toggle-item">
                <div class="toggle-info">
                  <h4>Vitals Auto-Sync</h4>
                  <p>Automatically update blood pressure, heart rate, etc.</p>
                </div>
                <input type="checkbox" v-model="deviceIntegration.data_sharing_consents.vitals_auto_sync" class="toggle-input" />
              </label>
              <label class="toggle-item">
                <div class="toggle-info">
                  <h4>Activity Tracking</h4>
                  <p>Steps, exercise, and movement data</p>
                </div>
                <input type="checkbox" v-model="deviceIntegration.data_sharing_consents.activity_tracking" class="toggle-input" />
              </label>
              <label class="toggle-item">
                <div class="toggle-info">
                  <h4>Sleep Tracking</h4>
                  <p>Sleep duration and quality data</p>
                </div>
                <input type="checkbox" v-model="deviceIntegration.data_sharing_consents.sleep_tracking" class="toggle-input" />
              </label>
            </div>
          </div>

          <!-- Notification Preferences -->
          <div class="form-section">
            <h2 class="section-title">Notification Preferences</h2>
            <div class="toggle-list">
              <label class="toggle-item">
                <div class="toggle-info">
                  <h4>Health Reminders</h4>
                  <p>Reminders for checkups and health goals</p>
                </div>
                <input type="checkbox" v-model="deviceIntegration.notification_preferences.health_reminders" class="toggle-input" />
              </label>
              <label class="toggle-item">
                <div class="toggle-info">
                  <h4>Medication Reminders</h4>
                  <p>Never miss a dose</p>
                </div>
                <input type="checkbox" v-model="deviceIntegration.notification_preferences.medication_reminders" class="toggle-input" />
              </label>
              <label class="toggle-item">
                <div class="toggle-info">
                  <h4>Wellness Tips</h4>
                  <p>Personalized health tips and insights</p>
                </div>
                <input type="checkbox" v-model="deviceIntegration.notification_preferences.wellness_tips" class="toggle-input" />
              </label>
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
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { usePatientOnboardingState } from './composables/usePatientOnboardingState';

const router = useRouter();
const store = useStore();
const $http = inject('$http');
const { deviceIntegration, completeStep, saveProgress, goToStep } = usePatientOnboardingState();

const isSaving = ref(false);

const healthApps = [
  { id: 'apple_health', name: 'Apple Health', description: 'iOS health data', icon: 'fa-apple', color: '#FF3B30' },
  { id: 'google_fit', name: 'Google Fit', description: 'Android fitness', icon: 'fa-google', color: '#4285F4' },
  { id: 'fitbit', name: 'Fitbit', description: 'Activity tracking', icon: 'hi-heart', color: '#00B0B9' },
  { id: 'samsung_health', name: 'Samsung Health', description: 'Samsung devices', icon: 'hi-device-mobile', color: '#1428A0' },
];

const goBack = () => goToStep(7);

const isAppConnected = (appId) => {
  return deviceIntegration.health_apps_connected.includes(appId);
};

const toggleApp = (appId) => {
  const index = deviceIntegration.health_apps_connected.indexOf(appId);
  if (index > -1) {
    deviceIntegration.health_apps_connected.splice(index, 1);
  } else {
    deviceIntegration.health_apps_connected.push(appId);
  }
};

// Save device integration preferences to backend
const saveDeviceIntegrationToBackend = async () => {
  const hasData =
    deviceIntegration.health_apps_connected.length > 0 ||
    deviceIntegration.data_sharing_consents.vitals_auto_sync ||
    deviceIntegration.data_sharing_consents.activity_tracking ||
    deviceIntegration.data_sharing_consents.sleep_tracking ||
    deviceIntegration.notification_preferences.health_reminders ||
    deviceIntegration.notification_preferences.medication_reminders ||
    deviceIntegration.notification_preferences.wellness_tips;

  if (!hasData) return true;

  try {
    isSaving.value = true;
    await $http.$_updateUser({
      device_integration: {
        health_apps_connected: deviceIntegration.health_apps_connected,
        devices_connected: deviceIntegration.devices_connected || [],
        data_sharing_consents: deviceIntegration.data_sharing_consents,
        notification_preferences: deviceIntegration.notification_preferences,
      },
    });
    // Refresh user profile in store
    await store.dispatch('authenticate', localStorage.getItem('token') || sessionStorage.getItem('token'));
    return true;
  } catch (error) {
    console.error('Failed to save device integration:', error);
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
  await saveDeviceIntegrationToBackend();
  saveProgress();
  router.push({ name: 'Patient Dashboard' });
};

const saveAndContinue = async () => {
  const hasData = deviceIntegration.health_apps_connected.length > 0;
  const saved = await saveDeviceIntegrationToBackend();

  if (hasData && saved) {
    completeStep('deviceIntegration');
  }
  saveProgress();
  goToStep(9);
};
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
}

.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #F8FAFC;
  border-radius: 0.75rem;
  cursor: pointer;
}

.toggle-info {
  h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1A365D;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.8125rem;
    color: #64748B;
    margin: 0;
  }
}

.toggle-input {
  width: 48px;
  height: 24px;
  appearance: none;
  background: #CBD5E1;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all 0.2s;
  }

  &:checked {
    background: #4FC3F7;

    &::before {
      transform: translateX(24px);
    }
  }
}
</style>
