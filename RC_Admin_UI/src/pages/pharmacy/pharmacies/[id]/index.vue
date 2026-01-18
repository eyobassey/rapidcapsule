<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 400px;">
      <VProgressCircular indeterminate color="primary" size="64" />
    </div>

    <!-- Error State -->
    <VAlert v-else-if="error" type="error" class="mb-4">
      {{ error }}
      <template #append>
        <VBtn variant="text" @click="fetchPharmacy">Retry</VBtn>
      </template>
    </VAlert>

    <!-- Pharmacy Details -->
    <template v-else-if="pharmacy">
      <!-- Breadcrumb -->
      <VBreadcrumbs class="px-0 mb-4">
        <VBreadcrumbsItem to="/pharmacy/pharmacies">Pharmacies</VBreadcrumbsItem>
        <VBreadcrumbsItem>{{ pharmacy.name }}</VBreadcrumbsItem>
      </VBreadcrumbs>

      <!-- Header -->
      <VCard class="mb-6">
        <VCardText class="pa-6">
          <div class="d-flex flex-wrap justify-space-between align-start gap-4">
            <div class="d-flex align-start gap-4">
              <VAvatar color="primary" size="72" class="elevation-2">
                <VIcon v-if="pharmacy.is_featured" color="warning" size="36">mdi-star</VIcon>
                <span v-else class="text-h4 font-weight-bold text-white">{{ getInitials(pharmacy.name) }}</span>
              </VAvatar>
              <div>
                <div class="d-flex align-center gap-2 mb-1">
                  <h1 class="text-h4 font-weight-bold">{{ pharmacy.name }}</h1>
                  <VChip v-if="pharmacy.is_platform_default" color="primary" size="small" variant="elevated">
                    Platform Default
                  </VChip>
                </div>
                <div class="text-subtitle-1 text-medium-emphasis mb-3">
                  {{ pharmacy.trading_name || pharmacy.registration_number }}
                  <VChip size="x-small" variant="outlined" class="ms-2">
                    {{ formatPharmacyType(pharmacy.pharmacy_type) }}
                  </VChip>
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <VChip
                    :color="getVerificationColor(pharmacy.verification_status)"
                    size="small"
                    variant="flat"
                  >
                    <VIcon start size="14">{{ getVerificationIcon(pharmacy.verification_status) }}</VIcon>
                    {{ formatVerificationStatus(pharmacy.verification_status) }}
                  </VChip>
                  <VChip :color="pharmacy.is_active ? 'success' : 'error'" size="small" variant="flat">
                    <VIcon start size="14">{{ pharmacy.is_active ? 'mdi-check-circle' : 'mdi-close-circle' }}</VIcon>
                    {{ pharmacy.is_active ? 'Active' : 'Inactive' }}
                  </VChip>
                  <VChip :color="pharmacy.is_online ? 'info' : 'grey'" size="small" variant="flat">
                    <VIcon start size="14">{{ pharmacy.is_online ? 'mdi-wifi' : 'mdi-wifi-off' }}</VIcon>
                    {{ pharmacy.is_online ? 'Accepting Orders' : 'Offline' }}
                  </VChip>
                  <VChip v-if="pharmacy.is_suspended" color="error" size="small" variant="flat">
                    <VIcon start size="14">mdi-alert-circle</VIcon>
                    Suspended
                  </VChip>
                </div>
              </div>
            </div>
            <div class="d-flex gap-2">
              <VBtn variant="outlined" prepend-icon="mdi-pencil" @click="editPharmacy">
                Edit
              </VBtn>
              <VBtn
                v-if="!pharmacy.is_suspended"
                color="warning"
                variant="outlined"
                prepend-icon="mdi-pause-circle"
                @click="suspendDialog = true"
              >
                Suspend
              </VBtn>
              <VBtn
                v-else
                color="success"
                variant="outlined"
                prepend-icon="mdi-play-circle"
                @click="reactivatePharmacy"
              >
                Reactivate
              </VBtn>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Quick Stats -->
      <VRow class="mb-6">
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar color="primary" variant="tonal" size="48" class="me-4">
                <VIcon>mdi-package-variant</VIcon>
              </VAvatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ stats.totalOrders }}</div>
                <div class="text-body-2 text-medium-emphasis">Total Orders</div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar color="success" variant="tonal" size="48" class="me-4">
                <VIcon>mdi-cash</VIcon>
              </VAvatar>
              <div>
                <div class="text-h5 font-weight-bold">{{ formatPrice(stats.totalRevenue) }}</div>
                <div class="text-body-2 text-medium-emphasis">Total Revenue</div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar color="warning" variant="tonal" size="48" class="me-4">
                <VIcon>mdi-star</VIcon>
              </VAvatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ stats.avgRating.toFixed(1) }}</div>
                <div class="text-body-2 text-medium-emphasis">Avg Rating ({{ stats.totalRatings }} reviews)</div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar color="info" variant="tonal" size="48" class="me-4">
                <VIcon>mdi-percent</VIcon>
              </VAvatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ stats.completionRate }}%</div>
                <div class="text-body-2 text-medium-emphasis">Completion Rate</div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Navigation Tabs -->
      <VCard class="mb-6">
        <VTabs v-model="activeTab" bg-color="transparent">
          <VTab value="overview">
            <VIcon start>mdi-information-outline</VIcon>
            Overview
          </VTab>
          <VTab value="performance" @click="goToPerformance">
            <VIcon start>mdi-chart-box</VIcon>
            Performance
          </VTab>
        </VTabs>
      </VCard>

      <!-- Overview Content -->
      <VRow>
        <!-- Left Column -->
        <VCol cols="12" md="6">
          <!-- Basic Information -->
          <VCard class="mb-6">
            <VCardTitle class="d-flex align-center">
              <VIcon start>mdi-store</VIcon>
              Basic Information
            </VCardTitle>
            <VDivider />
            <VCardText>
              <VList density="compact">
                <VListItem>
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-identifier</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Registration Number</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.registration_number }}</VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.license_number">
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-certificate</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">License Number</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.license_number }}</VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.license_expiry">
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-calendar-clock</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">License Expiry</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">
                    {{ formatDate(pharmacy.license_expiry) }}
                    <VChip
                      v-if="isLicenseExpiringSoon"
                      size="x-small"
                      color="warning"
                      class="ms-2"
                    >
                      Expiring Soon
                    </VChip>
                  </VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.cac_registration">
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-file-document</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">CAC Registration</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.cac_registration }}</VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.tax_id">
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-receipt-text</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Tax ID</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.tax_id }}</VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-calendar-plus</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Registered</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ formatDate(pharmacy.created_at) }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>

          <!-- Contact Information -->
          <VCard class="mb-6">
            <VCardTitle class="d-flex align-center">
              <VIcon start>mdi-contacts</VIcon>
              Contact Information
            </VCardTitle>
            <VDivider />
            <VCardText>
              <VList density="compact">
                <VListItem>
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-email</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Email</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">
                    <a :href="`mailto:${pharmacy.email}`" class="text-primary">{{ pharmacy.email }}</a>
                  </VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-phone</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Phone</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">
                    <a :href="`tel:${pharmacy.phone}`" class="text-primary">{{ pharmacy.phone }}</a>
                  </VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.alternate_phone">
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-phone-plus</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Alternate Phone</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.alternate_phone }}</VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.website">
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-web</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Website</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">
                    <a :href="pharmacy.website" target="_blank" class="text-primary">{{ pharmacy.website }}</a>
                  </VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.address">
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-map-marker</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Address</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">
                    {{ pharmacy.address.street }}<br>
                    {{ pharmacy.address.city }}, {{ pharmacy.address.state }}<br>
                    {{ pharmacy.address.country }}
                    <span v-if="pharmacy.address.postal_code">, {{ pharmacy.address.postal_code }}</span>
                  </VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>

          <!-- Superintendent Pharmacist -->
          <VCard v-if="pharmacy.superintendent_pharmacist?.name" class="mb-6">
            <VCardTitle class="d-flex align-center">
              <VIcon start>mdi-account-tie</VIcon>
              Superintendent Pharmacist
            </VCardTitle>
            <VDivider />
            <VCardText>
              <VList density="compact">
                <VListItem>
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-account</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Name</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.superintendent_pharmacist.name }}</VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.superintendent_pharmacist.license_number">
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-certificate</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">License Number</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.superintendent_pharmacist.license_number }}</VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.superintendent_pharmacist.phone">
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-phone</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Phone</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.superintendent_pharmacist.phone }}</VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.superintendent_pharmacist.email">
                  <template #prepend>
                    <VIcon size="small" class="me-3">mdi-email</VIcon>
                  </template>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Email</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.superintendent_pharmacist.email }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Right Column -->
        <VCol cols="12" md="6">
          <!-- Operating Hours -->
          <VCard class="mb-6">
            <VCardTitle class="d-flex align-center justify-space-between">
              <div>
                <VIcon start>mdi-clock-outline</VIcon>
                Operating Hours
              </div>
              <VChip v-if="pharmacy.is_24_hours" color="info" size="small">24 Hours</VChip>
            </VCardTitle>
            <VDivider />
            <VCardText>
              <VTable v-if="pharmacy.operating_hours?.length" density="compact">
                <tbody>
                  <tr v-for="hours in pharmacy.operating_hours" :key="hours.day">
                    <td class="font-weight-medium" style="width: 120px;">{{ formatDayName(hours.day) }}</td>
                    <td>
                      <VChip :color="hours.is_open ? 'success' : 'grey'" size="x-small" class="me-2">
                        {{ hours.is_open ? 'Open' : 'Closed' }}
                      </VChip>
                      <span v-if="hours.is_open" class="text-body-2">
                        {{ hours.open_time }} - {{ hours.close_time }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </VTable>
              <VAlert v-else type="info" variant="tonal" density="compact">
                No operating hours defined
              </VAlert>
            </VCardText>
          </VCard>

          <!-- Delivery Settings -->
          <VCard class="mb-6">
            <VCardTitle class="d-flex align-center">
              <VIcon start>mdi-truck-delivery</VIcon>
              Delivery Settings
            </VCardTitle>
            <VDivider />
            <VCardText>
              <VRow>
                <VCol cols="6">
                  <div class="d-flex align-center mb-3">
                    <VIcon :color="pharmacy.offers_delivery ? 'success' : 'grey'" class="me-2">
                      {{ pharmacy.offers_delivery ? 'mdi-check-circle' : 'mdi-close-circle' }}
                    </VIcon>
                    <span>Delivery {{ pharmacy.offers_delivery ? 'Available' : 'Unavailable' }}</span>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="d-flex align-center mb-3">
                    <VIcon :color="pharmacy.offers_pickup ? 'success' : 'grey'" class="me-2">
                      {{ pharmacy.offers_pickup ? 'mdi-check-circle' : 'mdi-close-circle' }}
                    </VIcon>
                    <span>Pickup {{ pharmacy.offers_pickup ? 'Available' : 'Unavailable' }}</span>
                  </div>
                </VCol>
              </VRow>
              <VDivider class="my-3" />
              <VList density="compact" v-if="pharmacy.offers_delivery">
                <VListItem>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Delivery Fee</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ formatPrice(pharmacy.delivery_fee) }}</VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.free_delivery_threshold">
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Free Delivery Above</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ formatPrice(pharmacy.free_delivery_threshold) }}</VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.min_order_amount">
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Minimum Order</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ formatPrice(pharmacy.min_order_amount) }}</VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.delivery_radius_km">
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Delivery Radius</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.delivery_radius_km }} km</VListItemSubtitle>
                </VListItem>
                <VListItem v-if="pharmacy.estimated_delivery_time">
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Estimated Delivery</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.estimated_delivery_time }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>

          <!-- Capabilities -->
          <VCard class="mb-6">
            <VCardTitle class="d-flex align-center">
              <VIcon start>mdi-medical-bag</VIcon>
              Capabilities
            </VCardTitle>
            <VDivider />
            <VCardText>
              <div class="d-flex flex-wrap gap-2">
                <VChip :color="pharmacy.offers_consultation ? 'success' : 'grey'" size="small" variant="tonal">
                  <VIcon start size="14">{{ pharmacy.offers_consultation ? 'mdi-check' : 'mdi-close' }}</VIcon>
                  Consultation
                </VChip>
                <VChip :color="pharmacy.can_dispense_controlled ? 'success' : 'grey'" size="small" variant="tonal">
                  <VIcon start size="14">{{ pharmacy.can_dispense_controlled ? 'mdi-check' : 'mdi-close' }}</VIcon>
                  Controlled Substances
                </VChip>
                <VChip :color="pharmacy.offers_compounding ? 'success' : 'grey'" size="small" variant="tonal">
                  <VIcon start size="14">{{ pharmacy.offers_compounding ? 'mdi-check' : 'mdi-close' }}</VIcon>
                  Compounding
                </VChip>
                <VChip :color="pharmacy.accepts_insurance ? 'success' : 'grey'" size="small" variant="tonal">
                  <VIcon start size="14">{{ pharmacy.accepts_insurance ? 'mdi-check' : 'mdi-close' }}</VIcon>
                  Insurance
                </VChip>
              </div>
              <div v-if="pharmacy.consultation_fee && pharmacy.offers_consultation" class="mt-3">
                <span class="text-body-2 text-medium-emphasis">Consultation Fee: </span>
                <span class="font-weight-medium">{{ formatPrice(pharmacy.consultation_fee) }}</span>
              </div>
            </VCardText>
          </VCard>

          <!-- Payment Settings -->
          <VCard class="mb-6">
            <VCardTitle class="d-flex align-center">
              <VIcon start>mdi-credit-card-outline</VIcon>
              Payment Settings
            </VCardTitle>
            <VDivider />
            <VCardText>
              <div class="text-body-2 text-medium-emphasis mb-2">Accepted Payment Methods</div>
              <div class="d-flex flex-wrap gap-2 mb-4">
                <VChip
                  v-for="method in pharmacy.accepted_payment_methods"
                  :key="method"
                  size="small"
                  variant="tonal"
                  color="primary"
                >
                  {{ formatPaymentMethod(method) }}
                </VChip>
                <span v-if="!pharmacy.accepted_payment_methods?.length" class="text-medium-emphasis">None configured</span>
              </div>
              <VDivider class="my-3" />
              <VList density="compact">
                <VListItem>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Commission Rate</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.commission_rate || 0 }}%</VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Wallet Balance</VListItemTitle>
                  <VListItemSubtitle class="text-body-1 font-weight-medium">{{ formatPrice(pharmacy.wallet_balance) }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>

          <!-- Bank Details -->
          <VCard v-if="pharmacy.bank_details?.bank_name" class="mb-6">
            <VCardTitle class="d-flex align-center">
              <VIcon start>mdi-bank</VIcon>
              Bank Details
              <VChip
                :color="pharmacy.bank_details.verified ? 'success' : 'warning'"
                size="x-small"
                class="ms-2"
              >
                {{ pharmacy.bank_details.verified ? 'Verified' : 'Unverified' }}
              </VChip>
            </VCardTitle>
            <VDivider />
            <VCardText>
              <VList density="compact">
                <VListItem>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Bank Name</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.bank_details.bank_name }}</VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Account Number</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.bank_details.account_number }}</VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle class="text-body-2 text-medium-emphasis">Account Name</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ pharmacy.bank_details.account_name }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Recent Activity -->
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <div>
            <VIcon start>mdi-history</VIcon>
            Recent Activity
          </div>
          <VBtn variant="text" size="small" @click="goToPerformance">
            View All
            <VIcon end>mdi-arrow-right</VIcon>
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <div class="text-subtitle-2 font-weight-bold mb-3">Recent Orders</div>
              <VList v-if="recentOrders.length" density="compact">
                <VListItem v-for="order in recentOrders" :key="order._id">
                  <template #prepend>
                    <VIcon size="small" :color="getOrderStatusColor(order.status)">mdi-package-variant</VIcon>
                  </template>
                  <VListItemTitle>{{ order.order_number || order._id?.slice(-8) }}</VListItemTitle>
                  <VListItemSubtitle>
                    {{ formatPrice(order.total_amount) }} - {{ formatDate(order.created_at) }}
                  </VListItemSubtitle>
                  <template #append>
                    <VChip :color="getOrderStatusColor(order.status)" size="x-small">
                      {{ formatStatus(order.status) }}
                    </VChip>
                  </template>
                </VListItem>
              </VList>
              <VAlert v-else type="info" variant="tonal" density="compact">
                No recent orders
              </VAlert>
            </VCol>
            <VCol cols="12" md="6">
              <div class="text-subtitle-2 font-weight-bold mb-3">Recent Prescriptions</div>
              <VList v-if="recentPrescriptions.length" density="compact">
                <VListItem v-for="rx in recentPrescriptions" :key="rx._id">
                  <template #prepend>
                    <VIcon size="small" :color="getOrderStatusColor(rx.status)">mdi-prescription</VIcon>
                  </template>
                  <VListItemTitle>{{ rx.prescription_number }}</VListItemTitle>
                  <VListItemSubtitle>
                    {{ formatPrice(rx.total_amount) }} - {{ formatDate(rx.created_at) }}
                  </VListItemSubtitle>
                  <template #append>
                    <VChip :color="getOrderStatusColor(rx.status)" size="x-small">
                      {{ formatStatus(rx.status) }}
                    </VChip>
                  </template>
                </VListItem>
              </VList>
              <VAlert v-else type="info" variant="tonal" density="compact">
                No recent prescriptions
              </VAlert>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </template>

    <!-- Suspend Dialog -->
    <VDialog v-model="suspendDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-warning">Suspend Pharmacy</VCardTitle>
        <VCardText>
          <p class="mb-3">
            Suspend <strong>{{ pharmacy?.name }}</strong>?
          </p>
          <VTextarea
            v-model="suspendReason"
            label="Reason for suspension *"
            rows="3"
            :rules="[v => !!v || 'Required']"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="suspendDialog = false">Cancel</VBtn>
          <VBtn color="warning" :loading="saving" @click="suspendPharmacy">Suspend</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const pharmacyId = computed(() => route.params.id)

