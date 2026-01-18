<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Prescriptions</h1>
        <p class="text-subtitle-1 text-medium-emphasis">View and manage prescriptions</p>
      </div>
      <div class="d-flex gap-2">
        <VBtn color="primary" prepend-icon="mdi-refresh" @click="fetchData" :loading="loading">
          Refresh
        </VBtn>
      </div>
    </div>

    <!-- Review Queue Summary Card -->
    <VCard v-if="reviewQueueCount.total > 0" class="mb-6" color="warning" variant="tonal">
      <VCardText>
        <div class="d-flex align-center justify-space-between flex-wrap">
          <div class="d-flex align-center gap-4">
            <VIcon size="40" color="warning">mdi-clipboard-alert</VIcon>
            <div>
              <h3 class="text-h6 font-weight-bold">{{ reviewQueueCount.total }} Prescriptions Need Review</h3>
              <p class="text-body-2 mb-0">
                <VChip size="x-small" color="error" class="me-1" v-if="reviewQueueCount.byPriority?.critical > 0">
                  {{ reviewQueueCount.byPriority.critical }} Critical
                </VChip>
                <VChip size="x-small" color="warning" class="me-1" v-if="reviewQueueCount.byPriority?.high > 0">
                  {{ reviewQueueCount.byPriority.high }} High
                </VChip>
                <VChip size="x-small" color="info" class="me-1" v-if="reviewQueueCount.byPriority?.medium > 0">
                  {{ reviewQueueCount.byPriority.medium }} Medium
                </VChip>
                <VChip size="x-small" color="success" v-if="reviewQueueCount.byPriority?.low > 0">
                  {{ reviewQueueCount.byPriority.low }} Low
                </VChip>
              </p>
            </div>
          </div>
          <VBtn color="warning" @click="viewTab = 'review'">
            View Review Queue
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- View Toggle Tabs -->
    <VCard class="mb-4">
      <VTabs v-model="viewTab" color="primary">
        <VTab value="all">
          <VIcon start>mdi-prescription</VIcon>
          All Prescriptions
        </VTab>
        <VTab value="review">
          <VIcon start>mdi-clipboard-check</VIcon>
          Needs Review
          <VBadge
            v-if="reviewQueueCount.total > 0"
            :content="reviewQueueCount.total"
            color="warning"
            inline
            class="ms-2"
          />
        </VTab>
        <VTab value="clarification">
          <VIcon start>mdi-message-question</VIcon>
          Awaiting Clarification
          <VBadge
            v-if="reviewQueueCount.clarificationPending > 0"
            :content="reviewQueueCount.clarificationPending"
            color="info"
            inline
            class="ms-2"
          />
        </VTab>
      </VTabs>
    </VCard>

    <!-- Filters -->
    <VCard class="mb-6" v-if="viewTab === 'all'">
      <VCardText>
        <VRow>
          <VCol cols="12" md="4">
            <VTextField
              v-model="searchQuery"
              label="Search prescriptions..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="debouncedSearch"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="statusFilter"
              label="Status"
              :items="statusOptions"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchPrescriptions"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VTextField
              v-model="dateFilter"
              label="Date"
              type="date"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchPrescriptions"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="itemsPerPage"
              label="Per Page"
              :items="[10, 25, 50, 100]"
              variant="outlined"
              density="compact"
              @update:model-value="fetchPrescriptions"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Review Queue Filters (when on review tab) -->
    <VCard class="mb-6" v-if="viewTab === 'review'">
      <VCardText>
        <VRow>
          <VCol cols="12" md="4">
            <VSelect
              v-model="reviewPriorityFilter"
              label="Priority"
              :items="priorityOptions"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchReviewQueue"
            />
          </VCol>
          <VCol cols="12" md="4">
            <VSelect
              v-model="reviewSortBy"
              label="Sort By"
              :items="reviewSortOptions"
              variant="outlined"
              density="compact"
              @update:model-value="fetchReviewQueue"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="reviewItemsPerPage"
              label="Per Page"
              :items="[10, 25, 50]"
              variant="outlined"
              density="compact"
              @update:model-value="fetchReviewQueue"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Review Queue Table (when on review tab) -->
    <VCard v-if="viewTab === 'review'">
      <VCardText>
        <VTable v-if="reviewQueue.length > 0">
          <thead>
            <tr>
              <th>Prescription #</th>
              <th>Patient</th>
              <th>Date Uploaded</th>
              <th>Risk Level</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rx in reviewQueue" :key="rx._id">
              <td class="font-weight-medium">{{ rx.prescription_number }}</td>
              <td>
                <div class="d-flex align-center">
                  <VAvatar size="32" color="primary" variant="tonal" class="me-2">
                    {{ rx.patient?.name?.[0] || '?' }}
                  </VAvatar>
                  <div>
                    <div class="text-body-2">{{ rx.patient?.name || 'Unknown' }}</div>
                    <div class="text-caption text-medium-emphasis">{{ rx.patient?.email }}</div>
                  </div>
                </div>
              </td>
              <td>{{ formatDate(rx.created_at) }}</td>
              <td>
                <VChip
                  :color="getRiskLevelColor(rx.risk_level)"
                  size="small"
                  variant="flat"
                >
                  <VIcon start size="14">{{ getRiskLevelIcon(rx.risk_level) }}</VIcon>
                  {{ rx.risk_level }} ({{ rx.fraud_score }}%)
                </VChip>
              </td>
              <td>
                <VChip :color="getVerificationStatusColor(rx.verification_status)" size="small">
                  {{ formatVerificationStatus(rx.verification_status) }}
                </VChip>
              </td>
              <td>
                <VTooltip v-if="rx.fraud_flags?.length > 0">
                  <template v-slot:activator="{ props }">
                    <VChip v-bind="props" color="error" size="small" variant="outlined">
                      {{ rx.fraud_flags.length }} flags
                    </VChip>
                  </template>
                  <div>
                    <div v-for="flag in rx.fraud_flags" :key="flag.flag" class="mb-1">
                      <strong>{{ flag.flag }}</strong>: {{ flag.description }}
                    </div>
                  </div>
                </VTooltip>
                <span v-else class="text-medium-emphasis">None</span>
              </td>
              <td>
                <VBtn size="small" color="primary" variant="tonal" @click="viewPrescriptionReview(rx._id)" class="me-1">
                  Review
                </VBtn>
                <VMenu>
                  <template v-slot:activator="{ props }">
                    <VBtn size="small" variant="text" icon="mdi-dots-vertical" v-bind="props" />
                  </template>
                  <VList density="compact">
                    <VListItem @click="quickApprove(rx._id)">
                      <template v-slot:prepend><VIcon color="success">mdi-check</VIcon></template>
                      <VListItemTitle>Quick Approve</VListItemTitle>
                    </VListItem>
                    <VListItem @click="openRejectDialog(rx)">
                      <template v-slot:prepend><VIcon color="error">mdi-close</VIcon></template>
                      <VListItemTitle>Reject</VListItemTitle>
                    </VListItem>
                    <VListItem @click="openClarificationDialog(rx)">
                      <template v-slot:prepend><VIcon color="info">mdi-message-question</VIcon></template>
                      <VListItemTitle>Request Clarification</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
              </td>
            </tr>
          </tbody>
        </VTable>

        <VAlert v-else-if="!loading" type="info" variant="tonal">
          No prescriptions pending review
        </VAlert>

        <!-- Review Pagination -->
        <div class="d-flex justify-center mt-4" v-if="reviewTotalPages > 1">
          <VPagination
            v-model="reviewCurrentPage"
            :length="reviewTotalPages"
            :total-visible="7"
            @update:model-value="fetchReviewQueue"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Awaiting Clarification Table (when on clarification tab) -->
    <VCard v-if="viewTab === 'clarification'">
      <VCardText>
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-h6">Prescriptions Awaiting Patient Response</h3>
          <VSelect
            v-model="clarificationSortBy"
            :items="[
              { title: 'Deadline (Soonest)', value: 'response_deadline' },
              { title: 'Date (Newest)', value: 'created_at' },
            ]"
            label="Sort by"
            variant="outlined"
            density="compact"
            style="max-width: 200px"
            @update:model-value="fetchClarificationQueue"
          />
        </div>

        <VTable v-if="clarificationQueue.length > 0">
          <thead>
            <tr>
              <th>Prescription #</th>
              <th>Patient</th>
              <th>Clarification Request</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rx in clarificationQueue" :key="rx._id">
              <td class="font-weight-medium">{{ rx.prescription_number }}</td>
              <td>
                <div class="d-flex align-center">
                  <VAvatar size="32" color="primary" variant="tonal" class="me-2">
                    {{ rx.patient?.name?.charAt(0) || '?' }}
                  </VAvatar>
                  <div>
                    <div class="text-body-2">{{ rx.patient?.name || 'Unknown' }}</div>
                    <div class="text-caption text-medium-emphasis">{{ rx.patient?.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="text-body-2" style="max-width: 300px;">
                  {{ rx.clarification?.request_message || 'No message' }}
                </div>
                <div v-if="rx.clarification?.required_information?.length" class="mt-1">
                  <VChip v-for="info in rx.clarification.required_information" :key="info" size="x-small" class="me-1">
                    {{ info }}
                  </VChip>
                </div>
              </td>
              <td>
                <VChip
                  :color="rx.is_overdue ? 'error' : (rx.days_until_deadline <= 2 ? 'warning' : 'success')"
                  size="small"
                >
                  <VIcon start size="14">mdi-clock-outline</VIcon>
                  <span v-if="rx.is_overdue">Overdue ({{ Math.abs(rx.days_until_deadline) }}d)</span>
                  <span v-else-if="rx.days_until_deadline === 0">Today</span>
                  <span v-else>{{ rx.days_until_deadline }} days left</span>
                </VChip>
              </td>
              <td>
                <VChip color="info" size="small">
                  Awaiting Response
                </VChip>
              </td>
              <td>
                <VBtn size="small" variant="text" color="primary" @click="viewPrescriptionReview(rx._id)">
                  View Details
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>

        <VAlert v-else type="info" variant="tonal" class="mt-4">
          <VIcon start>mdi-check-circle</VIcon>
          No prescriptions are currently awaiting patient clarification.
        </VAlert>

        <!-- Clarification Pagination -->
        <div class="d-flex justify-center mt-4" v-if="clarificationTotalPages > 1">
          <VPagination
            v-model="clarificationCurrentPage"
            :length="clarificationTotalPages"
            :total-visible="7"
            @update:model-value="fetchClarificationQueue"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Prescriptions Table -->
    <VCard v-if="viewTab === 'all'">
      <VCardText>
        <VTable v-if="prescriptions.length > 0">
          <thead>
            <tr>
              <th>Prescription #</th>
              <th>Date</th>
              <th>Type</th>
              <th>Patient</th>
              <th>Prescribing Doctor</th>
              <th>Medications</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prescription in prescriptions" :key="prescription._id">
              <td class="font-weight-medium">{{ prescription.prescription_number }}</td>
              <td>{{ formatDate(prescription.created_at) }}</td>
              <td>
                <VChip
                  :color="getTypeColor(prescription.source)"
                  size="small"
                  variant="tonal"
                >
                  <VIcon start size="14">{{ getTypeIcon(prescription.source) }}</VIcon>
                  {{ prescription.type || getTypeName(prescription.source) }}
                </VChip>
              </td>
              <td>
                <div class="d-flex align-center">
                  <VAvatar size="32" color="primary" variant="tonal" class="me-2">
                    {{ getPatientInitials(prescription.patient) }}
                  </VAvatar>
                  <span class="text-body-2">
                    {{ prescription.patient?.profile?.first_name }} {{ prescription.patient?.profile?.last_name }}
                  </span>
                </div>
              </td>
              <td>
                <span v-if="prescription.specialist?.profile">
                  Dr. {{ prescription.specialist?.profile?.first_name }} {{ prescription.specialist?.profile?.last_name }}
                </span>
                <span v-else class="text-medium-emphasis">N/A</span>
              </td>
              <td>
                <span v-if="prescription.source === 'EXTERNAL'">
                  {{ prescription.documents?.length || 0 }} files
                </span>
                <span v-else>{{ prescription.medications?.length || 0 }} items</span>
              </td>
              <td>
                <VChip :color="getStatusColor(prescription.status)" size="small">
                  {{ formatStatus(prescription.status) }}
                </VChip>
              </td>
              <td>
                <VBtn size="small" variant="text" color="primary" @click="viewPrescription(prescription._id)">
                  View
                </VBtn>
                <!-- Status Update Menu -->
                <VMenu v-if="canUpdateStatus(prescription)">
                  <template v-slot:activator="{ props }">
                    <VBtn size="small" variant="text" v-bind="props">
                      Update
                    </VBtn>
                  </template>
                  <VList density="compact">
                    <VListItem
                      v-for="status in getNextStatuses(prescription)"
                      :key="status"
                      @click="updatePrescriptionStatus(prescription._id, status)"
                    >
                      <VListItemTitle>{{ formatStatus(status) }}</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
                <!-- Fill Menu (only after Processing status) -->
                <VMenu v-if="canFill(prescription)">
                  <template v-slot:activator="{ props }">
                    <VBtn size="small" variant="text" color="success" v-bind="props">
                      Fill
                    </VBtn>
                  </template>
                  <VList density="compact">
                    <VListItem @click="fillAllMedications(prescription._id)">
                      <VListItemTitle>Fill All</VListItemTitle>
                    </VListItem>
                    <VListItem @click="viewPrescription(prescription._id)">
                      <VListItemTitle>Fill Individual</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
              </td>
            </tr>
          </tbody>
        </VTable>

        <VAlert v-else-if="!loading" type="info" variant="tonal">
          No prescriptions found matching your criteria
        </VAlert>

        <!-- Pagination -->
        <div class="d-flex justify-center mt-4" v-if="totalPages > 1">
          <VPagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="fetchPrescriptions"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Loading Overlay -->
    <VOverlay v-model="loading" class="align-center justify-center" persistent>
      <VProgressCircular indeterminate size="64" color="primary" />
    </VOverlay>

    <!-- Reject Dialog -->
    <VDialog v-model="rejectDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">
          <VIcon color="error" class="me-2">mdi-close-circle</VIcon>
          Reject Prescription
        </VCardTitle>
        <VCardText>
          <p class="mb-4">Please provide a reason for rejecting this prescription:</p>
          <VTextField
            v-model="selectedPrescription.prescription_number"
            label="Prescription Number"
            readonly
            variant="outlined"
            class="mb-4"
          />
          <VTextarea
            v-model="rejectReason"
            label="Rejection Reason"
            placeholder="Enter the reason for rejection..."
            variant="outlined"
            rows="3"
            :rules="[v => !!v || 'Rejection reason is required']"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="text" @click="rejectDialog = false">Cancel</VBtn>
          <VBtn color="error" :loading="actionLoading" @click="submitReject" :disabled="!rejectReason">
            Reject
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Clarification Dialog -->
    <VDialog v-model="clarificationDialog" max-width="600">
      <VCard>
        <VCardTitle class="text-h5">
          <VIcon color="info" class="me-2">mdi-message-question</VIcon>
          Request Clarification
        </VCardTitle>
        <VCardText>
          <p class="mb-4">Request additional information from the patient:</p>
          <VTextField
            v-model="selectedPrescription.prescription_number"
            label="Prescription Number"
            readonly
            variant="outlined"
            class="mb-4"
          />
          <VTextarea
            v-model="clarificationMessage"
            label="Clarification Request"
            placeholder="Describe what information you need from the patient..."
            variant="outlined"
            rows="4"
            :rules="[v => !!v || 'Clarification message is required']"
          />
          <VCombobox
            v-model="clarificationItems"
            label="Required Information Items"
            chips
            multiple
            closable-chips
            variant="outlined"
            hint="Press Enter to add items"
            persistent-hint
            class="mt-4"
          />
          <VTextField
            v-model.number="clarificationDeadlineDays"
            label="Response Deadline (days)"
            type="number"
            min="1"
            max="30"
            variant="outlined"
            class="mt-4"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="text" @click="clarificationDialog = false">Cancel</VBtn>
          <VBtn color="info" :loading="actionLoading" @click="submitClarificationRequest" :disabled="!clarificationMessage">
            Send Request
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Success/Error Snackbar -->
    <VSnackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

// Simple debounce utility
const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const router = useRouter()
const loading = ref(false)
const actionLoading = ref(false)

// View tab state
const viewTab = ref('all')

// Prescriptions state
const prescriptions = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = ref(25)
const searchQuery = ref('')
const statusFilter = ref(null)
const dateFilter = ref(null)

// Review queue state
const reviewQueue = ref([])
const reviewQueueCount = ref({ total: 0, byPriority: {}, byStatus: {}, clarificationPending: 0 })
const reviewCurrentPage = ref(1)
const reviewTotalPages = ref(1)
const reviewItemsPerPage = ref(25)
const reviewPriorityFilter = ref(null)
const reviewSortBy = ref('fraud_score')

// Clarification queue state
const clarificationQueue = ref([])
const clarificationCurrentPage = ref(1)
const clarificationTotalPages = ref(1)
const clarificationSortBy = ref('response_deadline')

// Dialog state
const rejectDialog = ref(false)
const clarificationDialog = ref(false)
const selectedPrescription = ref({})
const rejectReason = ref('')
const clarificationMessage = ref('')
const clarificationItems = ref([])
const clarificationDeadlineDays = ref(7)

// Snackbar state
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const priorityOptions = [
  { title: 'All', value: null },
  { title: 'Critical (80%+)', value: 'high' },
  { title: 'Medium (40-79%)', value: 'medium' },
  { title: 'Low (<40%)', value: 'low' },
]

const reviewSortOptions = [
  { title: 'Risk Score (Highest)', value: 'fraud_score' },
  { title: 'Date (Newest)', value: 'created_at' },
  { title: 'Deadline (Soonest)', value: 'response_deadline' },
]

const statusOptions = [
  { title: 'Draft', value: 'draft' },
  { title: 'Pending Payment', value: 'pending_payment' },
  { title: 'Paid', value: 'paid' },
  { title: 'Processing', value: 'processing' },
  { title: 'Dispensed', value: 'dispensed' },
  { title: 'Ready for Pickup', value: 'ready_for_pickup' },
  { title: 'Shipped', value: 'shipped' },
  { title: 'Delivered', value: 'delivered' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' },
  { title: 'Expired', value: 'expired' },
]

const getTypeColor = (source) => {
  const colorMap = {
    SPECIALIST: 'primary',
    INTERNAL: 'info',
    EXTERNAL: 'secondary',
    UPLOAD: 'warning',
  }
  return colorMap[source] || 'default'
}

const getTypeIcon = (source) => {
  const iconMap = {
    SPECIALIST: 'mdi-doctor',
    INTERNAL: 'mdi-pill',
    EXTERNAL: 'mdi-file-document',
    UPLOAD: 'mdi-upload',
  }
  return iconMap[source] || 'mdi-prescription'
}

const getTypeName = (source) => {
  const nameMap = {
    SPECIALIST: 'Doctor',
    INTERNAL: 'Internal',
    EXTERNAL: 'External',
    UPLOAD: 'Patient Upload',
  }
  return nameMap[source] || source
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatStatus = (status) => {
  const statusMap = {
    draft: 'Draft',
    pending: 'Pending',
    pending_payment: 'Pending Payment',
    paid: 'Paid',
    processing: 'Processing',
    dispensed: 'Dispensed',
    ready_for_pickup: 'Ready for Pickup',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    expired: 'Expired',
    uploaded: 'Uploaded',
    sent_to_pharmacy: 'Sent to Pharmacy',
    // Patient upload statuses
    approved: 'Approved',
    rejected: 'Rejected',
    // Internal prescription statuses
    'prescription received': 'Received',
    'validating prescription': 'Validating',
    'prescription validation failed': 'Validation Failed',
    'processing order': 'Processing',
    'order processed': 'Processed',
  }
  return statusMap[status?.toLowerCase()] || status
}

const getStatusColor = (status) => {
  const colorMap = {
    draft: 'secondary',
    pending: 'warning',
    pending_payment: 'warning',
    paid: 'info',
    processing: 'info',
    dispensed: 'primary',
    ready_for_pickup: 'primary',
    shipped: 'primary',
    out_for_delivery: 'primary',
    delivered: 'success',
    completed: 'success',
    cancelled: 'error',
    expired: 'error',
    uploaded: 'secondary',
    sent_to_pharmacy: 'info',
    // Patient upload statuses
    approved: 'success',
    rejected: 'error',
    // Internal prescription statuses
    'prescription received': 'info',
    'validating prescription': 'warning',
    'prescription validation failed': 'error',
    'processing order': 'info',
    'order processed': 'success',
  }
  return colorMap[status?.toLowerCase()] || 'default'
}

const getPatientInitials = (patient) => {
  if (!patient?.profile) return '?'
  const first = patient.profile.first_name?.[0] || ''
  const last = patient.profile.last_name?.[0] || ''
  return (first + last).toUpperCase()
}

// Check if prescription status can be updated (not in final states)
const canUpdateStatus = (prescription) => {
  const status = prescription.status?.toLowerCase()
  // Don't allow updates for linked prescriptions (processed through pharmacy orders)
  if (prescription.linked_pharmacy_order || prescription.linked_pharmacy_order_number) {
    return false
  }
  // Don't allow updates for final states
  return !['delivered', 'completed', 'cancelled', 'expired', 'rejected'].includes(status)
}

// Get next available statuses based on current status and delivery method
const getNextStatuses = (prescription) => {
  const status = prescription.status?.toLowerCase()
  const deliveryMethod = prescription.delivery_method || prescription.delivery_type || 'DELIVERY'
  const isPickup = deliveryMethod.toUpperCase() === 'PICKUP'

  const statusFlow = {
    'draft': ['paid'],
    'pending_payment': ['paid'],
    'paid': ['processing'],
    'processing': [],  // No status update here - use Fill action instead
    'dispensed': isPickup ? ['ready_for_pickup'] : ['out_for_delivery'],
    'ready_for_pickup': ['delivered'],
    'out_for_delivery': ['delivered'],
    'shipped': ['delivered'],
    'delivered': ['completed'],
    // Patient upload statuses
    'pending': ['approved', 'rejected'],
    'approved': ['processing'],
  }

  return statusFlow[status] || []
}

// Update prescription status
const updatePrescriptionStatus = async (prescriptionId, newStatus) => {
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${prescriptionId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus.toUpperCase() }),
    })

    if (response.ok) {
      await fetchPrescriptions()
    }
  } catch (error) {
    console.error('Error updating prescription status:', error)
  }
}

