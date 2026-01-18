<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useClaudeSummaryStore } from '@/stores/claudeSummary'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

const store = useClaudeSummaryStore()

const loading = ref(false)
const showGiftCreditsDialog = ref(false)
const showGiftUnlimitedDialog = ref(false)
const showRevokeDialog = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

const giftCreditsForm = ref({
  credits: 5,
  expiry_days: 30,
  reason: '',
})

const giftUnlimitedForm = ref({
  duration_days: 30,
  reason: '',
})

const revokeForm = ref({
  reason: '',
})

const patientCredits = computed(() => store.patientCredits)
const patientTransactions = computed(() => store.patientTransactions || [])

const transactionHeaders = [
  { title: 'Date', key: 'created_at' },
  { title: 'Type', key: 'type' },
  { title: 'Credits', key: 'credits_delta' },
  { title: 'Description', key: 'description' },
]

const patientId = computed(() => props.userData?._id)

const fetchData = async () => {
  if (!patientId.value) return

  loading.value = true
  try {
    await Promise.all([
      store.fetchPatientCredits(patientId.value),
      store.fetchPatientTransactions(patientId.value),
    ])
  } catch (error) {
    snackbar.value = { show: true, message: 'Failed to load credit data', color: 'error' }
  } finally {
    loading.value = false
  }
}

const giftCredits = async () => {
  try {
    const adminId = localStorage.getItem('adminId') || '000000000000000000000000'
    await store.giftCreditsToPatient(
      patientId.value,
      giftCreditsForm.value.credits,
      giftCreditsForm.value.expiry_days,
      giftCreditsForm.value.reason,
      adminId
    )
    showGiftCreditsDialog.value = false
    giftCreditsForm.value = { credits: 5, expiry_days: 30, reason: '' }
    snackbar.value = { show: true, message: 'Credits gifted successfully', color: 'success' }
    await fetchData()
  } catch (error) {
    snackbar.value = { show: true, message: error.response?.data?.message || 'Failed to gift credits', color: 'error' }
  }
}

const giftUnlimited = async () => {
  try {
    const adminId = localStorage.getItem('adminId') || '000000000000000000000000'
    await store.giftUnlimitedToPatient(
      patientId.value,
      giftUnlimitedForm.value.duration_days,
      giftUnlimitedForm.value.reason,
      adminId
    )
    showGiftUnlimitedDialog.value = false
    giftUnlimitedForm.value = { duration_days: 30, reason: '' }
    snackbar.value = { show: true, message: 'Unlimited access gifted successfully', color: 'success' }
    await fetchData()
  } catch (error) {
    snackbar.value = { show: true, message: error.response?.data?.message || 'Failed to gift unlimited', color: 'error' }
  }
}

