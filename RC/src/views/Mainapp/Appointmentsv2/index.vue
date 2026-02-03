<template>
  <div class="appointmentsv2-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="mobile-menu-btn" @click="openSideNav">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="mobile-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" class="logo-img" />
        <span class="logo-text">Rapid Capsule</span>
      </div>
      <button class="mobile-bell-btn">
        <v-icon name="hi-bell" scale="1.1" />
        <span class="notification-dot"></span>
      </button>
    </header>

    <!-- Decorative Background -->
    <div class="bg-decoration">
      <div class="gradient-overlay"></div>
      <div class="blur-circle"></div>
    </div>

    <div class="page-content">
      <!-- Hero Banner -->
      <div class="hero-banner">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">My Appointments</h1>
            <p class="hero-subtitle">Manage your healthcare consultations with ease</p>
          </div>
          <div class="hero-actions">
            <router-link to="/app/patient/appointmentsv2/book" class="hero-cta">
              <v-icon name="hi-plus" scale="0.9" />
              <span>Book Appointment</span>
            </router-link>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.upcoming }}</span>
            <span class="stat-label">Upcoming</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.completed }}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div v-if="stats.missed > 0" class="stat-item">
            <span class="stat-value missed">{{ stats.missed }}</span>
            <span class="stat-label">Missed</span>
          </div>
        </div>
      </div>

      <!-- Tabs & Filters -->
      <div class="tabs-filters">
        <div class="tabs-row">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="tab-btn"
            :class="{ active: activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }} <span v-if="tab.count !== undefined">({{ tab.count }})</span>
          </button>
        </div>
        <div class="filters-row">
          <div class="search-box">
            <v-icon name="hi-search" scale="0.8" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search doctor or specialty..."
              class="search-input"
            />
          </div>
          <button class="filter-btn" @click="toggleFilters">
            <v-icon name="hi-sort-descending" scale="0.85" />
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <loader :useOverlay="false" style="position: relative" />
        <span>Loading appointments...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredAppointments.length === 0" class="empty-state">
        <div class="empty-icon">
          <v-icon name="hi-calendar" scale="2.5" />
        </div>
        <h3>No {{ activeTab === 'past' ? 'past' : activeTab }} appointments</h3>
        <p v-if="activeTab === 'upcoming'">
          You don't have any upcoming appointments. Book one now to get started!
        </p>
        <p v-else>
          You don't have any {{ activeTab === 'past' ? 'past' : activeTab }} appointments yet.
        </p>
        <router-link
          v-if="activeTab === 'upcoming'"
          to="/app/patient/appointmentsv2/book"
          class="book-empty-btn"
        >
          <v-icon name="hi-plus" scale="0.85" />
          Book Your First Appointment
        </router-link>
      </div>

      <!-- Appointments List -->
      <div v-else class="appointments-list">
        <AppointmentCard
          v-for="apt in filteredAppointments"
          :key="apt._id || apt.id"
          :appointment="apt"
          :is-past="activeTab === 'past' || activeTab === 'missed'"
          :prescriptions="getAppointmentPrescriptions(apt._id || apt.id)"
          @join="joinMeeting"
          @reschedule="rescheduleAppointment"
          @cancel="cancelAppointment"
          @view-receipt="viewReceipt"
          @view-prescription="viewPrescription"
          @view-notes="viewNotes"
          @book-again="bookAgain"
          @complete-payment="completePayment"
          @open-action-sheet="openActionSheet"
        />

        <!-- Recent History Section (shown when viewing upcoming) -->
        <template v-if="activeTab === 'upcoming' && recentPastAppointments.length > 0">
          <div class="history-section-header">
            <v-icon name="bi-clock" class="history-icon" />
            <h3>Recent History</h3>
          </div>
          <AppointmentCard
            v-for="apt in recentPastAppointments"
            :key="apt._id || apt.id"
            :appointment="apt"
            :is-past="true"
            :prescriptions="getAppointmentPrescriptions(apt._id || apt.id)"
            @view-prescription="viewPrescription"
            @view-notes="viewNotes"
            @view-receipt="viewReceipt"
            @book-again="bookAgain"
            @open-action-sheet="openActionSheet"
          />
        </template>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="page-btn nav"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <v-icon name="hi-chevron-left" scale="0.7" />
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          class="page-btn"
          :class="{ active: currentPage === page }"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          class="page-btn nav"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <v-icon name="hi-chevron-right" scale="0.7" />
        </button>
      </div>
    </div>

    <!-- Clinical Notes Modal -->
    <Teleport to="body">
      <div v-if="isNotesModalOpen" class="modal-overlay" @click.self="closeNotesModal">
        <div class="modal-container notes-modal">
          <div class="modal-header">
            <div class="modal-title">
              <v-icon name="hi-document-text" scale="1" class="title-icon" />
              <h2>{{ notesModalTitle }}</h2>
            </div>
            <button class="close-btn" @click="closeNotesModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body">
            <div v-if="notesModalData.length === 0" class="empty-notes">
              <p>No clinical notes available.</p>
            </div>
            <div v-else class="notes-list">
              <div
                v-for="(note, index) in notesModalData"
                :key="note.note_id || index"
                class="note-item"
              >
                <div class="note-header">
                  <span class="note-date">
                    {{ note.created_at ? format(parseISO(note.created_at), 'MMM d, yyyy • h:mm a') : 'Date unknown' }}
                  </span>
                  <span v-if="note.platform" class="note-platform">{{ note.platform }}</span>
                </div>
                <div class="note-content">{{ note.content }}</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeNotesModal">Close</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Mobile FAB Button -->
    <button class="mobile-fab" @click="$router.push('/app/patient/appointmentsv2/book')">
      <v-icon name="hi-plus" scale="1.4" />
    </button>

    <!-- Mobile Bottom Tab Navigation -->
    <nav class="mobile-bottom-nav">
      <router-link to="/app/patient/dashboard" class="tab-item">
        <v-icon name="hi-home" scale="1.1" />
        <span>Home</span>
      </router-link>
      <router-link to="/app/patient/appointmentsv2" class="tab-item active">
        <v-icon name="hi-calendar" scale="1.1" />
        <span>Appointments</span>
      </router-link>
      <router-link to="/app/patient/prescriptions" class="tab-item">
        <v-icon name="gi-medicines" scale="1.1" />
        <span>Rx</span>
      </router-link>
      <router-link to="/app/patient/account" class="tab-item">
        <v-icon name="hi-user" scale="1.1" />
        <span>Profile</span>
      </router-link>
    </nav>

    <!-- Mobile Action Sheet -->
    <Teleport to="body">
      <div v-if="isActionSheetOpen" class="action-sheet-overlay" @click="closeActionSheet">
        <div class="action-sheet" @click.stop :class="{ active: actionSheetAnimated }">
          <div class="action-sheet-handle"></div>
          <div class="action-sheet-content">
            <h3 class="action-sheet-title">Manage Appointment</h3>
            <div class="action-sheet-options">
              <button class="action-option" @click="handleActionSheetOption('reschedule')">
                <v-icon name="hi-calendar" scale="1" />
                <span>Reschedule</span>
              </button>
              <button class="action-option" @click="handleActionSheetOption('receipt')">
                <v-icon name="hi-receipt-tax" scale="1" />
                <span>View Receipt</span>
              </button>
              <button class="action-option danger" @click="handleActionSheetOption('cancel')">
                <v-icon name="hi-x-circle" scale="1" />
                <span>Cancel Appointment</span>
              </button>
            </div>
            <button class="action-sheet-close" @click="closeActionSheet">Close</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Prescriptions Modal -->
    <Teleport to="body">
      <div v-if="isPrescriptionModalOpen" class="modal-overlay" @click.self="closePrescriptionModal">
        <div class="modal-container prescriptions-modal">
          <div class="modal-header">
            <div class="modal-title">
              <v-icon name="gi-medicines" scale="1" class="title-icon rx-icon" />
              <h2>Linked Prescriptions</h2>
            </div>
            <button class="close-btn" @click="closePrescriptionModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body">
            <div v-if="prescriptionModalData.length === 0" class="empty-prescriptions">
              <p>No prescriptions linked to this appointment.</p>
            </div>
            <div v-else class="prescriptions-list">
              <div
                v-for="rx in prescriptionModalData"
                :key="rx._id"
                class="prescription-item"
                @click="goToPrescriptionDetails(rx._id)"
              >
                <div class="rx-header">
                  <span class="rx-id">{{ rx.prescription_id || `RX-${rx._id?.slice(-6).toUpperCase()}` }}</span>
                  <span class="rx-status" :class="rx.status?.toLowerCase()">{{ rx.status }}</span>
                </div>
                <div class="rx-date">
                  {{ rx.created_at ? format(parseISO(rx.created_at), 'MMM d, yyyy') : '' }}
                </div>
                <div v-if="rx.medications?.length" class="rx-meds">
                  <span class="med-count">{{ rx.medications.length }} medication(s)</span>
                  <ul class="med-list">
                    <li v-for="med in rx.medications.slice(0, 3)" :key="med.drug_name || med.name">
                      {{ med.drug_name || med.name }}
                    </li>
                    <li v-if="rx.medications.length > 3" class="more-meds">
                      +{{ rx.medications.length - 3 }} more...
                    </li>
                  </ul>
                </div>
                <div class="rx-view-link">
                  View Details <v-icon name="hi-arrow-right" scale="0.7" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closePrescriptionModal">Close</button>
            <router-link to="/app/patient/prescriptions" class="btn-primary" @click="closePrescriptionModal">
              View All Prescriptions
            </router-link>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Receipt Modal -->
    <Teleport to="body">
      <div v-if="isReceiptModalOpen && receiptAppointment" class="modal-overlay" @click.self="closeReceiptModal">
        <div class="modal-container receipt-modal">
          <div class="modal-header">
            <div class="modal-title">
              <v-icon name="hi-clipboard-list" scale="1" class="title-icon receipt-icon" />
              <h2>Appointment Receipt</h2>
            </div>
            <button class="close-btn" @click="closeReceiptModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body">
            <!-- Receipt Header -->
            <div class="receipt-header">
              <div class="receipt-logo">
                <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
              </div>
              <div class="receipt-status" :class="receiptAppointment.payment_status?.toLowerCase()">
                {{ receiptAppointment.payment_status === 'SUCCESSFUL' ? 'Paid' : receiptAppointment.payment_status }}
              </div>
            </div>

            <!-- Appointment Details -->
            <div class="receipt-section">
              <h4>Appointment Details</h4>
              <div class="receipt-row">
                <span class="receipt-label">Date</span>
                <span class="receipt-value">
                  {{ receiptAppointment.start_time ? format(parseISO(receiptAppointment.start_time), 'MMMM d, yyyy') : 'N/A' }}
                </span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Time</span>
                <span class="receipt-value">
                  {{ receiptAppointment.start_time ? format(parseISO(receiptAppointment.start_time), 'h:mm a') : 'N/A' }}
                </span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Specialist</span>
                <span class="receipt-value">{{ receiptAppointment.specialist?.full_name || 'N/A' }}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Category</span>
                <span class="receipt-value">{{ receiptAppointment.category || 'N/A' }}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Type</span>
                <span class="receipt-value">{{ receiptAppointment.appointment_type || 'Consultation' }}</span>
              </div>
            </div>

            <!-- Payment Details -->
            <div class="receipt-section">
              <h4>Payment Details</h4>
              <div class="receipt-row">
                <span class="receipt-label">Consultation Fee</span>
                <span class="receipt-value">{{ formatCurrency(receiptAppointment.appointment_fee) }}</span>
              </div>
              <div class="receipt-row total">
                <span class="receipt-label">Total Paid</span>
                <span class="receipt-value">{{ formatCurrency(receiptAppointment.appointment_fee) }}</span>
              </div>
            </div>

            <!-- Receipt Footer Info -->
            <div class="receipt-info">
              <v-icon name="hi-information-circle" scale="0.9" />
              <p>This is your digital receipt for the consultation. For any queries, please contact support.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeReceiptModal">Close</button>
            <button class="btn-primary" @click="downloadReceipt">
              <v-icon name="hi-download" scale="0.85" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reschedule Modal -->
    <Teleport to="body">
      <div v-if="isRescheduleModalOpen && rescheduleTargetAppointment" class="modal-overlay" @click.self="closeRescheduleModal">
        <div class="modal-container reschedule-modal">
          <div class="modal-header">
            <div class="modal-title">
              <v-icon name="hi-calendar" scale="1" class="title-icon" />
              <h2>Reschedule Appointment</h2>
            </div>
            <button class="close-btn" @click="closeRescheduleModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body reschedule-body">
            <!-- Current Appointment Info -->
            <div class="reschedule-current-info">
              <div class="current-info-label">Current Appointment</div>
              <div class="current-info-details">
                <div class="current-specialist">
                  <img
                    v-if="rescheduleTargetAppointment.specialist?.profile?.profile_photo || rescheduleTargetAppointment.specialist?.profile?.profile_image"
                    :src="rescheduleTargetAppointment.specialist.profile.profile_photo || rescheduleTargetAppointment.specialist.profile.profile_image"
                    :alt="rescheduleTargetAppointment.specialist?.full_name"
                    class="specialist-avatar"
                  />
                  <div v-else class="specialist-avatar placeholder">
                    {{ (rescheduleTargetAppointment.specialist?.full_name || 'Dr')[0] }}
                  </div>
                  <div class="specialist-info">
                    <span class="specialist-name">{{ rescheduleTargetAppointment.specialist?.full_name || 'Specialist' }}</span>
                    <span class="specialist-category">{{ rescheduleTargetAppointment.category || 'Consultation' }}</span>
                  </div>
                </div>
                <div class="current-datetime">
                  <v-icon name="hi-calendar" scale="0.8" />
                  <span>
                    {{ rescheduleTargetAppointment.start_time
                      ? format(parseISO(rescheduleTargetAppointment.start_time), 'MMM d, yyyy • h:mm a')
                      : 'Date TBD' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Date Selection -->
            <div class="reschedule-section">
              <h4 class="section-label">Select New Date</h4>
              <div class="date-picker-wrapper">
                <VDatePicker
                  v-model="rescheduleDate"
                  mode="date"
                  :min-date="new Date()"
                  color="sky"
                  is-expanded
                  :attributes="[
                    {
                      key: 'today',
                      highlight: { color: 'blue', fillMode: 'light' },
                      dates: new Date(),
                    }
                  ]"
                />
              </div>
            </div>

            <!-- Time Slots Selection -->
            <div class="reschedule-section">
              <h4 class="section-label">Select New Time</h4>
              <div class="time-slots-container">
                <!-- Loading State -->
                <div v-if="isLoadingTimeSlots" class="time-slots-loading">
                  <loader :useOverlay="false" style="position: relative" />
                  <span>Loading available times...</span>
                </div>

                <!-- No Date Selected -->
                <div v-else-if="!rescheduleDate" class="time-slots-empty">
                  <v-icon name="hi-calendar" scale="1.5" />
                  <p>Select a date to see available time slots</p>
                </div>

                <!-- No Slots Available -->
                <div v-else-if="!Object.values(rescheduleTimeSlots).some(slots => slots.length)" class="time-slots-empty">
                  <v-icon name="hi-exclamation-circle" scale="1.5" />
                  <p>No available time slots for this date</p>
                  <span class="try-another">Please select another date</span>
                </div>

                <!-- Time Slots Grid -->
                <div v-else class="time-slots-grid">
                  <template v-for="(times, dateKey) in rescheduleTimeSlots" :key="dateKey">
                    <template v-if="times.length">
                      <div class="time-slots-date-label">
                        {{ format(new Date(dateKey), 'EEEE, MMM d') }}
                      </div>
                      <div class="time-slots-row">
                        <button
                          v-for="time in times"
                          :key="`${dateKey}-${time}`"
                          class="time-slot-btn"
                          :class="{ selected: rescheduleTime === time }"
                          @click="selectRescheduleTime(dateKey, time)"
                        >
                          {{ time }}
                        </button>
                      </div>
                    </template>
                  </template>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeRescheduleModal" :disabled="isSubmittingReschedule">
              Cancel
            </button>
            <button
              class="btn-primary"
              :disabled="!rescheduleDate || !rescheduleTime || isSubmittingReschedule"
              @click="submitReschedule"
            >
              <template v-if="isSubmittingReschedule">
                <span class="btn-spinner"></span>
                Rescheduling...
              </template>
              <template v-else>
                <v-icon name="hi-check" scale="0.85" />
                Confirm Reschedule
              </template>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Cancel Confirmation Modal -->
    <Teleport to="body">
      <div v-if="isCancelModalOpen && cancelTargetAppointment" class="modal-overlay" @click.self="closeCancelModal">
        <div class="modal-container cancel-modal">
          <div class="modal-header">
            <div class="modal-title">
              <v-icon name="hi-exclamation-circle" scale="1" class="title-icon cancel-icon" />
              <h2>Cancel Appointment</h2>
            </div>
            <button class="close-btn" @click="closeCancelModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body cancel-body">
            <!-- Warning Message -->
            <div class="cancel-warning">
              <v-icon name="hi-exclamation" scale="1.2" />
              <p>Are you sure you want to cancel this appointment?</p>
            </div>

            <!-- Appointment Details -->
            <div class="cancel-appointment-info">
              <div class="cancel-specialist">
                <img
                  v-if="cancelTargetAppointment.specialist?.profile?.profile_photo || cancelTargetAppointment.specialist?.profile?.profile_image"
                  :src="cancelTargetAppointment.specialist.profile.profile_photo || cancelTargetAppointment.specialist.profile.profile_image"
                  :alt="cancelTargetAppointment.specialist?.full_name"
                  class="specialist-avatar"
                />
                <div v-else class="specialist-avatar placeholder">
                  {{ (cancelTargetAppointment.specialist?.full_name || 'Dr')[0] }}
                </div>
                <div class="specialist-info">
                  <span class="specialist-name">{{ cancelTargetAppointment.specialist?.full_name || 'Specialist' }}</span>
                  <span class="specialist-category">{{ cancelTargetAppointment.category || 'Consultation' }}</span>
                </div>
              </div>
              <div class="cancel-datetime">
                <v-icon name="hi-calendar" scale="0.8" />
                <span>
                  {{ cancelTargetAppointment.start_time
                    ? format(parseISO(cancelTargetAppointment.start_time), 'EEEE, MMM d, yyyy • h:mm a')
                    : 'Date TBD' }}
                </span>
              </div>
            </div>

            <!-- Cancellation Notice -->
            <div class="cancel-notice">
              <v-icon name="hi-information-circle" scale="0.9" />
              <p>This action cannot be undone. If you need to reschedule instead, please use the reschedule option.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeCancelModal" :disabled="isSubmittingCancel">
              Keep Appointment
            </button>
            <button
              class="btn-danger"
              :disabled="isSubmittingCancel"
              @click="confirmCancelAppointment"
            >
              <template v-if="isSubmittingCancel">
                <span class="btn-spinner danger"></span>
                Cancelling...
              </template>
              <template v-else>
                <v-icon name="hi-x-circle" scale="0.85" />
                Yes, Cancel Appointment
              </template>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch, nextTick, defineEmits, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { format, parseISO, isToday, isTomorrow, isYesterday, differenceInDays } from 'date-fns';
import { useToast } from 'vue-toast-notification';
import Loader from '@/components/Loader/main-loader.vue';
import AppointmentCard from './components/AppointmentCard.vue';

const router = useRouter();
const route = useRoute();
const $http = inject('$_HTTP');
const $toast = useToast();

// Payment verification state
const isVerifyingPayment = ref(false);

// Emit for parent component to open side nav
const emit = defineEmits(['open-side-nav']);

// Mobile action sheet state
const isActionSheetOpen = ref(false);
const actionSheetAnimated = ref(false);
const actionSheetAppointment = ref(null);

const openSideNav = () => {
  emit('open-side-nav');
};

const openActionSheet = (apt) => {
  actionSheetAppointment.value = apt;
  isActionSheetOpen.value = true;
  nextTick(() => {
    setTimeout(() => {
      actionSheetAnimated.value = true;
    }, 10);
  });
};

const closeActionSheet = () => {
  actionSheetAnimated.value = false;
  setTimeout(() => {
    isActionSheetOpen.value = false;
    actionSheetAppointment.value = null;
  }, 300);
};

const handleActionSheetOption = (action) => {
  const apt = actionSheetAppointment.value;
  closeActionSheet();

  switch (action) {
    case 'reschedule':
      rescheduleAppointment(apt);
      break;
    case 'receipt':
      viewReceipt(apt);
      break;
    case 'cancel':
      cancelAppointment(apt);
      break;
  }
};

const appointments = ref([]);
const missedAppointments = ref([]); // Separate store for missed appointments from API
const isLoading = ref(false);
const activeTab = ref('upcoming');
const searchQuery = ref('');
const showFilters = ref(false);
const currentPage = ref(1);
const itemsPerPage = 10;

// Prescription mapping: appointmentId -> prescriptions[]
const appointmentPrescriptionMap = ref({});

// Notes quick-view modal
const isNotesModalOpen = ref(false);
const notesModalData = ref([]);
const notesModalTitle = ref('');

// Prescription quick-view modal
const isPrescriptionModalOpen = ref(false);
const prescriptionModalData = ref([]);

// Receipt modal
const isReceiptModalOpen = ref(false);
const receiptAppointment = ref(null);

// Reschedule modal
const isRescheduleModalOpen = ref(false);
const rescheduleTargetAppointment = ref(null);
const rescheduleDate = ref(null);
const rescheduleTime = ref('');
const rescheduleTimeSlots = ref({});
const isLoadingTimeSlots = ref(false);
const isSubmittingReschedule = ref(false);

// Cancel modal
const isCancelModalOpen = ref(false);
const cancelTargetAppointment = ref(null);
const isSubmittingCancel = ref(false);

// Stats for hero banner
const stats = ref({
  total: 0,
  upcoming: 0,
  completed: 0,
  missed: 0,
});

const tabs = computed(() => [
  { label: 'Upcoming', value: 'upcoming', count: upcomingCount.value },
  { label: 'Past Visits', value: 'past', count: pastCount.value },
  { label: 'Missed', value: 'missed', count: missedCount.value },
  { label: 'Cancelled', value: 'cancelled', count: cancelledCount.value },
]);

// Ensure appointments is always an array
const appointmentsList = computed(() => {
  const val = appointments.value;
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object' && Array.isArray(val.data)) return val.data;
  return [];
});

// Status mapping for backend uppercase values
const normalizeStatus = (status) => {
  if (!status) return '';
  const upper = status.toUpperCase();
  const map = {
    'OPEN': 'Confirmed',
    'CONFIRMED': 'Confirmed',
    'PENDING': 'Pending',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
    'FAILED': 'Failed',
    'ONGOING': 'Ongoing',
    'RESCHEDULED': 'Rescheduled',
  };
  return map[upper] || status;
};

// Check if an appointment ID is in the missed appointments list (fetched from API)
const isMissedAppointmentId = (aptId) => {
  return missedAppointments.value.some(m => (m._id || m.id) === aptId);
};

const upcomingCount = computed(() =>
  appointmentsList.value.filter(apt => {
    // Exclude missed appointments from upcoming count
    if (isMissedAppointmentId(apt._id || apt.id)) return false;

    const rawStatus = (apt.status || '').toUpperCase();
    // Include scheduled appointments that haven't happened yet
    return ['PENDING', 'OPEN', 'ONGOING', 'RESCHEDULED'].includes(rawStatus);
  }).length
);

const pastCount = computed(() =>
  appointmentsList.value.filter(apt => (apt.status || '').toUpperCase() === 'COMPLETED').length
);

const missedCount = computed(() => missedAppointments.value.length);

const cancelledCount = computed(() =>
  appointmentsList.value.filter(apt => {
    const rawStatus = (apt.status || '').toUpperCase();
    return ['CANCELLED', 'FAILED'].includes(rawStatus);
  }).length
);

const searchedAppointments = computed(() => {
  try {
    const list = appointmentsList.value;
    if (!Array.isArray(list)) return [];
    if (!searchQuery.value || !searchQuery.value.trim()) return list;

    const query = searchQuery.value.toLowerCase().trim();
    return list.filter(apt => {
      try {
        if (!apt) return false;
        const doctorName = String(apt.specialist?.full_name || apt.specialist?.profile?.first_name || '').toLowerCase();
        const specialtyRaw = apt.specialist?.professional_practice;
        // Handle if professional_practice is an object
        const specialty = String(
          typeof specialtyRaw === 'object' && specialtyRaw !== null
            ? (specialtyRaw.area_of_specialty || specialtyRaw.category || '')
            : (specialtyRaw || apt.category || '')
        ).toLowerCase();
        return doctorName.includes(query) || specialty.includes(query);
      } catch {
        return false;
      }
    });
  } catch (error) {
    console.error('Error in searchedAppointments:', error);
    return appointmentsList.value || [];
  }
});

const filteredAppointments = computed(() => {
  try {
    let filtered;

    if (activeTab.value === 'missed') {
      // For missed tab, use the separately fetched missed appointments
      filtered = Array.isArray(missedAppointments.value) ? [...missedAppointments.value] : [];

      // Apply search filter
      if (searchQuery.value && searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim();
        filtered = filtered.filter(apt => {
          try {
            if (!apt) return false;
            const doctorName = String(apt.specialist?.full_name || apt.specialist?.profile?.first_name || '').toLowerCase();
            const specialtyRaw = apt.specialist?.professional_practice;
            const specialty = String(
              typeof specialtyRaw === 'object' && specialtyRaw !== null
                ? (specialtyRaw.area_of_specialty || specialtyRaw.category || '')
                : (specialtyRaw || apt.category || '')
            ).toLowerCase();
            return doctorName.includes(query) || specialty.includes(query);
          } catch {
            return false;
          }
        });
      }
    } else {
      const list = searchedAppointments.value || [];
      switch (activeTab.value) {
        case 'upcoming':
          filtered = list.filter(apt => {
            if (!apt) return false;
            // Exclude missed appointments from upcoming
            if (isMissedAppointmentId(apt._id || apt.id)) return false;
            const rawStatus = (apt.status || '').toUpperCase();
            return ['PENDING', 'OPEN', 'ONGOING', 'RESCHEDULED'].includes(rawStatus);
          });
          break;
        case 'past':
          filtered = list.filter(apt => apt && (apt.status || '').toUpperCase() === 'COMPLETED');
          break;
        case 'cancelled':
          filtered = list.filter(apt => {
            if (!apt) return false;
            const rawStatus = (apt.status || '').toUpperCase();
            return ['CANCELLED', 'FAILED'].includes(rawStatus);
          });
          break;
        default:
          filtered = list;
      }
    }

    // Sort by date (most recent first for past/missed, soonest first for upcoming)
    if (Array.isArray(filtered)) {
      filtered.sort((a, b) => {
        try {
          const dateA = new Date(a?.start_time || a?.date || 0);
          const dateB = new Date(b?.start_time || b?.date || 0);
          return ['past', 'missed'].includes(activeTab.value) ? dateB - dateA : dateA - dateB;
        } catch {
          return 0;
        }
      });
    } else {
      filtered = [];
    }

    // Paginate
    const start = (currentPage.value - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  } catch (error) {
    console.error('Error in filteredAppointments:', error);
    return [];
  }
});

// Recent past appointments to show in upcoming tab
const recentPastAppointments = computed(() => {
  try {
    if (activeTab.value !== 'upcoming') return [];
    const list = appointmentsList.value;
    if (!Array.isArray(list)) return [];
    const past = list
      .filter(apt => apt && (apt.status || '').toUpperCase() === 'COMPLETED')
      .sort((a, b) => {
        try {
          return new Date(b?.start_time || b?.date || 0) - new Date(a?.start_time || a?.date || 0);
        } catch {
          return 0;
        }
      });
    return past.slice(0, 2); // Show last 2
  } catch (error) {
    console.error('Error in recentPastAppointments:', error);
    return [];
  }
});

const totalFilteredCount = computed(() => {
  try {
    if (activeTab.value === 'missed') {
      // For missed tab, count from missedAppointments
      const missedList = Array.isArray(missedAppointments.value) ? missedAppointments.value : [];
      if (!searchQuery.value || !searchQuery.value.trim()) return missedList.length;

      const query = searchQuery.value.toLowerCase().trim();
      return missedList.filter(apt => {
        try {
          if (!apt) return false;
          const doctorName = String(apt.specialist?.full_name || apt.specialist?.profile?.first_name || '').toLowerCase();
          const specialtyRaw = apt.specialist?.professional_practice;
          const specialty = String(
            typeof specialtyRaw === 'object' && specialtyRaw !== null
              ? (specialtyRaw.area_of_specialty || specialtyRaw.category || '')
              : (specialtyRaw || apt.category || '')
          ).toLowerCase();
          return doctorName.includes(query) || specialty.includes(query);
        } catch {
          return false;
        }
      }).length;
    }

    const list = searchedAppointments.value || [];
    switch (activeTab.value) {
      case 'upcoming':
        return list.filter(apt => {
          if (!apt) return false;
          if (isMissedAppointmentId(apt._id || apt.id)) return false;
          const rawStatus = (apt.status || '').toUpperCase();
          return ['PENDING', 'OPEN', 'ONGOING', 'RESCHEDULED'].includes(rawStatus);
        }).length;
      case 'past':
        return list.filter(apt => apt && (apt.status || '').toUpperCase() === 'COMPLETED').length;
      case 'cancelled':
        return list.filter(apt => {
          if (!apt) return false;
          const rawStatus = (apt.status || '').toUpperCase();
          return ['CANCELLED', 'FAILED'].includes(rawStatus);
        }).length;
      default:
        return list.length;
    }
  } catch (error) {
    console.error('Error in totalFilteredCount:', error);
    return 0;
  }
});

const totalPages = computed(() => Math.ceil(totalFilteredCount.value / itemsPerPage));

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Reset page when tab changes
watch(activeTab, () => {
  currentPage.value = 1;
});

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const joinMeeting = (apt) => {
  if (apt.join_url) {
    window.open(apt.join_url, '_blank');
  } else if (apt.meeting_link) {
    window.open(apt.meeting_link, '_blank');
  } else {
    router.push({
      name: 'Meetings',
      params: {
        specialistId: apt.specialist?._id || apt.specialist?.id,
        meetingId: apt._id || apt.id,
      },
    });
  }
};

const rescheduleAppointment = (apt) => {
  rescheduleTargetAppointment.value = apt;
  rescheduleDate.value = null;
  rescheduleTime.value = '';
  rescheduleTimeSlots.value = {};
  isRescheduleModalOpen.value = true;
};

const closeRescheduleModal = () => {
  isRescheduleModalOpen.value = false;
  rescheduleTargetAppointment.value = null;
  rescheduleDate.value = null;
  rescheduleTime.value = '';
  rescheduleTimeSlots.value = {};
};

// Watch for date changes to fetch available time slots
watch(rescheduleDate, async (newDate) => {
  if (!newDate) {
    rescheduleTimeSlots.value = {};
    rescheduleTime.value = '';
    return;
  }

  // Ensure we have a target appointment with a specialist
  if (!rescheduleTargetAppointment.value?.specialist) {
    console.error('No specialist found for reschedule');
    rescheduleTimeSlots.value = {};
    return;
  }

  isLoadingTimeSlots.value = true;
  rescheduleTime.value = '';

  try {
    const formattedDate = format(newDate, 'yyyy-MM-dd');
    const specialistId = rescheduleTargetAppointment.value.specialist._id ||
                         rescheduleTargetAppointment.value.specialist.id ||
                         rescheduleTargetAppointment.value.specialist;

    const payload = {
      preferredDates: [{ date: formattedDate }],
      specialistId: specialistId,
    };
    const response = await $http.$_getAvailableTimes(payload);
    rescheduleTimeSlots.value = response.data?.data || {};
  } catch (error) {
    console.error('Error fetching time slots:', error);
    rescheduleTimeSlots.value = {};
    $toast.error('Failed to load available time slots');
  } finally {
    isLoadingTimeSlots.value = false;
  }
});

const selectRescheduleTime = (dateKey, time) => {
  rescheduleTime.value = time;
  rescheduleDate.value = new Date(dateKey);
};

const submitReschedule = async () => {
  if (!rescheduleTargetAppointment.value || !rescheduleDate.value || !rescheduleTime.value) {
    $toast.error('Please select a date and time');
    return;
  }

  isSubmittingReschedule.value = true;

  try {
    const payload = {
      appointmentId: rescheduleTargetAppointment.value._id || rescheduleTargetAppointment.value.id,
      date: format(rescheduleDate.value, 'yyyy-MM-dd'),
      time: rescheduleTime.value,
      meeting_channel: rescheduleTargetAppointment.value.meeting_channel || 'zoom',
    };

    await $http.$_rescheduleAppointments(payload);
    $toast.success('Appointment rescheduled successfully!');
    closeRescheduleModal();
    // Refresh appointments list
    fetchAppointments();
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    $toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
  } finally {
    isSubmittingReschedule.value = false;
  }
};

const cancelAppointment = (apt) => {
  cancelTargetAppointment.value = apt;
  isCancelModalOpen.value = true;
};

const closeCancelModal = () => {
  isCancelModalOpen.value = false;
  cancelTargetAppointment.value = null;
};

const confirmCancelAppointment = async () => {
  if (!cancelTargetAppointment.value) return;

  isSubmittingCancel.value = true;

  try {
    const payload = {
      appointmentId: cancelTargetAppointment.value._id || cancelTargetAppointment.value.id,
    };

    await $http.$_cancelAppointments(payload);
    $toast.success('Appointment cancelled successfully');
    closeCancelModal();
    // Refresh appointments list
    fetchAppointments();
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    $toast.error(error.response?.data?.message || 'Failed to cancel appointment');
  } finally {
    isSubmittingCancel.value = false;
  }
};

const viewReceipt = (apt) => {
  receiptAppointment.value = apt;
  isReceiptModalOpen.value = true;
};

const closeReceiptModal = () => {
  isReceiptModalOpen.value = false;
  receiptAppointment.value = null;
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

const downloadReceipt = async () => {
  if (!receiptAppointment.value) return;

  try {
    // Import html2pdf dynamically
    const html2pdf = (await import('html2pdf.js')).default;

    const apt = receiptAppointment.value;
    const specialistName = apt.specialist?.full_name || 'Specialist';
    const appointmentDate = apt.start_time
      ? format(parseISO(apt.start_time), 'MMMM d, yyyy')
      : 'N/A';
    const appointmentTime = apt.start_time
      ? format(parseISO(apt.start_time), 'h:mm a')
      : 'N/A';
    const fee = formatCurrency(apt.appointment_fee);
    const status = apt.payment_status === 'SUCCESSFUL' ? 'PAID' : apt.payment_status;

    // Create PDF HTML content
    const pdfHTML = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #4FC3F7;">
          <h1 style="color: #1A365D; font-size: 24px; margin: 0 0 5px;">Rapid Capsule</h1>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Appointment Receipt</p>
        </div>

        <!-- Status Badge -->
        <div style="text-align: center; margin-bottom: 25px;">
          <span style="display: inline-block; padding: 8px 20px; background: ${status === 'PAID' ? '#E8F5E9' : '#FFF3E0'}; color: ${status === 'PAID' ? '#2E7D32' : '#F57C00'}; border-radius: 20px; font-weight: 600; font-size: 14px;">
            ${status}
          </span>
        </div>

        <!-- Appointment Details -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 15px;">Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td>
              <td style="padding: 8px 0; color: #1A365D; font-size: 14px; text-align: right; font-weight: 500;">${appointmentDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time</td>
              <td style="padding: 8px 0; color: #1A365D; font-size: 14px; text-align: right; font-weight: 500;">${appointmentTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Specialist</td>
              <td style="padding: 8px 0; color: #1A365D; font-size: 14px; text-align: right; font-weight: 500;">${specialistName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Category</td>
              <td style="padding: 8px 0; color: #1A365D; font-size: 14px; text-align: right; font-weight: 500;">${apt.category || 'Consultation'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Type</td>
              <td style="padding: 8px 0; color: #1A365D; font-size: 14px; text-align: right; font-weight: 500;">${apt.appointment_type || 'Consultation'}</td>
            </tr>
          </table>
        </div>

        <!-- Payment Details -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 15px;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Consultation Fee</td>
              <td style="padding: 8px 0; color: #1A365D; font-size: 14px; text-align: right; font-weight: 500;">${fee}</td>
            </tr>
            <tr style="border-top: 2px solid #e2e8f0;">
              <td style="padding: 12px 0 8px; color: #1A365D; font-size: 16px; font-weight: 700;">Total Paid</td>
              <td style="padding: 12px 0 8px; color: #0288D1; font-size: 16px; text-align: right; font-weight: 700;">${fee}</td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Thank you for choosing Rapid Capsule</p>
          <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0;">www.rapidcapsule.com</p>
        </div>
      </div>
    `;

    // Create container
    const container = document.createElement('div');
    container.innerHTML = pdfHTML;

    // PDF options
    const options = {
      margin: 10,
      filename: `rapid-capsule-receipt-${apt._id?.slice(-6) || 'appointment'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate and download PDF
    await html2pdf().set(options).from(container).save();
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
  }
};

const viewPrescription = (apt) => {
  const prescriptions = getAppointmentPrescriptions(apt._id || apt.id);
  if (prescriptions.length > 0) {
    prescriptionModalData.value = prescriptions;
    isPrescriptionModalOpen.value = true;
  } else {
    // Fallback to navigate if no prescriptions in map
    router.push({
      path: '/app/patient/prescriptions',
      query: { appointmentId: apt._id || apt.id },
    });
  }
};

const viewNotes = (apt) => {
  const notes = apt.clinical_notes || [];
  if (notes.length > 0) {
    notesModalData.value = notes;
    notesModalTitle.value = `Clinical Notes - Dr. ${apt.specialist?.full_name || 'Specialist'}`;
    isNotesModalOpen.value = true;
  }
};

const closeNotesModal = () => {
  isNotesModalOpen.value = false;
  notesModalData.value = [];
  notesModalTitle.value = '';
};

const closePrescriptionModal = () => {
  isPrescriptionModalOpen.value = false;
  prescriptionModalData.value = [];
};

const goToPrescriptionDetails = (prescriptionId) => {
  closePrescriptionModal();
  router.push({
    path: `/app/patient/prescriptions/details/${prescriptionId}`,
  });
};

const bookAgain = (apt) => {
  router.push({
    path: '/app/patient/appointmentsv2/book',
    query: {
      specialistId: apt.specialist?._id || apt.specialist?.id,
      category: apt.category,
      appointmentType: 'Follow-up Appointment',
    },
  });
};

const completePayment = (apt) => {
  // TODO: Navigate to payment flow
  console.log('Complete payment:', apt._id);
};

// Build prescription map by appointment ID
const buildPrescriptionMap = async () => {
  try {
    const { data } = await $http.$_getPatientPrescriptions({ page: 1, limit: 200 });
    const prescriptions = data?.data?.docs || data?.data || [];
    const map = {};

    prescriptions.forEach(rx => {
      // Map via linked_appointments
      if (rx.linked_appointments?.length) {
        rx.linked_appointments.forEach(apptId => {
          const id = apptId?._id || apptId;
          if (!map[id]) map[id] = [];
          map[id].push(rx);
        });
      }
      // Also map via linked_clinical_notes
      if (rx.linked_clinical_notes?.length) {
        rx.linked_clinical_notes.forEach(note => {
          const id = note.appointment_id?._id || note.appointment_id;
          if (id) {
            if (!map[id]) map[id] = [];
            // Avoid duplicates
            if (!map[id].find(existing => existing._id === rx._id)) {
              map[id].push(rx);
            }
          }
        });
      }
    });

    appointmentPrescriptionMap.value = map;
  } catch (error) {
    console.error('Error fetching prescriptions for map:', error);
  }
};

// Get prescriptions for a specific appointment
const getAppointmentPrescriptions = (appointmentId) => {
  return appointmentPrescriptionMap.value[appointmentId] || [];
};

// Fetch missed appointments using backend's MISSED status filter
const fetchMissedAppointments = async () => {
  try {
    const { data } = await $http.$_getPatientAppointments({
      currentPage: 1,
      pageLimit: 50,
      status: 'MISSED',
    });
    const result = data?.data || data;
    missedAppointments.value = Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Error fetching missed appointments:', error);
    missedAppointments.value = [];
  }
};

// Update stats based on current data
const updateStats = () => {
  try {
    const list = appointmentsList.value || [];
    const missedList = missedAppointments.value || [];

    const upcoming = list.filter(apt => {
      if (!apt) return false;
      const status = (apt.status || '').toUpperCase();
      return ['PENDING', 'OPEN', 'ONGOING', 'RESCHEDULED'].includes(status);
    }).length;

    const completed = list.filter(apt =>
      apt && (apt.status || '').toUpperCase() === 'COMPLETED'
    ).length;

    const missed = missedList.length;

    stats.value = {
      total: upcoming + completed + missed,
      upcoming,
      completed,
      missed,
    };
  } catch (error) {
    console.error('Error updating stats:', error);
  }
};

const fetchAppointments = async () => {
  isLoading.value = true;

  try {
    // Fetch all appointments and missed appointments in parallel
    const [allResponse] = await Promise.all([
      $http.$_getPatientAppointments({
        currentPage: 1,
        pageLimit: 100, // Fetch more for client-side filtering
      }),
      fetchMissedAppointments(), // Fetch missed separately
    ]);

    const result = allResponse.data?.data || allResponse.data;
    appointments.value = Array.isArray(result) ? result : [];

    // Update stats after fetching
    updateStats();

    // Build prescription map after fetching appointments
    buildPrescriptionMap();
  } catch (error) {
    console.error('Error fetching appointments:', error);
    appointments.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Check for payment verification on return from Paystack
const checkPaymentReturn = async () => {
  const paymentType = route.query.payment;
  const reference = route.query.reference || route.query.trxref;
  const appointmentId = route.query.appointmentId;

  // Check if returning from Paystack for appointment payment
  if (paymentType === 'appointment' && reference && appointmentId) {
    isVerifyingPayment.value = true;
    $toast.info('Verifying payment...');

    try {
      const { data } = await $http.$_verifyAppointmentTransaction({ reference });
      const appointment = data?.data || data?.result || data;

      if (appointment && (appointment.payment_status === 'SUCCESSFUL' || appointment.payment_status === 'Successful')) {
        $toast.success('Payment verified successfully!');
        // Clean up localStorage
        localStorage.removeItem('pending_appointment_id');
        localStorage.removeItem('pending_appointment_reference');
        // Redirect to confirmation page
        router.replace({
          path: `/app/patient/appointmentsv2/confirmation/${appointmentId}`,
        });
      } else {
        $toast.error('Payment verification failed. Please contact support.');
        // Still redirect to appointments page without query params
        router.replace({ path: '/app/patient/appointmentsv2' });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      $toast.error('Payment verification failed. Please try again.');
      router.replace({ path: '/app/patient/appointmentsv2' });
    } finally {
      isVerifyingPayment.value = false;
    }
    return true; // Payment was being verified
  }
  return false; // No payment verification needed
};

onMounted(async () => {
  // Check if returning from Paystack payment
  const isVerifying = await checkPaymentReturn();
  // Only fetch appointments if not in the middle of payment verification
  if (!isVerifying) {
    fetchAppointments();
  }
});
</script>

<style scoped lang="scss">
// V2 Color Variables
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;
$v2-orange-dark: #F57C00;
$v2-navy: #1A365D;
$v2-gray-bg: #F5F9FF;
$v2-text: #334155;
$v2-success: #4CAF50;
$v2-success-light: #E8F5E9;
$v2-error: #EF4444;
$v2-warning: #FFC107;

.appointmentsv2-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: 'Inter', system-ui, sans-serif;
  overflow-x: hidden;
}

// Hide decorative background
.bg-decoration {
  display: none;
}

.page-content {
  flex: 1;
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem 100px;
}

// Hero Banner
.hero-banner {
  background: linear-gradient(135deg, $v2-sky 0%, $v2-sky-dark 50%, darken($v2-sky-dark, 10%) 100%);
  border-radius: 20px;
  padding: 32px 40px;
  margin-bottom: 28px;
  color: white;
  box-shadow: 0 10px 40px rgba($v2-sky, 0.3);

  @media (max-width: 768px) {
    padding: 24px 20px;
    border-radius: 16px;
  }

  @media (max-width: 480px) {
    padding: 20px 16px;
    border-radius: 12px;
  }
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    margin-bottom: 20px;
  }
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: 30px;
  font-weight: 700;
  margin: 0 0 8px;
  line-height: 1.2;
  font-family: 'Poppins', system-ui, sans-serif;

  @media (max-width: 768px) {
    font-size: 24px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
  }
}

.hero-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.hero-actions {
  flex-shrink: 0;

  @media (max-width: 768px) {
    display: none;
  }
}

.hero-cta {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  color: $v2-sky-dark;
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
}

.hero-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 10px;
  }
}

.stat-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.15);
  padding: 16px 24px;
  border-radius: 12px;
  min-width: 90px;
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    padding: 12px 20px;
    min-width: 80px;
  }

  @media (max-width: 480px) {
    flex: 1;
    min-width: calc(33.333% - 10px);
    padding: 12px 8px;
  }
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 24px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
  }

  &.missed {
    color: #fbbf24;
  }
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
  display: block;

  @media (max-width: 480px) {
    font-size: 12px;
  }
}

// Tabs & Filters
.tabs-filters {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 4px;
  margin-bottom: 24px;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.tabs-row {
  display: flex;
  gap: 32px;
  overflow-x: auto;

  @media (max-width: 640px) {
    gap: 24px;
  }
}

.tab-btn {
  padding: 12px 4px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: $v2-navy;
    border-bottom-color: #cbd5e1;
  }

  &.active {
    color: $v2-navy;
    font-weight: 600;
    border-bottom-color: $v2-sky;
  }
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 640px) {
    width: 100%;
  }
}

.search-box {
  position: relative;
  width: 256px;

  @media (max-width: 640px) {
    flex: 1;
    width: auto;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
  }

  .search-input {
    width: 100%;
    padding: 10px 16px 10px 38px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    color: $v2-text;
    outline: none;
    transition: all 0.2s ease;

    &::placeholder {
      color: #94a3b8;
    }

    &:focus {
      border-color: $v2-sky;
      box-shadow: 0 0 0 3px rgba($v2-sky, 0.1);
    }
  }
}

.filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $v2-sky;
    color: $v2-sky;
  }
}

