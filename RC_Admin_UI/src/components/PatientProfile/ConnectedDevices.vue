<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

const integrations = ref([])
const syncLogs = ref([])
const loading = ref(false)
const error = ref(false)

const providerNames = {
  google_fit: 'Google Fit',
  samsung_health: 'Samsung Health',
  apple_health: 'Apple Health',
  garmin: 'Garmin',
  polar: 'Polar',
  suunto: 'Suunto',
  whoop: 'Whoop',
}

const providerIcons = {
  google_fit: 'mdi-google-fit',
  samsung_health: 'mdi-cellphone',
  apple_health: 'mdi-apple',
  garmin: 'mdi-watch',
  polar: 'mdi-heart-pulse',
  suunto: 'mdi-compass',
  whoop: 'mdi-lightning-bolt',
}

const statusColors = {
  connected: 'success',
  disconnected: 'grey',
  pending: 'warning',
  error: 'error',
}

const syncStatusColors = {
  completed: 'success',
  failed: 'error',
  started: 'warning',
}

const fetchData = async () => {
  if (!props.userData?._id) return

  loading.value = true
  error.value = false

  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const headers = {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    }

    const [integrationsRes, syncLogsRes] = await Promise.all([
      fetch(`/admin-api/health-integrations/patient/${props.userData._id}`, { headers }),
      fetch(`/admin-api/health-integrations/patient/${props.userData._id}/sync-logs?limit=20`, { headers }),
    ])

    if (!integrationsRes.ok || !syncLogsRes.ok) throw new Error('Failed to fetch')

    const integrationsData = await integrationsRes.json()
    const syncLogsData = await syncLogsRes.json()

    integrations.value = integrationsData.result || []
    syncLogs.value = syncLogsData.result || []
  } catch (err) {
    console.error('Error fetching connected devices:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchData())

const connectedDevices = computed(() =>
  integrations.value.filter(i => i.status === 'connected')
)

const otherDevices = computed(() =>
  integrations.value.filter(i => i.status !== 'connected')
)

const formatDate = (dateStr) => {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleString()
}

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>

<template>
  <VCardText>
    <!-- Header -->
    <div class="mb-6">
      <h3 class="text-h6 mb-2 d-flex align-center">
        <VIcon class="mr-2" color="primary">mdi-devices</VIcon>
        Connected Devices & Health Apps
      </h3>
      <p class="text-body-2 text-medium-emphasis">
        Health devices and integrations synced with this patient's account.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <VProgressCircular indeterminate color="primary" size="40" />
      <div class="text-body-2 mt-3">Loading connected devices...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-8">
      <VAlert type="error" variant="tonal" class="mb-4">
        <VIcon start>mdi-alert-circle</VIcon>
        Error loading connected devices. Please try again.
      </VAlert>
      <VBtn @click="fetchData" color="primary" variant="outlined">
        <VIcon start>mdi-refresh</VIcon>
        Retry
      </VBtn>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Connected Devices -->
      <div v-if="connectedDevices.length > 0" class="mb-6">
        <div class="text-subtitle-2 font-weight-medium mb-3 d-flex align-center">
          <VIcon size="18" color="success" class="mr-1">mdi-check-circle</VIcon>
          Connected ({{ connectedDevices.length }})
        </div>
        <VRow>
          <VCol v-for="device in connectedDevices" :key="device._id" cols="12" md="6">
            <VCard variant="outlined" class="device-card">
              <VCardText>
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex align-center">
                    <VIcon
                      :icon="providerIcons[device.provider] || 'mdi-devices'"
                      size="28"
                      color="primary"
                      class="mr-3"
                    />
                    <div>
                      <div class="text-subtitle-2 font-weight-medium">
                        {{ providerNames[device.provider] || device.provider }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ device.providerType === 'open_wearables' ? 'Via Open Wearables' : 'Direct' }}
                      </div>
                    </div>
                  </div>
                  <VChip :color="statusColors[device.status]" variant="tonal" size="small">
                    {{ device.status }}
                  </VChip>
                </div>

                <VDivider class="my-3" />

                <div class="text-caption text-medium-emphasis">
                  <div class="d-flex justify-space-between mb-1">
                    <span>Last Synced</span>
                    <span class="font-weight-medium">{{ formatRelativeTime(device.lastSyncedAt) }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-1">
                    <span>Auto-Sync</span>
                    <VIcon
                      :icon="device.syncSettings?.autoSync ? 'mdi-check' : 'mdi-close'"
                      :color="device.syncSettings?.autoSync ? 'success' : 'grey'"
                      size="16"
                    />
                  </div>
                  <div v-if="device.metadata?.dataTypes" class="mt-2">
                    <span>Data Types: </span>
                    <VChip
                      v-for="dt in device.metadata.dataTypes.slice(0, 4)"
                      :key="dt"
                      size="x-small"
                      variant="tonal"
                      class="mr-1 mb-1"
                    >
                      {{ dt }}
                    </VChip>
                    <VChip
                      v-if="device.metadata.dataTypes.length > 4"
                      size="x-small"
                      variant="tonal"
                    >
                      +{{ device.metadata.dataTypes.length - 4 }}
                    </VChip>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <!-- Disconnected / Error Devices -->
      <div v-if="otherDevices.length > 0" class="mb-6">
        <div class="text-subtitle-2 font-weight-medium mb-3 text-medium-emphasis">
          Other Integrations ({{ otherDevices.length }})
        </div>
        <VRow>
          <VCol v-for="device in otherDevices" :key="device._id" cols="12" md="6">
            <VCard variant="outlined" class="device-card" style="opacity: 0.7">
              <VCardText>
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center">
                    <VIcon
                      :icon="providerIcons[device.provider] || 'mdi-devices'"
                      size="24"
                      color="grey"
                      class="mr-3"
                    />
                    <div>
                      <div class="text-subtitle-2">
                        {{ providerNames[device.provider] || device.provider }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        Last active: {{ formatDate(device.lastSyncedAt) }}
                      </div>
                    </div>
                  </div>
                  <VChip :color="statusColors[device.status]" variant="tonal" size="small">
                    {{ device.status }}
                  </VChip>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <!-- Sync History -->
      <div v-if="syncLogs.length > 0">
        <div class="text-subtitle-2 font-weight-medium mb-3 d-flex align-center">
          <VIcon size="18" color="info" class="mr-1">mdi-sync</VIcon>
          Recent Sync Activity
        </div>
        <VTable density="compact" class="text-no-wrap">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Type</th>
              <th>Status</th>
              <th>Records</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in syncLogs.slice(0, 10)" :key="log._id">
              <td>
                <VIcon :icon="providerIcons[log.provider] || 'mdi-devices'" size="16" class="mr-1" />
                {{ providerNames[log.provider] || log.provider }}
              </td>
              <td>
                <VChip size="x-small" variant="tonal">{{ log.syncType }}</VChip>
              </td>
              <td>
                <VChip
                  :color="syncStatusColors[log.status] || 'grey'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ log.status }}
                </VChip>
              </td>
              <td>{{ log.recordsProcessed || 0 }}</td>
              <td class="text-caption">{{ formatRelativeTime(log.startedAt) }}</td>
            </tr>
          </tbody>
        </VTable>
      </div>

      <!-- Empty State -->
      <div
        v-if="integrations.length === 0 && syncLogs.length === 0"
        class="text-center py-12"
      >
        <VIcon size="64" color="grey-lighten-2" class="mb-4">mdi-devices-off</VIcon>
        <h4 class="text-h6 mb-2">No Connected Devices</h4>
        <p class="text-body-2 text-medium-emphasis">
          This patient has not connected any health devices or apps yet.
        </p>
      </div>
    </div>
  </VCardText>
</template>

<style scoped>
.device-card {
  transition: box-shadow 0.2s;
}
.device-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