const revokeGifted = async () => {
  try {
    const adminId = localStorage.getItem('adminId') || '000000000000000000000000'
    await store.revokeGiftedCredits(
      patientId.value,
      revokeForm.value.reason,
      adminId
    )
    showRevokeDialog.value = false
    revokeForm.value = { reason: '' }
    snackbar.value = { show: true, message: 'Gifted credits revoked', color: 'success' }
    await fetchData()
  } catch (error) {
    snackbar.value = { show: true, message: error.response?.data?.message || 'Failed to revoke credits', color: 'error' }
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatTransactionType = (type) => {
  const typeMap = {
    FREE_USAGE: 'Free Usage',
    PURCHASED_USAGE: 'Purchased Usage',
    GIFTED_USAGE: 'Gifted Usage',
    UNLIMITED_USAGE: 'Unlimited Usage',
    BUNDLE_PURCHASE: 'Bundle Purchase',
    UNLIMITED_PURCHASE: 'Subscription Purchase',
    ADMIN_GIFT: 'Admin Gift',
    MONTHLY_RESET: 'Monthly Reset',
    ADMIN_REVOKE: 'Admin Revoke',
  }
  return typeMap[type] || type
}

const getTransactionTypeColor = (type) => {
  const colorMap = {
    FREE_USAGE: 'info',
    PURCHASED_USAGE: 'primary',
    GIFTED_USAGE: 'warning',
    UNLIMITED_USAGE: 'success',
    BUNDLE_PURCHASE: 'primary',
    UNLIMITED_PURCHASE: 'success',
    ADMIN_GIFT: 'warning',
    MONTHLY_RESET: 'info',
    ADMIN_REVOKE: 'error',
  }
  return colorMap[type] || 'default'
}

const hasGiftedCredits = computed(() => {
  return patientCredits.value?.gifted_credits > 0 || patientCredits.value?.unlimited_subscription?.is_active
})

watch(() => props.userData, () => {
  fetchData()
}, { immediate: true })

onMounted(() => {
  fetchData()
})
</script>

<template>
  <VCardText>
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 300px">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <div v-else>
      <!-- Credit Status Cards -->
      <VRow class="mb-6">
        <VCol cols="12" sm="6" md="3">
          <VCard variant="tonal" color="info">
            <VCardText class="text-center">
              <VIcon size="32" class="mb-2">mdi-gift</VIcon>
              <div class="text-h4 font-weight-bold">{{ patientCredits?.free_credits_remaining ?? 5 }}</div>
              <div class="text-caption">Free Credits</div>
              <div v-if="patientCredits?.free_credits_reset_date" class="text-caption text-medium-emphasis mt-1">
                Resets: {{ formatDate(patientCredits.free_credits_reset_date) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard variant="tonal" color="primary">
            <VCardText class="text-center">
              <VIcon size="32" class="mb-2">mdi-cart</VIcon>
              <div class="text-h4 font-weight-bold">{{ patientCredits?.purchased_credits ?? 0 }}</div>
              <div class="text-caption">Purchased Credits</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard variant="tonal" color="warning">
            <VCardText class="text-center">
              <VIcon size="32" class="mb-2">mdi-hand-heart</VIcon>
              <div class="text-h4 font-weight-bold">{{ patientCredits?.gifted_credits ?? 0 }}</div>
              <div class="text-caption">Gifted Credits</div>
              <div v-if="patientCredits?.gifted_credits_expiry" class="text-caption text-medium-emphasis mt-1">
                Expires: {{ formatDate(patientCredits.gifted_credits_expiry) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard variant="tonal" :color="patientCredits?.unlimited_subscription?.is_active ? 'success' : 'default'">
            <VCardText class="text-center">
              <VIcon size="32" class="mb-2">mdi-infinity</VIcon>
              <div class="text-h4 font-weight-bold">
                {{ patientCredits?.unlimited_subscription?.is_active ? 'Active' : 'None' }}
              </div>
              <div class="text-caption">Unlimited Access</div>
              <div v-if="patientCredits?.unlimited_subscription?.is_active" class="text-caption text-medium-emphasis mt-1">
                Expires: {{ formatDate(patientCredits.unlimited_subscription.expires_at) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Admin Actions -->
      <VCard class="mb-6">
        <VCardTitle>Admin Actions</VCardTitle>
        <VCardText>
          <div class="d-flex flex-wrap" style="gap: 12px">
            <VBtn color="warning" @click="showGiftCreditsDialog = true">
              <VIcon start>mdi-gift</VIcon>
              Gift Credits
            </VBtn>
            <VBtn color="success" @click="showGiftUnlimitedDialog = true">
              <VIcon start>mdi-infinity</VIcon>
              Gift Unlimited Access
            </VBtn>
            <VBtn
              v-if="hasGiftedCredits"
              color="error"
              variant="outlined"
              @click="showRevokeDialog = true"
            >
              <VIcon start>mdi-cancel</VIcon>
              Revoke Gifted
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Transaction History -->
      <VCard>
        <VCardTitle>Transaction History</VCardTitle>
        <VCardText>
          <VDataTable
            :headers="transactionHeaders"
            :items="patientTransactions"
            :loading="loading"
            class="elevation-0"
          >
            <template #item.created_at="{ item }">
              {{ formatDate(item.created_at) }}
            </template>
            <template #item.type="{ item }">
              <VChip :color="getTransactionTypeColor(item.type)" size="small">
                {{ formatTransactionType(item.type) }}
              </VChip>
            </template>
            <template #item.credits_delta="{ item }">
              <span :class="item.credits_delta > 0 ? 'text-success' : 'text-error'">
                {{ item.credits_delta > 0 ? '+' : '' }}{{ item.credits_delta }}
              </span>
            </template>
          </VDataTable>
        </VCardText>
      </VCard>
    </div>

    <!-- Gift Credits Dialog -->
    <VDialog v-model="showGiftCreditsDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h5 pa-4 bg-warning">
          <VIcon start>mdi-gift</VIcon>
          Gift Credits
        </VCardTitle>
        <VCardText class="pa-4">
          <VForm @submit.prevent="giftCredits">
            <VTextField
              v-model.number="giftCreditsForm.credits"
              label="Number of Credits"
              type="number"
              min="1"
              required
              variant="outlined"
              class="mb-4"
            />
            <VTextField
              v-model.number="giftCreditsForm.expiry_days"
              label="Expiry (Days)"
              type="number"
              min="1"
              required
              variant="outlined"
              class="mb-4"
            />
            <VTextarea
              v-model="giftCreditsForm.reason"
              label="Reason"
              variant="outlined"
              rows="3"
              required
            />
          </VForm>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="showGiftCreditsDialog = false">Cancel</VBtn>
          <VBtn color="warning" @click="giftCredits" :loading="store.loading">Gift Credits</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Gift Unlimited Dialog -->
    <VDialog v-model="showGiftUnlimitedDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h5 pa-4 bg-success">
          <VIcon start>mdi-infinity</VIcon>
          Gift Unlimited Access
        </VCardTitle>
        <VCardText class="pa-4">
          <VForm @submit.prevent="giftUnlimited">
            <VTextField
              v-model.number="giftUnlimitedForm.duration_days"
              label="Duration (Days)"
              type="number"
              min="1"
              required
              variant="outlined"
              class="mb-4"
            />
            <VTextarea
              v-model="giftUnlimitedForm.reason"
              label="Reason"
              variant="outlined"
              rows="3"
              required
            />
          </VForm>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="showGiftUnlimitedDialog = false">Cancel</VBtn>
          <VBtn color="success" @click="giftUnlimited" :loading="store.loading">Gift Unlimited</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Revoke Dialog -->
    <VDialog v-model="showRevokeDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h5 pa-4 bg-error">
          <VIcon start>mdi-cancel</VIcon>
          Revoke Gifted Credits
        </VCardTitle>
        <VCardText class="pa-4">
          <VAlert type="warning" variant="tonal" class="mb-4">
            This will revoke all gifted credits and any active gifted unlimited subscription for this patient.
          </VAlert>
          <VForm @submit.prevent="revokeGifted">
            <VTextarea
              v-model="revokeForm.reason"
              label="Reason for Revocation"
              variant="outlined"
              rows="3"
              required
            />
          </VForm>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="showRevokeDialog = false">Cancel</VBtn>
          <VBtn color="error" @click="revokeGifted" :loading="store.loading">Revoke</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </VCardText>
</template>
