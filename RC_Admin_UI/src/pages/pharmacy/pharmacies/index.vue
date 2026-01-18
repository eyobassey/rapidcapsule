<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Pharmacies</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Manage registered pharmacy locations</p>
      </div>
      <VBtn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
        Add Pharmacy
      </VBtn>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="primary" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-store</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.total }}</div>
              <div class="text-body-2 text-medium-emphasis">Total Pharmacies</div>
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
              <div class="text-h4 font-weight-bold">{{ stats.verified }}</div>
              <div class="text-body-2 text-medium-emphasis">Verified</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="info" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-wifi</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.online }}</div>
              <div class="text-body-2 text-medium-emphasis">Currently Online</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="warning" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-clock-outline</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.pending }}</div>
              <div class="text-body-2 text-medium-emphasis">Pending Verification</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" md="4">
            <VTextField
              v-model="searchQuery"
              label="Search pharmacies..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="debouncedSearch"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="statusFilter"
              label="Verification Status"
              :items="verificationStatusOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchPharmacies"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="stateFilter"
              label="State"
              :items="nigerianStates"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchPharmacies"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="itemsPerPage"
              label="Per Page"
              :items="[10, 25, 50, 100]"
              variant="outlined"
              density="compact"
              @update:model-value="fetchPharmacies"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VCheckbox
              v-model="onlineOnly"
              label="Online Only"
              density="compact"
              @update:model-value="fetchPharmacies"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VCheckbox
              v-model="pickupCenterOnly"
              label="Pickup Centers"
              density="compact"
              color="purple"
              @update:model-value="fetchPharmacies"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Pharmacies Table -->
    <VCard>
      <VCardText>
        <VProgressLinear v-if="loading" indeterminate color="primary" />

        <VTable v-if="pharmacies.length > 0">
          <thead>
            <tr>
              <th>Pharmacy</th>
              <th>Location</th>
              <th>Contact</th>
              <th>Verification</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pharmacy in pharmacies" :key="pharmacy._id">
              <td>
                <div class="d-flex align-center py-2">
                  <VAvatar color="primary" variant="tonal" size="40" class="me-3">
                    <VIcon v-if="pharmacy.is_featured" color="warning">mdi-star</VIcon>
                    <span v-else class="text-caption font-weight-bold">{{ getInitials(pharmacy.name) }}</span>
                  </VAvatar>
                  <div>
                    <div class="font-weight-medium">
                      <a href="#" class="text-decoration-none text-primary" @click.prevent="viewPharmacy(pharmacy)">
                        {{ pharmacy.name }}
                      </a>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ pharmacy.trading_name || pharmacy.registration_number }}
                      <VChip v-if="pharmacy.pharmacy_type" size="x-small" class="ms-1">
                        {{ formatPharmacyType(pharmacy.pharmacy_type) }}
                      </VChip>
                      <VChip v-if="pharmacy.is_pickup_center" size="x-small" color="purple" class="ms-1">
                        <VIcon start size="10">mdi-store-marker</VIcon>
                        Pickup Center
                      </VChip>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div v-if="pharmacy.address">
                  <div class="text-body-2">{{ pharmacy.address.city }}, {{ pharmacy.address.state }}</div>
                  <div class="text-caption text-medium-emphasis">{{ pharmacy.address.street }}</div>
                </div>
                <span v-else class="text-medium-emphasis">-</span>
              </td>
              <td>
                <div>
                  <div class="text-body-2">{{ pharmacy.phone || '-' }}</div>
                  <div class="text-caption text-medium-emphasis">{{ pharmacy.email }}</div>
                </div>
              </td>
              <td>
                <VChip
                  :color="getVerificationColor(pharmacy.verification_status)"
                  size="small"
                  variant="tonal"
                >
                  <VIcon start size="14">{{ getVerificationIcon(pharmacy.verification_status) }}</VIcon>
                  {{ formatVerificationStatus(pharmacy.verification_status) }}
                </VChip>
                <div class="text-caption text-medium-emphasis mt-1" v-if="pharmacy.license_expiry">
                  License: {{ formatDate(pharmacy.license_expiry) }}
                </div>
              </td>
              <td>
                <div class="d-flex align-center gap-1">
                  <VChip :color="pharmacy.is_active ? 'success' : 'error'" size="x-small">
                    {{ pharmacy.is_active ? 'Active' : 'Inactive' }}
                  </VChip>
                  <VChip :color="pharmacy.is_online ? 'info' : 'grey'" size="x-small">
                    {{ pharmacy.is_online ? 'Online' : 'Offline' }}
                  </VChip>
                </div>
                <VChip v-if="pharmacy.is_suspended" color="error" size="x-small" class="mt-1">
                  Suspended
                </VChip>
              </td>
              <td>
                <div class="d-flex align-center">
                  <VIcon color="warning" size="16" class="me-1">mdi-star</VIcon>
                  <span>{{ pharmacy.average_rating?.toFixed(1) || '0.0' }}</span>
                  <span class="text-caption text-medium-emphasis ms-1">({{ pharmacy.total_ratings || 0 }})</span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ pharmacy.total_orders || 0 }} orders
                </div>
              </td>
              <td>
                <VMenu>
                  <template #activator="{ props }">
                    <VBtn v-bind="props" icon variant="text" size="small">
                      <VIcon>mdi-dots-vertical</VIcon>
                    </VBtn>
                  </template>
                  <VList density="compact">
                    <VListItem @click="viewPharmacy(pharmacy)">
                      <template #prepend>
                        <VIcon size="small">mdi-eye</VIcon>
                      </template>
                      <VListItemTitle>View Details</VListItemTitle>
                    </VListItem>
                    <VListItem @click="editPharmacy(pharmacy)">
                      <template #prepend>
                        <VIcon size="small">mdi-pencil</VIcon>
                      </template>
                      <VListItemTitle>Edit</VListItemTitle>
                    </VListItem>
                    <VListItem @click="viewPerformance(pharmacy)">
                      <template #prepend>
                        <VIcon size="small" color="primary">mdi-chart-box</VIcon>
                      </template>
                      <VListItemTitle>Performance Report</VListItemTitle>
                    </VListItem>
                    <VDivider />
                    <VListItem
                      v-if="pharmacy.verification_status === 'PENDING'"
                      @click="openVerifyDialog(pharmacy)"
                    >
                      <template #prepend>
                        <VIcon size="small" color="success">mdi-check-circle</VIcon>
                      </template>
                      <VListItemTitle>Verify</VListItemTitle>
                    </VListItem>
                    <VListItem
                      v-if="!pharmacy.is_suspended"
                      @click="openSuspendDialog(pharmacy)"
                    >
                      <template #prepend>
                        <VIcon size="small" color="warning">mdi-pause-circle</VIcon>
                      </template>
                      <VListItemTitle>Suspend</VListItemTitle>
                    </VListItem>
                    <VListItem
                      v-if="pharmacy.is_suspended"
                      @click="reactivatePharmacy(pharmacy)"
                    >
                      <template #prepend>
                        <VIcon size="small" color="success">mdi-play-circle</VIcon>
                      </template>
                      <VListItemTitle>Reactivate</VListItemTitle>
                    </VListItem>
                    <VDivider />
                    <VListItem @click="confirmDelete(pharmacy)">
                      <template #prepend>
                        <VIcon size="small" color="error">mdi-delete</VIcon>
                      </template>
                      <VListItemTitle class="text-error">Delete</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
              </td>
            </tr>
          </tbody>
        </VTable>

        <VAlert v-else-if="!loading" type="info" variant="tonal">
          No pharmacies found matching your criteria
        </VAlert>

        <!-- Pagination -->
        <div class="d-flex justify-center mt-4" v-if="totalPages > 1">
          <VPagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="fetchPharmacies"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- View Pharmacy Dialog -->
    <VDialog v-model="viewDialog" max-width="900" scrollable>
      <VCard v-if="selectedPharmacy">
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ selectedPharmacy.name }}</span>
          <VBtn icon variant="text" @click="viewDialog = false">
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText style="max-height: 70vh; overflow-y: auto;">
          <VTabs v-model="detailTab">
            <VTab value="info">Basic Info</VTab>
            <VTab value="operations">Operations</VTab>
            <VTab value="documents">Documents</VTab>
            <VTab value="banking">Banking</VTab>
          </VTabs>
          <VWindow v-model="detailTab" class="mt-4">
            <!-- Basic Info Tab -->
            <VWindowItem value="info">
              <VRow>
                <VCol cols="12" md="6">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Pharmacy Information</div>
                  <VList density="compact">
                    <VListItem>
                      <VListItemTitle>Name</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.name }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem v-if="selectedPharmacy.trading_name">
                      <VListItemTitle>Trading Name</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.trading_name }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem>
                      <VListItemTitle>Type</VListItemTitle>
                      <VListItemSubtitle>{{ formatPharmacyType(selectedPharmacy.pharmacy_type) }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem>
                      <VListItemTitle>Registration Number</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.registration_number }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem v-if="selectedPharmacy.license_number">
                      <VListItemTitle>License Number</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.license_number }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem v-if="selectedPharmacy.license_expiry">
                      <VListItemTitle>License Expiry</VListItemTitle>
                      <VListItemSubtitle>{{ formatDate(selectedPharmacy.license_expiry) }}</VListItemSubtitle>
                    </VListItem>
                  </VList>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Contact Information</div>
                  <VList density="compact">
                    <VListItem>
                      <VListItemTitle>Email</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.email }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem>
                      <VListItemTitle>Phone</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.phone }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem v-if="selectedPharmacy.alternate_phone">
                      <VListItemTitle>Alternate Phone</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.alternate_phone }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem v-if="selectedPharmacy.website">
                      <VListItemTitle>Website</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.website }}</VListItemSubtitle>
                    </VListItem>
                  </VList>
                  <div class="text-subtitle-2 font-weight-bold mb-2 mt-4">Address</div>
                  <div v-if="selectedPharmacy.address" class="text-body-2">
                    {{ selectedPharmacy.address.street }}<br>
                    {{ selectedPharmacy.address.city }}, {{ selectedPharmacy.address.state }}<br>
                    {{ selectedPharmacy.address.country }}
                    <span v-if="selectedPharmacy.address.postal_code">, {{ selectedPharmacy.address.postal_code }}</span>
                  </div>
                </VCol>
                <VCol cols="12" v-if="selectedPharmacy.superintendent_pharmacist?.name">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Superintendent Pharmacist</div>
                  <VList density="compact">
                    <VListItem>
                      <VListItemTitle>Name</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.superintendent_pharmacist.name }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem v-if="selectedPharmacy.superintendent_pharmacist.license_number">
                      <VListItemTitle>License Number</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.superintendent_pharmacist.license_number }}</VListItemSubtitle>
                    </VListItem>
                  </VList>
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Operations Tab -->
            <VWindowItem value="operations">
              <VRow>
                <VCol cols="12" md="6">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Delivery Settings</div>
                  <VList density="compact">
                    <VListItem>
                      <VListItemTitle>Offers Delivery</VListItemTitle>
                      <VListItemSubtitle>
                        <VChip :color="selectedPharmacy.offers_delivery ? 'success' : 'grey'" size="x-small">
                          {{ selectedPharmacy.offers_delivery ? 'Yes' : 'No' }}
                        </VChip>
                      </VListItemSubtitle>
                    </VListItem>
                    <VListItem v-if="selectedPharmacy.offers_delivery">
                      <VListItemTitle>Delivery Fee</VListItemTitle>
                      <VListItemSubtitle>{{ formatPrice(selectedPharmacy.delivery_fee) }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem v-if="selectedPharmacy.free_delivery_threshold">
                      <VListItemTitle>Free Delivery Above</VListItemTitle>
                      <VListItemSubtitle>{{ formatPrice(selectedPharmacy.free_delivery_threshold) }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem v-if="selectedPharmacy.delivery_radius_km">
                      <VListItemTitle>Delivery Radius</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.delivery_radius_km }} km</VListItemSubtitle>
                    </VListItem>
                  </VList>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Capabilities</div>
                  <div class="d-flex flex-wrap gap-2">
                    <VChip v-if="selectedPharmacy.is_24_hours" color="info" size="small">
                      24 Hours
                    </VChip>
                    <VChip v-if="selectedPharmacy.offers_pickup" color="primary" size="small">
                      Pickup Available
                    </VChip>
                    <VChip v-if="selectedPharmacy.offers_consultation" color="success" size="small">
                      Consultation
                    </VChip>
                    <VChip v-if="selectedPharmacy.can_dispense_controlled" color="warning" size="small">
                      Controlled Substances
                    </VChip>
                    <VChip v-if="selectedPharmacy.offers_compounding" color="secondary" size="small">
                      Compounding
                    </VChip>
                    <VChip v-if="selectedPharmacy.accepts_insurance" color="info" size="small">
                      Accepts Insurance
                    </VChip>
                    <VChip v-if="selectedPharmacy.is_pickup_center" color="purple" size="small">
                      <VIcon start size="12">mdi-store-marker</VIcon>
                      Pickup Center
                    </VChip>
                  </div>
                </VCol>
                <!-- Pickup Center Settings -->
                <VCol cols="12" v-if="selectedPharmacy.is_pickup_center">
                  <VDivider class="my-3" />
                  <div class="text-subtitle-2 font-weight-bold mb-2">
                    <VIcon size="small" class="me-1">mdi-store-marker</VIcon>
                    Pickup Center Settings
                  </div>
                  <VRow>
                    <VCol cols="12" md="4">
                      <VList density="compact">
                        <VListItem>
                          <VListItemTitle>Status</VListItemTitle>
                          <VListItemSubtitle>
                            <VChip
                              :color="selectedPharmacy.pickup_center_settings?.accepts_external_orders ? 'success' : 'grey'"
                              size="x-small"
                            >
                              {{ selectedPharmacy.pickup_center_settings?.accepts_external_orders ? 'Accepting Orders' : 'Paused' }}
                            </VChip>
                          </VListItemSubtitle>
                        </VListItem>
                        <VListItem>
                          <VListItemTitle>Max Daily Pickups</VListItemTitle>
                          <VListItemSubtitle>{{ selectedPharmacy.pickup_center_settings?.max_daily_pickups || 50 }}</VListItemSubtitle>
                        </VListItem>
                      </VList>
                    </VCol>
                    <VCol cols="12" md="4">
                      <VList density="compact">
                        <VListItem>
                          <VListItemTitle>Storage Capacity</VListItemTitle>
                          <VListItemSubtitle>{{ formatStorageCapacity(selectedPharmacy.pickup_center_settings?.storage_capacity) }}</VListItemSubtitle>
                        </VListItem>
                        <VListItem>
                          <VListItemTitle>Handling Fee</VListItemTitle>
                          <VListItemSubtitle>{{ formatPrice(selectedPharmacy.pickup_center_settings?.handling_fee || 0) }}</VListItemSubtitle>
                        </VListItem>
                      </VList>
                    </VCol>
                    <VCol cols="12" md="4">
                      <VList density="compact">
                        <VListItem>
                          <VListItemTitle>Refrigerated Items</VListItemTitle>
                          <VListItemSubtitle>
                            <VChip
                              :color="selectedPharmacy.pickup_center_settings?.accepts_refrigerated ? 'info' : 'grey'"
                              size="x-small"
                            >
                              {{ selectedPharmacy.pickup_center_settings?.accepts_refrigerated ? 'Accepted' : 'Not Accepted' }}
                            </VChip>
                          </VListItemSubtitle>
                        </VListItem>
                        <VListItem>
                          <VListItemTitle>Pickup Hours</VListItemTitle>
                          <VListItemSubtitle>
                            {{ selectedPharmacy.pickup_center_settings?.pickup_hours_same_as_operating ? 'Same as Operating Hours' : 'Custom Hours' }}
                          </VListItemSubtitle>
                        </VListItem>
                      </VList>
                    </VCol>
                    <VCol cols="12" v-if="selectedPharmacy.pickup_center_settings?.external_pickup_instructions">
                      <div class="text-caption font-weight-medium">Pickup Instructions:</div>
                      <div class="text-body-2 text-medium-emphasis mt-1">
                        {{ selectedPharmacy.pickup_center_settings.external_pickup_instructions }}
                      </div>
                    </VCol>
                  </VRow>
                </VCol>
                <VCol cols="12">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Operating Hours</div>
                  <VTable v-if="selectedPharmacy.operating_hours?.length" density="compact">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Status</th>
                        <th>Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="hours in selectedPharmacy.operating_hours" :key="hours.day">
                        <td>{{ hours.day }}</td>
                        <td>
                          <VChip :color="hours.is_open ? 'success' : 'grey'" size="x-small">
                            {{ hours.is_open ? 'Open' : 'Closed' }}
                          </VChip>
                        </td>
                        <td>
                          <span v-if="hours.is_open">{{ hours.open_time }} - {{ hours.close_time }}</span>
                          <span v-else class="text-medium-emphasis">-</span>
                        </td>
                      </tr>
                    </tbody>
                  </VTable>
                  <VAlert v-else type="info" variant="tonal" density="compact">
                    No operating hours defined
                  </VAlert>
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Documents Tab -->
            <VWindowItem value="documents">
              <div v-if="selectedPharmacy.documents?.length">
                <VList>
                  <VListItem v-for="doc in selectedPharmacy.documents" :key="doc.url">
                    <template #prepend>
                      <VIcon :color="doc.verified ? 'success' : 'warning'">
                        {{ doc.verified ? 'mdi-check-circle' : 'mdi-file-document' }}
                      </VIcon>
                    </template>
                    <VListItemTitle>{{ formatDocumentType(doc.document_type) }}</VListItemTitle>
                    <VListItemSubtitle>
                      Uploaded: {{ formatDate(doc.uploaded_at) }}
                      <VChip v-if="doc.verified" color="success" size="x-small" class="ms-2">Verified</VChip>
                      <VChip v-else color="warning" size="x-small" class="ms-2">Pending</VChip>
                    </VListItemSubtitle>
                    <template #append>
                      <VBtn size="small" variant="text" :href="doc.url" target="_blank">
                        <VIcon>mdi-download</VIcon>
                      </VBtn>
                    </template>
                  </VListItem>
                </VList>
              </div>
              <VAlert v-else type="info" variant="tonal">
                No documents uploaded
              </VAlert>
            </VWindowItem>

            <!-- Banking Tab -->
            <VWindowItem value="banking">
              <VRow>
                <VCol cols="12" md="6">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Bank Details</div>
                  <VList v-if="selectedPharmacy.bank_details?.bank_name" density="compact">
                    <VListItem>
                      <VListItemTitle>Bank Name</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.bank_details.bank_name }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem>
                      <VListItemTitle>Account Number</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.bank_details.account_number }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem>
                      <VListItemTitle>Account Name</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.bank_details.account_name }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem>
                      <VListItemTitle>Verified</VListItemTitle>
                      <VListItemSubtitle>
                        <VChip :color="selectedPharmacy.bank_details.verified ? 'success' : 'warning'" size="x-small">
                          {{ selectedPharmacy.bank_details.verified ? 'Yes' : 'No' }}
                        </VChip>
                      </VListItemSubtitle>
                    </VListItem>
                  </VList>
                  <VAlert v-else type="info" variant="tonal" density="compact">
                    No bank details provided
                  </VAlert>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Financial Info</div>
                  <VList density="compact">
                    <VListItem>
                      <VListItemTitle>Commission Rate</VListItemTitle>
                      <VListItemSubtitle>{{ selectedPharmacy.commission_rate || 0 }}%</VListItemSubtitle>
                    </VListItem>
                    <VListItem>
                      <VListItemTitle>Wallet Balance</VListItemTitle>
                      <VListItemSubtitle>{{ formatPrice(selectedPharmacy.wallet_balance) }}</VListItemSubtitle>
                    </VListItem>
                    <VListItem>
                      <VListItemTitle>Payment Methods</VListItemTitle>
                      <VListItemSubtitle>
                        <VChip v-for="method in selectedPharmacy.accepted_payment_methods" :key="method" size="x-small" class="me-1">
                          {{ method }}
                        </VChip>
                      </VListItemSubtitle>
                    </VListItem>
                  </VList>
                </VCol>
              </VRow>
            </VWindowItem>
          </VWindow>
        </VCardText>
        <VDivider />
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="viewDialog = false">Close</VBtn>
          <VBtn color="primary" @click="editPharmacy(selectedPharmacy); viewDialog = false">Edit</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Add/Edit Pharmacy Dialog -->
    <VDialog v-model="pharmacyDialog" max-width="900" persistent scrollable>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ editingPharmacy ? 'Edit Pharmacy' : 'Add New Pharmacy' }}</span>
          <VBtn icon variant="text" @click="closePharmacyDialog">
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText style="max-height: 70vh; overflow-y: auto;">
          <VForm ref="pharmacyForm" @submit.prevent="savePharmacy">
            <!-- Basic Information -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Basic Information</div>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.name"
                  label="Pharmacy Name *"
                  :rules="[v => !!v || 'Required']"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.trading_name"
                  label="Trading Name"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="pharmacyData.pharmacy_type"
                  label="Pharmacy Type"
                  :items="pharmacyTypeOptions"
                  item-title="title"
                  item-value="value"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.registration_number"
                  label="Registration Number (PCN) *"
                  :rules="[v => !!v || 'Required']"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.license_number"
                  label="License Number"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.license_expiry"
                  label="License Expiry"
                  type="date"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.cac_registration"
                  label="CAC Registration Number"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.tax_id"
                  label="Tax ID (TIN)"
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="pharmacyData.description"
                  label="Description"
                  rows="2"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Contact Information -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Contact Information</div>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.email"
                  label="Email *"
                  type="email"
                  :rules="[v => !!v || 'Required', v => /.+@.+/.test(v) || 'Invalid email']"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.phone"
                  label="Phone *"
                  :rules="[v => !!v || 'Required']"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.alternate_phone"
                  label="Alternate Phone"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.website"
                  label="Website"
                  placeholder="https://"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Address -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Address</div>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="pharmacyData.address.street"
                  label="Street Address *"
                  :rules="[v => !!v || 'Required']"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="pharmacyData.address.city"
                  label="City *"
                  :rules="[v => !!v || 'Required']"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VSelect
                  v-model="pharmacyData.address.state"
                  label="State *"
                  :items="nigerianStates"
                  :rules="[v => !!v || 'Required']"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="pharmacyData.address.postal_code"
                  label="Postal Code"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Superintendent Pharmacist -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Superintendent Pharmacist</div>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.superintendent_pharmacist.name"
                  label="Pharmacist Name"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.superintendent_pharmacist.license_number"
                  label="License Number"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.superintendent_pharmacist.phone"
                  label="Phone"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.superintendent_pharmacist.email"
                  label="Email"
                  type="email"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Delivery Settings -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Delivery Settings</div>
            <VRow>
              <VCol cols="12" md="4">
                <VCheckbox
                  v-model="pharmacyData.offers_delivery"
                  label="Offers Delivery"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VCheckbox
                  v-model="pharmacyData.offers_pickup"
                  label="Offers Pickup"
                />
              </VCol>
              <VCol cols="12" md="4">
                <!-- 24 hours moved to Operating Hours section -->
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="pharmacyData.delivery_fee"
                  label="Delivery Fee"
                  prefix="NGN"
                  type="number"
                  :disabled="!pharmacyData.offers_delivery"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="pharmacyData.free_delivery_threshold"
                  label="Free Delivery Above"
                  prefix="NGN"
                  type="number"
                  hint="Orders above this amount get free delivery"
                  :disabled="!pharmacyData.offers_delivery"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="pharmacyData.min_order_amount"
                  label="Min Order Amount"
                  prefix="NGN"
                  type="number"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="pharmacyData.delivery_radius_km"
                  label="Delivery Radius (km)"
                  type="number"
                  :disabled="!pharmacyData.offers_delivery"
                />
              </VCol>
              <VCol cols="12" md="8">
                <VTextField
                  v-model="pharmacyData.estimated_delivery_time"
                  label="Estimated Delivery Time"
                  placeholder="e.g., 2-4 hours within Lagos"
                  :disabled="!pharmacyData.offers_delivery"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Capabilities -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Capabilities</div>
            <VRow>
              <VCol cols="12" md="4">
                <VCheckbox
                  v-model="pharmacyData.offers_consultation"
                  label="Offers Consultation"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VCheckbox
                  v-model="pharmacyData.can_dispense_controlled"
                  label="Controlled Substances"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VCheckbox
                  v-model="pharmacyData.offers_compounding"
                  label="Compounding"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VCheckbox
                  v-model="pharmacyData.accepts_insurance"
                  label="Accepts Insurance"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VCheckbox
                  v-model="pharmacyData.is_featured"
                  label="Featured Pharmacy"
                />
              </VCol>
              <VCol cols="12" md="4" v-if="pharmacyData.offers_consultation">
                <VTextField
                  v-model.number="pharmacyData.consultation_fee"
                  label="Consultation Fee"
                  prefix="NGN"
                  type="number"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Pickup Center Settings -->
            <div class="text-subtitle-1 font-weight-bold mb-3">
              <VIcon class="me-2">mdi-store-marker</VIcon>
              Pickup Center Settings
            </div>
            <VAlert type="info" variant="tonal" density="compact" class="mb-4">
              When enabled, this pharmacy can serve as a pickup location for orders from <strong>other pharmacies</strong>,
              allowing patients to collect their medications here.
            </VAlert>
            <VRow>
              <VCol cols="12">
                <VCheckbox
                  v-model="pharmacyData.is_pickup_center"
                  label="Available as Pickup Center"
                  hint="Enable this pharmacy to accept pickup orders from other pharmacies"
                  persistent-hint
                  color="primary"
                />
              </VCol>
            </VRow>
            <template v-if="pharmacyData.is_pickup_center">
              <VRow class="mt-2">
                <VCol cols="12" md="4">
                  <VCheckbox
                    v-model="pharmacyData.pickup_center_settings.accepts_external_orders"
                    label="Currently Accepting Orders"
                    hint="Toggle to pause/resume external pickup orders"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12" md="4">
                  <VTextField
                    v-model.number="pharmacyData.pickup_center_settings.max_daily_pickups"
                    label="Max Daily Pickups"
                    type="number"
                    min="1"
                    hint="Maximum pickup orders per day"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12" md="4">
                  <VSelect
                    v-model="pharmacyData.pickup_center_settings.storage_capacity"
                    label="Storage Capacity"
                    :items="storageCapacityOptions"
                    item-title="title"
                    item-value="value"
                    hint="Space for holding external orders"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12" md="4">
                  <VCheckbox
                    v-model="pharmacyData.pickup_center_settings.accepts_refrigerated"
                    label="Accepts Refrigerated Items"
                    hint="Can store cold-chain medications"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12" md="4">
                  <VTextField
                    v-model.number="pharmacyData.pickup_center_settings.handling_fee"
                    label="Handling Fee"
                    prefix="NGN"
                    type="number"
                    min="0"
                    hint="Fee charged for handling external pickups"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12" md="4">
                  <VCheckbox
                    v-model="pharmacyData.pickup_center_settings.pickup_hours_same_as_operating"
                    label="Same as Operating Hours"
                    hint="Use regular business hours for pickups"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="pharmacyData.pickup_center_settings.notification_email"
                    label="Pickup Notification Email"
                    type="email"
                    hint="Email for new pickup order notifications"
                    persistent-hint
                    placeholder="Optional - leave blank to use main email"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="pharmacyData.pickup_center_settings.notification_phone"
                    label="Pickup Notification Phone"
                    hint="Phone for pickup notifications/alerts"
                    persistent-hint
                    placeholder="Optional - leave blank to use main phone"
                  />
                </VCol>
                <VCol cols="12">
                  <VTextarea
                    v-model="pharmacyData.pickup_center_settings.external_pickup_instructions"
                    label="External Pickup Instructions"
                    rows="2"
                    hint="Special instructions for customers picking up external orders (e.g., go to window 3, ask for pickup department)"
                    persistent-hint
                    placeholder="e.g., External pickups are handled at the side entrance. Please bring your order confirmation and valid ID."
                  />
                </VCol>
              </VRow>
            </template>

            <VDivider class="my-4" />

            <!-- Operating Hours -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Operating Hours</div>
            <VRow>
              <VCol cols="12">
                <VCheckbox
                  v-model="pharmacyData.is_24_hours"
                  label="Open 24 Hours (all days)"
                  hint="If checked, the pharmacy is open 24/7"
                  persistent-hint
                />
              </VCol>
            </VRow>
            <VRow v-if="!pharmacyData.is_24_hours">
              <VCol cols="12">
                <VTable density="compact">
                  <thead>
                    <tr>
                      <th style="width: 120px;">Day</th>
                      <th style="width: 80px;">Open?</th>
                      <th>Opening Time</th>
                      <th>Closing Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(hours, index) in pharmacyData.operating_hours" :key="hours.day">
                      <td class="font-weight-medium">{{ formatDayName(hours.day) }}</td>
                      <td>
                        <VCheckbox
                          v-model="hours.is_open"
                          hide-details
                          density="compact"
                        />
                      </td>
                      <td>
                        <VTextField
                          v-model="hours.open_time"
                          type="time"
                          density="compact"
                          hide-details
                          :disabled="!hours.is_open"
                          style="max-width: 150px;"
                        />
                      </td>
                      <td>
                        <VTextField
                          v-model="hours.close_time"
                          type="time"
                          density="compact"
                          hide-details
                          :disabled="!hours.is_open"
                          style="max-width: 150px;"
                        />
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Bank Details -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Bank Details</div>
            <VRow>
              <VCol cols="12" md="6">
                <VAutocomplete
                  v-model="pharmacyData.bank_details.bank_code"
                  :items="nigerianBanks"
                  item-title="title"
                  item-value="value"
                  label="Bank Name"
                  clearable
                  @update:model-value="onBankSelect"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.bank_details.account_number"
                  label="Account Number"
                  maxlength="10"
                  counter
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="pharmacyData.bank_details.account_name"
                  label="Account Name"
                  hint="Will be auto-filled after verification"
                  persistent-hint
                />
              </VCol>
              <VCol cols="12" md="6">
                <div class="d-flex align-center h-100">
                  <VChip
                    :color="pharmacyData.bank_details.verified ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ pharmacyData.bank_details.verified ? 'Verified' : 'Not Verified' }}
                  </VChip>
                </div>
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Financial Settings -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Financial Settings</div>
            <VRow>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="pharmacyData.commission_rate"
                  label="Commission Rate"
                  suffix="%"
                  type="number"
                  min="0"
                  max="100"
                  hint="Platform commission on orders"
                  persistent-hint
                />
              </VCol>
              <VCol cols="12" md="8">
                <VSelect
                  v-model="pharmacyData.accepted_payment_methods"
                  :items="paymentMethodOptions"
                  item-title="title"
                  item-value="value"
                  label="Accepted Payment Methods"
                  multiple
                  chips
                  closable-chips
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Documents (only for editing) -->
            <template v-if="editingPharmacy">
              <div class="text-subtitle-1 font-weight-bold mb-3">Documents</div>

              <!-- Existing Documents -->
              <VRow v-if="editingPharmacy.documents?.length" class="mb-4">
                <VCol cols="12">
                  <VTable density="compact">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Status</th>
                        <th>Uploaded</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(doc, index) in editingPharmacy.documents" :key="index">
                        <td>
                          <div class="d-flex align-center">
                            <VIcon :color="getDocumentStatusColor(doc)" class="me-2">
                              {{ getDocumentStatusIcon(doc) }}
                            </VIcon>
                            <div>
                              <div class="font-weight-medium">{{ getDocumentTypeName(doc.document_type) }}</div>
                              <div v-if="doc.file_name" class="text-caption text-medium-emphasis">{{ doc.file_name }}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <VChip
                            :color="getDocumentStatusColor(doc)"
                            size="small"
                            variant="tonal"
                          >
                            {{ getDocumentStatusText(doc) }}
                          </VChip>
                          <div v-if="doc.rejection_reason" class="text-caption text-error mt-1">
                            Reason: {{ doc.rejection_reason }}
                          </div>
                          <div v-if="doc.verified && doc.verified_at" class="text-caption text-medium-emphasis mt-1">
                            Verified: {{ formatDate(doc.verified_at) }}
                          </div>
                        </td>
                        <td>
                          <div class="text-body-2">{{ formatDate(doc.uploaded_at) }}</div>
                        </td>
                        <td class="text-right">
                          <VBtn
                            size="small"
                            variant="text"
                            icon
                            title="View/Download"
                            :loading="viewingDocument === index"
                            @click="viewDocument(index)"
                          >
                            <VIcon>mdi-eye</VIcon>
                          </VBtn>
                          <VBtn
                            v-if="!doc.verified"
                            size="small"
                            variant="text"
                            color="success"
                            icon
                            title="Approve"
                            :loading="verifyingDocument === index"
                            @click="approveDocument(index)"
                          >
                            <VIcon>mdi-check</VIcon>
                          </VBtn>
                          <VBtn
                            v-if="!doc.verified || !doc.rejection_reason"
                            size="small"
                            variant="text"
                            color="warning"
                            icon
                            title="Reject"
                            @click="openRejectDialog(index)"
                          >
                            <VIcon>mdi-close</VIcon>
                          </VBtn>
                          <VBtn
                            size="small"
                            variant="text"
                            color="error"
                            icon
                            title="Delete"
                            @click="removeDocument(index)"
                          >
                            <VIcon>mdi-delete</VIcon>
                          </VBtn>
                        </td>
                      </tr>
                    </tbody>
                  </VTable>
                </VCol>
              </VRow>
              <VAlert v-else type="info" variant="tonal" density="compact" class="mb-4">
                No documents uploaded yet
              </VAlert>

              <!-- Upload New Document -->
              <VRow>
                <VCol cols="12" md="4">
                  <VSelect
                    v-model="documentToUpload.document_type"
                    :items="documentTypes"
                    item-title="title"
                    item-value="value"
                    label="Document Type"
                  />
                </VCol>
                <VCol cols="12" md="5">
                  <VFileInput
                    v-model="documentToUpload.file"
                    label="Select File"
                    accept=".pdf,.jpg,.jpeg,.png"
                    prepend-icon="mdi-paperclip"
                    show-size
                    :disabled="!documentToUpload.document_type"
                  />
                </VCol>
                <VCol cols="12" md="3">
                  <VBtn
                    color="primary"
                    variant="outlined"
                    :loading="uploadingDocument"
                    :disabled="!documentToUpload.document_type || !documentToUpload.file"
                    @click="uploadDocument"
                    block
                    class="mt-2"
                  >
                    <VIcon start>mdi-upload</VIcon>
                    Upload
                  </VBtn>
                </VCol>
              </VRow>
            </template>
          </VForm>
        </VCardText>
        <VDivider />
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="closePharmacyDialog">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="savePharmacy">
            {{ editingPharmacy ? 'Update' : 'Create' }} Pharmacy
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Verify Dialog -->
    <VDialog v-model="verifyDialog" max-width="500">
      <VCard>
        <VCardTitle>Verify Pharmacy</VCardTitle>
        <VCardText>
          <p class="mb-3">
            Verify <strong>{{ selectedPharmacy?.name }}</strong>?
          </p>
          <VSelect
            v-model="verifyData.verification_status"
            label="Verification Status"
            :items="[
              { title: 'Verified', value: 'VERIFIED' },
              { title: 'Rejected', value: 'REJECTED' },
            ]"
            item-title="title"
            item-value="value"
          />
          <VTextarea
            v-model="verifyData.verification_notes"
            label="Notes"
            rows="3"
            class="mt-3"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="verifyDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="verifyPharmacy">Confirm</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Suspend Dialog -->
    <VDialog v-model="suspendDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-warning">Suspend Pharmacy</VCardTitle>
        <VCardText>
          <p class="mb-3">
            Suspend <strong>{{ selectedPharmacy?.name }}</strong>?
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

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard>
        <VCardTitle class="text-error">Delete Pharmacy</VCardTitle>
        <VCardText>
          Are you sure you want to delete <strong>{{ selectedPharmacy?.name }}</strong>?
          This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" :loading="saving" @click="deletePharmacy">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Document Rejection Dialog -->
    <VDialog v-model="rejectDocumentDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-warning">Reject Document</VCardTitle>
        <VCardText>
          <p class="mb-3">
            Reject <strong>{{ getDocumentTypeName(editingPharmacy?.documents?.[documentToReject]?.document_type) }}</strong>?
          </p>
          <VTextarea
            v-model="rejectionReason"
            label="Rejection Reason *"
            rows="3"
            :rules="[v => !!v || 'Please provide a reason']"
            placeholder="e.g., Document is expired, illegible, or incomplete"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="rejectDocumentDialog = false">Cancel</VBtn>
          <VBtn color="warning" :loading="verifyingDocument !== null" @click="rejectDocument">Reject</VBtn>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash'

