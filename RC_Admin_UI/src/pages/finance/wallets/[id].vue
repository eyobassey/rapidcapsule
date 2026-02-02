<script setup>
import { useFinanceStore } from '@/stores/finance'
import { exportWalletTransactionsToCSV } from '@/utils/csv-export'

const route = useRoute()
const router = useRouter()
const financeStore = useFinanceStore()
const loading = ref(true)

const walletId = computed(() => route.params.id)

// Dialogs
const creditDialog = ref(false)
const debitDialog = ref(false)
const statusDialog = ref(false)

// Form data
const creditForm = reactive({
  amount: null,
  reason: '',
  notes: '',
})

const debitForm = reactive({
  amount: null,
  reason: '',
  notes: '',
})

const statusForm = reactive({
  status: '',
  reason: '',
})

const statusOptions = [
  { title: 'Active', value: 'ACTIVE' },
  { title: 'Suspended', value: 'SUSPENDED' },
  { title: 'Frozen', value: 'FROZEN' },
  { title: 'Closed', value: 'CLOSED' },
]

const fetchWallet = async () => {
  loading.value = true
  await financeStore.fetchWallet(walletId.value)
  loading.value = false
}

const wallet = computed(() => financeStore.currentWallet?.wallet)
const transactions = computed(() => financeStore.currentWallet?.recent_transactions || [])
const stats = computed(() => financeStore.currentWallet?.transaction_stats || [])

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

const getOwnerName = () => {
  if (!wallet.value?.owner_id) return 'Unknown'
  const owner = wallet.value.owner_id
  const profile = owner.profile || {}
  return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile?.contact?.email || 'Unknown'
}

const getOwnerEmail = () => {
  if (!wallet.value?.owner_id) return null
  return wallet.value.owner_id.profile?.contact?.email || null
}

const getStatusColor = (status) => {
  const colors = {
    ACTIVE: 'success',
    SUSPENDED: 'warning',
    FROZEN: 'info',
    CLOSED: 'error',
    POSTED: 'success',
    PENDING: 'warning',
    FAILED: 'error',
    REVERSED: 'grey',
  }
  return colors[status] || 'default'
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

const openCreditDialog = () => {
  creditForm.amount = null
  creditForm.reason = ''
  creditForm.notes = ''
  creditDialog.value = true
}

const openDebitDialog = () => {
  debitForm.amount = null
  debitForm.reason = ''
  debitForm.notes = ''
  debitDialog.value = true
}

const openStatusDialog = () => {
  statusForm.status = wallet.value?.status
  statusForm.reason = ''
  statusDialog.value = true
}

const submitCredit = async () => {
  if (!creditForm.amount || !creditForm.reason) return

  try {
    await financeStore.creditWallet(
      walletId.value,
      creditForm.amount,
      creditForm.reason,
      creditForm.notes
    )
    creditDialog.value = false
    fetchWallet()
  } catch (error) {
    console.error('Error crediting wallet:', error)
  }
}

const submitDebit = async () => {
  if (!debitForm.amount || !debitForm.reason) return

  try {
    await financeStore.debitWallet(
      walletId.value,
      debitForm.amount,
      debitForm.reason,
      debitForm.notes
    )
    debitDialog.value = false
    fetchWallet()
  } catch (error) {
    console.error('Error debiting wallet:', error)
  }
}

const submitStatusUpdate = async () => {
  if (!statusForm.status || !statusForm.reason) return

  try {
    await financeStore.updateWalletStatus(
      walletId.value,
      statusForm.status,
      statusForm.reason
    )
    statusDialog.value = false
    fetchWallet()
  } catch (error) {
    console.error('Error updating status:', error)
  }
}

// Watch for route param changes
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      fetchWallet()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  financeStore.clearCurrentWallet()
})
</script>

