<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWhatsAppQueueStore } from '@/stores/whatsappQueue'

const router = useRouter()
const queueStore = useWhatsAppQueueStore()

// State
const loading = ref(true)
const queueItems = ref([])
const totalItems = ref(0)
const currentPage = ref(1)
const itemsPerPage = ref(20)
const escalatedCount = ref(0)

// Filters
const selectedTab = ref('all')
const selectedQueueType = ref('')
const selectedPriority = ref('')
const searchQuery = ref('')

// Stats
const stats = ref(null)

// Queue type options
const queueTypes = [
  { title: 'All Types', value: '' },
  { title: 'OCR Review', value: 'OCR_REVIEW' },
  { title: 'Manual Entry', value: 'MANUAL_ENTRY' },
  { title: 'Controlled Substance', value: 'CONTROLLED_SUBSTANCE' },
  { title: 'Verification Failed', value: 'VERIFICATION_FAILED' },
  { title: 'Pharmacist Escalation', value: 'PHARMACIST_ESCALATION' },
  { title: 'Clarification Response', value: 'CLARIFICATION_RESPONSE' },
]

// Priority options
const priorities = [
  { title: 'All Priorities', value: '' },
  { title: 'Urgent', value: 'URGENT' },
  { title: 'High', value: 'HIGH' },
  { title: 'Normal', value: 'NORMAL' },
  { title: 'Low', value: 'LOW' },
]

// Tabs
const tabs = [
  { title: 'All Pending', value: 'all', icon: 'bx-list-ul' },
  { title: 'My Queue', value: 'my', icon: 'bx-user' },
  { title: 'Escalated', value: 'escalated', icon: 'bx-up-arrow-alt' },
]

