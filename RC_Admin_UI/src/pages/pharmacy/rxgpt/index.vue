<script setup>
import { ref, onMounted, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useRxGPTStore } from '@/stores/rxgpt'

const store = useRxGPTStore()

const loading = ref(false)
const dateRange = ref([null, null])
const snackbar = ref({ show: false, message: '', color: 'success' })

// Computed data from store
const analytics = computed(() => store.analytics || {})
const dailyTrends = computed(() => store.dailyTrends || [])
const alertBreakdown = computed(() => store.alertBreakdown || {})
const topDrugs = computed(() => store.topDrugs || [])
const topSpecialists = computed(() => store.topSpecialists || [])
const settings = computed(() => store.settings || {})

// Chart options
const usageChartOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    sparkline: { enabled: false },
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
    categories: dailyTrends.value.map(t => formatDate(t._id || t.date)),
    labels: { style: { fontSize: '12px' } },
  },
  yaxis: {
    labels: { formatter: (val) => Math.round(val) },
  },
  colors: ['#7367F0'],
  tooltip: {
    y: { formatter: (val) => `${val} analyses` },
  },
}))

const usageChartSeries = computed(() => [{
  name: 'RxGPT Analyses',
  data: dailyTrends.value.map(t => t.count || 0),
}])

const alertsChartOptions = computed(() => ({
  chart: { type: 'donut' },
  labels: ['Critical', 'Warning', 'Info'],
  colors: ['#EF4444', '#F59E0B', '#3B82F6'],
  legend: { position: 'bottom' },
  responsive: [{
    breakpoint: 480,
    options: { chart: { width: 280 } },
  }],
}))

const alertsChartSeries = computed(() => {
  const byType = alertBreakdown.value.by_severity || {}
  return [
    byType.critical || 0,
    byType.warning || 0,
    byType.info || 0,
  ]
})

const alertTypesChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
    },
  },
  xaxis: {
    categories: ['Allergy', 'Interaction', 'Contraindication', 'Dosage', 'Age', 'Pregnancy'],
  },
  colors: ['#8B5CF6'],
}))

const alertTypesChartSeries = computed(() => [{
  name: 'Alerts',
  data: [
    alertBreakdown.value.by_type?.allergy || 0,
    alertBreakdown.value.by_type?.interaction || 0,
    alertBreakdown.value.by_type?.contraindication || 0,
    alertBreakdown.value.by_type?.dosage || 0,
    alertBreakdown.value.by_type?.age || 0,
    alertBreakdown.value.by_type?.pregnancy || 0,
  ],
}])

