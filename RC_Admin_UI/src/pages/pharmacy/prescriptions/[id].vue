<template>
  <div>
    <!-- Back Button -->
    <VBtn variant="text" color="primary" class="mb-4" @click="$router.back()">
      <VIcon start>mdi-arrow-left</VIcon>
      Back to Prescriptions
    </VBtn>

    <div v-if="prescription">
      <!-- Linked Order Alert Banner -->
      <VAlert
        v-if="isLinkedToPharmacyOrder"
        type="info"
        variant="tonal"
        prominent
        class="mb-6"
        border="start"
      >
        <template #prepend>
          <VIcon size="32">mdi-link-variant</VIcon>
        </template>
        <VAlertTitle class="text-h6 font-weight-bold">
          Linked to Pharmacy Order
        </VAlertTitle>
        <div class="mb-3">
          This prescription was paid and is being processed through pharmacy order
          <strong>{{ prescription.linked_pharmacy_order_number }}</strong>.
          <br />
          <span class="text-medium-emphasis">
            All order processing, fulfillment, and delivery should be managed through the linked pharmacy order.
          </span>
        </div>
        <VBtn
          color="primary"
          variant="flat"
          @click="goToLinkedOrder"
        >
          <VIcon start>mdi-open-in-new</VIcon>
          Go to Order {{ prescription.linked_pharmacy_order_number }}
        </VBtn>
      </VAlert>

      <!-- Prescription Header -->
      <VRow class="mb-6">
        <VCol cols="12">
          <VCard>
            <VCardText>
              <div class="d-flex justify-space-between align-center flex-wrap">
                <div>
                  <h1 class="text-h4 font-weight-bold mb-2">{{ prescription.prescription_number }}</h1>
                  <div class="d-flex align-center gap-3 flex-wrap">
                    <VChip :color="getTypeColor(prescription.source)" size="large" variant="tonal">
                      <VIcon start size="18">{{ getTypeIcon(prescription.source) }}</VIcon>
                      {{ prescription.type || getTypeName(prescription.source) }}
                    </VChip>
                    <VChip :color="getStatusColor(prescription.status)" size="large">
                      {{ formatStatus(prescription.status) }}
                    </VChip>
                    <!-- Linked Order Badge -->
                    <VChip
                      v-if="isLinkedToPharmacyOrder"
                      color="info"
                      variant="outlined"
                      size="large"
                      @click="goToLinkedOrder"
                      class="cursor-pointer"
                    >
                      <VIcon start size="16">mdi-link</VIcon>
                      Linked: {{ prescription.linked_pharmacy_order_number }}
                    </VChip>
                    <span class="text-medium-emphasis">
                      <VIcon size="16">mdi-calendar</VIcon>
                      Issued: {{ formatDate(prescription.created_at) }}
                    </span>
                    <span v-if="prescription.expiry_date" :class="isExpired ? 'text-error' : 'text-medium-emphasis'">
                      <VIcon size="16">mdi-clock</VIcon>
                      {{ isExpired ? 'Expired' : 'Expires' }}: {{ formatDate(prescription.expiry_date) }}
                    </span>
                  </div>
                </div>
                <div class="d-flex gap-2 mt-4 mt-md-0" v-if="!isLinkedToPharmacyOrder">
                  <VBtn
                    v-if="canFill && !allMedicationsFilled"
                    color="success"
                    @click="fillAll"
                    :loading="filling"
                  >
                    Fill All Medications
                  </VBtn>
                  <VBtn
                    v-if="canRefill"
                    color="primary"
                    @click="processRefill"
                    :loading="filling"
                  >
                    Process Refill
                  </VBtn>
                  <VBtn
                    v-if="hasPdf"
                    color="info"
                    variant="outlined"
                    @click="downloadPdf"
                    :loading="downloadingPdf"
                  >
                    <VIcon start>mdi-download</VIcon>
                    Download PDF
                  </VBtn>
                  <VBtn color="secondary" variant="outlined" @click="printPrescription">
                    <VIcon start>mdi-printer</VIcon>
                    Print
                  </VBtn>
                </div>
                <!-- Show only print button when linked -->
                <div class="d-flex gap-2 mt-4 mt-md-0" v-else>
                  <VBtn color="secondary" variant="outlined" @click="printPrescription">
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
          <!-- Uploaded Document (Patient Upload) -->
          <VCard v-if="isPatientUpload" class="mb-6">
            <VCardTitle>Uploaded Prescription Document</VCardTitle>
            <VCardText>
              <div v-if="prescription.documents?.length > 0" class="mb-4">
                <div v-for="(doc, index) in prescription.documents" :key="index" class="document-card mb-3">
                  <VCard variant="outlined">
                    <VCardText>
                      <div class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center">
                          <VIcon size="40" color="error" class="me-3">mdi-file-pdf-box</VIcon>
                          <div>
                            <div class="font-weight-medium">{{ doc.original_filename || 'Prescription Document' }}</div>
                            <div class="text-caption text-medium-emphasis">Uploaded prescription file</div>
                          </div>
                        </div>
                        <VBtn
                          color="primary"
                          variant="outlined"
                          size="small"
                          :href="doc.url"
                          target="_blank"
                        >
                          <VIcon start>mdi-open-in-new</VIcon>
                          View Document
                        </VBtn>
                      </div>
                    </VCardText>
                  </VCard>
                </div>
              </div>
              <VAlert v-else type="info" variant="tonal">
                No document available for this upload.
              </VAlert>
            </VCardText>
          </VCard>

          <!-- Review Panel (Patient Upload) -->
          <VCard v-if="isPatientUpload && needsReview" class="mb-6" :color="getReviewCardColor" variant="tonal">
            <VCardTitle>
              <div class="d-flex align-center gap-2">
                <VIcon :color="getReviewIconColor">{{ getReviewIcon }}</VIcon>
                <span>Prescription Review</span>
                <VChip v-if="reviewDetails?.fraud_score > 0" :color="getRiskColor(reviewDetails.risk_level)" size="small">
                  Risk: {{ reviewDetails?.risk_level }} ({{ reviewDetails?.fraud_score }}%)
                </VChip>
              </div>
            </VCardTitle>
            <VCardText>
              <!-- Fraud Flags -->
              <div v-if="reviewDetails?.fraud_flags?.length > 0" class="mb-4">
                <h4 class="text-subtitle-2 mb-2">Fraud Detection Flags</h4>
                <VChip
                  v-for="flag in reviewDetails.fraud_flags"
                  :key="flag.flag"
                  :color="getFlagColor(flag.severity)"
                  size="small"
                  class="me-2 mb-2"
                  variant="flat"
                >
                  <VTooltip activator="parent" location="top">{{ flag.description }}</VTooltip>
                  {{ flag.flag }}
                </VChip>
              </div>

              <!-- Clarification Info -->
              <VAlert v-if="reviewDetails?.clarification?.request_message" type="info" variant="tonal" class="mb-4">
                <VAlertTitle>Clarification Requested</VAlertTitle>
                <p class="mb-2">{{ reviewDetails.clarification.request_message }}</p>
                <div v-if="reviewDetails.clarification.required_information?.length > 0" class="mb-2">
                  <strong>Required:</strong>
                  <ul class="ms-4">
                    <li v-for="item in reviewDetails.clarification.required_information" :key="item">{{ item }}</li>
                  </ul>
                </div>
                <div v-if="reviewDetails.clarification.responded_at">
                  <VDivider class="my-2" />
                  <strong>Patient Response:</strong>
                  <p>{{ reviewDetails.clarification.response_message }}</p>
                  <div v-if="reviewDetails.clarification.response_documents?.length > 0">
                    <VBtn
                      v-for="doc in reviewDetails.clarification.response_documents"
                      :key="doc.url"
                      :href="doc.url"
                      target="_blank"
                      size="small"
                      variant="outlined"
                      class="me-2"
                    >
                      <VIcon start>mdi-file</VIcon>
                      {{ doc.filename }}
                    </VBtn>
                  </div>
                </div>
              </VAlert>

              <!-- Review Actions -->
              <div class="d-flex gap-2 flex-wrap">
                <VBtn color="success" @click="openApproveDialog" :loading="reviewLoading">
                  <VIcon start>mdi-check</VIcon>
                  Approve
                </VBtn>
                <VBtn color="error" variant="outlined" @click="openRejectDialog" :loading="reviewLoading">
                  <VIcon start>mdi-close</VIcon>
                  Reject
                </VBtn>
                <VBtn color="info" variant="outlined" @click="openClarificationDialog" :loading="reviewLoading" v-if="!hasPendingClarification">
                  <VIcon start>mdi-message-question</VIcon>
                  Request Clarification
                </VBtn>
              </div>
            </VCardText>
          </VCard>

          <!-- Approved/Rejected Status (Patient Upload) -->
          <VAlert v-if="isPatientUpload && isApproved" type="success" variant="tonal" class="mb-6" prominent>
            <template #prepend><VIcon size="32">mdi-check-circle</VIcon></template>
            <VAlertTitle>Prescription Approved</VAlertTitle>
            <div v-if="reviewDetails?.review">
              Reviewed by {{ reviewDetails.review.reviewed_by?.name }} on {{ formatDate(reviewDetails.review.reviewed_at) }}
              <div v-if="reviewDetails.review.review_notes" class="mt-1 text-medium-emphasis">
                Notes: {{ reviewDetails.review.review_notes }}
              </div>
            </div>
          </VAlert>

          <VAlert v-if="isPatientUpload && isRejected" type="error" variant="tonal" class="mb-6" prominent>
            <template #prepend><VIcon size="32">mdi-close-circle</VIcon></template>
            <VAlertTitle class="d-flex align-center gap-2">
              Prescription Rejected
              <VChip v-if="reviewDetails?.fraud_score > 0" :color="getRiskColor(reviewDetails.risk_level)" size="small">
                Risk: {{ reviewDetails?.risk_level }} ({{ reviewDetails?.fraud_score }}%)
              </VChip>
            </VAlertTitle>

            <!-- Pharmacist rejection -->
            <div v-if="reviewDetails?.review?.rejection_reason">
              <strong>Reason:</strong> {{ reviewDetails.review.rejection_reason }}
              <div class="mt-1 text-medium-emphasis">
                Reviewed by {{ reviewDetails.review.reviewed_by?.name }} on {{ formatDate(reviewDetails.review.reviewed_at) }}
              </div>
            </div>

            <!-- Automatic verification failure -->
            <div v-else-if="failedVerificationChecks.length > 0">
              <strong>Automatic Verification Failed:</strong>
              <div class="mt-2">
                <div v-for="(check, index) in failedVerificationChecks" :key="index" class="d-flex align-start gap-2 mb-2">
                  <VIcon :color="getSeverityColor(check.severity)" size="18">
                    {{ check.severity === 'CRITICAL' ? 'mdi-alert-circle' : 'mdi-alert' }}
                  </VIcon>
                  <div>
                    <strong>{{ check.check_name }}:</strong> {{ check.details }}
                    <VChip v-if="check.severity" :color="getSeverityColor(check.severity)" size="x-small" class="ml-2">
                      {{ check.severity }}
                    </VChip>
                  </div>
                </div>
              </div>
              <div class="mt-3 text-medium-emphasis">
                <VIcon size="14">mdi-robot</VIcon>
                Automatically rejected by verification system
              </div>
            </div>

            <!-- No specific reason available -->
            <div v-else class="text-medium-emphasis">
              No specific rejection reason recorded.
            </div>
          </VAlert>

          <!-- Inventory Check Panel (for approved patient uploads) -->
          <VCard v-if="isPatientUpload && isApproved" class="mb-6">
            <VCardTitle>
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-2">
                  <VIcon>mdi-package-variant</VIcon>
                  <span>Inventory Availability</span>
                </div>
                <VBtn
                  v-if="!inventoryCheck"
                  color="primary"
                  variant="tonal"
                  :loading="inventoryLoading"
                  @click="checkInventory"
                >
                  <VIcon start>mdi-magnify</VIcon>
                  Check Inventory
                </VBtn>
              </div>
            </VCardTitle>
            <VCardText v-if="inventoryCheck">
              <!-- Summary -->
              <div class="d-flex gap-4 mb-4 flex-wrap">
                <VChip :color="inventoryCheck.available ? 'success' : 'error'" size="large" variant="flat">
                  <VIcon start>{{ inventoryCheck.available ? 'mdi-check-circle' : 'mdi-alert-circle' }}</VIcon>
                  {{ inventoryCheck.available ? 'All Items Available' : 'Stock Issues Detected' }}
                </VChip>
                <VChip v-if="inventoryCheck.out_of_stock_items > 0" color="error" variant="tonal">
                  {{ inventoryCheck.out_of_stock_items }} Out of Stock
                </VChip>
                <VChip v-if="inventoryCheck.partial_stock_items > 0" color="warning" variant="tonal">
                  {{ inventoryCheck.partial_stock_items }} Partial Stock
                </VChip>
                <VChip color="info" variant="tonal">
                  Total: {{ formatPrice(inventoryCheck.total_price) }}
                </VChip>
              </div>

              <!-- Items Table -->
              <VTable density="compact">
                <thead>
                  <tr>
                    <th>Drug</th>
                    <th>Requested</th>
                    <th>Available</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in inventoryCheck.items" :key="item.drug_id || item.prescription_name">
                    <td>
                      <div class="font-weight-medium">{{ item.drug_name }}</div>
                      <div v-if="item.prescription_name !== item.drug_name" class="text-caption text-medium-emphasis">
                        Prescription: {{ item.prescription_name }}
                      </div>
                    </td>
                    <td>{{ item.requested_quantity }}</td>
                    <td>{{ item.available_quantity }}</td>
                    <td>{{ formatPrice(item.price) }}</td>
                    <td>
                      <VChip
                        :color="item.is_available ? 'success' : (item.available_quantity > 0 ? 'warning' : 'error')"
                        size="small"
                      >
                        {{ item.is_available ? 'Available' : (item.available_quantity > 0 ? 'Partial' : 'Out of Stock') }}
                      </VChip>
                    </td>
                  </tr>
                </tbody>
              </VTable>

              <!-- Alternatives for out-of-stock items -->
              <div v-for="item in inventoryCheck.items.filter(i => i.alternatives?.length > 0)" :key="'alt-' + item.drug_id" class="mt-4">
                <VAlert type="info" variant="tonal" density="compact">
                  <VAlertTitle class="text-subtitle-2">Alternatives for {{ item.drug_name }}</VAlertTitle>
                  <div class="d-flex gap-2 flex-wrap mt-2">
                    <VChip
                      v-for="alt in item.alternatives"
                      :key="alt.drug_id"
                      variant="outlined"
                      size="small"
                    >
                      {{ alt.name }} ({{ alt.available_quantity }} available - {{ formatPrice(alt.price) }})
                    </VChip>
                  </div>
                </VAlert>
              </div>

              <!-- Reserve Stock Actions -->
              <div class="d-flex gap-2 mt-4">
                <VBtn
                  v-if="inventoryCheck.available"
                  color="success"
                  :loading="reservingStock"
                  @click="reserveStock"
                >
                  <VIcon start>mdi-lock</VIcon>
                  Reserve Stock
                </VBtn>
                <VBtn
                  color="secondary"
                  variant="outlined"
                  :loading="inventoryLoading"
                  @click="checkInventory"
                >
                  <VIcon start>mdi-refresh</VIcon>
                  Refresh
                </VBtn>
              </div>
            </VCardText>
          </VCard>

          <!-- Extracted Medications (OCR Data) -->
          <VCard v-if="isPatientUpload && prescription.medications?.length > 0" class="mb-6">
            <VCardTitle>
              <div class="d-flex align-center gap-2">
                <span>Extracted Medications</span>
                <VChip size="small" color="info" variant="tonal">OCR Data</VChip>
              </div>
            </VCardTitle>
            <VCardText>
              <VList density="compact">
                <VListItem v-for="(med, index) in prescription.medications" :key="index">
                  <template #prepend>
                    <VIcon color="primary">mdi-pill</VIcon>
                  </template>
                  <VListItemTitle>{{ med.name || med.drug_name || 'Unknown Medication' }}</VListItemTitle>
                  <VListItemSubtitle v-if="med.dosage || med.quantity">
                    {{ med.dosage }} {{ med.quantity ? `- Qty: ${med.quantity}` : '' }}
                  </VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>

          <!-- Medications (Specialist Prescription) -->
          <VCard v-if="!isPatientUpload" class="mb-6">
            <VCardTitle>Prescribed Medications</VCardTitle>
            <VCardText>
              <div v-for="(med, index) in prescription.medications" :key="index" class="medication-card mb-4">
                <VCard variant="outlined">
                  <VCardText>
                    <div class="d-flex justify-space-between align-center mb-3">
                      <div>
                        <div class="text-h6 font-weight-medium">{{ med.drug_name }}</div>
                        <div class="text-body-2 text-medium-emphasis">
                          {{ med.drug_strength }} | {{ med.manufacturer || 'Generic' }}
                        </div>
                      </div>
                      <VChip
                        :color="isLinkedToPharmacyOrder ? 'info' : (med.stock_reserved ? 'success' : 'warning')"
                        size="small"
                      >
                        <VIcon v-if="isLinkedToPharmacyOrder" start size="14">mdi-link</VIcon>
                        {{ isLinkedToPharmacyOrder ? 'In Order' : (med.stock_reserved ? 'Reserved' : 'Pending') }}
                      </VChip>
                    </div>

                    <VRow>
                      <VCol cols="6" md="3">
                        <div class="text-caption text-medium-emphasis">Quantity</div>
                        <div class="font-weight-medium">{{ med.quantity }}</div>
                      </VCol>
                      <VCol cols="6" md="3">
                        <div class="text-caption text-medium-emphasis">Dosage</div>
                        <div class="font-weight-medium">{{ med.dosage }}</div>
                      </VCol>
                      <VCol cols="6" md="3">
                        <div class="text-caption text-medium-emphasis">Frequency</div>
                        <div class="font-weight-medium">{{ med.frequency }}</div>
                      </VCol>
                      <VCol cols="6" md="3" v-if="med.duration">
                        <div class="text-caption text-medium-emphasis">Duration</div>
                        <div class="font-weight-medium">{{ med.duration }}</div>
                      </VCol>
                    </VRow>

                    <div v-if="med.instructions" class="mt-3 pt-3 border-t">
                      <div class="text-caption text-medium-emphasis">Instructions</div>
                      <div class="text-body-2">{{ med.instructions }}</div>
                    </div>

                    <div class="mt-3 pt-3 border-t d-flex justify-space-between align-center">
                      <div>
                        <span class="text-caption text-medium-emphasis">Unit: </span>
                        <span class="font-weight-medium">{{ formatPrice(med.unit_price) }}</span>
                      </div>
                      <div>
                        <span class="text-caption text-medium-emphasis">Total: </span>
                        <span class="font-weight-bold text-primary">{{ formatPrice(med.total_price) }}</span>
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </div>
            </VCardText>
          </VCard>

          <!-- Refill Information -->
          <VCard v-if="!isPatientUpload && prescription.refills_allowed > 0" class="mb-6">
            <VCardTitle>Refill Information</VCardTitle>
            <VCardText>
              <VRow>
                <VCol cols="4" class="text-center">
                  <div class="text-h3 font-weight-bold text-primary">{{ prescription.refills_remaining || 0 }}</div>
                  <div class="text-body-2 text-medium-emphasis">Remaining</div>
                </VCol>
                <VCol cols="4" class="text-center">
                  <div class="text-h3 font-weight-bold">{{ prescription.refills_allowed }}</div>
                  <div class="text-body-2 text-medium-emphasis">Total Allowed</div>
                </VCol>
                <VCol cols="4" class="text-center">
                  <div class="text-h3 font-weight-bold">{{ prescription.refills_used || 0 }}</div>
                  <div class="text-body-2 text-medium-emphasis">Used</div>
                </VCol>
              </VRow>

              <VDivider class="my-4" v-if="prescription.refill_history?.length" />

              <div v-if="prescription.refill_history?.length">
                <div class="text-subtitle-2 mb-3">Refill History</div>
                <VList density="compact">
                  <VListItem v-for="(refill, index) in prescription.refill_history" :key="index">
                    <template #prepend>
                      <VIcon color="success" size="20">mdi-check-circle</VIcon>
                    </template>
                    <VListItemTitle>{{ formatDate(refill.date) }}</VListItemTitle>
                    <VListItemSubtitle>{{ refill.pharmacy_name }}</VListItemSubtitle>
                  </VListItem>
                </VList>
              </div>
            </VCardText>
          </VCard>

          <!-- Pricing Summary -->
          <VCard v-if="prescription.total_amount || prescription.subtotal" class="mb-6">
            <VCardTitle>Payment Summary</VCardTitle>
            <VCardText>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Subtotal:</span>
                <span>{{ formatPrice(prescription.subtotal) }}</span>
              </div>
              <div v-if="prescription.delivery_fee" class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Delivery Fee:</span>
                <span>{{ formatPrice(prescription.delivery_fee) }}</span>
              </div>
              <div v-if="prescription.discount" class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Discount:</span>
                <span class="text-success">-{{ formatPrice(prescription.discount) }}</span>
              </div>
              <VDivider class="my-3" />
              <div class="d-flex justify-space-between">
                <span class="text-h6">Total:</span>
                <span class="text-h6 font-weight-bold text-primary">{{ formatPrice(prescription.total_amount) }}</span>
              </div>
              <VChip :color="prescription.payment_status === 'paid' ? 'success' : 'warning'" class="mt-3" size="small">
                {{ prescription.payment_status === 'paid' ? 'Paid' : 'Pending Payment' }}
              </VChip>
            </VCardText>
          </VCard>

          <!-- Doctor's Notes -->
          <VCard v-if="prescription.clinical_notes">
            <VCardTitle>Clinical Notes</VCardTitle>
            <VCardText>
              <p class="text-body-1" style="white-space: pre-wrap;">{{ prescription.clinical_notes }}</p>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Right Column -->
        <VCol cols="12" lg="4">
          <!-- Patient Info -->
          <VCard class="mb-6">
            <VCardTitle class="d-flex justify-space-between align-center">
              <span>Patient Information</span>
              <VBtn
                v-if="prescription.patient?._id"
                size="small"
                variant="text"
                color="primary"
                @click="viewPatient(prescription.patient._id)"
              >
                View Profile
              </VBtn>
            </VCardTitle>
            <VCardText>
              <div class="d-flex align-center mb-4 clickable-row" @click="viewPatient(prescription.patient?._id)">
                <VAvatar size="48" color="primary" variant="tonal" class="me-3">
                  {{ getInitials(prescription.patient) }}
                </VAvatar>
                <div>
                  <div class="font-weight-medium text-primary">
                    {{ prescription.patient?.profile?.first_name }} {{ prescription.patient?.profile?.last_name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ prescription.patient?.profile?.email || 'No email' }}
                  </div>
                </div>
              </div>
              <VDivider class="mb-4" />
              <div class="d-flex mb-2">
                <VIcon size="18" class="me-2 text-medium-emphasis">mdi-phone</VIcon>
                <span>{{ prescription.patient?.profile?.phone_number || 'N/A' }}</span>
              </div>
              <div class="d-flex mb-2" v-if="prescription.patient?.profile?.date_of_birth">
                <VIcon size="18" class="me-2 text-medium-emphasis">mdi-cake-variant</VIcon>
                <span>{{ formatDate(prescription.patient.profile.date_of_birth) }}</span>
              </div>
              <div class="d-flex" v-if="prescription.patient?.profile?.gender">
                <VIcon size="18" class="me-2 text-medium-emphasis">mdi-account</VIcon>
                <span>{{ prescription.patient.profile.gender }}</span>
              </div>
            </VCardText>
          </VCard>

          <!-- Prescribing Doctor -->
          <VCard class="mb-6" v-if="prescription.specialist?.profile">
            <VCardTitle class="d-flex justify-space-between align-center">
              <span>{{ isPatientUpload ? 'Doctor (from prescription)' : 'Prescribing Physician' }}</span>
              <VBtn
                v-if="prescription.specialist?._id && !isPatientUpload"
                size="small"
                variant="text"
                color="primary"
                @click="viewSpecialist(prescription.specialist._id)"
              >
                View Profile
              </VBtn>
            </VCardTitle>
            <VCardText>
              <div class="d-flex align-center mb-4" :class="{ 'clickable-row': !isPatientUpload && prescription.specialist?._id }" @click="!isPatientUpload && viewSpecialist(prescription.specialist?._id)">
                <VAvatar size="48" color="info" variant="tonal" class="me-3">
                  <VIcon>mdi-doctor</VIcon>
                </VAvatar>
                <div>
                  <div class="font-weight-medium" :class="{ 'text-primary': !isPatientUpload }">
                    Dr. {{ prescription.specialist?.profile?.first_name }} {{ prescription.specialist?.profile?.last_name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ isPatientUpload ? 'Extracted from uploaded prescription' : (prescription.specialist?.professional_practice?.category || 'General Practice') }}
                  </div>
                </div>
              </div>
              <template v-if="!isPatientUpload">
                <VDivider class="mb-4" />
                <div class="d-flex mb-2">
                  <VIcon size="18" class="me-2 text-medium-emphasis">mdi-phone</VIcon>
                  <span>{{ prescription.specialist?.profile?.phone_number || 'N/A' }}</span>
                </div>
                <div class="d-flex mb-2">
                  <VIcon size="18" class="me-2 text-medium-emphasis">mdi-email</VIcon>
                  <span>{{ prescription.specialist?.profile?.email || 'N/A' }}</span>
                </div>
              </template>
            </VCardText>
          </VCard>

          <!-- Delivery Address -->
          <VCard class="mb-6" v-if="prescription.delivery_address">
            <VCardTitle>Delivery Information</VCardTitle>
            <VCardText>
              <div class="d-flex mb-3">
                <VIcon size="20" class="me-2 text-medium-emphasis">mdi-truck-delivery</VIcon>
                <span class="font-weight-medium">Home Delivery</span>
              </div>
              <div class="ms-7">
                <div v-if="prescription.delivery_address.recipient_name" class="mb-1">
                  <span class="text-medium-emphasis">Recipient: </span>
                  <span class="font-weight-medium">{{ prescription.delivery_address.recipient_name }}</span>
                </div>
                <div class="mb-1">{{ prescription.delivery_address.street }}</div>
                <div class="mb-1">{{ prescription.delivery_address.city }}, {{ prescription.delivery_address.state }}</div>
                <div class="mb-1">{{ prescription.delivery_address.country }} {{ prescription.delivery_address.postal_code }}</div>
                <div v-if="prescription.delivery_address.phone" class="mt-2">
                  <VIcon size="16" class="me-1">mdi-phone</VIcon>
                  {{ prescription.delivery_address.phone }}
                </div>
                <div v-if="prescription.delivery_address.additional_info" class="mt-2 text-caption text-medium-emphasis">
                  Note: {{ prescription.delivery_address.additional_info }}
                </div>
              </div>
            </VCardText>
          </VCard>

          <!-- Actions -->
          <VCard>
            <VCardTitle>Actions</VCardTitle>
            <VCardText>
              <!-- Patient Upload Actions -->
              <template v-if="isPatientUpload">
                <VBtn
                  v-if="prescription.status === 'pending'"
                  block
                  color="success"
                  class="mb-2"
                  @click="updateUploadStatus('approved')"
                  :loading="updatingStatus"
                >
                  <VIcon start>mdi-check-circle</VIcon>
                  Approve Prescription
                </VBtn>
                <VBtn
                  v-if="prescription.status === 'pending'"
                  block
                  color="error"
                  variant="outlined"
                  class="mb-2"
                  @click="showRejectDialog = true"
                >
                  <VIcon start>mdi-close-circle</VIcon>
                  Reject Prescription
                </VBtn>
                <VAlert
                  v-if="prescription.status === 'approved'"
                  type="success"
                  variant="tonal"
                  class="mb-2"
                >
                  This prescription has been approved
                </VAlert>
                <VAlert
                  v-if="prescription.status === 'processing'"
                  type="info"
                  variant="tonal"
                  class="mb-2"
                >
                  <VIcon start>mdi-cog</VIcon>
                  Order is being processed
                </VAlert>
                <VAlert
                  v-if="prescription.status === 'dispensed'"
                  type="info"
                  variant="tonal"
                  class="mb-2"
                >
                  <VIcon start>mdi-pill</VIcon>
                  Medication has been dispensed
                </VAlert>
                <VAlert
                  v-if="prescription.status === 'shipped'"
                  type="info"
                  variant="tonal"
                  class="mb-2"
                >
                  <VIcon start>mdi-truck</VIcon>
                  Order has been shipped
                </VAlert>
                <VAlert
                  v-if="prescription.status === 'delivered'"
                  type="success"
                  variant="tonal"
                  class="mb-2"
                >
                  <VIcon start>mdi-check-circle</VIcon>
                  Order has been delivered
                </VAlert>
                <VAlert
                  v-if="prescription.status === 'rejected'"
                  type="error"
                  variant="tonal"
                  class="mb-2"
                >
                  This prescription was rejected
                </VAlert>
              </template>

              <!-- Specialist Prescription Actions -->
              <template v-else>
                <!-- Show message when linked to pharmacy order -->
                <VAlert
                  v-if="isLinkedToPharmacyOrder"
                  type="info"
                  variant="tonal"
                  class="mb-3"
                >
                  <div class="text-body-2 mb-2">
                    Processing actions disabled. This prescription is managed through the linked pharmacy order.
                  </div>
                  <VBtn
                    size="small"
                    color="primary"
                    variant="flat"
                    @click="goToLinkedOrder"
                  >
                    <VIcon start size="16">mdi-open-in-new</VIcon>
                    Go to Order
                  </VBtn>
                </VAlert>
                <VBtn
                  v-if="canFill && !allMedicationsFilled && !isLinkedToPharmacyOrder"
                  block
                  color="success"
                  class="mb-2"
                  @click="fillAll"
                  :loading="filling"
                >
                  <VIcon start>mdi-pill</VIcon>
                  Fill All Medications
                </VBtn>
              </template>

              <!-- Common Actions -->
              <VBtn block color="secondary" variant="outlined" @click="printPrescription">
                <VIcon start>mdi-printer</VIcon>
                Print Prescription
              </VBtn>
            </VCardText>
          </VCard>

          <!-- Linked Orders (for patient uploads) -->
          <VCard v-if="isPatientUpload && prescription.used_in_orders?.length > 0" class="mt-6">
            <VCardTitle>
              <div class="d-flex align-center gap-2">
                <VIcon>mdi-cart</VIcon>
                <span>Linked Orders</span>
                <VChip size="small" color="primary">{{ prescription.used_in_orders.length }}</VChip>
              </div>
            </VCardTitle>
            <VCardText>
              <VList density="compact">
                <VListItem
                  v-for="order in prescription.used_in_orders"
                  :key="order.order_id"
                  @click="viewOrder(order.order_id)"
                  class="cursor-pointer"
                >
                  <template #prepend>
                    <VIcon :color="getOrderStatusColor(order.status)">mdi-receipt</VIcon>
                  </template>
                  <VListItemTitle class="font-weight-medium">
                    {{ order.order_number }}
                  </VListItemTitle>
                  <VListItemSubtitle>
                    {{ formatPrice(order.total_amount) }}
                  </VListItemSubtitle>
                  <template #append>
                    <VChip :color="getOrderStatusColor(order.status)" size="small">
                      {{ order.status }}
                    </VChip>
                  </template>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>

          <!-- Reject Dialog -->
          <VDialog v-model="showRejectDialog" max-width="500">
            <VCard>
              <VCardTitle>Reject Prescription</VCardTitle>
              <VCardText>
                <p class="mb-4">Please provide a reason for rejecting this prescription:</p>
                <VTextarea
                  v-model="rejectReason"
                  label="Rejection Reason"
                  rows="3"
                  variant="outlined"
                  placeholder="e.g., Image not clear, expired prescription, etc."
                />
              </VCardText>
              <VCardActions>
                <VSpacer />
                <VBtn variant="text" @click="showRejectDialog = false">Cancel</VBtn>
                <VBtn
                  color="error"
                  @click="updateUploadStatus('rejected')"
                  :loading="updatingStatus"
                  :disabled="!rejectReason.trim()"
                >
                  Reject
                </VBtn>
              </VCardActions>
            </VCard>
          </VDialog>
        </VCol>
      </VRow>
    </div>

    <!-- Loading State -->
    <VCard v-else-if="loading">
      <VCardText class="text-center py-12">
        <VProgressCircular indeterminate size="48" color="primary" />
        <div class="mt-4 text-medium-emphasis">Loading prescription details...</div>
      </VCardText>
    </VCard>

    <!-- Error State -->
    <VCard v-else>
      <VCardText class="text-center py-12">
        <VIcon size="64" color="error" class="mb-4">mdi-alert-circle</VIcon>
        <div class="text-h6 mb-2">Prescription Not Found</div>
        <div class="text-medium-emphasis mb-4">The requested prescription could not be found.</div>
        <VBtn color="primary" @click="$router.push('/pharmacy/prescriptions')">Back to Prescriptions</VBtn>
      </VCardText>
    </VCard>

    <!-- Approve Dialog -->
    <VDialog v-model="approveDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">
          <VIcon color="success" class="me-2">mdi-check-circle</VIcon>
          Approve Prescription
        </VCardTitle>
        <VCardText>
          <p class="mb-4">Approve this prescription for the patient to use?</p>
          <VTextarea
            v-model="reviewNotes"
            label="Review Notes (Optional)"
            placeholder="Add any notes about this approval..."
            variant="outlined"
            rows="3"
          />
          <VTextField
            v-model="validUntil"
            label="Valid Until"
            type="date"
            variant="outlined"
            class="mt-4"
            hint="Default: 30 days from today"
            persistent-hint
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="text" @click="approveDialog = false">Cancel</VBtn>
          <VBtn color="success" :loading="reviewLoading" @click="submitApprove">
            Approve
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Reject Dialog -->
    <VDialog v-model="rejectDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-h5">
          <VIcon color="error" class="me-2">mdi-close-circle</VIcon>
          Reject Prescription
        </VCardTitle>
        <VCardText>
          <p class="mb-4">Please provide a reason for rejecting this prescription:</p>
          <VTextarea
            v-model="rejectReason"
            label="Rejection Reason"
            placeholder="Enter the reason for rejection..."
            variant="outlined"
            rows="3"
            :rules="[v => !!v || 'Rejection reason is required']"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="text" @click="rejectDialog = false">Cancel</VBtn>
          <VBtn color="error" :loading="reviewLoading" @click="submitReject" :disabled="!rejectReason">
            Reject
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Clarification Dialog -->
    <VDialog v-model="clarificationDialog" max-width="600">
      <VCard>
        <VCardTitle class="text-h5">
          <VIcon color="info" class="me-2">mdi-message-question</VIcon>
          Request Clarification
        </VCardTitle>
        <VCardText>
          <p class="mb-4">Request additional information from the patient:</p>
          <VTextarea
            v-model="clarificationMessage"
            label="Clarification Request"
            placeholder="Describe what information you need from the patient..."
            variant="outlined"
            rows="4"
            :rules="[v => !!v || 'Clarification message is required']"
          />
          <VCombobox
            v-model="clarificationItems"
            label="Required Information Items"
            chips
            multiple
            closable-chips
            variant="outlined"
            hint="Press Enter to add items"
            persistent-hint
            class="mt-4"
          />
          <VTextField
            v-model.number="clarificationDeadlineDays"
            label="Response Deadline (days)"
            type="number"
            min="1"
            max="30"
            variant="outlined"
            class="mt-4"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="text" @click="clarificationDialog = false">Cancel</VBtn>
          <VBtn color="info" :loading="reviewLoading" @click="submitClarificationRequest" :disabled="!clarificationMessage">
            Send Request
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Review Snackbar -->
    <VSnackbar v-model="reviewSnackbar" :color="reviewSnackbarColor" :timeout="3000">
      {{ reviewSnackbarText }}
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const filling = ref(false)
const updatingStatus = ref(false)
const downloadingPdf = ref(false)
const prescription = ref(null)
const showRejectDialog = ref(false)

