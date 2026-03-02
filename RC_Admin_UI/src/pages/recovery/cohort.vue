<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRecoveryStore } from '@/stores/recovery'
import { useRouter } from 'vue-router'

const router = useRouter()
const recoveryStore = useRecoveryStore()

const tableLoading = ref(false)
const patients = ref([])
const pagination = ref(null)
const currentPage = ref(1)

const filterStatus = ref('')
const filterRisk = ref('')
const filterSubstance = ref('')

const statusOptions = ['', 'active', 'paused', 'completed', 'discharged', 'withdrawn', 'archived']
const riskOptions = ['', 'low', 'moderate', 'high', 'critical']
const substanceOptions = ['', 'alcohol', 'opioids', 'cannabis', 'cocaine', 'amphetamines', 'benzodiazepines', 'tobacco']

const riskColors = { low: 'success', moderate: 'warning', high: 'error', critical: 'deep-purple' }
const statusColors = { active: 'success', paused: 'warning', completed: 'info', discharged: 'primary', withdrawn: 'error', archived: 'secondary' }

const getPatientName = (user) => {
  if (!user?.profile) return 'Unknown'
  return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || 'Unknown'
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const getPrimarySubstance = (history) => {
  if (!Array.isArray(history)) return '—'
  const primary = history.find(s => s.is_primary)
  return primary?.substance || history[0]?.substance || '—'
}

const fetchCohort = async () => {
  tableLoading.value = true
  try {
    const result = await recoveryStore.fetchCohort({
      page: currentPage.value,
      status: filterStatus.value || undefined,
      risk_level: filterRisk.value || undefined,
      substance: filterSubstance.value || undefined,
      limit: 20,
    })
    if (result && result !== 'error') {
      patients.value = result.data || []
      pagination.value = result.pagination || null
    }
  } finally {
    tableLoading.value = false
  }
}

watch([filterStatus, filterRisk, filterSubstance], () => {
  currentPage.value = 1
  fetchCohort()
})

watch(currentPage, fetchCohort)

onMounted(fetchCohort)
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Recovery Cohort</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Browse and filter recovery programme patients</p>
      </div>
      <VBtn variant="outlined" prepend-icon="mdi-arrow-left" @click="router.push('/recovery')">
        Back to Dashboard
      </VBtn>
    </div>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" md="4">
            <VSelect
              v-model="filterStatus"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="compact"
              clearable
            />
          </VCol>
          <VCol cols="12" md="4">
            <VSelect
              v-model="filterRisk"
              :items="riskOptions"
              label="Risk Level"
              variant="outlined"
              density="compact"
              clearable
            />
          </VCol>
          <VCol cols="12" md="4">
            <VSelect
              v-model="filterSubstance"
              :items="substanceOptions"
              label="Primary Substance"
              variant="outlined"
              density="compact"
              clearable
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Table -->
    <VCard>
      <VCardTitle class="d-flex align-center">
        Patient List
        <VSpacer />
        <span v-if="pagination" class="text-subtitle-2 text-medium-emphasis">
          {{ pagination.total }} patients
        </span>
      </VCardTitle>

      <VProgressLinear v-if="tableLoading" indeterminate color="primary" />

      <VTable>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Status</th>
            <th>Primary Substance</th>
            <th>Risk Level</th>
            <th>Risk Score</th>
            <th>Sobriety Start</th>
            <th>Enrolled</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!tableLoading && patients.length === 0">
            <td colspan="8" class="text-center text-medium-emphasis pa-6">
              No patients found matching the selected filters
            </td>
          </tr>
          <tr v-for="patient in patients" :key="patient._id">
            <td>
              <div class="d-flex align-center">
                <VAvatar size="32" color="primary" class="me-2">
                  <span class="text-caption text-white">
                    {{ getPatientName(patient.user)?.charAt(0) }}
                  </span>
                </VAvatar>
                <div>
                  <div class="font-weight-medium">{{ getPatientName(patient.user) }}</div>
                  <div class="text-caption text-medium-emphasis">{{ patient.user?.email || '' }}</div>
                </div>
              </div>
            </td>
            <td>
              <VChip :color="statusColors[patient.status] || 'secondary'" size="small">
                {{ patient.status }}
              </VChip>
            </td>
            <td>{{ getPrimarySubstance(patient.substance_use_history) }}</td>
            <td>
              <VChip :color="riskColors[patient.current_risk_level] || 'secondary'" size="small">
                {{ patient.current_risk_level || 'unknown' }}
              </VChip>
            </td>
            <td>{{ patient.current_risk_score || 0 }}/100</td>
            <td>{{ formatDate(patient.sobriety_start_date) }}</td>
            <td>{{ formatDate(patient.enrolled_at) }}</td>
            <td>
              <VBtn
                size="small"
                variant="text"
                color="primary"
                @click="router.push(`/recovery/patient/${patient.user?._id || patient.user}`)"
              >
                View
              </VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>

      <VCardText v-if="pagination && pagination.pages > 1" class="d-flex justify-center">
        <VPagination
          v-model="currentPage"
          :length="pagination.pages"
          :total-visible="7"
        />
      </VCardText>
    </VCard>
  </div>
</template>
