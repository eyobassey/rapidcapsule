<template>
  <div>
    <!-- Back Button -->
    <VBtn variant="text" color="primary" class="mb-4" @click="$router.back()">
      <VIcon start>mdi-arrow-left</VIcon>
      Back
    </VBtn>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 400px;">
      <VProgressCircular indeterminate color="primary" size="64" />
    </div>

    <!-- Error State -->
    <VAlert v-else-if="error" type="error" class="mb-6">
      {{ error }}
      <template #append>
        <VBtn variant="text" @click="fetchPerformanceData">Retry</VBtn>
      </template>
    </VAlert>

    <template v-else-if="data">
      <!-- Header Section -->
      <VRow class="mb-6">
        <VCol cols="12">
          <VCard>
            <VCardText>
              <div class="d-flex justify-space-between align-center flex-wrap gap-4">
                <div class="d-flex align-center">
                  <VAvatar color="primary" variant="tonal" size="56" class="me-4">
                    <VIcon size="28">mdi-chart-box</VIcon>
                  </VAvatar>
                  <div>
                    <h1 class="text-h4 font-weight-bold">{{ data.pharmacy?.name }}</h1>
                    <p class="text-subtitle-1 text-medium-emphasis mb-0">Performance Report</p>
                  </div>
                </div>
                <div class="d-flex align-center gap-3">
                  <VSelect
                    v-model="period"
                    :items="periodOptions"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    style="width: 180px;"
                    @update:model-value="fetchPerformanceData"
                  />
                  <VBtn color="primary" variant="outlined" @click="exportReport">
                    <VIcon start>mdi-download</VIcon>
                    Export
                  </VBtn>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- KPI Cards -->
      <VRow class="mb-6">
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar color="primary" variant="tonal" size="48" class="me-4">
                <VIcon>mdi-package-variant</VIcon>
              </VAvatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ data.overview?.totalOrders?.current || 0 }}</div>
                <div class="text-body-2 text-medium-emphasis">Total Orders</div>
                <TrendIndicator :value="data.overview?.totalOrders?.trend" />
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar color="success" variant="tonal" size="48" class="me-4">
                <VIcon>mdi-cash-multiple</VIcon>
              </VAvatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ formatPrice(data.overview?.totalRevenue?.current || 0) }}</div>
                <div class="text-body-2 text-medium-emphasis">Total Revenue</div>
                <TrendIndicator :value="data.overview?.totalRevenue?.trend" />
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar color="warning" variant="tonal" size="48" class="me-4">
                <VIcon>mdi-star</VIcon>
              </VAvatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ (data.overview?.averageRating || 0).toFixed(1) }}</div>
                <div class="text-body-2 text-medium-emphasis">Average Rating</div>
                <TrendIndicator :value="data.overview?.ratingTrend" />
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar color="info" variant="tonal" size="48" class="me-4">
                <VIcon>mdi-clock-check</VIcon>
              </VAvatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ data.delivery?.onTimeDeliveryRate || 0 }}%</div>
                <div class="text-body-2 text-medium-emphasis">On-Time Delivery</div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Charts Row 1 -->
      <VRow class="mb-6">
        <!-- Order Volume Trend -->
        <VCol cols="12" md="8">
          <VCard>
            <VCardTitle class="d-flex justify-space-between align-center">
              <span>Order Volume Trend</span>
              <VChip size="small" color="primary" variant="tonal">
                {{ formatPrice(data.orderAnalytics?.totalRevenue || 0) }} Total
              </VChip>
            </VCardTitle>
            <VCardText>
              <VueApexCharts
                type="area"
                height="350"
                :options="orderVolumeChartOptions"
                :series="orderVolumeSeries"
              />
            </VCardText>
          </VCard>
        </VCol>

        <!-- Order Status Distribution -->
        <VCol cols="12" md="4">
          <VCard>
            <VCardTitle>Order Status Distribution</VCardTitle>
            <VCardText>
              <VueApexCharts
                type="donut"
                height="350"
                :options="orderStatusChartOptions"
                :series="orderStatusSeries"
              />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Charts Row 2 -->
      <VRow class="mb-6">
        <!-- Revenue Trend -->
        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle>Revenue Trend</VCardTitle>
            <VCardText>
              <VueApexCharts
                type="bar"
                height="320"
                :options="revenueChartOptions"
                :series="revenueSeries"
              />
            </VCardText>
          </VCard>
        </VCol>

        <!-- Top Products -->
        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle>Top Selling Products</VCardTitle>
            <VCardText>
              <VueApexCharts
                type="bar"
                height="320"
                :options="topProductsChartOptions"
                :series="topProductsSeries"
              />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Charts Row 3 -->
      <VRow class="mb-6">
        <!-- Rating Distribution -->
        <VCol cols="12" md="4">
          <VCard>
            <VCardTitle>Rating Distribution</VCardTitle>
            <VCardText>
              <VueApexCharts
                type="bar"
                height="280"
                :options="ratingDistributionChartOptions"
                :series="ratingDistributionSeries"
              />
              <div class="d-flex justify-center align-center mt-4">
                <VIcon color="warning" size="32">mdi-star</VIcon>
                <span class="text-h3 font-weight-bold mx-2">{{ (data.customerSatisfaction?.averageRating || 0).toFixed(1) }}</span>
                <span class="text-medium-emphasis">({{ data.customerSatisfaction?.totalRatings || 0 }} reviews)</span>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Delivery Performance -->
        <VCol cols="12" md="4">
          <VCard>
            <VCardTitle>Delivery Performance</VCardTitle>
            <VCardText>
              <VueApexCharts
                type="radialBar"
                height="280"
                :options="deliveryPerformanceChartOptions"
                :series="deliveryPerformanceSeries"
              />
              <VList density="compact" class="mt-2">
                <VListItem>
                  <VListItemTitle class="d-flex justify-space-between">
                    <span>Avg. Fulfillment Time</span>
                    <strong>{{ formatHours(data.delivery?.avgFulfillmentTimeHours) }}</strong>
                  </VListItemTitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle class="d-flex justify-space-between">
                    <span>Total Delivered</span>
                    <strong>{{ data.delivery?.totalDelivered || 0 }}</strong>
                  </VListItemTitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle class="d-flex justify-space-between">
                    <span>On-Time Rate</span>
                    <strong>{{ data.delivery?.onTimeDeliveryRate || 0 }}%</strong>
                  </VListItemTitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Order Type Distribution -->
        <VCol cols="12" md="4">
          <VCard>
            <VCardTitle>Order Types</VCardTitle>
            <VCardText>
              <VueApexCharts
                type="pie"
                height="280"
                :options="orderTypeChartOptions"
                :series="orderTypeSeries"
              />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Benchmark Comparison -->
      <VRow class="mb-6">
        <VCol cols="12">
          <VCard>
            <VCardTitle>
              <VIcon start>mdi-chart-timeline-variant</VIcon>
              Platform Benchmark Comparison
            </VCardTitle>
            <VCardText>
              <VRow>
                <VCol cols="12" sm="6" md="3">
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold">{{ data.benchmarks?.pharmacy?.completionRate || 0 }}%</div>
                    <div class="text-body-2 text-medium-emphasis mb-2">Order Completion Rate</div>
                    <VProgressLinear
                      :model-value="data.benchmarks?.pharmacy?.completionRate || 0"
                      color="primary"
                      height="8"
                      rounded
                    />
                    <div class="text-caption text-medium-emphasis mt-1">
                      Platform Avg: {{ data.benchmarks?.platformAverage?.completionRate || 0 }}%
                    </div>
                  </div>
                </VCol>
                <VCol cols="12" sm="6" md="3">
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold">{{ (data.benchmarks?.pharmacy?.avgRating || 0).toFixed(1) }}</div>
                    <div class="text-body-2 text-medium-emphasis mb-2">Average Rating</div>
                    <VProgressLinear
                      :model-value="((data.benchmarks?.pharmacy?.avgRating || 0) / 5) * 100"
                      color="warning"
                      height="8"
                      rounded
                    />
                    <div class="text-caption text-medium-emphasis mt-1">
                      Platform Avg: {{ (data.benchmarks?.platformAverage?.avgRating || 0).toFixed(1) }}
                    </div>
                  </div>
                </VCol>
                <VCol cols="12" sm="6" md="3">
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold">{{ formatPrice(data.benchmarks?.pharmacy?.avgOrderValue || 0) }}</div>
                    <div class="text-body-2 text-medium-emphasis mb-2">Avg. Order Value</div>
                    <VProgressLinear
                      :model-value="calculateOrderValueScore(data.benchmarks?.pharmacy?.avgOrderValue, data.benchmarks?.platformAverage?.avgOrderValue)"
                      color="success"
                      height="8"
                      rounded
                    />
                    <div class="text-caption text-medium-emphasis mt-1">
                      Platform Avg: {{ formatPrice(data.benchmarks?.platformAverage?.avgOrderValue || 0) }}
                    </div>
                  </div>
                </VCol>
                <VCol cols="12" sm="6" md="3">
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold">#{{ data.benchmarks?.ranking?.byRevenue || '-' }}</div>
                    <div class="text-body-2 text-medium-emphasis mb-2">Revenue Ranking</div>
                    <div class="d-flex justify-center gap-2 mt-2">
                      <VChip size="small" color="primary" variant="tonal">
                        Orders: #{{ data.benchmarks?.ranking?.byOrders || '-' }}
                      </VChip>
                      <VChip size="small" color="info" variant="tonal">
                        of {{ data.benchmarks?.ranking?.totalPharmacies || 0 }}
                      </VChip>
                    </div>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Recent Reviews -->
      <VRow class="mb-6">
        <VCol cols="12">
          <VCard>
            <VCardTitle class="d-flex justify-space-between align-center">
              <span>Recent Reviews</span>
              <VBtn size="small" variant="text" color="primary" :to="{ name: 'pharmacy-ratings' }">
                View All
              </VBtn>
            </VCardTitle>
            <VCardText>
              <VTable v-if="data.customerSatisfaction?.recentReviews?.length">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Order</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="review in data.customerSatisfaction.recentReviews" :key="review._id">
                    <td>
                      <div class="d-flex align-center">
                        <VAvatar size="32" color="primary" variant="tonal" class="me-2">
                          {{ getInitials(review.patient) }}
                        </VAvatar>
                        <div>
                          <div class="font-weight-medium">
                            {{ review.patient?.profile?.first_name }} {{ review.patient?.profile?.last_name }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex align-center">
                        <VRating
                          :model-value="review.pharmacy_rating"
                          density="compact"
                          size="small"
                          readonly
                          color="warning"
                        />
                        <span class="ms-2 text-body-2">({{ review.pharmacy_rating }})</span>
                      </div>
                    </td>
                    <td>
                      <div class="text-body-2" style="max-width: 300px;">
                        {{ review.pharmacy_review || '-' }}
                      </div>
                    </td>
                    <td>
                      <VChip size="x-small" color="primary" variant="tonal">
                        {{ review.order_number }}
                      </VChip>
                    </td>
                    <td class="text-caption">{{ formatDate(review.rated_at) }}</td>
                  </tr>
                </tbody>
              </VTable>
              <VAlert v-else type="info" variant="tonal">
                No reviews yet
              </VAlert>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Inventory Health (if available) -->
      <VRow v-if="data.inventoryHealth" class="mb-6">
        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle>
              <VIcon start color="warning">mdi-package-variant</VIcon>
              Inventory Health
            </VCardTitle>
            <VCardText>
              <VRow>
                <VCol cols="6">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-primary">{{ data.inventoryHealth?.totalActiveItems || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">Active Items</div>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-warning">{{ data.inventoryHealth?.lowStockCount || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">Low Stock Items</div>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-error">{{ data.inventoryHealth?.outOfStockCount || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">Out of Stock</div>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-orange">{{ data.inventoryHealth?.expiringSoonCount || 0 }}</div>
                    <div class="text-caption text-medium-emphasis">Expiring Soon</div>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle>
              <VIcon start color="success">mdi-currency-ngn</VIcon>
              Stock Value
            </VCardTitle>
            <VCardText>
              <div class="text-center mb-4">
                <div class="text-h3 font-weight-bold text-success">{{ formatPrice(data.inventoryHealth?.stockValue || 0) }}</div>
                <div class="text-body-2 text-medium-emphasis">Total Inventory Value</div>
              </div>
              <VProgressLinear
                :model-value="calculateStockHealthScore(data.inventoryHealth)"
                color="success"
                height="12"
                rounded
              />
              <div class="text-center text-caption text-medium-emphasis mt-2">
                Stock Health Score: {{ calculateStockHealthScore(data.inventoryHealth) }}%
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import VueApexCharts from 'vue3-apexcharts'

const route = useRoute()
const pharmacyId = computed(() => route.params.id)

// State
const loading = ref(true)
const error = ref(null)
const data = ref(null)
const period = ref('30d')

// Period options
const periodOptions = [
  { title: 'Last 7 Days', value: '7d' },
  { title: 'Last 30 Days', value: '30d' },
  { title: 'Last 90 Days', value: '90d' },
  { title: 'Last 6 Months', value: '6m' },
  { title: 'Last Year', value: '1y' },
  { title: 'All Time', value: 'all' },
]

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
})

