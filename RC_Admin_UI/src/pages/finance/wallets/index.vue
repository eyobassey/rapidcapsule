<script setup>
import { useFinanceStore } from '@/stores/finance'
import { exportWalletsToCSV } from '@/utils/csv-export'

const router = useRouter()
const financeStore = useFinanceStore()
const loading = ref(true)

// Filters
const filters = reactive({
  page: 1,
  limit: 20,
  owner_type: '',
  status: '',
  search: '',
})

// Dialogs
const creditDialog = ref(false)
const debitDialog = ref(false)
const statusDialog = ref(false)
const selectedWallet = ref(null)

// Form data
const creditForm = reactive({
  amount: null,
  reason: '',
  notes: '',
  source: 'OPERATING_FUND',
})

const debitForm = reactive({
  amount: null,
  reason: '',
  notes: '',
  destination: 'OPERATING_FUND',
})

// Credit source options - where does the money come from?
const creditSourceOptions = [
  {
    title: 'Platform Operating Fund',
    value: 'OPERATING_FUND',
    subtitle: 'Use platform funds (Asset account)'
  },
  {
    title: 'Promotional Credit',
    value: 'PROMOTIONAL',
    subtitle: 'Bonus/promotion (Records as expense)'
  },
  {
    title: 'Adjustment/Correction',
    value: 'ADJUSTMENT',
    subtitle: 'Error correction (Records as expense)'
  },
]

// Debit destination options - where does the money go?
const debitDestinationOptions = [
  {
    title: 'Platform Operating Fund',
    value: 'OPERATING_FUND',
    subtitle: 'Return to platform funds (Asset account)'
  },
  {
    title: 'Recovery',
    value: 'RECOVERY',
    subtitle: 'Recover incorrect credit (Records as revenue)'
  },
  {
    title: 'Adjustment',
    value: 'ADJUSTMENT',
    subtitle: 'Correction adjustment (Records as revenue)'
  },
]

const statusForm = reactive({
  status: '',
  reason: '',
})

const ownerTypes = [
  { title: 'All Types', value: '' },
  { title: 'Patient', value: 'PATIENT' },
  { title: 'Specialist', value: 'SPECIALIST' },
  { title: 'Pharmacy', value: 'PHARMACY' },
]

const walletStatuses = [
  { title: 'All Statuses', value: '' },
  { title: 'Active', value: 'ACTIVE' },
  { title: 'Suspended', value: 'SUSPENDED' },
  { title: 'Frozen', value: 'FROZEN' },
  { title: 'Closed', value: 'CLOSED' },
]

const statusOptions = [
  { title: 'Active', value: 'ACTIVE' },
  { title: 'Suspended', value: 'SUSPENDED' },
  { title: 'Frozen', value: 'FROZEN' },
  { title: 'Closed', value: 'CLOSED' },
]

const fetchWallets = async () => {
  loading.value = true
  await financeStore.fetchWallets(filters)
  loading.value = false
}

const applyFilters = () => {
  filters.page = 1
  fetchWallets()
}

const changePage = (page) => {
  filters.page = page
  fetchWallets()
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
  })
}

const getOwnerName = (wallet) => {
  const owner = wallet.owner_id
  if (!owner) return 'Unknown'
  const profile = owner.profile || {}
  return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile?.contact?.email || 'Unknown'
}

const getOwnerEmail = (wallet) => {
  const owner = wallet.owner_id
  if (!owner) return null
  return owner.profile?.contact?.email || null
}

const getStatusColor = (status) => {
  const colors = {
    ACTIVE: 'success',
    SUSPENDED: 'warning',
    FROZEN: 'info',
    CLOSED: 'error',
  }
  return colors[status] || 'default'
}

const getOwnerTypeColor = (type) => {
  const colors = {
    PATIENT: 'primary',
    SPECIALIST: 'info',
    PHARMACY: 'warning',
    PLATFORM: 'secondary',
  }
  return colors[type] || 'default'
}

const viewWalletDetails = (wallet) => {
  console.log('Navigating to wallet:', wallet?.wallet_id)
  if (!wallet?.wallet_id) {
    console.error('No wallet ID provided')
    return
  }
  router.push(`/finance/wallets/${wallet.wallet_id}`)
}

const openCreditDialog = (wallet) => {
  selectedWallet.value = wallet
  creditForm.amount = null
  creditForm.reason = ''
  creditForm.notes = ''
  creditForm.source = 'OPERATING_FUND'
  creditDialog.value = true
}

const openDebitDialog = (wallet) => {
  selectedWallet.value = wallet
  debitForm.amount = null
  debitForm.reason = ''
  debitForm.notes = ''
  debitForm.destination = 'OPERATING_FUND'
  debitDialog.value = true
}