// Review state
const reviewDetails = ref(null)
const reviewLoading = ref(false)
const approveDialog = ref(false)
const rejectDialog = ref(false)
const clarificationDialog = ref(false)
const reviewNotes = ref('')
const rejectReason = ref('')
const validUntil = ref('')
const clarificationMessage = ref('')
const clarificationItems = ref([])
const clarificationDeadlineDays = ref(7)
const reviewSnackbar = ref(false)
const reviewSnackbarText = ref('')
const reviewSnackbarColor = ref('success')

// Inventory check state
const inventoryCheck = ref(null)
const inventoryLoading = ref(false)
const reservingStock = ref(false)

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
  })
}

const formatStatus = (status) => {
  const statusMap = {
    draft: 'Draft',
    pending: 'Pending',
    pending_payment: 'Pending Payment',
    paid: 'Paid',
    processing: 'Processing',
    dispensed: 'Dispensed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    expired: 'Expired',
    // Patient upload statuses
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
  }
  return statusMap[status?.toLowerCase()] || status
}

const getStatusColor = (status) => {
  const colorMap = {
    draft: 'secondary',
    pending: 'warning',
    pending_payment: 'warning',
    paid: 'info',
    processing: 'info',
    dispensed: 'primary',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'error',
    expired: 'error',
    // Patient upload statuses
    approved: 'success',
    rejected: 'error',
    completed: 'success',
  }
  return colorMap[status?.toLowerCase()] || 'default'
}

