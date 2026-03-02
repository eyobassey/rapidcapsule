<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { useRecoveryStore } from '@/stores/recovery'
import { useRouter } from 'vue-router'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const router = useRouter()
const recoveryStore = useRecoveryStore()

// State
const loading = ref(false)
const overview = ref(null)
const assessments = ref([])
const pagination = ref(null)
const currentPage = ref(1)
const filterInstrument = ref('')
const filterRisk = ref('')
const expandedRow = ref(null)

// Chart
const trendChartCanvas = ref(null)
let trendChartInstance = null
const severityChartCanvas = ref(null)
let severityChartInstance = null

// Colors
const riskColors = {
  mild: 'lime',
  moderate: 'warning',
  moderately_severe: 'deep-orange',
  severe: 'error',
  low: 'success',
  high: 'error',
}

const riskChipColors = {
  mild: '#C6FF00',
  moderate: '#FB8C00',
  moderately_severe: '#E64A19',
  severe: '#D32F2F',
}

const getPatientName = (user) => {
  if (!user?.profile) return 'Unknown'
  return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || 'Unknown'
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const scorePercentage = (score, instrument) => {
  const max = instrument === 'cows' ? 48 : 67
  return Math.round((score / max) * 100)
}

const scoreColor = (risk) => {
  return riskColors[risk] || 'grey'
}

// Fetch
const fetchOverview = async () => {
  loading.value = true
  try {
    const result = await recoveryStore.fetchWithdrawalOverview()
    if (result && result !== 'error') {
      overview.value = result
      await nextTick()
      initCharts()
    }
  } finally {
    loading.value = false
  }
}

const fetchAssessments = async () => {
  const result = await recoveryStore.fetchWithdrawalAssessments({
    page: currentPage.value,
    instrument: filterInstrument.value || undefined,
    risk_level: filterRisk.value || undefined,
    limit: 20,
  })
  if (result && result !== 'error') {
    assessments.value = result.data || []
    pagination.value = result.pagination || null
  }
}

const initCharts = async () => {
  await nextTick()
  initSeverityChart()
  initTrendChart()
}

const initSeverityChart = () => {
  if (!severityChartCanvas.value || !overview.value?.severity_distribution) return
  if (severityChartInstance) severityChartInstance.destroy()

  const dist = overview.value.severity_distribution
  const labels = Object.keys(dist).map(k => k.replace(/_/g, ' '))
  const values = Object.values(dist)
  const colors = Object.keys(dist).map(k => riskChipColors[k] || '#9E9E9E')

  severityChartInstance = new Chart(severityChartCanvas.value.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16 } },
      },
    },
  })
}

