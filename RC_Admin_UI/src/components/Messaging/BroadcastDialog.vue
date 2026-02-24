<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useMessagingStore } from '@/stores/messaging'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'sent'])
const messagingStore = useMessagingStore()

const dialogVisible = ref(props.modelValue)
watch(() => props.modelValue, (val) => { dialogVisible.value = val })
watch(dialogVisible, (val) => { emit('update:modelValue', val) })

const recipientMode = ref('type')
const recipientType = ref('Patient')
const content = ref('')
const sending = ref(false)
const showConfirm = ref(false)
const result = ref(null)

// Broadcast progress tracking
const broadcastId = ref(null)
const broadcastStatus = ref(null)
const pollTimer = ref(null)

// File attachment
const fileInput = ref(null)
const pendingFile = ref(null)
const previewUrl = ref(null)
const thumbnailBlob = ref(null)

// For search-based selection
const searchQuery = ref('')
const selectedUsers = ref([])
let searchTimeout = null

const recipientTypeOptions = [
  { title: 'All Patients', value: 'Patient' },
  { title: 'All Specialists', value: 'Specialist' },
  { title: 'All Users', value: 'all' },
]

const canSend = computed(() => {
  const hasContent = content.value.trim().length > 0
  const hasFile = !!pendingFile.value
  if (!hasContent && !hasFile) return false
  if (recipientMode.value === 'search') {
    return selectedUsers.value.length > 0
  }
  return true
})

const recipientSummary = computed(() => {
  if (recipientMode.value === 'search') {
    return `${selectedUsers.value.length} selected user(s)`
  }
  const labels = { Patient: 'all patients', Specialist: 'all specialists', all: 'all users' }
  return labels[recipientType.value] || recipientType.value
})

const progressPercent = computed(() => {
  const b = messagingStore.activeBroadcast
  if (!b || !b.total_recipients) return 0
  return Math.round(((b.sent_count + b.failed_count) / b.total_recipients) * 100)
})

const isPendingImage = computed(() => pendingFile.value?.type?.startsWith('image/'))
const isPendingVideo = computed(() => pendingFile.value?.type?.startsWith('video/'))
const isPendingPdf = computed(() => pendingFile.value?.type === 'application/pdf')

const getFileType = (file) => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'voice_note'
  return 'file'
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const onSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    messagingStore.searchUsers(searchQuery.value)
  }, 300)
}

const toggleUser = (user) => {
  const id = user._id || user.id
  const idx = selectedUsers.value.findIndex((u) => (u._id || u.id) === id)
  if (idx !== -1) {
    selectedUsers.value.splice(idx, 1)
  } else {
    selectedUsers.value.push(user)
  }
}

const isSelected = (user) => {
  const id = user._id || user.id
  return selectedUsers.value.some((u) => (u._id || u.id) === id)
}

const getUserName = (user) => {
  if (user.profile?.first_name) {
    return `${user.profile.first_name} ${user.profile.last_name || ''}`.trim()
  }
  return user.name || user.email || 'Unknown'
}

const getRoleColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'patient': return 'primary'
    case 'specialist': return 'success'
    default: return 'default'
  }
}

// File handling
const onFileSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  pendingFile.value = file
  thumbnailBlob.value = null
  if (fileInput.value) fileInput.value.value = ''

  if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'application/pdf') {
    previewUrl.value = URL.createObjectURL(file)
  } else {
    previewUrl.value = null
  }

  if (file.type.startsWith('video/')) {
    generateVideoThumbnail(file)
  }
  if (file.type === 'application/pdf') {
    generatePdfThumbnail(file)
  }
}

const generateVideoThumbnail = (file) => {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  video.playsInline = true
  video.src = url

  video.addEventListener('loadeddata', () => { video.currentTime = 0.5 })
  video.addEventListener('seeked', () => {
    try {
      const canvas = document.createElement('canvas')
      const scale = Math.min(400 / video.videoWidth, 1)
      canvas.width = video.videoWidth * scale
      canvas.height = video.videoHeight * scale
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      previewUrl.value = canvas.toDataURL('image/jpeg', 0.7)
      canvas.toBlob((blob) => { thumbnailBlob.value = blob }, 'image/jpeg', 0.7)
    } catch (e) {
      console.warn('Video thumbnail failed:', e)
    }
    URL.revokeObjectURL(url)
  })
}

