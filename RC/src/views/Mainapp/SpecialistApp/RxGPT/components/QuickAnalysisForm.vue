<template>
  <div class="analysis-form">
    <!-- Patient / Subject Name -->
    <div class="form-group">
      <label class="form-label">Patient / Subject Name <span class="optional-tag">Optional</span></label>
      <input
        v-model="form.subject_name"
        type="text"
        class="form-input"
        placeholder="e.g. Mrs. Johnson, John D."
      />
    </div>

    <!-- Diagnosis (Required) -->
    <div class="form-group">
      <label class="form-label">
        <v-icon name="hi-clipboard-list" scale="0.8" />
        Primary Diagnosis <span class="required">*</span>
      </label>
      <input
        v-model="form.diagnosis"
        type="text"
        class="form-input"
        placeholder="e.g., Hypertension, Type 2 Diabetes, Atrial Fibrillation"
      />
    </div>

    <!-- Treatment Goal -->
    <div class="form-group">
      <label class="form-label">
        <v-icon name="hi-light-bulb" scale="0.8" />
        Treatment Goal
      </label>
      <input
        v-model="form.treatment_goal"
        type="text"
        class="form-input"
        placeholder="e.g., Blood pressure control below 140/90"
      />
    </div>

    <!-- Patient Context (Collapsible) -->
    <div class="collapsible-section">
      <button class="collapsible-header" @click="showPatientContext = !showPatientContext">
        <div class="collapsible-title">
          <v-icon name="hi-user" scale="0.85" />
          <span>Patient Context</span>
          <span class="optional-badge">Optional</span>
        </div>
        <v-icon :name="showPatientContext ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
      </button>
      <div v-if="showPatientContext" class="collapsible-body">
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label-sm">Age</label>
            <input v-model.number="form.patient_context.age" type="number" class="form-input form-input--sm" placeholder="e.g., 55" min="1" max="120" />
          </div>
          <div class="form-group form-group--half">
            <label class="form-label-sm">Gender</label>
            <select v-model="form.patient_context.gender" class="form-input form-input--sm">
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label-sm">Weight (kg)</label>
            <input v-model.number="form.patient_context.weight" type="number" class="form-input form-input--sm" placeholder="e.g., 75" min="1" />
          </div>
          <div class="form-group form-group--half">
            <div class="checkbox-row">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.patient_context.renal_impairment" />
                <span>Renal Impairment</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.patient_context.hepatic_impairment" />
                <span>Hepatic Impairment</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.patient_context.pregnant" />
                <span>Pregnant</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Allergies -->
        <div class="form-group">
          <label class="form-label-sm">Known Allergies</label>
          <div class="tag-input-wrapper">
            <div class="tags-list" v-if="form.patient_context.allergies.length">
              <span class="tag tag--danger" v-for="(allergy, i) in form.patient_context.allergies" :key="i">
                {{ allergy }}
                <button class="tag-remove" @click="form.patient_context.allergies.splice(i, 1)">&times;</button>
              </span>
            </div>
            <input
              v-model="allergyInput"
              type="text"
              class="form-input form-input--sm"
              placeholder="Type allergy and press Enter"
              @keydown.enter.prevent="addAllergy"
            />
          </div>
        </div>

        <!-- Chronic Conditions -->
        <div class="form-group">
          <label class="form-label-sm">Chronic Conditions</label>
          <div class="tag-input-wrapper">
            <div class="tags-list" v-if="form.patient_context.chronic_conditions.length">
              <span class="tag tag--info" v-for="(cond, i) in form.patient_context.chronic_conditions" :key="i">
                {{ cond }}
                <button class="tag-remove" @click="form.patient_context.chronic_conditions.splice(i, 1)">&times;</button>
              </span>
            </div>
            <input
              v-model="conditionInput"
              type="text"
              class="form-input form-input--sm"
              placeholder="Type condition and press Enter"
              @keydown.enter.prevent="addCondition"
            />
          </div>
        </div>

        <!-- Current Medications -->
        <div class="form-group">
          <label class="form-label-sm">Current Medications</label>
          <div v-for="(med, i) in form.patient_context.current_medications" :key="i" class="med-row">
            <input v-model="med.name" class="form-input form-input--sm" placeholder="Drug name" />
            <input v-model="med.dosage" class="form-input form-input--xs" placeholder="Dosage" />
            <input v-model="med.frequency" class="form-input form-input--xs" placeholder="Frequency" />
            <button class="btn-icon btn-icon--danger" @click="form.patient_context.current_medications.splice(i, 1)">
              <v-icon name="hi-trash" scale="0.7" />
            </button>
          </div>
          <button class="btn-add" @click="addCurrentMedication">
            <v-icon name="hi-plus" scale="0.7" /> Add Medication
          </button>
        </div>
      </div>
    </div>

    <!-- Symptoms -->
    <div class="collapsible-section">
      <button class="collapsible-header" @click="showSymptoms = !showSymptoms">
        <div class="collapsible-title">
          <v-icon name="hi-clipboard-list" scale="0.85" />
          <span>Symptoms</span>
          <span class="optional-badge">Optional</span>
        </div>
        <v-icon :name="showSymptoms ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
      </button>
      <div v-if="showSymptoms" class="collapsible-body">
        <div class="tag-input-wrapper">
          <div class="tags-list" v-if="form.symptoms.length">
            <span class="tag" v-for="(sym, i) in form.symptoms" :key="i">
              {{ sym }}
              <button class="tag-remove" @click="form.symptoms.splice(i, 1)">&times;</button>
            </span>
          </div>
          <input
            v-model="symptomInput"
            type="text"
            class="form-input form-input--sm"
            placeholder="Type symptom and press Enter"
            @keydown.enter.prevent="addSymptom"
          />
        </div>
      </div>
    </div>

    <!-- Options Row -->
    <div class="form-row options-row">
      <div class="form-group form-group--half">
        <label class="form-label-sm">Max Suggestions</label>
        <select v-model.number="form.max_suggestions" class="form-input form-input--sm">
          <option :value="3">3 suggestions</option>
          <option :value="5">5 suggestions</option>
          <option :value="7">7 suggestions</option>
        </select>
      </div>
      <div class="form-group form-group--half">
        <label class="checkbox-label checkbox-label--standalone">
          <input type="checkbox" v-model="form.prefer_inventory" />
          <span>Prefer inventory medications</span>
        </label>
      </div>
    </div>

    <!-- Submit -->
    <button
      class="btn-analyze"
      :class="{ 'btn-analyze--disabled': !canSubmit || isSubmitting }"
      :disabled="!canSubmit || isSubmitting"
      @click="handleSubmit"
    >
      <template v-if="isSubmitting">
        <div class="btn-spinner"></div>
        Analyzing...
      </template>
      <template v-else>
        <v-icon name="bi-robot" scale="1" />
        Analyze Safety & Generate Recommendations
      </template>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['submit']);

