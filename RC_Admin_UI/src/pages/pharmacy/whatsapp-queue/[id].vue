<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWhatsAppQueueStore } from '@/stores/whatsappQueue'

const route = useRoute()
const router = useRouter()
const queueStore = useWhatsAppQueueStore()

// State
const loading = ref(true)
const item = ref(null)
const messages = ref([])
const error = ref(null)

// Dialogs
const showCompleteDialog = ref(false)
const showEscalateDialog = ref(false)
const showAssignDialog = ref(false)

// Forms
const resolutionNotes = ref('')
const escalationReason = ref('')
const newMessage = ref('')
const sendingMessage = ref(false)

// Active tab
const activeTab = ref('details')

// Tabs config
const tabs = computed(() => {
  const baseTabs = [
    { value: 'details', title: 'Details', icon: 'bx-info-circle' },
    { value: 'ocr', title: 'OCR Data', icon: 'bx-scan' },
    { value: 'messages', title: 'WhatsApp Messages', icon: 'bx-message-detail' },
  ]

  baseTabs.push({ value: 'history', title: 'History', icon: 'bx-history' })

  return baseTabs
})

// Fetch queue item
const fetchItem = async () => {
  loading.value = true
  error.value = null

  const id = route.params.id
  const result = await queueStore.fetchQueueItem(id)

  if (result) {
    item.value = result
    // Always fetch messages for WhatsApp communication
    const msgResult = await queueStore.fetchMessages(id)
    messages.value = msgResult.messages || []
  } else {
    error.value = 'Failed to load queue item'
  }

  loading.value = false
}

// Assign to self
const assignToSelf = async () => {
  const result = await queueStore.assignItem(route.params.id)
  if (result.success) {
    item.value = result.item
    showAssignDialog.value = false
  } else {
    alert(result.error || 'Failed to assign item')
  }
}

// Send message
const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  sendingMessage.value = true
  const result = await queueStore.sendMessage(route.params.id, newMessage.value.trim())

  if (result.success) {
    newMessage.value = ''
    // Refresh messages
    const msgResult = await queueStore.fetchMessages(route.params.id)
    messages.value = msgResult.messages || []
    // Scroll to bottom
    await nextTick()
    scrollToBottom()
  } else {
    alert(result.error || 'Failed to send message')
  }

  sendingMessage.value = false
}

// Complete item
const completeItem = async () => {
  const result = await queueStore.completeItem(route.params.id, resolutionNotes.value)
  if (result.success) {
    item.value = result.item
    showCompleteDialog.value = false
    resolutionNotes.value = ''
  } else {
    alert(result.error || 'Failed to complete item')
  }
}

// Escalate item
const escalateItem = async () => {
  if (!escalationReason.value.trim()) {
    alert('Please provide a reason for escalation')
    return
  }

  const result = await queueStore.escalateItem(route.params.id, escalationReason.value.trim())
  if (result.success) {
    item.value = result.item
    showEscalateDialog.value = false
    escalationReason.value = ''
  } else {
    alert(result.error || 'Failed to escalate item')
  }
}

// Scroll chat to bottom
const scrollToBottom = () => {
  const chatContainer = document.querySelector('.chat-messages')
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight
  }
}

// Get priority color
const getPriorityColor = (priority) => {
  const colors = {
    URGENT: 'error',
    HIGH: 'warning',
    NORMAL: 'info',
    LOW: 'default',
  }
  return colors[priority] || 'default'
}

// Get status color
const getStatusColor = (status) => {
  const colors = {
    PENDING: 'warning',
    IN_PROGRESS: 'info',
    COMPLETED: 'success',
    ESCALATED: 'error',
    REJECTED: 'error',
    EXPIRED: 'default',
  }
  return colors[status] || 'default'
}