// Loading & Empty States
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
}

.loading-state span {
  margin-top: 16px;
  font-size: 14px;
  color: #64748b;
}

.empty-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $v2-sky-light;
  border-radius: 50%;
  margin-bottom: 20px;
  color: $v2-sky;
}

.empty-state {
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px;
    text-transform: capitalize;
  }

  p {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 24px;
    max-width: 320px;
  }
}

.book-empty-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: $v2-sky;
  color: white;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: $v2-sky-dark;
  }
}

// Appointments List
.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// History Section Header
.history-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 32px;
  padding-bottom: 8px;

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: $v2-navy;
    margin: 0;
  }

  .history-icon {
    color: $v2-sky;
  }
}

// Pagination
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
  padding-bottom: 24px;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: $v2-navy;
    color: $v2-navy;
  }

  &.active {
    background: $v2-navy;
    border-color: $v2-navy;
    color: white;
    box-shadow: 0 4px 8px rgba($v2-navy, 0.2);
  }

  &.nav {
    color: #94a3b8;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// Modal Styles
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
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;

  h2 {
    font-size: 18px;
    font-weight: 700;
    color: $v2-navy;
    margin: 0;
  }

  .title-icon {
    color: $v2-sky;

    &.rx-icon {
      color: $v2-orange;
    }
  }
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: #f1f5f9;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
    color: $v2-navy;
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn-secondary {
  padding: 10px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $v2-navy;
    color: $v2-navy;
  }
}

