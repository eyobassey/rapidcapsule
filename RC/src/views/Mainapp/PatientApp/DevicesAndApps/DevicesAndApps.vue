<template>
  <div class="devices-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="notification-btn" @click="$router.push('/app/patient/notifications')">
        <v-icon name="hi-bell" scale="1.1" />
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link desktop-only" @click="$router.push('/app/patient/dashboard')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Dashboard</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-device-mobile" />
            <span>Health Integrations</span>
          </div>
          <h1 class="hero__title">
            Devices &<br/>
            <span class="hero__title-accent">Health Apps</span>
          </h1>
          <p class="hero__subtitle">
            Connect your health devices and apps to automatically sync your health data.
          </p>
          <div class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ connectedCount }}</span>
              <span class="hero-stat__label">Connected</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ availableCount }}</span>
              <span class="hero-stat__label">Available</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Error Alert -->
      <div v-if="error" class="error-alert">
        <v-icon name="hi-exclamation-circle" scale="0.9" />
        <span>{{ error }}</span>
        <button @click="clearError">
          <v-icon name="hi-x" scale="0.8" />
        </button>
      </div>

      <!-- Connected Devices Section -->
      <section v-if="connectedDevices.length > 0" class="section">
        <div class="section-header">
          <h2 class="section-title">Connected Devices</h2>
          <button class="btn-sync-all" @click="syncAll" :disabled="isSyncingAny">
            <v-icon name="hi-refresh" scale="0.85" :class="{ spinning: isSyncingAny }" />
            <span>Sync All</span>
          </button>
        </div>
        <div class="provider-grid">
          <ProviderCard
            v-for="device in connectedDevices"
            :key="device.provider"
            :provider="getProviderInfo(device.provider)"
            :integration="device"
            :is-syncing="isSyncing(device.provider)"
            :is-available="true"
            @sync="syncProvider"
            @disconnect="confirmDisconnect"
          />
        </div>
      </section>

      <!-- Health Data Preview -->
      <section v-if="latestHealthData.length > 0" class="section">
        <div class="section-header">
          <h2 class="section-title">Synced Health Data</h2>
          <button class="btn-view-vitals" @click="$router.push('/app/patient/health-monitor/vitals')">
            <span>View in Vitals</span>
            <v-icon name="hi-arrow-right" scale="0.8" />
          </button>
        </div>
        <div class="health-data-grid">
          <div v-for="item in latestHealthData" :key="item._id" class="health-data-card">
            <div class="health-data-card__icon" :style="{ background: getDataTypeColor(item.dataType) }">
              <v-icon :name="getDataTypeIcon(item.dataType)" scale="0.9" />
            </div>
            <div class="health-data-card__content">
              <div class="health-data-card__label">{{ formatDataType(item.dataType) }}</div>
              <div class="health-data-card__value">
                {{ item.value.primary }} <span class="health-data-card__unit">{{ formatUnit(item.value.unit, item.dataType) }}</span>
              </div>
              <div class="health-data-card__meta">
                <span>{{ formatRelativeTime(item.recordedAt) }}</span>
                <span v-if="item.isSyncedToVitals" class="synced-badge">
                  <v-icon name="hi-check-circle" scale="0.6" /> In Vitals
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Available Providers Section -->
      <section class="section">
        <h2 class="section-title">
          {{ connectedDevices.length > 0 ? 'Add More Devices' : 'Available Devices & Apps' }}
        </h2>
        <p class="section-description">
          Connect your health apps and wearables to automatically sync data.
        </p>
        <div class="provider-grid">
          <ProviderCard
            v-for="provider in disconnectedProviders"
            :key="provider.id"
            :provider="provider"
            :integration="null"
            :is-available="isProviderAvailable(provider.id)"
            @connect="connectProvider"
          />
        </div>
      </section>

      <!-- Sync History -->
      <section class="section">
        <SyncStatus :sync-logs="syncLogs" />
      </section>

      <!-- Loading Overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    </div>

    <!-- Disconnect Confirmation Modal -->
    <div v-if="disconnectTarget" class="modal-overlay" @click="disconnectTarget = null">
      <div class="modal" @click.stop>
        <h3>Disconnect {{ getProviderInfo(disconnectTarget).name }}?</h3>
        <p>This will stop syncing health data from this device. Your existing data will be preserved.</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="disconnectTarget = null">Cancel</button>
          <button class="btn-danger" @click="doDisconnect">Disconnect</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import ProviderCard from "./ProviderCard.vue";
import SyncStatus from "./SyncStatus.vue";

