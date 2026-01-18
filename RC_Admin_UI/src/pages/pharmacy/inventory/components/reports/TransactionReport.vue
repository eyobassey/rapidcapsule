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

// Format datetime
const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Transaction type labels and colors
const transactionTypeConfig = {
  RECEIVED: { label: 'Received', color: 'success', icon: 'mdi-arrow-down' },
  SOLD: { label: 'Sold', color: 'primary', icon: 'mdi-arrow-up' },
  ADJUSTMENT_ADD: { label: 'Adjustment (+)', color: 'info', icon: 'mdi-plus' },
  ADJUSTMENT_SUBTRACT: { label: 'Adjustment (-)', color: 'warning', icon: 'mdi-minus' },
  RETURN_TO_SUPPLIER: { label: 'Return to Supplier', color: 'orange', icon: 'mdi-undo' },
  RETURN_FROM_CUSTOMER: { label: 'Return from Customer', color: 'teal', icon: 'mdi-redo' },
  EXPIRED: { label: 'Write-off (Expired)', color: 'error', icon: 'mdi-calendar-remove' },
  DAMAGED: { label: 'Write-off (Damaged)', color: 'error', icon: 'mdi-package-variant-remove' },
  RECALLED: { label: 'Recalled', color: 'deep-purple', icon: 'mdi-alert-octagram' },
}

const getTypeConfig = (type) => transactionTypeConfig[type] || { label: type, color: 'grey', icon: 'mdi-swap-horizontal' }

// Daily volume area chart options
const dailyChartOptions = computed(() => ({
  chart: {
    type: 'area',
    height: 300,
    stacked: false,
    toolbar: {
      show: false,
    },
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  xaxis: {
    type: 'datetime',
    categories: props.data?.by_day?.map(d => d.date) || [],
  },
  colors: ['#00E396', '#FF4560', '#FEB019', '#775DD0'],
  fill: {
    type: 'gradient',
    gradient: {
      opacityFrom: 0.6,
      opacityTo: 0.1,
    },
  },
  legend: {
    position: 'top',
  },
  tooltip: {
    x: {
      format: 'dd MMM yyyy',
    },
  },
  yaxis: {
    title: {
      text: 'Units',
    },
  },
}))

const dailyChartSeries = computed(() => {
  if (!props.data?.by_day?.length) return []
  return [
    { name: 'Received', data: props.data.by_day.map(d => d.received) },
    { name: 'Sold', data: props.data.by_day.map(d => d.sold) },
    { name: 'Adjusted', data: props.data.by_day.map(d => Math.abs(d.adjusted)) },
    { name: 'Other', data: props.data.by_day.map(d => d.returned + d.other) },
  ]
})

// Transaction types horizontal bar chart
const typeChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 280,
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
      barHeight: '60%',
    },
  },
  xaxis: {
    categories: props.data?.by_type?.map(t => getTypeConfig(t.type).label) || [],
  },
  colors: props.data?.by_type?.map(t => {
    const config = getTypeConfig(t.type)
    const colorMap = {
      success: '#00E396',
      primary: '#008FFB',
      info: '#00E5FF',
      warning: '#FEB019',
      orange: '#FF9800',
      teal: '#009688',
      error: '#FF4560',
      'deep-purple': '#7E57C2',
      grey: '#546E7A',
    }
    return colorMap[config.color] || '#546E7A'
  }) || [],
  dataLabels: {
    enabled: true,
    formatter: (val) => formatNumber(val),
  },
  tooltip: {
    y: {
      formatter: (val) => `${formatNumber(val)} units`,
    },
  },
}))

const typeChartSeries = computed(() => [{
  name: 'Count',
  data: props.data?.by_type?.map(t => t.count) || [],
}])

