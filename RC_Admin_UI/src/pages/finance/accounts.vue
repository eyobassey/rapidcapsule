<script setup>
import { useFinanceStore } from '@/stores/finance'
import { exportAccountsToCSV, exportAccountStatementToCSV } from '@/utils/csv-export'

const financeStore = useFinanceStore()
const loading = ref(true)
const submitting = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Statement dialog
const statementDialog = ref(false)
const selectedAccount = ref(null)
const statementFilters = reactive({
  start_date: '',
  end_date: '',
})

// Account management
const accountDialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const accountForm = reactive({
  code: '',
  name: '',
  description: '',
  type: 'ASSET',
  sub_type: '',
})

const accountTypes = [
  { title: 'Asset', value: 'ASSET', prefix: '1', description: 'Things you own (Cash, Receivables, etc.)' },
  { title: 'Liability', value: 'LIABILITY', prefix: '2', description: 'Things you owe (Payables, Wallet balances)' },
  { title: 'Equity', value: 'EQUITY', prefix: '3', description: 'Owner\'s stake (Retained earnings, Capital)' },
  { title: 'Revenue', value: 'REVENUE', prefix: '4', description: 'Income (Fees, Commissions, etc.)' },
  { title: 'Expense', value: 'EXPENSE', prefix: '5', description: 'Costs (API costs, Fees, etc.)' },
]

const subTypes = [
  { title: 'None', value: '' },
  { title: 'Cash', value: 'CASH' },
  { title: 'Receivable', value: 'RECEIVABLE' },
  { title: 'Wallet Pool', value: 'WALLET_POOL' },
  { title: 'Wallet Liability', value: 'WALLET_LIABILITY' },
  { title: 'Payable', value: 'PAYABLE' },
  { title: 'Deferred Revenue', value: 'DEFERRED_REVENUE' },
  { title: 'Retained Earnings', value: 'RETAINED_EARNINGS' },
  { title: 'Service Fee', value: 'SERVICE_FEE' },
  { title: 'Product Revenue', value: 'PRODUCT_REVENUE' },
  { title: 'Payment Processing', value: 'PAYMENT_PROCESSING' },
  { title: 'Refunds/Losses', value: 'REFUNDS_LOSSES' },
  { title: 'Operational', value: 'OPERATIONAL' },
]

