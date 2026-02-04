<template>
  <div class="prescription-details-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="back-btn-mobile" @click="$router.back()">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
    </header>

    <!-- Main Content -->
    <div class="page-content">
      <Loader v-if="loading" :useOverlay="false" style="position: absolute" />

      <div v-else-if="error" class="error-state">
        <div class="error-card">
          <div class="error-icon">
            <v-icon name="hi-exclamation-circle" scale="2.5" />
          </div>
          <h3>Unable to Load Prescription</h3>
          <p>{{ error }}</p>
          <button class="btn-primary" @click="fetchPrescription">
            <v-icon name="hi-refresh" scale="0.9" />
            Try Again
          </button>
        </div>
      </div>

      <div v-else-if="prescription" class="content-wrapper">
        <!-- Hero Section - Matching Prescriptions List Page -->
        <section class="hero">
          <div class="hero__content">
            <button class="back-link desktop-only" @click="$router.push('/app/patient/prescriptions')">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>All Prescriptions</span>
            </button>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="ri-capsule-line" />
              <span>Prescription Details</span>
            </div>
            <h1 class="hero__title">
              {{ prescription.prescription_number }}
            </h1>
            <p class="hero__subtitle">
              {{ getSourceDescription }}
            </p>
            <div class="hero__stats">
              <div class="hero-stat">
                <span :class="['hero-stat__value', statusValueClass]">{{ displayStatus }}</span>
                <span class="hero-stat__label">Status</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ medicationsList?.length || 0 }}</span>
                <span class="hero-stat__label">Medications</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--info">{{ formatCurrency(prescription.total_amount || 0) }}</span>
                <span class="hero-stat__label">Total (NGN)</span>
              </div>
              <div class="hero-stat__divider" v-if="prescription.pdf_url"></div>
              <div class="hero-stat hero-stat--action" v-if="prescription.pdf_url" @click="downloadPdf">
                <v-icon name="hi-download" scale="1.2" />
                <span class="hero-stat__label">PDF</span>
              </div>
            </div>
          </div>
          <div class="hero__visual">
            <div class="prescription-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="ri-capsule-line" />
              </div>
            </div>
            <div class="floating-icons">
              <div class="float-icon float-icon--1"><v-icon name="hi-clipboard-check" /></div>
              <div class="float-icon float-icon--2"><v-icon name="hi-document-text" /></div>
              <div class="float-icon float-icon--3"><v-icon name="hi-shield-check" /></div>
            </div>
          </div>
        </section>

        <!-- Alert Banner -->
        <div v-if="isSelfServicePrescription" class="alert-banner" :class="alertBannerClass">
          <div class="alert-icon">
            <v-icon :name="alertIconName" scale="1.2" />
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

        <!-- Bento Grid -->
        <div class="bento-grid">
          <!-- Doctor Info Card -->
          <div class="bento-card doctor-card" v-if="prescription.prescribed_by || prescription.specialist">
            <div class="card-header">
              <v-icon name="hi-user-circle" scale="1" />
              <h3>Prescribing Doctor</h3>
            </div>
            <div class="doctor-content">
              <div class="doctor-avatar">
                <img
                  v-if="doctorPhoto"
                  :src="doctorPhoto"
                  :alt="doctorName"
                />
                <span v-else>{{ getInitials(doctorName) }}</span>
              </div>
              <div class="doctor-details">
                <p class="doctor-name">Dr. {{ doctorName }}</p>
                <p class="doctor-specialty">{{ doctorSpecialty }}</p>
                <div class="doctor-rating" v-if="prescription.specialist?.average_rating">
                  <span class="stars">★</span>
                  <span>{{ prescription.specialist.average_rating.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Method Card -->
          <div class="bento-card payment-method-card" v-if="prescription.payment_method || prescription.payment_status">
            <div class="card-header">
              <v-icon name="hi-credit-card" scale="1" />
              <h3>Payment Details</h3>
            </div>
            <div class="payment-method-content">
              <div class="payment-row" v-if="prescription.payment_method">
                <span class="label">Payment Method</span>
                <span class="value payment-method-badge">
                  <v-icon :name="paymentMethodIcon" scale="0.8" />
                  {{ formatPaymentMethod(prescription.payment_method) }}
                </span>
              </div>
              <div class="payment-row" v-if="prescription.payment_status">
                <span class="label">Status</span>
                <span :class="['payment-status-badge', `status--${prescription.payment_status?.toLowerCase()}`]">
                  {{ formatPaymentStatus(prescription.payment_status) }}
                </span>
              </div>
              <div class="payment-row" v-if="prescription.paid_at">
                <span class="label">Paid On</span>
                <span class="value">{{ formatDateTime(prescription.paid_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Linked Appointments Card -->
          <div v-if="hasLinkedAppointments" class="bento-card appointments-card">
            <div class="card-header">
              <v-icon name="hi-video-camera" scale="1" />
              <h3>Linked Consultation</h3>
            </div>
            <div class="appointments-list">
              <div
                v-for="appt in allLinkedAppointments"
                :key="appt._id || appt"
                class="appointment-item clickable"
                @click="viewAppointment(appt)"
              >
                <div class="appt-icon">
                  <v-icon name="hi-video-camera" scale="1" />
                </div>
                <div class="appt-info">
                  <span class="appt-date">{{ formatAppointmentDate(appt.start_time || appt.scheduled_time) }}</span>
                  <span class="appt-type" v-if="appt.meeting_channel || appt.consultation_type">
                    {{ appt.meeting_channel || appt.consultation_type }}
                  </span>
                </div>
                <v-icon name="hi-chevron-right" scale="0.8" class="appt-arrow" />
              </div>
            </div>
          </div>

          <!-- Linked Clinical Notes Card -->
          <div v-if="prescription.linked_clinical_notes?.length" class="bento-card clinical-notes-card">
            <div class="card-header">
              <v-icon name="hi-clipboard-list" scale="1" />
              <h3>Clinical Notes</h3>
              <span class="count-badge">{{ prescription.linked_clinical_notes.length }}</span>
            </div>
            <div class="clinical-notes-list">
              <div
                v-for="note in prescription.linked_clinical_notes"
                :key="note._id || note"
                class="note-item"
              >
                <div class="note-icon">
                  <v-icon name="hi-document-text" scale="0.9" />
                </div>
                <div class="note-info">
                  <span class="note-title">{{ note.title || 'Clinical Note' }}</span>
                  <span class="note-date" v-if="note.created_at">{{ formatDate(note.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Medications Card - Full Width -->
          <div class="bento-card medications-card full-width">
            <div class="card-header">
              <v-icon name="ri-capsule-line" scale="1" />
              <h3>Medications</h3>
              <span class="count-badge">{{ medicationsList?.length || 0 }}</span>
            </div>
            <div class="medications-list">
              <div
                v-for="(item, index) in medicationsList"
                :key="index"
                :class="['medication-item', { 'medication-item--declined': item.patient_accepted === false }]"
              >
                <div v-if="isPendingAcceptance && showPartialSelection" class="item-checkbox">
                  <input
                    type="checkbox"
                    :id="`item-${index}`"
                    v-model="selectedItems"
                    :value="item._id || index"
                  />
                </div>
                <div class="med-image">
                  <img
                    v-if="item.drug_image || item.image_url"
                    :src="item.drug_image || item.image_url"
                    :alt="item.drug || item.drug_name"
                    @error="handleDrugImageError($event)"
                  />
                  <div v-else class="med-icon-placeholder">
                    <v-icon name="ri-capsule-line" scale="1.4" />
                  </div>
                </div>
                <div class="med-info">
                  <h4>{{ item.drug || item.drug_name }}</h4>
                  <p class="med-details" v-if="item.generic_name || item.strength || item.manufacturer">
                    <span v-if="item.generic_name" class="generic-name">{{ item.generic_name }}</span>
                    <span v-if="item.strength" class="strength">{{ item.strength }}</span>
                    <span v-if="item.manufacturer" class="manufacturer">{{ item.manufacturer }}</span>
                  </p>
                  <div class="med-dosage">
                    <span v-if="item.dose?.dosage_form" class="dosage-tag">
                      <v-icon name="ri-capsule-line" scale="0.6" />
                      {{ item.dose.dosage_form }}
                    </span>
                    <span v-if="item.route" class="dosage-tag">
                      <v-icon name="hi-arrow-right" scale="0.6" />
                      {{ item.route }}
                    </span>
                    <span v-if="item.interval" class="dosage-tag">
                      <v-icon name="hi-clock" scale="0.6" />
                      {{ item.interval.time }}x {{ item.interval.unit }}
                    </span>
                    <span v-if="item.period" class="dosage-tag">
                      <v-icon name="hi-calendar" scale="0.6" />
                      {{ item.period.number }} {{ item.period.unit }}
                    </span>
                  </div>
                  <p class="med-instructions" v-if="item.notes || item.instructions">
                    <v-icon name="hi-information-circle" scale="0.7" />
                    {{ item.notes || item.instructions }}
                  </p>
                  <span v-if="item.patient_accepted === false" class="declined-badge">
                    <v-icon name="hi-x-circle" scale="0.7" /> Declined
                  </span>
                </div>
                <div class="med-pricing">
                  <span class="qty-badge">Qty: {{ item.dose?.quantity || item.quantity || 1 }}</span>
                  <div class="price-breakdown" v-if="item.unit_price">
                    <span class="unit-price">NGN {{ formatCurrency(item.unit_price) }} each</span>
                  </div>
                  <span class="total-price" v-if="item.total_price || item.unit_price">
                    NGN {{ formatCurrency(item.total_price || item.unit_price * (item.dose?.quantity || item.quantity || 1)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Info Card -->
          <div class="bento-card payment-card" v-if="!prescription.is_patient_upload || prescription.has_original_prescription">
            <div class="card-header">
              <v-icon name="hi-credit-card" scale="1" />
              <h3>Payment</h3>
            </div>
            <div class="payment-grid">
              <div class="payment-item">
                <span class="label">Subtotal</span>
                <span class="value">NGN {{ formatCurrency(prescription.subtotal) }}</span>
              </div>
              <div class="payment-item" v-if="prescription.delivery_fee">
                <span class="label">Delivery Fee</span>
                <span class="value">NGN {{ formatCurrency(prescription.delivery_fee) }}</span>
              </div>
              <div class="payment-item total">
                <span class="label">Total Amount</span>
                <span class="value">NGN {{ formatCurrency(prescription.final_total || prescription.total_amount) }}</span>
              </div>
            </div>
            <div class="payment-status">
              <span class="label">Payment Status</span>
              <span :class="['payment-badge', `payment--${prescription.payment_status?.toLowerCase()}`]">
                {{ formatPaymentStatus(prescription.payment_status) }}
              </span>
            </div>
          </div>

          <!-- Document Card (for patient uploads) -->
          <div class="bento-card document-card" v-if="prescription.is_patient_upload && prescription.documents?.length">
            <div class="card-header">
              <v-icon name="hi-document" scale="1" />
              <h3>Prescription Document</h3>
            </div>
            <a
              :href="prescription.documents[0].url"
              target="_blank"
              class="document-link"
            >
              <div class="doc-icon">
                <v-icon name="hi-document-text" scale="1.5" />
              </div>
              <div class="doc-info">
                <span class="doc-name">{{ prescription.documents[0].original_name || 'View Prescription' }}</span>
                <span class="doc-action">Click to view</span>
              </div>
              <v-icon name="hi-external-link" scale="0.9" class="external-icon" />
            </a>
            <div class="verification-row">
              <span class="label">Verification Status</span>
              <span :class="['verification-badge', `verification--${prescription.verification_status?.toLowerCase()}`]">
                {{ formatStatus(prescription.verification_status) }}
              </span>
            </div>
            <p class="doc-hint" v-if="!['REJECTED', 'TIER1_FAILED', 'TIER2_FAILED', 'FAILED'].includes(prescription.verification_status?.toUpperCase())">
              This prescription can be used when ordering medications.
            </p>
            <div class="doc-hint doc-hint--rejected" v-else>
              <p v-if="prescription.patient_summary">{{ prescription.patient_summary }}</p>
              <p v-else>This prescription was rejected. Please upload a valid prescription.</p>
            </div>
          </div>

          <!-- Clarification Card -->
          <div class="bento-card clarification-card full-width" v-if="prescription.is_patient_upload && needsClarification">
            <div class="card-header warning">
              <v-icon name="hi-chat-alt-2" scale="1" />
              <h3>Additional Information Required</h3>
            </div>
            <div class="clarification-content">
              <p class="clarification-message">{{ prescription.clarification?.request_message }}</p>
              <ul v-if="prescription.clarification?.required_information?.length" class="clarification-items">
                <li v-for="item in prescription.clarification.required_information" :key="item">{{ item }}</li>
              </ul>
              <div class="clarification-deadline" v-if="prescription.clarification?.response_deadline">
                <span class="label">Response needed by:</span>
                <span :class="['deadline-value', { urgent: isClarificationUrgent }]">
                  {{ formatDateTime(prescription.clarification.response_deadline) }}
                </span>
              </div>
            </div>
            <div class="clarification-form" v-if="!prescription.clarification?.responded_at">
              <h4>Your Response</h4>
              <textarea
                v-model="clarificationResponse"
                placeholder="Type your response here..."
                rows="4"
              ></textarea>
              <label class="file-upload-label">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  @change="handleClarificationFile"
                  ref="clarificationFileInput"
                />
                <v-icon name="hi-upload" scale="0.9" />
                <span>{{ clarificationFile ? clarificationFile.name : 'Upload Document (Optional)' }}</span>
              </label>
              <button
                class="btn-primary"
                @click="submitClarification"
                :disabled="clarificationLoading || (!clarificationResponse && !clarificationFile)"
              >
                <v-icon v-if="clarificationLoading" name="hi-refresh" scale="0.9" class="spin" />
                <v-icon v-else name="hi-paper-airplane" scale="0.9" />
                {{ clarificationLoading ? 'Submitting...' : 'Submit Response' }}
              </button>
            </div>
            <div class="clarification-submitted" v-else>
              <div class="submitted-badge">
                <v-icon name="hi-check-circle" scale="1" />
                <span>Response Submitted</span>
              </div>
              <p>{{ prescription.clarification.response_message }}</p>
              <span class="submitted-date">Submitted on {{ formatDateTime(prescription.clarification.responded_at) }}</span>
            </div>
          </div>

          <!-- Under Review Card -->
          <div class="bento-card review-card" v-if="prescription.is_patient_upload && isClarificationUnderReview">
            <div class="card-header info">
              <v-icon name="hi-clock" scale="1" />
              <h3>Under Review</h3>
            </div>
            <p>Our pharmacist is reviewing your response and will update your prescription status shortly.</p>
          </div>

          <!-- Approved Prescription Card -->
          <div class="bento-card approved-card full-width" v-if="prescription.is_patient_upload && isPrescriptionApproved">
            <div class="card-header success">
              <v-icon name="hi-check-circle" scale="1" />
              <h3>Prescription Approved</h3>
            </div>
            <template v-if="isPrescriptionPaid">
              <p class="approved-message">
                {{ isUsedInOrder ? 'This prescription has been used to place an order.' : 'This prescription has been paid and is being processed.' }}
              </p>
              <div v-if="prescription.used_in_orders?.length" class="linked-orders">
                <div v-for="(order, idx) in prescription.used_in_orders" :key="idx" class="order-item">
                  <span class="order-label">Order:</span>
                  <router-link :to="`/app/patient/pharmacy/orders/${order.order_id || order}`" class="order-link">
                    {{ order.order_number || `Order #${idx + 1}` }}
                  </router-link>
                </div>
              </div>
            </template>
            <template v-else>
              <p class="approved-message">Your prescription has been approved. You can now order the medications.</p>
              <div class="verified-medications" v-if="prescription.verified_medications?.length">
                <h4>Approved Medications</h4>
                <div class="verified-list">
                  <div v-for="(med, index) in prescription.verified_medications" :key="index" class="verified-item">
                    <span class="med-name">{{ med.matched_drug_name || med.prescription_medication_name }}</span>
                    <span v-if="med.matched_drug_id" class="matched-badge">
                      <v-icon name="hi-check" scale="0.7" /> Matched
                    </span>
                  </div>
                </div>
              </div>
              <button
                class="btn-primary btn-lg"
                @click="addMedicationsToCart"
                :disabled="addingToCart || !hasMatchedMedications"
              >
                <v-icon v-if="addingToCart" name="hi-refresh" scale="0.9" class="spin" />
                <v-icon v-else name="hi-shopping-cart" scale="0.9" />
                {{ addingToCart ? 'Adding...' : 'Add to Cart' }}
              </button>
            </template>
          </div>

          <!-- Action Card (Self-Service) -->
          <div v-if="isSelfServicePrescription && (isPendingAcceptance || isPendingPayment)" class="bento-card action-card full-width">
            <template v-if="isPendingAcceptance">
              <div class="card-header">
                <v-icon name="hi-hand" scale="1" />
                <h3>Your Response Required</h3>
              </div>
              <p>Review the prescription and choose to accept or decline</p>
              <label v-if="medicationsList?.length > 1" class="partial-toggle">
                <input type="checkbox" v-model="showPartialSelection" />
                <span>Select specific items to accept</span>
              </label>
              <div class="action-buttons">
                <button class="btn-success" @click="handleAccept" :disabled="actionLoading">
                  <v-icon name="hi-check" scale="0.9" />
                  {{ showPartialSelection && selectedItems.length > 0 ? `Accept ${selectedItems.length} Item(s)` : 'Accept All' }}
                </button>
                <button class="btn-danger-outline" @click="showDeclineModal = true" :disabled="actionLoading">
                  <v-icon name="hi-x" scale="0.9" />
                  Decline
                </button>
              </div>
            </template>
            <template v-else-if="isPendingPayment">
              <div class="card-header">
                <v-icon name="hi-credit-card" scale="1" />
                <h3>Payment Required</h3>
              </div>
              <p>Complete payment to finalize your prescription</p>
              <div class="wallet-balance" v-if="walletBalance !== null">
                <span class="label">Wallet Balance:</span>
                <span :class="['balance', { sufficient: walletBalance >= (prescription.final_total || prescription.total_amount) }]">
                  NGN {{ formatCurrency(walletBalance) }}
                </span>
              </div>
              <div class="action-buttons">
                <button
                  class="btn-primary"
                  @click="payWithWallet"
                  :disabled="actionLoading || walletBalance < (prescription.final_total || prescription.total_amount)"
                >
                  <v-icon name="hi-cash" scale="0.9" />
                  Pay with Wallet
                </button>
                <button class="btn-outline" @click="payWithCard" :disabled="actionLoading">
                  <v-icon name="hi-credit-card" scale="0.9" />
                  Pay with Card
                </button>
              </div>
            </template>
          </div>

          <!-- Delivery Card -->
          <div class="bento-card delivery-card" v-if="prescription.delivery_address && !prescription.is_pickup_order">
            <div class="card-header">
              <v-icon name="hi-truck" scale="1" />
              <h3>Delivery Information</h3>
            </div>
            <div class="delivery-details">
              <div class="detail-item" v-if="prescription.delivery_address.recipient_name">
                <span class="label">Recipient</span>
                <span class="value">{{ prescription.delivery_address.recipient_name }}</span>
              </div>
              <div class="detail-item" v-if="prescription.delivery_address.phone">
                <span class="label">Phone</span>
                <span class="value">{{ prescription.delivery_address.phone }}</span>
              </div>
              <div class="detail-item full">
                <span class="label">Address</span>
                <span class="value">{{ formatDeliveryAddress(prescription.delivery_address) }}</span>
              </div>
            </div>
          </div>

          <!-- Pickup Card -->
          <div class="bento-card pickup-card" v-if="prescription.is_pickup_order">
            <div class="card-header">
              <v-icon name="hi-location-marker" scale="1" />
              <h3>Pickup Information</h3>
            </div>
            <div v-if="prescription.pickup_pharmacy_id || selectedPickupCenter" class="pickup-details">
              <div class="pickup-center">
                <h4>{{ pickupCenterName }}</h4>
                <p v-if="pickupCenterAddress"><v-icon name="hi-location-marker" scale="0.8" /> {{ pickupCenterAddress }}</p>
                <p v-if="pickupCenterPhone"><v-icon name="hi-phone" scale="0.8" /> {{ pickupCenterPhone }}</p>
              </div>
              <div v-if="prescription.pickup_code" class="pickup-code-box">
                <span class="code-label">Pickup Code</span>
                <span class="code-value">{{ prescription.pickup_code }}</span>
                <span class="code-hint">Show this code when collecting</span>
              </div>
              <div :class="['pickup-status', pickupStatusClass]">
                <v-icon :name="pickupStatusIcon" scale="0.9" />
                <span>{{ pickupStatusText }}</span>
              </div>
              <button v-if="canChangePickupCenter" class="btn-link" @click="showPickupModal = true">
                <v-icon name="hi-pencil" scale="0.8" /> Change Pickup Center
              </button>
            </div>
            <div v-else class="select-pickup">
              <p>Select a pickup center to collect your order</p>
              <button class="btn-primary" @click="showPickupModal = true">
                <v-icon name="hi-location-marker" scale="0.9" />
                Choose Pickup Center
              </button>
            </div>
          </div>

          <!-- Order Status Timeline -->
          <div class="bento-card timeline-card" v-if="!prescription.is_patient_upload || prescription.has_original_prescription">
            <div class="card-header">
              <v-icon name="hi-clipboard-list" scale="1" />
              <h3>Order Status</h3>
            </div>
            <div class="timeline">
              <div
                v-for="event in statusTimeline"
                :key="event.status"
                :class="['timeline-item', { completed: event.completed, current: event.current }]"
              >
                <div class="timeline-marker">
                  <v-icon v-if="event.completed" name="hi-check" scale="0.6" />
                </div>
                <div class="timeline-content">
                  <p class="event-label">{{ event.label }}</p>
                  <p class="event-date" v-if="event.date">{{ formatDateTime(event.date) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Rating Card -->
          <div class="bento-card rating-card" v-if="canRate || prescription.rating">
            <div class="card-header">
              <v-icon name="hi-star" scale="1" />
              <h3>{{ prescription.rating ? 'Your Rating' : 'Rate Your Experience' }}</h3>
            </div>
            <div v-if="prescription.rating" class="rating-display">
              <div class="stars">
                <span v-for="star in 5" :key="star" :class="{ filled: star <= prescription.rating }">
                  {{ star <= prescription.rating ? '★' : '☆' }}
                </span>
              </div>
              <span class="rating-value">{{ prescription.rating }}/5</span>
              <p v-if="prescription.review" class="review-text">"{{ prescription.review }}"</p>
            </div>
            <div v-else class="rating-form">
              <p>How was your experience with the pharmacy service?</p>
              <div class="star-rating">
                <button
                  v-for="star in 5"
                  :key="star"
                  :class="['star-btn', { active: star <= selectedRating, hover: star <= hoverRating }]"
                  @mouseenter="hoverRating = star"
                  @mouseleave="hoverRating = 0"
                  @click="selectedRating = star"
                >
                  {{ star <= (hoverRating || selectedRating) ? '★' : '☆' }}
                </button>
              </div>
              <textarea
                v-model="reviewText"
                placeholder="Share your experience (optional)..."
                maxlength="500"
                rows="3"
              ></textarea>
              <button class="btn-primary" @click="submitRating" :disabled="!selectedRating || ratingLoading">
                {{ ratingLoading ? 'Submitting...' : 'Submit Rating' }}
              </button>
            </div>
          </div>

          <!-- Notes Card -->
          <div class="bento-card notes-card" v-if="prescription.clinical_notes || prescription.patient_notes">
            <div class="card-header">
              <v-icon name="hi-annotation" scale="1" />
              <h3>Notes</h3>
            </div>
            <div v-if="prescription.clinical_notes" class="note-section">
              <span class="note-label">Clinical Notes</span>
              <p>{{ prescription.clinical_notes }}</p>
            </div>
            <div v-if="prescription.patient_notes" class="note-section">
              <span class="note-label">Patient Notes</span>
              <p>{{ prescription.patient_notes }}</p>
            </div>
          </div>

          <!-- Details Card -->
          <div class="bento-card details-card">
            <div class="card-header">
              <v-icon name="hi-information-circle" scale="1" />
              <h3>Details</h3>
            </div>
            <div class="details-grid">
              <div class="detail-item">
                <span class="label">Prescription Date</span>
                <span class="value">{{ formatDateTime(prescription.created_at) }}</span>
              </div>
              <div class="detail-item" v-if="prescription.updated_at">
                <span class="label">Last Updated</span>
                <span class="value">{{ formatDateTime(prescription.updated_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Bottom Action Bar -->
    <div v-if="prescription && isSelfServicePrescription && (isPendingAcceptance || isPendingPayment)" class="mobile-action-bar">
      <template v-if="isPendingAcceptance">
        <button class="btn-success" @click="handleAccept" :disabled="actionLoading">
          <v-icon name="hi-check" scale="0.9" />
          Accept
        </button>
        <button class="btn-danger-outline" @click="showDeclineModal = true" :disabled="actionLoading">
          <v-icon name="hi-x" scale="0.9" />
          Decline
        </button>
      </template>
      <template v-else-if="isPendingPayment">
        <button class="btn-primary" @click="payWithWallet" :disabled="actionLoading">
          Pay Now
        </button>
      </template>
    </div>

    <!-- Decline Modal -->
    <div v-if="showDeclineModal" class="modal-overlay" @click.self="showDeclineModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Decline Prescription</h3>
          <button class="close-btn" @click="showDeclineModal = false">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>
        <div class="modal-body">
          <p>Please provide a reason for declining this prescription:</p>
          <textarea
            v-model="declineReason"
            placeholder="Enter reason for declining..."
            rows="4"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="showDeclineModal = false">Cancel</button>
          <button class="btn-danger" @click="handleDecline" :disabled="!declineReason.trim() || actionLoading">
            {{ actionLoading ? 'Processing...' : 'Confirm Decline' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Payment Confirmation Modal -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
      <div class="modal-content payment-confirm-modal">
        <div class="modal-header">
          <h3>Confirm Payment</h3>
          <button class="close-btn" @click="showPaymentModal = false">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>
        <div class="modal-body">
          <div class="payment-summary">
            <div class="payment-icon" :class="paymentMethod">
              <v-icon :name="paymentMethod === 'wallet' ? 'bi-wallet2' : 'hi-credit-card'" scale="1.5" />
            </div>
            <h4>{{ paymentMethod === 'wallet' ? 'Pay with Wallet' : 'Pay with Card' }}</h4>

            <div class="amount-section">
              <span class="amount-label">Amount to Pay</span>
              <span class="amount-value">NGN {{ formatCurrency(prescription.final_total || prescription.total_amount) }}</span>
            </div>

            <div v-if="paymentMethod === 'wallet'" class="wallet-section">
              <div class="balance-row">
                <span class="balance-label">Your Wallet Balance</span>
                <span class="balance-value" :class="{ sufficient: walletBalance >= (prescription.final_total || prescription.total_amount), insufficient: walletBalance < (prescription.final_total || prescription.total_amount) }">
                  NGN {{ formatCurrency(walletBalance) }}
                </span>
              </div>
              <div class="balance-row after">
                <span class="balance-label">Balance After Payment</span>
                <span class="balance-value">
                  NGN {{ formatCurrency(walletBalance - (prescription.final_total || prescription.total_amount)) }}
                </span>
              </div>
            </div>

            <div v-else class="card-section">
              <p class="card-info">
                <v-icon name="hi-shield-check" scale="0.9" />
                You'll be redirected to Paystack for secure payment
              </p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="showPaymentModal = false">Cancel</button>
          <button
            :class="paymentMethod === 'wallet' ? 'btn-primary' : 'btn-success'"
            @click="confirmPayment"
            :disabled="actionLoading || (paymentMethod === 'wallet' && walletBalance < (prescription.final_total || prescription.total_amount))"
          >
            <v-icon v-if="actionLoading" name="hi-refresh" scale="0.9" class="spinning" />
            {{ actionLoading ? 'Processing...' : 'Confirm Payment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Pickup Center Modal -->
    <div v-if="showPickupModal" class="modal-overlay" @click.self="showPickupModal = false">
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3>Select Pickup Center</h3>
          <button class="close-btn" @click="showPickupModal = false">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>
        <div class="modal-body">
          <div class="pickup-search">
            <div class="search-input">
              <v-icon name="hi-search" scale="0.9" />
              <input
                type="text"
                v-model="pickupSearchQuery"
                placeholder="Search by city or state..."
                @input="searchPickupCenters"
              />
            </div>
            <button class="btn-outline btn-sm" @click="useCurrentLocation">
              <v-icon name="hi-location-marker" scale="0.8" />
              Use My Location
            </button>
          </div>
          <div v-if="pickupCentersLoading" class="pickup-loading">
            <Loader :useOverlay="false" />
            <p>Finding pickup centers...</p>
          </div>
          <div v-else-if="pickupCenters.length" class="pickup-list">
            <div
              v-for="center in pickupCenters"
              :key="center._id"
              :class="['pickup-item', { selected: selectedPickupCenterId === center._id }]"
              @click="selectPickupCenter(center)"
            >
              <input type="radio" :value="center._id" v-model="selectedPickupCenterId" />
              <div class="center-info">
                <h4>{{ center.name }}</h4>
                <p>{{ formatPickupAddress(center.address) }}</p>
                <div class="center-meta">
                  <span v-if="center.distance"><v-icon name="hi-location-marker" scale="0.7" /> {{ formatDistance(center.distance) }}</span>
                  <span v-if="center.pickup_center_settings?.handling_fee">Fee: NGN {{ formatCurrency(center.pickup_center_settings.handling_fee) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="pickup-empty">
            <v-icon name="hi-location-marker" scale="2" />
            <p>No pickup centers found</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="showPickupModal = false">Cancel</button>
          <button class="btn-primary" @click="confirmPickupCenter" :disabled="!selectedPickupCenterId || pickupSelecting">
            {{ pickupSelecting ? 'Selecting...' : 'Confirm Selection' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loader from "@/components/Loader/main-loader.vue";
import apiFactory from "@/services/apiFactory";
import moment from "moment";

export default {
  name: "PatientPrescriptionDetails",
  components: {
    Loader,
  },
  emits: ["openSideNav"],
  data() {
    return {
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
      // Payment confirmation modal
      showPaymentModal: false,
      paymentMethod: null, // 'wallet' or 'card'
    };
  },
  computed: {
    prescriptionId() {
      return this.$route.params.id;
    },
    doctorName() {
      // Check specialist object first
      if (this.prescription?.specialist?.full_name) {
        return this.prescription.specialist.full_name.replace(/^Dr\.?\s*/i, '');
      }
      const profile = this.prescription?.prescribed_by?.profile;
      if (!profile) return 'Unknown';
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
    },
    doctorPhoto() {
      // Check specialist profile_image first
      if (this.prescription?.specialist?.profile_image) {
        return this.prescription.specialist.profile_image;
      }
      // Check prescribed_by profile photo
      if (this.prescription?.prescribed_by?.profile?.profile_photo) {
        return this.prescription.prescribed_by.profile.profile_photo;
      }
      if (this.prescription?.prescribed_by?.profile?.profile_image) {
        return this.prescription.prescribed_by.profile.profile_image;
      }
      return null;
    },
    doctorSpecialty() {
      // Check specialist specialties array
      if (this.prescription?.specialist?.specialties?.length) {
        return this.prescription.specialist.specialties[0];
      }
      // Check prescribed_by professional practice
      if (this.prescription?.prescribed_by?.profile?.professional_practice?.area_of_specialty) {
        return this.prescription.prescribed_by.profile.professional_practice.area_of_specialty;
      }
      return 'General Practice';
    },
    hasLinkedAppointments() {
      return (this.prescription?.linked_appointments?.length > 0) ||
             (this.prescription?.related_appointments?.length > 0) ||
             (this.prescription?.appointment_id);
    },
    allLinkedAppointments() {
      const appointments = [];
      if (this.prescription?.linked_appointments?.length) {
        appointments.push(...this.prescription.linked_appointments);
      }
      if (this.prescription?.related_appointments?.length) {
        appointments.push(...this.prescription.related_appointments);
      }
      if (this.prescription?.appointment_id && typeof this.prescription.appointment_id === 'object') {
        appointments.push(this.prescription.appointment_id);
      }
      return appointments;
    },
    paymentMethodIcon() {
      const method = this.prescription?.payment_method?.toLowerCase();
      if (method === 'patient_wallet' || method === 'wallet') return 'bi-wallet2';
      if (method === 'card') return 'hi-credit-card';
      if (method === 'bank_transfer') return 'hi-office-building';
      return 'hi-credit-card';
    },
    getSourceDescription() {
      if (this.prescription?.type === 'INTERNAL' || this.prescription?.prescription_source === 'specialist') {
        return `Prescribed by Dr. ${this.doctorName} • ${this.doctorSpecialty}`;
      }
      if (this.prescription?.type === 'EXTERNAL') {
        return 'Uploaded prescription document';
      }
      return 'Prescription details';
    },
    statusValueClass() {
      const status = this.prescription?.status?.toLowerCase();
      if (['paid', 'delivered', 'completed'].includes(status)) return 'hero-stat__value--success';
      if (['pending', 'pending_payment', 'pending_acceptance'].includes(status)) return 'hero-stat__value--warning';
      if (['cancelled', 'rejected', 'expired'].includes(status)) return 'hero-stat__value--error';
      return '';
    },
    statusClass() {
      if (this.isUsedInOrder) return 'used_in_order';
      return this.prescription?.status?.toLowerCase().replace(/\s+/g, '_') || 'pending';
    },
    isSelfServicePrescription() {
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
      if (this.isPendingAcceptance) return 'alert--warning';
      if (this.isPendingPayment) return 'alert--info';
      if (this.prescription?.patient_response === 'declined') return 'alert--danger';
      if (this.prescription?.status === 'paid') return 'alert--success';
      return 'alert--info';
    },
    alertIconName() {
      if (this.isPendingAcceptance) return 'hi-clock';
      if (this.isPendingPayment) return 'hi-credit-card';
      if (this.prescription?.patient_response === 'declined') return 'hi-x-circle';
      if (this.prescription?.status === 'paid') return 'hi-check-circle';
      return 'hi-information-circle';
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
      const changeableStatuses = ['draft', 'pending_acceptance', 'accepted', 'pending_payment'];
      return changeableStatuses.includes(this.prescription?.status?.toLowerCase());
    },
    pickupStatusClass() {
      if (this.prescription?.ready_for_pickup_at) return 'ready';
      if (this.prescription?.status === 'shipped') return 'transit';
      return 'preparing';
    },
    pickupStatusIcon() {
      if (this.prescription?.ready_for_pickup_at) return 'hi-check-circle';
      if (this.prescription?.status === 'shipped') return 'hi-truck';
      return 'hi-cube';
    },
    pickupStatusText() {
      if (this.prescription?.ready_for_pickup_at) return 'Ready for Pickup';
      if (this.prescription?.status === 'shipped') return 'In Transit to Pickup Center';
      return 'Preparing for Pickup';
    },
    needsClarification() {
      return this.prescription?.verification_status?.toUpperCase() === 'CLARIFICATION_NEEDED';
    },
    isClarificationUnderReview() {
      return this.prescription?.verification_status?.toUpperCase() === 'CLARIFICATION_RECEIVED';
    },
    isClarificationUrgent() {
      if (!this.prescription?.clarification?.response_deadline) return false;
      const deadline = new Date(this.prescription.clarification.response_deadline);
      const now = new Date();
      return (deadline - now) / (1000 * 60 * 60) < 24;
    },
    isPrescriptionApproved() {
      return this.prescription?.verification_status?.toUpperCase() === 'APPROVED';
    },
    hasMatchedMedications() {
      return (this.prescription?.verified_medications || []).some(med => med.matched_drug_id);
    },
    isPrescriptionPaid() {
      const paymentStatus = this.prescription?.payment_status?.toLowerCase();
      const status = this.prescription?.status?.toLowerCase();
      const hasUsedInOrders = this.prescription?.used_in_orders?.length > 0;
      return hasUsedInOrders || paymentStatus === 'paid' || paymentStatus === 'used_in_order' || ['paid', 'processing', 'dispensed', 'shipped', 'delivered', 'completed', 'used_in_order'].includes(status);
    },
    isUsedInOrder() {
      return this.prescription?.used_in_orders?.length > 0;
    },
    displayStatus() {
      if (this.isUsedInOrder) return 'Used in Order';
      return this.formatStatus(this.prescription?.status);
    },
    medicationsList() {
      if (this.prescription?.is_patient_upload && this.prescription?.verified_medications?.length > 0) {
        const ocrMedications = this.prescription?.ocr_data?.medications || [];
        return this.prescription.verified_medications.map((med, index) => {
          const ocrMed = ocrMedications.find(
            ocr => ocr.name?.toLowerCase() === med.prescription_medication_name?.toLowerCase()
          ) || ocrMedications[index] || {};
          const isInternal = med.matched_to_original || this.prescription?.is_internal_prescription;
          return {
            drug: med.matched_drug_name || med.prescription_medication_name,
            drug_name: med.matched_drug_name || med.prescription_medication_name,
            generic_name: med.matched_generic_name,
            manufacturer: med.manufacturer,
            strength: med.strength,
            dosage_form: med.dosage_form,
            quantity: med.quantity || ocrMed.quantity || 1,
            unit_price: med.unit_price || med.selling_price,
            total_price: med.total_price || med.selling_price,
            instructions: med.instructions || ocrMed.instructions,
            notes: null,
            dose: med.dose || { dosage_form: med.dosage || ocrMed.dosage, quantity: med.quantity || ocrMed.quantity },
            interval: med.interval || (isInternal ? null : this.parseFrequency(ocrMed.frequency || ocrMed.dosage)),
            period: med.period || (isInternal ? null : this.parseDuration(ocrMed.duration || ocrMed.instructions)),
            matched_drug_id: med.matched_drug_id,
            drug_image: med.drug_image,
            _id: med._id,
          };
        });
      }
      // Transform specialist prescription items to match expected format
      const items = this.prescription?.items || [];
      return items.map((item) => ({
        ...item,
        drug: item.drug || item.drug_name,
        drug_name: item.drug_name || item.drug,
        strength: item.strength || item.drug_strength,
        manufacturer: item.manufacturer,
        route: item.route,
        interval: item.interval || this.parseSpecialistFrequency(item.frequency),
        period: item.period || this.parseSpecialistDuration(item.duration),
        dose: item.dose || { quantity: item.quantity, dosage_form: item.dosage_form || item.dosage || 'tablet' },
        notes: item.notes || item.instructions,
      }));
    },
  },
  async mounted() {
    // Check for payment callback from Paystack
    // Paystack appends ?trxref=xxx&reference=xxx to callback URL
    const paymentStatus = this.$route.query.payment;
    const paymentReference = this.$route.query.reference || this.$route.query.trxref;

    if ((paymentStatus === 'success' || this.$route.query.trxref) && paymentReference) {
      // verifyPaymentCallback will call fetchPrescription after verification
      await this.verifyPaymentCallback(paymentReference);
    } else {
      await this.fetchPrescription();
    }
    if (this.isSelfServicePrescription && this.isPendingPayment) {
      await this.fetchWalletBalance();
    }
    if (this.isPendingAcceptance && this.prescription?.acceptance_expires_at) {
      this.startCountdown();
    }
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
            let originalPrescription = null;
            const rxNumber = uploadData?.prescription_number || uploadData?.digital_signature?.reference_number;
            if (rxNumber && rxNumber.startsWith('RX-')) {
              try {
                const verifyResponse = await apiFactory.$_verifyPrescriptionByNumber(rxNumber);
                originalPrescription = verifyResponse.data?.data?.prescription;
              } catch (e) { /* continue */ }
            }
            return { uploadData, originalPrescription };
          },
          process: (response) => {
            const { uploadData: data, originalPrescription } = response;
            if (data && Object.keys(data).length > 0) {
              let medications;
              if (originalPrescription?.items?.length > 0) {
                medications = originalPrescription.items.map((item, idx) => ({
                  _id: item._id || `item-${idx}`,
                  drug: item.drug_name,
                  drug_name: item.drug_name,
                  generic_name: item.generic_name || '',
                  strength: item.strength || '',
                  manufacturer: item.manufacturer || '',
                  dose: { quantity: item.quantity, dosage_form: item.dosage || '' },
                  interval: item.frequency ? { time: item.frequency.split('x')[0], unit: 'daily' } : null,
                  period: item.duration ? { number: parseInt(item.duration), unit: item.duration.replace(/\d+\s*/, '') } : null,
                  quantity: item.quantity,
                  notes: item.instructions || '',
                  instructions: item.instructions || '',
                  unit_price: item.unit_price || 0,
                  total_price: item.total_price || 0,
                }));
              } else {
                const isValidMedName = (name) => {
                  if (!name) return false;
                  const invalidPatterns = [/number of days/i, /ensure dose is stated/i, /N\.?B\.?\s/i, /treatment/i, /pharmacy stamp/i, /please don't/i];
                  if (name.length > 50) return false;
                  return !invalidPatterns.some(pattern => pattern.test(name));
                };
                medications = (data.ocr_data?.medications || []).map((med, idx) => {
                  const verified = data.verified_medications?.[idx] || {};
                  let drugName = med.name || verified.matched_drug_name || verified.prescription_medication_name;
                  if (!isValidMedName(drugName)) {
                    drugName = verified.matched_drug_name || 'Medication (see prescription document)';
                  }
                  return {
                    _id: med._id || verified._id,
                    drug: drugName,
                    drug_name: drugName,
                    generic_name: verified.matched_generic_name || '',
                    dose: { quantity: parseInt(med.quantity) || 1, dosage_form: med.dosage || '' },
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
                  const fullName = originalPrescription.prescriber.full_name.replace(/^Dr\.?\s*/i, '').trim();
                  const nameParts = fullName.split(' ');
                  return { profile: { first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '', professional_practice: { area_of_specialty: originalPrescription.prescriber.specialization || 'General Practice' } } };
                })() : data.ocr_data?.doctor_name ? (() => {
                  const fullName = data.ocr_data.doctor_name.replace(/^Dr\.?\s*/i, '').trim();
                  const nameParts = fullName.split(' ');
                  return { profile: { first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '', professional_practice: { area_of_specialty: data.ocr_data.clinic_name || 'External Prescription' } } };
                })() : null,
                items: medications,
                documents: [{ url: data.presignedUrl || data.s3_url, file_type: data.mimetype, original_name: data.original_filename }],
                pdf_url: originalPrescription?.pdf_url,
                created_at: data.created_at,
                used_in_orders: data.used_in_orders || [],
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
            if (data && Object.keys(data).length > 0) return data;
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
        } catch (err) { /* continue */ }
      }

      this.error = "Prescription not found";
      this.loading = false;
    },
    async fetchWalletBalance() {
      try {
        const response = await apiFactory.$_getPatientSelfWalletBalance();
        this.walletBalance = response.data?.data?.balance || 0;
      } catch (err) {
        this.walletBalance = 0;
      }
    },
    async downloadPdf() {
      try {
        const response = await apiFactory.$_getPrescriptionPdf(this.prescriptionId);
        const url = response.data?.data?.url || this.prescription.pdf_url;
        if (url) window.open(url, '_blank');
      } catch (err) {
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
        this.$toast?.error(err?.response?.data?.message || 'Failed to accept prescription');
      } finally {
        this.actionLoading = false;
      }
    },
    async handleDecline() {
      if (!this.declineReason.trim()) return;
      this.actionLoading = true;
      try {
        await apiFactory.$_declinePrescription(this.prescriptionId, { reason: this.declineReason });
        this.$toast?.success('Prescription declined');
        this.showDeclineModal = false;
        await this.fetchPrescription();
      } catch (err) {
        this.$toast?.error(err?.response?.data?.message || 'Failed to decline prescription');
      } finally {
        this.actionLoading = false;
      }
    },
    payWithWallet() {
      this.paymentMethod = 'wallet';
      this.showPaymentModal = true;
    },
    payWithCard() {
      this.paymentMethod = 'card';
      this.showPaymentModal = true;
    },
    async confirmPayment() {
      if (this.paymentMethod === 'wallet') {
        await this.processWalletPayment();
      } else {
        await this.processCardPayment();
      }
    },
    async processWalletPayment() {
      this.actionLoading = true;
      try {
        await apiFactory.$_payPrescriptionWithPatientWallet(this.prescriptionId);
        this.$toast?.success('Payment completed successfully');
        this.showPaymentModal = false;
        await this.fetchPrescription();
        await this.fetchWalletBalance();
      } catch (err) {
        this.$toast?.error(err?.response?.data?.message || 'Failed to process payment');
      } finally {
        this.actionLoading = false;
      }
    },
    async processCardPayment() {
      this.actionLoading = true;
      try {
        const response = await apiFactory.$_initiatePrescriptionCardPayment(this.prescriptionId);
        const authUrl = response.data?.data?.authorization_url;
        if (authUrl) {
          localStorage.setItem('pending_prescription_payment', this.prescriptionId);
          window.location.href = authUrl;
        } else {
          throw new Error('No authorization URL received');
        }
      } catch (err) {
        this.$toast?.error(err?.response?.data?.message || 'Failed to initiate payment');
        this.actionLoading = false;
      }
    },
    async verifyPaymentCallback(reference, retryCount = 0) {
      this.loading = true;
      try {
        const response = await apiFactory.$_verifyPrescriptionCardPayment(this.prescriptionId, reference);
        const result = response.data?.data || response.data?.result;

        // Check payment_status like appointments do - 'PAID' means success
        const isPaid = result?.payment_status === 'PAID' ||
                       result?.payment_status === 'paid' ||
                       result?.success === true;

        // Increase retries to 6 with 3 second delay (total 18 seconds) to handle Paystack race condition
        if (!isPaid && result?.status === 'pending' && retryCount < 6) {
          // Payment still processing, wait and retry
          const retryDelay = retryCount === 0 ? 3000 : 3000; // 3 second delays
          this.$toast?.info(`Verifying payment... (attempt ${retryCount + 1}/6)`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.verifyPaymentCallback(reference, retryCount + 1);
        }

        // Clear the query params
        this.$router.replace({ path: this.$route.path });
        localStorage.removeItem('pending_prescription_payment');

        if (isPaid) {
          this.$toast?.success('Payment verified successfully!');
          // Use the returned prescription directly to update UI immediately
          if (result?.prescription) {
            this.prescription = result.prescription;
          } else {
            // Fallback to fetching
            await this.fetchPrescription();
          }
        } else {
          // Payment might be processed by webhook or delayed - fetch to get latest status
          this.$toast?.info('Checking payment status...');
          await this.fetchPrescription();
          // Check if prescription is now paid (webhook may have updated it)
          if (this.prescription?.payment_status === 'PAID' || this.prescription?.payment_status === 'paid') {
            this.$toast?.success('Payment confirmed!');
          }
        }
      } catch (err) {
        // On error, still refresh to check if webhook processed it
        this.$toast?.error(err?.response?.data?.message || 'Verifying payment...');
        this.$router.replace({ path: this.$route.path });
        // Refresh prescription data anyway
        await this.fetchPrescription();
      } finally {
        this.loading = false;
      }
    },
    startCountdown() {
      this.updateCountdown();
      this.countdownInterval = setInterval(() => this.updateCountdown(), 60000);
    },
    updateCountdown() {
      const expiresAt = new Date(this.prescription.acceptance_expires_at);
      const now = new Date();
      const diff = expiresAt - now;
      if (diff <= 0) {
        this.timeRemaining = 'Expired';
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      this.timeRemaining = `${hours}h ${minutes}m remaining`;
    },
    getStatusDate(status) {
      const entry = (this.prescription?.status_history || []).find(h => h.status === status);
      return entry?.changed_at;
    },
    getInitials(name) {
      if (!name || name === 'Unknown') return "?";
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    },
    formatCurrency(amount) {
      if (!amount) return "0.00";
      return Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    formatDate(date) {
      if (!date) return "";
      return moment(date).format("MMM D, YYYY");
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
      const statuses = { pending: "Pending", processing: "Processing", completed: "Paid", paid: "Paid", failed: "Failed", refunded: "Refunded" };
      return statuses[status?.toLowerCase()] || status || "N/A";
    },
    formatPaymentMethod(method) {
      const methods = {
        patient_wallet: "Wallet",
        wallet: "Wallet",
        card: "Debit/Credit Card",
        bank_transfer: "Bank Transfer",
        paystack: "Paystack",
      };
      return methods[method?.toLowerCase()] || method || "N/A";
    },
    viewAppointment(appt) {
      const id = appt._id || appt;
      if (id) {
        this.$router.push(`/app/patient/appointmentsv2/appointment/${id}`);
      }
    },
    handleDrugImageError(event) {
      event.target.style.display = 'none';
      // Show placeholder instead
      const placeholder = event.target.nextElementSibling;
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    },
    formatDeliveryAddress(address) {
      if (!address) return "N/A";
      return [address.street, address.city, address.state, address.country, address.postal_code].filter(Boolean).join(", ") || "N/A";
    },
    parseFrequency(text) {
      if (!text) return null;
      const freqMatch = text.match(/(\d+)x?\s*(daily|per day|times?\s*(?:a\s*)?day)/i);
      if (freqMatch) return { time: parseInt(freqMatch[1]), unit: 'daily' };
      if (/twice\s*(daily|a\s*day)/i.test(text)) return { time: 2, unit: 'daily' };
      if (/once\s*(daily|a\s*day)/i.test(text)) return { time: 1, unit: 'daily' };
      return null;
    },
    parseDuration(text) {
      if (!text) return null;
      const match = text.match(/(?:duration:?\s*)?(\d+)\s*(days?|weeks?|months?)/i);
      if (match) return { number: parseInt(match[1]), unit: match[2].toLowerCase() };
      return null;
    },
    // Enhanced parsers for specialist prescriptions (handles "2x", "7", etc.)
    parseSpecialistFrequency(text) {
      if (!text) return null;
      // Handle "2x daily", "3 times daily", etc.
      const fullMatch = text.match(/(\d+)\s*x?\s*(daily|per day|times?\s*(?:a\s*)?day)/i);
      if (fullMatch) return { time: parseInt(fullMatch[1]), unit: 'daily' };
      // Handle just "2x" or "3x" (assume daily)
      const simpleMatch = text.match(/^(\d+)\s*x$/i);
      if (simpleMatch) return { time: parseInt(simpleMatch[1]), unit: 'daily' };
      // Handle "twice daily", "once daily"
      if (/twice\s*(daily|a\s*day)?/i.test(text)) return { time: 2, unit: 'daily' };
      if (/once\s*(daily|a\s*day)?/i.test(text)) return { time: 1, unit: 'daily' };
      // Handle just a number (assume times per day)
      const numMatch = text.match(/^(\d+)$/);
      if (numMatch) return { time: parseInt(numMatch[1]), unit: 'daily' };
      return null;
    },
    parseSpecialistDuration(text) {
      if (!text) return null;
      // Handle "7 days", "2 weeks", etc.
      const fullMatch = text.match(/(?:duration:?\s*)?(\d+)\s*(days?|weeks?|months?)/i);
      if (fullMatch) return { number: parseInt(fullMatch[1]), unit: fullMatch[2].toLowerCase() };
      // Handle just a number (assume days)
      const numMatch = text.match(/^(\d+)$/);
      if (numMatch) return { number: parseInt(numMatch[1]), unit: 'days' };
      return null;
    },
    mapVerificationStatus(verificationStatus) {
      const statusMap = { 'PENDING': 'pending', 'TIER1_PROCESSING': 'verifying', 'TIER1_PASSED': 'verified', 'TIER1_FAILED': 'verification_failed', 'TIER2_PROCESSING': 'verifying', 'TIER2_PASSED': 'verified', 'TIER2_FAILED': 'verification_failed', 'PHARMACIST_REVIEW': 'under_review', 'APPROVED': 'approved', 'REJECTED': 'rejected', 'EXPIRED': 'expired' };
      return statusMap[verificationStatus] || verificationStatus?.toLowerCase() || 'pending';
    },
    async submitRating() {
      if (!this.selectedRating) return;
      this.ratingLoading = true;
      try {
        await apiFactory.$_ratePrescription(this.prescriptionId, { rating: this.selectedRating, review: this.reviewText.trim() || undefined });
        this.$toast?.success('Thank you for your rating!');
        await this.fetchPrescription();
        this.selectedRating = 0;
        this.reviewText = "";
      } catch (err) {
        this.$toast?.error(err?.response?.data?.message || 'Failed to submit rating');
      } finally {
        this.ratingLoading = false;
      }
    },
    async fetchPickupCenterDetails() {
      if (!this.prescription?.pickup_pharmacy_id) return;
      try {
        const response = await apiFactory.$_getPickupCenterById(this.prescription.pickup_pharmacy_id);
        this.pickupCenterDetails = response.data?.data;
      } catch (err) { /* continue */ }
    },
    async fetchPickupCenters(params = {}) {
      this.pickupCentersLoading = true;
      try {
        const response = await apiFactory.$_getPickupCenters({ ...params, limit: 20 });
        this.pickupCenters = response.data?.data?.pickup_centers || [];
      } catch (err) {
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
      await this.fetchPickupCenters({ city: this.pickupSearchQuery, state: this.pickupSearchQuery });
    },
    async useCurrentLocation() {
      if (!navigator.geolocation) {
        this.$toast?.error('Geolocation is not supported');
        return;
      }
      this.pickupCentersLoading = true;
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await apiFactory.$_recommendPickupCenters({ latitude: position.coords.latitude, longitude: position.coords.longitude, limit: 10 });
            this.pickupCenters = response.data?.data || [];
          } catch (err) {
            this.$toast?.error('Failed to find nearby pickup centers');
          } finally {
            this.pickupCentersLoading = false;
          }
        },
        () => {
          this.$toast?.error('Unable to get your location');
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
        await apiFactory.$_setPickupCenter(this.prescriptionId, { pickup_pharmacy_id: this.selectedPickupCenterId });
        this.$toast?.success('Pickup center selected');
        this.showPickupModal = false;
        this.pickupCenterDetails = this.selectedPickupCenter;
        await this.fetchPrescription();
      } catch (err) {
        this.$toast?.error(err?.response?.data?.message || 'Failed to set pickup center');
      } finally {
        this.pickupSelecting = false;
      }
    },
    formatPickupAddress(address) {
      if (!address) return 'Address not available';
      return [address.street, address.city, address.state].filter(Boolean).join(', ') || 'Address not available';
    },
    formatDistance(distance) {
      if (!distance) return '';
      if (distance < 1) return `${Math.round(distance * 1000)}m`;
      return `${distance.toFixed(1)}km`;
    },
    handleClarificationFile(event) {
      const file = event.target.files[0];
      if (file) {
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
        if (this.clarificationFile) formData.append('document', this.clarificationFile);
        await apiFactory.$_submitClarificationResponse(this.prescriptionId, formData);
        this.$toast?.success('Your response has been submitted');
        this.clarificationResponse = '';
        this.clarificationFile = null;
        await this.fetchPrescription();
      } catch (err) {
        this.$toast?.error(err?.response?.data?.message || 'Failed to submit response');
      } finally {
        this.clarificationLoading = false;
      }
    },
    async addMedicationsToCart() {
      if (!this.isPrescriptionApproved || !this.hasMatchedMedications) {
        this.$toast?.error('This prescription cannot be added to cart');
        return;
      }
      this.addingToCart = true;
      try {
        const medications = this.prescription?.verified_medications || [];
        const result = await this.$store.dispatch('pharmacy/addPrescriptionMedicationsToCart', { prescriptionId: this.prescriptionId, medications });
        if (result.success && result.addedItems.length > 0) {
          this.$toast?.success(`Added ${result.addedItems.length} medication(s) to your cart`);
          this.$router.push('/app/patient/pharmacy/cart');
        } else if (result.addedItems.length === 0) {
          this.$toast?.warning('No medications could be added.');
        }
      } catch (err) {
        this.$toast?.error(err?.message || 'Failed to add medications to cart');
      } finally {
        this.addingToCart = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
// Design System Variables - Matching Patient.vue
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

// Legacy variables for compatibility
$gray-50: #F8FAFC;
$gray-100: #F1F5F9;
$gray-200: #E2E8F0;
$gray-300: #CBD5E1;
$success: #10B981;
$warning: #F59E0B;
$danger: #EF4444;
$info: #3B82F6;

// Mixins
@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.prescription-details-page {
  width: 100%;
  min-height: 100vh;
  background: $bg;
}

// Mobile Header - Always visible on mobile
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 16px;
  background: white;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    display: flex;
  }

  .back-btn-mobile, .menu-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $bg;
    color: $slate;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:active {
      background: #E2E8F0;
    }
  }

  .header-logo {
    img {
      height: 28px;
      width: auto;
    }
  }
}

// Page Content
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 120px;
  }
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ============================================
// HERO SECTION - Matching Prescriptions List
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  position: relative;
  overflow: visible;
  min-height: 380px;
  margin-bottom: 4px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px;
    gap: 0;
    text-align: center;
    min-height: auto;
    border-radius: 20px;
  }

  .hero__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;
  }

  .hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    width: fit-content;
    margin-bottom: 20px;
    position: relative;

    @media (max-width: 768px) {
      margin: 0 auto 12px;
      padding: 6px 14px;
    }

    .badge-pulse {
      position: absolute;
      left: 12px;
      width: 8px;
      height: 8px;
      background: $emerald;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;

      &::after {
        content: '';
        position: absolute;
        inset: -4px;
        background: rgba($emerald, 0.4);
        border-radius: 50%;
        animation: pulse-ring 2s ease-out infinite;
      }

      @media (max-width: 768px) {
        left: 10px;
        width: 6px;
        height: 6px;
      }
    }

    svg {
      width: 16px;
      height: 16px;
      color: white;
      margin-left: 12px;

      @media (max-width: 768px) {
        width: 14px;
        height: 14px;
        margin-left: 10px;
      }
    }

    span {
      font-size: 13px;
      font-weight: 600;
      color: white;
      letter-spacing: 0.3px;

      @media (max-width: 768px) {
        font-size: 12px;
      }
    }
  }

  .hero__title {
    font-size: 36px;
    font-weight: 800;
    color: white;
    line-height: 1.2;
    margin: 0 0 12px;
    letter-spacing: -0.5px;

    @media (max-width: 768px) {
      font-size: 24px;
      margin: 0 0 8px;
    }
  }

  .hero__subtitle {
    font-size: 16px;
    color: white;
    line-height: 1.6;
    margin: 0 0 24px;
    max-width: 400px;
    opacity: 0.9;

    @media (max-width: 768px) {
      font-size: 14px;
      max-width: 100%;
      margin: 0 0 16px;
      opacity: 0.85;
    }
  }

  .hero__stats {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    width: fit-content;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: space-around;
      padding: 14px 12px;
      gap: 0;
      border-radius: 12px;
    }
  }

  .hero__visual {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    @media (max-width: 768px) {
      display: none;
    }
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  width: fit-content;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.desktop-only {
  @media (max-width: 768px) {
    display: none !important;
  }
}

.hero-stat {
  text-align: center;

  &--action {
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    svg {
      color: white;
    }
  }

  &__value {
    display: block;
    font-size: 18px;
    font-weight: 700;
    color: white;
    line-height: 1;
    text-transform: capitalize;

    @media (max-width: 768px) {
      font-size: 14px;
    }

    &--warning {
      color: $amber-light;
    }

    &--info {
      color: $sky-light;
    }

    &--success {
      color: $emerald-light;
    }

    &--error {
      color: $rose-light;
    }
  }

  &__label {
    display: block;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);

    @media (max-width: 768px) {
      height: 28px;
    }
  }
}

// Orb Animation
.prescription-orb {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    width: 80%;
    height: 80%;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    width: 60%;
    height: 60%;
    animation: spin-slow 10s linear infinite;
  }
}

.orb-core {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;

  svg {
    width: 48px;
    height: 48px;
    color: white;
  }
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  &--1 {
    top: 10%;
    right: 10%;
    animation-delay: 0s;
  }

  &--2 {
    bottom: 20%;
    right: 5%;
    animation-delay: 1s;
  }

  &--3 {
    bottom: 10%;
    left: 10%;
    animation-delay: 2s;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// Status Badge
.status-badge {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.2);

  &.status--pending_acceptance { background: rgba(139, 92, 246, 0.2); }
  &.status--accepted, &.status--delivered { background: rgba($success, 0.2); }
  &.status--pending_payment { background: rgba($warning, 0.2); }
  &.status--paid, &.status--processing { background: rgba($info, 0.2); }
  &.status--cancelled, &.status--expired { background: rgba($danger, 0.2); }
  &.status--used_in_order { background: rgba($success, 0.2); }
}

// Alert Banner
.alert-banner {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 16px;

  &.alert--warning {
    background: rgba($warning, 0.1);
    border: 1px solid rgba($warning, 0.2);
    .alert-icon { color: $warning; }
  }
  &.alert--info {
    background: rgba($info, 0.1);
    border: 1px solid rgba($info, 0.2);
    .alert-icon { color: $info; }
  }
  &.alert--danger {
    background: rgba($danger, 0.1);
    border: 1px solid rgba($danger, 0.2);
    .alert-icon { color: $danger; }
  }
  &.alert--success {
    background: rgba($success, 0.1);
    border: 1px solid rgba($success, 0.2);
    .alert-icon { color: $success; }
  }

  .alert-content {
    flex: 1;

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: $navy;
      margin-bottom: 4px;
    }

    p {
      font-size: 14px;
      color: $slate;
    }

    .expiry-time {
      margin-top: 8px;
      font-size: 13px;

      .countdown {
        font-weight: 600;
        color: $warning;
      }
    }
  }
}

// Bento Grid
.bento-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: span 2;

    @media (max-width: 768px) {
      grid-column: span 1;
    }
  }
}

// Bento Card
.bento-card {
  @include glass-card;
  padding: 20px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    color: $sky-dark;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: $navy;
      flex: 1;
    }

    &.warning { color: $warning; }
    &.success { color: $success; }
    &.info { color: $info; }
  }

  .count-badge {
    background: $sky-light;
    color: $sky-dark;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
  }
}

// Doctor Card
.doctor-card {
  .doctor-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .doctor-avatar {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba($sky, 0.3);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    span {
      color: white;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .doctor-details {
    flex: 1;
  }

  .doctor-name {
    font-size: 16px;
    font-weight: 600;
    color: $navy;
    margin-bottom: 4px;
  }

  .doctor-specialty {
    font-size: 13px;
    color: $slate;
    margin-bottom: 6px;
  }

  .doctor-rating {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #F59E0B;
    font-weight: 500;

    .stars {
      font-size: 14px;
    }
  }
}

// Payment Method Card
.payment-method-card {
  .payment-method-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .payment-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .label {
      font-size: 13px;
      color: $slate;
    }

    .value {
      font-size: 14px;
      font-weight: 500;
      color: $navy;
    }
  }

  .payment-method-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: $sky-light;
    border-radius: 8px;
    color: $sky-dark;
    font-weight: 500;
  }

  .payment-status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;

    &.status--paid, &.status--completed {
      background: rgba($success, 0.1);
      color: $success;
    }
    &.status--pending {
      background: rgba($warning, 0.1);
      color: $warning;
    }
    &.status--failed {
      background: rgba($danger, 0.1);
      color: $danger;
    }
  }
}

// Linked Appointments Card
.appointments-card {
  .appointments-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .appointment-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: $gray-50;
    border-radius: 12px;
    transition: all 0.2s;

    &.clickable {
      cursor: pointer;

      &:hover {
        background: $sky-light;
        transform: translateX(4px);
      }
    }
  }

  .appt-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .appt-info {
    flex: 1;

    .appt-date {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: $navy;
    }

    .appt-type {
      font-size: 12px;
      color: $slate;
      text-transform: capitalize;
    }
  }

  .appt-arrow {
    color: $slate;
  }
}

// Clinical Notes Card
.clinical-notes-card {
  .clinical-notes-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .note-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: $gray-50;
    border-radius: 12px;
  }

  .note-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(139, 92, 246, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8B5CF6;
    flex-shrink: 0;
  }

  .note-info {
    flex: 1;

    .note-title {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: $navy;
    }

    .note-date {
      font-size: 12px;
      color: $slate;
    }
  }

  .doctor-name {
    font-size: 16px;
    font-weight: 600;
    color: $navy;
  }

  .doctor-specialty {
    font-size: 14px;
    color: $slate;
  }
}

// Medications Card
.medications-card {
  .medications-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .medication-item {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: white;
    border: 1px solid $gray-200;
    border-radius: 16px;
    transition: all 0.2s;

    @media (max-width: 640px) {
      flex-direction: column;
      padding: 16px;
    }

    &:hover {
      border-color: $sky;
      box-shadow: 0 4px 12px rgba($sky, 0.1);
    }

    &--declined {
      opacity: 0.6;
      background: rgba($danger, 0.02);
      border: 1px dashed rgba($danger, 0.3);
    }

    .item-checkbox {
      padding-top: 4px;

      input {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: $sky;
      }
    }
  }

  .med-image {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
    background: $gray-100;

    @media (max-width: 640px) {
      width: 60px;
      height: 60px;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .med-icon-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
      color: $sky-dark;
    }
  }

  .med-info {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: $navy;
      margin-bottom: 6px;
    }

    .med-details {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;

      .generic-name {
        font-size: 13px;
        color: $sky-dark;
        background: $sky-light;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .strength {
        font-size: 13px;
        color: $slate;
        background: $gray-100;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .manufacturer {
        font-size: 12px;
        color: $slate;
      }
    }

    .med-dosage {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;

      .dosage-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: $slate;
        background: $gray-100;
        padding: 4px 10px;
        border-radius: 6px;
      }
    }

    .med-instructions {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 13px;
      color: $slate;
      background: rgba($info, 0.05);
      padding: 8px 12px;
      border-radius: 8px;
      margin-top: 8px;
    }

    .declined-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      padding: 4px 10px;
      background: rgba($danger, 0.1);
      color: $danger;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
    }
  }

  .med-pricing {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
    min-width: 100px;

    @media (max-width: 640px) {
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
      padding-top: 12px;
      border-top: 1px solid $gray-200;
    }

    .qty-badge {
      font-size: 12px;
      color: $slate;
      background: $gray-100;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .price-breakdown {
      .unit-price {
        font-size: 11px;
        color: $slate;
      }
    }

    .total-price {
      font-size: 16px;
      font-weight: 700;
      color: $navy;
    }
  }

  .med-qty {
    text-align: right;
    flex-shrink: 0;

    .qty-value {
      display: block;
      font-size: 14px;
      color: $slate;
    }

    .qty-price {
      font-size: 16px;
      font-weight: 600;
      color: $navy;
    }
  }
}

// Payment Card
.payment-card {
  .payment-grid {
    display: grid;
    gap: 12px;
    margin-bottom: 16px;
  }

  .payment-item {
    display: flex;
    justify-content: space-between;

    .label {
      font-size: 14px;
      color: $slate;
    }

    .value {
      font-size: 14px;
      font-weight: 500;
      color: $navy;
    }

    &.total {
      padding-top: 12px;
      border-top: 1px solid $gray-200;

      .value {
        font-size: 20px;
        font-weight: 700;
        color: $sky-dark;
      }
    }
  }

  .payment-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid $gray-200;

    .label {
      font-size: 14px;
      color: $slate;
    }
  }

  .payment-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;

    &.payment--pending { background: rgba($warning, 0.1); color: darken($warning, 10%); }
    &.payment--paid, &.payment--completed { background: rgba($success, 0.1); color: darken($success, 10%); }
    &.payment--failed { background: rgba($danger, 0.1); color: $danger; }
  }
}

// Document Card
.document-card {
  .document-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: $gray-50;
    border: 1px solid $gray-200;
    border-radius: 12px;
    text-decoration: none;
    margin-bottom: 16px;
    transition: all 0.2s;

    &:hover {
      background: $sky-light;
      border-color: $sky;
    }

    .doc-icon {
      color: $sky-dark;
    }

    .doc-info {
      flex: 1;

      .doc-name {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: $navy;
      }

      .doc-action {
        font-size: 12px;
        color: $sky-dark;
      }
    }

    .external-icon {
      color: $slate;
    }
  }

  .verification-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .label {
      font-size: 14px;
      color: $slate;
    }
  }

  .verification-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;

    &.verification--pending { background: rgba($warning, 0.1); color: darken($warning, 10%); }
    &.verification--approved { background: rgba($success, 0.1); color: darken($success, 10%); }
    &.verification--rejected { background: rgba($danger, 0.1); color: $danger; }
  }

  .doc-hint {
    font-size: 13px;
    color: $slate;
    font-style: italic;

    &--rejected {
      color: $danger;
      font-style: normal;
    }
  }
}

// Action Card
.action-card {
  border: 2px solid $sky;

  p {
    font-size: 14px;
    color: $slate;
    margin-bottom: 16px;
  }

  .partial-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: $gray-50;
    border-radius: 8px;
    margin-bottom: 16px;
    cursor: pointer;

    input {
      width: 18px;
      height: 18px;
    }

    span {
      font-size: 14px;
      color: $slate;
    }
  }

  .wallet-balance {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    background: $gray-50;
    border-radius: 8px;
    margin-bottom: 16px;

    .label {
      font-size: 14px;
      color: $slate;
    }

    .balance {
      font-size: 16px;
      font-weight: 600;
      color: $navy;

      &.sufficient {
        color: $success;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;

    @media (max-width: 480px) {
      flex-direction: column;
    }

    button {
      flex: 1;
    }
  }
}

// Buttons
.btn-primary, .btn-success, .btn-danger, .btn-outline, .btn-danger-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;

  &:hover:not(:disabled) {
    box-shadow: 0 4px 16px rgba($sky-dark, 0.3);
  }
}

.btn-success {
  background: $success;
  color: white;

  &:hover:not(:disabled) {
    background: darken($success, 8%);
  }
}

.btn-danger {
  background: $danger;
  color: white;

  &:hover:not(:disabled) {
    background: darken($danger, 8%);
  }
}

.btn-outline {
  background: transparent;
  border: 2px solid $sky;
  color: $sky-dark;

  &:hover:not(:disabled) {
    background: $sky-light;
  }
}

.btn-danger-outline {
  background: transparent;
  border: 2px solid $danger;
  color: $danger;

  &:hover:not(:disabled) {
    background: rgba($danger, 0.1);
  }
}

.btn-lg {
  padding: 16px 24px;
  font-size: 16px;
}

.btn-sm {
  padding: 8px 12px;
  font-size: 12px;
}

.btn-link {
  background: none;
  border: none;
  color: $sky-dark;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }
}

// Timeline Card
.timeline-card {
  .timeline {
    padding-left: 28px;
    position: relative;
  }

  .timeline-item {
    position: relative;
    padding-bottom: 20px;

    &:last-child {
      padding-bottom: 0;
    }

    &:not(:last-child)::before {
      content: "";
      position: absolute;
      left: -20px;
      top: 16px;
      bottom: -4px;
      width: 2px;
      background: $gray-200;
    }

    &.completed:not(:last-child)::before {
      background: $success;
    }

    .timeline-marker {
      position: absolute;
      left: -28px;
      top: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: $gray-200;
      border: 2px solid $gray-200;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
      color: white;
    }

    &.completed .timeline-marker {
      background: $success;
      border-color: $success;
    }

    &.current .timeline-marker {
      background: $success;
      border-color: $success;
      box-shadow: 0 0 0 4px rgba($success, 0.2);
    }

    &:not(.completed):not(.current) .timeline-marker {
      background: white;
      border-color: $gray-300;
    }

    .event-label {
      font-size: 14px;
      font-weight: 500;
      color: $navy;
    }

    .event-date {
      font-size: 12px;
      color: $slate;
      margin-top: 2px;
    }
  }
}

// Rating Card
.rating-card {
  .rating-display {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    .stars {
      font-size: 24px;

      .filled {
        color: $warning;
      }
    }

    .rating-value {
      font-size: 16px;
      font-weight: 600;
      color: $navy;
    }

    .review-text {
      width: 100%;
      font-size: 14px;
      color: $slate;
      font-style: italic;
    }
  }

  .rating-form {
    p {
      font-size: 14px;
      color: $slate;
      margin-bottom: 16px;
    }

    .star-rating {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;

      .star-btn {
        background: none;
        border: none;
        font-size: 32px;
        cursor: pointer;
        transition: transform 0.15s;
        padding: 0;

        &:hover {
          transform: scale(1.15);
        }

        &.active, &.hover {
          color: $warning;
        }
      }
    }

    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid $gray-300;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      margin-bottom: 16px;

      &:focus {
        outline: none;
        border-color: $sky;
      }
    }
  }
}

// Pickup Card
.pickup-card {
  .pickup-details {
    .pickup-center {
      margin-bottom: 16px;

      h4 {
        font-size: 16px;
        font-weight: 600;
        color: $navy;
        margin-bottom: 8px;
      }

      p {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: $slate;
        margin-bottom: 4px;
      }
    }

    .pickup-code-box {
      background: linear-gradient(135deg, rgba($success, 0.1) 0%, rgba($success, 0.05) 100%);
      border: 2px solid $success;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin-bottom: 16px;

      .code-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: darken($success, 15%);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
      }

      .code-value {
        display: block;
        font-size: 28px;
        font-weight: 700;
        font-family: monospace;
        color: darken($success, 20%);
        letter-spacing: 4px;
      }

      .code-hint {
        display: block;
        font-size: 12px;
        color: darken($success, 10%);
        margin-top: 8px;
      }
    }

    .pickup-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;

      &.ready { background: rgba($success, 0.1); color: darken($success, 15%); }
      &.transit { background: rgba($info, 0.1); color: darken($info, 15%); }
      &.preparing { background: rgba($warning, 0.1); color: darken($warning, 15%); }
    }
  }

  .select-pickup {
    text-align: center;
    padding: 20px;

    p {
      font-size: 14px;
      color: $slate;
      margin-bottom: 16px;
    }
  }
}

// Delivery Card
.delivery-card {
  .delivery-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }

    .detail-item {
      .label {
        display: block;
        font-size: 12px;
        color: $slate;
        margin-bottom: 4px;
      }

      .value {
        font-size: 14px;
        font-weight: 500;
        color: $navy;
      }

      &.full {
        grid-column: span 2;

        @media (max-width: 480px) {
          grid-column: span 1;
        }
      }
    }
  }
}

// Clarification Card
.clarification-card {
  .clarification-content {
    margin-bottom: 20px;

    .clarification-message {
      font-size: 14px;
      color: $navy;
      margin-bottom: 12px;
    }

    .clarification-items {
      margin: 0 0 12px 20px;

      li {
        font-size: 14px;
        color: $slate;
        margin-bottom: 4px;
      }
    }

    .clarification-deadline {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;

      .label { color: $slate; }
      .deadline-value { color: $navy; font-weight: 500; }
      .deadline-value.urgent { color: $danger; }
    }
  }

  .clarification-form {
    h4 {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
      margin-bottom: 12px;
    }

    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid $gray-300;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      margin-bottom: 12px;

      &:focus {
        outline: none;
        border-color: $sky;
      }
    }

    .file-upload-label {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: $gray-50;
      border: 1px dashed $gray-300;
      border-radius: 10px;
      cursor: pointer;
      margin-bottom: 16px;
      transition: all 0.2s;

      &:hover {
        border-color: $sky;
        background: $sky-light;
      }

      input {
        display: none;
      }

      span {
        font-size: 14px;
        color: $slate;
      }
    }
  }

  .clarification-submitted {
    .submitted-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: rgba($success, 0.1);
      color: $success;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
    }

    p {
      font-size: 14px;
      color: $navy;
      margin-bottom: 8px;
    }

    .submitted-date {
      font-size: 12px;
      color: $slate;
    }
  }
}

// Details Card
.details-card {
  .details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }

    .detail-item {
      .label {
        display: block;
        font-size: 12px;
        color: $slate;
        margin-bottom: 4px;
      }

      .value {
        font-size: 14px;
        font-weight: 500;
        color: $navy;
      }
    }
  }
}

