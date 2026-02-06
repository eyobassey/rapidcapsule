<template>
  <div class="step-container">
    <div class="step-scroll">
      <div class="step-content">
        <div class="step-header">
          <div class="step-header-row">
            <button class="back-btn" @click="goBack">
              <v-icon name="hi-arrow-left" scale="0.9" />
              <span>Back</span>
            </button>
            <span class="step-badge optional">Step 7 of 9 - Optional</span>
          </div>
          <div class="step-info">
            <h1 class="step-title">Medical History</h1>
            <p class="step-description">
              Share your medical background to help specialists provide better care.
            </p>
          </div>
        </div>

        <div class="form-sections">
          <!-- Pre-existing Conditions -->
          <div class="form-section">
            <h2 class="section-title">Pre-existing Conditions</h2>
            <p class="section-description">Medical conditions you've been diagnosed with that may affect your healthcare.</p>
            <div class="condition-list">
              <div v-for="(condition, index) in preExistingConditions.conditions" :key="index" class="condition-card">
                <div class="condition-header">
                  <span class="condition-number">Condition {{ index + 1 }}</span>
                  <div class="condition-actions">
                    <button class="edit-btn" @click="editCondition(index)" v-if="editingConditionIndex !== index">
                      <v-icon name="hi-pencil" scale="0.7" />
                    </button>
                    <button class="remove-btn" @click="removeCondition(index)">
                      <v-icon name="hi-x" scale="0.8" />
                    </button>
                  </div>
                </div>
                <!-- View mode -->
                <div v-if="editingConditionIndex !== index" class="condition-view">
                  <div class="condition-name-display">{{ condition.name }}</div>
                  <div class="condition-description-display" v-if="condition.description">{{ condition.description }}</div>
                  <div class="condition-meta">
                    <span v-if="condition.start_date" class="meta-item">
                      <v-icon name="hi-calendar" scale="0.7" />
                      Started: {{ formatDate(condition.start_date) }}
                    </span>
                    <span v-if="condition.end_date" class="meta-item">
                      <v-icon name="hi-calendar" scale="0.7" />
                      Ended: {{ formatDate(condition.end_date) }}
                    </span>
                    <span class="status-badge" :class="condition.is_condition_exists ? 'active' : 'resolved'">
                      {{ condition.is_condition_exists ? 'Active' : 'Resolved' }}
                    </span>
                  </div>
                </div>
                <!-- Edit mode -->
                <div v-else class="condition-fields">
                  <div class="field-row">
                    <div class="form-group flex-2">
                      <label class="form-label">Condition Name <span class="required">*</span></label>
                      <input type="text" v-model="condition.name" class="form-input" placeholder="e.g., Type 2 Diabetes" />
                    </div>
                    <div class="form-group flex-1">
                      <label class="form-label">Status</label>
                      <select v-model="condition.is_condition_exists" class="form-select">
                        <option :value="true">Active (Ongoing)</option>
                        <option :value="false">Resolved</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description <span class="required">*</span></label>
                    <textarea v-model="condition.description" class="form-textarea" rows="2" placeholder="Describe the condition, symptoms, or treatment..."></textarea>
                  </div>
                  <div class="field-row">
                    <div class="form-group flex-1">
                      <label class="form-label">Start Date</label>
                      <input type="date" v-model="condition.start_date" class="form-input" />
                    </div>
                    <div class="form-group flex-1">
                      <label class="form-label">End Date</label>
                      <input type="date" v-model="condition.end_date" class="form-input" :disabled="condition.is_condition_exists" />
                    </div>
                  </div>
                  <div class="edit-actions">
                    <button class="btn-done" @click="doneEditingCondition">
                      <v-icon name="hi-check" scale="0.8" />
                      <span>Done</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button class="add-btn" @click="addCondition">
              <v-icon name="hi-plus" scale="0.8" />
              <span>Add Pre-existing Condition</span>
            </button>
          </div>

          <!-- Chronic Conditions -->
          <div class="form-section">
            <h2 class="section-title">Chronic Conditions</h2>
            <p class="section-description">Any ongoing health conditions you're managing.</p>
            <div class="chip-selector">
              <button
                v-for="condition in commonConditions"
                :key="condition"
                class="chip"
                :class="{ selected: medicalHistory.chronic_conditions.includes(condition) }"
                @click="toggleCondition(condition)"
              >
                {{ condition }}
              </button>
            </div>
            <input
              type="text"
              v-model="customCondition"
              class="form-input"
              placeholder="Add other condition..."
              @keypress.enter="addCustomCondition"
            />
          </div>

          <!-- Current Medications -->
          <div class="form-section">
            <h2 class="section-title">Current Medications</h2>
            <p class="section-description">Medications you're currently taking.</p>
            <div class="medication-list">
              <div v-for="(med, index) in medicalHistory.current_medications" :key="index" class="medication-card">
                <div class="medication-header">
                  <span class="medication-number">Medication {{ index + 1 }}</span>
                  <button class="remove-btn" @click="removeMedication(index)">
                    <v-icon name="hi-x" scale="0.8" />
                  </button>
                </div>
                <div class="medication-fields">
                  <!-- Row 1: Name and Strength -->
                  <div class="field-row">
                    <div class="form-group flex-2">
                      <label class="form-label">Medication Name <span class="required">*</span></label>
                      <input type="text" v-model="med.name" class="form-input" placeholder="e.g., Metformin" />
                    </div>
                    <div class="form-group flex-1">
                      <label class="form-label">Strength</label>
                      <input type="text" v-model="med.strength" class="form-input" placeholder="e.g., 500mg" />
                    </div>
                  </div>
                  <!-- Row 2: Form, Dosage, Frequency -->
                  <div class="field-row">
                    <div class="form-group flex-1">
                      <label class="form-label">Form</label>
                      <select v-model="med.form" class="form-select">
                        <option value="">Select form...</option>
                        <option value="tablet">Tablet</option>
                        <option value="capsule">Capsule</option>
                        <option value="syrup">Syrup</option>
                        <option value="injection">Injection</option>
                        <option value="cream">Cream/Ointment</option>
                        <option value="drops">Drops</option>
                        <option value="inhaler">Inhaler</option>
                        <option value="patch">Patch</option>
                        <option value="suppository">Suppository</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div class="form-group flex-1">
                      <label class="form-label">Dosage</label>
                      <input type="text" v-model="med.dosage" class="form-input" placeholder="e.g., 1 tablet" />
                    </div>
                    <div class="form-group flex-1">
                      <label class="form-label">Frequency</label>
                      <select v-model="med.frequency" class="form-select">
                        <option value="">Select...</option>
                        <option value="once_daily">Once daily</option>
                        <option value="twice_daily">Twice daily</option>
                        <option value="three_daily">Three times daily</option>
                        <option value="four_daily">Four times daily</option>
                        <option value="every_6_hours">Every 6 hours</option>
                        <option value="every_8_hours">Every 8 hours</option>
                        <option value="every_12_hours">Every 12 hours</option>
                        <option value="as_needed">As needed (PRN)</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <!-- Row 3: Route, Reason, Start Date (Optional) -->
                  <div class="field-row">
                    <div class="form-group flex-1">
                      <label class="form-label">Route</label>
                      <select v-model="med.route" class="form-select">
                        <option value="">Select route...</option>
                        <option value="oral">Oral</option>
                        <option value="sublingual">Sublingual</option>
                        <option value="topical">Topical</option>
                        <option value="injection">Injection</option>
                        <option value="inhalation">Inhalation</option>
                        <option value="rectal">Rectal</option>
                        <option value="nasal">Nasal</option>
                        <option value="ophthalmic">Eye (Ophthalmic)</option>
                        <option value="otic">Ear (Otic)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div class="form-group flex-1">
                      <label class="form-label">Reason for Taking</label>
                      <input type="text" v-model="med.reason" class="form-input" placeholder="e.g., Blood sugar control" />
                    </div>
                    <div class="form-group flex-1">
                      <label class="form-label">Start Date</label>
                      <input type="date" v-model="med.start_date" class="form-input" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button class="add-btn" @click="addMedication">
              <v-icon name="hi-plus" scale="0.8" />
              <span>Add Medication</span>
            </button>
          </div>

          <!-- Past Surgeries -->
          <div class="form-section">
            <h2 class="section-title">Past Surgeries</h2>
            <p class="section-description">Any surgical procedures you've had in the past.</p>
            <div class="item-list">
              <div v-for="(surgery, index) in medicalHistory.past_surgeries" :key="index" class="item-card">
                <div class="item-fields">
                  <div class="field-row">
                    <div class="form-group flex-2">
                      <label class="form-label">Procedure <span class="required">*</span></label>
                      <input type="text" v-model="surgery.procedure" class="form-input" placeholder="e.g., Appendectomy" />
                    </div>
                    <div class="form-group flex-1">
                      <label class="form-label">Year</label>
                      <input type="text" v-model="surgery.year" class="form-input" placeholder="e.g., 2020" />
                    </div>
                    <button class="remove-btn" @click="removeSurgery(index)">
                      <v-icon name="hi-x" scale="0.8" />
                    </button>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Notes</label>
                    <input type="text" v-model="surgery.notes" class="form-input" placeholder="Any additional details..." />
                  </div>
                </div>
              </div>
            </div>
            <button class="add-btn" @click="addSurgery">
              <v-icon name="hi-plus" scale="0.8" />
              <span>Add Surgery</span>
            </button>
          </div>

          <!-- Family History -->
          <div class="form-section">
            <h2 class="section-title">Family Medical History</h2>
            <p class="section-description">Health conditions that run in your family.</p>
            <div class="chip-selector">
              <button
                v-for="condition in familyConditions"
                :key="condition"
                class="chip"
                :class="{ selected: medicalHistory.family_history.some(f => f.condition === condition) }"
                @click="toggleFamilyCondition(condition)"
              >
                {{ condition }}
              </button>
            </div>
            <div class="item-list" v-if="medicalHistory.family_history.length > 0">
              <div v-for="(item, index) in medicalHistory.family_history" :key="index" class="item-card compact">
                <div class="field-row">
                  <div class="form-group flex-2">
                    <span class="condition-name">{{ item.condition }}</span>
                  </div>
                  <div class="form-group flex-1">
                    <select v-model="item.relation" class="form-select">
                      <option value="">Select relation...</option>
                      <option value="mother">Mother</option>
                      <option value="father">Father</option>
                      <option value="sibling">Sibling</option>
                      <option value="grandparent">Grandparent</option>
                      <option value="aunt_uncle">Aunt/Uncle</option>
                      <option value="multiple">Multiple relatives</option>
                    </select>
                  </div>
                  <button class="remove-btn" @click="removeFamilyHistory(index)">
                    <v-icon name="hi-x" scale="0.8" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Immunizations -->
          <div class="form-section">
            <h2 class="section-title">Immunizations</h2>
            <p class="section-description">Vaccines you've received.</p>
            <div class="chip-selector">
              <button
                v-for="vaccine in commonVaccines"
                :key="vaccine"
                class="chip"
                :class="{ selected: medicalHistory.immunizations.some(i => i.vaccine === vaccine) }"
                @click="toggleVaccine(vaccine)"
              >
                {{ vaccine }}
              </button>
            </div>
            <div class="item-list" v-if="medicalHistory.immunizations.length > 0">
              <div v-for="(item, index) in medicalHistory.immunizations" :key="index" class="item-card compact">
                <div class="field-row">
                  <div class="form-group flex-2">
                    <span class="condition-name">{{ item.vaccine }}</span>
                  </div>
                  <div class="form-group flex-1">
                    <input type="date" v-model="item.date" class="form-input" placeholder="Date received" />
                  </div>
                  <button class="remove-btn" @click="removeImmunization(index)">
                    <v-icon name="hi-x" scale="0.8" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Lifestyle -->
          <div class="form-section">
            <h2 class="section-title">Lifestyle</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Smoking</label>
                <select v-model="medicalHistory.lifestyle.smoking" class="form-select">
                  <option value="">Select...</option>
                  <option value="never">Never smoked</option>
                  <option value="former">Former smoker</option>
                  <option value="occasional">Occasional</option>
                  <option value="current">Current smoker</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Alcohol</label>
                <select v-model="medicalHistory.lifestyle.alcohol" class="form-select">
                  <option value="">Select...</option>
                  <option value="never">Never</option>
                  <option value="occasional">Occasional</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Exercise</label>
                <select v-model="medicalHistory.lifestyle.exercise" class="form-select">
                  <option value="">Select...</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light (1-2x/week)</option>
                  <option value="moderate">Moderate (3-4x/week)</option>
                  <option value="active">Active (5+/week)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Diet</label>
                <select v-model="medicalHistory.lifestyle.diet" class="form-select">
                  <option value="">Select...</option>
                  <option value="regular">Regular</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="keto">Keto</option>
                  <option value="halal">Halal</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="step-footer">
          <button class="btn-skip" @click="skipStep">
            Skip for now
          </button>
          <div class="footer-actions">
            <button class="btn-secondary" @click="saveAndExit">
              Save & Exit
            </button>
            <button class="btn-primary" @click="saveAndContinue">
              <span>Continue</span>
              <v-icon name="hi-arrow-right" scale="0.8" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { usePatientOnboardingState } from './composables/usePatientOnboardingState';

