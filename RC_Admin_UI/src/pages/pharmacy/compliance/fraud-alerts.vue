<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <div class="d-flex align-center mb-1">
          <VBtn icon variant="text" size="small" @click="$router.push('/pharmacy/compliance')">
            <VIcon>mdi-arrow-left</VIcon>
          </VBtn>
          <h1 class="text-h4 font-weight-bold ms-2">Fraud Alerts</h1>
        </div>
        <p class="text-subtitle-1 text-medium-emphasis ms-10">Monitor and investigate potential fraud cases</p>
      </div>
      <div class="d-flex gap-2">
        <VBtn
          v-if="unassignedCount > 0"
          color="warning"
          variant="outlined"
          prepend-icon="mdi-account-plus"
          @click="showUnassigned = true"
        >
          Unassigned ({{ unassignedCount }})
        </VBtn>
        <VBtn color="primary" prepend-icon="mdi-refresh" @click="fetchAlerts">
          Refresh
        </VBtn>
      </div>
    </div>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="6" md="3">
            <VSelect
              v-model="filters.status"
              label="Status"
              :items="statusOptions"
              clearable
              density="compact"
              @update:model-value="fetchAlerts"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VSelect
              v-model="filters.severity"
              label="Severity"
              :items="severityOptions"
              clearable
              density="compact"
              @update:model-value="fetchAlerts"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VSelect
              v-model="filters.alert_type"
              label="Alert Type"
              :items="alertTypeOptions"
              clearable
              density="compact"
              @update:model-value="fetchAlerts"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VTextField
              v-model="filters.search"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              clearable
              density="compact"
              @update:model-value="debouncedSearch"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Alerts Table -->
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>Fraud Alerts ({{ totalAlerts }})</span>
        <VChip v-if="filters.status || filters.severity || filters.alert_type" color="primary" size="small" closable @click:close="clearFilters">
          Filtered
        </VChip>
      </VCardTitle>
      <VCardText>
        <VDataTable
          :headers="headers"
          :items="alerts"
          :loading="loading"
          :items-per-page="itemsPerPage"
          hover
          @click:row="(event, { item }) => viewAlertDetails(item)"
        >
          <template #item.alert_type="{ item }">
            <div class="font-weight-medium">{{ formatAlertType(item.alert_type) }}</div>
            <div class="text-caption text-medium-emphasis">{{ item._id.slice(-8) }}</div>
          </template>

          <template #item.severity="{ item }">
            <VChip :color="getSeverityColor(item.severity)" size="small">
              <VIcon start size="14">{{ getSeverityIcon(item.severity) }}</VIcon>
              {{ item.severity }}
            </VChip>
          </template>

          <template #item.status="{ item }">
            <VChip :color="getStatusColor(item.status)" size="small" variant="tonal">
              {{ formatStatus(item.status) }}
            </VChip>
          </template>

          <template #item.patient="{ item }">
            <div v-if="item.patient_id">
              <div class="font-weight-medium">{{ item.patient_name || 'Unknown' }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.patient_id?.slice(-8) }}</div>
            </div>
            <span v-else class="text-medium-emphasis">N/A</span>
          </template>

          <template #item.assigned_to="{ item }">
            <VChip v-if="item.assigned_to_name" size="small" color="primary" variant="outlined">
              {{ item.assigned_to_name }}
            </VChip>
            <VBtn
              v-else
              size="x-small"
              color="warning"
              variant="tonal"
              @click.stop="assignToMe(item)"
            >
              Assign to me
            </VBtn>
          </template>

          <template #item.created_at="{ item }">
            <div>{{ formatDate(item.created_at) }}</div>
            <div class="text-caption text-medium-emphasis">{{ formatTimeAgo(item.created_at) }}</div>
          </template>

          <template #item.actions="{ item }">
            <VBtn icon size="small" variant="text" @click.stop="viewAlertDetails(item)">
              <VIcon>mdi-eye</VIcon>
              <VTooltip activator="parent" location="top">View Details</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'open' || item.status === 'investigating'"
              icon
              size="small"
              variant="text"
              color="success"
              @click.stop="openResolveDialog(item)"
            >
              <VIcon>mdi-check</VIcon>
              <VTooltip activator="parent" location="top">Resolve</VTooltip>
            </VBtn>
          </template>
        </VDataTable>

        <!-- Pagination -->
        <div class="d-flex justify-center mt-4">
          <VPagination
            v-model="page"
            :length="Math.ceil(totalAlerts / itemsPerPage)"
            :total-visible="7"
            @update:model-value="fetchAlerts"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Alert Details Dialog -->
    <VDialog v-model="showDetails" max-width="800">
      <VCard v-if="selectedAlert">
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Alert Details</span>
          <VBtn icon variant="text" @click="showDetails = false">
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">Alert Type</div>
                <div class="text-body-1 font-weight-medium">{{ formatAlertType(selectedAlert.alert_type) }}</div>
              </div>
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">Severity</div>
                <VChip :color="getSeverityColor(selectedAlert.severity)" size="small">
                  {{ selectedAlert.severity }}
                </VChip>
              </div>
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">Status</div>
                <VChip :color="getStatusColor(selectedAlert.status)" size="small">
                  {{ formatStatus(selectedAlert.status) }}
                </VChip>
              </div>
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">Confidence Score</div>
                <VProgressLinear
                  :model-value="selectedAlert.confidence_score * 100"
                  :color="selectedAlert.confidence_score > 0.8 ? 'error' : selectedAlert.confidence_score > 0.5 ? 'warning' : 'info'"
                  height="20"
                  rounded
                >
                  <template #default>
                    {{ Math.round(selectedAlert.confidence_score * 100) }}%
                  </template>
                </VProgressLinear>
              </div>
            </VCol>
            <VCol cols="12" md="6">
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">Patient</div>
                <div class="text-body-1">{{ selectedAlert.patient_name || 'N/A' }}</div>
              </div>
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">Assigned To</div>
                <div class="text-body-1">{{ selectedAlert.assigned_to_name || 'Unassigned' }}</div>
              </div>
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">Created</div>
                <div class="text-body-1">{{ formatDate(selectedAlert.created_at) }}</div>
              </div>
              <div v-if="selectedAlert.resolved_at" class="mb-4">
                <div class="text-caption text-medium-emphasis">Resolved</div>
                <div class="text-body-1">{{ formatDate(selectedAlert.resolved_at) }}</div>
              </div>
            </VCol>
          </VRow>

          <VDivider class="my-4" />

          <div class="mb-4">
            <div class="text-caption text-medium-emphasis">Description</div>
            <div class="text-body-1">{{ selectedAlert.description }}</div>
          </div>

          <div v-if="selectedAlert.evidence && Object.keys(selectedAlert.evidence).length > 0" class="mb-4">
            <div class="text-caption text-medium-emphasis mb-2">Evidence</div>
            <VCard variant="outlined">
              <VCardText>
                <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selectedAlert.evidence, null, 2) }}</pre>
              </VCardText>
            </VCard>
          </div>

          <div v-if="selectedAlert.resolution" class="mb-4">
            <div class="text-caption text-medium-emphasis">Resolution</div>
            <VAlert type="success" variant="tonal" density="compact">
              {{ selectedAlert.resolution }}
            </VAlert>
          </div>

          <!-- Actions History -->
          <div v-if="selectedAlert.actions?.length > 0">
            <div class="text-caption text-medium-emphasis mb-2">Actions History</div>
            <VTimeline density="compact" side="end">
              <VTimelineItem
                v-for="(action, index) in selectedAlert.actions"
                :key="index"
                size="small"
                dot-color="primary"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="font-weight-medium text-body-2">{{ action.action }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ action.performed_by_name }} - {{ action.notes || 'No notes' }}
                    </div>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatDate(action.performed_at) }}
                  </div>
                </div>
              </VTimelineItem>
            </VTimeline>
          </div>
        </VCardText>
        <VDivider />
        <VCardActions>
          <VSpacer />
          <VBtn
            v-if="!selectedAlert.assigned_to"
            color="primary"
            variant="outlined"
            @click="assignToMe(selectedAlert)"
          >
            Assign to Me
          </VBtn>
          <VBtn
            v-if="selectedAlert.status === 'open' || selectedAlert.status === 'investigating'"
            color="info"
            variant="outlined"
            @click="openAddActionDialog"
          >
            Add Action
          </VBtn>
          <VBtn
            v-if="selectedAlert.status === 'open' || selectedAlert.status === 'investigating'"
            color="success"
            @click="openResolveDialog(selectedAlert)"
          >
            Resolve
          </VBtn>
          <VBtn
            v-if="selectedAlert.patient_id && selectedAlert.status !== 'false_positive'"
            color="error"
            variant="outlined"
            @click="blockPatient(selectedAlert)"
          >
            Block Patient
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Resolve Dialog -->
    <VDialog v-model="showResolve" max-width="500">
      <VCard>
        <VCardTitle>Resolve Fraud Alert</VCardTitle>
        <VCardText>
          <VSelect
            v-model="resolveData.status"
            label="Resolution Status"
            :items="resolutionStatuses"
            class="mb-4"
          />
          <VTextarea
            v-model="resolveData.resolution"
            label="Resolution Notes"
            rows="4"
            hint="Describe how this alert was resolved"
            persistent-hint
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showResolve = false">Cancel</VBtn>
          <VBtn
            color="success"
            :loading="resolving"
            :disabled="!resolveData.status || !resolveData.resolution"
            @click="resolveAlert"
          >
            Resolve
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Add Action Dialog -->
    <VDialog v-model="showAddAction" max-width="500">
      <VCard>
        <VCardTitle>Add Action</VCardTitle>
        <VCardText>
          <VTextField
            v-model="actionData.action"
            label="Action Taken"
            class="mb-4"
          />
          <VTextarea
            v-model="actionData.notes"
            label="Notes"
            rows="3"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showAddAction = false">Cancel</VBtn>
          <VBtn
            color="primary"
            :loading="addingAction"
            :disabled="!actionData.action"
            @click="addAction"
          >
            Add Action
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Unassigned Alerts Dialog -->
    <VDialog v-model="showUnassigned" max-width="600">
      <VCard>
        <VCardTitle>Unassigned Alerts</VCardTitle>
        <VCardText>
          <VList v-if="unassignedAlerts.length > 0">
            <VListItem
              v-for="alert in unassignedAlerts"
              :key="alert._id"
            >
              <template #prepend>
                <VAvatar :color="getSeverityColor(alert.severity)" variant="tonal">
                  <VIcon>{{ getSeverityIcon(alert.severity) }}</VIcon>
                </VAvatar>
              </template>
              <VListItemTitle>{{ formatAlertType(alert.alert_type) }}</VListItemTitle>
              <VListItemSubtitle>{{ alert.description?.substring(0, 50) }}...</VListItemSubtitle>
              <template #append>
                <VBtn size="small" color="primary" @click="assignToMe(alert)">
                  Assign to me
                </VBtn>
              </template>
            </VListItem>
          </VList>
          <VAlert v-else type="success" variant="tonal">
            All alerts are assigned
          </VAlert>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showUnassigned = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Loading Overlay -->
    <VOverlay v-model="loading" class="align-center justify-center" persistent>
      <VProgressCircular indeterminate size="64" color="primary" />
    </VOverlay>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const alerts = ref([])
