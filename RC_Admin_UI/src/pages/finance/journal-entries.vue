<script setup>
import { useFinanceStore } from '@/stores/finance'

const financeStore = useFinanceStore()
const loading = ref(false)
const submitting = ref(false)
const accounts = ref([])
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Journal Entry Form
const journalForm = reactive({
  description: '',
  category: 'ADJUSTMENT',
  notes: '',
  entries: [
    { account_code: '', entry_type: 'DEBIT', amount: null, description: '' },
    { account_code: '', entry_type: 'CREDIT', amount: null, description: '' },
  ],
})

// Fund Operating Account Form
const fundDialog = ref(false)
const fundForm = reactive({
  amount: null,
  source: 'BANK_TRANSFER',
  description: '',
  notes: '',
})

const categories = [
  { title: 'Adjustment', value: 'ADJUSTMENT' },
  { title: 'Fee Collection', value: 'FEE_COLLECTION' },
  { title: 'Commission Collection', value: 'COMMISSION_COLLECTION' },
  { title: 'Refund', value: 'REFUND' },
  { title: 'Reversal', value: 'REVERSAL' },
]

const entryTypes = [
  { title: 'DEBIT', value: 'DEBIT' },
  { title: 'CREDIT', value: 'CREDIT' },
]

const fundingSources = [
  { title: 'Bank Transfer', value: 'BANK_TRANSFER', description: 'Transfer from company bank account' },
  { title: 'Retained Earnings', value: 'RETAINED_EARNINGS', description: 'From accumulated profits' },
  { title: 'Capital Injection', value: 'CAPITAL_INJECTION', description: 'New capital from owners' },
]

const fetchAccounts = async () => {
  loading.value = true
  await financeStore.fetchAccounts()
  accounts.value = financeStore.accounts
  loading.value = false
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount || 0)
}

const addEntry = () => {
  journalForm.entries.push({ account_code: '', entry_type: 'DEBIT', amount: null, description: '' })
}

const removeEntry = (index) => {
  if (journalForm.entries.length > 2) {
    journalForm.entries.splice(index, 1)
  }
}

const totalDebits = computed(() => {
  return journalForm.entries
    .filter(e => e.entry_type === 'DEBIT')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
})

const totalCredits = computed(() => {
  return journalForm.entries
    .filter(e => e.entry_type === 'CREDIT')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
})

const isBalanced = computed(() => {
  return Math.abs(totalDebits.value - totalCredits.value) < 0.01
})

const canSubmit = computed(() => {
  return (
    journalForm.description &&
    journalForm.entries.every(e => e.account_code && e.amount > 0) &&
    isBalanced.value
  )
})

const getAccountLabel = (code) => {
  const account = accounts.value.find(a => a.code === code)
  return account ? `${account.code} - ${account.name}` : code
}

const submitJournalEntry = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  try {
    const result = await financeStore.createJournalEntry({
      description: journalForm.description,
      category: journalForm.category,
      notes: journalForm.notes,
      entries: journalForm.entries.map(e => ({
        account_code: e.account_code,
        entry_type: e.entry_type,
        amount: e.amount,
        description: e.description || undefined,
      })),
    })

    snackbarMessage.value = `Journal entry ${result.batch_id} created successfully`
    snackbarColor.value = 'success'
    snackbar.value = true

    // Reset form
    journalForm.description = ''
    journalForm.notes = ''
    journalForm.entries = [
      { account_code: '', entry_type: 'DEBIT', amount: null, description: '' },
      { account_code: '', entry_type: 'CREDIT', amount: null, description: '' },
    ]

    // Refresh accounts to show updated balances
    fetchAccounts()
  } catch (error) {
    snackbarMessage.value = error.response?.data?.message || 'Failed to create journal entry'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    submitting.value = false
  }
}

const openFundDialog = () => {
  fundForm.amount = null
  fundForm.source = 'BANK_TRANSFER'
  fundForm.description = ''
  fundForm.notes = ''
  fundDialog.value = true
}

const submitFundOperatingAccount = async () => {
  if (!fundForm.amount || !fundForm.source) return

  submitting.value = true
  try {
    const result = await financeStore.fundOperatingAccount({
      amount: fundForm.amount,
      source: fundForm.source,
      description: fundForm.description || `Fund Operating Account from ${fundForm.source}`,
      notes: fundForm.notes,
    })

    snackbarMessage.value = `Operating account funded. Batch: ${result.batch_id}`
    snackbarColor.value = 'success'
    snackbar.value = true
    fundDialog.value = false

    // Refresh accounts
    fetchAccounts()
  } catch (error) {
    snackbarMessage.value = error.response?.data?.message || 'Failed to fund operating account'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    submitting.value = false
  }
}