const ALL_PROVIDERS = [
  { id: 'apple_health', name: 'Apple Health', description: 'iOS health data', icon: 'fa-apple', color: '#FF3B30', type: 'direct' },
  { id: 'google_fit', name: 'Google Fit', description: 'Android fitness tracking', icon: 'fa-google', color: '#4285F4', type: 'direct' },
  { id: 'garmin', name: 'Garmin', description: 'Garmin watches & trackers', icon: 'hi-clock', color: '#007CC3', type: 'open_wearables' },
  { id: 'polar', name: 'Polar', description: 'Polar fitness watches', icon: 'hi-heart', color: '#D42027', type: 'open_wearables' },
  { id: 'suunto', name: 'Suunto', description: 'Suunto sports watches', icon: 'hi-globe-alt', color: '#1A1A1A', type: 'open_wearables' },
  { id: 'whoop', name: 'Whoop', description: 'Whoop fitness band', icon: 'hi-lightning-bolt', color: '#44C868', type: 'open_wearables' },
];

export default {
  name: "DevicesAndApps",

  components: {
    ProviderCard,
    SyncStatus,
  },

  data() {
    return {
      disconnectTarget: null,
    };
  },

  computed: {
    ...mapGetters("healthIntegrations", [
      "integrations",
      "connectedDevices",
      "availableProviders",
      "syncLogs",
      "healthData",
      "isLoading",
      "error",
    ]),

    latestHealthData() {
      // Deduplicate by dataType — show only the latest value per type
      const byType = {};
      for (const item of this.healthData) {
        if (!byType[item.dataType] || new Date(item.recordedAt) > new Date(byType[item.dataType].recordedAt)) {
          byType[item.dataType] = item;
        }
      }
      return Object.values(byType);
    },

    connectedCount() {
      return this.connectedDevices.length;
    },

    availableCount() {
      return this.availableProviders.length;
    },

    disconnectedProviders() {
      const connectedIds = this.connectedDevices.map((d) => d.provider);
      return ALL_PROVIDERS.filter((p) => !connectedIds.includes(p.id));
    },

    isSyncingAny() {
      return this.connectedDevices.some((d) =>
        this.$store.getters["healthIntegrations/isSyncing"](d.provider)
      );
    },
  },

  methods: {
    ...mapActions("healthIntegrations", [
      "fetchIntegrations",
      "fetchAvailableProviders",
      "fetchSyncLogs",
      "fetchHealthData",
      "connectProvider",
      "syncNow",
      "disconnectProvider",
    ]),

    getProviderInfo(providerId) {
      return ALL_PROVIDERS.find((p) => p.id === providerId) || {
        id: providerId,
        name: providerId,
        description: '',
        icon: 'hi-device-mobile',
        color: '#94A3B8',
      };
    },

    isProviderAvailable(providerId) {
      return this.availableProviders.some((p) => p.name === providerId);
    },

    isSyncing(provider) {
      return this.$store.getters["healthIntegrations/isSyncing"](provider);
    },

    async connectProvider(providerId) {
      const result = await this.$store.dispatch("healthIntegrations/connectProvider", {
        provider: providerId,
        dataTypes: ['heart_rate', 'steps', 'blood_pressure', 'blood_glucose', 'weight', 'sleep'],
        autoSync: true,
      });

      if (result.requiresNativeApp) {
        alert(result.instructions);
      }
    },

    async syncProvider(providerId) {
      await this.syncNow(providerId);
      await Promise.all([this.fetchSyncLogs(10), this.fetchHealthData()]);
    },

    async syncAll() {
      const promises = this.connectedDevices.map((d) => this.syncNow(d.provider));
      await Promise.allSettled(promises);
      await Promise.all([this.fetchSyncLogs(10), this.fetchHealthData()]);
    },

    confirmDisconnect(providerId) {
      this.disconnectTarget = providerId;
    },

    async doDisconnect() {
      if (this.disconnectTarget) {
        await this.disconnectProvider(this.disconnectTarget);
        this.disconnectTarget = null;
      }
    },

    clearError() {
      this.$store.commit("healthIntegrations/SET_ERROR", null);
    },

    formatDataType(type) {
      const names = {
        heart_rate: 'Heart Rate',
        steps: 'Steps',
        weight: 'Weight',
        blood_pressure: 'Blood Pressure',
        blood_glucose: 'Blood Glucose',
        body_temperature: 'Temperature',
        oxygen_saturation: 'SpO2',
        calories_burned: 'Calories',
        distance: 'Distance',
        sleep: 'Sleep',
      };
      return names[type] || type;
    },

    getDataTypeIcon(type) {
      const icons = {
        heart_rate: 'hi-heart',
        steps: 'bi-activity',
        weight: 'gi-weight-scale',
        blood_pressure: 'gi-heart-beats',
        blood_glucose: 'gi-drop',
        body_temperature: 'fa-thermometer-half',
        oxygen_saturation: 'ri-lungs-line',
        calories_burned: 'hi-fire',
        distance: 'hi-map',
        sleep: 'hi-moon',
      };
      return icons[type] || 'hi-chart-bar';
    },

    getDataTypeColor(type) {
      const colors = {
        heart_rate: '#FEE2E2',
        steps: '#DBEAFE',
        weight: '#E0E7FF',
        blood_pressure: '#FCE7F3',
        blood_glucose: '#FEF3C7',
        body_temperature: '#FFEDD5',
        oxygen_saturation: '#D1FAE5',
        calories_burned: '#FEE2E2',
        distance: '#DBEAFE',
        sleep: '#EDE9FE',
      };
      return colors[type] || '#F1F5F9';
    },

    formatUnit(unit, dataType) {
      // Clean up Google Fit unit names
      if (unit && unit.startsWith('com.google.')) {
        const unitMap = {
          weight: 'kg',
          heart_rate: 'bpm',
          steps: 'steps',
          blood_pressure: 'mmHg',
          blood_glucose: 'mg/dL',
          body_temperature: '°C',
        };
        return unitMap[dataType] || '';
      }
      return unit || '';
    },

    formatRelativeTime(dateStr) {
      if (!dateStr) return '';
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    },
  },

  async mounted() {
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      // Decode state to get provider info (format: userId:provider:timestamp)
      try {
        const decoded = atob(state);
        const parts = decoded.split(':');
        const provider = parts[1]; // userId:provider:timestamp
        if (provider) {
          await this.$store.dispatch("healthIntegrations/handleOAuthCallback", {
            provider,
            code,
          });
        }
      } catch (e) {
        console.error('Failed to process OAuth callback:', e);
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);

      // If user came from onboarding, redirect back
      const returnTo = sessionStorage.getItem('onboarding_return');
      if (returnTo) {
        sessionStorage.removeItem('onboarding_return');
        this.$router.push(returnTo);
        return;
      }
    }

    // Load data
    await Promise.all([
      this.fetchIntegrations(),
      this.fetchAvailableProviders(),
      this.fetchSyncLogs(10),
      this.fetchHealthData(),
    ]);
  },
};
</script>

