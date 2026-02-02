<template>
  <div class="page-content">
    <TopBar showButtons type="title-only" title="Pharmacy / Prescription Details" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
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
          <div class="hero-section">
            <div class="hero-content">
              <router-link to="/app/specialist/pharmacy/prescriptions" class="hero-back">
                <v-icon name="hi-arrow-left" scale="0.75" />
                Prescriptions
              </router-link>
              <h1 class="hero-title">
                <v-icon name="ri-capsule-line" scale="1" />
                {{ prescription.prescription_number || 'Prescription' }}
              </h1>
              <div class="hero-meta">
                <span class="hero-status-badge" :class="prescription.status?.toLowerCase()">
                  {{ formatStatus(prescription.status) }}
                </span>
                <span v-if="prescription.created_at" class="hero-date">
                  <v-icon name="hi-calendar" scale="0.7" />
                  {{ formatDateTime(prescription.created_at) }}
                </span>
              </div>
            </div>
            <div class="hero-right" v-if="prescription.patient">
              <div class="hero-patient-badge">
                <RcAvatar
                  :model-value="prescription.patient?.profile_image"
                  :first-name="getFirstName(prescription.patient?.full_name)"
                  :last-name="getLastName(prescription.patient?.full_name)"
                  size="sm"
                  class="hero-patient-avatar"
                />
                <div class="hero-patient-info">
                  <span class="hero-patient-name">{{ prescription.patient?.full_name }}</span>
                  <span class="hero-patient-label">Patient</span>
                </div>
              </div>
            </div>
          </div>

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

          <!-- Action Buttons -->
          <div v-if="availableActions.length" class="actions-card">
            <button
              v-for="action in availableActions"
              :key="action.id"
              :class="['action-btn', `action-btn--${action.variant}`]"
              :disabled="actionLoading"
              @click="handleAction(action.id)"
            >
              <v-icon :name="action.icon" scale="0.85" />
              {{ action.label }}
            </button>
          </div>

          <!-- Patient Info -->
          <div class="info-card">
            <div class="section-title">
              <v-icon name="hi-user" scale="0.9" />
              <h2>Patient Information</h2>
            </div>
            <div class="patient-row">
              <RcAvatar
                :model-value="prescription.patient?.profile_image"
                :first-name="getFirstName(prescription.patient?.full_name)"
                :last-name="getLastName(prescription.patient?.full_name)"
                size="sm"
              />
              <div class="patient-details">
                <p class="name">{{ prescription.patient?.full_name }}</p>
                <p class="email">
                  <v-icon name="hi-mail" scale="0.65" />
                  {{ prescription.patient?.email }}
                </p>
                <p class="phone">
                  <v-icon name="hi-phone" scale="0.65" />
                  {{ prescription.patient?.phone || 'No phone' }}
                </p>
              </div>
              <router-link
                :to="`/app/specialist/pharmacy/patients/${getPatientId}`"
                class="view-patient-btn"
              >
                View Profile
                <v-icon name="hi-chevron-right" scale="0.7" />
              </router-link>
            </div>
          </div>

          <!-- Linked Records -->
          <div
            v-if="prescription.linked_appointments_populated?.length || prescription.linked_clinical_notes_populated?.length"
            class="info-card"
          >
            <div class="section-title">
              <v-icon name="hi-link" scale="0.9" />
              <h2>Linked Records</h2>
            </div>

            <!-- Linked Appointments -->
            <div v-if="prescription.linked_appointments_populated?.length" class="linked-section">
              <h4 class="linked-section__label">Appointments</h4>
              <div class="linked-items">
                <div
                  v-for="appt in prescription.linked_appointments_populated"
                  :key="appt._id"
                  class="linked-item"
                >
                  <div class="linked-item__icon">
                    <v-icon name="hi-calendar" scale="0.7" />
                  </div>
                  <div class="linked-item__content">
                    <span class="linked-item__date">{{ formatDateTime(appt.start_time) }}</span>
                    <div class="linked-item__tags">
                      <span class="linked-tag">{{ appt.meeting_channel || 'Video' }}</span>
                      <span v-if="appt.category" class="linked-tag">{{ appt.category }}</span>
                      <span v-if="appt.notes_count" class="linked-tag linked-tag--notes">
                        {{ appt.notes_count }} note{{ appt.notes_count > 1 ? 's' : '' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Linked Clinical Notes -->
            <div v-if="prescription.linked_clinical_notes_populated?.length" class="linked-section">
              <h4 class="linked-section__label">Clinical Notes</h4>
              <div class="linked-items">
                <div
                  v-for="note in prescription.linked_clinical_notes_populated"
                  :key="`${note.appointment_id}-${note.note_id}`"
                  class="linked-item linked-item--note"
                  @click="toggleNoteExpand(note.note_id)"
                >
                  <div class="linked-item__icon">
                    <v-icon name="hi-document-text" scale="0.7" />
                  </div>
                  <div class="linked-item__content">
                    <span class="linked-item__date">{{ formatDateTime(note.appointment_date) }}</span>
                    <span
                      class="linked-item__platform"
                      :class="note.platform === 'zoom' ? 'platform--zoom' : 'platform--custom'"
                    >
                      {{ note.platform === 'zoom' ? 'Zoom' : 'Custom' }}
                    </span>
                    <p v-if="expandedNoteIds.includes(note.note_id)" class="linked-item__note-content">
                      {{ note.content }}
                    </p>
                    <p v-else class="linked-item__note-preview">
                      {{ (note.content || '').substring(0, 100) }}{{ (note.content || '').length > 100 ? '...' : '' }}
                    </p>
                  </div>
                  <v-icon
                    :name="expandedNoteIds.includes(note.note_id) ? 'hi-chevron-up' : 'hi-chevron-down'"
                    scale="0.7"
                    class="linked-item__expand"
                  />
                </div>
              </div>
            </div>

            <!-- Manage Links Button -->
            <button
              v-if="['draft', 'pending_payment'].includes(prescription.status?.toLowerCase())"
              class="manage-links-btn"
              @click="showManageLinksDialog = true"
            >
              <v-icon name="hi-pencil" scale="0.7" />
              Manage Links
            </button>
          </div>

          <!-- Medications -->
          <div class="info-card">
            <div class="section-title">
              <v-icon name="ri-capsule-line" scale="0.9" />
              <h2>Medications ({{ prescription.items?.length || 0 }})</h2>
            </div>
            <div class="medications-list">
              <div
                v-for="(item, index) in prescription.items"
                :key="index"
                class="medication-item"
              >
                <div class="medication-item__accent" />
                <div class="medication-item__body">
                  <div class="medication-item__header">
                    <div class="medication-info">
                      <h4>{{ item.drug_name }}</h4>
                      <p class="generic">{{ item.generic_name || item.drug_snapshot?.generic_name }} | {{ item.drug_strength || item.drug_snapshot?.strength }}</p>
                      <p v-if="item.manufacturer || item.drug_snapshot?.manufacturer" class="manufacturer">
                        {{ item.manufacturer || item.drug_snapshot?.manufacturer }}
                      </p>
                    </div>
                    <div class="medication-price">
                      <span class="qty">x{{ item.quantity }}</span>
                      <span class="price">NGN {{ formatCurrency(item.unit_price * item.quantity) }}</span>
                    </div>
                  </div>
                  <div class="medication-item__dosage">
                    <div v-if="item.dosage" class="dosage-tag">
                      <v-icon name="ri-capsule-line" scale="0.65" />
                      {{ item.dosage }}
                    </div>
                    <div v-if="item.frequency" class="dosage-tag">
                      <v-icon name="hi-clock" scale="0.65" />
                      {{ item.frequency }}
                    </div>
                    <div v-if="item.duration" class="dosage-tag">
                      <v-icon name="hi-calendar" scale="0.65" />
                      {{ item.duration }}
                    </div>
                  </div>
                  <div v-if="item.instructions || item.notes" class="medication-item__instructions">
                    <v-icon name="hi-information-circle" scale="0.7" />
                    <span>{{ item.instructions || item.notes }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="info-card">
            <div class="section-title">
              <v-icon name="hi-credit-card" scale="0.9" />
              <h2>Payment Information</h2>
            </div>
            <div class="payment-breakdown">
              <div class="payment-line">
                <span>Subtotal</span>
                <span>NGN {{ formatCurrency(prescription.subtotal) }}</span>
              </div>
              <div v-if="prescription.delivery_fee" class="payment-line">
                <span>Delivery Fee</span>
                <span>NGN {{ formatCurrency(prescription.delivery_fee) }}</span>
              </div>
              <div class="payment-line payment-line--total">
                <span>Total Amount</span>
                <span>NGN {{ formatCurrency(prescription.total_amount) }}</span>
              </div>
            </div>
            <div class="payment-meta">
              <div class="payment-meta__item">
                <span class="label">Payment Method</span>
                <span class="value">{{ formatPaymentMethod(prescription.payment_method) }}</span>
              </div>
              <div class="payment-meta__item">
                <span class="label">Payment Status</span>
                <PharmacyStatusBadge
                  :status="getPaymentStatusClass(prescription.payment_status)"
                  :label="formatPaymentStatus(prescription.payment_status)"
                />
              </div>
            </div>
            <div v-if="prescription.linked_pharmacy_order_number" class="linked-order">
              <v-icon name="hi-link" scale="0.8" />
              <div>
                <span class="linked-order__number">{{ prescription.linked_pharmacy_order_number }}</span>
                <span class="linked-order__note">Patient paid via pharmacy checkout</span>
              </div>
            </div>
          </div>

          <!-- Delivery Info -->
          <div v-if="prescription.delivery" class="info-card">
            <div class="section-title">
              <v-icon name="hi-truck" scale="0.9" />
              <h2>Delivery Information</h2>
            </div>
            <div class="delivery-grid">
              <div class="delivery-item">
                <span class="label">Delivery Type</span>
                <span class="value">{{ prescription.delivery.type === 'PICKUP' ? 'Pickup at Clinic' : 'Home Delivery' }}</span>
              </div>
              <div v-if="prescription.delivery.address" class="delivery-item">
                <span class="label">Address</span>
                <span class="value">{{ prescription.delivery.address }}</span>
              </div>
              <div v-if="prescription.delivery.tracking_number" class="delivery-item">
                <span class="label">Tracking Number</span>
                <span class="value tracking">{{ prescription.delivery.tracking_number }}</span>
              </div>
              <div v-if="prescription.delivery.carrier" class="delivery-item">
                <span class="label">Carrier</span>
                <span class="value">{{ prescription.delivery.carrier }}</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="prescription.notes" class="info-card">
            <div class="section-title">
              <v-icon name="hi-annotation" scale="0.9" />
              <h2>Notes</h2>
            </div>
            <div class="notes-content">
              <p class="notes-text">{{ prescription.notes }}</p>
            </div>
          </div>

          <!-- Dates -->
          <div class="info-card">
            <div class="section-title">
              <v-icon name="hi-calendar" scale="0.9" />
              <h2>Timeline</h2>
            </div>
            <div class="dates-grid">
              <div class="date-item">
                <span class="label">Created</span>
                <span class="value">{{ formatDateTime(prescription.created_at) }}</span>
              </div>
              <div v-if="prescription.updated_at" class="date-item">
                <span class="label">Last Updated</span>
                <span class="value">{{ formatDateTime(prescription.updated_at) }}</span>
              </div>
              <div v-if="prescription.reservation_expires_at" class="date-item">
                <span class="label">Reservation Expires</span>
                <span class="value value--warning">{{ formatDateTime(prescription.reservation_expires_at) }}</span>
              </div>
            </div>
          </div>
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
import TopBar from '@/components/Navigation/top-bar';
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
.page-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  padding: 0 128px;

  @include responsive(tab-portrait) {
    padding: 0;
  }

  @include responsive(phone) {
    padding: 0;
  }

  &__body {
    width: 100%;
    padding: $size-24 $size-32;
    overflow-y: auto;

    @include responsive(phone) {
      padding: $size-16;
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

.prescription-details-container {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: $size-24;
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
.hero-section {
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: $size-20;
  padding: $size-24 $size-28;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(14, 174, 196, 0.25);
  color: white;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  @include responsive(tab-portrait) {
    flex-direction: column;
    align-items: flex-start;
    gap: $size-16;
    padding: $size-20;
    border-radius: $size-16;
  }

  @include responsive(phone) {
    padding: $size-16;
    border-radius: $size-12;
  }

  .hero-content {
    z-index: 1;

    .hero-back {
      display: inline-flex;
      align-items: center;
      gap: $size-4;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      font-size: $size-12;
      font-weight: $fw-medium;
      padding: $size-4 $size-10;
      border-radius: $size-8;
      cursor: pointer;
      margin-bottom: $size-12;
      transition: background 0.2s;
      text-decoration: none;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    .hero-title {
      display: flex;
      align-items: center;
      gap: $size-8;
      font-size: $size-20;
      font-weight: $fw-bold;
      margin-bottom: $size-8;

      @include responsive(phone) {
        font-size: $size-18;
      }
    }

    .hero-meta {
      display: flex;
      align-items: center;
      gap: $size-12;
      flex-wrap: wrap;

      .hero-status-badge {
        font-size: $size-11;
        font-weight: $fw-semi-bold;
        padding: $size-4 $size-10;
        border-radius: $size-6;
        background: rgba(255, 255, 255, 0.2);
        text-transform: capitalize;

        &.delivered { background: rgba(16, 185, 129, 0.3); }
        &.cancelled { background: rgba(239, 68, 68, 0.3); }
        &.paid, &.processing { background: rgba(59, 130, 246, 0.3); }
        &.dispensed, &.shipped { background: rgba(139, 92, 246, 0.3); }
        &.pending_payment { background: rgba(245, 158, 11, 0.3); }
      }

      .hero-date {
        display: flex;
        align-items: center;
        gap: $size-4;
        font-size: $size-12;
        opacity: 0.85;
      }
    }
  }

  .hero-right {
    z-index: 1;

    .hero-patient-badge {
      display: flex;
      align-items: center;
      gap: $size-10;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: $size-10;
      padding: $size-8 $size-14;

      .hero-patient-avatar {
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        flex-shrink: 0;
      }

      .hero-patient-info {
        display: flex;
        flex-direction: column;

        .hero-patient-name {
          font-size: $size-13;
          font-weight: $fw-semi-bold;
        }

        .hero-patient-label {
          font-size: $size-11;
          opacity: 0.75;
        }
      }
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
    color: #0EAEC4;
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
  background: $color-white;
  padding: $size-20 $size-24;
  border-radius: $size-16;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

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
      background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
      color: $color-white;
      box-shadow: 0 2px 6px rgba(#0EAEC4, 0.3);
    }

    .pipeline-step__label {
      color: #0891b2;
      font-weight: $fw-semi-bold;
    }

    .pipeline-step__connector {
      background: linear-gradient(90deg, #0EAEC4, #0891b2);
    }
  }

  &.current {
    .pipeline-step__marker {
      background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
      color: $color-white;
      box-shadow: 0 0 0 4px rgba(#0EAEC4, 0.2), 0 2px 8px rgba(#0EAEC4, 0.3);
      transform: scale(1.1);
    }

    .pipeline-step__label {
      color: #0EAEC4;
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

// Action Buttons
.actions-card {
  display: flex;
  gap: $size-10;
  flex-wrap: wrap;
  padding: $size-16 $size-20;
  background: $color-white;
  border-radius: $size-16;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: $size-8;
  padding: $size-10 $size-20;
  border-radius: $size-10;
  font-size: $size-14;
  font-weight: $fw-semi-bold;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: rgba(14, 174, 196, 0.1);
    color: #0EAEC4;

    &:hover:not(:disabled) {
      background: rgba(14, 174, 196, 0.18);
    }
  }

  &--success {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;

    &:hover:not(:disabled) {
      background: rgba(16, 185, 129, 0.18);
    }
  }

  &--danger {
    background: rgba(#ef4444, 0.08);
    color: #dc2626;
    border: 1px solid rgba(#ef4444, 0.2);

    &:hover:not(:disabled) {
      background: rgba(#ef4444, 0.14);
      border-color: rgba(#ef4444, 0.35);
    }
  }
}

// Info Card
.info-card {
  background: $color-white;
  padding: $size-24;
  border-radius: $size-16;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  @include responsive(phone) {
    padding: $size-16;
  }
}

// Patient Row
.patient-row {
  display: flex;
  align-items: center;
  gap: $size-16;
  padding: $size-16;
  background: rgba(#0EAEC4, 0.03);
  border-radius: $size-12;
  border: 1px solid rgba(#0EAEC4, 0.08);

  @include responsive(phone) {
    flex-wrap: wrap;
  }
}

.patient-details {
  flex: 1;
  min-width: 0;

  .name {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-4;
  }

  .email, .phone {
    display: flex;
    align-items: center;
    gap: $size-6;
    font-size: $size-12;
    color: $color-g-54;
    margin-top: $size-2;

    svg {
      color: #0EAEC4;
    }
  }
}

.view-patient-btn {
  display: flex;
  align-items: center;
  gap: $size-4;
  font-size: $size-13;
  color: #0EAEC4;
  text-decoration: none;
  font-weight: $fw-semi-bold;
  white-space: nowrap;
  padding: $size-8 $size-14;
  background: rgba(#0EAEC4, 0.06);
  border-radius: $size-8;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(#0EAEC4, 0.12);
  }
}

// Medications
.medications-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.medication-item {
  display: flex;
  border-radius: $size-12;
  overflow: hidden;
  border: 1px solid $color-g-92;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(#0EAEC4, 0.25);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &__accent {
    width: 4px;
    background: linear-gradient(180deg, #0EAEC4 0%, #0891b2 100%);
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    padding: $size-16;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-10;

    .medication-info {
      h4 {
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
        margin-bottom: $size-2;
      }

      .generic {
        font-size: $size-12;
        color: $color-g-54;
      }

      .manufacturer {
        font-size: $size-12;
        color: $color-g-67;
        margin-top: $size-2;
      }
    }

    .medication-price {
      text-align: right;

      .qty {
        display: block;
        font-size: $size-12;
        color: $color-g-54;
        margin-bottom: $size-2;
      }

      .price {
        font-size: $size-15;
        font-weight: $fw-bold;
        color: #0EAEC4;
      }
    }
  }

  &__dosage {
    display: flex;
    flex-wrap: wrap;
    gap: $size-8;
    margin-bottom: $size-8;

    .dosage-tag {
      display: flex;
      align-items: center;
      gap: $size-4;
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: rgba(#0EAEC4, 0.06);
      border-radius: $size-8;
      color: #0891b2;
      font-weight: $fw-medium;

      svg {
        color: #0EAEC4;
      }
    }
  }

  &__instructions {
    display: flex;
    align-items: flex-start;
    gap: $size-8;
    font-size: $size-12;
    color: $color-g-54;
    font-style: italic;
    line-height: 1.5;
    padding: $size-10 $size-12;
    background: $color-g-97;
    border-radius: $size-8;
    border-left: 3px solid rgba(#0EAEC4, 0.4);

    svg {
      color: #0EAEC4;
      flex-shrink: 0;
      margin-top: 1px;
    }
  }
}

// Payment
.payment-breakdown {
  margin-bottom: $size-16;
  padding: $size-16;
  background: $color-g-97;
  border-radius: $size-12;
}

.payment-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $size-8 0;
  font-size: $size-14;
  color: $color-g-44;

  &--total {
    padding-top: $size-14;
    margin-top: $size-10;
    border-top: 2px solid $color-g-92;
    font-size: $size-18;
    font-weight: $fw-bold;
    color: #0EAEC4;
  }
}

.payment-meta {
  display: flex;
  gap: $size-24;

  @include responsive(phone) {
    flex-direction: column;
    gap: $size-12;
  }

  &__item {
    .label {
      display: block;
      font-size: $size-12;
      color: $color-g-54;
      margin-bottom: $size-6;
    }

    .value {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }
}

.linked-order {
  display: flex;
  align-items: center;
  gap: $size-12;
  margin-top: $size-16;
  padding: $size-14;
  background: rgba(#3b82f6, 0.05);
  border-radius: $size-12;
  border: 1px solid rgba(#3b82f6, 0.15);

  svg {
    color: #3b82f6;
  }

  &__number {
    display: block;
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    color: #2563eb;
  }

  &__note {
    display: block;
    font-size: $size-12;
    color: $color-g-54;
    margin-top: $size-2;
  }
}

// Delivery
.delivery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-16;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.delivery-item {
  display: flex;
  flex-direction: column;
  gap: $size-6;
  padding: $size-14;
  background: $color-g-97;
  border-radius: $size-10;

  .label {
    font-size: $size-12;
    color: $color-g-54;
    font-weight: $fw-medium;
  }

  .value {
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    color: $color-g-21;

    &.tracking {
      color: #0EAEC4;
      font-family: monospace;
      letter-spacing: 0.5px;
    }
  }
}

// Notes
.notes-content {
  padding: $size-14;
  background: $color-g-97;
  border-radius: $size-10;
  border-left: 4px solid rgba(#0EAEC4, 0.4);
}

.notes-text {
  font-size: $size-14;
  color: $color-g-44;
  line-height: 1.7;
}

// Dates
.dates-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-14;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.date-item {
  display: flex;
  flex-direction: column;
  gap: $size-6;
  padding: $size-14;
  background: $color-g-97;
  border-radius: $size-10;

  .label {
    font-size: $size-12;
    color: $color-g-54;
    font-weight: $fw-medium;
  }

  .value {
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    color: $color-g-21;

    &--warning {
      color: #d97706;
    }
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
      border-color: #0EAEC4;
      box-shadow: 0 0 0 3px rgba(#0EAEC4, 0.1);
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