const fetchAccounts = async () => {
  loading.value = true
  await financeStore.fetchAccounts()
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

const getBalanceClass = (account) => {
  const balance = account.current_balance || 0
  if (balance > 0) return 'text-success'
  if (balance < 0) return 'text-error'
  return 'text-medium-emphasis'
}

const groupedAccounts = computed(() => {
  const groups = {}
  financeStore.accounts.forEach(account => {
    if (!groups[account.type]) {
      groups[account.type] = []
    }
    groups[account.type].push(account)
  })
  return groups
})

const openStatement = async (account) => {
  selectedAccount.value = account
  statementFilters.start_date = ''
  statementFilters.end_date = ''
  await financeStore.fetchAccountStatement(account.code, statementFilters)
  statementDialog.value = true
}

const refreshStatement = async () => {
  if (selectedAccount.value) {
    await financeStore.fetchAccountStatement(selectedAccount.value.code, statementFilters)
  }
}

// Account management functions
const openCreateDialog = () => {
  editMode.value = false
  accountForm.code = ''
  accountForm.name = ''
  accountForm.description = ''
  accountForm.type = 'ASSET'
  accountForm.sub_type = ''
  accountDialog.value = true
}

const openEditDialog = (account) => {
  editMode.value = true
  selectedAccount.value = account
  accountForm.code = account.code
  accountForm.name = account.name
  accountForm.description = account.description || ''
  accountForm.type = account.type
  accountForm.sub_type = account.sub_type || ''
  accountDialog.value = true
}

const openDeleteDialog = (account) => {
  selectedAccount.value = account
  deleteDialog.value = true
}

const suggestAccountCode = () => {
  const typeConfig = accountTypes.find(t => t.value === accountForm.type)
  if (!typeConfig) return

  const prefix = typeConfig.prefix
  // Find existing accounts of this type and suggest next code
  const typeAccounts = financeStore.accounts.filter(a => a.code.startsWith(prefix))

  if (typeAccounts.length === 0) {
    accountForm.code = `${prefix}100.001.001`
  } else {
    // Get the highest subcode
    const codes = typeAccounts.map(a => {
      const parts = a.code.split('.')
      return {
        main: parseInt(parts[0]),
        sub1: parseInt(parts[1]),
        sub2: parseInt(parts[2]),
      }
    })
    const maxSub2 = Math.max(...codes.map(c => c.sub2))
    const lastCode = codes.find(c => c.sub2 === maxSub2)
    accountForm.code = `${prefix}${String(lastCode.main).slice(1)}.${String(lastCode.sub1).padStart(3, '0')}.${String(maxSub2 + 1).padStart(3, '0')}`
  }
}

const submitAccount = async () => {
  if (!accountForm.code || !accountForm.name || !accountForm.type) {
    snackbarMessage.value = 'Please fill in all required fields'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  submitting.value = true
  try {
    if (editMode.value) {
      await financeStore.updateAccount(accountForm.code, {
        name: accountForm.name,
        description: accountForm.description,
        sub_type: accountForm.sub_type || undefined,
      })
      snackbarMessage.value = 'Account updated successfully'
    } else {
      await financeStore.createAccount({
        code: accountForm.code,
        name: accountForm.name,
        description: accountForm.description,
        type: accountForm.type,
        sub_type: accountForm.sub_type || undefined,
      })
      snackbarMessage.value = 'Account created successfully'
    }
    snackbarColor.value = 'success'
    snackbar.value = true
    accountDialog.value = false
  } catch (error) {
    snackbarMessage.value = error.response?.data?.message || 'Failed to save account'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async () => {
  if (!selectedAccount.value) return

  submitting.value = true
  try {
    await financeStore.deleteAccount(selectedAccount.value.code)
    snackbarMessage.value = 'Account deleted successfully'
    snackbarColor.value = 'success'
    snackbar.value = true
    deleteDialog.value = false
  } catch (error) {
    snackbarMessage.value = error.response?.data?.message || 'Failed to delete account'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchAccounts()
})
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h2 class="text-h5">
        <span style="color: #9b9b9b">Finance /</span> Chart of Accounts
      </h2>
      <div class="d-flex gap-2">
        <VBtn
          color="secondary"
          variant="outlined"
          @click="exportAccountsToCSV(financeStore.accounts)"
          :disabled="!financeStore.accounts.length"
        >
          <VIcon start icon="mdi-download" />
          Export CSV
        </VBtn>
        <VBtn color="primary" @click="openCreateDialog">
          <VIcon start icon="mdi-plus" />
          New Account
        </VBtn>
      </div>
    </div>

    <VRow v-if="loading">
      <VCol cols="12" class="text-center py-16">
        <VProgressCircular indeterminate color="primary" size="48" />
      </VCol>
    </VRow>

    <template v-else>
      <VRow>
        <VCol v-for="(accounts, type) in groupedAccounts" :key="type" cols="12" lg="6">
          <VCard>
            <VCardTitle class="d-flex align-center">
              <VChip :color="getTypeColor(type)" size="small" label class="me-2">
                {{ type }}
              </VChip>
              <span>{{ type }} Accounts</span>
            </VCardTitle>
            <VTable density="compact" hover>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Normal</th>
                  <th class="text-right">Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="account in accounts" :key="account.code">
                  <td class="font-weight-medium text-primary">{{ account.code }}</td>
                  <td>
                    <div>{{ account.name }}</div>
                    <div v-if="account.description" class="text-caption text-medium-emphasis">
                      {{ account.description }}
                    </div>
                  </td>
                  <td>
                    <VChip
                      :color="account.normal_balance === 'DEBIT' ? 'error' : 'success'"
                      size="x-small"
                      label
                    >
                      {{ account.normal_balance }}
                    </VChip>
                  </td>
                  <td class="text-right font-weight-bold" :class="getBalanceClass(account)">
                    {{ formatCurrency(account.current_balance) }}
                  </td>
                  <td>
                    <VBtn
                      icon="mdi-file-document-outline"
                      variant="text"
                      size="small"
                      title="View Statement"
                      @click="openStatement(account)"
                    />
                    <VBtn
                      icon="mdi-pencil"
                      variant="text"
                      size="small"
                      title="Edit Account"
                      @click="openEditDialog(account)"
                    />
                    <VBtn
                      v-if="!account.is_system_account"
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      title="Delete Account"
                      @click="openDeleteDialog(account)"
                    />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-grey-lighten-4">
                  <td colspan="3" class="font-weight-bold">Total</td>
                  <td class="text-right font-weight-bold">
                    {{ formatCurrency(accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0)) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </VTable>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <!-- Create/Edit Account Dialog -->
    <VDialog v-model="accountDialog" max-width="600">
      <VCard>
        <VCardTitle>{{ editMode ? 'Edit Account' : 'Create New Account' }}</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="accountForm.type"
                :items="accountTypes"
                item-title="title"
                item-value="value"
                label="Account Type *"
                :disabled="editMode"
                @update:model-value="suggestAccountCode"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props">
                    <template #subtitle>
                      {{ item.raw.description }}
                    </template>
                  </VListItem>
                </template>
              </VSelect>
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField
                v-model="accountForm.code"
                label="Account Code *"
                placeholder="e.g., 5300.003.001"
                :disabled="editMode"
                hint="Format: XXXX.XXX.XXX"
                persistent-hint
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="accountForm.name"
                label="Account Name *"
                placeholder="e.g., Server Hosting Costs"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="accountForm.description"
                label="Description"
                placeholder="Brief description of what this account is for"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="accountForm.sub_type"
                :items="subTypes"
                item-title="title"
                item-value="value"
                label="Sub Type (Optional)"
                clearable
              />
            </VCol>
          </VRow>

          <VAlert v-if="!editMode" type="info" variant="tonal" class="mt-4">
            <strong>Account Code Format:</strong><br>
            First digit indicates type: 1=Asset, 2=Liability, 3=Equity, 4=Revenue, 5=Expense<br>
            Example: 5300.003.001 = Expense (5) > Operational (300) > Third Account (003.001)
          </VAlert>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="accountDialog = false">Cancel</VBtn>
          <VBtn
            color="primary"
            :loading="submitting"
            @click="submitAccount"
          >
            {{ editMode ? 'Update' : 'Create' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard>
        <VCardTitle class="text-error">Delete Account</VCardTitle>
        <VCardText>
          <p>Are you sure you want to delete this account?</p>
          <p class="font-weight-bold mt-2" v-if="selectedAccount">
            {{ selectedAccount.code }} - {{ selectedAccount.name }}
          </p>
          <VAlert type="warning" variant="tonal" class="mt-4">
            This action cannot be undone. Accounts with ledger entries or non-zero balance cannot be deleted.
          </VAlert>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn
            color="error"
            :loading="submitting"
            @click="confirmDelete"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Account Statement Dialog -->
    <VDialog v-model="statementDialog" max-width="900" scrollable>
      <VCard v-if="selectedAccount">
        <VCardTitle class="d-flex align-center justify-space-between">
          <div>
            <span>Account Statement</span>
            <div class="text-body-2 text-medium-emphasis">
              {{ selectedAccount.code }} - {{ selectedAccount.name }}
            </div>
          </div>
          <VBtn icon="mdi-close" variant="text" @click="statementDialog = false" />
        </VCardTitle>
        <VDivider />

        <VCardText>
          <!-- Filters -->
          <VRow class="mb-4">
            <VCol cols="12" sm="4">
              <VTextField
                v-model="statementFilters.start_date"
                label="From Date"
                type="date"
                density="compact"
              />
            </VCol>
            <VCol cols="12" sm="4">
              <VTextField
                v-model="statementFilters.end_date"
                label="To Date"
                type="date"
                density="compact"
              />
            </VCol>
            <VCol cols="12" sm="2">
              <VBtn color="primary" block @click="refreshStatement">
                <VIcon start icon="mdi-refresh" />
                Refresh
              </VBtn>
            </VCol>
            <VCol cols="12" sm="2">
              <VBtn
                color="secondary"
                variant="outlined"
                block
                @click="exportAccountStatementToCSV(financeStore.accountStatement, selectedAccount)"
                :disabled="!financeStore.accountStatement?.entries?.length"
              >
                <VIcon start icon="mdi-download" />
                CSV
              </VBtn>
            </VCol>
          </VRow>

          <!-- Summary -->
          <VRow class="mb-4" v-if="financeStore.accountStatement?.summary">
            <VCol cols="6" sm="3">
              <div class="text-center pa-3 rounded" style="background: rgba(var(--v-theme-error), 0.1)">
                <p class="text-caption mb-1">Total Debits</p>
                <p class="text-h6 font-weight-bold text-error">
                  {{ formatCurrency(financeStore.accountStatement.summary.total_debits) }}
                </p>
              </div>
            </VCol>
            <VCol cols="6" sm="3">
              <div class="text-center pa-3 rounded" style="background: rgba(var(--v-theme-success), 0.1)">
                <p class="text-caption mb-1">Total Credits</p>
                <p class="text-h6 font-weight-bold text-success">
                  {{ formatCurrency(financeStore.accountStatement.summary.total_credits) }}
                </p>
              </div>
            </VCol>
            <VCol cols="6" sm="3">
              <div class="text-center pa-3 rounded bg-grey-lighten-4">
                <p class="text-caption mb-1">Opening</p>
                <p class="text-h6 font-weight-bold">
                  {{ formatCurrency(financeStore.accountStatement.summary.opening_balance) }}
                </p>
              </div>
            </VCol>
            <VCol cols="6" sm="3">
              <div class="text-center pa-3 rounded" style="background: rgba(var(--v-theme-primary), 0.1)">
                <p class="text-caption mb-1">Closing</p>
                <p class="text-h6 font-weight-bold text-primary">
                  {{ formatCurrency(financeStore.accountStatement.summary.closing_balance) }}
                </p>
              </div>
            </VCol>
          </VRow>

          <!-- Entries Table -->
          <VTable density="compact" v-if="!financeStore.accountStatementLoading">
            <thead>
              <tr>
                <th>Date</th>
                <th>Batch ID</th>
                <th>Description</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in financeStore.accountStatement?.entries || []"
                :key="entry.entry_id"
              >
                <td class="text-caption">{{ formatDate(entry.created_at) }}</td>
                <td>
                  <RouterLink
                    :to="{ name: 'finance-transactions-id', params: { id: entry.batch_id } }"
                    class="text-primary text-decoration-none"
                    @click="statementDialog = false"
                  >
                    {{ entry.batch_id }}
                  </RouterLink>
                </td>
                <td class="text-truncate" style="max-width: 200px">{{ entry.description }}</td>
                <td class="text-error">
                  {{ entry.entry_type === 'DEBIT' ? formatCurrency(entry.amount) : '' }}
                </td>
                <td class="text-success">
                  {{ entry.entry_type === 'CREDIT' ? formatCurrency(entry.amount) : '' }}
                </td>
                <td class="font-weight-medium">{{ formatCurrency(entry.running_balance) }}</td>
              </tr>
              <tr v-if="!financeStore.accountStatement?.entries?.length">
                <td colspan="6" class="text-center text-medium-emphasis py-4">
                  No entries found for this period
                </td>
              </tr>
            </tbody>
          </VTable>
          <div v-else class="text-center py-8">
            <VProgressCircular indeterminate color="primary" />
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar" :color="snackbarColor" :timeout="5000">
      {{ snackbarMessage }}
    </VSnackbar>
  </div>
</template>
