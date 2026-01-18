<script setup>
import { ref, onMounted, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useClaudeSummaryStore } from '@/stores/claudeSummary'

const store = useClaudeSummaryStore()

const loading = ref(false)
const dateRange = ref([null, null])
const snackbar = ref({ show: false, message: '', color: 'success' })

// Computed data from store
const overview = computed(() => store.overview || {})
const usageAnalytics = computed(() => store.usageAnalytics || {})
const revenueReport = computed(() => store.revenueReport || {})
const dailyTrends = computed(() => store.dailyTrends || [])
const topUsers = computed(() => store.topUsers || [])

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
    y: { formatter: (val) => `${val} summaries` },
  },
}))

const usageChartSeries = computed(() => [{
  name: 'Summaries Generated',
  data: dailyTrends.value.map(t => t.count),
}])

const revenueChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '50%',
    },
  },
  xaxis: {
    categories: dailyTrends.value.map(t => formatDate(t._id || t.date)),
    labels: { style: { fontSize: '12px' } },
  },
  yaxis: {
    labels: { formatter: (val) => formatCurrency(val) },
  },
  colors: ['#28C76F'],
  tooltip: {
    y: { formatter: (val) => formatCurrency(val) },
  },
}))

const revenueChartSeries = computed(() => [{
  name: 'Revenue',
  data: dailyTrends.value.map(t => t.revenue || 0),
}])

const sourceBreakdownOptions = computed(() => ({
  chart: { type: 'donut' },
  labels: ['Free', 'Purchased', 'Gifted', 'Unlimited'],
  colors: ['#00CFE8', '#7367F0', '#FF9F43', '#28C76F'],
  legend: { position: 'bottom' },
  responsive: [{
    breakpoint: 480,
    options: { chart: { width: 300 } },
  }],
}))

const sourceBreakdownSeries = computed(() => {
  const bySource = usageAnalytics.value.by_source || {}
  return [
    bySource.free || 0,
    bySource.purchased || 0,
    bySource.gifted || 0,
    bySource.unlimited || 0,
  ]
})

const topUsersHeaders = [
  { title: 'Patient', key: 'user' },
  { title: 'Total Used', key: 'total_used' },
  { title: 'Free', key: 'free_used' },
  { title: 'Purchased', key: 'purchased_used' },
  { title: 'Gifted', key: 'gifted_used' },
]

