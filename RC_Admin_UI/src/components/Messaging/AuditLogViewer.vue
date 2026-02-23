<script setup>
import { ref, onMounted } from 'vue'
import axios from '@axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

const logs = ref([])
const loading = ref(false)
const totalItems = ref(0)
const currentPage = ref(1)
const itemsPerPage = ref(20)
const actionFilter = ref('')
const userSearch = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const headers = [
  { title: 'Action', key: 'action', width: '180px' },
  { title: 'Actor', key: 'actor', sortable: false },
  { title: 'Actor Type', key: 'actor_type', width: '120px' },
  { title: 'Conversation', key: 'conversation', width: '140px', sortable: false },
  { title: 'Details', key: 'metadata', sortable: false },
  { title: 'Timestamp', key: 'created_at', width: '180px' },
]

const actionOptions = [
  { title: 'All Actions', value: '' },
  { title: 'Message Sent', value: 'message_sent' },
  { title: 'Message Read', value: 'message_read' },
  { title: 'Message Deleted', value: 'message_deleted' },
  { title: 'File Accessed', value: 'file_accessed' },
  { title: 'File Downloaded', value: 'file_downloaded' },
  { title: 'Conversation Created', value: 'conversation_created' },
  { title: 'Conversation Archived', value: 'conversation_archived' },
  { title: 'Consent Given', value: 'consent_given' },
]

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', currentPage.value)
    params.append('limit', itemsPerPage.value)
    if (actionFilter.value) params.append('action', actionFilter.value)
    if (userSearch.value) params.append('userId', userSearch.value)
    if (dateFrom.value) params.append('from', dateFrom.value)
    if (dateTo.value) params.append('to', dateTo.value)

    const { data } = await axios.get(`${apiBaseUrl}/messaging/audit-logs?${params}`)
    if (data?.data) {
      logs.value = data.data.data
      totalItems.value = data.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
  } finally {
    loading.value = false
  }
}

const getActorName = (log) => {
  const actor = log.actor
  if (!actor) return 'System'
  if (actor.profile?.first_name) {
    return `${actor.profile.first_name} ${actor.profile.last_name || ''}`.trim()
  }
  return actor.email || 'Unknown'
}

const getActionColor = (action) => {
  switch (action) {
    case 'message_sent': return 'primary'
    case 'message_read': return 'info'
    case 'message_deleted': return 'error'
    case 'file_accessed':
    case 'file_downloaded': return 'warning'
    case 'conversation_created': return 'success'
    case 'conversation_archived': return 'default'
    case 'consent_given': return 'success'
    default: return 'default'
  }
}

const getActionIcon = (action) => {
  switch (action) {
    case 'message_sent': return 'bx-send'
    case 'message_read': return 'bx-check-double'
    case 'message_deleted': return 'bx-trash'
    case 'file_accessed': return 'bx-file'
    case 'file_downloaded': return 'bx-download'
    case 'conversation_created': return 'bx-plus-circle'
    case 'conversation_archived': return 'bx-archive'
    case 'consent_given': return 'bx-check-shield'
    default: return 'bx-info-circle'
  }
}

const formatAction = (action) => {
  return (action || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getMetadataSummary = (metadata) => {
  if (!metadata) return '-'
  const parts = []
  if (metadata.ip_address) parts.push(`IP: ${metadata.ip_address}`)
  if (metadata.file_name) parts.push(`File: ${metadata.file_name}`)
  if (metadata.message_type) parts.push(`Type: ${metadata.message_type}`)
  return parts.length > 0 ? parts.join(' | ') : '-'
}

const clearFilters = () => {
  actionFilter.value = ''
  userSearch.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  currentPage.value = 1
  fetchLogs()
}

const exportCSV = () => {
  if (!logs.value.length) return

  const csvHeaders = ['Action', 'Actor', 'Actor Type', 'Conversation ID', 'Details', 'Timestamp']
  const rows = logs.value.map((log) => [
    formatAction(log.action),
    getActorName(log),
    log.actor_type || '',
    log.conversation?._id || log.conversation || '',
    getMetadataSummary(log.metadata),
    formatDateTime(log.created_at),
  ])

  const csv = [csvHeaders, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `messaging-audit-logs-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => fetchLogs())
</script>

<template>
  <div>
    <!-- Filters -->
    <VRow class="mb-4">
      <VCol cols="12" md="3">
        <VSelect
          v-model="actionFilter"
          :items="actionOptions"
          label="Filter by action"
          variant="outlined"
          density="compact"
          @update:model-value="currentPage = 1; fetchLogs()"
        />
      </VCol>
      <VCol cols="12" md="3">
        <VTextField
          v-model="userSearch"
          label="Search by user ID"
          variant="outlined"
          density="compact"
          clearable
          @keyup.enter="currentPage = 1; fetchLogs()"
          @click:clear="userSearch = ''; fetchLogs()"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VTextField
          v-model="dateFrom"
          label="From date"
          type="date"
          variant="outlined"
          density="compact"
          @change="currentPage = 1; fetchLogs()"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VTextField
          v-model="dateTo"
          label="To date"
          type="date"
          variant="outlined"
          density="compact"
          @change="currentPage = 1; fetchLogs()"
        />
      </VCol>
      <VCol cols="12" md="2" class="d-flex gap-2">
        <VBtn variant="outlined" density="compact" @click="clearFilters">
          Clear
        </VBtn>
        <VBtn variant="outlined" density="compact" prepend-icon="bx-download" @click="exportCSV">
          CSV
        </VBtn>
      </VCol>
    </VRow>

    <!-- Table -->
    <VDataTable
      :headers="headers"
      :items="logs"
      :loading="loading"
      :items-per-page="itemsPerPage"
      item-value="_id"
      class="elevation-0"
    >
      <template #item.action="{ item }">
        <div class="d-flex align-center gap-2">
          <VIcon :icon="getActionIcon(item.action)" size="18" :color="getActionColor(item.action)" />
          <VChip :color="getActionColor(item.action)" size="small" variant="tonal">
            {{ formatAction(item.action) }}
          </VChip>
        </div>
      </template>

      <template #item.actor="{ item }">
        <span class="font-weight-medium">{{ getActorName(item) }}</span>
      </template>

      <template #item.actor_type="{ item }">
        <VChip v-if="item.actor_type" size="x-small" variant="outlined">
          {{ item.actor_type }}
        </VChip>
        <span v-else class="text-medium-emphasis">-</span>
      </template>

      <template #item.conversation="{ item }">
        <span v-if="item.conversation" class="text-caption font-weight-medium" style="font-family: monospace;">
          {{ (item.conversation._id || item.conversation).toString().slice(-8) }}
        </span>
        <span v-else class="text-medium-emphasis">-</span>
      </template>

      <template #item.metadata="{ item }">
        <span class="text-caption text-truncate d-inline-block" style="max-width: 200px;">
          {{ getMetadataSummary(item.metadata) }}
        </span>
      </template>

      <template #item.created_at="{ item }">
        {{ formatDateTime(item.created_at) }}
      </template>

      <template #bottom>
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(totalItems / itemsPerPage)"
          @update:model-value="fetchLogs"
          class="mt-4"
        />
      </template>
    </VDataTable>
  </div>
</template>
