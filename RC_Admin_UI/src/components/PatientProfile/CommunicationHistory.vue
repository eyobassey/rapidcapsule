<template>
  <VCard>
    <VCardText>
      <div class="d-flex justify-space-between align-center mb-4">
        <h6 class="text-h6 mb-0">
          Communication History
        </h6>
        <VBtn
          color="primary"
          variant="outlined"
          size="small"
          prepend-icon="bx-plus"
          @click="showNewCommunicationDialog = true"
        >
          Add Communication
        </VBtn>
      </div>

      <!-- Filter Options -->
      <VRow class="mb-4">
        <VCol cols="12" md="4">
          <VSelect
            v-model="selectedType"
            :items="communicationTypes"
            label="Communication Type"
            variant="outlined"
            density="compact"
            clearable
          />
        </VCol>
        
        <VCol cols="12" md="4">
          <VSelect
            v-model="selectedPerson"
            :items="communicationPersons"
            label="Communicated With"
            variant="outlined"
            density="compact"
            clearable
          />
        </VCol>
        
        <VCol cols="12" md="4">
          <VSelect
            v-model="dateFilter"
            :items="dateFilters"
            label="Time Period"
            variant="outlined"
            density="compact"
          />
        </VCol>
      </VRow>

      <!-- Communication Timeline -->
      <div v-if="loading" class="text-center py-8">
        <VProgressCircular
          indeterminate
          color="primary"
          size="40"
        />
        <p class="text-body-2 mt-2">Loading communications...</p>
      </div>

      <div v-else-if="filteredCommunications.length === 0" class="text-center py-8">
        <VIcon 
          icon="bx-message-dots" 
          size="64" 
          class="text-disabled mb-4"
        />
        <h6 class="text-h6 text-disabled mb-2">No Communications Found</h6>
        <p class="text-body-2 text-disabled mb-4">
          {{ hasFilters ? 'No communications match your filters' : 'No communications recorded for this patient' }}
        </p>
        <VBtn
          color="primary"
          variant="outlined"
          @click="showNewCommunicationDialog = true"
        >
          Add First Communication
        </VBtn>
      </div>

      <VTimeline v-else side="end" class="communication-timeline">
        <VTimelineItem
          v-for="comm in filteredCommunications"
          :key="comm.id"
          :dot-color="getCommunicationColor(comm.type)"
          size="small"
        >
          <template #icon>
            <VIcon :icon="getCommunicationIcon(comm.type)" size="16" />
          </template>

          <VCard variant="outlined" class="communication-card">
            <VCardText>
              <div class="d-flex justify-space-between align-start mb-2">
                <div>
                  <VChip
                    :color="getCommunicationColor(comm.type)"
                    size="small"
                    variant="tonal"
                    class="mb-2"
                  >
                    {{ comm.type }}
                  </VChip>
                  <h6 class="text-subtitle-1 mb-1">{{ comm.subject || comm.title }}</h6>
                  <p class="text-caption text-medium-emphasis mb-2">
                    <VIcon icon="bx-time" size="12" class="mr-1" />
                    {{ formatDateTime(comm.timestamp) }}
                    <span class="mx-2">•</span>
                    <VIcon icon="bx-user" size="12" class="mr-1" />
                    {{ comm.participant }}
                    <span v-if="comm.method" class="mx-2">•</span>
                    <VIcon v-if="comm.method" :icon="getMethodIcon(comm.method)" size="12" class="mr-1" />
                    {{ comm.method }}
                  </p>
                </div>
                
                <VMenu>
                  <template #activator="{ props }">
                    <VBtn
                      icon="bx-dots-vertical-rounded"
                      variant="text"
                      size="small"
                      v-bind="props"
                    />
                  </template>
                  <VList>
                    <VListItem @click="viewCommunication(comm)">
                      <template #prepend>
                        <VIcon icon="bx-show" />
                      </template>
                      <VListItemTitle>View Details</VListItemTitle>
                    </VListItem>
                    <VListItem @click="editCommunication(comm)">
                      <template #prepend>
                        <VIcon icon="bx-edit" />
                      </template>
                      <VListItemTitle>Edit</VListItemTitle>
                    </VListItem>
                    <VListItem @click="deleteCommunication(comm)" class="text-error">
                      <template #prepend>
                        <VIcon icon="bx-trash" />
                      </template>
                      <VListItemTitle>Delete</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
              </div>

              <p class="text-body-2 mb-3">{{ comm.summary || comm.content }}</p>

              <div v-if="comm.tags && comm.tags.length" class="mb-2">
                <VChip
                  v-for="tag in comm.tags"
                  :key="tag"
                  size="x-small"
                  variant="outlined"
                  class="mr-1"
                >
                  {{ tag }}
                </VChip>
              </div>

              <div v-if="comm.status" class="d-flex align-center">
                <VIcon 
                  :icon="getStatusIcon(comm.status)" 
                  :color="getStatusColor(comm.status)"
                  size="14" 
                  class="mr-1"
                />
                <span class="text-caption" :class="`text-${getStatusColor(comm.status)}`">
                  {{ comm.status }}
                </span>
              </div>
            </VCardText>
          </VCard>
        </VTimelineItem>
      </VTimeline>

      <!-- Load More Button -->
      <div v-if="hasMore && !loading" class="text-center mt-4">
        <VBtn
          variant="outlined"
          @click="loadMore"
          :loading="loadingMore"
        >
          Load More Communications
        </VBtn>
      </div>
    </VCardText>

    <!-- New Communication Dialog -->
    <VDialog
      v-model="showNewCommunicationDialog"
      max-width="600"
      persistent
    >
      <VCard>
        <VCardTitle>
          <span class="text-h6">Add Communication Record</span>
        </VCardTitle>

        <VCardText>
          <VForm ref="communicationForm" @submit.prevent="saveCommunication">
            <VRow>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="newCommunication.type"
                  :items="communicationTypes"
                  label="Communication Type"
                  variant="outlined"
                  :rules="[v => !!v || 'Type is required']"
                  required
                />
              </VCol>
              
              <VCol cols="12" md="6">
                <VSelect
                  v-model="newCommunication.method"
                  :items="communicationMethods"
                  label="Method"
                  variant="outlined"
                  :rules="[v => !!v || 'Method is required']"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="newCommunication.participant"
                  label="Participant/Contact Person"
                  variant="outlined"
                  :rules="[v => !!v || 'Participant is required']"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="newCommunication.subject"
                  label="Subject/Title"
                  variant="outlined"
                  :rules="[v => !!v || 'Subject is required']"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="newCommunication.content"
                  label="Communication Details"
                  variant="outlined"
                  rows="4"
                  :rules="[v => !!v || 'Details are required']"
                  required
                />
              </VCol>

              <VCol cols="12" md="6">
                <VSelect
                  v-model="newCommunication.status"
                  :items="statusOptions"
                  label="Status"
                  variant="outlined"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="newCommunication.tags"
                  label="Tags (comma-separated)"
                  variant="outlined"
                  placeholder="urgent, follow-up, billing"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="cancelNewCommunication"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            @click="saveCommunication"
            :loading="saving"
          >
            Save Communication
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- View Communication Dialog -->
    <VDialog
      v-model="showViewDialog"
      max-width="700"
    >
      <VCard v-if="selectedCommunication">
        <VCardTitle>
          <span class="text-h6">{{ selectedCommunication.subject }}</span>
        </VCardTitle>

        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <div class="text-caption text-medium-emphasis">Type</div>
              <VChip :color="getCommunicationColor(selectedCommunication.type)" size="small" variant="tonal">
                {{ selectedCommunication.type }}
              </VChip>
            </VCol>
            
            <VCol cols="12" md="6">
              <div class="text-caption text-medium-emphasis">Method</div>
              <div class="d-flex align-center">
                <VIcon :icon="getMethodIcon(selectedCommunication.method)" size="16" class="mr-2" />
                {{ selectedCommunication.method }}
              </div>
            </VCol>

            <VCol cols="12" md="6">
              <div class="text-caption text-medium-emphasis">Participant</div>
              <div>{{ selectedCommunication.participant }}</div>
            </VCol>

            <VCol cols="12" md="6">
              <div class="text-caption text-medium-emphasis">Date & Time</div>
              <div>{{ formatDateTime(selectedCommunication.timestamp) }}</div>
            </VCol>

            <VCol cols="12">
              <div class="text-caption text-medium-emphasis mb-2">Details</div>
              <div class="text-body-2">{{ selectedCommunication.content }}</div>
            </VCol>

            <VCol v-if="selectedCommunication.tags" cols="12">
              <div class="text-caption text-medium-emphasis mb-2">Tags</div>
              <VChip
                v-for="tag in selectedCommunication.tags"
                :key="tag"
                size="small"
                variant="outlined"
                class="mr-1 mb-1"
              >
                {{ tag }}
              </VChip>
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn @click="showViewDialog = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Success/Error Snackbar -->
    <VSnackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
    >
      {{ snackbarMessage }}
    </VSnackbar>
  </VCard>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import moment from 'moment'