const isPatientUpload = computed(() => {
  return prescription.value?.source === 'UPLOAD'
})

const hasPdf = computed(() => {
  return prescription.value?.source === 'SPECIALIST' && prescription.value?.pdf_url
})

const getTypeColor = (source) => {
  const colorMap = {
    SPECIALIST: 'primary',
    INTERNAL: 'info',
    EXTERNAL: 'secondary',
    UPLOAD: 'warning',
  }
  return colorMap[source] || 'default'
}

const getTypeIcon = (source) => {
  const iconMap = {
    SPECIALIST: 'mdi-doctor',
    INTERNAL: 'mdi-pill',
    EXTERNAL: 'mdi-file-document',
    UPLOAD: 'mdi-upload',
  }
  return iconMap[source] || 'mdi-prescription'
}

const getTypeName = (source) => {
  const nameMap = {
    SPECIALIST: 'Doctor Prescription',
    INTERNAL: 'Internal Prescription',
    EXTERNAL: 'External Prescription',
    UPLOAD: 'Patient Upload',
  }
  return nameMap[source] || source
}

const getInitials = (patient) => {
  if (!patient?.profile) return '?'
  const first = patient.profile.first_name?.[0] || ''
  const last = patient.profile.last_name?.[0] || ''
  return (first + last).toUpperCase()
}

