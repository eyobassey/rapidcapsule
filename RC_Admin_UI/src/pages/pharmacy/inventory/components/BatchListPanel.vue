<template>
  <VCard variant="outlined" class="mt-4">
    <VCardTitle class="d-flex justify-space-between align-center">
      <div>
        <span class="text-h6">Stock Batches</span>
        <span class="text-caption text-medium-emphasis ml-2">{{ drug?.name }}</span>
      </div>
      <VBtn size="small" color="primary" variant="tonal" @click="$emit('receive-stock')">
        <VIcon start>mdi-plus</VIcon>
        Receive Stock
      </VBtn>
    </VCardTitle>
    <VDivider />

    <!-- Stock Summary Cards -->
    <VCardText v-if="stockInfo">
      <VRow dense>
        <VCol cols="6" sm="3">
          <div class="pa-3 rounded bg-primary-lighten-5">
            <div class="text-h5 font-weight-bold text-primary">{{ stockInfo.total_available }}</div>
            <div class="text-caption">Available</div>
          </div>
        </VCol>
        <VCol cols="6" sm="3">
          <div class="pa-3 rounded bg-info-lighten-5">
            <div class="text-h5 font-weight-bold text-info">{{ stockInfo.active_batches }}</div>
            <div class="text-caption">Active Batches</div>
          </div>
        </VCol>
        <VCol cols="6" sm="3">
          <div class="pa-3 rounded bg-warning-lighten-5">
            <div class="text-h5 font-weight-bold text-warning">
              {{ stockInfo.earliest_expiry ? formatDate(stockInfo.earliest_expiry) : 'N/A' }}
            </div>
            <div class="text-caption">Earliest Expiry</div>
          </div>
        </VCol>
        <VCol cols="6" sm="3">
          <div class="pa-3 rounded bg-success-lighten-5">
            <div class="text-h5 font-weight-bold text-success">₦{{ stockInfo.average_cost?.toFixed(2) || '0.00' }}</div>
            <div class="text-caption">Avg Cost</div>
          </div>
        </VCol>
      </VRow>
    </VCardText>

    <VDivider />

    <!-- Batches Table -->
    <VCardText class="pa-0">
      <VProgressLinear v-if="loading" indeterminate color="primary" />

      <VTable v-if="batches.length > 0" density="compact">
        <thead>
          <tr>
            <th>Batch #</th>
            <th>Supplier</th>
            <th>Qty</th>
            <th>Expiry</th>
            <th>Cost</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="batch in batches" :key="batch._id">
            <td>
              <div class="font-weight-medium">{{ batch.batch_number }}</div>
              <div class="text-caption text-medium-emphasis">{{ batch.internal_batch_id }}</div>
            </td>
            <td>
              <div v-if="batch.supplier_id">
                {{ batch.supplier_id.name }}
                <div class="text-caption text-medium-emphasis">{{ batch.supplier_id.supplier_code }}</div>
              </div>
              <span v-else class="text-medium-emphasis">-</span>
            </td>
            <td>
              <div class="d-flex align-center gap-2">
                <span class="font-weight-bold">{{ batch.quantity_available }}</span>
                <span class="text-caption text-medium-emphasis">/ {{ batch.quantity_received }}</span>
              </div>
              <VProgressLinear
                :model-value="(batch.quantity_available / batch.quantity_received) * 100"
                :color="batch.quantity_available > 0 ? 'primary' : 'grey'"
                height="4"
                rounded
                class="mt-1"
              />
            </td>
            <td>
              <div v-if="batch.no_expiry" class="text-medium-emphasis">No Expiry</div>
              <div v-else>
                <VChip :color="getExpiryColor(batch)" size="x-small" variant="tonal">
                  {{ formatDate(batch.expiry_date) }}
                </VChip>
                <div class="text-caption" :class="getExpiryTextClass(batch)">
                  {{ getExpiryText(batch) }}
                </div>
              </div>
            </td>
            <td>₦{{ batch.cost_price?.toFixed(2) }}</td>
            <td>
              <VChip :color="getStatusColor(batch.status)" size="x-small">
                {{ formatStatus(batch.status) }}
              </VChip>
            </td>
            <td>
              <VMenu>
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon variant="text" size="x-small">
                    <VIcon>mdi-dots-vertical</VIcon>
                  </VBtn>
                </template>
                <VList density="compact">
                  <VListItem @click="openEditDialog(batch)">
                    <template #prepend>
                      <VIcon size="small">mdi-pencil</VIcon>
                    </template>
                    <VListItemTitle>Edit Batch</VListItemTitle>
                  </VListItem>
                  <VListItem @click="viewTransactions(batch)">
                    <template #prepend>
                      <VIcon size="small">mdi-history</VIcon>
                    </template>
                    <VListItemTitle>Transaction History</VListItemTitle>
                  </VListItem>
                  <VListItem @click="openAdjustDialog(batch)" :disabled="batch.status !== 'active'">
                    <template #prepend>
                      <VIcon size="small">mdi-plus-minus</VIcon>
                    </template>
                    <VListItemTitle>Adjust Stock</VListItemTitle>
                  </VListItem>
                  <VDivider />
                  <VListItem
                    @click="openStatusDialog(batch, 'quarantine')"
                    :disabled="batch.status !== 'active'"
                  >
                    <template #prepend>
                      <VIcon size="small" color="warning">mdi-shield-lock</VIcon>
                    </template>
                    <VListItemTitle>Quarantine</VListItemTitle>
                  </VListItem>
                  <VListItem
                    @click="openReturnDialog(batch)"
                    :disabled="batch.status !== 'active' || batch.quantity_available <= 0"
                  >
                    <template #prepend>
                      <VIcon size="small" color="info">mdi-keyboard-return</VIcon>
                    </template>
                    <VListItemTitle>Return to Supplier</VListItemTitle>
                  </VListItem>
                  <VListItem
                    @click="openWriteOffDialog(batch)"
                    :disabled="batch.quantity_available <= 0"
                  >
                    <template #prepend>
                      <VIcon size="small" color="error">mdi-delete-clock</VIcon>
                    </template>
                    <VListItemTitle>Write Off</VListItemTitle>
                  </VListItem>
                  <VDivider />
                  <VListItem
                    @click="openDeleteDialog(batch)"
                    :disabled="batch.quantity_available > 0"
                  >
                    <template #prepend>
                      <VIcon size="small" color="error">mdi-delete</VIcon>
                    </template>
                    <VListItemTitle>Delete Batch</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </td>
          </tr>
        </tbody>
      </VTable>

      <VAlert v-else-if="!loading" type="info" variant="tonal" class="ma-4">
        No stock batches found for this product. Click "Receive Stock" to add inventory.
      </VAlert>
    </VCardText>

    <!-- Adjust Stock Dialog -->
    <VDialog v-model="adjustDialog" max-width="400">
      <VCard>
        <VCardTitle>Adjust Stock</VCardTitle>
        <VCardText>
          <p class="mb-3">
            Batch: <strong>{{ selectedBatch?.batch_number }}</strong>
            <br />
            Current Quantity: <strong>{{ selectedBatch?.quantity_available }}</strong>
          </p>
          <VSelect
            v-model="adjustData.adjustment_type"
            label="Adjustment Type"
            :items="[{ title: 'Add Stock', value: 'add' }, { title: 'Subtract Stock', value: 'subtract' }]"
            item-title="title"
            item-value="value"
            variant="outlined"
            class="mb-3"
          />
          <VTextField
            v-model.number="adjustData.quantity"
            label="Quantity"
            type="number"
            min="1"
            variant="outlined"
            class="mb-3"
          />
          <VTextField
            v-model="adjustData.reason"
            label="Reason *"
            variant="outlined"
            class="mb-3"
          />
          <VTextField
            v-model="adjustData.reference_number"
            label="Reference Number"
            variant="outlined"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="adjustDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="submitAdjustment">Adjust</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Return to Supplier Dialog -->
    <VDialog v-model="returnDialog" max-width="450">
      <VCard>
        <VCardTitle>Return to Supplier</VCardTitle>
        <VCardText>
          <p class="mb-3">
            Returning <strong>{{ selectedBatch?.batch_number }}</strong>
            <br />
            Available: <strong>{{ selectedBatch?.quantity_available }}</strong>
          </p>
          <VTextField
            v-model.number="returnData.quantity"
            label="Quantity to Return *"
            type="number"
            min="1"
            :max="selectedBatch?.quantity_available"
            variant="outlined"
            class="mb-3"
          />
          <VTextField
            v-model="returnData.reason"
            label="Return Reason *"
            variant="outlined"
            class="mb-3"
          />
          <VTextField
            v-model="returnData.return_authorization_number"
            label="Return Authorization #"
            variant="outlined"
            class="mb-3"
          />
          <VTextField
            v-model="returnData.credit_note_number"
            label="Credit Note #"
            variant="outlined"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="returnDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="submitReturn">Return</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Write Off Dialog -->
    <VDialog v-model="writeOffDialog" max-width="400">
      <VCard>
        <VCardTitle>Write Off Stock</VCardTitle>
        <VCardText>
          <p class="mb-3">
            Batch: <strong>{{ selectedBatch?.batch_number }}</strong>
            <br />
            Available: <strong>{{ selectedBatch?.quantity_available }}</strong>
          </p>
          <VSelect
            v-model="writeOffData.writeoff_type"
            label="Write Off Type"
            :items="[{ title: 'Expired', value: 'expired' }, { title: 'Damaged', value: 'damaged' }]"
            item-title="title"
            item-value="value"
            variant="outlined"
            class="mb-3"
          />
          <VTextField
            v-model.number="writeOffData.quantity"
            label="Quantity"
            type="number"
            min="1"
            :max="selectedBatch?.quantity_available"
            variant="outlined"
            class="mb-3"
            hint="Leave blank to write off all"
          />
          <VTextField
            v-model="writeOffData.reason"
            label="Reason *"
            variant="outlined"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="writeOffDialog = false">Cancel</VBtn>
          <VBtn color="error" :loading="saving" @click="submitWriteOff">Write Off</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Transactions Dialog -->
    <VDialog v-model="transactionsDialog" max-width="700">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Transaction History</span>
          <VBtn icon variant="text" @click="transactionsDialog = false">
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VProgressLinear v-if="loadingTransactions" indeterminate />
          <VTable v-if="transactions.length > 0" density="compact">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Reference</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="txn in transactions" :key="txn._id">
                <td>{{ formatDateTime(txn.transaction_date || txn.created_at) }}</td>
                <td>
                  <VChip :color="getTransactionTypeColor(txn.type)" size="x-small">
                    {{ formatTransactionType(txn.type) }}
                  </VChip>
                </td>
                <td :class="txn.quantity >= 0 ? 'text-success' : 'text-error'">
                  {{ txn.quantity >= 0 ? '+' : '' }}{{ txn.quantity }}
                </td>
                <td>{{ txn.reference?.number || '-' }}</td>
                <td>{{ txn.performed_by?.first_name || '-' }}</td>
              </tr>
            </tbody>
          </VTable>
          <VAlert v-else-if="!loadingTransactions" type="info" variant="tonal">
            No transactions found
          </VAlert>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Edit Batch Dialog -->
    <VDialog v-model="editDialog" max-width="550">
      <VCard>
        <VCardTitle>Edit Batch</VCardTitle>
        <VCardText>
          <VRow dense>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="editData.pharmacy_id"
                :items="pharmacies"
                :loading="loadingPharmacies"
                label="Pharmacy *"
                item-title="name"
                item-value="_id"
                variant="outlined"
                density="compact"
              >
                <template #item="{ item, props }">
                  <VListItem v-bind="props">
                    <template #subtitle>
                      {{ item.raw.is_platform_default ? 'Platform Default' : item.raw.address?.city || 'N/A' }}
                    </template>
                  </VListItem>
                </template>
              </VSelect>
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="editData.supplier_id"
                :items="suppliers"
                :loading="loadingSuppliers"
                label="Supplier *"
                item-title="name"
                item-value="_id"
                variant="outlined"
                density="compact"
              >
                <template #item="{ item, props }">
                  <VListItem v-bind="props">
                    <template #subtitle>
                      {{ item.raw.supplier_code }}
                    </template>
                  </VListItem>
                </template>
              </VSelect>
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField
                v-model="editData.batch_number"
                label="Batch Number"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VCombobox
                v-model="editData.manufacturer"
                :items="manufacturers"
                :loading="loadingManufacturers"
                label="Manufacturer"
                variant="outlined"
                density="compact"
                clearable
                item-title="title"
                item-value="value"
                :return-object="false"
                hint="Select or type manufacturer name"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField
                v-model.number="editData.cost_price"
                label="Cost Price"
                type="number"
                prefix="₦"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField
                v-model.number="editData.selling_price_override"
                label="Selling Price Override"
                type="number"
                prefix="₦"
                variant="outlined"
                density="compact"
                hint="Leave empty to use drug's default price"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField
                v-model="editData.expiry_date"
                label="Expiry Date"
                type="date"
                variant="outlined"
                density="compact"
                :disabled="editData.no_expiry"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VCheckbox
                v-model="editData.no_expiry"
                label="No Expiry"
                density="compact"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField
                v-model="editData.manufacture_date"
                label="Manufacture Date"
                type="date"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField
                v-model="editData.purchase_order_number"
                label="PO Number"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField
                v-model="editData.invoice_number"
                label="Invoice Number"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField
                v-model="editData.storage_location"
                label="Storage Location"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="editData.notes"
                label="Notes"
                variant="outlined"
                density="compact"
                rows="2"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="editDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="submitEdit">Save Changes</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Batch Confirmation Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard>
        <VCardTitle class="text-error">Delete Batch</VCardTitle>
        <VCardText>
          <VAlert type="warning" variant="tonal" class="mb-3">
            This action cannot be undone!
          </VAlert>
          <p>
            Are you sure you want to delete batch <strong>{{ selectedBatch?.batch_number }}</strong>?
          </p>
          <p class="text-caption text-medium-emphasis mt-2">
            Internal ID: {{ selectedBatch?.internal_batch_id }}
          </p>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" :loading="saving" @click="submitDelete">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'

