<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import axios from '@axios'
import { useMessagingStore } from '@/stores/messaging'
import UserRestrictionDialog from './UserRestrictionDialog.vue'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

const props = defineProps({
  conversation: { type: Object, required: true },
})

const emit = defineEmits(['close'])
const messagingStore = useMessagingStore()

// State
const messages = ref([])
const loading = ref(false)
const hasMore = ref(true)
const oldestCursor = ref(null)
const exporting = ref(false)
const imageErrors = ref({})
const newMessage = ref('')
const sending = ref(false)
const replyingTo = ref(null)
const messagesContainer = ref(null)
const fileInput = ref(null)
const pendingFile = ref(null)
const previewUrl = ref(null)
const thumbnailBlob = ref(null)
const uploadProgress = ref(false)
let typingTimeout = null
const showRestrictionDialog = ref(false)
const restrictionTarget = ref([])
const participantRestrictions = ref({})
const liftingRestriction = ref(null)

// Computed
const participants = computed(() => {
  return props.conversation.participants?.map((p) => {
    const u = p.user
    const name = u?.profile?.first_name
      ? `${u.profile.first_name} ${u.profile.last_name || ''}`.trim()
      : u?.email || 'Unknown'
    return { name, role: p.role, id: u?._id }
  }) || []
})

const participantLabel = computed(() => {
  return participants.value.map((p) => p.name).join(' & ')
})

const isParticipant = computed(() => {
  const myId = messagingStore.messagingUserId
  if (!myId) return false
  return props.conversation.participants?.some(
    (p) => (p.user?._id || p.user) === myId,
  )
})

const typingDisplay = computed(() => {
  const typers = messagingStore.getTypingUsers(props.conversation._id)
  if (!typers.length) return ''
  // Find names from participants
  const names = typers.map((uid) => {
    const p = participants.value.find((pp) => pp.id === uid)
    return p?.name || 'Someone'
  })
  if (names.length === 1) return `${names[0]} is typing...`
  return `${names.join(' and ')} are typing...`
})

// Use store messages when participant (real-time), admin API otherwise
const displayMessages = computed(() => {
  if (isParticipant.value && messagingStore.activeConversationId === props.conversation._id) {
    return messagingStore.messages
  }
  return messages.value
})

// Methods
const fetchMessages = async (loadMore = false) => {
  if (isParticipant.value) {
    // Use patient API via store
    await messagingStore.fetchMessages(props.conversation._id, loadMore)
    if (!loadMore) {
      await messagingStore.markAsRead(props.conversation._id)
    }
    await nextTick()
    scrollToBottom()
    return
  }

  // Use admin API (oversight mode)
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('limit', '50')
    if (loadMore && oldestCursor.value) {
      params.append('before', oldestCursor.value)
    }

    const { data } = await axios.get(
      `${apiBaseUrl}/messaging/conversations/${props.conversation._id}/messages?${params}`,
    )
    if (data?.data) {
      const fetched = data.data.data || []
      if (loadMore) {
        messages.value = [...fetched, ...messages.value]
      } else {
        messages.value = fetched
      }
      hasMore.value = data.data.pagination?.has_more || false
      if (fetched.length > 0) {
        oldestCursor.value = fetched[0]._id
      }
    }
  } catch (error) {
    console.error('Failed to fetch messages:', error)
  } finally {
    loading.value = false
  }
  await nextTick()
  scrollToBottom()
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || sending.value) return
  sending.value = true
  try {
    await messagingStore.sendMessage(
      props.conversation._id,
      newMessage.value.trim(),
      'text',
      replyingTo.value?._id,
    )
    newMessage.value = ''
    replyingTo.value = null
    messagingStore.emitTypingStop(props.conversation._id)
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)
  } finally {
    sending.value = false
  }
}

const getFileType = (file) => {
  const t = typeof file === 'string' ? file : file?.type || ''
  if (t.startsWith('image/')) return 'image'
  if (t.startsWith('video/')) return 'video'
  if (t.startsWith('audio/')) return 'voice_note'
  if (t === 'application/pdf') return 'file'
  return 'file'
}

