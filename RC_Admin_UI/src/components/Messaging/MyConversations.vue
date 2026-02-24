<script setup>
import { computed, onMounted } from 'vue'
import { useMessagingStore } from '@/stores/messaging'

const emit = defineEmits(['view'])
const messagingStore = useMessagingStore()

const conversations = computed(() => messagingStore.myConversations)
const loading = computed(() => messagingStore.myConversationsLoading)
const hasMore = computed(() => messagingStore.myConversationsHasMore)

const getOtherParticipant = (conversation) => {
  const myId = messagingStore.messagingUserId
  const other = conversation.participants?.find(
    (p) => (p.user?._id || p.user) !== myId,
  )
  if (!other) return { name: 'Unknown', role: '' }
  const u = other.user
  const name = u?.profile?.first_name
    ? `${u.profile.first_name} ${u.profile.last_name || ''}`.trim()
    : u?.email || 'Unknown'
  return { name, role: other.role, id: u?._id || u }
}

const getRoleColor = (role) => {
  switch (role) {
    case 'patient': return 'primary'
    case 'specialist': return 'success'
    case 'admin': return 'warning'
    default: return 'default'
  }
}

const getUnreadCount = (convId) => {
  return messagingStore.unreadCounts[convId] || 0
}

const formatRelativeTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const d = new Date(date)
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getLastMessagePreview = (conversation) => {
  const lm = conversation.last_message
  if (!lm?.content) return 'No messages yet'
  if (lm.type && lm.type !== 'text') {
    const typeIcons = { image: 'Photo', video: 'Video', file: 'File', voice_note: 'Voice note' }
    return typeIcons[lm.type] || lm.content
  }
  return lm.content.length > 50 ? lm.content.substring(0, 50) + '...' : lm.content
}

const loadMore = () => {
  messagingStore.fetchMyConversations(messagingStore.myConversationsPage + 1)
}

onMounted(() => {
  if (messagingStore.sessionReady) {
    messagingStore.fetchMyConversations()
  }
})
</script>

<template>
  <div>
    <!-- Loading (initial) -->
    <div v-if="loading && conversations.length === 0" class="text-center py-8">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <!-- Session not ready -->
    <VAlert v-else-if="!messagingStore.sessionReady" type="info" variant="tonal">
      Initializing messaging session...
    </VAlert>

    <!-- Conversation list -->
    <div v-else-if="conversations.length > 0">
      <VList lines="two">
        <VListItem
          v-for="conv in conversations"
          :key="conv._id"
          class="py-3"
          @click="emit('view', conv)"
        >
          <template #prepend>
            <VAvatar :color="getRoleColor(getOtherParticipant(conv).role)" size="40">
              <span class="text-white font-weight-bold">
                {{ getOtherParticipant(conv).name.charAt(0).toUpperCase() }}
              </span>
              <!-- Online indicator -->
              <span
                v-if="messagingStore.isUserOnline(getOtherParticipant(conv).id)"
                class="online-indicator"
              ></span>
            </VAvatar>
          </template>

          <VListItemTitle class="d-flex align-center gap-2">
            <span class="font-weight-medium">{{ getOtherParticipant(conv).name }}</span>
            <VChip :color="getRoleColor(getOtherParticipant(conv).role)" size="x-small" variant="tonal">
              {{ getOtherParticipant(conv).role }}
            </VChip>
          </VListItemTitle>

          <VListItemSubtitle class="text-truncate">
            {{ getLastMessagePreview(conv) }}
          </VListItemSubtitle>

          <template #append>
            <div class="text-right">
              <div class="text-caption text-medium-emphasis">
                {{ formatRelativeTime(conv.last_message?.sent_at || conv.updated_at) }}
              </div>
              <VBadge
                v-if="getUnreadCount(conv._id) > 0"
                :content="getUnreadCount(conv._id)"
                color="error"
                inline
                class="mt-1"
              />
            </div>
          </template>
        </VListItem>
      </VList>

      <!-- Load more -->
      <div v-if="hasMore" class="text-center py-3">
        <VBtn
          variant="text"
          color="primary"
          :loading="loading"
          @click="loadMore"
        >
          Load more conversations
        </VBtn>
      </div>
    </div>

    <!-- Empty state -->
    <VAlert v-else type="info" variant="tonal">
      No conversations yet. Start a new conversation to begin messaging.
    </VAlert>
  </div>
</template>

<style scoped>
.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4caf50;
  border: 2px solid white;
}
</style>