const generatePdfThumbnail = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    const scale = Math.min(400 / viewport.width, 1)
    const scaledViewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: scaledViewport }).promise

    previewUrl.value = canvas.toDataURL('image/jpeg', 0.8)
    canvas.toBlob((blob) => { thumbnailBlob.value = blob }, 'image/jpeg', 0.8)
    pdf.destroy()
  } catch (e) {
    console.warn('PDF thumbnail failed:', e)
  }
}

const clearPendingFile = () => {
  pendingFile.value = null
  previewUrl.value = null
  thumbnailBlob.value = null
}

const confirmSend = () => {
  showConfirm.value = true
}

// ---------- Broadcast with progress tracking ----------

const startPolling = (id) => {
  pollTimer.value = setInterval(async () => {
    const status = await messagingStore.pollBroadcastStatus(id)
    if (!status) return

    broadcastStatus.value = status.status

    if (['completed', 'failed', 'cancelled'].includes(status.status)) {
      clearInterval(pollTimer.value)
      pollTimer.value = null
      sending.value = false
      result.value = {
        total_recipients: status.total_recipients,
        total_sent: status.sent_count,
        total_failed: status.failed_count,
        status: status.status,
      }
      emit('sent', result.value)
    }
  }, 2000)
}

const sendBroadcast = async () => {
  sending.value = true
  showConfirm.value = false
  try {
    const payload = { content: content.value.trim() }

    if (recipientMode.value === 'search') {
      payload.recipient_ids = selectedUsers.value.map((u) => u._id || u.id)
    } else {
      payload.recipient_type = recipientType.value
    }

    const res = await messagingStore.broadcast(
      payload,
      pendingFile.value || null,
      thumbnailBlob.value || null,
      pendingFile.value ? getFileType(pendingFile.value) : null,
    )

    // Response now has { broadcast_id, total_recipients, status }
    broadcastId.value = res.broadcast_id
    broadcastStatus.value = 'pending'

    // Start polling for progress
    startPolling(res.broadcast_id)
  } catch (error) {
    console.error('Broadcast failed:', error)
    result.value = { error: error.message || 'Failed to start broadcast' }
    sending.value = false
  }
}

const cancelBroadcast = async () => {
  if (!broadcastId.value) return
  try {
    await messagingStore.cancelBroadcast(broadcastId.value)
    broadcastStatus.value = 'cancelled'
  } catch (error) {
    console.error('Failed to cancel broadcast:', error)
  }
}

const close = () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
  messagingStore.stopBroadcastPolling()
  dialogVisible.value = false
  content.value = ''
  selectedUsers.value = []
  searchQuery.value = ''
  result.value = null
  showConfirm.value = false
  broadcastId.value = null
  broadcastStatus.value = null
  sending.value = false
  clearPendingFile()
}

onBeforeUnmount(() => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
})
</script>

