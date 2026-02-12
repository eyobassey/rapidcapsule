<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRxGPTStore } from '@/stores/rxgpt'

const store = useRxGPTStore()

const loading = ref(false)
const saving = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

// Form data
const formData = reactive({
  is_enabled: true,
  is_enabled_for_specialists: true,
  ai_model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  temperature: 0.3,

  credit_settings: {
    credits_per_analysis: 1,
    free_monthly_credits: 0,
    allow_specialist_purchase: true,
  },

  features: {
    allergy_checking: true,
    drug_interactions: true,
    dosage_validation: true,
    alternative_suggestions: true,
    clinical_reasoning: true,
    citations: true,
  },

  data_sources: {
    use_openfda: true,
    use_claude_ai: true,
    use_local_drug_db: true,
    use_pubmed: true,
    use_nice_guidelines: false,
    use_bnf: false,
    use_who_eml: false,
    use_hallucination_detection: true,
  },

  thresholds: {
    min_confidence_score: 70,
    interaction_severity_threshold: 'moderate',
    max_alternatives: 3,
  },

  display: {
    show_citations: true,
    show_confidence_scores: true,
    show_reasoning: true,
    auto_expand_alerts: true,
  },

  disclaimer_text: 'RxGPT is an AI-powered assistant. All recommendations should be reviewed and verified by a licensed healthcare professional.',
})

const aiModels = [
  { title: 'Claude Sonnet 4 (Recommended)', value: 'claude-sonnet-4-20250514' },
  { title: 'Claude Opus 4', value: 'claude-opus-4-20250514' },
  { title: 'Claude Haiku 3.5', value: 'claude-3-5-haiku-20241022' },
]

const severityOptions = [
  { title: 'Low (Show all interactions)', value: 'low' },
  { title: 'Moderate (Default)', value: 'moderate' },
  { title: 'High (Only severe)', value: 'high' },
]

// Methods
const fetchSettings = async () => {
  loading.value = true
  try {
    const settings = await store.fetchSettings()
    if (settings) {
      Object.assign(formData, {
        is_enabled: settings.is_enabled ?? true,
        is_enabled_for_specialists: settings.is_enabled_for_specialists ?? true,
        ai_model: settings.ai_model || 'claude-sonnet-4-20250514',
        max_tokens: settings.max_tokens || 4000,
        temperature: settings.temperature || 0.3,
        credit_settings: { ...formData.credit_settings, ...settings.credit_settings },
        features: { ...formData.features, ...settings.features },
        data_sources: { ...formData.data_sources, ...settings.data_sources },
        thresholds: { ...formData.thresholds, ...settings.thresholds },
        display: { ...formData.display, ...settings.display },
        disclaimer_text: settings.disclaimer_text || formData.disclaimer_text,
      })
    }
  } catch (error) {
    snackbar.value = { show: true, message: 'Failed to load settings', color: 'error' }
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    await store.updateSettings(formData)
    snackbar.value = { show: true, message: 'Settings saved successfully', color: 'success' }
  } catch (error) {
    snackbar.value = { show: true, message: error.message || 'Failed to save settings', color: 'error' }
  } finally {
    saving.value = false
  }
}

