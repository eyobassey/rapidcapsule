<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRecoveryStore } from '@/stores/recovery'
import { useRouter } from 'vue-router'

const router = useRouter()
const recoveryStore = useRecoveryStore()

const activeTab = ref('active')
const tableLoading = ref(false)
const activeCrises = ref([])
const historyData = ref([])
const historyPagination = ref(null)
const currentPage = ref(1)
const filterSeverity = ref('')
const filterType = ref('')

const severityColors = { low: 'info', medium: 'warning', high: 'error', life_threatening: 'deep-purple' }
const statusColors = { active: 'error', responding: 'warning', escalated_external: 'deep-purple', resolved: 'success', stabilized: 'info' }

const getPatientName = (user) => {
  if (!user?.profile) return 'Unknown'
  return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || 'Unknown'
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatTimeAgo = (date) => {
  if (!date) return '—'
  const ms = Date.now() - new Date(date).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const fetchActive = async () => {
  tableLoading.value = true
  try {
    const result = await recoveryStore.fetchActiveCrises()
    if (result && result !== 'error') activeCrises.value = result || []
  } finally {
    tableLoading.value = false
  }
}

const fetchHistory = async () => {
  tableLoading.value = true
  try {
    const result = await recoveryStore.fetchCrisisHistory({
      page: currentPage.value,
      severity: filterSeverity.value || undefined,
      crisis_type: filterType.value || undefined,
      limit: 20,
    })
    if (result && result !== 'error') {
      historyData.value = result.data || []
      historyPagination.value = result.pagination || null
    }
  } finally {
    tableLoading.value = false
  }
}

watch(activeTab, () => {
  if (activeTab.value === 'active') fetchActive()
  else fetchHistory()
})

watch([currentPage, filterSeverity, filterType], fetchHistory)

onMounted(fetchActive)
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Crisis Events</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Monitor and manage patient crisis events</p>
      </div>
      <VBtn variant="outlined" prepend-icon="mdi-arrow-left" @click="router.push('/recovery')">
        Back to Dashboard
      </VBtn>
    </div>

    <!-- Tabs -->
    <VTabs v-model="activeTab" class="mb-6">
      <VTab value="active">
        Active Crises
        <VBadge v-if="activeCrises.length > 0" :content="activeCrises.length" color="error" inline class="ms-2" />
      </VTab>
      <VTab value="history">History</VTab>
    </VTabs>

    <!-- Active Crises -->
    <template v-if="activeTab === 'active'">
      <VProgressLinear v-if="tableLoading" indeterminate color="error" class="mb-4" />
      <template v-if="activeCrises.length === 0 && !tableLoading">
        <VAlert type="success" variant="tonal">No active crisis events</VAlert>
      </template>
      <VRow v-else>
        <VCol v-for="crisis in activeCrises" :key="crisis._id" cols="12" md="6">
          <VCard :color="crisis.status === 'escalated_external' ? 'deep-purple' : ''" :variant="crisis.status === 'escalated_external' ? 'tonal' : 'elevated'">
            <VCardTitle class="d-flex align-center">
              <VIcon :color="statusColors[crisis.status]" class="me-2">mdi-alert-circle</VIcon>
              {{ crisis.crisis_type?.replace(/_/g, ' ').toUpperCase() }}
              <VSpacer />
              <VChip :color="statusColors[crisis.status]" size="small">{{ crisis.status }}</VChip>
            </VCardTitle>
            <VCardText>
              <div class="mb-2">
                <strong>Patient:</strong> {{ getPatientName(crisis.user) }}
              </div>
              <div class="mb-2">
                <strong>Severity:</strong>
                <VChip :color="severityColors[crisis.severity]" size="x-small" class="ms-1">
                  {{ crisis.severity?.replace('_', ' ') }}
                </VChip>
              </div>
              <div class="mb-2">
                <strong>Source:</strong> {{ crisis.trigger_source }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Started {{ formatTimeAgo(crisis.created_at) }}
              </div>
            </VCardText>
            <VCardActions>
              <VBtn
                size="small"
                color="primary"
                variant="text"
                @click="router.push(`/recovery/patient/${crisis.user?._id || crisis.user}`)"
              >
                View Patient
              </VBtn>
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <!-- Crisis History -->
    <template v-if="activeTab === 'history'">
      <VCard class="mb-4">
        <VCardText>
          <VRow>
            <VCol cols="12" md="4">
              <VSelect
                v-model="filterSeverity"
                :items="['', 'low', 'medium', 'high', 'life_threatening']"
                label="Severity"
                variant="outlined"
                density="compact"
                clearable
              />
            </VCol>
            <VCol cols="12" md="4">
              <VSelect
                v-model="filterType"
                :items="['', 'suicidal_ideation', 'overdose_suspected', 'overdose_confirmed', 'severe_withdrawal', 'relapse_with_danger', 'self_harm', 'psychotic_episode', 'wearable_alert', 'patient_initiated', 'companion_detected', 'specialist_initiated']"
                label="Crisis Type"
                variant="outlined"
                density="compact"
                clearable
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VCard>
        <VProgressLinear v-if="tableLoading" indeterminate color="primary" />
        <VTable>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Source</th>
              <th>Date</th>
              <th>Resolved By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!tableLoading && historyData.length === 0">
              <td colspan="7" class="text-center text-medium-emphasis pa-6">No crisis events found</td>
            </tr>
            <tr v-for="crisis in historyData" :key="crisis._id">
              <td>{{ getPatientName(crisis.user) }}</td>
              <td>{{ crisis.crisis_type?.replace(/_/g, ' ') }}</td>
              <td>
                <VChip :color="severityColors[crisis.severity]" size="x-small">
                  {{ crisis.severity?.replace('_', ' ') }}
                </VChip>
              </td>
              <td>
                <VChip :color="statusColors[crisis.status]" size="small">{{ crisis.status }}</VChip>
              </td>
              <td>{{ crisis.trigger_source }}</td>
              <td>{{ formatDate(crisis.created_at) }}</td>
              <td>{{ crisis.resolved_by ? getPatientName(crisis.resolved_by) : '—' }}</td>
            </tr>
          </tbody>
        </VTable>
        <VCardText v-if="historyPagination && historyPagination.pages > 1" class="d-flex justify-center">
          <VPagination v-model="currentPage" :length="historyPagination.pages" :total-visible="7" />
        </VCardText>
      </VCard>
    </template>
  </div>
</template>
