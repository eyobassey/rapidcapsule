<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <div class="d-flex align-center mb-1">
          <VBtn icon variant="text" size="small" @click="$router.push('/pharmacy/compliance')">
            <VIcon>mdi-arrow-left</VIcon>
          </VBtn>
          <h1 class="text-h4 font-weight-bold ms-2">Audit Log</h1>
        </div>
        <p class="text-subtitle-1 text-medium-emphasis ms-10">Track all system activities and changes</p>
      </div>
      <div class="d-flex gap-2">
        <VBtn color="primary" variant="outlined" prepend-icon="mdi-download" @click="exportAuditLog">
          Export
        </VBtn>
        <VBtn color="primary" prepend-icon="mdi-refresh" @click="fetchAuditLogs">
          Refresh
        </VBtn>
      </div>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="6" md="3">
        <VCard color="primary" variant="tonal">
          <VCardText class="d-flex align-center">
            <VAvatar color="primary" variant="flat" size="48" class="me-4">
              <VIcon size="24">mdi-clipboard-list</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.totalToday }}</div>
              <div class="text-body-2">Actions Today</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="success" variant="tonal">
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="flat" size="48" class="me-4">
              <VIcon size="24">mdi-plus-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.creates }}</div>
              <div class="text-body-2">Creates</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="info" variant="tonal">
          <VCardText class="d-flex align-center">
            <VAvatar color="info" variant="flat" size="48" class="me-4">
              <VIcon size="24">mdi-pencil-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.updates }}</div>
              <div class="text-body-2">Updates</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="error" variant="tonal">
          <VCardText class="d-flex align-center">
            <VAvatar color="error" variant="flat" size="48" class="me-4">
              <VIcon size="24">mdi-minus-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.deletes }}</div>
              <div class="text-body-2">Deletes</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="6" md="2">
            <VSelect
              v-model="filters.action"
              label="Action"
              :items="actionOptions"
              clearable
              density="compact"
              @update:model-value="fetchAuditLogs"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <VSelect
              v-model="filters.entity_type"
              label="Entity Type"
              :items="entityTypeOptions"
              clearable
              density="compact"
              @update:model-value="fetchAuditLogs"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <VTextField
              v-model="filters.start_date"
              label="Start Date"
              type="date"
              density="compact"
              @update:model-value="fetchAuditLogs"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <VTextField
              v-model="filters.end_date"
              label="End Date"
              type="date"
              density="compact"
              @update:model-value="fetchAuditLogs"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <VTextField
              v-model="filters.user_id"
              label="User ID"
              clearable
              density="compact"
              @update:model-value="debouncedSearch"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <VTextField
              v-model="filters.entity_id"
              label="Entity ID"
              clearable
              density="compact"
              @update:model-value="debouncedSearch"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Audit Log Table -->
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>Activity Log ({{ totalLogs }})</span>
        <VChip
          v-if="hasActiveFilters"
          color="primary"
          size="small"
          closable
          @click:close="clearFilters"
        >
          Filtered
        </VChip>
      </VCardTitle>
      <VCardText>
        <VDataTable
          :headers="headers"
          :items="auditLogs"
          :loading="loading"
          :items-per-page="itemsPerPage"
          hover
          @click:row="(event, { item }) => viewLogDetails(item)"
        >
          <template #item.action="{ item }">
            <VChip :color="getActionColor(item.action)" size="small" variant="flat">
              <VIcon start size="14">{{ getActionIcon(item.action) }}</VIcon>
              {{ item.action }}
            </VChip>
          </template>

          <template #item.entity_type="{ item }">
            <div class="font-weight-medium">{{ formatEntityType(item.entity_type) }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.entity_id?.slice(-8) || 'N/A' }}</div>
          </template>

          <template #item.performed_by="{ item }">
            <div class="font-weight-medium">{{ item.performed_by_name || 'System' }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.performed_by?.slice(-8) || 'Auto' }}</div>
          </template>

          <template #item.changes="{ item }">
            <VChip v-if="item.changes && Object.keys(item.changes).length > 0" size="small" color="info" variant="outlined">
              {{ Object.keys(item.changes).length }} field(s)
            </VChip>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <template #item.ip_address="{ item }">
            <span class="text-body-2 font-mono">{{ item.ip_address || 'N/A' }}</span>
          </template>

          <template #item.created_at="{ item }">
            <div>{{ formatDate(item.created_at) }}</div>
            <div class="text-caption text-medium-emphasis">{{ formatTimeAgo(item.created_at) }}</div>
          </template>

          <template #item.actions="{ item }">
            <VBtn icon size="small" variant="text" @click.stop="viewLogDetails(item)">
              <VIcon>mdi-eye</VIcon>
              <VTooltip activator="parent" location="top">View Details</VTooltip>
            </VBtn>
          </template>
        </VDataTable>

        <!-- Pagination -->
        <div class="d-flex justify-center mt-4">
          <VPagination
            v-model="page"
            :length="Math.ceil(totalLogs / itemsPerPage)"
            :total-visible="7"
            @update:model-value="fetchAuditLogs"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Log Details Dialog -->
    <VDialog v-model="showDetails" max-width="700">
      <VCard v-if="selectedLog">
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Audit Log Details</span>
          <VBtn icon variant="text" @click="showDetails = false">
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">Action</div>
                <VChip :color="getActionColor(selectedLog.action)" size="small">
                  {{ selectedLog.action }}
                </VChip>
              </div>
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">Entity Type</div>
                <div class="text-body-1 font-weight-medium">{{ formatEntityType(selectedLog.entity_type) }}</div>
              </div>
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">Entity ID</div>
                <code class="text-body-2">{{ selectedLog.entity_id || 'N/A' }}</code>
              </div>
            </VCol>
            <VCol cols="12" md="6">
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">Performed By</div>
                <div class="text-body-1">{{ selectedLog.performed_by_name || 'System' }}</div>
                <code class="text-caption">{{ selectedLog.performed_by || 'Auto' }}</code>
              </div>
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">IP Address</div>
                <code class="text-body-2">{{ selectedLog.ip_address || 'N/A' }}</code>
              </div>
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">User Agent</div>
                <div class="text-body-2" style="word-break: break-all;">{{ selectedLog.user_agent || 'N/A' }}</div>
              </div>
            </VCol>
          </VRow>

          <VDivider class="my-4" />

          <div class="mb-4">
            <div class="text-caption text-medium-emphasis">Timestamp</div>
            <div class="text-body-1">{{ formatDate(selectedLog.created_at) }}</div>
          </div>

          <div v-if="selectedLog.description" class="mb-4">
            <div class="text-caption text-medium-emphasis">Description</div>
            <VAlert type="info" variant="tonal" density="compact">
              {{ selectedLog.description }}
            </VAlert>
          </div>

          <!-- Changes -->
          <div v-if="selectedLog.changes && Object.keys(selectedLog.changes).length > 0" class="mb-4">
            <div class="text-caption text-medium-emphasis mb-2">Changes Made</div>
            <VCard variant="outlined">
              <VTable density="compact">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(change, field) in selectedLog.changes" :key="field">
                    <td class="font-weight-medium">{{ field }}</td>
                    <td>
                      <code class="text-error" style="font-size: 12px;">{{ formatValue(change.old) }}</code>
                    </td>
                    <td>
                      <code class="text-success" style="font-size: 12px;">{{ formatValue(change.new) }}</code>
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCard>
          </div>

          <!-- Metadata -->
          <div v-if="selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0">
            <div class="text-caption text-medium-emphasis mb-2">Additional Metadata</div>
            <VCard variant="outlined">
              <VCardText>
                <pre class="text-body-2" style="white-space: pre-wrap; font-size: 12px;">{{ JSON.stringify(selectedLog.metadata, null, 2) }}</pre>
              </VCardText>
            </VCard>
          </div>
        </VCardText>
        <VDivider />
        <VCardActions>
          <VSpacer />
          <VBtn
            v-if="selectedLog.entity_id"
            color="primary"
            variant="outlined"
            @click="viewEntity(selectedLog)"
          >
            View Entity
          </VBtn>
          <VBtn variant="text" @click="showDetails = false">Close</VBtn>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(false)