.btn-primary {
  padding: 10px 20px;
  background: $v2-sky;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: $v2-sky-dark;
  }
}

// Notes Modal Styles
.notes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.note-date {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.note-platform {
  font-size: 11px;
  padding: 2px 8px;
  background: $v2-sky-light;
  color: $v2-sky-dark;
  border-radius: 6px;
  text-transform: capitalize;
}

.note-content {
  font-size: 14px;
  color: $v2-text;
  line-height: 1.6;
  white-space: pre-wrap;
}

.empty-notes,
.empty-prescriptions {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

// Prescriptions Modal Styles
.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prescription-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $v2-sky;
    box-shadow: 0 4px 12px rgba($v2-sky, 0.1);
  }
}

.rx-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.rx-id {
  font-size: 14px;
  font-weight: 700;
  color: $v2-navy;
}

.rx-status {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 600;
  text-transform: uppercase;

  &.pending {
    background: $v2-orange-light;
    color: $v2-orange-dark;
  }

  &.accepted,
  &.active {
    background: $v2-success-light;
    color: #2E7D32;
  }

  &.completed,
  &.fulfilled {
    background: #e0f2fe;
    color: #0284c7;
  }

  &.cancelled,
  &.rejected {
    background: #fef2f2;
    color: #C62828;
  }
}