// API Base URL
const API_BASE = '/admin-api/pharmacy'

// Auth Headers
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.access_token}`,
  }
}

// Fetch Performance Data
const fetchPerformanceData = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await fetch(
      `${API_BASE}/${pharmacyId.value}/performance?period=${period.value}`,
      { headers: getAuthHeaders() }
    )
    const result = await response.json()

    if (response.ok && result.data) {
      data.value = result.data
    } else {
      error.value = result.message || 'Failed to load performance data'
    }
  } catch (err) {
    error.value = 'Failed to load performance data'
    console.error('Performance fetch error:', err)
  } finally {
    loading.value = false
  }
}

// Chart Data Computations

// Order Volume Chart
const orderVolumeChartOptions = computed(() => {
  const timeSeries = data.value?.orderAnalytics?.timeSeries
  const categories = Array.isArray(timeSeries) ? timeSeries.map(d => formatChartDate(d.date)) : []
  return {
    chart: {
      type: 'area',
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    colors: ['#6366f1', '#22c55e'],
    xaxis: {
      categories,
      labels: { style: { fontSize: '11px' } },
    },
    yaxis: [
      { title: { text: 'Orders' }, labels: { style: { fontSize: '11px' } } },
      { opposite: true, title: { text: 'Revenue (NGN)' }, labels: {
        style: { fontSize: '11px' },
        formatter: (val) => formatCompactPrice(val),
      }},
    ],
    legend: { position: 'top' },
    tooltip: {
      y: {
        formatter: (val, { seriesIndex }) => {
          if (seriesIndex === 0) return `${val} orders`
          return formatPrice(val)
        },
      },
    },
  }
})

const orderVolumeSeries = computed(() => {
  const timeSeries = data.value?.orderAnalytics?.timeSeries
  return [
    {
      name: 'Orders',
      data: Array.isArray(timeSeries) ? timeSeries.map(d => d.count) : [],
    },
    {
      name: 'Revenue',
      data: Array.isArray(timeSeries) ? timeSeries.map(d => d.revenue) : [],
    },
  ]
})

// Order Status Chart
const orderStatusChartOptions = computed(() => {
  const statusDist = data.value?.orderAnalytics?.statusDistribution
  const labels = Array.isArray(statusDist) ? statusDist.map(d => formatStatus(d._id)) : []
  return {
    chart: { type: 'donut' },
    labels,
    colors: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#6b7280', '#8b5cf6'],
    legend: { position: 'bottom' },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => data.value?.overview?.totalOrders?.current || 0,
            },
          },
        },
      },
    },
  }
})

const orderStatusSeries = computed(() => {
  const statusDist = data.value?.orderAnalytics?.statusDistribution
  return Array.isArray(statusDist) ? statusDist.map(d => d.count) : []
})

// Revenue Chart
const revenueChartOptions = computed(() => {
  const revByPeriod = data.value?.financialMetrics?.revenueByPeriod
  const categories = Array.isArray(revByPeriod) ? revByPeriod.map(d => formatChartDate(d.date)) : []
  return {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: '60%' },
    },
    dataLabels: { enabled: false },
    colors: ['#22c55e'],
    xaxis: {
      categories,
      labels: { style: { fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px' },
        formatter: (val) => formatCompactPrice(val),
      },
    },
    tooltip: {
      y: { formatter: (val) => formatPrice(val) },
    },
  }
})

const revenueSeries = computed(() => {
  const revByPeriod = data.value?.financialMetrics?.revenueByPeriod
  return [{
    name: 'Revenue',
    data: Array.isArray(revByPeriod) ? revByPeriod.map(d => d.revenue) : [],
  }]
})

// Top Products Chart
const topProductsChartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false } },
  plotOptions: {
    bar: { horizontal: true, borderRadius: 4, barHeight: '70%' },
  },
  dataLabels: { enabled: false },
  colors: ['#6366f1'],
  xaxis: {
    labels: {
      style: { fontSize: '11px' },
      formatter: (val) => formatCompactPrice(val),
    },
  },
  yaxis: {
    labels: { style: { fontSize: '11px' } },
  },
  tooltip: {
    y: { formatter: (val) => formatPrice(val) },
  },
}))

const topProductsSeries = computed(() => {
  const topProducts = data.value?.financialMetrics?.topProducts
  return [{
    name: 'Revenue',
    data: Array.isArray(topProducts) ? topProducts.map(p => ({
      x: truncateText(p.drug_name || p._id, 20),
      y: p.revenue,
    })) : [],
  }]
})

// Rating Distribution Chart
const ratingDistributionChartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false } },
  plotOptions: {
    bar: { horizontal: true, borderRadius: 4, barHeight: '60%' },
  },
  dataLabels: { enabled: true },
  colors: ['#f59e0b'],
  xaxis: {
    categories: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
    labels: { style: { fontSize: '11px' } },
  },
  yaxis: {
    labels: { style: { fontSize: '12px' } },
  },
}))

const ratingDistributionSeries = computed(() => {
  const dist = data.value?.customerSatisfaction?.ratingDistribution
  const counts = [0, 0, 0, 0, 0]
  if (Array.isArray(dist)) {
    dist.forEach(d => {
      if (d._id >= 1 && d._id <= 5) {
        counts[5 - d._id] = d.count
      }
    })
  }
  return [{ name: 'Reviews', data: counts }]
})

// Delivery Performance Chart
const deliveryPerformanceChartOptions = computed(() => ({
  chart: { type: 'radialBar' },
  plotOptions: {
    radialBar: {
      hollow: { size: '60%' },
      dataLabels: {
        name: { fontSize: '14px', offsetY: -5 },
        value: {
          fontSize: '24px',
          fontWeight: 'bold',
          formatter: (val) => `${val}%`,
        },
      },
    },
  },
  colors: ['#22c55e'],
  labels: ['On-Time Rate'],
}))

const deliveryPerformanceSeries = computed(() =>
  [Math.round(data.value?.delivery?.onTimeDeliveryRate || 0)]
)

// Order Type Chart
const orderTypeChartOptions = computed(() => {
  const typeDist = data.value?.orderAnalytics?.orderTypeDistribution
  const labels = Array.isArray(typeDist) ? typeDist.map(d => formatOrderType(d._id)) : []
  return {
    chart: { type: 'pie' },
    labels,
    colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
    legend: { position: 'bottom' },
  }
})

const orderTypeSeries = computed(() => {
  const typeDist = data.value?.orderAnalytics?.orderTypeDistribution
  return Array.isArray(typeDist) ? typeDist.map(d => d.count) : []
})

// Helper Functions
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price || 0)
}

const formatCompactPrice = (price) => {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`
  if (price >= 1000) return `${(price / 1000).toFixed(0)}K`
  return price.toString()
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatChartDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
  })
}

