<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Specialist Categories</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Manage medical specialty categories for appointments</p>
      </div>
      <div class="d-flex gap-2">
        <VBtn variant="outlined" prepend-icon="mdi-seed" @click="seedDefaults" :loading="seeding">
          Seed Defaults
        </VBtn>
        <VBtn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
          Add Category
        </VBtn>
      </div>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="primary" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-folder-multiple</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ store.total }}</div>
              <div class="text-body-2 text-medium-emphasis">Total Categories</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-check-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ activeCount }}</div>
              <div class="text-body-2 text-medium-emphasis">Active</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="warning" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-star</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ popularCount }}</div>
              <div class="text-body-2 text-medium-emphasis">Popular</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="error" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-close-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ inactiveCount }}</div>
              <div class="text-body-2 text-medium-emphasis">Inactive</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Search and Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" md="4">
            <VTextField
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search categories..."
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
              @update:model-value="fetchCategories"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="professionalCategoryFilter"
              :items="professionalCategoryOptions"
              label="Professional Category"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="fetchCategories"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="popularFilter"
              :items="popularOptions"
              label="Popular"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="fetchCategories"
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
            <th>Name</th>
            <th>Category</th>
            <th>Popular</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tableItems" :key="item._id">
            <td>
              <div class="d-flex align-center gap-3">
                <VAvatar color="primary" variant="tonal" size="40">
                  <VIcon>{{ getIconName(item.icon) }}</VIcon>
                </VAvatar>
                <div>
                  <div class="font-weight-medium">{{ item.name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ item.slug }}</div>
                </div>
              </div>
            </td>
            <td>
              <VChip size="small" :color="getProfessionalCategoryColor(item.professional_category)" variant="tonal">
                {{ item.professional_category }}
              </VChip>
            </td>
            <td>
              <VIcon v-if="item.is_popular" color="warning" size="20">mdi-star</VIcon>
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
            </td>
          </tr>
        </tbody>
      </VTable>
      <div v-else class="pa-4 text-center text-medium-emphasis">
        No categories found
      </div>
    </VCard>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="dialogVisible" max-width="600" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ editingCategory ? 'Edit Category' : 'Add Category' }}</span>
          <VBtn icon="mdi-close" variant="text" @click="closeDialog" />
        </VCardTitle>

        <VCardText>
          <VForm ref="formRef" @submit.prevent="saveCategory">
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="formData.name"
                  label="Category Name"
                  placeholder="e.g., Cardiologist"
                  :rules="[v => !!v || 'Name is required']"
                  required
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="formData.slug"
                  label="Slug"
                  placeholder="e.g., cardiologist"
                  hint="URL-friendly identifier (auto-generated if empty)"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="formData.icon"
                  label="Icon"
                  placeholder="e.g., fa-heartbeat"
                  hint="Font Awesome icon name"
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="formData.description"
                  label="Description"
                  placeholder="Brief description of this specialty..."
                  rows="2"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="formData.professional_category"
                  :items="store.professionalCategoryOptions"
                  label="Professional Category"
                  :rules="[v => !!v || 'Professional category is required']"
                  required
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model.number="formData.display_order"
                  label="Display Order"
                  type="number"
                  min="0"
                  hint="Lower numbers appear first"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSwitch
                  v-model="formData.is_popular"
                  label="Popular Category"
                  color="warning"
                  hint="Show in featured section"
                />
              </VCol>
              <VCol cols="12" md="6">
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
          <VBtn color="primary" :loading="store.loading" @click="saveCategory">
            {{ editingCategory ? 'Update' : 'Create' }}
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
import { useSpecialistCategoriesStore } from '@/stores/specialist-categories'

const store = useSpecialistCategoriesStore()

// Local ref for table items - VDataTable works better with local refs than Pinia store proxies
const tableItems = ref([])

// Sync store data to local ref
watch(() => store.categories, (newVal) => {
  tableItems.value = Array.isArray(newVal) ? [...newVal] : []
}, { immediate: true, deep: true })

const searchQuery = ref('')
const statusFilter = ref('all')
const professionalCategoryFilter = ref('')
const popularFilter = ref('all')
const dialogVisible = ref(false)
const editingCategory = ref(null)
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
  icon: 'fa-user-md',
  professional_category: 'Specialist',
  is_popular: false,
  display_order: 0,
  is_active: true,
})