const router = useRouter()

// API Base URL
const API_BASE = '/admin-api/pharmacy'

// State
const loading = ref(false)
const saving = ref(false)
const pharmacies = ref([])
const totalPages = ref(1)
const currentPage = ref(1)
const itemsPerPage = ref(25)
const searchQuery = ref('')
const statusFilter = ref(null)
const stateFilter = ref(null)
const onlineOnly = ref(false)
const pickupCenterOnly = ref(false)

// Stats
const stats = reactive({
  total: 0,
  verified: 0,
  online: 0,
  pending: 0,
})

// Dialogs
const pharmacyDialog = ref(false)
const viewDialog = ref(false)
const verifyDialog = ref(false)
const suspendDialog = ref(false)
const deleteDialog = ref(false)
const editingPharmacy = ref(null)
const selectedPharmacy = ref(null)
const detailTab = ref('info')
const suspendReason = ref('')
const verifyData = reactive({
  verification_status: 'VERIFIED',
  verification_notes: '',
})

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
})

// Form Data
const defaultPharmacyData = {
  name: '',
  trading_name: '',
  description: '',
  pharmacy_type: 'RETAIL',
  registration_number: '',
  license_number: '',
  license_expiry: '',
  cac_registration: '',
  tax_id: '',
  email: '',
  phone: '',
  alternate_phone: '',
  website: '',
  address: {
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postal_code: '',
  },
  superintendent_pharmacist: {
    name: '',
    license_number: '',
    phone: '',
    email: '',
  },
  // Operating Hours
  operating_hours: [
    { day: 'MONDAY', is_open: true, open_time: '08:00', close_time: '18:00' },
    { day: 'TUESDAY', is_open: true, open_time: '08:00', close_time: '18:00' },
    { day: 'WEDNESDAY', is_open: true, open_time: '08:00', close_time: '18:00' },
    { day: 'THURSDAY', is_open: true, open_time: '08:00', close_time: '18:00' },
    { day: 'FRIDAY', is_open: true, open_time: '08:00', close_time: '18:00' },
    { day: 'SATURDAY', is_open: true, open_time: '09:00', close_time: '17:00' },
    { day: 'SUNDAY', is_open: false, open_time: '', close_time: '' },
  ],
  // Delivery Settings
  offers_delivery: true,
  offers_pickup: true,
  is_24_hours: false,
  delivery_fee: 0,
  free_delivery_threshold: 0,
  min_order_amount: 0,
  delivery_radius_km: 10,
  estimated_delivery_time: '',
  // Capabilities
  offers_consultation: false,
  consultation_fee: 0,
  can_dispense_controlled: false,
  offers_compounding: false,
  accepts_insurance: false,
  accepted_insurance_providers: [],
  is_featured: false,
  // Pickup Center Settings
  is_pickup_center: false,
  pickup_center_settings: {
    accepts_external_orders: true,
    max_daily_pickups: 50,
    storage_capacity: 'medium',
    accepts_refrigerated: false,
    pickup_hours_same_as_operating: true,
    external_pickup_instructions: '',
    handling_fee: 0,
    notification_email: '',
    notification_phone: '',
  },
  // Bank Details
  bank_details: {
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_name: '',
    verified: false,
  },
  // Financial
  commission_rate: 0,
  accepted_payment_methods: ['CARD', 'BANK_TRANSFER'],
}

