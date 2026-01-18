<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Suppliers</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Manage pharmaceutical suppliers and distributors</p>
      </div>
      <VBtn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
        Add Supplier
      </VBtn>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="primary" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-truck-delivery</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.total }}</div>
              <div class="text-body-2 text-medium-emphasis">Total Suppliers</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-check-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.active }}</div>
              <div class="text-body-2 text-medium-emphasis">Active</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="warning" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-clock-outline</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.pending }}</div>
              <div class="text-body-2 text-medium-emphasis">Pending Approval</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="error" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-alert</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.licenseExpiring }}</div>
              <div class="text-body-2 text-medium-emphasis">License Expiring</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" md="4">
            <VTextField
              v-model="searchQuery"
              label="Search suppliers..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="debouncedSearch"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="statusFilter"
              label="Status"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchSuppliers"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="categoryFilter"
              label="Product Category"
              :items="categories"
              item-title="name"
              item-value="_id"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchSuppliers"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="itemsPerPage"
              label="Per Page"
              :items="[10, 25, 50, 100]"
              variant="outlined"
              density="compact"
              @update:model-value="fetchSuppliers"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VCheckbox
              v-model="licenseExpiringSoon"
              label="Expiring Licenses"
              density="compact"
              @update:model-value="fetchSuppliers"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Suppliers Table -->
    <VCard>
      <VCardText>
        <VProgressLinear v-if="loading" indeterminate color="primary" />

        <VTable v-if="suppliers.length > 0">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Contact</th>
              <th>License</th>
              <th>Payment Terms</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="supplier in suppliers" :key="supplier._id">
              <td>
                <div class="d-flex align-center py-2">
                  <VAvatar color="primary" variant="tonal" size="40" class="me-3">
                    <span class="text-caption font-weight-bold">{{ getInitials(supplier.name) }}</span>
                  </VAvatar>
                  <div>
                    <div class="font-weight-medium">
                      <a href="#" class="text-decoration-none text-primary" @click.prevent="editSupplier(supplier)">
                        {{ supplier.name }}
                      </a>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ supplier.supplier_code }}
                      <span v-if="supplier.short_name"> &bull; {{ supplier.short_name }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div v-if="supplier.contact">
                  <div class="text-body-2">{{ supplier.contact.contact_person || '-' }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ supplier.contact.phone || supplier.contact.email || '-' }}
                  </div>
                </div>
                <span v-else class="text-medium-emphasis">-</span>
              </td>
              <td>
                <div v-if="supplier.license?.number">
                  <VChip
                    :color="getLicenseColor(supplier)"
                    size="small"
                    variant="tonal"
                  >
                    <VIcon start size="14">
                      {{ supplier.license.is_verified ? 'mdi-check-circle' : 'mdi-help-circle' }}
                    </VIcon>
                    {{ supplier.license.is_verified ? 'Verified' : 'Unverified' }}
                  </VChip>
                  <div class="text-caption text-medium-emphasis mt-1" v-if="supplier.license.expiry_date">
                    Expires: {{ formatDate(supplier.license.expiry_date) }}
                  </div>
                </div>
                <span v-else class="text-medium-emphasis">No license</span>
              </td>
              <td>
                <VChip size="small" variant="tonal">
                  {{ formatPaymentTerms(supplier.payment_terms) }}
                </VChip>
              </td>
              <td>
                <VChip :color="getStatusColor(supplier.status)" size="small">
                  {{ formatStatus(supplier.status) }}
                </VChip>
              </td>
              <td>
                <VMenu>
                  <template #activator="{ props }">
                    <VBtn v-bind="props" icon variant="text" size="small">
                      <VIcon>mdi-dots-vertical</VIcon>
                    </VBtn>
                  </template>
                  <VList density="compact">
                    <VListItem @click="editSupplier(supplier)">
                      <template #prepend>
                        <VIcon size="small">mdi-pencil</VIcon>
                      </template>
                      <VListItemTitle>Edit</VListItemTitle>
                    </VListItem>
                    <VListItem
                      v-if="supplier.license?.number && !supplier.license.is_verified"
                      @click="verifyLicense(supplier)"
                    >
                      <template #prepend>
                        <VIcon size="small" color="success">mdi-check-circle</VIcon>
                      </template>
                      <VListItemTitle>Verify License</VListItemTitle>
                    </VListItem>
                    <VDivider />
                    <VListItem
                      v-if="supplier.status !== 'active'"
                      @click="changeStatus(supplier, 'active')"
                    >
                      <template #prepend>
                        <VIcon size="small" color="success">mdi-check</VIcon>
                      </template>
                      <VListItemTitle>Activate</VListItemTitle>
                    </VListItem>
                    <VListItem
                      v-if="supplier.status === 'active'"
                      @click="changeStatus(supplier, 'suspended')"
                    >
                      <template #prepend>
                        <VIcon size="small" color="warning">mdi-pause-circle</VIcon>
                      </template>
                      <VListItemTitle>Suspend</VListItemTitle>
                    </VListItem>
                    <VListItem @click="confirmDelete(supplier)">
                      <template #prepend>
                        <VIcon size="small" color="error">mdi-delete</VIcon>
                      </template>
                      <VListItemTitle class="text-error">Delete</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
              </td>
            </tr>
          </tbody>
        </VTable>

        <VAlert v-else-if="!loading" type="info" variant="tonal">
          No suppliers found matching your criteria
        </VAlert>

        <!-- Pagination -->
        <div class="d-flex justify-center mt-4" v-if="totalPages > 1">
          <VPagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="fetchSuppliers"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Add/Edit Supplier Dialog -->
    <VDialog v-model="supplierDialog" max-width="900" persistent scrollable>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ editingSupplier ? 'Edit Supplier' : 'Add New Supplier' }}</span>
          <VBtn icon variant="text" @click="closeSupplierDialog">
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText style="max-height: 70vh; overflow-y: auto;">
          <VForm ref="supplierForm" @submit.prevent="saveSupplier">
            <!-- Basic Information -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Basic Information</div>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="supplierData.name"
                  label="Supplier Name *"
                  :rules="[v => !!v || 'Required']"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="supplierData.short_name"
                  label="Short Name"
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="supplierData.description"
                  label="Description"
                  rows="2"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Contact Information -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Contact Information</div>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="supplierData.contact.contact_person"
                  label="Contact Person"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="supplierData.contact.contact_person_title"
                  label="Title"
                  placeholder="e.g., Sales Manager"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="supplierData.contact.phone"
                  label="Phone"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="supplierData.contact.alternate_phone"
                  label="Alternate Phone"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="supplierData.contact.email"
                  label="Email"
                  type="email"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="supplierData.contact.website"
                  label="Website"
                  placeholder="https://"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Address -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Address</div>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="supplierData.address.street"
                  label="Street Address"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="supplierData.address.city"
                  label="City"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="supplierData.address.state"
                  label="State"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="supplierData.address.country"
                  label="Country"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- License Information -->
            <div class="text-subtitle-1 font-weight-bold mb-3">License Information</div>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="supplierData.license.number"
                  label="License Number"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="supplierData.license.type"
                  label="License Type"
                  placeholder="e.g., Wholesale Pharmacy License"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="supplierData.license.issuing_authority"
                  label="Issuing Authority"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="supplierData.license.issue_date"
                  label="Issue Date"
                  type="date"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="supplierData.license.expiry_date"
                  label="Expiry Date"
                  type="date"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Financial Terms -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Financial Terms</div>
            <VRow>
              <VCol cols="12" md="4">
                <VSelect
                  v-model="supplierData.payment_terms"
                  label="Payment Terms"
                  :items="paymentTermsOptions"
                  item-title="title"
                  item-value="value"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="creditLimitDisplay"
                  label="Credit Limit"
                  prefix="₦"
                  placeholder="0.00"
                  @input="onCreditLimitInput"
                  @blur="onCreditLimitBlur"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VSelect
                  v-model="supplierData.product_categories"
                  label="Product Categories"
                  :items="categories"
                  item-title="name"
                  item-value="_id"
                  multiple
                  chips
                  closable-chips
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Banking Information -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Banking Information</div>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="supplierData.banking.bank_name"
                  label="Bank Name"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="supplierData.banking.account_number"
                  label="Account Number"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="supplierData.banking.account_name"
                  label="Account Name"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Notes -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Additional Notes</div>
            <VRow>
              <VCol cols="12">
                <VTextarea
                  v-model="supplierData.notes"
                  label="Notes"
                  rows="3"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VDivider />
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="closeSupplierDialog">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="saveSupplier">
            {{ editingSupplier ? 'Update' : 'Create' }} Supplier
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Status Change Dialog -->
    <VDialog v-model="statusDialog" max-width="400">
      <VCard>
        <VCardTitle>Change Status</VCardTitle>
        <VCardText>
          <p class="mb-3">
            Change status for <strong>{{ selectedSupplier?.name }}</strong> to
            <VChip :color="getStatusColor(newStatus)" size="small" class="mx-1">
              {{ formatStatus(newStatus) }}
            </VChip>
          </p>
          <VTextField
            v-model="statusReason"
            label="Reason (optional)"
            variant="outlined"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="statusDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="confirmStatusChange">Confirm</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard>
        <VCardTitle class="text-error">Delete Supplier</VCardTitle>
        <VCardText>
          Are you sure you want to delete <strong>{{ selectedSupplier?.name }}</strong>?
          This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" :loading="saving" @click="deleteSupplier">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { debounce } from 'lodash'

