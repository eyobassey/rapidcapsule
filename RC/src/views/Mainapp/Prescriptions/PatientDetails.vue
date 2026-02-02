<template>
  <div class="page-content">
    <top-bar
      type="breadCrumb"
      :crumbConfig="_breadCrumbConfig"
      @open-side-nav="$emit('openSideNav')"
    />
    <Loader v-if="loading" :useOverlay="false" style="position: absolute" />
    <div v-else class="page-content__body">
      <!-- Error state -->
      <div v-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <button class="retry-button" @click="fetchPrescription">Try Again</button>
      </div>

      <div v-else-if="prescription" class="prescription-details-container">
        <!-- Header -->
        <div class="page-header">
          <button class="back-btn" @click="$router.back()">
            <Icons name="arrow-left" />
          </button>
          <div class="header-content">
            <h1>{{ prescription.prescription_number }}</h1>
            <span :class="['status', `status--${isUsedInOrder ? 'used_in_order' : prescription.status?.toLowerCase()}`]">
              {{ displayStatus }}
            </span>
          </div>
          <!-- PDF Download Button -->
          <button v-if="prescription.pdf_url" class="pdf-btn" @click="downloadPdf">
            <Icons name="download" />
            PDF
          </button>
        </div>

        <!-- Self-Service Alert Banner -->
        <div v-if="isSelfServicePrescription" class="alert-banner" :class="alertBannerClass">
          <div class="alert-icon">
            <Icons :name="alertIcon" />
          </div>
          <div class="alert-content">
            <h4>{{ alertTitle }}</h4>
            <p>{{ alertMessage }}</p>
            <p v-if="prescription.acceptance_expires_at && isPendingAcceptance" class="expiry-time">
              Expires: {{ formatDateTime(prescription.acceptance_expires_at) }}
              <span v-if="timeRemaining" class="countdown">({{ timeRemaining }})</span>
            </p>
          </div>
        </div>

        <!-- Doctor Info -->
        <div class="info-card" v-if="prescription.prescribed_by">
          <h3>Prescribing Doctor</h3>
          <div class="doctor-row">
            <div class="doctor-avatar">
              <img
                v-if="prescription.prescribed_by?.profile?.profile_photo"
                :src="prescription.prescribed_by.profile.profile_photo"
                :alt="doctorName"
              />
              <span v-else>{{ getInitials(doctorName) }}</span>
            </div>
            <div class="doctor-details">
              <p class="name">Dr. {{ doctorName }}</p>
              <p class="specialty">{{ prescription.prescribed_by?.profile?.professional_practice?.area_of_specialty || 'General Practice' }}</p>
              <p class="experience">{{ prescription.prescribed_by?.profile?.professional_practice?.years_of_practice || '' }}</p>
            </div>
          </div>
          <div class="doctor-contact" v-if="prescription.prescribed_by?.profile?.contact">
            <div class="contact-item" v-if="prescription.prescribed_by.profile.contact.email">
              <span class="label">Email:</span>
              <span class="value">{{ prescription.prescribed_by.profile.contact.email }}</span>
            </div>
            <div class="contact-item" v-if="prescription.prescribed_by.profile.contact.phone">
              <span class="label">Phone:</span>
              <span class="value">{{ prescription.prescribed_by.profile.contact.phone.country_code }}{{ prescription.prescribed_by.profile.contact.phone.number }}</span>
            </div>
          </div>
        </div>

        <!-- Related Appointments -->
        <div v-if="prescription.related_appointments?.length" class="info-card related-appointments-card">
          <h3>
            <v-icon name="hi-calendar" scale="0.8" />
            Related Appointments
          </h3>
          <p class="related-appointments-note">
            This prescription was created based on your consultation{{ prescription.related_appointments.length > 1 ? 's' : '' }}.
          </p>
          <div class="related-appointments-list">
            <div
              v-for="appt in prescription.related_appointments"
              :key="appt._id"
              class="related-appointment-item"
            >
              <v-icon name="hi-calendar" scale="0.7" class="related-appointment-icon" />
              <div class="related-appointment-info">
                <span class="related-appointment-date">{{ formatAppointmentDate(appt.start_time) }}</span>
                <span v-if="appt.meeting_channel" class="related-appointment-channel">{{ appt.meeting_channel }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Medications -->
        <div class="info-card">
          <h3>Medications ({{ medicationsList?.length || 0 }})</h3>
          <div class="medications-list">
            <div
              v-for="(item, index) in medicationsList"
              :key="index"
              :class="['medication-item', { 'medication-item--declined': item.patient_accepted === false }]"
            >
              <!-- Item Selection Checkbox (for partial acceptance) -->
              <div v-if="isPendingAcceptance && showPartialSelection" class="item-checkbox">
                <input
                  type="checkbox"
                  :id="`item-${index}`"
                  v-model="selectedItems"
                  :value="item._id || index"
                />
              </div>

              <div class="medication-main">
                <div class="medication-info">
                  <h4>{{ item.drug || item.drug_name }}</h4>
                  <p class="generic" v-if="item.generic_name || item.strength">
                    {{ item.generic_name }}{{ item.generic_name && (item.strength || item.dose?.dosage_form) ? ' | ' : '' }}{{ item.strength || item.dose?.dosage_form }}
                  </p>
                  <p class="dosage-form" v-else-if="item.dose?.dosage_form">
                    {{ item.dose.dosage_form }}
                  </p>
                  <p class="manufacturer" v-if="item.manufacturer">
                    <span class="mfg-label">Mfr:</span> {{ item.manufacturer }}
                  </p>
                  <!-- Declined badge -->
                  <span v-if="item.patient_accepted === false" class="declined-badge">
                    Declined
                  </span>
                </div>
                <div class="medication-quantity">
                  <span class="qty">x{{ item.dose?.quantity || item.quantity }}</span>
                  <span class="price" v-if="item.total_price || item.unit_price">
                    NGN {{ formatCurrency(item.total_price || item.unit_price * (item.dose?.quantity || item.quantity)) }}
                  </span>
                </div>
              </div>
              <div class="medication-details">
                <div class="detail" v-if="item.dose?.dosage_form">
                  <span class="label">Dosage:</span>
                  <span class="value">{{ item.dose.dosage_form }}</span>
                </div>
                <div class="detail" v-if="item.interval">
                  <span class="label">Frequency:</span>
                  <span class="value">{{ item.interval.time }}x {{ item.interval.unit }}</span>
                </div>
                <div class="detail" v-if="item.period">
                  <span class="label">Duration:</span>
                  <span class="value">{{ item.period.number }} {{ item.period.unit }}</span>
                </div>
                <div class="detail" v-if="item.notes || item.instructions">
                  <span class="label">Instructions:</span>
                  <span class="value">{{ item.notes || item.instructions }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Info (for non-patient-uploads OR patient-uploads with original prescription) -->
        <div class="info-card" v-if="!prescription.is_patient_upload || prescription.has_original_prescription">
          <h3>Payment Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Subtotal</span>
              <span class="value">NGN {{ formatCurrency(prescription.subtotal) }}</span>
            </div>
            <div class="info-item" v-if="prescription.delivery_fee">
              <span class="label">Delivery Fee</span>
              <span class="value">NGN {{ formatCurrency(prescription.delivery_fee) }}</span>
            </div>
            <div class="info-item total">
              <span class="label">Total Amount</span>
              <span class="value">NGN {{ formatCurrency(prescription.final_total || prescription.total_amount) }}</span>
            </div>
          </div>
          <div class="payment-status-row">
            <div class="status-item">
              <span class="label">Payment Status</span>
              <span :class="['payment-badge', `payment-badge--${prescription.payment_status?.toLowerCase()}`]">
                {{ formatPaymentStatus(prescription.payment_status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Prescription Document (for patient uploads) -->
        <div class="info-card" v-if="prescription.is_patient_upload && prescription.documents?.length">
          <h3>Prescription Document</h3>
          <div class="document-preview">
            <a
              :href="prescription.documents[0].url"
              target="_blank"
              class="document-link"
            >
              <Icons name="file-text" />
              <span>{{ prescription.documents[0].original_name || 'View Prescription' }}</span>
              <Icons name="external-link" class="external-icon" />
            </a>
          </div>
          <div class="verification-info">
            <div class="info-item">
              <span class="label">Verification Status</span>
              <span :class="['verification-badge', `verification-badge--${prescription.verification_status?.toLowerCase()}`]">
                {{ formatStatus(prescription.verification_status) }}
              </span>
            </div>
            <div class="info-item" v-if="prescription.used_in_orders?.length > 0">
              <span class="label">Used in Orders</span>
              <span class="value">{{ prescription.used_in_orders.length }} order(s)</span>
            </div>
          </div>
          <p class="upload-hint" v-if="!['REJECTED', 'TIER1_FAILED', 'TIER2_FAILED', 'FAILED'].includes(prescription.verification_status?.toUpperCase())">
            This prescription can be used when ordering medications from the pharmacy.
          </p>
          <div class="upload-hint upload-hint--rejected" v-else>
            <p class="rejection-summary" v-if="prescription.patient_summary">
              {{ prescription.patient_summary }}
            </p>
            <p class="rejection-summary" v-else>
              This prescription was rejected and cannot be used. Please upload a valid prescription.
            </p>
          </div>
        </div>

        <!-- Clarification Required Section (for patient uploads) -->
        <div class="info-card clarification-card" v-if="prescription.is_patient_upload && needsClarification">
          <div class="clarification-header">
            <Icons name="message-circle" class="clarification-icon" />
            <h3>Additional Information Required</h3>
          </div>
          <div class="clarification-content">
            <p class="clarification-message">{{ prescription.clarification?.request_message }}</p>
            <div class="clarification-items" v-if="prescription.clarification?.required_information?.length > 0">
              <h4>Please provide the following:</h4>
              <ul>
                <li v-for="item in prescription.clarification.required_information" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div class="clarification-deadline" v-if="prescription.clarification?.response_deadline">
              <span class="label">Response needed by:</span>
              <span :class="['deadline-value', { 'deadline-urgent': isClarificationUrgent }]">
                {{ formatDateTime(prescription.clarification.response_deadline) }}
              </span>
            </div>
          </div>

          <!-- Response Form -->
          <div class="clarification-form" v-if="!prescription.clarification?.responded_at">
            <h4>Your Response</h4>
            <textarea
              v-model="clarificationResponse"
              placeholder="Type your response here..."
              class="response-textarea"
              rows="4"
            ></textarea>
            <div class="upload-section">
              <label class="file-upload-label">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  @change="handleClarificationFile"
                  ref="clarificationFileInput"
                />
                <Icons name="upload" />
                <span>{{ clarificationFile ? clarificationFile.name : 'Upload Supporting Document (Optional)' }}</span>
              </label>
            </div>
            <button
              class="btn btn-primary submit-clarification-btn"
              @click="submitClarification"
              :disabled="clarificationLoading || (!clarificationResponse && !clarificationFile)"
            >
              <Icons v-if="clarificationLoading" name="loader" class="spin" />
              <Icons v-else name="send" />
              {{ clarificationLoading ? 'Submitting...' : 'Submit Response' }}
            </button>
          </div>

          <!-- Response Submitted Confirmation -->
          <div class="clarification-submitted" v-else>
            <div class="submitted-badge">
              <Icons name="check-circle" />
              <span>Response Submitted</span>
            </div>
            <p class="submitted-message">{{ prescription.clarification.response_message }}</p>
            <p class="submitted-date">Submitted on {{ formatDateTime(prescription.clarification.responded_at) }}</p>
            <p class="review-notice">Your response is being reviewed by our pharmacist.</p>
          </div>
        </div>

        <!-- Clarification Received - Under Review -->
        <div class="info-card review-card" v-if="prescription.is_patient_upload && isClarificationUnderReview">
          <div class="review-header">
            <Icons name="clock" class="review-icon" />
            <h3>Under Review</h3>
          </div>
          <p class="review-message">
            Thank you for providing the additional information. Our pharmacist is reviewing your response and will update your prescription status shortly.
          </p>
        </div>

        <!-- Approved Prescription - Add to Cart -->
        <div class="info-card approved-card" v-if="prescription.is_patient_upload && isPrescriptionApproved">
          <div class="approved-header">
            <Icons name="check-circle" class="approved-icon" />
            <h3>Prescription Approved</h3>
          </div>

          <!-- If already paid or used in order, show order status -->
          <template v-if="isPrescriptionPaid">
            <p class="approved-message paid-message">
              <Icons name="check-circle" class="paid-icon" />
              {{ isUsedInOrder ? 'This prescription has been used to place an order.' : 'This prescription has been paid and is being processed.' }}
            </p>
            <!-- Show linked orders from used_in_orders array -->
            <div v-if="prescription.used_in_orders?.length > 0" class="linked-orders-info">
              <div v-for="(order, idx) in prescription.used_in_orders" :key="idx" class="order-info">
                <span class="order-label">Order:</span>
                <router-link :to="`/app/patient/pharmacy/orders/${order.order_id || order}`" class="order-link">
                  {{ order.order_number || `Order #${idx + 1}` }}
                </router-link>
                <span v-if="order.status" :class="['status-badge', `status-${order.status?.toLowerCase()}`]">
                  {{ formatStatus(order.status) }}
                </span>
              </div>
            </div>
            <!-- Fallback for prescriptionOrderNumber -->
            <div class="order-info" v-else-if="prescriptionOrderNumber">
              <span class="order-label">Order Number:</span>
              <router-link :to="`/app/patient/pharmacy/orders/${prescription.linked_pharmacy_order || prescriptionOrderNumber}`" class="order-link">
                {{ prescriptionOrderNumber }}
              </router-link>
            </div>
            <div class="order-status" v-if="prescription.status && !isUsedInOrder">
              <span class="status-label">Status:</span>
              <span :class="['status-badge', `status-${prescription.status?.toLowerCase()}`]">
                {{ formatStatus(prescription.status) }}
              </span>
            </div>
          </template>

          <!-- If not paid yet, show add to cart option -->
          <template v-else>
            <p class="approved-message">
              Your prescription has been reviewed and approved by our pharmacist. You can now order the medications.
            </p>

            <!-- Verified Medications List -->
            <div class="verified-medications" v-if="prescription.verified_medications?.length > 0">
              <h4>Approved Medications</h4>
              <div class="medication-list">
                <div
                  v-for="(med, index) in prescription.verified_medications"
                  :key="index"
                  class="medication-item"
                >
                  <div class="med-info">
                    <span class="med-name">{{ med.matched_drug_name || med.prescription_medication_name }}</span>
                    <span class="med-details" v-if="med.quantity || med.dosage">
                      {{ med.quantity }} {{ med.dosage ? `- ${med.dosage}` : '' }}
                    </span>
                  </div>
                  <span v-if="med.matched_drug_id" class="matched-badge">
                    <Icons name="check" /> Matched
                  </span>
                  <span v-else class="not-matched-badge">
                    <Icons name="alert-circle" /> Needs manual match
                  </span>
                </div>
              </div>
            </div>

            <!-- Add to Cart Button -->
            <div class="cart-action-section">
              <button
                class="btn btn-primary add-to-cart-btn"
                @click="addMedicationsToCart"
                :disabled="addingToCart || !hasMatchedMedications"
              >
                <Icons v-if="addingToCart" name="loader" class="spin" />
                <Icons v-else name="shopping-cart" />
                {{ addingToCart ? 'Adding to Cart...' : 'Add All Medications to Cart' }}
              </button>
              <p class="cart-hint" v-if="!hasMatchedMedications">
                Some medications could not be matched to our inventory. Please contact support.
              </p>
              <p class="cart-hint" v-else>
                Click to add all approved medications to your cart and proceed to checkout.
              </p>
            </div>
          </template>
        </div>

        <!-- Action Buttons for Self-Service -->
        <div v-if="isSelfServicePrescription" class="action-card">
          <!-- Pending Acceptance Actions -->
          <template v-if="isPendingAcceptance">
            <div class="action-header">
              <h3>Your Response Required</h3>
              <p>Review the prescription and choose to accept or decline</p>
            </div>

            <div class="partial-toggle" v-if="medicationsList?.length > 1">
              <label class="toggle-label">
                <input type="checkbox" v-model="showPartialSelection" />
                <span>Select specific items to accept</span>
              </label>
            </div>

            <div class="action-buttons">
              <button class="btn btn-success" @click="handleAccept" :disabled="actionLoading">
                <Icons name="check" />
                {{ showPartialSelection && selectedItems.length > 0 ? `Accept ${selectedItems.length} Item(s)` : 'Accept All' }}
              </button>
              <button class="btn btn-outline-danger" @click="showDeclineModal = true" :disabled="actionLoading">
                <Icons name="x" />
                Decline
              </button>
            </div>
          </template>

          <!-- Pending Payment Actions -->
          <template v-else-if="isPendingPayment">
            <div class="action-header">
              <h3>Payment Required</h3>
              <p>Complete payment to finalize your prescription</p>
            </div>

            <div class="wallet-balance" v-if="walletBalance !== null">
              <span class="label">Your Wallet Balance:</span>
              <span :class="['balance', { sufficient: walletBalance >= (prescription.final_total || prescription.total_amount) }]">
                NGN {{ formatCurrency(walletBalance) }}
              </span>
            </div>

            <div class="action-buttons">
              <button
                class="btn btn-primary"
                @click="payWithWallet"
                :disabled="actionLoading || walletBalance < (prescription.final_total || prescription.total_amount)"
              >
                <Icons name="wallet" />
                Pay with Wallet
              </button>
              <button class="btn btn-outline-primary" @click="payWithCard" :disabled="actionLoading">
                <Icons name="credit-card" />
                Pay with Card
              </button>
            </div>
          </template>
        </div>

        <!-- Delivery Info -->
        <div class="info-card" v-if="prescription.delivery_address && !prescription.is_pickup_order">
          <h3>Delivery Information</h3>
          <div class="delivery-details">
            <div class="info-item" v-if="prescription.delivery_address.recipient_name">
              <span class="label">Recipient</span>
              <span class="value">{{ prescription.delivery_address.recipient_name }}</span>
            </div>
            <div class="info-item" v-if="prescription.delivery_address.phone">
              <span class="label">Phone</span>
              <span class="value">{{ prescription.delivery_address.phone }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">Address</span>
              <span class="value">{{ formatDeliveryAddress(prescription.delivery_address) }}</span>
            </div>
          </div>
        </div>

        <!-- Pickup Center Info (for pickup orders) -->
        <div class="info-card pickup-card" v-if="prescription.is_pickup_order">
          <h3>
            <Icons name="map-pin" class="pickup-icon" />
            Pickup Information
          </h3>

          <!-- Display selected pickup center -->
          <div v-if="prescription.pickup_pharmacy_id || selectedPickupCenter" class="pickup-details">
            <div class="pickup-center-info">
              <h4>{{ pickupCenterName }}</h4>
              <p class="address" v-if="pickupCenterAddress">
                <Icons name="location" />
                {{ pickupCenterAddress }}
              </p>
              <p class="phone" v-if="pickupCenterPhone">
                <Icons name="phone" />
                {{ pickupCenterPhone }}
              </p>
            </div>

            <!-- Pickup Code Display -->
            <div v-if="prescription.pickup_code" class="pickup-code-section">
              <div class="pickup-code-label">Your Pickup Code</div>
              <div class="pickup-code">{{ prescription.pickup_code }}</div>
              <p class="pickup-code-hint">Show this code when collecting your order</p>
            </div>

            <!-- Pickup Status -->
            <div v-if="prescription.ready_for_pickup_at" class="pickup-status ready">
              <Icons name="check-circle" />
              <span>Ready for Pickup</span>
            </div>
            <div v-else-if="prescription.status === 'shipped'" class="pickup-status transit">
              <Icons name="truck" />
              <span>In Transit to Pickup Center</span>
            </div>
            <div v-else class="pickup-status preparing">
              <Icons name="package" />
              <span>Preparing for Pickup</span>
            </div>

            <!-- Change Pickup Center Button -->
            <button
              v-if="canChangePickupCenter"
              class="btn btn-outline-primary btn-sm change-pickup-btn"
              @click="showPickupModal = true"
            >
              <Icons name="edit" />
              Change Pickup Center
            </button>
          </div>

          <!-- Select Pickup Center -->
          <div v-else class="select-pickup-section">
            <p class="pickup-prompt">Select a pickup center to collect your order</p>
            <button class="btn btn-primary" @click="showPickupModal = true">
              <Icons name="map-pin" />
              Choose Pickup Center
            </button>
          </div>
        </div>

        <!-- Pickup Center Selection Modal -->
        <div v-if="showPickupModal" class="modal-overlay" @click.self="showPickupModal = false">
          <div class="modal-content pickup-modal">
            <div class="modal-header">
              <h3>Select Pickup Center</h3>
              <button class="close-btn" @click="showPickupModal = false">
                <Icons name="x" />
              </button>
            </div>

            <div class="modal-body">
              <!-- Location Search -->
              <div class="pickup-search">
                <div class="search-input-wrapper">
                  <Icons name="search" />
                  <input
                    type="text"
                    v-model="pickupSearchQuery"
                    placeholder="Search by city or state..."
                    @input="searchPickupCenters"
                  />
                </div>
                <button class="use-location-btn" @click="useCurrentLocation">
                  <Icons name="navigation" />
                  Use My Location
                </button>
              </div>

              <!-- Loading State -->
              <div v-if="pickupCentersLoading" class="pickup-loading">
                <Loader :useOverlay="false" />
                <p>Finding pickup centers...</p>
              </div>

              <!-- Pickup Centers List -->
              <div v-else-if="pickupCenters.length > 0" class="pickup-centers-list">
                <div
                  v-for="center in pickupCenters"
                  :key="center._id"
                  :class="['pickup-center-item', { selected: selectedPickupCenter?._id === center._id }]"
                  @click="selectPickupCenter(center)"
                >
                  <div class="center-radio">
                    <input
                      type="radio"
                      :id="`center-${center._id}`"
                      :value="center._id"
                      v-model="selectedPickupCenterId"
                    />
                  </div>
                  <div class="center-info">
                    <h4>{{ center.name }}</h4>
                    <p class="center-address">
                      {{ formatPickupAddress(center.address) }}
                    </p>
                    <div class="center-meta">
                      <span v-if="center.distance" class="distance">
                        <Icons name="navigation" />
                        {{ formatDistance(center.distance) }}
                      </span>
                      <span v-if="center.pickup_center_settings?.handling_fee" class="handling-fee">
                        Fee: NGN {{ formatCurrency(center.pickup_center_settings.handling_fee) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="pickup-empty">
                <Icons name="map-pin" />
                <p>No pickup centers found</p>
                <span>Try searching in a different area</span>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-outline" @click="showPickupModal = false">Cancel</button>
              <button
                class="btn btn-primary"
                @click="confirmPickupCenter"
                :disabled="!selectedPickupCenterId || pickupSelecting"
              >
                {{ pickupSelecting ? 'Selecting...' : 'Confirm Selection' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Timeline (show for non-uploads or uploads with original prescription) -->
        <div class="info-card" v-if="!prescription.is_patient_upload || prescription.has_original_prescription">
          <h3>Order Status</h3>
          <div class="timeline">
            <div
              v-for="event in statusTimeline"
              :key="event.status"
              :class="['timeline-item', { completed: event.completed, current: event.current }]"
            >
              <div class="timeline-marker">
                <span v-if="event.completed" class="check-icon">✓</span>
              </div>
              <div class="timeline-content">
                <p class="event-status">{{ event.label }}</p>
                <p class="event-date" v-if="event.date">{{ formatDateTime(event.date) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Rating Section -->
        <div class="info-card rating-card" v-if="canRate || prescription.rating">
          <h3>{{ prescription.rating ? 'Your Rating' : 'Rate Your Experience' }}</h3>

          <!-- Already rated display -->
          <div v-if="prescription.rating" class="rating-display">
            <div class="stars-display">
              <span v-for="star in 5" :key="star" class="star" :class="{ filled: star <= prescription.rating }">
                {{ star <= prescription.rating ? '⭐' : '☆' }}
              </span>
            </div>
            <p class="rating-value">{{ prescription.rating }}/5</p>
            <p class="review-text" v-if="prescription.review">"{{ prescription.review }}"</p>
            <p class="rated-date" v-if="prescription.rated_at">Rated on {{ formatDateTime(prescription.rated_at) }}</p>
          </div>

          <!-- Rating form -->
          <div v-else class="rating-form">
            <p class="rating-prompt">How was your experience with the pharmacy service?</p>

            <div class="star-rating">
              <button
                v-for="star in 5"
                :key="star"
                :class="['star-btn', { active: star <= selectedRating, hover: star <= hoverRating }]"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
                @click="selectedRating = star"
              >
                {{ star <= (hoverRating || selectedRating) ? '⭐' : '☆' }}
              </button>
            </div>

            <div class="rating-labels">
              <span>Poor</span>
              <span>Excellent</span>
            </div>

            <textarea
              v-model="reviewText"
              class="review-input"
              placeholder="Share your experience (optional)..."
              maxlength="500"
              rows="3"
            ></textarea>

            <button
              class="btn btn-primary submit-rating-btn"
              @click="submitRating"
              :disabled="!selectedRating || ratingLoading"
            >
              {{ ratingLoading ? 'Submitting...' : 'Submit Rating' }}
            </button>
          </div>
        </div>

        <!-- Notes -->
        <div class="info-card" v-if="prescription.clinical_notes || prescription.patient_notes">
          <h3>Notes</h3>
          <div v-if="prescription.clinical_notes" class="notes-section">
            <p class="notes-label">Clinical Notes:</p>
            <p class="notes-text">{{ prescription.clinical_notes }}</p>
          </div>
          <div v-if="prescription.patient_notes" class="notes-section">
            <p class="notes-label">Patient Notes:</p>
            <p class="notes-text">{{ prescription.patient_notes }}</p>
          </div>
        </div>

        <!-- Dates -->
        <div class="info-card">
          <h3>Details</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Prescription Date</span>
              <span class="value">{{ formatDateTime(prescription.created_at) }}</span>
            </div>
            <div class="info-item" v-if="prescription.updated_at">
              <span class="label">Last Updated</span>
              <span class="value">{{ formatDateTime(prescription.updated_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Decline Modal -->
    <div v-if="showDeclineModal" class="modal-overlay" @click.self="showDeclineModal = false">
      <div class="modal-content">
        <h3>Decline Prescription</h3>
        <p>Please provide a reason for declining this prescription:</p>
        <textarea
          v-model="declineReason"
          placeholder="Enter reason for declining..."
          rows="4"
        ></textarea>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showDeclineModal = false">Cancel</button>
          <button class="btn btn-danger" @click="handleDecline" :disabled="!declineReason.trim() || actionLoading">
            {{ actionLoading ? 'Processing...' : 'Confirm Decline' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader.vue";
import Icons from "@/components/icons.vue";
import { breadCrumbConfig } from "./config";
import apiFactory from "@/services/apiFactory";
import moment from "moment";

export default {
  name: "PatientPrescriptionDetails",
  components: {
    TopBar,
    Loader,
    Icons,
  },
  data() {
    return {
      _breadCrumbConfig: breadCrumbConfig,
      loading: true,
      error: null,
      prescription: null,
      actionLoading: false,
      walletBalance: null,
      showDeclineModal: false,
      declineReason: "",
      showPartialSelection: false,
      selectedItems: [],
      timeRemaining: null,
      countdownInterval: null,
      // Rating
      selectedRating: 0,
      hoverRating: 0,
      reviewText: "",
      ratingLoading: false,
      // Pickup Center
      showPickupModal: false,
      pickupCenters: [],
      pickupCentersLoading: false,
      selectedPickupCenter: null,
      selectedPickupCenterId: null,
      pickupSearchQuery: "",
      pickupSelecting: false,
      pickupCenterDetails: null,
      // Clarification
      clarificationResponse: "",
      clarificationFile: null,
      clarificationLoading: false,
      // Cart integration
      addingToCart: false,
    };
  },
  computed: {
    prescriptionId() {
      return this.$route.params.id;
    },
    doctorName() {
      const profile = this.prescription?.prescribed_by?.profile;
      if (!profile) return 'Unknown';
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
    },
    isSelfServicePrescription() {
      // Check if this is a self-service prescription (sent to patient)
      return this.prescription?.is_self_service ||
             this.prescription?.prescription_source === 'specialist_self_service' ||
             this.prescription?.status === 'pending_acceptance' ||
             this.prescription?.patient_response !== undefined;
    },
    isPendingAcceptance() {
      return this.prescription?.status === 'pending_acceptance';
    },
    isPendingPayment() {
      return this.prescription?.status === 'pending_payment' ||
             (this.prescription?.patient_response === 'accepted' && this.prescription?.payment_status === 'pending');
    },
    alertBannerClass() {
      if (this.isPendingAcceptance) return 'alert-banner--warning';
      if (this.isPendingPayment) return 'alert-banner--info';
      if (this.prescription?.patient_response === 'declined') return 'alert-banner--danger';
      if (this.prescription?.status === 'paid') return 'alert-banner--success';
      return 'alert-banner--info';
    },
    alertIcon() {
      if (this.isPendingAcceptance) return 'clock';
      if (this.isPendingPayment) return 'credit-card';
      if (this.prescription?.patient_response === 'declined') return 'x-circle';
      if (this.prescription?.status === 'paid') return 'check-circle';
      return 'info';
    },
    alertTitle() {
      if (this.isPendingAcceptance) return 'Action Required';
      if (this.isPendingPayment) return 'Payment Pending';
      if (this.prescription?.patient_response === 'declined') return 'Prescription Declined';
      if (this.prescription?.status === 'paid') return 'Payment Complete';
      return 'Prescription Status';
    },
    alertMessage() {
      if (this.isPendingAcceptance) return 'Please review and accept or decline this prescription.';
      if (this.isPendingPayment) return 'Complete payment to proceed with your prescription.';
      if (this.prescription?.patient_response === 'declined') return 'You declined this prescription.';
      if (this.prescription?.status === 'paid') return 'Your payment has been received.';
      return '';
    },
    statusTimeline() {
      const statuses = [
        { status: "draft", label: "Prescription Created" },
        { status: "pending_acceptance", label: "Sent to Patient" },
        { status: "accepted", label: "Patient Accepted" },
        { status: "pending_payment", label: "Pending Payment" },
        { status: "paid", label: "Payment Received" },
        { status: "processing", label: "Processing" },
        { status: "dispensed", label: "Medications Dispensed" },
        { status: "shipped", label: "Shipped" },
        { status: "delivered", label: "Delivered" },
      ];

      // Use original_status for patient uploads that have linked original prescription
      const currentStatus = (this.prescription?.has_original_prescription
        ? this.prescription?.original_status
        : this.prescription?.status)?.toLowerCase();
      const currentIndex = statuses.findIndex(s => s.status === currentStatus);

      return statuses.map((s, index) => ({
        ...s,
        completed: index <= currentIndex,
        current: index === currentIndex,
        date: this.getStatusDate(s.status),
      }));
    },
    canRate() {
      const ratableStatuses = ['delivered', 'completed'];
      return ratableStatuses.includes(this.prescription?.status?.toLowerCase()) && !this.prescription?.rating;
    },
    // Pickup center computed properties
    pickupCenterName() {
      if (this.pickupCenterDetails) return this.pickupCenterDetails.name;
      if (this.selectedPickupCenter) return this.selectedPickupCenter.name;
      return this.prescription?.pickup_pharmacy?.name || 'Pickup Center';
    },
    pickupCenterAddress() {
      const center = this.pickupCenterDetails || this.selectedPickupCenter || this.prescription?.pickup_pharmacy;
      if (!center?.address) return '';
      const addr = center.address;
      return [addr.street, addr.city, addr.state].filter(Boolean).join(', ');
    },
    pickupCenterPhone() {
      const center = this.pickupCenterDetails || this.selectedPickupCenter || this.prescription?.pickup_pharmacy;
      return center?.contact?.phone || '';
    },
    canChangePickupCenter() {
      // Allow changing pickup center only in early stages
      const changeableStatuses = ['draft', 'pending_acceptance', 'accepted', 'pending_payment'];
      return changeableStatuses.includes(this.prescription?.status?.toLowerCase());
    },
    // Clarification computed properties
    needsClarification() {
      const status = this.prescription?.verification_status?.toUpperCase();
      return status === 'CLARIFICATION_NEEDED';
    },
    isClarificationUnderReview() {
      const status = this.prescription?.verification_status?.toUpperCase();
      return status === 'CLARIFICATION_RECEIVED';
    },
    isClarificationUrgent() {
      if (!this.prescription?.clarification?.response_deadline) return false;
      const deadline = new Date(this.prescription.clarification.response_deadline);
      const now = new Date();
      const hoursRemaining = (deadline - now) / (1000 * 60 * 60);
      return hoursRemaining < 24;
    },
    // Cart integration computed properties
    isPrescriptionApproved() {
      const status = this.prescription?.verification_status?.toUpperCase();
      return status === 'APPROVED';
    },
    hasMatchedMedications() {
      const meds = this.prescription?.verified_medications || [];
      return meds.some(med => med.matched_drug_id);
    },
    isPrescriptionPaid() {
      const paymentStatus = this.prescription?.payment_status?.toLowerCase();
      const status = this.prescription?.status?.toLowerCase();
      const hasUsedInOrders = this.prescription?.used_in_orders?.length > 0;
      return hasUsedInOrders || paymentStatus === 'paid' || paymentStatus === 'used_in_order' || status === 'paid' || status === 'processing' || status === 'dispensed' || status === 'shipped' || status === 'delivered' || status === 'completed' || status === 'used_in_order';
    },
    isUsedInOrder() {
      return this.prescription?.used_in_orders?.length > 0;
    },
    displayStatus() {
      if (this.isUsedInOrder) {
        return 'Used in Order';
      }
      return this.formatStatus(this.prescription?.status);
    },
    prescriptionOrderNumber() {
      return this.prescription?.linked_pharmacy_order_number || this.prescription?.order_number || null;
    },
    // Get medications from either items or verified_medications (for patient uploads)
    medicationsList() {
      // For patient-uploaded prescriptions, use verified_medications (enriched by backend)
      if (this.prescription?.is_patient_upload && this.prescription?.verified_medications?.length > 0) {
        const ocrMedications = this.prescription?.ocr_data?.medications || [];

        return this.prescription.verified_medications.map((med, index) => {
          // Find matching OCR medication by name or index (fallback for external prescriptions)
          const ocrMed = ocrMedications.find(
            ocr => ocr.name?.toLowerCase() === med.prescription_medication_name?.toLowerCase()
          ) || ocrMedications[index] || {};

          // For internal prescriptions (from Rapid Capsules), data comes from original prescription
          // For external prescriptions, fall back to OCR data
          const isInternal = med.matched_to_original || this.prescription?.is_internal_prescription;

          return {
            drug: med.matched_drug_name || med.prescription_medication_name,
            drug_name: med.matched_drug_name || med.prescription_medication_name,
            generic_name: med.matched_generic_name,
            manufacturer: med.manufacturer,
            strength: med.strength,
            dosage_form: med.dosage_form,
            // Use backend-enriched data, fall back to OCR for external prescriptions
            quantity: med.quantity || ocrMed.quantity || 1,
            unit_price: med.unit_price || med.selling_price,
            total_price: med.total_price || med.selling_price,
            instructions: med.instructions || ocrMed.instructions,
            notes: null, // Don't use notes, let instructions take precedence
            // Use structured data from backend (original prescription) or parse from OCR
            dose: med.dose || {
              dosage_form: med.dosage || ocrMed.dosage,
              quantity: med.quantity || ocrMed.quantity,
            },
            interval: med.interval || (isInternal ? null : this.parseFrequency(ocrMed.frequency || ocrMed.dosage)),
            period: med.period || (isInternal ? null : this.parseDuration(ocrMed.duration || ocrMed.instructions)),
            matched_drug_id: med.matched_drug_id,
            drug_image: med.drug_image,
            _id: med._id,
          };
        });
      }
      // For regular prescriptions, use items
      return this.prescription?.items || [];
    },
  },
  async mounted() {
    await this.fetchPrescription();
    if (this.isSelfServicePrescription && this.isPendingPayment) {
      await this.fetchWalletBalance();
    }
    if (this.isPendingAcceptance && this.prescription?.acceptance_expires_at) {
      this.startCountdown();
    }
    // Fetch pickup center details if this is a pickup order
    if (this.prescription?.is_pickup_order && this.prescription?.pickup_pharmacy_id) {
      await this.fetchPickupCenterDetails();
    }
  },
  beforeUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  },
  methods: {
    async fetchPrescription() {
      if (!this.prescriptionId) return;

      this.error = null;
      this.loading = true;

      // Try multiple endpoints in order
      const endpoints = [
        {
          name: 'self-service',
          fetch: () => apiFactory.$_getPatientPrescriptionDetails(this.prescriptionId),
          process: (response) => {
            const data = response.data?.data;
            if (data && Object.keys(data).length > 0) {
              return { ...data, is_self_service: true };
            }
            return null;
          }
        },
        {
          name: 'patient-upload',
          fetch: async () => {
            const uploadResponse = await apiFactory.$_getPatientUploadDetails(this.prescriptionId);
            const uploadData = uploadResponse.data?.data || uploadResponse.data?.result;

            // If the upload has an RX number, try to fetch original prescription details
            let originalPrescription = null;
            const rxNumber = uploadData?.prescription_number || uploadData?.digital_signature?.reference_number;
            if (rxNumber && rxNumber.startsWith('RX-')) {
              try {
                const verifyResponse = await apiFactory.$_verifyPrescriptionByNumber(rxNumber);
                originalPrescription = verifyResponse.data?.data?.prescription;
              } catch (e) {
                // Original prescription not found - continue with upload data only
              }
            }

            return { uploadData, originalPrescription };
          },
          process: (response) => {
            const { uploadData: data, originalPrescription } = response;
            if (data && Object.keys(data).length > 0) {
              // If we found the original prescription, use its detailed item data
              let medications;
              if (originalPrescription?.items?.length > 0) {
                medications = originalPrescription.items.map((item, idx) => ({
                  _id: item._id || `item-${idx}`,
                  drug: item.drug_name,
                  drug_name: item.drug_name,
                  generic_name: item.generic_name || '',
                  strength: item.strength || '',
                  manufacturer: item.manufacturer || '',
                  dose: {
                    quantity: item.quantity,
                    dosage_form: item.dosage || '',
                  },
                  interval: item.frequency ? { time: item.frequency.split('x')[0], unit: 'daily' } : null,
                  period: item.duration ? { number: parseInt(item.duration), unit: item.duration.replace(/\d+\s*/, '') } : null,
                  quantity: item.quantity,
                  notes: item.instructions || '',
                  instructions: item.instructions || '',
                  unit_price: item.unit_price || 0,
                  total_price: item.total_price || 0,
                }));
              } else {
                // Fallback to OCR data
                // Helper to validate medication name - check if it looks like a real med name
                const isValidMedName = (name) => {
                  if (!name) return false;
                  // Invalid if too long (likely OCR garbage), contains common non-med phrases
                  const invalidPatterns = [
                    /number of days/i,
                    /ensure dose is stated/i,
                    /N\.?B\.?\s/i,
                    /treatment/i,
                    /pharmacy stamp/i,
                    /please don't/i,
                  ];
                  if (name.length > 50) return false;
                  return !invalidPatterns.some(pattern => pattern.test(name));
                };

                medications = (data.ocr_data?.medications || []).map((med, idx) => {
                  const verified = data.verified_medications?.[idx] || {};
                  let drugName = med.name || verified.matched_drug_name || verified.prescription_medication_name;

                  // If the extracted name looks invalid, show a cleaner fallback
                  if (!isValidMedName(drugName)) {
                    drugName = verified.matched_drug_name || 'Medication (see prescription document)';
                  }

                  return {
                    _id: med._id || verified._id,
                    drug: drugName,
                    drug_name: drugName,
                    generic_name: verified.matched_generic_name || '',
                    dose: {
                      quantity: parseInt(med.quantity) || 1,
                      dosage_form: med.dosage || '',
                    },
                    quantity: parseInt(med.quantity) || 1,
                    notes: med.instructions || verified.instructions || '',
                    instructions: med.instructions || verified.instructions || '',
                    matched_drug_id: verified.matched_drug_id,
                  };
                });
              }

              return {
                ...data,
                _id: data._id,
                prescription_number: data.prescription_number || data.digital_signature?.reference_number || `RX-${data._id?.slice(-8).toUpperCase()}`,
                type: 'EXTERNAL',
                prescription_source: 'patient_upload',
                is_patient_upload: true,
                has_original_prescription: !!originalPrescription,
                status: this.mapVerificationStatus(data.verification_status),
                verification_status: data.verification_status,
                prescribed_by: originalPrescription?.prescriber ? (() => {
                  // Remove "Dr." prefix and split name into first/last
                  const fullName = originalPrescription.prescriber.full_name.replace(/^Dr\.?\s*/i, '').trim();
                  const nameParts = fullName.split(' ');
                  return {
                    profile: {
                      first_name: nameParts[0] || '',
                      last_name: nameParts.slice(1).join(' ') || '',
                      professional_practice: {
                        area_of_specialty: originalPrescription.prescriber.specialization || 'General Practice',
                      }
                    }
                  };
                })() : data.ocr_data?.doctor_name ? (() => {
                  // Remove "Dr." prefix and split name into first/last
                  const fullName = data.ocr_data.doctor_name.replace(/^Dr\.?\s*/i, '').trim();
                  const nameParts = fullName.split(' ');
                  return {
                    profile: {
                      first_name: nameParts[0] || '',
                      last_name: nameParts.slice(1).join(' ') || '',
                      professional_practice: {
                        area_of_specialty: data.ocr_data.clinic_name || 'External Prescription',
                      }
                    }
                  };
                })() : null,
                items: medications,
                documents: [{
                  url: data.presignedUrl || data.s3_url,
                  file_type: data.mimetype,
                  original_name: data.original_filename,
                }],
                pdf_url: originalPrescription?.pdf_url,
                created_at: data.created_at,
                used_in_orders: data.used_in_orders || [],
                // Use original prescription data if available
                subtotal: originalPrescription?.subtotal || null,
                delivery_fee: originalPrescription?.delivery_fee || null,
                total_amount: originalPrescription?.total_amount || null,
                currency: originalPrescription?.currency || 'NGN',
                payment_status: originalPrescription?.payment_status || (data.used_in_orders?.length > 0 ? 'used_in_order' : null),
                status_history: originalPrescription?.status_history || [],
                delivery_address: originalPrescription?.delivery_address || null,
                original_status: originalPrescription?.status || null,
              };
            }
            return null;
          }
        },
        {
          name: 'regular',
          fetch: () => apiFactory.$_getPrescription(this.prescriptionId),
          process: (response) => {
            const data = response.data?.data;
            if (data && Object.keys(data).length > 0) {
              return data;
            }
            return null;
          }
        }
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await endpoint.fetch();
          const prescription = endpoint.process(response);
          if (prescription) {
            this.prescription = prescription;
            this.loading = false;
            return;
          }
        } catch (err) {
          // Continue to next endpoint
        }
      }

      // No endpoint succeeded
      this.error = "Prescription not found";
      this.loading = false;
    },
    async fetchWalletBalance() {
      try {
        const response = await apiFactory.$_getPatientSelfWalletBalance();
        this.walletBalance = response.data?.data?.balance || 0;
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
        this.walletBalance = 0;
      }
    },
    async downloadPdf() {
      try {
        const response = await apiFactory.$_getPrescriptionPdf(this.prescriptionId);
        const url = response.data?.data?.url || this.prescription.pdf_url;
        if (url) {
          window.open(url, '_blank');
        }
      } catch (err) {
        console.error('Error downloading PDF:', err);
        this.$toast?.error('Failed to download PDF');
      }
    },
    async handleAccept() {
      this.actionLoading = true;
      try {
        const payload = {};
        if (this.showPartialSelection && this.selectedItems.length > 0) {
          payload.accepted_items = this.selectedItems;
        }

        await apiFactory.$_acceptPrescription(this.prescriptionId, payload);
        this.$toast?.success('Prescription accepted successfully');
        await this.fetchPrescription();
        await this.fetchWalletBalance();
      } catch (err) {
        console.error('Error accepting prescription:', err);
        this.$toast?.error(err?.response?.data?.message || 'Failed to accept prescription');
      } finally {
        this.actionLoading = false;
      }
    },
    async handleDecline() {
      if (!this.declineReason.trim()) return;

      this.actionLoading = true;
      try {
        await apiFactory.$_declinePrescription(this.prescriptionId, {
          reason: this.declineReason,
        });
        this.$toast?.success('Prescription declined');
        this.showDeclineModal = false;
        await this.fetchPrescription();
      } catch (err) {
        console.error('Error declining prescription:', err);
        this.$toast?.error(err?.response?.data?.message || 'Failed to decline prescription');
      } finally {
        this.actionLoading = false;
      }
    },
    async payWithWallet() {
      this.actionLoading = true;
      try {
        await apiFactory.$_payPrescriptionWithPatientWallet(this.prescriptionId);
        this.$toast?.success('Payment completed successfully');
        await this.fetchPrescription();
      } catch (err) {
        console.error('Error paying with wallet:', err);
        this.$toast?.error(err?.response?.data?.message || 'Failed to process payment');
      } finally {
        this.actionLoading = false;
      }
    },
    async payWithCard() {
      this.actionLoading = true;
      try {
        const response = await apiFactory.$_initiatePrescriptionCardPayment(this.prescriptionId);
        const authUrl = response.data?.data?.authorization_url;
        if (authUrl) {
          // Save prescription ID for verification after redirect
          localStorage.setItem('pending_prescription_payment', this.prescriptionId);
          window.location.href = authUrl;
        } else {
          throw new Error('No authorization URL received');
        }
      } catch (err) {
        console.error('Error initiating card payment:', err);
        this.$toast?.error(err?.response?.data?.message || 'Failed to initiate payment');
      } finally {
        this.actionLoading = false;
      }
    },
    startCountdown() {
      this.updateCountdown();
      this.countdownInterval = setInterval(() => {
        this.updateCountdown();
      }, 60000); // Update every minute
    },
    updateCountdown() {
      const expiresAt = new Date(this.prescription.acceptance_expires_at);
      const now = new Date();
      const diff = expiresAt - now;

      if (diff <= 0) {
        this.timeRemaining = 'Expired';
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      this.timeRemaining = `${hours}h ${minutes}m remaining`;
    },
    getStatusDate(status) {
      const statusHistory = this.prescription?.status_history || [];
      const entry = statusHistory.find(h => h.status === status);
      return entry?.changed_at;
    },
    getInitials(name) {
      if (!name || name === 'Unknown') return "?";
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    },
    formatCurrency(amount) {
      if (!amount) return "0.00";
      return Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    formatDateTime(date) {
      if (!date) return "";
      return moment(date).format("MMM D, YYYY h:mm A");
    },
    formatAppointmentDate(date) {
      if (!date) return "";
      return moment(date).format("MMMM D, YYYY [at] h:mm A");
    },
    formatStatus(status) {
      if (!status) return "";
      return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    },
    formatPaymentStatus(status) {
      const statuses = {
        pending: "Pending",
        processing: "Processing",
        completed: "Paid",
        paid: "Paid",
        failed: "Failed",
        refunded: "Refunded",
      };
      return statuses[status?.toLowerCase()] || status || "N/A";
    },
    formatDeliveryAddress(address) {
      if (!address) return "N/A";
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.country) parts.push(address.country);
      if (address.postal_code) parts.push(address.postal_code);
      return parts.join(", ") || "N/A";
    },
    // Parse frequency from OCR text like "2x daily" or "1 Tab 2x daily"
    parseFrequency(text) {
      if (!text) return null;
      // Look for patterns like "2x daily", "3 times daily", "twice daily"
      const freqMatch = text.match(/(\d+)x?\s*(daily|per day|times?\s*(?:a\s*)?day)/i);
      if (freqMatch) {
        return { time: parseInt(freqMatch[1]), unit: 'daily' };
      }
      const twiceMatch = text.match(/twice\s*(daily|a\s*day)/i);
      if (twiceMatch) {
        return { time: 2, unit: 'daily' };
      }
      const onceMatch = text.match(/once\s*(daily|a\s*day)/i);
      if (onceMatch) {
        return { time: 1, unit: 'daily' };
      }
      return null;
    },
    // Parse duration from OCR text like "Duration: 7 days" or "for 7 days"
    parseDuration(text) {
      if (!text) return null;
      // Look for patterns like "Duration: 7 days", "for 7 days", "7 days"
      const durationMatch = text.match(/(?:duration:?\s*)?(\d+)\s*(days?|weeks?|months?)/i);
      if (durationMatch) {
        return { number: parseInt(durationMatch[1]), unit: durationMatch[2].toLowerCase() };
      }
      return null;
    },
    mapVerificationStatus(verificationStatus) {
      const statusMap = {
        'PENDING': 'pending',
        'TIER1_PROCESSING': 'verifying',
        'TIER1_PASSED': 'verified',
        'TIER1_FAILED': 'verification_failed',
        'TIER2_PROCESSING': 'verifying',
        'TIER2_PASSED': 'verified',
        'TIER2_FAILED': 'verification_failed',
        'PHARMACIST_REVIEW': 'under_review',
        'APPROVED': 'approved',
        'REJECTED': 'rejected',
        'EXPIRED': 'expired',
      };
      return statusMap[verificationStatus] || verificationStatus?.toLowerCase() || 'pending';
    },
    async submitRating() {
      if (!this.selectedRating) return;

      this.ratingLoading = true;
      try {
        await apiFactory.$_ratePrescription(this.prescriptionId, {
          rating: this.selectedRating,
          review: this.reviewText.trim() || undefined,
        });
        this.$toast?.success('Thank you for your rating!');
        await this.fetchPrescription();
        // Reset form
        this.selectedRating = 0;
        this.reviewText = "";
      } catch (err) {
        console.error('Error submitting rating:', err);
        this.$toast?.error(err?.response?.data?.message || 'Failed to submit rating');
      } finally {
        this.ratingLoading = false;
      }
    },

    // ============ PICKUP CENTER METHODS ============

    async fetchPickupCenterDetails() {
      if (!this.prescription?.pickup_pharmacy_id) return;

      try {
        const response = await apiFactory.$_getPickupCenterById(this.prescription.pickup_pharmacy_id);
        this.pickupCenterDetails = response.data?.data;
      } catch (err) {
        console.error('Error fetching pickup center details:', err);
      }
    },

    async fetchPickupCenters(params = {}) {
      this.pickupCentersLoading = true;
      try {
        const response = await apiFactory.$_getPickupCenters({
          ...params,
          limit: 20,
        });
        this.pickupCenters = response.data?.data?.pickup_centers || [];
      } catch (err) {
        console.error('Error fetching pickup centers:', err);
        this.pickupCenters = [];
      } finally {
        this.pickupCentersLoading = false;
      }
    },

    async searchPickupCenters() {
      if (!this.pickupSearchQuery || this.pickupSearchQuery.length < 2) {
        await this.fetchPickupCenters();
        return;
      }

      await this.fetchPickupCenters({
        city: this.pickupSearchQuery,
        state: this.pickupSearchQuery,
      });
    },

    async useCurrentLocation() {
      if (!navigator.geolocation) {
        this.$toast?.error('Geolocation is not supported by your browser');
        return;
      }

      this.pickupCentersLoading = true;
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await apiFactory.$_recommendPickupCenters({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              limit: 10,
            });
            this.pickupCenters = response.data?.data || [];
          } catch (err) {
            console.error('Error fetching nearby pickup centers:', err);
            this.$toast?.error('Failed to find nearby pickup centers');
          } finally {
            this.pickupCentersLoading = false;
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          this.$toast?.error('Unable to get your location. Please search manually.');
          this.pickupCentersLoading = false;
        }
      );
    },

    selectPickupCenter(center) {
      this.selectedPickupCenter = center;
      this.selectedPickupCenterId = center._id;
    },

    async confirmPickupCenter() {
      if (!this.selectedPickupCenterId) return;

      this.pickupSelecting = true;
      try {
        await apiFactory.$_setPickupCenter(this.prescriptionId, {
          pickup_pharmacy_id: this.selectedPickupCenterId,
        });
        this.$toast?.success('Pickup center selected successfully');
        this.showPickupModal = false;
        this.pickupCenterDetails = this.selectedPickupCenter;
        await this.fetchPrescription();
      } catch (err) {
        console.error('Error setting pickup center:', err);
        this.$toast?.error(err?.response?.data?.message || 'Failed to set pickup center');
      } finally {
        this.pickupSelecting = false;
      }
    },

    formatPickupAddress(address) {
      if (!address) return 'Address not available';
      const parts = [address.street, address.city, address.state].filter(Boolean);
      return parts.join(', ') || 'Address not available';
    },

    formatDistance(distance) {
      if (!distance) return '';
      if (distance < 1) return `${Math.round(distance * 1000)}m`;
      return `${distance.toFixed(1)}km`;
    },

    // Clarification methods
    handleClarificationFile(event) {
      const file = event.target.files[0];
      if (file) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          this.$toast?.error('File size must be less than 10MB');
          return;
        }
        this.clarificationFile = file;
      }
    },

    async submitClarification() {
      if (!this.clarificationResponse && !this.clarificationFile) {
        this.$toast?.error('Please provide a response or upload a document');
        return;
      }

      this.clarificationLoading = true;
      try {
        const formData = new FormData();
        formData.append('response_message', this.clarificationResponse);
        if (this.clarificationFile) {
          formData.append('document', this.clarificationFile);
        }

        await apiFactory.$_submitClarificationResponse(this.prescriptionId, formData);

        this.$toast?.success('Your response has been submitted');
        this.clarificationResponse = '';
        this.clarificationFile = null;
        await this.fetchPrescription();
      } catch (err) {
        console.error('Error submitting clarification:', err);
        this.$toast?.error(err?.response?.data?.message || 'Failed to submit response');
      } finally {
        this.clarificationLoading = false;
      }
    },

    // Cart integration methods
    async addMedicationsToCart() {
      if (!this.isPrescriptionApproved || !this.hasMatchedMedications) {
        this.$toast?.error('This prescription cannot be added to cart');
        return;
      }

      this.addingToCart = true;
      try {
        const medications = this.prescription?.verified_medications || [];

        // Use the Vuex store action to add medications to cart
        const result = await this.$store.dispatch('pharmacy/addPrescriptionMedicationsToCart', {
          prescriptionId: this.prescriptionId,
          medications: medications,
        });

        if (result.success && result.addedItems.length > 0) {
          this.$toast?.success(`Added ${result.addedItems.length} medication(s) to your cart`);
          // Navigate to cart
          this.$router.push('/app/patient/pharmacy/cart');
        } else if (result.addedItems.length === 0) {
          this.$toast?.warning('No medications could be added. Some drugs may not be in our inventory.');
        }
      } catch (err) {
        console.error('Error adding medications to cart:', err);
        this.$toast?.error(err?.message || 'Failed to add medications to cart');
      } finally {
        this.addingToCart = false;
      }
    },

    formatDateTime(date) {
      if (!date) return '';
      return new Date(date).toLocaleString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  },
};
</script>

<style scoped lang="scss">
.page-content {
  @include flexItem(vertical) {
    gap: $size-12;
    flex-grow: 1;
    max-width: 82.67rem;
    height: 100vh;

    @include responsive(tab-landscape) {
      min-height: 100vh;
    }
  }

  &__body {
    @include flexItem(vertical) {
      gap: $size-24;
      overflow-y: auto;
      overscroll-behavior-block: contain;
      padding: $size-12 $size-48 $size-24 $size-48;
      margin-left: $size-8;
      margin-right: $size-8;

      @include scrollBar(normal);

      @include responsive(tab-landscape) {
        padding-left: $size-32;
        padding-right: $size-32;
        margin-right: $size-0;
        margin-left: $size-0;

        @include scrollBar(reset);
      }

      @include responsive(phone) {
        padding: $size-12 $size-16 $size-24 $size-16;
        margin-right: $size-0;
        margin-left: $size-0;
        overflow-x: visible;
        overflow-y: auto;

        @include scrollBar(none);
      }
    }
  }
}

.prescription-details-container {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  gap: $size-16;
  margin-bottom: $size-24;

  .back-btn {
    width: $size-40;
    height: $size-40;
    border-radius: 50%;
    border: none;
    background: $color-white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
      background: $color-g-95;
    }
  }

  .header-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $size-12;
    flex-wrap: wrap;

    h1 {
      font-size: $size-22;
      font-weight: $fw-semi-bold;
      color: $color-g-21;

      @include responsive(phone) {
        font-size: $size-18;
      }
    }
  }

  .pdf-btn {
    display: flex;
    align-items: center;
    gap: $size-8;
    padding: $size-10 $size-16;
    background: $color-pri;
    color: $color-white;
    border: none;
    border-radius: $size-8;
    font-size: $size-14;
    font-weight: $fw-medium;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: darken($color-pri, 10%);
    }
  }
}

.alert-banner {
  display: flex;
  gap: $size-16;
  padding: $size-16;
  border-radius: $size-12;
  margin-bottom: $size-20;

  &--warning {
    background: rgba(#f59e0b, 0.1);
    border: 1px solid rgba(#f59e0b, 0.3);

    .alert-icon {
      color: #f59e0b;
    }
  }

  &--info {
    background: rgba(#3b82f6, 0.1);
    border: 1px solid rgba(#3b82f6, 0.3);

    .alert-icon {
      color: #3b82f6;
    }
  }

  &--danger {
    background: rgba(#ef4444, 0.1);
    border: 1px solid rgba(#ef4444, 0.3);

    .alert-icon {
      color: #ef4444;
    }
  }

  &--success {
    background: rgba(#10b981, 0.1);
    border: 1px solid rgba(#10b981, 0.3);

    .alert-icon {
      color: #10b981;
    }
  }

  .alert-icon {
    width: $size-24;
    height: $size-24;
    flex-shrink: 0;
  }

  .alert-content {
    flex: 1;

    h4 {
      font-size: $size-16;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    p {
      font-size: $size-14;
      color: $color-g-44;
    }

    .expiry-time {
      margin-top: $size-8;
      font-size: $size-13;
      color: $color-g-54;

      .countdown {
        font-weight: $fw-semi-bold;
        color: #f59e0b;
      }
    }
  }
}

.status {
  font-size: $size-12;
  padding: $size-4 $size-12;
  border-radius: $size-12;
  font-weight: $fw-medium;
  text-transform: uppercase;

  &--draft {
    background: $color-g-90;
    color: $color-g-44;
  }

  &--pending_acceptance {
    background: rgba(#8b5cf6, 0.1);
    color: #7c3aed;
  }

  &--accepted {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--pending_payment {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--paid,
  &--processing {
    background: rgba(#3b82f6, 0.1);
    color: #2563eb;
  }

  &--dispensed,
  &--shipped {
    background: rgba(#8b5cf6, 0.1);
    color: #7c3aed;
  }

  &--delivered {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--cancelled,
  &--expired {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }
}

.info-card {
  background: $color-white;
  padding: $size-20;
  border-radius: $size-12;
  margin-bottom: $size-16;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }
}

.action-card {
  background: $color-white;
  padding: $size-20;
  border-radius: $size-12;
  margin-bottom: $size-16;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 2px solid $color-pri;

  .action-header {
    margin-bottom: $size-16;

    h3 {
      font-size: $size-18;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    p {
      font-size: $size-14;
      color: $color-g-54;
    }
  }

  .partial-toggle {
    margin-bottom: $size-16;
    padding: $size-12;
    background: $color-g-97;
    border-radius: $size-8;

    .toggle-label {
      display: flex;
      align-items: center;
      gap: $size-8;
      cursor: pointer;
      font-size: $size-14;
      color: $color-g-36;

      input {
        width: 18px;
        height: 18px;
      }
    }
  }

  .wallet-balance {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-12;
    background: $color-g-97;
    border-radius: $size-8;
    margin-bottom: $size-16;

    .label {
      font-size: $size-14;
      color: $color-g-54;
    }

    .balance {
      font-size: $size-16;
      font-weight: $fw-semi-bold;
      color: $color-g-36;

      &.sufficient {
        color: #10b981;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: $size-12;

    @include responsive(phone) {
      flex-direction: column;
    }

    .btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $size-8;
      padding: $size-14 $size-20;
      border-radius: $size-10;
      font-size: $size-15;
      font-weight: $fw-medium;
      cursor: pointer;
      transition: all 0.2s ease;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-success {
      background: #10b981;
      color: $color-white;
      border: none;

      &:hover:not(:disabled) {
        background: #059669;
      }
    }

    .btn-outline-danger {
      background: transparent;
      color: #ef4444;
      border: 2px solid #ef4444;

      &:hover:not(:disabled) {
        background: rgba(#ef4444, 0.1);
      }
    }

    .btn-primary {
      background: $color-pri;
      color: $color-white;
      border: none;

      &:hover:not(:disabled) {
        background: darken($color-pri, 10%);
      }
    }

    .btn-outline-primary {
      background: transparent;
      color: $color-pri;
      border: 2px solid $color-pri;

      &:hover:not(:disabled) {
        background: rgba($color-pri, 0.1);
      }
    }
  }
}

.doctor-row {
  display: flex;
  align-items: center;
  gap: $size-16;
}

.doctor-avatar {
  width: $size-56;
  height: $size-56;
  border-radius: 50%;
  background: $color-pri;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-white;
  }
}

.doctor-details {
  flex: 1;

  .name {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }

  .specialty,
  .experience {
    font-size: $size-14;
    color: $color-g-54;
  }
}

.doctor-contact {
  margin-top: $size-16;
  padding-top: $size-16;
  border-top: 1px solid $color-g-92;
  display: flex;
  flex-wrap: wrap;
  gap: $size-16;

  .contact-item {
    display: flex;
    gap: $size-8;
    font-size: $size-14;

    .label {
      color: $color-g-54;
    }

    .value {
      color: $color-g-36;
    }
  }
}

.medications-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.medication-item {
  padding: $size-16;
  background: $color-g-97;
  border-radius: $size-10;
  display: flex;
  flex-wrap: wrap;
  gap: $size-12;

  &--declined {
    opacity: 0.6;
    background: rgba(#ef4444, 0.05);
    border: 1px dashed rgba(#ef4444, 0.3);
  }

  .item-checkbox {
    display: flex;
    align-items: flex-start;
    padding-top: $size-4;

    input {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
  }
}

.medication-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex: 1;
  min-width: 200px;
}

.medication-info {
  h4 {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-2;
  }

  .generic,
  .dosage-form {
    font-size: $size-13;
    color: $color-g-54;
  }

  .manufacturer {
    font-size: $size-13;
    color: $color-g-67;
    margin-top: $size-2;

    .mfg-label {
      color: $color-g-54;
      font-weight: $fw-medium;
    }
  }

  .declined-badge {
    display: inline-block;
    margin-top: $size-4;
    padding: $size-2 $size-8;
    background: rgba(#ef4444, 0.1);
    color: #ef4444;
    font-size: $size-11;
    font-weight: $fw-medium;
    border-radius: $size-4;
  }
}

.medication-quantity {
  text-align: right;

  .qty {
    display: block;
    font-size: $size-15;
    color: $color-g-54;
  }

  .price {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

.medication-details {
  width: 100%;
  border-top: 1px solid $color-g-90;
  padding-top: $size-12;

  .detail {
    display: flex;
    gap: $size-8;
    font-size: $size-13;
    margin-bottom: $size-4;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: $color-g-54;
      min-width: 80px;
    }

    .value {
      color: $color-g-36;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-12;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: $size-4;

  .label {
    font-size: $size-12;
    color: $color-g-54;
  }

  .value {
    font-size: $size-15;
    font-weight: $fw-medium;
    color: $color-g-21;
  }

  &.total {
    grid-column: span 2;
    padding-top: $size-12;
    border-top: 1px solid $color-g-92;

    @include responsive(phone) {
      grid-column: span 1;
    }

    .value {
      font-size: $size-20;
      font-weight: $fw-bold;
      color: $color-pri;
    }
  }

  &.full-width {
    grid-column: span 2;

    @include responsive(phone) {
      grid-column: span 1;
    }
  }
}

.delivery-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-12;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.payment-status-row {
  margin-top: $size-16;
  padding-top: $size-16;
  border-top: 1px solid $color-g-92;

  .status-item {
    .label {
      font-size: $size-12;
      color: $color-g-54;
      display: block;
      margin-bottom: $size-4;
    }
  }
}

.payment-badge {
  font-size: $size-12;
  padding: $size-4 $size-10;
  border-radius: $size-12;
  font-weight: $fw-medium;

  &--pending {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--paid,
  &--completed {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--failed {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }
}

// Document preview for patient uploads
.document-preview {
  margin-bottom: $size-16;

  .document-link {
    display: flex;
    align-items: center;
    gap: $size-10;
    padding: $size-14 $size-16;
    background: $color-g-97;
    border: 1px solid $color-g-90;
    border-radius: $size-8;
    text-decoration: none;
    color: $color-pri;
    transition: all 0.2s ease;

    &:hover {
      background: $color-g-95;
      border-color: $color-pri;
    }

    .icons {
      width: $size-20;
      height: $size-20;
    }

    .external-icon {
      margin-left: auto;
      opacity: 0.6;
    }
  }
}

.verification-info {
  display: flex;
  flex-wrap: wrap;
  gap: $size-16;
  margin-bottom: $size-12;
}

.verification-badge {
  font-size: $size-12;
  padding: $size-4 $size-10;
  border-radius: $size-12;
  font-weight: $fw-medium;

  &--pending {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--approved {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--rejected,
  &--tier1_failed,
  &--tier2_failed {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }

  &--tier1_processing,
  &--tier2_processing,
  &--pharmacist_review {
    background: rgba(#3b82f6, 0.1);
    color: #2563eb;
  }
}

.upload-hint {
  font-size: $size-13;
  color: $color-g-54;
  font-style: italic;
  margin: 0;

  &--rejected {
    color: $color-denote-red;
    font-weight: $fw-medium;
    font-style: normal;

    .rejection-summary {
      margin: 0;
      line-height: 1.5;
    }
  }
}

.timeline {
  position: relative;
  padding-left: $size-28;
}

.timeline-item {
  position: relative;
  padding-bottom: $size-20;
  padding-left: 0;

  &:last-child {
    padding-bottom: 0;
  }

  // Connecting line to next item (shown for all except last)
  &:not(:last-child)::before {
    content: "";
    position: absolute;
    left: -20px;
    top: 16px;
    bottom: -4px;
    width: 2px;
    background: $color-g-85;
    z-index: 0;
  }

  // Green line for completed steps
  &.completed:not(:last-child)::before {
    background: #10b981;
  }

  // Current item shows gray line below (to next incomplete items)
  &.current:not(:last-child)::before {
    background: $color-g-85;
  }

  .timeline-marker {
    position: absolute;
    left: -28px;
    top: 0;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: $color-g-90;
    border: 2px solid $color-g-90;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    z-index: 2;

    .check-icon {
      font-size: 10px;
      font-weight: bold;
      line-height: 1;
      color: white;
    }
  }

  &.completed .timeline-marker {
    background: #10b981;
    border-color: #10b981;
  }

  &.current .timeline-marker {
    background: #10b981;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }

  &:not(.completed):not(.current) .timeline-marker {
    background: white;
    border-color: $color-g-85;
  }

  .timeline-content {
    .event-status {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-36;
    }

    .event-date {
      font-size: $size-12;
      color: $color-g-54;
      margin-top: $size-2;
    }
  }
}

.notes-section {
  margin-bottom: $size-12;

  &:last-child {
    margin-bottom: 0;
  }

  .notes-label {
    font-size: $size-13;
    font-weight: $fw-medium;
    color: $color-g-54;
    margin-bottom: $size-4;
  }

  .notes-text {
    font-size: $size-15;
    color: $color-g-44;
    line-height: 1.6;
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 20px;
}

.error-message {
  color: #dc3545;
  font-size: 16px;
  margin-bottom: 16px;
}

.retry-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }
}

// Modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $size-16;
}

.modal-content {
  background: $color-white;
  border-radius: $size-12;
  padding: $size-24;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);

  h3 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-8;
  }

  p {
    font-size: $size-14;
    color: $color-g-54;
    margin-bottom: $size-16;
  }

  textarea {
    width: 100%;
    padding: $size-12;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    font-size: $size-14;
    font-family: inherit;
    resize: vertical;
    margin-bottom: $size-16;

    &:focus {
      outline: none;
      border-color: $color-pri;
    }
  }

  .modal-actions {
    display: flex;
    gap: $size-12;
    justify-content: flex-end;

    .btn {
      padding: $size-10 $size-20;
      border-radius: $size-8;
      font-size: $size-14;
      font-weight: $fw-medium;
      cursor: pointer;
      transition: all 0.2s ease;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-outline {
      background: transparent;
      border: 1px solid $color-g-85;
      color: $color-g-44;

      &:hover:not(:disabled) {
        background: $color-g-97;
      }
    }

    .btn-danger {
      background: #ef4444;
      border: none;
      color: $color-white;

      &:hover:not(:disabled) {
        background: #dc2626;
      }
    }
  }
}

// Rating Card Styles
.rating-card {
  background: $color-white;
  border-radius: $size-16;
  padding: $size-24;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: $size-24;

  h3 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }
}

.rating-display {
  display: flex;
  align-items: center;
  gap: $size-16;

  .stars {
    display: flex;
    gap: $size-4;

    span {
      font-size: $size-24;
    }
  }

  .rating-text {
    font-size: $size-16;
    color: $color-g-44;
    font-weight: $fw-medium;
  }
}

.rating-form {
  .star-rating {
    display: flex;
    gap: $size-8;
    margin-bottom: $size-12;

    .star-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: $size-32;
      padding: 0;
      transition: transform 0.15s ease;

      &:hover {
        transform: scale(1.15);
      }

      &:focus {
        outline: none;
      }
    }
  }

  .rating-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: $size-20;
    padding: 0 $size-4;

    span {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  .review-input {
    width: 100%;
    min-height: 100px;
    padding: $size-12;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    font-size: $size-14;
    font-family: inherit;
    resize: vertical;
    margin-bottom: $size-16;

    &:focus {
      outline: none;
      border-color: $color-pri;
    }

    &::placeholder {
      color: $color-g-67;
    }
  }

  .submit-rating-btn {
    background: $color-pri;
    color: $color-white;
    border: none;
    padding: $size-12 $size-24;
    border-radius: $size-8;
    font-size: $size-14;
    font-weight: $fw-medium;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: darken($color-pri, 8%);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

// ============ PICKUP CENTER STYLES ============

.pickup-card {
  .pickup-icon {
    margin-right: $size-8;
    color: $color-pri;
  }

  h3 {
    display: flex;
    align-items: center;
  }
}

.pickup-details {
  .pickup-center-info {
    margin-bottom: $size-16;

    h4 {
      font-size: $size-16;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-8;
    }

    p {
      display: flex;
      align-items: center;
      gap: $size-8;
      font-size: $size-14;
      color: $color-g-67;
      margin-bottom: $size-4;

      svg {
        width: $size-16;
        height: $size-16;
        flex-shrink: 0;
      }
    }
  }
}

.pickup-code-section {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 2px solid #4caf50;
  border-radius: $size-12;
  padding: $size-20;
  margin: $size-16 0;
  text-align: center;

  .pickup-code-label {
    font-size: $size-12;
    font-weight: $fw-medium;
    color: #2e7d32;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: $size-8;
  }

  .pickup-code {
    font-size: $size-32;
    font-weight: $fw-bold;
    color: #1b5e20;
    font-family: monospace;
    letter-spacing: 4px;
  }

  .pickup-code-hint {
    font-size: $size-12;
    color: #388e3c;
    margin-top: $size-8;
  }
}

.pickup-status {
  display: flex;
  align-items: center;
  gap: $size-8;
  padding: $size-12 $size-16;
  border-radius: $size-8;
  font-size: $size-14;
  font-weight: $fw-medium;
  margin-bottom: $size-16;

  svg {
    width: $size-20;
    height: $size-20;
  }

  &.ready {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &.transit {
    background: #e3f2fd;
    color: #1565c0;
  }

  &.preparing {
    background: #fff3e0;
    color: #e65100;
  }
}

.change-pickup-btn {
  font-size: $size-12;
  padding: $size-8 $size-12;
}

.select-pickup-section {
  text-align: center;
  padding: $size-24;

  .pickup-prompt {
    font-size: $size-14;
    color: $color-g-67;
    margin-bottom: $size-16;
  }
}

// Pickup Modal
.pickup-modal {
  max-width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.pickup-search {
  display: flex;
  gap: $size-12;
  margin-bottom: $size-16;

  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $size-8;
    background: $color-g-95;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    padding: 0 $size-12;

    svg {
      width: $size-18;
      height: $size-18;
      color: $color-g-67;
    }

    input {
      flex: 1;
      border: none;
      background: transparent;
      padding: $size-12 0;
      font-size: $size-14;
      outline: none;

      &::placeholder {
        color: $color-g-67;
      }
    }
  }

  .use-location-btn {
    display: flex;
    align-items: center;
    gap: $size-6;
    background: $color-white;
    border: 1px solid $color-pri;
    color: $color-pri;
    padding: $size-10 $size-14;
    border-radius: $size-8;
    font-size: $size-12;
    font-weight: $fw-medium;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;

    svg {
      width: $size-16;
      height: $size-16;
    }

    &:hover {
      background: rgba($color-pri, 0.05);
    }
  }
}

.pickup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $size-40;
  color: $color-g-67;

  p {
    margin-top: $size-12;
    font-size: $size-14;
  }
}

.pickup-centers-list {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid $color-g-85;
  border-radius: $size-8;
}

.pickup-center-item {
  display: flex;
  gap: $size-12;
  padding: $size-16;
  border-bottom: 1px solid $color-g-85;
  cursor: pointer;
  transition: background 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: $color-g-95;
  }

  &.selected {
    background: rgba($color-pri, 0.08);
    border-color: $color-pri;
  }

  .center-radio {
    padding-top: $size-4;

    input[type="radio"] {
      width: $size-18;
      height: $size-18;
      cursor: pointer;
    }
  }

  .center-info {
    flex: 1;

    h4 {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    .center-address {
      font-size: $size-13;
      color: $color-g-67;
      margin-bottom: $size-8;
    }

    .center-meta {
      display: flex;
      gap: $size-16;
      font-size: $size-12;

      .distance {
        display: flex;
        align-items: center;
        gap: $size-4;
        color: $color-pri;

        svg {
          width: $size-14;
          height: $size-14;
        }
      }

      .handling-fee {
        color: $color-g-67;
      }
    }
  }
}

.pickup-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $size-40;
  color: $color-g-67;

  svg {
    width: $size-48;
    height: $size-48;
    opacity: 0.5;
    margin-bottom: $size-12;
  }

  p {
    font-size: $size-14;
    font-weight: $fw-medium;
    color: $color-g-54;
  }

  span {
    font-size: $size-12;
    margin-top: $size-4;
  }
}

// Approved prescription card styles
.approved-card {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #10b981;
  border-radius: $size-12;
  padding: $size-20;

  .approved-header {
    display: flex;
    align-items: center;
    gap: $size-8;
    margin-bottom: $size-12;

    .approved-icon {
      width: $size-24;
      height: $size-24;
      color: #059669;
    }

    h3 {
      font-size: $size-18;
      font-weight: $fw-semi-bold;
      color: #059669;
      margin: 0;
    }
  }

  .approved-message {
    font-size: $size-14;
    color: #047857;
    margin-bottom: $size-16;
  }

  .verified-medications {
    background: white;
    border-radius: $size-8;
    padding: $size-16;
    margin-bottom: $size-16;

    h4 {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-g-80;
      margin: 0 0 $size-12 0;
    }

    .medication-list {
      display: flex;
      flex-direction: column;
      gap: $size-8;
    }

    .medication-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $size-10 $size-12;
      background: #f9fafb;
      border-radius: $size-6;

      .med-info {
        display: flex;
        flex-direction: column;
        gap: $size-2;

        .med-name {
          font-weight: $fw-medium;
          color: $color-g-80;
        }

        .med-details {
          font-size: $size-12;
          color: $color-g-54;
        }
      }

      .matched-badge {
        display: flex;
        align-items: center;
        gap: $size-4;
        font-size: $size-12;
        color: #059669;
        background: #d1fae5;
        padding: $size-4 $size-8;
        border-radius: $size-4;

        svg {
          width: $size-12;
          height: $size-12;
        }
      }

      .not-matched-badge {
        display: flex;
        align-items: center;
        gap: $size-4;
        font-size: $size-12;
        color: #d97706;
        background: #fef3c7;
        padding: $size-4 $size-8;
        border-radius: $size-4;

        svg {
          width: $size-12;
          height: $size-12;
        }
      }
    }
  }

  .cart-action-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $size-8;

    .add-to-cart-btn {
      display: flex;
      align-items: center;
      gap: $size-8;
      padding: $size-12 $size-24;
      font-size: $size-16;
      font-weight: $fw-semi-bold;
      background: #059669;
      color: white;
      border: none;
      border-radius: $size-8;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: #047857;
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      svg {
        width: $size-20;
        height: $size-20;
      }

      .spin {
        animation: spin 1s linear infinite;
      }
    }

    .cart-hint {
      font-size: $size-12;
      color: $color-g-54;
      text-align: center;
      margin: 0;
    }
  }

  // Paid prescription styles
  .paid-message {
    display: flex;
    align-items: center;
    gap: $size-8;
    font-weight: $fw-medium;
    color: #059669;

    .paid-icon {
      width: $size-18;
      height: $size-18;
      color: #059669;
    }
  }

  .order-info {
    display: flex;
    align-items: center;
    gap: $size-8;
    background: white;
    padding: $size-12 $size-16;
    border-radius: $size-8;
    margin-bottom: $size-12;

    .order-label {
      font-size: $size-14;
      color: $color-g-54;
    }

    .order-link {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-pri;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .order-status {
    display: flex;
    align-items: center;
    gap: $size-8;
    background: white;
    padding: $size-12 $size-16;
    border-radius: $size-8;

    .status-label {
      font-size: $size-14;
      color: $color-g-54;
    }

    .status-badge {
      font-size: $size-12;
      font-weight: $fw-medium;
      padding: $size-4 $size-10;
      border-radius: $size-4;
      text-transform: capitalize;

      &.status-paid,
      &.status-confirmed {
        background: #d1fae5;
        color: #059669;
      }

      &.status-processing,
      &.status-preparing {
        background: #dbeafe;
        color: #2563eb;
      }

      &.status-dispensed,
      &.status-ready {
        background: #e0e7ff;
        color: #4f46e5;
      }

      &.status-shipped,
      &.status-in_transit {
        background: #fef3c7;
        color: #d97706;
      }

      &.status-delivered,
      &.status-completed {
        background: #d1fae5;
        color: #059669;
      }

      &.status-cancelled {
        background: #fee2e2;
        color: #dc2626;
      }
    }
  }
}

// Clarification card styles
.clarification-card {
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  border: 1px solid #eab308;
  border-radius: $size-12;
  padding: $size-20;

  .clarification-header {
    display: flex;
    align-items: center;
    gap: $size-8;
    margin-bottom: $size-12;

    .clarification-icon {
      width: $size-24;
      height: $size-24;
      color: #ca8a04;
    }

    h3 {
      font-size: $size-18;
      font-weight: $fw-semi-bold;
      color: #ca8a04;
      margin: 0;
    }
  }

  .clarification-content {
    margin-bottom: $size-16;

    .clarification-message {
      font-size: $size-14;
      color: #a16207;
      margin-bottom: $size-12;
    }

    .clarification-items {
      background: white;
      padding: $size-12;
      border-radius: $size-6;
      margin-bottom: $size-12;

      h4 {
        font-size: $size-13;
        font-weight: $fw-semi-bold;
        margin: 0 0 $size-8 0;
      }

      ul {
        margin: 0;
        padding-left: $size-20;

        li {
          font-size: $size-13;
          color: $color-g-67;
        }
      }
    }

    .clarification-deadline {
      display: flex;
      gap: $size-8;
      font-size: $size-13;

      .label {
        color: $color-g-67;
      }

      .deadline-value {
        font-weight: $fw-medium;
        color: $color-g-80;

        &.deadline-urgent {
          color: #dc2626;
        }
      }
    }
  }

  .clarification-form {
    background: white;
    padding: $size-16;
    border-radius: $size-8;

    h4 {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      margin: 0 0 $size-12 0;
    }

    .response-textarea {
      width: 100%;
      padding: $size-12;
      border: 1px solid #e5e7eb;
      border-radius: $size-6;
      font-size: $size-14;
      resize: vertical;
      margin-bottom: $size-12;

      &:focus {
        outline: none;
        border-color: $color-pri;
      }
    }

    .upload-section {
      margin-bottom: $size-12;

      .file-upload-label {
        display: flex;
        align-items: center;
        gap: $size-8;
        padding: $size-10 $size-12;
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: $size-6;
        cursor: pointer;
        font-size: $size-13;
        color: $color-g-67;

        input {
          display: none;
        }

        svg {
          width: $size-16;
          height: $size-16;
        }

        &:hover {
          border-color: $color-pri;
          color: $color-pri;
        }
      }
    }

    .submit-clarification-btn {
      display: flex;
      align-items: center;
      gap: $size-8;
      padding: $size-10 $size-20;
      background: #ca8a04;
      color: white;
      border: none;
      border-radius: $size-6;
      cursor: pointer;
      font-weight: $fw-medium;

      &:hover:not(:disabled) {
        background: #a16207;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      svg {
        width: $size-16;
        height: $size-16;
      }

      .spin {
        animation: spin 1s linear infinite;
      }
    }
  }

  .clarification-submitted {
    background: white;
    padding: $size-16;
    border-radius: $size-8;
    text-align: center;

    .submitted-badge {
      display: inline-flex;
      align-items: center;
      gap: $size-6;
      background: #d1fae5;
      color: #059669;
      padding: $size-8 $size-12;
      border-radius: $size-20;
      font-weight: $fw-medium;
      margin-bottom: $size-12;

      svg {
        width: $size-16;
        height: $size-16;
      }
    }

    .submitted-message {
      font-size: $size-14;
      color: $color-g-67;
      margin: 0 0 $size-4 0;
    }

    .submitted-date {
      font-size: $size-12;
      color: $color-g-54;
      margin: 0 0 $size-8 0;
    }

    .review-notice {
      font-size: $size-13;
      color: #ca8a04;
      font-style: italic;
      margin: 0;
    }
  }
}

// Review card styles (clarification under review)
.review-card {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #3b82f6;
  border-radius: $size-12;
  padding: $size-20;

  .review-header {
    display: flex;
    align-items: center;
    gap: $size-8;
    margin-bottom: $size-12;

    .review-icon {
      width: $size-24;
      height: $size-24;
      color: #2563eb;
    }

    h3 {
      font-size: $size-18;
      font-weight: $fw-semi-bold;
      color: #2563eb;
      margin: 0;
    }
  }

  .review-message {
    font-size: $size-14;
    color: #1d4ed8;
    margin: 0;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Related Appointments
.related-appointments-card {
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.related-appointments-note {
  font-size: 13px;
  color: #6b7280;
  margin: 8px 0 12px;
}

.related-appointments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-appointment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.related-appointment-icon {
  color: #0EAEC4;
}

.related-appointment-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.related-appointment-date {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

.related-appointment-channel {
  font-size: 11px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
