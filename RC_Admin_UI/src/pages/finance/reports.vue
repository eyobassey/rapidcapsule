<script setup>
import { useFinanceStore } from '@/stores/finance'
import { exportTrialBalanceToCSV, exportReconciliationToCSV, exportRevenueReportToCSV } from '@/utils/csv-export'

const financeStore = useFinanceStore()
const loading = ref(false)
const activeTab = ref(0)

// Revenue report filters
const revenueFilters = reactive({
  start_date: '',
  end_date: '',
})

const fetchTrialBalance = async () => {
  loading.value = true
  await financeStore.fetchTrialBalance()
  loading.value = false
}

const fetchRevenueReport = async () => {
  loading.value = true
  await financeStore.fetchRevenueReport(revenueFilters)
  loading.value = false
}

const fetchReconciliation = async () => {
  loading.value = true
  await financeStore.fetchReconciliationReport()
  loading.value = false
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount || 0)
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTypeColor = (type) => {
  const colors = {
    ASSET: 'primary',
    LIABILITY: 'warning',
    EQUITY: 'info',
    REVENUE: 'success',
    EXPENSE: 'error',
  }
  return colors[type] || 'default'
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

// Chart options for revenue
const revenueChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 300,
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '60%',
    },
  },
  xaxis: {
    categories: financeStore.revenueReport?.daily?.map(d => d._id?.slice(5)) || [],
    labels: { style: { fontSize: '10px' } },
  },
  yaxis: {
    labels: {
      formatter: (val) => `₦${(val / 1000).toFixed(0)}k`,
    },
  },
  colors: ['#7367F0'],
  tooltip: {
    y: {
      formatter: (val) => formatCurrency(val),
    },
  },
}))

const revenueChartSeries = computed(() => [{
  name: 'Revenue',
  data: financeStore.revenueReport?.daily?.map(d => d.total) || [],
}])

watch(activeTab, (newTab) => {
  switch (newTab) {
    case 0:
      if (!financeStore.trialBalance) fetchTrialBalance()
      break
    case 1:
      if (!financeStore.revenueReport) fetchRevenueReport()
      break
    case 2:
      if (!financeStore.reconciliationReport) fetchReconciliation()
      break
  }
})

onMounted(() => {
  fetchTrialBalance()
})
</script>