// API Base URL
const API_BASE = '/admin-api/pharmacy'

// State
const loading = ref(false)
const saving = ref(false)
const suppliers = ref([])
const categories = ref([])
const totalPages = ref(1)
const currentPage = ref(1)
const itemsPerPage = ref(25)
const searchQuery = ref('')
const statusFilter = ref(null)
const categoryFilter = ref(null)
const licenseExpiringSoon = ref(false)

// Stats
const stats = reactive({
  total: 0,
  active: 0,
  pending: 0,
  licenseExpiring: 0,
})

// Dialogs
const supplierDialog = ref(false)
const statusDialog = ref(false)
const deleteDialog = ref(false)
const editingSupplier = ref(null)
const selectedSupplier = ref(null)
const newStatus = ref('')
const statusReason = ref('')

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
})

// Form Data
const defaultSupplierData = {
  name: '',
  short_name: '',
  description: '',
  contact: {
    phone: '',
    alternate_phone: '',
    email: '',
    contact_person: '',
    contact_person_title: '',
    website: '',
  },
  address: {
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
  },
  license: {
    number: '',
    type: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: '',
  },
  banking: {
    bank_name: '',
    account_number: '',
    account_name: '',
  },
  payment_terms: 'cod',
  credit_limit: 0,
  product_categories: [],
  notes: '',
}

