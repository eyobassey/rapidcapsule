<script setup>
import { ref, onMounted, computed } from 'vue'
import { useClaudeSummaryStore } from '@/stores/claudeSummary'

const store = useClaudeSummaryStore()

const loading = ref(false)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedPlan = ref(null)
const snackbar = ref({ show: false, message: '', color: 'success' })

const planTypes = [
  { title: 'Credit Bundle', value: 'bundle' },
  { title: 'Monthly Unlimited', value: 'unlimited_monthly' },
  { title: 'Yearly Unlimited', value: 'unlimited_yearly' },
]

const defaultForm = {
  name: '',
  type: 'bundle',
  credits: null,
  price: 0,
  currency: 'NGN',
  duration_days: null,
  is_active: true,
  sort_order: 0,
  description: '',
}

const form = ref({ ...defaultForm })

const plans = computed(() => store.plans || [])

const isBundle = computed(() => form.value.type === 'bundle')

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Type', key: 'type' },
  { title: 'Credits', key: 'credits' },
  { title: 'Price', key: 'price' },
  { title: 'Duration', key: 'duration_days' },
  { title: 'Status', key: 'is_active' },
  { title: 'Order', key: 'sort_order' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const fetchPlans = async () => {
  loading.value = true
  await store.fetchPlans(true)
  loading.value = false
}

const openCreateDialog = () => {
  form.value = { ...defaultForm }
  showCreateDialog.value = true
}

const openEditDialog = (plan) => {
  selectedPlan.value = plan
  form.value = {
    name: plan.name,
    type: plan.type,
    credits: plan.credits,
    price: plan.price,
    currency: plan.currency || 'NGN',
    duration_days: plan.duration_days,
    is_active: plan.is_active,
    sort_order: plan.sort_order || 0,
    description: plan.description || '',
  }
  showEditDialog.value = true
}

const openDeleteDialog = (plan) => {
  selectedPlan.value = plan
  showDeleteDialog.value = true
}

const createPlan = async () => {
  try {
    const adminId = localStorage.getItem('adminId') || '000000000000000000000000'
    await store.createPlan({ ...form.value, admin_id: adminId })
    showCreateDialog.value = false
    snackbar.value = { show: true, message: 'Plan created successfully', color: 'success' }
  } catch (error) {
    snackbar.value = { show: true, message: error.response?.data?.message || 'Failed to create plan', color: 'error' }
  }
}

const updatePlan = async () => {
  try {
    await store.updatePlan(selectedPlan.value._id, form.value)
    showEditDialog.value = false
    snackbar.value = { show: true, message: 'Plan updated successfully', color: 'success' }
  } catch (error) {
    snackbar.value = { show: true, message: error.response?.data?.message || 'Failed to update plan', color: 'error' }
  }
}

const deletePlan = async () => {
  try {
    await store.deletePlan(selectedPlan.value._id)
    showDeleteDialog.value = false
    snackbar.value = { show: true, message: 'Plan deleted successfully', color: 'success' }
  } catch (error) {
    snackbar.value = { show: true, message: error.response?.data?.message || 'Failed to delete plan', color: 'error' }
  }
}

const seedDefaultPlans = async () => {
  try {
    loading.value = true
    const adminId = localStorage.getItem('adminId') || '000000000000000000000000'
    const result = await store.seedDefaultPlans(adminId)
    snackbar.value = { show: true, message: `Created ${result.created} default plans`, color: 'success' }
  } catch (error) {
    snackbar.value = { show: true, message: error.response?.data?.message || 'Failed to seed plans', color: 'error' }
  } finally {
    loading.value = false
  }
}

const formatPlanType = (type) => {
  const typeMap = {
    bundle: 'Bundle',
    unlimited_monthly: 'Monthly',
    unlimited_yearly: 'Yearly',
  }
  return typeMap[type] || type
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price)
}

onMounted(() => {
  fetchPlans()
})
</script>