const props = defineProps({
  drug: Object,
})

const emit = defineEmits(['receive-stock', 'updated'])

// API Base
const API_BASE = '/admin-api/pharmacy'

// State
const loading = ref(false)
const saving = ref(false)
const loadingTransactions = ref(false)
const batches = ref([])
const stockInfo = ref(null)
const transactions = ref([])
const selectedBatch = ref(null)
const manufacturers = ref([])
const suppliers = ref([])
const pharmacies = ref([])
const loadingManufacturers = ref(false)
const loadingSuppliers = ref(false)
const loadingPharmacies = ref(false)

// Dialogs
const adjustDialog = ref(false)
const returnDialog = ref(false)
const writeOffDialog = ref(false)
const transactionsDialog = ref(false)
const editDialog = ref(false)
const deleteDialog = ref(false)

// Form Data
const adjustData = reactive({
  adjustment_type: 'add',
  quantity: 1,
  reason: '',
  reference_number: '',
})

const returnData = reactive({
  quantity: 1,
  reason: '',
  return_authorization_number: '',
  credit_note_number: '',
})

const writeOffData = reactive({
  writeoff_type: 'expired',
  quantity: null,
  reason: '',
})

const editData = reactive({
  batch_number: '',
  manufacturer: '',
  supplier_id: null,
  pharmacy_id: null,
  cost_price: null,
  selling_price_override: null,
  expiry_date: '',
  no_expiry: false,
  manufacture_date: '',
  purchase_order_number: '',
  invoice_number: '',
  storage_location: '',
  notes: '',
})

