<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Ratings & Reviews</h1>
        <p class="text-subtitle-1 text-medium-emphasis">View all customer ratings and reviews</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="warning" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-star</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.averageRating }}</div>
              <div class="text-body-2 text-medium-emphasis">Average Rating</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="primary" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-message-star</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.totalRatings }}</div>
              <div class="text-body-2 text-medium-emphasis">Total Reviews</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-truck-delivery</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.pharmacyOrderRatings }}</div>
              <div class="text-body-2 text-medium-emphasis">Pharmacy Orders</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="info" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-prescription</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.prescriptionRatings }}</div>
              <div class="text-body-2 text-medium-emphasis">Prescriptions</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Rating Distribution -->
    <VCard class="mb-6">
      <VCardTitle>Rating Distribution</VCardTitle>
      <VCardText>
        <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="d-flex align-center mb-2">
          <div class="d-flex align-center" style="width: 60px;">
            <span class="me-1">{{ star }}</span>
            <VIcon color="warning" size="16">mdi-star</VIcon>
          </div>
          <VProgressLinear
            :model-value="getDistributionPercent(star)"
            color="warning"
            height="20"
            rounded
            class="flex-grow-1 mx-3"
          >
            <template #default>
              <span class="text-caption">{{ stats.distribution?.[star] || 0 }}</span>
            </template>
          </VProgressLinear>
          <span class="text-body-2" style="width: 50px;">{{ getDistributionPercent(star) }}%</span>
        </div>
      </VCardText>
    </VCard>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" md="3">
            <VSelect
              v-model="typeFilter"
              label="Order Type"
              :items="typeOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchRatings"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="minRating"
              label="Min Rating"
              :items="[1, 2, 3, 4, 5]"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchRatings"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="maxRating"
              label="Max Rating"
              :items="[1, 2, 3, 4, 5]"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchRatings"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="itemsPerPage"
              label="Per Page"
              :items="[10, 25, 50, 100]"
              variant="outlined"
              density="compact"
              @update:model-value="fetchRatings"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Ratings Table -->
    <VCard>
      <VCardText>
        <VProgressLinear v-if="loading" indeterminate color="primary" />

        <VTable v-if="ratings.length > 0">
          <thead>
            <tr>
              <th>Order</th>
              <th>Type</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Patient</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rating in ratings" :key="rating._id">
              <td>
                <div class="font-weight-medium text-primary">
                  {{ rating.order_number }}
                </div>
                <VChip :color="getStatusColor(rating.status)" size="x-small" class="mt-1">
                  {{ rating.status }}
                </VChip>
              </td>
              <td>
                <VChip
                  :color="rating.type === 'pharmacy_order' ? 'success' : 'info'"
                  size="small"
                  variant="tonal"
                >
                  <VIcon start size="14">
                    {{ rating.type === 'pharmacy_order' ? 'mdi-truck-delivery' : 'mdi-prescription' }}
                  </VIcon>
                  {{ rating.type === 'pharmacy_order' ? 'Pharmacy Order' : 'Prescription' }}
                </VChip>
              </td>
              <td>
                <div class="d-flex align-center">
                  <span v-for="star in 5" :key="star" class="me-1">
                    <VIcon :color="star <= rating.rating ? 'warning' : 'grey-lighten-1'" size="18">
                      mdi-star
                    </VIcon>
                  </span>
                  <span class="ms-2 font-weight-medium">{{ rating.rating }}/5</span>
                </div>
              </td>
              <td style="max-width: 300px;">
                <div v-if="rating.review" class="text-body-2" style="white-space: pre-wrap;">
                  "{{ rating.review }}"
                </div>
                <span v-else class="text-medium-emphasis">No review</span>
              </td>
              <td>
                <div v-if="rating.patient">
                  <div class="font-weight-medium">{{ rating.patient.name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ rating.patient.email }}</div>
                </div>
                <span v-else class="text-medium-emphasis">Unknown</span>
              </td>
              <td>
                <div>{{ formatDate(rating.rated_at) }}</div>
                <div class="text-caption text-medium-emphasis">{{ formatTime(rating.rated_at) }}</div>
              </td>
            </tr>
          </tbody>
        </VTable>

        <VAlert v-else-if="!loading" type="info" variant="tonal">
          No ratings found matching your criteria
        </VAlert>

        <!-- Pagination -->
        <div class="d-flex justify-center mt-4" v-if="totalPages > 1">
          <VPagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="fetchRatings"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

// API Base URL
const API_BASE = '/admin-api/pharmacy'

// State
const loading = ref(false)
const ratings = ref([])
const totalPages = ref(1)
const currentPage = ref(1)
const itemsPerPage = ref(25)
const typeFilter = ref(null)
const minRating = ref(null)
const maxRating = ref(null)

// Stats
const stats = reactive({
  totalRatings: 0,
  averageRating: 0,
  pharmacyOrderRatings: 0,
  prescriptionRatings: 0,
  distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
})

// Options
const typeOptions = [
  { title: 'Pharmacy Orders', value: 'pharmacy_order' },
  { title: 'Prescriptions', value: 'prescription' },
]

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
})

// Auth Headers
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.access_token}`,
  }
}

// Fetch Stats
const fetchStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/ratings/stats`, {
      headers: getAuthHeaders(),
    })

    const data = await response.json()

    if (response.ok && data.data) {
      Object.assign(stats, data.data)
    }
  } catch (error) {
    console.error('Fetch stats error:', error)
  }
}

// Fetch Ratings
const fetchRatings = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: itemsPerPage.value,
    })
    if (typeFilter.value) params.append('type', typeFilter.value)
    if (minRating.value) params.append('minRating', minRating.value)
    if (maxRating.value) params.append('maxRating', maxRating.value)

    const response = await fetch(`${API_BASE}/ratings?${params}`, {
      headers: getAuthHeaders(),
    })

    const data = await response.json()

    if (response.ok && data.data) {
      const result = data.data
      ratings.value = result.ratings || []
      totalPages.value = result.totalPages || 1
    } else {
      console.error('Fetch ratings failed:', response.status, data)
      showSnackbar(data.errorMessage || data.message || 'Failed to fetch ratings', 'error')
    }
  } catch (error) {
    console.error('Fetch ratings error:', error)
    showSnackbar('Failed to fetch ratings', 'error')
  } finally {
    loading.value = false
  }
}

// Helpers
const getDistributionPercent = (star) => {
  if (!stats.totalRatings) return 0
  return Math.round((stats.distribution?.[star] || 0) / stats.totalRatings * 100)
}

const getStatusColor = (status) => {
  const colors = {
    DELIVERED: 'success',
    COMPLETED: 'success',
    delivered: 'success',
    completed: 'success',
    CANCELLED: 'error',
    cancelled: 'error',
    PENDING: 'warning',
    pending: 'warning',
  }
  return colors[status] || 'grey'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const showSnackbar = (message, color = 'success') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

// Initialize
onMounted(() => {
  fetchStats()
  fetchRatings()
})
</script>