const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '-'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours < 24) return `${hours}h ${mins}m`
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return `${days}d ${remainingHours}h`
}

const formatHours = (hours) => {
  if (!hours && hours !== 0) return '-'
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours < 24) return `${hours.toFixed(1)}h`
  const days = Math.floor(hours / 24)
  const remainingHours = (hours % 24).toFixed(0)
  return `${days}d ${remainingHours}h`
}

const formatStatus = (status) => {
  const labels = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    READY_FOR_PICKUP: 'Ready for Pickup',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  }
  return labels[status] || status
}

const formatOrderType = (type) => {
  const labels = {
    DELIVERY: 'Delivery',
    PICKUP: 'Pickup',
    PRESCRIPTION: 'Prescription',
    OTC: 'Over the Counter',
    SPECIALIST: 'Specialist',
  }
  return labels[type] || type || 'Standard'
}

const getInitials = (patient) => {
  if (!patient?.profile) return '?'
  const first = patient.profile.first_name?.[0] || ''
  const last = patient.profile.last_name?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const calculateFulfillmentScore = (minutes) => {
  if (!minutes) return 100
  // Assuming 24 hours (1440 min) is 0%, and 0 minutes is 100%
  const score = Math.max(0, 100 - (minutes / 1440) * 100)
  return Math.round(score)
}

const calculateStockHealthScore = (inventory) => {
  if (!inventory?.totalActiveItems) return 100
  const total = inventory.totalActiveItems
  const problematic = (inventory.lowStockCount || 0) + (inventory.outOfStockCount || 0) + (inventory.expiringSoonCount || 0)
  return Math.max(0, Math.round(((total - problematic) / total) * 100))
}

const calculateOrderValueScore = (pharmacyValue, platformValue) => {
  if (!pharmacyValue || !platformValue) return 50
  // Score based on how much higher/lower pharmacy is vs platform
  const ratio = pharmacyValue / platformValue
  return Math.min(100, Math.round(ratio * 50))
}

const exportReport = () => {
  showSnackbar('Export feature coming soon', 'info')
}

const showSnackbar = (message, color = 'success') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

// Trend Indicator Component
const TrendIndicator = {
  props: ['value'],
  template: `
    <div v-if="value !== undefined && value !== null" class="d-flex align-center mt-1">
      <VIcon :color="value >= 0 ? 'success' : 'error'" size="16">
        {{ value >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
      </VIcon>
      <span :class="['text-caption', 'ms-1', value >= 0 ? 'text-success' : 'text-error']">
        {{ Math.abs(value).toFixed(1) }}%
      </span>
    </div>
  `,
}

// Initialize
onMounted(() => {
  fetchPerformanceData()
})
</script>

<style scoped>
.clickable-row {
  cursor: pointer;
}
.clickable-row:hover {
  opacity: 0.8;
}
</style>