.rx-date {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.rx-meds {
  margin-top: 8px;
}

.med-count {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.med-list {
  margin: 6px 0 0;
  padding-left: 16px;
  font-size: 13px;
  color: $v2-text;

  li {
    margin-bottom: 2px;
  }

  .more-meds {
    color: #94a3b8;
    font-style: italic;
  }
}

.rx-view-link {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  color: $v2-sky;
}

// Receipt Modal Styles
.receipt-modal {
  max-width: 480px;
}

.receipt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px dashed #e2e8f0;
  margin-bottom: 20px;
}

.receipt-logo {
  display: flex;
  align-items: center;

  img {
    height: 36px;
    width: auto;
    object-fit: contain;
  }
}

.receipt-status {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;

  &.successful {
    background: $v2-success-light;
    color: #2E7D32;
  }

  &.pending {
    background: $v2-orange-light;
    color: $v2-orange-dark;
  }

  &.failed {
    background: #fef2f2;
    color: #C62828;
  }
}

.receipt-section {
  margin-bottom: 20px;

  h4 {
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 12px;
  }
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }

  &.total {
    border-top: 2px solid #e2e8f0;
    border-bottom: none;
    padding-top: 12px;
    margin-top: 8px;

    .receipt-label,
    .receipt-value {
      font-weight: 700;
      font-size: 16px;
    }

    .receipt-value {
      color: $v2-sky-dark;
    }
  }
}

