<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Compliance Dashboard</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Monitor fraud alerts, audit logs, and regulatory compliance</p>
      </div>
      <div class="d-flex gap-2">
        <VBtn color="warning" variant="outlined" prepend-icon="mdi-alert" @click="$router.push('/pharmacy/compliance/fraud-alerts')">
          Fraud Alerts
          <VBadge v-if="stats.openAlerts > 0" :content="stats.openAlerts" color="error" floating />
        </VBtn>
        <VBtn color="info" variant="outlined" prepend-icon="mdi-history" @click="$router.push('/pharmacy/compliance/audit-log')">
          Audit Log
        </VBtn>
      </div>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="6" md="3">
        <VCard :color="stats.openAlerts > 0 ? 'error' : 'success'" variant="tonal">
          <VCardText class="d-flex align-center">
            <VAvatar :color="stats.openAlerts > 0 ? 'error' : 'success'" variant="flat" size="48" class="me-4">
              <VIcon size="24">mdi-alert-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.openAlerts }}</div>
              <div class="text-body-2">Open Alerts</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="warning" variant="tonal">
          <VCardText class="d-flex align-center">
            <VAvatar color="warning" variant="flat" size="48" class="me-4">
              <VIcon size="24">mdi-account-search</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.investigating }}</div>
              <div class="text-body-2">Investigating</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="success" variant="tonal">
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="flat" size="48" class="me-4">
              <VIcon size="24">mdi-check-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.resolved }}</div>
              <div class="text-body-2">Resolved (30 days)</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="info" variant="tonal">
          <VCardText class="d-flex align-center">
            <VAvatar color="info" variant="flat" size="48" class="me-4">
              <VIcon size="24">mdi-clipboard-list</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.actionsToday }}</div>
              <div class="text-body-2">Actions Today</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Main Content -->
    <VRow>
      <!-- Open Fraud Alerts -->
      <VCol cols="12" lg="6">
        <VCard>
          <VCardTitle class="d-flex justify-space-between align-center">
            <span class="d-flex align-center">
              <VIcon color="error" class="me-2">mdi-alert</VIcon>
              Open Fraud Alerts
            </span>
            <VBtn variant="text" color="primary" size="small" @click="$router.push('/pharmacy/compliance/fraud-alerts')">
              View All
            </VBtn>
          </VCardTitle>
          <VCardText>
            <VList v-if="openAlerts.length > 0" lines="three">
              <VListItem
                v-for="alert in openAlerts"
                :key="alert._id"
                @click="viewAlert(alert._id)"
                class="cursor-pointer"
              >
                <template #prepend>
                  <VAvatar :color="getSeverityColor(alert.severity)" variant="tonal" size="40">
                    <VIcon>{{ getSeverityIcon(alert.severity) }}</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle class="font-weight-medium">{{ alert.alert_type.replace(/_/g, ' ').toUpperCase() }}</VListItemTitle>
                <VListItemSubtitle>
                  <div>{{ alert.description }}</div>
                  <div class="mt-1 text-caption">
                    <VChip size="x-small" :color="getSeverityColor(alert.severity)" class="me-1">{{ alert.severity }}</VChip>
                    <span class="text-medium-emphasis">{{ formatDate(alert.created_at) }}</span>
                  </div>
                </VListItemSubtitle>
                <template #append>
                  <VChip size="small" :color="getStatusColor(alert.status)">
                    {{ alert.status.replace(/_/g, ' ') }}
                  </VChip>
                </template>
              </VListItem>
            </VList>
            <VAlert v-else type="success" variant="tonal" icon="mdi-check-circle">
              No open fraud alerts
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Recent Activity -->
      <VCol cols="12" lg="6">
        <VCard>
          <VCardTitle class="d-flex justify-space-between align-center">
            <span class="d-flex align-center">
              <VIcon color="info" class="me-2">mdi-history</VIcon>
              Recent Activity
            </span>
            <VBtn variant="text" color="primary" size="small" @click="$router.push('/pharmacy/compliance/audit-log')">
              View All
            </VBtn>
          </VCardTitle>
          <VCardText>
            <VTimeline v-if="recentActivity.length > 0" density="compact" side="end">
              <VTimelineItem
                v-for="activity in recentActivity.slice(0, 10)"
                :key="activity._id"
                :dot-color="getActionColor(activity.action)"
                size="small"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="font-weight-medium text-body-2">{{ formatAction(activity.action) }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ activity.entity_type }} - {{ activity.performed_by_name || 'System' }}
                    </div>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTimeAgo(activity.created_at) }}
                  </div>
                </div>
              </VTimelineItem>
            </VTimeline>
            <VAlert v-else type="info" variant="tonal">
              No recent activity
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Alert Severity Breakdown -->
    <VRow class="mt-6">
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle>Alert Severity Breakdown</VCardTitle>
          <VCardText>
            <div v-for="(count, severity) in alertsBySeverity" :key="severity" class="mb-4">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-body-2">{{ severity }}</span>
                <span class="font-weight-medium">{{ count }}</span>
              </div>
              <VProgressLinear
                :model-value="(count / totalAlerts) * 100"
                :color="getSeverityColor(severity)"
                height="8"
                rounded
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle>Alert Types</VCardTitle>
          <VCardText>
            <div v-for="(count, type) in alertsByType" :key="type" class="mb-4">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-body-2">{{ formatAlertType(type) }}</span>
                <span class="font-weight-medium">{{ count }}</span>
              </div>
              <VProgressLinear
                :model-value="(count / totalAlerts) * 100"
                color="primary"
                height="8"
                rounded
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Loading Overlay -->
    <VOverlay v-model="loading" class="align-center justify-center" persistent>
      <VProgressCircular indeterminate size="64" color="primary" />
    </VOverlay>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)