// Can fill only when status is 'processing' (after it's been marked as processing)
const canFill = (prescription) => {
  const status = prescription.status?.toLowerCase()
  // Don't allow fill for linked prescriptions
  if (prescription.linked_pharmacy_order || prescription.linked_pharmacy_order_number) {
    return false
  }
  return status === 'processing' && !isExpired(prescription.expires_at)
}

const isExpired = (date) => {
  if (!date) return false
  return new Date(date) < new Date()
}

const viewPrescription = (id) => {
  router.push(`/pharmacy/prescriptions/${id}`)
}

const fillAllMedications = async (prescriptionId) => {
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${prescriptionId}/fill-all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      await fetchPrescriptions()
    }
  } catch (error) {
    console.error('Error filling prescription:', error)
  }
}

const fetchPrescriptions = async () => {
  loading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: itemsPerPage.value,
    })

    if (searchQuery.value) params.append('search', searchQuery.value)
    if (statusFilter.value) params.append('status', statusFilter.value)
    if (dateFilter.value) params.append('date', dateFilter.value)

    const response = await fetch(`/admin-api/pharmacy/prescriptions?${params}`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()

    if (data.statusCode === 200 && data.data) {
      prescriptions.value = data.data.prescriptions || data.data
      totalPages.value = data.data.totalPages || Math.ceil((data.data.total || 0) / itemsPerPage.value)
    }
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  fetchPrescriptions()
}, 500)