<template>
  <VDialog v-model="dialogVisible" max-width="600" scrollable persistent>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center gap-2">
          <VIcon icon="bx-broadcast" color="primary" />
          <span>Broadcast Message</span>
        </div>
        <VBtn icon variant="text" size="small" @click="close" :disabled="sending && !broadcastId">
          <VIcon icon="bx-x" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <!-- State 1: Form (no broadcast started, no result) -->
      <VCardText v-if="!result && !broadcastId">
        <!-- Recipient mode -->
        <div class="mb-4">
          <div class="text-subtitle-2 mb-2">Recipients</div>
          <VBtnToggle v-model="recipientMode" mandatory density="compact" variant="outlined" class="mb-3">
            <VBtn value="type">By User Type</VBtn>
            <VBtn value="search">Select Users</VBtn>
          </VBtnToggle>

          <!-- By type -->
          <VSelect
            v-if="recipientMode === 'type'"
            v-model="recipientType"
            :items="recipientTypeOptions"
            variant="outlined"
            density="compact"
          />

          <!-- By search -->
          <div v-else>
            <VTextField
              v-model="searchQuery"
              label="Search users"
              variant="outlined"
              density="compact"
              prepend-inner-icon="bx-search"
              clearable
              @input="onSearch"
              @click:clear="searchQuery = ''; messagingStore.searchResults = []"
            />

            <!-- Selected chips -->
            <div v-if="selectedUsers.length" class="d-flex flex-wrap gap-1 mb-2">
              <VChip
                v-for="u in selectedUsers"
                :key="u._id || u.id"
                size="small"
                closable
                @click:close="toggleUser(u)"
              >
                {{ getUserName(u) }}
              </VChip>
            </div>

            <!-- Search results -->
            <VList v-if="messagingStore.searchResults.length > 0" density="compact" max-height="200" style="overflow-y: auto;">
              <VListItem
                v-for="user in messagingStore.searchResults"
                :key="user._id || user.id"
                @click="toggleUser(user)"
              >
                <template #prepend>
                  <VCheckbox :model-value="isSelected(user)" hide-details density="compact" />
                </template>
                <VListItemTitle>
                  {{ getUserName(user) }}
                  <VChip :color="getRoleColor(user.user_type)" size="x-small" variant="tonal" class="ml-1">
                    {{ user.user_type }}
                  </VChip>
                </VListItemTitle>
              </VListItem>
            </VList>
          </div>
        </div>

        <!-- Message -->
        <div class="mb-4">
          <div class="text-subtitle-2 mb-2">Message</div>
          <VTextarea
            v-model="content"
            variant="outlined"
            density="compact"
            rows="4"
            :placeholder="pendingFile ? 'Add a caption (optional)...' : 'Type your broadcast message...'"
            counter
          />
        </div>

        <!-- Attachment -->
        <div class="mb-4">
          <div class="text-subtitle-2 mb-2">Attachment (optional)</div>

          <!-- File preview -->
          <div v-if="pendingFile" class="d-flex gap-3 align-start pa-3 rounded border mb-2">
            <!-- Visual preview -->
            <div class="preview-thumb-wrap">
              <img v-if="isPendingImage && previewUrl" :src="previewUrl" class="preview-thumb rounded" />
              <div v-else-if="(isPendingVideo || isPendingPdf) && previewUrl" class="preview-thumb-container">
                <img :src="previewUrl" class="preview-thumb rounded" />
                <div v-if="isPendingVideo" class="preview-play-badge">
                  <VIcon icon="bx-play" size="18" color="white" />
                </div>
                <div v-if="isPendingPdf" class="preview-pdf-badge">PDF</div>
              </div>
              <div v-else class="preview-icon-box rounded d-flex align-center justify-center">
                <VIcon :icon="getFileType(pendingFile) === 'voice_note' ? 'bx-microphone' : 'bx-file'" size="24" color="primary" />
              </div>
            </div>
            <!-- File info -->
            <div class="flex-grow-1">
              <div class="text-body-2 font-weight-medium text-truncate">{{ pendingFile.name }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ formatFileSize(pendingFile.size) }}
                <VChip size="x-small" variant="tonal" class="ml-1">{{ getFileType(pendingFile).replace('_', ' ') }}</VChip>
              </div>
            </div>
            <VBtn icon size="x-small" variant="text" @click="clearPendingFile">
              <VIcon icon="bx-x" size="18" />
            </VBtn>
          </div>

          <!-- File select button -->
          <div v-if="!pendingFile">
            <input
              ref="fileInput"
              type="file"
              hidden
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              @change="onFileSelect"
            />
            <VBtn
              variant="outlined"
              density="compact"
              prepend-icon="bx-paperclip"
              @click="fileInput?.click()"
            >
              Attach File
            </VBtn>
          </div>
        </div>

        <!-- Summary -->
        <VAlert v-if="canSend" type="info" variant="tonal" density="compact">
          <span>Will send {{ pendingFile ? `"${pendingFile.name}"` : 'message' }} to {{ recipientSummary }}</span>
          <div v-if="pendingFile && recipientMode === 'type'" class="text-caption mt-1">
            Sending attachments to many users may take longer.
          </div>
        </VAlert>
      </VCardText>

      <!-- State 2: Progress (broadcast started, no result yet) -->
      <VCardText v-else-if="broadcastId && !result">
        <div class="text-center py-6">
          <VIcon icon="bx-broadcast" size="48" color="primary" class="mb-3" />
          <div class="text-h6 mb-2">
            {{ broadcastStatus === 'pending' ? 'Starting broadcast...' : 'Broadcasting...' }}
          </div>

          <!-- Progress bar -->
          <VProgressLinear
            :model-value="progressPercent"
            color="primary"
            height="24"
            rounded
            class="mb-3"
          >
            <template #default>
              <span class="text-caption font-weight-bold">
                {{ messagingStore.activeBroadcast?.sent_count || 0 }} / {{ messagingStore.activeBroadcast?.total_recipients || '?' }}
              </span>
            </template>
          </VProgressLinear>

          <!-- Batch progress -->
          <div class="text-body-2 text-medium-emphasis mb-2">
            Batch {{ messagingStore.activeBroadcast?.current_batch || 0 }}
            of {{ messagingStore.activeBroadcast?.total_batches || '?' }}
          </div>

          <!-- Failure count -->
          <div v-if="messagingStore.activeBroadcast?.failed_count > 0" class="text-body-2 text-error mb-2">
            {{ messagingStore.activeBroadcast.failed_count }} failed
          </div>

          <!-- Cancel button -->
          <VBtn
            v-if="broadcastStatus === 'processing' || broadcastStatus === 'pending'"
            variant="outlined"
            color="error"
            class="mt-4"
            @click="cancelBroadcast"
          >
            Cancel Broadcast
          </VBtn>
        </div>
      </VCardText>

      <!-- State 3: Result -->
      <VCardText v-else>
        <VAlert v-if="result.error" type="error" variant="tonal">
          {{ result.error }}
        </VAlert>
        <VAlert v-else-if="result.status === 'cancelled'" type="warning" variant="tonal">
          <div class="font-weight-medium mb-2">Broadcast cancelled</div>
          <div>Messages sent before cancellation: {{ result.total_sent || 0 }}</div>
          <div>Total recipients: {{ result.total_recipients }}</div>
          <div v-if="result.total_failed > 0" class="text-error">
            Failed: {{ result.total_failed }}
          </div>
        </VAlert>
        <VAlert v-else-if="result.status === 'failed'" type="error" variant="tonal">
          <div class="font-weight-medium mb-2">Broadcast failed</div>
          <div>Total recipients: {{ result.total_recipients }}</div>
          <div>Messages sent: {{ result.total_sent || 0 }}</div>
          <div>Failed: {{ result.total_failed || 0 }}</div>
        </VAlert>
        <VAlert v-else type="success" variant="tonal">
          <div class="font-weight-medium mb-2">Broadcast completed!</div>
          <div>Total recipients: {{ result.total_recipients }}</div>
          <div>Messages sent: {{ result.total_sent || 0 }}</div>
          <div v-if="result.total_failed > 0" class="text-error">
            Failed: {{ result.total_failed }}
          </div>
        </VAlert>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-3">
        <VSpacer />
        <VBtn variant="outlined" @click="close" :disabled="sending && !broadcastId">
          {{ result ? 'Close' : broadcastId ? 'Close' : 'Cancel' }}
        </VBtn>
        <VBtn
          v-if="!result && !broadcastId"
          color="primary"
          :loading="sending"
          :disabled="!canSend"
          @click="confirmSend"
        >
          Send Broadcast
        </VBtn>
      </VCardActions>
    </VCard>

    <!-- Confirmation dialog -->
    <VDialog v-model="showConfirm" max-width="400">
      <VCard>
        <VCardTitle>Confirm Broadcast</VCardTitle>
        <VCardText>
          Are you sure you want to send this {{ pendingFile ? 'attachment' : 'message' }} to <strong>{{ recipientSummary }}</strong>?
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showConfirm = false">Cancel</VBtn>
          <VBtn color="primary" @click="sendBroadcast">Send</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VDialog>
</template>

<style scoped>
.preview-thumb-wrap {
  flex-shrink: 0;
}

.preview-thumb {
  max-width: 100px;
  max-height: 80px;
  object-fit: cover;
  display: block;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.preview-thumb-container {
  position: relative;
  display: inline-block;
}

.preview-play-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-pdf-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  background: #d32f2f;
  color: white;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
}

.preview-icon-box {
  width: 56px;
  height: 56px;
  background: rgba(var(--v-theme-primary), 0.08);
}
</style>
