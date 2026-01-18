<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Pharmacy Orders</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Manage and process pharmacy orders</p>
      </div>
      <VBtn color="primary" prepend-icon="mdi-refresh" @click="fetchOrders" :loading="loading">
        Refresh
      </VBtn>
    </div>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" md="4">
            <VTextField
              v-model="searchQuery"
              label="Search orders..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="debouncedSearch"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="statusFilter"
              label="Status"
              :items="statusOptions"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchOrders"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="deliveryTypeFilter"
              label="Delivery Type"
              :items="deliveryTypeOptions"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchOrders"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="itemsPerPage"
              label="Per Page"
              :items="[10, 25, 50, 100]"
              variant="outlined"
              density="compact"
              @update:model-value="fetchOrders"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Orders Table -->
    <VCard>
      <VCardText>
        <VTable v-if="orders.length > 0">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Source</th>
              <th>Patient</th>
              <th>Pharmacy</th>
              <th>Items</th>
              <th>Total</th>
              <th>Delivery</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order._id">
              <td class="font-weight-medium">{{ order.order_number }}</td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>
                <div class="d-flex flex-column align-start gap-1">
                  <VChip
                    :color="order.source === 'SPECIALIST' ? 'primary' : 'secondary'"
                    size="small"
                    variant="tonal"
                  >
                    <VIcon start size="14">{{ order.source === 'SPECIALIST' ? 'mdi-doctor' : 'mdi-account' }}</VIcon>
                    {{ order.source === 'SPECIALIST' ? 'Doctor' : 'Patient' }}
                  </VChip>
                  <VChip
                    v-if="order.linked_specialist_prescription"
                    size="x-small"
                    color="info"
                    variant="outlined"
                    class="mt-1"
                  >
                    <VIcon start size="12">mdi-link</VIcon>
                    {{ order.linked_specialist_prescription.prescription_number }}
                  </VChip>
                </div>
              </td>
              <td>
                <div class="d-flex align-center">
                  <VAvatar size="32" color="primary" variant="tonal" class="me-2">
                    {{ getInitials(order.patient) }}
                  </VAvatar>
                  <span class="text-body-2">
                    {{ order.patient?.profile?.first_name }} {{ order.patient?.profile?.last_name }}
                  </span>
                </div>
              </td>
              <td>{{ order.pharmacy?.name || 'N/A' }}</td>
              <td>{{ order.items?.length || 0 }}</td>
              <td class="font-weight-medium">{{ formatPrice(order.total_amount) }}</td>
              <td>
                <VChip :color="isDeliveryOrder(order) ? 'info' : 'secondary'" size="small" variant="tonal">
                  <VIcon start size="14">{{ isDeliveryOrder(order) ? 'mdi-truck' : 'mdi-store' }}</VIcon>
                  {{ isDeliveryOrder(order) ? 'Delivery' : 'Pickup' }}
                </VChip>
              </td>
              <td>
                <VChip :color="getStatusColor(order.status)" size="small">
                  {{ formatStatus(order.status) }}
                </VChip>
              </td>
              <td>
                <VBtn size="small" variant="text" color="primary" @click="viewOrder(order._id)">
                  View
                </VBtn>
                <VMenu v-if="canUpdateStatus(order.status)">
                  <template v-slot:activator="{ props }">
                    <VBtn size="small" variant="text" v-bind="props">
                      Update
                    </VBtn>
                  </template>
                  <VList density="compact">
                    <VListItem
                      v-for="status in getNextStatuses(order.status, order.delivery_method || order.delivery_type)"
                      :key="status"
                      @click="updateOrderStatus(order._id, status)"
                    >
                      <VListItemTitle>{{ formatStatus(status) }}</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
                <!-- Fill button when status is PROCESSING -->
                <VBtn
                  v-if="canFillOrder(order)"
                  size="small"
                  variant="text"
                  color="success"
                  @click="fillOrderMedications(order._id)"
                  :loading="updating"
                >
                  Fill
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>

        <VAlert v-else-if="!loading" type="info" variant="tonal">
          No orders found matching your criteria
        </VAlert>

        <!-- Pagination -->
        <div class="d-flex justify-center mt-4" v-if="totalPages > 1">
          <VPagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="fetchOrders"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Loading Overlay -->
    <VOverlay v-model="loading" class="align-center justify-center" persistent>
      <VProgressCircular indeterminate size="64" color="primary" />
    </VOverlay>

    <!-- Status Update Confirmation Dialog -->
    <VDialog v-model="confirmDialog" max-width="400">
      <VCard>
        <VCardTitle>Confirm Status Update</VCardTitle>
        <VCardText>
          Are you sure you want to change the order status to <strong>{{ formatStatus(pendingStatus) }}</strong>?
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="text" @click="confirmDialog = false">Cancel</VBtn>
          <VBtn color="primary" @click="confirmStatusUpdate" :loading="updating">Confirm</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Simple debounce utility
