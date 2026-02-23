<script setup>
import { ref, onMounted } from 'vue'
import axios from '@axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

const emit = defineEmits(['view'])

const conversations = ref([])
const loading = ref(false)
const totalItems = ref(0)
const currentPage = ref(1)
const itemsPerPage = ref(20)
const typeFilter = ref('')
const searchQuery = ref('')

const headers = [
  { title: 'Participants', key: 'participants', sortable: false },
  { title: 'Type', key: 'type', width: '150px' },
  { title: 'Last Message', key: 'last_message', sortable: false },
  { title: 'Messages', key: 'message_count', width: '100px' },
  { title: 'Created', key: 'created_at', width: '140px' },
  { title: 'Actions', key: 'actions', width: '100px', sortable: false },
]

const typeOptions = [
  { title: 'All Types', value: '' },
  { title: 'Patient-Specialist', value: 'patient_specialist' },
  { title: 'Patient-Admin', value: 'patient_admin' },
  { title: 'Specialist-Admin', value: 'specialist_admin' },
]

const fetchConversations = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', currentPage.value)
    params.append('limit', itemsPerPage.value)
    if (typeFilter.value) params.append('type', typeFilter.value)
    if (searchQuery.value) params.append('userId', searchQuery.value)

    const { data } = await axios.get(`${apiBaseUrl}/messaging/conversations?${params}`)
    if (data?.data) {
      conversations.value = data.data.data
      totalItems.value = data.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
  } finally {
    loading.value = false
  }
}

const getParticipantNames = (conversation) => {
  return conversation.participants?.map((p) => {
    const u = p.user
    if (u?.profile?.first_name) {
      return `${u.profile.first_name} ${u.profile.last_name || ''}`.trim()
    }
    return u?.email || 'Unknown'
  }).join(' & ') || 'Unknown'
}

const getTypeColor = (type) => {
  switch (type) {
    case 'patient_specialist': return 'primary'
    case 'patient_admin': return 'warning'
    case 'specialist_admin': return 'info'
    default: return 'default'
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatType = (type) => {
  return (type || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

onMounted(() => fetchConversations())
</script>

<template>
  <div>
    <!-- Filters -->
    <VRow class="mb-4">
      <VCol cols="12" md="4">
        <VSelect
          v-model="typeFilter"
          :items="typeOptions"
          label="Filter by type"
          variant="outlined"
          density="compact"
          @update:model-value="fetchConversations"
        />
      </VCol>
      <VCol cols="12" md="4">
        <VTextField
          v-model="searchQuery"
          label="Search by user ID"
          variant="outlined"
          density="compact"
          clearable
          @keyup.enter="fetchConversations"
          @click:clear="searchQuery = ''; fetchConversations()"
        />
      </VCol>
    </VRow>

    <!-- Table -->
    <VDataTable
      :headers="headers"
      :items="conversations"
      :loading="loading"
      :items-per-page="itemsPerPage"
      item-value="_id"
      class="elevation-0"
    >
      <template #item.participants="{ item }">
        <span class="font-weight-medium">{{ getParticipantNames(item) }}</span>
      </template>

      <template #item.type="{ item }">
        <VChip :color="getTypeColor(item.type)" size="small" variant="tonal">
          {{ formatType(item.type) }}
        </VChip>
      </template>

      <template #item.last_message="{ item }">
        <span class="text-truncate d-inline-block" style="max-width: 250px;">
          {{ item.last_message?.content || 'No messages' }}
        </span>
      </template>

      <template #item.created_at="{ item }">
        {{ formatDate(item.created_at) }}
      </template>

      <template #item.actions="{ item }">
        <VBtn icon size="small" variant="text" color="primary" @click="emit('view', item)">
          <VIcon icon="bx-show" />
        </VBtn>
      </template>

      <template #bottom>
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(totalItems / itemsPerPage)"
          @update:model-value="fetchConversations"
          class="mt-4"
        />
      </template>
    </VDataTable>
  </div>
</template>