const pharmacyData = reactive({ ...defaultPharmacyData })

// Options
const verificationStatusOptions = [
  { title: 'Verified', value: 'VERIFIED' },
  { title: 'Pending', value: 'PENDING' },
  { title: 'Rejected', value: 'REJECTED' },
  { title: 'Suspended', value: 'SUSPENDED' },
]

const pharmacyTypeOptions = [
  { title: 'Retail', value: 'RETAIL' },
  { title: 'Hospital', value: 'HOSPITAL' },
  { title: 'Community', value: 'COMMUNITY' },
  { title: 'Compounding', value: 'COMPOUNDING' },
  { title: 'Specialty', value: 'SPECIALTY' },
  { title: 'Online', value: 'ONLINE' },
]

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

const paymentMethodOptions = [
  { title: 'Card', value: 'CARD' },
  { title: 'Bank Transfer', value: 'BANK_TRANSFER' },
  { title: 'Cash', value: 'CASH' },
  { title: 'Wallet', value: 'WALLET' },
  { title: 'Cash on Delivery', value: 'CASH_ON_DELIVERY' },
]

const storageCapacityOptions = [
  { title: 'Small (up to 20 orders)', value: 'small' },
  { title: 'Medium (20-50 orders)', value: 'medium' },
  { title: 'Large (50+ orders)', value: 'large' },
]

