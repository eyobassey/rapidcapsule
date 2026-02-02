<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel">
        <!-- Header -->
        <div class="modal-panel__header">
          <div class="modal-header-info">
            <v-icon name="hi-document-text" scale="0.9" />
            <h2>Clinical Note Details</h2>
          </div>
          <button class="close-btn" @click="handleClose">
            <v-icon name="hi-x" scale="0.9" />
          </button>
        </div>

        <!-- Body -->
        <div class="modal-panel__body">
          <!-- Patient Info Section -->
          <div class="detail-section">
            <h3 class="detail-section__title">
              <v-icon name="hi-user" scale="0.75" />
              Patient Information
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name</span>
                <span class="info-value">{{ note.patient_name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Appointment Date</span>
                <span class="info-value">{{ formatNoteDate(note.appointment_date) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Channel</span>
                <span class="info-value">{{ note.meeting_channel }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Platform</span>
                <span
                  class="status-badge"
                  :class="note.platform === 'zoom' ? 'status-badge--zoom' : 'status-badge--custom'"
                >
                  {{ note.platform === 'zoom' ? 'Zoom' : 'Custom' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Note Content Section -->
          <div class="detail-section">
            <div class="detail-section__header">
              <h3 class="detail-section__title">
                <v-icon name="hi-pencil-alt" scale="0.75" />
                Clinical Note
              </h3>
              <button v-if="!isEditing" class="edit-btn" @click="startEditing">
                <v-icon name="hi-pencil" scale="0.7" />
                Edit
              </button>
            </div>

            <div v-if="!isEditing" class="note-content-box">
              <p>{{ note.content }}</p>
            </div>

            <div v-else class="note-edit-form">
              <textarea
                v-model="editedContent"
                placeholder="Enter clinical note details..."
                rows="10"
              />
              <label class="checkbox-field">
                <input type="checkbox" v-model="editedCompleted" />
                <span>Mark as completed</span>
              </label>
            </div>
          </div>

          <!-- Metadata Section -->
          <div class="detail-section">
            <h3 class="detail-section__title">
              <v-icon name="hi-information-circle" scale="0.75" />
              Metadata
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Created</span>
                <span class="info-value">{{ formatNoteDate(note.created_at) }}</span>
              </div>
              <div v-if="note.updated_at" class="info-item">
                <span class="info-label">Last Updated</span>
                <span class="info-value">{{ formatNoteDate(note.updated_at) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status</span>
                <span
                  class="status-badge"
                  :class="note.completed ? 'status-badge--completed' : 'status-badge--progress'"
                >
                  {{ note.completed ? 'Completed' : 'In Progress' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-panel__footer">
          <button class="btn btn--secondary" :disabled="isSaving" @click="handleCancel">
            Cancel
          </button>
          <button v-if="isEditing" class="btn btn--primary" :disabled="isSaving" @click="saveChanges">
            <span v-if="isSaving" class="btn-loader" />
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button v-else class="btn btn--primary" @click="handleClose">
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useToast } from 'vue-toast-notification';
import { format } from 'date-fns';
import apiFactory from '@/services/apiFactory';

const props = defineProps({
  modelValue: Boolean,
  note: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'updated']);

const $toast = useToast();
const isEditing = ref(false);
const isSaving = ref(false);
const editedContent = ref('');
const editedCompleted = ref(false);

watch(() => props.note, (newNote) => {
  if (newNote) {
    editedContent.value = newNote.content;
    editedCompleted.value = newNote.completed;
    isEditing.value = false;
  }
}, { immediate: true });

function formatNoteDate(date) {
  if (!date) return '-';
  return format(new Date(date), 'MMM dd, yyyy \'at\' h:mm a');
}

function startEditing() {
  isEditing.value = true;
}

function handleCancel() {
  if (isEditing.value) {
    isEditing.value = false;
    editedContent.value = props.note.content;
    editedCompleted.value = props.note.completed;
  } else {
    handleClose();
  }
}

function handleClose() {
  emit('update:modelValue', false);
}

async function saveChanges() {
  if (!editedContent.value.trim()) {
    $toast.error('Note content cannot be empty');
    return;
  }

  isSaving.value = true;
  try {
    await apiFactory.$_updateClinicalNote(
      props.note.appointment_id,
      props.note.note_id,
      {
        content: editedContent.value,
        completed: editedCompleted.value
      }
    );

    $toast.success('Clinical note updated successfully');
    isEditing.value = false;
    emit('updated');
    emit('update:modelValue', false);
  } catch (error) {
    console.error('Error updating clinical note:', error);
    $toast.error('Failed to update clinical note');
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $size-20;
  animation: fadeIn 0.2s ease;
}

.modal-panel {
  background: white;
  border-radius: $size-20;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.25s ease;

  @include responsive(phone) {
    max-width: 100%;
    max-height: 90vh;
    border-radius: $size-16;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-20 $size-24;
    border-bottom: 1px solid $color-g-92;

    .modal-header-info {
      display: flex;
      align-items: center;
      gap: $size-8;
      color: #0891b2;

      h2 {
        font-size: $size-16;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
      }
    }

    .close-btn {
      background: $color-g-97;
      border: none;
      border-radius: $size-8;
      padding: $size-8;
      cursor: pointer;
      color: $color-g-54;
      transition: all 0.2s ease;

      &:hover {
        background: $color-g-92;
        color: $color-g-21;
      }
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $size-24;
    display: flex;
    flex-direction: column;
    gap: $size-24;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $size-12;
    padding: $size-16 $size-24;
    border-top: 1px solid $color-g-92;

    @include responsive(phone) {
      flex-direction: column-reverse;
    }
  }
}

// Detail Sections
.detail-section {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $size-14;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $size-6;
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    color: $color-g-36;
    margin-bottom: $size-14;

    .detail-section__header & {
      margin-bottom: 0;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-14;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: $size-4;
}

.info-label {
  font-size: $size-12;
  font-weight: $fw-medium;
  color: $color-g-54;
}

.info-value {
  font-size: $size-14;
  color: $color-g-21;
  font-weight: $fw-medium;
}

// Note Content
.note-content-box {
  background: $color-g-97;
  border-radius: $size-12;
  padding: $size-16;

  p {
    font-size: $size-14;
    line-height: 1.7;
    color: $color-g-21;
    white-space: pre-wrap;
  }
}

.note-edit-form {
  display: flex;
  flex-direction: column;
  gap: $size-12;

  textarea {
    width: 100%;
    padding: $size-14;
    border: 1px solid $color-g-85;
    border-radius: $size-12;
    font-size: $size-14;
    line-height: 1.6;
    color: $color-g-21;
    resize: vertical;
    min-height: 200px;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: #0EAEC4;
    }

    &::placeholder {
      color: $color-g-67;
    }
  }
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: $size-8;
  cursor: pointer;
  padding: $size-8 0;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #0EAEC4;
  }

  span {
    font-size: $size-14;
    color: $color-g-36;
    font-weight: $fw-medium;
  }
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: $size-4;
  padding: $size-6 $size-12;
  background: rgba(14, 174, 196, 0.08);
  color: #0891b2;
  border: none;
  border-radius: $size-6;
  font-size: $size-12;
  font-weight: $fw-semi-bold;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(14, 174, 196, 0.15);
  }
}

// Status Badges
.status-badge {
  display: inline-block;
  padding: $size-4 $size-10;
  border-radius: $size-12;
  font-size: $size-11;
  font-weight: $fw-semi-bold;

  &--zoom {
    background: rgba(#3b82f6, 0.1);
    color: #2563eb;
  }

  &--custom {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--completed {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--progress {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }
}

// Buttons
.btn {
  padding: $size-10 $size-20;
  border-radius: $size-10;
  font-size: $size-14;
  font-weight: $fw-semi-bold;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: $size-6;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    background: #0EAEC4;
    color: white;

    &:hover:not(:disabled) {
      background: #0891b2;
    }
  }

  &--secondary {
    background: $color-g-97;
    color: $color-g-36;

    &:hover:not(:disabled) {
      background: $color-g-92;
    }
  }

  @include responsive(phone) {
    width: 100%;
    justify-content: center;
  }
}

.btn-loader {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