const stats = ref({
  openAlerts: 0,
  investigating: 0,
  resolved: 0,
  actionsToday: 0,
})

const openAlerts = ref([])
const recentActivity = ref([])
const alertsBySeverity = ref({})
const alertsByType = ref({})

const totalAlerts = computed(() => {
  return Object.values(alertsBySeverity.value).reduce((a, b) => a + b, 0) || 1
})

const getSeverityColor = (severity) => {
  const colors = {
    low: 'info',
    medium: 'warning',
    high: 'error',
    critical: 'error',
  }
  return colors[severity?.toLowerCase()] || 'grey'
}

const getSeverityIcon = (severity) => {
  const icons = {
    low: 'mdi-information',
    medium: 'mdi-alert',
    high: 'mdi-alert-circle',
    critical: 'mdi-alert-octagon',
  }
  return icons[severity?.toLowerCase()] || 'mdi-alert'
}

const getStatusColor = (status) => {
  const colors = {
    open: 'error',
    investigating: 'warning',
    resolved: 'success',
    false_positive: 'grey',
    confirmed_fraud: 'error',
  }
  return colors[status?.toLowerCase()] || 'grey'
}

const getActionColor = (action) => {
  const colors = {
    CREATE: 'success',
    UPDATE: 'info',
    DELETE: 'error',
    APPROVE: 'success',
    REJECT: 'error',
    DISPENSE: 'primary',
    CANCEL: 'warning',
  }
  return colors[action] || 'grey'
}

const formatAction = (action) => {
  return action?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
}

const formatAlertType = (type) => {
  return type?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatTimeAgo = (date) => {
  if (!date) return 'N/A'
  const now = new Date()
  const past = new Date(date)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const viewAlert = (alertId) => {
  router.push(`/pharmacy/compliance/fraud-alerts?view=${alertId}`)
}

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const headers = {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    }

    // Fetch compliance dashboard data
    const [dashboardResponse, statsResponse] = await Promise.all([
      fetch('/admin-api/compliance/dashboard', { headers }),
      fetch('/admin-api/compliance/fraud-alerts/stats', { headers }),
    ])

    const dashboardData = await dashboardResponse.json()
    const statsData = await statsResponse.json()

    if (dashboardData.statusCode === 200 && dashboardData.data) {
      const fraudStats = dashboardData.data.fraud_alerts || {}
      recentActivity.value = dashboardData.data.recent_activity || []

      // Set open alerts from stats
      openAlerts.value = fraudStats.recent_alerts || []

      // Calculate stats
      stats.value.openAlerts = fraudStats.by_status?.open || 0
      stats.value.investigating = fraudStats.by_status?.investigating || 0
      stats.value.resolved = (fraudStats.by_status?.resolved || 0) +
                            (fraudStats.by_status?.false_positive || 0) +
                            (fraudStats.by_status?.confirmed_fraud || 0)
    }

    if (statsData.statusCode === 200 && statsData.data) {
      alertsBySeverity.value = statsData.data.by_severity || {}
      alertsByType.value = statsData.data.by_type || {}
      stats.value.actionsToday = recentActivity.value.filter(a => {
        const today = new Date().toDateString()
        return new Date(a.created_at).toDateString() === today
      }).length
    }
  } catch (error) {
    console.error('Error fetching compliance dashboard:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