<template>
  <div>
    <h2 class="text-h5 mb-6">
      <span style="color: #9b9b9b">Finance /</span> Reports
    </h2>

    <VCard>
      <VTabs v-model="activeTab" class="px-4 pt-2">
        <VTab>Trial Balance</VTab>
        <VTab>Revenue Report</VTab>
        <VTab>Reconciliation</VTab>
      </VTabs>

      <VWindow v-model="activeTab">
        <!-- Trial Balance -->
        <VWindowItem>
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <h3 class="text-h6">Trial Balance</h3>
                <p class="text-caption text-medium-emphasis" v-if="financeStore.trialBalance">
                  Generated: {{ formatDate(financeStore.trialBalance.generated_at) }}
                </p>
              </div>
              <div class="d-flex gap-2">
                <VBtn
                  color="secondary"
                  variant="outlined"
                  @click="exportTrialBalanceToCSV(financeStore.trialBalance)"
                  :disabled="!financeStore.trialBalance?.accounts?.length"
                >
                  <VIcon start icon="mdi-download" />
                  Export CSV
                </VBtn>
                <VBtn color="primary" variant="outlined" @click="fetchTrialBalance" :loading="loading">
                  <VIcon start icon="mdi-refresh" />
                  Refresh
                </VBtn>
              </div>
            </div>

            <div v-if="financeStore.trialBalanceLoading" class="text-center py-8">
              <VProgressCircular indeterminate color="primary" />
            </div>

            <template v-else-if="financeStore.trialBalance">
              <!-- Balance Status -->
              <VAlert
                :type="financeStore.trialBalance.totals?.is_balanced ? 'success' : 'error'"
                variant="tonal"
                class="mb-4"
              >
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <VIcon
                      :icon="financeStore.trialBalance.totals?.is_balanced ? 'mdi-check-circle' : 'mdi-alert'"
                      class="me-2"
                    />
                    {{ financeStore.trialBalance.totals?.is_balanced ? 'Trial Balance is BALANCED' : 'Trial Balance is NOT BALANCED' }}
                  </div>
                  <div class="text-right">
                    <div>Debits: {{ formatCurrency(financeStore.trialBalance.totals?.debits) }}</div>
                    <div>Credits: {{ formatCurrency(financeStore.trialBalance.totals?.credits) }}</div>
                  </div>
                </div>
              </VAlert>

              <VTable density="compact" hover>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Account Name</th>
                    <th>Type</th>
                    <th class="text-right">Debit</th>
                    <th class="text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="account in financeStore.trialBalance.accounts"
                    :key="account.code"
                  >
                    <td class="font-weight-medium text-primary">{{ account.code }}</td>
                    <td>{{ account.name }}</td>
                    <td>
                      <VChip :color="getTypeColor(account.type)" size="x-small" label>
                        {{ account.type }}
                      </VChip>
                    </td>
                    <td class="text-right text-error">
                      {{ account.debit > 0 ? formatCurrency(account.debit) : '' }}
                    </td>
                    <td class="text-right text-success">
                      {{ account.credit > 0 ? formatCurrency(account.credit) : '' }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-grey-lighten-4 font-weight-bold">
                    <td colspan="3">TOTALS</td>
                    <td class="text-right text-error">
                      {{ formatCurrency(financeStore.trialBalance.totals?.debits) }}
                    </td>
                    <td class="text-right text-success">
                      {{ formatCurrency(financeStore.trialBalance.totals?.credits) }}
                    </td>
                  </tr>
                </tfoot>
              </VTable>
            </template>
          </VCardText>
        </VWindowItem>

        <!-- Revenue Report -->
        <VWindowItem>
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <h3 class="text-h6">Revenue Report</h3>
                <p class="text-caption text-medium-emphasis" v-if="financeStore.revenueReport">
                  Period: {{ financeStore.revenueReport.period?.start }} - {{ financeStore.revenueReport.period?.end }}
                </p>
              </div>
              <VBtn
                color="secondary"
                variant="outlined"
                @click="exportRevenueReportToCSV(financeStore.revenueReport)"
                :disabled="!financeStore.revenueReport"
              >
                <VIcon start icon="mdi-download" />
                Export CSV
              </VBtn>
            </div>

            <!-- Filters -->
            <VRow class="mb-4">
              <VCol cols="12" sm="4">
                <VTextField
                  v-model="revenueFilters.start_date"
                  label="From Date"
                  type="date"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" sm="4">
                <VTextField
                  v-model="revenueFilters.end_date"
                  label="To Date"
                  type="date"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" sm="4">
                <VBtn color="primary" block @click="fetchRevenueReport" :loading="loading">
                  <VIcon start icon="mdi-refresh" />
                  Generate Report
                </VBtn>
              </VCol>
            </VRow>

            <div v-if="financeStore.revenueReportLoading" class="text-center py-8">
              <VProgressCircular indeterminate color="primary" />
            </div>

            <template v-else-if="financeStore.revenueReport">
              <!-- Total Revenue -->
              <VCard color="success" variant="tonal" class="mb-4">
                <VCardText class="text-center">
                  <p class="text-body-1 mb-2">Total Revenue</p>
                  <h2 class="text-h3 font-weight-bold">
                    {{ formatCurrency(financeStore.revenueReport.total_revenue) }}
                  </h2>
                </VCardText>
              </VCard>

              <VRow>
                <!-- Revenue Chart -->
                <VCol cols="12" md="8">
                  <VCard variant="outlined">
                    <VCardTitle>Daily Revenue</VCardTitle>
                    <VCardText>
                      <VueApexCharts
                        v-if="financeStore.revenueReport.daily?.length"
                        type="bar"
                        height="300"
                        :options="revenueChartOptions"
                        :series="revenueChartSeries"
                      />
                      <div v-else class="text-center py-8 text-medium-emphasis">
                        No data available
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>

                <!-- By Category -->
                <VCol cols="12" md="4">
                  <VCard variant="outlined">
                    <VCardTitle>By Category</VCardTitle>
                    <VList density="compact">
                      <VListItem
                        v-for="cat in financeStore.revenueReport.by_category"
                        :key="cat._id"
                      >
                        <template #prepend>
                          <VChip :color="getCategoryColor(cat._id)" size="x-small" label class="me-2">
                            {{ cat.count }}
                          </VChip>
                        </template>
                        <VListItemTitle class="text-body-2">
                          {{ cat._id?.replace(/_/g, ' ') }}
                        </VListItemTitle>
                        <template #append>
                          <span class="font-weight-medium">
                            {{ formatCurrency(cat.total) }}
                          </span>
                        </template>
                      </VListItem>
                    </VList>
                  </VCard>
                </VCol>
              </VRow>

              <!-- Revenue Accounts -->
              <VCard variant="outlined" class="mt-4">
                <VCardTitle>Revenue Accounts</VCardTitle>
                <VTable density="compact">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Account Name</th>
                      <th class="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="account in financeStore.revenueReport.revenue_accounts"
                      :key="account.code"
                    >
                      <td class="font-weight-medium text-primary">{{ account.code }}</td>
                      <td>{{ account.name }}</td>
                      <td class="text-right font-weight-bold text-success">
                        {{ formatCurrency(account.balance) }}
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </VCard>
            </template>
          </VCardText>
        </VWindowItem>

        <!-- Reconciliation -->
        <VWindowItem>
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <h3 class="text-h6">Wallet Reconciliation Report</h3>
                <p class="text-caption text-medium-emphasis" v-if="financeStore.reconciliationReport">
                  Generated: {{ formatDate(financeStore.reconciliationReport.generated_at) }}
                </p>
              </div>
              <div class="d-flex gap-2">
                <VBtn
                  color="secondary"
                  variant="outlined"
                  @click="exportReconciliationToCSV(financeStore.reconciliationReport)"
                  :disabled="!financeStore.reconciliationReport?.reconciliation?.length"
                >
                  <VIcon start icon="mdi-download" />
                  Export CSV
                </VBtn>
                <VBtn color="primary" variant="outlined" @click="fetchReconciliation" :loading="loading">
                  <VIcon start icon="mdi-refresh" />
                  Refresh
                </VBtn>
              </div>
            </div>

            <div v-if="financeStore.reconciliationLoading" class="text-center py-8">
              <VProgressCircular indeterminate color="primary" />
            </div>

            <template v-else-if="financeStore.reconciliationReport">
              <!-- Overall Status -->
              <VAlert
                :type="financeStore.reconciliationReport.is_fully_reconciled ? 'success' : 'error'"
                variant="tonal"
                class="mb-4"
              >
                <VIcon
                  :icon="financeStore.reconciliationReport.is_fully_reconciled ? 'mdi-check-circle' : 'mdi-alert'"
                  class="me-2"
                />
                {{ financeStore.reconciliationReport.is_fully_reconciled
                    ? 'All wallets are fully reconciled!'
                    : 'There are discrepancies that need attention.' }}
              </VAlert>

              <!-- Reconciliation by Owner Type -->
              <VRow>
                <VCol
                  v-for="recon in financeStore.reconciliationReport.reconciliation"
                  :key="recon.owner_type"
                  cols="12"
                  md="6"
                >
                  <VCard variant="outlined">
                    <VCardTitle class="d-flex align-center justify-space-between">
                      <span>{{ recon.owner_type }} Wallets</span>
                      <VChip :color="recon.is_reconciled ? 'success' : 'error'" size="small">
                        {{ recon.is_reconciled ? 'Reconciled' : 'Discrepancy' }}
                      </VChip>
                    </VCardTitle>
                    <VCardText>
                      <VRow>
                        <VCol cols="6">
                          <div class="text-medium-emphasis text-caption mb-1">Wallet Count</div>
                          <div class="text-h6 font-weight-bold">{{ recon.wallet_count }}</div>
                        </VCol>
                        <VCol cols="6">
                          <div class="text-medium-emphasis text-caption mb-1">Total in Wallets</div>
                          <div class="text-h6 font-weight-bold text-primary">
                            {{ formatCurrency(recon.wallet_balances?.total) }}
                          </div>
                        </VCol>
                      </VRow>

                      <VDivider class="my-4" />

                      <div class="mb-2">
                        <div class="d-flex justify-space-between text-body-2">
                          <span>Available:</span>
                          <span class="font-weight-medium text-success">
                            {{ formatCurrency(recon.wallet_balances?.available) }}
                          </span>
                        </div>
                        <div class="d-flex justify-space-between text-body-2">
                          <span>Held:</span>
                          <span class="font-weight-medium text-warning">
                            {{ formatCurrency(recon.wallet_balances?.held) }}
                          </span>
                        </div>
                        <div class="d-flex justify-space-between text-body-2">
                          <span>Pending:</span>
                          <span class="font-weight-medium text-info">
                            {{ formatCurrency(recon.wallet_balances?.pending) }}
                          </span>
                        </div>
                      </div>

                      <VDivider class="my-4" />

                      <div class="mb-2">
                        <div class="text-medium-emphasis text-caption mb-1">Liability Account</div>
                        <div class="text-body-2">
                          <span class="font-weight-medium">{{ recon.liability_account?.code }}</span>
                          - {{ recon.liability_account?.name }}
                        </div>
                        <div class="text-h6 font-weight-bold">
                          {{ formatCurrency(recon.liability_account?.balance) }}
                        </div>
                      </div>

                      <VDivider class="my-4" />

                      <div
                        class="d-flex justify-space-between align-center pa-3 rounded"
                        :class="recon.is_reconciled ? 'bg-success-lighten-5' : 'bg-error-lighten-5'"
                      >
                        <span class="font-weight-bold">Difference:</span>
                        <span
                          class="text-h6 font-weight-bold"
                          :class="recon.is_reconciled ? 'text-success' : 'text-error'"
                        >
                          {{ formatCurrency(recon.difference) }}
                        </span>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </template>
          </VCardText>
        </VWindowItem>
      </VWindow>
    </VCard>
  </div>
</template>
