<script setup>
import { useFinanceStore } from '@/stores/finance'

const financeStore = useFinanceStore()
const loading = ref(true)

// Chart data for transaction volume
const chartOptions = computed(() => ({
  chart: {
    type: 'area',
    height: 250,
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
    categories: financeStore.transactionVolume.map(d => d._id?.slice(5) || ''),
    labels: { style: { fontSize: '10px' } },
  },
  yaxis: {
    labels: {
      formatter: (val) => `₦${(val / 1000).toFixed(0)}k`,
    },
  },
  tooltip: {
    y: {
      formatter: (val) => `₦${val?.toLocaleString() || 0}`,
    },
  },
  colors: ['#7367F0'],
}))

const chartSeries = computed(() => [{
  name: 'Volume',
  data: financeStore.transactionVolume.map(d => d.volume || 0),
}])

const fetchData = async () => {
  loading.value = true
  await financeStore.fetchDashboardMetrics()
  loading.value = false
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount || 0)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getCategoryColor = (category) => {
  const colors = {
    WALLET_TOPUP: 'success',
    WALLET_WITHDRAWAL: 'warning',
    ADMIN_CREDIT: 'info',
    ADMIN_DEBIT: 'error',
    APPOINTMENT_PAYMENT: 'primary',
    PRESCRIPTION_PAYMENT: 'secondary',
    PHARMACY_ORDER_PAYMENT: 'primary',
    MIGRATION: 'grey',
  }
  return colors[category] || 'default'
}