const totalAlerts = ref(0)
const page = ref(1)
const itemsPerPage = ref(20)
const unassignedAlerts = ref([])
const unassignedCount = ref(0)

const showDetails = ref(false)
const showResolve = ref(false)
const showAddAction = ref(false)
const showUnassigned = ref(false)
const selectedAlert = ref(null)
const resolving = ref(false)
const addingAction = ref(false)

const filters = ref({
  status: null,
  severity: null,
  alert_type: null,
  search: '',
})

const resolveData = ref({
  status: null,
  resolution: '',
})

const actionData = ref({
  action: '',
  notes: '',
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const headers = [
  { title: 'Alert', key: 'alert_type', sortable: true },
  { title: 'Severity', key: 'severity', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Patient', key: 'patient', sortable: false },
  { title: 'Assigned To', key: 'assigned_to', sortable: false },
  { title: 'Created', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px' },
]

const statusOptions = [
  { title: 'Open', value: 'open' },
  { title: 'Investigating', value: 'investigating' },
  { title: 'Resolved', value: 'resolved' },
  { title: 'False Positive', value: 'false_positive' },
  { title: 'Confirmed Fraud', value: 'confirmed_fraud' },
]

const severityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Medium', value: 'medium' },
  { title: 'High', value: 'high' },
  { title: 'Critical', value: 'critical' },
]

const alertTypeOptions = [
  { title: 'Duplicate Prescription', value: 'duplicate_prescription' },
  { title: 'Suspicious Pattern', value: 'suspicious_pattern' },
  { title: 'High Frequency', value: 'high_frequency' },
  { title: 'Controlled Substance', value: 'controlled_substance' },
  { title: 'Identity Mismatch', value: 'identity_mismatch' },
  { title: 'Price Anomaly', value: 'price_anomaly' },
]

const resolutionStatuses = [
  { title: 'Resolved - No Issue', value: 'resolved' },
  { title: 'False Positive', value: 'false_positive' },
  { title: 'Confirmed Fraud', value: 'confirmed_fraud' },
]

const getSeverityColor = (severity) => {
  const colors = { low: 'info', medium: 'warning', high: 'error', critical: 'error' }
  return colors[severity?.toLowerCase()] || 'grey'
}

const getSeverityIcon = (severity) => {
  const icons = { low: 'mdi-information', medium: 'mdi-alert', high: 'mdi-alert-circle', critical: 'mdi-alert-octagon' }
  return icons[severity?.toLowerCase()] || 'mdi-alert'
}

const getStatusColor = (status) => {
  const colors = { open: 'error', investigating: 'warning', resolved: 'success', false_positive: 'grey', confirmed_fraud: 'error' }
  return colors[status?.toLowerCase()] || 'grey'
}

const formatAlertType = (type) => {
  return type?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
}

const formatStatus = (status) => {
  return status?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const formatTimeAgo = (date) => {
  if (!date) return 'N/A'
  const diffMs = new Date() - new Date(date)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Authorization': `Bearer ${token.access_token}`,
    'Content-Type': 'application/json',
  }
}

const fetchAlerts = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: page.value,
      limit: itemsPerPage.value,
    })
    if (filters.value.status) params.append('status', filters.value.status)
    if (filters.value.severity) params.append('severity', filters.value.severity)
    if (filters.value.alert_type) params.append('alert_type', filters.value.alert_type)

    const response = await fetch(`/admin-api/compliance/fraud-alerts?${params}`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()

    if (data.statusCode === 200 && data.data) {
      alerts.value = data.data.data || []
      totalAlerts.value = data.data.total || 0
    }

    // Fetch unassigned count
    const unassignedResponse = await fetch('/admin-api/compliance/fraud-alerts/unassigned', {
      headers: getAuthHeaders(),
    })
    const unassignedData = await unassignedResponse.json()
    if (unassignedData.statusCode === 200 && unassignedData.data) {
      unassignedAlerts.value = unassignedData.data || []
      unassignedCount.value = unassignedAlerts.value.length
    }
  } catch (error) {
    console.error('Error fetching fraud alerts:', error)
    showSnackbar('Error fetching alerts', 'error')
  } finally {
    loading.value = false
  }
}

