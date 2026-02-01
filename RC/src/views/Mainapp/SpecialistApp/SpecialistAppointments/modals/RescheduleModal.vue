<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
        <transition name="modal-scale">
          <div v-if="isOpen" class="modal-container">
            <!-- Header -->
            <div class="modal-header">
              <div class="header-left">
                <div class="header-icon">
                  <v-icon name="hi-clock" scale="1.1" />
                </div>
                <div class="header-text">
                  <h2>Reschedule Appointment</h2>
                  <p>Select a new date and time</p>
                </div>
              </div>
              <button class="close-btn" @click="close">
                <v-icon name="hi-x" scale="1" />
              </button>
            </div>

            <!-- Body -->
            <div class="modal-body">
              <!-- Current Schedule Card -->
              <div class="current-schedule-card">
                <div class="schedule-label">
                  <v-icon name="hi-calendar" scale="0.8" />
                  Current Schedule
                </div>
                <div class="schedule-value">
                  <span class="schedule-date">{{ currentDate }}</span>
                  <span class="schedule-divider">at</span>
                  <span class="schedule-time">{{ currentTime }}</span>
                </div>
              </div>

              <!-- Arrow -->
              <div class="schedule-arrow">
                <v-icon name="hi-arrow-down" scale="1" />
              </div>

              <!-- New Schedule Section -->
              <div class="new-schedule-section">
                <div class="section-header">
                  <v-icon name="hi-sparkles" scale="0.85" />
                  <h3>New Schedule</h3>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>
                      <v-icon name="hi-calendar" scale="0.75" />
                      Select Date
                    </label>
                    <div class="input-wrapper">
                      <input
                        type="date"
                        v-model="newDate"
                        :min="minDate"
                        @change="fetchAvailableSlots"
                        required
                      />
                    </div>
                  </div>
                  <div class="form-group">
                    <label>
                      <v-icon name="hi-clock" scale="0.75" />
                      Select Time
                    </label>
                    <div class="input-wrapper">
                      <select v-model="newTime" required :disabled="!newDate || loadingSlots">
                        <option value="" disabled>
                          {{ loadingSlots ? 'Loading slots...' : 'Choose a time slot' }}
                        </option>
                        <option v-for="slot in availableSlots" :key="slot" :value="slot">
                          {{ formatSlotTime(slot) }}
                        </option>
                      </select>
                    </div>
                    <p v-if="newDate && !loadingSlots && availableSlots.length === 0" class="no-slots-msg">
                      No available slots for this date
                    </p>
                  </div>
                </div>

                <!-- Custom Time Toggle -->
                <div class="custom-time-toggle">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="useCustomTime" />
                    <span>Use custom date/time (outside regular slots)</span>
                  </label>
                </div>

                <!-- Custom Date/Time Input -->
                <div v-if="useCustomTime" class="custom-time-section">
                  <div class="form-row">
                    <div class="form-group">
                      <label>
                        <v-icon name="hi-calendar" scale="0.75" />
                        Custom Date
                      </label>
                      <div class="input-wrapper">
                        <input type="date" v-model="customDate" :min="minDate" />
                      </div>
                    </div>
                    <div class="form-group">
                      <label>
                        <v-icon name="hi-clock" scale="0.75" />
                        Custom Time
                      </label>
                      <div class="input-wrapper">
                        <input type="time" v-model="customTime" />
                      </div>
                    </div>
                  </div>
                  <p class="custom-time-warning">
                    <v-icon name="hi-exclamation" scale="0.75" />
                    Custom date/time may conflict with other appointments. Double-check availability.
                  </p>
                </div>
              </div>

              <!-- Reason Section -->
              <div class="form-group reason-group">
                <label>
                  <v-icon name="hi-annotation" scale="0.75" />
                  Reason for Reschedule
                </label>
                <div class="textarea-wrapper">
                  <textarea
                    v-model="reason"
                    placeholder="Please explain why you need to reschedule this appointment..."
                    rows="3"
                    required
                  ></textarea>
                  <span class="char-count" :class="{ 'is-valid': reason.length >= 10 }">
                    {{ reason.length }}/10 min
                  </span>
                </div>
              </div>

              <!-- Notification Toggle -->
              <div class="notification-toggle">
                <label class="toggle-container">
                  <div class="toggle-content">
                    <div class="toggle-icon">
                      <v-icon name="hi-bell" scale="0.9" />
                    </div>
                    <div class="toggle-text">
                      <span class="toggle-title">Notify Patient</span>
                      <span class="toggle-desc">Send email and push notification about the change</span>
                    </div>
                  </div>
                  <div class="toggle-switch" :class="{ active: notifyPatient }" @click="notifyPatient = !notifyPatient">
                    <div class="toggle-knob"></div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer">
              <button class="btn-cancel" @click="close" :disabled="isSubmitting">
                Cancel
              </button>
              <button
                class="btn-confirm"
                @click="submit"
                :disabled="!isValid || isSubmitting"
              >
                <template v-if="isSubmitting">
                  <span class="btn-spinner"></span>
                  Rescheduling...
                </template>
                <template v-else>
                  <v-icon name="hi-check" scale="0.9" />
                  Confirm Reschedule
                </template>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue';