const isExpired = computed(() => {
  if (!prescription.value?.expiry_date) return false
  return new Date(prescription.value.expiry_date) < new Date()
})

const canFill = computed(() => {
  const status = prescription.value?.status?.toLowerCase()
  return !isExpired.value &&
    ['paid', 'processing'].includes(status)
})

const allMedicationsFilled = computed(() => {
  return prescription.value?.medications?.every(med => med.is_filled)
})

const canRefill = computed(() => {
  const status = prescription.value?.status?.toLowerCase()
  return !isExpired.value &&
    status === 'dispensed' &&
    (prescription.value?.refills_remaining || 0) > 0
})

// Check if this prescription is linked to a pharmacy order (processed through pharmacy order flow)
const isLinkedToPharmacyOrder = computed(() => {
  return !!(prescription.value?.linked_pharmacy_order || prescription.value?.linked_pharmacy_order_number)
})

// Navigate to the linked pharmacy order
const goToLinkedOrder = () => {
  if (prescription.value?.linked_pharmacy_order) {
    router.push(`/pharmacy/orders/${prescription.value.linked_pharmacy_order}`)
  }
}

const fillMedication = async (medicationIndex) => {
  filling.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/fill-medication`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ medicationIndex }),
    })

    if (response.ok) {
      await fetchPrescription()
    }
  } catch (error) {
    console.error('Error filling medication:', error)
  } finally {
    filling.value = false
  }
}

const fillAll = async () => {
  filling.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/fill-all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      await fetchPrescription()
    }
  } catch (error) {
    console.error('Error filling all medications:', error)
  } finally {
    filling.value = false
  }
}

const processRefill = async () => {
  filling.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/refill`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      await fetchPrescription()
    }
  } catch (error) {
    console.error('Error processing refill:', error)
  } finally {
    filling.value = false
  }
}

