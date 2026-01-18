<script setup>
import { ref, onMounted, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useReferralsStore } from '@/stores/referrals'

const store = useReferralsStore()

const loading = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

// Computed data from store
const analytics = computed(() => store.analytics || {})
const overview = computed(() => analytics.value?.overview || {})
const topReferrers = computed(() => analytics.value?.top_referrers || [])
const clicksBySource = computed(() => analytics.value?.clicks_by_source || [])
const signupsOverTime = computed(() => analytics.value?.signups_over_time || [])
const clicksOverTime = computed(() => analytics.value?.clicks_over_time || [])

// Chart options for trends
const trendsChartOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    zoom: { enabled: false },
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
    categories: clicksOverTime.value.map(t => formatDate(t._id)),
    labels: { style: { fontSize: '11px' } },
  },
  yaxis: {
    labels: { formatter: (val) => Math.round(val) },
  },
  colors: ['#7367F0', '#28C76F'],
  tooltip: {
    y: { formatter: (val) => `${val}` },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
  },
}))

const trendsChartSeries = computed(() => [
  {
    name: 'Clicks',
    data: clicksOverTime.value.map(t => t.count),
  },
  {
    name: 'Signups',
    data: signupsOverTime.value.map(t => t.count),
  },
])

// Source distribution chart
const sourceChartOptions = computed(() => ({
  chart: { type: 'donut' },
  labels: clicksBySource.value.map(s => formatSourceName(s._id)),
  colors: ['#25D366', '#1DA1F2', '#1877F2', '#0077B5', '#6B7280', '#7367F0'],
  legend: {
    position: 'bottom',
    fontSize: '13px',
  },
  plotOptions: {
    pie: {
      donut: {
        size: '60%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total Clicks',
            formatter: () => overview.value.total_clicks || 0,
          },
        },
      },
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (val) => `${val.toFixed(1)}%`,
  },
}))

const sourceChartSeries = computed(() => clicksBySource.value.map(s => s.count))

// Helper functions
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatSourceName(source) {
  const names = {
    whatsapp: 'WhatsApp',
    twitter: 'Twitter',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    email: 'Email',
    direct: 'Direct',
    copy: 'Copy Link',
    other: 'Other',
  }
  return names[source] || source
}

