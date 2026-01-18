<script setup>
import { ref, onMounted, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useAdvancedHealthScoreStore } from '@/stores/advancedHealthScore'

const store = useAdvancedHealthScoreStore()

const loading = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

// Computed data from store
const overview = computed(() => store.overview || {})
const usageTrends = computed(() => store.usageTrends || {})
const scoreDistribution = computed(() => store.scoreDistribution || [])
const domainAverages = computed(() => store.domainAverages || [])
const dailyUsage = computed(() => usageTrends.value?.daily_usage || [])

// Chart options for usage trends
const usageChartOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.1,
    },
  },
  xaxis: {
    categories: dailyUsage.value.map(t => formatDate(t.date)),
    labels: { style: { fontSize: '12px' } },
  },
  yaxis: {
    labels: { formatter: (val) => Math.round(val) },
  },
  colors: ['#7367F0', '#28C76F'],
  tooltip: {
    y: { formatter: (val) => `${val}` },
  },
}))

const usageChartSeries = computed(() => [
  {
    name: 'Assessments',
    data: dailyUsage.value.map(t => t.assessments),
  },
  {
    name: 'Avg Score',
    data: dailyUsage.value.map(t => t.average_score),
  },
])

// Score distribution chart
const distributionChartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false } },
  plotOptions: {
    bar: {
      borderRadius: 4,
      horizontal: true,
      distributed: true,
    },
  },
  colors: ['#EA5455', '#FF9F43', '#00CFE8', '#28C76F', '#7367F0'],
  xaxis: {
    categories: scoreDistribution.value.map(d => d.label),
  },
  legend: { show: false },
  dataLabels: { enabled: true },
}))

const distributionChartSeries = computed(() => [{
  name: 'Patients',
  data: scoreDistribution.value.map(d => d.count),
}])

// Domain averages chart
const domainChartOptions = computed(() => ({
  chart: { type: 'radar', toolbar: { show: false } },
  xaxis: {
    categories: domainAverages.value.map(d => d.domain_label),
  },
  yaxis: { max: 100, min: 0 },
  colors: ['#7367F0'],
  markers: { size: 4 },
  fill: { opacity: 0.2 },
}))

const domainChartSeries = computed(() => [{
  name: 'Avg Score',
  data: domainAverages.value.map(d => d.average_score),
}])

// Methods
const fetchAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      store.fetchOverviewStats(),
      store.fetchUsageTrends(),
      store.fetchScoreDistribution(),
      store.fetchDomainAverages(),
    ])
  } catch (error) {
    snackbar.value = { show: true, message: 'Failed to load analytics data', color: 'error' }
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-NG').format(value || 0)
}

const getScoreColor = (score) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'info'
  if (score >= 40) return 'warning'
  return 'error'
}

onMounted(() => {
  fetchAllData()
})
</script>