const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const router = useRouter()
const loading = ref(false)
const updating = ref(false)

const orders = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = ref(25)
const searchQuery = ref('')
const statusFilter = ref(null)
const deliveryTypeFilter = ref(null)

const confirmDialog = ref(false)
const pendingOrderId = ref(null)
const pendingStatus = ref(null)

const statusOptions = [
  { title: 'Pending', value: 'PENDING' },
  { title: 'Confirmed', value: 'CONFIRMED' },
  { title: 'Paid', value: 'PAID' },
  { title: 'Processing', value: 'PROCESSING' },
  { title: 'Dispensed', value: 'DISPENSED' },
  { title: 'Ready for Pickup', value: 'READY_FOR_PICKUP' },
  { title: 'Shipped', value: 'SHIPPED' },
  { title: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { title: 'Delivered', value: 'DELIVERED' },
  { title: 'Completed', value: 'COMPLETED' },
]

const deliveryTypeOptions = [
  { title: 'Delivery', value: 'DELIVERY' },
  { title: 'Pickup', value: 'PICKUP' },
]

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price || 0)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatStatus = (status) => {
  const statusMap = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PAID: 'Paid',
    PROCESSING: 'Processing',
    DISPENSED: 'Dispensed',
    READY_FOR_PICKUP: 'Ready for Pickup',
    SHIPPED: 'Shipped',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  }
  return statusMap[status?.toUpperCase()] || status
}

const getStatusColor = (status) => {
  const colorMap = {
    PENDING: 'secondary',
    CONFIRMED: 'info',
    PAID: 'info',
    PROCESSING: 'warning',
    DISPENSED: 'primary',
    READY_FOR_PICKUP: 'primary',
    SHIPPED: 'primary',
    OUT_FOR_DELIVERY: 'primary',
    DELIVERED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'error',
    REFUNDED: 'error',
  }
  return colorMap[status?.toUpperCase()] || 'default'
}

const getInitials = (patient) => {
  if (!patient?.profile) return '?'
  const first = patient.profile.first_name?.[0] || ''
  const last = patient.profile.last_name?.[0] || ''
  return (first + last).toUpperCase()
}

const isDeliveryOrder = (order) => {
  const method = order?.delivery_method || order?.delivery_type
  return method === 'DELIVERY' || method === 'delivery'
}

const canUpdateStatus = (status) => {
  const upperStatus = status?.toUpperCase()
  return !['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(upperStatus)
}

const getNextStatuses = (currentStatus, deliveryMethod) => {
  const upperStatus = currentStatus?.toUpperCase()
  const isPickup = deliveryMethod === 'PICKUP' || deliveryMethod === 'pickup'

  const statusFlow = {
    // Patient order flow
    PENDING: ['CONFIRMED'],
    CONFIRMED: ['PROCESSING'],
    // Common flow
    PAID: ['PROCESSING'],
    PROCESSING: ['DISPENSED'],  // Processing → Fill medications → Dispensed
    DISPENSED: isPickup ? ['READY_FOR_PICKUP'] : ['OUT_FOR_DELIVERY'],
    READY_FOR_PICKUP: ['DELIVERED'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: ['COMPLETED'],
  }
  return statusFlow[upperStatus] || []
}

// Check if order can be filled (status is PROCESSING)
const canFillOrder = (order) => {
  const status = order.status?.toUpperCase()
  return status === 'PROCESSING'
}

// Fill all medications for an order
const fillOrderMedications = async (orderId) => {
  updating.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/orders/${orderId}/fill`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      await fetchOrders()
    }
  } catch (error) {
    console.error('Error filling order:', error)
  } finally {
    updating.value = false
  }
}

const viewOrder = (orderId) => {
  router.push(`/pharmacy/orders/${orderId}`)
}

const updateOrderStatus = (orderId, status) => {
  pendingOrderId.value = orderId
  pendingStatus.value = status
  confirmDialog.value = true
}

const confirmStatusUpdate = async () => {
  updating.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/orders/${pendingOrderId.value}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: pendingStatus.value }),
    })

    if (response.ok) {
      await fetchOrders()
    }
  } catch (error) {
    console.error('Error updating order status:', error)
  } finally {
    updating.value = false
    confirmDialog.value = false
  }
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: itemsPerPage.value,
    })

    if (searchQuery.value) params.append('search', searchQuery.value)
    if (statusFilter.value) params.append('status', statusFilter.value)
    if (deliveryTypeFilter.value) params.append('delivery_type', deliveryTypeFilter.value)

    const response = await fetch(`/admin-api/pharmacy/orders?${params}`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()

    if (data.statusCode === 200 && data.data) {
      orders.value = data.data.orders || data.data
      totalPages.value = data.data.totalPages || Math.ceil((data.data.total || 0) / itemsPerPage.value)
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  fetchOrders()
}, 500)

onMounted(() => {
  fetchOrders()
})
</script>
