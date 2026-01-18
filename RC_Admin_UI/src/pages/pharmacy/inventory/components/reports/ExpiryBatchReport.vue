<script setup>
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  data: {
    type: Object,
    default: null,
  },
})

// Format currency
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '₦0.00'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(value)
}

// Format number with commas
const formatNumber = (value) => {
  if (value === null || value === undefined) return '0'
  return new Intl.NumberFormat('en-NG').format(value)
}

// Format date
const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Expiry timeline bar chart options
const expiryChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 300,
    stacked: true,
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      borderRadius: 4,
    },
  },
  xaxis: {
    categories: props.data?.expiry_timeline?.map(t => t.period) || [],
  },
  colors: ['#FF4560', '#FEB019', '#FF9800', '#00E396', '#008FFB', '#546E7A'],
  legend: {
    position: 'top',
  },
  dataLabels: {
    enabled: true,
    style: {
      fontSize: '10px',
    },
  },
  yaxis: {
    title: {
      text: 'Batch Count',
    },
  },
  tooltip: {
    shared: true,
    intersect: false,
  },
}))

const expiryChartSeries = computed(() => [{
  name: 'Batches',
  data: props.data?.expiry_timeline?.map(t => t.batch_count) || [],
}])

// Status pie chart options
const statusChartOptions = computed(() => ({
  chart: {
    type: 'pie',
    height: 280,
  },
  labels: props.data?.batches_by_status?.map(s => formatStatusLabel(s.status)) || [],
  colors: getStatusColors(),
  legend: {
    position: 'bottom',
  },
  dataLabels: {
    enabled: true,
    formatter: (val, opts) => {
      const count = props.data?.batches_by_status?.[opts.seriesIndex]?.count || 0
      return `${count}`
    },
  },
}))

const statusChartSeries = computed(() =>
  props.data?.batches_by_status?.map(s => s.count) || []
)

// Get colors for status
function getStatusColors() {
  return ['#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A']
}

// Format status label
function formatStatusLabel(status) {
  const labels = {
    active: 'Active',
    quarantine: 'Quarantine',
    expired: 'Expired',
    recalled: 'Recalled',
    depleted: 'Depleted',
  }
  return labels[status?.toLowerCase()] || status
}

// Get expiry chip color
function getExpiryColor(days) {
  if (days < 0) return 'error'
  if (days <= 30) return 'error'
  if (days <= 60) return 'warning'
  if (days <= 90) return 'info'
  return 'success'
}

// Value at risk by period chart
const valueAtRiskChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 250,
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
      barHeight: '60%',
    },
  },
  xaxis: {
    categories: props.data?.expiry_timeline?.filter(t => t.value_at_risk > 0).map(t => t.period) || [],
    labels: {
      formatter: (val) => formatCurrency(val),
    },
  },
  colors: ['#FF4560'],
  dataLabels: {
    enabled: true,
    formatter: (val) => formatCurrency(val),
    style: {
      fontSize: '10px',
    },
  },
  tooltip: {
    y: {
      formatter: (val) => formatCurrency(val),
    },
  },
}))

const valueAtRiskChartSeries = computed(() => [{
  name: 'Value at Risk',
  data: props.data?.expiry_timeline?.filter(t => t.value_at_risk > 0).map(t => t.value_at_risk) || [],
}])
</script>