.receipt-label {
  font-size: 14px;
  color: #64748b;
}

.receipt-value {
  font-size: 14px;
  font-weight: 500;
  color: $v2-navy;
}

.receipt-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
  margin-top: 16px;

  svg {
    color: $v2-sky;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }
}

.receipt-icon {
  color: $v2-success !important;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

// ===========================================
// MOBILE STYLES
// ===========================================

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #f1f5f9;
  height: 56px;
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 1024px) {
    display: flex;
  }
}

.mobile-menu-btn,
.mobile-bell-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: $v2-navy;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }
}

.mobile-bell-btn {
  position: relative;
  color: #64748b;
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background: $v2-orange;
  border-radius: 50%;
  border: 1.5px solid white;
}

.mobile-logo {
  display: flex;
  align-items: center;
  gap: 8px;

  .logo-img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .logo-text {
    font-size: 16px;
    font-weight: 700;
    color: $v2-navy;
    font-family: 'Poppins', system-ui, sans-serif;
  }
}

// Mobile FAB Button
.mobile-fab {
  display: none;
  position: fixed;
  bottom: 80px;
  right: 16px;
  width: 56px;
  height: 56px;
  background: $v2-sky;
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 6px 20px rgba($v2-sky, 0.4);
  cursor: pointer;
  z-index: 30;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    display: flex;
  }

  &:hover {
    background: $v2-sky-dark;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

// Mobile Bottom Tab Navigation
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: white;
  border-top: 1px solid #f1f5f9;
  z-index: 30;
  padding: 0 8px;
  align-items: center;
  justify-content: space-around;

  @media (max-width: 768px) {
    display: flex;
  }

  .tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 64px;
    min-height: 44px;
    text-decoration: none;
    color: #94a3b8;
    font-size: 10px;
    font-weight: 500;
    transition: color 0.2s ease;

    svg {
      transition: transform 0.2s ease;
    }

    &:hover,
    &.active,
    &.router-link-exact-active {
      color: $v2-sky;

      svg {
        transform: scale(1.1);
      }
    }

    &.active span,
    &.router-link-exact-active span {
      font-weight: 700;
    }
  }
}

