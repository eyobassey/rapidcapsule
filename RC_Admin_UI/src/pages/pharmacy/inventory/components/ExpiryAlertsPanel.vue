<template>
  <VCard>
    <VCardTitle class="d-flex justify-space-between align-center">
      <div class="d-flex align-center gap-2">
        <VIcon color="warning">mdi-alert-circle</VIcon>
        <span>Expiry Alerts</span>
      </div>
      <VBtn
        variant="text"
        size="small"
        @click="fetchAlerts"
        :loading="loading"
      >
        <VIcon>mdi-refresh</VIcon>
      </VBtn>
    </VCardTitle>
    <VDivider />
    <VCardText v-if="loading" class="d-flex justify-center pa-4">
      <VProgressCircular indeterminate color="primary" />
    </VCardText>
    <VCardText v-else-if="!hasAlerts" class="text-center pa-4">
      <VIcon size="48" color="success" class="mb-2">mdi-check-circle</VIcon>
      <div class="text-body-1">No expiry alerts</div>
      <div class="text-caption text-medium-emphasis">All batches are within safe expiry range</div>
    </VCardText>
    <template v-else>
      <!-- Summary Stats -->
      <VCardText class="pb-0">
        <VRow dense>
          <VCol cols="4">
            <div class="text-center pa-2 rounded" style="background-color: rgba(var(--v-theme-error), 0.1);">
              <div class="text-h5 font-weight-bold text-error">{{ expiredCount }}</div>
              <div class="text-caption">Expired</div>
            </div>
          </VCol>
          <VCol cols="4">
            <div class="text-center pa-2 rounded" style="background-color: rgba(var(--v-theme-warning), 0.1);">
              <div class="text-h5 font-weight-bold text-warning">{{ criticalCount }}</div>
              <div class="text-caption">Critical</div>
            </div>
          </VCol>
          <VCol cols="4">
            <div class="text-center pa-2 rounded" style="background-color: rgba(var(--v-theme-info), 0.1);">
              <div class="text-h5 font-weight-bold text-info">{{ warningCount }}</div>
              <div class="text-caption">Warning</div>
            </div>
          </VCol>
        </VRow>
      </VCardText>

      <!-- Tabs for different alert types -->
      <VTabs v-model="activeTab" density="compact" class="px-4">
        <VTab value="expired" v-if="expiredCount > 0">
          <VBadge :content="expiredCount" color="error" inline>
            Expired
          </VBadge>
        </VTab>
        <VTab value="critical" v-if="criticalCount > 0">
          <VBadge :content="criticalCount" color="warning" inline>
            Critical (&le;30 days)
          </VBadge>
        </VTab>
        <VTab value="warning" v-if="warningCount > 0">
          <VBadge :content="warningCount" color="info" inline>
            Warning (31-90 days)
          </VBadge>
        </VTab>
      </VTabs>

      <VWindow v-model="activeTab">
        <!-- Expired Batches -->
        <VWindowItem value="expired">
          <VList density="compact" class="pa-0">
            <VListItem
              v-for="batch in expiredBatches"
              :key="batch._id"
              class="px-4"
            >
              <template #prepend>
                <VAvatar color="error" size="36" variant="tonal">
                  <VIcon size="20">mdi-alert-octagon</VIcon>
                </VAvatar>
              </template>
              <VListItemTitle class="font-weight-medium">
                {{ getDrugName(batch) }}
              </VListItemTitle>
              <VListItemSubtitle>
                <span class="text-error">Batch: {{ batch.batch_number }}</span>
                <span class="mx-2">|</span>
                <span>Qty: {{ batch.quantity_available }}</span>
                <span class="mx-2">|</span>
                <span>Expired: {{ formatDate(batch.expiry_date) }}</span>
              </VListItemSubtitle>
              <template #append>
                <VMenu>
                  <template #activator="{ props }">
                    <VBtn v-bind="props" icon variant="text" size="small">
                      <VIcon>mdi-dots-vertical</VIcon>
                    </VBtn>
                  </template>
                  <VList density="compact">
                    <VListItem @click="recallBatch(batch)">
                      <template #prepend>
                        <VIcon size="small" color="error">mdi-alert-octagram</VIcon>
                      </template>
                      <VListItemTitle class="text-error">Recall Batch</VListItemTitle>
                    </VListItem>
                    <VDivider />
                    <VListItem @click="writeOffBatch(batch)">
                      <template #prepend>
                        <VIcon size="small">mdi-delete-sweep</VIcon>
                      </template>
                      <VListItemTitle>Write Off</VListItemTitle>
                    </VListItem>
                    <VListItem @click="returnBatch(batch)">
                      <template #prepend>
                        <VIcon size="small">mdi-truck-delivery</VIcon>
                      </template>
                      <VListItemTitle>Return to Supplier</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
              </template>
            </VListItem>
          </VList>
        </VWindowItem>

        <!-- Critical Batches (<=30 days) -->
        <VWindowItem value="critical">
          <VList density="compact" class="pa-0">
            <VListItem
              v-for="batch in criticalBatches"
              :key="batch._id"
              class="px-4"
            >
              <template #prepend>
                <VAvatar color="warning" size="36" variant="tonal">
                  <VIcon size="20">mdi-clock-alert</VIcon>
                </VAvatar>
              </template>
              <VListItemTitle class="font-weight-medium">
                {{ getDrugName(batch) }}
              </VListItemTitle>
              <VListItemSubtitle>
                <span>Batch: {{ batch.batch_number }}</span>
                <span class="mx-2">|</span>
                <span>Qty: {{ batch.quantity_available }}</span>
                <span class="mx-2">|</span>
                <span class="text-warning font-weight-medium">{{ getDaysUntilExpiry(batch) }} days left</span>
              </VListItemSubtitle>
              <template #append>
                <VMenu>
                  <template #activator="{ props }">
                    <VBtn v-bind="props" icon variant="text" size="small">
                      <VIcon>mdi-dots-vertical</VIcon>
                    </VBtn>
                  </template>
                  <VList density="compact">
                    <VListItem @click="recallBatch(batch)">
                      <template #prepend>
                        <VIcon size="small" color="error">mdi-alert-octagram</VIcon>
                      </template>
                      <VListItemTitle class="text-error">Recall Batch</VListItemTitle>
                    </VListItem>
                    <VDivider />
                    <VListItem @click="writeOffBatch(batch)">
                      <template #prepend>
                        <VIcon size="small">mdi-delete-sweep</VIcon>
                      </template>
                      <VListItemTitle>Write Off</VListItemTitle>
                    </VListItem>
                    <VListItem @click="returnBatch(batch)">
                      <template #prepend>
                        <VIcon size="small">mdi-truck-delivery</VIcon>
                      </template>
                      <VListItemTitle>Return to Supplier</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
              </template>
            </VListItem>
          </VList>
        </VWindowItem>

        <!-- Warning Batches (31-90 days) -->
        <VWindowItem value="warning">
          <VList density="compact" class="pa-0">
            <VListItem
              v-for="batch in warningBatches"
              :key="batch._id"
              class="px-4"
            >
              <template #prepend>
                <VAvatar color="info" size="36" variant="tonal">
                  <VIcon size="20">mdi-clock-outline</VIcon>
                </VAvatar>
              </template>
              <VListItemTitle class="font-weight-medium">
                {{ getDrugName(batch) }}
              </VListItemTitle>
              <VListItemSubtitle>
                <span>Batch: {{ batch.batch_number }}</span>
                <span class="mx-2">|</span>
                <span>Qty: {{ batch.quantity_available }}</span>
                <span class="mx-2">|</span>
                <span>{{ getDaysUntilExpiry(batch) }} days left</span>
              </VListItemSubtitle>
              <template #append>
                <VMenu>
                  <template #activator="{ props }">
                    <VBtn v-bind="props" icon variant="text" size="small">
                      <VIcon>mdi-dots-vertical</VIcon>
                    </VBtn>
                  </template>
                  <VList density="compact">
                    <VListItem @click="recallBatch(batch)">
                      <template #prepend>
                        <VIcon size="small" color="error">mdi-alert-octagram</VIcon>
                      </template>
                      <VListItemTitle class="text-error">Recall Batch</VListItemTitle>
                    </VListItem>
                    <VDivider />
                    <VListItem @click="writeOffBatch(batch)">
                      <template #prepend>
                        <VIcon size="small">mdi-delete-sweep</VIcon>
                      </template>
                      <VListItemTitle>Write Off</VListItemTitle>
                    </VListItem>
                    <VListItem @click="returnBatch(batch)">
                      <template #prepend>
                        <VIcon size="small">mdi-truck-delivery</VIcon>
                      </template>
                      <VListItemTitle>Return to Supplier</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
                <VChip size="small" color="info" variant="tonal" class="ml-2">
                  {{ formatDate(batch.expiry_date) }}
                </VChip>
              </template>
            </VListItem>
          </VList>
        </VWindowItem>
      </VWindow>
    </template>

    <!-- Write Off Dialog -->
    <VDialog v-model="writeOffDialog" max-width="400">
      <VCard>
        <VCardTitle class="text-error">Write Off Expired Batch</VCardTitle>
        <VCardText>
          <VAlert type="warning" variant="tonal" class="mb-4">
            This will permanently remove the batch from inventory and record it as a loss.
          </VAlert>
          <div class="mb-3">
            <div class="font-weight-medium">{{ selectedBatch ? getDrugName(selectedBatch) : '' }}</div>
            <div class="text-caption">Batch: {{ selectedBatch?.batch_number }}</div>
            <div class="text-caption">Quantity: {{ selectedBatch?.quantity_available }}</div>
          </div>
          <VTextarea
            v-model="writeOffReason"
            label="Reason"
            rows="2"
            placeholder="Reason for write-off"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="writeOffDialog = false">Cancel</VBtn>
          <VBtn color="error" :loading="saving" @click="confirmWriteOff">Write Off</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Return to Supplier Dialog -->
    <VDialog v-model="returnDialog" max-width="400">
      <VCard>
        <VCardTitle>Return to Supplier</VCardTitle>
        <VCardText>
          <div class="mb-3">
            <div class="font-weight-medium">{{ selectedBatch ? getDrugName(selectedBatch) : '' }}</div>
            <div class="text-caption">Batch: {{ selectedBatch?.batch_number }}</div>
            <div class="text-caption">Supplier: {{ selectedBatch ? getSupplierName(selectedBatch) : 'Unknown' }}</div>
            <div class="text-caption">Available: {{ selectedBatch?.quantity_available }}</div>
          </div>
          <VTextField
            v-model.number="returnQuantity"
            label="Quantity to Return"
            type="number"
            :max="selectedBatch?.quantity_available"
            min="1"
          />
          <VTextarea
            v-model="returnReason"
            label="Reason"
            rows="2"
            placeholder="Reason for return"
            class="mt-3"
          />
          <VTextField
            v-model="returnAuthNumber"
            label="Return Authorization Number (Optional)"
            class="mt-3"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="returnDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="confirmReturn">Return</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Recall Batch Dialog -->
    <VDialog v-model="recallDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center text-error">
          <VIcon class="mr-2">mdi-alert-octagram</VIcon>
          Recall Batch
        </VCardTitle>
        <VCardText>
          <div class="mb-4 pa-3 rounded" style="background-color: rgba(var(--v-theme-surface-variant), 0.5);">
            <div class="font-weight-medium text-h6">{{ selectedBatch ? getDrugName(selectedBatch) : '' }}</div>
            <div class="text-body-2 mt-1">
              <span>Batch: <strong>{{ selectedBatch?.batch_number }}</strong></span>
              <span class="mx-2">|</span>
              <span>Available Qty: <strong>{{ selectedBatch?.quantity_available }}</strong></span>
            </div>
            <div class="text-body-2">
              <span>Supplier: {{ selectedBatch ? getSupplierName(selectedBatch) : 'Unknown' }}</span>
            </div>
            <div class="text-body-2" v-if="selectedBatch?.manufacturer">
              <span>Manufacturer: {{ selectedBatch?.manufacturer }}</span>
            </div>
          </div>

          <!-- Quantity Selection -->
          <div class="mb-4">
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
              :max="selectedBatch?.quantity_available"
              :rules="[
                v => v > 0 || 'Must be greater than 0',
                v => v <= (selectedBatch?.quantity_available || 0) || 'Cannot exceed available quantity'
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
              All {{ selectedBatch?.quantity_available }} units will be recalled and removed from inventory.
            </VAlert>
            <VAlert
              v-else-if="recallQuantity < selectedBatch?.quantity_available"
              type="info"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              {{ recallQuantity }} of {{ selectedBatch?.quantity_available }} units will be recalled.
              The batch will remain active with {{ selectedBatch?.quantity_available - recallQuantity }} units.
            </VAlert>
          </div>

          <VDivider class="mb-4" />

          <VTextField
            v-model="recallNumber"
            label="Recall Number"
            placeholder="e.g., FDA-2025-001, MFR-RC-123"
            hint="Official recall reference number (auto-generated if empty)"
            persistent-hint
            class="mb-3"
          />
          <VTextarea
            v-model="recallReason"
            label="Recall Reason *"
            rows="3"
            placeholder="Describe the reason for this recall (e.g., contamination, incorrect labeling, safety concerns)"
            :rules="[v => !!v || 'Recall reason is required']"
          />
          <VCheckbox
            v-model="notifyPatients"
            label="Flag for patient notification"
            hint="Mark if patients who received this batch should be notified"
            persistent-hint
            class="mt-2"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="recallDialog = false">Cancel</VBtn>
          <VBtn color="error" :loading="saving" @click="confirmRecall" :disabled="!recallReason || (!recallAll && recallQuantity <= 0)">
            Recall {{ recallAll ? selectedBatch?.quantity_available : recallQuantity }} Units
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </VCard>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits(['alert-action'])