const isPendingImage = computed(() => pendingFile.value?.type?.startsWith('image/'))
const isPendingVideo = computed(() => pendingFile.value?.type?.startsWith('video/'))
const isPendingPdf = computed(() => pendingFile.value?.type === 'application/pdf')

const onFileSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  pendingFile.value = file
  thumbnailBlob.value = null
  if (fileInput.value) fileInput.value.value = ''

  // Generate preview URL for images, videos, and PDFs
  if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'application/pdf') {
    previewUrl.value = URL.createObjectURL(file)
  } else {
    previewUrl.value = null
  }

  // Generate thumbnail for video
  if (file.type.startsWith('video/')) {
    generateVideoThumbnail(file)
  }
  // Generate thumbnail for PDF
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

const sendAttachment = async () => {
  if (!pendingFile.value || uploadProgress.value) return
  uploadProgress.value = true
  try {
    const type = getFileType(pendingFile.value)
    const caption = newMessage.value.trim()
    const replyTo = replyingTo.value?._id

    // Send attachment without caption
    await messagingStore.sendAttachment(
      props.conversation._id,
      pendingFile.value,
      type,
      '',
      replyTo,
      thumbnailBlob.value,
    )

    // Send text as a separate message if provided
    if (caption) {
      await messagingStore.sendMessage(
        props.conversation._id,
        caption,
        'text',
      )
    }

    pendingFile.value = null
    previewUrl.value = null
    thumbnailBlob.value = null
    newMessage.value = ''
    replyingTo.value = null
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to send attachment:', error)
  } finally {
    uploadProgress.value = false
  }
}

const onTyping = () => {
  messagingStore.emitTypingStart(props.conversation._id)
  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    messagingStore.emitTypingStop(props.conversation._id)
  }, 3000)
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const getSenderName = (message) => {
  const sender = message.sender
  if (!sender) return 'System'
  if (sender.profile?.first_name) {
    return `${sender.profile.first_name} ${sender.profile.last_name || ''}`.trim()
  }
  return sender.email || 'Unknown'
}

const getSenderRole = (message) => {
  const senderId = message.sender?._id
  const participant = props.conversation.participants?.find(
    (p) => p.user?._id === senderId || p.user === senderId,
  )
  return participant?.role || ''
}

const getRoleColor = (role) => {
  switch (role) {
    case 'patient': return 'primary'
    case 'specialist': return 'success'
    case 'admin': return 'warning'
    default: return 'default'
  }
}

const getMessageIcon = (type) => {
  switch (type) {
    case 'image': return 'bx-image'
    case 'video': return 'bx-video'
    case 'file': return 'bx-file'
    case 'voice_note': return 'bx-microphone'
    case 'system': return 'bx-info-circle'
    default: return 'bx-message-detail'
  }
}

const formatTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  })
}