const props = defineProps({
  userData: {
    type: Object,
    required: true
  }
})

// Reactive data
const communications = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)

// Filters
const selectedType = ref(null)
const selectedPerson = ref(null)
const dateFilter = ref('all')

// Dialog states
const showNewCommunicationDialog = ref(false)
const showViewDialog = ref(false)
const selectedCommunication = ref(null)
const saving = ref(false)

// Form data
const newCommunication = ref({
  type: '',
  method: '',
  participant: '',
  subject: '',
  content: '',
  status: 'completed',
  tags: ''
})

// Snackbar
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Options
const communicationTypes = [
  { title: 'Phone Call', value: 'phone_call' },
  { title: 'Email', value: 'email' },
  { title: 'SMS/Text', value: 'sms' },
  { title: 'Video Call', value: 'video_call' },
  { title: 'In-Person Meeting', value: 'in_person' },
  { title: 'Patient Portal Message', value: 'portal_message' },
  { title: 'Support Ticket', value: 'support_ticket' },
  { title: 'Consultation', value: 'consultation' },
  { title: 'Follow-up', value: 'follow_up' },
  { title: 'Emergency Contact', value: 'emergency' }
]

const communicationMethods = [
  { title: 'Phone', value: 'phone' },
  { title: 'Email', value: 'email' },
  { title: 'SMS', value: 'sms' },
  { title: 'Video Call', value: 'video' },
  { title: 'In-Person', value: 'in_person' },
  { title: 'Patient Portal', value: 'portal' },
  { title: 'Chat', value: 'chat' },
  { title: 'WhatsApp', value: 'whatsapp' }
]

