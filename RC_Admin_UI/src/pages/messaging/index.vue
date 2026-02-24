<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from '@axios'
import { useMessagingStore } from '@/stores/messaging'
import ConversationBrowser from '@/components/Messaging/ConversationBrowser.vue'
import ConversationViewer from '@/components/Messaging/ConversationViewer.vue'
import MessagingStats from '@/components/Messaging/MessagingStats.vue'
import AuditLogViewer from '@/components/Messaging/AuditLogViewer.vue'
import UserRestrictionDialog from '@/components/Messaging/UserRestrictionDialog.vue'
import MyConversations from '@/components/Messaging/MyConversations.vue'
import NewConversationDialog from '@/components/Messaging/NewConversationDialog.vue'
import BroadcastDialog from '@/components/Messaging/BroadcastDialog.vue'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
const messagingStore = useMessagingStore()

const activeTab = ref(0)
const stats = ref(null)
const selectedConversation = ref(null)
const showConversationViewer = ref(false)
const showNewConversation = ref(false)
const showBroadcast = ref(false)

// Restricted Users tab state
const restrictedUsers = ref([])
const restrictedLoading = ref(false)
const restrictedPagination = ref({ total: 0, page: 1, limit: 20, pages: 0 })
const restrictedSearch = ref('')
const restrictedTypeFilter = ref('')
const showRestrictionDialog = ref(false)
const restrictionDialogUsers = ref([])
const liftingUserId = ref(null)

