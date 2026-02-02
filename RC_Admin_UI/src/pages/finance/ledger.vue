<script setup>
import { useFinanceStore } from '@/stores/finance'
import { exportLedgerToCSV } from '@/utils/csv-export'

const financeStore = useFinanceStore()
const loading = ref(true)

const filters = reactive({
  page: 1,
  limit: 50,
  account_code: '',
  batch_id: '',
  start_date: '',
  end_date: '',
})

const fetchEntries = async () => {
  loading.value = true
  await Promise.all([
    financeStore.fetchLedgerEntries(filters),
    financeStore.fetchAccounts(),
  ])
  loading.value = false
}

const applyFilters = () => {
  filters.page = 1
  fetchEntries()
}

const changePage = (page) => {
  filters.page = page
  financeStore.fetchLedgerEntries(filters)
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
  if (!user) return '-'
  const profile = user.profile || {}
  return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email || 'Unknown'
}

const getEntryTypeColor = (type) => {
  return type === 'DEBIT' ? 'error' : 'success'
}

const getStatusColor = (status) => {
  return status === 'POSTED' ? 'success' : 'grey'
}

const accountOptions = computed(() => {
  return [
    { title: 'All Accounts', value: '' },
    ...financeStore.accounts.map(a => ({
      title: `${a.code} - ${a.name}`,
      value: a.code,
    })),
  ]
})

onMounted(() => {
  fetchEntries()
})
</script>

<template>
  <div>
    <h2 class="text-h5 mb-6">
      <span style="color: #9b9b9b">Finance /</span> General Ledger
    </h2>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow align="center">
          <VCol cols="12" sm="6" md="3">
            <VSelect
              v-model="filters.account_code"
              :items="accountOptions"
              label="Account"
              density="compact"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VTextField
              v-model="filters.batch_id"
              label="Batch ID"
              density="compact"
              clearable
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

    <!-- Ledger Table -->
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>Ledger Entries ({{ financeStore.ledgerTotal }})</span>
        <div class="d-flex align-center gap-2">
          <VBtn
            variant="outlined"
            color="secondary"
            size="small"
            @click="exportLedgerToCSV(financeStore.ledgerEntries)"
            :disabled="!financeStore.ledgerEntries.length"
          >
            <VIcon start icon="mdi-download" size="small" />
            Export CSV
          </VBtn>
          <VBtn variant="text" color="primary" size="small" @click="fetchEntries">
            <VIcon icon="mdi-refresh" />
          </VBtn>
        </div>
      </VCardTitle>

      <VTable v-if="!loading" density="comfortable" hover>
        <thead>
          <tr>
            <th>Entry ID</th>
            <th>Batch ID</th>
            <th>Account</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Balance Before</th>
            <th>Balance After</th>
            <th>User</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in financeStore.ledgerEntries" :key="entry.entry_id">
            <td class="text-caption font-weight-medium">{{ entry.entry_id }}</td>
            <td>
              <RouterLink
                :to="{ name: 'finance-transactions-id', params: { id: entry.batch_id } }"
                class="text-primary text-decoration-none"
              >
                {{ entry.batch_id }}
              </RouterLink>
            </td>
            <td>
              <div class="font-weight-medium">{{ entry.account_code }}</div>
              <div class="text-caption text-medium-emphasis text-truncate" style="max-width: 150px">
                {{ entry.description }}
              </div>
            </td>
            <td>
              <VChip :color="getEntryTypeColor(entry.entry_type)" size="x-small" label>
                {{ entry.entry_type }}
              </VChip>
            </td>
            <td class="font-weight-bold" :class="entry.entry_type === 'DEBIT' ? 'text-error' : 'text-success'">
              {{ entry.entry_type === 'DEBIT' ? '-' : '+' }}{{ formatCurrency(entry.amount) }}
            </td>
            <td class="text-medium-emphasis">{{ formatCurrency(entry.balance_before) }}</td>
            <td class="font-weight-medium">{{ formatCurrency(entry.balance_after) }}</td>
            <td class="text-caption">{{ getUserName(entry.user_id) }}</td>
            <td>
              <VChip :color="getStatusColor(entry.status)" size="x-small">
                {{ entry.status }}
              </VChip>
            </td>
            <td class="text-caption text-medium-emphasis">
              {{ formatDate(entry.created_at) }}
            </td>
          </tr>
          <tr v-if="!financeStore.ledgerEntries.length">
            <td colspan="10" class="text-center text-medium-emphasis py-8">
              No ledger entries found
            </td>
          </tr>
        </tbody>
      </VTable>

      <div v-else class="text-center py-8">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <VCardText v-if="financeStore.ledgerPagination?.pages > 1">
        <VPagination
          v-model="filters.page"
          :length="financeStore.ledgerPagination.pages"
          :total-visible="7"
          @update:model-value="changePage"
        />
      </VCardText>
    </VCard>
  </div>
</template>
