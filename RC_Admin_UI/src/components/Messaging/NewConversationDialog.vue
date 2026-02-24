<script setup>
import { ref, watch } from 'vue'
import { useMessagingStore } from '@/stores/messaging'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'created'])
const messagingStore = useMessagingStore()

const searchQuery = ref('')
const creating = ref(false)
let searchTimeout = null

const dialogVisible = ref(props.modelValue)

watch(() => props.modelValue, (val) => { dialogVisible.value = val })
watch(dialogVisible, (val) => { emit('update:modelValue', val) })

const getRoleColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'patient': return 'primary'
    case 'specialist': return 'success'
    case 'admin': return 'warning'
    default: return 'default'
  }
}

const getUserName = (user) => {
  if (user.profile?.first_name) {
    return `${user.profile.first_name} ${user.profile.last_name || ''}`.trim()
  }
  return user.name || user.email || 'Unknown'
}

const getUserEmail = (user) => {
  return user.profile?.contact?.email || user.email || ''
}

const onSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    messagingStore.searchUsers(searchQuery.value)
  }, 300)
}

const selectUser = async (user) => {
  if (creating.value) return
  creating.value = true
  try {
    const userId = user._id || user.id
    const conversation = await messagingStore.createConversation(userId)
    if (conversation) {
      dialogVisible.value = false
      searchQuery.value = ''
      messagingStore.searchResults = []
      emit('created', conversation)
    }
  } catch (error) {
    console.error('Failed to create conversation:', error)
  } finally {
    creating.value = false
  }
}

const close = () => {
  dialogVisible.value = false
  searchQuery.value = ''
  messagingStore.searchResults = []
}
</script>

<template>
  <VDialog v-model="dialogVisible" max-width="500" scrollable>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center gap-2">
          <VIcon icon="bx-message-add" color="primary" />
          <span>New Conversation</span>
        </div>
        <VBtn icon variant="text" size="small" @click="close">
          <VIcon icon="bx-x" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VTextField
          v-model="searchQuery"
          label="Search by name or email"
          placeholder="Type at least 2 characters..."
          variant="outlined"
          density="compact"
          prepend-inner-icon="bx-search"
          autofocus
          clearable
          @input="onSearch"
          @click:clear="searchQuery = ''; messagingStore.searchResults = []"
        />

        <!-- Loading -->
        <div v-if="messagingStore.searchLoading" class="text-center py-4">
          <VProgressCircular indeterminate color="primary" size="24" />
        </div>

        <!-- Results -->
        <VList v-else-if="messagingStore.searchResults.length > 0" density="compact" class="mt-2">
          <VListItem
            v-for="user in messagingStore.searchResults"
            :key="user._id || user.id"
            :disabled="creating"
            @click="selectUser(user)"
          >
            <template #prepend>
              <VAvatar :color="getRoleColor(user.user_type)" size="36">
                <span class="text-white text-body-2 font-weight-bold">
                  {{ getUserName(user).charAt(0).toUpperCase() }}
                </span>
              </VAvatar>
            </template>

            <VListItemTitle>
              {{ getUserName(user) }}
              <VChip :color="getRoleColor(user.user_type)" size="x-small" variant="tonal" class="ml-1">
                {{ user.user_type }}
              </VChip>
            </VListItemTitle>
            <VListItemSubtitle>{{ getUserEmail(user) }}</VListItemSubtitle>
          </VListItem>
        </VList>

        <!-- Empty search -->
        <div v-else-if="searchQuery.length >= 2 && !messagingStore.searchLoading" class="text-center py-4 text-medium-emphasis">
          No users found matching "{{ searchQuery }}"
        </div>

        <!-- Hint -->
        <div v-else-if="searchQuery.length < 2" class="text-center py-4 text-medium-emphasis text-caption">
          Search for a patient or specialist to start a conversation
        </div>
      </VCardText>

      <!-- Creating indicator -->
      <div v-if="creating" class="pa-3 text-center">
        <VProgressLinear indeterminate color="primary" />
        <span class="text-caption">Creating conversation...</span>
      </div>
    </VCard>
  </VDialog>
</template>
