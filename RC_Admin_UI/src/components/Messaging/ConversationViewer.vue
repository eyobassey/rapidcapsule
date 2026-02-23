<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from '@axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

const props = defineProps({
  conversation: { type: Object, required: true },
})

const emit = defineEmits(['close'])

const messages = ref([])
const loading = ref(false)
const hasMore = ref(true)
const oldestCursor = ref(null)

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

const fetchMessages = async (loadMore = false) => {
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
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

const getDateLabel = (message, index) => {
  const msgDate = new Date(message.created_at).toDateString()
  if (index === 0) return formatDate(message.created_at)
  const prevDate = new Date(messages.value[index - 1].created_at).toDateString()
  if (msgDate !== prevDate) return formatDate(message.created_at)
  return null
}

onMounted(() => fetchMessages())
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex align-center justify-space-between pa-4">
      <div class="d-flex align-center gap-3">
        <VIcon icon="bx-message-square-dots" color="primary" />
        <div>
          <div class="text-h6">{{ participantLabel }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ formatType(conversation.type) }} &middot; {{ messages.length }} messages loaded
          </div>
        </div>
      </div>
      <VBtn icon variant="text" @click="emit('close')">
        <VIcon icon="bx-x" />
      </VBtn>
    </VCardTitle>

    <VDivider />

    <!-- Participants -->
    <div class="pa-3 d-flex gap-2 flex-wrap">
      <VChip
        v-for="p in participants"
        :key="p.id"
        :color="getRoleColor(p.role)"
        size="small"
        variant="tonal"
      >
        {{ p.name }} ({{ p.role }})
      </VChip>
    </div>

    <VDivider />

    <!-- Messages -->
    <VCardText style="max-height: 500px; overflow-y: auto;">
      <div v-if="hasMore" class="text-center mb-3">
        <VBtn
          variant="text"
          size="small"
          :loading="loading"
          @click="fetchMessages(true)"
        >
          Load older messages
        </VBtn>
      </div>

      <div v-if="loading && messages.length === 0" class="text-center py-8">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <div v-else-if="messages.length === 0" class="text-center py-8 text-medium-emphasis">
        No messages in this conversation
      </div>

      <template v-else>
        <template v-for="(message, index) in messages" :key="message._id">
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
          <div v-else class="mb-3">
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
            <div v-if="message.attachments?.length" class="ml-6 mt-1">
              <div
                v-for="(att, ai) in message.attachments"
                :key="ai"
                class="d-inline-flex align-center gap-2 pa-2 rounded border mt-1"
              >
                <VIcon
                  :icon="message.type === 'image' ? 'bx-image' : message.type === 'video' ? 'bx-video' : message.type === 'voice_note' ? 'bx-microphone' : 'bx-file'"
                  size="20"
                />
                <div>
                  <div class="text-body-2">{{ att.original_name || 'Attachment' }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ att.mime_type }} &middot; {{ formatFileSize(att.size_bytes) }}
                    <span v-if="att.duration_seconds"> &middot; {{ Math.round(att.duration_seconds) }}s</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reply reference -->
            <div v-if="message.reply_to" class="ml-6 mt-1">
              <VChip size="x-small" variant="outlined" prepend-icon="bx-reply">
                Reply to a message
              </VChip>
            </div>
          </div>
        </template>
      </template>
    </VCardText>

    <VDivider />

    <VCardActions class="pa-3">
      <span class="text-caption text-medium-emphasis">
        Read-only view &middot; Created {{ formatDate(conversation.created_at) }}
      </span>
      <VSpacer />
      <VBtn variant="outlined" @click="emit('close')">Close</VBtn>
    </VCardActions>
  </VCard>
</template>
