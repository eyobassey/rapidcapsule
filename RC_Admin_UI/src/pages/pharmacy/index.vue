<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Pharmacy Portal</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Manage pharmacy orders, inventory, and prescriptions</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="warning" variant="tonal" size="48" class="me-4">
              <VIcon size="24">mdi-clock-outline</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.pendingOrders }}</div>
              <div class="text-body-2 text-medium-emphasis">Pending Orders</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="info" variant="tonal" size="48" class="me-4">
              <VIcon size="24">mdi-package-variant</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.processingOrders }}</div>
              <div class="text-body-2 text-medium-emphasis">Processing</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="tonal" size="48" class="me-4">
              <VIcon size="24">mdi-check-circle-outline</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.completedToday }}</div>
              <div class="text-body-2 text-medium-emphasis">Completed Today</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="error" variant="tonal" size="48" class="me-4">
              <VIcon size="24">mdi-alert-outline</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.lowStockItems }}</div>
              <div class="text-body-2 text-medium-emphasis">Low Stock Items</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Quick Actions -->
    <VRow class="mb-6">
      <VCol cols="12">
        <VCard>
          <VCardTitle>Quick Actions</VCardTitle>
          <VCardText>
            <div class="d-flex flex-wrap gap-3">
              <VBtn color="primary" prepend-icon="mdi-clipboard-list-outline" @click="$router.push('/pharmacy/orders')">
                View Orders
              </VBtn>
              <VBtn color="secondary" prepend-icon="mdi-pill" @click="$router.push('/pharmacy/inventory')">
                Manage Inventory
              </VBtn>
              <VBtn color="info" prepend-icon="mdi-prescription" @click="$router.push('/pharmacy/prescriptions')">
                Prescriptions
              </VBtn>
              <VBtn color="warning" prepend-icon="mdi-store" @click="$router.push('/pharmacy/pharmacies')">
                Pharmacies
              </VBtn>
              <VBtn color="error" prepend-icon="mdi-shield-alert" @click="$router.push('/pharmacy/compliance')">
                Compliance
              </VBtn>
              <VBtn variant="outlined" prepend-icon="mdi-cog" @click="$router.push('/pharmacy/settings')">
                Settings
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Recent Orders & Low Stock Alerts -->
    <VRow>
      <VCol cols="12" lg="8">
        <VCard>
          <VCardTitle class="d-flex justify-space-between align-center">
            <span>Recent Orders</span>
            <VBtn variant="text" color="primary" size="small" @click="$router.push('/pharmacy/orders')">
              View All
            </VBtn>
          </VCardTitle>
          <VCardText>
            <VTable v-if="recentOrders.length > 0">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Patient</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order._id">
                  <td>{{ order.order_number }}</td>
                  <td>{{ order.patient?.profile?.first_name }} {{ order.patient?.profile?.last_name }}</td>
                  <td>{{ order.items?.length || 0 }}</td>
                  <td>{{ formatPrice(order.total_amount) }}</td>
                  <td>
                    <VChip :color="getStatusColor(order.status)" size="small">
                      {{ formatStatus(order.status) }}
                    </VChip>
                  </td>
                  <td>
                    <VBtn size="small" variant="text" color="primary" @click="viewOrder(order._id)">
                      View
                    </VBtn>
                  </td>
                </tr>
              </tbody>
            </VTable>
            <VAlert v-else type="info" variant="tonal">
              No recent orders found
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" lg="4">
        <VCard>
          <VCardTitle class="d-flex justify-space-between align-center">
            <span>Low Stock Alerts</span>
            <VBtn variant="text" color="primary" size="small" @click="$router.push('/pharmacy/inventory?filter=low')">
              View All
            </VBtn>
          </VCardTitle>
          <VCardText>
            <VList v-if="lowStockItems.length > 0">
              <VListItem v-for="item in lowStockItems" :key="item._id">
                <template #prepend>
                  <VAvatar :color="item.quantity <= 5 ? 'error' : 'warning'" variant="tonal" size="40">
                    <VIcon>mdi-pill</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>{{ item.name }}</VListItemTitle>
                <VListItemSubtitle>{{ item.strength }} {{ item.dosage_form }}</VListItemSubtitle>
                <template #append>
                  <VChip :color="item.quantity <= 5 ? 'error' : 'warning'" size="small">
                    {{ item.quantity }} left
                  </VChip>
                </template>
              </VListItem>
            </VList>
            <VAlert v-else type="success" variant="tonal">
              All items are well stocked
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Loading Overlay -->
    <VOverlay v-model="loading" class="align-center justify-center" persistent>
      <VProgressCircular indeterminate size="64" color="primary" />
    </VOverlay>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)

const stats = ref({
  pendingOrders: 0,
  processingOrders: 0,
  completedToday: 0,
  lowStockItems: 0,
})

const recentOrders = ref([])
const lowStockItems = ref([])

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price || 0)
}

const formatStatus = (status) => {
  const statusMap = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    READY_FOR_PICKUP: 'Ready',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colorMap = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    PROCESSING: 'info',
    READY_FOR_PICKUP: 'primary',
    OUT_FOR_DELIVERY: 'primary',
    DELIVERED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'error',
    REFUNDED: 'secondary',
  }
  return colorMap[status] || 'default'
}

const viewOrder = (orderId) => {
  router.push(`/pharmacy/orders/${orderId}`)
}

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const headers = {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    }

    // Fetch pharmacy dashboard stats
    const statsResponse = await fetch('/admin-api/pharmacy/dashboard', { headers })
    const statsData = await statsResponse.json()

    if (statsData.statusCode === 200 && statsData.data) {
      stats.value = statsData.data.stats || stats.value
      recentOrders.value = statsData.data.recentOrders || []
      lowStockItems.value = statsData.data.lowStockItems || []
    }
  } catch (error) {
    console.error('Error fetching pharmacy dashboard:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>