const supplierData = reactive({ ...defaultSupplierData })

// Credit limit formatting
const creditLimitDisplay = ref('')

const formatNumberWithCommas = (num) => {
  return num.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const onCreditLimitInput = (event) => {
  // Get cursor position before modification
  const input = event.target
  const cursorPos = input.selectionStart
  const oldValue = input.value

  // Remove all non-numeric characters except decimal point
  let rawValue = oldValue.replace(/[^0-9.]/g, '')

  // Handle multiple decimal points - keep only the first one
  const parts = rawValue.split('.')
  if (parts.length > 2) {
    rawValue = parts[0] + '.' + parts.slice(1).join('')
  }

  // Parse and store the numeric value
  const num = parseFloat(rawValue) || 0
  supplierData.credit_limit = num

  // Format with thousand separators for display
  if (rawValue === '' || rawValue === '.') {
    creditLimitDisplay.value = ''
  } else if (rawValue.endsWith('.')) {
    // User is typing decimal, preserve it
    const intPart = parseInt(rawValue) || 0
    creditLimitDisplay.value = intPart.toLocaleString('en-NG') + '.'
  } else if (rawValue.includes('.')) {
    // Has decimal part - format integer part, keep decimal as typed
    const [intPart, decPart] = rawValue.split('.')
    const formattedInt = (parseInt(intPart) || 0).toLocaleString('en-NG')
    creditLimitDisplay.value = formattedInt + '.' + decPart.substring(0, 2)
  } else {
    // Integer only - format with commas
    creditLimitDisplay.value = (parseInt(rawValue) || 0).toLocaleString('en-NG')
  }
}

const onCreditLimitBlur = () => {
  // On blur, format fully with 2 decimal places
  const num = supplierData.credit_limit || 0
  creditLimitDisplay.value = formatNumberWithCommas(num)
}

const initCreditLimitDisplay = () => {
  const num = supplierData.credit_limit || 0
  creditLimitDisplay.value = formatNumberWithCommas(num)
}

// Options
const statusOptions = [
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
  { title: 'Suspended', value: 'suspended' },
  { title: 'Pending Approval', value: 'pending_approval' },
]

const paymentTermsOptions = [
  { title: 'Cash on Delivery', value: 'cod' },
  { title: 'Net 7 Days', value: 'net_7' },
  { title: 'Net 15 Days', value: 'net_15' },
  { title: 'Net 30 Days', value: 'net_30' },
  { title: 'Net 60 Days', value: 'net_60' },
  { title: 'Prepaid', value: 'prepaid' },
]

// Auth Headers
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.access_token}`,
  }
}

// Fetch Suppliers
const fetchSuppliers = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: itemsPerPage.value,
    })
    if (searchQuery.value) params.append('search', searchQuery.value)
    if (statusFilter.value) params.append('status', statusFilter.value)
    if (categoryFilter.value) params.append('category', categoryFilter.value)
    if (licenseExpiringSoon.value) params.append('licenseExpiringSoon', 'true')

    const response = await fetch(`${API_BASE}/suppliers?${params}`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()

    if (response.ok && (data.data || data.result)) {
      const result = data.data || data.result
      suppliers.value = result.suppliers || []
      totalPages.value = result.totalPages || 1
      calculateStats()
    } else {
      console.error('Fetch suppliers failed:', response.status, data)
      showSnackbar(data.errorMessage || data.message || 'Failed to fetch suppliers', 'error')
    }
  } catch (error) {
    console.error('Fetch suppliers error:', error)
    showSnackbar('Failed to fetch suppliers', 'error')
  } finally {
    loading.value = false
  }
}

const calculateStats = () => {
  stats.total = suppliers.value.length
  stats.active = suppliers.value.filter(s => s.status === 'active').length
  stats.pending = suppliers.value.filter(s => s.status === 'pending_approval').length
  stats.licenseExpiring = suppliers.value.filter(s => {
    if (!s.license?.expiry_date) return false
    const days = Math.ceil((new Date(s.license.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
    return days <= 30 && days > 0
  }).length
}

// Fetch Categories (Drug Categories for supplier product types)
const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_BASE}/categories`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (response.ok) {
      // Handle both response formats: { data: [...] } or { result: [...] }
      categories.value = result.data || result.result || []
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

// Debounced Search
const debouncedSearch = debounce(() => {
  currentPage.value = 1
  fetchSuppliers()
}, 300)

// Dialog Methods
const openAddDialog = () => {
  editingSupplier.value = null
  Object.assign(supplierData, JSON.parse(JSON.stringify(defaultSupplierData)))
  initCreditLimitDisplay()
  supplierDialog.value = true
}

const editSupplier = (supplier) => {
  editingSupplier.value = supplier
  Object.assign(supplierData, {
    name: supplier.name || '',
    short_name: supplier.short_name || '',
    description: supplier.description || '',
    contact: { ...defaultSupplierData.contact, ...supplier.contact },
    address: { ...defaultSupplierData.address, ...supplier.address },
    license: {
      ...defaultSupplierData.license,
      ...supplier.license,
      issue_date: supplier.license?.issue_date ? supplier.license.issue_date.slice(0, 10) : '',
      expiry_date: supplier.license?.expiry_date ? supplier.license.expiry_date.slice(0, 10) : '',
    },
    banking: { ...defaultSupplierData.banking, ...supplier.banking },
    payment_terms: supplier.payment_terms || 'cod',
    credit_limit: supplier.credit_limit || 0,
    product_categories: supplier.product_categories?.map(c => c._id || c) || [],
    notes: supplier.notes || '',
  })
  initCreditLimitDisplay()
  supplierDialog.value = true
}

const closeSupplierDialog = () => {
  supplierDialog.value = false
  editingSupplier.value = null
  // Reset form data to defaults
  Object.assign(supplierData, JSON.parse(JSON.stringify(defaultSupplierData)))
  creditLimitDisplay.value = '0.00'
}

// Save Supplier
const saveSupplier = async () => {
  saving.value = true
  try {
    const url = editingSupplier.value
      ? `${API_BASE}/suppliers/${editingSupplier.value._id}`
      : `${API_BASE}/suppliers`

    const method = editingSupplier.value ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(supplierData),
    })

    const result = await response.json()

    if (response.ok && (result.data || result.result)) {
      showSnackbar(editingSupplier.value ? 'Supplier updated' : 'Supplier created', 'success')
      closeSupplierDialog()
      fetchSuppliers()
    } else {
      showSnackbar(result.message || 'Failed to save supplier', 'error')
    }
  } catch (error) {
    showSnackbar('Failed to save supplier', 'error')
  } finally {
    saving.value = false
  }
}