const loading = ref(false)
const saving = ref(false)
const activeTab = ref('expired')
const alerts = ref({
  expired: { count: 0, batches: [] },
  expiring_critical: { count: 0, batches: [] },
  expiring_warning: { count: 0, batches: [] },
  expiring_info: { count: 0, batches: [] },
  low_stock: { count: 0, drugs: [] },
  out_of_stock: { count: 0, drugs: [] },
})

const writeOffDialog = ref(false)
const returnDialog = ref(false)
const recallDialog = ref(false)
const selectedBatch = ref(null)
const writeOffReason = ref('')
const returnQuantity = ref(1)
const returnReason = ref('')
const returnAuthNumber = ref('')
const recallNumber = ref('')
const recallReason = ref('')
const notifyPatients = ref(false)
const recallAll = ref(true)
const recallQuantity = ref(1)

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

// Combine critical batches (<=30 days)
const criticalBatches = computed(() => {
  return alerts.value.expiring_critical?.batches || []
})

// Combine warning batches (31-90 days) - includes both warning (31-60) and info (61-90)
const warningBatches = computed(() => {
  const warning = alerts.value.expiring_warning?.batches || []
  const info = alerts.value.expiring_info?.batches || []
  return [...warning, ...info]
})

// Expired batches
const expiredBatches = computed(() => {
  return alerts.value.expired?.batches || []
})

