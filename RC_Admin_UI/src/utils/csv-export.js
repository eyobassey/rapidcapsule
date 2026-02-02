/**
 * CSV Export Utility
 * Provides functions to export data to CSV files
 */

/**
 * Convert a value to CSV-safe string
 * @param {any} value - The value to convert
 * @returns {string} - CSV-safe string
 */
const escapeCSV = (value) => {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // If the value contains comma, quote, or newline, wrap it in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Format currency for CSV (plain number)
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted number string
 */
const formatCurrencyForCSV = (amount) => {
  return (amount || 0).toFixed(2)
}

/**
 * Format date for CSV
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
const formatDateForCSV = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

/**
 * Download CSV file
 * @param {string} content - CSV content
 * @param {string} filename - Filename without extension
 */
const downloadCSV = (content, filename) => {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

/**
 * Export Chart of Accounts to CSV
 * @param {Array} accounts - Array of account objects
 */
export const exportAccountsToCSV = (accounts) => {
  const headers = ['Code', 'Name', 'Description', 'Type', 'Sub Type', 'Normal Balance', 'Current Balance', 'Active']

  const rows = accounts.map(account => [
    escapeCSV(account.code),
    escapeCSV(account.name),
    escapeCSV(account.description),
    escapeCSV(account.type),
    escapeCSV(account.sub_type),
    escapeCSV(account.normal_balance),
    formatCurrencyForCSV(account.current_balance),
    account.is_active ? 'Yes' : 'No'
  ])

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  downloadCSV(csv, 'chart_of_accounts')
}

/**
 * Export Transactions to CSV
 * @param {Array} transactions - Array of transaction objects
 */
export const exportTransactionsToCSV = (transactions) => {
  const headers = [
    'Batch ID', 'Category', 'Description', 'From User', 'To User',
    'Total Debits', 'Total Credits', 'Entry Count', 'Status', 'Created At', 'Posted At', 'Notes'
  ]

  const getUserName = (user) => {
    if (!user) return ''
    const profile = user.profile || {}
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email || ''
  }

  const rows = transactions.map(txn => [
    escapeCSV(txn.batch_id),
    escapeCSV(txn.category),
    escapeCSV(txn.description),
    escapeCSV(getUserName(txn.from_user)),
    escapeCSV(getUserName(txn.to_user)),
    formatCurrencyForCSV(txn.total_debits),
    formatCurrencyForCSV(txn.total_credits),
    txn.entry_count || 0,
    escapeCSV(txn.status),
    formatDateForCSV(txn.created_at),
    formatDateForCSV(txn.posted_at),
    escapeCSV(txn.notes)
  ])

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  downloadCSV(csv, 'transactions')
}

/**
 * Export Ledger Entries to CSV
 * @param {Array} entries - Array of ledger entry objects
 */
export const exportLedgerToCSV = (entries) => {
  const headers = [
    'Entry ID', 'Batch ID', 'Account Code', 'Entry Type', 'Amount',
    'Balance Before', 'Balance After', 'Description', 'Status', 'Created At'
  ]

  const rows = entries.map(entry => [
    escapeCSV(entry.entry_id),
    escapeCSV(entry.batch_id),
    escapeCSV(entry.account_code),
    escapeCSV(entry.entry_type),
    formatCurrencyForCSV(entry.amount),
    formatCurrencyForCSV(entry.balance_before),
    formatCurrencyForCSV(entry.balance_after),
    escapeCSV(entry.description),
    escapeCSV(entry.status),
    formatDateForCSV(entry.created_at)
  ])

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  downloadCSV(csv, 'ledger_entries')
}

/**
 * Export Wallets to CSV
 * @param {Array} wallets - Array of wallet objects
 */
export const exportWalletsToCSV = (wallets) => {
  const headers = [
    'Wallet ID', 'Owner Name', 'Owner Email', 'Owner Type',
    'Available Balance', 'Held Balance', 'Pending Balance', 'Total Balance',
    'Status', 'Total Credited', 'Total Debited', 'Transaction Count',
    'Last Transaction', 'Created At'
  ]

  const getOwnerName = (wallet) => {
    const owner = wallet.owner_id
    if (!owner) return ''
    const profile = owner.profile || {}
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || ''
  }

  const getOwnerEmail = (wallet) => {
    const owner = wallet.owner_id
    if (!owner) return ''
    return owner.profile?.contact?.email || owner.email || ''
  }

  const rows = wallets.map(wallet => [
    escapeCSV(wallet.wallet_id),
    escapeCSV(getOwnerName(wallet)),
    escapeCSV(getOwnerEmail(wallet)),
    escapeCSV(wallet.owner_type),
    formatCurrencyForCSV(wallet.available_balance),
    formatCurrencyForCSV(wallet.held_balance),
    formatCurrencyForCSV(wallet.pending_balance),
    formatCurrencyForCSV((wallet.available_balance || 0) + (wallet.held_balance || 0) + (wallet.pending_balance || 0)),
    escapeCSV(wallet.status),
    formatCurrencyForCSV(wallet.total_credited),
    formatCurrencyForCSV(wallet.total_debited),
    wallet.transaction_count || 0,
    formatDateForCSV(wallet.last_transaction_at),
    formatDateForCSV(wallet.created_at)
  ])

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  downloadCSV(csv, 'wallets')
}

/**
 * Export Trial Balance to CSV
 * @param {Object} trialBalance - Trial balance data
 */
export const exportTrialBalanceToCSV = (trialBalance) => {
  if (!trialBalance) return

  const headers = ['Code', 'Account Name', 'Type', 'Debit', 'Credit']

  const rows = (trialBalance.accounts || []).map(account => [
    escapeCSV(account.code),
    escapeCSV(account.name),
    escapeCSV(account.type),
    account.debit > 0 ? formatCurrencyForCSV(account.debit) : '',
    account.credit > 0 ? formatCurrencyForCSV(account.credit) : ''
  ])

  // Add totals row
  rows.push([
    '',
    'TOTALS',
    '',
    formatCurrencyForCSV(trialBalance.totals?.debits || 0),
    formatCurrencyForCSV(trialBalance.totals?.credits || 0)
  ])

  // Add balance status
  rows.push([])
  rows.push(['Balance Status:', trialBalance.totals?.is_balanced ? 'BALANCED' : 'NOT BALANCED'])
  rows.push(['Generated At:', formatDateForCSV(trialBalance.generated_at)])

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  downloadCSV(csv, 'trial_balance')
}

/**
 * Export Account Statement to CSV
 * @param {Object} statement - Account statement data
 * @param {Object} account - Account info
 */
export const exportAccountStatementToCSV = (statement, account) => {
  if (!statement) return

  const headers = ['Date', 'Batch ID', 'Description', 'Debit', 'Credit', 'Running Balance']

  const rows = (statement.entries || []).map(entry => [
    formatDateForCSV(entry.created_at),
    escapeCSV(entry.batch_id),
    escapeCSV(entry.description),
    entry.entry_type === 'DEBIT' ? formatCurrencyForCSV(entry.amount) : '',
    entry.entry_type === 'CREDIT' ? formatCurrencyForCSV(entry.amount) : '',
    formatCurrencyForCSV(entry.running_balance)
  ])

  // Add summary
  rows.push([])
  rows.push(['Summary'])
  rows.push(['Opening Balance:', formatCurrencyForCSV(statement.summary?.opening_balance)])
  rows.push(['Total Debits:', formatCurrencyForCSV(statement.summary?.total_debits)])
  rows.push(['Total Credits:', formatCurrencyForCSV(statement.summary?.total_credits)])
  rows.push(['Closing Balance:', formatCurrencyForCSV(statement.summary?.closing_balance)])

  const accountName = account ? `${account.code}_${account.name.replace(/[^a-zA-Z0-9]/g, '_')}` : 'account'
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  downloadCSV(csv, `statement_${accountName}`)
}

/**
 * Export Reconciliation Report to CSV
 * @param {Object} report - Reconciliation report data
 */
export const exportReconciliationToCSV = (report) => {
  if (!report) return

  const rows = [
    ['Wallet Reconciliation Report'],
    ['Generated At:', formatDateForCSV(report.generated_at)],
    ['Overall Status:', report.is_fully_reconciled ? 'FULLY RECONCILED' : 'DISCREPANCIES FOUND'],
    [],
    ['Owner Type', 'Wallet Count', 'Available', 'Held', 'Pending', 'Total in Wallets', 'Liability Account', 'Liability Balance', 'Difference', 'Reconciled']
  ]

  ;(report.reconciliation || []).forEach(recon => {
    rows.push([
      escapeCSV(recon.owner_type),
      recon.wallet_count || 0,
      formatCurrencyForCSV(recon.wallet_balances?.available),
      formatCurrencyForCSV(recon.wallet_balances?.held),
      formatCurrencyForCSV(recon.wallet_balances?.pending),
      formatCurrencyForCSV(recon.wallet_balances?.total),
      escapeCSV(recon.liability_account?.code),
      formatCurrencyForCSV(recon.liability_account?.balance),
      formatCurrencyForCSV(recon.difference),
      recon.is_reconciled ? 'Yes' : 'No'
    ])
  })

  const csv = rows.map(row => row.join(',')).join('\n')
  downloadCSV(csv, 'reconciliation_report')
}

/**
 * Export Revenue Report to CSV
 * @param {Object} report - Revenue report data
 */
export const exportRevenueReportToCSV = (report) => {
  if (!report) return

  const rows = [
    ['Revenue Report'],
    ['Period:', `${report.period?.start || ''} to ${report.period?.end || ''}`],
    ['Total Revenue:', formatCurrencyForCSV(report.total_revenue)],
    [],
    ['Daily Revenue'],
    ['Date', 'Transaction Count', 'Total']
  ]

  ;(report.daily || []).forEach(day => {
    rows.push([
      escapeCSV(day._id),
      day.count || 0,
      formatCurrencyForCSV(day.total)
    ])
  })

  rows.push([])
  rows.push(['Revenue by Category'])
  rows.push(['Category', 'Transaction Count', 'Total'])

  ;(report.by_category || []).forEach(cat => {
    rows.push([
      escapeCSV(cat._id),
      cat.count || 0,
      formatCurrencyForCSV(cat.total)
    ])
  })

  rows.push([])
  rows.push(['Revenue Accounts'])
  rows.push(['Code', 'Name', 'Balance'])

  ;(report.revenue_accounts || []).forEach(account => {
    rows.push([
      escapeCSV(account.code),
      escapeCSV(account.name),
      formatCurrencyForCSV(account.balance)
    ])
  })

  const csv = rows.map(row => row.join(',')).join('\n')
  downloadCSV(csv, 'revenue_report')
}

/**
 * Export Wallet Transactions to CSV (for individual wallet)
 * @param {Array} transactions - Array of transaction objects
 * @param {string} walletId - Wallet ID for filename
 */
export const exportWalletTransactionsToCSV = (transactions, walletId) => {
  const headers = ['Batch ID', 'Category', 'Amount', 'Status', 'Created At']

  const rows = transactions.map(txn => [
    escapeCSV(txn.batch_id),
    escapeCSV(txn.category),
    formatCurrencyForCSV(txn.total_debits),
    escapeCSV(txn.status),
    formatDateForCSV(txn.created_at)
  ])

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  downloadCSV(csv, `wallet_transactions_${walletId}`)
}

export default {
  exportAccountsToCSV,
  exportTransactionsToCSV,
  exportLedgerToCSV,
  exportWalletsToCSV,
  exportTrialBalanceToCSV,
  exportAccountStatementToCSV,
  exportReconciliationToCSV,
  exportRevenueReportToCSV,
  exportWalletTransactionsToCSV
}