function formatReferrerName(referral) {
  if (!referral?.referrer?.profile) return 'Unknown'
  const { first_name, last_name } = referral.referrer.profile
  return `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown'
}

function getInitials(referral) {
  if (!referral?.referrer?.profile) return '?'
  const { first_name, last_name } = referral.referrer.profile
  return `${(first_name || '')[0] || ''}${(last_name || '')[0] || ''}`.toUpperCase() || '?'
}

async function fetchData() {
  loading.value = true
  try {
    await store.fetchAnalytics()
  } catch (error) {
    snackbar.value = {
      show: true,
      message: error.message || 'Failed to load data',
      color: 'error',
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <VRow>
    <VCol cols="12">
      <div class="d-flex justify-space-between align-center mb-4">
        <div>
          <h4 class="text-h4 font-weight-bold">Referrals Dashboard</h4>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Track and manage your referral program performance
          </p>
        </div>
        <div class="d-flex gap-2">
          <VBtn
            color="primary"
            variant="tonal"
            to="/referrals/settings"
          >
            <VIcon start icon="bx-cog" />
            Settings
          </VBtn>
        </div>
      </div>
    </VCol>

    <!-- Overview Stats -->
    <VCol cols="12" md="3">
      <VCard class="h-100">
        <VCardText class="d-flex flex-column align-center pa-6">
          <VAvatar color="primary" variant="tonal" size="56" class="mb-3">
            <VIcon icon="bx-user-plus" size="28" />
          </VAvatar>
          <h3 class="text-h3 font-weight-bold">{{ overview.total_referrers || 0 }}</h3>
          <span class="text-body-2 text-medium-emphasis">Total Referrers</span>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" md="3">
      <VCard class="h-100">
        <VCardText class="d-flex flex-column align-center pa-6">
          <VAvatar color="success" variant="tonal" size="56" class="mb-3">
            <VIcon icon="bx-user-check" size="28" />
          </VAvatar>
          <h3 class="text-h3 font-weight-bold">{{ overview.total_signups || 0 }}</h3>
          <span class="text-body-2 text-medium-emphasis">Total Signups</span>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" md="3">
      <VCard class="h-100">
        <VCardText class="d-flex flex-column align-center pa-6">
          <VAvatar color="info" variant="tonal" size="56" class="mb-3">
            <VIcon icon="bx-pointer" size="28" />
          </VAvatar>
          <h3 class="text-h3 font-weight-bold">{{ overview.total_clicks || 0 }}</h3>
          <span class="text-body-2 text-medium-emphasis">Total Clicks</span>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" md="3">
      <VCard class="h-100">
        <VCardText class="d-flex flex-column align-center pa-6">
          <VAvatar color="warning" variant="tonal" size="56" class="mb-3">
            <VIcon icon="bx-trending-up" size="28" />
          </VAvatar>
          <h3 class="text-h3 font-weight-bold">{{ overview.conversion_rate || 0 }}%</h3>
          <span class="text-body-2 text-medium-emphasis">Conversion Rate</span>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Trends Chart -->
    <VCol cols="12" lg="8">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Referral Trends (Last 30 Days)</span>
        </VCardTitle>
        <VCardText>
          <VueApexCharts
            v-if="clicksOverTime.length > 0"
            type="area"
            height="350"
            :options="trendsChartOptions"
            :series="trendsChartSeries"
          />
          <div v-else class="d-flex justify-center align-center" style="height: 350px">
            <span class="text-medium-emphasis">No data available</span>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Click Sources -->
    <VCol cols="12" lg="4">
      <VCard class="h-100">
        <VCardTitle>Clicks by Source</VCardTitle>
        <VCardText>
          <VueApexCharts
            v-if="clicksBySource.length > 0"
            type="donut"
            height="320"
            :options="sourceChartOptions"
            :series="sourceChartSeries"
          />
          <div v-else class="d-flex justify-center align-center" style="height: 320px">
            <span class="text-medium-emphasis">No data available</span>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Top Referrers -->
    <VCol cols="12">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Top Referrers</span>
          <VBtn
            color="primary"
            variant="text"
            size="small"
            to="/referrals/all"
          >
            View All
          </VBtn>
        </VCardTitle>
        <VCardText>
          <VTable v-if="topReferrers.length > 0">
            <thead>
              <tr>
                <th>Referrer</th>
                <th class="text-center">Code</th>
                <th class="text-center">Signups</th>
                <th class="text-center">Clicks</th>
                <th class="text-center">Shares</th>
                <th class="text-center">Conversion</th>
                <th class="text-center">Credits Earned</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="referral in topReferrers" :key="referral._id">
                <td>
                  <div class="d-flex align-center gap-3">
                    <VAvatar
                      :image="referral.referrer?.profile?.profile_image"
                      color="primary"
                      variant="tonal"
                      size="40"
                    >
                      <span v-if="!referral.referrer?.profile?.profile_image">
                        {{ getInitials(referral) }}
                      </span>
                    </VAvatar>
                    <div>
                      <span class="font-weight-medium">{{ formatReferrerName(referral) }}</span>
                      <div class="text-caption text-medium-emphasis">
                        {{ referral.referrer?.email || '' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <VChip size="small" color="primary" variant="tonal">
                    {{ referral.referral_code }}
                  </VChip>
                </td>
                <td class="text-center font-weight-bold text-success">
                  {{ referral.total_signups || 0 }}
                </td>
                <td class="text-center">{{ referral.total_clicks || 0 }}</td>
                <td class="text-center">{{ referral.total_shares || 0 }}</td>
                <td class="text-center">
                  <VChip
                    size="small"
                    :color="(referral.total_clicks > 0 ? (referral.total_signups / referral.total_clicks * 100) : 0) > 10 ? 'success' : 'warning'"
                    variant="tonal"
                  >
                    {{ referral.total_clicks > 0 ? ((referral.total_signups / referral.total_clicks) * 100).toFixed(1) : 0 }}%
                  </VChip>
                </td>
                <td class="text-center">
                  <VChip size="small" color="info" variant="tonal">
                    {{ referral.total_credits_earned || 0 }} credits
                  </VChip>
                </td>
              </tr>
            </tbody>
          </VTable>
          <div v-else class="text-center py-8 text-medium-emphasis">
            No referrers with signups yet
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Snackbar -->
  <VSnackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    location="top end"
  >
    {{ snackbar.message }}
  </VSnackbar>

  <!-- Loading Overlay -->
  <VOverlay
    v-model="loading"
    class="align-center justify-center"
    persistent
  >
    <VProgressCircular indeterminate size="64" />
  </VOverlay>
</template>
