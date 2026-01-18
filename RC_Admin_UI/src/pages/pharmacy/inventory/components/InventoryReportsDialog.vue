<script setup>
import { ref, computed, watch } from 'vue'
import html2pdf from 'html2pdf.js'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import StockValuationReport from './reports/StockValuationReport.vue'
import ExpiryBatchReport from './reports/ExpiryBatchReport.vue'
import TransactionReport from './reports/TransactionReport.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const API_BASE = '/admin-api/pharmacy'

// Get auth headers
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Authorization': `Bearer ${token.access_token}`,
    'Content-Type': 'application/json',
  }
}

// Dialog visibility
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// State
const activeTab = ref('stock')
const loading = ref(false)
const exporting = ref(false)
const dateMenuOpen = ref(false)

// Report data
const stockReport = ref(null)
const expiryReport = ref(null)
const transactionReport = ref(null)

// Filters - dateRange is now an object with start and end for v-calendar range mode
const dateRange = ref({ start: null, end: null })
const selectedCategory = ref(null)
const selectedSupplier = ref(null)
const selectedManufacturer = ref(null)

// Filter options
const categories = ref([])
const suppliers = ref([])
const manufacturers = ref([])

// Computed date range label
const dateRangeLabel = computed(() => {
  if (!dateRange.value?.start) return 'All Time'
  const start = new Date(dateRange.value.start).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
  if (!dateRange.value?.end || dateRange.value.start === dateRange.value.end) {
    return start
  }
  const end = new Date(dateRange.value.end).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
  return `${start} - ${end}`
})

// Fetch filter options when dialog opens
watch(dialogVisible, async (visible) => {
  if (visible && categories.value.length === 0) {
    await fetchFilterOptions()
  }
})

// Fetch categories, suppliers, and manufacturers
const fetchFilterOptions = async () => {
  try {
    const [catRes, supRes, mfgRes] = await Promise.all([
      fetch(`${API_BASE}/categories`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/suppliers?limit=100`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/reports/manufacturers`, { headers: getAuthHeaders() }),
    ])

    if (catRes.ok) {
      const catData = await catRes.json()
      // Categories endpoint returns array directly in result
      const cats = catData.result || catData.data || []
      categories.value = Array.isArray(cats) ? cats.map(c => ({ title: c.name, value: c._id })) : []
    }

    if (supRes.ok) {
      const supData = await supRes.json()
      // Suppliers endpoint returns { suppliers, total, totalPages } in result
      const result = supData.result || supData.data || {}
      const sups = result.suppliers || (Array.isArray(result) ? result : [])
      suppliers.value = sups.map(s => ({ title: s.name, value: s._id }))
    }

    if (mfgRes.ok) {
      const mfgData = await mfgRes.json()
      // Manufacturers endpoint returns array of { _id, name }
      const mfgs = mfgData.result || mfgData.data || []
      manufacturers.value = Array.isArray(mfgs) ? mfgs.map(m => ({ title: m.name, value: m._id })) : []
    }
  } catch (error) {
    console.error('Error fetching filter options:', error)
  }
}

// Build query params
const buildQueryParams = () => {
  const params = new URLSearchParams()

  if (dateRange.value?.start) {
    params.append('start_date', new Date(dateRange.value.start).toISOString().split('T')[0])
  }
  if (dateRange.value?.end) {
    params.append('end_date', new Date(dateRange.value.end).toISOString().split('T')[0])
  }
  if (selectedCategory.value) {
    params.append('category_id', selectedCategory.value)
  }
  if (selectedSupplier.value) {
    params.append('supplier_id', selectedSupplier.value)
  }
  if (selectedManufacturer.value) {
    params.append('manufacturer', selectedManufacturer.value)
  }

  return params.toString()
}

// Generate report
const generateReport = async () => {
  loading.value = true
  const queryString = buildQueryParams()

  try {
    switch (activeTab.value) {
      case 'stock':
        await fetchStockValuationReport(queryString)
        break
      case 'expiry':
        await fetchExpiryBatchReport(queryString)
        break
      case 'transactions':
        await fetchTransactionReport(queryString)
        break
    }
  } catch (error) {
    console.error('Error generating report:', error)
  } finally {
    loading.value = false
  }
}

