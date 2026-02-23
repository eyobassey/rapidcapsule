<script setup>
import { ref, onMounted } from 'vue'
import axios from '@axios'
import ConversationBrowser from '@/components/Messaging/ConversationBrowser.vue'
import ConversationViewer from '@/components/Messaging/ConversationViewer.vue'
import MessagingStats from '@/components/Messaging/MessagingStats.vue'
import AuditLogViewer from '@/components/Messaging/AuditLogViewer.vue'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

const activeTab = ref(0)
const stats = ref(null)
const selectedConversation = ref(null)
const showConversationViewer = ref(false)

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
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <VContainer fluid>
    <!-- Header -->
    <VRow class="mb-4">
      <VCol cols="12">
        <VCard class="pa-6" color="primary" variant="flat">
          <div class="d-flex align-center gap-4">
            <VIcon icon="bx-message-square-dots" size="40" color="white" />
            <div>
              <h4 class="text-h4 text-white font-weight-bold">Messaging Oversight</h4>
              <p class="text-body-1 text-white opacity-80 mb-0">
                Monitor all platform conversations, review messages, and audit compliance
              </p>
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
            <VTab :value="0">Conversations</VTab>
            <VTab :value="1">Audit Logs</VTab>
          </VTabs>

          <VCardText>
            <VWindow v-model="activeTab">
              <VWindowItem :value="0">
                <ConversationBrowser @view="viewConversation" />
              </VWindowItem>
              <VWindowItem :value="1">
                <AuditLogViewer />
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
  </VContainer>
</template>