// Notes Card
.notes-card {
  .note-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .note-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: $slate;
      margin-bottom: 4px;
    }

    p {
      font-size: 14px;
      color: $navy;
      line-height: 1.6;
    }
  }
}

// Mobile Action Bar
.mobile-action-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid $gray-200;
  gap: 12px;
  z-index: 100;

  @media (max-width: 768px) {
    display: flex;
  }

  button {
    flex: 1;
  }
}

// Modal Styles
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  @include glass-card;
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;

  &.modal-lg {
    max-width: 560px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid $gray-200;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: $navy;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: $gray-100;
      color: $slate;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: $gray-200;
      }
    }
  }

  .modal-body {
    padding: 20px;

    p {
      font-size: 14px;
      color: $slate;
      margin-bottom: 16px;
    }

    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid $gray-300;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;

      &:focus {
        outline: none;
        border-color: $sky;
      }
    }
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 20px;
    border-top: 1px solid $gray-200;
  }
}

// Payment Confirmation Modal
.payment-confirm-modal {
  .payment-summary {
    text-align: center;

    .payment-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;

      &.wallet {
        background: linear-gradient(135deg, $sky-light, rgba($sky, 0.2));
        color: $sky-dark;
      }

      &.card {
        background: linear-gradient(135deg, $emerald-light, rgba($emerald, 0.2));
        color: $emerald;
      }
    }

    h4 {
      font-size: 18px;
      font-weight: 600;
      color: $navy;
      margin-bottom: 24px;
    }

    .amount-section {
      background: $gray-100;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;

      .amount-label {
        display: block;
        font-size: 13px;
        color: $slate;
        margin-bottom: 6px;
      }

      .amount-value {
        display: block;
        font-size: 28px;
        font-weight: 700;
        color: $navy;
      }
    }

    .wallet-section {
      background: $sky-light;
      border-radius: 12px;
      padding: 16px;

      .balance-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;

        &.after {
          border-top: 1px dashed rgba($sky, 0.3);
          margin-top: 8px;
          padding-top: 12px;
        }

        .balance-label {
          font-size: 13px;
          color: $slate;
        }

        .balance-value {
          font-size: 15px;
          font-weight: 600;
          color: $navy;

          &.sufficient {
            color: $emerald;
          }

          &.insufficient {
            color: $rose;
          }
        }
      }
    }

    .card-section {
      .card-info {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: $emerald-light;
        padding: 14px;
        border-radius: 10px;
        font-size: 13px;
        color: darken($emerald, 15%);
        margin: 0;

        svg {
          flex-shrink: 0;
        }
      }
    }
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Pickup Modal
.pickup-search {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
  }

  .search-input {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: $gray-100;
    border: 1px solid $gray-300;
    border-radius: 10px;
    padding: 0 12px;

    input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 12px 0;
      font-size: 14px;
      outline: none;

      &::placeholder {
        color: $slate;
      }
    }
  }
}

.pickup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;

  p {
    margin-top: 12px;
    font-size: 14px;
    color: $slate;
  }
}

.pickup-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid $gray-200;
  border-radius: 10px;
}

.pickup-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid $gray-200;
  cursor: pointer;
  transition: all 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: $gray-50;
  }

  &.selected {
    background: $sky-light;
    border-color: $sky;
  }

  input {
    margin-top: 4px;
  }

  .center-info {
    flex: 1;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
      margin-bottom: 4px;
    }

    p {
      font-size: 13px;
      color: $slate;
      margin-bottom: 4px;
    }

    .center-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: $slate;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.pickup-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: $slate;

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}

// Error State
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 20px;
}

.error-card {
  @include glass-card;
  padding: 40px;
  text-align: center;
  max-width: 400px;

  .error-icon {
    color: $danger;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: $slate;
    margin-bottom: 20px;
  }
}

// Animations
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Appointments Card
.appointments-card {
  .appointments-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .appointment-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: $gray-50;
    border-radius: 8px;
    font-size: 14px;
    color: $navy;

    .channel-badge {
      padding: 2px 8px;
      background: $sky-light;
      color: $sky-dark;
      border-radius: 4px;
      font-size: 12px;
    }
  }
}
</style>
