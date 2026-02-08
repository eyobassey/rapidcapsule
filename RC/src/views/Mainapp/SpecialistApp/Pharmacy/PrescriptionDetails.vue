<template>
  <div class="prescription-details-page">
    <!-- Ambient Background -->
    <div class="ambient-bg">
      <div class="orb orb--1" />
      <div class="orb orb--2" />
      <div class="orb orb--3" />
    </div>

    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="back-btn" @click="$router.push('/app/specialist/pharmacy/prescriptions')">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <h1 class="mobile-title">Prescription</h1>
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.1" />
      </button>
    </header>

    <!-- Page Container -->
    <div class="page-container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        <router-link to="/app/specialist" class="breadcrumb-item">
          <v-icon name="hi-home" scale="0.7" />
          Home
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <router-link to="/app/specialist/pharmacy" class="breadcrumb-item">
          Pharmacy
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <router-link to="/app/specialist/pharmacy/prescriptions" class="breadcrumb-item">
          Prescriptions
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">{{ prescription.prescription_number || 'Details' }}</span>
      </nav>

      <div class="prescription-details-container">
        <!-- Skeleton Loading -->
        <template v-if="isLoading">
          <div class="skeleton-hero" />
          <div class="skeleton-card" />
          <div class="skeleton-card skeleton-card--lg" />
          <div class="skeleton-card" />
        </template>

        <template v-else>
          <!-- Hero Section -->
          <section class="hero">
            <div class="hero__content">
              <router-link to="/app/specialist/pharmacy/prescriptions" class="back-link desktop-only">
                <v-icon name="hi-arrow-left" scale="0.8" />
                <span>Back to Prescriptions</span>
              </router-link>
              <div class="hero__badge">
                <div class="badge-pulse" :class="prescription.status?.toLowerCase()"></div>
                <v-icon name="ri-capsule-line" />
                <span>Prescription Details</span>
              </div>
              <h1 class="hero__title">
                {{ prescription.prescription_number?.slice(0, 4) || 'RX' }}<br/>
                <span class="hero__title-accent">{{ prescription.prescription_number?.slice(4) || '' }}</span>
              </h1>
              <div class="hero__meta">
                <span class="status-badge" :class="prescription.status?.toLowerCase()">
                  {{ formatStatus(prescription.status) }}
                </span>
                <span v-if="prescription.created_at" class="meta-date">
                  <v-icon name="hi-calendar" scale="0.75" />
                  {{ formatDateTime(prescription.created_at) }}
                </span>
              </div>
              <div class="hero__stats">
                <div class="hero-stat">
                  <span class="hero-stat__value">{{ prescription.items?.length || 0 }}</span>
                  <span class="hero-stat__label">Items</span>
                </div>
                <div class="hero-stat">
                  <span class="hero-stat__value">NGN {{ formatCurrency(prescription.total_amount) }}</span>
                  <span class="hero-stat__label">Total</span>
                </div>
              </div>
            </div>
            <div class="hero__visual">
              <div class="prescription-orb">
                <div class="orb-glow"></div>
                <div class="orb-ring orb-ring--1"></div>
                <div class="orb-ring orb-ring--2"></div>
                <div class="orb-ring orb-ring--3"></div>
                <div class="orb-center">
                  <v-icon name="ri-capsule-line" scale="2.5" />
                </div>
              </div>
              <div v-if="prescription.patient" class="patient-card">
                <RcAvatar
                  :model-value="prescription.patient?.profile_image"
                  :first-name="getFirstName(prescription.patient?.full_name)"
                  :last-name="getLastName(prescription.patient?.full_name)"
                  size="sm"
                  class="patient-avatar"
                  borderless
                />
                <div class="patient-info">
                  <span class="patient-name">{{ prescription.patient?.full_name }}</span>
                  <span class="patient-label">Patient</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Status Pipeline -->
          <div class="status-pipeline-card">
            <div class="section-title">
              <v-icon name="hi-clipboard-check" scale="0.9" />
              <h2>Status Progress</h2>
            </div>
            <div class="status-pipeline">
              <div
                v-for="(step, index) in statusPipeline"
                :key="step.status"
                :class="['pipeline-step', { completed: step.completed, current: step.current, cancelled: isCancelled }]"
              >
                <div class="pipeline-step__marker">
                  <v-icon v-if="step.completed && !step.current" name="hi-check" scale="0.7" />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="pipeline-step__label">{{ step.label }}</div>
                <div class="pipeline-step__connector" v-if="index < statusPipeline.length - 1" />
              </div>
            </div>
          </div>

          <!-- Bento Grid Layout -->
          <section class="bento-grid">
            <!-- Quick Actions Card -->
            <div v-if="availableActions.length" class="bento-card bento-card--actions">
              <div class="card-header">
                <div class="card-header__icon">
                  <v-icon name="hi-lightning-bolt" scale="0.9" />
                </div>
                <h3>Quick Actions</h3>
              </div>
              <div class="quick-actions-grid">
                <button
                  v-for="action in availableActions"
                  :key="action.id"
                  :class="['quick-action-btn', `quick-action-btn--${action.variant}`]"
                  :disabled="actionLoading"
                  @click="handleAction(action.id)"
                >
                  <div class="quick-action-btn__icon">
                    <v-icon :name="action.icon" scale="1" />
                  </div>
                  <span class="quick-action-btn__label">{{ action.label }}</span>
                </button>
              </div>
            </div>

            <!-- Patient Card -->
            <div class="bento-card bento-card--patient">
              <div class="card-header">
                <div class="card-header__icon card-header__icon--violet">
                  <v-icon name="hi-user" scale="0.9" />
                </div>
                <h3>Patient</h3>
                <router-link
                  :to="`/app/specialist/pharmacy/patients/${getPatientId}`"
                  class="card-header__action"
                >
                  View Profile
                  <v-icon name="hi-arrow-right" scale="0.7" />
                </router-link>
              </div>
              <div class="patient-profile">
                <div class="patient-profile__avatar">
                  <RcAvatar
                    :model-value="prescription.patient?.profile_image"
                    :first-name="getFirstName(prescription.patient?.full_name)"
                    :last-name="getLastName(prescription.patient?.full_name)"
                    size="md"
                    borderless
                  />
                  <div class="patient-profile__status">
                    <v-icon name="hi-check" scale="0.5" />
                  </div>
                </div>
                <div class="patient-profile__info">
                  <h4 class="patient-profile__name">{{ prescription.patient?.full_name }}</h4>
                  <div class="patient-profile__meta">
                    <span v-if="prescription.patient?.gender" class="meta-tag">
                      <v-icon :name="prescription.patient.gender === 'Male' ? 'fa-mars' : 'fa-venus'" scale="0.6" />
                      {{ prescription.patient.gender }}
                    </span>
                    <span v-if="prescription.patient?.date_of_birth" class="meta-tag">
                      <v-icon name="hi-cake" scale="0.6" />
                      {{ formatAge(prescription.patient.date_of_birth) }}
                    </span>
                  </div>
                  <div class="patient-profile__contacts">
                    <a v-if="prescription.patient?.email" :href="`mailto:${prescription.patient.email}`" class="contact-chip">
                      <v-icon name="hi-mail" scale="0.7" />
                      <span>{{ prescription.patient.email }}</span>
                    </a>
                    <a v-if="prescription.patient?.phone" :href="`tel:${prescription.patient.phone}`" class="contact-chip">
                      <v-icon name="hi-phone" scale="0.7" />
                      <span>{{ prescription.patient.phone }}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Prescribing Specialist Card -->
            <div class="bento-card bento-card--specialist">
              <div class="card-header">
                <div class="card-header__icon card-header__icon--sky">
                  <v-icon name="hi-identification" scale="0.9" />
                </div>
                <h3>Prescribing Specialist</h3>
                <span v-if="prescription.is_own_prescription" class="card-header__badge card-header__badge--own">
                  <v-icon name="hi-check" scale="0.6" />
                  You
                </span>
              </div>
              <div class="specialist-profile">
                <div class="specialist-profile__avatar">
                  <RcAvatar
                    :model-value="prescription.prescribing_specialist?.profile_image"
                    :first-name="getFirstName(prescription.prescribing_specialist?.full_name)"
                    :last-name="getLastName(prescription.prescribing_specialist?.full_name)"
                    size="md"
                    borderless
                  />
                </div>
                <div class="specialist-profile__info">
                  <h4 class="specialist-profile__name">{{ prescription.prescribing_specialist?.full_name || 'Unknown Specialist' }}</h4>
                  <p v-if="prescription.prescribing_specialist?.specialization" class="specialist-profile__specialty">
                    {{ prescription.prescribing_specialist.specialization }}
                  </p>
                  <div class="specialist-profile__contacts">
                    <a v-if="prescription.prescribing_specialist?.email" :href="`mailto:${prescription.prescribing_specialist.email}`" class="contact-chip">
                      <v-icon name="hi-mail" scale="0.7" />
                      <span>{{ prescription.prescribing_specialist.email }}</span>
                    </a>
                    <a v-if="prescription.prescribing_specialist?.phone" :href="`tel:${prescription.prescribing_specialist.phone}`" class="contact-chip">
                      <v-icon name="hi-phone" scale="0.7" />
                      <span>{{ prescription.prescribing_specialist.phone }}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Linked Records Card -->
            <div
              v-if="prescription.linked_appointments_populated?.length || prescription.linked_clinical_notes_populated?.length"
              class="bento-card bento-card--linked"
            >
              <div class="card-header">
                <div class="card-header__icon card-header__icon--amber">
                  <v-icon name="hi-link" scale="0.9" />
                </div>
                <h3>Linked Records</h3>
                <button
                  v-if="['draft', 'pending_payment'].includes(prescription.status?.toLowerCase())"
                  class="card-header__action-btn"
                  @click="showManageLinksDialog = true"
                >
                  <v-icon name="hi-pencil" scale="0.7" />
                  Edit
                </button>
              </div>
              <div class="linked-records">
                <div v-if="prescription.linked_appointments_populated?.length" class="linked-group">
                  <div class="linked-group__header">
                    <v-icon name="hi-video-camera" scale="0.7" />
                    <span>Appointments ({{ prescription.linked_appointments_populated.length }})</span>
                  </div>
                  <div class="linked-group__items">
                    <div
                      v-for="appt in prescription.linked_appointments_populated"
                      :key="appt._id"
                      class="linked-record-item"
                    >
                      <div class="linked-record-item__date">{{ formatDateTime(appt.start_time) }}</div>
                      <div class="linked-record-item__tags">
                        <span class="mini-tag">{{ appt.meeting_channel || 'Video' }}</span>
                        <span v-if="appt.notes_count" class="mini-tag mini-tag--highlight">
                          {{ appt.notes_count }} note{{ appt.notes_count > 1 ? 's' : '' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="prescription.linked_clinical_notes_populated?.length" class="linked-group">
                  <div class="linked-group__header">
                    <v-icon name="hi-document-text" scale="0.7" />
                    <span>Clinical Notes ({{ prescription.linked_clinical_notes_populated.length }})</span>
                  </div>
                  <div class="linked-group__items">
                    <div
                      v-for="note in prescription.linked_clinical_notes_populated"
                      :key="`${note.appointment_id}-${note.note_id}`"
                      class="linked-record-item linked-record-item--expandable"
                      @click="toggleNoteExpand(note.note_id)"
                    >
                      <div class="linked-record-item__header">
                        <div class="linked-record-item__date">{{ formatDateTime(note.appointment_date) }}</div>
                        <v-icon
                          :name="expandedNoteIds.includes(note.note_id) ? 'hi-chevron-up' : 'hi-chevron-down'"
                          scale="0.6"
                          class="expand-icon"
                        />
                      </div>
                      <p v-if="expandedNoteIds.includes(note.note_id)" class="linked-record-item__content">
                        {{ note.content }}
                      </p>
                      <p v-else class="linked-record-item__preview">
                        {{ (note.content || '').substring(0, 80) }}{{ (note.content || '').length > 80 ? '...' : '' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Medications Card (Full Width) -->
            <div class="bento-card bento-card--medications bento-card--full">
              <div class="card-header">
                <div class="card-header__icon card-header__icon--sky">
                  <v-icon name="ri-capsule-line" scale="0.9" />
                </div>
                <h3>Medications</h3>
                <span class="card-header__count">{{ prescription.items?.length || 0 }} items</span>
              </div>
              <div class="medications-grid">
                <div
                  v-for="(item, index) in prescription.items"
                  :key="index"
                  class="med-card"
                >
                  <div class="med-card__header">
                    <div class="med-card__icon">
                      <v-icon name="ri-capsule-line" scale="0.9" />
                    </div>
                    <div class="med-card__badge">x{{ item.quantity }}</div>
                  </div>
                  <div class="med-card__body">
                    <h4 class="med-card__name">{{ item.drug_name }}</h4>
                    <p class="med-card__strength">{{ item.drug_strength || item.drug_snapshot?.strength }}</p>
                    <p v-if="item.generic_name || item.drug_snapshot?.generic_name" class="med-card__generic">
                      {{ item.generic_name || item.drug_snapshot?.generic_name }}
                    </p>
                  </div>
                  <div class="med-card__dosage">
                    <span v-if="item.dosage" class="dosage-pill">
                      <v-icon name="ri-medicine-bottle-line" scale="0.6" />
                      {{ item.dosage }}
                    </span>
                    <span v-if="item.frequency" class="dosage-pill">
                      <v-icon name="hi-clock" scale="0.6" />
                      {{ item.frequency }}
                    </span>
                    <span v-if="item.duration" class="dosage-pill">
                      <v-icon name="hi-calendar" scale="0.6" />
                      {{ item.duration }}
                    </span>
                  </div>
                  <div v-if="item.instructions || item.notes" class="med-card__instructions">
                    <v-icon name="hi-information-circle" scale="0.65" />
                    <span>{{ item.instructions || item.notes }}</span>
                  </div>
                  <div class="med-card__footer">
                    <span class="med-card__price">NGN {{ formatCurrency(item.unit_price * item.quantity) }}</span>
                    <span class="med-card__unit">@ {{ formatCurrency(item.unit_price) }}/unit</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Summary Card -->
            <div class="bento-card bento-card--payment">
              <div class="card-header">
                <div class="card-header__icon card-header__icon--emerald">
                  <v-icon name="bi-wallet2" scale="0.9" />
                </div>
                <h3>Payment</h3>
                <PharmacyStatusBadge
                  :status="getPaymentStatusClass(prescription.payment_status)"
                  :label="formatPaymentStatus(prescription.payment_status)"
                  class="card-header__badge"
                />
              </div>
              <div class="payment-summary">
                <div class="payment-summary__total">
                  <span class="payment-summary__currency">NGN</span>
                  <span class="payment-summary__amount">{{ formatCurrency(prescription.total_amount) }}</span>
                </div>
                <div class="payment-summary__breakdown">
                  <div class="breakdown-item">
                    <span>Subtotal</span>
                    <span>NGN {{ formatCurrency(prescription.subtotal) }}</span>
                  </div>
                  <div v-if="prescription.delivery_fee" class="breakdown-item">
                    <span>Delivery</span>
                    <span>NGN {{ formatCurrency(prescription.delivery_fee) }}</span>
                  </div>
                  <div v-if="prescription.discount" class="breakdown-item breakdown-item--discount">
                    <span>Discount</span>
                    <span>-NGN {{ formatCurrency(prescription.discount) }}</span>
                  </div>
                </div>
                <div class="payment-summary__method">
                  <v-icon name="hi-credit-card" scale="0.7" />
                  <span>{{ formatPaymentMethod(prescription.payment_method) }}</span>
                </div>
              </div>
              <div v-if="prescription.linked_pharmacy_order_number" class="pharmacy-order-link">
                <v-icon name="hi-external-link" scale="0.7" />
                <span>Linked to order {{ prescription.linked_pharmacy_order_number }}</span>
              </div>
            </div>

            <!-- Delivery Card -->
            <div v-if="prescription.delivery_address || prescription.is_pickup_order" class="bento-card bento-card--delivery">
              <div class="card-header">
                <div class="card-header__icon card-header__icon--rose">
                  <v-icon :name="prescription.is_pickup_order ? 'hi-location-marker' : 'hi-truck'" scale="0.9" />
                </div>
                <h3>{{ prescription.is_pickup_order ? 'Pickup' : 'Delivery' }}</h3>
              </div>
              <div class="delivery-info">
                <div class="delivery-info__type">
                  <v-icon :name="prescription.is_pickup_order ? 'hi-office-building' : 'hi-home'" scale="0.8" />
                  <span>{{ prescription.is_pickup_order ? 'Clinic Pickup' : 'Home Delivery' }}</span>
                </div>
                <div v-if="prescription.delivery_address" class="delivery-info__address">
                  <p>{{ prescription.delivery_address.street }}</p>
                  <p>{{ prescription.delivery_address.city }}, {{ prescription.delivery_address.state }}</p>
                  <p v-if="prescription.delivery_address.phone">{{ prescription.delivery_address.phone }}</p>
                </div>
                <div v-if="prescription.tracking_number" class="delivery-info__tracking">
                  <span class="tracking-label">Tracking:</span>
                  <span class="tracking-number">{{ prescription.tracking_number }}</span>
                </div>
              </div>
            </div>

            <!-- Notes Card -->
            <div v-if="prescription.clinical_notes || prescription.patient_notes || prescription.pharmacy_notes" class="bento-card bento-card--notes">
              <div class="card-header">
                <div class="card-header__icon card-header__icon--slate">
                  <v-icon name="hi-annotation" scale="0.9" />
                </div>
                <h3>Notes</h3>
              </div>
              <div class="notes-stack">
                <div v-if="prescription.clinical_notes" class="note-block note-block--clinical">
                  <div class="note-block__label">Clinical Notes</div>
                  <p class="note-block__content">{{ prescription.clinical_notes }}</p>
                </div>
                <div v-if="prescription.patient_notes" class="note-block note-block--patient">
                  <div class="note-block__label">Patient Notes</div>
                  <p class="note-block__content">{{ prescription.patient_notes }}</p>
                </div>
                <div v-if="prescription.pharmacy_notes" class="note-block note-block--pharmacy">
                  <div class="note-block__label">Pharmacy Notes</div>
                  <p class="note-block__content">{{ prescription.pharmacy_notes }}</p>
                </div>
              </div>
            </div>

            <!-- Timeline Card -->
            <div class="bento-card bento-card--timeline">
              <div class="card-header">
                <div class="card-header__icon card-header__icon--indigo">
                  <v-icon name="hi-clock" scale="0.9" />
                </div>
                <h3>Timeline</h3>
              </div>
              <div class="timeline-list">
                <div class="timeline-item">
                  <div class="timeline-item__dot"></div>
                  <div class="timeline-item__content">
                    <span class="timeline-item__label">Created</span>
                    <span class="timeline-item__date">{{ formatDateTime(prescription.created_at) }}</span>
                  </div>
                </div>
                <div v-if="prescription.sent_to_patient_at" class="timeline-item">
                  <div class="timeline-item__dot"></div>
                  <div class="timeline-item__content">
                    <span class="timeline-item__label">Sent to Patient</span>
                    <span class="timeline-item__date">{{ formatDateTime(prescription.sent_to_patient_at) }}</span>
                  </div>
                </div>
                <div v-if="prescription.paid_at" class="timeline-item">
                  <div class="timeline-item__dot timeline-item__dot--success"></div>
                  <div class="timeline-item__content">
                    <span class="timeline-item__label">Payment Received</span>
                    <span class="timeline-item__date">{{ formatDateTime(prescription.paid_at) }}</span>
                  </div>
                </div>
                <div v-if="prescription.dispensed_at" class="timeline-item">
                  <div class="timeline-item__dot timeline-item__dot--info"></div>
                  <div class="timeline-item__content">
                    <span class="timeline-item__label">Dispensed</span>
                    <span class="timeline-item__date">{{ formatDateTime(prescription.dispensed_at) }}</span>
                  </div>
                </div>
                <div v-if="prescription.shipped_at" class="timeline-item">
                  <div class="timeline-item__dot timeline-item__dot--info"></div>
                  <div class="timeline-item__content">
                    <span class="timeline-item__label">Shipped</span>
                    <span class="timeline-item__date">{{ formatDateTime(prescription.shipped_at) }}</span>
                  </div>
                </div>
                <div v-if="prescription.delivered_at" class="timeline-item">
                  <div class="timeline-item__dot timeline-item__dot--success"></div>
                  <div class="timeline-item__content">
                    <span class="timeline-item__label">Delivered</span>
                    <span class="timeline-item__date">{{ formatDateTime(prescription.delivered_at) }}</span>
                  </div>
                </div>
                <div v-if="prescription.cancelled_at" class="timeline-item">
                  <div class="timeline-item__dot timeline-item__dot--danger"></div>
                  <div class="timeline-item__content">
                    <span class="timeline-item__label">Cancelled</span>
                    <span class="timeline-item__date">{{ formatDateTime(prescription.cancelled_at) }}</span>
                    <p v-if="prescription.cancellation_reason" class="timeline-item__reason">{{ prescription.cancellation_reason }}</p>
                  </div>
                </div>
                <div v-if="prescription.updated_at && prescription.updated_at !== prescription.created_at" class="timeline-item timeline-item--muted">
                  <div class="timeline-item__dot timeline-item__dot--muted"></div>
                  <div class="timeline-item__content">
                    <span class="timeline-item__label">Last Updated</span>
                    <span class="timeline-item__date">{{ formatDateTime(prescription.updated_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>
    </div>

    <!-- Cancel Dialog -->
    <PharmacyConfirmDialog
      v-model="showCancelDialog"
      title="Cancel Prescription"
      message="Are you sure you want to cancel this prescription? This action cannot be undone."
      confirm-label="Confirm Cancellation"
      confirm-variant="danger"
      :loading="actionLoading"
      :confirm-disabled="!cancelReason"
      @confirm="cancelPrescription"
    >
      <div class="form-group">
        <label>Reason for cancellation</label>
        <textarea v-model="cancelReason" rows="3" placeholder="Enter reason..." />
      </div>
    </PharmacyConfirmDialog>

    <!-- Dispense Dialog -->
    <PharmacyConfirmDialog
      v-model="showDispenseDialog"
      title="Mark as Dispensed"
      message="Confirm that all medications have been dispensed."
      confirm-label="Confirm Dispensed"
      :loading="actionLoading"
      @confirm="markDispensed"
    >
      <div class="form-group">
        <label>Notes (optional)</label>
        <textarea v-model="dispenseNotes" rows="2" placeholder="Any notes..." />
      </div>
    </PharmacyConfirmDialog>

    <!-- Ship Dialog -->
    <PharmacyConfirmDialog
      v-model="showShipDialog"
      title="Mark as Shipped"
      confirm-label="Confirm Shipped"
      :loading="actionLoading"
      @confirm="markShipped"
    >
      <div class="form-group">
        <label>Tracking Number (optional)</label>
        <input v-model="trackingNumber" type="text" placeholder="Enter tracking number..." />
      </div>
      <div class="form-group">
        <label>Carrier (optional)</label>
        <input v-model="carrier" type="text" placeholder="e.g., DHL, FedEx..." />
      </div>
    </PharmacyConfirmDialog>

    <!-- Deliver Dialog -->
    <PharmacyConfirmDialog
      v-model="showDeliverDialog"
      title="Mark as Delivered"
      message="Confirm that the prescription has been delivered to the patient."
      confirm-label="Confirm Delivered"
      :loading="actionLoading"
      @confirm="markDelivered"
    >
      <div class="form-group">
        <label>Notes (optional)</label>
        <textarea v-model="deliverNotes" rows="2" placeholder="Any notes..." />
      </div>
    </PharmacyConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import RcAvatar from '@/components/RCAvatar';
import apiFactory from '@/services/apiFactory';
import PharmacyStatusBadge from './components/PharmacyStatusBadge.vue';
import PharmacyConfirmDialog from './components/PharmacyConfirmDialog.vue';
import { usePharmacy } from './composables/usePharmacy';

const route = useRoute();
const $toast = useToast();
const { formatCurrency, formatDateTime, formatPaymentMethod, formatPaymentStatus, formatStatus } = usePharmacy();

const isLoading = ref(true);
const actionLoading = ref(false);
const prescription = ref({});

// Dialog states
const showCancelDialog = ref(false);
const showDispenseDialog = ref(false);
const showShipDialog = ref(false);
const showDeliverDialog = ref(false);

// Form data
const cancelReason = ref('');
const dispenseNotes = ref('');
const trackingNumber = ref('');
const carrier = ref('');
const deliverNotes = ref('');

// Linked records
const expandedNoteIds = ref([]);
const showManageLinksDialog = ref(false);

function toggleNoteExpand(noteId) {
  const index = expandedNoteIds.value.indexOf(noteId);
  if (index >= 0) {
    expandedNoteIds.value.splice(index, 1);
  } else {
    expandedNoteIds.value.push(noteId);
  }
}

const prescriptionId = route.params.id;

const isCancelled = computed(() => {
  return prescription.value.status?.toLowerCase() === 'cancelled';
});

const getPatientId = computed(() => {
  const patientId = prescription.value.patient_id;
  if (!patientId) return '';
  if (typeof patientId === 'string') return patientId;
  if (patientId._id) return patientId._id;
  if (patientId.$oid) return patientId.$oid;
  return String(patientId);
});

const statusPipeline = computed(() => {
  const statuses = [
    { status: 'draft', label: 'Created' },
    { status: 'pending_payment', label: 'Payment' },
    { status: 'paid', label: 'Paid' },
    { status: 'dispensed', label: 'Dispensed' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'delivered', label: 'Delivered' },
  ];

  const currentStatus = prescription.value.status?.toLowerCase();
  const currentIndex = statuses.findIndex(s => s.status === currentStatus);

  return statuses.map((s, index) => ({
    ...s,
    completed: index <= currentIndex,
    current: index === currentIndex,
  }));
});

const availableActions = computed(() => {
  const status = prescription.value.status?.toLowerCase();
  const actions = [];

  if (status === 'draft') {
    actions.push({
      id: 'send_payment',
      label: 'Send Payment Link',
      icon: 'hi-mail',
      variant: 'primary',
    });
  }

  if (status === 'paid') {
    actions.push({
      id: 'dispense',
      label: 'Mark as Dispensed',
      icon: 'hi-check-circle',
      variant: 'primary',
    });
  }

  if (status === 'dispensed') {
    actions.push({
      id: 'ship',
      label: 'Mark as Shipped',
      icon: 'hi-truck',
      variant: 'primary',
    });
  }

  if (status === 'shipped') {
    actions.push({
      id: 'deliver',
      label: 'Mark as Delivered',
      icon: 'hi-check-circle',
      variant: 'success',
    });
  }

  if (['draft', 'pending_payment', 'paid', 'processing', 'dispensed'].includes(status)) {
    actions.push({
      id: 'cancel',
      label: 'Cancel',
      icon: 'hi-x-circle',
      variant: 'danger',
    });
  }

  return actions;
});

function getFirstName(name) {
  if (!name) return '';
  return name.split(' ')[0] || '';
}

function getLastName(name) {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function getPaymentStatusClass(status) {
  if (!status) return 'draft';
  const normalized = status.toUpperCase();
  if (normalized === 'COMPLETED' || normalized === 'PAID') return 'delivered';
  if (normalized === 'PENDING') return 'pending_payment';
  if (normalized === 'FAILED') return 'cancelled';
  if (normalized === 'PROCESSING') return 'processing';
  return 'draft';
}

function formatAge(dateOfBirth) {
  if (!dateOfBirth) return '';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `${age} yrs`;
}

function handleAction(actionId) {
  switch (actionId) {
    case 'send_payment':
      sendPaymentLink();
      break;
    case 'dispense':
      showDispenseDialog.value = true;
      break;
    case 'ship':
      showShipDialog.value = true;
      break;
    case 'deliver':
      showDeliverDialog.value = true;
      break;
    case 'cancel':
      showCancelDialog.value = true;
      break;
  }
}

async function fetchPrescription() {
  try {
    isLoading.value = true;
    const response = await apiFactory.$_getSpecialistPrescriptionDetails(prescriptionId);
    const result = response.data?.data || response.data?.result;
    if (result) {
      prescription.value = result;
    }
  } catch (error) {
    console.error('Error fetching prescription:', error);
    $toast.error('Failed to load prescription details');
  } finally {
    isLoading.value = false;
  }
}

async function sendPaymentLink() {
  try {
    actionLoading.value = true;
    await apiFactory.$_sendPrescriptionPaymentLink(prescriptionId, {
      email: prescription.value.patient?.email,
    });
    $toast.success('Payment link sent to patient');
  } catch (error) {
    console.error('Error sending payment link:', error);
    $toast.error('Failed to send payment link');
  } finally {
    actionLoading.value = false;
  }
}

async function cancelPrescription() {
  try {
    actionLoading.value = true;
    await apiFactory.$_cancelSpecialistPrescription(prescriptionId, {
      reason: cancelReason.value,
    });
    $toast.success('Prescription cancelled');
    showCancelDialog.value = false;
    cancelReason.value = '';
    await fetchPrescription();
  } catch (error) {
    console.error('Error cancelling prescription:', error);
    $toast.error('Failed to cancel prescription');
  } finally {
    actionLoading.value = false;
  }
}

async function markDispensed() {
  try {
    actionLoading.value = true;
    await apiFactory.$_dispensePrescription(prescriptionId, {
      notes: dispenseNotes.value,
    });
    $toast.success('Prescription marked as dispensed');
    showDispenseDialog.value = false;
    dispenseNotes.value = '';
    await fetchPrescription();
  } catch (error) {
    console.error('Error marking dispensed:', error);
    $toast.error('Failed to update prescription');
  } finally {
    actionLoading.value = false;
  }
}

async function markShipped() {
  try {
    actionLoading.value = true;
    await apiFactory.$_shipPrescription(prescriptionId, {
      shipping_method: carrier.value || 'Courier',
      tracking_number: trackingNumber.value || undefined,
      courier_name: carrier.value || undefined,
    });
    $toast.success('Prescription marked as shipped');
    showShipDialog.value = false;
    trackingNumber.value = '';
    carrier.value = '';
    await fetchPrescription();
  } catch (error) {
    console.error('Error marking shipped:', error);
    $toast.error('Failed to update prescription');
  } finally {
    actionLoading.value = false;
  }
}

async function markDelivered() {
  try {
    actionLoading.value = true;
    await apiFactory.$_deliverPrescription(prescriptionId, {
      notes: deliverNotes.value,
    });
    $toast.success('Prescription marked as delivered');
    showDeliverDialog.value = false;
    deliverNotes.value = '';
    await fetchPrescription();
  } catch (error) {
    console.error('Error marking delivered:', error);
    $toast.error('Failed to update prescription');
  } finally {
    actionLoading.value = false;
  }
}

onMounted(() => {
  fetchPrescription();
});
</script>

<style scoped lang="scss">
// Design System Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$violet: #8B5CF6;
$violet-light: #EDE9FE;
$rose: #F43F5E;
$rose-light: #FFE4E6;

// Base Layout
.prescription-details-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  overflow-x: hidden;
}

// Ambient Background
.ambient-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;

  &--1 {
    width: 400px;
    height: 400px;
    background: $sky-light;
    top: -100px;
    right: -100px;
    animation-delay: 0s;
  }

  &--2 {
    width: 300px;
    height: 300px;
    background: rgba($emerald, 0.15);
    bottom: 20%;
    left: -80px;
    animation-delay: -7s;
  }

  &--3 {
    width: 250px;
    height: 250px;
    background: rgba($violet, 0.12);
    top: 50%;
    right: 15%;
    animation-delay: -14s;
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.05); }
  50% { transform: translate(-10px, 15px) scale(0.95); }
  75% { transform: translate(15px, 10px) scale(1.02); }
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: $size-12 $size-16;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  align-items: center;
  justify-content: space-between;

  @include responsive(tab-portrait) {
    display: flex;
  }

  .back-btn, .menu-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    border-radius: $size-10;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-g-36;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($sky, 0.1);
      color: $sky-dark;
    }
  }

  .mobile-title {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

// Page Container
.page-container {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 100px;
  }
}

// Breadcrumbs
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-20;
  font-size: $size-13;

  @include responsive(tab-portrait) {
    display: none;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: $size-4;
    color: $color-g-54;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: $sky-dark;
    }
  }

  .breadcrumb-separator {
    color: $color-g-67;
  }

  .breadcrumb-current {
    color: $color-g-21;
    font-weight: $fw-medium;
  }
}

.prescription-details-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $size-20;
  padding-bottom: $size-32;
}

// Skeleton Hero
.skeleton-hero {
  border-radius: $size-20;
  height: 150px;
  background: linear-gradient(135deg, rgba(14, 174, 196, 0.15) 0%, rgba(14, 174, 196, 0.08) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;

  @include responsive(phone) {
    height: 180px;
    border-radius: $size-12;
  }
}

// Hero Section
.hero {
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 32px;
  padding: 48px 56px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 48px;
  align-items: center;
  min-height: 320px;
  box-shadow:
    0 25px 80px rgba($sky-dark, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  &::before {
    content: '';
    position: absolute;
    top: -60%;
    right: -20%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 36px 32px;
    min-height: auto;
  }

  @media (max-width: 768px) {
    padding: 28px 24px;
    border-radius: 24px;
  }
}

.hero__content {
  position: relative;
  z-index: 2;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
  text-decoration: none;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateX(-4px);
  }

  &.desktop-only {
    @media (max-width: 768px) {
      display: none;
    }
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;

  .badge-pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse-glow 2s ease-in-out infinite;

    &:not(.cancelled):not(.pending_payment) { background: #4ade80; }
    &.cancelled { background: #f87171; }
    &.pending_payment { background: #fbbf24; }
  }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
}

.hero__title {
  font-size: 52px;
  font-weight: 800;
  color: white;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin-bottom: 16px;

  @media (max-width: 1024px) {
    font-size: 40px;
  }

  @media (max-width: 768px) {
    font-size: 32px;
  }
}

.hero__title-accent {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  .status-badge {
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    text-transform: capitalize;

    &.delivered { background: rgba(16, 185, 129, 0.4); }
    &.cancelled { background: rgba(239, 68, 68, 0.4); }
    &.paid, &.processing { background: rgba(59, 130, 246, 0.4); }
    &.dispensed, &.shipped { background: rgba(139, 92, 246, 0.4); }
    &.pending_payment { background: rgba(245, 158, 11, 0.4); }
  }

  .meta-date {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
  }
}

.hero__stats {
  display: flex;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 12px;
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &__value {
    font-size: 22px;
    font-weight: 700;
    color: white;
    line-height: 1.1;

    @media (max-width: 768px) {
      font-size: 18px;
    }
  }

  &__label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
  }
}

.hero__visual {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;

  @media (max-width: 1024px) {
    display: none;
  }
}

.prescription-orb {
  position: relative;
  width: 160px;
  height: 160px;
}

.orb-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 0.4; }
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    inset: 0;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    inset: 12px;
    border-style: dashed;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    inset: 24px;
    animation: spin-slow 25s linear infinite;
  }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orb-center {
  position: absolute;
  inset: 38px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.patient-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  padding: 10px 18px;

  .patient-avatar {
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .patient-info {
    display: flex;
    flex-direction: column;

    .patient-name {
      font-size: 13px;
      font-weight: 600;
      color: white;
    }

    .patient-label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

// Section Title Pattern
.section-title {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-16;

  svg {
    color: $sky-dark;
  }

  h2 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin: 0;
  }
}

// Skeleton Loading (Shimmer)
.skeleton-card {
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  height: 160px;

  &--sm { height: 80px; }
  &--lg { height: 280px; }
}

// Status Pipeline Card
.status-pipeline-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  padding: $size-20 $size-24;
  border-radius: $size-16;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);

  @include responsive(phone) {
    padding: $size-16;
  }
}

.status-pipeline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  overflow-x: auto;
  padding: $size-8 0;
}

.pipeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 0;

  &__marker {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $color-g-92;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $size-12;
    font-weight: $fw-bold;
    color: $color-g-54;
    margin-bottom: $size-8;
    z-index: 1;
    transition: all 0.3s ease;
  }

  &__label {
    font-size: $size-11;
    color: $color-g-54;
    text-align: center;
    white-space: nowrap;
    font-weight: $fw-medium;

    @include responsive(phone) {
      font-size: 9px;
    }
  }

  &__connector {
    position: absolute;
    top: 16px;
    left: 50%;
    width: 100%;
    height: 2px;
    background: $color-g-92;
    z-index: 0;
    transition: background 0.3s ease;
  }

  &.completed {
    .pipeline-step__marker {
      background: linear-gradient(135deg, $sky-dark 0%, #0891b2 100%);
      color: $color-white;
      box-shadow: 0 2px 6px rgba($sky-dark, 0.3);
    }

    .pipeline-step__label {
      color: #0891b2;
      font-weight: $fw-semi-bold;
    }

    .pipeline-step__connector {
      background: linear-gradient(90deg, $sky-dark, #0891b2);
    }
  }

  &.current {
    .pipeline-step__marker {
      background: linear-gradient(135deg, $sky-dark 0%, #0891b2 100%);
      color: $color-white;
      box-shadow: 0 0 0 4px rgba($sky-dark, 0.2), 0 2px 8px rgba($sky-dark, 0.3);
      transform: scale(1.1);
    }

    .pipeline-step__label {
      color: $sky-dark;
      font-weight: $fw-bold;
    }
  }

  &.cancelled {
    .pipeline-step__marker {
      background: $color-g-92;
      color: $color-g-54;
      box-shadow: none;
    }
  }
}

// ============ BENTO GRID LAYOUT ============
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 8px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

// Bento Card Base
.bento-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 24px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;

  &:hover {
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.06),
      0 2px 4px rgba(0, 0, 0, 0.03);
  }

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
  }

  &--full {
    grid-column: 1 / -1;
  }

  &--actions {
    grid-column: span 1;
  }

  &--patient {
    grid-column: span 1;
  }

  &--specialist {
    grid-column: span 1;
  }

  &--linked {
    grid-column: span 2;

    @media (max-width: 1200px) {
      grid-column: 1 / -1;
    }
  }

  &--medications {
    grid-column: 1 / -1;
  }

  &--payment {
    grid-column: span 1;
  }

  &--delivery {
    grid-column: span 1;
  }

  &--timeline {
    grid-column: span 1;

    @media (max-width: 768px) {
      grid-column: 1 / -1;
    }
  }

  &--notes {
    grid-column: 1 / -1;

    @media (min-width: 1200px) {
      grid-column: span 2;
    }
  }
}