const nigerianBanks = [
  { title: 'Access Bank', value: '044' },
  { title: 'Citibank Nigeria', value: '023' },
  { title: 'Ecobank Nigeria', value: '050' },
  { title: 'Fidelity Bank', value: '070' },
  { title: 'First Bank of Nigeria', value: '011' },
  { title: 'First City Monument Bank', value: '214' },
  { title: 'Guaranty Trust Bank', value: '058' },
  { title: 'Heritage Bank', value: '030' },
  { title: 'Keystone Bank', value: '082' },
  { title: 'Polaris Bank', value: '076' },
  { title: 'Stanbic IBTC Bank', value: '221' },
  { title: 'Standard Chartered Bank', value: '068' },
  { title: 'Sterling Bank', value: '232' },
  { title: 'Union Bank of Nigeria', value: '032' },
  { title: 'United Bank for Africa', value: '033' },
  { title: 'Unity Bank', value: '215' },
  { title: 'Wema Bank', value: '035' },
  { title: 'Zenith Bank', value: '057' },
  { title: 'Kuda Bank', value: '50211' },
  { title: 'Opay', value: '999992' },
  { title: 'PalmPay', value: '999991' },
]

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const documentTypes = [
  { title: 'Pharmacy License', value: 'license' },
  { title: 'Registration Certificate', value: 'registration' },
  { title: 'Tax Certificate', value: 'tax' },
  { title: 'CAC Certificate', value: 'cac' },
  { title: 'Superintendent Pharmacist License', value: 'superintendent_license' },
  { title: 'Insurance Certificate', value: 'insurance' },
  { title: 'Other Document', value: 'other' },
]

