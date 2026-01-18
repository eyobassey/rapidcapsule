<template>
  <dialog-modal
    v-if="isOpen"
    @closeModal="closeModal"
    :has-footer="true"
    title="Create New Appointment"
    class="create-appointment-modal"
  >
    <template v-slot:body>
      <div class="create-appointment-container">
        <div class="form-section">
          <!-- Patient Selection -->
          <div class="form-group">
            <label class="form-label">Select Patient *</label>
            <rc-select
              slotted
              label="full_name"
              placeholder="Search patient by name or email"
              :options="patientOptions"
              v-model="selectedPatient"
              :reduce="item => item"
              :filterable="true"
              @search="searchPatients"
              class="patient-select"
            >
              <template v-slot:options="{ option }">
                <div class="patient-option">
                  <rc-avatar
                    size="sm"
                    :firstName="option.profile?.first_name"
                    :lastName="option.profile?.last_name"
                  />
                  <div class="patient-option__info">
                    <span class="patient-option__name">
                      {{ option.profile?.first_name }} {{ option.profile?.last_name }}
                    </span>
                    <span class="patient-option__email">{{ option.profile?.contact?.email }}</span>
                  </div>
                </div>
              </template>
              <template v-slot:selected-option="{ option }">
                <div class="patient-selected">
                  {{ option.profile?.first_name }} {{ option.profile?.last_name }}
                  ({{ option.profile?.contact?.email }})
                </div>
              </template>
            </rc-select>
          </div>

          <!-- Date Selection -->
          <div class="form-group">
            <date-picker-input
              v-model="appointmentDate"
              label="Appointment Date *"
              mode="date"
              :min-date="new Date()"
              :expanded="true"
            />
          </div>

          <!-- Time and Duration -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Time *</label>
              <select-dropdown
                v-model="startTime"
                :options="timeSlotOptions"
                placeholder="Select time"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Duration *</label>
              <select-dropdown
                v-model="duration"
                :options="durationOptionsList"
                placeholder="Select duration"
              />
            </div>
          </div>

          <!-- Timezone and Appointment Type -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Timezone</label>
              <select-dropdown
                v-model="timezone"
                :options="timezoneOptions"
                placeholder="Select timezone"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Appointment Type *</label>
              <select-dropdown
                v-model="appointmentType"
                :options="appointmentTypeOptions"
                placeholder="Select type"
              />
            </div>
          </div>

          <!-- Meeting Channel -->
          <div class="form-group">
            <label class="form-label">Meeting Channel *</label>
            <rc-select
              label="label"
              placeholder="Select meeting channel"
              :options="meetingChannelOptions"
              v-model="meetingChannel"
              :reduce="item => item.value"
              class="channel-select"
            >
              <template v-slot:selected-option="{ option }">
                <div class="channel-selected">
                  {{ option.label }}
                </div>
              </template>
            </rc-select>
            <span class="form-hint" v-if="meetingChannel">
              {{ getMeetingChannelDescription(meetingChannel) }}
            </span>
          </div>

          <!-- Consultation Fee -->
          <div class="form-group">
            <label class="form-label">Consultation Fee (₦)</label>
            <currency-input
              v-model="consultationFee"
              name="consultationFee"
              placeholder="Enter fee (optional)"
              :options="{ currency: 'NGN' }"
            />
          </div>

          <!-- Patient-Visible Notes -->
          <div class="form-group">
            <label class="form-label">
              Patient Notes
              <span class="form-label__hint">(Visible to patient)</span>
            </label>
            <area-text
              v-model="patientNotes"
              placeholder="Add notes that the patient can see (e.g., preparation instructions, what to bring)"
              :rows="3"
            />
          </div>

          <!-- Private Specialist Notes -->
          <div class="form-group">
            <label class="form-label">
              Private Notes
              <span class="form-label__hint">(Only visible to you)</span>
            </label>
            <area-text
              v-model="privateNotes"
              placeholder="Add private notes for yourself (e.g., patient history, follow-up items)"
              :rows="3"
            />
          </div>
        </div>
      </div>
    </template>

    <template v-slot:foot>
      <div class="modal-actions">
        <rc-button
          label="Cancel"
          type="tertiary"
          size="small"
          :disabled="isLoading"
          @click="closeModal"
        />
        <rc-button
          label="Create Appointment"
          type="primary"
          size="small"
          :loading="isLoading"
          :disabled="!canSubmit"
          @click="createAppointment"
        />
      </div>
    </template>
  </dialog-modal>
</template>