// Auth Headers
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.access_token}`,
  }
}

// Fetch Batches
const fetchBatches = async () => {
  if (!props.drug?._id) return

  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/drugs/${props.drug._id}/batches`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    const data = result.result || result.data
    if (response.ok && data) {
      batches.value = data.batches || []
      stockInfo.value = data.stockInfo || {}
    }
  } catch (error) {
    console.error('Failed to fetch batches:', error)
  } finally {
    loading.value = false
  }
}

// Fetch Manufacturers for dropdown
const fetchManufacturers = async () => {
  loadingManufacturers.value = true
  try {
    const response = await fetch(`${API_BASE}/manufacturers`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    const data = result.result || result.data
    if (response.ok && data) {
      manufacturers.value = data.map(m => ({
        title: m.name,
        value: m.name, // Use name as value for flexibility (works with string or object manufacturer)
        _id: m._id,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch manufacturers:', error)
  } finally {
    loadingManufacturers.value = false
  }
}

// Fetch Suppliers for dropdown
const fetchSuppliers = async () => {
  loadingSuppliers.value = true
  try {
    const response = await fetch(`${API_BASE}/suppliers?limit=100`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    const data = result.result || result.data
    if (response.ok && data) {
      suppliers.value = data.suppliers || data || []
    }
  } catch (error) {
    console.error('Failed to fetch suppliers:', error)
  } finally {
    loadingSuppliers.value = false
  }
}

// Fetch Pharmacies for dropdown
const fetchPharmacies = async () => {
  loadingPharmacies.value = true
  try {
    const response = await fetch(`${API_BASE}/pharmacies?status=active&limit=100`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    const data = result.result || result.data
    if (response.ok && data) {
      pharmacies.value = data.pharmacies || data || []
    }
  } catch (error) {
    console.error('Failed to fetch pharmacies:', error)
  } finally {
    loadingPharmacies.value = false
  }
}

// Fetch Transactions
const viewTransactions = async (batch) => {
  selectedBatch.value = batch
  transactionsDialog.value = true
  loadingTransactions.value = true

  try {
    const response = await fetch(`${API_BASE}/batches/${batch._id}/transactions?limit=50`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    const data = result.result || result.data
    if (response.ok && data) {
      transactions.value = data.transactions || []
    }
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
  } finally {
    loadingTransactions.value = false
  }
}

// Dialog Openers
const openAdjustDialog = (batch) => {
  selectedBatch.value = batch
  adjustData.adjustment_type = 'add'
  adjustData.quantity = 1
  adjustData.reason = ''
  adjustData.reference_number = ''
  adjustDialog.value = true
}

const openReturnDialog = (batch) => {
  selectedBatch.value = batch
  returnData.quantity = 1
  returnData.reason = ''
  returnData.return_authorization_number = ''
  returnData.credit_note_number = ''
  returnDialog.value = true
}

const openWriteOffDialog = (batch) => {
  selectedBatch.value = batch
  writeOffData.writeoff_type = batch.is_expired ? 'expired' : 'damaged'
  writeOffData.quantity = null
  writeOffData.reason = ''
  writeOffDialog.value = true
}

const openStatusDialog = async (batch, status) => {
  try {
    const response = await fetch(`${API_BASE}/batches/${batch._id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, reason: `Status changed to ${status}` }),
    })
    if (response.ok) {
      fetchBatches()
      emit('updated')
    }
  } catch (error) {
    console.error('Failed to change status:', error)
  }
}

const openEditDialog = async (batch) => {
  selectedBatch.value = batch

  // Fetch dropdown data if not already loaded
  const fetchPromises = []
  if (manufacturers.value.length === 0) {
    fetchPromises.push(fetchManufacturers())
  }
  if (suppliers.value.length === 0) {
    fetchPromises.push(fetchSuppliers())
  }
  if (pharmacies.value.length === 0) {
    fetchPromises.push(fetchPharmacies())
  }
  if (fetchPromises.length > 0) {
    await Promise.all(fetchPromises)
  }

  // Format dates for input[type="date"]
  const formatDateForInput = (date) => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }
  editData.batch_number = batch.batch_number || ''

  // Get manufacturer - batch.manufacturer can be:
  // - A string (e.g., "66777777", "GlaxoSmithKline")
  // - An object with name property (populated reference)
  let mfgName = ''
  if (batch.manufacturer) {
    if (typeof batch.manufacturer === 'object' && batch.manufacturer.name) {
      mfgName = batch.manufacturer.name
    } else if (typeof batch.manufacturer === 'string') {
      mfgName = batch.manufacturer
    }
  }

  editData.manufacturer = mfgName
  // Get supplier_id - can be object (populated) or string
  editData.supplier_id = batch.supplier_id?._id || batch.supplier_id || null
  // Get pharmacy_id - can be object (populated) or string
  editData.pharmacy_id = batch.pharmacy_id?._id || batch.pharmacy_id || null
  editData.cost_price = batch.cost_price || null
  editData.selling_price_override = batch.selling_price_override || null
  editData.expiry_date = formatDateForInput(batch.expiry_date)
  editData.no_expiry = batch.no_expiry || false
  editData.manufacture_date = formatDateForInput(batch.manufacture_date)
  editData.purchase_order_number = batch.purchase_order_number || ''
  editData.invoice_number = batch.invoice_number || ''
  editData.storage_location = batch.storage?.location || ''
  editData.notes = batch.notes || ''
  editDialog.value = true
}

const openDeleteDialog = (batch) => {
  selectedBatch.value = batch
  deleteDialog.value = true
}

// Submit Actions
const submitAdjustment = async () => {
  if (!adjustData.reason) {
    alert('Reason is required')
    return
  }

  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/batches/${selectedBatch.value._id}/adjust`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(adjustData),
    })
    const result = await response.json()
    if (response.ok) {
      adjustDialog.value = false
      fetchBatches()
      emit('updated')
    } else {
      alert(result.message || 'Failed to adjust stock')
    }
  } catch (error) {
    console.error('Failed to adjust stock:', error)
  } finally {
    saving.value = false
  }
}

const submitReturn = async () => {
  if (!returnData.reason) {
    alert('Reason is required')
    return
  }

  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/batches/${selectedBatch.value._id}/return`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(returnData),
    })
    const result = await response.json()
    if (response.ok) {
      returnDialog.value = false
      fetchBatches()
      emit('updated')
    } else {
      alert(result.message || 'Failed to return stock')
    }
  } catch (error) {
    console.error('Failed to return stock:', error)
  } finally {
    saving.value = false
  }
}

const submitWriteOff = async () => {
  if (!writeOffData.reason) {
    alert('Reason is required')
    return
  }

  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/batches/${selectedBatch.value._id}/writeoff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...writeOffData,
        quantity: writeOffData.quantity || undefined,
      }),
    })
    const result = await response.json()
    if (response.ok) {
      writeOffDialog.value = false
      fetchBatches()
      emit('updated')
    } else {
      alert(result.message || 'Failed to write off stock')
    }
  } catch (error) {
    console.error('Failed to write off stock:', error)
  } finally {
    saving.value = false
  }
}

const submitEdit = async () => {
  saving.value = true
  try {
    // Build payload with only changed/valid fields
    const payload = {}
    if (editData.batch_number) payload.batch_number = editData.batch_number
    if (editData.manufacturer) payload.manufacturer = editData.manufacturer
    if (editData.supplier_id) payload.supplier_id = editData.supplier_id
    if (editData.pharmacy_id) payload.pharmacy_id = editData.pharmacy_id
    if (editData.cost_price !== null) payload.cost_price = editData.cost_price
    if (editData.selling_price_override !== null) payload.selling_price_override = editData.selling_price_override
    if (editData.no_expiry) {
      payload.no_expiry = true
      payload.expiry_date = null
    } else if (editData.expiry_date) {
      payload.expiry_date = new Date(editData.expiry_date)
      payload.no_expiry = false
    }
    if (editData.manufacture_date) payload.manufacture_date = new Date(editData.manufacture_date)
    if (editData.purchase_order_number) payload.purchase_order_number = editData.purchase_order_number
    if (editData.invoice_number) payload.invoice_number = editData.invoice_number
    if (editData.storage_location) payload.storage = { location: editData.storage_location }
    if (editData.notes) payload.notes = editData.notes

    const response = await fetch(`${API_BASE}/batches/${selectedBatch.value._id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    const result = await response.json()
    if (response.ok) {
      editDialog.value = false
      fetchBatches()
      emit('updated')
    } else {
      alert(result.message || 'Failed to update batch')
    }
  } catch (error) {
    console.error('Failed to update batch:', error)
  } finally {
    saving.value = false
  }
}

const submitDelete = async () => {
  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/batches/${selectedBatch.value._id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (response.ok) {
      deleteDialog.value = false
      fetchBatches()
      emit('updated')
    } else {
      alert(result.message || 'Failed to delete batch')
    }
  } catch (error) {
    console.error('Failed to delete batch:', error)
  } finally {
    saving.value = false
  }
}

// Helpers
const getExpiryDays = (batch) => {
  if (batch.no_expiry || !batch.expiry_date) return null
  return Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
}

const getExpiryColor = (batch) => {
  const days = getExpiryDays(batch)
  if (days === null) return 'grey'
  if (days <= 0) return 'error'
  if (days <= 30) return 'error'
  if (days <= 60) return 'warning'
  if (days <= 90) return 'info'
  return 'success'
}

const getExpiryTextClass = (batch) => {
  const days = getExpiryDays(batch)
  if (days === null) return ''
  if (days <= 0) return 'text-error'
  if (days <= 30) return 'text-error'
  if (days <= 60) return 'text-warning'
  return 'text-medium-emphasis'
}

const getExpiryText = (batch) => {
  const days = getExpiryDays(batch)
  if (days === null) return ''
  if (days <= 0) return 'EXPIRED'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    quarantine: 'warning',
    expired: 'error',
    recalled: 'error',
    depleted: 'grey',
  }
  return colors[status] || 'grey'
}

const formatStatus = (status) => {
  return status?.replace('_', ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || status
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTransactionTypeColor = (type) => {
  const colors = {
    RECEIVED: 'success',
    SOLD: 'primary',
    ADJUSTMENT_ADD: 'info',
    ADJUSTMENT_SUBTRACT: 'warning',
    RETURN_TO_SUPPLIER: 'info',
    RETURN_FROM_CUSTOMER: 'success',
    EXPIRED: 'error',
    DAMAGED: 'error',
    RECALLED: 'error',
  }
  return colors[type] || 'grey'
}

const formatTransactionType = (type) => {
  const labels = {
    RECEIVED: 'Received',
    SOLD: 'Sold',
    ADJUSTMENT_ADD: 'Added',
    ADJUSTMENT_SUBTRACT: 'Subtracted',
    RETURN_TO_SUPPLIER: 'Returned',
    RETURN_FROM_CUSTOMER: 'Customer Return',
    EXPIRED: 'Expired',
    DAMAGED: 'Damaged',
    RECALLED: 'Recalled',
  }
  return labels[type] || type
}

// Watch for drug changes
watch(() => props.drug, fetchBatches, { immediate: true })

// Expose refresh method
defineExpose({ refresh: fetchBatches })
</script>