<style scoped lang="scss">
.devices-page {
  width: 100%;
  min-height: 100vh;
  background: #FAFBFC;
}

/* Mobile Header */
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  padding: 0.75rem 1rem;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #E2E8F0;

  @media (max-width: 768px) {
    display: flex;
  }
}

.menu-btn,
.notification-btn {
  background: none;
  border: none;
  color: #475569;
  cursor: pointer;
  padding: 0.5rem;
}

.header-logo img {
  height: 28px;
}

.desktop-only {
  @media (max-width: 768px) {
    display: none;
  }
}

/* Page Content */
.page-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
}

/* Hero */
.hero {
  margin-bottom: 2rem;
}

.hero__content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  color: #64748B;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;

  &:hover {
    color: #334155;
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  background: #E1F5FE;
  color: #0288D1;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  width: fit-content;
}

.hero__title {
  font-size: 2rem;
  font-weight: 700;
  color: #1A365D;
  line-height: 1.2;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
}

.hero__title-accent {
  color: #0288D1;
}

.hero__subtitle {
  font-size: 1rem;
  color: #64748B;
  margin: 0;
  line-height: 1.5;
}

.hero__stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.hero-stat {
  display: flex;
  flex-direction: column;
}

.hero-stat__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1A365D;
}

.hero-stat__label {
  font-size: 0.75rem;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hero-stat__divider {
  width: 1px;
  height: 2rem;
  background: #E2E8F0;
}

/* Error Alert */
.error-alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  color: #DC2626;
  font-size: 0.875rem;

  span {
    flex: 1;
  }

  button {
    background: none;
    border: none;
    color: #DC2626;
    cursor: pointer;
    padding: 0.25rem;
  }
}

/* Sections */
.section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1A365D;
  margin: 0 0 0.25rem 0;
}

.section-description {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0 0 1rem 0;
}

.btn-sync-all {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F1F5F9;
    border-color: #CBD5E1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Provider Grid */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

/* Health Data Preview */
.health-data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.health-data-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

.health-data-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 0.625rem;
  flex-shrink: 0;
  color: #475569;
}

.health-data-card__content {
  flex: 1;
  min-width: 0;
}

.health-data-card__label {
  font-size: 0.75rem;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 500;
}

.health-data-card__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1A365D;
  line-height: 1.3;
}

.health-data-card__unit {
  font-size: 0.8125rem;
  font-weight: 400;
  color: #64748B;
}

.health-data-card__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #94A3B8;
  margin-top: 0.125rem;
}

.synced-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  color: #059669;
  font-weight: 500;
}

.btn-view-vitals {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #0288D1;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #0277BD;
  }
}

/* Loading */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E2E8F0;
  border-top-color: #4FC3F7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1A365D;
    margin: 0 0 0.5rem 0;
  }

  p {
    font-size: 0.875rem;
    color: #64748B;
    line-height: 1.5;
    margin: 0 0 1.5rem 0;
  }
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 0.5rem 1rem;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    background: #E2E8F0;
  }
}

.btn-danger {
  padding: 0.5rem 1rem;
  background: #EF4444;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #DC2626;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