// Document upload state
const uploadingDocument = ref(false)
const documentToUpload = reactive({
  document_type: '',
  file: null,
})

// Document verification state
const verifyingDocument = ref(null)
const viewingDocument = ref(null)
const rejectDocumentDialog = ref(false)
const documentToReject = ref(null)
const rejectionReason = ref('')

// Auth Headers
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.access_token}`,
  }
}

// Fetch Pharmacies
const fetchPharmacies = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: itemsPerPage.value,
    })
    if (searchQuery.value) params.append('search', searchQuery.value)
    if (statusFilter.value) params.append('verification_status', statusFilter.value)
    if (stateFilter.value) params.append('state', stateFilter.value)
    if (onlineOnly.value) params.append('is_online', 'true')
    if (pickupCenterOnly.value) params.append('is_pickup_center', 'true')

    const response = await fetch(`${API_BASE}/pharmacies?${params}`, {
      headers: getAuthHeaders(),
    })

    const data = await response.json()

    if (response.ok && data.data) {
      const result = data.data
      pharmacies.value = result.pharmacies || []
      totalPages.value = result.totalPages || 1
      calculateStats()
    } else {
      console.error('Fetch pharmacies failed:', response.status, data)
      showSnackbar(data.errorMessage || data.message || 'Failed to fetch pharmacies', 'error')
    }
  } catch (error) {
    console.error('Fetch pharmacies error:', error)
    showSnackbar('Failed to fetch pharmacies', 'error')
  } finally {
    loading.value = false
  }
}

const calculateStats = () => {
  stats.total = pharmacies.value.length
  stats.verified = pharmacies.value.filter(p => p.verification_status === 'VERIFIED').length
  stats.online = pharmacies.value.filter(p => p.is_online).length
  stats.pending = pharmacies.value.filter(p => p.verification_status === 'PENDING').length
}

// Debounced Search
const debouncedSearch = debounce(() => {
  currentPage.value = 1
  fetchPharmacies()
}, 300)

// Dialog Methods
const openAddDialog = () => {
  editingPharmacy.value = null
  Object.assign(pharmacyData, JSON.parse(JSON.stringify(defaultPharmacyData)))
  pharmacyDialog.value = true
}

const viewPharmacy = (pharmacy) => {
  selectedPharmacy.value = pharmacy
  detailTab.value = 'info'
  viewDialog.value = true
}

const viewPerformance = (pharmacy) => {
  router.push({ path: `/pharmacy/pharmacies/${pharmacy._id}/performance` })
}

const editPharmacy = (pharmacy) => {
  editingPharmacy.value = pharmacy

  // Prepare operating hours - merge with defaults if incomplete
  let operatingHours = defaultPharmacyData.operating_hours.map(defaultDay => {
    const existingDay = pharmacy.operating_hours?.find(h => h.day === defaultDay.day)
    return existingDay ? { ...defaultDay, ...existingDay } : { ...defaultDay }
  })

  Object.assign(pharmacyData, {
    name: pharmacy.name || '',
    trading_name: pharmacy.trading_name || '',
    description: pharmacy.description || '',
    pharmacy_type: pharmacy.pharmacy_type || 'RETAIL',
    registration_number: pharmacy.registration_number || '',
    license_number: pharmacy.license_number || '',
    license_expiry: pharmacy.license_expiry ? pharmacy.license_expiry.slice(0, 10) : '',
    cac_registration: pharmacy.cac_registration || '',
    tax_id: pharmacy.tax_id || '',
    email: pharmacy.email || '',
    phone: pharmacy.phone || '',
    alternate_phone: pharmacy.alternate_phone || '',
    website: pharmacy.website || '',
    address: { ...defaultPharmacyData.address, ...pharmacy.address },
    superintendent_pharmacist: { ...defaultPharmacyData.superintendent_pharmacist, ...pharmacy.superintendent_pharmacist },
    // Operating Hours
    operating_hours: operatingHours,
    // Delivery Settings
    offers_delivery: pharmacy.offers_delivery ?? true,
    offers_pickup: pharmacy.offers_pickup ?? true,
    is_24_hours: pharmacy.is_24_hours ?? false,
    delivery_fee: pharmacy.delivery_fee || 0,
    free_delivery_threshold: pharmacy.free_delivery_threshold || 0,
    min_order_amount: pharmacy.min_order_amount || 0,
    delivery_radius_km: pharmacy.delivery_radius_km || 10,
    estimated_delivery_time: pharmacy.estimated_delivery_time || '',
    // Capabilities
    offers_consultation: pharmacy.offers_consultation ?? false,
    consultation_fee: pharmacy.consultation_fee || 0,
    can_dispense_controlled: pharmacy.can_dispense_controlled ?? false,
    offers_compounding: pharmacy.offers_compounding ?? false,
    accepts_insurance: pharmacy.accepts_insurance ?? false,
    accepted_insurance_providers: pharmacy.accepted_insurance_providers || [],
    is_featured: pharmacy.is_featured ?? false,
    // Pickup Center Settings
    is_pickup_center: pharmacy.is_pickup_center ?? false,
    pickup_center_settings: {
      accepts_external_orders: pharmacy.pickup_center_settings?.accepts_external_orders ?? true,
      max_daily_pickups: pharmacy.pickup_center_settings?.max_daily_pickups ?? 50,
      storage_capacity: pharmacy.pickup_center_settings?.storage_capacity || 'medium',
      accepts_refrigerated: pharmacy.pickup_center_settings?.accepts_refrigerated ?? false,
      pickup_hours_same_as_operating: pharmacy.pickup_center_settings?.pickup_hours_same_as_operating ?? true,
      external_pickup_instructions: pharmacy.pickup_center_settings?.external_pickup_instructions || '',
      handling_fee: pharmacy.pickup_center_settings?.handling_fee ?? 0,
      notification_email: pharmacy.pickup_center_settings?.notification_email || '',
      notification_phone: pharmacy.pickup_center_settings?.notification_phone || '',
    },
    // Bank Details
    bank_details: {
      bank_name: pharmacy.bank_details?.bank_name || '',
      bank_code: pharmacy.bank_details?.bank_code || '',
      account_number: pharmacy.bank_details?.account_number || '',
      account_name: pharmacy.bank_details?.account_name || '',
      verified: pharmacy.bank_details?.verified ?? false,
    },
    // Financial
    commission_rate: pharmacy.commission_rate || 0,
    accepted_payment_methods: pharmacy.accepted_payment_methods || ['CARD', 'BANK_TRANSFER'],
  })
  pharmacyDialog.value = true
}

const closePharmacyDialog = () => {
  pharmacyDialog.value = false
  editingPharmacy.value = null
  Object.assign(pharmacyData, JSON.parse(JSON.stringify(defaultPharmacyData)))
}

// Save Pharmacy
const savePharmacy = async () => {
  saving.value = true
  try {
    const url = editingPharmacy.value
      ? `${API_BASE}/pharmacies/${editingPharmacy.value._id}`
      : `${API_BASE}/pharmacies`

    const method = editingPharmacy.value ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(pharmacyData),
    })

    const result = await response.json()

    if (response.ok && result.data) {
      showSnackbar(editingPharmacy.value ? 'Pharmacy updated' : 'Pharmacy created', 'success')
      closePharmacyDialog()
      fetchPharmacies()
    } else {
      showSnackbar(result.message || 'Failed to save pharmacy', 'error')
    }
  } catch (error) {
    showSnackbar('Failed to save pharmacy', 'error')
  } finally {
    saving.value = false
  }
}

// Verify Pharmacy
const openVerifyDialog = (pharmacy) => {
  selectedPharmacy.value = pharmacy
  verifyData.verification_status = 'VERIFIED'
  verifyData.verification_notes = ''
  verifyDialog.value = true
}

const verifyPharmacy = async () => {
  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/pharmacies/${selectedPharmacy.value._id}/verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(verifyData),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Pharmacy verification updated', 'success')
      verifyDialog.value = false
      fetchPharmacies()
    } else {
      showSnackbar(result.message || 'Failed to verify pharmacy', 'error')
    }
  } catch (error) {
    showSnackbar('Failed to verify pharmacy', 'error')
  } finally {
    saving.value = false
  }
}

// Suspend Pharmacy
const openSuspendDialog = (pharmacy) => {
  selectedPharmacy.value = pharmacy
  suspendReason.value = ''
  suspendDialog.value = true
}

const suspendPharmacy = async () => {
  if (!suspendReason.value) {
    showSnackbar('Please provide a reason', 'error')
    return
  }
  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/pharmacies/${selectedPharmacy.value._id}/suspend`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason: suspendReason.value }),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Pharmacy suspended', 'success')
      suspendDialog.value = false
      fetchPharmacies()
    } else {
      showSnackbar(result.message || 'Failed to suspend pharmacy', 'error')
    }
  } catch (error) {
    showSnackbar('Failed to suspend pharmacy', 'error')
  } finally {
    saving.value = false
  }
}

