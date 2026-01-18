<template>
  <VDialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="700" persistent>
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>Receive Stock</span>
        <VBtn icon variant="text" @click="close">
          <VIcon>mdi-close</VIcon>
        </VBtn>
      </VCardTitle>
      <VDivider />
      <VCardText style="max-height: 70vh; overflow-y: auto;">
        <VForm ref="formRef" @submit.prevent="submit">
          <!-- Drug Selection -->
          <div class="text-subtitle-2 font-weight-bold mb-2">Product</div>
          <VRow>
            <VCol cols="12">
              <VAutocomplete
                v-model="formData.drug_id"
                v-model:search="drugSearchQuery"
                label="Select Drug *"
                :items="drugs"
                item-title="displayName"
                item-value="_id"
                :rules="[v => !!v || 'Required']"
                :loading="loadingDrugs"
                variant="outlined"
                density="compact"
                :no-filter="true"
                placeholder="Start typing to search..."
                no-data-text="Type at least 2 characters to search"
                clearable
              >
                <template #item="{ item, props }">
                  <VListItem v-bind="props">
                    <template #subtitle>
                      {{ item.raw.generic_name }} - {{ item.raw.strength }}
                    </template>
                  </VListItem>
                </template>
              </VAutocomplete>
            </VCol>
          </VRow>

          <VDivider class="my-4" />

          <!-- Pharmacy & Supplier Info -->
          <div class="text-subtitle-2 font-weight-bold mb-2">Pharmacy, Supplier & Batch Details</div>
          <VRow>
            <VCol cols="12" md="6">
              <VSelect
                v-model="formData.pharmacy_id"
                label="Pharmacy *"
                :items="pharmacies"
                item-title="name"
                item-value="_id"
                :rules="[v => !!v || 'Required']"
                :loading="loadingPharmacies"
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
            <VCol cols="12" md="6">
              <VSelect
                v-model="formData.supplier_id"
                label="Supplier *"
                :items="suppliers"
                item-title="name"
                item-value="_id"
                :rules="[v => !!v || 'Required']"
                :loading="loadingSuppliers"
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
            <VCol cols="12" md="6">
              <VTextField
                v-model="formData.batch_number"
                label="Batch/Lot Number *"
                :rules="[v => !!v || 'Required']"
                variant="outlined"
                density="compact"
              />
            </VCol>
          </VRow>

          <VDivider class="my-4" />

          <!-- Quantity & Pricing -->
          <div class="text-subtitle-2 font-weight-bold mb-2">Quantity & Pricing</div>
          <VRow>
            <VCol cols="12" md="4">
              <VTextField
                v-model.number="formData.quantity"
                label="Quantity *"
                type="number"
                :rules="[v => v > 0 || 'Must be greater than 0']"
                variant="outlined"
                density="compact"
                min="1"
              />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField
                v-model.number="formData.cost_price"
                label="Cost Price per Unit *"
                type="number"
                :rules="[v => v >= 0 || 'Must be 0 or greater']"
                variant="outlined"
                density="compact"
                prefix="₦"
                min="0"
                step="0.01"
              />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField
                v-model.number="formData.selling_price_override"
                label="Selling Price Override"
                type="number"
                variant="outlined"
                density="compact"
                prefix="₦"
                min="0"
                step="0.01"
                hint="Optional - Override default selling price"
              />
            </VCol>
          </VRow>

          <!-- Total Preview -->
          <VAlert v-if="formData.quantity && formData.cost_price" type="info" variant="tonal" class="mb-4">
            <div class="d-flex justify-space-between">
              <span>Total Cost:</span>
              <strong>₦{{ (formData.quantity * formData.cost_price).toLocaleString() }}</strong>
            </div>
          </VAlert>

          <VDivider class="my-4" />

          <!-- Dates -->
          <div class="text-subtitle-2 font-weight-bold mb-2">Dates</div>
          <VRow>
            <VCol cols="12" md="4">
              <VTextField
                v-model="formData.expiry_date"
                label="Expiry Date"
                type="date"
                variant="outlined"
                density="compact"
                :disabled="formData.no_expiry"
                :rules="[v => formData.no_expiry || !!v || 'Required unless no expiry']"
              />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField
                v-model="formData.manufacture_date"
                label="Manufacture Date"
                type="date"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField
                v-model="formData.received_date"
                label="Received Date"
                type="date"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12">
              <VCheckbox
                v-model="formData.no_expiry"
                label="This item does not expire"
                density="compact"
              />
            </VCol>
          </VRow>

          <VDivider class="my-4" />

          <!-- Purchase Details -->
          <div class="text-subtitle-2 font-weight-bold mb-2">Purchase Details</div>
          <VRow>
            <VCol cols="12" md="4">
              <VTextField
                v-model="formData.purchase_order_number"
                label="PO Number"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField
                v-model="formData.invoice_number"
                label="Invoice Number"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12" md="4">
              <VAutocomplete
                v-model="formData.manufacturer"
                label="Manufacturer (if different)"
                :items="manufacturers"
                item-title="name"
                item-value="_id"
                :loading="loadingManufacturers"
                variant="outlined"
                density="compact"
                clearable
                hint="Leave blank to use drug's default"
              >
                <template #item="{ item, props }">
                  <VListItem v-bind="props">
                    <template #subtitle>
                      {{ item.raw.country || 'Unknown country' }}
                    </template>
                  </VListItem>
                </template>
              </VAutocomplete>
            </VCol>
          </VRow>

          <VDivider class="my-4" />

          <!-- Storage -->
          <div class="text-subtitle-2 font-weight-bold mb-2">Storage</div>
          <VRow>
            <VCol cols="12" md="6">
              <VTextField
                v-model="formData.storage.location"
                label="Storage Location"
                variant="outlined"
                density="compact"
                placeholder="e.g., Shelf A-3, Refrigerator 1"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VSelect
                v-model="formData.storage.temperature_requirement"
                label="Temperature Requirement"
                :items="temperatureOptions"
                variant="outlined"
                density="compact"
                clearable
              />
            </VCol>
          </VRow>

          <!-- Notes -->
          <VRow>
            <VCol cols="12">
              <VTextarea
                v-model="formData.notes"
                label="Notes"
                rows="2"
                variant="outlined"
                density="compact"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
      <VDivider />
      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="close">Cancel</VBtn>
        <VBtn color="primary" :loading="saving" @click="submit">
          Receive Stock
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { debounce } from 'lodash'