// API Base URL
const API_BASE = '/admin-api/pharmacy'

// State
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const pharmacy = ref(null)
const activeTab = ref('overview')
const recentOrders = ref([])
const recentPrescriptions = ref([])

// Stats
const stats = reactive({
  totalOrders: 0,
  totalRevenue: 0,
  avgRating: 0,
  totalRatings: 0,
  completionRate: 0,
})

// Dialogs
const suspendDialog = ref(false)
const suspendReason = ref('')

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
})

// Computed
const isLicenseExpiringSoon = computed(() => {
  if (!pharmacy.value?.license_expiry) return false
  const expiry = new Date(pharmacy.value.license_expiry)
  const now = new Date()
  const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24)
  return daysUntilExpiry > 0 && daysUntilExpiry <= 90
})

// Auth Headers
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.access_token}`,
  }
}

// Fetch Pharmacy
const fetchPharmacy = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await fetch(`${API_BASE}/pharmacies/${pharmacyId.value}`, {
      headers: getAuthHeaders(),
    })

    const data = await response.json()

    if (response.ok && data.data) {
      pharmacy.value = data.data

      // Set basic stats from pharmacy object
      stats.avgRating = pharmacy.value.average_rating || 0
      stats.totalRatings = pharmacy.value.total_ratings || 0
      stats.totalOrders = pharmacy.value.total_orders || 0

      // Fetch additional stats and recent activity
      await Promise.all([
        fetchPharmacyStats(),
        fetchRecentActivity(),
      ])
    } else {
      error.value = data.errorMessage || data.message || 'Failed to load pharmacy'
    }
  } catch (err) {
    console.error('Fetch pharmacy error:', err)
    error.value = 'Failed to load pharmacy details'
  } finally {
    loading.value = false
  }
}

// Fetch pharmacy stats from performance endpoint
const fetchPharmacyStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/${pharmacyId.value}/performance?period=all`, {
      headers: getAuthHeaders(),
    })

    const data = await response.json()

    if (response.ok && data.data) {
      const perf = data.data
      // Handle totalOrders which may be an object { current, allTime, trend } or a number
      const totalOrdersVal = perf.overview?.totalOrders
      stats.totalOrders = typeof totalOrdersVal === 'object'
        ? (totalOrdersVal?.allTime || totalOrdersVal?.current || 0)
        : (totalOrdersVal || pharmacy.value.total_orders || 0)

      // Handle totalRevenue which may be an object or a number
      const totalRevenueVal = perf.overview?.totalRevenue
      stats.totalRevenue = typeof totalRevenueVal === 'object'
        ? (totalRevenueVal?.allTime || totalRevenueVal?.current || 0)
        : (totalRevenueVal || 0)

      stats.completionRate = perf.benchmarks?.pharmacy?.completionRate || 0
      stats.avgRating = perf.customerSatisfaction?.averageRating || pharmacy.value.average_rating || 0
      stats.totalRatings = perf.customerSatisfaction?.totalReviews || pharmacy.value.total_ratings || 0
    }
  } catch (err) {
    console.error('Fetch stats error:', err)
    // Use fallback values from pharmacy object
  }
}

