<template>
  <div class="sa-appointments-list">
    <!-- Page Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-text">
            <h1 class="page-title">Appointments</h1>
            <p class="page-subtitle">Manage and track all your appointments</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Stats Overview -->
    <section class="stats-overview">
      <div class="stat-card stat-total">
        <div class="stat-header">
          <div class="stat-icon">
            <v-icon name="hi-calendar" scale="1.1" />
          </div>
          <span class="stat-label">Total</span>
        </div>
        <p class="stat-value">{{ statusCounts.total }}</p>
        <p class="stat-title">Total Appointments</p>
      </div>

      <div class="stat-card stat-confirmed">
        <div class="stat-header">
          <div class="stat-icon">
            <v-icon name="hi-check-circle" scale="1.1" />
          </div>
          <span class="stat-label">Active</span>
        </div>
        <p class="stat-value">{{ statusCounts.confirmed }}</p>
        <p class="stat-title">Confirmed</p>
      </div>

      <div class="stat-card stat-completed">
        <div class="stat-header">
          <div class="stat-icon">
            <v-icon name="hi-badge-check" scale="1.1" />
          </div>
          <span class="stat-label">Done</span>
        </div>
        <p class="stat-value">{{ statusCounts.completed }}</p>
        <p class="stat-title">Completed</p>
      </div>

      <div class="stat-card stat-noshow">
        <div class="stat-header">
          <div class="stat-icon">
            <v-icon name="hi-user-remove" scale="1.1" />
          </div>
          <span class="stat-label">Missed</span>
        </div>
        <p class="stat-value">{{ statusCounts.noShow }}</p>
        <p class="stat-title">No Show</p>
      </div>

      <div class="stat-card stat-today">
        <div class="stat-header">
          <div class="stat-icon">
            <v-icon name="hi-clock" scale="1.1" />
          </div>
          <span class="stat-label">Today</span>
        </div>
        <p class="stat-value">{{ statusCounts.today }}</p>
        <p class="stat-title">Today's Appointments</p>
      </div>
    </section>

    <!-- Filters Section -->
    <section class="filters-section">
      <div class="filters-row">
        <div class="search-input-wrapper">
          <v-icon name="hi-search" scale="0.9" class="search-icon" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search appointments..."
            class="search-input"
            @input="debouncedSearch"
          />
        </div>

        <select v-model="filters.status" class="filter-select" @change="fetchAppointments(1)">
          <option value="">All Status</option>
          <option
            v-for="status in filterOptions.statuses"
            :key="status.value"
            :value="status.value"
          >
            {{ status.label }}
          </option>
        </select>

        <select v-model="filters.appointmentType" class="filter-select" @change="fetchAppointments(1)">
          <option value="">All Types</option>
          <option
            v-for="service in filterOptions.consultationServices"
            :key="service.slug"
            :value="service.value"
          >
            {{ service.label }}
          </option>
        </select>

        <select v-model="filters.dateRange" class="filter-select" @change="handleDateRangeChange">
          <option value="">All Dates</option>
          <option
            v-for="range in filterOptions.dateRanges"
            :key="range.value"
            :value="range.value"
          >
            {{ range.label }}
          </option>
        </select>

        <router-link :to="{ name: 'SpecialistAppointmentsCreate' }" class="btn-book-new">
          <v-icon name="hi-plus" scale="0.9" />
          Book New Appointment
        </router-link>
      </div>

      <div class="filter-tabs">
        <button
          class="filter-tab"
          :class="{ active: !filters.status }"
          @click="setStatusFilter('')"
        >
          All ({{ statusCounts.total }})
        </button>
        <button
          class="filter-tab"
          :class="{ active: filters.status === 'OPEN' }"
          @click="setStatusFilter('OPEN')"
        >
          Confirmed ({{ statusCounts.confirmed }})
        </button>
        <button
          class="filter-tab"
          :class="{ active: filters.status === 'COMPLETED' }"
          @click="setStatusFilter('COMPLETED')"
        >
          Completed ({{ statusCounts.completed }})
        </button>
        <button
          class="filter-tab"
          :class="{ active: filters.status === 'MISSED' }"
          @click="setStatusFilter('MISSED')"
        >
          No Show ({{ statusCounts.noShow }})
        </button>
        <button class="filter-tab" @click="showFilters = !showFilters">
          <v-icon name="hi-filter" scale="0.8" />
          More Filters
        </button>
      </div>
    </section>

    <!-- More Filters Panel (Hidden by default) -->
    <transition name="slide-down">
      <div v-if="showFilters" class="more-filters-card">
        <div class="filters-header">
          <h3>Additional Filters</h3>
          <button class="btn-text" @click="clearFilters">
            <v-icon name="hi-refresh" scale="0.8" />
            Reset All
          </button>
        </div>
        <div class="filters-grid">
          <div class="filter-group">
            <label>Channel</label>
            <select v-model="filters.channel" @change="fetchAppointments(1)">
              <option value="">All Channels</option>
              <option
                v-for="channel in filterOptions.channels"
                :key="channel.value"
                :value="channel.value"
              >
                {{ channel.label }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label>From Date</label>
            <input type="date" v-model="filters.dateFrom" @change="fetchAppointments(1)" />
          </div>
          <div class="filter-group">
            <label>To Date</label>
            <input type="date" v-model="filters.dateTo" @change="fetchAppointments(1)" />
          </div>
        </div>
      </div>
    </transition>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-card">
      <div class="loading-content">
        <div class="spinner-wrapper">
          <div class="spinner"></div>
        </div>
        <p>Loading appointments...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="appointments.length === 0" class="empty-card">
      <div class="empty-illustration">
        <div class="empty-circle">
          <v-icon name="hi-calendar" scale="2.5" />
        </div>
        <div class="empty-decorations">
          <span class="deco deco-1"></span>
          <span class="deco deco-2"></span>
          <span class="deco deco-3"></span>
        </div>
      </div>
      <h3>No Appointments Found</h3>
      <p>{{ emptyMessage }}</p>
      <router-link :to="{ name: 'SpecialistAppointmentsCreate' }" class="btn-primary-lg">
        <v-icon name="hi-plus-circle" scale="1" />
        Book New Appointment
      </router-link>
    </div>

    <!-- Appointments List -->
    <div v-else class="appointments-content">
      <!-- Desktop Table View -->
      <div class="appointments-table-card">
        <table class="appointments-table">
          <thead>
            <tr>
              <th class="th-checkbox">
                <label class="custom-checkbox">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  />
                  <span class="checkmark"></span>
                </label>
              </th>
              <th>Patient</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Channel</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="appointment in appointments"
              :key="appointment._id"
              :class="[
                getRowClass(appointment.status),
                { selected: selectedIds.includes(appointment._id) }
              ]"
            >
              <td class="td-checkbox">
                <label class="custom-checkbox">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(appointment._id)"
                    @change="toggleSelection(appointment._id)"
                  />
                  <span class="checkmark"></span>
                </label>
              </td>
              <td>
                <div class="patient-cell">
                  <PatientAvatar
                    :src="getPatientImage(appointment)"
                    :name="getPatientName(appointment)"
                    size="md"
                  />
                  <div class="patient-info">
                    <router-link
                      :to="{ name: 'SpecialistAppointmentDetail', params: { id: appointment._id } }"
                      class="patient-name"
                    >
                      {{ getPatientName(appointment) }}
                    </router-link>
                    <span class="patient-email">{{ appointment.patient?.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="datetime-cell">
                  <p class="date-text">{{ formatDate(appointment.start_time) }}</p>
                  <p class="time-text">{{ formatTime(appointment.start_time) }}</p>
                </div>
              </td>
              <td>
                <span class="type-badge" :class="getTypeBadgeClass(appointment.appointment_type)">
                  {{ appointment.appointment_type || 'Consultation' }}
                </span>
              </td>
              <td>
                <div class="channel-cell">
                  <v-icon name="hi-video-camera" scale="0.9" class="channel-icon" />
                  <span class="channel-text">{{ getChannelLabel(appointment.meeting_channel) }}</span>
                </div>
              </td>
              <td>
                <StatusBadge :status="normalizeStatus(appointment.status)" pill :show-icon="true" />
              </td>
              <td>
                <div class="actions-cell">
                  <!-- View - Always shown -->
                  <router-link
                    :to="{ name: 'SpecialistAppointmentDetail', params: { id: appointment._id } }"
                    class="action-btn action-view"
                    title="View Details"
                  >
                    <v-icon name="hi-eye" scale="0.9" />
                  </router-link>

                  <!-- Actions for Confirmed -->
                  <template v-if="normalizeStatus(appointment.status) === 'confirmed'">
                    <button class="action-btn action-edit" title="Edit" @click="openReschedule(appointment)">
                      <v-icon name="hi-pencil" scale="0.9" />
                    </button>
                    <a v-if="appointment.join_url" :href="appointment.join_url" target="_blank" class="action-btn action-meeting" title="Start Meeting">
                      <v-icon name="hi-video-camera" scale="0.9" />
                    </a>
                  </template>

                  <!-- Actions for Completed -->
                  <template v-else-if="normalizeStatus(appointment.status) === 'completed'">
                    <button
                      class="action-btn action-notes"
                      title="Clinical Notes"
                      @click="openClinicalNoteModal(appointment)"
                    >
                      <v-icon name="hi-document-text" scale="0.9" />
                    </button>
                    <button v-if="appointment.recording_url" class="action-btn action-recording" title="View Recording">
                      <v-icon name="hi-play" scale="0.9" />
                    </button>
                  </template>

                  <!-- Actions for No Show -->
                  <template v-else-if="normalizeStatus(appointment.status) === 'no_show'">
                    <button class="action-btn action-reschedule" title="Reschedule" @click="openReschedule(appointment)">
                      <v-icon name="hi-calendar" scale="0.9" />
                    </button>
                    <button class="action-btn action-contact" title="Contact Patient">
                      <v-icon name="hi-mail" scale="0.9" />
                    </button>
                  </template>

                  <!-- More menu -->
                  <button class="action-btn action-more" title="More options">
                    <v-icon name="hi-dots-vertical" scale="0.9" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-card">
        <div class="pagination-info">
          Showing <span class="highlight">{{ (currentPage - 1) * pageSize + 1 }}</span>
          to <span class="highlight">{{ Math.min(currentPage * pageSize, totalCount) }}</span>
          of <span class="highlight">{{ totalCount }}</span> results
        </div>
        <div class="pagination-controls">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="fetchAppointments(currentPage - 1)"
          >
            <v-icon name="hi-chevron-left" scale="0.9" />
          </button>
          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              class="page-num"
              :class="{ active: page === currentPage }"
              @click="fetchAppointments(page)"
            >
              {{ page }}
            </button>
          </div>
          <button
            class="page-btn"
            :disabled="currentPage >= totalPages"
            @click="fetchAppointments(currentPage + 1)"
          >
            <v-icon name="hi-chevron-right" scale="0.9" />
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <transition name="slide-up">
      <div v-if="selectedIds.length > 0" class="bulk-actions-bar">
        <div class="bulk-left">
          <div class="selection-badge">
            <v-icon name="hi-check-circle" scale="0.9" />
            <span>{{ selectedIds.length }} selected</span>
          </div>
        </div>
        <div class="bulk-actions">
          <button class="bulk-btn" @click="clearSelection">
            <v-icon name="hi-x" scale="0.85" />
            Clear
          </button>
          <button class="bulk-btn bulk-danger" @click="bulkCancel">
            <v-icon name="hi-trash" scale="0.85" />
            Cancel Selected
          </button>
        </div>
      </div>
    </transition>

    <!-- Reschedule Modal -->
    <RescheduleModal
      :is-open="showRescheduleModal"
      :appointment="selectedAppointment"
      @close="closeRescheduleModal"
      @reschedule="handleReschedule"
    />

    <!-- Cancel Modal -->
    <CancelModal
      :is-open="showCancelModal"
      :appointment="selectedAppointment"
      @close="closeCancelModal"
      @cancel="handleCancel"
    />

    <!-- Clinical Note Modal -->
    <ClinicalNoteModal
      :is-open="showClinicalNoteModal"
      :appointment="selectedAppointment"
      :existing-note="existingClinicalNote"
      @close="closeClinicalNoteModal"
      @saved="handleClinicalNoteSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppointments } from './composables/useAppointments';
import StatusBadge from './components/StatusBadge.vue';
import ChannelIcon from './components/ChannelIcon.vue';
import PatientAvatar from './components/PatientAvatar.vue';
import RescheduleModal from './modals/RescheduleModal.vue';
import CancelModal from './modals/CancelModal.vue';
import ClinicalNoteModal from './modals/ClinicalNoteModal.vue';

const {
  appointments,
  isLoading,
  totalCount,
  currentPage,
  pageSize,
  filters,
  selectedIds,
  statusCounts,
  filterOptions,
  hasFilters,
  fetchAppointments,
  fetchFilterOptions,
  toggleSelection,
  selectAll,
  clearSelection,
  applyFilter,
  clearFilters: clearAllFilters,
  setView,
  rescheduleAppointment,
  cancelAppointment,
} = useAppointments();

const showFilters = ref(false);
const searchQuery = ref('');
let searchTimeout = null;

// Modal state
const showRescheduleModal = ref(false);
const showCancelModal = ref(false);
const showClinicalNoteModal = ref(false);
const selectedAppointment = ref(null);
const existingClinicalNote = ref(null);

const viewTabs = [
  { value: 'upcoming', label: 'Upcoming', icon: 'hi-arrow-circle-right' },
  { value: 'today', label: 'Today', icon: 'hi-sun' },
  { value: 'past', label: 'Past', icon: 'hi-archive' },
  { value: 'all', label: 'All', icon: 'hi-view-grid' },
];

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 2) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(current - 2, current - 1, current, current + 1, current + 2);
    }
  }
  return pages;
});