const router = useRouter();
const store = useStore();
const $http = inject('$http');
const { medicalHistory, preExistingConditions, completeStep, saveProgress, goToStep } = usePatientOnboardingState();

const isSaving = ref(false);
const editingConditionIndex = ref(null);

const customCondition = ref('');

// Pre-existing Conditions CRUD
const addCondition = () => {
  preExistingConditions.conditions.push({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    is_condition_exists: true,
    file: [],
  });
  // Auto-enter edit mode for the new condition
  editingConditionIndex.value = preExistingConditions.conditions.length - 1;
};

const editCondition = (index) => {
  editingConditionIndex.value = index;
};

const doneEditingCondition = () => {
  editingConditionIndex.value = null;
};

const removeCondition = (index) => {
  preExistingConditions.conditions.splice(index, 1);
  if (editingConditionIndex.value === index) {
    editingConditionIndex.value = null;
  } else if (editingConditionIndex.value > index) {
    editingConditionIndex.value--;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const commonConditions = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'Arthritis',
  'Thyroid',
  'Cancer',
  'Depression',
  'Anxiety',
  'GERD',
];

const familyConditions = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Cancer',
  'Stroke',
  'Alzheimer\'s',
  'Mental Illness',
  'Kidney Disease',
  'Autoimmune',
];