// Action Sheet
.action-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease;
}

.action-sheet {
  width: 100%;
  background: white;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(100%);
  transition: transform 0.3s ease;

  &.active {
    transform: translateY(0);
  }
}

.action-sheet-handle {
  width: 48px;
  height: 4px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 12px auto 16px;
}

.action-sheet-content {
  padding: 0 16px 24px;
}

.action-sheet-title {
  font-size: 16px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 16px;
}

.action-sheet-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: background 0.2s ease;
  min-height: 44px;

  svg {
    color: #94a3b8;
  }

  &:hover {
    background: #f8fafc;
  }

  &.danger {
    color: #ef4444;

    svg {
      color: #ef4444;
    }

    &:hover {
      background: #fef2f2;
    }
  }
}

.action-sheet-close {
  width: 100%;
  margin-top: 16px;
  padding: 14px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: $v2-navy;
    color: $v2-navy;
  }
}

// ===========================================
// COMPREHENSIVE MOBILE RESPONSIVE UPDATES
// ===========================================

@media (max-width: 768px) {
  // Page content adjustments
  .page-content {
    padding: 20px 16px 100px;
  }

  // Hero banner mobile
  .hero-banner {
    margin-bottom: 20px;
    margin-top: 8px;
  }

  .hero-content {
    margin-bottom: 16px;
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat-item {
    padding: 10px 8px;
    min-width: auto;

    &:nth-child(4) {
      display: none; // Hide missed stat on small mobile if 4th item
    }
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-label {
    font-size: 10px;
    margin-top: 2px;
  }

  // Hide hero CTA button on mobile (using FAB instead)
  .hero-actions {
    display: none;
  }

  // Tabs and filters mobile
  .tabs-filters {
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 0;
    border-bottom: none;
  }

  .tabs-row {
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 8px;
    padding-right: 16px; // Extra padding for last tab visibility
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .tab-btn {
    padding: 10px 14px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 13px;
    white-space: nowrap;
    min-height: 42px;

    &:hover {
      border-color: $v2-sky;
    }

    &.active {
      background: $v2-sky;
      border-color: $v2-sky;
      color: white;
    }

    span {
      font-size: 12px;
      opacity: 0.8;
    }
  }

  .filters-row {
    gap: 8px;
  }

  .search-box {
    .search-input {
      padding: 12px 16px 12px 40px;
      font-size: 14px;
      border-radius: 12px;
      min-height: 46px;
    }
  }

  .filter-btn {
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }

  // Loading and empty states mobile
  .loading-state,
  .empty-state {
    padding: 60px 20px;
    border-radius: 16px;
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }

  .empty-state {
    h3 {
      font-size: 16px;
    }

    p {
      font-size: 13px;
      max-width: 280px;
    }
  }

  .book-empty-btn {
    padding: 12px 24px;
    font-size: 14px;
    border-radius: 10px;
  }

  // Appointments list mobile
  .appointments-list {
    gap: 12px;
  }

  // History section mobile
  .history-section-header {
    padding-top: 24px;
    padding-bottom: 6px;

    h3 {
      font-size: 16px;
    }
  }

  // Pagination mobile
  .pagination {
    margin-top: 24px;
    padding-bottom: 16px;
    gap: 6px;
  }

  .page-btn {
    width: 36px;
    height: 36px;
    font-size: 13px;
    border-radius: 8px;
  }

  // Modals mobile
  .modal-overlay {
    padding: 12px;
    align-items: flex-end;
  }

  .modal-container {
    border-radius: 20px 20px 0 0;
    max-height: 90vh;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-title h2 {
    font-size: 16px;
  }

  .modal-body {
    padding: 16px 20px;
  }

  .modal-footer {
    padding: 12px 20px;
    flex-direction: column;
    gap: 10px;

    .btn-secondary,
    .btn-primary {
      width: 100%;
      justify-content: center;
      min-height: 46px;
    }
  }
}

// Extra small screens (iPhone SE, etc.)
@media (max-width: 375px) {
  .page-content {
    padding: 16px 12px 100px;
  }

  .hero-banner {
    padding: 16px 14px;
  }

  .hero-title {
    font-size: 18px;
  }

  .hero-subtitle {
    font-size: 12px;
  }

  .hero-stats {
    gap: 6px;
  }

  .stat-item {
    padding: 8px 6px;
  }

  .stat-value {
    font-size: 16px;
  }

  .stat-label {
    font-size: 9px;
  }

  .tabs-row {
    gap: 3px;
  }

  .tab-btn {
    padding: 8px 12px;
    font-size: 12px;
    min-height: 38px;
  }

  .mobile-fab {
    width: 52px;
    height: 52px;
    bottom: 76px;
    right: 12px;
  }

  .mobile-bottom-nav {
    height: 60px;

    .tab-item {
      min-width: 56px;
      font-size: 9px;

      svg {
        transform: scale(0.9);
      }
    }
  }
}

// ===========================================
// RESCHEDULE MODAL STYLES
// ===========================================

.reschedule-modal {
  max-width: 560px;
  max-height: 90vh;

  @media (max-width: 768px) {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 20px 20px 0 0;
  }
}

.reschedule-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 20px;
  }
}

.reschedule-current-info {
  background: linear-gradient(135deg, $v2-sky-light 0%, #f0f9ff 100%);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba($v2-sky, 0.2);
}

.current-info-label {
  font-size: 11px;
  font-weight: 600;
  color: $v2-sky-dark;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.current-info-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.current-specialist {
  display: flex;
  align-items: center;
  gap: 12px;

  .specialist-avatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    object-fit: cover;

    &.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: $v2-sky;
      color: white;
      font-weight: 700;
      font-size: 16px;
    }
  }

  .specialist-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .specialist-name {
    font-size: 15px;
    font-weight: 600;
    color: $v2-navy;
  }

  .specialist-category {
    font-size: 13px;
    color: #64748b;
  }
}

.current-datetime {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
  padding-top: 8px;
  border-top: 1px dashed rgba($v2-sky, 0.3);

  svg {
    color: $v2-sky;
  }
}

.reschedule-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .section-label {
    font-size: 14px;
    font-weight: 600;
    color: $v2-navy;
    margin: 0;
  }
}

.date-picker-wrapper {
  :deep(.vc-container) {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    font-family: 'Inter', system-ui, sans-serif;
  }

  :deep(.vc-header) {
    padding: 12px 16px;
  }

  :deep(.vc-title) {
    font-weight: 600;
    color: $v2-navy;
  }

  :deep(.vc-arrow) {
    color: $v2-sky;

    &:hover {
      background: $v2-sky-light;
    }
  }

  :deep(.vc-day-content) {
    font-weight: 500;

    &:hover {
      background: $v2-sky-light;
    }
  }

  :deep(.vc-highlight) {
    background: $v2-sky !important;
  }

  :deep(.vc-highlight-content-solid) {
    color: white;
  }
}

.time-slots-container {
  min-height: 160px;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  background: #fafbfc;

  @media (max-width: 768px) {
    max-height: 200px;
    padding: 12px;
  }
}

.time-slots-loading,
.time-slots-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 140px;
  text-align: center;
  color: #64748b;
  gap: 8px;

  svg {
    color: #94a3b8;
  }

  p {
    font-size: 14px;
    margin: 0;
  }

  span {
    font-size: 12px;
    color: #94a3b8;
  }

  .try-another {
    font-size: 12px;
    color: $v2-sky;
  }
}

