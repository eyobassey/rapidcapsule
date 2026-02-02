<template>
  <div class="link-records-section">
    <div class="link-records-header" @click="isExpanded = !isExpanded">
      <div class="link-records-header__left">
        <v-icon name="hi-link" scale="0.85" />
        <span class="link-records-header__title">Link to Appointments & Notes</span>
        <span v-if="selectionCount" class="link-records-header__count">{{ selectionCount }} selected</span>
      </div>
      <v-icon :name="isExpanded ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
    </div>

    <div v-if="isExpanded" class="link-records-body">
      <p class="link-records-hint">
        Optionally link completed appointments and clinical notes to create an auditable care chain.
      </p>

      <!-- Loading -->
      <div v-if="isLoading" class="link-records-loading">
        <div class="skeleton-item" v-for="i in 3" :key="i" />
      </div>

      <!-- Empty State -->
      <div v-else-if="!appointments.length" class="link-records-empty">
        <v-icon name="hi-calendar" scale="1.2" />
        <p>No completed appointments found for this patient</p>
      </div>

      <!-- Appointments List -->
      <div v-else class="appointments-list">
        <div
          v-for="appt in appointments"
          :key="appt._id"
          class="appointment-item"
          :class="{ 'appointment-item--selected': isAppointmentSelected(appt._id) }"
        >
          <div class="appointment-item__header" @click="toggleAppointment(appt._id)">
            <label class="checkbox-wrapper" @click.stop>
              <input
                type="checkbox"
                :checked="isAppointmentSelected(appt._id)"
                @change="toggleAppointment(appt._id)"
              />
              <span class="checkmark" />
            </label>
            <div class="appointment-item__info">
              <span class="appointment-item__date">{{ formatDate(appt.start_time) }}</span>
              <span class="appointment-item__channel">{{ appt.meeting_channel || 'Video' }}</span>
              <span v-if="appt.category" class="appointment-item__category">{{ appt.category }}</span>
            </div>
            <button
              v-if="appt.clinical_notes?.length"
              class="notes-toggle"
              @click.stop="toggleNotesExpand(appt._id)"
            >
              <v-icon name="hi-document-text" scale="0.7" />
              {{ appt.clinical_notes.length }} note{{ appt.clinical_notes.length > 1 ? 's' : '' }}
              <v-icon :name="isNotesExpanded(appt._id) ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.6" />
            </button>
          </div>

          <!-- Clinical Notes -->
          <div v-if="isNotesExpanded(appt._id) && appt.clinical_notes?.length" class="notes-list">
            <div
              v-for="note in appt.clinical_notes"
              :key="note.note_id"
              class="note-item"
              @click="toggleNote(appt._id, note.note_id)"
            >
              <label class="checkbox-wrapper" @click.stop>
                <input
                  type="checkbox"
                  :checked="isNoteSelected(appt._id, note.note_id)"
                  @change="toggleNote(appt._id, note.note_id)"
                />
                <span class="checkmark" />
              </label>
              <div class="note-item__content">
                <span class="note-item__preview">{{ note.content_preview || 'No content' }}</span>
                <span class="note-item__meta">
                  <span class="note-item__platform" :class="`platform--${note.platform}`">
                    {{ note.platform === 'zoom' ? 'Zoom' : 'Custom' }}
                  </span>
                  <span v-if="note.created_at" class="note-item__date">{{ formatDate(note.created_at) }}</span>
                </span>
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
  // Apply pre-selections
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
      // Auto-expand notes for pre-selected appointments
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
.link-records-section {
  background: $color-white;
  border: 1px solid $color-g-90;
  border-radius: $size-12;
  overflow: hidden;
  margin-top: $size-16;
}

.link-records-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $size-14 $size-16;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: $color-g-97;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: $size-8;
  }

  &__title {
    font-size: $size-14;
    font-weight: $fw-medium;
    color: $color-g-36;
  }

  &__count {
    font-size: $size-12;
    color: $color-pri;
    background: rgba(14, 174, 196, 0.1);
    padding: 2px $size-8;
    border-radius: $size-10;
    font-weight: $fw-medium;
  }
}

.link-records-body {
  padding: 0 $size-16 $size-16;
}

.link-records-hint {
  font-size: $size-12;
  color: $color-g-54;
  margin-bottom: $size-12;
}

.link-records-loading {
  .skeleton-item {
    height: 48px;
    background: $color-g-95;
    border-radius: $size-8;
    margin-bottom: $size-8;
    animation: pulse 1.5s infinite;
  }
}

.link-records-empty {
  text-align: center;
  padding: $size-20 0;
  color: $color-g-54;

  p {
    font-size: $size-13;
    margin-top: $size-8;
  }
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: $size-8;
}

.appointment-item {
  border: 1px solid $color-g-90;
  border-radius: $size-10;
  overflow: hidden;
  transition: border-color 0.2s;

  &--selected {
    border-color: $color-pri;
    background: rgba(14, 174, 196, 0.03);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $size-10;
    padding: $size-10 $size-12;
    cursor: pointer;

    &:hover {
      background: $color-g-97;
    }
  }

  &__info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $size-8;
    flex-wrap: wrap;
  }

  &__date {
    font-size: $size-13;
    font-weight: $fw-medium;
    color: $color-g-21;
  }

  &__channel,
  &__category {
    font-size: $size-11;
    color: $color-g-54;
    background: $color-g-95;
    padding: 2px $size-6;
    border-radius: $size-4;
  }
}

.notes-toggle {
  display: flex;
  align-items: center;
  gap: $size-4;
  font-size: $size-12;
  color: $color-pri;
  background: none;
  border: none;
  cursor: pointer;
  padding: $size-4 $size-8;
  border-radius: $size-6;

  &:hover {
    background: rgba(14, 174, 196, 0.08);
  }
}

.notes-list {
  border-top: 1px solid $color-g-92;
  padding: $size-8 $size-12 $size-8 $size-32;
}

.note-item {
  display: flex;
  align-items: flex-start;
  gap: $size-8;
  padding: $size-8;
  border-radius: $size-6;
  cursor: pointer;

  &:hover {
    background: $color-g-97;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__preview {
    font-size: $size-12;
    color: $color-g-36;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $size-8;
    margin-top: $size-4;
  }

  &__platform {
    font-size: $size-11;
    padding: 1px $size-6;
    border-radius: $size-4;

    &.platform--zoom {
      background: rgba(45, 140, 255, 0.1);
      color: #2d8cff;
    }

    &.platform--custom {
      background: rgba(14, 174, 196, 0.1);
      color: $color-pri;
    }
  }

  &__date {
    font-size: $size-11;
    color: $color-g-67;
  }
}

.checkbox-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: $color-pri;
    cursor: pointer;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