const commonVaccines = [
  'COVID-19',
  'Flu (Influenza)',
  'Hepatitis B',
  'Hepatitis A',
  'Tetanus',
  'MMR',
  'Polio',
  'Yellow Fever',
  'Meningitis',
  'HPV',
];

const goBack = () => goToStep(6);

const toggleCondition = (condition) => {
  const index = medicalHistory.chronic_conditions.indexOf(condition);
  if (index > -1) {
    medicalHistory.chronic_conditions.splice(index, 1);
  } else {
    medicalHistory.chronic_conditions.push(condition);
  }
};

const addCustomCondition = () => {
  if (customCondition.value.trim()) {
    medicalHistory.chronic_conditions.push(customCondition.value.trim());
    customCondition.value = '';
  }
};

const addMedication = () => {
  medicalHistory.current_medications.push({
    name: '',
    strength: '',
    form: '',
    dosage: '',
    frequency: '',
    route: '',
    reason: '',
    start_date: '',
  });
};

const removeMedication = (index) => {
  medicalHistory.current_medications.splice(index, 1);
};

// Past Surgeries
const addSurgery = () => {
  medicalHistory.past_surgeries.push({
    procedure: '',
    year: '',
    notes: '',
  });
};

const removeSurgery = (index) => {
  medicalHistory.past_surgeries.splice(index, 1);
};