const criticalCount = computed(() => criticalBatches.value.length)
const warningCount = computed(() => warningBatches.value.length)
const expiredCount = computed(() => expiredBatches.value.length)

const hasAlerts = computed(() => {
  return expiredCount.value > 0 || criticalCount.value > 0 || warningCount.value > 0
})

// Helper to get drug name from populated drug_id
const getDrugName = (batch) => {
  return batch.drug_id?.name || batch.drug?.name || 'Unknown Drug'
}

// Helper to get supplier name from populated supplier_id
const getSupplierName = (batch) => {
  return batch.supplier_id?.name || batch.supplier?.name || 'Unknown'
}

// Calculate days until expiry
const getDaysUntilExpiry = (batch) => {
  if (!batch.expiry_date) return null
  const now = new Date()
  const expiry = new Date(batch.expiry_date)
  const diffTime = expiry.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const fetchAlerts = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/inventory/alerts`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (response.ok) {
      const data = result.result || result.data
      alerts.value = data
      // Set default active tab based on what's available
      if (data.expired?.count > 0) {
        activeTab.value = 'expired'
      } else if (data.expiring_critical?.count > 0) {
        activeTab.value = 'critical'
      } else if (data.expiring_warning?.count > 0 || data.expiring_info?.count > 0) {
        activeTab.value = 'warning'
      }
    }
  } catch (error) {
    console.error('Failed to fetch alerts:', error)
    showSnackbar('Failed to fetch expiry alerts', 'error')
  } finally {
    loading.value = false
  }
}

const writeOffBatch = (batch) => {
  selectedBatch.value = batch
  writeOffReason.value = 'Product expired'
  writeOffDialog.value = true
}

const returnBatch = (batch) => {
  selectedBatch.value = batch
  returnQuantity.value = batch.quantity_available
  returnReason.value = 'Product expired/near expiry'
  returnAuthNumber.value = ''
  returnDialog.value = true
}

const recallBatch = (batch) => {
  selectedBatch.value = batch
  recallNumber.value = ''
  recallReason.value = ''
  notifyPatients.value = false
  recallAll.value = true
  recallQuantity.value = batch.quantity_available
  recallDialog.value = true
}

const confirmRecall = async () => {
  if (!selectedBatch.value || !recallReason.value) return

  const qtyToRecall = recallAll.value ? selectedBatch.value.quantity_available : recallQuantity.value
  if (qtyToRecall <= 0 || qtyToRecall > selectedBatch.value.quantity_available) {
    showSnackbar('Invalid quantity', 'error')
    return
  }

  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/batches/${selectedBatch.value._id}/recall`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        recall_number: recallNumber.value || `RCL-${Date.now()}`,
        recall_reason: recallReason.value,
        quantity: qtyToRecall,
        notes: notifyPatients.value ? 'Flag for patient notification' : undefined,
      }),
    })

    const result = await response.json()
    if (response.ok) {
      showSnackbar('Batch recalled successfully')
      recallDialog.value = false
      fetchAlerts()
      emit('alert-action')
    } else {
      showSnackbar(result.message || 'Failed to recall batch', 'error')
    }
  } catch (error) {
    console.error('Failed to recall batch:', error)
    showSnackbar('Failed to recall batch', 'error')
  } finally {
    saving.value = false
  }
}

