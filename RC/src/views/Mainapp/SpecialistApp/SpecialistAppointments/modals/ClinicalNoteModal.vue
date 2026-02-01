<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
        <transition name="modal-scale">
          <div v-if="isOpen" class="clinical-note-modal">
            <!-- Header -->
            <div class="modal-header">
              <div class="header-left">
                <div class="header-icon">
                  <v-icon name="hi-document-text" scale="1.1" />
                </div>
                <div class="header-text">
                  <h2>{{ isEditing ? 'Edit' : 'New' }} Clinical Note</h2>
                  <p>{{ patientName }} - {{ appointmentDate }}</p>
                </div>
              </div>
              <div class="header-actions">
                <span v-if="form.is_draft" class="draft-badge">Draft</span>
                <button class="close-btn" @click="close" :disabled="isSubmitting">
                  <v-icon name="hi-x" scale="1" />
                </button>
              </div>
            </div>

            <!-- Body - Scrollable -->
            <div class="modal-body">
              <!-- Section 1: Chief Complaint -->
              <section class="form-section">
                <div class="section-header">
                  <div class="section-icon blue">
                    <v-icon name="hi-annotation" scale="0.85" />
                  </div>
                  <div>
                    <h3>Chief Complaint</h3>
                    <p class="section-subtitle">Primary reason for visit</p>
                  </div>
                </div>
                <textarea
                  v-model="form.chief_complaint"
                  placeholder="Enter patient's chief complaint..."
                  rows="3"
                  class="form-textarea"
                />
              </section>

              <!-- Section 2: History of Present Illness -->
              <section class="form-section">
                <div class="section-header">
                  <div class="section-icon green">
                    <v-icon name="hi-clipboard-list" scale="0.85" />
                  </div>
                  <div>
                    <h3>History of Present Illness (HPI)</h3>
                    <p class="section-subtitle">Detailed description of current condition</p>
                  </div>
                </div>
                <textarea
                  v-model="form.history_of_present_illness"
                  placeholder="Describe onset, duration, severity, associated symptoms..."
                  rows="4"
                  class="form-textarea"
                />
              </section>

              <!-- Section 3: Physical Examination -->
              <section class="form-section">
                <div class="section-header">
                  <div class="section-icon purple">
                    <v-icon name="hi-clipboard-check" scale="0.85" />
                  </div>
                  <div>
                    <h3>Physical Examination</h3>
                    <p class="section-subtitle">Findings from physical assessment</p>
                  </div>
                </div>

                <div class="form-grid">
                  <div class="form-group">
                    <label>General Appearance</label>
                    <select v-model="form.physical_examination.general_appearance" class="form-select">
                      <option value="">Select...</option>
                      <option value="Well-appearing">Well-appearing</option>
                      <option value="Ill-appearing">Ill-appearing</option>
                      <option value="In distress">In distress</option>
                      <option value="Alert and oriented">Alert and oriented</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Level of Consciousness</label>
                    <select v-model="form.physical_examination.level_of_consciousness" class="form-select">
                      <option value="">Select...</option>
                      <option value="Alert">Alert</option>
                      <option value="Drowsy">Drowsy</option>
                      <option value="Confused">Confused</option>
                      <option value="Unresponsive">Unresponsive</option>
                    </select>
                  </div>
                </div>

                <!-- Vital Signs -->
                <div class="vitals-section">
                  <h4>Vital Signs</h4>
                  <div class="vitals-grid">
                    <div class="vital-input">
                      <label>Blood Pressure</label>
                      <div class="input-with-unit">
                        <input
                          type="text"
                          v-model="form.physical_examination.vital_signs.blood_pressure"
                          placeholder="120/80"
                        />
                        <span class="unit">mmHg</span>
                      </div>
                    </div>
                    <div class="vital-input">
                      <label>Pulse</label>
                      <div class="input-with-unit">
                        <input
                          type="number"
                          v-model.number="form.physical_examination.vital_signs.pulse"
                          placeholder="72"
                        />
                        <span class="unit">bpm</span>
                      </div>
                    </div>
                    <div class="vital-input">
                      <label>Temperature</label>
                      <div class="input-with-unit">
                        <input
                          type="number"
                          step="0.1"
                          v-model.number="form.physical_examination.vital_signs.temperature"
                          placeholder="37.0"
                        />
                        <select
                          v-model="form.physical_examination.vital_signs.temperature_unit"
                          class="unit-select"
                        >
                          <option value="C">°C</option>
                          <option value="F">°F</option>
                        </select>
                      </div>
                    </div>
                    <div class="vital-input">
                      <label>Respiratory Rate</label>
                      <div class="input-with-unit">
                        <input
                          type="number"
                          v-model.number="form.physical_examination.vital_signs.respiratory_rate"
                          placeholder="16"
                        />
                        <span class="unit">/min</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-group full-width">
                  <label>Additional Findings</label>
                  <textarea
                    v-model="form.physical_examination.additional_findings"
                    placeholder="Document any additional physical examination findings..."
                    rows="3"
                    class="form-textarea"
                  />
                </div>
              </section>

              <!-- Section 4: Assessment & Diagnosis -->
              <section class="form-section">
                <div class="section-header">
                  <div class="section-icon orange">
                    <v-icon name="hi-beaker" scale="0.85" />
                  </div>
                  <div>
                    <h3>Assessment & Diagnosis</h3>
                    <p class="section-subtitle">Clinical impression and diagnosis</p>
                  </div>
                </div>

                <div class="form-group">
                  <label>Primary Diagnosis</label>
                  <input
                    type="text"
                    v-model="form.assessment_diagnosis.primary_diagnosis"
                    placeholder="Enter ICD-10 code or diagnosis name..."
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label>Differential Diagnosis</label>
                  <textarea
                    v-model="form.assessment_diagnosis.differential_diagnosis"
                    placeholder="List other possible diagnoses considered..."
                    rows="2"
                    class="form-textarea"
                  />
                </div>

                <div class="form-group">
                  <label>Clinical Impression</label>
                  <textarea
                    v-model="form.assessment_diagnosis.clinical_impression"
                    placeholder="Your clinical assessment and reasoning..."
                    rows="3"
                    class="form-textarea"
                  />
                </div>
              </section>

              <!-- Section 5: Treatment Plan -->
              <section class="form-section">
                <div class="section-header">
                  <div class="section-icon red">
                    <v-icon name="ri-capsule-line" scale="0.85" />
                  </div>
                  <div>
                    <h3>Treatment Plan</h3>
                    <p class="section-subtitle">Recommended interventions and follow-up</p>
                  </div>
                </div>

                <!-- Medications Note -->
                <div class="medications-note">
                  <v-icon name="ri-capsule-line" scale="0.9" />
                  <span>To prescribe medications, use the <strong>Create Prescription</strong> button on the appointment page after saving this note.</span>
                </div>

                <div class="form-group">
                  <label>Lab Tests Ordered</label>
                  <textarea
                    v-model="form.treatment_plan.lab_tests_ordered"
                    placeholder="List any laboratory tests ordered..."
                    rows="2"
                    class="form-textarea"
                  />
                </div>

                <div class="form-group">
                  <label>Patient Instructions</label>
                  <textarea
                    v-model="form.treatment_plan.patient_instructions"
                    placeholder="Instructions for the patient..."
                    rows="3"
                    class="form-textarea"
                  />
                </div>

                <div class="form-grid">
                  <div class="form-group">
                    <label>Follow-up Required</label>
                    <select v-model="form.treatment_plan.follow_up_required" class="form-select">
                      <option value="">Select...</option>
                      <option value="Yes - Schedule appointment">Yes - Schedule appointment</option>
                      <option value="No follow-up needed">No follow-up needed</option>
                      <option value="As needed basis">As needed basis</option>
                      <option value="Urgent follow-up required">Urgent follow-up required</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Follow-up Timeframe</label>
                    <select
                      v-model="form.treatment_plan.follow_up_timeframe"
                      class="form-select"
                      :disabled="!form.treatment_plan.follow_up_required || form.treatment_plan.follow_up_required === 'No follow-up needed'"
                    >
                      <option value="">Select...</option>
                      <option value="1 week">1 week</option>
                      <option value="2 weeks">2 weeks</option>
                      <option value="1 month">1 month</option>
                      <option value="3 months">3 months</option>
                      <option value="6 months">6 months</option>
                    </select>
                  </div>
                </div>
              </section>

              <!-- Section 6: Additional Notes -->
              <section class="form-section">
                <div class="section-header">
                  <div class="section-icon gray">
                    <v-icon name="hi-chat-alt-2" scale="0.85" />
                  </div>
                  <div>
                    <h3>Additional Notes</h3>
                    <p class="section-subtitle">Any other relevant information</p>
                  </div>
                </div>
                <textarea
                  v-model="form.additional_notes"
                  placeholder="Additional observations, patient concerns, or other relevant notes..."
                  rows="3"
                  class="form-textarea"
                />
              </section>

              <!-- Confirmation -->
              <div class="confirmation-section">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="form.confirmed_accurate" />
                  <span>I confirm that the information in this clinical note is accurate and complete to the best of my knowledge.</span>
                </label>
              </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer">
              <div class="footer-info">
                <v-icon name="hi-information-circle" scale="0.85" />
                <span>Auto-saved locally</span>
              </div>
              <div class="footer-actions">
                <button class="btn-cancel" @click="close" :disabled="isSubmitting">
                  Cancel
                </button>
                <button class="btn-draft" @click="saveAsDraft" :disabled="isSubmitting">
                  <v-icon name="hi-document" scale="0.85" />
                  Save as Draft
                </button>
                <button
                  class="btn-complete"
                  @click="saveAndComplete"
                  :disabled="isSubmitting || !form.confirmed_accurate"
                >
                  <template v-if="isSubmitting">
                    <span class="btn-spinner"></span>
                    Saving...
                  </template>
                  <template v-else>
                    <v-icon name="hi-check" scale="0.85" />
                    Save & Complete
                  </template>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, inject } from 'vue';