// Fetch stock valuation report
const fetchStockValuationReport = async (queryString) => {
  const response = await fetch(
    `${API_BASE}/reports/stock-valuation${queryString ? '?' + queryString : ''}`,
    { headers: getAuthHeaders() }
  )

  if (response.ok) {
    const data = await response.json()
    stockReport.value = data.result || data.data
  } else {
    console.error('Failed to fetch stock valuation report')
    stockReport.value = null
  }
}

// Fetch expiry batch report
const fetchExpiryBatchReport = async (queryString) => {
  const response = await fetch(
    `${API_BASE}/reports/expiry-batch${queryString ? '?' + queryString : ''}`,
    { headers: getAuthHeaders() }
  )

  if (response.ok) {
    const data = await response.json()
    expiryReport.value = data.result || data.data
  } else {
    console.error('Failed to fetch expiry batch report')
    expiryReport.value = null
  }
}

// Fetch transaction report
const fetchTransactionReport = async (queryString) => {
  const response = await fetch(
    `${API_BASE}/reports/transactions${queryString ? '?' + queryString : ''}`,
    { headers: getAuthHeaders() }
  )

  if (response.ok) {
    const data = await response.json()
    transactionReport.value = data.result || data.data
  } else {
    console.error('Failed to fetch transaction report')
    transactionReport.value = null
  }
}

