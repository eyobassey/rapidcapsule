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
const totalPages = ref(1)
const typeFilter = ref('')
const searchQuery = ref('')
const activeSearch = ref('')

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
    if (searchQuery.value) params.append('search', searchQuery.value)

    const { data } = await axios.get(`${apiBaseUrl}/messaging/conversations?${params}`)
    activeSearch.value = searchQuery.value || ''
    if (data?.data) {
      const items = data.data.data || data.data
      conversations.value = Array.isArray(items) ? items : []
      totalItems.value = data.data.pagination?.total || 0
      totalPages.value = data.data.pagination?.pages || Math.ceil(totalItems.value / itemsPerPage.value)
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

const clearSearch = () => {
  searchQuery.value = ''
  activeSearch.value = ''
  currentPage.value = 1
  fetchConversations()
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
          @update:model-value="currentPage = 1; fetchConversations()"
        />
      </VCol>
      <VCol cols="12" md="4">
        <VTextField
          v-model="searchQuery"
          label="Search by email or name"
          placeholder="e.g. john@example.com or John"
          variant="outlined"
          density="compact"
          clearable
          @keyup.enter="currentPage = 1; fetchConversations()"
          @click:clear="clearSearch"
        />
      </VCol>
      <VCol cols="12" md="2" class="d-flex align-center">
        <VBtn variant="outlined" density="compact" prepend-icon="bx-search" @click="currentPage = 1; fetchConversations()">
          Search
        </VBtn>
      </VCol>
    </VRow>

    <!-- Active search indicator -->
    <VAlert v-if="activeSearch" type="info" density="compact" variant="tonal" class="mb-3" closable @click:close="clearSearch">
      Showing {{ conversations.length }} result(s) for "{{ activeSearch }}"
    </VAlert>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <!-- Table -->
    <VTable v-else-if="conversations.length > 0">
      <thead>
        <tr>
          <th>Participants</th>
          <th style="width: 150px;">Type</th>
          <th>Last Message</th>
          <th style="width: 140px;">Created</th>
          <th style="width: 100px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="conversation in conversations" :key="conversation._id">
          <td>
            <span class="font-weight-medium">{{ getParticipantNames(conversation) }}</span>
          </td>
          <td>
            <VChip :color="getTypeColor(conversation.type)" size="small" variant="tonal">
              {{ formatType(conversation.type) }}
            </VChip>
          </td>
          <td>
            <span class="text-truncate d-inline-block" style="max-width: 250px;">
              {{ conversation.last_message?.content || 'No messages' }}
            </span>
          </td>
          <td>{{ formatDate(conversation.created_at) }}</td>
          <td>
            <VBtn icon size="small" variant="text" color="primary" @click="emit('view', conversation)">
              <VIcon icon="bx-show" />
            </VBtn>
          </td>
        </tr>
      </tbody>
    </VTable>

    <!-- Empty state -->
    <VAlert v-else type="info" variant="tonal">
      {{ activeSearch ? 'No conversations found matching your search' : 'No conversations found' }}
    </VAlert>

    <!-- Pagination -->
    <div class="d-flex justify-center mt-4" v-if="totalPages > 1">
      <VPagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="7"
        @update:model-value="fetchConversations"
      />
    </div>
  </div>
</template>