const statusOptions = [
  { title: 'Completed', value: 'completed' },
  { title: 'Pending Response', value: 'pending' },
  { title: 'Follow-up Required', value: 'follow_up' },
  { title: 'Escalated', value: 'escalated' },
  { title: 'Resolved', value: 'resolved' }
]

const dateFilters = [
  { title: 'All Time', value: 'all' },
  { title: 'Last 7 Days', value: '7d' },
  { title: 'Last 30 Days', value: '30d' },
  { title: 'Last 3 Months', value: '3m' },
  { title: 'Last 6 Months', value: '6m' },
  { title: 'This Year', value: '1y' }
]

// Computed properties
const communicationPersons = computed(() => {
  const persons = [...new Set(communications.value.map(c => c.participant))]
  return persons.map(person => ({ title: person, value: person }))
})

const hasFilters = computed(() => {
  return selectedType.value || selectedPerson.value || dateFilter.value !== 'all'
})

const filteredCommunications = computed(() => {
  let filtered = [...communications.value]

  // Filter by type
  if (selectedType.value) {
    filtered = filtered.filter(c => c.type === selectedType.value)
  }

  // Filter by person
  if (selectedPerson.value) {
    filtered = filtered.filter(c => c.participant === selectedPerson.value)
  }

  // Filter by date
  if (dateFilter.value !== 'all') {
    const now = moment()
    const cutoff = {
      '7d': now.clone().subtract(7, 'days'),
      '30d': now.clone().subtract(30, 'days'),
      '3m': now.clone().subtract(3, 'months'),
      '6m': now.clone().subtract(6, 'months'),
      '1y': now.clone().subtract(1, 'year')
    }[dateFilter.value]

    if (cutoff) {
      filtered = filtered.filter(c => moment(c.timestamp).isAfter(cutoff))
    }
  }

  return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

// Methods
const fetchCommunications = async () => {
  try {
    loading.value = true
    
    // For now, create mock communication data
    // TODO: Replace with actual API call
    const mockCommunications = [
      {
        id: '1',
        type: 'phone_call',
        method: 'phone',
        participant: 'Dr. Sarah Johnson',
        subject: 'Health checkup follow-up',
        content: 'Discussed recent health assessment results. Patient reported feeling better after medication adjustment. Scheduled follow-up appointment for next month.',
        status: 'completed',
        timestamp: new Date('2025-09-08T10:30:00'),
        tags: ['follow-up', 'medication']
      },
      {
        id: '2',
        type: 'email',
        method: 'email',
        participant: 'Support Team',
        subject: 'Account verification completed',
        content: 'Patient account has been successfully verified. All features are now accessible. Welcome email sent with platform guidelines.',
        status: 'completed',
        timestamp: new Date('2025-09-07T14:15:00'),
        tags: ['verification', 'onboarding']
      },
      {
        id: '3',
        type: 'portal_message',
        method: 'portal',
        participant: 'Admin Team',
        subject: 'Prescription refill request',
        content: 'Patient requested prescription refill for blood pressure medication. Forwarded to prescribing physician for review and approval.',
        status: 'pending',
        timestamp: new Date('2025-09-06T16:45:00'),
        tags: ['prescription', 'medication']
      },
      {
        id: '4',
        type: 'sms',
        method: 'sms',
        participant: 'Appointment System',
        subject: 'Appointment reminder',
        content: 'Automated reminder sent for upcoming appointment with Dr. Sarah Johnson on September 15th at 2:00 PM.',
        status: 'completed',
        timestamp: new Date('2025-09-05T09:00:00'),
        tags: ['reminder', 'appointment']
      },
      {
        id: '5',
        type: 'video_call',
        method: 'video',
        participant: 'Dr. Michael Chen',
        subject: 'Telemedicine consultation',
        content: 'Initial telemedicine consultation conducted. Reviewed symptoms and medical history. Recommended lifestyle changes and prescribed medication.',
        status: 'completed',
        timestamp: new Date('2025-08-28T11:00:00'),
        tags: ['consultation', 'telemedicine']
      }
    ]

    communications.value = mockCommunications
    
  } catch (error) {
    console.error('Error fetching communications:', error)
    showNotification('Failed to load communications', 'error')
  } finally {
    loading.value = false
  }
}

const saveCommunication = async () => {
  try {
    saving.value = true
    
    // Validate form
    if (!newCommunication.value.type || !newCommunication.value.method || 
        !newCommunication.value.participant || !newCommunication.value.subject || 
        !newCommunication.value.content) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    // Process tags
    const tags = newCommunication.value.tags 
      ? newCommunication.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      : []

    // Create new communication record
    const communication = {
      id: Date.now().toString(),
      ...newCommunication.value,
      tags,
      timestamp: new Date(),
      created_by: 'Admin User' // TODO: Get from auth context
    }

    // TODO: Save to backend API
    communications.value.unshift(communication)
    
    showNotification('Communication record saved successfully', 'success')
    showNewCommunicationDialog.value = false
    resetForm()
    
  } catch (error) {
    console.error('Error saving communication:', error)
    showNotification('Failed to save communication', 'error')
  } finally {
    saving.value = false
  }
}

const viewCommunication = (communication) => {
  selectedCommunication.value = communication
  showViewDialog.value = true
}

const editCommunication = (communication) => {
  // TODO: Implement edit functionality
  showNotification('Edit functionality will be implemented soon', 'info')
}

const deleteCommunication = async (communication) => {
  if (confirm('Are you sure you want to delete this communication record?')) {
    // TODO: Call delete API
    communications.value = communications.value.filter(c => c.id !== communication.id)
    showNotification('Communication record deleted', 'success')
  }
}

const cancelNewCommunication = () => {
  showNewCommunicationDialog.value = false
  resetForm()
}

const resetForm = () => {
  newCommunication.value = {
    type: '',
    method: '',
    participant: '',
    subject: '',
    content: '',
    status: 'completed',
    tags: ''
  }
}

const loadMore = () => {
  // TODO: Implement pagination
  showNotification('Load more functionality will be implemented soon', 'info')
}

// Utility functions
const getCommunicationColor = (type) => {
  const colors = {
    phone_call: 'success',
    email: 'info',
    sms: 'warning',
    video_call: 'primary',
    in_person: 'secondary',
    portal_message: 'info',
    support_ticket: 'orange',
    consultation: 'primary',
    follow_up: 'warning',
    emergency: 'error'
  }
  return colors[type] || 'default'
}

const getCommunicationIcon = (type) => {
  const icons = {
    phone_call: 'bx-phone',
    email: 'bx-envelope',
    sms: 'bx-message',
    video_call: 'bx-video',
    in_person: 'bx-user',
    portal_message: 'bx-message-dots',
    support_ticket: 'bx-support',
    consultation: 'bx-health',
    follow_up: 'bx-time',
    emergency: 'bx-error'
  }
  return icons[type] || 'bx-message'
}

const getMethodIcon = (method) => {
  const icons = {
    phone: 'bx-phone',
    email: 'bx-envelope',
    sms: 'bx-message',
    video: 'bx-video',
    in_person: 'bx-user',
    portal: 'bx-globe',
    chat: 'bx-chat',
    whatsapp: 'bxl-whatsapp'
  }
  return icons[method] || 'bx-message'
}

const getStatusIcon = (status) => {
  const icons = {
    completed: 'bx-check-circle',
    pending: 'bx-time',
    follow_up: 'bx-refresh',
    escalated: 'bx-up-arrow-alt',
    resolved: 'bx-check-double'
  }
  return icons[status] || 'bx-circle'
}

const getStatusColor = (status) => {
  const colors = {
    completed: 'success',
    pending: 'warning',
    follow_up: 'info',
    escalated: 'error',
    resolved: 'success'
  }
  return colors[status] || 'default'
}

const formatDateTime = (date) => {
  return moment(date).format('MMM DD, YYYY [at] h:mm A')
}

const showNotification = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

// Lifecycle
onMounted(() => {
  fetchCommunications()
})
</script>

<style scoped>
.communication-timeline {
  margin-top: 16px;
}

.communication-card {
  margin-bottom: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.communication-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.v-timeline-item {
  margin-bottom: 24px;
}

.text-caption {
  font-size: 0.75rem;
}

.v-chip {
  font-weight: 500;
}
</style>