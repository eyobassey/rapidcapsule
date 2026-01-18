
<script setup>
import moment from 'moment'

const props = defineProps({
  transactions: {
    type: Array,
    default: () => [],
  },
  earnings: {
    type: Object,
    default: () => ({
      totalEarnings: 0,
      totalWithdrawals: 0,
    }),
  },
})

const currentTab = ref(0)

// Compute filtered transactions based on tab
const filteredTransactions = computed(() => {
  if (!props.transactions) return []

  switch (currentTab.value) {
    case 0: // All
      return props.transactions
    case 1: // Incoming (Credit)
      return props.transactions.filter(txn => txn.type === 'CREDIT')
    case 2: // Outgoing (Debit)
      return props.transactions.filter(txn => txn.type === 'DEBIT')
    default:
      return props.transactions
  }
})

const formatDate = (date) => {
  return moment(date).format('DD/MM/YYYY')
}

const formatAmount = (amount) => {
  return `₦${amount?.toLocaleString() || '0'}`
}

const getTransactionColor = (type) => {
  return type === 'CREDIT' ? 'success' : 'error'
}
</script>

<template>
  <VRow>
    <VCol
      cols="12"
    >
      <VCard
        title=""
        class="mt-6 px-6 pt-4"
      >
        <VTabs
          v-model="currentTab"
          class="v-tabs-pillx"
        >
          <VTab>All</VTab>
          <VTab>Incoming</VTab>
          <VTab>Outgoing</VTab>
        </VTabs>

        <VWindow
          v-model="currentTab"
          class="mt-5"
        >
          <!--  ALL TABS -->
          <VWindowItem
            v-for="tab in 3"
            :key="tab"
          >
            <VTable
              v-if="filteredTransactions.length > 0"
              class="text-no-wrap"
            >
              <thead>
                <tr>
                  <th scope="col">
                    Date
                  </th>
                  <th scope="col">
                    Description
                  </th>
                  <th scope="col">
                    Type
                  </th>
                  <th scope="col">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="transaction in filteredTransactions"
                  :key="transaction._id"
                >
                  <td>
                    {{ formatDate(transaction.createdAt) }}
                  </td>

                  <td>
                    <span class="text-high-emphasis">{{ transaction.description || 'Transaction' }}</span>
                  </td>

                  <td>
                    <VChip
                      label
                      density="compact"
                      :color="getTransactionColor(transaction.type)"
                    >
                      {{ transaction.type }}
                    </VChip>
                  </td>

                  <td
                    class="text-medium-emphasis font-weight-medium"
                    :class="transaction.type === 'CREDIT' ? 'text-success' : 'text-error'"
                  >
                    {{ transaction.type === 'CREDIT' ? '+' : '-' }}{{ formatAmount(transaction.amount) }}
                  </td>
                </tr>
              </tbody>
            </VTable>
            <div
              v-else
              class="notAvailable"
            >
              <p>No transactions found</p>
            </div>
          </VWindowItem>
        </VWindow>
        <VDivider />
        <!-- 👉 project List table -->
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped lang="scss">
.notAvailable {
  padding: 18px;
  text-align: center;
}
</style>