const isAllSelected = computed(() => {
  return appointments.value.length > 0 &&
    appointments.value.every(a => selectedIds.value.includes(a._id));
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.status) count++;
  if (filters.channel) count++;
  if (filters.dateFrom) count++;
  if (filters.dateTo) count++;
  return count;
});

const emptyMessage = computed(() => {
  if (hasFilters.value || searchQuery.value) {
    return 'Try adjusting your filters or search criteria';
  }
  return 'Get started by booking your first appointment';
});


function getPatientName(appointment) {
  if (appointment.patient?.profile) {
    const { first_name, last_name } = appointment.patient.profile;
    return `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown Patient';
  }
  return 'Unknown Patient';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Normalize database status to StatusBadge expected format
 * Database: COMPLETED, MISSED, OPEN, ONGOING, CANCELLED, RESCHEDULED
 * StatusBadge: completed, pending, confirmed, cancelled, no_show, in_progress, rescheduled
 */
function normalizeStatus(status) {
  if (!status) return 'pending';

  const statusMap = {
    'COMPLETED': 'completed',
    'MISSED': 'no_show',
    'OPEN': 'confirmed',
    'ONGOING': 'in_progress',
    'CANCELLED': 'cancelled',
    'RESCHEDULED': 'rescheduled',
    // Also handle if already lowercase (in case API changes)
    'completed': 'completed',
    'missed': 'no_show',
    'open': 'confirmed',
    'ongoing': 'in_progress',
    'cancelled': 'cancelled',
    'rescheduled': 'rescheduled',
    'pending': 'pending',
    'confirmed': 'confirmed',
    'no_show': 'no_show',
    'in_progress': 'in_progress',
  };

  return statusMap[status] || 'pending';
}

// Row class based on status
function getRowClass(status) {
  const normalized = normalizeStatus(status);
  if (normalized === 'completed') return 'row-completed';
  if (normalized === 'no_show') return 'row-noshow';
  return '';
}

// Set status filter from tab buttons
function setStatusFilter(status) {
  filters.status = status;
  fetchAppointments(1);
}

// Handle date range dropdown change
function handleDateRangeChange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filters.dateRange === 'today') {
    filters.dateFrom = today.toISOString().split('T')[0];
    filters.dateTo = today.toISOString().split('T')[0];
  } else if (filters.dateRange === 'week') {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    filters.dateFrom = today.toISOString().split('T')[0];
    filters.dateTo = weekEnd.toISOString().split('T')[0];
  } else if (filters.dateRange === 'month') {
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    filters.dateFrom = today.toISOString().split('T')[0];
    filters.dateTo = monthEnd.toISOString().split('T')[0];
  } else {
    filters.dateFrom = '';
    filters.dateTo = '';
  }

  fetchAppointments(1);
}

// Get type badge class based on appointment type (dynamic - generates from name)
function getTypeBadgeClass(type) {
  if (!type) return '';
  // Generate class from type name: "Initial Appointment" -> "type-initial-appointment"
  const slug = type.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `type-${slug}`;
}

// Get channel label from dynamic options or fallback
function getChannelLabel(channel) {
  // Try to find from loaded filter options
  const found = filterOptions.channels.find(c => c.value === channel);
  if (found) return found.label;

  // Fallback for common channels
  const fallbackMap = {
    'zoom': 'Zoom',
    'google_meet': 'Google Meet',
    'whatsapp': 'WhatsApp',
    'phone': 'Phone',
    'in_person': 'In Person',
  };
  return fallbackMap[channel] || channel || 'Video Call';
}

function canReschedule(appointment) {
  const normalized = normalizeStatus(appointment.status);
  return ['confirmed', 'pending'].includes(normalized);
}

function canCancel(appointment) {
  const normalized = normalizeStatus(appointment.status);
  return ['confirmed', 'pending'].includes(normalized);
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    clearSelection();
  } else {
    selectAll();
  }
}

function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filters.search = searchQuery.value;
    fetchAppointments(1);
  }, 300);
}

function clearSearch() {
  searchQuery.value = '';
  filters.search = '';
  fetchAppointments(1);
}

function clearFilters() {
  clearAllFilters();
  searchQuery.value = '';
  showFilters.value = false;
}

function openReschedule(appointment) {
  selectedAppointment.value = appointment;
  showRescheduleModal.value = true;
}

function closeRescheduleModal() {
  showRescheduleModal.value = false;
  selectedAppointment.value = null;
}

async function handleReschedule(data) {
  const success = await rescheduleAppointment(
    data.appointmentId,
    data.newDate,
    data.newTime,
    data.reason,
    data.notifyPatient
  );
  if (success) {
    closeRescheduleModal();
  }
}

function openCancel(appointment) {
  selectedAppointment.value = appointment;
  showCancelModal.value = true;
}

function closeCancelModal() {
  showCancelModal.value = false;
  selectedAppointment.value = null;
}

async function handleCancel(data) {
  const success = await cancelAppointment(
    data.appointmentId,
    data.reason,
    data.refundOption,
    data.offerReschedule,
    data.notifyPatient
  );
  if (success) {
    closeCancelModal();
  }
}

function bulkCancel() {
  if (selectedIds.value.length > 0) {
    const firstAppointment = appointments.value.find(a => a._id === selectedIds.value[0]);
    if (firstAppointment) {
      openCancel(firstAppointment);
    }
  }
}

// Clinical Notes Modal
function openClinicalNoteModal(appointment) {
  selectedAppointment.value = appointment;
  // Check if appointment has existing clinical notes
  existingClinicalNote.value = appointment.clinical_note || null;
  showClinicalNoteModal.value = true;
}

function closeClinicalNoteModal() {
  showClinicalNoteModal.value = false;
  selectedAppointment.value = null;
  existingClinicalNote.value = null;
}

function handleClinicalNoteSaved() {
  closeClinicalNoteModal();
  fetchAppointments(currentPage.value);
}

// Get patient image URL
function getPatientImage(appointment) {
  // Check both possible field names
  const profileImage = appointment.patient?.profile?.profile_photo ||
                       appointment.patient?.profile?.profile_image ||
                       appointment.patient?.profile_photo;
  if (!profileImage) return '';

  // If it's already a full URL, return it
  if (profileImage.startsWith('http')) return profileImage;

  // If it's an S3 key, construct the full URL
  const s3BaseUrl = 'https://rapidcapsule.s3.eu-west-2.amazonaws.com/';
  return s3BaseUrl + profileImage;
}

onMounted(() => {
  fetchAppointments(1);
  fetchFilterOptions(); // Load filter options from database
});
</script>

<style scoped lang="scss">
@import './styles/sa-variables';

.sa-appointments-list {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

// ============================================
// PAGE HEADER
// ============================================
.page-header {
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  @include sa-icon-wrapper(48px);
  background: $sa-sky-gradient;
  color: $sa-white;
  box-shadow: $sa-shadow-sky;
}

.header-text {
  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: $sa-navy;
    margin: 0;
    font-family: $sa-font-heading;
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: $sa-text-secondary;
    margin: 0.25rem 0 0;

    .count-highlight {
      font-weight: 600;
      color: $sa-sky-dark;
    }
  }
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-filter {
  @include sa-button-secondary;
  position: relative;

  &.active {
    border-color: $sa-sky;
    color: $sa-sky;
    background: $sa-sky-light;
  }
}

.filter-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  background: $sa-orange-gradient;
  color: $sa-white;
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: $sa-radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $sa-shadow-orange;
}

.btn-primary {
  @include sa-button-primary;
}

// ============================================
// STATS OVERVIEW
// ============================================
.stats-overview {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  padding: 1.25rem;
  border-radius: $sa-radius-lg;
  border: 2px solid;
  background: $sa-white;
  transition: all $sa-transition;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $sa-shadow-lg;
  }

  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .stat-icon {
    @include sa-icon-wrapper(36px);
    border-radius: $sa-radius;
  }

  .stat-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.25rem 0.5rem;
    border-radius: $sa-radius-sm;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    font-family: $sa-font-heading;
    margin: 0 0 0.25rem;
    line-height: 1;
  }

  .stat-title {
    font-size: 0.8125rem;
    color: $sa-text-secondary;
    margin: 0;
  }

  // Total - Blue
  &.stat-total {
    background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
    border-color: $sa-sky;

    .stat-icon {
      background: linear-gradient(135deg, $sa-sky 0%, $sa-sky-dark 100%);
      color: $sa-white;
    }

    .stat-label {
      background: rgba($sa-sky-dark, 0.15);
      color: $sa-sky-dark;
    }

    .stat-value {
      color: $sa-sky-dark;
    }
  }

  // Confirmed - Green
  &.stat-confirmed {
    background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
    border-color: #4CAF50;

    .stat-icon {
      background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
      color: $sa-white;
    }

    .stat-label {
      background: rgba(#388E3C, 0.15);
      color: #388E3C;
    }

    .stat-value {
      color: #388E3C;
    }
  }

  // Completed - Purple
  &.stat-completed {
    background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
    border-color: #9C27B0;

    .stat-icon {
      background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
      color: $sa-white;
    }

    .stat-label {
      background: rgba(#7B1FA2, 0.15);
      color: #7B1FA2;
    }

    .stat-value {
      color: #7B1FA2;
    }
  }

  // No Show - Red
  &.stat-noshow {
    background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
    border-color: #EF4444;

    .stat-icon {
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: $sa-white;
    }

    .stat-label {
      background: rgba(#DC2626, 0.15);
      color: #DC2626;
    }

    .stat-value {
      color: #DC2626;
    }
  }

  // Today - Orange/Yellow
  &.stat-today {
    background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
    border-color: #FF9800;

    .stat-icon {
      background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
      color: $sa-white;
    }

    .stat-label {
      background: rgba(#F57C00, 0.15);
      color: #F57C00;
    }

    .stat-value {
      color: #F57C00;
    }
  }
}

// ============================================
// FILTERS SECTION
// ============================================
.filters-section {
  @include sa-card;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: $sa-shadow;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
  padding: 0.625rem 1rem;
  background: $sa-gray-100;
  border: 1px solid $sa-gray-200;
  border-radius: $sa-radius;
  transition: all $sa-transition;

  &:focus-within {
    background: $sa-white;
    border-color: $sa-sky;
    box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
  }

  .search-icon {
    color: $sa-gray-400;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.875rem;
    color: $sa-navy;

    &::placeholder {
      color: $sa-gray-400;
    }

    &:focus {
      outline: none;
    }
  }
}

.filter-select {
  padding: 0.625rem 2rem 0.625rem 1rem;
  border: 1px solid $sa-gray-200;
  border-radius: $sa-radius;
  font-size: 0.875rem;
  color: $sa-navy;
  background: $sa-white url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em no-repeat;
  appearance: none;
  cursor: pointer;
  transition: all $sa-transition;

  &:focus {
    outline: none;
    border-color: $sa-sky;
    box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
  }

  &:hover {
    border-color: $sa-gray-300;
  }
}

.btn-book-new {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: $sa-sky-gradient;
  color: $sa-white;
  border: none;
  border-radius: $sa-radius;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all $sa-transition;
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    box-shadow: $sa-shadow-sky;
  }
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: $sa-gray-100;
  border: 1px solid $sa-gray-200;
  border-radius: $sa-radius-full;
  font-size: 0.8125rem;
  font-weight: 500;
  color: $sa-text-secondary;
  cursor: pointer;
  transition: all $sa-transition;

  &:hover {
    background: $sa-gray-200;
    color: $sa-navy;
  }

  &.active {
    background: $sa-sky-gradient;
    border-color: $sa-sky;
    color: $sa-white;
    box-shadow: $sa-shadow-sky;
  }
}

// ============================================
// MORE FILTERS CARD
// ============================================
.more-filters-card {
  @include sa-card;
  margin-bottom: 1.5rem;
  box-shadow: $sa-shadow;
}

// ============================================
// VIEW TABS
// ============================================
.view-tabs-wrapper {
  margin-bottom: 1.25rem;
}

.view-tabs {
  display: flex;
  gap: 0.375rem;
  padding: 0.375rem;
  background: $sa-white;
  border: 1px solid $sa-gray-200;
  border-radius: $sa-radius-lg;
  box-shadow: $sa-shadow-xs;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: $sa-radius;
  color: $sa-text-secondary;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all $sa-transition;

  svg {
    opacity: 0.7;
  }

  &:hover {
    color: $sa-navy;
    background: $sa-gray-100;

    svg {
      opacity: 1;
    }
  }

  &.active {
    background: $sa-sky-gradient;
    color: $sa-white;
    box-shadow: $sa-shadow-sky;

    svg {
      opacity: 1;
    }

    .tab-count {
      background: rgba($sa-white, 0.2);
      color: $sa-white;
    }
  }
}

.tab-count {
  background: $sa-gray-200;
  padding: 0.125rem 0.5rem;
  border-radius: $sa-radius-full;
  font-size: 0.75rem;
  font-weight: 600;
}

// ============================================
// FILTERS CARD
// ============================================
.filters-card {
  @include sa-card;
  margin-bottom: 1.25rem;
  box-shadow: $sa-shadow;
}

.filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid $sa-gray-200;

  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: $sa-navy;
    margin: 0;

    svg {
      color: $sa-sky;
    }
  }
}

.btn-text {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  color: $sa-sky;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: color $sa-transition;

  &:hover {
    color: $sa-sky-dark;
  }
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-group {
  label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: $sa-text-secondary;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;

    svg {
      color: $sa-sky;
    }
  }

  select,
  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid $sa-gray-200;
    border-radius: $sa-radius;
    font-size: 0.875rem;
    color: $sa-navy;
    background: $sa-white;
    transition: all $sa-transition;

    &:focus {
      outline: none;
      border-color: $sa-sky;
      box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
    }
  }
}

// ============================================
// SEARCH CARD
// ============================================
.search-card {
  @include sa-card;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: $sa-shadow-sm;
  transition: all $sa-transition;

  &:focus-within {
    border-color: $sa-sky;
    box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
  }
}

.search-icon {
  @include sa-icon-wrapper(36px);
  background: $sa-sky-light;
  color: $sa-sky-dark;
}

.search-card input {
  flex: 1;
  border: none;
  font-size: 0.9375rem;
  color: $sa-navy;

  &::placeholder {
    color: $sa-gray-400;
  }

  &:focus {
    outline: none;
  }
}

.clear-search {
  background: none;
  border: none;
  color: $sa-gray-400;
  cursor: pointer;
  padding: 0.25rem;
  transition: color $sa-transition;

  &:hover {
    color: $sa-error;
  }
}

// ============================================
// LOADING CARD
// ============================================
.loading-card {
  @include sa-card;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  box-shadow: $sa-shadow;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;

  p {
    color: $sa-text-secondary;
    margin: 0;
    font-size: 0.9375rem;
  }
}

.spinner-wrapper {
  @include sa-icon-wrapper(60px);
  background: $sa-sky-light;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid $sa-gray-200;
  border-top-color: $sa-sky;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============================================
// EMPTY CARD
// ============================================
.empty-card {
  @include sa-card;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: $sa-shadow;
}

.empty-illustration {
  position: relative;
  margin-bottom: 2rem;
}

.empty-circle {
  width: 100px;
  height: 100px;
  background: $sa-sky-gradient;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sa-white;
  box-shadow: $sa-shadow-sky-lg;
}

.empty-decorations {
  position: absolute;
  inset: -20px;
  pointer-events: none;

  .deco {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $sa-sky;
    opacity: 0.5;

    &.deco-1 {
      top: 10px;
      left: 0;
      animation: float 3s ease-in-out infinite;
    }

    &.deco-2 {
      bottom: 10px;
      right: 0;
      animation: float 3s ease-in-out infinite 1s;
    }

    &.deco-3 {
      top: 50%;
      right: -10px;
      width: 6px;
      height: 6px;
      animation: float 3s ease-in-out infinite 0.5s;
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.empty-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: $sa-navy;
  margin: 0 0 0.5rem;
}

.empty-card p {
  color: $sa-text-secondary;
  margin: 0 0 2rem;
  font-size: 0.9375rem;
}

.btn-primary-lg {
  @include sa-button-primary;
  padding: 1rem 1.75rem;
  font-size: 0.9375rem;
}

// ============================================
// APPOINTMENTS TABLE
// ============================================
.appointments-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.appointments-table-card {
  @include sa-card;
  padding: 0;
  overflow: hidden;
  box-shadow: $sa-shadow;
}

.appointments-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 1rem 1.25rem;
    text-align: left;
    vertical-align: middle;
  }

  th {
    background: linear-gradient(180deg, $sa-gray-100 0%, $sa-bg 100%);
    font-size: 0.75rem;
    font-weight: 700;
    color: $sa-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid $sa-gray-200;
  }

  .th-checkbox,
  .td-checkbox {
    width: 48px;
    padding-left: 1.25rem;
    padding-right: 0.5rem;
  }

  .th-actions {
    width: 140px;
    text-align: center;
  }

  tbody tr {
    border-bottom: 1px solid $sa-gray-100;
    transition: all $sa-transition;

    &:hover {
      background: rgba($sa-sky, 0.03);
    }

    &:last-child {
      border-bottom: none;
    }

    &.selected {
      background: $sa-sky-light;

      &:hover {
        background: rgba($sa-sky, 0.15);
      }
    }

    // Row status colors
    &.row-completed {
      background: #F3E5F5; // Light purple

      &:hover {
        background: #EDE7F6;
      }
    }

    &.row-noshow {
      background: #FFEBEE; // Light red

      &:hover {
        background: #FFCDD2;
      }
    }
  }
}

// Custom Checkbox
.custom-checkbox {
  display: flex;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;

    &:checked + .checkmark {
      background: $sa-sky-gradient;
      border-color: $sa-sky;

      &::after {
        display: block;
      }
    }
  }

  .checkmark {
    width: 20px;
    height: 20px;
    background: $sa-white;
    border: 2px solid $sa-gray-300;
    border-radius: $sa-radius-sm;
    position: relative;
    transition: all $sa-transition;

    &::after {
      content: '';
      position: absolute;
      display: none;
      left: 6px;
      top: 2px;
      width: 5px;
      height: 10px;
      border: solid $sa-white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }

  &:hover .checkmark {
    border-color: $sa-sky;
  }
}

// Patient Cell
.patient-cell {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.patient-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.patient-name {
  font-weight: 600;
  color: $sa-navy;
  text-decoration: none;
  transition: color $sa-transition;
  @include sa-truncate;

  &:hover {
    color: $sa-sky-dark;
  }
}

.patient-email {
  font-size: 0.75rem;
  color: $sa-text-muted;
  @include sa-truncate;
}

// DateTime Cell
.datetime-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date, .time {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;

  svg {
    color: $sa-gray-400;
  }
}

.date {
  font-weight: 600;
  color: $sa-navy;
}

.time {
  color: $sa-text-secondary;
}

// Type Badge
.type-badge {
  display: inline-flex;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, $sa-gray-100 0%, $sa-gray-200 100%);
  border-radius: $sa-radius;
  font-size: 0.8125rem;
  font-weight: 500;
  color: $sa-text-secondary;
}

// Actions Cell
.actions-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  @include sa-icon-wrapper(34px);
  background: $sa-white;
  border: 1px solid $sa-gray-200;
  border-radius: $sa-radius;
  color: $sa-text-secondary;
  cursor: pointer;
  text-decoration: none;
  transition: all $sa-transition;

  &:hover {
    transform: translateY(-2px);
  }

  &.action-view:hover {
    border-color: $sa-sky;
    color: $sa-sky;
    background: $sa-sky-light;
    box-shadow: $sa-shadow-sky;
  }

  &.action-reschedule:hover {
    border-color: $sa-orange;
    color: $sa-orange;
    background: $sa-orange-light;
    box-shadow: $sa-shadow-orange;
  }

  &.action-cancel:hover {
    border-color: $sa-error;
    color: $sa-error;
    background: $sa-error-light;
    box-shadow: $sa-shadow-error;
  }

  &.action-edit:hover {
    border-color: $sa-orange;
    color: $sa-orange;
    background: $sa-orange-light;
    box-shadow: $sa-shadow-orange;
  }

  &.action-meeting:hover {
    border-color: #4CAF50;
    color: #4CAF50;
    background: #E8F5E9;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
  }

  &.action-notes:hover {
    border-color: #9C27B0;
    color: #9C27B0;
    background: #F3E5F5;
    box-shadow: 0 4px 12px rgba(156, 39, 176, 0.2);
  }

  &.action-recording:hover {
    border-color: #673AB7;
    color: #673AB7;
    background: #EDE7F6;
    box-shadow: 0 4px 12px rgba(103, 58, 183, 0.2);
  }

  &.action-reschedule:hover {
    border-color: $sa-orange;
    color: $sa-orange;
    background: $sa-orange-light;
    box-shadow: $sa-shadow-orange;
  }

  &.action-contact:hover {
    border-color: $sa-sky;
    color: $sa-sky;
    background: $sa-sky-light;
    box-shadow: $sa-shadow-sky;
  }

  &.action-more:hover {
    border-color: $sa-gray-400;
    color: $sa-gray-700;
    background: $sa-gray-100;
  }
}

// DateTime Cell
.datetime-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .date-text {
    font-weight: 600;
    color: $sa-navy;
    font-size: 0.875rem;
    margin: 0;
  }

  .time-text {
    font-size: 0.8125rem;
    color: $sa-text-secondary;
    margin: 0;
  }
}

// Channel Cell
.channel-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .channel-icon {
    color: $sa-sky;
  }

  .channel-text {
    font-size: 0.8125rem;
    color: $sa-text-secondary;
  }
}

// Type Badge Variants (matching consultation services from DB)
.type-badge {
  // Initial Appointment - Blue
  &.type-initial-appointment {
    background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
    color: #0284C7;
  }

  // Follow-up Appointment - Green
  &.type-follow-up-appointment {
    background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
    color: #16A34A;
  }

  // Second Opinion - Purple
  &.type-second-opinion {
    background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%);
    color: #7C3AED;
  }

  // Prescription Renewal - Orange
  &.type-prescription-renewal {
    background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
    color: #EA580C;
  }

  // Lab Results Review - Cyan
  &.type-lab-results-review {
    background: linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%);
    color: #0891B2;
  }

  // Mental Health Check-in - Pink
  &.type-mental-health-check-in {
    background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
    color: #EC4899;
  }

  // Note: Default styling for unknown types is in base .type-badge class above
}

// ============================================
// PAGINATION
// ============================================
.pagination-card {
  @include sa-card;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  box-shadow: $sa-shadow-sm;
}

.pagination-info {
  font-size: 0.875rem;
  color: $sa-text-secondary;

  .highlight {
    font-weight: 600;
    color: $sa-navy;
  }
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-btn {
  @include sa-icon-wrapper(36px);
  background: $sa-white;
  border: 1px solid $sa-gray-200;
  border-radius: $sa-radius;
  color: $sa-text-secondary;
  cursor: pointer;
  transition: all $sa-transition;

  &:hover:not(:disabled) {
    border-color: $sa-sky;
    color: $sa-sky;
    background: $sa-sky-light;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-num {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $sa-white;
  border: 1px solid $sa-gray-200;
  border-radius: $sa-radius;
  color: $sa-text-secondary;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all $sa-transition;

  &:hover {
    border-color: $sa-sky;
    color: $sa-sky;
  }

  &.active {
    background: $sa-sky-gradient;
    border-color: $sa-sky;
    color: $sa-white;
    box-shadow: $sa-shadow-sky;
  }
}

// ============================================
// BULK ACTIONS BAR
// ============================================
.bulk-actions-bar {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 0.875rem 1.5rem;
  background: $sa-navy;
  border-radius: $sa-radius-lg;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: $sa-z-sticky;
}

.bulk-left {
  display: flex;
  align-items: center;
}

.selection-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: rgba($sa-sky, 0.2);
  border-radius: $sa-radius;
  color: $sa-white;
  font-size: 0.875rem;
  font-weight: 600;
}

.bulk-actions {
  display: flex;
  gap: 0.5rem;
}

.bulk-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: rgba($sa-white, 0.1);
  border: none;
  border-radius: $sa-radius;
  color: $sa-white;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all $sa-transition;

  &:hover {
    background: rgba($sa-white, 0.2);
    transform: translateY(-1px);
  }

  &.bulk-danger {
    background: rgba($sa-error, 0.3);

    &:hover {
      background: $sa-error;
    }
  }
}

// ============================================
// TRANSITIONS
// ============================================
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all $sa-transition-slow;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all $sa-transition-slow;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

// ============================================
// RESPONSIVE
// ============================================
@media (max-width: $sa-breakpoint-lg) {
  .stats-overview {
    grid-template-columns: repeat(3, 1fr);
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;

    .btn-filter,
    .btn-primary {
      flex: 1;
      justify-content: center;
    }
  }

  .filters-row {
    .btn-book-new {
      width: 100%;
      justify-content: center;
    }
  }

  .view-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    @include sa-scrollbar;
  }

  .tab-btn {
    flex: 0 0 auto;
    padding: 0.625rem 1rem;
  }

  .appointments-table-card {
    overflow-x: auto;
    @include sa-scrollbar;
  }

  .appointments-table {
    min-width: 800px;
  }

  .pagination-card {
    flex-direction: column;
    gap: 1rem;
  }

  .page-numbers {
    display: none;
  }
}

@media (max-width: $sa-breakpoint-md) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    padding: 1rem;

    .stat-value {
      font-size: 1.5rem;
    }

    .stat-header .stat-label {
      display: none;
    }
  }

  .sa-appointments-list {
    padding: 0 0.75rem;
  }

  .header-icon {
    display: none;
  }

  .filters-row {
    flex-direction: column;

    .search-input-wrapper {
      width: 100%;
    }

    .filter-select {
      width: 100%;
    }
  }

  .filter-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 0.5rem;
    @include sa-scrollbar;
  }

  .filter-tab {
    flex-shrink: 0;
    white-space: nowrap;
  }

  .tab-btn span:not(.tab-count) {
    display: none;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .bulk-actions-bar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    left: 1rem;
    right: 1rem;
    transform: none;
    width: auto;
  }
}

@media (max-width: 480px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }

  .stat-card {
    .stat-header {
      .stat-label {
        display: block;
      }
    }
  }
}
</style>
