<template>
  <div class="integrations__wrapper">
    <div class="integrations__leftContent">
      <div>
        <img
          :src="require('@/assets/logos/google-health.svg')"
          alt="google-health-logo"
        />
      </div>
      <div>
        <p class="integrations__text">Google Fit</p>
        <p class="integrations__subText">
          Connect with your Google account for a seamless experience
        </p>
        <div v-if="integrationStatus === 'connected'" class="integration-status">
          <span class="status-connected">✓ Connected</span>
          <p class="last-sync">Last synced: {{ formatDate(lastSyncedAt) }}</p>
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
        @click="connectToGoogle"
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

    <!-- OAuth Callback Processing -->
    <div v-if="processingCallback" class="callback-overlay">
      <div class="callback-content">
        <div class="spinner"></div>
        <p>Processing Google Fit authorization...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useRouter, useRoute } from 'vue-router';
import RcButton from "@/components/buttons/button-primary";
import healthIntegrationsService from '@/services/health-integrations.service';
import { useToast } from 'vue-toast-notification';
import { notifySuccess, notifyError } from '@/utilities/toast';

export default defineComponent({
  name: "Google Health",
  components: { RcButton },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();
    
    const integrationStatus = ref('disconnected');
    const lastSyncedAt = ref(null);
    const connecting = ref(false);
    const syncing = ref(false);
    const processingCallback = ref(false);

    const checkIntegrationStatus = async () => {
      try {
        const response = await healthIntegrationsService.getIntegrationStatus('google_fit');
        integrationStatus.value = response.data.status;
        lastSyncedAt.value = response.data.lastSyncedAt;
      } catch (error) {
        console.error('Error checking integration status:', error);
      }
    };

    const connectToGoogle = async () => {
      connecting.value = true;
      try {
        const response = await healthIntegrationsService.connectIntegration({
          provider: 'google_fit',
          dataTypes: ['heart_rate', 'steps', 'calories', 'sleep', 'weight', 'blood_pressure'],
          autoSync: true,
          syncDirection: 'bidirectional',
          metadata: {
            syncFrequency: 'daily',
          },
        });

        if (response.data.authUrl) {
          // Redirect to Google OAuth
          window.location.href = response.data.authUrl;
        } else if (response.data.requiresNativeApp) {
          notifyError('Google Fit integration requires the mobile app');
        }
      } catch (error) {
        notifyError('Failed to connect Google Fit');
        console.error('Connection error:', error);
      } finally {
        connecting.value = false;
      }
    };

    const handleOAuthCallback = async () => {
      const code = route.query.code;
      const state = route.query.state;
      
      if (code) {
        processingCallback.value = true;
        try {
          await healthIntegrationsService.handleGoogleFitCallback(code, state);
          notifySuccess('Google Fit connected successfully!');
          integrationStatus.value = 'connected';
          
          // Clear query params
          router.replace({ query: {} });
          
          // Refresh status
          await checkIntegrationStatus();
        } catch (error) {
          notifyError('Failed to complete Google Fit connection');
          console.error('Callback error:', error);
        } finally {
          processingCallback.value = false;
        }
      }
    };

    const syncNow = async () => {
      syncing.value = true;
      try {
        const response = await healthIntegrationsService.syncHealthData('google_fit', {
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
      if (confirm('Are you sure you want to disconnect Google Fit?')) {
        try {
          await healthIntegrationsService.disconnectIntegration('google_fit');
          integrationStatus.value = 'disconnected';
          lastSyncedAt.value = null;
          notifySuccess('Google Fit disconnected');
        } catch (error) {
          notifyError('Failed to disconnect Google Fit');
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
      await handleOAuthCallback();
    });

    return {
      integrationStatus,
      lastSyncedAt,
      connecting,
      syncing,
      processingCallback,
      connectToGoogle,
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

.connected-actions {
  display: flex;
  gap: 8px;
}

.callback-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.callback-content {
  background: white;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.callback-content p {
  margin-top: 16px;
  font-size: 16px;
  color: #374151;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
