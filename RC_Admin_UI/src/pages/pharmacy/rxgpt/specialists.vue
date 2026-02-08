<script setup>
import { ref, onMounted, computed, reactive } from 'vue'

// Local state instead of Pinia store
const loading = ref(false)
const specialists = ref([])
const totalSpecialists = ref(0)
const search = ref('')
const page = ref(1)
const itemsPerPage = ref(20)
const snackbar = ref({ show: false, message: '', color: 'success' })
const selectedSpecialists = ref([])
const currentSpecialistCredits = ref(null)

// Dialogs
const giftDialog = ref(false)
const bulkGiftDialog = ref(false)
const unlimitedDialog = ref(false)
const revokeDialog = ref(false)
const detailsDialog = ref(false)
const currentSpecialist = ref(null)

// Form data
const giftForm = reactive({
  credits: 10,
  expiry_days: 30,
  reason: '',
})

const unlimitedForm = reactive({
  duration_days: 30,
  reason: '',
})

const revokeForm = reactive({
  reason: '',
})

const tableHeaders = [
  { title: 'Specialist', key: 'specialist', sortable: false },
  { title: 'Specialization', key: 'specialization', sortable: false },
  { title: 'Free Credits', key: 'free_credits', align: 'center' },
  { title: 'Purchased', key: 'purchased_credits', align: 'center' },
  { title: 'Gifted', key: 'gifted_credits', align: 'center' },
  { title: 'RxGPT Used', key: 'rxgpt_used', align: 'center' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
]

// Auth headers helper
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Authorization': `Bearer ${token.access_token}`,
    'Content-Type': 'application/json',
  }
}

// Methods
const fetchSpecialists = async () => {
  loading.value = true
  try {
    let url = `/admin-api/rxgpt/specialists?page=${page.value}&limit=${itemsPerPage.value}`
    if (search.value) url += `&search=${encodeURIComponent(search.value)}`

    const response = await fetch(url, { headers: getAuthHeaders() })
    const data = await response.json()

    if (data.statusCode === 200 && data.data) {
      specialists.value = data.data.specialists || []
      totalSpecialists.value = data.data.total || 0
    }
  } catch (error) {
    console.error('Error fetching specialists:', error)
    snackbar.value = { show: true, message: 'Failed to fetch specialists', color: 'error' }
  } finally {
    loading.value = false
  }
}

const fetchSpecialistCredits = async (specialistId) => {
  try {
    const response = await fetch(`/admin-api/rxgpt/specialists/${specialistId}/credits`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.statusCode === 200) {
      currentSpecialistCredits.value = data.data
    }
  } catch (error) {
    console.error('Error fetching specialist credits:', error)
  }
}

const openGiftDialog = (specialist) => {
  currentSpecialist.value = specialist
  giftForm.credits = 10
  giftForm.expiry_days = 30
  giftForm.reason = ''
  giftDialog.value = true
}

const openBulkGiftDialog = () => {
  if (selectedSpecialists.value.length === 0) {
    snackbar.value = { show: true, message: 'Select specialists first', color: 'warning' }
    return
  }
  giftForm.credits = 10
  giftForm.expiry_days = 30
  giftForm.reason = ''
  bulkGiftDialog.value = true
}

const openUnlimitedDialog = (specialist) => {
  currentSpecialist.value = specialist
  unlimitedForm.duration_days = 30
  unlimitedForm.reason = ''
  unlimitedDialog.value = true
}

const openRevokeDialog = (specialist) => {
  currentSpecialist.value = specialist
  revokeForm.reason = ''
  revokeDialog.value = true
}

const openDetailsDialog = async (specialist) => {
  currentSpecialist.value = specialist
  detailsDialog.value = true
  await fetchSpecialistCredits(specialist._id)
}

