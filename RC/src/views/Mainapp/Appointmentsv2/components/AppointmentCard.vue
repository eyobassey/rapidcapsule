<template>
  <div
    class="appointment-card"
    :class="[statusClass, { 'is-past': isPast }]"
    @click="handleCardClick"
  >
    <!-- Left Accent Bar -->
    <div class="accent-bar" :class="statusClass"></div>

    <div class="card-content">
      <div class="card-main">
        <!-- Date & Time Column -->
        <div class="date-time-col">
          <div class="date-box" :class="statusClass">
            <span class="date-month">{{ monthLabel }}</span>
            <span class="date-day">{{ dayNumber }}</span>
            <span class="date-relative" v-if="relativeDay">{{ relativeDay }}</span>
          </div>
          <div class="time-info">
            <div class="time-value">{{ formattedTime }}</div>
            <div class="duration-text">{{ durationText }}</div>
            <span class="status-badge" :class="statusClass">
              <v-icon :name="statusIcon" scale="0.6" />
              {{ displayStatus }}
            </span>
          </div>
        </div>

        <!-- Doctor Info Column -->
        <div class="doctor-col">
          <div class="doctor-info">
            <div class="doctor-avatar">
              <RCAvatar
                :firstName="specialistFirstName"
                :lastName="specialistLastName"
                :modelValue="specialistImage"
                :size="56"
              />
              <div v-if="isOnline && !isPast" class="online-indicator"></div>
            </div>
            <div class="doctor-details">
              <h3 class="doctor-name">{{ specialistName }}</h3>
              <div class="doctor-specialty">{{ specialty }}</div>
              <div class="meeting-type">
                <v-icon :name="meetingIcon" scale="0.7" class="meeting-icon" />
                <span>{{ meetingTypeLabel }}</span>
              </div>
              <!-- Data Badges for Notes and Prescriptions -->
              <div class="data-badges" v-if="hasClinicalNotes || hasPrescriptions">
                <button
                  v-if="hasClinicalNotes"
                  class="data-badge badge-notes"
                  @click.stop="handleViewNotes"
                >
                  <v-icon name="hi-document-text" scale="0.65" />
                  <span>Notes ({{ clinicalNotesCount }})</span>
                </button>
                <button
                  v-if="hasPrescriptions"
                  class="data-badge badge-rx"
                  @click.stop="handleViewPrescription"
                >
                  <v-icon name="gi-medicines" scale="0.65" />
                  <span>RX ({{ prescriptionsCount }})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Column -->
        <div class="actions-col">
          <!-- Upcoming/Confirmed Actions -->
          <template v-if="!isPast && !isPending && !isCancelled">
            <button
              class="action-btn primary join-btn"
              :disabled="!canJoin"
              @click="$emit('join', appointment)"
            >
              <v-icon name="hi-video-camera" scale="0.85" />
              <span>Join Call</span>
            </button>
            <!-- Mobile Action Sheet Trigger -->
            <button
              class="mobile-more-btn"
              @click="$emit('open-action-sheet', appointment)"
              aria-label="More options"
            >
              <v-icon name="hi-dots-horizontal" scale="1.1" />
            </button>
            <!-- Desktop Dropdown -->
            <div class="dropdown-wrapper desktop-only">
              <button class="action-btn secondary manage-btn" @click.stop="toggleDropdown">
                <span>Manage</span>
                <v-icon name="hi-chevron-down" scale="0.6" />
              </button>
              <div v-if="showDropdown" class="dropdown-menu" @click.stop>
                <button class="dropdown-item" @click="handleReschedule">
                  <v-icon name="hi-calendar" scale="0.75" />
                  Reschedule
                </button>
                <button class="dropdown-item" @click="handleViewReceipt">
                  <v-icon name="hi-document-text" scale="0.75" />
                  View Receipt
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item danger" @click="handleCancel">
                  <v-icon name="hi-x-circle" scale="0.75" />
                  Cancel
                </button>
              </div>
            </div>
          </template>

          <!-- Pending Payment Actions -->
          <template v-else-if="isPending">
            <button class="action-btn navy" @click="$emit('complete-payment', appointment)">
              <span>Complete Payment</span>
              <v-icon name="hi-arrow-right" scale="0.7" />
            </button>
            <button class="action-btn cancel-btn" @click="handleCancel">
              Cancel
            </button>
          </template>

          <!-- Past/Completed Actions -->
          <template v-else-if="isPast">
            <button v-if="hasPrescriptions" class="action-btn secondary" @click="handleViewPrescription">
              <v-icon name="ri-medicine-bottle-line" scale="0.8" />
              <span>Prescription</span>
            </button>
            <button class="action-btn secondary" @click="handleViewReceipt">
              <v-icon name="hi-document-text" scale="0.8" />
              <span>Receipt</span>
            </button>
            <button class="action-btn book-again" @click="handleBookAgain">
              Book Again
            </button>
          </template>
        </div>
      </div>

      <!-- Footer Info -->
      <div v-if="!isPast && footerMessage" class="card-footer" :class="statusClass">
        <div class="footer-message">
          <v-icon :name="footerIcon" scale="0.7" class="footer-icon" />
          <span>{{ footerMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { format, parseISO, isToday, isTomorrow, isYesterday, differenceInMinutes } from 'date-fns';
import RCAvatar from '@/components/RCAvatar/RCAvatar.vue';

const props = defineProps({
  appointment: {
    type: Object,
    required: true,
  },
  isPast: {
    type: Boolean,
    default: false,
  },
  prescriptions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  'join',
  'reschedule',
  'cancel',
  'view-receipt',
  'view-prescription',
  'view-notes',
  'book-again',
  'complete-payment',
  'open-action-sheet', // For mobile action sheet
  'view-details', // Navigate to appointment details page
]);

const showDropdown = ref(false);

// Status normalization
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

const displayStatus = computed(() => normalizeStatus(props.appointment.status));

const statusClass = computed(() => {
  const status = displayStatus.value.toLowerCase();
  if (status === 'confirmed' || status === 'ongoing') return 'confirmed';
  if (status === 'pending') return 'pending';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled' || status === 'failed') return 'cancelled';
  return 'confirmed';
});

const isPending = computed(() => displayStatus.value === 'Pending');
const isCancelled = computed(() => ['Cancelled', 'Failed'].includes(displayStatus.value));

const statusIcon = computed(() => {
  switch (statusClass.value) {
    case 'confirmed': return 'hi-check-circle';
    case 'pending': return 'hi-clock';
    case 'completed': return 'hi-check';
    case 'cancelled': return 'hi-x-circle';
    default: return 'hi-check-circle';
  }
});

// Date formatting
const appointmentDate = computed(() => {
  const d = props.appointment.start_time || props.appointment.date;
  if (!d) return new Date();
  return typeof d === 'string' ? parseISO(d) : d;
});

const monthLabel = computed(() => {
  try {
    return format(appointmentDate.value, 'MMM').toUpperCase();
  } catch {
    return '--';
  }
});

const dayNumber = computed(() => {
  try {
    return format(appointmentDate.value, 'd');
  } catch {
    return '--';
  }
});

const relativeDay = computed(() => {
  try {
    if (isToday(appointmentDate.value)) return 'Today';
    if (isTomorrow(appointmentDate.value)) return 'Tomorrow';
    if (isYesterday(appointmentDate.value)) return 'Yesterday';
    return format(appointmentDate.value, 'EEE');
  } catch {
    return '';
  }
});

const formattedTime = computed(() => {
  const time = props.appointment.time;
  if (!time) {
    try {
      return format(appointmentDate.value, 'h:mm a');
    } catch {
      return '--:--';
    }
  }
  if (time.includes('AM') || time.includes('PM')) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes || 0).padStart(2, '0')} ${period}`;
});

const durationText = computed(() => {
  const duration = props.appointment.duration_minutes || 30;
  return `${duration} min duration`;
});

// Specialist info
const specialistFirstName = computed(() =>
  props.appointment.specialist?.profile?.first_name ||
  props.appointment.specialist?.full_name?.split(' ')[0] || ''
);

const specialistLastName = computed(() =>
  props.appointment.specialist?.profile?.last_name ||
  props.appointment.specialist?.full_name?.split(' ').slice(1).join(' ') || ''
);

const specialistName = computed(() =>
  props.appointment.specialist?.full_name ||
  `${specialistFirstName.value} ${specialistLastName.value}`.trim() ||
  'Specialist'
);

const specialistImage = computed(() =>
  props.appointment.specialist?.profile?.profile_photo ||
  props.appointment.specialist?.profile?.profile_image || null
);

// Extract specialty from professional_practice (handles both string and object)
const specialty = computed(() => {
  const pp = props.appointment.specialist?.professional_practice;

  // If it's an object, extract area_of_specialty or category
  if (pp && typeof pp === 'object') {
    return pp.area_of_specialty || pp.category || 'Consultation';
  }

  // If it's a string, use it directly
  if (pp && typeof pp === 'string') {
    return pp;
  }

  // Fallback to appointment category
  return props.appointment.category || 'Consultation';
});

const isOnline = computed(() => {
  // Consider online if within 30 mins of appointment
  try {
    const now = new Date();
    const mins = differenceInMinutes(appointmentDate.value, now);
    return mins <= 30 && mins >= -30;
  } catch {
    return false;
  }
});

// Meeting type
const meetingChannel = computed(() =>
  props.appointment.meeting_channel || 'zoom'
);

const meetingIcon = computed(() => {
  const channel = meetingChannel.value?.toLowerCase();
  if (channel === 'phone' || channel === 'audio') return 'hi-phone';
  if (channel === 'in_person' || channel === 'in-person') return 'md-localhospital-round';
  if (channel === 'chat') return 'hi-chat';
  return 'hi-video-camera';
});

const meetingTypeLabel = computed(() => {
  const channel = meetingChannel.value?.toLowerCase();
  if (channel === 'phone' || channel === 'audio') return 'Audio Call';
  if (channel === 'in_person' || channel === 'in-person') {
    const location = props.appointment.meeting_location || '';
    return location ? `In-Person Visit • ${location}` : 'In-Person Visit';
  }
  if (channel === 'chat') return 'Chat Consultation';
  return 'Video Consultation';
});

// Can join call check
const canJoin = computed(() => {
  if (props.isPast || isCancelled.value) return false;
  try {
    const now = new Date();
    const mins = differenceInMinutes(appointmentDate.value, now);
    // Can join 15 minutes before to 30 minutes after start
    return mins <= 15 && mins >= -30;
  } catch {
    return true; // Allow if can't calculate
  }
});

// Footer message
const footerMessage = computed(() => {
  if (isPending.value) {
    const hoursLeft = 24;
    return `This slot is reserved for ${hoursLeft}h more. Please pay to confirm.`;
  }
  if (statusClass.value === 'confirmed') {
    return 'Please join 5 minutes early to test your audio/video.';
  }
  return '';
});

const footerIcon = computed(() => {
  if (isPending.value) return 'hi-exclamation';
  return 'hi-information-circle';
});

// Actions
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const handleReschedule = () => {
  showDropdown.value = false;
  emit('reschedule', props.appointment);
};

const handleViewReceipt = () => {
  showDropdown.value = false;
  emit('view-receipt', props.appointment);
};

const handleCancel = () => {
  showDropdown.value = false;
  emit('cancel', props.appointment);
};

const handleViewPrescription = () => {
  emit('view-prescription', props.appointment);
};

const handleViewNotes = () => {
  emit('view-notes', props.appointment);
};

const handleBookAgain = () => {
  emit('book-again', props.appointment);
};

const handleCardClick = (event) => {
  // Don't navigate if clicking on buttons or interactive elements
  const target = event.target;
  if (target.closest('button') || target.closest('.dropdown-menu') || target.closest('.data-badge')) {
    return;
  }
  emit('view-details', props.appointment);
};

// Clinical notes and prescriptions helpers
const hasClinicalNotes = computed(() => {
  return props.appointment.clinical_notes?.length > 0;
});

const clinicalNotesCount = computed(() => {
  return props.appointment.clinical_notes?.length || 0;
});

const hasPrescriptions = computed(() => {
  return props.prescriptions?.length > 0;
});

const prescriptionsCount = computed(() => {
  return props.prescriptions?.length || 0;
});

// Close dropdown on outside click
const closeDropdown = () => {
  showDropdown.value = false;
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', closeDropdown);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', closeDropdown);
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
$v2-success: #4CAF50;
$v2-success-light: #E8F5E9;
$v2-error: #EF4444;

.appointment-card {
  position: relative;
  display: flex;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 20px -2px rgba($v2-sky, 0.15);
    transform: translateY(-2px);
  }

  &.is-past {
    background: #f8fafc;
    opacity: 0.85;

    &:hover {
      opacity: 1;
    }

    .doctor-avatar :deep(.avatar) {
      filter: grayscale(100%);
    }
  }
}

.accent-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;

  &.confirmed { background: $v2-sky; }
  &.pending { background: $v2-orange; }
  &.completed { background: $v2-success; }
  &.cancelled { background: $v2-error; }
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-main {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 24px;
  padding-left: 28px;

  @media (max-width: 1024px) {
    gap: 20px;
  }

  @media (max-width: 768px) {
    gap: 16px;
  }
}

// Date & Time Column
.date-time-col {
  display: flex;
  gap: 16px;
  min-width: 180px;

  @media (max-width: 768px) {
    width: 100%;
  }
}

.date-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  padding: 12px;
  border-radius: 12px;
  text-align: center;

  &.confirmed { background: rgba($v2-sky-light, 0.5); }
  &.pending { background: $v2-orange-light; }
  &.completed { background: #f1f5f9; border: 1px solid #e2e8f0; }
  &.cancelled { background: #fef2f2; }
}

.date-month {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 2px;

  .confirmed & { color: $v2-sky; }
  .pending & { color: $v2-orange; }
  .completed &, .cancelled & { color: #94a3b8; }
}

.date-day {
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  color: $v2-navy;

  .completed & { color: #64748b; }
}

.date-relative {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  margin-top: 2px;
}

.time-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.time-value {
  font-size: 18px;
  font-weight: 700;
  color: $v2-navy;

  .is-past & { color: #64748b; }
}

.duration-text {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;

  &.confirmed { background: #E3F2FD; color: $v2-sky-dark; }
  &.pending { background: $v2-orange-light; color: $v2-orange-dark; }
  &.completed { background: $v2-success-light; color: #2E7D32; }
  &.cancelled { background: #FFEBEE; color: #C62828; }
}

// Doctor Info Column
.doctor-col {
  flex: 1;
  min-width: 200px;
  border-left: 1px solid #f1f5f9;
  padding-left: 24px;

  @media (max-width: 768px) {
    width: 100%;
    border-left: none;
    border-top: 1px solid #f1f5f9;
    padding-left: 0;
    padding-top: 16px;
  }
}

.doctor-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.doctor-avatar {
  position: relative;
  flex-shrink: 0;

  :deep(.avatar) {
    width: 56px !important;
    height: 56px !important;
    border-radius: 12px !important;
    border: none !important;
    padding: 0 !important;
  }
}

.online-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  background: #22c55e;
  border-radius: 50%;
  border: 3px solid white;
}

.doctor-details {
  flex: 1;
  min-width: 0;
}

.doctor-name {
  font-size: 17px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .is-past & { color: #64748b; }
}

.doctor-specialty {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
}

.meeting-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #94a3b8;

  .meeting-icon {
    color: $v2-sky;

    .is-past & { color: #94a3b8; }
  }
}

// Data badges for Notes and Prescriptions
.data-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.data-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  &.badge-notes {
    background: #e0f2fe;
    color: #0284c7;

    &:hover {
      background: #bae6fd;
    }

    svg {
      color: #0284c7;
    }
  }

  &.badge-rx {
    background: #fef3c7;
    color: #d97706;

    &:hover {
      background: #fde68a;
    }

    svg {
      color: #d97706;
    }
  }
}

// Actions Column
.actions-col {
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;
    border-top: 1px solid #f1f5f9;
    padding-top: 16px;
    flex-wrap: wrap;
  }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  @media (max-width: 768px) {
    flex: 1;
  }

  &.primary {
    background: $v2-orange;
    color: white;
    border: none;
    box-shadow: 0 2px 4px rgba($v2-orange, 0.2);

    &:hover:not(:disabled) {
      background: $v2-orange-dark;
    }

    &:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
    }
  }

  &.secondary {
    background: white;
    color: #64748b;
    border: 1px solid #e2e8f0;

    &:hover {
      border-color: $v2-sky;
      color: $v2-sky;
    }
  }

  &.navy {
    background: $v2-navy;
    color: white;
    border: none;

    &:hover {
      background: #0f2847;
    }
  }

  &.cancel-btn {
    background: white;
    color: $v2-error;
    border: 1px solid #e2e8f0;

    &:hover {
      background: #fef2f2;
      border-color: #fecaca;
    }
  }

  &.book-again {
    background: $v2-sky-light;
    color: $v2-sky-dark;
    border: none;

    &:hover {
      background: $v2-sky;
      color: white;
    }
  }
}

// Dropdown
.dropdown-wrapper {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 8px;
  width: 180px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid #f1f5f9;
  z-index: 50;
  padding: 4px;
  animation: dropdown-in 0.15s ease;
}

@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: #f8fafc;
    color: $v2-navy;
  }

  &.danger {
    color: $v2-error;

    &:hover {
      background: #fef2f2;
    }
  }

  svg {
    color: #94a3b8;
    width: 16px;
  }
}

.dropdown-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 0;
}

// Card Footer
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px 12px 28px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;

  &.pending {
    background: rgba($v2-orange-light, 0.5);
    border-top-color: rgba($v2-orange, 0.1);
  }
}

.footer-message {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;

  .footer-icon {
    color: $v2-sky;
  }

  .pending & {
    color: darken($v2-orange, 15%);
    font-weight: 500;

    .footer-icon {
      color: $v2-orange;
    }
  }
}

// ===========================================
// MOBILE STYLES
// ===========================================

// Mobile more button (action sheet trigger) - cleaner icon-only style
.mobile-more-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: #f1f5f9;
  border: none;
  border-radius: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover, &:active {
    background: #e2e8f0;
    color: $v2-navy;
  }

  @media (max-width: 768px) {
    display: flex;
  }
}

// Hide desktop dropdown on mobile
.desktop-only {
  @media (max-width: 768px) {
    display: none !important;
  }
}

// Mobile adjustments for card layout
@media (max-width: 768px) {
  .card-main {
    flex-direction: column;
    gap: 16px;
  }

  .date-time-col {
    flex-direction: row;
    align-items: center;
    width: 100%;
    gap: 12px;
  }

  .date-box {
    min-width: 60px;
    padding: 10px 8px;
  }

  .doctor-col {
    width: 100%;
    padding: 0;
    border: none;
  }

  .actions-col {
    width: 100%;
    flex-direction: row;
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
  }

  .action-btn {
    &.join-btn {
      flex: 1;
      max-width: none;
    }

    &.primary {
      padding: 12px 16px;
    }
  }
}

</style>
