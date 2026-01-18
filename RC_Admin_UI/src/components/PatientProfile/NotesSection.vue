<template>
  <VCard>
    <VCardText>
      <div class="d-flex justify-space-between align-center mb-4">
        <h6 class="text-h6 mb-0">
          Admin Notes
        </h6>
        <VBtn
          color="primary"
          variant="outlined"
          size="small"
          prepend-icon="bx-plus"
          @click="showNewNoteDialog = true"
        >
          Add Note
        </VBtn>
      </div>

      <!-- Filter and Search -->
      <VRow class="mb-4">
        <VCol cols="12" md="4">
          <VTextField
            v-model="searchQuery"
            placeholder="Search notes..."
            variant="outlined"
            density="compact"
            prepend-inner-icon="bx-search"
            clearable
          />
        </VCol>
        
        <VCol cols="12" md="3">
          <VSelect
            v-model="selectedCategory"
            :items="noteCategories"
            label="Category"
            variant="outlined"
            density="compact"
            clearable
          />
        </VCol>
        
        <VCol cols="12" md="3">
          <VSelect
            v-model="selectedPriority"
            :items="priorityLevels"
            label="Priority"
            variant="outlined"
            density="compact"
            clearable
          />
        </VCol>
        
        <VCol cols="12" md="2">
          <VSelect
            v-model="sortBy"
            :items="sortOptions"
            label="Sort by"
            variant="outlined"
            density="compact"
          />
        </VCol>
      </VRow>

      <!-- Notes List -->
      <div v-if="loading" class="text-center py-8">
        <VProgressCircular
          indeterminate
          color="primary"
          size="40"
        />
        <p class="text-body-2 mt-2">Loading notes...</p>
      </div>

      <div v-else-if="filteredNotes.length === 0" class="text-center py-8">
        <VIcon 
          icon="bx-note" 
          size="64" 
          class="text-disabled mb-4"
        />
        <h6 class="text-h6 text-disabled mb-2">No Notes Found</h6>
        <p class="text-body-2 text-disabled mb-4">
          {{ hasFilters ? 'No notes match your filters' : 'No admin notes recorded for this patient' }}
        </p>
        <VBtn
          color="primary"
          variant="outlined"
          @click="showNewNoteDialog = true"
        >
          Add First Note
        </VBtn>
      </div>

      <div v-else class="notes-container">
        <VCard
          v-for="note in filteredNotes"
          :key="note.id"
          variant="outlined"
          class="note-card mb-4"
          :class="{ 'high-priority': note.priority === 'high', 'urgent-priority': note.priority === 'urgent' }"
        >
          <VCardText>
            <div class="d-flex justify-space-between align-start mb-3">
              <div class="flex-grow-1">
                <div class="d-flex align-center mb-2">
                  <VChip
                    :color="getCategoryColor(note.category)"
                    size="small"
                    variant="tonal"
                    class="mr-2"
                  >
                    {{ note.category }}
                  </VChip>
                  
                  <VChip
                    :color="getPriorityColor(note.priority)"
                    size="small"
                    variant="flat"
                    class="mr-2"
                  >
                    <VIcon 
                      :icon="getPriorityIcon(note.priority)" 
                      size="12" 
                      class="mr-1"
                    />
                    {{ note.priority }}
                  </VChip>

                  <VChip
                    v-if="note.isPrivate"
                    color="warning"
                    size="small"
                    variant="tonal"
                  >
                    <VIcon icon="bx-lock" size="12" class="mr-1" />
                    Private
                  </VChip>
                </div>

                <h6 class="text-subtitle-1 mb-1">{{ note.title }}</h6>
                
                <p class="text-body-2 mb-3" :class="{ 'note-preview': !note.expanded }">
                  {{ note.expanded ? note.content : getPreviewText(note.content) }}
                </p>

                <div v-if="note.content.length > 150" class="mb-3">
                  <VBtn
                    variant="text"
                    size="small"
                    @click="toggleNoteExpansion(note)"
                  >
                    {{ note.expanded ? 'Show Less' : 'Show More' }}
                  </VBtn>
                </div>

                <div v-if="note.tags && note.tags.length" class="mb-3">
                  <VChip
                    v-for="tag in note.tags"
                    :key="tag"
                    size="x-small"
                    variant="outlined"
                    class="mr-1 mb-1"
                  >
                    {{ tag }}
                  </VChip>
                </div>

                <div class="note-meta text-caption text-medium-emphasis">
                  <VIcon icon="bx-user" size="12" class="mr-1" />
                  {{ note.createdBy }}
                  <span class="mx-2">•</span>
                  <VIcon icon="bx-time" size="12" class="mr-1" />
                  {{ formatDateTime(note.createdAt) }}
                  <span v-if="note.updatedAt && note.updatedAt !== note.createdAt" class="mx-2">•</span>
                  <span v-if="note.updatedAt && note.updatedAt !== note.createdAt">
                    <VIcon icon="bx-edit" size="12" class="mr-1" />
                    Updated {{ formatRelativeTime(note.updatedAt) }}
                  </span>
                </div>
              </div>

              <VMenu>
                <template #activator="{ props }">
                  <VBtn
                    icon="bx-dots-vertical-rounded"
                    variant="text"
                    size="small"
                    v-bind="props"
                  />
                </template>
                <VList>
                  <VListItem @click="editNote(note)">
                    <template #prepend>
                      <VIcon icon="bx-edit" />
                    </template>
                    <VListItemTitle>Edit Note</VListItemTitle>
                  </VListItem>
                  <VListItem @click="pinNote(note)">
                    <template #prepend>
                      <VIcon :icon="note.isPinned ? 'bx-pin' : 'bxs-pin'" />
                    </template>
                    <VListItemTitle>{{ note.isPinned ? 'Unpin' : 'Pin' }} Note</VListItemTitle>
                  </VListItem>
                  <VListItem @click="duplicateNote(note)">
                    <template #prepend>
                      <VIcon icon="bx-copy" />
                    </template>
                    <VListItemTitle>Duplicate</VListItemTitle>
                  </VListItem>
                  <VDivider />
                  <VListItem @click="deleteNote(note)" class="text-error">
                    <template #prepend>
                      <VIcon icon="bx-trash" />
                    </template>
                    <VListItemTitle>Delete Note</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </div>

            <!-- Pinned Indicator -->
            <div v-if="note.isPinned" class="pinned-indicator">
              <VIcon icon="bxs-pin" color="warning" size="14" />
            </div>
          </VCardText>
        </VCard>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore && !loading" class="text-center mt-4">
        <VBtn
          variant="outlined"
          @click="loadMore"
          :loading="loadingMore"
        >
          Load More Notes
        </VBtn>
      </div>
    </VCardText>

    <!-- New/Edit Note Dialog -->
    <VDialog
      v-model="showNoteDialog"
      max-width="700"
      persistent
    >
      <VCard>
        <VCardTitle>
          <span class="text-h6">{{ isEditMode ? 'Edit' : 'Add' }} Admin Note</span>
        </VCardTitle>

        <VCardText>
          <VForm ref="noteForm" @submit.prevent="saveNote">
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="currentNote.title"
                  label="Note Title"
                  variant="outlined"
                  :rules="[v => !!v || 'Title is required']"
                  required
                />
              </VCol>

              <VCol cols="12" md="4">
                <VSelect
                  v-model="currentNote.category"
                  :items="noteCategories"
                  label="Category"
                  variant="outlined"
                  :rules="[v => !!v || 'Category is required']"
                  required
                />
              </VCol>

              <VCol cols="12" md="4">
                <VSelect
                  v-model="currentNote.priority"
                  :items="priorityLevels"
                  label="Priority"
                  variant="outlined"
                  :rules="[v => !!v || 'Priority is required']"
                  required
                />
              </VCol>

              <VCol cols="12" md="4">
                <VSwitch
                  v-model="currentNote.isPrivate"
                  label="Private Note"
                  color="warning"
                  hide-details
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="currentNote.content"
                  label="Note Content"
                  variant="outlined"
                  rows="6"
                  :rules="[v => !!v || 'Content is required']"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="currentNote.tags"
                  label="Tags (comma-separated)"
                  variant="outlined"
                  placeholder="important, follow-up, billing, medical"
                />
              </VCol>

              <VCol cols="12">
                <VSwitch
                  v-model="currentNote.isPinned"
                  label="Pin this note"
                  color="warning"
                  hide-details
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="cancelNote"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            @click="saveNote"
            :loading="saving"
          >
            {{ isEditMode ? 'Update' : 'Save' }} Note
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <VCard>
        <VCardTitle class="text-h6">
          Confirm Delete
        </VCardTitle>
        
        <VCardText>
          Are you sure you want to delete this note? This action cannot be undone.
        </VCardText>
        
        <VCardActions>
          <VSpacer />
          <VBtn @click="showDeleteDialog = false">Cancel</VBtn>
          <VBtn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="deleting"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Success/Error Snackbar -->
    <VSnackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
    >
      {{ snackbarMessage }}
    </VSnackbar>
  </VCard>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import moment from 'moment'