// Reactivate Pharmacy
const reactivatePharmacy = async (pharmacy) => {
  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/pharmacies/${pharmacy._id}/reactivate`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Pharmacy reactivated', 'success')
      fetchPharmacies()
    } else {
      showSnackbar(result.message || 'Failed to reactivate pharmacy', 'error')
    }
  } catch (error) {
    showSnackbar('Failed to reactivate pharmacy', 'error')
  } finally {
    saving.value = false
  }
}

// Delete
const confirmDelete = (pharmacy) => {
  selectedPharmacy.value = pharmacy
  deleteDialog.value = true
}

const deletePharmacy = async () => {
  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/pharmacies/${selectedPharmacy.value._id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Pharmacy deleted', 'success')
      deleteDialog.value = false
      fetchPharmacies()
    } else {
      showSnackbar(result.message || 'Failed to delete pharmacy', 'error')
    }
  } catch (error) {
    showSnackbar('Failed to delete pharmacy', 'error')
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
  const normalizedStatus = status?.toUpperCase()
  const colors = {
    VERIFIED: 'success',
    PENDING: 'warning',
    REJECTED: 'error',
    SUSPENDED: 'grey',
  }
  return colors[normalizedStatus] || 'grey'
}

const getVerificationIcon = (status) => {
  const normalizedStatus = status?.toUpperCase()
  const icons = {
    VERIFIED: 'mdi-check-circle',
    PENDING: 'mdi-clock-outline',
    REJECTED: 'mdi-close-circle',
    SUSPENDED: 'mdi-pause-circle',
  }
  return icons[normalizedStatus] || 'mdi-help-circle'
}

const formatVerificationStatus = (status) => {
  const normalizedStatus = status?.toUpperCase()
  const labels = {
    VERIFIED: 'Verified',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
    SUSPENDED: 'Suspended',
  }
  return labels[normalizedStatus] || status
}

const formatPharmacyType = (type) => {
  const normalizedType = type?.toUpperCase()
  const labels = {
    RETAIL: 'Retail',
    HOSPITAL: 'Hospital',
    COMMUNITY: 'Community',
    COMPOUNDING: 'Compounding',
    SPECIALTY: 'Specialty',
    ONLINE: 'Online',
  }
  return labels[normalizedType] || type
}

const formatDocumentType = (type) => {
  const labels = {
    license: 'Pharmacy License',
    registration: 'Registration Certificate',
    tax: 'Tax Certificate',
    cac: 'CAC Certificate',
    superintendent_license: 'Superintendent Pharmacist License',
    insurance: 'Insurance Certificate',
    other: 'Other Document',
  }
  return labels[type] || type
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
  }).format(price || 0)
}

const formatStorageCapacity = (capacity) => {
  const labels = {
    small: 'Small (up to 20 orders)',
    medium: 'Medium (20-50 orders)',
    large: 'Large (50+ orders)',
  }
  return labels[capacity] || capacity || 'Not specified'
}

const showSnackbar = (message, color = 'success') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

const formatDayName = (day) => {
  if (!day) return day
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
}

const getDocumentTypeName = (type) => {
  const doc = documentTypes.find(d => d.value === type)
  return doc?.title || type
}

const getDocumentStatusColor = (doc) => {
  if (doc.verified) return 'success'
  if (doc.rejection_reason) return 'error'
  return 'warning'
}

const getDocumentStatusIcon = (doc) => {
  if (doc.verified) return 'mdi-check-circle'
  if (doc.rejection_reason) return 'mdi-close-circle'
  return 'mdi-clock-outline'
}

const getDocumentStatusText = (doc) => {
  if (doc.verified) return 'Verified'
  if (doc.rejection_reason) return 'Rejected'
  return 'Pending'
}

const onBankSelect = (bankCode) => {
  if (bankCode) {
    const bank = nigerianBanks.find(b => b.value === bankCode)
    if (bank) {
      pharmacyData.bank_details.bank_name = bank.title
    }
  } else {
    pharmacyData.bank_details.bank_name = ''
  }
}

const uploadDocument = async () => {
  if (!documentToUpload.document_type || !documentToUpload.file) {
    showSnackbar('Please select document type and file', 'error')
    return
  }

  uploadingDocument.value = true
  try {
    const formData = new FormData()
    formData.append('document_type', documentToUpload.document_type)
    // VFileInput returns an array, get the first file
    const file = Array.isArray(documentToUpload.file) ? documentToUpload.file[0] : documentToUpload.file
    if (!file) {
      showSnackbar('Please select a file', 'error')
      uploadingDocument.value = false
      return
    }
    formData.append('file', file)

    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`${API_BASE}/pharmacies/${editingPharmacy.value._id}/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
      body: formData,
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Document uploaded successfully', 'success')
      // Refresh pharmacy data to show new document
      const refreshResponse = await fetch(`${API_BASE}/pharmacies/${editingPharmacy.value._id}`, {
        headers: getAuthHeaders(),
      })
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        if (refreshData.data) {
          editingPharmacy.value = refreshData.data
        }
      }
      // Reset upload form
      documentToUpload.document_type = ''
      documentToUpload.file = null
    } else {
      showSnackbar(result.message || 'Failed to upload document', 'error')
    }
  } catch (err) {
    console.error('Upload document error:', err)
    showSnackbar('Failed to upload document', 'error')
  } finally {
    uploadingDocument.value = false
  }
}