// Family History
const toggleFamilyCondition = (condition) => {
  const index = medicalHistory.family_history.findIndex(f => f.condition === condition);
  if (index > -1) {
    medicalHistory.family_history.splice(index, 1);
  } else {
    medicalHistory.family_history.push({ condition, relation: '' });
  }
};

const removeFamilyHistory = (index) => {
  medicalHistory.family_history.splice(index, 1);
};

// Immunizations
const toggleVaccine = (vaccine) => {
  const index = medicalHistory.immunizations.findIndex(i => i.vaccine === vaccine);
  if (index > -1) {
    medicalHistory.immunizations.splice(index, 1);
  } else {
    medicalHistory.immunizations.push({ vaccine, date: '' });
  }
};

const removeImmunization = (index) => {
  medicalHistory.immunizations.splice(index, 1);
};

// Save medical history to backend
const saveMedicalHistoryToBackend = async () => {
  const hasMedicalHistoryData =
    medicalHistory.chronic_conditions.length > 0 ||
    medicalHistory.current_medications.length > 0 ||
    medicalHistory.past_surgeries.length > 0 ||
    medicalHistory.family_history.length > 0 ||
    medicalHistory.immunizations.length > 0 ||
    medicalHistory.lifestyle.smoking ||
    medicalHistory.lifestyle.alcohol;

  // Filter valid pre-existing conditions (must have name and description)
  const validPreExistingConditions = preExistingConditions.conditions.filter(
    c => c.name && c.description
  );
  const hasPreExistingConditions = validPreExistingConditions.length > 0;

  if (!hasMedicalHistoryData && !hasPreExistingConditions) return true;

  try {
    isSaving.value = true;

    const updatePayload = {};

    if (hasMedicalHistoryData) {
      updatePayload.medical_history = {
        chronic_conditions: medicalHistory.chronic_conditions,
        current_medications: medicalHistory.current_medications.filter(m => m.name),
        lifestyle: medicalHistory.lifestyle,
        past_surgeries: medicalHistory.past_surgeries.filter(s => s.procedure),
        family_history: medicalHistory.family_history.filter(f => f.condition),
        immunizations: medicalHistory.immunizations.filter(i => i.vaccine),
      };
    }

    // Always include pre_existing_conditions (even if empty, to allow deletion)
    updatePayload.pre_existing_conditions = validPreExistingConditions.map(condition => ({
      name: condition.name,
      description: condition.description,
      start_date: condition.start_date || null,
      end_date: condition.end_date || null,
      is_condition_exists: condition.is_condition_exists ?? true,
      file: condition.file || [],
    }));

    await $http.$_updateUser(updatePayload);
    // Refresh user profile in store
    await store.dispatch('authenticate', localStorage.getItem('token') || sessionStorage.getItem('token'));
    return true;
  } catch (error) {
    console.error('Failed to save medical history:', error);
    return false;
  } finally {
    isSaving.value = false;
  }
};

