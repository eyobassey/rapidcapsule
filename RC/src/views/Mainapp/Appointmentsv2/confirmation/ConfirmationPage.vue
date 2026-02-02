<template>
  <div class="confirmation-page">
    <!-- Success Hero -->
    <div class="success-hero">
      <div class="success-animation">
        <div class="check-circle">
          <v-icon name="hi-check" scale="2.5" />
        </div>
      </div>
      <h1 class="success-title">Appointment Confirmed!</h1>
      <p class="success-subtitle">
        Your appointment has been successfully booked. You will receive a confirmation email shortly.
      </p>
    </div>

    <div class="confirmation-content">
      <!-- Appointment ID Card -->
      <div class="info-card appointment-id-card">
        <div class="card-icon">
          <v-icon name="hi-ticket" scale="1.2" />
        </div>
        <div class="card-content">
          <span class="card-label">Appointment ID</span>
          <span class="card-value">{{ appointmentId }}</span>
        </div>
        <button class="copy-btn" @click="copyAppointmentId">
          <v-icon name="hi-clipboard-copy" scale="0.9" />
        </button>
      </div>

      <!-- Meeting Details Card -->
      <div class="info-card meeting-card" v-if="appointment">
        <h3 class="card-title">
          <v-icon name="hi-video-camera" scale="1" />
          Meeting Details
        </h3>
        <div class="meeting-info">
          <div class="info-row">
            <v-icon name="hi-user" scale="0.85" />
            <span>{{ appointment.specialist?.full_name || 'Your Specialist' }}</span>
          </div>
          <div class="info-row">
            <v-icon name="hi-calendar" scale="0.85" />
            <span>{{ formattedDate }}</span>
          </div>
          <div class="info-row">
            <v-icon name="hi-clock" scale="0.85" />
            <span>{{ formattedTime }}</span>
          </div>
          <div class="info-badges" v-if="appointment.urgency || appointment.appointment_type">
            <span v-if="appointment.appointment_type" class="badge badge-sky">
              {{ appointment.appointment_type }}
            </span>
            <span v-if="appointment.urgency" :class="['badge', appointment.urgency === 'urgent' ? 'badge-urgent' : 'badge-routine']">
              <v-icon :name="appointment.urgency === 'urgent' ? 'hi-lightning-bolt' : 'hi-clipboard-check'" scale="0.7" />
              {{ appointment.urgency === 'urgent' ? 'Urgent Care' : 'Routine Checkup' }}
            </span>
          </div>
        </div>
        <div class="meeting-link" v-if="appointment.meeting_link">
          <input
            type="text"
            :value="appointment.meeting_link"
            readonly
            class="link-input"
          />
          <button class="copy-link-btn" @click="copyMeetingLink">
            <v-icon name="hi-clipboard-copy" scale="0.85" />
            Copy Link
          </button>
        </div>
        <p class="meeting-note">
          <v-icon name="hi-information-circle" scale="0.8" />
          You will receive a Zoom meeting link before your appointment.
        </p>
      </div>

      <!-- Reminders Card -->
      <div class="info-card reminders-card">
        <h3 class="card-title">
          <v-icon name="hi-bell" scale="1" />
          Reminders
        </h3>
        <div class="reminder-options">
          <label class="reminder-option">
            <input type="checkbox" v-model="reminders.calendar" />
            <span class="option-icon calendar">
              <v-icon name="hi-calendar" scale="0.9" />
            </span>
            <span class="option-text">Add to Calendar</span>
          </label>
          <label class="reminder-option">
            <input type="checkbox" v-model="reminders.whatsapp" />
            <span class="option-icon whatsapp">
              <v-icon name="co-whatsapp" scale="0.9" />
            </span>
            <span class="option-text">WhatsApp Reminder</span>
          </label>
          <label class="reminder-option">
            <input type="checkbox" v-model="reminders.email" checked disabled />
            <span class="option-icon email">
              <v-icon name="hi-mail" scale="0.9" />
            </span>
            <span class="option-text">Email Reminder (Auto)</span>
          </label>
        </div>
      </div>

      <!-- Pre-Visit Checklist -->
      <pre-visit-checklist />

      <!-- Support Card -->
      <div class="info-card support-card">
        <div class="support-content">
          <v-icon name="fa-headset" scale="1.3" />
          <div class="support-text">
            <h4>Need Help?</h4>
            <p>Our support team is here to assist you with any questions about your appointment.</p>
          </div>
        </div>
        <a href="mailto:support@rapidcapsule.com" class="support-btn">
          Contact Support
        </a>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <router-link to="/app/patient/appointmentsv2" class="action-btn secondary">
          View All Appointments
        </router-link>
        <router-link to="/app/patient/dashboard" class="action-btn primary">
          Go to Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import { format, parseISO } from 'date-fns';
import PreVisitChecklist from './PreVisitChecklist.vue';

const route = useRoute();
const $toast = useToast();
const $http = inject('$_HTTP');

const appointmentId = computed(() => route.params.appointmentId || 'N/A');
const appointment = ref(null);

const reminders = ref({
  calendar: true,
  whatsapp: false,
  email: true,
});