import { useToast } from 'vue-toast-notification';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  appointment: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'reschedule']);

const $http = inject('$http');
const toast = useToast();

const newDate = ref('');
const newTime = ref('');
const customDate = ref('');
const customTime = ref('');
const useCustomTime = ref(false);
const reason = ref('');
const notifyPatient = ref(true);
const isSubmitting = ref(false);
const loadingSlots = ref(false);
const availableSlots = ref([]);

// Current appointment date/time
const currentDate = computed(() => {
  if (!props.appointment?.start_time) return 'Not set';
  return new Date(props.appointment.start_time).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const currentTime = computed(() => {
  if (!props.appointment?.start_time) return '';
  return new Date(props.appointment.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
});

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const selectedDate = computed(() => {
  if (useCustomTime.value && customDate.value) {
    return customDate.value;
  }
  return newDate.value;
});

const selectedTime = computed(() => {
  if (useCustomTime.value && customTime.value) {
    return customTime.value;
  }
  return newTime.value;
});

const isValid = computed(() => {
  if (useCustomTime.value) {
    // Custom mode: need custom date, custom time, and reason
    return customDate.value && customTime.value && reason.value.trim().length >= 10;
  } else {
    // Regular mode: need date, selected time slot, and reason
    return newDate.value && newTime.value && reason.value.trim().length >= 10;
  }
});

// Fetch available time slots for selected date
async function fetchAvailableSlots() {
  if (!newDate.value || !props.appointment?.specialist) return;

  loadingSlots.value = true;
  newTime.value = '';
  availableSlots.value = [];

  try {
    const specialistId = typeof props.appointment.specialist === 'object'
      ? props.appointment.specialist._id
      : props.appointment.specialist;

    const response = await $http.$_getAvailableTimes({
      specialistId,
      preferredDates: [{ date: newDate.value }],
    });

    const dateKey = newDate.value;
    const slots = response.data?.data?.[dateKey] || response.data?.[dateKey] || [];
    availableSlots.value = slots;

    if (slots.length === 0) {
      toast.info('No available slots for this date. You can use a custom time.');
    }
  } catch (error) {
    console.error('Failed to fetch available slots:', error);
    toast.error('Failed to load available time slots');
  } finally {
    loadingSlots.value = false;
  }
}

function formatSlotTime(slot) {
  // Convert 24h format (HH:mm) to 12h format
  const [hours, minutes] = slot.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function close() {
  if (!isSubmitting.value) {
    resetForm();
    emit('close');
  }
}

function resetForm() {
  newDate.value = '';
  newTime.value = '';
  customDate.value = '';
  customTime.value = '';
  useCustomTime.value = false;
  reason.value = '';
  notifyPatient.value = true;
  availableSlots.value = [];
}

async function submit() {
  if (!isValid.value) return;

  isSubmitting.value = true;
  try {
    emit('reschedule', {
      appointmentId: props.appointment?._id,
      newDate: selectedDate.value,
      newTime: selectedTime.value,
      reason: reason.value,
      notifyPatient: notifyPatient.value,
    });
  } finally {
    isSubmitting.value = false;
  }
}

// Reset form when modal closes
watch(() => props.isOpen, (open) => {
  if (!open) {
    resetForm();
  }
});

// Clear custom time when toggling off
watch(() => useCustomTime.value, (useCustom) => {
  if (!useCustom) {
    customTime.value = '';
  }
});
</script>

<style scoped lang="scss">
@import '../styles/sa-variables';

// Modal Overlay
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 54, 93, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $sa-z-modal;
  padding: 1rem;
}

// Modal Container
.modal-container {
  width: 100%;
  max-width: 540px;
  background: $sa-white;
  border-radius: $sa-radius-xl;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

// Header
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: $sa-sky-gradient;
  color: $sa-white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 44px;
  height: 44px;
  background: rgba($sa-white, 0.2);
  border-radius: $sa-radius;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-text {
  h2 {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
  }
  p {
    font-size: 0.8125rem;
    opacity: 0.9;
    margin: 0.125rem 0 0;
  }
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba($sa-white, 0.1);
  border-radius: $sa-radius;
  color: $sa-white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background $sa-transition;

  &:hover {
    background: rgba($sa-white, 0.2);
  }
}

// Body
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

// Current Schedule Card
.current-schedule-card {
  background: linear-gradient(135deg, $sa-gray-100 0%, $sa-gray-200 100%);
  border: 1px solid $sa-gray-200;
  border-radius: $sa-radius;
  padding: 1rem 1.25rem;
  text-align: center;
}

.schedule-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: $sa-text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;

  svg {
    color: $sa-sky;
  }
}

.schedule-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.schedule-date {
  font-weight: 600;
  color: $sa-navy;
}

.schedule-divider {
  color: $sa-text-secondary;
  font-size: 0.875rem;
}

.schedule-time {
  font-weight: 700;
  color: $sa-sky-dark;
}

// Arrow
.schedule-arrow {
  display: flex;
  justify-content: center;
  padding: 0.75rem 0;
  color: $sa-sky;
}

// New Schedule Section
.new-schedule-section {
  background: $sa-sky-light;
  border: 1px solid rgba($sa-sky, 0.2);
  border-radius: $sa-radius;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;

  svg {
    color: $sa-sky;
  }

  h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: $sa-navy;
    margin: 0;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.form-group {
  label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: $sa-text-secondary;
    margin-bottom: 0.5rem;

    svg {
      color: $sa-sky;
    }
  }
}

.input-wrapper {
  input,
  select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid $sa-gray-200;
    border-radius: $sa-radius;
    font-size: 0.875rem;
    color: $sa-navy;
    background: $sa-white;
    transition: border-color $sa-transition;

    &:focus {
      outline: none;
      border-color: $sa-sky;
    }

    &:disabled {
      background: $sa-gray-100;
      cursor: not-allowed;
    }
  }
}

.no-slots-msg {
  font-size: 0.75rem;
  color: $sa-orange;
  margin: 0.5rem 0 0;
}

// Custom Time Toggle
.custom-time-toggle {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba($sa-sky, 0.2);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.8125rem;
  color: $sa-text-secondary;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: $sa-sky;
  }
}

.custom-time-section {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba($sa-white, 0.5);
  border-radius: $sa-radius-sm;
}

.custom-time-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: $sa-orange;
  margin: 0.75rem 0 0;

  svg {
    flex-shrink: 0;
  }
}