const skipStep = () => {
  saveProgress();
  goToStep(8);
};

const saveAndExit = async () => {
  await saveMedicalHistoryToBackend();
  saveProgress();
  router.push({ name: 'Patient Dashboard' });
};

const saveAndContinue = async () => {
  const hasData =
    medicalHistory.chronic_conditions.length > 0 ||
    medicalHistory.current_medications.length > 0 ||
    medicalHistory.past_surgeries.length > 0 ||
    medicalHistory.family_history.length > 0 ||
    medicalHistory.immunizations.length > 0 ||
    medicalHistory.lifestyle.smoking ||
    medicalHistory.lifestyle.alcohol ||
    preExistingConditions.conditions.filter(c => c.name && c.description).length > 0;

  const saved = await saveMedicalHistoryToBackend();

  if (hasData && saved) {
    completeStep('medicalHistory');
  }
  saveProgress();
  goToStep(8);
};
</script>

<style scoped lang="scss">
@import './styles/step-common.scss';

.condition-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.condition-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.2s;

  &:hover {
    border-color: #CBD5E1;
  }
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #E2E8F0;
}

.condition-number {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0288D1;
}

.condition-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn {
  padding: 0.375rem;
  background: #E1F5FE;
  border: 1px solid #4FC3F7;
  border-radius: 0.375rem;
  color: #0288D1;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #B3E5FC;
  }
}