const formattedDate = computed(() => {
  if (!appointment.value?.date) return '-';
  try {
    const date = typeof appointment.value.date === 'string'
      ? parseISO(appointment.value.date)
      : appointment.value.date;
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch {
    return appointment.value.date;
  }
});

const formattedTime = computed(() => {
  const time = appointment.value?.time;
  if (!time) return '-';
  if (time.includes('AM') || time.includes('PM')) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
});

const copyAppointmentId = async () => {
  try {
    await navigator.clipboard.writeText(appointmentId.value);
    $toast.success('Appointment ID copied!');
  } catch {
    $toast.error('Failed to copy');
  }
};

const copyMeetingLink = async () => {
  if (appointment.value?.meeting_link) {
    try {
      await navigator.clipboard.writeText(appointment.value.meeting_link);
      $toast.success('Meeting link copied!');
    } catch {
      $toast.error('Failed to copy');
    }
  }
};

onMounted(async () => {
  if (appointmentId.value && appointmentId.value !== 'N/A' && appointmentId.value !== 'new') {
    try {
      const { data } = await $http.$_getOneAppointment(appointmentId.value);
      appointment.value = data?.data || data;
    } catch (error) {
      console.log('Could not fetch appointment:', error);
    }
  }
});
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-success: #4CAF50;
$v2-success-light: #E8F5E9;
$v2-orange: #FF9800;
$v2-purple: #9C27B0;

.confirmation-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 20px;
  overflow-y: auto;
}

.success-hero {
  text-align: center;
  padding: 40px 20px;
  max-width: 500px;
  margin: 0 auto 30px;
}

.success-animation {
  margin-bottom: 24px;
}

.check-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, $v2-success 0%, #2E7D32 100%);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: scale-in 0.4s ease, pulse 2s ease infinite 0.4s;
}

@keyframes scale-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba($v2-success, 0.4);
  }
  50% {
    box-shadow: 0 0 0 15px rgba($v2-success, 0);
  }
}

.success-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 10px;
}

.success-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.confirmation-content {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.appointment-id-card {
  display: flex;
  align-items: center;
  gap: 16px;

  .card-icon {
    width: 50px;
    height: 50px;
    background: $v2-sky-light;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $v2-sky-dark;
    flex-shrink: 0;
  }

  .card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-label {
    font-size: 12px;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-value {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    font-family: monospace;
  }

  .copy-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: white;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: $v2-sky;
      color: $v2-sky-dark;
    }
  }
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px;

  svg {
    color: $v2-sky;
  }
}

.meeting-card {
  .meeting-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #374151;

    svg {
      color: $v2-sky;
    }
  }

  .info-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 50px;
    font-size: 11px;
    font-weight: 600;

    &.badge-sky {
      background: $v2-sky-light;
      color: $v2-sky-dark;
    }

    &.badge-urgent {
      background: #FEE2E2;
      color: #DC2626;
    }

    &.badge-routine {
      background: #E0F2FE;
      color: #0284C7;
    }
  }

  .meeting-link {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;

    .link-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      color: #6b7280;
      background: #f9fafb;
    }

    .copy-link-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: $v2-sky;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;

      &:hover {
        background: $v2-sky-dark;
      }
    }
  }

  .meeting-note {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #9ca3af;
    margin: 0;

    svg {
      color: #d1d5db;
    }
  }
}

.reminders-card {
  .reminder-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .reminder-option {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;

    input[type="checkbox"] {
      display: none;

      &:checked + .option-icon {
        opacity: 1;
        transform: scale(1);
      }

      &:disabled + .option-icon {
        opacity: 0.5;
      }
    }

    .option-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.4;
      transform: scale(0.9);
      transition: all 0.2s ease;

      &.calendar {
        background: $v2-sky-light;
        color: $v2-sky-dark;
      }

      &.whatsapp {
        background: #dcfce7;
        color: #16a34a;
      }

      &.email {
        background: $v2-orange;
        color: white;
        opacity: 1;
        transform: scale(1);
      }
    }

    .option-text {
      font-size: 14px;
      color: #374151;
    }
  }
}

.support-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(135deg, #F3E5F5 0%, white 100%);
  border-color: rgba($v2-purple, 0.15);

  .support-content {
    display: flex;
    align-items: center;
    gap: 14px;

    svg {
      color: $v2-purple;
    }

    h4 {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 4px;
    }

    p {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
  }

  .support-btn {
    padding: 10px 18px;
    background: $v2-purple;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    transition: all 0.2s ease;

    &:hover {
      background: darken($v2-purple, 10%);
    }
  }

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;

    .support-content {
      flex-direction: column;
    }

    .support-btn {
      width: 100%;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 14px;
  margin-top: 10px;

  @media (max-width: 600px) {
    flex-direction: column;
  }
}

.action-btn {
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  transition: all 0.2s ease;

  &.primary {
    background: linear-gradient(135deg, $v2-sky 0%, $v2-sky-dark 100%);
    color: white;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba($v2-sky, 0.35);
    }
  }

  &.secondary {
    background: white;
    color: #374151;
    border: 2px solid #e5e7eb;

    &:hover {
      border-color: $v2-sky;
      color: $v2-sky-dark;
    }
  }
}
</style>