// ============ REVIEW QUEUE METHODS ============

const getRiskLevelColor = (level) => {
  const colorMap = {
    CRITICAL: 'error',
    HIGH: 'warning',
    MEDIUM: 'info',
    LOW: 'success',
  }
  return colorMap[level] || 'secondary'
}

const getRiskLevelIcon = (level) => {
  const iconMap = {
    CRITICAL: 'mdi-alert-octagon',
    HIGH: 'mdi-alert',
    MEDIUM: 'mdi-information',
    LOW: 'mdi-check-circle',
  }
  return iconMap[level] || 'mdi-help-circle'
}

const getVerificationStatusColor = (status) => {
  const colorMap = {
    PHARMACIST_REVIEW: 'warning',
    CLARIFICATION_NEEDED: 'info',
    CLARIFICATION_RECEIVED: 'primary',
    TIER1_FAILED: 'error',
    TIER2_FAILED: 'error',
    APPROVED: 'success',
    REJECTED: 'error',
  }
  return colorMap[status] || 'secondary'
}

const formatVerificationStatus = (status) => {
  const statusMap = {
    PHARMACIST_REVIEW: 'Pharmacist Review',
    CLARIFICATION_NEEDED: 'Clarification Needed',
    CLARIFICATION_RECEIVED: 'Clarification Received',
    TIER1_FAILED: 'Tier 1 Failed',
    TIER2_FAILED: 'Tier 2 Failed',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PENDING: 'Pending',
  }
  return statusMap[status] || status
}

