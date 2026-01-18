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

// Category donut chart options
const categoryChartOptions = computed(() => ({
  chart: {
    type: 'donut',
    height: 300,
  },
  labels: props.data?.by_category?.map(c => c.category_name) || [],
  colors: ['#00E396', '#008FFB', '#FEB019', '#FF4560', '#775DD0', '#546E7A', '#26a69a', '#D10CE8'],
  legend: {
    position: 'bottom',
    fontSize: '12px',
  },
  dataLabels: {
    enabled: true,
    formatter: (val) => `${val.toFixed(1)}%`,
  },
  tooltip: {
    y: {
      formatter: (val) => formatCurrency(val),
    },
  },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total Value',
            formatter: () => formatCurrency(props.data?.summary?.total_cost_value || 0),
          },
        },
      },
    },
  },
}))

const categoryChartSeries = computed(() =>
  props.data?.by_category?.map(c => c.cost_value) || []
)

// Top products bar chart options
const productsChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 300,
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
      barHeight: '70%',
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (val) => formatCurrency(val),
    style: {
      fontSize: '10px',
    },
  },
  xaxis: {
    categories: props.data?.products?.slice(0, 10).map(p => p.drug_name) || [],
    labels: {
      formatter: (val) => formatCurrency(val),
    },
  },
  colors: ['#008FFB'],
  tooltip: {
    y: {
      formatter: (val) => formatCurrency(val),
    },
  },
}))

const productsChartSeries = computed(() => [{
  name: 'Value',
  data: props.data?.products?.slice(0, 10).map(p => p.total_cost_value) || [],
}])

// Supplier chart
const supplierChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 250,
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      borderRadius: 4,
    },
  },
  xaxis: {
    categories: props.data?.by_supplier?.slice(0, 8).map(s => s.supplier_name) || [],
    labels: {
      rotate: -45,
      style: {
        fontSize: '10px',
      },
    },
  },
  colors: ['#00E396'],
  dataLabels: {
    enabled: false,
  },
  yaxis: {
    labels: {
      formatter: (val) => formatCurrency(val),
    },
  },
  tooltip: {
    y: {
      formatter: (val) => formatCurrency(val),
    },
  },
}))

const supplierChartSeries = computed(() => [{
  name: 'Stock Value',
  data: props.data?.by_supplier?.slice(0, 8).map(s => s.cost_value) || [],
}])
</script>