// Status Change
const changeStatus = (supplier, status) => {
  selectedSupplier.value = supplier
  newStatus.value = status
  statusReason.value = ''
  statusDialog.value = true
}

const confirmStatusChange = async () => {
  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/suppliers/${selectedSupplier.value._id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status: newStatus.value,
        reason: statusReason.value,
      }),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Status updated', 'success')
      statusDialog.value = false
      fetchSuppliers()
    } else {
      showSnackbar(result.message || 'Failed to update status', 'error')
    }
  } catch (error) {
    showSnackbar('Failed to update status', 'error')
  } finally {
    saving.value = false
  }
}

// Verify License
const verifyLicense = async (supplier) => {
  try {
    const response = await fetch(`${API_BASE}/suppliers/${supplier._id}/verify-license`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_verified: true }),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('License verified', 'success')
      fetchSuppliers()
    } else {
      showSnackbar(result.message || 'Failed to verify license', 'error')
    }
  } catch (error) {
    showSnackbar('Failed to verify license', 'error')
  }
}

// Delete
const confirmDelete = (supplier) => {
  selectedSupplier.value = supplier
  deleteDialog.value = true
}

const deleteSupplier = async () => {
  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/suppliers/${selectedSupplier.value._id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Supplier deleted', 'success')
      deleteDialog.value = false
      fetchSuppliers()
    } else {
      showSnackbar(result.message || 'Failed to delete supplier', 'error')
    }
  } catch (error) {
    showSnackbar('Failed to delete supplier', 'error')
  } finally {
    saving.value = false
  }
}

// Helpers
const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    inactive: 'grey',
    suspended: 'warning',
    pending_approval: 'info',
  }
  return colors[status] || 'grey'
}

const formatStatus = (status) => {
  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    pending_approval: 'Pending',
  }
  return labels[status] || status
}

const formatPaymentTerms = (terms) => {
  const labels = {
    cod: 'COD',
    net_7: 'Net 7',
    net_15: 'Net 15',
    net_30: 'Net 30',
    net_60: 'Net 60',
    prepaid: 'Prepaid',
  }
  return labels[terms] || terms
}

const getLicenseColor = (supplier) => {
  if (!supplier.license?.expiry_date) return 'grey'
  if (supplier.license.is_verified) {
    const days = Math.ceil((new Date(supplier.license.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
    if (days <= 0) return 'error'
    if (days <= 30) return 'warning'
    return 'success'
  }
  return 'grey'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const showSnackbar = (message, color = 'success') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

// Initialize
onMounted(() => {
  fetchSuppliers()
  fetchCategories()
})
</script>