.time-slots-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-slots-date-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.time-slots-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
}

.time-slot-btn {
  padding: 10px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  font-size: 13px;
  font-weight: 500;
  color: $v2-navy;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: $v2-sky;
    background: $v2-sky-light;
  }

  &.selected {
    border-color: $v2-sky;
    background: $v2-sky;
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba($v2-sky, 0.3);
  }

  @media (max-width: 480px) {
    padding: 8px 6px;
    font-size: 12px;
    border-radius: 8px;
  }
}

// Button spinner for loading state
.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ===========================================
// CANCEL MODAL STYLES
// ===========================================

.cancel-modal {
  max-width: 480px;

  @media (max-width: 768px) {
    max-width: 100%;
    border-radius: 20px 20px 0 0;
  }
}

.cancel-icon {
  color: #EF4444;
}

.cancel-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
}

.cancel-warning {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 12px;
  padding: 16px;

  svg {
    color: #EF4444;
    flex-shrink: 0;
  }

  p {
    font-size: 15px;
    font-weight: 500;
    color: #991B1B;
    margin: 0;
  }

  @media (max-width: 768px) {
    padding: 12px;

    p {
      font-size: 14px;
    }
  }
}

.cancel-appointment-info {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cancel-specialist {
  display: flex;
  align-items: center;
  gap: 12px;

  .specialist-avatar {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    object-fit: cover;

    &.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: $v2-sky;
      color: white;
      font-weight: 700;
      font-size: 18px;
    }
  }

  .specialist-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .specialist-name {
    font-size: 16px;
    font-weight: 600;
    color: $v2-navy;
  }

  .specialist-category {
    font-size: 13px;
    color: #64748b;
  }
}

.cancel-datetime {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;

  svg {
    color: #94a3b8;
  }
}

.cancel-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #F0F9FF;
  border-radius: 10px;
  padding: 12px;

  svg {
    color: $v2-sky;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }
}

.btn-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #DC2626;
  }

  &:disabled {
    background: #FCA5A5;
    cursor: not-allowed;
  }

  .btn-spinner.danger {
    border-color: rgba(255, 255, 255, 0.3);
    border-top-color: white;
  }

  @media (max-width: 768px) {
    flex: 1;
    padding: 14px 16px;
  }
}
</style>