// Card Header
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
    color: $sky-dark;

    &--violet {
      background: linear-gradient(135deg, $violet-light 0%, rgba($violet, 0.2) 100%);
      color: $violet;
    }

    &--emerald {
      background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%);
      color: $emerald;
    }

    &--amber {
      background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.2) 100%);
      color: $amber;
    }

    &--rose {
      background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.2) 100%);
      color: $rose;
    }

    &--sky {
      background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
      color: $sky-dark;
    }

    &--slate {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      color: #64748b;
    }

    &--indigo {
      background: linear-gradient(135deg, #e0e7ff 0%, rgba(99, 102, 241, 0.2) 100%);
      color: #4f46e5;
    }
  }

  h3 {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }

  &__action {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 500;
    color: $sky-dark;
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 8px;
    background: rgba($sky, 0.08);
    transition: all 0.2s;

    &:hover {
      background: rgba($sky, 0.15);
    }
  }

  &__action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: white;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $sky;
      color: $sky-dark;
    }
  }

  &__count {
    font-size: 13px;
    font-weight: 500;
    color: #94a3b8;
    padding: 4px 10px;
    background: #f1f5f9;
    border-radius: 6px;
  }

  &__badge {
    margin-left: auto;
  }
}

// Quick Actions Grid
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
  }

  &--primary {
    background: linear-gradient(135deg, rgba($sky, 0.08) 0%, rgba($sky-dark, 0.12) 100%);

    .quick-action-btn__icon {
      background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
      color: white;
    }

    .quick-action-btn__label {
      color: $sky-dark;
    }

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba($sky, 0.15) 0%, rgba($sky-dark, 0.2) 100%);
      transform: translateY(-2px);
    }
  }

  &--success {
    background: linear-gradient(135deg, rgba($emerald, 0.08) 0%, rgba($emerald, 0.12) 100%);

    .quick-action-btn__icon {
      background: linear-gradient(135deg, $emerald 0%, #059669 100%);
      color: white;
    }

    .quick-action-btn__label {
      color: #059669;
    }

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba($emerald, 0.15) 0%, rgba($emerald, 0.2) 100%);
      transform: translateY(-2px);
    }
  }

  &--danger {
    background: linear-gradient(135deg, rgba($rose, 0.06) 0%, rgba($rose, 0.1) 100%);
    border: 1px solid rgba($rose, 0.15);

    .quick-action-btn__icon {
      background: rgba($rose, 0.15);
      color: $rose;
    }

    .quick-action-btn__label {
      color: #dc2626;
    }

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba($rose, 0.12) 0%, rgba($rose, 0.16) 100%);
    }
  }
}