const fetchReviewQueueCount = async () => {
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch('/admin-api/pharmacy/prescriptions/review-queue-count', {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    if (data.statusCode === 200 && data.data) {
      reviewQueueCount.value = data.data
    }
  } catch (error) {
    console.error('Error fetching review queue count:', error)
  }
}

const fetchReviewQueue = async () => {
  loading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const params = new URLSearchParams({
      page: reviewCurrentPage.value,
      limit: reviewItemsPerPage.value,
      sortBy: reviewSortBy.value,
      sortOrder: 'desc',
    })

    if (reviewPriorityFilter.value) {
      params.append('priority', reviewPriorityFilter.value)
    }

    const response = await fetch(`/admin-api/pharmacy/prescriptions/pending-review?${params}`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    if (data.statusCode === 200 && data.data) {
      reviewQueue.value = data.data.prescriptions || []
      reviewTotalPages.value = data.data.totalPages || 1
    }
  } catch (error) {
    console.error('Error fetching review queue:', error)
  } finally {
    loading.value = false
  }
}

const fetchClarificationQueue = async () => {
  loading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const params = new URLSearchParams({
      page: clarificationCurrentPage.value.toString(),
      limit: '25',
      sortBy: clarificationSortBy.value,
      sortOrder: 'asc',
    })
    const response = await fetch(`/admin-api/pharmacy/prescriptions/awaiting-clarification?${params}`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    if (response.ok && data.data) {
      clarificationQueue.value = data.data.prescriptions || []
      clarificationTotalPages.value = data.data.totalPages || 1
    }
  } catch (error) {
    console.error('Error fetching clarification queue:', error)
  } finally {
    loading.value = false
  }
}

const viewPrescriptionReview = (id) => {
  router.push(`/pharmacy/prescriptions/${id}?review=true`)
}

const quickApprove = async (prescriptionId) => {
  actionLoading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${prescriptionId}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        review_notes: 'Quick approved from prescriptions list',
      }),
    })
    const data = await response.json()
    if (response.ok) {
      showSnackbar('Prescription approved successfully', 'success')
      await fetchData()
    } else {
      showSnackbar(data.errorMessage || 'Failed to approve prescription', 'error')
    }
  } catch (error) {
    console.error('Error approving prescription:', error)
    showSnackbar('Error approving prescription', 'error')
  } finally {
    actionLoading.value = false
  }
}