const viewAlertDetails = async (alert) => {
  try {
    const response = await fetch(`/admin-api/compliance/fraud-alerts/${alert._id}`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.statusCode === 200 && data.data) {
      selectedAlert.value = data.data
      showDetails.value = true
    }
  } catch (error) {
    console.error('Error fetching alert details:', error)
    showSnackbar('Error fetching alert details', 'error')
  }
}

const assignToMe = async (alert) => {
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const userName = token.user?.profile
      ? `${token.user.profile.first_name} ${token.user.profile.last_name}`
      : token.user?.email || 'Admin'

    const response = await fetch(`/admin-api/compliance/fraud-alerts/${alert._id}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        assignee_id: token.user?._id || token.user?.sub,
        assignee_name: userName,
      }),
    })
    const data = await response.json()
    if (data.statusCode === 200) {
      showSnackbar('Alert assigned successfully', 'success')
      fetchAlerts()
      if (selectedAlert.value?._id === alert._id) {
        selectedAlert.value = data.data
      }
    }
  } catch (error) {
    console.error('Error assigning alert:', error)
    showSnackbar('Error assigning alert', 'error')
  }
}

const openResolveDialog = (alert) => {
  selectedAlert.value = alert
  resolveData.value = { status: null, resolution: '' }
  showResolve.value = true
}

const resolveAlert = async () => {
  if (!selectedAlert.value) return
  resolving.value = true
  try {
    const response = await fetch(`/admin-api/compliance/fraud-alerts/${selectedAlert.value._id}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(resolveData.value),
    })
    const data = await response.json()
    if (data.statusCode === 200) {
      showSnackbar('Alert resolved successfully', 'success')
      showResolve.value = false
      showDetails.value = false
      fetchAlerts()
    }
  } catch (error) {
    console.error('Error resolving alert:', error)
    showSnackbar('Error resolving alert', 'error')
  } finally {
    resolving.value = false
  }
}