<template>
  <div>
    <div class="d-flex align-center mb-6">
      <VBtn icon variant="text" class="me-2" @click="router.back()">
        <VIcon icon="mdi-arrow-left" />
      </VBtn>
      <h2 class="text-h5">
        <span style="color: #9b9b9b">Finance / Wallets /</span> {{ walletId }}
      </h2>
    </div>

    <VRow v-if="loading">
      <VCol cols="12" class="text-center py-16">
        <VProgressCircular indeterminate color="primary" size="48" />
      </VCol>
    </VRow>

    <template v-else-if="wallet">
      <VRow>
        <!-- Wallet Info Card -->
        <VCol cols="12" md="4">
          <VCard>
            <VCardTitle class="d-flex align-center justify-space-between">
              <span>Wallet Details</span>
              <VChip :color="getStatusColor(wallet.status)" size="small">
                {{ wallet.status }}
              </VChip>
            </VCardTitle>
            <VDivider />
            <VCardText>
              <VList density="compact">
                <VListItem>
                  <template #prepend>
                    <VIcon icon="mdi-identifier" class="me-2" />
                  </template>
                  <VListItemTitle>Wallet ID</VListItemTitle>
                  <VListItemSubtitle class="font-weight-bold">
                    {{ wallet.wallet_id }}
                  </VListItemSubtitle>
                </VListItem>

                <VListItem>
                  <template #prepend>
                    <VIcon icon="mdi-account" class="me-2" />
                  </template>
                  <VListItemTitle>Owner</VListItemTitle>
                  <VListItemSubtitle>
                    <div class="font-weight-bold">{{ getOwnerName() }}</div>
                    <div class="text-caption">{{ getOwnerEmail() || 'No email' }}</div>
                  </VListItemSubtitle>
                </VListItem>

                <VListItem>
                  <template #prepend>
                    <VIcon icon="mdi-tag" class="me-2" />
                  </template>
                  <VListItemTitle>Type</VListItemTitle>
                  <VListItemSubtitle>
                    <VChip size="small" label>{{ wallet.owner_type }}</VChip>
                  </VListItemSubtitle>
                </VListItem>

                <VListItem>
                  <template #prepend>
                    <VIcon icon="mdi-calendar" class="me-2" />
                  </template>
                  <VListItemTitle>Created</VListItemTitle>
                  <VListItemSubtitle>{{ formatDate(wallet.created_at) }}</VListItemSubtitle>
                </VListItem>

                <VListItem>
                  <template #prepend>
                    <VIcon icon="mdi-history" class="me-2" />
                  </template>
                  <VListItemTitle>Last Transaction</VListItemTitle>
                  <VListItemSubtitle>{{ formatDate(wallet.last_transaction_at) }}</VListItemSubtitle>
                </VListItem>

                <VListItem>
                  <template #prepend>
                    <VIcon icon="mdi-counter" class="me-2" />
                  </template>
                  <VListItemTitle>Transaction Count</VListItemTitle>
                  <VListItemSubtitle>{{ wallet.transaction_count }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>

            <VDivider />

            <VCardText>
              <div class="d-flex flex-wrap gap-2">
                <VBtn color="success" size="small" @click="openCreditDialog">
                  <VIcon start icon="mdi-plus" />
                  Credit
                </VBtn>
                <VBtn color="error" size="small" @click="openDebitDialog">
                  <VIcon start icon="mdi-minus" />
                  Debit
                </VBtn>
                <VBtn color="primary" size="small" variant="outlined" @click="openStatusDialog">
                  <VIcon start icon="mdi-cog" />
                  Status
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Balances Card -->
        <VCol cols="12" md="8">
          <VRow>
            <VCol cols="12" sm="6" md="3">
              <VCard color="success" variant="tonal">
                <VCardText class="text-center">
                  <p class="text-body-2 mb-2">Available</p>
                  <h3 class="text-h5 font-weight-bold">
                    {{ formatCurrency(wallet.available_balance) }}
                  </h3>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="12" sm="6" md="3">
              <VCard color="warning" variant="tonal">
                <VCardText class="text-center">
                  <p class="text-body-2 mb-2">Held</p>
                  <h3 class="text-h5 font-weight-bold">
                    {{ formatCurrency(wallet.held_balance) }}
                  </h3>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="12" sm="6" md="3">
              <VCard color="info" variant="tonal">
                <VCardText class="text-center">
                  <p class="text-body-2 mb-2">Pending</p>
                  <h3 class="text-h5 font-weight-bold">
                    {{ formatCurrency(wallet.pending_balance) }}
                  </h3>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="12" sm="6" md="3">
              <VCard color="primary" variant="tonal">
                <VCardText class="text-center">
                  <p class="text-body-2 mb-2">Total</p>
                  <h3 class="text-h5 font-weight-bold">
                    {{ formatCurrency(wallet.available_balance + wallet.held_balance + wallet.pending_balance) }}
                  </h3>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- Lifetime Stats -->
          <VCard class="mt-4">
            <VCardTitle>Lifetime Statistics</VCardTitle>
            <VCardText>
              <VRow>
                <VCol cols="6" sm="3">
                  <div class="text-center">
                    <p class="text-medium-emphasis mb-1">Total Credited</p>
                    <p class="text-h6 text-success font-weight-bold">
                      {{ formatCurrency(wallet.total_credited) }}
                    </p>
                  </div>
                </VCol>
                <VCol cols="6" sm="3">
                  <div class="text-center">
                    <p class="text-medium-emphasis mb-1">Total Debited</p>
                    <p class="text-h6 text-error font-weight-bold">
                      {{ formatCurrency(wallet.total_debited) }}
                    </p>
                  </div>
                </VCol>
                <VCol cols="6" sm="3">
                  <div class="text-center">
                    <p class="text-medium-emphasis mb-1">Total Held</p>
                    <p class="text-h6 text-warning font-weight-bold">
                      {{ formatCurrency(wallet.total_held) }}
                    </p>
                  </div>
                </VCol>
                <VCol cols="6" sm="3">
                  <div class="text-center">
                    <p class="text-medium-emphasis mb-1">Total Released</p>
                    <p class="text-h6 text-info font-weight-bold">
                      {{ formatCurrency(wallet.total_released) }}
                    </p>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Transaction Stats and Recent Transactions -->
      <VRow class="mt-4">
        <VCol cols="12" md="4">
          <VCard>
            <VCardTitle>Transaction Breakdown</VCardTitle>
            <VCardText>
              <VList density="compact">
                <VListItem v-for="stat in stats" :key="stat._id">
                  <template #prepend>
                    <VChip :color="getCategoryColor(stat._id)" size="x-small" label class="me-2">
                      {{ stat.count }}
                    </VChip>
                  </template>
                  <VListItemTitle class="text-body-2">
                    {{ stat._id?.replace(/_/g, ' ') }}
                  </VListItemTitle>
                  <template #append>
                    <span class="font-weight-medium">
                      {{ formatCurrency(stat.total) }}
                    </span>
                  </template>
                </VListItem>
                <VListItem v-if="!stats.length">
                  <VListItemTitle class="text-medium-emphasis text-center">
                    No transactions yet
                  </VListItemTitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" md="8">
          <VCard>
            <VCardTitle class="d-flex align-center justify-space-between">
              <span>Recent Transactions</span>
              <VBtn
                variant="outlined"
                color="secondary"
                size="small"
                @click="exportWalletTransactionsToCSV(transactions, walletId)"
                :disabled="!transactions.length"
              >
                <VIcon start icon="mdi-download" size="small" />
                Export CSV
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
                <tr v-for="txn in transactions" :key="txn.batch_id">
                  <td>
                    <RouterLink
                      :to="{ name: 'finance-transactions-id', params: { id: txn.batch_id } }"
                      class="text-primary text-decoration-none"
                    >
                      {{ txn.batch_id }}
                    </RouterLink>
                  </td>
                  <td>
                    <VChip :color="getCategoryColor(txn.category)" size="x-small" label>
                      {{ txn.category?.replace(/_/g, ' ') }}
                    </VChip>
                  </td>
                  <td class="font-weight-medium">
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
                <tr v-if="!transactions.length">
                  <td colspan="5" class="text-center text-medium-emphasis py-4">
                    No transactions found
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <VCard v-else class="text-center py-16">
      <VCardText>
        <VIcon icon="mdi-wallet-outline" size="64" color="grey" class="mb-4" />
        <p class="text-h6">Wallet not found</p>
        <VBtn color="primary" class="mt-4" :to="{ name: 'finance-wallets' }">
          Back to Wallets
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Credit Dialog -->
    <VDialog v-model="creditDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h6">Credit Wallet</VCardTitle>
        <VCardText>
          <p class="mb-4 text-medium-emphasis">
            Crediting wallet: <strong>{{ walletId }}</strong>
          </p>
          <VTextField
            v-model.number="creditForm.amount"
            label="Amount (NGN)"
            type="number"
            prefix="₦"
            class="mb-4"
          />
          <VTextField v-model="creditForm.reason" label="Reason" class="mb-4" />
          <VTextarea v-model="creditForm.notes" label="Notes (Optional)" rows="2" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="creditDialog = false">Cancel</VBtn>
          <VBtn
            color="success"
            :disabled="!creditForm.amount || !creditForm.reason"
            @click="submitCredit"
          >
            Credit Wallet
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Debit Dialog -->
    <VDialog v-model="debitDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h6">Debit Wallet</VCardTitle>
        <VCardText>
          <p class="mb-4 text-medium-emphasis">
            Debiting wallet: <strong>{{ walletId }}</strong>
          </p>
          <p class="mb-4">
            Available Balance:
            <strong class="text-success">{{ formatCurrency(wallet?.available_balance) }}</strong>
          </p>
          <VTextField
            v-model.number="debitForm.amount"
            label="Amount (NGN)"
            type="number"
            prefix="₦"
            class="mb-4"
          />
          <VTextField v-model="debitForm.reason" label="Reason" class="mb-4" />
          <VTextarea v-model="debitForm.notes" label="Notes (Optional)" rows="2" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="debitDialog = false">Cancel</VBtn>
          <VBtn
            color="error"
            :disabled="!debitForm.amount || !debitForm.reason || debitForm.amount > wallet?.available_balance"
            @click="submitDebit"
          >
            Debit Wallet
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Status Dialog -->
    <VDialog v-model="statusDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h6">Change Wallet Status</VCardTitle>
        <VCardText>
          <p class="mb-4 text-medium-emphasis">
            Wallet: <strong>{{ walletId }}</strong>
          </p>
          <VSelect
            v-model="statusForm.status"
            :items="statusOptions"
            label="New Status"
            class="mb-4"
          />
          <VTextField v-model="statusForm.reason" label="Reason for change" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="statusDialog = false">Cancel</VBtn>
          <VBtn
            color="primary"
            :disabled="!statusForm.status || !statusForm.reason"
            @click="submitStatusUpdate"
          >
            Update Status
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