// Reason Group
.reason-group {
  margin-bottom: 1.25rem;
}

.textarea-wrapper {
  position: relative;

  textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid $sa-gray-200;
    border-radius: $sa-radius;
    font-size: 0.875rem;
    color: $sa-navy;
    resize: vertical;
    min-height: 80px;
    transition: border-color $sa-transition;

    &:focus {
      outline: none;
      border-color: $sa-sky;
    }

    &::placeholder {
      color: $sa-gray-400;
    }
  }
}

.char-count {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.6875rem;
  color: $sa-gray-400;

  &.is-valid {
    color: $sa-success;
  }
}

// Notification Toggle
.notification-toggle {
  background: $sa-gray-100;
  border-radius: $sa-radius;
  padding: 1rem;
}

.toggle-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.toggle-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-icon {
  width: 36px;
  height: 36px;
  background: $sa-white;
  border-radius: $sa-radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sa-sky;
}

.toggle-text {
  display: flex;
  flex-direction: column;
}

.toggle-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: $sa-navy;
}

.toggle-desc {
  font-size: 0.75rem;
  color: $sa-text-secondary;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: $sa-gray-300;
  border-radius: 12px;
  position: relative;
  transition: background $sa-transition;

  &.active {
    background: $sa-sky;

    .toggle-knob {
      transform: translateX(20px);
    }
  }
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: $sa-white;
  border-radius: 50%;
  box-shadow: $sa-shadow-xs;
  transition: transform $sa-transition;
}

// Footer
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: $sa-gray-100;
  border-top: 1px solid $sa-gray-200;
}

.btn-cancel,
.btn-confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: $sa-radius;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all $sa-transition;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-cancel {
  background: $sa-white;
  border: 1px solid $sa-gray-300;
  color: $sa-text-secondary;

  &:hover:not(:disabled) {
    background: $sa-gray-100;
  }
}

.btn-confirm {
  background: $sa-sky-gradient;
  border: none;
  color: $sa-white;
  box-shadow: $sa-shadow-sky;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba($sa-white, 0.3);
  border-top-color: $sa-white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Transitions
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.25s ease;
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