<template>
  <div>
    <!-- Header -->
    <VCard class="mb-6" color="primary" variant="tonal">
      <VCardText class="d-flex align-center justify-space-between flex-wrap" style="gap: 16px">
        <div>
          <h2 class="text-h4 font-weight-bold mb-2">Health Summary Plans</h2>
          <p class="text-subtitle-1 mb-0">Manage pricing plans for AI Health Summary credits</p>
        </div>
        <div class="d-flex" style="gap: 12px">
          <VBtn color="secondary" variant="outlined" @click="seedDefaultPlans" :loading="loading">
            <VIcon start>mdi-database-plus</VIcon>
            Seed Default Plans
          </VBtn>
          <VBtn color="primary" @click="openCreateDialog">
            <VIcon start>mdi-plus</VIcon>
            Create Plan
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Plans Table -->
    <VCard>
      <VCardText>
        <VTable hover>
          <thead>
            <tr>
              <th class="text-left">Name</th>
              <th class="text-left">Type</th>
              <th class="text-left">Credits</th>
              <th class="text-left">Price</th>
              <th class="text-left">Duration</th>
              <th class="text-left">Status</th>
              <th class="text-left">Order</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in plans" :key="plan._id">
              <td>{{ plan.name }}</td>
              <td>
                <VChip :color="plan.type === 'bundle' ? 'info' : 'success'" size="small">
                  {{ formatPlanType(plan.type) }}
                </VChip>
              </td>
              <td>
                <span v-if="plan.credits">{{ plan.credits }} credits</span>
                <VChip v-else color="success" size="small">Unlimited</VChip>
              </td>
              <td>{{ formatPrice(plan.price) }}</td>
              <td>
                <span v-if="plan.duration_days">{{ plan.duration_days }} days</span>
                <span v-else class="text-medium-emphasis">N/A</span>
              </td>
              <td>
                <VChip :color="plan.is_active ? 'success' : 'error'" size="small">
                  {{ plan.is_active ? 'Active' : 'Inactive' }}
                </VChip>
              </td>
              <td>{{ plan.sort_order }}</td>
              <td class="text-center">
                <VBtn icon size="small" variant="text" color="primary" @click="openEditDialog(plan)">
                  <VIcon>mdi-pencil</VIcon>
                </VBtn>
                <VBtn icon size="small" variant="text" color="error" @click="openDeleteDialog(plan)">
                  <VIcon>mdi-delete</VIcon>
                </VBtn>
              </td>
            </tr>
            <tr v-if="plans.length === 0">
              <td colspan="8" class="text-center py-4 text-medium-emphasis">
                No plans found. Click "Create Plan" or "Seed Default Plans" to add plans.
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>

    <!-- Create Dialog -->
    <VDialog v-model="showCreateDialog" max-width="600">
      <VCard>
        <VCardTitle class="text-h5 pa-4 bg-primary">
          <VIcon start>mdi-plus-circle</VIcon>
          Create New Plan
        </VCardTitle>
        <VCardText class="pa-4">
          <VForm @submit.prevent="createPlan">
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.name"
                  label="Plan Name"
                  required
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="form.type"
                  :items="planTypes"
                  label="Plan Type"
                  required
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model.number="form.price"
                  label="Price (NGN)"
                  type="number"
                  required
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6" v-if="isBundle">
                <VTextField
                  v-model.number="form.credits"
                  label="Credits"
                  type="number"
                  required
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6" v-if="!isBundle">
                <VTextField
                  v-model.number="form.duration_days"
                  label="Duration (Days)"
                  type="number"
                  required
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model.number="form.sort_order"
                  label="Sort Order"
                  type="number"
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="form.description"
                  label="Description"
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12">
                <VSwitch
                  v-model="form.is_active"
                  label="Active"
                  color="success"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="showCreateDialog = false">Cancel</VBtn>
          <VBtn color="primary" @click="createPlan" :loading="store.loading">Create</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Dialog -->
    <VDialog v-model="showEditDialog" max-width="600">
      <VCard>
        <VCardTitle class="text-h5 pa-4 bg-primary">
          <VIcon start>mdi-pencil</VIcon>
          Edit Plan
        </VCardTitle>
        <VCardText class="pa-4">
          <VForm @submit.prevent="updatePlan">
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.name"
                  label="Plan Name"
                  required
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="form.type"
                  :items="planTypes"
                  label="Plan Type"
                  required
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model.number="form.price"
                  label="Price (NGN)"
                  type="number"
                  required
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6" v-if="isBundle">
                <VTextField
                  v-model.number="form.credits"
                  label="Credits"
                  type="number"
                  required
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6" v-if="!isBundle">
                <VTextField
                  v-model.number="form.duration_days"
                  label="Duration (Days)"
                  type="number"
                  required
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model.number="form.sort_order"
                  label="Sort Order"
                  type="number"
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="form.description"
                  label="Description"
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12">
                <VSwitch
                  v-model="form.is_active"
                  label="Active"
                  color="success"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="showEditDialog = false">Cancel</VBtn>
          <VBtn color="primary" @click="updatePlan" :loading="store.loading">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Dialog -->
    <VDialog v-model="showDeleteDialog" max-width="400">
      <VCard>
        <VCardTitle class="text-h5 pa-4 bg-error">
          <VIcon start>mdi-delete</VIcon>
          Delete Plan
        </VCardTitle>
        <VCardText class="pa-4">
          Are you sure you want to delete the plan "{{ selectedPlan?.name }}"? This action cannot be undone.
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="showDeleteDialog = false">Cancel</VBtn>
          <VBtn color="error" @click="deletePlan" :loading="store.loading">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>
