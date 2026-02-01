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
                  <v-icon name="hi-exclamation-triangle" scale="1.1" />
                </div>
                <div class="header-text">
                  <h2>Cancel Appointment</h2>
                  <p>This action cannot be undone</p>
                </div>
              </div>
              <button class="close-btn" @click="close">
                <v-icon name="hi-x" scale="1" />
              </button>
            </div>

            <!-- Body -->
            <div class="modal-body">
              <!-- Warning Banner -->
              <div class="warning-banner">
                <div class="warning-icon">
                  <v-icon name="hi-exclamation" scale="1" />
                </div>
                <div class="warning-content">
                  <p>You are about to cancel the appointment with <strong>{{ patientName }}</strong></p>
                  <div class="appointment-summary">
                    <span class="summary-item">
                      <v-icon name="hi-calendar" scale="0.75" />
                      {{ formatDate(appointment?.date) }}
                    </span>
                    <span class="summary-item">
                      <v-icon name="hi-clock" scale="0.75" />
                      {{ appointment?.time }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Reason Selection -->
              <div class="form-section">
                <label class="section-label">
                  <v-icon name="hi-question-mark-circle" scale="0.8" />
                  Reason for Cancellation
                </label>
                <div class="reason-grid">
                  <label
                    v-for="option in reasonOptions"
                    :key="option.value"
                    class="reason-option"
                    :class="{ selected: reasonType === option.value }"
                  >
                    <input type="radio" v-model="reasonType" :value="option.value" />
                    <div class="option-icon">
                      <v-icon :name="option.icon" scale="0.9" />
                    </div>
                    <span class="option-label">{{ option.label }}</span>
                  </label>
                </div>
              </div>

              <!-- Additional Details -->
              <div class="form-group">
                <label>
                  <v-icon name="hi-annotation" scale="0.75" />
                  Additional Details (Optional)
                </label>
                <textarea
                  v-model="details"
                  placeholder="Provide any additional context about the cancellation..."
                  rows="2"
                ></textarea>
              </div>

              <!-- Refund Options -->
              <div v-if="appointment?.amount" class="refund-section">
                <label class="section-label">
                  <v-icon name="hi-currency-dollar" scale="0.8" />
                  Refund Option
                </label>
                <div class="refund-options">
                  <label
                    v-for="option in refundOptions"
                    :key="option.value"
                    class="refund-option"
                    :class="{ selected: refundOption === option.value }"
                  >
                    <input type="radio" v-model="refundOption" :value="option.value" />
                    <div class="option-content">
                      <div class="option-header">
                        <span class="option-title">{{ option.title }}</span>
                        <span class="option-badge" :class="option.badgeClass">{{ option.badge }}</span>
                      </div>
                      <span class="option-desc">{{ option.description }}</span>
                    </div>
                    <div class="option-check">
                      <v-icon v-if="refundOption === option.value" name="hi-check-circle" scale="1" />
                    </div>
                  </label>
                </div>
              </div>

              <!-- Additional Options -->
              <div class="options-section">
                <div class="option-toggle">
                  <div class="toggle-content">
                    <div class="toggle-icon reschedule-icon">
                      <v-icon name="hi-refresh" scale="0.85" />
                    </div>
                    <div class="toggle-text">
                      <span class="toggle-title">Offer to Reschedule</span>
                      <span class="toggle-desc">Include a link for the patient to book a new time</span>
                    </div>
                  </div>
                  <div class="toggle-switch" :class="{ active: offerReschedule }" @click="offerReschedule = !offerReschedule">
                    <div class="toggle-knob"></div>
                  </div>
                </div>

                <div class="option-toggle">
                  <div class="toggle-content">
                    <div class="toggle-icon notify-icon">
                      <v-icon name="hi-bell" scale="0.85" />
                    </div>
                    <div class="toggle-text">
                      <span class="toggle-title">Notify Patient</span>
                      <span class="toggle-desc">Send email and push notification about the cancellation</span>
                    </div>
                  </div>
                  <div class="toggle-switch" :class="{ active: notifyPatient }" @click="notifyPatient = !notifyPatient">
                    <div class="toggle-knob"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer">
              <button class="btn-keep" @click="close" :disabled="isSubmitting">
                <v-icon name="hi-arrow-left" scale="0.85" />
                Keep Appointment
              </button>
              <button
                class="btn-cancel-confirm"
                @click="submit"
                :disabled="!isValid || isSubmitting"
              >
                <template v-if="isSubmitting">
                  <span class="btn-spinner"></span>
                  Cancelling...
                </template>
                <template v-else>
                  <v-icon name="hi-x-circle" scale="0.9" />
                  Confirm Cancellation
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
import { ref, computed, watch } from 'vue';

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

const emit = defineEmits(['close', 'cancel']);

const reasonType = ref('');
const details = ref('');
const refundOption = ref('full');
const offerReschedule = ref(true);
const notifyPatient = ref(true);
const isSubmitting = ref(false);

const reasonOptions = [
  { value: 'schedule_conflict', label: 'Schedule Conflict', icon: 'hi-calendar' },
  { value: 'patient_request', label: 'Patient Request', icon: 'hi-user' },
  { value: 'emergency', label: 'Personal Emergency', icon: 'hi-exclamation-circle' },
  { value: 'technical', label: 'Technical Issues', icon: 'hi-cog' },
  { value: 'other', label: 'Other Reason', icon: 'hi-dots-horizontal' },
];

const refundOptions = [
  {
    value: 'full',
    title: 'Full Refund',
    badge: '100%',
    badgeClass: 'badge-success',
    description: 'Refund the entire amount to patient\'s wallet',
  },
  {
    value: 'partial',
    title: 'Partial Refund',
    badge: '50%',
    badgeClass: 'badge-warning',
    description: 'Refund half of the consultation fee',
  },
  {
    value: 'none',
    title: 'No Refund',
    badge: '0%',
    badgeClass: 'badge-error',
    description: 'Apply cancellation policy (no refund)',
  },
];

const patientName = computed(() => {
  const profile = props.appointment?.patient?.profile;
  if (profile) {
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  }
  return 'the patient';
});

const isValid = computed(() => {
  return reasonType.value !== '';
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function close() {
  if (!isSubmitting.value) {
    resetForm();
    emit('close');
  }
}

function resetForm() {
  reasonType.value = '';
  details.value = '';
  refundOption.value = 'full';
  offerReschedule.value = true;
  notifyPatient.value = true;
}

async function submit() {
  if (!isValid.value) return;

  isSubmitting.value = true;
  try {
    const reason = details.value
      ? `${getReasonLabel(reasonType.value)}: ${details.value}`
      : getReasonLabel(reasonType.value);

    emit('cancel', {
      appointmentId: props.appointment?._id,
      reason,
      refundOption: refundOption.value,
      offerReschedule: offerReschedule.value,
      notifyPatient: notifyPatient.value,
    });
  } finally {
    isSubmitting.value = false;
  }
}

function getReasonLabel(type) {
  const option = reasonOptions.find(o => o.value === type);
  return option?.label || type;
}

watch(() => props.isOpen, (open) => {
  if (!open) {
    resetForm();
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
  max-width: 560px;
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
  padding: 1.5rem;
  background: linear-gradient(135deg, $sa-error-light 0%, rgba($sa-error-light, 0.5) 100%);
  border-bottom: 1px solid rgba($sa-error, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  @include sa-icon-wrapper(48px);
  background: linear-gradient(135deg, $sa-error 0%, #C62828 100%);
  color: $sa-white;
  box-shadow: $sa-shadow-error;
}

.header-text {
  h2 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #7F1D1D;
    margin: 0;
  }

  p {
    font-size: 0.8125rem;
    color: #991B1B;
    margin: 0.25rem 0 0;
  }
}

.close-btn {
  @include sa-icon-wrapper(36px);
  background: $sa-white;
  border: 1px solid $sa-gray-200;
  color: $sa-text-secondary;
  cursor: pointer;
  transition: all $sa-transition;

  &:hover {
    border-color: $sa-error;
    color: $sa-error;
    background: $sa-error-light;
  }
}

// Body
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  @include sa-scrollbar;
}

// Warning Banner
.warning-banner {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%);
  border: 1px solid rgba($sa-error, 0.2);
  border-radius: $sa-radius-md;
  margin-bottom: 1.5rem;
}

.warning-icon {
  @include sa-icon-wrapper(40px);
  background: $sa-error;
  color: $sa-white;
  border-radius: $sa-radius;
  flex-shrink: 0;
}

.warning-content {
  p {
    font-size: 0.9375rem;
    color: #7F1D1D;
    margin: 0 0 0.75rem;

    strong {
      font-weight: 700;
    }
  }
}

.appointment-summary {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #991B1B;
  padding: 0.375rem 0.75rem;
  background: rgba($sa-white, 0.7);
  border-radius: $sa-radius-sm;

  svg {
    color: #B91C1C;
  }
}

// Form Section
.form-section {
  margin-bottom: 1.5rem;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: $sa-navy;
  margin-bottom: 0.875rem;

  svg {
    color: $sa-sky;
  }
}

// Reason Grid
.reason-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.625rem;
}

.reason-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid $sa-gray-200;
  border-radius: $sa-radius-md;
  cursor: pointer;
  transition: all $sa-transition;
  text-align: center;

  input {
    display: none;
  }

  &:hover {
    border-color: $sa-sky;
    background: $sa-sky-light;
  }

  &.selected {
    border-color: $sa-sky;
    background: $sa-sky-light;
    box-shadow: $sa-shadow-sky;

    .option-icon {
      background: $sa-sky-gradient;
      color: $sa-white;
      box-shadow: $sa-shadow-sky;
    }
  }
}

.option-icon {
  @include sa-icon-wrapper(36px);
  background: $sa-gray-100;
  color: $sa-gray-500;
  border-radius: $sa-radius;
  transition: all $sa-transition;
}

.option-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: $sa-navy;
}

// Form Group
.form-group {
  margin-bottom: 1.25rem;

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

  textarea {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid $sa-gray-200;
    border-radius: $sa-radius;
    font-size: 0.9375rem;
    color: $sa-navy;
    resize: vertical;
    min-height: 80px;
    transition: all $sa-transition;

    &::placeholder {
      color: $sa-gray-400;
    }

    &:focus {
      outline: none;
      border-color: $sa-sky;
      box-shadow: 0 0 0 3px rgba($sa-sky, 0.15);
    }
  }
}

// Refund Section
.refund-section {
  margin-bottom: 1.5rem;
}

.refund-options {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.refund-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid $sa-gray-200;
  border-radius: $sa-radius-md;
  cursor: pointer;
  transition: all $sa-transition;

  input {
    display: none;
  }

  &:hover {
    border-color: $sa-sky;
  }

  &.selected {
    border-color: $sa-sky;
    background: $sa-sky-light;

    .option-check {
      color: $sa-sky;
    }
  }
}

.option-content {
  flex: 1;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.option-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: $sa-navy;
}

.option-badge {
  padding: 0.125rem 0.5rem;
  border-radius: $sa-radius-full;
  font-size: 0.6875rem;
  font-weight: 700;

  &.badge-success {
    background: $sa-success-light;
    color: $sa-success-dark;
  }

  &.badge-warning {
    background: $sa-warning-light;
    color: $sa-orange-dark;
  }

  &.badge-error {
    background: $sa-error-light;
    color: $sa-error;
  }
}

.option-desc {
  font-size: 0.75rem;
  color: $sa-text-secondary;
}

.option-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: color $sa-transition;
}

