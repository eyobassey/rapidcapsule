<template>
  <dialog-modal
    v-if="modelValue"
    @closeModal="$emit('update:modelValue', false)"
    :has-footer="true"
    title="Clinical Note Details"
    class="note-details-modal"
  >
    <template v-slot:body>
      <div class="note-details-container">
        <!-- Patient Info -->
        <div class="section">
          <h3 class="section__title">Patient Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Name:</span>
              <span class="info-value">{{ note.patient_name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Appointment Date:</span>
              <span class="info-value">{{ formatDate(note.appointment_date) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Meeting Channel:</span>
              <span class="info-value">{{ note.meeting_channel }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Platform:</span>
              <span
                class="badge"
                :class="note.platform === 'zoom' ? 'badge--primary' : 'badge--success'"
              >
                {{ note.platform === 'zoom' ? 'Zoom' : 'Custom' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Note Content -->
        <div class="section">
          <div class="section-header">
            <h3 class="section__title">Clinical Note</h3>
            <rc-button
              v-if="!isEditing"
              label="Edit"
              type="tertiary"
              size="small"
              @click="startEditing"
            />
          </div>

          <div v-if="!isEditing" class="note-content">
            <p class="note-text">{{ note.content }}</p>
          </div>

          <div v-else class="note-edit">
            <area-text
              v-model="editedContent"
              placeholder="Enter clinical note details..."
              :rows="10"
            />
            <div class="checkbox-wrapper">
              <rc-checkbox
                v-model="editedCompleted"
                label="Mark as completed"
              />
            </div>
          </div>
        </div>

        <!-- Metadata -->
        <div class="section">
          <h3 class="section__title">Metadata</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Created:</span>
              <span class="info-value">{{ formatDate(note.created_at) }}</span>
            </div>
            <div class="info-item" v-if="note.updated_at">
              <span class="info-label">Last Updated:</span>
              <span class="info-value">{{ formatDate(note.updated_at) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status:</span>
              <span
                class="badge"
                :class="note.completed ? 'badge--success' : 'badge--warning'"
              >
                {{ note.completed ? 'Completed' : 'In Progress' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-slot:foot>
      <div class="modal-footer">
        <rc-button
          label="Cancel"
          type="tertiary"
          :disabled="isSaving"
          @click="handleCancel"
        />
        <rc-button
          v-if="isEditing"
          label="Save Changes"
          type="primary"
          :loading="isSaving"
          @click="saveChanges"
        />
        <rc-button
          v-else
          label="Close"
          type="primary"
          @click="$emit('update:modelValue', false)"
        />
      </div>
    </template>
  </dialog-modal>
</template>

<script>
import { ref, watch, inject } from 'vue';
import moment from 'moment';
import { useToast } from 'vue-toast-notification';

export default {
  name: 'NoteDetailsModal',
  props: {
    modelValue: Boolean,
    note: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue', 'updated'],
  setup(props, { emit }) {
    const $http = inject('$_HTTP');
    const toast = useToast();
    const isEditing = ref(false);
    const isSaving = ref(false);
    const editedContent = ref('');
    const editedCompleted = ref(false);

    // Watch for prop changes
    watch(() => props.note, (newNote) => {
      if (newNote) {
        editedContent.value = newNote.content;
        editedCompleted.value = newNote.completed;
      }
    }, { immediate: true });

    const formatDate = (date) => {
      return moment(date).format('MMM DD, YYYY [at] h:mm A');
    };

    const startEditing = () => {
      isEditing.value = true;
    };

    const handleCancel = () => {
      if (isEditing.value) {
        isEditing.value = false;
        editedContent.value = props.note.content;
        editedCompleted.value = props.note.completed;
      } else {
        emit('update:modelValue', false);
      }
    };

    const saveChanges = async () => {
      if (!editedContent.value.trim()) {
        toast.error('Note content cannot be empty');
        return;
      }

      isSaving.value = true;
      try {
        const payload = {
          content: editedContent.value,
          completed: editedCompleted.value
        };

        await $http.$_updateClinicalNote(
          props.note.appointment_id,
          props.note.note_id,
          payload
        );

        toast.success('Clinical note updated successfully');
        isEditing.value = false;
        emit('updated');
        emit('update:modelValue', false);
      } catch (error) {
        console.error('Error updating clinical note:', error);
        toast.error('Failed to update clinical note');
      } finally {
        isSaving.value = false;
      }
    };

    return {
      isEditing,
      isSaving,
      editedContent,
      editedCompleted,
      formatDate,
      startEditing,
      handleCancel,
      saveChanges
    };
  }
};
</script>

<style scoped lang="scss">
.note-details-container {
  display: flex;
  flex-direction: column;
  gap: $size-24;
  padding: $size-8;
}

.section {
  &__title {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $size-16;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $size-16;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: $size-4;
}

.info-label {
  font-size: $size-14;
  font-weight: $fw-medium;
  color: $color-g-54;
}

.info-value {
  font-size: $size-16;
  color: $color-g-21;
}

.note-content {
  background: $color-g-97;
  border: 1px solid $color-g-90;
  border-radius: $size-8;
  padding: $size-16;
}

.note-text {
  font-size: $size-16;
  line-height: 1.6;
  color: $color-g-21;
  white-space: pre-wrap;
}

.note-edit {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.checkbox-wrapper {
  padding-top: $size-8;
}

.badge {
  display: inline-block;
  padding: $size-4 $size-12;
  border-radius: $size-16;
  font-size: $size-12;
  font-weight: $fw-medium;

  &--primary {
    background-color: rgba($color-pri-main, 0.1);
    color: $color-pri-main;
  }

  &--success {
    background-color: rgba(#10B981, 0.1);
    color: #10B981;
  }

  &--warning {
    background-color: rgba(#F59E0B, 0.1);
    color: #F59E0B;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $size-12;
  padding: $size-16;
}
</style>