<template>
  <div v-if="data" id="expiry-batch-report">
    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="6" sm="4" md="2">
        <VCard color="primary" variant="flat">
          <VCardText class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ formatNumber(data.summary?.total_batches) }}</div>
            <div class="text-caption">Total Batches</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VCard color="success" variant="flat">
          <VCardText class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ formatNumber(data.summary?.active_batches) }}</div>
            <div class="text-caption">Active</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VCard color="error" variant="flat">
          <VCardText class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ formatNumber(data.summary?.expired_batches) }}</div>
            <div class="text-caption">Expired</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VCard color="warning" variant="flat">
          <VCardText class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ formatNumber(data.summary?.expiring_30_days) }}</div>
            <div class="text-caption">&lt; 30 Days</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VCard color="info" variant="flat">
          <VCardText class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ formatNumber(data.summary?.expiring_60_days) }}</div>
            <div class="text-caption">31-60 Days</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VCard variant="tonal">
          <VCardText class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ formatNumber(data.summary?.expiring_90_days) }}</div>
            <div class="text-caption">61-90 Days</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Additional Stats -->
    <VRow class="mb-4">
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="purple" variant="tonal" class="me-3">
              <VIcon>mdi-shield-alert</VIcon>
            </VAvatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ formatNumber(data.summary?.quarantined_batches) }}</div>
              <div class="text-body-2">Quarantined Batches</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="error" variant="tonal" class="me-3">
              <VIcon>mdi-alert-octagram</VIcon>
            </VAvatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ formatNumber(data.summary?.recalled_batches) }}</div>
              <div class="text-body-2">Recalled Batches</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="grey" variant="tonal" class="me-3">
              <VIcon>mdi-infinity</VIcon>
            </VAvatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ formatNumber(data.summary?.no_expiry_batches) }}</div>
              <div class="text-body-2">No Expiry Date</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Charts Row -->
    <VRow class="mb-4">
      <VCol cols="12" md="8">
        <VCard>
          <VCardTitle class="text-subtitle-1">Expiry Timeline</VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="expiryChartSeries[0]?.data?.length > 0"
              type="bar"
              :options="expiryChartOptions"
              :series="expiryChartSeries"
              height="300"
            />
            <div v-else class="text-center py-8 text-medium-emphasis">
              No expiry timeline data
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard>
          <VCardTitle class="text-subtitle-1">Batches by Status</VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="statusChartSeries?.length > 0"
              type="pie"
              :options="statusChartOptions"
              :series="statusChartSeries"
              height="280"
            />
            <div v-else class="text-center py-8 text-medium-emphasis">
              No status data
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Value at Risk Chart -->
    <VCard class="mb-4" v-if="data.expiry_timeline?.some(t => t.value_at_risk > 0)">
      <VCardTitle class="text-subtitle-1">
        Value at Risk by Expiry Period
        <VChip size="small" color="error" class="ml-2">
          {{ formatCurrency(data.expiry_timeline?.reduce((sum, t) => sum + (t.period !== 'No expiry' && t.period !== '90+ days' ? t.value_at_risk : 0), 0)) }}
        </VChip>
      </VCardTitle>
      <VCardText>
        <VueApexCharts
          type="bar"
          :options="valueAtRiskChartOptions"
          :series="valueAtRiskChartSeries"
          height="250"
        />
      </VCardText>
    </VCard>

    <!-- Critical Batches Table -->
    <VCard v-if="data.critical_batches?.length > 0">
      <VCardTitle class="text-subtitle-1 d-flex align-center">
        <VIcon color="error" class="me-2">mdi-alert</VIcon>
        Critical Batches (Expired or Expiring within 30 days)
      </VCardTitle>
      <VCardText>
        <VTable density="compact">
          <thead>
            <tr>
              <th>Product</th>
              <th>Batch #</th>
              <th>Supplier</th>
              <th class="text-center">Expiry</th>
              <th class="text-center">Days Left</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Value at Risk</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="batch in data.critical_batches" :key="batch.batch_id" :class="batch.days_until_expiry < 0 ? 'bg-error-lighten-5' : ''">
              <td>
                <div class="font-weight-medium">{{ batch.drug_name }}</div>
                <div class="text-caption text-medium-emphasis">{{ batch.drug_code }}</div>
              </td>
              <td>{{ batch.batch_number }}</td>
              <td>{{ batch.supplier_name }}</td>
              <td class="text-center">{{ formatDate(batch.expiry_date) }}</td>
              <td class="text-center">
                <VChip
                  size="small"
                  :color="getExpiryColor(batch.days_until_expiry)"
                >
                  {{ batch.days_until_expiry < 0 ? 'Expired' : `${batch.days_until_expiry}d` }}
                </VChip>
              </td>
              <td class="text-right">{{ formatNumber(batch.quantity_available) }}</td>
              <td class="text-right text-error">{{ formatCurrency(batch.value_at_risk) }}</td>
              <td class="text-center">
                <VChip size="x-small" :color="batch.status === 'active' ? 'success' : 'warning'">
                  {{ formatStatusLabel(batch.status) }}
                </VChip>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>

    <!-- No Critical Batches -->
    <VCard v-else class="text-center pa-6">
      <VIcon size="48" color="success" class="mb-2">mdi-check-circle</VIcon>
      <div class="text-h6">No Critical Batches</div>
      <div class="text-body-2 text-medium-emphasis">No batches are expired or expiring within 30 days</div>
    </VCard>
  </div>

  <!-- No Data State -->
  <VCard v-else class="pa-8 text-center">
    <VIcon size="64" color="grey-lighten-1" class="mb-4">mdi-calendar-clock</VIcon>
    <div class="text-h6 text-medium-emphasis">No Report Data</div>
    <div class="text-body-2 text-medium-emphasis">Click "Generate Report" to view expiry and batch data</div>
  </VCard>
</template>

<style scoped>
.bg-error-lighten-5 {
  background-color: rgba(var(--v-theme-error), 0.05) !important;
}
</style>
