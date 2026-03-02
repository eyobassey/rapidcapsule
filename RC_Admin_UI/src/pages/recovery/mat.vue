<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRecoveryStore } from '@/stores/recovery'
import { useRouter } from 'vue-router'

const router = useRouter()
const recoveryStore = useRecoveryStore()

const activeTab = ref('compliance')
const pageLoading = ref(true)
const matCompliance = ref([])
const suspiciousActivity = ref([])
const suspiciousPagination = ref(null)
const currentPage = ref(1)
const filterSeverity = ref('')
const filterReviewed = ref('')
const reviewDialog = ref(false)
const reviewingItem = ref(null)
const resolutionText = ref('')

const riskColors = { low: 'success', moderate: 'warning', high: 'error', critical: 'deep-purple' }
const severityColors = { low: 'info', medium: 'warning', high: 'error', critical: 'deep-purple' }

const getPatientName = (user) => {
  if (!user?.profile) return 'Unknown'
  return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || 'Unknown'
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const getComplianceColor = (rate) => {
  if (rate >= 80) return 'success'
  if (rate >= 50) return 'warning'
  return 'error'
}

const fetchCompliance = async () => {
  pageLoading.value = true
  try {
    const result = await recoveryStore.fetchMATCompliance()
    if (result && result !== 'error') matCompliance.value = result || []
  } finally {
    pageLoading.value = false
  }
}

const fetchSuspicious = async () => {
  pageLoading.value = true
  try {
    const result = await recoveryStore.fetchSuspiciousActivity({
      page: currentPage.value,
      severity: filterSeverity.value || undefined,
      reviewed: filterReviewed.value || undefined,
      limit: 20,
    })
    if (result && result !== 'error') {
      suspiciousActivity.value = result.data || []
      suspiciousPagination.value = result.pagination || null
    }
  } finally {
    pageLoading.value = false
  }
}

const openReview = (item) => {
  reviewingItem.value = item
  resolutionText.value = ''
  reviewDialog.value = true
}

const submitReview = async () => {
  if (!resolutionText.value.trim() || !reviewingItem.value) return
  const result = await recoveryStore.reviewSuspiciousActivity(
    reviewingItem.value._id,
    resolutionText.value,
  )
  if (result && result !== 'error') {
    reviewDialog.value = false
    await fetchSuspicious()
  }
}

watch(activeTab, () => {
  if (activeTab.value === 'compliance') fetchCompliance()
  else fetchSuspicious()
})

watch([currentPage, filterSeverity, filterReviewed], fetchSuspicious)

onMounted(fetchCompliance)
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">MAT Management</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Medication-Assisted Treatment compliance and monitoring</p>
      </div>
      <VBtn variant="outlined" prepend-icon="mdi-arrow-left" @click="router.push('/recovery')">
        Back to Dashboard
      </VBtn>
    </div>

    <VTabs v-model="activeTab" class="mb-6">
      <VTab value="compliance">Compliance</VTab>
      <VTab value="suspicious">Suspicious Activity</VTab>
    </VTabs>

    <!-- MAT Compliance -->
    <template v-if="activeTab === 'compliance'">
      <VProgressLinear v-if="pageLoading" indeterminate color="primary" class="mb-4" />
      <template v-if="matCompliance.length === 0 && !pageLoading">
        <VAlert type="info" variant="tonal">No MAT patients found</VAlert>
      </template>
      <VCard v-else>
        <VTable>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Medications</th>
              <th>Check-in Rate (30d)</th>
              <th>Screenings (30d)</th>
              <th>Risk Level</th>
              <th>Risk Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in matCompliance" :key="item.user?._id || item.user">
              <td>{{ getPatientName(item.user) }}</td>
              <td>
                <VChip v-for="med in (item.medications || []).slice(0, 2)" :key="med" size="x-small" class="me-1">
                  {{ med }}
                </VChip>
                <span v-if="(item.medications || []).length > 2" class="text-caption">
                  +{{ item.medications.length - 2 }} more
                </span>
              </td>
              <td>
                <VChip :color="getComplianceColor(item.check_in_rate_30d)" size="small">
                  {{ item.check_in_rate_30d }}%
                </VChip>
              </td>
              <td>{{ item.screenings_30d }}</td>
              <td>
                <VChip :color="riskColors[item.risk_level] || 'secondary'" size="small">
                  {{ item.risk_level }}
                </VChip>
              </td>
              <td>{{ item.risk_score }}/100</td>
              <td>
                <VBtn
                  size="small"
                  variant="text"
                  color="primary"
                  @click="router.push(`/recovery/patient/${item.user?._id || item.user}`)"
                >
                  View
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCard>
    </template>

    <!-- Suspicious Activity -->
    <template v-if="activeTab === 'suspicious'">
      <VCard class="mb-4">
        <VCardText>
          <VRow>
            <VCol cols="12" md="4">
              <VSelect
                v-model="filterSeverity"
                :items="['', 'low', 'medium', 'high', 'critical']"
                label="Severity"
                variant="outlined"
                density="compact"
                clearable
              />
            </VCol>
            <VCol cols="12" md="4">
              <VSelect
                v-model="filterReviewed"
                :items="[{ title: 'All', value: '' }, { title: 'Unreviewed', value: 'false' }, { title: 'Reviewed', value: 'true' }]"
                label="Review Status"
                variant="outlined"
                density="compact"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VCard>
        <VProgressLinear v-if="pageLoading" indeterminate color="primary" />
        <VTable>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Activity Type</th>
              <th>Severity</th>
              <th>Message</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!pageLoading && suspiciousActivity.length === 0">
              <td colspan="7" class="text-center text-medium-emphasis pa-6">No suspicious activity found</td>
            </tr>
            <tr v-for="item in suspiciousActivity" :key="item._id">
              <td>{{ getPatientName(item.patient) }}</td>
              <td>{{ item.activity_type?.replace(/_/g, ' ') }}</td>
              <td>
                <VChip :color="severityColors[item.severity]" size="x-small">{{ item.severity }}</VChip>
              </td>
              <td class="text-truncate" style="max-width: 200px;">{{ item.message }}</td>
              <td>{{ formatDate(item.created_at) }}</td>
              <td>
                <VChip v-if="item.reviewed_at" color="success" size="small">Reviewed</VChip>
                <VChip v-else color="warning" size="small">Pending</VChip>
              </td>
              <td>
                <VBtn
                  v-if="!item.reviewed_at"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="openReview(item)"
                >
                  Review
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
        <VCardText v-if="suspiciousPagination && suspiciousPagination.pages > 1" class="d-flex justify-center">
          <VPagination v-model="currentPage" :length="suspiciousPagination.pages" :total-visible="7" />
        </VCardText>
      </VCard>
    </template>

    <!-- Review Dialog -->
    <VDialog v-model="reviewDialog" width="500">
      <VCard>
        <VCardTitle>Review Suspicious Activity</VCardTitle>
        <VCardText>
          <div v-if="reviewingItem" class="mb-4">
            <p><strong>Type:</strong> {{ reviewingItem.activity_type?.replace(/_/g, ' ') }}</p>
            <p><strong>Severity:</strong> {{ reviewingItem.severity }}</p>
            <p><strong>Message:</strong> {{ reviewingItem.message }}</p>
          </div>
          <VTextarea
            v-model="resolutionText"
            label="Resolution Notes"
            variant="outlined"
            rows="3"
            placeholder="Describe the resolution or action taken..."
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="reviewDialog = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!resolutionText.trim()" @click="submitReview">
            Submit Review
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
