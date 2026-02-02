<script setup>
import { useFinanceStore } from '@/stores/finance'
import { exportTransactionsToCSV } from '@/utils/csv-export'

const financeStore = useFinanceStore()
const loading = ref(true)

const filters = reactive({
  page: 1,
  limit: 20,
  category: '',
  status: '',
  start_date: '',
  end_date: '',
  search: '',
})

const categories = [
  { title: 'All Categories', value: '' },
  { title: 'Wallet Top-up', value: 'WALLET_TOPUP' },
  { title: 'Wallet Withdrawal', value: 'WALLET_WITHDRAWAL' },
  { title: 'Wallet Transfer', value: 'WALLET_TRANSFER' },
  { title: 'Admin Credit', value: 'ADMIN_CREDIT' },
  { title: 'Admin Debit', value: 'ADMIN_DEBIT' },
  { title: 'Appointment Payment', value: 'APPOINTMENT_PAYMENT' },
  { title: 'Prescription Payment', value: 'PRESCRIPTION_PAYMENT' },
  { title: 'Pharmacy Order Payment', value: 'PHARMACY_ORDER_PAYMENT' },
  { title: 'Subscription Payment', value: 'SUBSCRIPTION_PAYMENT' },
  { title: 'AI Summary Purchase', value: 'AI_SUMMARY_PURCHASE' },
  { title: 'Specialist Hold', value: 'SPECIALIST_HOLD' },
  { title: 'Specialist Release', value: 'SPECIALIST_RELEASE' },
  { title: 'Refund', value: 'REFUND' },
  { title: 'Migration', value: 'MIGRATION' },
]

const statuses = [
  { title: 'All Statuses', value: '' },
  { title: 'Posted', value: 'POSTED' },
  { title: 'Pending', value: 'PENDING' },
  { title: 'Failed', value: 'FAILED' },
  { title: 'Reversed', value: 'REVERSED' },
]

const fetchTransactions = async () => {
  loading.value = true
  await financeStore.fetchTransactions(filters)
  loading.value = false
}

const applyFilters = () => {
  filters.page = 1
  fetchTransactions()
}

const changePage = (page) => {
  filters.page = page
  fetchTransactions()
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

const getUserName = (user) => {
  if (!user) return 'N/A'
  const profile = user.profile || {}
  return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email || 'Unknown'
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
    REFUND: 'error',
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
  fetchTransactions()
})
</script>

<template>
  <div>
    <h2 class="text-h5 mb-6">
      <span style="color: #9b9b9b">Finance /</span> Transactions
    </h2>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow align="center">
          <VCol cols="12" sm="6" md="2">
            <VTextField
              v-model="filters.search"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              clearable
              @keyup.enter="applyFilters"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <VSelect
              v-model="filters.category"
              :items="categories"
              label="Category"
              density="compact"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <VSelect
              v-model="filters.status"
              :items="statuses"
              label="Status"
              density="compact"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <VTextField
              v-model="filters.start_date"
              label="From Date"
              type="date"
              density="compact"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <VTextField
              v-model="filters.end_date"
              label="To Date"
              type="date"
              density="compact"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <VBtn color="primary" block @click="applyFilters">
              <VIcon start icon="mdi-filter" />
              Filter
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Transactions Table -->
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>Transactions ({{ financeStore.transactionsTotal }})</span>
        <div class="d-flex align-center gap-2">
          <VBtn
            variant="outlined"
            color="secondary"
            size="small"
            @click="exportTransactionsToCSV(financeStore.transactions)"
            :disabled="!financeStore.transactions.length"
          >
            <VIcon start icon="mdi-download" size="small" />
            Export CSV
          </VBtn>
          <VBtn variant="text" color="primary" size="small" @click="fetchTransactions">
            <VIcon icon="mdi-refresh" />
          </VBtn>
        </div>
      </VCardTitle>

      <VTable v-if="!loading" density="comfortable" hover>
        <thead>
          <tr>
            <th>Batch ID</th>
            <th>Category</th>
            <th>Description</th>
            <th>From</th>
            <th>To</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="txn in financeStore.transactions" :key="txn.batch_id">
            <td>
              <RouterLink
                :to="{ name: 'finance-transactions-id', params: { id: txn.batch_id } }"
                class="text-primary text-decoration-none font-weight-medium"
              >
                {{ txn.batch_id }}
              </RouterLink>
            </td>
            <td>
              <VChip :color="getCategoryColor(txn.category)" size="x-small" label>
                {{ txn.category?.replace(/_/g, ' ') }}
              </VChip>
            </td>
            <td class="text-truncate" style="max-width: 200px">
              {{ txn.description }}
            </td>
            <td>
              <span v-if="txn.from_user" class="text-caption">
                {{ getUserName(txn.from_user) }}
              </span>
              <span v-else class="text-medium-emphasis">-</span>
            </td>
            <td>
              <span v-if="txn.to_user" class="text-caption">
                {{ getUserName(txn.to_user) }}
              </span>
              <span v-else class="text-medium-emphasis">-</span>
            </td>
            <td class="font-weight-bold">
              {{ formatCurrency(txn.total_debits) }}
            </td>
            <td>
              <VChip :color="getStatusColor(txn.status)" size="x-small">
                {{ txn.status }}
              </VChip>
            </td>
            <td class="text-caption text-medium-emphasis">
              {{ formatDate(txn.created_at) }}
            </td>
          </tr>
          <tr v-if="!financeStore.transactions.length">
            <td colspan="8" class="text-center text-medium-emphasis py-8">
              No transactions found
            </td>
          </tr>
        </tbody>
      </VTable>

      <div v-else class="text-center py-8">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <VCardText v-if="financeStore.transactionsPagination?.pages > 1">
        <VPagination
          v-model="filters.page"
          :length="financeStore.transactionsPagination.pages"
          :total-visible="7"
          @update:model-value="changePage"
        />
      </VCardText>
    </VCard>
  </div>
</template>