// Get queue type label
const getQueueTypeLabel = (type) => {
  const labels = {
    OCR_REVIEW: 'OCR Review Required',
    MANUAL_ENTRY: 'Manual Entry Required',
    CONTROLLED_SUBSTANCE: 'Controlled Substance',
    VERIFICATION_FAILED: 'Verification Failed',
    PHARMACIST_ESCALATION: 'Patient Chat Escalation',
    CLARIFICATION_RESPONSE: 'Clarification Response',
  }
  return labels[type] || type
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format time for chat
const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Get patient name
const getPatientName = computed(() => {
  if (item.value?.patient_id?.profile) {
    return `${item.value.patient_id.profile.first_name || ''} ${item.value.patient_id.profile.last_name || ''}`.trim()
  }
  return item.value?.whatsapp_number || 'Unknown Patient'
})

// Get SLA status
const slaStatus = computed(() => {
  if (!item.value?.sla_deadline) return { text: '-', color: 'default', breached: false }

  const now = new Date()
  const slaDate = new Date(item.value.sla_deadline)
  const diffMinutes = Math.round((slaDate - now) / 60000)

  if (diffMinutes < 0) {
    return { text: 'SLA Breached', color: 'error', breached: true }
  } else if (diffMinutes < 15) {
    return { text: `${diffMinutes} minutes remaining`, color: 'error', breached: false }
  } else if (diffMinutes < 60) {
    return { text: `${diffMinutes} minutes remaining`, color: 'warning', breached: false }
  } else {
    const hours = Math.floor(diffMinutes / 60)
    const mins = diffMinutes % 60
    return { text: `${hours}h ${mins}m remaining`, color: 'success', breached: false }
  }
})

// Can edit (only if assigned to current user and in progress)
const canEdit = computed(() => {
  return item.value?.status === 'IN_PROGRESS' && item.value?.assigned_to
})

// Watch route changes
watch(() => route.params.id, () => {
  if (route.params.id) {
    fetchItem()
  }
})

// On mounted
onMounted(() => {
  fetchItem()
})
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16">
      <VProgressCircular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading queue item...</p>
    </div>

    <!-- Error State -->
    <VAlert v-else-if="error" type="error" class="mb-4">
      {{ error }}
      <template #append>
        <VBtn variant="text" @click="fetchItem">Retry</VBtn>
      </template>
    </VAlert>

    <!-- Main Content -->
    <template v-else-if="item">
      <!-- Header -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div class="d-flex align-center">
          <VBtn
            icon
            variant="text"
            class="me-2"
            @click="router.push('/pharmacy/whatsapp-queue')"
          >
            <VIcon icon="bx-arrow-back" />
          </VBtn>
          <div>
            <h4 class="text-h4 font-weight-bold mb-1">{{ getPatientName }}</h4>
            <div class="d-flex align-center gap-2">
              <VChip size="small" :color="getStatusColor(item.status)">
                {{ item.status }}
              </VChip>
              <VChip size="small" :color="getPriorityColor(item.priority)">
                {{ item.priority }}
              </VChip>
              <VChip size="small" variant="tonal" :color="slaStatus.color">
                <VIcon icon="bx-timer" size="14" class="me-1" />
                {{ slaStatus.text }}
              </VChip>
            </div>
          </div>
        </div>

        <div class="d-flex gap-2">
          <!-- Assign Button (if pending and not assigned) -->
          <VBtn
            v-if="item.status === 'PENDING'"
            color="primary"
            @click="showAssignDialog = true"
          >
            <VIcon icon="bx-user-plus" class="me-1" />
            Assign to Me
          </VBtn>

          <!-- Claim Escalated Button (for back office to pick up escalated items) -->
          <VBtn
            v-if="item.status === 'ESCALATED'"
            color="primary"
            @click="showAssignDialog = true"
          >
            <VIcon icon="bx-user-plus" class="me-1" />
            Claim Escalated Item
          </VBtn>

          <!-- Escalate Button -->
          <VBtn
            v-if="canEdit"
            color="warning"
            variant="tonal"
            @click="showEscalateDialog = true"
          >
            <VIcon icon="bx-up-arrow-alt" class="me-1" />
            Escalate
          </VBtn>

          <!-- Complete Button -->
          <VBtn
            v-if="canEdit"
            color="success"
            @click="showCompleteDialog = true"
          >
            <VIcon icon="bx-check" class="me-1" />
            Complete
          </VBtn>
        </div>
      </div>

      <!-- Main Grid -->
      <VRow>
        <!-- Left Side - Main Content -->
        <VCol cols="12" md="8">
          <VCard>
            <VTabs v-model="activeTab">
              <VTab
                v-for="tab in tabs"
                :key="tab.value"
                :value="tab.value"
              >
                <VIcon :icon="tab.icon" class="me-2" />
                {{ tab.title }}
              </VTab>
            </VTabs>

            <VDivider />

            <VCardText>
              <!-- Details Tab -->
              <div v-show="activeTab === 'details'">
                  <VList>
                    <VListItem>
                      <template #prepend>
                        <VIcon icon="bx-file" color="primary" />
                      </template>
                      <VListItemTitle>Queue Type</VListItemTitle>
                      <VListItemSubtitle>{{ getQueueTypeLabel(item.queue_type) }}</VListItemSubtitle>
                    </VListItem>

                    <VListItem>
                      <template #prepend>
                        <VIcon icon="bx-info-circle" color="primary" />
                      </template>
                      <VListItemTitle>Reason</VListItemTitle>
                      <VListItemSubtitle>{{ item.queue_reason || item.escalation_reason || '-' }}</VListItemSubtitle>
                    </VListItem>

                    <VListItem>
                      <template #prepend>
                        <VIcon icon="bx-calendar" color="primary" />
                      </template>
                      <VListItemTitle>Created</VListItemTitle>
                      <VListItemSubtitle>{{ formatDate(item.created_at) }}</VListItemSubtitle>
                    </VListItem>

                    <VListItem v-if="item.assigned_to">
                      <template #prepend>
                        <VIcon icon="bx-user" color="primary" />
                      </template>
                      <VListItemTitle>Assigned To</VListItemTitle>
                      <VListItemSubtitle>
                        {{ item.assigned_to?.profile?.first_name }} {{ item.assigned_to?.profile?.last_name }}
                        <span class="text-medium-emphasis"> at {{ formatDate(item.assigned_at) }}</span>
                      </VListItemSubtitle>
                    </VListItem>

                    <VListItem v-if="item.completed_at">
                      <template #prepend>
                        <VIcon icon="bx-check-circle" color="success" />
                      </template>
                      <VListItemTitle>Completed</VListItemTitle>
                      <VListItemSubtitle>{{ formatDate(item.completed_at) }}</VListItemSubtitle>
                    </VListItem>

                    <VListItem v-if="item.resolution_notes">
                      <template #prepend>
                        <VIcon icon="bx-note" color="primary" />
                      </template>
                      <VListItemTitle>Resolution Notes</VListItemTitle>
                      <VListItemSubtitle>{{ item.resolution_notes }}</VListItemSubtitle>
                    </VListItem>
                  </VList>

                  <!-- Prescription Image -->
                  <div v-if="item.image_s3_url" class="mt-4">
                    <h6 class="text-h6 mb-3">Prescription Image</h6>
                    <VImg
                      :src="item.image_s3_url"
                      max-height="400"
                      contain
                      class="rounded border"
                    />
                  </div>
              </div>

              <!-- OCR Data Tab -->
              <div v-show="activeTab === 'ocr'">
                  <template v-if="item.ocr_data">
                    <VAlert v-if="item.ocr_data.overall_confidence" type="info" variant="tonal" class="mb-4">
                      <VAlertTitle>OCR Confidence: {{ Math.round(item.ocr_data.overall_confidence * 100) }}%</VAlertTitle>
                      <p class="mb-0">Provider: {{ item.ocr_data.ocr_provider || 'Unknown' }}</p>
                    </VAlert>

                    <!-- Extracted Fields -->
                    <div v-if="item.ocr_data.extracted_fields" class="mb-4">
                      <h6 class="text-h6 mb-3">Extracted Fields</h6>
                      <VTable density="compact">
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Value</th>
                            <th>Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(field, key) in item.ocr_data.extracted_fields" :key="key">
                            <td class="font-weight-medium">{{ key }}</td>
                            <td>{{ field.value || '-' }}</td>
                            <td>
                              <VChip
                                size="x-small"
                                :color="field.confidence > 0.8 ? 'success' : field.confidence > 0.6 ? 'warning' : 'error'"
                              >
                                {{ Math.round((field.confidence || 0) * 100) }}%
                              </VChip>
                            </td>
                          </tr>
                        </tbody>
                      </VTable>
                    </div>

                    <!-- Low Confidence Fields -->
                    <VAlert
                      v-if="item.ocr_data.low_confidence_fields?.length"
                      type="warning"
                      variant="tonal"
                      class="mb-4"
                    >
                      <VAlertTitle>Low Confidence Fields</VAlertTitle>
                      <p class="mb-0">
                        The following fields need review:
                        <strong>{{ item.ocr_data.low_confidence_fields.join(', ') }}</strong>
                      </p>
                    </VAlert>

                    <!-- Raw Text -->
                    <div v-if="item.ocr_data.raw_text" class="mb-4">
                      <h6 class="text-h6 mb-3">Raw OCR Text</h6>
                      <VCard variant="outlined">
                        <VCardText>
                          <pre class="text-body-2" style="white-space: pre-wrap;">{{ item.ocr_data.raw_text }}</pre>
                        </VCardText>
                      </VCard>
                    </div>
                  </template>

                  <VAlert v-else type="info" variant="tonal">
                    No OCR data available for this queue item.
                  </VAlert>
              </div>

              <!-- WhatsApp Messages Tab -->
              <div v-show="activeTab === 'messages'">
                  <div class="chat-container">
                    <!-- Messages List -->
                    <div class="chat-messages" style="height: 400px; overflow-y: auto;">
                      <template v-if="messages.length === 0">
                        <div class="text-center py-8 text-medium-emphasis">
                          <VIcon icon="bx-message-detail" size="48" class="mb-2" />
                          <p>No WhatsApp messages yet</p>
                          <p class="text-caption">Send a message to the patient using the form below</p>
                        </div>
                      </template>

                      <template v-else>
                        <div
                          v-for="(msg, index) in messages"
                          :key="index"
                          class="mb-3"
                          :class="msg.from === 'pharmacist' ? 'text-right' : ''"
                        >
                          <div
                            class="d-inline-block pa-3 rounded-lg"
                            :class="{
                              'bg-primary text-white': msg.from === 'pharmacist',
                              'bg-grey-lighten-3': msg.from === 'patient',
                              'bg-warning-lighten-4': msg.from === 'system',
                            }"
                            style="max-width: 80%;"
                          >
                            <div class="text-caption mb-1" :class="msg.from === 'pharmacist' ? '' : 'text-medium-emphasis'">
                              {{ msg.from === 'pharmacist' ? 'Pharmacist' : msg.from === 'patient' ? 'Patient' : 'System' }}
                              <span class="ms-2">{{ formatTime(msg.timestamp) }}</span>
                              <VIcon v-if="msg.whatsapp_sent" icon="bx-check-double" size="14" class="ms-1" color="success" title="Delivered via WhatsApp" />
                            </div>
                            <div>{{ msg.message }}</div>
                            <VImg
                              v-if="msg.media_url"
                              :src="msg.media_url"
                              max-width="200"
                              class="mt-2 rounded"
                            />
                          </div>
                        </div>
                      </template>
                    </div>

                    <!-- Message Input -->
                    <VDivider class="my-3" />
                    <div v-if="canEdit" class="d-flex gap-2">
                      <VTextField
                        v-model="newMessage"
                        placeholder="Type a WhatsApp message to patient..."
                        density="compact"
                        variant="outlined"
                        hide-details
                        @keyup.enter="sendMessage"
                      />
                      <VBtn
                        color="success"
                        :loading="sendingMessage"
                        :disabled="!newMessage.trim()"
                        @click="sendMessage"
                      >
                        <VIcon icon="bx-send" class="me-1" />
                        Send
                      </VBtn>
                    </div>
                    <VAlert v-else type="info" variant="tonal" class="mt-2">
                      {{ item.status === 'COMPLETED' ? 'This item has been completed.' : 'Assign this item to yourself to send WhatsApp messages.' }}
                    </VAlert>
                  </div>
              </div>

              <!-- History Tab -->
              <div v-show="activeTab === 'history'">
                  <VTimeline density="compact" align="start">
                    <VTimelineItem
                      dot-color="primary"
                      size="small"
                    >
                      <div class="d-flex justify-space-between">
                        <strong>Queue Item Created</strong>
                        <span class="text-medium-emphasis text-body-2">{{ formatDate(item.created_at) }}</span>
                      </div>
                      <p class="text-body-2 mb-0">{{ item.queue_reason || 'Added to queue' }}</p>
                    </VTimelineItem>

                    <VTimelineItem
                      v-if="item.assigned_at"
                      dot-color="info"
                      size="small"
                    >
                      <div class="d-flex justify-space-between">
                        <strong>Assigned to Pharmacist</strong>
                        <span class="text-medium-emphasis text-body-2">{{ formatDate(item.assigned_at) }}</span>
                      </div>
                    </VTimelineItem>

                    <VTimelineItem
                      v-for="(escalation, index) in (item.escalation_history || [])"
                      :key="index"
                      dot-color="warning"
                      size="small"
                    >
                      <div class="d-flex justify-space-between">
                        <strong>Escalated</strong>
                        <span class="text-medium-emphasis text-body-2">{{ formatDate(escalation.escalated_at) }}</span>
                      </div>
                      <p class="text-body-2 mb-0">{{ escalation.reason }}</p>
                    </VTimelineItem>

                    <VTimelineItem
                      v-if="item.completed_at"
                      dot-color="success"
                      size="small"
                    >
                      <div class="d-flex justify-space-between">
                        <strong>Completed</strong>
                        <span class="text-medium-emphasis text-body-2">{{ formatDate(item.completed_at) }}</span>
                      </div>
                      <p v-if="item.resolution_notes" class="text-body-2 mb-0">{{ item.resolution_notes }}</p>
                    </VTimelineItem>
                  </VTimeline>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Right Side - Patient Info -->
        <VCol cols="12" md="4">
          <VCard class="mb-4">
            <VCardText class="text-center pt-8">
              <VAvatar size="80" color="primary" variant="tonal">
                <VIcon icon="bx-user" size="40" />
              </VAvatar>
              <h5 class="text-h5 mt-4 mb-1">{{ getPatientName }}</h5>
              <p class="text-body-2 text-medium-emphasis mb-4">{{ item.whatsapp_number }}</p>

              <VBtn
                v-if="item.patient_id?._id"
                variant="tonal"
                color="primary"
                block
                :to="`/patients/${item.patient_id._id}`"
              >
                <VIcon icon="bx-user" class="me-2" />
                View Patient Profile
              </VBtn>
            </VCardText>
          </VCard>

          <!-- Quick Info Card -->
          <VCard>
            <VCardTitle>Quick Info</VCardTitle>
            <VCardText>
              <VList density="compact">
                <VListItem>
                  <template #prepend>
                    <VIcon icon="bx-phone" size="20" />
                  </template>
                  <VListItemTitle>WhatsApp</VListItemTitle>
                  <VListItemSubtitle>{{ item.whatsapp_number }}</VListItemSubtitle>
                </VListItem>

                <VListItem v-if="item.prescription_upload_id">
                  <template #prepend>
                    <VIcon icon="bx-file" size="20" />
                  </template>
                  <VListItemTitle>Prescription</VListItemTitle>
                  <VListItemSubtitle>
                    <RouterLink :to="`/pharmacy/prescriptions/${item.prescription_upload_id}`">
                      View Prescription
                    </RouterLink>
                  </VListItemSubtitle>
                </VListItem>

                <VListItem>
                  <template #prepend>
                    <VIcon icon="bx-timer" size="20" />
                  </template>
                  <VListItemTitle>SLA Deadline</VListItemTitle>
                  <VListItemSubtitle>{{ formatDate(item.sla_deadline) }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <!-- Assign Dialog -->
    <VDialog v-model="showAssignDialog" max-width="400">
      <VCard>
        <VCardTitle>{{ item?.status === 'ESCALATED' ? 'Claim Escalated Item' : 'Assign to Yourself' }}</VCardTitle>
        <VCardText>
          <template v-if="item?.status === 'ESCALATED'">
            <p>This item was escalated and needs attention. By claiming it, you will:</p>
            <ul class="mb-3">
              <li>Take ownership of resolving this escalation</li>
              <li>Be able to send WhatsApp messages to the patient</li>
              <li>Complete or further escalate if needed</li>
            </ul>
          </template>
          <template v-else>
            Are you sure you want to assign this queue item to yourself? You will be responsible for resolving it.
          </template>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showAssignDialog = false">Cancel</VBtn>
          <VBtn color="primary" @click="assignToSelf">
            {{ item?.status === 'ESCALATED' ? 'Claim Item' : 'Assign to Me' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Complete Dialog -->
    <VDialog v-model="showCompleteDialog" max-width="500">
      <VCard>
        <VCardTitle>Complete Queue Item</VCardTitle>
        <VCardText>
          <VTextarea
            v-model="resolutionNotes"
            label="Resolution Notes (optional)"
            placeholder="Describe how this was resolved. This will be sent to the patient via WhatsApp."
            rows="4"
            maxlength="500"
            counter
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showCompleteDialog = false">Cancel</VBtn>
          <VBtn color="success" @click="completeItem">Complete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Escalate Dialog -->
    <VDialog v-model="showEscalateDialog" max-width="500">
      <VCard>
        <VCardTitle>Escalate Queue Item</VCardTitle>
        <VCardText>
          <VTextarea
            v-model="escalationReason"
            label="Reason for Escalation"
            placeholder="Why does this need to be escalated? This will be sent to the patient via WhatsApp."
            rows="4"
            maxlength="500"
            counter
            :rules="[v => !!v || 'Reason is required']"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showEscalateDialog = false">Cancel</VBtn>
          <VBtn color="warning" @click="escalateItem">Escalate</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.chat-messages {
  padding: 16px;
}

.chat-container {
  min-height: 500px;
}
</style>