const auditLogs = ref([])
const totalLogs = ref(0)
const page = ref(1)
const itemsPerPage = ref(20)

const showDetails = ref(false)
const selectedLog = ref(null)

const stats = ref({
  totalToday: 0,
  creates: 0,
  updates: 0,
  deletes: 0,
})

const filters = ref({
  action: null,
  entity_type: null,
  start_date: '',
  end_date: '',
  user_id: '',
  entity_id: '',
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const headers = [
  { title: 'Action', key: 'action', sortable: true },
  { title: 'Entity', key: 'entity_type', sortable: true },
  { title: 'Performed By', key: 'performed_by', sortable: false },
  { title: 'Changes', key: 'changes', sortable: false },
  { title: 'IP Address', key: 'ip_address', sortable: false },
  { title: 'Timestamp', key: 'created_at', sortable: true },
  { title: '', key: 'actions', sortable: false, width: '80px' },
]

const actionOptions = [
  { title: 'Create', value: 'CREATE' },
  { title: 'Update', value: 'UPDATE' },
  { title: 'Delete', value: 'DELETE' },
  { title: 'Approve', value: 'APPROVE' },
  { title: 'Reject', value: 'REJECT' },
  { title: 'Dispense', value: 'DISPENSE' },
  { title: 'Cancel', value: 'CANCEL' },
  { title: 'Refund', value: 'REFUND' },
  { title: 'Login', value: 'LOGIN' },
  { title: 'Logout', value: 'LOGOUT' },
]

const entityTypeOptions = [
  { title: 'Prescription', value: 'PRESCRIPTION' },
  { title: 'Order', value: 'ORDER' },
  { title: 'Drug', value: 'DRUG' },
  { title: 'Stock Batch', value: 'STOCK_BATCH' },
  { title: 'Pharmacy', value: 'PHARMACY' },
  { title: 'User', value: 'USER' },
  { title: 'Patient', value: 'PATIENT' },
  { title: 'Payment', value: 'PAYMENT' },
  { title: 'Fraud Alert', value: 'FRAUD_ALERT' },
]

const hasActiveFilters = computed(() => {
  return filters.value.action || filters.value.entity_type ||
         filters.value.start_date || filters.value.end_date ||
         filters.value.user_id || filters.value.entity_id
})

const getActionColor = (action) => {
  const colors = {
    CREATE: 'success',
    UPDATE: 'info',
    DELETE: 'error',
    APPROVE: 'success',
    REJECT: 'error',
    DISPENSE: 'primary',
    CANCEL: 'warning',
    REFUND: 'warning',
    LOGIN: 'info',
    LOGOUT: 'secondary',
  }
  return colors[action] || 'grey'
}

const getActionIcon = (action) => {
  const icons = {
    CREATE: 'mdi-plus',
    UPDATE: 'mdi-pencil',
    DELETE: 'mdi-delete',
    APPROVE: 'mdi-check',
    REJECT: 'mdi-close',
    DISPENSE: 'mdi-pill',
    CANCEL: 'mdi-cancel',
    REFUND: 'mdi-cash-refund',
    LOGIN: 'mdi-login',
    LOGOUT: 'mdi-logout',
  }
  return icons[action] || 'mdi-circle'
}

const formatEntityType = (type) => {
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
    second: '2-digit',
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

const formatValue = (value) => {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Authorization': `Bearer ${token.access_token}`,
    'Content-Type': 'application/json',
  }
}

const fetchAuditLogs = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: page.value,
      limit: itemsPerPage.value,
    })
    if (filters.value.action) params.append('action', filters.value.action)
    if (filters.value.entity_type) params.append('entity_type', filters.value.entity_type)
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    if (filters.value.user_id) params.append('user_id', filters.value.user_id)
    if (filters.value.entity_id) params.append('entity_id', filters.value.entity_id)

    const response = await fetch(`/admin-api/compliance/audit-logs?${params}`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()

    if (data.statusCode === 200 && data.data) {
      auditLogs.value = data.data.data || []
      totalLogs.value = data.data.total || 0
    }

    // Fetch stats for today
    const today = new Date().toISOString().split('T')[0]
    const statsResponse = await fetch(
      `/admin-api/compliance/audit-logs/stats?start_date=${today}&end_date=${today}`,
      { headers: getAuthHeaders() }
    )
    const statsData = await statsResponse.json()

    if (statsData.statusCode === 200 && statsData.data) {
      const actionStats = statsData.data.by_action || {}
      stats.value.totalToday = Object.values(actionStats).reduce((a, b) => a + b, 0)
      stats.value.creates = actionStats.CREATE || 0
      stats.value.updates = actionStats.UPDATE || 0
      stats.value.deletes = actionStats.DELETE || 0
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    showSnackbar('Error fetching audit logs', 'error')
  } finally {
    loading.value = false
  }
}

