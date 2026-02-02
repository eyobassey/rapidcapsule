import axios from '@axios'
import { defineStore } from 'pinia'

const apiBaseURl = import.meta.env.VITE_API_BASE_URL

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    // Dashboard
    dashboardMetrics: null,
    dashboardLoading: false,

    // Wallets
    wallets: [],
    walletsTotal: 0,
    walletsPagination: null,
    walletsLoading: false,
    currentWallet: null,
    currentWalletLoading: false,

    // Transactions
    transactions: [],
    transactionsTotal: 0,
    transactionsPagination: null,
    transactionsLoading: false,
    currentTransaction: null,
    currentTransactionLoading: false,

    // Ledger
    ledgerEntries: [],
    ledgerTotal: 0,
    ledgerPagination: null,
    ledgerLoading: false,

    // Accounts
    accounts: [],
    accountsLoading: false,
    accountStatement: null,
    accountStatementLoading: false,

    // Reports
    trialBalance: null,
    trialBalanceLoading: false,
    revenueReport: null,
    revenueReportLoading: false,
    reconciliationReport: null,
    reconciliationLoading: false,
  }),

  getters: {
    walletsByType: (state) => {
      if (!state.dashboardMetrics?.summary?.wallets_by_type) return {}
      return state.dashboardMetrics.summary.wallets_by_type
    },

    totalBalance: (state) => {
      return state.dashboardMetrics?.summary?.total_balance || 0
    },

    recentTransactions: (state) => {
      return state.dashboardMetrics?.transactions?.recent || []
    },

    transactionVolume: (state) => {
      return state.dashboardMetrics?.transactions?.volume_30d || []
    },

    accountBalances: (state) => {
      return state.dashboardMetrics?.accounts?.balances || []
    },

    isTrialBalanced: (state) => {
      return state.trialBalance?.totals?.is_balanced || false
    },

    isReconciled: (state) => {
      return state.reconciliationReport?.is_fully_reconciled || false
    },
  },

  actions: {
    // ==================== DASHBOARD ====================

    async fetchDashboardMetrics() {
      this.dashboardLoading = true
      try {
        const response = await axios.get(`${apiBaseURl}/finance/dashboard`)
        if (response.status === 200) {
          this.dashboardMetrics = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error)
        return null
      } finally {
        this.dashboardLoading = false
      }
    },

    // ==================== WALLETS ====================

    async fetchWallets(filters = {}) {
      this.walletsLoading = true
      try {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value)
          }
        })

        const response = await axios.get(`${apiBaseURl}/finance/wallets?${params.toString()}`)
        if (response.status === 200) {
          const result = response.data.data
          this.wallets = result.data
          this.walletsPagination = result.pagination
          this.walletsTotal = result.pagination?.total || 0
          return result
        }
        return null
      } catch (error) {
        console.error('Error fetching wallets:', error)
        return null
      } finally {
        this.walletsLoading = false
      }
    },

    async fetchWallet(walletId) {
      this.currentWalletLoading = true
      try {
        const response = await axios.get(`${apiBaseURl}/finance/wallets/${walletId}`)
        if (response.status === 200) {
          this.currentWallet = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching wallet:', error)
        return null
      } finally {
        this.currentWalletLoading = false
      }
    },

    async fetchWalletByUser(userId, ownerType) {
      this.currentWalletLoading = true
      try {
        const response = await axios.get(
          `${apiBaseURl}/finance/wallets/user/${userId}?owner_type=${ownerType}`
        )
        if (response.status === 200) {
          this.currentWallet = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching wallet by user:', error)
        return null
      } finally {
        this.currentWalletLoading = false
      }
    },

    async updateWalletStatus(walletId, status, reason) {
      try {
        const response = await axios.patch(`${apiBaseURl}/finance/wallets/${walletId}/status`, {
          status,
          reason,
        })
        if (response.status === 200) {
          // Refresh current wallet if it's the one being updated
          if (this.currentWallet?.wallet?.wallet_id === walletId) {
            await this.fetchWallet(walletId)
          }
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error updating wallet status:', error)
        throw error
      }
    },

    async creditWallet(walletId, amount, reason, notes = '', source = 'OPERATING_FUND') {
      try {
        const response = await axios.post(`${apiBaseURl}/finance/wallets/credit`, {
          wallet_id: walletId,
          amount,
          reason,
          notes,
          source,
        })
        if (response.status === 200 || response.status === 201) {
          // Refresh current wallet
          if (this.currentWallet?.wallet?.wallet_id === walletId) {
            await this.fetchWallet(walletId)
          }
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error crediting wallet:', error)
        throw error
      }
    },

    async debitWallet(walletId, amount, reason, notes = '', destination = 'OPERATING_FUND') {
      try {
        const response = await axios.post(`${apiBaseURl}/finance/wallets/debit`, {
          wallet_id: walletId,
          amount,
          reason,
          notes,
          destination,
        })
        if (response.status === 200 || response.status === 201) {
          // Refresh current wallet
          if (this.currentWallet?.wallet?.wallet_id === walletId) {
            await this.fetchWallet(walletId)
          }
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error debiting wallet:', error)
        throw error
      }
    },

    // ==================== TRANSACTIONS ====================

    async fetchTransactions(filters = {}) {
      this.transactionsLoading = true
      try {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value)
          }
        })

        const response = await axios.get(`${apiBaseURl}/finance/transactions?${params.toString()}`)
        if (response.status === 200) {
          const result = response.data.data
          this.transactions = result.data
          this.transactionsPagination = result.pagination
          this.transactionsTotal = result.pagination?.total || 0
          return result
        }
        return null
      } catch (error) {
        console.error('Error fetching transactions:', error)
        return null
      } finally {
        this.transactionsLoading = false
      }
    },

    async fetchTransaction(batchId) {
      this.currentTransactionLoading = true
      try {
        const response = await axios.get(`${apiBaseURl}/finance/transactions/${batchId}`)
        if (response.status === 200) {
          this.currentTransaction = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching transaction:', error)
        return null
      } finally {
        this.currentTransactionLoading = false
      }
    },

    // ==================== LEDGER ====================

    async fetchLedgerEntries(filters = {}) {
      this.ledgerLoading = true
      try {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value)
          }
        })

        const response = await axios.get(`${apiBaseURl}/finance/ledger?${params.toString()}`)
        if (response.status === 200) {
          const result = response.data.data
          this.ledgerEntries = result.data
          this.ledgerPagination = result.pagination
          this.ledgerTotal = result.pagination?.total || 0
          return result
        }
        return null
      } catch (error) {
        console.error('Error fetching ledger entries:', error)
        return null
      } finally {
        this.ledgerLoading = false
      }
    },

    // ==================== ACCOUNTS ====================

    async fetchAccounts() {
      this.accountsLoading = true
      try {
        const response = await axios.get(`${apiBaseURl}/finance/accounts`)
        if (response.status === 200) {
          this.accounts = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching accounts:', error)
        return null
      } finally {
        this.accountsLoading = false
      }
    },

    async fetchAccountStatement(code, filters = {}) {
      this.accountStatementLoading = true
      try {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value)
          }
        })

        const response = await axios.get(
          `${apiBaseURl}/finance/accounts/${code}/statement?${params.toString()}`
        )
        if (response.status === 200) {
          this.accountStatement = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching account statement:', error)
        return null
      } finally {
        this.accountStatementLoading = false
      }
    },

    async createAccount(dto) {
      try {
        const response = await axios.post(`${apiBaseURl}/finance/accounts`, dto)
        if (response.status === 200 || response.status === 201) {
          // Refresh accounts list
          await this.fetchAccounts()
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error creating account:', error)
        throw error
      }
    },

    async updateAccount(code, dto) {
      try {
        const response = await axios.patch(`${apiBaseURl}/finance/accounts/${code}`, dto)
        if (response.status === 200) {
          // Refresh accounts list
          await this.fetchAccounts()
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error updating account:', error)
        throw error
      }
    },

    async deleteAccount(code) {
      try {
        const response = await axios.delete(`${apiBaseURl}/finance/accounts/${code}`)
        if (response.status === 200) {
          // Refresh accounts list
          await this.fetchAccounts()
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error deleting account:', error)
        throw error
      }
    },

    // ==================== REPORTS ====================

    async fetchTrialBalance() {
      this.trialBalanceLoading = true
      try {
        const response = await axios.get(`${apiBaseURl}/finance/reports/trial-balance`)
        if (response.status === 200) {
          this.trialBalance = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching trial balance:', error)
        return null
      } finally {
        this.trialBalanceLoading = false
      }
    },

    async fetchRevenueReport(filters = {}) {
      this.revenueReportLoading = true
      try {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value)
          }
        })

        const response = await axios.get(
          `${apiBaseURl}/finance/reports/revenue?${params.toString()}`
        )
        if (response.status === 200) {
          this.revenueReport = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching revenue report:', error)
        return null
      } finally {
        this.revenueReportLoading = false
      }
    },

    async fetchReconciliationReport() {
      this.reconciliationLoading = true
      try {
        const response = await axios.get(`${apiBaseURl}/finance/reports/reconciliation`)
        if (response.status === 200) {
          this.reconciliationReport = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching reconciliation report:', error)
        return null
      } finally {
        this.reconciliationLoading = false
      }
    },

    // ==================== JOURNAL ENTRIES ====================

    async createJournalEntry(dto) {
      try {
        const response = await axios.post(`${apiBaseURl}/finance/journal-entry`, dto)
        if (response.status === 200 || response.status === 201) {
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error creating journal entry:', error)
        throw error
      }
    },

    async fundOperatingAccount(dto) {
      try {
        const response = await axios.post(`${apiBaseURl}/finance/fund-operating-account`, dto)
        if (response.status === 200 || response.status === 201) {
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error funding operating account:', error)
        throw error
      }
    },

    // ==================== HELPERS ====================

    formatCurrency(amount, currency = 'NGN') {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(amount || 0)
    },

    clearCurrentWallet() {
      this.currentWallet = null
    },

    clearCurrentTransaction() {
      this.currentTransaction = null
    },
  },
})