// Methods
const fetchAllData = async () => {
  loading.value = true
  try {
    const [startDate, endDate] = dateRange.value
    await Promise.all([
      store.fetchSettings(),
      store.fetchAnalytics(startDate, endDate),
      store.fetchDailyTrends(startDate, endDate),
      store.fetchAlertBreakdown(startDate, endDate),
      store.fetchTopDrugs(10),
      store.fetchTopSpecialists(10),
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

const formatPercent = (value) => {
  return `${(value || 0).toFixed(1)}%`
}

const getRiskColor = (level) => {
  const colors = {
    low: 'success',
    moderate: 'warning',
    high: 'error',
    critical: 'error',
  }
  return colors[level] || 'grey'
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
          <div class="d-flex align-center mb-2" style="gap: 8px">
            <VIcon size="32">mdi-robot</VIcon>
            <h2 class="text-h4 font-weight-bold">RxGPT Analytics</h2>
          </div>
          <p class="text-subtitle-1 mb-0">AI-powered prescription safety assistant analytics</p>
        </div>
        <div class="d-flex align-center" style="gap: 12px">
          <VChip
            :color="settings.is_enabled ? 'success' : 'error'"
            variant="flat"
          >
            <VIcon start size="16">{{ settings.is_enabled ? 'mdi-check-circle' : 'mdi-close-circle' }}</VIcon>
            {{ settings.is_enabled ? 'Enabled' : 'Disabled' }}
          </VChip>
          <VBtn color="primary" variant="outlined" @click="fetchAllData" :loading="loading">
            <VIcon start>mdi-refresh</VIcon>
            Refresh
          </VBtn>
          <VBtn color="primary" :to="{ name: 'pharmacy-rxgpt-settings' }">
            <VIcon start>mdi-cog</VIcon>
            Settings
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
              <VIcon size="28">mdi-clipboard-pulse</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatNumber(analytics.total_analyses) }}</div>
              <div class="text-caption text-medium-emphasis">Total Analyses</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="error" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-alert</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatNumber(analytics.total_alerts) }}</div>
              <div class="text-caption text-medium-emphasis">Alerts Generated</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-shield-check</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatPercent(analytics.safe_rate) }}</div>
              <div class="text-caption text-medium-emphasis">Safe Rate</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="info" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-account-multiple</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatNumber(analytics.active_specialists) }}</div>
              <div class="text-caption text-medium-emphasis">Active Specialists</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Credit Stats Row -->
    <VRow class="mb-6">
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="warning" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-lightning-bolt</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatNumber(analytics.credits_consumed) }}</div>
              <div class="text-caption text-medium-emphasis">Credits Consumed</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="secondary" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-gauge</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatPercent(analytics.avg_confidence) }}</div>
              <div class="text-caption text-medium-emphasis">Avg Confidence</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="primary" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-capsule</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatNumber(analytics.drugs_analyzed) }}</div>
              <div class="text-caption text-medium-emphasis">Drugs Analyzed</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar :color="getRiskColor(analytics.most_common_risk)" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-speedometer</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold text-capitalize">{{ analytics.most_common_risk || 'N/A' }}</div>
              <div class="text-caption text-medium-emphasis">Common Risk Level</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Charts Row -->
    <VRow class="mb-6">
      <!-- Usage Trends Chart -->
      <VCol cols="12" md="8">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>Usage Trends</span>
            <VChip color="primary" size="small">Last 30 Days</VChip>
          </VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="dailyTrends.length"
              :key="'usage-' + dailyTrends.length"
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

      <!-- Alerts Severity Breakdown -->
      <VCol cols="12" md="4">
        <VCard>
          <VCardTitle>Alert Severity</VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="alertsChartSeries.some(v => v > 0)"
              :key="'alerts-' + alertsChartSeries.join('-')"
              type="donut"
              height="300"
              :options="alertsChartOptions"
              :series="alertsChartSeries"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 300px">
              <VProgressCircular v-if="loading" indeterminate color="primary" />
              <span v-else class="text-medium-emphasis">No alerts data</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Alert Types and Top Drugs Row -->
    <VRow class="mb-6">
      <!-- Alert Types Chart -->
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle>Alerts by Type</VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="Object.values(alertBreakdown.by_type || {}).some(v => v > 0)"
              :key="'alert-types-' + JSON.stringify(alertBreakdown.by_type)"
              type="bar"
              height="280"
              :options="alertTypesChartOptions"
              :series="alertTypesChartSeries"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 280px">
              <VProgressCircular v-if="loading" indeterminate color="primary" />
              <span v-else class="text-medium-emphasis">No alert type data</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Top Flagged Drugs -->
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>Top Flagged Drugs</span>
            <VChip color="warning" size="small">Most Alerts</VChip>
          </VCardTitle>
          <VCardText>
            <VList density="compact">
              <VListItem
                v-for="(drug, index) in topDrugs"
                :key="drug._id || index"
              >
                <template #prepend>
                  <VAvatar color="warning" variant="tonal" size="32" class="me-2">
                    <span class="text-sm font-weight-bold">{{ index + 1 }}</span>
                  </VAvatar>
                </template>
                <VListItemTitle>{{ drug.name }}</VListItemTitle>
                <VListItemSubtitle>{{ drug.alert_count }} alerts</VListItemSubtitle>
                <template #append>
                  <VChip :color="getRiskColor(drug.most_common_severity)" size="small" variant="tonal">
                    {{ drug.most_common_severity }}
                  </VChip>
                </template>
              </VListItem>
              <VListItem v-if="topDrugs.length === 0">
                <VListItemTitle class="text-center text-medium-emphasis">
                  No drug data available
                </VListItemTitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Top Specialists Table -->
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>Top Specialists by Usage</span>
        <VBtn color="primary" size="small" variant="tonal" :to="{ name: 'pharmacy-rxgpt-specialists' }">
          <VIcon start size="16">mdi-account-group</VIcon>
          Manage Credits
        </VBtn>
      </VCardTitle>
      <VCardText>
        <VTable hover>
          <thead>
            <tr>
              <th class="text-left">Specialist</th>
              <th class="text-left">Analyses</th>
              <th class="text-left">Alerts</th>
              <th class="text-left">Safe Rate</th>
              <th class="text-left">Credits Used</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="specialist in topSpecialists" :key="specialist._id">
              <td>
                <div class="d-flex align-center">
                  <VAvatar color="primary" variant="tonal" size="32" class="me-2">
                    <span class="text-sm">{{ (specialist.first_name?.[0] || 'S') + (specialist.last_name?.[0] || '') }}</span>
                  </VAvatar>
                  <div>
                    <div class="font-weight-medium">{{ specialist.first_name || 'Unknown' }} {{ specialist.last_name || '' }}</div>
                    <div class="text-caption text-medium-emphasis">{{ specialist.specialization || 'N/A' }}</div>
                  </div>
                </div>
              </td>
              <td><VChip color="primary" size="small">{{ formatNumber(specialist.analyses_count) }}</VChip></td>
              <td>{{ formatNumber(specialist.alerts_count) }}</td>
              <td>
                <VChip :color="specialist.safe_rate >= 80 ? 'success' : 'warning'" size="small" variant="tonal">
                  {{ formatPercent(specialist.safe_rate) }}
                </VChip>
              </td>
              <td>{{ formatNumber(specialist.credits_used) }}</td>
            </tr>
            <tr v-if="topSpecialists.length === 0">
              <td colspan="5" class="text-center py-4 text-medium-emphasis">
                No specialist usage data available
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