// Fetch recent activity
const fetchRecentActivity = async () => {
  try {
    // Fetch recent orders
    const ordersResponse = await fetch(`${API_BASE}/orders?pharmacy_id=${pharmacyId.value}&limit=5&sort=-created_at`, {
      headers: getAuthHeaders(),
    })

    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json()
      recentOrders.value = ordersData.data?.orders || ordersData.data || []
    }

    // Fetch recent prescriptions
    const rxResponse = await fetch(`${API_BASE}/prescriptions?pharmacy_id=${pharmacyId.value}&limit=5&sort=-created_at`, {
      headers: getAuthHeaders(),
    })

    if (rxResponse.ok) {
      const rxData = await rxResponse.json()
      recentPrescriptions.value = rxData.data?.prescriptions || rxData.data || []
    }
  } catch (err) {
    console.error('Fetch recent activity error:', err)
  }
}

// Actions
const editPharmacy = () => {
  router.push(`/pharmacy/pharmacies?edit=${pharmacyId.value}`)
}

const goToPerformance = () => {
  router.push(`/pharmacy/pharmacies/${pharmacyId.value}/performance`)
}

const suspendPharmacy = async () => {
  if (!suspendReason.value) {
    showSnackbar('Please provide a reason', 'error')
    return
  }

  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/pharmacies/${pharmacyId.value}/suspend`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason: suspendReason.value }),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Pharmacy suspended', 'success')
      suspendDialog.value = false
      fetchPharmacy()
    } else {
      showSnackbar(result.message || 'Failed to suspend pharmacy', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to suspend pharmacy', 'error')
  } finally {
    saving.value = false
  }
}

const reactivatePharmacy = async () => {
  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/pharmacies/${pharmacyId.value}/reactivate`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Pharmacy reactivated', 'success')
      fetchPharmacy()
    } else {
      showSnackbar(result.message || 'Failed to reactivate pharmacy', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to reactivate pharmacy', 'error')
  } finally {
    saving.value = false
  }
}

