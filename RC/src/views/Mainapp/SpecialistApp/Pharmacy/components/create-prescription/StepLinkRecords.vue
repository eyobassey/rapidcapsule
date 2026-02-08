<template>
  <div class="step-link-records">
    <!-- Collapsible Header -->
    <div class="link-header" @click="isExpanded = !isExpanded">
      <div class="link-header__left">
        <div class="link-header__icon">
          <v-icon name="hi-link" scale="0.9" />
        </div>
        <div class="link-header__content">
          <span class="link-header__title">Link to Appointments & Notes</span>
          <span class="link-header__subtitle">Create an auditable care chain</span>
        </div>
        <span v-if="selectionCount" class="link-header__badge">{{ selectionCount }} linked</span>
      </div>
      <div class="link-header__toggle">
        <v-icon :name="isExpanded ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.85" />
      </div>
    </div>

    <!-- Expanded Content -->
    <div v-if="isExpanded" class="link-body">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="skeleton-item" v-for="i in 3" :key="i">
          <div class="skeleton-checkbox"></div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-line--medium"></div>
            <div class="skeleton-line skeleton-line--short"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!appointments.length" class="empty-state">
        <div class="empty-state__icon">
          <v-icon name="hi-calendar" scale="1.2" />
        </div>
        <p class="empty-state__title">No completed appointments</p>
        <p class="empty-state__text">Complete an appointment first to link it here</p>
      </div>

      <!-- Appointments List -->
      <div v-else class="appointments-list">
        <div
          v-for="appt in appointments"
          :key="appt._id"
          :class="['appointment-card', { 'appointment-card--selected': isAppointmentSelected(appt._id) }]"
        >
          <div class="appointment-card__header" @click="toggleAppointment(appt._id)">
            <label class="custom-checkbox" @click.stop>
              <input
                type="checkbox"
                :checked="isAppointmentSelected(appt._id)"
                @change="toggleAppointment(appt._id)"
              />
              <span class="checkmark">
                <v-icon v-if="isAppointmentSelected(appt._id)" name="hi-check" scale="0.7" />
              </span>
            </label>
            <div class="appointment-card__info">
              <span class="appointment-card__date">{{ formatDate(appt.start_time) }}</span>
              <div class="appointment-card__tags">
                <span class="tag tag--channel">{{ appt.meeting_channel || 'Video' }}</span>
                <span v-if="appt.category" class="tag tag--category">{{ appt.category }}</span>
              </div>
            </div>
            <button
              v-if="appt.clinical_notes?.length"
              class="notes-toggle"
              @click.stop="toggleNotesExpand(appt._id)"
            >
              <v-icon name="hi-document-text" scale="0.75" />
              <span>{{ appt.clinical_notes.length }} note{{ appt.clinical_notes.length > 1 ? 's' : '' }}</span>
              <v-icon :name="isNotesExpanded(appt._id) ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.65" />
            </button>
          </div>

          <!-- Clinical Notes -->
          <div v-if="isNotesExpanded(appt._id) && appt.clinical_notes?.length" class="notes-list">
            <div
              v-for="note in appt.clinical_notes"
              :key="note.note_id"
              :class="['note-card', { 'note-card--selected': isNoteSelected(appt._id, note.note_id) }]"
              @click="toggleNote(appt._id, note.note_id)"
            >
              <label class="custom-checkbox" @click.stop>
                <input
                  type="checkbox"
                  :checked="isNoteSelected(appt._id, note.note_id)"
                  @change="toggleNote(appt._id, note.note_id)"
                />
                <span class="checkmark">
                  <v-icon v-if="isNoteSelected(appt._id, note.note_id)" name="hi-check" scale="0.6" />
                </span>
              </label>
              <div class="note-card__content">
                <p class="note-card__preview">{{ note.content_preview || 'No content preview' }}</p>
                <div class="note-card__meta">
                  <span :class="['note-platform', `note-platform--${note.platform}`]">
                    {{ note.platform === 'zoom' ? 'Zoom' : 'Custom' }}
                  </span>
                  <span v-if="note.created_at" class="note-date">{{ formatDate(note.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { format } from 'date-fns';
import apiFactory from '@/services/apiFactory';

const props = defineProps({
  patientId: { type: String, default: null },
  preSelectedAppointments: { type: Array, default: () => [] },
  preSelectedNotes: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:linkedAppointments', 'update:linkedClinicalNotes']);

const isExpanded = ref(false);
const isLoading = ref(false);
const appointments = ref([]);
const selectedAppointments = ref([]);
const selectedNotes = ref([]);
const expandedNotes = ref([]);

const selectionCount = computed(() => {
  return selectedAppointments.value.length + selectedNotes.value.length;
});

watch(() => props.patientId, (newId) => {
  if (newId) {
    fetchAppointments(newId);
  } else {
    appointments.value = [];
    selectedAppointments.value = [];
    selectedNotes.value = [];
  }
});

onMounted(() => {
  if (props.patientId) {
    fetchAppointments(props.patientId);
  }
  if (props.preSelectedAppointments.length) {
    selectedAppointments.value = [...props.preSelectedAppointments];
    isExpanded.value = true;
  }
  if (props.preSelectedNotes.length) {
    selectedNotes.value = [...props.preSelectedNotes];
    isExpanded.value = true;
  }
});

async function fetchAppointments(patientId) {
  try {
    isLoading.value = true;
    const response = await apiFactory.$_getSpecialistLinkableAppointments(patientId);
    const result = response.data?.data || response.data?.result;
    if (result) {
      appointments.value = result;
      if (props.preSelectedAppointments.length || props.preSelectedNotes.length) {
        const noteApptIds = props.preSelectedNotes.map(n => n.appointment_id);
        expandedNotes.value = [...new Set([...props.preSelectedAppointments, ...noteApptIds])];
      }
    }
  } catch (error) {
    console.error('Error fetching linkable appointments:', error);
  } finally {
    isLoading.value = false;
  }
}

function isAppointmentSelected(apptId) {
  return selectedAppointments.value.includes(apptId);
}

function isNoteSelected(apptId, noteId) {
  return selectedNotes.value.some(n => n.appointment_id === apptId && n.note_id === noteId);
}

function isNotesExpanded(apptId) {
  return expandedNotes.value.includes(apptId);
}

function toggleAppointment(apptId) {
  const index = selectedAppointments.value.indexOf(apptId);
  if (index >= 0) {
    selectedAppointments.value.splice(index, 1);
  } else {
    selectedAppointments.value.push(apptId);
  }
  emitSelections();
}

function toggleNote(apptId, noteId) {
  const index = selectedNotes.value.findIndex(n => n.appointment_id === apptId && n.note_id === noteId);
  if (index >= 0) {
    selectedNotes.value.splice(index, 1);
  } else {
    selectedNotes.value.push({ appointment_id: apptId, note_id: noteId });
  }
  emitSelections();
}

function toggleNotesExpand(apptId) {
  const index = expandedNotes.value.indexOf(apptId);
  if (index >= 0) {
    expandedNotes.value.splice(index, 1);
  } else {
    expandedNotes.value.push(apptId);
  }
}

function emitSelections() {
  emit('update:linkedAppointments', [...selectedAppointments.value]);
  emit('update:linkedClinicalNotes', [...selectedNotes.value]);
}

function formatDate(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM dd, yyyy h:mm a');
}
</script>

<style scoped lang="scss">
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

.step-link-records {
  background: linear-gradient(135deg, $violet-light, lighten($violet-light, 3%));
  border: 1px solid rgba($violet, 0.2);
  border-radius: 16px;
  overflow: hidden;
}

// Header
.link-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    background: $violet;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: darken($violet, 15%);
  }

  &__subtitle {
    font-size: 12px;
    color: darken($violet, 5%);
    opacity: 0.8;
  }

  &__badge {
    font-size: 12px;
    font-weight: 600;
    color: white;
    background: $violet;
    padding: 4px 10px;
    border-radius: 10px;
  }

  &__toggle {
    color: darken($violet, 10%);
  }
}

// Body
.link-body {
  padding: 0 20px 20px;
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;

  .skeleton-checkbox {
    width: 20px;
    height: 20px;
    background: rgba($violet, 0.2);
    border-radius: 6px;
    animation: pulse 1.5s infinite;
  }

  .skeleton-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .skeleton-line {
    height: 12px;
    background: rgba($violet, 0.15);
    border-radius: 4px;
    animation: pulse 1.5s infinite;

    &--medium { width: 60%; }
    &--short { width: 40%; }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 20px;

  &__icon {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $violet;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: darken($violet, 15%);
    margin: 0 0 4px;
  }

  &__text {
    font-size: 13px;
    color: darken($violet, 5%);
    margin: 0;
    opacity: 0.8;
  }
}

// Appointments List
.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.appointment-card {
  background: rgba(255, 255, 255, 0.6);
  border: 2px solid transparent;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.2s;

  &--selected {
    border-color: $violet;
    background: rgba(255, 255, 255, 0.8);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__date {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: $navy;
    margin-bottom: 4px;
  }

  &__tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
}

.tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;

  &--channel {
    background: rgba($violet, 0.15);
    color: darken($violet, 10%);
  }

  &--category {
    background: rgba($sky, 0.15);
    color: $sky-dark;
  }
}

.notes-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba($violet, 0.1);
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: $violet;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($violet, 0.2);
  }
}

// Notes List
.notes-list {
  border-top: 1px solid rgba($violet, 0.15);
  padding: 12px 16px 12px 48px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
  }

  &--selected {
    border-color: $violet;
    background: rgba(255, 255, 255, 0.8);
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__preview {
    font-size: 13px;
    color: $slate;
    margin: 0 0 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.note-platform {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;

  &--zoom {
    background: rgba(45, 140, 255, 0.15);
    color: #2d8cff;
  }

  &--custom {
    background: rgba($violet, 0.15);
    color: $violet;
  }
}

.note-date {
  font-size: 11px;
  color: $gray;
}

// Custom Checkbox
.custom-checkbox {
  position: relative;
  display: inline-flex;
  cursor: pointer;
  flex-shrink: 0;

  input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .checkmark {
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.8);
    border: 2px solid rgba($violet, 0.3);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  input:checked + .checkmark {
    background: $violet;
    border-color: $violet;
    color: white;
  }
}
</style>