// Methods
const fetchAllData = async () => {
  loading.value = true
  try {
    const [startDate, endDate] = dateRange.value
    await Promise.all([
      store.fetchOverviewStats(),
      store.fetchUsageAnalytics(startDate, endDate),
      store.fetchRevenueReport(startDate, endDate),
      store.fetchDailyTrends(startDate, endDate),
      store.fetchTopUsers(10),
    ])
  } catch (error) {
    snackbar.value = { show: true, message: 'Failed to load analytics data', color: 'error' }
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value || 0)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-NG').format(value || 0)
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
          <h2 class="text-h4 font-weight-bold mb-2">AI Health Summary Analytics</h2>
          <p class="text-subtitle-1 mb-0">Monitor usage, revenue, and credit consumption metrics</p>
        </div>
        <div class="d-flex align-center" style="gap: 12px">
          <VBtn color="primary" variant="outlined" @click="fetchAllData" :loading="loading">
            <VIcon start>mdi-refresh</VIcon>
            Refresh
          </VBtn>
          <VBtn color="primary" :to="{ name: 'claude-summary-plans' }">
            <VIcon start>mdi-cog</VIcon>
            Manage Plans
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
              <VIcon size="28">mdi-file-document-outline</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatNumber(overview.total_summaries_generated) }}</div>
              <div class="text-caption text-medium-emphasis">Total Summaries</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-currency-ngn</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatCurrency(overview.total_revenue) }}</div>
              <div class="text-caption text-medium-emphasis">Total Revenue</div>
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
              <div class="text-h5 font-weight-bold">{{ formatNumber(overview.active_users) }}</div>
              <div class="text-caption text-medium-emphasis">Active Users</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="warning" variant="tonal" size="48" class="me-4">
              <VIcon size="28">mdi-infinity</VIcon>
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ formatNumber(overview.active_unlimited_subscriptions) }}</div>
              <div class="text-caption text-medium-emphasis">Unlimited Subs</div>
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
              <span v-else class="text-medium-emphasis">No data available</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Source Breakdown -->
      <VCol cols="12" md="4">
        <VCard>
          <VCardTitle>Credit Source Breakdown</VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="sourceBreakdownSeries.some(v => v > 0)"
              :key="'donut-' + sourceBreakdownSeries.join('-')"
              type="donut"
              height="300"
              :options="sourceBreakdownOptions"
              :series="sourceBreakdownSeries"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 300px">
              <VProgressCircular v-if="loading" indeterminate color="primary" />
              <span v-else class="text-medium-emphasis">No usage data</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Revenue and Stats Row -->
    <VRow class="mb-6">
      <!-- Revenue Chart -->
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>Revenue Trends</span>
            <VChip color="success" size="small">{{ formatCurrency(revenueReport.total_revenue) }}</VChip>
          </VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="dailyTrends.length"
              :key="'revenue-' + dailyTrends.length"
              type="bar"
              height="280"
              :options="revenueChartOptions"
              :series="revenueChartSeries"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 280px">
              <VProgressCircular v-if="loading" indeterminate color="primary" />
              <span v-else class="text-medium-emphasis">No revenue data</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Usage Stats -->
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle>Usage Statistics</VCardTitle>
          <VCardText>
            <VList>
              <VListItem>
                <template #prepend>
                  <VAvatar color="info" variant="tonal" size="40">
                    <VIcon>mdi-gift</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>Free Credits Used</VListItemTitle>
                <VListItemSubtitle>{{ formatNumber(usageAnalytics.by_source?.free || 0) }} summaries</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VAvatar color="primary" variant="tonal" size="40">
                    <VIcon>mdi-cart</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>Purchased Credits Used</VListItemTitle>
                <VListItemSubtitle>{{ formatNumber(usageAnalytics.by_source?.purchased || 0) }} summaries</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VAvatar color="warning" variant="tonal" size="40">
                    <VIcon>mdi-hand-heart</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>Gifted Credits Used</VListItemTitle>
                <VListItemSubtitle>{{ formatNumber(usageAnalytics.by_source?.gifted || 0) }} summaries</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VAvatar color="success" variant="tonal" size="40">
                    <VIcon>mdi-infinity</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>Unlimited Subscription Usage</VListItemTitle>
                <VListItemSubtitle>{{ formatNumber(usageAnalytics.by_source?.unlimited || 0) }} summaries</VListItemSubtitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Top Users Table -->
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>Top Users</span>
        <VChip color="info" size="small">Top 10</VChip>
      </VCardTitle>
      <VCardText>
        <VTable hover>
          <thead>
            <tr>
              <th class="text-left">Patient</th>
              <th class="text-left">Total Used</th>
              <th class="text-left">Free</th>
              <th class="text-left">Purchased</th>
              <th class="text-left">Gifted</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in store.topUsers" :key="user._id">
              <td>
                <div class="d-flex align-center">
                  <VAvatar color="primary" variant="tonal" size="32" class="me-2">
                    <span class="text-sm">{{ (user.user_info?.first_name?.[0] || 'U') + (user.user_info?.last_name?.[0] || '') }}</span>
                  </VAvatar>
                  <div>
                    <div class="font-weight-medium">{{ user.user_info?.first_name || 'Unknown' }} {{ user.user_info?.last_name || '' }}</div>
                    <div class="text-caption text-medium-emphasis">{{ user.user_info?.email || user._id }}</div>
                  </div>
                </div>
              </td>
              <td><VChip color="primary" size="small">{{ formatNumber(user.total_used) }}</VChip></td>
              <td>{{ formatNumber(user.free_used) }}</td>
              <td>{{ formatNumber(user.purchased_used) }}</td>
              <td>{{ formatNumber(user.gifted_used) }}</td>
            </tr>
            <tr v-if="store.topUsers.length === 0">
              <td colspan="5" class="text-center py-4 text-medium-emphasis">
                No top users data available
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