const getStatusColor = (status) => {
  const colors = {
    POSTED: 'success',
    PENDING: 'warning',
    FAILED: 'error',
    REVERSED: 'grey',
  }
  return colors[status] || 'default'
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div>
    <h2 class="text-h5 mb-6">
      <span style="color: #9b9b9b">Finance /</span> Dashboard
    </h2>

    <VRow v-if="loading">
      <VCol cols="12" class="text-center py-16">
        <VProgressCircular indeterminate color="primary" size="48" />
        <p class="mt-4 text-medium-emphasis">Loading financial data...</p>
      </VCol>
    </VRow>

    <template v-else>
      <!-- Summary Cards -->
      <VRow class="mb-6">
        <VCol cols="12" sm="6" md="3">
          <VCard class="pa-4">
            <div class="d-flex align-center">
              <VAvatar color="primary" variant="tonal" size="48" class="me-4">
                <VIcon icon="mdi-wallet" size="24" />
              </VAvatar>
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Total Balance</p>
                <h3 class="text-h5 font-weight-bold">{{ formatCurrency(financeStore.totalBalance) }}</h3>
              </div>
            </div>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="pa-4">
            <div class="d-flex align-center">
              <VAvatar color="success" variant="tonal" size="48" class="me-4">
                <VIcon icon="mdi-account-group" size="24" />
              </VAvatar>
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Patient Wallets</p>
                <h3 class="text-h5 font-weight-bold">
                  {{ financeStore.walletsByType?.PATIENT?.count || 0 }}
                </h3>
                <p class="text-caption text-success">
                  {{ formatCurrency(financeStore.walletsByType?.PATIENT?.balance || 0) }}
                </p>
              </div>
            </div>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="pa-4">
            <div class="d-flex align-center">
              <VAvatar color="info" variant="tonal" size="48" class="me-4">
                <VIcon icon="mdi-doctor" size="24" />
              </VAvatar>
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Specialist Wallets</p>
                <h3 class="text-h5 font-weight-bold">
                  {{ financeStore.walletsByType?.SPECIALIST?.count || 0 }}
                </h3>
                <p class="text-caption text-info">
                  {{ formatCurrency(financeStore.walletsByType?.SPECIALIST?.balance || 0) }}
                </p>
              </div>
            </div>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="pa-4">
            <div class="d-flex align-center">
              <VAvatar color="warning" variant="tonal" size="48" class="me-4">
                <VIcon icon="mdi-chart-line" size="24" />
              </VAvatar>
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Total Wallets</p>
                <h3 class="text-h5 font-weight-bold">
                  {{ financeStore.dashboardMetrics?.summary?.total_wallets || 0 }}
                </h3>
              </div>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Charts and Recent Transactions -->
      <VRow>
        <!-- Transaction Volume Chart -->
        <VCol cols="12" md="8">
          <VCard>
            <VCardTitle class="d-flex align-center justify-space-between">
              <span>Transaction Volume (30 Days)</span>
              <VBtn
                variant="text"
                color="primary"
                size="small"
                :to="{ name: 'finance-transactions' }"
              >
                View All
              </VBtn>
            </VCardTitle>
            <VCardText>
              <VueApexCharts
                v-if="financeStore.transactionVolume.length > 0"
                type="area"
                height="250"
                :options="chartOptions"
                :series="chartSeries"
              />
              <div v-else class="text-center py-8 text-medium-emphasis">
                No transaction data available
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Transaction Categories -->
        <VCol cols="12" md="4">
          <VCard>
            <VCardTitle>By Category</VCardTitle>
            <VCardText>
              <VList density="compact">
                <VListItem
                  v-for="cat in financeStore.dashboardMetrics?.transactions?.by_category || []"
                  :key="cat._id"
                >
                  <template #prepend>
                    <VChip
                      :color="getCategoryColor(cat._id)"
                      size="x-small"
                      label
                    >
                      {{ cat.count }}
                    </VChip>
                  </template>
                  <VListItemTitle class="text-body-2">
                    {{ cat._id?.replace(/_/g, ' ') }}
                  </VListItemTitle>
                  <template #append>
                    <span class="text-body-2 font-weight-medium">
                      {{ formatCurrency(cat.total) }}
                    </span>
                  </template>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Recent Transactions and Account Balances -->
      <VRow class="mt-4">
        <!-- Recent Transactions -->
        <VCol cols="12" md="7">
          <VCard>
            <VCardTitle class="d-flex align-center justify-space-between">
              <span>Recent Transactions</span>
              <VBtn
                variant="text"
                color="primary"
                size="small"
                :to="{ name: 'finance-transactions' }"
              >
                View All
              </VBtn>
            </VCardTitle>
            <VTable density="compact" hover>
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="txn in financeStore.recentTransactions"
                  :key="txn.batch_id"
                >
                  <td>
                    <RouterLink
                      :to="{ name: 'finance-transactions-id', params: { id: txn.batch_id } }"
                      class="text-primary text-decoration-none"
                    >
                      {{ txn.batch_id }}
                    </RouterLink>
                  </td>
                  <td>
                    <VChip
                      :color="getCategoryColor(txn.category)"
                      size="x-small"
                      label
                    >
                      {{ txn.category?.replace(/_/g, ' ') }}
                    </VChip>
                  </td>
                  <td class="font-weight-medium">
                    {{ formatCurrency(txn.total_debits) }}
                  </td>
                  <td>
                    <VChip
                      :color="getStatusColor(txn.status)"
                      size="x-small"
                    >
                      {{ txn.status }}
                    </VChip>
                  </td>
                  <td class="text-medium-emphasis text-caption">
                    {{ formatDate(txn.created_at) }}
                  </td>
                </tr>
                <tr v-if="!financeStore.recentTransactions.length">
                  <td colspan="5" class="text-center text-medium-emphasis py-4">
                    No recent transactions
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCard>
        </VCol>

        <!-- Account Balances -->
        <VCol cols="12" md="5">
          <VCard>
            <VCardTitle class="d-flex align-center justify-space-between">
              <span>Account Balances</span>
              <VBtn
                variant="text"
                color="primary"
                size="small"
                :to="{ name: 'finance-accounts' }"
              >
                View All
              </VBtn>
            </VCardTitle>
            <VCardText class="pa-0">
              <VList density="compact">
                <VListItem
                  v-for="account in financeStore.accountBalances.slice(0, 10)"
                  :key="account.code"
                >
                  <VListItemTitle class="text-body-2">
                    <span class="text-medium-emphasis me-2">{{ account.code }}</span>
                    {{ account.name }}
                  </VListItemTitle>
                  <template #append>
                    <span
                      class="text-body-2 font-weight-medium"
                      :class="{
                        'text-success': account.current_balance > 0,
                        'text-error': account.current_balance < 0,
                      }"
                    >
                      {{ formatCurrency(account.current_balance) }}
                    </span>
                  </template>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Quick Actions -->
      <VRow class="mt-4">
        <VCol cols="12">
          <VCard>
            <VCardTitle>Quick Actions</VCardTitle>
            <VCardText>
              <VRow>
                <VCol cols="6" sm="4" md="2">
                  <VBtn
                    block
                    variant="tonal"
                    color="primary"
                    :to="{ name: 'finance-wallets' }"
                  >
                    <VIcon start icon="mdi-wallet" />
                    Wallets
                  </VBtn>
                </VCol>
                <VCol cols="6" sm="4" md="2">
                  <VBtn
                    block
                    variant="tonal"
                    color="success"
                    :to="{ name: 'finance-transactions' }"
                  >
                    <VIcon start icon="mdi-swap-horizontal" />
                    Transactions
                  </VBtn>
                </VCol>
                <VCol cols="6" sm="4" md="2">
                  <VBtn
                    block
                    variant="tonal"
                    color="info"
                    :to="{ name: 'finance-ledger' }"
                  >
                    <VIcon start icon="mdi-book-open-page-variant" />
                    Ledger
                  </VBtn>
                </VCol>
                <VCol cols="6" sm="4" md="2">
                  <VBtn
                    block
                    variant="tonal"
                    color="warning"
                    :to="{ name: 'finance-accounts' }"
                  >
                    <VIcon start icon="mdi-file-tree" />
                    Accounts
                  </VBtn>
                </VCol>
                <VCol cols="6" sm="4" md="2">
                  <VBtn
                    block
                    variant="tonal"
                    color="secondary"
                    :to="{ name: 'finance-reports' }"
                  >
                    <VIcon start icon="mdi-chart-box" />
                    Reports
                  </VBtn>
                </VCol>
                <VCol cols="6" sm="4" md="2">
                  <VBtn
                    block
                    variant="outlined"
                    @click="fetchData"
                  >
                    <VIcon start icon="mdi-refresh" />
                    Refresh
                  </VBtn>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>
  </div>
</template>