const openRejectDialog = (prescription) => {
  selectedPrescription.value = prescription
  rejectReason.value = ''
  rejectDialog.value = true
}

const submitReject = async () => {
  actionLoading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${selectedPrescription.value._id}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        decision: 'REJECTED',
        rejection_reason: rejectReason.value,
      }),
    })
    const data = await response.json()
    if (response.ok) {
      showSnackbar('Prescription rejected', 'success')
      rejectDialog.value = false
      await fetchData()
    } else {
      showSnackbar(data.errorMessage || 'Failed to reject prescription', 'error')
    }
  } catch (error) {
    console.error('Error rejecting prescription:', error)
    showSnackbar('Error rejecting prescription', 'error')
  } finally {
    actionLoading.value = false
  }
}

const openClarificationDialog = (prescription) => {
  selectedPrescription.value = prescription
  clarificationMessage.value = ''
  clarificationItems.value = []
  clarificationDeadlineDays.value = 7
  clarificationDialog.value = true
}

const submitClarificationRequest = async () => {
  actionLoading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${selectedPrescription.value._id}/request-clarification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_message: clarificationMessage.value,
        required_information: clarificationItems.value,
        response_deadline_days: clarificationDeadlineDays.value,
      }),
    })
    const data = await response.json()
    if (response.ok) {
      showSnackbar('Clarification request sent', 'success')
      clarificationDialog.value = false
      await fetchData()
    } else {
      showSnackbar(data.errorMessage || 'Failed to send clarification request', 'error')
    }
  } catch (error) {
    console.error('Error requesting clarification:', error)
    showSnackbar('Error requesting clarification', 'error')
  } finally {
    actionLoading.value = false
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const fetchData = async () => {
  await Promise.all([
    fetchPrescriptions(),
    fetchReviewQueueCount(),
    viewTab.value === 'review' ? fetchReviewQueue() : Promise.resolve(),
  ])
}

// Watch for tab changes
watch(viewTab, async (newTab) => {
  if (newTab === 'review') {
    await fetchReviewQueue()
  } else if (newTab === 'clarification') {
    await fetchClarificationQueue()
  }
})

onMounted(() => {
  fetchData()
})
</script>