.condition-view {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.condition-name-display {
  font-size: 1rem;
  font-weight: 600;
  color: #1A365D;
}

.condition-description-display {
  font-size: 0.875rem;
  color: #64748B;
  line-height: 1.5;
}

.condition-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-top: 0.25rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #64748B;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;

  &.active {
    background: #FEF3C7;
    color: #D97706;
  }

  &.resolved {
    background: #D1FAE5;
    color: #059669;
  }
}

.condition-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-textarea {
  padding: 0.75rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1A365D;
  resize: vertical;
  min-height: 60px;
  transition: all 0.2s;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #4FC3F7;
    box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.15);
  }

  &:hover {
    border-color: #CBD5E1;
  }

  &::placeholder {
    color: #94A3B8;
  }
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-done {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #0288D1;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #0277BD;
  }
}

.chip-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.chip {
  padding: 0.5rem 1rem;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  border-radius: 9999px;
  font-size: 0.875rem;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #E2E8F0;
  }

  &.selected {
    background: #E1F5FE;
    border-color: #4FC3F7;
    color: #0288D1;
  }
}

.medication-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.medication-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.2s;

  &:hover {
    border-color: #CBD5E1;
  }
}

.medication-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #E2E8F0;
}

.medication-number {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0288D1;
}

.medication-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field-row {
  display: flex;
  gap: 0.75rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &.flex-1 {
    flex: 1;
    min-width: 0;

    @media (max-width: 768px) {
      flex: 1 1 100%;
    }
  }

  &.flex-2 {
    flex: 2;
    min-width: 0;

    @media (max-width: 768px) {
      flex: 1 1 100%;
    }
  }
}

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748B;

  .required {
    color: #DC2626;
  }
}

.form-select {
  padding: 0.625rem 0.75rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1A365D;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4FC3F7;
    box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.15);
  }

  &:hover {
    border-color: #CBD5E1;
  }
}

.remove-btn {
  padding: 0.5rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.375rem;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #FEE2E2;
    border-color: #FECACA;
    color: #DC2626;
  }
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 2px dashed #CBD5E1;
  border-radius: 0.5rem;
  color: #64748B;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: #4FC3F7;
    color: #0288D1;
  }
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.item-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 1rem;

  &.compact {
    padding: 0.75rem 1rem;
  }

  .item-fields {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
}

.condition-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1A365D;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .condition-card {
    padding: 0.875rem;
  }

  .condition-header {
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .condition-number {
    font-size: 0.75rem;
  }

  .condition-name-display {
    font-size: 0.9375rem;
  }

  .condition-description-display {
    font-size: 0.8125rem;
  }

  .condition-meta {
    gap: 0.5rem;
  }

  .meta-item {
    font-size: 0.6875rem;
  }

  .status-badge {
    font-size: 0.625rem;
    padding: 0.1875rem 0.5rem;
  }

  .form-textarea {
    padding: 0.75rem;
    font-size: 1rem;
  }

  .btn-done {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
  }

  .chip-selector {
    gap: 0.375rem;
  }

  .chip {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }

  .medication-card {
    padding: 0.875rem;
  }

  .medication-header {
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
  }

  .medication-number {
    font-size: 0.75rem;
  }

  .field-row {
    flex-direction: column;
    gap: 0.75rem;

    .form-group {
      &.flex-1, &.flex-2 {
        flex: none;
        width: 100%;
      }
    }

    .remove-btn {
      align-self: flex-end;
    }
  }

  .form-label {
    font-size: 0.6875rem;
  }

  .form-input, .form-select {
    padding: 0.75rem;
    font-size: 1rem;
  }

  .item-card {
    padding: 0.875rem;

    &.compact {
      padding: 0.75rem;
    }
  }

  .condition-name {
    font-size: 0.875rem;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
    padding: 1rem;
  }
}
</style>