import { useToast } from 'vue-toast-notification';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  appointment: { type: Object, default: null },
  existingNote: { type: Object, default: null },
});

const emit = defineEmits(['close', 'saved']);

const $http = inject('$http');
const toast = useToast();

const isSubmitting = ref(false);
const isEditing = computed(() => !!props.existingNote);

// Patient info computed
const patientName = computed(() => {
  const patient = props.appointment?.patient;
  if (!patient) return 'Unknown Patient';
  return `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Unknown Patient';
});

const appointmentDate = computed(() => {
  if (!props.appointment?.start_time) return '';
  return new Date(props.appointment.start_time).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

// Form state
const getInitialForm = () => ({
  chief_complaint: '',
  history_of_present_illness: '',
  physical_examination: {
    general_appearance: '',
    level_of_consciousness: '',
    vital_signs: {
      blood_pressure: '',
      pulse: null,
      temperature: null,
      temperature_unit: 'C',
      respiratory_rate: null,
    },
    additional_findings: '',
  },
  assessment_diagnosis: {
    primary_diagnosis: '',
    differential_diagnosis: '',
    clinical_impression: '',
  },
  treatment_plan: {
    lab_tests_ordered: '',
    patient_instructions: '',
    follow_up_required: '',
    follow_up_timeframe: '',
  },
  additional_notes: '',
  is_draft: true,
  confirmed_accurate: false,
});

const form = reactive(getInitialForm());

// Watch for existing note to populate form
watch(
  () => props.existingNote,
  (note) => {
    if (note) {
      // Populate form with existing note data
      Object.assign(form, {
        chief_complaint: note.chief_complaint || '',
        history_of_present_illness: note.history_of_present_illness || '',
        physical_examination: {
          general_appearance: note.physical_examination?.general_appearance || '',
          level_of_consciousness: note.physical_examination?.level_of_consciousness || '',
          vital_signs: {
            blood_pressure: note.physical_examination?.vital_signs?.blood_pressure || '',
            pulse: note.physical_examination?.vital_signs?.pulse || null,
            temperature: note.physical_examination?.vital_signs?.temperature || null,
            temperature_unit: note.physical_examination?.vital_signs?.temperature_unit || 'C',
            respiratory_rate: note.physical_examination?.vital_signs?.respiratory_rate || null,
          },
          additional_findings: note.physical_examination?.additional_findings || '',
        },
        assessment_diagnosis: {
          primary_diagnosis: note.assessment_diagnosis?.primary_diagnosis || '',
          differential_diagnosis: note.assessment_diagnosis?.differential_diagnosis || '',
          clinical_impression: note.assessment_diagnosis?.clinical_impression || '',
        },
        treatment_plan: {
          lab_tests_ordered: note.treatment_plan?.lab_tests_ordered || '',
          patient_instructions: note.treatment_plan?.patient_instructions || '',
          follow_up_required: note.treatment_plan?.follow_up_required || '',
          follow_up_timeframe: note.treatment_plan?.follow_up_timeframe || '',
        },
        additional_notes: note.additional_notes || '',
        is_draft: note.is_draft ?? true,
        confirmed_accurate: note.confirmed_accurate || false,
      });
    }
  },
  { immediate: true }
);

// Reset form when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && !props.existingNote) {
      Object.assign(form, getInitialForm());
    }
  }
);



// Close modal
function close() {
  if (!isSubmitting.value) {
    emit('close');
  }
}

// Build payload
function buildPayload(isDraft) {
  return {
    appointmentId: props.appointment?._id,
    chief_complaint: form.chief_complaint || undefined,
    history_of_present_illness: form.history_of_present_illness || undefined,
    physical_examination: {
      general_appearance: form.physical_examination.general_appearance || undefined,
      level_of_consciousness: form.physical_examination.level_of_consciousness || undefined,
      vital_signs: {
        blood_pressure: form.physical_examination.vital_signs.blood_pressure || undefined,
        pulse: form.physical_examination.vital_signs.pulse || undefined,
        temperature: form.physical_examination.vital_signs.temperature || undefined,
        temperature_unit: form.physical_examination.vital_signs.temperature_unit || undefined,
        respiratory_rate: form.physical_examination.vital_signs.respiratory_rate || undefined,
      },
      additional_findings: form.physical_examination.additional_findings || undefined,
    },
    assessment_diagnosis: {
      primary_diagnosis: form.assessment_diagnosis.primary_diagnosis || undefined,
      differential_diagnosis: form.assessment_diagnosis.differential_diagnosis || undefined,
      clinical_impression: form.assessment_diagnosis.clinical_impression || undefined,
    },
    treatment_plan: {
      lab_tests_ordered: form.treatment_plan.lab_tests_ordered || undefined,
      patient_instructions: form.treatment_plan.patient_instructions || undefined,
      follow_up_required: form.treatment_plan.follow_up_required || undefined,
      follow_up_timeframe: form.treatment_plan.follow_up_timeframe || undefined,
    },
    additional_notes: form.additional_notes || undefined,
    is_draft: isDraft,
    confirmed_accurate: form.confirmed_accurate,
    completed: !isDraft,
  };
}

// Save as draft
async function saveAsDraft() {
  try {
    isSubmitting.value = true;
    const payload = buildPayload(true);

    if (isEditing.value) {
      await $http.$_updateStructuredClinicalNote(
        props.appointment._id,
        props.existingNote.note_id,
        payload
      );
    } else {
      await $http.$_createStructuredClinicalNote(payload);
    }

    toast.success('Clinical note saved as draft');
    emit('saved');
    close();
  } catch (error) {
    console.error('Failed to save clinical note:', error);
    toast.error('Failed to save clinical note');
  } finally {
    isSubmitting.value = false;
  }
}

// Save and complete
async function saveAndComplete() {
  if (!form.confirmed_accurate) {
    toast.warning('Please confirm the information is accurate');
    return;
  }

  try {
    isSubmitting.value = true;
    const payload = buildPayload(false);

    if (isEditing.value) {
      await $http.$_updateStructuredClinicalNote(
        props.appointment._id,
        props.existingNote.note_id,
        payload
      );
    } else {
      await $http.$_createStructuredClinicalNote(payload);
    }

    toast.success('Clinical note saved successfully');
    emit('saved');
    close();
  } catch (error) {
    console.error('Failed to save clinical note:', error);
    toast.error('Failed to save clinical note');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.clinical-note-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

// Header
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-radius: 16px 16px 0 0;
  color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-text h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.header-text p {
  font-size: 0.875rem;
  margin: 4px 0 0;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.draft-badge {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Body
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

// Form Sections
.form-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #E5E7EB;

  &:last-of-type {
    border-bottom: none;
    margin-bottom: 16px;
  }
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
}

.section-subtitle {
  font-size: 0.75rem;
  color: #6B7280;
  margin: 2px 0 0;
}

.section-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.blue {
    background: #DBEAFE;
    color: #3B82F6;
  }
  &.green {
    background: #D1FAE5;
    color: #10B981;
  }
  &.purple {
    background: #EDE9FE;
    color: #8B5CF6;
  }
  &.orange {
    background: #FEF3C7;
    color: #F59E0B;
  }
  &.red {
    background: #FEE2E2;
    color: #EF4444;
  }
  &.gray {
    background: #F3F4F6;
    color: #6B7280;
  }
}

// Form Elements
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.form-group {
  margin-bottom: 16px;

  &.full-width {
    grid-column: 1 / -1;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
  }
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #111827;
  background: #fff;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }

  &::placeholder {
    color: #9CA3AF;
  }

  &:disabled {
    background: #F9FAFB;
    cursor: not-allowed;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

// Vital Signs
.vitals-section {
  background: #F9FAFB;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 12px;
  }
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.vital-input {
  label {
    display: block;
    font-size: 0.75rem;
    color: #6B7280;
    margin-bottom: 4px;
  }
}

.input-with-unit {
  display: flex;
  align-items: stretch;

  input {
    flex: 1;
    padding: 8px 10px;
    border: 2px solid #E5E7EB;
    border-radius: 6px 0 0 6px;
    font-size: 0.875rem;
    min-width: 0;

    &:focus {
      outline: none;
      border-color: #3B82F6;
    }
  }

  .unit,
  .unit-select {
    padding: 8px 10px;
    background: #F3F4F6;
    border: 2px solid #E5E7EB;
    border-left: none;
    border-radius: 0 6px 6px 0;
    font-size: 0.75rem;
    color: #6B7280;
    white-space: nowrap;
  }

  .unit-select {
    appearance: none;
    cursor: pointer;
    padding-right: 8px;
  }
}

// Medications Note
.medications-note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #F0F9FF;
  border: 1px solid #BAE6FD;
  border-radius: 8px;
  margin-bottom: 16px;
  color: #0369A1;
  font-size: 0.8125rem;
  line-height: 1.5;

  svg {
    flex-shrink: 0;
    color: #0EA5E9;
  }

  strong {
    color: #0284C7;
  }
}

// Confirmation
.confirmation-section {
  padding: 16px;
  background: #EDE9FE;
  border: 2px solid #C4B5FD;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: #8B5CF6;
    flex-shrink: 0;
  }

  span {
    font-size: 0.875rem;
    color: #374151;
    line-height: 1.5;
  }
}

// Footer
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #F9FAFB;
  border-top: 1px solid #E5E7EB;
  border-radius: 0 0 16px 16px;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6B7280;
  font-size: 0.75rem;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-draft,
.btn-complete {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-cancel {
  background: #fff;
  border: 2px solid #E5E7EB;
  color: #374151;

  &:hover:not(:disabled) {
    background: #F9FAFB;
  }
}

.btn-draft {
  background: #fff;
  border: 2px solid #E5E7EB;
  color: #374151;

  &:hover:not(:disabled) {
    background: #F9FAFB;
  }
}

.btn-complete {
  background: #3B82F6;
  border: 2px solid #3B82F6;
  color: #fff;

  &:hover:not(:disabled) {
    background: #2563EB;
    border-color: #2563EB;
  }
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

// Responsive
@media (max-width: 600px) {
  .modal-overlay {
    padding: 10px;
  }

  .clinical-note-modal {
    max-height: 95vh;
  }

  .modal-header {
    padding: 16px;
  }

  .header-icon {
    width: 40px;
    height: 40px;
  }

  .header-text h2 {
    font-size: 1.1rem;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }

  .footer-actions {
    width: 100%;
    flex-direction: column;

    button {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