// Table headers
const tableHeaders = [
  { title: 'Patient', key: 'patient' },
  { title: 'Type', key: 'queue_type' },
  { title: 'Priority', key: 'priority' },
  { title: 'Status', key: 'status' },
  { title: 'Created', key: 'created_at' },
  { title: 'SLA', key: 'sla_deadline' },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Fetch data
const fetchData = async () => {
  loading.value = true

  const options = {
    queueType: selectedQueueType.value || undefined,
    priority: selectedPriority.value || undefined,
    limit: itemsPerPage.value,
    offset: (currentPage.value - 1) * itemsPerPage.value,
  }

  let response
  if (selectedTab.value === 'my') {
    // My Queue - show all items assigned to me (any status)
    response = await queueStore.fetchMyQueue({ ...options, includeAll: true })
  } else if (selectedTab.value === 'escalated') {
    // Escalated - show all escalated items
    response = await queueStore.fetchEscalatedItems(options)
  } else {
    // All Pending - show pending/in-progress items
    response = await queueStore.fetchPendingItems(options)
  }

  queueItems.value = response.items || []
  totalItems.value = response.total || 0
  loading.value = false
}

// Fetch stats
const fetchStats = async () => {
  const response = await queueStore.fetchStats()
  stats.value = response
}

// Fetch escalated count for badge
const fetchEscalatedCount = async () => {
  const response = await queueStore.fetchEscalatedItems({ limit: 1 })
  escalatedCount.value = response.total || 0
}

// Claim next item
const claimNextItem = async () => {
  const preferredTypes = selectedQueueType.value ? [selectedQueueType.value] : []
  const result = await queueStore.claimNextItem(preferredTypes)

  if (result.item) {
    // Navigate to the claimed item
    router.push(`/pharmacy/whatsapp-queue/${result.item._id}`)
  } else {
    // Show notification
    alert(result.message || 'No items available')
  }
}

// Get priority color
const getPriorityColor = (priority) => {
  const colors = {
    URGENT: 'error',
    HIGH: 'warning',
    NORMAL: 'info',
    LOW: 'default',
  }
  return colors[priority] || 'default'
}

// Get status color
const getStatusColor = (status) => {
  const colors = {
    PENDING: 'warning',
    IN_PROGRESS: 'info',
    COMPLETED: 'success',
    ESCALATED: 'error',
    REJECTED: 'error',
    EXPIRED: 'default',
  }
  return colors[status] || 'default'
}

// Get queue type label
const getQueueTypeLabel = (type) => {
  const labels = {
    OCR_REVIEW: 'OCR Review',
    MANUAL_ENTRY: 'Manual Entry',
    CONTROLLED_SUBSTANCE: 'Controlled',
    VERIFICATION_FAILED: 'Verification Failed',
    PHARMACIST_ESCALATION: 'Chat Escalation',
    CLARIFICATION_RESPONSE: 'Clarification',
  }
  return labels[type] || type
}

// Get queue type icon
const getQueueTypeIcon = (type) => {
  const icons = {
    OCR_REVIEW: 'bx-scan',
    MANUAL_ENTRY: 'bx-edit',
    CONTROLLED_SUBSTANCE: 'bx-shield-quarter',
    VERIFICATION_FAILED: 'bx-error',
    PHARMACIST_ESCALATION: 'bx-chat',
    CLARIFICATION_RESPONSE: 'bx-message-detail',
  }
  return icons[type] || 'bx-file'
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Get SLA status
const getSlaStatus = (deadline) => {
  if (!deadline) return { text: '-', color: 'default' }

  const now = new Date()
  const slaDate = new Date(deadline)
  const diffMinutes = Math.round((slaDate - now) / 60000)

  if (diffMinutes < 0) {
    return { text: 'Breached', color: 'error' }
  } else if (diffMinutes < 15) {
    return { text: `${diffMinutes}m left`, color: 'error' }
  } else if (diffMinutes < 60) {
    return { text: `${diffMinutes}m left`, color: 'warning' }
  } else {
    const hours = Math.floor(diffMinutes / 60)
    return { text: `${hours}h left`, color: 'success' }
  }
}

// Get patient name
const getPatientName = (item) => {
  if (item.patient_id?.profile) {
    return `${item.patient_id.profile.first_name || ''} ${item.patient_id.profile.last_name || ''}`.trim()
  }
  return item.whatsapp_number || 'Unknown'
}

// Watchers
watch([selectedTab, selectedQueueType, selectedPriority, currentPage], () => {
  fetchData()
})

// On mounted
onMounted(() => {
  fetchData()
  fetchStats()
  fetchEscalatedCount()
})

// Computed
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h4 class="text-h4 font-weight-bold">WhatsApp Prescription Queue</h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Manage prescriptions and patient escalations from WhatsApp
        </p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="bx-plus"
        @click="claimNextItem"
      >
        Claim Next Item
      </VBtn>
    </div>

    <!-- Stats Cards -->
    <VRow v-if="stats" class="mb-6">
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar
              size="44"
              color="warning"
              variant="tonal"
              rounded
              class="me-3"
            >
              <VIcon icon="bx-time" size="24" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.pending }}</div>
              <div class="text-body-2 text-medium-emphasis">Pending</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar
              size="44"
              color="info"
              variant="tonal"
              rounded
              class="me-3"
            >
              <VIcon icon="bx-loader" size="24" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.inProgress }}</div>
              <div class="text-body-2 text-medium-emphasis">In Progress</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar
              size="44"
              color="success"
              variant="tonal"
              rounded
              class="me-3"
            >
              <VIcon icon="bx-check-circle" size="24" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.completed }}</div>
              <div class="text-body-2 text-medium-emphasis">Completed Today</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar
              size="44"
              :color="stats.breached > 0 ? 'error' : 'success'"
              variant="tonal"
              rounded
              class="me-3"
            >
              <VIcon icon="bx-timer" size="24" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.averageWaitTime }}m</div>
              <div class="text-body-2 text-medium-emphasis">Avg Wait Time</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Queue Tabs & Filters -->
    <VCard>
      <VCardText>
        <!-- Tabs -->
        <VTabs v-model="selectedTab" class="mb-4">
          <VTab
            v-for="tab in tabs"
            :key="tab.value"
            :value="tab.value"
          >
            <VIcon :icon="tab.icon" class="me-2" />
            {{ tab.title }}
            <VBadge
              v-if="tab.value === 'escalated' && escalatedCount > 0"
              :content="escalatedCount"
              color="error"
              inline
              class="ms-2"
            />
          </VTab>
        </VTabs>

        <!-- Filters -->
        <VRow class="mb-4">
          <VCol cols="12" md="4">
            <VSelect
              v-model="selectedQueueType"
              :items="queueTypes"
              item-title="title"
              item-value="value"
              label="Queue Type"
              density="compact"
              variant="outlined"
              clearable
            />
          </VCol>
          <VCol cols="12" md="4">
            <VSelect
              v-model="selectedPriority"
              :items="priorities"
              item-title="title"
              item-value="value"
              label="Priority"
              density="compact"
              variant="outlined"
              clearable
            />
          </VCol>
          <VCol cols="12" md="4">
            <VBtn
              variant="tonal"
              color="secondary"
              @click="() => { fetchData(); fetchEscalatedCount(); }"
              :loading="loading"
            >
              <VIcon icon="bx-refresh" class="me-1" />
              Refresh
            </VBtn>
          </VCol>
        </VRow>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
          <p class="mt-4 text-medium-emphasis">Loading queue items...</p>
        </div>

        <!-- Empty State -->
        <VAlert
          v-else-if="queueItems.length === 0"
          type="info"
          variant="tonal"
          class="mb-0"
        >
          <VAlertTitle>No queue items found</VAlertTitle>
          <p class="mb-0">
            {{ selectedTab === 'my' ? 'You have no items assigned. Click "Claim Next Item" to get started.' : 'There are no pending items matching your filters.' }}
          </p>
        </VAlert>

        <!-- Queue Table -->
        <VTable v-else hover>
          <thead>
            <tr>
              <th v-for="header in tableHeaders" :key="header.key">
                {{ header.title }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in queueItems"
              :key="item._id"
              class="cursor-pointer"
              @click="router.push(`/pharmacy/whatsapp-queue/${item._id}`)"
            >
              <!-- Patient -->
              <td>
                <div class="d-flex align-center">
                  <VAvatar size="36" color="primary" variant="tonal" class="me-3">
                    <VIcon icon="bx-user" />
                  </VAvatar>
                  <div>
                    <div class="font-weight-medium">{{ getPatientName(item) }}</div>
                    <div class="text-body-2 text-medium-emphasis">{{ item.whatsapp_number }}</div>
                  </div>
                </div>
              </td>

              <!-- Type -->
              <td>
                <VChip
                  size="small"
                  variant="tonal"
                  color="primary"
                >
                  <VIcon :icon="getQueueTypeIcon(item.queue_type)" size="14" class="me-1" />
                  {{ getQueueTypeLabel(item.queue_type) }}
                </VChip>
              </td>

              <!-- Priority -->
              <td>
                <VChip
                  size="small"
                  :color="getPriorityColor(item.priority)"
                >
                  {{ item.priority }}
                </VChip>
              </td>

              <!-- Status -->
              <td>
                <VChip
                  size="small"
                  :color="getStatusColor(item.status)"
                  variant="tonal"
                >
                  {{ item.status }}
                </VChip>
              </td>

              <!-- Created -->
              <td>
                <span class="text-body-2">{{ formatDate(item.created_at) }}</span>
              </td>

              <!-- SLA -->
              <td>
                <VChip
                  size="small"
                  :color="getSlaStatus(item.sla_deadline).color"
                  variant="tonal"
                >
                  <VIcon icon="bx-timer" size="14" class="me-1" />
                  {{ getSlaStatus(item.sla_deadline).text }}
                </VChip>
              </td>

              <!-- Actions -->
              <td>
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  color="primary"
                  @click.stop="router.push(`/pharmacy/whatsapp-queue/${item._id}`)"
                >
                  <VIcon icon="bx-chevron-right" />
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>

        <!-- Pagination -->
        <div v-if="queueItems.length > 0" class="d-flex justify-center mt-4">
          <VPagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
          />
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