const openAddActionDialog = () => {
  actionData.value = { action: '', notes: '' }
  showAddAction.value = true
}

const addAction = async () => {
  if (!selectedAlert.value) return
  addingAction.value = true
  try {
    const response = await fetch(`/admin-api/compliance/fraud-alerts/${selectedAlert.value._id}/action`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(actionData.value),
    })
    const data = await response.json()
    if (data.statusCode === 200) {
      showSnackbar('Action added successfully', 'success')
      showAddAction.value = false
      selectedAlert.value = data.data
    }
  } catch (error) {
    console.error('Error adding action:', error)
    showSnackbar('Error adding action', 'error')
  } finally {
    addingAction.value = false
  }
}

const blockPatient = async (alert) => {
  if (!confirm('Are you sure you want to block this patient? This action will prevent them from placing orders.')) return
  try {
    const response = await fetch(`/admin-api/compliance/fraud-alerts/${alert._id}/block-patient`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.statusCode === 200) {
      showSnackbar('Patient blocked successfully', 'success')
      fetchAlerts()
      if (selectedAlert.value?._id === alert._id) {
        selectedAlert.value = data.data
      }
    }
  } catch (error) {
    console.error('Error blocking patient:', error)
    showSnackbar('Error blocking patient', 'error')
  }
}

const clearFilters = () => {
  filters.value = { status: null, severity: null, alert_type: null, search: '' }
  fetchAlerts()
}

let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchAlerts()
  }, 500)
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Check for view parameter in URL
watch(() => route.query.view, (viewId) => {
  if (viewId) {
    viewAlertDetails({ _id: viewId })
  }
}, { immediate: true })

onMounted(() => {
  fetchAlerts()
})
</script>