const updateUploadStatus = async (newStatus) => {
  updatingStatus.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const body = { status: newStatus.toUpperCase() }
    if (newStatus === 'rejected' && rejectReason.value) {
      body.rejection_reason = rejectReason.value
    }

    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (response.ok) {
      showRejectDialog.value = false
      rejectReason.value = ''
      await fetchPrescription()
    }
  } catch (error) {
    console.error('Error updating prescription status:', error)
  } finally {
    updatingStatus.value = false
  }
}

const viewPatient = (patientId) => {
  if (patientId) {
    router.push(`/patients/${patientId}`)
  }
}

const viewSpecialist = (specialistId) => {
  if (specialistId) {
    router.push(`/specialists/${specialistId}`)
  }
}

const viewOrder = (orderId) => {
  if (orderId) {
    router.push(`/pharmacy/orders/${orderId}`)
  }
}

const getOrderStatusColor = (status) => {
  const colorMap = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    PAID: 'info',
    PROCESSING: 'info',
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

const printPrescription = () => {
  window.print()
}

const downloadPdf = async () => {
  downloadingPdf.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()

    if (data.statusCode === 200 && data.data?.url) {
      // Open the presigned URL in a new tab
      window.open(data.data.url, '_blank')
    } else {
      console.error('Failed to get PDF URL:', data)
    }
  } catch (error) {
    console.error('Error downloading PDF:', error)
  } finally {
    downloadingPdf.value = false
  }
}