// Helpers
const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

const getVerificationColor = (status) => {
  const colors = {
    VERIFIED: 'success',
    PENDING: 'warning',
    REJECTED: 'error',
    SUSPENDED: 'grey',
  }
  return colors[status?.toUpperCase()] || 'grey'
}

const getVerificationIcon = (status) => {
  const icons = {
    VERIFIED: 'mdi-check-circle',
    PENDING: 'mdi-clock-outline',
    REJECTED: 'mdi-close-circle',
    SUSPENDED: 'mdi-pause-circle',
  }
  return icons[status?.toUpperCase()] || 'mdi-help-circle'
}

const formatVerificationStatus = (status) => {
  const labels = {
    VERIFIED: 'Verified',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
    SUSPENDED: 'Suspended',
  }
  return labels[status?.toUpperCase()] || status
}

const formatPharmacyType = (type) => {
  const labels = {
    RETAIL: 'Retail',
    HOSPITAL: 'Hospital',
    COMMUNITY: 'Community',
    COMPOUNDING: 'Compounding',
    SPECIALTY: 'Specialty',
    ONLINE: 'Online',
  }
  return labels[type?.toUpperCase()] || type
}

const formatPaymentMethod = (method) => {
  const labels = {
    CARD: 'Card',
    BANK_TRANSFER: 'Bank Transfer',
    CASH: 'Cash',
    WALLET: 'Wallet',
    CASH_ON_DELIVERY: 'Cash on Delivery',
    COD: 'Cash on Delivery',
  }
  return labels[method?.toUpperCase()] || method?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || method
}

const formatDayName = (day) => {
  if (!day) return day
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
}

const formatStatus = (status) => {
  if (!status) return status
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price || 0)
}

const getOrderStatusColor = (status) => {
  const s = status?.toLowerCase()
  if (['delivered', 'completed', 'paid'].includes(s)) return 'success'
  if (['cancelled', 'failed', 'expired'].includes(s)) return 'error'
  if (['pending', 'processing', 'shipped'].includes(s)) return 'info'
  return 'grey'
}

const showSnackbar = (message, color = 'success') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

// Initialize
onMounted(() => {
  fetchPharmacy()
})
</script>