const props = defineProps({
  modelValue: Boolean,
  preselectedDrug: Object,
})

const emit = defineEmits(['update:modelValue', 'saved'])

// API Base
const API_BASE = '/admin-api/pharmacy'

// State
const formRef = ref(null)
const saving = ref(false)
const loadingDrugs = ref(false)
const loadingSuppliers = ref(false)
const loadingManufacturers = ref(false)
const loadingPharmacies = ref(false)
const drugs = ref([])
const suppliers = ref([])
const manufacturers = ref([])
const pharmacies = ref([])
const drugSearchQuery = ref('')

// Form Data
const defaultFormData = {
  drug_id: null,
  supplier_id: null,
  pharmacy_id: null,
  batch_number: '',
  quantity: 1,
  cost_price: 0,
  selling_price_override: null,
  expiry_date: '',
  no_expiry: false,
  manufacture_date: '',
  received_date: new Date().toISOString().slice(0, 10),
  manufacturer: '',
  purchase_order_number: '',
  invoice_number: '',
  storage: {
    location: '',
    temperature_requirement: '',
  },
  notes: '',
}

const formData = reactive({ ...defaultFormData })

const temperatureOptions = [
  'Room Temperature (15-25°C)',
  'Cool (8-15°C)',
  'Refrigerated (2-8°C)',
  'Frozen (-20°C)',
  'Deep Frozen (-80°C)',
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
  loadingSuppliers.value = true
  try {
    const response = await fetch(`${API_BASE}/suppliers?status=active&limit=100`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    // Response format: { data: { suppliers: [...] } } or { result: { suppliers: [...] } }
    const data = result.data || result.result
    if (response.ok && data) {
      suppliers.value = data.suppliers || []
    }
  } catch (error) {
    console.error('Failed to fetch suppliers:', error)
  } finally {
    loadingSuppliers.value = false
  }
}

// Fetch Manufacturers
const fetchManufacturers = async () => {
  loadingManufacturers.value = true
  try {
    const response = await fetch(`${API_BASE}/manufacturers`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    // Backend returns { message, result } where result is the array
    const data = result.result || result.data
    if (response.ok && data) {
      manufacturers.value = Array.isArray(data) ? data : []
      console.log('Loaded manufacturers:', manufacturers.value.length)
    }
  } catch (error) {
    console.error('Failed to fetch manufacturers:', error)
  } finally {
    loadingManufacturers.value = false
  }
}

// Fetch Pharmacies
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
      // Set default pharmacy if none selected
      if (!formData.pharmacy_id && pharmacies.value.length > 0) {
        formData.pharmacy_id = pharmacies.value[0]._id
      }
    }
  } catch (error) {
    console.error('Failed to fetch pharmacies:', error)
  } finally {
    loadingPharmacies.value = false
  }
}