const viewLogDetails = (log) => {
  selectedLog.value = log
  showDetails.value = true
}

const viewEntity = (log) => {
  const entityRoutes = {
    PRESCRIPTION: '/pharmacy/prescriptions',
    ORDER: '/pharmacy/orders',
    DRUG: '/pharmacy/inventory',
    PATIENT: '/patients',
    USER: '/specialists',
  }
  const basePath = entityRoutes[log.entity_type]
  if (basePath && log.entity_id) {
    router.push(`${basePath}/${log.entity_id}`)
  } else {
    showSnackbar('Cannot navigate to entity', 'warning')
  }
}

const exportAuditLog = async () => {
  try {
    const params = new URLSearchParams()
    if (filters.value.action) params.append('action', filters.value.action)
    if (filters.value.entity_type) params.append('entity_type', filters.value.entity_type)
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    params.append('limit', '1000')

    const response = await fetch(`/admin-api/compliance/audit-logs?${params}`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()

    if (data.statusCode === 200 && data.data?.data) {
      const logs = data.data.data
      const csvContent = [
        ['Action', 'Entity Type', 'Entity ID', 'Performed By', 'Timestamp', 'IP Address', 'Description'].join(','),
        ...logs.map(log => [
          log.action,
          log.entity_type,
          log.entity_id || '',
          log.performed_by_name || 'System',
          formatDate(log.created_at),
          log.ip_address || '',
          `"${(log.description || '').replace(/"/g, '""')}"`,
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      showSnackbar('Audit log exported successfully', 'success')
    }
  } catch (error) {
    console.error('Error exporting audit log:', error)
    showSnackbar('Error exporting audit log', 'error')
  }
}

const clearFilters = () => {
  filters.value = {
    action: null,
    entity_type: null,
    start_date: '',
    end_date: '',
    user_id: '',
    entity_id: '',
  }
  fetchAuditLogs()
}

let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchAuditLogs()
  }, 500)
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

onMounted(() => {
  fetchAuditLogs()
})
</script>

<style scoped>
.font-mono {
  font-family: monospace;
}
</style>
