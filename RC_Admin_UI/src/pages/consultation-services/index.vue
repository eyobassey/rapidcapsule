<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Consultation Services</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Manage consultation services that specialists can offer</p>
      </div>
      <div class="d-flex gap-2">
        <VBtn variant="outlined" prepend-icon="mdi-seed" @click="seedDefaults" :loading="seeding">
          Seed Defaults
        </VBtn>
        <VBtn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
          Add Service
        </VBtn>
      </div>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="primary" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-medical-bag</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ tableItems.length }}</div>
              <div class="text-body-2 text-medium-emphasis">Total Services</div>
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
              <div class="text-body-2 text-medium-emphasis">Active Services</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="warning" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-star</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ defaultCount }}</div>
              <div class="text-body-2 text-medium-emphasis">Default Services</div>
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
              placeholder="Search services..."
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
              @update:model-value="fetchServices"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="pricingFilter"
              :items="pricingOptions"
              label="Pricing Type"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="fetchServices"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Data Table -->
    <VCard>
      <VTable v-if="filteredItems.length > 0">
        <thead>
          <tr>
            <th style="width: 40px">#</th>
            <th>Service</th>
            <th>Slug</th>
            <th>Pricing Type</th>
            <th>Min Rate</th>
            <th>Default</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in filteredItems" :key="item._id">
            <td>{{ index + 1 }}</td>
            <td>
              <div class="d-flex align-center gap-2">
                <VAvatar
                  :color="item.icon_bg_color || '#E3F2FD'"
                  :style="{ background: item.icon_bg_color }"
                  size="40"
                >
                  <VIcon :color="item.icon_color || '#1976D2'">{{ getVuetifyIcon(item.icon) }}</VIcon>
                </VAvatar>
                <div>
                  <div class="font-weight-medium">{{ item.name }}</div>
                  <div class="text-caption text-medium-emphasis text-truncate" style="max-width: 200px">
                    {{ item.description }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <VChip size="small" color="secondary" variant="tonal">
                {{ item.slug }}
              </VChip>
            </td>
            <td>
              <VChip
                :color="item.pricing_type === 'routine_urgent' ? 'info' : 'warning'"
                size="small"
                variant="tonal"
              >
                {{ item.pricing_type === 'routine_urgent' ? 'Routine + Urgent' : 'Flat Rate' }}
              </VChip>
            </td>
            <td>
              <span class="font-weight-medium">{{ formatCurrency(item.min_rate) }}</span>
            </td>
            <td>
              <VChip
                v-if="item.is_default"
                color="primary"
                size="small"
                variant="tonal"
              >
                Default
              </VChip>
              <span v-else class="text-medium-emphasis">-</span>
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
            <td>
              <VBtn icon="mdi-pencil" variant="text" size="small" @click="openEditDialog(item)" />
              <VBtn
                :icon="item.is_active ? 'mdi-eye-off' : 'mdi-eye'"
                variant="text"
                size="small"
                :color="item.is_active ? 'error' : 'success'"
                @click="toggleStatus(item)"
              />
              <VBtn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click="confirmDelete(item)"
              />
            </td>
          </tr>
        </tbody>
      </VTable>
      <div v-else-if="store.isLoading" class="pa-4 text-center">
        <VProgressCircular indeterminate color="primary" />
      </div>
      <div v-else class="pa-4 text-center text-medium-emphasis">
        No consultation services found
      </div>
    </VCard>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="dialogVisible" max-width="700" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ editingService ? 'Edit Service' : 'Add Service' }}</span>
          <VBtn icon="mdi-close" variant="text" @click="closeDialog" />
        </VCardTitle>

        <VCardText>
          <VForm ref="formRef" @submit.prevent="saveService">
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="formData.name"
                  label="Service Name *"
                  placeholder="e.g., Video Consultation"
                  :rules="[v => !!v || 'Name is required']"
                  required
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="formData.slug"
                  label="Slug *"
                  placeholder="e.g., video_consultation"
                  hint="Unique identifier (lowercase, underscores)"
                  :rules="[
                    v => !!v || 'Slug is required',
                    v => /^[a-z0-9_]+$/.test(v) || 'Only lowercase letters, numbers, and underscores'
                  ]"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="formData.description"
                  label="Description *"
                  placeholder="Brief description of the service"
                  rows="2"
                  :rules="[v => !!v || 'Description is required']"
                  required
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="formData.icon"
                  label="Icon Name"
                  placeholder="e.g., hi-video-camera"
                  hint="oh-vue-icons name"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="formData.icon_color"
                  label="Icon Color"
                  placeholder="#1976D2"
                  type="color"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="formData.icon_bg_color"
                  label="Icon Background"
                  placeholder="#E3F2FD"
                  type="color"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="formData.pricing_type"
                  :items="pricingTypeOptions"
                  label="Pricing Type *"
                  hint="Flat = single rate, Routine+Urgent = separate rates"
                  persistent-hint
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model.number="formData.min_rate"
                  label="Minimum Rate (NGN)"
                  type="number"
                  :min="0"
                  placeholder="2000"
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="formData.info_text"
                  label="Info Text"
                  placeholder="Optional helper text shown below the service card"
                  hint="Displayed to specialists when configuring rates"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VSwitch
                  v-model="formData.is_active"
                  label="Active"
                  color="success"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VSwitch
                  v-model="formData.is_default"
                  label="Default Service"
                  color="primary"
                  hint="Pre-enabled for new specialists"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VSwitch
                  v-model="formData.show_ai_badge"
                  label="Show AI Badge"
                  color="warning"
                  hint="Show 'AI Triage' badge"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="closeDialog">Cancel</VBtn>
          <VBtn color="primary" :loading="store.isLoading" @click="saveService">
            {{ editingService ? 'Update' : 'Create' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="deleteDialogVisible" max-width="400">
      <VCard>
        <VCardTitle>Delete Service</VCardTitle>
        <VCardText>
          Are you sure you want to delete <strong>{{ deletingService?.name }}</strong>?
          This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="deleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" :loading="store.isLoading" @click="deleteService">
            Delete
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
import { useConsultationServicesStore } from '@/stores/consultation-services'
import { format } from 'date-fns'

const store = useConsultationServicesStore()

// Local ref for table items
const tableItems = ref([])

// Sync store data to local ref
watch(() => store.services, (newVal) => {
  tableItems.value = Array.isArray(newVal) ? [...newVal] : []
}, { immediate: true, deep: true })

const searchQuery = ref('')
const statusFilter = ref('all')
const pricingFilter = ref('all')
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const editingService = ref(null)
const deletingService = ref(null)
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
  slug: '',
  description: '',
  icon: 'hi-video-camera',
  icon_color: '#1976D2',
  icon_bg_color: '#E3F2FD',
  pricing_type: 'routine_urgent',
  min_rate: 2000,
  info_text: '',
  is_active: true,
  is_default: false,
  show_ai_badge: false,
})