const giftCredits = async () => {
  if (!giftForm.reason) {
    snackbar.value = { show: true, message: 'Please provide a reason', color: 'warning' }
    return
  }
  loading.value = true
  try {
    const response = await fetch(`/admin-api/rxgpt/specialists/${currentSpecialist.value._id}/gift-credits`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        credits: giftForm.credits,
        expiry_days: giftForm.expiry_days,
        reason: giftForm.reason,
      }),
    })
    const data = await response.json()
    if (data.statusCode === 200 || data.statusCode === 201) {
      snackbar.value = { show: true, message: `${giftForm.credits} credits gifted successfully`, color: 'success' }
      giftDialog.value = false
      await fetchSpecialists()
    } else {
      throw new Error(data.message || 'Failed to gift credits')
    }
  } catch (error) {
    snackbar.value = { show: true, message: error.message || 'Failed to gift credits', color: 'error' }
  } finally {
    loading.value = false
  }
}

const bulkGiftCredits = async () => {
  if (!giftForm.reason) {
    snackbar.value = { show: true, message: 'Please provide a reason', color: 'warning' }
    return
  }
  loading.value = true
  try {
    const specialistIds = selectedSpecialists.value.map(s => s._id)
    const response = await fetch(`/admin-api/rxgpt/specialists/bulk-gift`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        specialist_ids: specialistIds,
        credits: giftForm.credits,
        expiry_days: giftForm.expiry_days,
        reason: giftForm.reason,
      }),
    })
    const data = await response.json()
    if (data.statusCode === 200 || data.statusCode === 201) {
      snackbar.value = { show: true, message: `${giftForm.credits} credits gifted to ${specialistIds.length} specialists`, color: 'success' }
      bulkGiftDialog.value = false
      selectedSpecialists.value = []
      await fetchSpecialists()
    } else {
      throw new Error(data.message || 'Failed to bulk gift credits')
    }
  } catch (error) {
    snackbar.value = { show: true, message: error.message || 'Failed to bulk gift credits', color: 'error' }
  } finally {
    loading.value = false
  }
}

const giftUnlimited = async () => {
  if (!unlimitedForm.reason) {
    snackbar.value = { show: true, message: 'Please provide a reason', color: 'warning' }
    return
  }
  loading.value = true
  try {
    const response = await fetch(`/admin-api/rxgpt/specialists/${currentSpecialist.value._id}/gift-unlimited`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        duration_days: unlimitedForm.duration_days,
        reason: unlimitedForm.reason,
      }),
    })
    const data = await response.json()
    if (data.statusCode === 200 || data.statusCode === 201) {
      snackbar.value = { show: true, message: `Unlimited access granted for ${unlimitedForm.duration_days} days`, color: 'success' }
      unlimitedDialog.value = false
      await fetchSpecialists()
    } else {
      throw new Error(data.message || 'Failed to grant unlimited access')
    }
  } catch (error) {
    snackbar.value = { show: true, message: error.message || 'Failed to grant unlimited access', color: 'error' }
  } finally {
    loading.value = false
  }
}

const revokeCredits = async () => {
  if (!revokeForm.reason) {
    snackbar.value = { show: true, message: 'Please provide a reason', color: 'warning' }
    return
  }
  loading.value = true
  try {
    const response = await fetch(`/admin-api/rxgpt/specialists/${currentSpecialist.value._id}/revoke-credits`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        reason: revokeForm.reason,
      }),
    })
    const data = await response.json()
    if (data.statusCode === 200) {
      snackbar.value = { show: true, message: 'Gifted credits revoked', color: 'success' }
      revokeDialog.value = false
      await fetchSpecialists()
    } else {
      throw new Error(data.message || 'Failed to revoke credits')
    }
  } catch (error) {
    snackbar.value = { show: true, message: error.message || 'Failed to revoke credits', color: 'error' }
  } finally {
    loading.value = false
  }
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-NG').format(value || 0)
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getStatusColor = (specialist) => {
  if (specialist.has_unlimited) return 'success'
  const total = (specialist.free_credits || 0) + (specialist.purchased_credits || 0) + (specialist.gifted_credits || 0)
  if (total === 0) return 'error'
  if (total < 5) return 'warning'
  return 'info'
}

const getStatusText = (specialist) => {
  if (specialist.has_unlimited) return 'Unlimited'
  const total = (specialist.free_credits || 0) + (specialist.purchased_credits || 0) + (specialist.gifted_credits || 0)
  if (total === 0) return 'No Credits'
  return `${total} available`
}

