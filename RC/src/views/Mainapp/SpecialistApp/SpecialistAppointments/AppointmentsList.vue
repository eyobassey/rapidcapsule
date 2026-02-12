<template>
  <div class="appointments-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <v-icon name="hi-clipboard-list" scale="1" />
        <span>Appointments</span>
      </div>
      <router-link :to="{ name: 'SpecialistAppointmentsCreate' }" class="header-action-btn">
        <v-icon name="hi-plus" scale="1" />
      </router-link>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero__content">
        <div class="hero__badge">
          <div class="badge-pulse"></div>
          <v-icon name="hi-clipboard-list" />
          <span>Appointments Manager</span>
        </div>
        <h1 class="hero__title">
          All<br/>
          <span class="hero__title-accent">Appointments</span>
        </h1>
        <p class="hero__subtitle">
          View, filter, and manage all your appointments in one place.
        </p>
        <div class="hero__stats">
          <div class="hero-stat">
            <span class="hero-stat__value">{{ statusCounts.total }}</span>
            <span class="hero-stat__label">Total</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value hero-stat__value--success">{{ statusCounts.confirmed }}</span>
            <span class="hero-stat__label">Confirmed</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value hero-stat__value--warning">{{ statusCounts.completed }}</span>
            <span class="hero-stat__label">Completed</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value hero-stat__value--danger">{{ statusCounts.today }}</span>
            <span class="hero-stat__label">Today</span>
          </div>
        </div>
      </div>
      <div class="hero__visual">
        <div class="dashboard-orb">
          <div class="orb-ring orb-ring--1"></div>
          <div class="orb-ring orb-ring--2"></div>
          <div class="orb-ring orb-ring--3"></div>
          <div class="orb-core">
            <v-icon name="hi-clipboard-list" />
          </div>
        </div>
        <div class="floating-icons">
          <div class="float-icon float-icon--1"><v-icon name="hi-calendar" /></div>
          <div class="float-icon float-icon--2"><v-icon name="hi-check-circle" /></div>
          <div class="float-icon float-icon--3"><v-icon name="hi-user-group" /></div>
        </div>
      </div>
    </section>

    <!-- Filters Section -->
    <section class="bento-card filters-card">
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
          Book New
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

    <!-- More Filters Panel -->
    <transition name="slide-down">
      <div v-if="showFilters" class="bento-card more-filters-card">
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
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <v-icon name="hi-clipboard-list" scale="1.2" class="spinner-icon" />
      </div>
      <p>Loading appointments...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="appointments.length === 0" class="bento-card empty-card">
      <div class="empty-illustration">
        <div class="empty-circle">
          <v-icon name="hi-calendar" scale="2.5" />
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
      <div class="bento-card table-card">
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
      <div class="bento-card pagination-card">
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

function getRowClass(status) {
  const normalized = normalizeStatus(status);
  if (normalized === 'completed') return 'row-completed';
  if (normalized === 'no_show') return 'row-noshow';
  return '';
}

function setStatusFilter(status) {
  filters.status = status;
  fetchAppointments(1);
}

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

function getTypeBadgeClass(type) {
  if (!type) return '';
  const slug = type.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `type-${slug}`;
}

function getChannelLabel(channel) {
  const found = filterOptions.channels.find(c => c.value === channel);
  if (found) return found.label;

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

function openClinicalNoteModal(appointment) {
  selectedAppointment.value = appointment;
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

function getPatientImage(appointment) {
  const profileImage = appointment.patient?.profile?.profile_photo ||
                       appointment.patient?.profile?.profile_image ||
                       appointment.patient?.profile_photo;
  if (!profileImage) return '';

  if (profileImage.startsWith('http')) return profileImage;

  const s3BaseUrl = 'https://rapidcapsule.s3.eu-west-2.amazonaws.com/';
  return s3BaseUrl + profileImage;
}

onMounted(() => {
  fetchAppointments(1);
  fetchFilterOptions();
});
</script>

<style scoped lang="scss">
@import './styles/sa-variables';

// Dashboard design tokens (override for visual consistency)
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

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.appointments-page {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

// ============================================
// MOBILE HEADER
// ============================================
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

  .menu-btn, .header-action-btn {
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
    text-decoration: none;

    &:active { background: #E2E8F0; }
  }

  .header-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: $navy;

    svg { color: $sky-dark; }
  }
}

// ============================================
// HERO SECTION
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
  margin-bottom: 24px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    padding: 28px 20px 24px;
    gap: 0;
    text-align: center;
    min-height: unset;
    border-radius: 20px;
    margin-bottom: 16px;
  }
}

.hero__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 2;

  @media (max-width: 768px) {
    width: 100%;
    align-items: center;
  }
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

  @media (max-width: 768px) { margin: 0 auto 16px; }

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
  }

  svg {
    width: 16px;
    height: 16px;
    color: white;
    margin-left: 12px;
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: white;
    letter-spacing: 0.3px;
  }
}