// Group accounts by type for easier selection (flat list with subheaders for VSelect)
const groupedAccounts = computed(() => {
  const groups = {
    ASSET: { title: 'Assets', items: [] },
    LIABILITY: { title: 'Liabilities', items: [] },
    EQUITY: { title: 'Equity', items: [] },
    REVENUE: { title: 'Revenue', items: [] },
    EXPENSE: { title: 'Expenses', items: [] },
  }

  accounts.value.forEach(account => {
    if (groups[account.type]) {
      groups[account.type].items.push({
        title: `${account.code} - ${account.name}`,
        value: account.code,
        subtitle: `Balance: ${formatCurrency(account.current_balance)}`,
      })
    }
  })

  // Flatten into array with subheaders for VSelect
  const result = []
  Object.entries(groups).forEach(([type, group]) => {
    if (group.items.length > 0) {
      // Add subheader
      result.push({ type: 'subheader', title: group.title })
      // Add items
      result.push(...group.items)
    }
  })

  return result
})

onMounted(() => {
  fetchAccounts()
})
</script>

<template>
  <div>
    <h2 class="text-h5 mb-6">
      <span style="color: #9b9b9b">Finance /</span> Journal Entries
    </h2>

    <VRow>
      <!-- Main Form -->
      <VCol cols="12" lg="8">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>Create Manual Journal Entry</span>
            <VBtn color="primary" variant="outlined" size="small" @click="openFundDialog">
              <VIcon start icon="mdi-bank-plus" />
              Fund Operating Account
            </VBtn>
          </VCardTitle>

          <VCardText>
            <VAlert type="info" variant="tonal" class="mb-4">
              Manual journal entries must be balanced (Total Debits = Total Credits).
              Use this for adjustments, corrections, and recording transactions not handled automatically.
            </VAlert>

            <VTextField
              v-model="journalForm.description"
              label="Description *"
              placeholder="e.g., Record SMS expenses for January 2026"
              class="mb-4"
            />

            <VRow class="mb-4">
              <VCol cols="12" sm="6">
                <VSelect
                  v-model="journalForm.category"
                  :items="categories"
                  label="Category"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="journalForm.notes"
                  label="Notes (Optional)"
                />
              </VCol>
            </VRow>

            <div class="text-subtitle-1 font-weight-medium mb-2">Entry Lines</div>

            <VTable density="compact" class="mb-4">
              <thead>
                <tr>
                  <th style="width: 40%">Account</th>
                  <th style="width: 15%">Type</th>
                  <th style="width: 20%">Amount</th>
                  <th style="width: 20%">Description</th>
                  <th style="width: 5%"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, index) in journalForm.entries" :key="index">
                  <td>
                    <VSelect
                      v-model="entry.account_code"
                      :items="groupedAccounts"
                      item-title="title"
                      item-value="value"
                      density="compact"
                      placeholder="Select account"
                      hide-details
                    >
                      <template #item="{ props, item }">
                        <VListItem v-bind="props">
                          <template #subtitle>
                            {{ item.raw.subtitle }}
                          </template>
                        </VListItem>
                      </template>
                    </VSelect>
                  </td>
                  <td>
                    <VSelect
                      v-model="entry.entry_type"
                      :items="entryTypes"
                      density="compact"
                      hide-details
                    />
                  </td>
                  <td>
                    <VTextField
                      v-model.number="entry.amount"
                      type="number"
                      prefix="₦"
                      density="compact"
                      hide-details
                    />
                  </td>
                  <td>
                    <VTextField
                      v-model="entry.description"
                      density="compact"
                      placeholder="Optional"
                      hide-details
                    />
                  </td>
                  <td>
                    <VBtn
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      :disabled="journalForm.entries.length <= 2"
                      @click="removeEntry(index)"
                    />
                  </td>
                </tr>
              </tbody>
            </VTable>

            <VBtn variant="outlined" size="small" class="mb-4" @click="addEntry">
              <VIcon start icon="mdi-plus" />
              Add Line
            </VBtn>

            <!-- Balance Summary -->
            <VCard variant="outlined" class="mb-4">
              <VCardText>
                <VRow>
                  <VCol cols="4" class="text-center">
                    <div class="text-caption text-medium-emphasis">Total Debits</div>
                    <div class="text-h6 text-success">{{ formatCurrency(totalDebits) }}</div>
                  </VCol>
                  <VCol cols="4" class="text-center">
                    <div class="text-caption text-medium-emphasis">Total Credits</div>
                    <div class="text-h6 text-error">{{ formatCurrency(totalCredits) }}</div>
                  </VCol>
                  <VCol cols="4" class="text-center">
                    <div class="text-caption text-medium-emphasis">Difference</div>
                    <div :class="['text-h6', isBalanced ? 'text-success' : 'text-error']">
                      {{ formatCurrency(Math.abs(totalDebits - totalCredits)) }}
                      <VIcon
                        v-if="isBalanced"
                        icon="mdi-check-circle"
                        color="success"
                        size="small"
                        class="ml-1"
                      />
                    </div>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>

            <VBtn
              color="primary"
              size="large"
              :disabled="!canSubmit"
              :loading="submitting"
              @click="submitJournalEntry"
            >
              <VIcon start icon="mdi-check" />
              Post Journal Entry
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Quick Reference -->
      <VCol cols="12" lg="4">
        <VCard>
          <VCardTitle>Quick Reference</VCardTitle>
          <VCardText>
            <div class="text-subtitle-2 font-weight-medium mb-2">Common Entries</div>

            <VList density="compact">
              <VListItem>
                <template #prepend>
                  <VIcon icon="mdi-arrow-right" color="primary" size="small" />
                </template>
                <VListItemTitle class="text-body-2">Record Expense</VListItemTitle>
                <VListItemSubtitle>
                  DR: Expense account<br>
                  CR: Cash/Bank/Payable
                </VListItemSubtitle>
              </VListItem>

              <VListItem>
                <template #prepend>
                  <VIcon icon="mdi-arrow-right" color="primary" size="small" />
                </template>
                <VListItemTitle class="text-body-2">Record Revenue</VListItemTitle>
                <VListItemSubtitle>
                  DR: Cash/Receivable<br>
                  CR: Revenue account
                </VListItemSubtitle>
              </VListItem>

              <VListItem>
                <template #prepend>
                  <VIcon icon="mdi-arrow-right" color="primary" size="small" />
                </template>
                <VListItemTitle class="text-body-2">Transfer Between Accounts</VListItemTitle>
                <VListItemSubtitle>
                  DR: Destination account<br>
                  CR: Source account
                </VListItemSubtitle>
              </VListItem>

              <VListItem>
                <template #prepend>
                  <VIcon icon="mdi-arrow-right" color="primary" size="small" />
                </template>
                <VListItemTitle class="text-body-2">Pay Payable</VListItemTitle>
                <VListItemSubtitle>
                  DR: Payable (reduce liability)<br>
                  CR: Cash/Bank
                </VListItemSubtitle>
              </VListItem>
            </VList>

            <VDivider class="my-4" />

            <div class="text-subtitle-2 font-weight-medium mb-2">Account Types</div>
            <VChipGroup>
              <VChip size="small" color="primary">Assets: DR+</VChip>
              <VChip size="small" color="warning">Liabilities: CR+</VChip>
              <VChip size="small" color="info">Equity: CR+</VChip>
              <VChip size="small" color="success">Revenue: CR+</VChip>
              <VChip size="small" color="error">Expenses: DR+</VChip>
            </VChipGroup>
          </VCardText>
        </VCard>

        <!-- Platform Operating Fund Status -->
        <VCard class="mt-4">
          <VCardTitle>Platform Operating Fund</VCardTitle>
          <VCardText>
            <div class="text-h4 text-primary mb-2">
              {{ formatCurrency(accounts.find(a => a.code === '1300.003.001')?.current_balance || 0) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Available for admin wallet credits and platform operations
            </div>
            <VBtn
              color="primary"
              variant="tonal"
              size="small"
              class="mt-3"
              @click="openFundDialog"
            >
              <VIcon start icon="mdi-plus" />
              Add Funds
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Fund Operating Account Dialog -->
    <VDialog v-model="fundDialog" max-width="500">
      <VCard>
        <VCardTitle>Fund Platform Operating Account</VCardTitle>
        <VCardText>
          <VAlert type="info" variant="tonal" class="mb-4">
            Add funds to the Platform Operating Account to enable admin wallet credits.
          </VAlert>

          <VTextField
            v-model.number="fundForm.amount"
            label="Amount (NGN) *"
            type="number"
            prefix="₦"
            class="mb-4"
          />

          <VSelect
            v-model="fundForm.source"
            :items="fundingSources"
            item-title="title"
            item-value="value"
            label="Funding Source *"
            class="mb-4"
          >
            <template #item="{ props, item }">
              <VListItem v-bind="props">
                <template #subtitle>
                  {{ item.raw.description }}
                </template>
              </VListItem>
            </template>
          </VSelect>

          <VTextField
            v-model="fundForm.description"
            label="Description"
            class="mb-4"
          />

          <VTextarea
            v-model="fundForm.notes"
            label="Notes (Optional)"
            rows="2"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="fundDialog = false">Cancel</VBtn>
          <VBtn
            color="primary"
            :disabled="!fundForm.amount || !fundForm.source"
            :loading="submitting"
            @click="submitFundOperatingAccount"
          >
            Fund Account
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar" :color="snackbarColor" :timeout="5000">
      {{ snackbarMessage }}
    </VSnackbar>
  </div>
</template>