const confirmWriteOff = async () => {
  if (!selectedBatch.value) return

  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/batches/${selectedBatch.value._id}/writeoff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        reason: writeOffReason.value,
        writeoff_type: 'expired',
      }),
    })

    const result = await response.json()
    if (response.ok) {
      showSnackbar('Batch written off successfully')
      writeOffDialog.value = false
      fetchAlerts()
      emit('alert-action')
    } else {
      showSnackbar(result.message || 'Failed to write off batch', 'error')
    }
  } catch (error) {
    console.error('Failed to write off batch:', error)
    showSnackbar('Failed to write off batch', 'error')
  } finally {
    saving.value = false
  }
}

const confirmReturn = async () => {
  if (!selectedBatch.value) return
  if (returnQuantity.value < 1 || returnQuantity.value > selectedBatch.value.quantity_available) {
    showSnackbar('Invalid return quantity', 'error')
    return
  }

  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/batches/${selectedBatch.value._id}/return`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        quantity: returnQuantity.value,
        reason: returnReason.value,
        return_authorization_number: returnAuthNumber.value || undefined,
      }),
    })

    const result = await response.json()
    if (response.ok) {
      showSnackbar('Return processed successfully')
      returnDialog.value = false
      fetchAlerts()
      emit('alert-action')
    } else {
      showSnackbar(result.message || 'Failed to process return', 'error')
    }
  } catch (error) {
    console.error('Failed to process return:', error)
    showSnackbar('Failed to process return', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchAlerts()
})
</script>