const formatType = (type) => {
  return (type || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const getStatusText = (status) => {
  if (status?.read_at) return 'Read'
  if (status?.delivered_at) return 'Delivered'
  if (status?.sent_at) return 'Sent'
  return ''
}

const getStatusColor = (status) => {
  if (status?.read_at) return 'info'
  if (status?.delivered_at) return 'success'
  return 'default'
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDuration = (seconds) => {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getDateLabel = (message, index) => {
  const msgs = displayMessages.value
  const msgDate = new Date(message.created_at).toDateString()
  if (index === 0) return formatDate(message.created_at)
  const prevDate = new Date(msgs[index - 1].created_at).toDateString()
  if (msgDate !== prevDate) return formatDate(message.created_at)
  return null
}

const isImage = (att) => att.mime_type?.startsWith('image/')
const isVideo = (att) => att.mime_type?.startsWith('video/')
const isAudio = (att, msgType) => msgType === 'voice_note' || att.mime_type?.startsWith('audio/')
const isPdf = (att) => att.mime_type === 'application/pdf'

const onImageError = (msgId, ai) => {
  imageErrors.value[`${msgId}-${ai}`] = true
}

const downloadAttachment = async (message, attachmentIndex) => {
  try {
    const { data } = await axios.get(
      `${apiBaseUrl}/messaging/conversations/${props.conversation._id}/messages/${message._id}/download/${attachmentIndex}`,
    )
    if (data?.data?.url) {
      window.open(data.data.url, '_blank')
    }
  } catch (error) {
    console.error('Failed to get download URL:', error)
  }
}

const exportConversation = async (format) => {
  exporting.value = true
  try {
    const { data } = await axios.get(
      `${apiBaseUrl}/messaging/conversations/${props.conversation._id}/export?format=${format}`,
    )
    if (!data?.data) return

    let blob, filename
    if (format === 'csv') {
      blob = new Blob([data.data.content], { type: 'text/csv' })
      filename = data.data.filename
    } else {
      blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
      filename = `conversation-${props.conversation._id}-${new Date().toISOString().split('T')[0]}.json`
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export conversation:', error)
  } finally {
    exporting.value = false
  }
}

// Restriction helpers
const fetchParticipantRestrictions = async () => {
  for (const p of participants.value) {
    if (!p.id) continue
    try {
      const { data } = await axios.get(
        `${apiBaseUrl}/messaging/restrictions/${p.id}`,
      )
      if (data?.result || data?.data) {
        participantRestrictions.value[p.id] = (data.result || data.data).messaging_restrictions
      }
    } catch {
      // User may not have restrictions
    }
  }
}

const getRestrictionStatus = (participantId) => {
  return participantRestrictions.value[participantId]?.status || 'none'
}

const getRestrictionLabel = (status) => {
  if (status === 'read_only') return 'Read-Only'
  if (status === 'blocked') return 'Blocked'
  return ''
}

const getRestrictionColor = (status) => {
  if (status === 'blocked') return 'error'
  if (status === 'read_only') return 'warning'
  return 'default'
}

const openRestrictionDialog = (participant) => {
  restrictionTarget.value = [{
    _id: participant.id,
    name: participant.name,
    user_type: participant.role,
  }]
  showRestrictionDialog.value = true
}

const liftRestriction = async (participant) => {
  liftingRestriction.value = participant.id
  try {
    await axios.delete(`${apiBaseUrl}/messaging/restrictions/${participant.id}`)
    participantRestrictions.value[participant.id] = { status: 'none' }
    // Emit restriction update via socket if connected
    if (messagingStore.socket) {
      messagingStore.socket.emit('admin_restriction_applied', {
        user_id: participant.id,
        restriction: { status: 'none' },
      })
    }
  } catch (error) {
    console.error('Failed to lift restriction:', error)
  } finally {
    liftingRestriction.value = null
  }
}

const onRestrictionApplied = (result) => {
  // Update local restriction data
  for (const user of result.users) {
    participantRestrictions.value[user._id] = {
      status: result.type,
    }
    // Emit restriction update via socket if connected
    if (messagingStore.socket) {
      messagingStore.socket.emit('admin_restriction_applied', {
        user_id: user._id,
        restriction: { status: result.type, reason: result.restriction?.reason },
      })
    }
  }
}

// Watch store messages for auto-scroll
watch(
  () => messagingStore.messages.length,
  () => {
    if (isParticipant.value) {
      nextTick(() => scrollToBottom())
    }
  },
)

onMounted(() => {
  fetchMessages()
  fetchParticipantRestrictions()
})

onUnmounted(() => {
  clearTimeout(typingTimeout)
  if (isParticipant.value) {
    messagingStore.clearActiveConversation()
  }
})
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex align-center justify-space-between pa-4">
      <div class="d-flex align-center gap-3">
        <VIcon icon="bx-message-square-dots" color="primary" />
        <div>
          <div class="text-h6">{{ participantLabel }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ formatType(conversation.type) }} &middot; {{ displayMessages.length }} messages loaded
            <VChip v-if="isParticipant" size="x-small" color="success" variant="tonal" class="ml-1">
              Participant
            </VChip>
          </div>
        </div>
      </div>
      <div class="d-flex align-center gap-1">
        <VMenu>
          <template #activator="{ props: menuProps }">
            <VBtn icon variant="text" size="small" v-bind="menuProps" :loading="exporting">
              <VIcon icon="bx-export" />
              <VTooltip activator="parent" location="bottom">Export</VTooltip>
            </VBtn>
          </template>
          <VList density="compact">
            <VListItem prepend-icon="bx-code-alt" @click="exportConversation('json')">
              <VListItemTitle>Export as JSON</VListItemTitle>
            </VListItem>
            <VListItem prepend-icon="bx-table" @click="exportConversation('csv')">
              <VListItemTitle>Export as CSV</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>
        <VBtn icon variant="text" @click="emit('close')">
          <VIcon icon="bx-x" />
        </VBtn>
      </div>
    </VCardTitle>

    <VDivider />

    <!-- Participants -->
    <div class="pa-3 d-flex gap-2 flex-wrap">
      <VMenu v-for="p in participants" :key="p.id" location="bottom">
        <template #activator="{ props: menuProps }">
          <VChip
            v-bind="menuProps"
            :color="getRestrictionStatus(p.id) !== 'none' ? getRestrictionColor(getRestrictionStatus(p.id)) : getRoleColor(p.role)"
            size="small"
            variant="tonal"
            style="cursor: pointer"
          >
            <VIcon
              v-if="getRestrictionStatus(p.id) !== 'none'"
              :icon="getRestrictionStatus(p.id) === 'blocked' ? 'bx-block' : 'bx-hide'"
              size="14"
              class="mr-1"
            />
            {{ p.name }} ({{ p.role }})
            <template v-if="getRestrictionStatus(p.id) !== 'none'">
              <VTooltip activator="parent" location="top">
                {{ getRestrictionLabel(getRestrictionStatus(p.id)) }}
              </VTooltip>
            </template>
            <template v-if="messagingStore.isUserOnline(p.id)">
              <span class="online-dot ml-1"></span>
            </template>
          </VChip>
        </template>
        <VList density="compact">
          <VListItem
            v-if="getRestrictionStatus(p.id) === 'none'"
            prepend-icon="bx-shield-x"
            @click="openRestrictionDialog(p)"
          >
            <VListItemTitle>Restrict User</VListItemTitle>
          </VListItem>
          <VListItem
            v-if="getRestrictionStatus(p.id) !== 'none'"
            prepend-icon="bx-check-shield"
            :disabled="liftingRestriction === p.id"
            @click="liftRestriction(p)"
          >
            <VListItemTitle>
              Lift Restriction
              <VProgressCircular v-if="liftingRestriction === p.id" indeterminate size="14" width="2" class="ml-1" />
            </VListItemTitle>
          </VListItem>
          <VListItem
            v-if="getRestrictionStatus(p.id) !== 'none'"
            prepend-icon="bx-edit"
            @click="openRestrictionDialog(p)"
          >
            <VListItemTitle>Edit Restriction</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
    </div>

    <!-- Restriction Dialog -->
    <UserRestrictionDialog
      v-model="showRestrictionDialog"
      :users="restrictionTarget"
      @applied="onRestrictionApplied"
    />

    <VDivider />

    <!-- Messages -->
    <VCardText ref="messagesContainer" style="max-height: 500px; overflow-y: auto;">
      <div v-if="hasMore || messagingStore.hasMoreMessages" class="text-center mb-3">
        <VBtn
          variant="text"
          size="small"
          :loading="loading || messagingStore.messagesLoading"
          @click="fetchMessages(true)"
        >
          Load older messages
        </VBtn>
      </div>

      <div v-if="(loading || messagingStore.messagesLoading) && displayMessages.length === 0" class="text-center py-8">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <div v-else-if="displayMessages.length === 0" class="text-center py-8 text-medium-emphasis">
        {{ isParticipant ? 'No messages yet. Send the first message!' : 'No messages in this conversation' }}
      </div>

      <template v-else>
        <template v-for="(message, index) in displayMessages" :key="message._id">
          <!-- Date separator -->
          <div v-if="getDateLabel(message, index)" class="text-center my-3">
            <VChip size="x-small" variant="tonal" color="default">
              {{ getDateLabel(message, index) }}
            </VChip>
          </div>

          <!-- System message -->
          <div v-if="message.type === 'system'" class="text-center my-2">
            <span class="text-caption text-medium-emphasis font-italic">
              {{ message.content }}
            </span>
          </div>

          <!-- Regular message -->
          <div v-else class="mb-3 message-row">
            <div class="d-flex align-center gap-2 mb-1">
              <VIcon :icon="getMessageIcon(message.type)" size="16" />
              <span class="font-weight-medium text-body-2">{{ getSenderName(message) }}</span>
              <VChip :color="getRoleColor(getSenderRole(message))" size="x-small" variant="tonal">
                {{ getSenderRole(message) }}
              </VChip>
              <span class="text-caption text-medium-emphasis">{{ formatTime(message.created_at) }}</span>
              <VChip
                v-if="getStatusText(message.status)"
                :color="getStatusColor(message.status)"
                size="x-small"
                variant="outlined"
              >
                {{ getStatusText(message.status) }}
              </VChip>
              <VChip v-if="message.is_deleted" color="error" size="x-small" variant="tonal">
                Deleted
              </VChip>
              <!-- Reply button (only for participants) -->
              <VBtn
                v-if="isParticipant && !message.is_deleted"
                icon
                size="x-small"
                variant="text"
                class="reply-btn"
                @click="replyingTo = message"
              >
                <VIcon icon="bx-reply" size="14" />
              </VBtn>
            </div>

            <!-- Text content -->
            <div
              v-if="message.content && !message.is_deleted"
              class="text-body-2 ml-6"
              style="white-space: pre-wrap;"
            >
              {{ message.content }}
            </div>
            <div v-if="message.is_deleted" class="text-body-2 ml-6 text-medium-emphasis font-italic">
              This message was deleted
            </div>

            <!-- Attachments -->
            <div v-if="message.attachments?.length" class="ml-6 mt-2">
              <div v-for="(att, ai) in message.attachments" :key="ai" class="mt-1">
                <!-- Image -->
                <div v-if="isImage(att) && att.url && !imageErrors[`${message._id}-${ai}`]" class="att-image-wrap">
                  <img :src="att.url" :alt="att.original_name || 'Image'" class="att-image rounded" @error="onImageError(message._id, ai)" />
                  <div class="d-flex align-center gap-2 mt-1">
                    <span class="text-caption text-medium-emphasis">{{ att.original_name || 'Image' }} &middot; {{ formatFileSize(att.size_bytes) }}</span>
                    <VBtn icon size="x-small" variant="text" @click="downloadAttachment(message, ai)"><VIcon icon="bx-download" size="16" /></VBtn>
                  </div>
                </div>
                <!-- Video -->
                <div v-else-if="isVideo(att) && att.url" class="att-video-wrap">
                  <video :src="att.url + '#t=0.5'" controls preload="metadata" class="att-video rounded" />
                  <div class="d-flex align-center gap-2 mt-1">
                    <span class="text-caption text-medium-emphasis">{{ att.original_name || 'Video' }} &middot; {{ formatFileSize(att.size_bytes) }}<span v-if="att.duration_seconds"> &middot; {{ formatDuration(att.duration_seconds) }}</span></span>
                    <VBtn icon size="x-small" variant="text" @click="downloadAttachment(message, ai)"><VIcon icon="bx-download" size="16" /></VBtn>
                  </div>
                </div>
                <!-- Audio / Voice note -->
                <div v-else-if="isAudio(att, message.type) && att.url" class="att-audio-wrap d-flex align-center gap-3 pa-2 rounded border">
                  <VIcon icon="bx-microphone" size="24" color="primary" />
                  <div class="flex-grow-1">
                    <audio :src="att.url" controls preload="metadata" style="width: 100%; max-width: 300px; height: 36px;" />
                    <div class="text-caption text-medium-emphasis mt-1">{{ formatFileSize(att.size_bytes) }}<span v-if="att.duration_seconds"> &middot; {{ formatDuration(att.duration_seconds) }}</span></div>
                  </div>
                  <VBtn icon size="x-small" variant="text" @click="downloadAttachment(message, ai)"><VIcon icon="bx-download" size="16" /></VBtn>
                </div>
                <!-- PDF with thumbnail -->
                <div v-else-if="isPdf(att) && att.thumbnail_url" class="att-pdf-thumb" style="cursor: pointer;" @click="att.url && window.open(att.url, '_blank')">
                  <img :src="att.thumbnail_url" class="att-pdf-thumb-img rounded" />
                  <div class="att-pdf-thumb-overlay">
                    <span class="att-pdf-badge">PDF</span>
                  </div>
                  <div class="d-flex align-center gap-2 mt-1">
                    <span class="text-caption text-medium-emphasis">{{ att.original_name || 'Document.pdf' }} &middot; {{ formatFileSize(att.size_bytes) }}</span>
                    <VBtn icon size="x-small" variant="text" @click.stop="downloadAttachment(message, ai)"><VIcon icon="bx-download" size="16" /></VBtn>
                  </div>
                </div>
                <!-- PDF without thumbnail -->
                <div v-else-if="isPdf(att)" class="att-pdf d-inline-flex align-center gap-3 pa-3 rounded border" style="cursor: pointer;" @click="att.url && window.open(att.url, '_blank')">
                  <div class="att-pdf-badge">PDF</div>
                  <div>
                    <div class="text-body-2 font-weight-medium">{{ att.original_name || 'Document.pdf' }}</div>
                    <div class="text-caption text-medium-emphasis">{{ formatFileSize(att.size_bytes) }}</div>
                  </div>
                  <VBtn icon size="x-small" variant="text" @click.stop="downloadAttachment(message, ai)"><VIcon icon="bx-download" size="16" /></VBtn>
                </div>
                <!-- Generic file -->
                <div v-else class="d-inline-flex align-center gap-2 pa-2 rounded border">
                  <VIcon icon="bx-file" size="20" />
                  <div>
                    <div class="text-body-2">{{ att.original_name || 'Attachment' }}</div>
                    <div class="text-caption text-medium-emphasis">{{ att.mime_type }} &middot; {{ formatFileSize(att.size_bytes) }}</div>
                  </div>
                  <VBtn v-if="att.url" icon size="x-small" variant="text" @click="downloadAttachment(message, ai)"><VIcon icon="bx-download" size="16" /></VBtn>
                </div>
              </div>
            </div>

            <!-- Reply reference -->
            <div v-if="message.reply_to" class="ml-6 mt-1">
              <VChip size="x-small" variant="outlined" prepend-icon="bx-reply">Reply to a message</VChip>
            </div>
          </div>
        </template>
      </template>
    </VCardText>

    <VDivider />

    <!-- Read-only footer (oversight mode) -->
    <VCardActions v-if="!isParticipant" class="pa-3">
      <span class="text-caption text-medium-emphasis">
        Read-only oversight view &middot; Created {{ formatDate(conversation.created_at) }}
      </span>
      <VSpacer />
      <VBtn variant="outlined" @click="emit('close')">Close</VBtn>
    </VCardActions>

    <!-- Interactive reply bar (participant mode) -->
    <div v-else>
      <!-- Typing indicator -->
      <div v-if="typingDisplay" class="px-4 py-1 text-caption text-medium-emphasis font-italic">
        {{ typingDisplay }}
      </div>

      <!-- Reply-to preview -->
      <div v-if="replyingTo" class="px-4 py-2 d-flex align-center" style="background: rgba(0,0,0,0.04);">
        <VIcon icon="bx-reply" size="16" class="mr-2" />
        <span class="text-caption text-truncate flex-grow-1">
          Replying to {{ getSenderName(replyingTo) }}: {{ replyingTo.content?.substring(0, 60) }}{{ replyingTo.content?.length > 60 ? '...' : '' }}
        </span>
        <VBtn icon size="x-small" variant="text" @click="replyingTo = null">
          <VIcon icon="bx-x" size="16" />
        </VBtn>
      </div>

      <!-- Pending file preview -->
      <div v-if="pendingFile" class="pending-preview px-4 py-3" style="background: rgba(var(--v-theme-primary), 0.04);">
        <div class="d-flex gap-3 align-start">
          <!-- Visual preview -->
          <div class="preview-thumb-wrap">
            <!-- Image preview -->
            <img v-if="isPendingImage && previewUrl" :src="previewUrl" class="preview-thumb rounded" />
            <!-- Video/PDF thumbnail -->
            <div v-else-if="(isPendingVideo || isPendingPdf) && previewUrl" class="preview-thumb-container">
              <img :src="previewUrl" class="preview-thumb rounded" />
              <div v-if="isPendingVideo" class="preview-play-badge">
                <VIcon icon="bx-play" size="20" color="white" />
              </div>
              <div v-if="isPendingPdf" class="preview-pdf-badge">PDF</div>
            </div>
            <!-- Generic file icon -->
            <div v-else class="preview-icon-box rounded d-flex align-center justify-center">
              <VIcon :icon="getFileType(pendingFile) === 'voice_note' ? 'bx-microphone' : 'bx-file'" size="28" color="primary" />
            </div>
          </div>
          <!-- File info -->
          <div class="flex-grow-1 text-truncate">
            <div class="text-body-2 font-weight-medium">{{ pendingFile.name }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ formatFileSize(pendingFile.size) }}
              <VChip size="x-small" variant="tonal" class="ml-1">{{ getFileType(pendingFile).replace('_', ' ') }}</VChip>
            </div>
          </div>
          <!-- Remove button -->
          <VBtn icon size="x-small" variant="text" @click="clearPendingFile" :disabled="uploadProgress">
            <VIcon icon="bx-x" size="18" />
          </VBtn>
        </div>
      </div>

      <VCardActions class="pa-3 gap-2">
        <!-- Hidden file input -->
        <input
          ref="fileInput"
          type="file"
          hidden
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          @change="onFileSelect"
        />
        <!-- Attach button -->
        <VBtn
          icon
          variant="text"
          :disabled="sending || uploadProgress"
          @click="fileInput?.click()"
        >
          <VIcon icon="bx-paperclip" />
          <VTooltip activator="parent" location="top">Attach file</VTooltip>
        </VBtn>
        <VTextarea
          v-model="newMessage"
          :placeholder="pendingFile ? 'Add a caption (optional)...' : 'Type a message...'"
          variant="outlined"
          density="compact"
          rows="1"
          auto-grow
          max-rows="4"
          hide-details
          class="flex-grow-1"
          @keydown.ctrl.enter="pendingFile ? sendAttachment() : sendMessage()"
          @input="onTyping"
        />
        <VBtn
          v-if="pendingFile"
          icon
          color="primary"
          :loading="uploadProgress"
          @click="sendAttachment"
        >
          <VIcon icon="bx-upload" />
          <VTooltip activator="parent" location="top">Send file</VTooltip>
        </VBtn>
        <VBtn
          v-else
          icon
          color="primary"
          :loading="sending"
          :disabled="!newMessage.trim()"
          @click="sendMessage"
        >
          <VIcon icon="bx-send" />
        </VBtn>
      </VCardActions>

      <!-- Upload progress bar -->
      <VProgressLinear v-if="uploadProgress" indeterminate color="primary" height="3" />
    </div>
  </VCard>
</template>

<style scoped>
.att-image {
  max-width: 280px;
  max-height: 200px;
  object-fit: cover;
  cursor: pointer;
  display: block;
}

.att-video {
  max-width: 320px;
  max-height: 240px;
  display: block;
}

.att-pdf-badge {
  background: #d32f2f;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.att-pdf-thumb {
  position: relative;
  display: inline-block;
}

.att-pdf-thumb-img {
  max-width: 200px;
  max-height: 260px;
  object-fit: cover;
  display: block;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.att-pdf-thumb-overlay {
  position: absolute;
  top: 6px;
  left: 6px;
}

/* Pending file preview */
.preview-thumb-wrap {
  flex-shrink: 0;
}

.preview-thumb {
  max-width: 120px;
  max-height: 100px;
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
  width: 32px;
  height: 32px;
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
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
}

.preview-icon-box {
  width: 64px;
  height: 64px;
  background: rgba(var(--v-theme-primary), 0.08);
}

.online-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4caf50;
}

.message-row .reply-btn {
  opacity: 0;
  transition: opacity 0.15s;
}
.message-row:hover .reply-btn {
  opacity: 1;
}
</style>
