<template>
  <div class="rxgpt-panel" :class="{ 'has-alerts': hasAlerts, 'is-loading': isLoading }">
    <!-- Header with Mode Toggle -->
    <div class="panel-header">
      <div class="panel-header__left">
        <div class="panel-header__icon" :class="statusClass">
          <v-icon :name="statusIcon" scale="1" />
        </div>
        <div class="panel-header__content">
          <h3>RxGPT AI Assistant</h3>
          <p v-if="!isLoading && !analysisResult && !suggestionResult">
            {{ currentMode === 'suggest' ? 'AI-powered medication suggestions' : 'AI-powered prescription safety check' }}
          </p>
          <p v-else-if="isLoading">{{ loadingMessage }}</p>
          <p v-else-if="analysisResult">
            <span :class="['status-badge', analysisResult.overall_risk_level]">
              {{ riskLevelLabel }}
            </span>
            <span class="confidence">{{ analysisResult.confidence_score }}% confidence</span>
          </p>
          <p v-else-if="suggestionResult">
            <span class="status-badge suggestion">
              {{ suggestionResult.suggestions?.length }} medications suggested
            </span>
          </p>
        </div>
      </div>
      <div class="panel-header__actions">
        <div v-if="creditBalance !== null" class="credits-badge">
          <v-icon name="bi-lightning-charge-fill" scale="0.7" />
          <span>{{ creditBalance === Infinity ? 'Unlimited' : creditBalance }}</span>
        </div>
      </div>
    </div>

    <!-- Mode Toggle -->
    <div v-if="isActive" class="mode-toggle">
      <button
        :class="{ active: currentMode === 'suggest' }"
        @click="currentMode = 'suggest'"
      >
        <v-icon name="bi-lightbulb" scale="0.8" />
        <span>Suggest Medications</span>
      </button>
      <button
        :class="{ active: currentMode === 'analyze' }"
        @click="currentMode = 'analyze'"
        :disabled="proposedDrugs?.length === 0"
      >
        <v-icon name="bi-shield-check" scale="0.8" />
        <span>Safety Analysis</span>
      </button>
    </div>

    <!-- Not Active State -->
    <div v-if="!isActive" class="inactive-state">
      <div class="inactive-icon">
        <v-icon name="hi-link" scale="1.2" />
      </div>
      <p class="inactive-title">Link clinical context to activate</p>
      <p class="inactive-text">RxGPT activates when you link a completed appointment with clinical notes or a health checkup.</p>
    </div>

    <!-- Suggestion Mode -->
    <div v-else-if="currentMode === 'suggest'" class="suggestion-mode">
      <!-- Suggestion Form -->
      <div v-if="!suggestionResult && !isLoading" class="suggestion-form">
        <div class="form-group">
          <label>Diagnosis / Condition</label>
          <input
            v-model="suggestionForm.diagnosis"
            type="text"
            placeholder="e.g., Upper respiratory infection, Hypertension"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>Treatment Goal (optional)</label>
          <input
            v-model="suggestionForm.treatment_goal"
            type="text"
            placeholder="e.g., Pain relief, Blood pressure control"
            class="form-input"
          />
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label>Max Suggestions</label>
            <select v-model="suggestionForm.max_suggestions" class="form-select">
              <option :value="3">3 medications</option>
              <option :value="5">5 medications</option>
              <option :value="7">7 medications</option>
            </select>
          </div>
          <div class="form-group half">
            <label>Preference</label>
            <select v-model="suggestionForm.prefer_inventory" class="form-select">
              <option :value="true">Prefer inventory</option>
              <option :value="false">All medications</option>
            </select>
          </div>
        </div>
        <button class="action-btn primary" @click="getSuggestions" :disabled="!canGetSuggestions">
          <v-icon name="bi-robot" scale="0.9" />
          <span>Get AI Suggestions</span>
        </button>
      </div>

      <!-- Suggestion Results -->
      <div v-else-if="suggestionResult" class="suggestion-results">
        <!-- Patient Context Summary -->
        <div class="context-summary">
          <div class="context-item">
            <v-icon name="hi-user" scale="0.8" />
            <span>{{ suggestionResult.patient_considerations?.age }}y {{ suggestionResult.patient_considerations?.gender }}</span>
          </div>
          <div v-if="suggestionResult.patient_considerations?.allergies?.length" class="context-item warning">
            <v-icon name="hi-exclamation-circle" scale="0.8" />
            <span>{{ suggestionResult.patient_considerations.allergies.length }} allergies</span>
          </div>
          <div v-if="suggestionResult.clinical_context?.diagnosis" class="context-item">
            <v-icon name="hi-document-text" scale="0.8" />
            <span>{{ suggestionResult.clinical_context.diagnosis }}</span>
          </div>
        </div>

        <!-- Clinical Summary -->
        <div class="clinical-summary-box">
          <p>{{ suggestionResult.clinical_summary }}</p>
        </div>

        <!-- Medication Suggestions -->
        <div class="suggestions-list">
          <div class="section-title">
            <v-icon name="ri-capsule-line" scale="0.9" />
            <span>Suggested Medications</span>
          </div>

          <div
            v-for="(med, index) in suggestionResult.suggestions"
            :key="index"
            class="suggestion-card"
            :class="{
              'in-inventory': med.is_in_inventory,
              'out-of-stock': med.inventory_status === 'out_of_stock',
              selected: isSelected(med)
            }"
          >
            <div class="suggestion-header">
              <div class="suggestion-info">
                <span class="priority-badge" :class="med.priority">{{ med.priority }}</span>
                <h4>{{ med.drug_name }}</h4>
                <span v-if="med.generic_name" class="generic-name">({{ med.generic_name }})</span>
              </div>
              <div class="suggestion-meta">
                <span v-if="med.is_in_inventory" class="inventory-badge available">
                  <v-icon name="hi-check-circle" scale="0.7" />
                  {{ med.inventory_status === 'low_stock' ? 'Low Stock' : 'In Stock' }}
                </span>
                <span v-else class="inventory-badge external">
                  <v-icon name="hi-external-link" scale="0.7" />
                  External
                </span>
              </div>
            </div>

            <div class="suggestion-details">
              <div class="detail-row">
                <span class="label">Strength:</span>
                <span class="value">{{ med.strength }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Form:</span>
                <span class="value">{{ med.dosage_form }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Dosage:</span>
                <span class="value">{{ med.suggested_dosage }} {{ med.suggested_frequency }}</span>
              </div>
              <div v-if="med.suggested_duration" class="detail-row">
                <span class="label">Duration:</span>
                <span class="value">{{ med.suggested_duration }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Quantity:</span>
                <span class="value">{{ med.suggested_quantity }}</span>
              </div>
              <div v-if="med.unit_price" class="detail-row">
                <span class="label">Price:</span>
                <span class="value price">₦{{ formatPrice(med.unit_price) }}/unit</span>
              </div>
            </div>

            <div v-if="med.reasoning" class="suggestion-reasoning">
              <v-icon name="hi-light-bulb" scale="0.7" />
              {{ med.reasoning }}
            </div>

            <div v-if="med.instructions" class="suggestion-instructions">
              <v-icon name="hi-information-circle" scale="0.7" />
              {{ med.instructions }}
            </div>

            <!-- Confidence Bar -->
            <div class="confidence-row">
              <div class="confidence-bar">
                <div class="confidence-fill" :style="{ width: `${med.confidence}%` }"></div>
              </div>
              <span class="confidence-value">{{ med.confidence }}%</span>
            </div>

            <!-- Safety Warnings -->
            <div v-if="med.contraindication_check?.warnings?.length" class="safety-warnings">
              <v-icon name="hi-exclamation-circle" scale="0.7" />
              <span>{{ med.contraindication_check.warnings.join(', ') }}</span>
            </div>

            <!-- Add Button -->
            <div class="suggestion-actions">
              <button
                v-if="!isSelected(med)"
                class="add-btn"
                @click="addMedication(med)"
              >
                <v-icon name="hi-plus" scale="0.8" />
                Add to Prescription
              </button>
              <button
                v-else
                class="remove-btn"
                @click="removeMedication(med)"
              >
                <v-icon name="hi-check" scale="0.8" />
                Added
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="results-actions">
          <button class="action-btn secondary" @click="clearSuggestions">
            <v-icon name="hi-arrow-left" scale="0.8" />
            New Suggestions
          </button>
          <button
            v-if="selectedMedications.length > 0"
            class="action-btn primary"
            @click="addAllSelected"
          >
            <v-icon name="hi-plus-circle" scale="0.8" />
            Add {{ selectedMedications.length }} Selected
          </button>
        </div>

        <!-- Disclaimer -->
        <div class="disclaimer">
          <v-icon name="hi-information-circle" scale="0.8" />
          <p>{{ suggestionResult.disclaimer || defaultDisclaimer }}</p>
        </div>
      </div>
    </div>

    <!-- Analysis Mode (existing functionality) -->
    <div v-else-if="currentMode === 'analyze'" class="analysis-mode">
      <!-- Ready State -->
      <div v-if="!analysisResult && !isLoading" class="ready-state">
        <div class="ready-icon">
          <v-icon name="bi-shield-check" scale="1.5" />
        </div>
        <p class="ready-title">Ready to analyze</p>
        <p class="ready-text">
          {{ proposedDrugs?.length || 0 }} medication(s) to check for drug interactions, allergies, and contraindications.
        </p>
        <button class="action-btn primary" @click="runAnalysis" :disabled="!canAnalyze">
          <v-icon name="bi-robot" scale="0.9" />
          <span>Run Safety Analysis</span>
        </button>
      </div>

      <!-- Analysis Results -->
      <div v-else-if="analysisResult" class="analysis-results">
        <!-- Critical Alerts Section -->
        <div v-if="criticalAlerts.length" class="alerts-section critical">
          <div class="section-title">
            <v-icon name="hi-exclamation" scale="0.9" />
            <span>Critical Alerts ({{ criticalAlerts.length }})</span>
          </div>
          <div class="alerts-list">
            <div
              v-for="(alert, index) in criticalAlerts"
              :key="`critical-${index}`"
              class="alert-card critical"
            >
              <div class="alert-header">
                <span class="alert-type">{{ formatAlertType(alert.type) }}</span>
                <span class="alert-drug">{{ alert.drug_name }}</span>
              </div>
              <p class="alert-message">{{ alert.message }}</p>
              <div v-if="showReasoning && alert.reasoning" class="alert-reasoning">
                <strong>Reasoning:</strong> {{ alert.reasoning }}
              </div>
              <p class="alert-action">
                <v-icon name="hi-arrow-right" scale="0.7" />
                {{ alert.action_required }}
              </p>
            </div>
          </div>
        </div>

        <!-- Warning Alerts Section -->
        <div v-if="warningAlerts.length" class="alerts-section warning">
          <div class="section-title">
            <v-icon name="hi-exclamation-circle" scale="0.9" />
            <span>Warnings ({{ warningAlerts.length }})</span>
          </div>
          <div class="alerts-list">
            <div
              v-for="(alert, index) in warningAlerts"
              :key="`warning-${index}`"
              class="alert-card warning"
            >
              <div class="alert-header">
                <span class="alert-type">{{ formatAlertType(alert.type) }}</span>
                <span class="alert-drug">{{ alert.drug_name }}</span>
              </div>
              <p class="alert-message">{{ alert.message }}</p>
              <p v-if="alert.action_required" class="alert-action">
                <v-icon name="hi-arrow-right" scale="0.7" />
                {{ alert.action_required }}
              </p>
            </div>
          </div>
        </div>

        <!-- Drug Analysis Section -->
        <div v-if="analysisResult.drug_analyses?.length" class="drug-analysis-section">
          <div class="section-title">
            <v-icon name="ri-capsule-line" scale="0.9" />
            <span>Drug Analysis</span>
          </div>
          <div class="drug-cards">
            <div
              v-for="(drug, index) in analysisResult.drug_analyses"
              :key="`drug-${index}`"
              class="drug-card"
              :class="{ appropriate: drug.is_appropriate, 'not-appropriate': !drug.is_appropriate }"
            >
              <div class="drug-header">
                <span class="drug-name">{{ drug.drug_name }}</span>
                <span class="drug-status">
                  <v-icon :name="drug.is_appropriate ? 'hi-check-circle' : 'hi-x-circle'" scale="0.8" />
                  {{ drug.is_appropriate ? 'Appropriate' : 'Review Required' }}
                </span>
              </div>
              <p v-if="showReasoning && drug.reasoning" class="drug-reasoning">{{ drug.reasoning }}</p>
            </div>
          </div>
        </div>

        <!-- Clinical Summary -->
        <div v-if="analysisResult.clinical_summary" class="clinical-summary">
          <div class="section-title">
            <v-icon name="hi-document-text" scale="0.9" />
            <span>Clinical Summary</span>
          </div>
          <p>{{ analysisResult.clinical_summary }}</p>
        </div>

        <!-- Re-analyze Button -->
        <div class="results-actions">
          <button class="action-btn secondary" @click="analysisResult = null">
            <v-icon name="hi-refresh" scale="0.8" />
            Re-analyze
          </button>
        </div>

        <!-- Disclaimer -->
        <div class="disclaimer">
          <v-icon name="hi-information-circle" scale="0.8" />
          <p>{{ analysisResult.disclaimer || defaultDisclaimer }}</p>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="bi-robot" scale="1.2" />
        </div>
        <p class="loading-text">{{ loadingMessage }}</p>
        <p class="loading-subtext">{{ loadingSubtext }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { useToast } from 'vue-toast-notification';
import apiFactory from '@/services/apiFactory';

const $toast = useToast();

const props = defineProps({
  patientId: { type: String, default: '' },
  proposedDrugs: { type: Array, default: () => [] },
  linkedAppointments: { type: Array, default: () => [] },
  linkedClinicalNotes: { type: Array, default: () => [] },
  linkedHealthCheckups: { type: Array, default: () => [] },
});

const emit = defineEmits(['alert', 'analysis-complete', 'add-medication', 'add-medications']);

// State
const currentMode = ref('suggest'); // 'suggest' or 'analyze'
const isLoading = ref(false);
const loadingMessage = ref('');
const loadingSubtext = ref('');
const analysisResult = ref(null);
const suggestionResult = ref(null);
const creditBalance = ref(null);
const settings = ref(null);
const selectedMedications = ref([]);

// Suggestion Form
const suggestionForm = reactive({
  diagnosis: '',
  treatment_goal: '',
  max_suggestions: 5,
  prefer_inventory: true,
});

// Default disclaimer
const defaultDisclaimer = 'RxGPT is an AI-powered assistant. All recommendations should be reviewed and verified by a licensed healthcare professional.';

// Computed
const isActive = computed(() => {
  const hasLinkedAppointmentWithNotes = props.linkedAppointments?.length > 0 || props.linkedClinicalNotes?.length > 0;
  const hasLinkedCheckup = props.linkedHealthCheckups?.length > 0;
  return hasLinkedAppointmentWithNotes || hasLinkedCheckup;
});

const canAnalyze = computed(() => {
  return isActive.value && props.proposedDrugs?.length > 0 && props.patientId;
});

const canGetSuggestions = computed(() => {
  return isActive.value && props.patientId;
});

const hasAlerts = computed(() => {
  return analysisResult.value?.alerts?.length > 0;
});

const criticalAlerts = computed(() => {
  return analysisResult.value?.alerts?.filter(a => a.severity === 'critical') || [];
});

const warningAlerts = computed(() => {
  return analysisResult.value?.alerts?.filter(a => a.severity === 'warning') || [];
});

const showReasoning = computed(() => settings.value?.display?.show_reasoning !== false);

const statusClass = computed(() => {
  if (isLoading.value) return 'analyzing';
  if (suggestionResult.value) return 'suggestion';
  if (!analysisResult.value) return 'idle';
  if (criticalAlerts.value.length > 0) return 'critical';
  if (warningAlerts.value.length > 0) return 'warning';
  return 'safe';
});

const statusIcon = computed(() => {
  if (isLoading.value) return 'ri-loader-4-line';
  if (suggestionResult.value) return 'bi-lightbulb';
  if (!analysisResult.value) return 'bi-robot';
  if (criticalAlerts.value.length > 0) return 'hi-exclamation';
  if (warningAlerts.value.length > 0) return 'hi-exclamation-circle';
  return 'hi-shield-check';
});

const riskLevelLabel = computed(() => {
  const level = analysisResult.value?.overall_risk_level;
  const labels = {
    low: 'Low Risk',
    moderate: 'Moderate Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  };
  return labels[level] || 'Unknown';
});

// Methods
function formatAlertType(type) {
  const types = {
    allergy: 'Allergy',
    interaction: 'Drug Interaction',
    contraindication: 'Contraindication',
    dosage: 'Dosage Issue',
    age: 'Age Concern',
    pregnancy: 'Pregnancy Risk',
  };
  return types[type] || type;
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-NG').format(price);
}

function isSelected(med) {
  return selectedMedications.value.some(
    m => m.drug_name === med.drug_name && m.strength === med.strength
  );
}

function addMedication(med) {
  if (!isSelected(med)) {
    selectedMedications.value.push(med);

    // Emit to parent to add to prescription items
    emit('add-medication', {
      drug_id: med.drug_id || null,
      drug_name: med.drug_name,
      generic_name: med.generic_name,
      strength: med.strength,
      dosage_form: med.dosage_form,
      dosage: med.suggested_dosage,
      frequency: med.suggested_frequency,
      duration: med.suggested_duration,
      instructions: med.instructions,
      quantity: med.suggested_quantity,
      unit_price: med.unit_price || 0,
      is_in_inventory: med.is_in_inventory,
      source: med.is_in_inventory ? 'inventory' : 'external',
      rxgpt_suggested: true,
      rxgpt_reasoning: med.reasoning,
    });

    $toast.success(`${med.drug_name} added to prescription`);
  }
}

function removeMedication(med) {
  const index = selectedMedications.value.findIndex(
    m => m.drug_name === med.drug_name && m.strength === med.strength
  );
  if (index > -1) {
    selectedMedications.value.splice(index, 1);
  }
}

function addAllSelected() {
  emit('add-medications', selectedMedications.value.map(med => ({
    drug_id: med.drug_id || null,
    drug_name: med.drug_name,
    generic_name: med.generic_name,
    strength: med.strength,
    dosage_form: med.dosage_form,
    dosage: med.suggested_dosage,
    frequency: med.suggested_frequency,
    duration: med.suggested_duration,
    instructions: med.instructions,
    quantity: med.suggested_quantity,
    unit_price: med.unit_price || 0,
    is_in_inventory: med.is_in_inventory,
    source: med.is_in_inventory ? 'inventory' : 'external',
    rxgpt_suggested: true,
    rxgpt_reasoning: med.reasoning,
  })));

  $toast.success(`${selectedMedications.value.length} medications added to prescription`);
  selectedMedications.value = [];
}

function clearSuggestions() {
  suggestionResult.value = null;
  selectedMedications.value = [];
}

async function fetchCreditsAndSettings() {
  try {
    const statusRes = await apiFactory.$_getRxGPTStatus();
    if (statusRes.data?.data) {
      const data = statusRes.data.data;
      creditBalance.value = data.credits?.available ?? 0;
      if (data.credits?.has_unlimited) {
        creditBalance.value = Infinity;
      }
      settings.value = data;
    }
  } catch (err) {
    console.error('Failed to fetch RxGPT status:', err);
  }
}

async function getSuggestions() {
  if (!canGetSuggestions.value || isLoading.value) return;

  isLoading.value = true;
  loadingMessage.value = 'Generating medication suggestions...';
  loadingSubtext.value = 'Analyzing patient context and clinical guidelines';

  try {
    const payload = {
      patient_id: props.patientId,
      linked_appointments: props.linkedAppointments,
      linked_clinical_notes: props.linkedClinicalNotes,
      linked_health_checkups: props.linkedHealthCheckups,
      diagnosis: suggestionForm.diagnosis || undefined,
      treatment_goal: suggestionForm.treatment_goal || undefined,
      max_suggestions: suggestionForm.max_suggestions,
      prefer_inventory: suggestionForm.prefer_inventory,
    };

    const response = await apiFactory.$_rxgptSuggestMedications(payload);

    if (response.data?.data) {
      suggestionResult.value = response.data.data;
      creditBalance.value = response.data.data.credits_remaining;

      $toast.success(`${suggestionResult.value.suggestions?.length || 0} medication suggestions generated`);
    }
  } catch (err) {
    console.error('RxGPT suggestion failed:', err);
    const errorMsg = err.response?.data?.message || 'Failed to generate suggestions. Please try again.';
    $toast.error(errorMsg);
  } finally {
    isLoading.value = false;
  }
}

async function runAnalysis() {
  if (!canAnalyze.value || isLoading.value) return;

  isLoading.value = true;
  loadingMessage.value = 'Analyzing prescription safety...';
  loadingSubtext.value = 'Checking allergies, interactions, and contraindications';

  try {
    const payload = {
      patient_id: props.patientId,
      proposed_drugs: props.proposedDrugs.map(drug => ({
        drug_id: drug.drug_id,
        name: drug.drug_name,
        generic_name: drug.generic_name,
        strength: drug.strength,
        dosage: drug.dosage,
        frequency: drug.frequency,
        duration_days: drug.duration_days,
        instructions: drug.instructions,
        quantity: drug.quantity,
      })),
      linked_appointments: props.linkedAppointments,
      linked_clinical_notes: props.linkedClinicalNotes,
      linked_health_checkups: props.linkedHealthCheckups,
    };

    const response = await apiFactory.$_rxgptAnalyze(payload);

    if (response.data?.data) {
      analysisResult.value = response.data.data;
      creditBalance.value = response.data.data.credits_remaining;

      // Emit alerts for parent handling
      if (analysisResult.value.alerts?.length > 0) {
        emit('alert', analysisResult.value.alerts);
      }

      emit('analysis-complete', analysisResult.value);

      // Show toast for critical alerts
      if (criticalAlerts.value.length > 0) {
        $toast.error(`${criticalAlerts.value.length} critical safety alert(s) detected!`);
      } else if (warningAlerts.value.length > 0) {
        $toast.warning(`${warningAlerts.value.length} warning(s) detected.`);
      } else {
        $toast.success('Prescription analysis complete. No critical issues found.');
      }
    }
  } catch (err) {
    console.error('RxGPT analysis failed:', err);
    const errorMsg = err.response?.data?.message || 'Analysis failed. Please try again.';
    $toast.error(errorMsg);
  } finally {
    isLoading.value = false;
  }
}

// Watch for mode changes to reset state
watch(currentMode, () => {
  analysisResult.value = null;
  suggestionResult.value = null;
  selectedMedications.value = [];
});

// Watch for drug changes to clear old analysis
watch(() => props.proposedDrugs, () => {
  if (analysisResult.value) {
    analysisResult.value = null;
  }
}, { deep: true });

// Lifecycle
onMounted(() => {
  fetchCreditsAndSettings();
});
</script>

<style scoped lang="scss">
// Design Tokens
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
$red: #EF4444;
$red-light: #FEE2E2;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

.rxgpt-panel {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, $sky-light, lighten($sky-light, 3%));
  border-radius: 16px;
  border: 2px solid rgba($sky, 0.3);
  position: relative;
  overflow: hidden;

  &.has-alerts {
    border-color: rgba($amber, 0.4);
  }

  &.is-loading {
    pointer-events: none;
  }
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  &__left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    background: $sky-dark;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;

    &.idle { background: $sky-dark; }
    &.analyzing { background: $violet; }
    &.suggestion { background: $violet; }
    &.safe { background: $emerald; }
    &.warning { background: $amber; }
    &.critical { background: $red; }
  }

  &__content {
    h3 {
      font-size: 16px;
      font-weight: 700;
      color: $navy;
      margin: 0 0 4px 0;
    }

    p {
      font-size: 13px;
      color: $gray;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.credits-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba($sky-dark, 0.1);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: $sky-dark;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;

  &.low { background: $emerald-light; color: darken($emerald, 10%); }
  &.moderate { background: $amber-light; color: darken($amber, 10%); }
  &.high { background: lighten($red-light, 2%); color: $red; }
  &.critical { background: $red; color: white; }
  &.suggestion { background: $violet-light; color: $violet; }
}

// Mode Toggle
.mode-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: rgba(white, 0.6);
  padding: 4px;
  border-radius: 12px;

  button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    background: transparent;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: $gray;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba($sky-dark, 0.1);
      color: $sky-dark;
    }

    &.active {
      background: $sky-dark;
      color: white;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// Inactive State
.inactive-state, .ready-state {
  padding: 32px 20px;
  text-align: center;

  .inactive-icon, .ready-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: rgba($sky-dark, 0.1);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
  }

  .inactive-title, .ready-title {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px 0;
  }

  .inactive-text, .ready-text {
    font-size: 13px;
    color: $gray;
    margin: 0 0 16px 0;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.5;
  }
}

// Suggestion Form
.suggestion-form {
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.form-group {
  margin-bottom: 16px;

  &.half {
    flex: 1;
  }

  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: $slate;
    margin-bottom: 6px;
  }
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-input, .form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  color: $navy;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: $sky-dark;
  }

  &::placeholder {
    color: $gray;
  }
}

.form-select {
  cursor: pointer;
}

// Action Buttons
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &.primary {
    background: $sky-dark;
    color: white;

    &:hover:not(:disabled) {
      background: $sky-darker;
    }
  }

  &.secondary {
    background: white;
    color: $sky-dark;
    border: 1px solid $sky-dark;

    &:hover:not(:disabled) {
      background: $sky-light;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Suggestion Results
.suggestion-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.context-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: white;
  border-radius: 20px;
  font-size: 12px;
  color: $slate;

  &.warning {
    background: $amber-light;
    color: darken($amber, 10%);
  }
}

.clinical-summary-box {
  padding: 12px;
  background: rgba($sky-dark, 0.05);
  border-radius: 10px;
  border-left: 4px solid $sky-dark;

  p {
    font-size: 13px;
    color: $slate;
    margin: 0;
    line-height: 1.5;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: $navy;
  margin-bottom: 12px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-card {
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 2px solid #E2E8F0;
  transition: all 0.2s ease;

  &.in-inventory {
    border-color: rgba($emerald, 0.3);
  }

  &.out-of-stock {
    border-color: rgba($amber, 0.3);
    background: rgba($amber, 0.02);
  }

  &.selected {
    border-color: $sky-dark;
    background: rgba($sky, 0.05);
  }
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.suggestion-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  h4 {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
    margin: 0;
  }

  .generic-name {
    font-size: 13px;
    color: $gray;
  }
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;

  &.primary {
    background: $emerald-light;
    color: darken($emerald, 10%);
  }

  &.alternative {
    background: $amber-light;
    color: darken($amber, 10%);
  }

  &.supplementary {
    background: #E2E8F0;
    color: $gray;
  }
}

.inventory-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;

  &.available {
    background: $emerald-light;
    color: darken($emerald, 10%);
  }

  &.external {
    background: $violet-light;
    color: $violet;
  }
}

.suggestion-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  gap: 6px;
  font-size: 13px;

  .label {
    color: $gray;
  }

  .value {
    color: $navy;
    font-weight: 500;

    &.price {
      color: $emerald;
    }
  }
}

.suggestion-reasoning, .suggestion-instructions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  background: $bg;
  border-radius: 8px;
  font-size: 13px;
  color: $slate;
  line-height: 1.5;
  margin-bottom: 12px;
}

.confidence-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.confidence-bar {
  flex: 1;
  height: 6px;
  background: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: $sky-dark;
  border-radius: 3px;
}

.confidence-value {
  font-size: 12px;
  font-weight: 600;
  color: $slate;
  min-width: 36px;
}

.safety-warnings {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px;
  background: rgba($amber, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: darken($amber, 10%);
  margin-bottom: 12px;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
}

.add-btn, .remove-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn {
  background: $sky-dark;
  color: white;

  &:hover {
    background: $sky-darker;
  }
}

.remove-btn {
  background: $emerald;
  color: white;

  &:hover {
    background: darken($emerald, 5%);
  }
}

.results-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

// Analysis Results
.analysis-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.alerts-section {
  padding: 16px;
  border-radius: 12px;

  &.critical {
    background: rgba($red, 0.08);
    border: 1px solid rgba($red, 0.2);

    .section-title { color: $red; }
  }

  &.warning {
    background: rgba($amber, 0.08);
    border: 1px solid rgba($amber, 0.2);

    .section-title { color: darken($amber, 10%); }
  }
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card {
  padding: 14px;
  background: white;
  border-radius: 10px;
  border-left: 4px solid;

  &.critical { border-color: $red; }
  &.warning { border-color: $amber; }

  .alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .alert-type {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: $gray;
  }

  .alert-drug {
    font-size: 12px;
    font-weight: 600;
    color: $navy;
    background: $bg;
    padding: 2px 8px;
    border-radius: 6px;
  }

  .alert-message {
    font-size: 14px;
    font-weight: 500;
    color: $navy;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  .alert-reasoning {
    font-size: 13px;
    color: $slate;
    margin: 0 0 8px 0;
    padding: 8px;
    background: $bg;
    border-radius: 6px;
    line-height: 1.5;
  }

  .alert-action {
    font-size: 13px;
    color: $sky-dark;
    font-weight: 500;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.drug-analysis-section {
  .section-title { color: $sky-dark; }
}

.drug-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drug-card {
  padding: 14px;
  background: white;
  border-radius: 10px;
  border: 1px solid #E2E8F0;

  &.appropriate {
    border-left: 4px solid $emerald;
  }

  &.not-appropriate {
    border-left: 4px solid $amber;
  }

  .drug-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .drug-name {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
  }

  .drug-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;

    .appropriate & { color: $emerald; }
    .not-appropriate & { color: $amber; }
  }

  .drug-reasoning {
    font-size: 13px;
    color: $slate;
    margin: 0;
    line-height: 1.5;
  }
}

.clinical-summary {
  padding: 16px;
  background: rgba($sky-dark, 0.05);
  border-radius: 12px;
  border: 1px solid rgba($sky, 0.2);

  .section-title { color: $sky-dark; }

  p {
    font-size: 14px;
    color: $slate;
    margin: 0;
    line-height: 1.6;
  }
}

.disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: rgba($gray, 0.08);
  border-radius: 8px;
  color: $gray;

  p {
    font-size: 12px;
    margin: 0;
    line-height: 1.5;
  }
}

// Loading Overlay
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $violet;

  .spinner-ring {
    position: absolute;
    inset: 0;
    border: 3px solid rgba($violet, 0.2);
    border-top-color: $violet;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 15px;
  font-weight: 600;
  color: $navy;
  margin: 0 0 4px 0;
}

.loading-subtext {
  font-size: 13px;
  color: $gray;
  margin: 0;
}
</style>
