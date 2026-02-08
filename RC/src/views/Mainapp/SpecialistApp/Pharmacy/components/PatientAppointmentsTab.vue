<template>
  <div class="appointments-tab">
    <!-- Header with filters -->
    <div class="appointments-header">
      <div class="appointments-count">
        <span class="count-number">{{ pagination.total || 0 }}</span>
        <span class="count-label">Appointments</span>
      </div>
      <div class="header-actions">
        <div class="filter-dropdown">
          <select v-model="statusFilter" @change="fetchAppointments(1)">
            <option value="all">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="OPEN">Open</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="MISSED">Missed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="FAILED">Failed</option>
          </select>
          <v-icon name="hi-chevron-down" scale="0.7" />
        </div>
        <button class="sort-btn" @click="toggleSort" :title="sortOrder === 'desc' ? 'Newest first' : 'Oldest first'">
          <v-icon :name="sortOrder === 'desc' ? 'hi-sort-descending' : 'hi-sort-ascending'" scale="0.9" />
        </button>
      </div>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="loading" class="appointments-skeleton">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="skeleton-shimmer" />
      </div>
    </div>

    <!-- Appointments Timeline -->
    <div v-else-if="appointments.length" class="appointments-content">
      <div class="appointments-timeline">
        <div
          v-for="(appointment, index) in appointments"
          :key="appointment._id"
          class="appointment-card appointment-card--clickable"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @click="viewAppointment(appointment)"
        >
          <div class="appointment-card__timeline">
            <div :class="['timeline-dot', `timeline-dot--${getStatusClass(appointment.status)}`]" />
            <div v-if="index < appointments.length - 1" class="timeline-line" />
          </div>

          <div class="appointment-card__content">
            <!-- Specialist Info -->
            <div v-if="appointment.specialist" class="appointment-card__specialist">
              <div class="specialist-avatar">
                <img
                  v-if="appointment.specialist.profile_image"
                  :src="appointment.specialist.profile_image"
                  :alt="appointment.specialist.name"
                />
                <span v-else class="avatar-fallback">
                  {{ getInitials(appointment.specialist.name) }}
                </span>
              </div>
              <div class="specialist-info">
                <span class="specialist-name">{{ appointment.specialist.name }}</span>
                <span class="specialist-label">Specialist</span>
              </div>
            </div>

            <div class="appointment-card__header">
              <div class="appointment-card__date">
                <v-icon name="hi-calendar" scale="0.7" />
                <span>{{ formatAppointmentDate(appointment.appointment_date) }}</span>
              </div>
              <span :class="['status-badge', `status-badge--${getStatusClass(appointment.status)}`]">
                {{ formatStatus(appointment.status) }}
              </span>
            </div>

            <div class="appointment-card__details">
              <div class="detail-row">
                <v-icon name="hi-clock" scale="0.7" />
                <span>{{ appointment.appointment_time || 'Time not set' }}</span>
                <span v-if="appointment.duration" class="duration-badge">{{ appointment.duration }} min</span>
              </div>
              <div v-if="appointment.type" class="detail-row">
                <v-icon name="hi-tag" scale="0.7" />
                <span>{{ formatType(appointment.type) }}</span>
                <span v-if="appointment.meeting_type" class="meeting-badge">{{ appointment.meeting_type }}</span>
              </div>
              <div v-if="appointment.reason" class="detail-row reason-row">
                <v-icon name="hi-annotation" scale="0.7" />
                <span>{{ appointment.reason }}</span>
              </div>
            </div>

            <div v-if="appointment.notes" class="appointment-card__notes">
              <div class="notes-header">
                <v-icon name="hi-document-text" scale="0.65" />
                <span>Clinical Notes</span>
              </div>
              <p class="notes-content">{{ truncateNotes(appointment.notes) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="!pagination.hasPrevPage"
          @click="fetchAppointments(pagination.page - 1)"
        >
          <v-icon name="hi-chevron-left" scale="0.8" />
          Previous
        </button>
        <span class="pagination-info">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>
        <button
          class="pagination-btn"
          :disabled="!pagination.hasNextPage"
          @click="fetchAppointments(pagination.page + 1)"
        >
          Next
          <v-icon name="hi-chevron-right" scale="0.8" />
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-state__visual">
        <div class="calendar-orb">
          <div class="orb-ring orb-ring--1" />
          <div class="orb-ring orb-ring--2" />
          <div class="orb-center">
            <v-icon name="hi-calendar" scale="2" />
          </div>
        </div>
      </div>
      <div class="empty-state__content">
        <h3>No Appointments Found</h3>
        <p v-if="statusFilter !== 'all'">No {{ statusFilter.toLowerCase() }} appointments. Try a different filter.</p>
        <p v-else>Appointment history for this patient will appear here</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';

const props = defineProps({
  patientId: { type: String, required: true },
});

const router = useRouter();
const $toast = useToast();
const loading = ref(false);
const appointments = ref([]);
const statusFilter = ref('all');
const sortOrder = ref('desc');
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

onMounted(() => {
  fetchAppointments(1);
});

watch(() => props.patientId, () => {
  fetchAppointments(1);
});

async function fetchAppointments(page = 1) {
  loading.value = true;
  try {
    const response = await apiFactory.$_getPharmacyPatientAppointments(props.patientId, {
      page,
      limit: 10,
      status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
      sort: sortOrder.value,
    });
    const result = response.data?.data || response.data?.result || response.data;
    if (result) {
      appointments.value = result.docs || [];
      pagination.value = {
        page: result.page || 1,
        limit: result.limit || 10,
        total: result.total || 0,
        totalPages: result.totalPages || 1,
        hasNextPage: result.hasNextPage || false,
        hasPrevPage: result.hasPrevPage || false,
      };
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
    $toast.error('Failed to load appointments');
  } finally {
    loading.value = false;
  }
}

function toggleSort() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
  fetchAppointments(1);
}

function viewAppointment(appointment) {
  const appointmentId = appointment._id || appointment.id;
  if (appointmentId) {
    router.push(`/app/specialist/appointments-v2/${appointmentId}`);
  }
}

function getInitials(name) {
  if (!name) return '?';
  return name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatAppointmentDate(date) {
  if (!date) return 'Date not set';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatStatus(status) {
  if (!status) return 'Unknown';
  const statusMap = {
    open: 'Open',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    missed: 'Missed',
    failed: 'Failed',
    no_show: 'No Show',
    in_progress: 'In Progress',
  };
  return statusMap[status.toLowerCase()] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getStatusClass(status) {
  if (!status) return 'unknown';
  const s = status.toLowerCase();
  if (s === 'completed') return 'completed';
  if (s === 'confirmed' || s === 'open') return 'confirmed';
  if (s === 'pending') return 'pending';
  if (s === 'cancelled' || s === 'no_show' || s === 'failed') return 'cancelled';
  if (s === 'missed') return 'missed';
  if (s === 'in_progress') return 'in-progress';
  return 'unknown';
}

function formatType(type) {
  if (!type) return 'General';
  const typeMap = {
    general: 'General Consultation',
    consultation: 'Consultation',
    follow_up: 'Follow-up',
    specialist: 'Specialist Consultation',
    emergency: 'Emergency',
    virtual: 'Virtual Consultation',
    in_person: 'In-Person Visit',
  };
  return typeMap[type.toLowerCase()] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function truncateNotes(notes) {
  if (!notes) return '';
  if (notes.length <= 150) return notes;
  return notes.substring(0, 150) + '...';
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$amber: #F59E0B;
$rose: #F43F5E;
$violet: #8B5CF6;
$orange: #F97316;

.appointments-tab {
  min-height: 200px;
}

.appointments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.appointments-count {
  display: flex;
  align-items: baseline;
  gap: 8px;

  .count-number {
    font-size: 28px;
    font-weight: 700;
    color: $sky-dark;
  }

  .count-label {
    font-size: 14px;
    color: $color-g-54;
    font-weight: 500;
  }
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-dropdown {
  position: relative;
  display: flex;
  align-items: center;

  select {
    appearance: none;
    padding: 10px 36px 10px 14px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba($color-g-92, 0.6);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: $color-g-36;
    cursor: pointer;
    transition: all 0.2s;

    &:hover, &:focus {
      border-color: $sky;
      outline: none;
    }
  }

  svg {
    position: absolute;
    right: 12px;
    pointer-events: none;
    color: $color-g-54;
  }
}

.sort-btn {
  width: 40px;
  height: 40px;
  border: 1px solid rgba($color-g-92, 0.6);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: $color-g-54;
  transition: all 0.2s;

  &:hover {
    border-color: $sky;
    color: $sky-dark;
  }
}

.appointments-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-card {
  height: 140px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba($color-g-92, 0.5);
  overflow: hidden;
  position: relative;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba($sky, 0.08) 50%, transparent 100%);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.appointments-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.appointments-timeline {
  display: flex;
  flex-direction: column;
}

.appointment-card {
  display: flex;
  gap: 20px;
  animation: fadeSlideUp 0.4s ease forwards;
  opacity: 0;

  &--clickable {
    cursor: pointer;

    .appointment-card__content {
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
        border-color: rgba($sky, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  @media (max-width: 600px) {
    gap: 14px;
  }

  &__timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;

    @media (max-width: 500px) {
      display: none;
    }
  }

  &__content {
    flex: 1;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba($color-g-92, 0.5);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      border-color: rgba($sky, 0.2);
    }
  }

  &__specialist {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 14px;
    margin-bottom: 14px;
    border-bottom: 1px solid rgba($color-g-92, 0.5);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__date {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: $color-g-21;

    svg {
      color: $sky-dark;
    }
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__notes {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid rgba($color-g-92, 0.5);

    .notes-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: $color-g-54;
      margin-bottom: 8px;

      svg {
        color: $color-g-67;
      }
    }

    .notes-content {
      font-size: 13px;
      color: $color-g-44;
      line-height: 1.5;
    }
  }
}

.specialist-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.3) 100%);
    color: $sky-dark;
    font-size: 14px;
    font-weight: 700;
  }
}

.specialist-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.specialist-name {
  font-size: 14px;
  font-weight: 600;
  color: $color-g-21;
}

.specialist-label {
  font-size: 11px;
  color: $color-g-54;
}

.timeline-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;

  &--completed { background: $emerald; }
  &--confirmed { background: $sky-dark; }
  &--pending { background: $amber; }
  &--cancelled { background: $rose; }
  &--missed { background: $orange; }
  &--in-progress { background: $violet; }
  &--unknown { background: $color-g-67; }
}

.timeline-line {
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: linear-gradient(180deg, rgba($color-g-92, 0.8) 0%, rgba($color-g-92, 0.3) 100%);
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: $color-g-54;

  svg {
    color: $color-g-67;
    flex-shrink: 0;
  }

  &.reason-row {
    color: $color-g-44;
  }
}

.duration-badge, .meeting-badge {
  padding: 2px 8px;
  background: rgba($sky, 0.1);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: $sky-dark;
}

.meeting-badge {
  background: rgba($violet, 0.1);
  color: $violet;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;

  &--completed {
    background: rgba($emerald, 0.1);
    color: darken($emerald, 10%);
  }

  &--confirmed {
    background: rgba($sky-dark, 0.1);
    color: $sky-dark;
  }

  &--pending {
    background: rgba($amber, 0.1);
    color: darken($amber, 10%);
  }

  &--cancelled {
    background: rgba($rose, 0.1);
    color: $rose;
  }

  &--missed {
    background: rgba($orange, 0.1);
    color: darken($orange, 10%);
  }

  &--in-progress {
    background: rgba($violet, 0.1);
    color: $violet;
  }

  &--unknown {
    background: rgba($color-g-67, 0.1);
    color: $color-g-54;
  }
}

// Pagination
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid rgba($color-g-92, 0.5);
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba($color-g-92, 0.6);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: $color-g-36;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: $sky;
    color: $sky-dark;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-info {
  font-size: 13px;
  color: $color-g-54;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;

  &__visual {
    margin-bottom: 24px;
  }

  &__content {
    h3 {
      font-size: 18px;
      font-weight: 700;
      color: $color-g-21;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      color: $color-g-54;
    }
  }
}

.calendar-orb {
  position: relative;
  width: 100px;
  height: 100px;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba($sky, 0.25);

  &--1 {
    inset: 0;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    inset: 12px;
    border-style: dashed;
    animation: spin-slow 15s linear infinite reverse;
  }
}

.orb-center {
  position: absolute;
  inset: 24px;
  background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sky-dark;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