// Export to PDF
const exportToPDF = async () => {
  const reportId = {
    stock: 'stock-valuation-report',
    expiry: 'expiry-batch-report',
    transactions: 'transaction-report',
  }[activeTab.value]

  const reportTitle = {
    stock: 'Stock Valuation Report',
    expiry: 'Expiry and Batch Report',
    transactions: 'Transaction Report',
  }[activeTab.value]

  const element = document.getElementById(reportId)
  if (!element) {
    console.error('Report element not found')
    return
  }

  exporting.value = true

  const options = {
    margin: [10, 10, 10, 10],
    filename: `inventory-${activeTab.value}-report-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
  }

  try {
    await html2pdf().set(options).from(element).save()
  } catch (error) {
    console.error('Error exporting PDF:', error)
  } finally {
    exporting.value = false
  }
}

// Print report
const printReport = () => {
  const reportTitle = {
    stock: 'Stock Valuation Report',
    expiry: 'Expiry and Batch Report',
    transactions: 'Transaction Report',
  }[activeTab.value]

  const currentReport = {
    stock: stockReport.value,
    expiry: expiryReport.value,
    transactions: transactionReport.value,
  }[activeTab.value]

  if (!currentReport) {
    alert('Please generate a report first')
    return
  }

  // Generate print content based on active tab
  let printContent = generatePrintContent(activeTab.value, currentReport, reportTitle)

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}

// Generate print content
const generatePrintContent = (tab, data, title) => {
  const formatCurrency = (val) => {
    if (!val) return '₦0.00'
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val)
  }
  const formatNumber = (val) => val ? new Intl.NumberFormat('en-NG').format(val) : '0'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NG') : 'N/A'

  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - ${new Date().toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0; color: #666; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
        .summary-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 4px; }
        .summary-card .value { font-size: 20px; font-weight: bold; }
        .summary-card .label { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .section { margin: 20px 0; }
        .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
        .critical { background: #ffebee; }
        .success { color: #4caf50; }
        .error { color: #f44336; }
        @media print {
          .no-print { display: none; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
  `

  if (tab === 'stock' && data.summary) {
    content += `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="value">${formatNumber(data.summary.total_products)}</div>
          <div class="label">Total Products</div>
        </div>
        <div class="summary-card">
          <div class="value">${formatNumber(data.summary.total_stock_units)}</div>
          <div class="label">Total Units</div>
        </div>
        <div class="summary-card">
          <div class="value">${formatCurrency(data.summary.total_cost_value)}</div>
          <div class="label">Cost Value</div>
        </div>
        <div class="summary-card">
          <div class="value">${formatCurrency(data.summary.total_retail_value)}</div>
          <div class="label">Retail Value</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Product Details</div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Code</th>
              <th>Category</th>
              <th class="text-right">Units</th>
              <th class="text-right">Avg Cost</th>
              <th class="text-right">Total Value</th>
              <th class="text-right">Margin %</th>
            </tr>
          </thead>
          <tbody>
            ${data.products?.map(p => `
              <tr>
                <td>${p.drug_name}</td>
                <td>${p.drug_code}</td>
                <td>${p.category}</td>
                <td class="text-right">${formatNumber(p.total_units)}</td>
                <td class="text-right">${formatCurrency(p.avg_cost)}</td>
                <td class="text-right">${formatCurrency(p.total_cost_value)}</td>
                <td class="text-right">${p.profit_margin?.toFixed(1)}%</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      </div>
    `
  } else if (tab === 'expiry' && data.summary) {
    content += `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="value">${formatNumber(data.summary.total_batches)}</div>
          <div class="label">Total Batches</div>
        </div>
        <div class="summary-card">
          <div class="value">${formatNumber(data.summary.active_batches)}</div>
          <div class="label">Active</div>
        </div>
        <div class="summary-card">
          <div class="value error">${formatNumber(data.summary.expired_batches)}</div>
          <div class="label">Expired</div>
        </div>
        <div class="summary-card">
          <div class="value">${formatNumber(data.summary.expiring_30_days)}</div>
          <div class="label">&lt; 30 Days</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Critical Batches</div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Batch #</th>
              <th>Supplier</th>
              <th class="text-center">Expiry</th>
              <th class="text-center">Days Left</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Value at Risk</th>
            </tr>
          </thead>
          <tbody>
            ${data.critical_batches?.map(b => `
              <tr class="${b.days_until_expiry < 0 ? 'critical' : ''}">
                <td>${b.drug_name}</td>
                <td>${b.batch_number}</td>
                <td>${b.supplier_name}</td>
                <td class="text-center">${formatDate(b.expiry_date)}</td>
                <td class="text-center ${b.days_until_expiry < 0 ? 'error' : ''}">${b.days_until_expiry < 0 ? 'Expired' : b.days_until_expiry + 'd'}</td>
                <td class="text-right">${formatNumber(b.quantity_available)}</td>
                <td class="text-right error">${formatCurrency(b.value_at_risk)}</td>
              </tr>
            `).join('') || '<tr><td colspan="7" class="text-center">No critical batches</td></tr>'}
          </tbody>
        </table>
      </div>
    `
  } else if (tab === 'transactions' && data.summary) {
    content += `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="value">${formatNumber(data.summary.total_transactions)}</div>
          <div class="label">Transactions</div>
        </div>
        <div class="summary-card">
          <div class="value success">+${formatNumber(data.summary.total_received)}</div>
          <div class="label">Received</div>
        </div>
        <div class="summary-card">
          <div class="value">${formatNumber(data.summary.total_sold)}</div>
          <div class="label">Sold</div>
        </div>
        <div class="summary-card">
          <div class="value ${data.summary.net_movement >= 0 ? 'success' : 'error'}">${data.summary.net_movement >= 0 ? '+' : ''}${formatNumber(data.summary.net_movement)}</div>
          <div class="label">Net Movement</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Recent Transactions</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Product</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Value</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.recent_transactions?.map(t => `
              <tr>
                <td>${t.transaction_id}</td>
                <td>${t.type}</td>
                <td>${t.drug_name}</td>
                <td class="text-right ${t.quantity >= 0 ? 'success' : 'error'}">${t.quantity >= 0 ? '+' : ''}${formatNumber(t.quantity)}</td>
                <td class="text-right">${formatCurrency(t.total_value)}</td>
                <td>${formatDate(t.created_at)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      </div>
    `
  }

  content += `
    </body>
    </html>
  `

  return content
}

// Export to CSV
const exportToCSV = () => {
  const currentReport = {
    stock: stockReport.value,
    expiry: expiryReport.value,
    transactions: transactionReport.value,
  }[activeTab.value]

  if (!currentReport) {
    alert('Please generate a report first')
    return
  }

  const reportName = {
    stock: 'stock-valuation',
    expiry: 'expiry-batch',
    transactions: 'transactions',
  }[activeTab.value]

  const csvContent = generateCSVContent(activeTab.value, currentReport)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `inventory-${reportName}-report-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Generate CSV content
const generateCSVContent = (tab, data) => {
  const formatCurrency = (val) => val ? val.toFixed(2) : '0.00'
  const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : ''

  // Helper to escape CSV values
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  let rows = []

  if (tab === 'stock' && data) {
    // Summary section
    rows.push(['STOCK VALUATION REPORT'])
    rows.push(['Generated:', new Date().toLocaleString()])
    rows.push([])
    rows.push(['SUMMARY'])
    rows.push(['Total Products', data.summary?.total_products || 0])
    rows.push(['Total Batches', data.summary?.total_batches || 0])
    rows.push(['Total Stock Units', data.summary?.total_stock_units || 0])
    rows.push(['Total Cost Value', formatCurrency(data.summary?.total_cost_value)])
    rows.push(['Total Retail Value', formatCurrency(data.summary?.total_retail_value)])
    rows.push(['Potential Profit', formatCurrency(data.summary?.potential_profit)])
    rows.push([])

    // By Category
    if (data.by_category?.length > 0) {
      rows.push(['BY CATEGORY'])
      rows.push(['Category', 'Products', 'Units', 'Cost Value', 'Retail Value'])
      data.by_category.forEach(c => {
        rows.push([c.category, c.product_count, c.units, formatCurrency(c.cost_value), formatCurrency(c.retail_value)])
      })
      rows.push([])
    }

    // By Supplier
    if (data.by_supplier?.length > 0) {
      rows.push(['BY SUPPLIER'])
      rows.push(['Supplier', 'Batches', 'Units', 'Cost Value'])
      data.by_supplier.forEach(s => {
        rows.push([s.supplier, s.batch_count, s.units, formatCurrency(s.cost_value)])
      })
      rows.push([])
    }

    // Products detail
    if (data.products?.length > 0) {
      rows.push(['PRODUCT DETAILS'])
      rows.push(['Product Name', 'Product Code', 'Category', 'Total Units', 'Batches', 'Avg Cost', 'Total Cost Value', 'Total Retail Value', 'Profit Margin %'])
      data.products.forEach(p => {
        rows.push([
          p.drug_name,
          p.drug_code,
          p.category,
          p.total_units,
          p.batches,
          formatCurrency(p.avg_cost),
          formatCurrency(p.total_cost_value),
          formatCurrency(p.total_retail_value),
          p.profit_margin?.toFixed(1) || '0.0'
        ])
      })
    }
  } else if (tab === 'expiry' && data) {
    // Summary section
    rows.push(['EXPIRY & BATCH REPORT'])
    rows.push(['Generated:', new Date().toLocaleString()])
    rows.push([])
    rows.push(['SUMMARY'])
    rows.push(['Total Batches', data.summary?.total_batches || 0])
    rows.push(['Active Batches', data.summary?.active_batches || 0])
    rows.push(['Expired Batches', data.summary?.expired_batches || 0])
    rows.push(['Expiring in 30 Days', data.summary?.expiring_30_days || 0])
    rows.push(['Expiring in 60 Days', data.summary?.expiring_60_days || 0])
    rows.push(['Expiring in 90 Days', data.summary?.expiring_90_days || 0])
    rows.push(['Quarantined Batches', data.summary?.quarantined_batches || 0])
    rows.push(['Recalled Batches', data.summary?.recalled_batches || 0])
    rows.push([])

    // Expiry Timeline
    if (data.expiry_timeline?.length > 0) {
      rows.push(['EXPIRY TIMELINE'])
      rows.push(['Period', 'Batch Count', 'Units', 'Value at Risk'])
      data.expiry_timeline.forEach(t => {
        rows.push([t.period, t.batch_count, t.units, formatCurrency(t.value_at_risk)])
      })
      rows.push([])
    }

    // Critical Batches
    if (data.critical_batches?.length > 0) {
      rows.push(['CRITICAL BATCHES (Expired or Expiring within 30 days)'])
      rows.push(['Product Name', 'Product Code', 'Batch Number', 'Supplier', 'Expiry Date', 'Days Until Expiry', 'Quantity Available', 'Value at Risk', 'Status'])
      data.critical_batches.forEach(b => {
        rows.push([
          b.drug_name,
          b.drug_code,
          b.batch_number,
          b.supplier_name,
          formatDate(b.expiry_date),
          b.days_until_expiry,
          b.quantity_available,
          formatCurrency(b.value_at_risk),
          b.status
        ])
      })
    }
  } else if (tab === 'transactions' && data) {
    // Summary section
    rows.push(['TRANSACTION REPORT'])
    rows.push(['Generated:', new Date().toLocaleString()])
    rows.push([])
    rows.push(['SUMMARY'])
    rows.push(['Total Transactions', data.summary?.total_transactions || 0])
    rows.push(['Total Received', data.summary?.total_received || 0])
    rows.push(['Total Sold', data.summary?.total_sold || 0])
    rows.push(['Total Adjusted', data.summary?.total_adjusted || 0])
    rows.push(['Total Returned', data.summary?.total_returned || 0])
    rows.push(['Total Written Off', data.summary?.total_written_off || 0])
    rows.push(['Total Recalled', data.summary?.total_recalled || 0])
    rows.push(['Net Movement', data.summary?.net_movement || 0])
    rows.push(['Total Value In', formatCurrency(data.summary?.total_value_in)])
    rows.push(['Total Value Out', formatCurrency(data.summary?.total_value_out)])
    rows.push([])

    // By Type
    if (data.by_type?.length > 0) {
      rows.push(['BY TRANSACTION TYPE'])
      rows.push(['Type', 'Count', 'Units', 'Value'])
      data.by_type.forEach(t => {
        rows.push([t.type, t.count, t.units, formatCurrency(t.value)])
      })
      rows.push([])
    }

    // Top Moving Drugs
    if (data.top_moving_drugs?.length > 0) {
      rows.push(['TOP MOVING PRODUCTS'])
      rows.push(['Product Name', 'Transaction Count', 'Total In', 'Total Out', 'Net Change'])
      data.top_moving_drugs.forEach(d => {
        rows.push([d.drug_name, d.transaction_count, d.total_in, d.total_out, d.net_change])
      })
      rows.push([])
    }

    // Recent Transactions
    if (data.recent_transactions?.length > 0) {
      rows.push(['RECENT TRANSACTIONS'])
      rows.push(['Transaction ID', 'Type', 'Product Name', 'Batch Number', 'Quantity', 'Total Value', 'Performed By', 'Date'])
      data.recent_transactions.forEach(t => {
        rows.push([
          t.transaction_id,
          t.type,
          t.drug_name,
          t.batch_number,
          t.quantity,
          formatCurrency(t.total_value),
          t.performed_by,
          formatDate(t.created_at)
        ])
      })
    }
  }

  // Convert rows to CSV string
  return rows.map(row => row.map(escapeCSV).join(',')).join('\n')
}

// Clear filters
const clearFilters = () => {
  dateRange.value = { start: null, end: null }
  selectedCategory.value = null
  selectedSupplier.value = null
  selectedManufacturer.value = null
}

// Close dialog
const closeDialog = () => {
  dialogVisible.value = false
}
</script>

<template>
  <VDialog v-model="dialogVisible" max-width="1400" scrollable persistent>
    <VCard>
      <VCardTitle class="d-flex align-center py-3 px-4">
        <VIcon class="me-2">mdi-file-chart</VIcon>
        Inventory Reports
        <VSpacer />
        <VBtn icon variant="text" @click="closeDialog">
          <VIcon>mdi-close</VIcon>
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <!-- Report Type Tabs -->
        <VTabs v-model="activeTab" class="mb-4">
          <VTab value="stock">
            <VIcon start>mdi-currency-usd</VIcon>
            Stock Valuation
          </VTab>
          <VTab value="expiry">
            <VIcon start>mdi-calendar-clock</VIcon>
            Expiry & Batch
          </VTab>
          <VTab value="transactions">
            <VIcon start>mdi-swap-horizontal</VIcon>
            Transactions
          </VTab>
        </VTabs>

        <!-- Filters Section -->
        <VCard flat class="mb-4 bg-grey-lighten-5">
          <VCardText class="py-3">
            <VRow align="center" class="mb-2">
              <VCol cols="12" sm="6" md="3">
                <VMenu v-model="dateMenuOpen" :close-on-content-click="false" location="bottom">
                  <template #activator="{ props }">
                    <VTextField
                      v-bind="props"
                      :model-value="dateRangeLabel"
                      label="Date Range"
                      readonly
                      prepend-inner-icon="mdi-calendar"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="cursor-pointer"
                    />
                  </template>
                  <VCard min-width="300">
                    <VCardText class="pa-2">
                      <DatePicker
                        v-model.range="dateRange"
                        mode="date"
                        :columns="1"
                        is-expanded
                      />
                    </VCardText>
                    <VDivider />
                    <VCardActions class="justify-end pa-2">
                      <VBtn size="small" variant="text" @click="dateRange = { start: null, end: null }">Clear</VBtn>
                      <VBtn size="small" color="primary" @click="dateMenuOpen = false">Done</VBtn>
                    </VCardActions>
                  </VCard>
                </VMenu>
              </VCol>
              <VCol cols="12" sm="6" md="3">
                <VAutocomplete
                  v-model="selectedCategory"
                  :items="categories"
                  label="Category"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                  placeholder="All Categories"
                  auto-select-first
                  :menu-props="{ maxHeight: 300 }"
                />
              </VCol>
              <VCol cols="12" sm="6" md="3">
                <VAutocomplete
                  v-model="selectedSupplier"
                  :items="suppliers"
                  label="Supplier"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                  placeholder="All Suppliers"
                  auto-select-first
                  :menu-props="{ maxHeight: 300 }"
                />
              </VCol>
              <VCol cols="12" sm="6" md="3">
                <VAutocomplete
                  v-model="selectedManufacturer"
                  :items="manufacturers"
                  label="Manufacturer"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                  placeholder="All Manufacturers"
                  auto-select-first
                  :menu-props="{ maxHeight: 300 }"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" class="d-flex justify-end gap-2">
                <VBtn variant="text" @click="clearFilters" :disabled="loading">
                  <VIcon start>mdi-filter-off</VIcon>
                  Clear Filters
                </VBtn>
                <VBtn color="primary" @click="generateReport" :loading="loading">
                  <VIcon start>mdi-chart-bar</VIcon>
                  Generate Report
                </VBtn>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Report Content -->
        <VWindow v-model="activeTab">
          <VWindowItem value="stock">
            <StockValuationReport :data="stockReport" />
          </VWindowItem>
          <VWindowItem value="expiry">
            <ExpiryBatchReport :data="expiryReport" />
          </VWindowItem>
          <VWindowItem value="transactions">
            <TransactionReport :data="transactionReport" />
          </VWindowItem>
        </VWindow>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VChip v-if="stockReport || expiryReport || transactionReport" size="small" color="success" variant="tonal">
          <VIcon start size="small">mdi-check</VIcon>
          Report Generated
        </VChip>
        <VSpacer />
        <VBtn variant="outlined" prepend-icon="mdi-printer" @click="printReport" :disabled="!stockReport && !expiryReport && !transactionReport">
          Print
        </VBtn>
        <VBtn
          variant="outlined"
          prepend-icon="mdi-file-delimited"
          @click="exportToCSV"
          :disabled="!stockReport && !expiryReport && !transactionReport"
        >
          Export CSV
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="mdi-file-pdf-box"
          @click="exportToPDF"
          :loading="exporting"
          :disabled="!stockReport && !expiryReport && !transactionReport"
        >
          Export PDF
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.bg-grey-lighten-5 {
  background-color: #fafafa !important;
}

.cursor-pointer {
  cursor: pointer;
}

/* V-Calendar styling */
:deep(.vc-container) {
  border: none;
  font-family: inherit;
}

:deep(.vc-highlight) {
  background-color: rgba(var(--v-theme-primary), 0.3) !important;
}

:deep(.vc-day-content) {
  color: rgb(var(--v-theme-on-surface));
}
</style>