// Top moving drugs chart
const movingDrugsChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 300,
    stacked: true,
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
    },
  },
  xaxis: {
    categories: props.data?.top_moving_drugs?.map(d => d.drug_name) || [],
  },
  colors: ['#00E396', '#FF4560'],
  legend: {
    position: 'top',
  },
  dataLabels: {
    enabled: true,
    style: {
      fontSize: '10px',
    },
  },
}))

const movingDrugsChartSeries = computed(() => [
  { name: 'In', data: props.data?.top_moving_drugs?.map(d => d.total_in) || [] },
  { name: 'Out', data: props.data?.top_moving_drugs?.map(d => d.total_out) || [] },
])
</script>

<template>
  <div v-if="data" id="transaction-report">
    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="6" sm="4" md="3">
        <VCard color="primary" variant="flat">
          <VCardText class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ formatNumber(data.summary?.total_transactions) }}</div>
            <div class="text-caption">Total Transactions</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="3">
        <VCard color="success" variant="flat">
          <VCardText class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ formatNumber(data.summary?.total_received) }}</div>
            <div class="text-caption">Units Received</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="3">
        <VCard color="info" variant="flat">
          <VCardText class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ formatNumber(data.summary?.total_sold) }}</div>
            <div class="text-caption">Units Sold</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="4" md="3">
        <VCard :color="data.summary?.net_movement >= 0 ? 'success' : 'error'" variant="flat">
          <VCardText class="text-center pa-3">
            <div class="text-h5 font-weight-bold">
              {{ data.summary?.net_movement >= 0 ? '+' : '' }}{{ formatNumber(data.summary?.net_movement) }}
            </div>
            <div class="text-caption">Net Movement</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Value Summary -->
    <VRow class="mb-4">
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="tonal" class="me-3">
              <VIcon>mdi-arrow-down-bold</VIcon>
            </VAvatar>
            <div>
              <div class="text-h6 font-weight-bold text-success">{{ formatCurrency(data.summary?.total_value_in) }}</div>
              <div class="text-body-2">Total Value In</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="error" variant="tonal" class="me-3">
              <VIcon>mdi-arrow-up-bold</VIcon>
            </VAvatar>
            <div>
              <div class="text-h6 font-weight-bold text-error">{{ formatCurrency(data.summary?.total_value_out) }}</div>
              <div class="text-body-2">Total Value Out</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="warning" variant="tonal" class="me-3">
              <VIcon>mdi-alert</VIcon>
            </VAvatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ formatNumber(data.summary?.total_written_off + data.summary?.total_recalled) }}</div>
              <div class="text-body-2">Units Lost (Write-off + Recall)</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Charts Row -->
    <VRow class="mb-4">
      <VCol cols="12" lg="8">
        <VCard>
          <VCardTitle class="text-subtitle-1">Daily Transaction Volume</VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="dailyChartSeries?.length > 0 && dailyChartSeries[0]?.data?.length > 0"
              type="area"
              :options="dailyChartOptions"
              :series="dailyChartSeries"
              height="300"
            />
            <div v-else class="text-center py-8 text-medium-emphasis">
              No daily data available
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" lg="4">
        <VCard>
          <VCardTitle class="text-subtitle-1">Transactions by Type</VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="typeChartSeries[0]?.data?.length > 0"
              type="bar"
              :options="typeChartOptions"
              :series="typeChartSeries"
              height="280"
            />
            <div v-else class="text-center py-8 text-medium-emphasis">
              No type data available
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Top Moving Products -->
    <VCard class="mb-4" v-if="data.top_moving_drugs?.length > 0">
      <VCardTitle class="text-subtitle-1">Top Moving Products</VCardTitle>
      <VCardText>
        <VRow>
          <VCol cols="12" md="7">
            <VueApexCharts
              type="bar"
              :options="movingDrugsChartOptions"
              :series="movingDrugsChartSeries"
              height="300"
            />
          </VCol>
          <VCol cols="12" md="5">
            <VTable density="compact">
              <thead>
                <tr>
                  <th>Product</th>
                  <th class="text-right">In</th>
                  <th class="text-right">Out</th>
                  <th class="text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="drug in data.top_moving_drugs" :key="drug.drug_id">
                  <td>
                    <div class="font-weight-medium">{{ drug.drug_name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ drug.transaction_count }} txns</div>
                  </td>
                  <td class="text-right text-success">+{{ formatNumber(drug.total_in) }}</td>
                  <td class="text-right text-error">-{{ formatNumber(drug.total_out) }}</td>
                  <td class="text-right">
                    <VChip size="x-small" :color="drug.net_change >= 0 ? 'success' : 'error'">
                      {{ drug.net_change >= 0 ? '+' : '' }}{{ formatNumber(drug.net_change) }}
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Transaction Type Breakdown -->
    <VCard class="mb-4" v-if="data.by_type?.length > 0">
      <VCardTitle class="text-subtitle-1">Transaction Type Breakdown</VCardTitle>
      <VCardText>
        <VTable density="compact">
          <thead>
            <tr>
              <th>Type</th>
              <th class="text-right">Count</th>
              <th class="text-right">Units</th>
              <th class="text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="type in data.by_type" :key="type.type">
              <td>
                <VChip size="small" :color="getTypeConfig(type.type).color" variant="tonal">
                  <VIcon size="small" start>{{ getTypeConfig(type.type).icon }}</VIcon>
                  {{ getTypeConfig(type.type).label }}
                </VChip>
              </td>
              <td class="text-right">{{ formatNumber(type.count) }}</td>
              <td class="text-right">{{ formatNumber(type.units) }}</td>
              <td class="text-right">{{ formatCurrency(type.value) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="font-weight-bold">
              <td>Total</td>
              <td class="text-right">{{ formatNumber(data.by_type?.reduce((s, t) => s + t.count, 0)) }}</td>
              <td class="text-right">{{ formatNumber(data.by_type?.reduce((s, t) => s + t.units, 0)) }}</td>
              <td class="text-right">{{ formatCurrency(data.by_type?.reduce((s, t) => s + t.value, 0)) }}</td>
            </tr>
          </tfoot>
        </VTable>
      </VCardText>
    </VCard>

    <!-- Recent Transactions -->
    <VCard v-if="data.recent_transactions?.length > 0">
      <VCardTitle class="text-subtitle-1">Recent Transactions</VCardTitle>
      <VCardText>
        <VTable density="compact">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Product</th>
              <th>Batch</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Value</th>
              <th>By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="txn in data.recent_transactions" :key="txn.transaction_id">
              <td class="text-caption">{{ txn.transaction_id }}</td>
              <td>
                <VChip size="x-small" :color="getTypeConfig(txn.type).color" variant="tonal">
                  {{ getTypeConfig(txn.type).label }}
                </VChip>
              </td>
              <td>{{ txn.drug_name }}</td>
              <td class="text-caption">{{ txn.batch_number }}</td>
              <td class="text-right" :class="txn.quantity >= 0 ? 'text-success' : 'text-error'">
                {{ txn.quantity >= 0 ? '+' : '' }}{{ formatNumber(txn.quantity) }}
              </td>
              <td class="text-right">{{ formatCurrency(txn.total_value) }}</td>
              <td class="text-caption">{{ txn.performed_by }}</td>
              <td class="text-caption">{{ formatDateTime(txn.created_at) }}</td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>
  </div>

  <!-- No Data State -->
  <VCard v-else class="pa-8 text-center">
    <VIcon size="64" color="grey-lighten-1" class="mb-4">mdi-swap-horizontal</VIcon>
    <div class="text-h6 text-medium-emphasis">No Report Data</div>
    <div class="text-body-2 text-medium-emphasis">Click "Generate Report" to view transaction data</div>
  </VCard>
</template>

<style scoped>
.text-h5 {
  font-size: 1.25rem !important;
}
</style>