const openStatusDialog = (wallet) => {
  selectedWallet.value = wallet
  statusForm.status = wallet.status
  statusForm.reason = ''
  statusDialog.value = true
}

const submitCredit = async () => {
  if (!creditForm.amount || !creditForm.reason) return

  try {
    await financeStore.creditWallet(
      selectedWallet.value.wallet_id,
      creditForm.amount,
      creditForm.reason,
      creditForm.notes,
      creditForm.source
    )
    creditDialog.value = false
    fetchWallets()
  } catch (error) {
    console.error('Error crediting wallet:', error)
  }
}

const submitDebit = async () => {
  if (!debitForm.amount || !debitForm.reason) return

  try {
    await financeStore.debitWallet(
      selectedWallet.value.wallet_id,
      debitForm.amount,
      debitForm.reason,
      debitForm.notes,
      debitForm.destination
    )
    debitDialog.value = false
    fetchWallets()
  } catch (error) {
    console.error('Error debiting wallet:', error)
  }
}

const submitStatusUpdate = async () => {
  if (!statusForm.status || !statusForm.reason) return

  try {
    await financeStore.updateWalletStatus(
      selectedWallet.value.wallet_id,
      statusForm.status,
      statusForm.reason
    )
    statusDialog.value = false
    fetchWallets()
  } catch (error) {
    console.error('Error updating status:', error)
  }
}

onMounted(() => {
  fetchWallets()
})
</script>