// Patient Profile
.patient-profile {
  display: flex;
  align-items: center;
  gap: 16px;

  &__avatar {
    position: relative;
    flex-shrink: 0;
  }

  &__status {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 18px;
    height: 18px;
    background: $emerald;
    border: 2px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 6px;
  }

  &__meta {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__contacts {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  padding: 3px 8px;
  background: #f1f5f9;
  border-radius: 4px;

  svg {
    color: $sky-dark;
  }
}

.contact-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  text-decoration: none;
  padding: 4px 10px;
  background: #f8fafc;
  border-radius: 6px;
  transition: all 0.2s;
  max-width: 100%;
  overflow: hidden;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  svg {
    color: $sky-dark;
    flex-shrink: 0;
  }

  &:hover {
    background: $sky-light;
    color: $sky-dark;
  }
}

// Specialist Profile
.specialist-profile {
  display: flex;
  align-items: center;
  gap: 16px;

  &__avatar {
    position: relative;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px;
  }

  &__specialty {
    font-size: 13px;
    color: $sky-dark;
    margin: 0 0 8px;
    font-weight: 500;
  }

  &__contacts {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}

.card-header__badge--own {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
  color: $sky-dark;
  border-radius: 6px;
}

// Payment Summary
.payment-summary {
  &__total {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px dashed #e2e8f0;
  }

  &__currency {
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
  }

  &__amount {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: -0.02em;
  }

  &__breakdown {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  &__method {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #64748b;
    padding: 10px 12px;
    background: #f8fafc;
    border-radius: 8px;

    svg {
      color: $sky-dark;
    }
  }
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #64748b;

  &--discount {
    color: $emerald;
  }
}

.pharmacy-order-link {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(#3b82f6, 0.06);
  border-radius: 8px;
  font-size: 12px;
  color: #3b82f6;
}

// Linked Records
.linked-records {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.linked-group {
  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 10px;

    svg {
      color: $sky-dark;
    }
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.linked-record-item {
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s;

  &--expandable {
    cursor: pointer;

    &:hover {
      background: #f1f5f9;
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__date {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
  }

  &__tags {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }

  &__preview {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 6px;
    line-height: 1.4;
  }

  &__content {
    font-size: 13px;
    color: #475569;
    margin-top: 10px;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .expand-icon {
    color: #94a3b8;
  }
}

.mini-tag {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;

  &--highlight {
    background: rgba($sky, 0.1);
    border-color: rgba($sky, 0.2);
    color: $sky-dark;
  }
}

// Medications Grid
.medications-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.med-card {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba($sky, 0.3);
    box-shadow: 0 4px 16px rgba($sky-dark, 0.08);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
  }

  &__badge {
    font-size: 12px;
    font-weight: 700;
    color: $sky-dark;
    background: $sky-light;
    padding: 4px 10px;
    border-radius: 8px;
  }

  &__body {
    margin-bottom: 14px;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px;
    line-height: 1.3;
  }

  &__strength {
    font-size: 13px;
    font-weight: 500;
    color: $sky-dark;
    margin: 0 0 2px;
  }

  &__generic {
    font-size: 12px;
    color: #94a3b8;
    margin: 0;
  }

  &__dosage {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }

  &__instructions {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    color: #64748b;
    font-style: italic;
    line-height: 1.4;
    padding: 10px;
    background: white;
    border-radius: 8px;
    border-left: 3px solid rgba($sky, 0.4);
    margin-bottom: 14px;

    svg {
      color: $sky-dark;
      flex-shrink: 0;
      margin-top: 1px;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
  }

  &__price {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
  }

  &__unit {
    font-size: 11px;
    color: #94a3b8;
  }
}

.dosage-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #475569;

  svg {
    color: $sky-dark;
  }
}

// Delivery Info
.delivery-info {
  &__type {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
    padding: 12px 14px;
    background: #f8fafc;
    border-radius: 10px;
    margin-bottom: 12px;

    svg {
      color: $sky-dark;
    }
  }

  &__address {
    padding: 14px;
    background: #f8fafc;
    border-radius: 10px;
    margin-bottom: 12px;

    p {
      font-size: 13px;
      color: #475569;
      margin: 0;
      line-height: 1.5;

      &:not(:last-child) {
        margin-bottom: 4px;
      }
    }
  }

  &__tracking {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;

    .tracking-label {
      color: #64748b;
    }

    .tracking-number {
      font-family: monospace;
      font-weight: 600;
      color: $sky-dark;
      background: $sky-light;
      padding: 4px 10px;
      border-radius: 6px;
    }
  }
}

// Notes Stack
.notes-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-block {
  padding: 14px;
  border-radius: 10px;
  border-left: 3px solid;

  &--clinical {
    background: rgba($sky, 0.05);
    border-color: $sky-dark;
  }

  &--patient {
    background: rgba($violet, 0.05);
    border-color: $violet;
  }

  &--pharmacy {
    background: rgba($emerald, 0.05);
    border-color: $emerald;
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    margin-bottom: 6px;
  }

  &__content {
    font-size: 13px;
    color: #475569;
    line-height: 1.6;
    margin: 0;
  }
}

// Timeline
.timeline-list {
  position: relative;
  padding-left: 24px;

  &::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: #e2e8f0;
    border-radius: 1px;
  }
}

.timeline-item {
  position: relative;
  padding-bottom: 16px;

  &:last-child {
    padding-bottom: 0;
  }

  &--muted {
    opacity: 0.6;
  }

  &__dot {
    position: absolute;
    left: -20px;
    top: 4px;
    width: 12px;
    height: 12px;
    background: $sky;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba($sky, 0.15);

    &--success {
      background: $emerald;
      box-shadow: 0 0 0 3px rgba($emerald, 0.15);
    }

    &--info {
      background: $violet;
      box-shadow: 0 0 0 3px rgba($violet, 0.15);
    }

    &--danger {
      background: $rose;
      box-shadow: 0 0 0 3px rgba($rose, 0.15);
    }

    &--muted {
      background: #94a3b8;
      box-shadow: 0 0 0 3px rgba(#94a3b8, 0.15);
    }
  }

  &__content {
    padding-left: 4px;
  }

  &__label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 2px;
  }

  &__date {
    display: block;
    font-size: 12px;
    color: #64748b;
  }

  &__reason {
    font-size: 12px;
    color: $rose;
    margin-top: 4px;
    font-style: italic;
  }
}

// Form groups (for dialogs)
.form-group {
  margin-bottom: $size-16;

  label {
    display: block;
    font-size: $size-12;
    font-weight: $fw-semi-bold;
    color: $color-g-44;
    margin-bottom: $size-8;
  }

  input,
  textarea {
    width: 100%;
    padding: $size-12 $size-14;
    border: 1px solid $color-g-85;
    border-radius: $size-10;
    font-size: $size-14;
    color: $color-g-21;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: $sky-dark;
      box-shadow: 0 0 0 3px rgba($sky-dark, 0.1);
    }

    &::placeholder {
      color: $color-g-67;
    }
  }

  textarea {
    resize: vertical;
  }
}

// Linked Records Styles
.linked-section {
  margin-bottom: $size-16;

  &__label {
    font-size: $size-12;
    font-weight: $fw-semi-bold;
    color: $color-g-54;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: $size-8;
  }
}

.linked-items {
  display: flex;
  flex-direction: column;
  gap: $size-8;
}

.linked-item {
  display: flex;
  align-items: flex-start;
  gap: $size-10;
  padding: $size-10 $size-12;
  border: 1px solid $color-g-92;
  border-radius: $size-8;
  transition: background 0.15s;

  &--note {
    cursor: pointer;

    &:hover {
      background: $color-g-97;
    }
  }

  &__icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(14, 174, 196, 0.08);
    border-radius: $size-6;
    color: $color-pri;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__date {
    font-size: $size-13;
    font-weight: $fw-medium;
    color: $color-g-21;
    display: block;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $size-4;
    margin-top: $size-4;
  }

  &__platform {
    font-size: $size-11;
    padding: 1px $size-6;
    border-radius: $size-4;
    display: inline-block;
    margin-top: $size-4;

    &.platform--zoom {
      background: rgba(45, 140, 255, 0.1);
      color: #2d8cff;
    }

    &.platform--custom {
      background: rgba(14, 174, 196, 0.1);
      color: $color-pri;
    }
  }

  &__note-preview {
    font-size: $size-12;
    color: $color-g-54;
    margin-top: $size-4;
    line-height: 1.4;
  }

  &__note-content {
    font-size: $size-12;
    color: $color-g-36;
    margin-top: $size-4;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  &__expand {
    color: $color-g-67;
    flex-shrink: 0;
    margin-top: $size-4;
  }
}

.linked-tag {
  font-size: $size-11;
  color: $color-g-54;
  background: $color-g-95;
  padding: 2px $size-6;
  border-radius: $size-4;

  &--notes {
    color: $color-pri;
    background: rgba(14, 174, 196, 0.08);
  }
}

.manage-links-btn {
  display: flex;
  align-items: center;
  gap: $size-6;
  margin-top: $size-12;
  padding: $size-8 $size-12;
  font-size: $size-12;
  font-weight: $fw-medium;
  color: $color-pri;
  background: rgba(14, 174, 196, 0.06);
  border: 1px solid rgba(14, 174, 196, 0.2);
  border-radius: $size-6;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(14, 174, 196, 0.12);
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
