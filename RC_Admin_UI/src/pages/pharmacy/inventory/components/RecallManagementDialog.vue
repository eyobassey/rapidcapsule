<template>
  <VDialog v-model="dialogOpen" max-width="700" persistent>
    <VCard>
      <VCardTitle class="d-flex align-center bg-error-darken-1 text-white">
        <VIcon class="mr-2">mdi-alert-octagram</VIcon>
        Recall Management
        <VSpacer />
        <VBtn icon variant="text" color="white" @click="close">
          <VIcon>mdi-close</VIcon>
        </VBtn>
      </VCardTitle>

      <VCardText class="pt-4">
        <!-- Recall Mode Selection -->
        <VBtnToggle v-model="recallMode" mandatory class="mb-4" divided>
          <VBtn value="batch" size="small">
            <VIcon start>mdi-package-variant</VIcon>
            Single Batch
          </VBtn>
          <VBtn value="manufacturer" size="small">
            <VIcon start>mdi-factory</VIcon>
            By Manufacturer
          </VBtn>
          <VBtn value="supplier" size="small">
            <VIcon start>mdi-truck</VIcon>
            By Supplier
          </VBtn>
        </VBtnToggle>

        <!-- Single Batch Recall -->
        <template v-if="recallMode === 'batch'">
          <VAlert type="info" variant="tonal" class="mb-4" density="compact">
            Select a specific drug and batch to recall.
          </VAlert>

          <VAutocomplete
            v-model="selectedDrugId"
            :items="drugs"
            item-title="displayName"
            item-value="_id"
            label="Select Drug *"
            :loading="loadingDrugs"
            @update:model-value="onDrugSelected"
            clearable
          />

          <VAutocomplete
            v-model="selectedBatchId"
            :items="batches"
            item-title="displayName"
            item-value="_id"
            label="Select Batch *"
            :loading="loadingBatches"
            :disabled="!selectedDrugId"
            class="mt-3"
            @update:model-value="onBatchSelected"
          >
            <template #item="{ props, item }">
              <VListItem v-bind="props">
                <template #subtitle>
                  <span>Qty: {{ item.raw.quantity_available }}</span>
                  <span class="mx-2">|</span>
                  <span v-if="item.raw.expiry_date">Exp: {{ formatDate(item.raw.expiry_date) }}</span>
                  <span v-else>No Expiry</span>
                </template>
              </VListItem>
            </template>
          </VAutocomplete>

          <!-- Quantity Selection for Single Batch -->
          <template v-if="selectedBatch">
            <div class="mt-4">
              <div class="text-subtitle-2 mb-2">Recall Quantity</div>
              <VRadioGroup v-model="recallAll" inline hide-details>
                <VRadio :value="true" label="Recall all remaining quantity" />
                <VRadio :value="false" label="Specify quantity" />
              </VRadioGroup>
              <VTextField
                v-if="!recallAll"
                v-model.number="recallQuantity"
                type="number"
                label="Quantity to Recall"
                :min="1"
                :max="selectedBatch.quantity_available"
                :rules="[
                  v => v > 0 || 'Must be greater than 0',
                  v => v <= selectedBatch.quantity_available || 'Cannot exceed available quantity'
                ]"
                class="mt-3"
                density="compact"
              />
              <VAlert
                v-if="recallAll"
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                All {{ selectedBatch.quantity_available }} units will be recalled and removed from inventory.
              </VAlert>
              <VAlert
                v-else-if="recallQuantity > 0 && recallQuantity < selectedBatch.quantity_available"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                {{ recallQuantity }} of {{ selectedBatch.quantity_available }} units will be recalled.
                The batch will remain active with {{ selectedBatch.quantity_available - recallQuantity }} units.
              </VAlert>
            </div>
          </template>
        </template>

        <!-- Manufacturer Recall -->
        <template v-else-if="recallMode === 'manufacturer'">
          <VAlert type="warning" variant="tonal" class="mb-4" density="compact">
            This will recall ALL active batches from the selected manufacturer across all drugs.
          </VAlert>

          <VAutocomplete
            v-model="selectedManufacturer"
            :items="manufacturers"
            item-title="name"
            item-value="name"
            label="Select Manufacturer *"
            :loading="loadingManufacturers"
            @update:model-value="previewManufacturerRecall"
            clearable
          />

          <VCard v-if="previewBatches.length > 0" variant="outlined" class="mt-4">
            <VCardTitle class="text-body-1 bg-grey-lighten-4">
              <VIcon start color="warning">mdi-alert</VIcon>
              {{ previewBatches.length }} batch(es) will be recalled
            </VCardTitle>
            <VList density="compact" max-height="200" class="overflow-y-auto">
              <VListItem v-for="batch in previewBatches" :key="batch._id">
                <VListItemTitle>{{ batch.drug_id?.name || 'Unknown Drug' }}</VListItemTitle>
                <VListItemSubtitle>
                  Batch: {{ batch.batch_number }} | Qty: {{ batch.quantity_available }}
                </VListItemSubtitle>
              </VListItem>
            </VList>
          </VCard>
        </template>

        <!-- Supplier Recall -->
        <template v-else-if="recallMode === 'supplier'">
          <VAlert type="warning" variant="tonal" class="mb-4" density="compact">
            This will recall ALL active batches from the selected supplier across all drugs.
          </VAlert>

          <VAutocomplete
            v-model="selectedSupplierId"
            :items="suppliers"
            item-title="displayName"
            item-value="_id"
            label="Select Supplier *"
            :loading="loadingSuppliers"
            @update:model-value="previewSupplierRecall"
            clearable
          />

          <VCard v-if="previewBatches.length > 0" variant="outlined" class="mt-4">
            <VCardTitle class="text-body-1 bg-grey-lighten-4">
              <VIcon start color="warning">mdi-alert</VIcon>
              {{ previewBatches.length }} batch(es) will be recalled
            </VCardTitle>
            <VList density="compact" max-height="200" class="overflow-y-auto">
              <VListItem v-for="batch in previewBatches" :key="batch._id">
                <VListItemTitle>{{ batch.drug_id?.name || 'Unknown Drug' }}</VListItemTitle>
                <VListItemSubtitle>
                  Batch: {{ batch.batch_number }} | Qty: {{ batch.quantity_available }}
                </VListItemSubtitle>
              </VListItem>
            </VList>
          </VCard>
        </template>

        <VDivider class="my-4" />

        <!-- Recall Details -->
        <div class="text-subtitle-1 font-weight-medium mb-2">Recall Details</div>

        <VTextField
          v-model="recallNumber"
          label="Recall Number *"
          placeholder="e.g., FDA-2025-001, MFR-RC-123"
          hint="Official recall reference number"
          persistent-hint
          class="mb-3"
        />

        <VSelect
          v-model="recallClass"
          :items="recallClasses"
          item-title="label"
          item-value="value"
          label="Recall Class"
          hint="Classification of recall severity"
          persistent-hint
          class="mb-3"
        />

        <VTextarea
          v-model="recallReason"
          label="Recall Reason *"
          rows="3"
          placeholder="Describe the reason for this recall (e.g., contamination, incorrect labeling, safety concerns)"
        />

        <VCheckbox
          v-model="notifyPatients"
          label="Flag batches for patient notification"
          hint="Mark if patients who received these batches should be notified"
          persistent-hint
          class="mt-2"
        />
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VBtn variant="text" @click="close">Cancel</VBtn>
        <VSpacer />
        <VBtn
          color="error"
          :loading="saving"
          :disabled="!canSubmit"
          @click="submitRecall"
        >
          <VIcon start>mdi-alert-octagram</VIcon>
          Confirm Recall
        </VBtn>
      </VCardActions>
    </VCard>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </VDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'recalled'])

const dialogOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Mode and selection state
const recallMode = ref('batch')
const selectedDrugId = ref(null)
const selectedBatchId = ref(null)
const selectedManufacturer = ref(null)
const selectedSupplierId = ref(null)
const previewBatches = ref([])

// Form state
const recallNumber = ref('')
const recallClass = ref('')
const recallReason = ref('')
const notifyPatients = ref(false)
const recallAll = ref(true)
const recallQuantity = ref(1)

// Data lists
const drugs = ref([])
const batches = ref([])
const manufacturers = ref([])
const suppliers = ref([])

// Loading states
const loadingDrugs = ref(false)
const loadingBatches = ref(false)
const loadingManufacturers = ref(false)
const loadingSuppliers = ref(false)
const saving = ref(false)

const recallClasses = [
  { value: '', label: 'Not Specified' },
  { value: 'Class I', label: 'Class I - Most Serious (health hazard)' },
  { value: 'Class II', label: 'Class II - Less Serious (temporary/reversible)' },
  { value: 'Class III', label: 'Class III - Least Serious (unlikely health hazard)' },
]

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const API_BASE = '/admin-api/pharmacy'

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.access_token}`,
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Get selected batch object
const selectedBatch = computed(() => {
  if (!selectedBatchId.value) return null
  return batches.value.find(b => b._id === selectedBatchId.value)
})

const canSubmit = computed(() => {
  if (!recallReason.value) return false

  if (recallMode.value === 'batch') {
    if (!selectedBatchId.value) return false
    // If specifying quantity, validate it
    if (!recallAll.value) {
      const batch = selectedBatch.value
      if (!batch || recallQuantity.value <= 0 || recallQuantity.value > batch.quantity_available) {
        return false
      }
    }
    return true
  } else if (recallMode.value === 'manufacturer') {
    return selectedManufacturer.value && previewBatches.value.length > 0
  } else if (recallMode.value === 'supplier') {
    return selectedSupplierId.value && previewBatches.value.length > 0
  }
  return false
})

// Fetch all drugs (for recall, we need to see all drugs that might have batches)
const fetchDrugs = async () => {
  loadingDrugs.value = true
  try {
    const response = await fetch(`${API_BASE}/inventory?limit=500&includeSampleData=true`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (response.ok) {
      const data = result.result || result.data
      drugs.value = (data.drugs || []).map(d => ({
        ...d,
        displayName: `${d.name}${d.strength ? ' ' + d.strength : ''}`
      }))
    } else {
      console.error('Failed to fetch drugs:', result.message)
    }
  } catch (error) {
    console.error('Failed to fetch drugs:', error)
  } finally {
    loadingDrugs.value = false
  }
}

// Fetch batches for selected drug
const fetchBatches = async (drugId) => {
  if (!drugId) {
    batches.value = []
    return
  }

  loadingBatches.value = true
  try {
    const response = await fetch(`${API_BASE}/drugs/${drugId}/batches?hasStock=true`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (response.ok) {
      const data = result.result || result.data
      batches.value = (data.batches || []).map(b => ({
        ...b,
        displayName: `${b.batch_number} (Qty: ${b.quantity_available})`
      }))
    }
  } catch (error) {
    console.error('Failed to fetch batches:', error)
  } finally {
    loadingBatches.value = false
  }
}

// Fetch manufacturers
const fetchManufacturers = async () => {
  loadingManufacturers.value = true
  try {
    const response = await fetch(`${API_BASE}/manufacturers`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (response.ok) {
      const data = result.result || result.data
      manufacturers.value = Array.isArray(data) ? data : []
    }
  } catch (error) {
    console.error('Failed to fetch manufacturers:', error)
  } finally {
    loadingManufacturers.value = false
  }
}

// Fetch suppliers
const fetchSuppliers = async () => {
  loadingSuppliers.value = true
  try {
    const response = await fetch(`${API_BASE}/suppliers?limit=200`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (response.ok) {
      const data = result.result || result.data
      suppliers.value = (data.suppliers || []).map(s => ({
        ...s,
        displayName: `${s.name} (${s.supplier_code})`
      }))
    }
  } catch (error) {
    console.error('Failed to fetch suppliers:', error)
  } finally {
    loadingSuppliers.value = false
  }
}

// Preview batches for manufacturer recall
const previewManufacturerRecall = async (manufacturerName) => {
  if (!manufacturerName) {
    previewBatches.value = []
    return
  }

  try {
    // Fetch all batches with stock, then filter by manufacturer
    const response = await fetch(`${API_BASE}/batches?hasStock=true&status=active&limit=500`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (response.ok) {
      const data = result.result || result.data
      previewBatches.value = (data.batches || []).filter(
        b => b.manufacturer?.toLowerCase() === manufacturerName.toLowerCase()
      )
    }
  } catch (error) {
    console.error('Failed to preview manufacturer batches:', error)
    previewBatches.value = []
  }
}

// Preview batches for supplier recall
const previewSupplierRecall = async (supplierId) => {
  if (!supplierId) {
    previewBatches.value = []
    return
  }

  try {
    const response = await fetch(`${API_BASE}/batches?supplier_id=${supplierId}&hasStock=true&status=active&limit=500`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (response.ok) {
      const data = result.result || result.data
      previewBatches.value = data.batches || []
    }
  } catch (error) {
    console.error('Failed to preview supplier batches:', error)
    previewBatches.value = []
  }
}

const onDrugSelected = (drugId) => {
  selectedBatchId.value = null
  recallAll.value = true
  recallQuantity.value = 1
  fetchBatches(drugId)
}

const onBatchSelected = () => {
  if (selectedBatch.value) {
    recallQuantity.value = selectedBatch.value.quantity_available
  }
}

const submitRecall = async () => {
  saving.value = true

  try {
    if (recallMode.value === 'batch') {
      // Single batch recall - calculate quantity
      const batch = selectedBatch.value
      const qtyToRecall = recallAll.value ? batch.quantity_available : recallQuantity.value
      await recallSingleBatch(selectedBatchId.value, qtyToRecall)
    } else {
      // Bulk recall (manufacturer or supplier) - always recall all
      const batchesToRecall = previewBatches.value
      let successCount = 0
      let failCount = 0

      for (const batch of batchesToRecall) {
        try {
          await recallSingleBatch(batch._id, batch.quantity_available)
          successCount++
        } catch {
          failCount++
        }
      }

      if (failCount > 0) {
        showSnackbar(`Recalled ${successCount} batch(es). ${failCount} failed.`, 'warning')
      } else {
        showSnackbar(`Successfully recalled ${successCount} batch(es)`)
      }
    }

    emit('recalled')
    close()
  } catch (error) {
    console.error('Failed to process recall:', error)
    showSnackbar('Failed to process recall', 'error')
  } finally {
    saving.value = false
  }
}

const recallSingleBatch = async (batchId, quantity) => {
  const response = await fetch(`${API_BASE}/batches/${batchId}/recall`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      recall_number: recallNumber.value || `RCL-${Date.now()}`,
      recall_reason: recallReason.value,
      recall_class: recallClass.value || undefined,
      quantity: quantity,
      notes: notifyPatients.value ? 'Flag for patient notification' : undefined,
    }),
  })

  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.message || 'Failed to recall batch')
  }

  if (recallMode.value === 'batch') {
    showSnackbar('Batch recalled successfully')
  }
}

const close = () => {
  dialogOpen.value = false
  resetForm()
}

const resetForm = () => {
  recallMode.value = 'batch'
  selectedDrugId.value = null
  selectedBatchId.value = null
  selectedManufacturer.value = null
  selectedSupplierId.value = null
  previewBatches.value = []
  recallNumber.value = ''
  recallClass.value = ''
  recallReason.value = ''
  notifyPatients.value = false
  recallAll.value = true
  recallQuantity.value = 1
  batches.value = []
}

// Watch for mode changes to reset selections
watch(recallMode, () => {
  selectedDrugId.value = null
  selectedBatchId.value = null
  selectedManufacturer.value = null
  selectedSupplierId.value = null
  previewBatches.value = []
  batches.value = []
})

// Initialize data when dialog opens
watch(dialogOpen, (isOpen) => {
  if (isOpen) {
    fetchDrugs()
    fetchManufacturers()
    fetchSuppliers()
  }
})
</script>