// Options Section
.options-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: $sa-gray-100;
  border-radius: $sa-radius-md;
}

.option-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
}

.toggle-content {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.toggle-icon {
  @include sa-icon-wrapper(32px);
  border-radius: $sa-radius-sm;

  &.reschedule-icon {
    background: $sa-orange-light;
    color: $sa-orange-dark;
  }

  &.notify-icon {
    background: $sa-sky-light;
    color: $sa-sky-dark;
  }
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
  font-size: 0.6875rem;
  color: $sa-text-secondary;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: $sa-gray-300;
  border-radius: $sa-radius-full;
  position: relative;
  transition: all $sa-transition;
  cursor: pointer;

  &.active {
    background: $sa-sky-gradient;
    box-shadow: $sa-shadow-sky;

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
  box-shadow: $sa-shadow-sm;
  transition: transform $sa-transition-bounce;
}

// Footer
.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid $sa-gray-200;
  background: $sa-bg;
}

.btn-keep {
  @include sa-button-secondary;
}

.btn-cancel-confirm {
  @include sa-button-danger;
  background: $sa-error;
  color: $sa-white;
  border: none;
  min-width: 180px;

  &:hover:not(:disabled) {
    background: darken($sa-error, 10%);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba($sa-error, 0.35);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba($sa-white, 0.3);
  border-top-color: $sa-white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Transitions
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

// Responsive
@media (max-width: $sa-breakpoint-sm) {
  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .reason-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .header-left {
    gap: 0.75rem;
  }

  .header-icon {
    width: 40px;
    height: 40px;
  }

  .modal-footer {
    flex-direction: column;

    .btn-keep,
    .btn-cancel-confirm {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