<template>
  <div v-if="data" id="stock-valuation-report">
    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="12" sm="6" md="3">
        <VCard color="primary" variant="flat">
          <VCardText class="text-center">
            <div class="text-h4 font-weight-bold">{{ formatNumber(data.summary?.total_products) }}</div>
            <div class="text-body-2">Total Products</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="success" variant="flat">
          <VCardText class="text-center">
            <div class="text-h4 font-weight-bold">{{ formatNumber(data.summary?.total_stock_units) }}</div>
            <div class="text-body-2">Total Units</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="info" variant="flat">
          <VCardText class="text-center">
            <div class="text-h5 font-weight-bold">{{ formatCurrency(data.summary?.total_cost_value) }}</div>
            <div class="text-body-2">Cost Value</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="warning" variant="flat">
          <VCardText class="text-center">
            <div class="text-h5 font-weight-bold">{{ formatCurrency(data.summary?.total_retail_value) }}</div>
            <div class="text-body-2">Retail Value</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Profit Summary -->
    <VCard class="mb-4">
      <VCardText>
        <VRow align="center">
          <VCol cols="12" md="4" class="text-center">
            <div class="text-h5 font-weight-bold text-success">
              {{ formatCurrency(data.summary?.potential_profit) }}
            </div>
            <div class="text-body-2">Potential Profit</div>
          </VCol>
          <VCol cols="12" md="4" class="text-center">
            <div class="text-h5 font-weight-bold text-primary">
              {{ data.summary?.profit_margin_percent?.toFixed(1) }}%
            </div>
            <div class="text-body-2">Profit Margin</div>
          </VCol>
          <VCol cols="12" md="4" class="text-center">
            <div class="text-h5 font-weight-bold text-info">
              {{ formatNumber(data.summary?.total_batches) }}
            </div>
            <div class="text-body-2">Active Batches</div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Charts Row -->
    <VRow class="mb-4">
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle class="text-subtitle-1">Stock Value by Category</VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="categoryChartSeries.length > 0"
              type="donut"
              :options="categoryChartOptions"
              :series="categoryChartSeries"
              height="300"
            />
            <div v-else class="text-center py-8 text-medium-emphasis">
              No category data available
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle class="text-subtitle-1">Top 10 Products by Value</VCardTitle>
          <VCardText>
            <VueApexCharts
              v-if="productsChartSeries[0]?.data?.length > 0"
              type="bar"
              :options="productsChartOptions"
              :series="productsChartSeries"
              height="300"
            />
            <div v-else class="text-center py-8 text-medium-emphasis">
              No product data available
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Supplier Chart -->
    <VCard class="mb-4" v-if="data.by_supplier?.length > 0">
      <VCardTitle class="text-subtitle-1">Stock Value by Supplier</VCardTitle>
      <VCardText>
        <VueApexCharts
          type="bar"
          :options="supplierChartOptions"
          :series="supplierChartSeries"
          height="250"
        />
      </VCardText>
    </VCard>

    <!-- Category Breakdown Table -->
    <VCard class="mb-4" v-if="data.by_category?.length > 0">
      <VCardTitle class="text-subtitle-1">Category Breakdown</VCardTitle>
      <VCardText>
        <VTable density="compact">
          <thead>
            <tr>
              <th>Category</th>
              <th class="text-right">Products</th>
              <th class="text-right">Units</th>
              <th class="text-right">Cost Value</th>
              <th class="text-right">Retail Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in data.by_category" :key="cat.category_id">
              <td>{{ cat.category_name }}</td>
              <td class="text-right">{{ formatNumber(cat.product_count) }}</td>
              <td class="text-right">{{ formatNumber(cat.units) }}</td>
              <td class="text-right">{{ formatCurrency(cat.cost_value) }}</td>
              <td class="text-right">{{ formatCurrency(cat.retail_value) }}</td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>

    <!-- Products Table -->
    <VCard v-if="data.products?.length > 0">
      <VCardTitle class="text-subtitle-1">Product Details</VCardTitle>
      <VCardText>
        <VTable density="compact">
          <thead>
            <tr>
              <th>Product</th>
              <th>Code</th>
              <th>Category</th>
              <th class="text-right">Units</th>
              <th class="text-right">Avg Cost</th>
              <th class="text-right">Total Value</th>
              <th class="text-right">Margin %</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in data.products" :key="product.drug_id">
              <td>{{ product.drug_name }}</td>
              <td>{{ product.drug_code }}</td>
              <td>{{ product.category }}</td>
              <td class="text-right">{{ formatNumber(product.total_units) }}</td>
              <td class="text-right">{{ formatCurrency(product.avg_cost) }}</td>
              <td class="text-right">{{ formatCurrency(product.total_cost_value) }}</td>
              <td class="text-right">
                <VChip size="x-small" :color="product.profit_margin >= 30 ? 'success' : product.profit_margin >= 15 ? 'warning' : 'error'">
                  {{ product.profit_margin?.toFixed(1) }}%
                </VChip>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>
  </div>

  <!-- No Data State -->
  <VCard v-else class="pa-8 text-center">
    <VIcon size="64" color="grey-lighten-1" class="mb-4">mdi-chart-box-outline</VIcon>
    <div class="text-h6 text-medium-emphasis">No Report Data</div>
    <div class="text-body-2 text-medium-emphasis">Click "Generate Report" to view stock valuation data</div>
  </VCard>
</template>

<style scoped>
.text-h4 {
  font-size: 1.5rem !important;
}
.text-h5 {
  font-size: 1.25rem !important;
}
</style>