const props = defineProps({
  userData: {
    type: Object,
    required: true
  }
})

// Reactive data
const notes = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const saving = ref(false)
const deleting = ref(false)

// Search and filters
const searchQuery = ref('')
const selectedCategory = ref(null)
const selectedPriority = ref(null)
const sortBy = ref('newest')

// Dialog states
const showNoteDialog = ref(false)
const showNewNoteDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditMode = ref(false)
const noteToDelete = ref(null)

// Form data
const currentNote = ref({
  title: '',
  content: '',
  category: '',
  priority: 'normal',
  isPrivate: false,
  isPinned: false,
  tags: ''
})

// Snackbar
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Options
const noteCategories = [
  { title: 'General', value: 'general' },
  { title: 'Medical', value: 'medical' },
  { title: 'Billing', value: 'billing' },
  { title: 'Support', value: 'support' },
  { title: 'Behavioral', value: 'behavioral' },
  { title: 'Administrative', value: 'administrative' },
  { title: 'Follow-up', value: 'follow_up' },
  { title: 'Alert', value: 'alert' },
  { title: 'Compliance', value: 'compliance' },
  { title: 'Investigation', value: 'investigation' }
]

const priorityLevels = [
  { title: 'Low', value: 'low' },
  { title: 'Normal', value: 'normal' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

const sortOptions = [
  { title: 'Newest First', value: 'newest' },
  { title: 'Oldest First', value: 'oldest' },
  { title: 'Priority', value: 'priority' },
  { title: 'Category', value: 'category' },
  { title: 'Title A-Z', value: 'title' }
]

// Computed properties
const hasFilters = computed(() => {
  return searchQuery.value || selectedCategory.value || selectedPriority.value
})

const filteredNotes = computed(() => {
  let filtered = [...notes.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(note => note.category === selectedCategory.value)
  }

  // Priority filter
  if (selectedPriority.value) {
    filtered = filtered.filter(note => note.priority === selectedPriority.value)
  }

  // Sort
  const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
  
  filtered.sort((a, b) => {
    // Pinned notes always come first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    
    switch (sortBy.value) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt)
      case 'priority':
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      case 'category':
        return a.category.localeCompare(b.category)
      case 'title':
        return a.title.localeCompare(b.title)
      default: // newest
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  return filtered
})


// Methods
const fetchNotes = async () => {
  try {
    loading.value = true
    
    // Mock notes data for demonstration
    const mockNotes = [
      {
        id: '1',
        title: 'Patient shows concerning behavioral patterns',
        content: 'Patient has been consistently late for appointments and seems agitated during consultations. Consider discussing stress management or mental health support options. May need referral to behavioral health specialist.',
        category: 'behavioral',
        priority: 'high',
        isPrivate: true,
        isPinned: true,
        tags: ['behavior', 'mental-health', 'referral'],
        createdBy: 'Dr. Admin',
        createdAt: new Date('2025-09-08T14:30:00'),
        updatedAt: new Date('2025-09-08T15:45:00'),
        expanded: false
      },
      {
        id: '2',
        title: 'Insurance verification needed',
        content: 'Patient insurance information needs to be verified before next appointment. Current policy may have expired. Contact insurance provider to confirm coverage status.',
        category: 'billing',
        priority: 'normal',
        isPrivate: false,
        isPinned: false,
        tags: ['insurance', 'verification'],
        createdBy: 'Billing Admin',
        createdAt: new Date('2025-09-07T10:15:00'),
        expanded: false
      },
      {
        id: '3',
        title: 'Excellent compliance with treatment plan',
        content: 'Patient has been highly compliant with prescribed medication regimen and lifestyle recommendations. Blood pressure readings have improved significantly. Continue current treatment approach.',
        category: 'medical',
        priority: 'low',
        isPrivate: false,
        isPinned: false,
        tags: ['compliance', 'improvement', 'medication'],
        createdBy: 'Nurse Manager',
        createdAt: new Date('2025-09-05T16:20:00'),
        expanded: false
      },
      {
        id: '4',
        title: 'Emergency contact information outdated',
        content: 'During recent emergency, we discovered that the patient\'s emergency contact information is outdated. Primary contact number is disconnected. Need to update emergency contacts at next visit.',
        category: 'administrative',
        priority: 'urgent',
        isPrivate: false,
        isPinned: true,
        tags: ['emergency-contact', 'urgent', 'update'],
        createdBy: 'Admin Team',
        createdAt: new Date('2025-09-03T09:00:00'),
        expanded: false
      },
      {
        id: '5',
        title: 'Special dietary requirements noted',
        content: 'Patient has recently developed lactose intolerance. All nutritional recommendations and meal plans should be adjusted accordingly. Inform dietary team and update patient profile.',
        category: 'medical',
        priority: 'normal',
        isPrivate: false,
        isPinned: false,
        tags: ['dietary', 'allergy', 'nutrition'],
        createdBy: 'Dietitian',
        createdAt: new Date('2025-08-30T11:45:00'),
        expanded: false
      }
    ]

    notes.value = mockNotes
    
  } catch (error) {
    console.error('Error fetching notes:', error)
    showNotification('Failed to load notes', 'error')
  } finally {
    loading.value = false
  }
}

const saveNote = async () => {
  try {
    saving.value = true
    
    // Validate form
    if (!currentNote.value.title || !currentNote.value.content || 
        !currentNote.value.category || !currentNote.value.priority) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    // Process tags
    const tags = currentNote.value.tags 
      ? currentNote.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      : []

    if (isEditMode.value) {
      // Update existing note
      const index = notes.value.findIndex(n => n.id === currentNote.value.id)
      if (index !== -1) {
        notes.value[index] = {
          ...notes.value[index],
          ...currentNote.value,
          tags,
          updatedAt: new Date()
        }
      }
      showNotification('Note updated successfully', 'success')
    } else {
      // Create new note
      const newNote = {
        id: Date.now().toString(),
        ...currentNote.value,
        tags,
        createdBy: 'Admin User', // TODO: Get from auth context
        createdAt: new Date(),
        updatedAt: new Date(),
        expanded: false
      }
      notes.value.unshift(newNote)
      showNotification('Note saved successfully', 'success')
    }
    
    showNoteDialog.value = false
    resetForm()
    
  } catch (error) {
    console.error('Error saving note:', error)
    showNotification('Failed to save note', 'error')
  } finally {
    saving.value = false
  }
}

const editNote = (note) => {
  currentNote.value = {
    id: note.id,
    title: note.title,
    content: note.content,
    category: note.category,
    priority: note.priority,
    isPrivate: note.isPrivate,
    isPinned: note.isPinned,
    tags: note.tags.join(', ')
  }
  isEditMode.value = true
  showNoteDialog.value = true
}

const deleteNote = (note) => {
  noteToDelete.value = note
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    deleting.value = true
    
    notes.value = notes.value.filter(n => n.id !== noteToDelete.value.id)
    showNotification('Note deleted successfully', 'success')
    
  } catch (error) {
    console.error('Error deleting note:', error)
    showNotification('Failed to delete note', 'error')
  } finally {
    deleting.value = false
    showDeleteDialog.value = false
    noteToDelete.value = null
  }
}

const pinNote = (note) => {
  note.isPinned = !note.isPinned
  showNotification(`Note ${note.isPinned ? 'pinned' : 'unpinned'}`, 'success')
}

const duplicateNote = (note) => {
  const duplicate = {
    ...note,
    id: Date.now().toString(),
    title: `${note.title} (Copy)`,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPinned: false
  }
  notes.value.unshift(duplicate)
  showNotification('Note duplicated successfully', 'success')
}

const toggleNoteExpansion = (note) => {
  note.expanded = !note.expanded
}

const cancelNote = () => {
  showNoteDialog.value = false
  resetForm()
}

const resetForm = () => {
  currentNote.value = {
    title: '',
    content: '',
    category: '',
    priority: 'normal',
    isPrivate: false,
    isPinned: false,
    tags: ''
  }
  isEditMode.value = false
}

const loadMore = () => {
  // TODO: Implement pagination
  showNotification('Load more functionality will be implemented soon', 'info')
}

// Utility functions
const getCategoryColor = (category) => {
  const colors = {
    general: 'default',
    medical: 'primary',
    billing: 'warning',
    support: 'info',
    behavioral: 'secondary',
    administrative: 'success',
    follow_up: 'orange',
    alert: 'error',
    compliance: 'green',
    investigation: 'purple'
  }
  return colors[category] || 'default'
}

const getPriorityColor = (priority) => {
  const colors = {
    low: 'success',
    normal: 'default',
    high: 'warning',
    urgent: 'error'
  }
  return colors[priority] || 'default'
}

const getPriorityIcon = (priority) => {
  const icons = {
    low: 'bx-down-arrow',
    normal: 'bx-minus',
    high: 'bx-up-arrow',
    urgent: 'bx-error'
  }
  return icons[priority] || 'bx-minus'
}

const getPreviewText = (content) => {
  return content.length > 150 ? content.substring(0, 150) + '...' : content
}

const formatDateTime = (date) => {
  return moment(date).format('MMM DD, YYYY [at] h:mm A')
}

const formatRelativeTime = (date) => {
  return moment(date).fromNow()
}

const showNotification = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

// Lifecycle
onMounted(() => {
  fetchNotes()
})

// Watch for showNewNoteDialog changes
watch(showNewNoteDialog, (newValue) => {
  if (newValue) {
    isEditMode.value = false
    resetForm()
    showNoteDialog.value = true
    showNewNoteDialog.value = false
  }
})
</script>

<style scoped>
.notes-container {
  max-height: 800px;
  overflow-y: auto;
}

.note-card {
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.note-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.note-card.high-priority {
  border-left: 4px solid #ff9800;
}

.note-card.urgent-priority {
  border-left: 4px solid #f44336;
  background: rgba(244, 67, 54, 0.02);
}

.note-preview {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.pinned-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
}

.v-chip {
  font-weight: 500;
}

.text-caption {
  font-size: 0.75rem;
}

.v-card--variant-outlined {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>