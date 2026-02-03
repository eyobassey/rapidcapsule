<script setup>
import { useFinanceStore } from '@/stores/finance'

const route = useRoute()
const router = useRouter()
const financeStore = useFinanceStore()
const loading = ref(true)

const batchId = computed(() => route.params.id)

const fetchTransaction = async () => {
  loading.value = true
  await financeStore.fetchTransaction(batchId.value)
  loading.value = false
}

const batch = computed(() => financeStore.currentTransaction?.batch)
const entries = computed(() => financeStore.currentTransaction?.entries || [])

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
    second: '2-digit',
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

const getEntryTypeColor = (type) => {
  return type === 'DEBIT' ? 'error' : 'success'
}

onMounted(() => {
  fetchTransaction()
})

onUnmounted(() => {
  financeStore.clearCurrentTransaction()
})
</script>

<template>
  <div>
    <div class="d-flex align-center mb-6">
      <VBtn icon variant="text" class="me-2" @click="router.back()">
        <VIcon icon="mdi-arrow-left" />
      </VBtn>
      <h2 class="text-h5">
        <span style="color: #9b9b9b">Finance / Transactions /</span> {{ batchId }}
      </h2>
    </div>

    <VRow v-if="loading">
      <VCol cols="12" class="text-center py-16">
        <VProgressCircular indeterminate color="primary" size="48" />
      </VCol>
    </VRow>

    <template v-else-if="batch">
      <VRow>
        <!-- Transaction Info -->
        <VCol cols="12" md="5">
          <VCard>
            <VCardTitle class="d-flex align-center justify-space-between">
              <span>Transaction Details</span>
              <VChip :color="getStatusColor(batch.status)" size="small">
                {{ batch.status }}
              </VChip>
            </VCardTitle>
            <VDivider />
            <VCardText>
              <VList density="compact">
                <VListItem>
                  <template #prepend>
                    <VIcon icon="mdi-identifier" class="me-2" />
                  </template>
                  <VListItemTitle>Batch ID</VListItemTitle>
                  <VListItemSubtitle class="font-weight-bold">
                    {{ batch.batch_id }}
                  </VListItemSubtitle>
                </VListItem>

                <VListItem>
                  <template #prepend>
                    <VIcon icon="mdi-tag" class="me-2" />
                  </template>
                  <VListItemTitle>Category</VListItemTitle>
                  <VListItemSubtitle>
                    <VChip :color="getCategoryColor(batch.category)" size="small" label>
                      {{ batch.category?.replace(/_/g, ' ') }}
                    </VChip>
                  </VListItemSubtitle>
                </VListItem>

                <VListItem>
                  <template #prepend>
                    <VIcon icon="mdi-text" class="me-2" />
                  </template>
                  <VListItemTitle>Description</VListItemTitle>
                  <VListItemSubtitle>{{ batch.description }}</VListItemSubtitle>
                </VListItem>

                <VListItem v-if="batch.from_user">
                  <template #prepend>
                    <VIcon icon="mdi-account-arrow-right" class="me-2" />
                  </template>
                  <VListItemTitle>From</VListItemTitle>
                  <VListItemSubtitle>
                    <div>{{ getUserName(batch.from_user) }}</div>
                    <div class="text-caption">{{ batch.from_user?.email }}</div>
                  </VListItemSubtitle>
                </VListItem>

                <VListItem v-else-if="batch.category === 'WALLET_TOPUP'">
                  <template #prepend>
                    <VIcon icon="mdi-bank" class="me-2" color="success" />
                  </template>
                  <VListItemTitle>From</VListItemTitle>
                  <VListItemSubtitle>
                    <VChip color="success" size="small" label>
                      Paystack Payment Gateway
                    </VChip>
                  </VListItemSubtitle>
                </VListItem>

                <VListItem v-if="batch.to_user">
                  <template #prepend>
                    <VIcon icon="mdi-account-arrow-left" class="me-2" />
                  </template>
                  <VListItemTitle>To</VListItemTitle>
                  <VListItemSubtitle>
                    <div>{{ getUserName(batch.to_user) }}</div>
                    <div class="text-caption">{{ batch.to_user?.email }}</div>
                  </VListItemSubtitle>
                </VListItem>

                <VListItem>
                  <template #prepend>
                    <VIcon icon="mdi-calendar" class="me-2" />
                  </template>
                  <VListItemTitle>Created</VListItemTitle>
                  <VListItemSubtitle>{{ formatDate(batch.created_at) }}</VListItemSubtitle>
                </VListItem>

                <VListItem v-if="batch.posted_at">
                  <template #prepend>
                    <VIcon icon="mdi-check-circle" class="me-2" />
                  </template>
                  <VListItemTitle>Posted</VListItemTitle>
                  <VListItemSubtitle>{{ formatDate(batch.posted_at) }}</VListItemSubtitle>
                </VListItem>

                <VListItem v-if="batch.performed_by">
                  <template #prepend>
                    <VIcon icon="mdi-account-check" class="me-2" />
                  </template>
                  <VListItemTitle>Performed By</VListItemTitle>
                  <VListItemSubtitle>{{ getUserName(batch.performed_by) }}</VListItemSubtitle>
                </VListItem>

                <VListItem v-if="batch.external_reference">
                  <template #prepend>
                    <VIcon icon="mdi-link" class="me-2" />
                  </template>
                  <VListItemTitle>External Reference</VListItemTitle>
                  <VListItemSubtitle>{{ batch.external_reference }}</VListItemSubtitle>
                </VListItem>

                <VListItem v-if="batch.notes">
                  <template #prepend>
                    <VIcon icon="mdi-note" class="me-2" />
                  </template>
                  <VListItemTitle>Notes</VListItemTitle>
                  <VListItemSubtitle>{{ batch.notes }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>

          <!-- Summary Card -->
          <VCard class="mt-4">
            <VCardTitle>Summary</VCardTitle>
            <VCardText>
              <VRow>
                <VCol cols="6">
                  <div class="text-center pa-4 rounded" style="background: rgba(var(--v-theme-error), 0.1)">
                    <p class="text-medium-emphasis mb-1">Total Debits</p>
                    <p class="text-h5 font-weight-bold text-error">
                      {{ formatCurrency(batch.total_debits) }}
                    </p>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="text-center pa-4 rounded" style="background: rgba(var(--v-theme-success), 0.1)">
                    <p class="text-medium-emphasis mb-1">Total Credits</p>
                    <p class="text-h5 font-weight-bold text-success">
                      {{ formatCurrency(batch.total_credits) }}
                    </p>
                  </div>
                </VCol>
              </VRow>
              <VAlert
                v-if="batch.is_balanced"
                type="success"
                variant="tonal"
                class="mt-4"
              >
                <VIcon start icon="mdi-check-circle" />
                Transaction is balanced
              </VAlert>
              <VAlert
                v-else
                type="error"
                variant="tonal"
                class="mt-4"
              >
                <VIcon start icon="mdi-alert" />
                Transaction is NOT balanced
              </VAlert>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Ledger Entries -->
        <VCol cols="12" md="7">
          <VCard>
            <VCardTitle>
              Ledger Entries ({{ entries.length }})
            </VCardTitle>
            <VTable density="comfortable">
              <thead>
                <tr>
                  <th>Entry ID</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance Before</th>
                  <th>Balance After</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in entries" :key="entry.entry_id">
                  <td class="text-caption">{{ entry.entry_id }}</td>
                  <td>
                    <div class="font-weight-medium">{{ entry.account_code }}</div>
                    <div class="text-caption text-medium-emphasis">{{ entry.description }}</div>
                  </td>
                  <td>
                    <VChip :color="getEntryTypeColor(entry.entry_type)" size="small" label>
                      {{ entry.entry_type }}
                    </VChip>
                  </td>
                  <td class="font-weight-bold" :class="entry.entry_type === 'DEBIT' ? 'text-error' : 'text-success'">
                    {{ entry.entry_type === 'DEBIT' ? '-' : '+' }}{{ formatCurrency(entry.amount) }}
                  </td>
                  <td class="text-medium-emphasis">{{ formatCurrency(entry.balance_before) }}</td>
                  <td class="font-weight-medium">{{ formatCurrency(entry.balance_after) }}</td>
                </tr>
                <tr v-if="!entries.length">
                  <td colspan="6" class="text-center text-medium-emphasis py-4">
                    No entries found
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCard>

          <!-- Reversal Info -->
          <VCard v-if="batch.reversed_by_batch || batch.reverses_batch" class="mt-4">
            <VCardTitle>Reversal Information</VCardTitle>
            <VCardText>
              <VAlert v-if="batch.reverses_batch" type="info" variant="tonal" class="mb-4">
                This transaction reverses batch:
                <RouterLink
                  :to="{ name: 'finance-transactions-id', params: { id: batch.reverses_batch } }"
                  class="text-primary"
                >
                  {{ batch.reverses_batch }}
                </RouterLink>
              </VAlert>
              <VAlert v-if="batch.reversed_by_batch" type="warning" variant="tonal">
                This transaction was reversed by:
                <RouterLink
                  :to="{ name: 'finance-transactions-id', params: { id: batch.reversed_by_batch } }"
                  class="text-primary"
                >
                  {{ batch.reversed_by_batch }}
                </RouterLink>
                <div v-if="batch.reversal_reason" class="mt-2">
                  Reason: {{ batch.reversal_reason }}
                </div>
              </VAlert>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <VCard v-else class="text-center py-16">
      <VCardText>
        <VIcon icon="mdi-swap-horizontal" size="64" color="grey" class="mb-4" />
        <p class="text-h6">Transaction not found</p>
        <VBtn color="primary" class="mt-4" :to="{ name: 'finance-transactions' }">
          Back to Transactions
        </VBtn>
      </VCardText>
    </VCard>
  </div>
</template>