const fetchStats = async () => {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/messaging/stats`)
    if (data?.data) stats.value = data.data
  } catch (error) {
    console.error('Failed to fetch messaging stats:', error)
  }
}

const viewConversation = (conversation) => {
  selectedConversation.value = conversation
  showConversationViewer.value = true
}

const closeViewer = () => {
  showConversationViewer.value = false
  selectedConversation.value = null
  messagingStore.clearActiveConversation()
}

const onConversationCreated = (conversation) => {
  // Switch to My Conversations tab and open the new conversation
  activeTab.value = 1
  viewConversation(conversation)
}

const onBroadcastSent = () => {
  // Refresh stats after broadcast
  fetchStats()
}

const fetchRestrictedUsers = async (page = 1) => {
  restrictedLoading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', String(page))
    params.append('limit', '20')
    if (restrictedSearch.value) params.append('search', restrictedSearch.value)
    if (restrictedTypeFilter.value) params.append('type', restrictedTypeFilter.value)

    const { data } = await axios.get(`${apiBaseUrl}/messaging/restrictions?${params}`)
    if (data?.result || data?.data) {
      const result = data.result || data.data
      restrictedUsers.value = result.data || []
      restrictedPagination.value = result.pagination || {}
    }
  } catch (error) {
    console.error('Failed to fetch restricted users:', error)
  } finally {
    restrictedLoading.value = false
  }
}

const liftUserRestriction = async (user) => {
  liftingUserId.value = user._id
  try {
    await axios.delete(`${apiBaseUrl}/messaging/restrictions/${user._id}`)
    // Emit via socket if connected
    if (messagingStore.socket) {
      messagingStore.socket.emit('admin_restriction_applied', {
        user_id: user._id,
        restriction: { status: 'none' },
      })
    }
    fetchRestrictedUsers(restrictedPagination.value.page)
  } catch (error) {
    console.error('Failed to lift restriction:', error)
  } finally {
    liftingUserId.value = null
  }
}

const formatRestrictionDate = (date) => {
  if (!date) return 'Indefinite'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const onRestrictionApplied = () => {
  fetchRestrictedUsers(restrictedPagination.value.page)
}

onMounted(async () => {
  fetchStats()
  // Initialize messaging session for bidirectional messaging
  await messagingStore.initSession()
  if (messagingStore.sessionReady) {
    messagingStore.connectSocket()
  }
})

onBeforeUnmount(() => {
  messagingStore.disconnectSocket()
  messagingStore.clearActiveConversation()
})
</script>

<template>
  <VContainer fluid>
    <!-- Header -->
    <VRow class="mb-4">
      <VCol cols="12">
        <VCard class="pa-6" color="primary" variant="flat">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-4">
              <VIcon icon="bx-message-square-dots" size="40" color="white" />
              <div>
                <h4 class="text-h4 text-white font-weight-bold">Messaging</h4>
                <p class="text-body-1 text-white opacity-80 mb-0">
                  Monitor conversations, message users, and broadcast announcements
                </p>
              </div>
            </div>
            <div class="d-flex gap-2">
              <VBtn
                color="white"
                variant="outlined"
                prepend-icon="bx-broadcast"
                @click="showBroadcast = true"
              >
                Broadcast
              </VBtn>
              <VBtn
                color="white"
                variant="flat"
                prepend-icon="bx-message-add"
                @click="showNewConversation = true"
              >
                New Conversation
              </VBtn>
            </div>
          </div>
        </VCard>
      </VCol>
    </VRow>

    <!-- Stats Cards -->
    <MessagingStats v-if="stats" :stats="stats" class="mb-4" />

    <!-- Tabs -->
    <VRow>
      <VCol cols="12">
        <VCard>
          <VTabs v-model="activeTab" color="primary">
            <VTab :value="0">
              <VIcon icon="bx-conversation" class="me-2" />
              All Conversations
            </VTab>
            <VTab :value="1">
              <VIcon icon="bx-chat" class="me-2" />
              My Conversations
              <VBadge
                v-if="messagingStore.totalUnread > 0"
                :content="messagingStore.totalUnread"
                color="error"
                inline
                class="ms-2"
              />
            </VTab>
            <VTab :value="2">
              <VIcon icon="bx-list-check" class="me-2" />
              Audit Logs
            </VTab>
            <VTab :value="3" @click="fetchRestrictedUsers()">
              <VIcon icon="bx-shield-x" class="me-2" />
              Restricted Users
            </VTab>
          </VTabs>

          <VCardText>
            <VWindow v-model="activeTab">
              <VWindowItem :value="0">
                <ConversationBrowser @view="viewConversation" />
              </VWindowItem>
              <VWindowItem :value="1">
                <MyConversations @view="viewConversation" />
              </VWindowItem>
              <VWindowItem :value="2">
                <AuditLogViewer />
              </VWindowItem>
              <VWindowItem :value="3">
                <!-- Restricted Users -->
                <div class="d-flex gap-3 mb-4 align-center">
                  <VTextField
                    v-model="restrictedSearch"
                    placeholder="Search by name or email..."
                    prepend-inner-icon="bx-search"
                    density="compact"
                    hide-details
                    clearable
                    style="max-width: 300px"
                    @keydown.enter="fetchRestrictedUsers(1)"
                    @click:clear="restrictedSearch = ''; fetchRestrictedUsers(1)"
                  />
                  <VSelect
                    v-model="restrictedTypeFilter"
                    :items="[
                      { title: 'All Types', value: '' },
                      { title: 'Read-Only', value: 'read_only' },
                      { title: 'Blocked', value: 'blocked' },
                    ]"
                    density="compact"
                    hide-details
                    style="max-width: 180px"
                    @update:modelValue="fetchRestrictedUsers(1)"
                  />
                  <VSpacer />
                  <VBtn
                    variant="text"
                    prepend-icon="bx-refresh"
                    :loading="restrictedLoading"
                    @click="fetchRestrictedUsers(restrictedPagination.page)"
                  >
                    Refresh
                  </VBtn>
                </div>

                <VProgressLinear v-if="restrictedLoading" indeterminate color="primary" class="mb-2" />

                <VTable v-if="restrictedUsers.length" density="compact">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Restriction</th>
                      <th>Reason</th>
                      <th>Expires</th>
                      <th>Message Cap</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in restrictedUsers" :key="user._id">
                      <td>
                        <div class="font-weight-medium">{{ user.name }}</div>
                        <div class="text-caption text-medium-emphasis">{{ user.email }}</div>
                      </td>
                      <td>
                        <VChip
                          :color="user.user_type === 'Specialist' ? 'success' : 'primary'"
                          size="x-small"
                          variant="tonal"
                        >
                          {{ user.user_type }}
                        </VChip>
                      </td>
                      <td>
                        <VChip
                          :color="user.messaging_restrictions?.status === 'blocked' ? 'error' : 'warning'"
                          size="small"
                          variant="tonal"
                        >
                          <VIcon
                            :icon="user.messaging_restrictions?.status === 'blocked' ? 'bx-block' : 'bx-hide'"
                            size="14"
                            class="mr-1"
                          />
                          {{ user.messaging_restrictions?.status === 'blocked' ? 'Blocked' : 'Read-Only' }}
                        </VChip>
                      </td>
                      <td>
                        <span class="text-body-2">
                          {{ user.messaging_restrictions?.reason || '—' }}
                        </span>
                      </td>
                      <td>
                        <span class="text-body-2">
                          {{ formatRestrictionDate(user.messaging_restrictions?.expires_at) }}
                        </span>
                      </td>
                      <td>
                        <template v-if="user.messaging_restrictions?.message_cap?.enabled">
                          <VChip size="x-small" color="info" variant="tonal">
                            {{ user.messaging_restrictions.message_cap.current_count || 0 }}/{{ user.messaging_restrictions.message_cap.limit }}
                            {{ user.messaging_restrictions.message_cap.period }}
                          </VChip>
                        </template>
                        <span v-else class="text-medium-emphasis">—</span>
                      </td>
                      <td>
                        <div class="d-flex gap-1">
                          <VBtn
                            icon
                            size="x-small"
                            variant="text"
                            color="success"
                            :loading="liftingUserId === user._id"
                            @click="liftUserRestriction(user)"
                          >
                            <VIcon icon="bx-check-shield" size="18" />
                            <VTooltip activator="parent" location="top">Lift Restriction</VTooltip>
                          </VBtn>
                          <VBtn
                            icon
                            size="x-small"
                            variant="text"
                            color="warning"
                            @click="restrictionDialogUsers = [user]; showRestrictionDialog = true"
                          >
                            <VIcon icon="bx-edit" size="18" />
                            <VTooltip activator="parent" location="top">Edit Restriction</VTooltip>
                          </VBtn>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </VTable>

                <div v-else-if="!restrictedLoading" class="text-center py-8 text-medium-emphasis">
                  No restricted users found
                </div>

                <!-- Pagination -->
                <div v-if="restrictedPagination.pages > 1" class="d-flex justify-center mt-4">
                  <VPagination
                    v-model="restrictedPagination.page"
                    :length="restrictedPagination.pages"
                    :total-visible="5"
                    density="compact"
                    @update:modelValue="fetchRestrictedUsers"
                  />
                </div>
              </VWindowItem>
            </VWindow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Conversation Viewer Dialog -->
    <VDialog v-model="showConversationViewer" max-width="800" scrollable>
      <ConversationViewer
        v-if="selectedConversation"
        :conversation="selectedConversation"
        @close="closeViewer"
      />
    </VDialog>

    <!-- New Conversation Dialog -->
    <NewConversationDialog
      v-model="showNewConversation"
      @created="onConversationCreated"
    />

    <!-- Broadcast Dialog -->
    <BroadcastDialog
      v-model="showBroadcast"
      @sent="onBroadcastSent"
    />

    <!-- User Restriction Dialog -->
    <UserRestrictionDialog
      v-model="showRestrictionDialog"
      :users="restrictionDialogUsers"
      @applied="onRestrictionApplied"
    />
  </VContainer>
</template>