const initTrendChart = () => {
  if (!trendChartCanvas.value || !overview.value?.trend_30d?.length) return
  if (trendChartInstance) trendChartInstance.destroy()

  const trend = overview.value.trend_30d
  const cowsData = trend.filter(t => t.instrument === 'cows')
  const ciwaData = trend.filter(t => t.instrument === 'ciwa_ar')
  const allDates = [...new Set(trend.map(t => t.date))].sort()

  const cowsMap = Object.fromEntries(cowsData.map(t => [t.date, t.count]))
  const ciwaMap = Object.fromEntries(ciwaData.map(t => [t.date, t.count]))

  trendChartInstance = new Chart(trendChartCanvas.value.getContext('2d'), {
    type: 'bar',
    data: {
      labels: allDates.map(d => {
        const dt = new Date(d)
        return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      }),
      datasets: [
        {
          label: 'COWS',
          data: allDates.map(d => cowsMap[d] || 0),
          backgroundColor: 'rgba(33, 150, 243, 0.7)',
          borderRadius: 4,
        },
        {
          label: 'CIWA-Ar',
          data: allDates.map(d => ciwaMap[d] || 0),
          backgroundColor: 'rgba(255, 152, 0, 0.7)',
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
      },
      plugins: {
        legend: { position: 'bottom' },
      },
    },
  })
}

const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

watch([currentPage, filterInstrument, filterRisk], fetchAssessments)

onMounted(() => {
  fetchOverview()
  fetchAssessments()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Withdrawal Assessments</h1>
        <p class="text-subtitle-1 text-medium-emphasis">COWS (opioid) and CIWA-Ar (alcohol) withdrawal monitoring</p>
      </div>
      <VBtn variant="outlined" prepend-icon="mdi-arrow-left" @click="router.push('/recovery')">
        Back to Dashboard
      </VBtn>
    </div>

    <!-- Loading -->
    <VProgressLinear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- KPI Cards -->
    <VRow v-if="overview" class="mb-6">
      <VCol cols="6" sm="4" md="2">
        <VCard class="text-center pa-4" variant="tonal" color="primary">
          <div class="text-h4 font-weight-bold">{{ overview.total_assessments }}</div>
          <div class="text-caption">Total Assessments</div>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VCard class="text-center pa-4" variant="tonal" color="blue">
          <div class="text-h4 font-weight-bold">{{ overview.by_instrument?.cows || 0 }}</div>
          <div class="text-caption">COWS (Opioid)</div>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VCard class="text-center pa-4" variant="tonal" color="orange">
          <div class="text-h4 font-weight-bold">{{ overview.by_instrument?.ciwa_ar || 0 }}</div>
          <div class="text-caption">CIWA-Ar (Alcohol)</div>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VCard class="text-center pa-4" variant="tonal" color="teal">
          <div class="text-h4 font-weight-bold">{{ overview.unique_patients }}</div>
          <div class="text-caption">Unique Patients</div>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VCard class="text-center pa-4" variant="tonal" color="info">
          <div class="text-h4 font-weight-bold">{{ overview.avg_scores?.cows?.avg ?? '—' }}</div>
          <div class="text-caption">Avg COWS Score</div>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VCard class="text-center pa-4" variant="tonal" color="warning">
          <div class="text-h4 font-weight-bold">{{ overview.avg_scores?.ciwa_ar?.avg ?? '—' }}</div>
          <div class="text-caption">Avg CIWA-Ar Score</div>
        </VCard>
      </VCol>
    </VRow>

    <!-- Charts Row -->
    <VRow v-if="overview" class="mb-6">
      <VCol cols="12" md="5">
        <VCard>
          <VCardTitle>Severity Distribution</VCardTitle>
          <VCardText>
            <div v-if="overview.severity_distribution && Object.keys(overview.severity_distribution).length" style="height: 250px; position: relative;">
              <canvas ref="severityChartCanvas"></canvas>
            </div>
            <VAlert v-else type="info" variant="tonal">No assessment data yet</VAlert>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="7">
        <VCard>
          <VCardTitle>30-Day Assessment Trend</VCardTitle>
          <VCardText>
            <div v-if="overview.trend_30d?.length" style="height: 250px; position: relative;">
              <canvas ref="trendChartCanvas"></canvas>
            </div>
            <VAlert v-else type="info" variant="tonal">No trend data yet</VAlert>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Recent Assessments from Overview -->
    <template v-if="overview?.recent_assessments?.length">
      <h3 class="text-h6 font-weight-bold mb-3">Recent Assessments</h3>
      <VRow class="mb-6">
        <VCol v-for="a in overview.recent_assessments.slice(0, 4)" :key="a._id" cols="12" sm="6" md="3">
          <VCard variant="outlined" class="h-100">
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-2">
                <VChip :color="a.instrument === 'cows' ? 'blue' : 'orange'" size="small" variant="flat">
                  {{ a.instrument_label }}
                </VChip>
                <VChip :color="scoreColor(a.risk_level)" size="small">
                  {{ a.risk_level?.replace(/_/g, ' ') }}
                </VChip>
              </div>
              <div class="text-h5 font-weight-bold mb-1">
                {{ a.total_score }}/{{ a.max_possible_score }}
              </div>
              <VProgressLinear
                :model-value="scorePercentage(a.total_score, a.instrument)"
                :color="scoreColor(a.risk_level)"
                height="8"
                rounded
                class="mb-2"
              />
              <div class="text-body-2 mb-1">
                <VIcon size="14" class="me-1">mdi-account</VIcon>
                {{ getPatientName(a.patient) }}
              </div>
              <div class="text-caption text-medium-emphasis">
                <VIcon size="12" class="me-1">mdi-doctor</VIcon>
                {{ a.administered_by_name }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ formatDate(a.created_at) }}
              </div>
            </VCardText>
            <VCardActions>
              <VBtn
                size="small"
                variant="text"
                color="primary"
                @click="router.push(`/recovery/patient/${a.patient?._id || a.patient}`)"
              >
                View Patient
              </VBtn>
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <!-- All Assessments Table -->
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between flex-wrap ga-3">
        <span>All Withdrawal Assessments</span>
        <div class="d-flex ga-3">
          <VSelect
            v-model="filterInstrument"
            :items="[
              { title: 'All Scales', value: '' },
              { title: 'COWS (Opioid)', value: 'cows' },
              { title: 'CIWA-Ar (Alcohol)', value: 'ciwa_ar' },
            ]"
            variant="outlined"
            density="compact"
            hide-details
            style="min-width: 180px;"
          />
          <VSelect
            v-model="filterRisk"
            :items="[
              { title: 'All Severity', value: '' },
              { title: 'Mild', value: 'mild' },
              { title: 'Moderate', value: 'moderate' },
              { title: 'Moderately Severe', value: 'moderately_severe' },
              { title: 'Severe', value: 'severe' },
            ]"
            variant="outlined"
            density="compact"
            hide-details
            style="min-width: 180px;"
          />
        </div>
      </VCardTitle>

      <VTable density="compact">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Scale</th>
            <th>Score</th>
            <th>Severity</th>
            <th>Administered By</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="assessments.length === 0">
            <td colspan="7" class="text-center text-medium-emphasis pa-6">No withdrawal assessments found</td>
          </tr>
          <template v-for="a in assessments" :key="a._id">
            <tr style="cursor: pointer;" @click="toggleRow(a._id)">
              <td>
                <div class="d-flex align-center ga-2">
                  <VAvatar size="28" color="primary">
                    <span class="text-caption text-white">{{ getPatientName(a.patient)?.charAt(0) }}</span>
                  </VAvatar>
                  <div>
                    <div class="text-body-2 font-weight-medium">{{ getPatientName(a.patient) }}</div>
                    <div class="text-caption text-medium-emphasis">{{ a.patient?.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <VChip :color="a.instrument === 'cows' ? 'blue' : 'orange'" size="small" variant="flat">
                  {{ a.instrument_label }}
                </VChip>
              </td>
              <td>
                <span class="font-weight-bold">{{ a.total_score }}</span>/{{ a.max_possible_score }}
                <VProgressLinear
                  :model-value="scorePercentage(a.total_score, a.instrument)"
                  :color="scoreColor(a.risk_level)"
                  height="4"
                  rounded
                  style="min-width: 60px; max-width: 80px;"
                  class="mt-1"
                />
              </td>
              <td>
                <VChip :color="scoreColor(a.risk_level)" size="x-small">
                  {{ a.risk_level?.replace(/_/g, ' ') }}
                </VChip>
              </td>
              <td>{{ a.administered_by_name }}</td>
              <td>{{ formatDate(a.created_at) }}</td>
              <td>
                <VBtn
                  size="small"
                  variant="text"
                  :icon="expandedRow === a._id ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  @click.stop="toggleRow(a._id)"
                />
              </td>
            </tr>
            <!-- Expanded detail row -->
            <tr v-if="expandedRow === a._id">
              <td colspan="7" class="pa-4 bg-grey-lighten-5">
                <VRow>
                  <VCol cols="12" md="6">
                    <h4 class="text-subtitle-2 font-weight-bold mb-2">Assessment Details</h4>
                    <div class="text-body-2 mb-1">
                      <strong>Scale:</strong> {{ a.instrument_label }}
                      ({{ a.instrument === 'cows' ? 'Clinical Opiate Withdrawal Scale' : 'Clinical Institute Withdrawal Assessment - Alcohol, Revised' }})
                    </div>
                    <div class="text-body-2 mb-1">
                      <strong>Risk Zone:</strong> {{ a.risk_zone_label || a.risk_level?.replace(/_/g, ' ') }}
                    </div>
                    <div v-if="a.substances_identified?.length" class="text-body-2 mb-1">
                      <strong>Target Substances:</strong>
                      <VChip v-for="s in a.substances_identified" :key="s" size="x-small" class="ms-1 mb-1">{{ s }}</VChip>
                    </div>
                    <div class="text-body-2 mb-1">
                      <strong>Type:</strong> {{ a.screening_type?.replace(/_/g, ' ') || 'specialist administered' }}
                    </div>
                    <VBtn
                      class="mt-2"
                      size="small"
                      color="primary"
                      variant="tonal"
                      prepend-icon="mdi-account-arrow-right"
                      @click="router.push(`/recovery/patient/${a.patient?._id || a.patient}`)"
                    >
                      View Patient Profile
                    </VBtn>
                  </VCol>
                  <VCol cols="12" md="6">
                    <h4 class="text-subtitle-2 font-weight-bold mb-2">Item Responses</h4>
                    <div v-if="a.answers && Object.keys(a.answers).length">
                      <div
                        v-for="(value, itemId) in a.answers"
                        :key="itemId"
                        class="d-flex align-center justify-space-between py-1"
                        style="border-bottom: 1px solid #eee;"
                      >
                        <span class="text-body-2">{{ itemId.replace(/_/g, ' ') }}</span>
                        <VChip size="x-small" :color="value > 3 ? 'error' : value > 1 ? 'warning' : 'success'">
                          {{ value }}
                        </VChip>
                      </div>
                    </div>
                    <div v-else class="text-medium-emphasis text-body-2">No item-level data</div>
                  </VCol>
                </VRow>
              </td>
            </tr>
          </template>
        </tbody>
      </VTable>

      <VCardText v-if="pagination && pagination.pages > 1" class="d-flex justify-center">
        <VPagination v-model="currentPage" :length="pagination.pages" :total-visible="7" />
      </VCardText>
    </VCard>
  </div>
</template>