const headers = [
  { title: 'Category', key: 'name', sortable: true },
  { title: 'Professional Type', key: 'professional_category', sortable: true },
  { title: 'Popular', key: 'is_popular', sortable: true },
  { title: 'Order', key: 'display_order', sortable: true },
  { title: 'Status', key: 'is_active', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]

const statusOptions = [
  { title: 'All', value: 'all' },
  { title: 'Active', value: 'true' },
  { title: 'Inactive', value: 'false' },
]

const popularOptions = [
  { title: 'All', value: 'all' },
  { title: 'Popular Only', value: 'true' },
  { title: 'Not Popular', value: 'false' },
]

const professionalCategoryOptions = computed(() => [
  { title: 'All', value: '' },
  ...store.professionalCategoryOptions.map(c => ({ title: c, value: c })),
])

const activeCount = computed(() => tableItems.value.filter(c => c.is_active).length)
const inactiveCount = computed(() => tableItems.value.filter(c => !c.is_active).length)
const popularCount = computed(() => tableItems.value.filter(c => c.is_active && c.is_popular).length)

const getIconName = (icon) => {
  // Map Font Awesome icons to MDI icons for display
  const iconMap = {
    'fa-user-md': 'mdi-doctor',
    'fa-baby': 'mdi-baby-face-outline',
    'fa-allergies': 'mdi-face-man-shimmer',
    'fa-heartbeat': 'mdi-heart-pulse',
    'fa-female': 'mdi-human-female',
    'fa-brain': 'mdi-brain',
    'fa-bone': 'mdi-bone',
    'fa-pills': 'mdi-pill',
    'fa-lungs': 'mdi-lungs',
    'fa-eye': 'mdi-eye',
    'fa-prescription-bottle-alt': 'mdi-bottle-tonic-plus',
    'fa-comments': 'mdi-message-text',
    'fa-stethoscope': 'mdi-stethoscope',
  }
  return iconMap[icon] || 'mdi-folder-account'
}

const getProfessionalCategoryColor = (category) => {
  const colorMap = {
    'Specialist': 'primary',
    'Medical Doctor': 'success',
    'Pharmacist': 'info',
    'Therapist': 'warning',
    'Nurse': 'secondary',
    'Dentist': 'error',
  }
  return colorMap[category] || 'default'
}

let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchCategories()
  }, 300)
}

const fetchCategories = async () => {
  try {
    await store.fetchCategories({
      search: searchQuery.value || undefined,
      is_active: statusFilter.value !== 'all' ? statusFilter.value : undefined,
      is_popular: popularFilter.value !== 'all' ? popularFilter.value : undefined,
      professional_category: professionalCategoryFilter.value || undefined,
    })
  } catch (error) {
    showError(error.message || 'Failed to fetch categories')
  }
}

const openAddDialog = () => {
  editingCategory.value = null
  formData.value = {
    name: '',
    slug: '',
    description: '',
    icon: 'fa-user-md',
    professional_category: 'Specialist',
    is_popular: false,
    display_order: 0,
    is_active: true,
  }
  dialogVisible.value = true
}

const openEditDialog = (category) => {
  editingCategory.value = category
  formData.value = {
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    icon: category.icon || 'fa-user-md',
    professional_category: category.professional_category,
    is_popular: category.is_popular,
    display_order: category.display_order || 0,
    is_active: category.is_active,
  }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  editingCategory.value = null
}

const saveCategory = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  try {
    if (editingCategory.value) {
      await store.updateCategory(editingCategory.value._id, formData.value)
      showSuccess('Category updated successfully')
    } else {
      await store.createCategory(formData.value)
      showSuccess('Category created successfully')
    }
    closeDialog()
  } catch (error) {
    showError(error.message || 'Failed to save category')
  }
}

const toggleStatus = async (category) => {
  try {
    await store.updateCategory(category._id, { is_active: !category.is_active })
    showSuccess(`Category ${category.is_active ? 'deactivated' : 'activated'} successfully`)
  } catch (error) {
    showError(error.message || 'Failed to update status')
  }
}

const seedDefaults = async () => {
  seeding.value = true
  try {
    await store.seedDefaults()
    showSuccess('Default categories seeded successfully')
  } catch (error) {
    showError(error.message || 'Failed to seed defaults')
  } finally {
    seeding.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>