const removeDocument = async (index) => {
  if (!confirm('Are you sure you want to remove this document?')) return

  try {
    const response = await fetch(`${API_BASE}/pharmacies/${editingPharmacy.value._id}/documents/${index}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Document removed successfully', 'success')
      // Remove from local array
      editingPharmacy.value.documents.splice(index, 1)
    } else {
      showSnackbar(result.message || 'Failed to remove document', 'error')
    }
  } catch (err) {
    showSnackbar('Failed to remove document', 'error')
  }
}

const viewDocument = async (index) => {
  viewingDocument.value = index
  try {
    const response = await fetch(`${API_BASE}/pharmacies/${editingPharmacy.value._id}/documents/${index}/view`, {
      headers: getAuthHeaders(),
    })

    const result = await response.json()

    if (response.ok && result.data?.url) {
      // Open presigned URL in new tab
      window.open(result.data.url, '_blank')
    } else {
      showSnackbar(result.message || 'Failed to get document URL', 'error')
    }
  } catch (err) {
    console.error('View document error:', err)
    showSnackbar('Failed to get document URL', 'error')
  } finally {
    viewingDocument.value = null
  }
}

const approveDocument = async (index) => {
  verifyingDocument.value = index
  try {
    const response = await fetch(`${API_BASE}/pharmacies/${editingPharmacy.value._id}/documents/${index}/verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ verified: true }),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Document approved successfully', 'success')
      // Update local document
      if (result.data?.documents?.[index]) {
        editingPharmacy.value.documents[index] = result.data.documents[index]
      } else {
        editingPharmacy.value.documents[index].verified = true
        editingPharmacy.value.documents[index].verified_at = new Date()
        delete editingPharmacy.value.documents[index].rejection_reason
      }
    } else {
      showSnackbar(result.message || 'Failed to approve document', 'error')
    }
  } catch (err) {
    console.error('Approve document error:', err)
    showSnackbar('Failed to approve document', 'error')
  } finally {
    verifyingDocument.value = null
  }
}

