<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Languages</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Manage specialist languages for patient filtering</p>
      </div>
      <div class="d-flex gap-2">
        <VBtn variant="outlined" prepend-icon="mdi-seed" @click="seedDefaults" :loading="seeding">
          Seed Defaults
        </VBtn>
        <VBtn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
          Add Language
        </VBtn>
      </div>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="primary" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-translate</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ store.total }}</div>
              <div class="text-body-2 text-medium-emphasis">Total Languages</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-check-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ activeCount }}</div>
              <div class="text-body-2 text-medium-emphasis">Active Languages</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="error" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-close-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ inactiveCount }}</div>
              <div class="text-body-2 text-medium-emphasis">Inactive Languages</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Search and Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" md="6">
            <VTextField
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search languages..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @input="debouncedSearch"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="statusFilter"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="fetchLanguages"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Data Table -->
    <VCard>
      <VTable v-if="tableItems.length > 0">
        <thead>
          <tr>
            <th>Language</th>
            <th>Code</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tableItems" :key="item._id">
            <td>
              <div class="d-flex align-center gap-2">
                <VAvatar color="primary" variant="tonal" size="36">
                  {{ item.code?.toUpperCase().slice(0, 2) }}
                </VAvatar>
                <div>
                  <div class="font-weight-medium">{{ item.name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ item.native_name }}</div>
                </div>
              </div>
            </td>
            <td>
              <VChip size="small" color="primary" variant="tonal">
                {{ item.code?.toUpperCase() }}
              </VChip>
            </td>
            <td>
              <VChip
                :color="item.is_active ? 'success' : 'error'"
                size="small"
                variant="tonal"
              >
                {{ item.is_active ? 'Active' : 'Inactive' }}
              </VChip>
            </td>
            <td>{{ formatDate(item.created_at) }}</td>
            <td>
              <VBtn icon="mdi-pencil" variant="text" size="small" @click="openEditDialog(item)" />
              <VBtn
                :icon="item.is_active ? 'mdi-eye-off' : 'mdi-eye'"
                variant="text"
                size="small"
                :color="item.is_active ? 'error' : 'success'"
                @click="toggleStatus(item)"
              />
            </td>
          </tr>
        </tbody>
      </VTable>
      <div v-else-if="store.loading" class="pa-4 text-center">
        <VProgressCircular indeterminate color="primary" />
      </div>
      <div v-else class="pa-4 text-center text-medium-emphasis">
        No languages found
      </div>
    </VCard>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="dialogVisible" max-width="500" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ editingLanguage ? 'Edit Language' : 'Add Language' }}</span>
          <VBtn icon="mdi-close" variant="text" @click="closeDialog" />
        </VCardTitle>

        <VCardText>
          <VForm ref="formRef" @submit.prevent="saveLanguage">
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="formData.name"
                  label="Language Name"
                  placeholder="e.g., English"
                  :rules="[v => !!v || 'Name is required']"
                  required
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="formData.code"
                  label="Language Code"
                  placeholder="e.g., en"
                  hint="ISO 639-1 code (2-5 characters)"
                  :rules="[
                    v => !!v || 'Code is required',
                    v => v.length >= 2 && v.length <= 5 || 'Code must be 2-5 characters'
                  ]"
                  required
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="formData.native_name"
                  label="Native Name"
                  placeholder="e.g., English"
                  hint="Name in the language itself"
                />
              </VCol>
              <VCol cols="12">
                <VSwitch
                  v-model="formData.is_active"
                  label="Active"
                  color="success"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="closeDialog">Cancel</VBtn>
          <VBtn color="primary" :loading="store.loading" @click="saveLanguage">
            {{ editingLanguage ? 'Update' : 'Create' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top end"
    >
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useLanguagesStore } from '@/stores/languages'
import { format } from 'date-fns'

const store = useLanguagesStore()

// Local ref for table items - VTable works better with local refs than Pinia store proxies
const tableItems = ref([])

// Sync store data to local ref
watch(() => store.languages, (newVal) => {
  tableItems.value = Array.isArray(newVal) ? [...newVal] : []
}, { immediate: true, deep: true })

const searchQuery = ref('')
const statusFilter = ref('all')
const dialogVisible = ref(false)
const editingLanguage = ref(null)
const formRef = ref(null)
const seeding = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

const showSuccess = (message) => {
  snackbar.value = { show: true, message, color: 'success' }
}

const showError = (message) => {
  snackbar.value = { show: true, message, color: 'error' }
}

const formData = ref({
  name: '',
  code: '',
  native_name: '',
  is_active: true,
})

const headers = [
  { title: 'Language', key: 'name', sortable: true },
  { title: 'Code', key: 'code', sortable: true },
  { title: 'Status', key: 'is_active', sortable: true },
  { title: 'Created', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]

const statusOptions = [
  { title: 'All', value: 'all' },
  { title: 'Active', value: 'true' },
  { title: 'Inactive', value: 'false' },
]

const activeCount = computed(() => tableItems.value.filter(l => l.is_active).length)
const inactiveCount = computed(() => tableItems.value.filter(l => !l.is_active).length)

const formatDate = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'MMM d, yyyy')
}

let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchLanguages()
  }, 300)
}

const fetchLanguages = async () => {
  try {
    await store.fetchLanguages({
      search: searchQuery.value || undefined,
      is_active: statusFilter.value !== 'all' ? statusFilter.value : undefined,
    })
  } catch (error) {
    showError(error.message || 'Failed to fetch languages')
  }
}

const openAddDialog = () => {
  editingLanguage.value = null
  formData.value = {
    name: '',
    code: '',
    native_name: '',
    is_active: true,
  }
  dialogVisible.value = true
}

const openEditDialog = (language) => {
  editingLanguage.value = language
  formData.value = {
    name: language.name,
    code: language.code,
    native_name: language.native_name || '',
    is_active: language.is_active,
  }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  editingLanguage.value = null
}

const saveLanguage = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  try {
    if (editingLanguage.value) {
      await store.updateLanguage(editingLanguage.value._id, formData.value)
      showSuccess('Language updated successfully')
    } else {
      await store.createLanguage(formData.value)
      showSuccess('Language created successfully')
    }
    closeDialog()
  } catch (error) {
    showError(error.message || 'Failed to save language')
  }
}

const toggleStatus = async (language) => {
  try {
    await store.updateLanguage(language._id, { is_active: !language.is_active })
    showSuccess(`Language ${language.is_active ? 'deactivated' : 'activated'} successfully`)
  } catch (error) {
    showError(error.message || 'Failed to update status')
  }
}

const seedDefaults = async () => {
  seeding.value = true
  try {
    await store.seedDefaults()
    showSuccess('Default languages seeded successfully')
  } catch (error) {
    showError(error.message || 'Failed to seed defaults')
  } finally {
    seeding.value = false
  }
}

onMounted(() => {
  fetchLanguages()
})
</script>