const resetToDefaults = () => {
  Object.assign(formData, {
    is_enabled: true,
    is_enabled_for_specialists: true,
    ai_model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0.3,
    credit_settings: {
      credits_per_analysis: 1,
      free_monthly_credits: 0,
      allow_specialist_purchase: true,
    },
    features: {
      allergy_checking: true,
      drug_interactions: true,
      dosage_validation: true,
      alternative_suggestions: true,
      clinical_reasoning: true,
      citations: true,
    },
    data_sources: {
      use_openfda: true,
      use_claude_ai: true,
      use_local_drug_db: true,
      use_pubmed: true,
      use_nice_guidelines: false,
      use_bnf: false,
      use_who_eml: false,
      use_hallucination_detection: true,
    },
    thresholds: {
      min_confidence_score: 70,
      interaction_severity_threshold: 'moderate',
      max_alternatives: 3,
    },
    display: {
      show_citations: true,
      show_confidence_scores: true,
      show_reasoning: true,
      auto_expand_alerts: true,
    },
    disclaimer_text: 'RxGPT is an AI-powered assistant. All recommendations should be reviewed and verified by a licensed healthcare professional.',
  })
  snackbar.value = { show: true, message: 'Settings reset to defaults', color: 'info' }
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div>
    <!-- Header -->
    <VCard class="mb-6" color="primary" variant="tonal">
      <VCardText class="d-flex align-center justify-space-between flex-wrap" style="gap: 16px">
        <div>
          <div class="d-flex align-center mb-2" style="gap: 8px">
            <VIcon size="32">mdi-cog</VIcon>
            <h2 class="text-h4 font-weight-bold">RxGPT Settings</h2>
          </div>
          <p class="text-subtitle-1 mb-0">Configure AI model, features, and credit settings</p>
        </div>
        <div class="d-flex align-center" style="gap: 12px">
          <VBtn color="secondary" variant="outlined" @click="resetToDefaults">
            <VIcon start>mdi-restore</VIcon>
            Reset Defaults
          </VBtn>
          <VBtn color="primary" :to="{ name: 'pharmacy-rxgpt' }">
            <VIcon start>mdi-chart-line</VIcon>
            Analytics
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <VRow>
      <!-- Left Column -->
      <VCol cols="12" md="6">
        <!-- Status Card -->
        <VCard class="mb-6">
          <VCardTitle>
            <VIcon start>mdi-power</VIcon>
            Service Status
          </VCardTitle>
          <VCardText>
            <div class="d-flex flex-column" style="gap: 16px">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Enable RxGPT</div>
                  <div class="text-caption text-medium-emphasis">Global on/off switch for the service</div>
                </div>
                <VSwitch v-model="formData.is_enabled" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Enable for Specialists</div>
                  <div class="text-caption text-medium-emphasis">Allow specialists to use RxGPT</div>
                </div>
                <VSwitch v-model="formData.is_enabled_for_specialists" color="success" hide-details :disabled="!formData.is_enabled" />
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- AI Model Card -->
        <VCard class="mb-6">
          <VCardTitle>
            <VIcon start>mdi-brain</VIcon>
            AI Model Configuration
          </VCardTitle>
          <VCardText>
            <VSelect
              v-model="formData.ai_model"
              :items="aiModels"
              label="AI Model"
              variant="outlined"
              class="mb-4"
            />
            <VSlider
              v-model="formData.temperature"
              label="Temperature"
              :min="0"
              :max="1"
              :step="0.1"
              thumb-label
              color="primary"
              class="mb-4"
            />
            <div class="text-caption text-medium-emphasis mb-4">
              Lower temperature = more deterministic, higher = more creative
            </div>
            <VTextField
              v-model.number="formData.max_tokens"
              label="Max Tokens"
              type="number"
              variant="outlined"
              :min="1000"
              :max="8000"
            />
          </VCardText>
        </VCard>

        <!-- Credit Settings Card -->
        <VCard class="mb-6">
          <VCardTitle>
            <VIcon start>mdi-lightning-bolt</VIcon>
            Credit Settings
          </VCardTitle>
          <VCardText>
            <VTextField
              v-model.number="formData.credit_settings.credits_per_analysis"
              label="Credits per Analysis"
              type="number"
              variant="outlined"
              :min="1"
              :max="10"
              class="mb-4"
              hint="How many credits consumed per RxGPT analysis"
              persistent-hint
            />
            <VTextField
              v-model.number="formData.credit_settings.free_monthly_credits"
              label="Free Monthly Credits"
              type="number"
              variant="outlined"
              :min="0"
              class="mb-4"
              hint="Free credits given to specialists each month"
              persistent-hint
            />
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="font-weight-medium">Allow Credit Purchase</div>
                <div class="text-caption text-medium-emphasis">Let specialists buy additional credits</div>
              </div>
              <VSwitch v-model="formData.credit_settings.allow_specialist_purchase" color="success" hide-details />
            </div>
          </VCardText>
        </VCard>

        <!-- Thresholds Card -->
        <VCard class="mb-6">
          <VCardTitle>
            <VIcon start>mdi-tune</VIcon>
            Thresholds
          </VCardTitle>
          <VCardText>
            <VSlider
              v-model="formData.thresholds.min_confidence_score"
              label="Min Confidence Score"
              :min="0"
              :max="100"
              thumb-label
              color="primary"
              class="mb-4"
            />
            <div class="text-caption text-medium-emphasis mb-4">
              Recommendations below this confidence will be hidden
            </div>
            <VSelect
              v-model="formData.thresholds.interaction_severity_threshold"
              :items="severityOptions"
              label="Interaction Severity Threshold"
              variant="outlined"
              class="mb-4"
            />
            <VTextField
              v-model.number="formData.thresholds.max_alternatives"
              label="Max Alternative Suggestions"
              type="number"
              variant="outlined"
              :min="1"
              :max="10"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Right Column -->
      <VCol cols="12" md="6">
        <!-- Features Card -->
        <VCard class="mb-6">
          <VCardTitle>
            <VIcon start>mdi-feature-search</VIcon>
            Features
          </VCardTitle>
          <VCardText>
            <div class="d-flex flex-column" style="gap: 12px">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Allergy Checking</div>
                  <div class="text-caption text-medium-emphasis">Check for drug allergies</div>
                </div>
                <VSwitch v-model="formData.features.allergy_checking" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Drug Interactions</div>
                  <div class="text-caption text-medium-emphasis">Check for drug-drug interactions</div>
                </div>
                <VSwitch v-model="formData.features.drug_interactions" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Dosage Validation</div>
                  <div class="text-caption text-medium-emphasis">Validate dosages based on patient info</div>
                </div>
                <VSwitch v-model="formData.features.dosage_validation" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Alternative Suggestions</div>
                  <div class="text-caption text-medium-emphasis">Suggest alternatives when issues found</div>
                </div>
                <VSwitch v-model="formData.features.alternative_suggestions" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Clinical Reasoning</div>
                  <div class="text-caption text-medium-emphasis">Provide reasoning for recommendations</div>
                </div>
                <VSwitch v-model="formData.features.clinical_reasoning" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Citations</div>
                  <div class="text-caption text-medium-emphasis">Include source citations</div>
                </div>
                <VSwitch v-model="formData.features.citations" color="success" hide-details />
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Data Sources Card -->
        <VCard class="mb-6">
          <VCardTitle>
            <VIcon start>mdi-database</VIcon>
            Data Sources
          </VCardTitle>
          <VCardText>
            <div class="d-flex flex-column" style="gap: 12px">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">OpenFDA</div>
                  <div class="text-caption text-medium-emphasis">Use FDA drug label data for US drug validation</div>
                </div>
                <VSwitch v-model="formData.data_sources.use_openfda" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">PubMed</div>
                  <div class="text-caption text-medium-emphasis">Enrich suggestions with clinical evidence citations</div>
                </div>
                <VSwitch v-model="formData.data_sources.use_pubmed" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">NICE Guidelines</div>
                  <div class="text-caption text-medium-emphasis">Validate against UK NICE clinical standards</div>
                </div>
                <VSwitch v-model="formData.data_sources.use_nice_guidelines" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">BNF (British National Formulary)</div>
                  <div class="text-caption text-medium-emphasis">Validate against UK prescribing guidelines</div>
                </div>
                <VSwitch v-model="formData.data_sources.use_bnf" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">WHO Essential Medicines</div>
                  <div class="text-caption text-medium-emphasis">Validate against WHO Essential Medicines List (667 medicines)</div>
                </div>
                <VSwitch v-model="formData.data_sources.use_who_eml" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Hallucination Detection</div>
                  <div class="text-caption text-medium-emphasis">Detect potential AI errors and invented information</div>
                </div>
                <VSwitch v-model="formData.data_sources.use_hallucination_detection" color="warning" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Claude AI</div>
                  <div class="text-caption text-medium-emphasis">Use AI for analysis (required)</div>
                </div>
                <VSwitch v-model="formData.data_sources.use_claude_ai" color="success" hide-details disabled />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Local Drug Database</div>
                  <div class="text-caption text-medium-emphasis">Use internal drug database</div>
                </div>
                <VSwitch v-model="formData.data_sources.use_local_drug_db" color="success" hide-details />
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Display Settings Card -->
        <VCard class="mb-6">
          <VCardTitle>
            <VIcon start>mdi-eye</VIcon>
            Display Settings
          </VCardTitle>
          <VCardText>
            <div class="d-flex flex-column" style="gap: 12px">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Show Citations</div>
                  <div class="text-caption text-medium-emphasis">Display source citations in UI</div>
                </div>
                <VSwitch v-model="formData.display.show_citations" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Show Confidence Scores</div>
                  <div class="text-caption text-medium-emphasis">Display AI confidence percentages</div>
                </div>
                <VSwitch v-model="formData.display.show_confidence_scores" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Show Reasoning</div>
                  <div class="text-caption text-medium-emphasis">Display clinical reasoning text</div>
                </div>
                <VSwitch v-model="formData.display.show_reasoning" color="success" hide-details />
              </div>
              <VDivider />
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">Auto-expand Alerts</div>
                  <div class="text-caption text-medium-emphasis">Automatically expand alert details</div>
                </div>
                <VSwitch v-model="formData.display.auto_expand_alerts" color="success" hide-details />
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Disclaimer Card -->
        <VCard class="mb-6">
          <VCardTitle>
            <VIcon start>mdi-alert-circle</VIcon>
            Disclaimer Text
          </VCardTitle>
          <VCardText>
            <VTextarea
              v-model="formData.disclaimer_text"
              label="Disclaimer"
              variant="outlined"
              rows="3"
              hint="This text is shown to specialists after each analysis"
              persistent-hint
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Save Button -->
    <div class="d-flex justify-end" style="gap: 12px">
      <VBtn color="primary" size="large" @click="saveSettings" :loading="saving">
        <VIcon start>mdi-content-save</VIcon>
        Save Settings
      </VBtn>
    </div>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>