const props = defineProps({
  isSubmitting: { type: Boolean, default: false },
});

const showPatientContext = ref(false);
const showSymptoms = ref(false);

const allergyInput = ref('');
const conditionInput = ref('');
const symptomInput = ref('');

const form = ref({
  subject_name: '',
  diagnosis: '',
  treatment_goal: '',
  patient_context: {
    age: null,
    gender: '',
    weight: null,
    allergies: [],
    chronic_conditions: [],
    current_medications: [],
    renal_impairment: false,
    hepatic_impairment: false,
    pregnant: false,
  },
  symptoms: [],
  max_suggestions: 5,
  prefer_inventory: true,
});

const canSubmit = computed(() => {
  return form.value.diagnosis.trim().length >= 3;
});

function addAllergy() {
  const val = allergyInput.value.trim();
  if (val && !form.value.patient_context.allergies.includes(val)) {
    form.value.patient_context.allergies.push(val);
  }
  allergyInput.value = '';
}

function addCondition() {
  const val = conditionInput.value.trim();
  if (val && !form.value.patient_context.chronic_conditions.includes(val)) {
    form.value.patient_context.chronic_conditions.push(val);
  }
  conditionInput.value = '';
}

function addSymptom() {
  const val = symptomInput.value.trim();
  if (val && !form.value.symptoms.includes(val)) {
    form.value.symptoms.push(val);
  }
  symptomInput.value = '';
}

function addCurrentMedication() {
  form.value.patient_context.current_medications.push({
    name: '',
    dosage: '',
    frequency: '',
  });
}