<template>
  <div>
    <h2 class="text-h5 mb-6">
      <span style="color: #9b9b9b">Finance /</span> Wallets
    </h2>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow align="center">
          <VCol cols="12" sm="6" md="3">
            <VTextField
              v-model="filters.search"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              clearable
              @keyup.enter="applyFilters"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VSelect
              v-model="filters.owner_type"
              :items="ownerTypes"
              label="Owner Type"
              density="compact"
              @update:model-value="applyFilters"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VSelect
              v-model="filters.status"
              :items="walletStatuses"
              label="Status"
              density="compact"
              @update:model-value="applyFilters"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VBtn color="primary" @click="applyFilters">
              <VIcon start icon="mdi-filter" />
              Apply Filters
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Wallets Table -->
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>Wallets ({{ financeStore.walletsTotal }})</span>
        <div class="d-flex align-center gap-2">
          <VBtn
            variant="outlined"
            color="secondary"
            size="small"
            @click="exportWalletsToCSV(financeStore.wallets)"
            :disabled="!financeStore.wallets.length"
          >
            <VIcon start icon="mdi-download" size="small" />
            Export CSV
          </VBtn>
          <VBtn variant="text" color="primary" size="small" @click="fetchWallets">
            <VIcon icon="mdi-refresh" />
          </VBtn>
        </div>
      </VCardTitle>

      <VTable v-if="!loading" density="comfortable" hover>
        <thead>
          <tr>
            <th>Wallet ID</th>
            <th>Owner</th>
            <th>Type</th>
            <th>Available</th>
            <th>Held</th>
            <th>Total</th>
            <th>Status</th>
            <th>Last Activity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="wallet in financeStore.wallets" :key="wallet.wallet_id">
            <td>
              <RouterLink
                :to="`/finance/wallets/${wallet.wallet_id}`"
                class="text-primary text-decoration-none font-weight-medium"
              >
                {{ wallet.wallet_id }}
              </RouterLink>
            </td>
            <td>
              <div class="d-flex align-center">
                <VAvatar size="32" color="primary" variant="tonal" class="me-2">
                  <span class="text-caption">
                    {{ getOwnerName(wallet).charAt(0).toUpperCase() }}
                  </span>
                </VAvatar>
                <div>
                  <div class="text-body-2 font-weight-medium">
                    {{ getOwnerName(wallet) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ getOwnerEmail(wallet) || 'No email' }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <VChip
                :color="getOwnerTypeColor(wallet.owner_type)"
                size="small"
                label
              >
                {{ wallet.owner_type }}
              </VChip>
            </td>
            <td class="text-success font-weight-medium">
              {{ formatCurrency(wallet.available_balance) }}
            </td>
            <td class="text-warning">
              {{ formatCurrency(wallet.held_balance) }}
            </td>
            <td class="font-weight-bold">
              {{ formatCurrency(wallet.available_balance + wallet.held_balance + wallet.pending_balance) }}
            </td>
            <td>
              <VChip
                :color="getStatusColor(wallet.status)"
                size="small"
              >
                {{ wallet.status }}
              </VChip>
            </td>
            <td class="text-medium-emphasis text-caption">
              {{ formatDate(wallet.last_transaction_at) }}
            </td>
            <td>
              <VMenu location="bottom end">
                <template #activator="{ props }">
                  <VBtn
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    v-bind="props"
                  />
                </template>
                <VList density="compact" nav>
                  <VListItem :to="`/finance/wallets/${wallet.wallet_id}`">
                    <template #prepend>
                      <VIcon icon="mdi-eye" size="small" />
                    </template>
                    <VListItemTitle>View Details</VListItemTitle>
                  </VListItem>
                  <VListItem @click="openCreditDialog(wallet)">
                    <template #prepend>
                      <VIcon icon="mdi-plus-circle" size="small" color="success" />
                    </template>
                    <VListItemTitle>Credit Wallet</VListItemTitle>
                  </VListItem>
                  <VListItem @click="openDebitDialog(wallet)">
                    <template #prepend>
                      <VIcon icon="mdi-minus-circle" size="small" color="error" />
                    </template>
                    <VListItemTitle>Debit Wallet</VListItemTitle>
                  </VListItem>
                  <VDivider />
                  <VListItem @click="openStatusDialog(wallet)">
                    <template #prepend>
                      <VIcon icon="mdi-cog" size="small" />
                    </template>
                    <VListItemTitle>Change Status</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </td>
          </tr>
          <tr v-if="!financeStore.wallets.length">
            <td colspan="9" class="text-center text-medium-emphasis py-8">
              No wallets found
            </td>
          </tr>
        </tbody>
      </VTable>

      <div v-else class="text-center py-8">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <!-- Pagination -->
      <VCardText v-if="financeStore.walletsPagination?.pages > 1">
        <VPagination
          v-model="filters.page"
          :length="financeStore.walletsPagination.pages"
          :total-visible="7"
          @update:model-value="changePage"
        />
      </VCardText>
    </VCard>

    <!-- Credit Dialog -->
    <VDialog v-model="creditDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h6">
          Credit Wallet
        </VCardTitle>
        <VCardText>
          <p class="mb-4 text-medium-emphasis">
            Crediting wallet: <strong>{{ selectedWallet?.wallet_id }}</strong>
          </p>
          <VTextField
            v-model.number="creditForm.amount"
            label="Amount (NGN)"
            type="number"
            prefix="₦"
            class="mb-4"
          />
          <VSelect
            v-model="creditForm.source"
            :items="creditSourceOptions"
            item-title="title"
            item-value="value"
            label="Credit Source (Where is the money coming from?)"
            class="mb-4"
          >
            <template #item="{ props, item }">
              <VListItem v-bind="props">
                <template #subtitle>
                  {{ item.raw.subtitle }}
                </template>
              </VListItem>
            </template>
          </VSelect>
          <VTextField
            v-model="creditForm.reason"
            label="Reason"
            class="mb-4"
          />
          <VTextarea
            v-model="creditForm.notes"
            label="Notes (Optional)"
            rows="2"
          />
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
        <VCardTitle class="text-h6">
          Debit Wallet
        </VCardTitle>
        <VCardText>
          <p class="mb-4 text-medium-emphasis">
            Debiting wallet: <strong>{{ selectedWallet?.wallet_id }}</strong>
          </p>
          <p class="mb-4">
            Available Balance: <strong class="text-success">{{ formatCurrency(selectedWallet?.available_balance) }}</strong>
          </p>
          <VTextField
            v-model.number="debitForm.amount"
            label="Amount (NGN)"
            type="number"
            prefix="₦"
            class="mb-4"
          />
          <VSelect
            v-model="debitForm.destination"
            :items="debitDestinationOptions"
            item-title="title"
            item-value="value"
            label="Debit Destination (Where is the money going?)"
            class="mb-4"
          >
            <template #item="{ props, item }">
              <VListItem v-bind="props">
                <template #subtitle>
                  {{ item.raw.subtitle }}
                </template>
              </VListItem>
            </template>
          </VSelect>
          <VTextField
            v-model="debitForm.reason"
            label="Reason"
            class="mb-4"
          />
          <VTextarea
            v-model="debitForm.notes"
            label="Notes (Optional)"
            rows="2"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="debitDialog = false">Cancel</VBtn>
          <VBtn
            color="error"
            :disabled="!debitForm.amount || !debitForm.reason || debitForm.amount > selectedWallet?.available_balance"
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
        <VCardTitle class="text-h6">
          Change Wallet Status
        </VCardTitle>
        <VCardText>
          <p class="mb-4 text-medium-emphasis">
            Wallet: <strong>{{ selectedWallet?.wallet_id }}</strong>
          </p>
          <VSelect
            v-model="statusForm.status"
            :items="statusOptions"
            label="New Status"
            class="mb-4"
          />
          <VTextField
            v-model="statusForm.reason"
            label="Reason for change"
          />
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