onMounted(() => {
  fetchSpecialists()
})
</script>

<template>
  <div>
    <!-- Header -->
    <VCard class="mb-6" color="primary" variant="tonal">
      <VCardText class="d-flex align-center justify-space-between flex-wrap" style="gap: 16px">
        <div>
          <div class="d-flex align-center mb-2" style="gap: 8px">
            <VIcon size="32">mdi-account-group</VIcon>
            <h2 class="text-h4 font-weight-bold">Specialist Credits</h2>
          </div>
          <p class="text-subtitle-1 mb-0">Manage RxGPT credits for specialists</p>
        </div>
        <div class="d-flex align-center" style="gap: 12px">
          <VBtn
            color="warning"
            variant="outlined"
            @click="openBulkGiftDialog"
            :disabled="selectedSpecialists.length === 0"
          >
            <VIcon start>mdi-gift</VIcon>
            Bulk Gift ({{ selectedSpecialists.length }})
          </VBtn>
          <VBtn color="primary" variant="outlined" @click="fetchSpecialists" :loading="loading">
            <VIcon start>mdi-refresh</VIcon>
            Refresh
          </VBtn>
          <VBtn color="primary" :to="{ name: 'pharmacy-rxgpt' }">
            <VIcon start>mdi-chart-line</VIcon>
            Analytics
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Search and Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" md="6">
            <VTextField
              v-model="search"
              label="Search specialists..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              clearable
              @keyup.enter="fetchSpecialists"
              @click:clear="search = ''; fetchSpecialists()"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="itemsPerPage"
              :items="[10, 20, 50, 100]"
              label="Items per page"
              variant="outlined"
              @update:model-value="fetchSpecialists"
            />
          </VCol>
          <VCol cols="12" md="3" class="d-flex align-center">
            <VBtn color="primary" block @click="fetchSpecialists">
              <VIcon start>mdi-magnify</VIcon>
              Search
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Specialists List -->
    <VCard>
      <VCardTitle>Specialists ({{ specialists.length }})</VCardTitle>
      <VCardText>
        <div v-if="loading" class="text-center py-4">
          <VProgressCircular indeterminate color="primary" />
        </div>

        <div v-else-if="specialists.length === 0" class="text-center py-4 text-medium-emphasis">
          No specialists found
        </div>

        <VTable v-else hover>
          <thead>
            <tr>
              <th>Specialist</th>
              <th>Specialization</th>
              <th class="text-center">Free</th>
              <th class="text-center">Purchased</th>
              <th class="text-center">Gifted</th>
              <th class="text-center">Used</th>
              <th class="text-center">Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="specialist in specialists" :key="specialist._id">
              <td>
                <div class="d-flex align-center py-2">
                  <VAvatar color="primary" variant="tonal" size="40" class="me-3">
                    <span class="text-sm font-weight-bold">
                      {{ (specialist.first_name?.[0] || 'S') + (specialist.last_name?.[0] || '') }}
                    </span>
                  </VAvatar>
                  <div>
                    <div class="font-weight-medium">{{ specialist.first_name || 'Unknown' }} {{ specialist.last_name || '' }}</div>
                    <div class="text-caption text-medium-emphasis">{{ specialist.email || 'No email' }}</div>
                  </div>
                </div>
              </td>
              <td>
                <VChip size="small" variant="tonal" color="primary">
                  {{ specialist.specialization || 'General' }}
                </VChip>
              </td>
              <td class="text-center">{{ formatNumber(specialist.free_credits || 0) }}</td>
              <td class="text-center">{{ formatNumber(specialist.purchased_credits || 0) }}</td>
              <td class="text-center">
                <VChip v-if="specialist.gifted_credits > 0" size="small" color="warning" variant="tonal">
                  {{ formatNumber(specialist.gifted_credits) }}
                </VChip>
                <span v-else class="text-medium-emphasis">0</span>
              </td>
              <td class="text-center">
                <VChip size="small" color="info" variant="flat">
                  {{ formatNumber(specialist.rxgpt_credits_used || 0) }}
                </VChip>
              </td>
              <td class="text-center">
                <VChip size="small" :color="getStatusColor(specialist)" variant="flat">
                  {{ getStatusText(specialist) }}
                </VChip>
              </td>
              <td>
                <div class="d-flex align-center justify-center" style="gap: 4px">
                  <VBtn icon variant="text" size="small" @click="openDetailsDialog(specialist)">
                    <VIcon size="20">mdi-eye</VIcon>
                  </VBtn>
                  <VBtn icon variant="text" size="small" color="success" @click="openGiftDialog(specialist)">
                    <VIcon size="20">mdi-gift</VIcon>
                  </VBtn>
                  <VBtn icon variant="text" size="small" color="primary" @click="openUnlimitedDialog(specialist)">
                    <VIcon size="20">mdi-infinity</VIcon>
                  </VBtn>
                  <VBtn
                    icon
                    variant="text"
                    size="small"
                    color="error"
                    @click="openRevokeDialog(specialist)"
                    :disabled="!specialist.gifted_credits && !specialist.has_unlimited"
                  >
                    <VIcon size="20">mdi-cancel</VIcon>
                  </VBtn>
                </div>
              </td>
            </tr>
          </tbody>
        </VTable>

        <!-- Pagination -->
        <div class="d-flex align-center justify-space-between pa-4">
          <div class="text-caption text-medium-emphasis">
            Showing {{ specialists.length }} of {{ totalSpecialists }} specialists
          </div>
          <VPagination
            v-model="page"
            :length="Math.ceil(totalSpecialists / itemsPerPage)"
            :total-visible="5"
            @update:model-value="fetchSpecialists"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Gift Credits Dialog -->
    <VDialog v-model="giftDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center" style="gap: 8px">
          <VIcon color="success">mdi-gift</VIcon>
          Gift Credits
        </VCardTitle>
        <VCardText>
          <p class="mb-4">
            Gift RxGPT credits to <strong>{{ currentSpecialist?.first_name }} {{ currentSpecialist?.last_name }}</strong>
          </p>
          <VTextField
            v-model.number="giftForm.credits"
            label="Number of Credits"
            type="number"
            variant="outlined"
            :min="1"
            class="mb-4"
          />
          <VTextField
            v-model.number="giftForm.expiry_days"
            label="Expiry (days)"
            type="number"
            variant="outlined"
            :min="1"
            class="mb-4"
            hint="Credits will expire after this many days"
            persistent-hint
          />
          <VTextarea
            v-model="giftForm.reason"
            label="Reason"
            variant="outlined"
            rows="2"
            placeholder="e.g., Promotional offer, feedback reward..."
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="giftDialog = false">Cancel</VBtn>
          <VBtn color="success" @click="giftCredits" :loading="loading">
            Gift Credits
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Bulk Gift Dialog -->
    <VDialog v-model="bulkGiftDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center" style="gap: 8px">
          <VIcon color="warning">mdi-gift</VIcon>
          Bulk Gift Credits
        </VCardTitle>
        <VCardText>
          <VAlert type="info" variant="tonal" class="mb-4">
            Gifting credits to {{ selectedSpecialists.length }} selected specialists
          </VAlert>
          <VTextField
            v-model.number="giftForm.credits"
            label="Credits per Specialist"
            type="number"
            variant="outlined"
            :min="1"
            class="mb-4"
          />
          <VTextField
            v-model.number="giftForm.expiry_days"
            label="Expiry (days)"
            type="number"
            variant="outlined"
            :min="1"
            class="mb-4"
          />
          <VTextarea
            v-model="giftForm.reason"
            label="Reason"
            variant="outlined"
            rows="2"
            placeholder="e.g., Launch promotion, bulk reward..."
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="bulkGiftDialog = false">Cancel</VBtn>
          <VBtn color="warning" @click="bulkGiftCredits" :loading="loading">
            Gift to All
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Unlimited Access Dialog -->
    <VDialog v-model="unlimitedDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center" style="gap: 8px">
          <VIcon color="primary">mdi-infinity</VIcon>
          Grant Unlimited Access
        </VCardTitle>
        <VCardText>
          <p class="mb-4">
            Grant unlimited RxGPT access to <strong>{{ currentSpecialist?.first_name }} {{ currentSpecialist?.last_name }}</strong>
          </p>
          <VTextField
            v-model.number="unlimitedForm.duration_days"
            label="Duration (days)"
            type="number"
            variant="outlined"
            :min="1"
            class="mb-4"
            hint="Unlimited access will expire after this many days"
            persistent-hint
          />
          <VTextarea
            v-model="unlimitedForm.reason"
            label="Reason"
            variant="outlined"
            rows="2"
            placeholder="e.g., Premium specialist, partner account..."
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="unlimitedDialog = false">Cancel</VBtn>
          <VBtn color="primary" @click="giftUnlimited" :loading="loading">
            Grant Access
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Revoke Dialog -->
    <VDialog v-model="revokeDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center" style="gap: 8px">
          <VIcon color="error">mdi-cancel</VIcon>
          Revoke Gifted Credits
        </VCardTitle>
        <VCardText>
          <VAlert type="warning" variant="tonal" class="mb-4">
            This will revoke all gifted credits and unlimited access for
            <strong>{{ currentSpecialist?.first_name }} {{ currentSpecialist?.last_name }}</strong>.
            Purchased credits will not be affected.
          </VAlert>
          <VTextarea
            v-model="revokeForm.reason"
            label="Reason for Revocation"
            variant="outlined"
            rows="2"
            placeholder="e.g., Policy violation, subscription ended..."
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="revokeDialog = false">Cancel</VBtn>
          <VBtn color="error" @click="revokeCredits" :loading="loading">
            Revoke Credits
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Details Dialog -->
    <VDialog v-model="detailsDialog" max-width="600">
      <VCard>
        <VCardTitle class="d-flex align-center" style="gap: 8px">
          <VIcon color="info">mdi-information</VIcon>
          Credit Details
        </VCardTitle>
        <VCardText>
          <div v-if="currentSpecialistCredits" class="credit-details">
            <VRow class="mb-4">
              <VCol cols="6">
                <div class="text-caption text-medium-emphasis">Free Credits</div>
                <div class="text-h5 font-weight-bold">{{ formatNumber(currentSpecialistCredits.free_credits_remaining) }}</div>
              </VCol>
              <VCol cols="6">
                <div class="text-caption text-medium-emphasis">Purchased Credits</div>
                <div class="text-h5 font-weight-bold">{{ formatNumber(currentSpecialistCredits.purchased_credits) }}</div>
              </VCol>
              <VCol cols="6">
                <div class="text-caption text-medium-emphasis">Gifted Credits</div>
                <div class="text-h5 font-weight-bold text-warning">{{ formatNumber(currentSpecialistCredits.gifted_credits) }}</div>
              </VCol>
              <VCol cols="6">
                <div class="text-caption text-medium-emphasis">RxGPT Used</div>
                <div class="text-h5 font-weight-bold text-info">{{ formatNumber(currentSpecialistCredits.rxgpt_credits_used) }}</div>
              </VCol>
            </VRow>

            <VDivider class="mb-4" />

            <div v-if="currentSpecialistCredits.unlimited_subscription?.active" class="mb-4">
              <VAlert type="success" variant="tonal">
                <template #title>Unlimited Access Active</template>
                Expires: {{ formatDate(currentSpecialistCredits.unlimited_subscription.expires_at) }}
              </VAlert>
            </div>

            <div v-if="currentSpecialistCredits.gifted_expires_at" class="mb-4">
              <VAlert type="warning" variant="tonal">
                <template #title>Gifted Credits Expiry</template>
                {{ formatDate(currentSpecialistCredits.gifted_expires_at) }}
              </VAlert>
            </div>

            <div class="text-caption text-medium-emphasis">
              <div>Total RxGPT Analyses: {{ formatNumber(currentSpecialistCredits.total_rxgpt_analyses) }}</div>
              <div>Last RxGPT Usage: {{ formatDate(currentSpecialistCredits.rxgpt_last_used_at) }}</div>
            </div>
          </div>
          <div v-else class="text-center py-4">
            <VProgressCircular indeterminate color="primary" />
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="detailsDialog = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>