const fetchPrescription = async () => {
  loading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()

    if (data.statusCode === 200 && data.data) {
      prescription.value = data.data
      // Fetch review details for patient uploads
      if (prescription.value?.source === 'UPLOAD') {
        await fetchReviewDetails()
      }
    }
  } catch (error) {
    console.error('Error fetching prescription:', error)
  } finally {
    loading.value = false
  }
}

// ============ REVIEW METHODS ============

const needsReview = computed(() => {
  const status = prescription.value?.verification_status || prescription.value?.status
  return ['PHARMACIST_REVIEW', 'CLARIFICATION_RECEIVED', 'TIER1_FAILED', 'TIER2_FAILED', 'CLARIFICATION_NEEDED'].includes(status?.toUpperCase())
})

const isApproved = computed(() => {
  const status = prescription.value?.verification_status || prescription.value?.status
  return status?.toUpperCase() === 'APPROVED'
})

const isRejected = computed(() => {
  const status = prescription.value?.verification_status || prescription.value?.status
  return status?.toUpperCase() === 'REJECTED'
})

// Get failed verification checks from fraud_flags in reviewDetails
const failedVerificationChecks = computed(() => {
  // First check reviewDetails.fraud_flags (from review-details API)
  const fraudFlags = reviewDetails.value?.fraud_flags
  if (fraudFlags && fraudFlags.length > 0) {
    // Map fraud_flags to the expected format
    const mapped = fraudFlags.map(flag => ({
      severity: flag.severity,
      check_name: flag.severity || 'Verification Failed',
      details: flag.description,
      detected_at: flag.detected_at
    }))

    // Sort by severity: CRITICAL first, then HIGH, WARNING, etc.
    const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'WARNING': 2, 'MEDIUM': 3, 'LOW': 4, 'INFO': 5 }
    return mapped.sort((a, b) => (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5))
  }

  // Fallback: check prescription.verification.tier1/tier2.checks
  const verification = prescription.value?.verification
  if (!verification) return []

  const failedChecks = []

  // Check tier1 failures
  if (verification.tier1?.checks) {
    verification.tier1.checks
      .filter(check => !check.passed)
      .forEach(check => failedChecks.push(check))
  }

  // Check tier2 failures
  if (verification.tier2?.checks) {
    verification.tier2.checks
      .filter(check => !check.passed)
      .forEach(check => failedChecks.push(check))
  }

  // Sort by severity: CRITICAL first, then WARNING, then others
  const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'WARNING': 2, 'MEDIUM': 3, 'LOW': 4, 'INFO': 5 }
  return failedChecks.sort((a, b) => (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5))
})