const openRejectDialog = (index) => {
  documentToReject.value = index
  rejectionReason.value = ''
  rejectDocumentDialog.value = true
}

const rejectDocument = async () => {
  if (!rejectionReason.value.trim()) {
    showSnackbar('Please provide a rejection reason', 'error')
    return
  }

  verifyingDocument.value = documentToReject.value
  try {
    const response = await fetch(`${API_BASE}/pharmacies/${editingPharmacy.value._id}/documents/${documentToReject.value}/verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        verified: false,
        rejection_reason: rejectionReason.value.trim(),
      }),
    })

    const result = await response.json()

    if (response.ok) {
      showSnackbar('Document rejected', 'warning')
      // Update local document
      const idx = documentToReject.value
      if (result.data?.documents?.[idx]) {
        editingPharmacy.value.documents[idx] = result.data.documents[idx]
      } else {
        editingPharmacy.value.documents[idx].verified = false
        editingPharmacy.value.documents[idx].rejection_reason = rejectionReason.value.trim()
      }
      rejectDocumentDialog.value = false
    } else {
      showSnackbar(result.message || 'Failed to reject document', 'error')
    }
  } catch (err) {
    console.error('Reject document error:', err)
    showSnackbar('Failed to reject document', 'error')
  } finally {
    verifyingDocument.value = null
  }
}

// Initialize
onMounted(() => {
  fetchPharmacies()
})
</script>