.hero__title {
  font-size: 48px;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  margin: 0 0 16px;
  letter-spacing: -1px;

  @media (max-width: 768px) {
    font-size: 32px;
    margin: 0 0 12px;
    br { display: none; }
  }

  .hero__title-accent {
    background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.hero__subtitle {
  font-size: 18px;
  color: white;
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 400px;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: 15px;
    max-width: 100%;
    margin: 0 0 20px;
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
    padding: 16px;
    gap: 8px;
  }
}

.hero-stat {
  text-align: center;
  flex: 1;

  &__value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: white;
    line-height: 1;

    @media (max-width: 768px) { font-size: 22px; }

    &--success { color: $emerald-light; }
    &--warning { color: $amber-light; }
    &--danger { color: $rose-light; }
  }

  &__label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
  }
}

// Hero Visual
.hero__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  @media (max-width: 768px) { display: none; }
}

.dashboard-orb {
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

  &--1 { width: 100%; height: 100%; animation: spin-slow 20s linear infinite; }
  &--2 { width: 80%; height: 80%; animation: spin-slow 15s linear infinite reverse; }
  &--3 { width: 60%; height: 60%; animation: spin-slow 10s linear infinite; }
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

  svg { width: 48px; height: 48px; color: white; }
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

  svg { width: 20px; height: 20px; color: white; }

  &--1 { top: 10%; right: 10%; animation-delay: 0s; }
  &--2 { bottom: 20%; right: 5%; animation-delay: 1s; }
  &--3 { bottom: 10%; left: 10%; animation-delay: 2s; }
}

// Animations
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
  50% { transform: translateY(-8px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============================================
// BENTO CARD BASE
// ============================================
.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 16px;
    margin-bottom: 16px;
  }
}

// ============================================
// FILTERS SECTION
// ============================================
.filters-card {
  padding: 20px;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
  padding: 10px 16px;
  background: $bg;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  transition: all 0.2s;

  &:focus-within {
    background: white;
    border-color: $sky;
    box-shadow: 0 0 0 3px rgba($sky, 0.1);
  }

  .search-icon { color: $light-gray; }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    color: $navy;

    &::placeholder { color: $light-gray; }
    &:focus { outline: none; }
  }
}

.filter-select {
  padding: 10px 32px 10px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  font-size: 14px;
  color: $navy;
  background: white url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 8px center/1.5em no-repeat;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: $sky;
    box-shadow: 0 0 0 3px rgba($sky, 0.1);
  }
}

.btn-book-new {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba($sky, 0.3);
  }
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: $bg;
  border: 1px solid #E2E8F0;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: $gray;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #E2E8F0;
    color: $navy;
  }

  &.active {
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border-color: $sky;
    color: white;
    box-shadow: 0 4px 14px rgba($sky, 0.25);
  }
}

// ============================================
// MORE FILTERS
// ============================================
.more-filters-card {
  .filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #F1F5F9;

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }
  }

  .btn-text {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: $sky-dark;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;

    &:hover { color: $sky-darker; }
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .filter-group {
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: $gray;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    select, input {
      width: 100%;
      padding: 10px 16px;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      font-size: 14px;
      color: $navy;
      background: white;

      &:focus {
        outline: none;
        border-color: $sky;
        box-shadow: 0 0 0 3px rgba($sky, 0.1);
      }
    }
  }
}

// ============================================
// LOADING STATE
// ============================================
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  gap: 16px;

  .loading-spinner {
    position: relative;
    width: 64px;
    height: 64px;

    .spinner-ring {
      position: absolute;
      inset: 0;
      border: 3px solid $sky-light;
      border-top-color: $sky;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: $sky;
    }
  }

  p {
    color: $gray;
    font-size: 14px;
  }
}

// ============================================
// EMPTY STATE
// ============================================
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;

  .empty-illustration {
    margin-bottom: 24px;
  }

  .empty-circle {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 8px 20px rgba($sky, 0.3);
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px;
  }

  p {
    color: $gray;
    margin: 0 0 24px;
    font-size: 15px;
  }
}

.btn-primary-lg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba($sky, 0.3);
  }
}