// Get color based on severity
const getSeverityColor = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return 'error'
    case 'HIGH': return 'error'
    case 'WARNING': return 'warning'
    case 'MEDIUM': return 'warning'
    case 'LOW': return 'info'
    default: return 'grey'
  }
}

const hasPendingClarification = computed(() => {
  const status = prescription.value?.verification_status || prescription.value?.status
  return status?.toUpperCase() === 'CLARIFICATION_NEEDED'
})

const getReviewCardColor = computed(() => {
  if (reviewDetails.value?.fraud_score >= 70) return 'error'
  if (reviewDetails.value?.fraud_score >= 40) return 'warning'
  return 'info'
})

const getReviewIconColor = computed(() => {
  if (reviewDetails.value?.fraud_score >= 70) return 'error'
  if (reviewDetails.value?.fraud_score >= 40) return 'warning'
  return 'info'
})

const getReviewIcon = computed(() => {
  if (reviewDetails.value?.fraud_score >= 70) return 'mdi-alert-octagon'
  if (reviewDetails.value?.fraud_score >= 40) return 'mdi-alert'
  return 'mdi-clipboard-check'
})

const getRiskColor = (level) => {
  const colorMap = {
    CRITICAL: 'error',
    HIGH: 'warning',
    MEDIUM: 'info',
    LOW: 'success',
  }
  return colorMap[level] || 'secondary'
}