<script setup>
import { ref, computed, inject, watch } from 'vue';
import { useToast } from 'vue-toast-notification';
import { format } from 'date-fns';
import DialogModal from '@/components/modals/dialog-modal.vue';
import RcSelect from '@/components/RCSelect/RCSelect.vue';
import RcAvatar from '@/components/RCAvatar';
import RcButton from '@/components/buttons/button-primary';
import DatePickerInput from '@/components/inputs/date-time-picker.vue';
import SelectDropdown from '@/components/inputs/select-dropdown.vue';
import AreaText from '@/components/inputs/area-text.vue';
import CurrencyInput from '@/components/inputs/currency-input.vue';

const $http = inject('$_HTTP');
const $toast = useToast();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  preSelectedDate: { type: Date, default: null }
});

const emit = defineEmits(['update:modelValue', 'appointmentCreated']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Form fields
const selectedPatient = ref(null);
const appointmentDate = ref(props.preSelectedDate || new Date());
const startTime = ref('');
const duration = ref('');
const timezone = ref('UTC + 1 (West African Time)');
const appointmentType = ref('');
const meetingChannel = ref('zoom');
const patientNotes = ref('');
const privateNotes = ref('');
const consultationFee = ref(null);

// Patient search
const patientOptions = ref([]);
const isSearching = ref(false);
const isLoading = ref(false);
const specialistPreferences = ref(null);
const specialistAvailability = ref([]);

// Load specialist preferences on mount
const loadSpecialistPreferences = async () => {
  try {
    const response = await $http.$_getSpecialistAvailability();
    if (response.data && response.data.data) {
      specialistPreferences.value = response.data.data.preferences;
      specialistAvailability.value = response.data.data.time_availability || [];

      // Set timezone from preferences
      if (specialistPreferences.value?.timezone) {
        timezone.value = specialistPreferences.value.timezone;
      }
    }
  } catch (error) {
    console.log('Could not load specialist preferences:', error);
  }
};

// Load preferences when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    loadSpecialistPreferences();
  }
});

// Timezone options
const timezoneOptions = [
  'UTC + 1 (West African Time)',
  'UTC + 0 (Greenwich Mean Time)',
  'UTC + 2 (Central African Time)',
  'UTC + 3 (East African Time)',
  'UTC - 5 (Eastern Time)',
  'UTC - 6 (Central Time)',
  'UTC - 7 (Mountain Time)',
  'UTC - 8 (Pacific Time)'
];

// Duration options (as string values)
const durationOptionsList = [
  '15 minutes',
  '30 minutes',
  '45 minutes',
  '1 hour',
  '1.5 hours',
  '2 hours'
];

// Appointment type options
const appointmentTypeOptions = [
  'Consultation',
  'Follow-up',
  'Check-up',
  'Emergency',
  'Routine Visit',
  'Specialist Referral',
  'Lab Review',
  'Prescription Refill',
  'Other'
];

// Meeting channel options
const meetingChannelOptions = [
  { label: 'Zoom Video Call', value: 'zoom', description: 'Professional video consultation with clinical notes' },
  { label: 'WhatsApp Call', value: 'whatsapp', description: 'Familiar and accessible for most patients' },
  { label: 'Google Meet', value: 'google_meet', description: 'Simple video call via Google' },
  { label: 'Microsoft Teams', value: 'microsoft_teams', description: 'Enterprise video conferencing' },
  { label: 'Phone Call', value: 'phone', description: 'Traditional phone consultation' },
  { label: 'In-Person', value: 'in_person', description: 'Physical office visit' }
];

// Get meeting channel description
const getMeetingChannelDescription = (value) => {
  const channel = meetingChannelOptions.find(c => c.value === value);
  return channel ? channel.description : '';
};

// Generate time slots (9 AM to 5 PM in 30-minute intervals)
const timeSlotOptions = computed(() => {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minute of [0, 30]) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      slots.push(label);
    }
  }
  return slots;
});

// Convert duration string to minutes
const durationToMinutes = (durationStr) => {
  if (!durationStr) return 30;
  const match = durationStr.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 30;

  const num = parseFloat(match[1]);
  if (durationStr.includes('hour')) {
    return Math.round(num * 60);
  }
  return Math.round(num);
};

