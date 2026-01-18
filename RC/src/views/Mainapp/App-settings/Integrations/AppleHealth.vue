<template>
  <div class="integrations__wrapper">
    <div class="integrations__leftContent">
      <div>
        <img
          :src="require('@/assets/logos/apple-health.svg')"
          alt="apple-health-logo"
        />
      </div>
      <div>
        <p class="integrations__text">Apple HealthKit</p>
        <p class="integrations__subText">
          Connect with your Apple account for a seamless experience
        </p>
        <div v-if="integrationStatus === 'connected'" class="integration-status">
          <span class="status-connected">✓ Connected</span>
          <p class="last-sync">Last synced: {{ formatDate(lastSyncedAt) }}</p>
        </div>
        <div v-if="requiresNativeApp" class="native-app-notice">
          <i class="fas fa-mobile-alt"></i>
          <span>Requires Rapid Capsule mobile app</span>
        </div>
      </div>
    </div>
    <div class="integration-actions">
      <rc-button
        v-if="integrationStatus !== 'connected'"
        type="primary"
        :label="connecting ? 'Connecting...' : 'Connect'"
        size="small"
        :disabled="connecting"
        @click="connectToAppleHealth"
      />
      <div v-else class="connected-actions">
        <rc-button
          type="secondary"
          :label="syncing ? 'Syncing...' : 'Sync Now'"
          size="small"
          :disabled="syncing"
          @click="syncNow"
        />
        <rc-button
          type="danger"
          label="Disconnect"
          size="small"
          @click="disconnectIntegration"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import RcButton from "@/components/buttons/button-primary";
import healthIntegrationsService from '@/services/health-integrations.service';
import { notifySuccess, notifyError, notifyInfo } from '@/utilities/toast';

export default defineComponent({
  name: "Apple Health",
  components: { RcButton },
  setup() {
    const integrationStatus = ref('disconnected');
    const lastSyncedAt = ref(null);
    const connecting = ref(false);
    const syncing = ref(false);
    const requiresNativeApp = ref(false);

    const checkIntegrationStatus = async () => {
      try {
        const response = await healthIntegrationsService.getIntegrationStatus('apple_health');
        integrationStatus.value = response.data.status;
        lastSyncedAt.value = response.data.lastSyncedAt;
      } catch (error) {
        console.error('Error checking integration status:', error);
      }
    };

    const connectToAppleHealth = async () => {
      connecting.value = true;
      try {
        const response = await healthIntegrationsService.connectIntegration({
          provider: 'apple_health',
          dataTypes: ['heart_rate', 'steps', 'calories', 'sleep', 'weight', 'blood_pressure'],
          autoSync: true,
          syncDirection: 'bidirectional',
          metadata: {
            syncFrequency: 'daily',
          },
        });

        if (response.data.requiresNativeApp) {
          requiresNativeApp.value = true;
          notifyInfo('Apple HealthKit requires the Rapid Capsule mobile app. Please download and install our mobile app to connect your Apple Health data.');
        }
      } catch (error) {
        notifyError('Failed to connect Apple HealthKit');
        console.error('Connection error:', error);
      } finally {
        connecting.value = false;
      }
    };

    const syncNow = async () => {
      syncing.value = true;
      try {
        const response = await healthIntegrationsService.syncHealthData('apple_health', {
          dataTypes: ['heart_rate', 'steps', 'calories', 'sleep', 'weight', 'blood_pressure'],
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          endDate: new Date(),
        });
        
        notifySuccess(`Synced ${response.data.syncedCount} data points`);
        lastSyncedAt.value = response.data.lastSyncedAt;
      } catch (error) {
        notifyError('Sync failed');
        console.error('Sync error:', error);
      } finally {
        syncing.value = false;
      }
    };

    const disconnectIntegration = async () => {
      if (confirm('Are you sure you want to disconnect Apple HealthKit?')) {
        try {
          await healthIntegrationsService.disconnectIntegration('apple_health');
          integrationStatus.value = 'disconnected';
          lastSyncedAt.value = null;
          requiresNativeApp.value = false;
          notifySuccess('Apple HealthKit disconnected');
        } catch (error) {
          notifyError('Failed to disconnect Apple HealthKit');
          console.error('Disconnect error:', error);
        }
      }
    };

    const formatDate = (date) => {
      if (!date) return 'Never';
      return new Date(date).toLocaleString();
    };

    onMounted(async () => {
      await checkIntegrationStatus();
    });

    return {
      integrationStatus,
      lastSyncedAt,
      connecting,
      syncing,
      requiresNativeApp,
      connectToAppleHealth,
      syncNow,
      disconnectIntegration,
      formatDate,
    };
  },
});
</script>

<style lang="scss" scoped>
.integration-status {
  margin-top: 8px;
}

.status-connected {
  color: #10b981;
  font-weight: 600;
  font-size: 14px;
}

.last-sync {
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0 0;
}

.native-app-notice {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #92400e;
}

.native-app-notice i {
  color: #f59e0b;
}

.connected-actions {
  display: flex;
  gap: 8px;
}
</style>
