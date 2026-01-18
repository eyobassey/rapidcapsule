<template>
  <div>
    <!-- Back Button -->
    <VBtn variant="text" color="primary" class="mb-4" @click="$router.back()">
      <VIcon start>mdi-arrow-left</VIcon>
      Back to Orders
    </VBtn>

    <div v-if="order">
      <!-- Order Header -->
      <VRow class="mb-6">
        <VCol cols="12">
          <VCard>
            <VCardText>
              <div class="d-flex justify-space-between align-center flex-wrap">
                <div>
                  <h1 class="text-h4 font-weight-bold mb-2">Order {{ order.order_number }}</h1>
                  <div class="d-flex align-center gap-3 flex-wrap">
                    <VChip :color="getStatusColor(order.status)" size="large">
                      {{ formatStatus(order.status) }}
                    </VChip>
                    <span class="text-medium-emphasis">
                      <VIcon size="16">mdi-calendar</VIcon>
                      {{ formatDate(order.created_at) }}
                    </span>
                  </div>
                </div>
                <div class="d-flex gap-2 flex-wrap mt-4 mt-md-0">
                  <VBtn
                    v-for="status in getNextStatuses(order.status, order.delivery_method || order.delivery_type)"
                    :key="status"
                    :color="status === 'CANCELLED' ? 'error' : 'primary'"
                    :variant="status === 'CANCELLED' ? 'outlined' : 'flat'"
                    @click="updateStatus(status)"
                    :loading="updating"
                  >
                    {{ formatStatusAction(status) }}
                  </VBtn>
                  <VBtn color="secondary" variant="outlined" @click="printOrder">
                    <VIcon start>mdi-printer</VIcon>
                    Print
                  </VBtn>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Main Content -->
      <VRow>
        <!-- Left Column -->
        <VCol cols="12" lg="8">
          <!-- Order Items -->
          <VCard class="mb-6">
            <VCardTitle class="d-flex justify-space-between align-center">
              <span>Order Items ({{ order.items?.length || 0 }})</span>
              <VChip v-if="order.order_type" :color="order.order_type === 'PRESCRIPTION' ? 'warning' : 'info'" size="small">
                {{ order.order_type }}
              </VChip>
            </VCardTitle>
            <VCardText>
              <!-- Detailed Item Cards for Fulfillment -->
              <div v-for="(item, index) in order.items" :key="index" class="order-item-card mb-4 pa-4 rounded border">
                <VRow>
                  <VCol cols="12" md="8">
                    <!-- Drug Name & Generic Name -->
                    <div class="d-flex align-center mb-2">
                      <VIcon class="me-2" color="primary">mdi-pill</VIcon>
                      <div>
                        <div class="text-h6 font-weight-bold">{{ item.drug_name }}</div>
                        <div v-if="item.generic_name" class="text-caption text-medium-emphasis">
                          Generic: {{ item.generic_name }}
                        </div>
                      </div>
                    </div>

                    <!-- Drug Details Grid -->
                    <VRow class="mt-2" dense>
                      <VCol cols="6" sm="4">
                        <div class="text-caption text-medium-emphasis">Strength</div>
                        <div class="font-weight-medium">{{ item.strength || item.drug_strength || 'N/A' }}</div>
                      </VCol>
                      <VCol cols="6" sm="4">
                        <div class="text-caption text-medium-emphasis">Dosage Form</div>
                        <div class="font-weight-medium">{{ item.dosage_form || 'N/A' }}</div>
                      </VCol>
                      <VCol cols="6" sm="4">
                        <div class="text-caption text-medium-emphasis">Manufacturer</div>
                        <div class="font-weight-medium">{{ getManufacturerName(item.manufacturer) || 'N/A' }}</div>
                      </VCol>
                      <VCol cols="6" sm="4" v-if="item.batch_number">
                        <div class="text-caption text-medium-emphasis">Batch #</div>
                        <div class="font-weight-medium">{{ item.batch_number }}</div>
                      </VCol>
                      <VCol cols="6" sm="4" v-if="item.expiry_date">
                        <div class="text-caption text-medium-emphasis">Expiry</div>
                        <div class="font-weight-medium">{{ formatShortDate(item.expiry_date) }}</div>
                      </VCol>
                    </VRow>

                    <!-- Dosage Instructions -->
                    <div v-if="item.dosage_instructions" class="mt-3 pa-2 rounded bg-grey-lighten-4">
                      <div class="text-caption text-medium-emphasis mb-1">
                        <VIcon size="14" class="me-1">mdi-clipboard-text</VIcon>
                        Dosage Instructions
                      </div>
                      <div class="text-body-2">{{ item.dosage_instructions }}</div>
                      <div v-if="item.duration_days" class="text-caption mt-1">
                        Duration: {{ item.duration_days }} days
                      </div>
                    </div>

                    <!-- Prescription Badge -->
                    <div v-if="item.requires_prescription" class="mt-2">
                      <VChip size="small" :color="item.prescription_verified ? 'success' : 'warning'" variant="tonal">
                        <VIcon start size="14">{{ item.prescription_verified ? 'mdi-check-circle' : 'mdi-alert' }}</VIcon>
                        {{ item.prescription_verified ? 'Prescription Verified' : 'Requires Prescription' }}
                      </VChip>
                    </div>
                  </VCol>

                  <!-- Quantity & Price -->
                  <VCol cols="12" md="4" class="d-flex flex-column align-end justify-center">
                    <div class="text-center mb-2">
                      <div class="text-caption text-medium-emphasis">Quantity</div>
                      <VChip color="primary" size="large" class="text-h6 font-weight-bold">
                        {{ item.quantity }}
                      </VChip>
                    </div>
                    <div class="text-right">
                      <div class="text-caption text-medium-emphasis">Unit Price: {{ formatPrice(item.unit_price) }}</div>
                      <div class="text-h6 font-weight-bold text-primary">{{ formatPrice(item.total_price) }}</div>
                    </div>
                  </VCol>
                </VRow>
              </div>

              <!-- Order Summary -->
              <VDivider class="my-4" />
              <VRow>
                <VCol cols="12" md="6" offset-md="6">
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-medium-emphasis">Subtotal:</span>
                    <span class="font-weight-medium">{{ formatPrice(order.subtotal) }}</span>
                  </div>
                  <div v-if="order.delivery_fee > 0" class="d-flex justify-space-between mb-2">
                    <span class="text-medium-emphasis">Delivery Fee:</span>
                    <span>{{ formatPrice(order.delivery_fee) }}</span>
                  </div>
                  <div v-if="order.discount_amount > 0" class="d-flex justify-space-between mb-2">
                    <span class="text-medium-emphasis">Discount:</span>
                    <span class="text-success">-{{ formatPrice(order.discount_amount) }}</span>
                  </div>
                  <VDivider class="my-2" />
                  <div class="d-flex justify-space-between">
                    <span class="text-h6 font-weight-bold">Total:</span>
                    <span class="text-h6 font-weight-bold text-primary">{{ formatPrice(order.total_amount) }}</span>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Order Timeline -->
          <VCard>
            <VCardTitle>Order Timeline</VCardTitle>
            <VCardText>
              <VTimeline density="compact" side="end">
                <VTimelineItem
                  v-for="(event, index) in orderTimeline"
                  :key="index"
                  :dot-color="event.color"
                  :icon="event.icon"
                  size="small"
                >
                  <div class="d-flex justify-space-between">
                    <div>
                      <div :class="['font-weight-medium', { 'text-medium-emphasis': !event.completed && !event.current }]">
                        {{ event.title }}
                      </div>
                      <div class="text-caption text-medium-emphasis" v-if="event.time">
                        {{ formatDate(event.time) }}
                      </div>
                      <VChip
                        v-if="event.current"
                        size="x-small"
                        :color="event.color"
                        variant="tonal"
                        class="mt-1"
                      >
                        Current
                      </VChip>
                    </div>
                  </div>
                </VTimelineItem>
              </VTimeline>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Right Column -->
        <VCol cols="12" lg="4">
          <!-- Customer Info -->
          <VCard class="mb-6">
            <VCardTitle class="d-flex justify-space-between align-center">
              <span>Customer Information</span>
              <VBtn
                v-if="order.patient?._id"
                size="small"
                variant="text"
                color="primary"
                @click="viewPatient(order.patient._id)"
              >
                View Profile
              </VBtn>
            </VCardTitle>
            <VCardText>
              <div class="d-flex align-center mb-4 clickable-row" @click="viewPatient(order.patient?._id)">
                <VAvatar size="48" color="primary" variant="tonal" class="me-3">
                  {{ getInitials(order.patient) }}
                </VAvatar>
                <div>
                  <div class="font-weight-medium text-primary">
                    {{ order.patient?.profile?.first_name }} {{ order.patient?.profile?.last_name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ order.patient?.profile?.email || 'No email' }}
                  </div>
                </div>
              </div>
              <VDivider class="mb-4" />
              <div class="d-flex mb-2">
                <VIcon size="18" class="me-2 text-medium-emphasis">mdi-phone</VIcon>
                <span>{{ order.patient?.profile?.phone_number || 'N/A' }}</span>
              </div>
              <div class="d-flex">
                <VIcon size="18" class="me-2 text-medium-emphasis">mdi-email</VIcon>
                <span>{{ order.patient?.profile?.email || 'N/A' }}</span>
              </div>
            </VCardText>
          </VCard>

          <!-- Delivery/Pickup Info -->
          <VCard class="mb-6">
            <VCardTitle>{{ isDeliveryOrder ? 'Delivery Information' : 'Pickup Information' }}</VCardTitle>
            <VCardText>
              <VChip :color="isDeliveryOrder ? 'info' : 'success'" class="mb-4" size="large">
                <VIcon start>{{ isDeliveryOrder ? 'mdi-truck' : 'mdi-store' }}</VIcon>
                {{ isDeliveryOrder ? 'Home Delivery' : 'In-Store Pickup' }}
              </VChip>

              <!-- Pickup Order Details -->
              <div v-if="!isDeliveryOrder">
                <!-- Pickup Code -->
                <div v-if="order.pickup_code" class="pickup-code-box pa-4 rounded mb-4 text-center">
                  <div class="text-caption text-medium-emphasis mb-1">PICKUP CODE</div>
                  <div class="text-h4 font-weight-bold text-success" style="letter-spacing: 4px;">
                    {{ order.pickup_code }}
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">Customer must present this code</div>
                </div>

                <!-- Pickup Timeline -->
                <div class="mb-3" v-if="order.ready_for_pickup_at">
                  <div class="d-flex mb-2">
                    <VIcon size="18" class="me-2 text-success">mdi-check-circle</VIcon>
                    <div>
                      <div class="text-body-2">Ready for Pickup</div>
                      <div class="text-caption text-medium-emphasis">{{ formatDate(order.ready_for_pickup_at) }}</div>
                    </div>
                  </div>
                </div>
                <div v-if="order.pickup_deadline" class="mb-3">
                  <div class="d-flex mb-2">
                    <VIcon size="18" class="me-2 text-warning">mdi-clock-alert</VIcon>
                    <div>
                      <div class="text-body-2">Pickup Deadline</div>
                      <div class="text-caption text-medium-emphasis">{{ formatDate(order.pickup_deadline) }}</div>
                    </div>
                  </div>
                </div>
                <div v-if="order.picked_up_at" class="mb-3">
                  <div class="d-flex mb-2">
                    <VIcon size="18" class="me-2 text-primary">mdi-package-check</VIcon>
                    <div>
                      <div class="text-body-2">Picked Up</div>
                      <div class="text-caption text-medium-emphasis">{{ formatDate(order.picked_up_at) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Delivery Order Details -->
              <div v-if="isDeliveryOrder && order.delivery_address">
                <div v-if="order.delivery_address.recipient_name" class="mb-2">
                  <span class="text-medium-emphasis">Recipient: </span>
                  <span class="font-weight-medium">{{ order.delivery_address.recipient_name }}</span>
                </div>
                <div class="text-body-2 mb-1">{{ order.delivery_address.street }}</div>
                <div class="text-body-2 mb-1">{{ order.delivery_address.city }}, {{ order.delivery_address.state }}</div>
                <div class="text-body-2 mb-1">{{ order.delivery_address.country }} {{ order.delivery_address.postal_code }}</div>
                <div v-if="order.delivery_address.phone" class="mt-3">
                  <VIcon size="16" class="me-1">mdi-phone</VIcon>
                  {{ order.delivery_address.phone }}
                </div>
                <div v-if="order.delivery_address.additional_info" class="mt-3">
                  <div class="text-caption text-medium-emphasis">Notes:</div>
                  <div class="text-body-2">{{ order.delivery_address.additional_info }}</div>
                </div>
              </div>
            </VCardText>
          </VCard>

          <!-- Pharmacy Info -->
          <VCard class="mb-6" v-if="order.pharmacy">
            <VCardTitle>Pharmacy / Pickup Center</VCardTitle>
            <VCardText>
              <div class="font-weight-medium mb-2">{{ order.pharmacy.name }}</div>
              <!-- Format address object properly -->
              <div class="text-body-2 text-medium-emphasis mb-2" v-if="order.pharmacy.address">
                <template v-if="typeof order.pharmacy.address === 'object'">
                  <div>{{ order.pharmacy.address.street }}</div>
                  <div>{{ order.pharmacy.address.city }}, {{ order.pharmacy.address.state }}</div>
                  <div v-if="order.pharmacy.address.landmark" class="text-caption">
                    <VIcon size="12" class="me-1">mdi-map-marker</VIcon>
                    {{ order.pharmacy.address.landmark }}
                  </div>
                </template>
                <template v-else>
                  {{ order.pharmacy.address }}
                </template>
              </div>
              <div class="d-flex mb-1" v-if="order.pharmacy.phone">
                <VIcon size="16" class="me-2 text-medium-emphasis">mdi-phone</VIcon>
                <span class="text-body-2">{{ order.pharmacy.phone }}</span>
              </div>
              <div class="d-flex mb-1" v-if="order.pharmacy.email">
                <VIcon size="16" class="me-2 text-medium-emphasis">mdi-email</VIcon>
                <span class="text-body-2">{{ order.pharmacy.email }}</span>
              </div>
            </VCardText>
          </VCard>

          <!-- Prescription Info -->
          <VCard v-if="order.prescription">
            <VCardTitle class="d-flex align-center">
              <VIcon start color="primary">mdi-prescription</VIcon>
              Linked Prescription
            </VCardTitle>
            <VCardText>
              <!-- Prescription Number -->
              <div class="d-flex align-center mb-3">
                <VChip color="primary" variant="tonal" size="large">
                  <VIcon start size="16">mdi-file-document</VIcon>
                  {{ order.prescription.prescription_number }}
                </VChip>
              </div>

              <!-- Prescribing Doctor -->
              <div class="d-flex align-center mb-3 pa-3 rounded prescription-info-box">
                <VAvatar size="40" color="primary" variant="tonal" class="me-3">
                  <VIcon>mdi-doctor</VIcon>
                </VAvatar>
                <div>
                  <div class="text-caption text-medium-emphasis">Prescribing Doctor</div>
                  <div class="font-weight-medium">
                    Dr. {{ order.prescription.specialist?.profile?.first_name }} {{ order.prescription.specialist?.profile?.last_name }}
                  </div>
                  <div v-if="order.prescription.specialist?.professional_practice?.specialty" class="text-caption text-medium-emphasis">
                    {{ order.prescription.specialist.professional_practice.specialty }}
                  </div>
                </div>
              </div>

              <!-- Diagnosis -->
              <div v-if="order.prescription.diagnosis" class="mb-3">
                <div class="text-caption text-medium-emphasis mb-1">
                  <VIcon size="14" class="me-1">mdi-stethoscope</VIcon>
                  Diagnosis
                </div>
                <div class="text-body-2 pa-2 rounded diagnosis-box">{{ order.prescription.diagnosis }}</div>
              </div>

              <!-- Prescription Notes -->
              <div v-if="order.prescription.notes" class="mb-3">
                <div class="text-caption text-medium-emphasis mb-1">
                  <VIcon size="14" class="me-1">mdi-note-text</VIcon>
                  Doctor's Notes
                </div>
                <div class="text-body-2 pa-2 rounded prescription-info-box">{{ order.prescription.notes }}</div>
              </div>

              <!-- Prescribed Items (from specialist prescription) -->
              <div v-if="order.prescription.items?.length" class="mb-3">
                <div class="text-caption text-medium-emphasis mb-2">
                  <VIcon size="14" class="me-1">mdi-pill</VIcon>
                  Prescribed Medications ({{ order.prescription.items.length }})
                </div>
                <div class="prescribed-items-list">
                  <div
                    v-for="(item, index) in order.prescription.items"
                    :key="index"
                    class="prescribed-item pa-2 rounded mb-2"
                  >
                    <div class="font-weight-medium">{{ item.drug_name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ item.drug_strength }} | Qty: {{ item.quantity }}
                    </div>
                    <div v-if="item.dosage" class="text-caption text-medium-emphasis">
                      Dosage: {{ item.dosage }}
                    </div>
                    <div v-if="item.frequency" class="text-caption text-medium-emphasis">
                      Frequency: {{ item.frequency }}
                    </div>
                    <div v-if="item.duration_days" class="text-caption text-medium-emphasis">
                      Duration: {{ item.duration_days }} days
                    </div>
                  </div>
                </div>
              </div>

              <!-- Prescription Date -->
              <div class="d-flex align-center text-caption text-medium-emphasis">
                <VIcon size="14" class="me-1">mdi-calendar</VIcon>
                Prescribed on {{ formatDate(order.prescription.created_at) }}
              </div>

              <!-- View Full Prescription Button -->
              <VBtn
                variant="outlined"
                color="primary"
                size="small"
                class="mt-3"
                block
                @click="viewPrescription"
              >
                <VIcon start size="16">mdi-open-in-new</VIcon>
                View Full Prescription
              </VBtn>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <!-- Loading State -->
    <VCard v-else-if="loading">
      <VCardText class="text-center py-12">
        <VProgressCircular indeterminate size="48" color="primary" />
        <div class="mt-4 text-medium-emphasis">Loading order details...</div>
      </VCardText>
    </VCard>

    <!-- Error State -->
    <VCard v-else>
      <VCardText class="text-center py-12">
        <VIcon size="64" color="error" class="mb-4">mdi-alert-circle</VIcon>
        <div class="text-h6 mb-2">Order Not Found</div>
        <div class="text-medium-emphasis mb-4">The requested order could not be found.</div>
        <VBtn color="primary" @click="$router.push('/pharmacy/orders')">Back to Orders</VBtn>
      </VCardText>
    </VCard>

    <!-- Status Update Dialog -->
    <VDialog v-model="confirmDialog" max-width="400">
      <VCard>
        <VCardTitle>{{ pendingStatus === 'CANCELLED' ? 'Cancel Order' : 'Update Status' }}</VCardTitle>
        <VCardText>
          <p v-if="pendingStatus === 'CANCELLED'">
            Are you sure you want to cancel this order? This action cannot be undone.
          </p>
          <p v-else>
            Update order status to <strong>{{ formatStatus(pendingStatus) }}</strong>?
          </p>
          <VTextarea
            v-if="pendingStatus === 'CANCELLED'"
            v-model="cancelReason"
            label="Reason for cancellation"
            rows="3"
            class="mt-4"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="confirmDialog = false">Cancel</VBtn>
          <VBtn :color="pendingStatus === 'CANCELLED' ? 'error' : 'primary'" @click="confirmStatusUpdate" :loading="updating">
            Confirm
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const updating = ref(false)
const order = ref(null)

const confirmDialog = ref(false)
const pendingStatus = ref(null)
const cancelReason = ref('')

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

const formatShortDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getManufacturerName = (manufacturer) => {
  if (!manufacturer) return null
  if (typeof manufacturer === 'string') return manufacturer
  return manufacturer.name || manufacturer.company_name || null
}

const formatStatus = (status) => {
  const statusMap = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PAID: 'Paid',
    PROCESSING: 'Processing',
    DISPENSED: 'Dispensed',
    READY_FOR_PICKUP: 'Ready for Pickup',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  }
  return statusMap[status?.toUpperCase()] || status
}

const formatStatusAction = (status) => {
  const actionMap = {
    CONFIRMED: 'Confirm Order',
    PROCESSING: 'Start Processing',
    DISPENSED: 'Mark Dispensed',
    READY_FOR_PICKUP: 'Mark Ready for Pickup',
    OUT_FOR_DELIVERY: 'Mark Out for Delivery',
    SHIPPED: 'Mark Shipped',
    DELIVERED: 'Mark Delivered',
    COMPLETED: 'Mark Completed',
    CANCELLED: 'Cancel Order',
  }
  return actionMap[status?.toUpperCase()] || formatStatus(status)
}

const getStatusColor = (status) => {
  const colorMap = {
    PENDING: 'grey',
    CONFIRMED: 'info',
    PAID: 'info',
    PROCESSING: 'warning',
    DISPENSED: 'primary',
    READY_FOR_PICKUP: 'success',
    OUT_FOR_DELIVERY: 'primary',
    SHIPPED: 'primary',
    DELIVERED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'error',
    REFUNDED: 'warning',
  }
  return colorMap[status?.toUpperCase()] || 'default'
}

const getInitials = (patient) => {
  if (!patient?.profile) return '?'
  const first = patient.profile.first_name?.[0] || ''
  const last = patient.profile.last_name?.[0] || ''
  return (first + last).toUpperCase()
}

const isDeliveryOrder = computed(() => {
  const method = order.value?.delivery_method || order.value?.delivery_type
  return method === 'DELIVERY' || method === 'delivery'
})

const getNextStatuses = (currentStatus, deliveryType) => {
  const upperStatus = currentStatus?.toUpperCase()
  if (['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(upperStatus)) return []

  // Normalize delivery type - backend uses delivery_method with PICKUP/DELIVERY
  const isPickup = deliveryType === 'PICKUP' || deliveryType === 'pickup'

  const statusFlow = {
    PENDING: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PAID: ['PROCESSING', 'CANCELLED'],
    PROCESSING: isPickup ? ['READY_FOR_PICKUP', 'CANCELLED'] : ['OUT_FOR_DELIVERY', 'CANCELLED'],
    DISPENSED: isPickup ? ['READY_FOR_PICKUP', 'CANCELLED'] : ['OUT_FOR_DELIVERY', 'CANCELLED'],
    READY_FOR_PICKUP: ['DELIVERED', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['COMPLETED'],
  }
  return statusFlow[upperStatus] || []
}

const orderTimeline = computed(() => {
  if (!order.value) return []

  // Normalize delivery method - backend uses delivery_method with PICKUP/DELIVERY
  const deliveryMethod = order.value.delivery_method || order.value.delivery_type
  const isPickup = deliveryMethod === 'PICKUP' || deliveryMethod === 'pickup'

  // Build status flow based on delivery method
  let statuses = ['PAID', 'PROCESSING']
  if (isPickup) {
    statuses.push('READY_FOR_PICKUP')
  } else {
    statuses.push('OUT_FOR_DELIVERY')
  }
  statuses.push('DELIVERED')

  const currentStatus = order.value.status?.toUpperCase()
  const currentIndex = statuses.indexOf(currentStatus)
  const history = order.value.status_history || []

  // Status-specific colors for better visual indication
  const statusColors = {
    PAID: 'info',
    PROCESSING: 'warning',
    READY_FOR_PICKUP: 'success',
    OUT_FOR_DELIVERY: 'primary',
    DELIVERED: 'success',
  }

  return statuses.map((status, index) => {
    // Look for matching status in history (check both timestamp and changed_at)
    const historyEntry = history.find(h => h.status?.toUpperCase() === status)
    const isCompleted = index < currentIndex || currentStatus === 'DELIVERED' || currentStatus === 'COMPLETED'
    const isCurrent = index === currentIndex && !['DELIVERED', 'COMPLETED'].includes(currentStatus)

    return {
      title: formatStatus(status),
      completed: isCompleted,
      current: isCurrent,
      time: historyEntry?.timestamp || historyEntry?.changed_at,
      // Use status-specific color when completed/current, grey when pending
      color: isCompleted || isCurrent ? statusColors[status] : 'grey',
      icon: isCompleted ? 'mdi-check-circle' : isCurrent ? 'mdi-progress-clock' : 'mdi-circle-outline',
    }
  })
})

const updateStatus = (status) => {
  pendingStatus.value = status
  cancelReason.value = ''
  confirmDialog.value = true
}

const confirmStatusUpdate = async () => {
  updating.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const body = { status: pendingStatus.value }
    if (pendingStatus.value === 'CANCELLED') {
      body.reason = cancelReason.value
    }

    const response = await fetch(`/admin-api/pharmacy/orders/${route.params.id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (response.ok) {
      await fetchOrder()
    }
  } catch (error) {
    console.error('Error updating order status:', error)
  } finally {
    updating.value = false
    confirmDialog.value = false
  }
}

const viewPrescription = () => {
  if (order.value?.prescription?._id) {
    router.push(`/pharmacy/prescriptions/${order.value.prescription._id}`)
  }
}

const viewPatient = (patientId) => {
  if (patientId) {
    router.push(`/patients/${patientId}`)
  }
}

const printOrder = () => {
  window.print()
}

const fetchOrder = async () => {
  loading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/orders/${route.params.id}`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()

    if (data.statusCode === 200 && data.data) {
      order.value = data.data
    }
  } catch (error) {
    console.error('Error fetching order:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
@media print {
  .v-btn {
    display: none !important;
  }
}

.clickable-row {
  cursor: pointer;
  border-radius: 8px;
  padding: 8px;
  margin: -8px;
  transition: background-color 0.2s ease;
}

.clickable-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.order-item-card {
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: box-shadow 0.2s ease;
}

.order-item-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.bg-grey-lighten-4 {
  background-color: #f5f5f5;
}

.pickup-code-box {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px dashed #10b981;
}

/* Theme-aware prescription info box - works in light and dark mode */
.prescription-info-box {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

/* Theme-aware diagnosis box with slight warning tint */
.diagnosis-box {
  background-color: rgba(var(--v-theme-warning), 0.1);
  border: 1px solid rgba(var(--v-theme-warning), 0.2);
}

/* Theme-aware prescribed item */
.prescribed-item {
  border-left: 3px solid rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 4px;
}

.prescribed-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.06);
}
</style>