<template>
  <div>
    <!-- Header -->
    <VCard class="mb-6" color="primary" variant="tonal">
      <VCardText class="d-flex align-center justify-space-between flex-wrap" style="gap: 16px">
        <div>
          <h2 class="text-h4 font-weight-bold mb-2">Advanced Health Score</h2>
          <p class="text-subtitle-1 mb-0">Monitor assessments, scores, and health insights</p>
        </div>
        <div class="d-flex align-center" style="gap: 12px">
          <VBtn color="primary" variant="outlined" @click="fetchAllData" :loading="loading">
            <VIcon start>mdi-refresh</VIcon>
            Refresh
          </VBtn>
          <VBtn color="primary" :to="{ name: 'advanced-health-score-settings' }">
            <VIcon start>mdi-cog</VIcon>
            Settings
          </VBtn>
          <VBtn color="secondary" :to="{ name: 'advanced-health-score-questions' }">
            <VIcon start>mdi-help-circle</VIcon>
            Questions
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Overview Stats -->
    <VRow class="mb-6">
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="primary" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-clipboard-check</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatNumber(overview.total_assessments) }}</div>
              <div class="text-caption text-medium-emphasis">Total Assessments</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-check-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatNumber(overview.completed_assessments) }}</div>
              <div class="text-caption text-medium-emphasis">Completed</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar :color="getScoreColor(overview.average_score)" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-chart-line</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ overview.average_score || '--' }}</div>
              <div class="text-caption text-medium-emphasis">Avg Score</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="info" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-coin</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatNumber(overview.total_credits_used) }}</div>
              <div class="text-caption text-medium-emphasis">Credits Used</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Feature Status & Questions Stats -->
    <VRow class="mb-6">
      <VCol cols="12" md="4">
        <VCard>
          <VCardTitle>Feature Status</VCardTitle>
          <VCardText>
            <VList>
              <VListItem>
                <template #prepend>
                  <VAvatar :color="overview.settings?.is_enabled ? 'success' : 'error'" variant="tonal" size="40">
                    <VIcon>{{ overview.settings?.is_enabled ? 'mdi-check' : 'mdi-close' }}</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>Feature Status</VListItemTitle>
                <VListItemSubtitle>
                  <VChip :color="overview.settings?.is_enabled ? 'success' : 'error'" size="small">
                    {{ overview.settings?.is_enabled ? 'Enabled' : 'Disabled' }}
                  </VChip>
                </VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VAvatar color="warning" variant="tonal" size="40">
                    <VIcon>mdi-coin</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>Credit Cost</VListItemTitle>
                <VListItemSubtitle>{{ overview.settings?.credit_cost || 3 }} credits per assessment</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VAvatar color="info" variant="tonal" size="40">
                    <VIcon>mdi-file-upload</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>Max Documents</VListItemTitle>
                <VListItemSubtitle>{{ overview.settings?.max_documents || 5 }} files allowed</VListItemSubtitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="4">
        <VCard>
          <VCardTitle>Questions Stats</VCardTitle>
          <VCardText>
            <VList>
              <VListItem>
                <template #prepend>
                  <VAvatar color="primary" variant="tonal" size="40">
                    <VIcon>mdi-format-list-numbered</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>Total Questions</VListItemTitle>
                <VListItemSubtitle>{{ formatNumber(overview.total_questions) }}</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VAvatar color="success" variant="tonal" size="40">
                    <VIcon>mdi-check-circle</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>Active Questions</VListItemTitle>
                <VListItemSubtitle>{{ formatNumber(overview.active_questions) }}</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VAvatar color="info" variant="tonal" size="40">
                    <VIcon>mdi-calendar-clock</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>Recent (30 days)</VListItemTitle>
                <VListItemSubtitle>{{ formatNumber(overview.recent_assessments_30d) }} assessments</VListItemSubtitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="4">
        <VCard>
          <VCardTitle>Score Distribution</VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="scoreDistribution.length"
              :key="'dist-' + scoreDistribution.length"
              type="bar"
              height="220"
              :options="distributionChartOptions"
              :series="distributionChartSeries"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 220px">
              <VProgressCircular v-if="loading" indeterminate color="primary" />
              <span v-else class="text-medium-emphasis">No data available</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Charts Row -->
    <VRow class="mb-6">
      <!-- Usage Trends -->
      <VCol cols="12" md="8">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>Usage Trends</span>
            <VChip color="primary" size="small">Last 30 Days</VChip>
          </VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="dailyUsage.length"
              :key="'usage-' + dailyUsage.length"
              type="area"
              height="300"
              :options="usageChartOptions"
              :series="usageChartSeries"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 300px">
              <VProgressCircular v-if="loading" indeterminate color="primary" />
              <span v-else class="text-medium-emphasis">No usage data available</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Domain Averages Radar -->
      <VCol cols="12" md="4">
        <VCard>
          <VCardTitle>Domain Averages</VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="domainAverages.length"
              :key="'radar-' + domainAverages.length"
              type="radar"
              height="300"
              :options="domainChartOptions"
              :series="domainChartSeries"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 300px">
              <VProgressCircular v-if="loading" indeterminate color="primary" />
              <span v-else class="text-medium-emphasis">No domain data</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Domain Details Table -->
    <VCard v-if="domainAverages.length">
      <VCardTitle>Domain Performance</VCardTitle>
      <VCardText>
        <VTable hover>
          <thead>
            <tr>
              <th class="text-left">Domain</th>
              <th class="text-left">Avg Score</th>
              <th class="text-left">Assessments</th>
              <th class="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="domain in domainAverages" :key="domain.domain">
              <td>
                <div class="font-weight-medium">{{ domain.domain_label }}</div>
                <div class="text-caption text-medium-emphasis">{{ domain.domain }}</div>
              </td>
              <td>
                <VChip :color="getScoreColor(domain.average_score)" size="small">
                  {{ domain.average_score }}
                </VChip>
              </td>
              <td>{{ formatNumber(domain.assessments) }}</td>
              <td>
                <span v-if="domain.average_score >= 80" class="text-success">Excellent</span>
                <span v-else-if="domain.average_score >= 60" class="text-info">Good</span>
                <span v-else-if="domain.average_score >= 40" class="text-warning">Fair</span>
                <span v-else class="text-error">Needs Attention</span>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>