// Search Drugs
const searchDrugs = async (query) => {
  if (!query || query.length < 2) {
    // Keep existing drugs if we have a preselected one
    if (!props.preselectedDrug) {
      drugs.value = []
    }
    return
  }
  loadingDrugs.value = true
  try {
    const response = await fetch(`${API_BASE}/inventory?search=${encodeURIComponent(query)}&limit=20`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (result.success) {
      drugs.value = result.data.drugs.map(d => ({
        ...d,
        displayName: `${d.name} - ${d.strength}`,
      }))
    }
  } catch (error) {
    console.error('Failed to search drugs:', error)
  } finally {
    loadingDrugs.value = false
  }
}

// Debounced search watcher
const debouncedSearch = debounce((query) => {
  searchDrugs(query)
}, 300)

// Watch search query changes
watch(drugSearchQuery, (newQuery) => {
  // Don't search if we already have a selected drug and the query matches
  if (formData.drug_id && drugs.value.length > 0) {
    const selectedDrug = drugs.value.find(d => d._id === formData.drug_id)
    if (selectedDrug && selectedDrug.displayName === newQuery) {
      return
    }
  }
  debouncedSearch(newQuery)
})

// Submit
const submit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  try {
    const payload = {
      ...formData,
      expiry_date: formData.no_expiry ? undefined : formData.expiry_date,
      selling_price_override: formData.selling_price_override || undefined,
      manufacture_date: formData.manufacture_date || undefined,
      manufacturer: formData.manufacturer || undefined,
      storage: formData.storage.location || formData.storage.temperature_requirement ? formData.storage : undefined,
    }

    const response = await fetch(`${API_BASE}/batches/receive`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (response.ok) {
      emit('saved', result.result || result.data)
      close()
    } else {
      alert(result.message || 'Failed to receive stock')
    }
  } catch (error) {
    console.error('Failed to receive stock:', error)
    alert('Failed to receive stock')
  } finally {
    saving.value = false
  }
}

// Close
const close = () => {
  Object.assign(formData, { ...defaultFormData, storage: { location: '', temperature_requirement: '' }, pharmacy_id: null })
  drugSearchQuery.value = ''
  drugs.value = []
  emit('update:modelValue', false)
}

// Watch for preselected drug
watch(() => props.preselectedDrug, (drug) => {
  if (drug) {
    formData.drug_id = drug._id
    drugs.value = [{
      ...drug,
      displayName: `${drug.name} - ${drug.strength}`,
    }]
  }
}, { immediate: true })

// Watch dialog open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    fetchSuppliers()
    fetchManufacturers()
    fetchPharmacies()
    if (props.preselectedDrug) {
      formData.drug_id = props.preselectedDrug._id
      // If preselected drug has a pharmacy, use it
      if (props.preselectedDrug.pharmacy_id) {
        formData.pharmacy_id = props.preselectedDrug.pharmacy_id._id || props.preselectedDrug.pharmacy_id
      }
      drugs.value = [{
        ...props.preselectedDrug,
        displayName: `${props.preselectedDrug.name} - ${props.preselectedDrug.strength}`,
      }]
    }
  }
})
</script>