function handleSubmit() {
  if (!canSubmit.value || props.isSubmitting) return;

  // Build clean payload
  const payload = {
    diagnosis: form.value.diagnosis.trim(),
    treatment_goal: form.value.treatment_goal.trim() || undefined,
    max_suggestions: form.value.max_suggestions,
    prefer_inventory: form.value.prefer_inventory,
    ...(form.value.subject_name.trim() && { subject_name: form.value.subject_name.trim() }),
  };

  // Only include patient_context if any field is filled
  const ctx = form.value.patient_context;
  const hasContext = ctx.age || ctx.gender || ctx.weight || ctx.allergies.length ||
    ctx.chronic_conditions.length || ctx.current_medications.length ||
    ctx.renal_impairment || ctx.hepatic_impairment || ctx.pregnant;

  if (hasContext) {
    payload.patient_context = {
      ...(ctx.age && { age: ctx.age }),
      ...(ctx.gender && { gender: ctx.gender }),
      ...(ctx.weight && { weight: ctx.weight }),
      ...(ctx.allergies.length && { allergies: ctx.allergies }),
      ...(ctx.chronic_conditions.length && { chronic_conditions: ctx.chronic_conditions }),
      ...(ctx.current_medications.filter(m => m.name).length && {
        current_medications: ctx.current_medications.filter(m => m.name),
      }),
      ...(ctx.renal_impairment && { renal_impairment: true }),
      ...(ctx.hepatic_impairment && { hepatic_impairment: true }),
      ...(ctx.pregnant && { pregnant: true }),
    };
  }

  if (form.value.symptoms.length) {
    payload.symptoms = form.value.symptoms;
  }

  emit('submit', payload);
}
</script>

<style lang="scss" scoped>
// Pharmacy Design System Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;

.analysis-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group--half {
  flex: 1;
  min-width: 0;
}

.form-row {
  display: flex;
  gap: 12px;
  @media (max-width: 480px) { flex-direction: column; }
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: $slate;
}

.form-label-sm {
  font-size: 12px;
  font-weight: 600;
  color: $gray;
  margin-bottom: 2px;
}

.required { color: #ef4444; }

.optional-tag {
  font-size: 11px;
  font-weight: 500;
  color: $gray;
  margin-left: 4px;
}

.form-input {
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: $navy;
  background: rgba(255,255,255,0.8);
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;

  &:focus {
    border-color: $sky-dark;
    box-shadow: 0 0 0 3px rgba(2, 136, 209, 0.1);
  }

  &::placeholder { color: #9ca3af; }
}

.form-input--sm { padding: 8px 12px; font-size: 13px; border-radius: 8px; }
.form-input--xs { padding: 8px 10px; font-size: 12px; border-radius: 8px; max-width: 120px; }

select.form-input {
  cursor: pointer;
  appearance: auto;
}

// Collapsible sections
.collapsible-section {
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255,255,255,0.5);
}

.collapsible-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: $slate;
  transition: background 0.2s;

  &:hover { background: rgba(2, 136, 209, 0.04); }
}

.collapsible-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.optional-badge {
  font-size: 10px;
  font-weight: 500;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 20px;
}

.collapsible-body {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// Tags
.tag-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: $sky-light;
  color: $sky-dark;
}

.tag--danger { background: #fee2e2; color: #991b1b; }
.tag--info { background: #dbeafe; color: #1e40af; }

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 14px;
  line-height: 1;
  opacity: 0.7;
  &:hover { opacity: 1; }
}

// Medication rows
.med-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: #f3f4f6;
  color: $gray;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-icon--danger:hover { background: #fee2e2; color: #dc2626; }

.btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: none;
  border: 1.5px dashed #d1d5db;
  border-radius: 8px;
  color: $sky-dark;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;

  &:hover { border-color: $sky-dark; background: rgba(2, 136, 209, 0.04); }
}

// Checkboxes
.checkbox-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: $sky-dark;
  }
}

.checkbox-label--standalone {
  font-size: 13px;
  padding-top: 22px;
}

// Options
.options-row {
  padding-top: 4px;
  border-top: 1px solid #f3f4f6;
}

// Submit button
.btn-analyze {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 8px;

  &:hover:not(.btn-analyze--disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba($sky, 0.3);
  }
}

.btn-analyze--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