// ============================================
// APPOINTMENTS TABLE
// ============================================
.appointments-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.appointments-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 16px 20px;
    text-align: left;
    vertical-align: middle;
  }

  th {
    background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
    font-size: 12px;
    font-weight: 700;
    color: $gray;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid #E2E8F0;
  }

  .th-checkbox,
  .td-checkbox {
    width: 48px;
    padding-left: 20px;
    padding-right: 8px;
  }

  .th-actions {
    width: 140px;
    text-align: center;
  }

  tbody tr {
    border-bottom: 1px solid #F1F5F9;
    transition: all 0.2s;

    &:hover {
      background: rgba($sky, 0.03);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    &:last-child { border-bottom: none; }

    &.selected {
      background: $sky-light;

      &:hover { background: rgba($sky, 0.15); }
    }

    &.row-completed {
      background: rgba($violet-light, 0.5);
      &:hover { background: $violet-light; }
    }

    &.row-noshow {
      background: rgba($rose-light, 0.5);
      &:hover { background: $rose-light; }
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
      background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
      border-color: $sky;

      &::after { display: block; }
    }
  }

  .checkmark {
    width: 20px;
    height: 20px;
    background: white;
    border: 2px solid #CBD5E1;
    border-radius: 6px;
    position: relative;
    transition: all 0.2s;

    &::after {
      content: '';
      position: absolute;
      display: none;
      left: 6px;
      top: 2px;
      width: 5px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }

  &:hover .checkmark { border-color: $sky; }
}

// Patient Cell
.patient-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.patient-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.patient-name {
  font-weight: 600;
  font-size: 14px;
  color: $navy;
  text-decoration: none;
  transition: color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover { color: $sky-dark; }
}

.patient-email {
  font-size: 12px;
  color: $light-gray;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// DateTime Cell
.datetime-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .date-text {
    font-weight: 600;
    color: $navy;
    font-size: 14px;
    margin: 0;
  }

  .time-text {
    font-size: 13px;
    color: $gray;
    margin: 0;
  }
}

// Channel Cell
.channel-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .channel-icon { color: $sky; }
  .channel-text { font-size: 13px; color: $gray; }
}

// Type Badge
.type-badge {
  display: inline-flex;
  padding: 6px 12px;
  background: #F1F5F9;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: $gray;

  &.type-initial-appointment {
    background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
    color: #0284C7;
  }

  &.type-follow-up-appointment {
    background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
    color: #16A34A;
  }

  &.type-second-opinion {
    background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%);
    color: #7C3AED;
  }

  &.type-prescription-renewal {
    background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
    color: #EA580C;
  }

  &.type-lab-results-review {
    background: linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%);
    color: #0891B2;
  }

  &.type-mental-health-check-in {
    background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
    color: #EC4899;
  }
}

// Actions Cell
.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  color: $gray;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover { transform: translateY(-2px); }

  &.action-view:hover {
    border-color: $sky;
    color: $sky;
    background: $sky-light;
    box-shadow: 0 4px 14px rgba($sky, 0.25);
  }

  &.action-edit:hover,
  &.action-reschedule:hover {
    border-color: $amber;
    color: $amber;
    background: $amber-light;
    box-shadow: 0 4px 14px rgba($amber, 0.25);
  }

  &.action-meeting:hover {
    border-color: $emerald;
    color: $emerald;
    background: $emerald-light;
    box-shadow: 0 4px 14px rgba($emerald, 0.25);
  }

  &.action-notes:hover {
    border-color: $violet;
    color: $violet;
    background: $violet-light;
    box-shadow: 0 4px 14px rgba($violet, 0.25);
  }

  &.action-recording:hover {
    border-color: $violet;
    color: $violet;
    background: $violet-light;
    box-shadow: 0 4px 14px rgba($violet, 0.25);
  }

  &.action-contact:hover {
    border-color: $sky;
    color: $sky;
    background: $sky-light;
    box-shadow: 0 4px 14px rgba($sky, 0.25);
  }

  &.action-more:hover {
    border-color: $light-gray;
    color: $slate;
    background: #F1F5F9;
  }
}

// ============================================
// PAGINATION
// ============================================
.pagination-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.pagination-info {
  font-size: 14px;
  color: $gray;

  .highlight {
    font-weight: 600;
    color: $navy;
  }
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  color: $gray;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: $sky;
    color: $sky;
    background: $sky-light;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-num {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  color: $gray;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $sky;
    color: $sky;
  }

  &.active {
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border-color: $sky;
    color: white;
    box-shadow: 0 4px 14px rgba($sky, 0.25);
  }
}

// ============================================
// BULK ACTIONS BAR
// ============================================
.bulk-actions-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 14px 24px;
  background: $navy;
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 150;
}

.bulk-left {
  display: flex;
  align-items: center;
}

.selection-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba($sky, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.bulk-actions {
  display: flex;
  gap: 8px;
}

.bulk-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  &.bulk-danger {
    background: rgba($rose, 0.3);

    &:hover { background: $rose; }
  }
}

// ============================================
// TRANSITIONS
// ============================================
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

// ============================================
// RESPONSIVE
// ============================================
@media (max-width: 1024px) {
  .filters-row {
    .btn-book-new {
      width: 100%;
      justify-content: center;
    }
  }

  .table-card {
    overflow-x: auto;

    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 3px;
    }
  }

  .appointments-table {
    min-width: 800px;
  }

  .pagination-card {
    flex-direction: column;
    gap: 16px;
  }

  .page-numbers {
    display: none;
  }
}

@media (max-width: 768px) {
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
    padding-bottom: 8px;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 2px;
    }
  }

  .filter-tab {
    flex-shrink: 0;
    white-space: nowrap;
  }

  .more-filters-card .filters-grid {
    grid-template-columns: 1fr;
  }

  .bulk-actions-bar {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    left: 16px;
    right: 16px;
    transform: none;
    width: auto;
  }
}
</style>