const statusOptions = [
  { title: 'All', value: 'all' },
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]

const pricingOptions = [
  { title: 'All', value: 'all' },
  { title: 'Flat Rate', value: 'flat' },
  { title: 'Routine + Urgent', value: 'routine_urgent' },
]

const pricingTypeOptions = [
  { title: 'Routine + Urgent (separate rates)', value: 'routine_urgent' },
  { title: 'Flat Rate (single rate)', value: 'flat' },
]

const activeCount = computed(() => tableItems.value.filter(s => s.is_active).length)
const defaultCount = computed(() => tableItems.value.filter(s => s.is_default).length)

const filteredItems = computed(() => {
  let items = tableItems.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.slug.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value === 'active') {
    items = items.filter(s => s.is_active)
  } else if (statusFilter.value === 'inactive') {
    items = items.filter(s => !s.is_active)
  }

  // Filter by pricing type
  if (pricingFilter.value !== 'all') {
    items = items.filter(s => s.pricing_type === pricingFilter.value)
  }

  return items
})

const formatCurrency = (amount) => {
  if (!amount) return '-'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

const getVuetifyIcon = (iconName) => {
  // Map oh-vue-icons names to mdi icons
  const iconMap = {
    'hi-video-camera': 'mdi-video',
    'hi-phone': 'mdi-phone',
    'hi-chat-alt-2': 'mdi-chat',
    'ri-file-list-3-line': 'mdi-file-document',
    'hi-document-text': 'mdi-file-document-outline',
    'hi-heart': 'mdi-heart',
    'hi-clipboard-list': 'mdi-clipboard-list',
  }
  return iconMap[iconName] || 'mdi-medical-bag'
}

let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // Search is done client-side via computed
  }, 300)
}

const fetchServices = async () => {
  try {
    await store.fetchServices(true) // Include inactive
  } catch (error) {
    showError(error.message || 'Failed to fetch services')
  }
}

const openAddDialog = () => {
  editingService.value = null
  formData.value = {
    name: '',
    slug: '',
    description: '',
    icon: 'hi-video-camera',
    icon_color: '#1976D2',
    icon_bg_color: '#E3F2FD',
    pricing_type: 'routine_urgent',
    min_rate: 2000,
    info_text: '',
    is_active: true,
    is_default: false,
    show_ai_badge: false,
  }
  dialogVisible.value = true
}

const openEditDialog = (service) => {
  editingService.value = service
  formData.value = {
    name: service.name,
    slug: service.slug,
    description: service.description,
    icon: service.icon || 'hi-video-camera',
    icon_color: service.icon_color || '#1976D2',
    icon_bg_color: service.icon_bg_color || '#E3F2FD',
    pricing_type: service.pricing_type || 'routine_urgent',
    min_rate: service.min_rate || 2000,
    info_text: service.info_text || '',
    is_active: service.is_active !== false,
    is_default: service.is_default === true,
    show_ai_badge: service.show_ai_badge === true,
  }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  editingService.value = null
}

const saveService = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  try {
    if (editingService.value) {
      await store.updateService(editingService.value._id, formData.value)
      showSuccess('Service updated successfully')
    } else {
      await store.createService(formData.value)
      showSuccess('Service created successfully')
    }
    closeDialog()
  } catch (error) {
    showError(error.message || 'Failed to save service')
  }
}

const toggleStatus = async (service) => {
  try {
    await store.toggleServiceStatus(service._id, !service.is_active)
    showSuccess(`Service ${service.is_active ? 'deactivated' : 'activated'} successfully`)
  } catch (error) {
    showError(error.message || 'Failed to update status')
  }
}

const confirmDelete = (service) => {
  deletingService.value = service
  deleteDialogVisible.value = true
}

const deleteService = async () => {
  try {
    await store.deleteService(deletingService.value._id)
    showSuccess('Service deleted successfully')
    deleteDialogVisible.value = false
    deletingService.value = null
  } catch (error) {
    showError(error.message || 'Failed to delete service')
  }
}

const seedDefaults = async () => {
  seeding.value = true
  try {
    const result = await store.seedDefaultServices()
    showSuccess(`Seeded ${result.created} services, ${result.skipped} already existed`)
  } catch (error) {
    showError(error.message || 'Failed to seed defaults')
  } finally {
    seeding.value = false
  }
}

onMounted(() => {
  fetchServices()
})
</script>