// Convert time string to 24-hour format
const timeTo24Hour = (timeStr) => {
  if (!timeStr) return '';
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// Validation
const canSubmit = computed(() => {
  return selectedPatient.value &&
         appointmentDate.value &&
         startTime.value &&
         duration.value &&
         appointmentType.value &&
         meetingChannel.value;
});

// Watch for pre-selected date changes
watch(() => props.preSelectedDate, (newDate) => {
  if (newDate) {
    appointmentDate.value = newDate;
  }
});

// Search patients by name or email
const searchPatients = async (search) => {
  if (!search || search.length < 2) {
    patientOptions.value = [];
    return;
  }

  isSearching.value = true;
  try {
    // Always fetch all patients and filter client-side for more reliable search
    const response = await $http.$_getUsers({
      filterBy: 'Patient',
      currentPage: 1,
      pageLimit: 100
    });

    if (response.data?.data?.docs) {
      const searchLower = search.toLowerCase();
      const patients = response.data.data.docs.filter(p => {
        const email = p.profile?.contact?.email?.toLowerCase() || '';
        const firstName = p.profile?.first_name?.toLowerCase() || '';
        const lastName = p.profile?.last_name?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`;

        return email.includes(searchLower) ||
               firstName.includes(searchLower) ||
               lastName.includes(searchLower) ||
               fullName.includes(searchLower);
      });
      patientOptions.value = patients;
      console.log('Found patients:', patientOptions.value.length, 'Search term:', search);
    } else {
      patientOptions.value = [];
    }
  } catch (error) {
    console.error('Error searching patients:', error);
    $toast.error('Failed to search patients');
    patientOptions.value = [];
  } finally {
    isSearching.value = false;
  }
};

// Create appointment
const createAppointment = async () => {
  if (!canSubmit.value) {
    $toast.warning('Please fill in all required fields');
    return;
  }

  isLoading.value = true;
  try {
    const patient = selectedPatient.value;
    const appointmentDateTime = new Date(appointmentDate.value);
    const time24 = timeTo24Hour(startTime.value);
    const [hours, minutes] = time24.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const payload = {
      patient_id: patient._id || patient.id,
      category: appointmentType.value,
      appointment_date: appointmentDateTime.toISOString(),
      start_time: appointmentDateTime.toISOString(),
      duration_minutes: durationToMinutes(duration.value),
      timezone: timezone.value,
      appointment_type: appointmentType.value,
      meeting_channel: meetingChannel.value || 'zoom',
      consultation_fee: consultationFee.value ? parseFloat(consultationFee.value) : 0,
      patient_notes: patientNotes.value || '',
      private_notes: privateNotes.value || '',
      status: 'OPEN'
    };

    console.log('Creating appointment with payload:', payload);

    const response = await $http.$_createAppointment(payload);

    $toast.success('Appointment created successfully!');
    emit('appointmentCreated', response.data);
    closeModal();
    resetForm();
  } catch (error) {
    console.error('Error creating appointment:', error);
    console.error('Error response:', error.response?.data);

    // Try multiple possible error message locations
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.errorMessage ||
      error.response?.data?.error ||
      error.message ||
      'Failed to create appointment';

    $toast.error(errorMessage);
  } finally {
    isLoading.value = false;
  }
};

// Close modal
const closeModal = () => {
  isOpen.value = false;
};

// Reset form
const resetForm = () => {
  selectedPatient.value = null;
  appointmentDate.value = new Date();
  startTime.value = '';
  duration.value = '';
  timezone.value = 'UTC + 1 (West African Time)';
  appointmentType.value = '';
  patientNotes.value = '';
  privateNotes.value = '';
  consultationFee.value = null;
  patientOptions.value = [];
};
</script>

<style scoped lang="scss">
.create-appointment-modal {
  :deep(.dialog-modal) {
    max-width: 700px;

    @media (max-width: 768px) {
      max-width: 95vw;
      width: 95vw;
    }

    @media (max-width: 480px) {
      max-width: 100vw;
      width: 100vw;
      height: 100vh;
      margin: 0;
      border-radius: 0;
    }
  }
}

.create-appointment-container {
  padding: 1rem;
  max-height: 600px;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 0.75rem;
    max-height: calc(100vh - 200px);
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    max-height: calc(100vh - 150px);
  }
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 480px) {
    gap: 1rem;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  font-size: 14px;
  color: #1a1a1a;

  @media (max-width: 480px) {
    font-size: 13px;
  }

  &__hint {
    font-weight: 400;
    font-size: 12px;
    color: #6f6f6f;
    font-style: italic;

    @media (max-width: 480px) {
      font-size: 11px;
    }
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

.patient-select {
  width: 100%;
}

.patient-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;

  @media (max-width: 480px) {
    gap: 0.5rem;
    padding: 0.375rem;
  }

  &__info {
    display: flex;
    flex-direction: column;
  }

  &__name {
    font-weight: 500;
    font-size: 14px;
    color: #1a1a1a;

    @media (max-width: 480px) {
      font-size: 13px;
    }
  }

  &__email {
    font-size: 12px;
    color: #6f6f6f;

    @media (max-width: 480px) {
      font-size: 11px;
    }
  }
}

.form-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 12px;
  color: #6f6f6f;
  font-style: italic;

  @media (max-width: 480px) {
    font-size: 11px;
  }
}

.patient-selected {
  font-size: 14px;
  color: #1a1a1a;

  @media (max-width: 480px) {
    font-size: 13px;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    padding: 0.5rem;
    gap: 0.5rem;

    button {
      width: 100%;
    }
  }
}
</style>