const getFlagColor = (severity) => {
  const colorMap = {
    CRITICAL: 'error',
    HIGH: 'warning',
    MEDIUM: 'info',
    LOW: 'success',
  }
  return colorMap[severity] || 'secondary'
}

const fetchReviewDetails = async () => {
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/review-details`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    if (data.statusCode === 200 && data.data) {
      reviewDetails.value = data.data
    }
  } catch (error) {
    console.error('Error fetching review details:', error)
  }
}

const openApproveDialog = () => {
  reviewNotes.value = ''
  // Set default valid until to 30 days from now
  const defaultDate = new Date()
  defaultDate.setDate(defaultDate.getDate() + 30)
  validUntil.value = defaultDate.toISOString().split('T')[0]
  approveDialog.value = true
}

const openRejectDialog = () => {
  rejectReason.value = ''
  rejectDialog.value = true
}

const openClarificationDialog = () => {
  clarificationMessage.value = ''
  clarificationItems.value = []
  clarificationDeadlineDays.value = 7
  clarificationDialog.value = true
}

const submitApprove = async () => {
  reviewLoading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        review_notes: reviewNotes.value,
        valid_until: validUntil.value,
      }),
    })
    const data = await response.json()
    if (response.ok) {
      showReviewSnackbar('Prescription approved successfully', 'success')
      approveDialog.value = false
      await fetchPrescription()
    } else {
      showReviewSnackbar(data.errorMessage || 'Failed to approve prescription', 'error')
    }
  } catch (error) {
    console.error('Error approving prescription:', error)
    showReviewSnackbar('Error approving prescription', 'error')
  } finally {
    reviewLoading.value = false
  }
}

const submitReject = async () => {
  reviewLoading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        decision: 'REJECTED',
        rejection_reason: rejectReason.value,
      }),
    })
    const data = await response.json()
    if (response.ok) {
      showReviewSnackbar('Prescription rejected', 'success')
      rejectDialog.value = false
      await fetchPrescription()
    } else {
      showReviewSnackbar(data.errorMessage || 'Failed to reject prescription', 'error')
    }
  } catch (error) {
    console.error('Error rejecting prescription:', error)
    showReviewSnackbar('Error rejecting prescription', 'error')
  } finally {
    reviewLoading.value = false
  }
}

const submitClarificationRequest = async () => {
  reviewLoading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/request-clarification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_message: clarificationMessage.value,
        required_information: clarificationItems.value,
        response_deadline_days: clarificationDeadlineDays.value,
      }),
    })
    const data = await response.json()
    if (response.ok) {
      showReviewSnackbar('Clarification request sent', 'success')
      clarificationDialog.value = false
      await fetchPrescription()
    } else {
      showReviewSnackbar(data.errorMessage || 'Failed to send clarification request', 'error')
    }
  } catch (error) {
    console.error('Error requesting clarification:', error)
    showReviewSnackbar('Error requesting clarification', 'error')
  } finally {
    reviewLoading.value = false
  }
}

const showReviewSnackbar = (text, color = 'success') => {
  reviewSnackbarText.value = text
  reviewSnackbarColor.value = color
  reviewSnackbar.value = true
}

// Inventory check methods
const checkInventory = async () => {
  inventoryLoading.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/inventory-check`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    if (response.ok && data.data) {
      inventoryCheck.value = data.data
    } else {
      console.error('Failed to check inventory:', data)
    }
  } catch (error) {
    console.error('Error checking inventory:', error)
  } finally {
    inventoryLoading.value = false
  }
}

const reserveStock = async () => {
  reservingStock.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/reserve-stock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    if (response.ok) {
      showReviewSnackbar('Stock reserved successfully', 'success')
      await checkInventory() // Refresh inventory data
    } else {
      showReviewSnackbar(data.errorMessage || 'Failed to reserve stock', 'error')
    }
  } catch (error) {
    console.error('Error reserving stock:', error)
    showReviewSnackbar('Error reserving stock', 'error')
  } finally {
    reservingStock.value = false
  }
}

const releaseStock = async () => {
  reservingStock.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/prescriptions/${route.params.id}/release-stock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    if (response.ok) {
      showReviewSnackbar('Stock reservation released', 'success')
      inventoryCheck.value = null
    } else {
      showReviewSnackbar(data.errorMessage || 'Failed to release stock', 'error')
    }
  } catch (error) {
    console.error('Error releasing stock:', error)
    showReviewSnackbar('Error releasing stock', 'error')
  } finally {
    reservingStock.value = false
  }
}

onMounted(() => {
  fetchPrescription()
})
</script>

<style scoped>
@media print {
  .v-btn {
    display: none !important;
  }
}

.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
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
</style>
