<template>
  <VDialog v-model="dialogOpen" max-width="900" persistent scrollable>
    <VCard>
      <VCardTitle class="d-flex align-center bg-primary">
        <VIcon class="mr-2" color="white">mdi-shield-alert</VIcon>
        <span class="text-white">Drug Safety Information</span>
        <VSpacer />
        <VBtn icon variant="text" color="white" @click="close">
          <VIcon>mdi-close</VIcon>
        </VBtn>
      </VCardTitle>

      <VCardText class="pt-4" style="max-height: 70vh;">
        <!-- Drug Info Header -->
        <VCard v-if="drug" variant="tonal" class="mb-4">
          <VCardText class="d-flex align-center">
            <VAvatar size="48" color="grey-lighten-2" class="mr-3">
              <VImg v-if="drugImage" :src="drugImage" />
              <VIcon v-else>mdi-pill</VIcon>
            </VAvatar>
            <div class="flex-grow-1">
              <div class="text-h6">{{ drug.name }}</div>
              <div class="text-body-2 text-medium-emphasis">
                {{ drug.generic_name }} {{ drug.strength }}
              </div>
            </div>
            <VChip v-if="safetyInfo?.sync_status" :color="getSyncStatusColor(safetyInfo.sync_status)" size="small">
              {{ safetyInfo.sync_status }}
            </VChip>
          </VCardText>
        </VCard>

        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-center py-8">
          <VProgressCircular indeterminate color="primary" />
        </div>

        <!-- No Safety Data -->
        <VAlert v-else-if="!safetyInfo && !loading" type="info" variant="tonal" class="mb-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="font-weight-medium">No safety information available</div>
              <div class="text-body-2">Click sync to fetch safety data from FDA for this drug.</div>
            </div>
            <VBtn color="primary" variant="elevated" :loading="syncing" @click="syncSafetyData">
              <VIcon start>mdi-sync</VIcon>
              Sync from FDA
            </VBtn>
          </div>
        </VAlert>

        <!-- Safety Data Content -->
        <template v-else-if="safetyInfo">
          <!-- Master Toggle & Sync Info -->
          <VCard variant="outlined" class="mb-4">
            <VCardText>
              <div class="d-flex align-center justify-space-between flex-wrap ga-3">
                <div class="d-flex align-center flex-wrap ga-4">
                  <VSwitch
                    v-model="localSettings.is_enabled"
                    color="primary"
                    hide-details
                    inset
                    :label="localSettings.is_enabled ? 'Safety info enabled' : 'Safety info disabled'"
                  />
                  <VDivider vertical class="mx-2" />
                  <div class="d-flex align-center ga-2">
                    <span class="text-body-2 text-medium-emphasis">Patient sees:</span>
                    <VBtnToggle
                      v-model="localSettings.patient_display_mode"
                      mandatory
                      density="compact"
                      color="primary"
                      variant="outlined"
                    >
                      <VBtn value="ai_only" size="small">
                        <VIcon start size="16">mdi-robot</VIcon>
                        AI Only
                      </VBtn>
                      <VBtn value="fda_only" size="small">
                        <VIcon start size="16">mdi-file-document</VIcon>
                        FDA Only
                      </VBtn>
                      <VBtn value="both" size="small">
                        <VIcon start size="16">mdi-view-split-vertical</VIcon>
                        Both
                      </VBtn>
                    </VBtnToggle>
                  </div>
                </div>
                <div class="d-flex align-center gap-2">
                  <div class="text-caption text-medium-emphasis text-right">
                    <div v-if="safetyInfo.last_synced_at">
                      Last synced: {{ formatDate(safetyInfo.last_synced_at) }}
                    </div>
                    <div v-if="safetyInfo.next_sync_due">
                      Next sync: {{ formatDate(safetyInfo.next_sync_due) }}
                    </div>
                  </div>
                  <VBtn color="primary" variant="outlined" size="small" :loading="syncing" @click="syncSafetyData">
                    <VIcon start size="16">mdi-sync</VIcon>
                    Sync
                  </VBtn>
                  <VBtn
                    color="deep-purple"
                    variant="elevated"
                    size="small"
                    :loading="generatingAI"
                    :disabled="!hasFDAData"
                    @click="generateAISummary"
                  >
                    <VIcon start size="16">mdi-robot</VIcon>
                    AI Summary
                  </VBtn>
                </div>
              </div>
            </VCardText>
          </VCard>

          <!-- AI Summary Section -->
          <VCard v-if="safetyInfo.has_ai_summary && safetyInfo.ai_summary" variant="outlined" class="mb-4 ai-summary-card">
            <VCardTitle class="d-flex align-center bg-deep-purple-lighten-5">
              <VIcon class="mr-2" color="deep-purple">mdi-robot</VIcon>
              <span class="text-deep-purple">AI-Generated Patient Summary</span>
              <VSpacer />
              <VChip size="x-small" color="deep-purple" variant="tonal">
                {{ formatAIDate(safetyInfo.ai_summary_generated_at) }}
              </VChip>
            </VCardTitle>
            <VCardText class="pt-4">
              <!-- Overview -->
              <div v-if="safetyInfo.ai_summary.overview" class="mb-4">
                <div class="text-subtitle-2 text-medium-emphasis mb-1">Overview</div>
                <div class="text-body-1">{{ safetyInfo.ai_summary.overview }}</div>
              </div>

              <VRow>
                <!-- Key Warnings -->
                <VCol cols="12" md="6">
                  <VCard variant="tonal" color="error" class="h-100">
                    <VCardTitle class="text-subtitle-2 pb-2">
                      <VIcon size="18" class="mr-1">mdi-alert</VIcon>
                      Key Warnings
                    </VCardTitle>
                    <VCardText class="pt-0">
                      <ul class="pl-4">
                        <li v-for="(warning, i) in safetyInfo.ai_summary.key_warnings" :key="i" class="text-body-2 mb-1">
                          {{ warning }}
                        </li>
                      </ul>
                    </VCardText>
                  </VCard>
                </VCol>

                <!-- Common Side Effects -->
                <VCol cols="12" md="6">
                  <VCard variant="tonal" color="warning" class="h-100">
                    <VCardTitle class="text-subtitle-2 pb-2">
                      <VIcon size="18" class="mr-1">mdi-medical-bag</VIcon>
                      Common Side Effects
                    </VCardTitle>
                    <VCardText class="pt-0">
                      <div class="d-flex flex-wrap gap-1">
                        <VChip
                          v-for="(effect, i) in safetyInfo.ai_summary.common_side_effects"
                          :key="i"
                          size="small"
                          variant="flat"
                          color="warning"
                        >
                          {{ effect }}
                        </VChip>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>

                <!-- Serious Side Effects -->
                <VCol cols="12" md="6">
                  <VCard variant="tonal" color="error" class="h-100">
                    <VCardTitle class="text-subtitle-2 pb-2">
                      <VIcon size="18" class="mr-1">mdi-alert-octagram</VIcon>
                      Serious Side Effects
                    </VCardTitle>
                    <VCardText class="pt-0">
                      <ul class="pl-4">
                        <li v-for="(effect, i) in safetyInfo.ai_summary.serious_side_effects" :key="i" class="text-body-2 text-error mb-1">
                          {{ effect }}
                        </li>
                      </ul>
                    </VCardText>
                  </VCard>
                </VCol>

                <!-- Who Should Avoid -->
                <VCol cols="12" md="6">
                  <VCard variant="tonal" color="grey" class="h-100">
                    <VCardTitle class="text-subtitle-2 pb-2">
                      <VIcon size="18" class="mr-1">mdi-cancel</VIcon>
                      Who Should Avoid
                    </VCardTitle>
                    <VCardText class="pt-0">
                      <ul class="pl-4">
                        <li v-for="(item, i) in safetyInfo.ai_summary.who_should_avoid" :key="i" class="text-body-2 mb-1">
                          {{ item }}
                        </li>
                      </ul>
                    </VCardText>
                  </VCard>
                </VCol>

                <!-- Drug Interactions -->
                <VCol cols="12" md="6">
                  <VCard variant="tonal" color="info" class="h-100">
                    <VCardTitle class="text-subtitle-2 pb-2">
                      <VIcon size="18" class="mr-1">mdi-pill-multiple</VIcon>
                      Drug Interactions
                    </VCardTitle>
                    <VCardText class="pt-0">
                      <ul class="pl-4">
                        <li v-for="(interaction, i) in safetyInfo.ai_summary.drug_interactions_summary" :key="i" class="text-body-2 mb-1">
                          {{ interaction }}
                        </li>
                      </ul>
                    </VCardText>
                  </VCard>
                </VCol>

                <!-- Food Interactions -->
                <VCol v-if="safetyInfo.ai_summary.food_interactions_summary?.length" cols="12" md="6">
                  <VCard variant="tonal" color="amber" class="h-100">
                    <VCardTitle class="text-subtitle-2 pb-2">
                      <VIcon size="18" class="mr-1">mdi-food-apple</VIcon>
                      Food & Beverage Interactions
                    </VCardTitle>
                    <VCardText class="pt-0">
                      <ul class="pl-4">
                        <li v-for="(food, i) in safetyInfo.ai_summary.food_interactions_summary" :key="i" class="text-body-2 mb-1">
                          {{ food }}
                        </li>
                      </ul>
                    </VCardText>
                  </VCard>
                </VCol>

                <!-- Pregnancy Summary -->
                <VCol cols="12" md="6">
                  <VCard variant="tonal" color="pink" class="h-100">
                    <VCardTitle class="text-subtitle-2 pb-2">
                      <VIcon size="18" class="mr-1">mdi-human-pregnant</VIcon>
                      Pregnancy & Breastfeeding
                    </VCardTitle>
                    <VCardText class="pt-0 text-body-2">
                      {{ safetyInfo.ai_summary.pregnancy_summary }}
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>

              <!-- Usage Tips -->
              <VCard v-if="safetyInfo.ai_summary.usage_tips?.length" variant="tonal" color="success" class="mt-4">
                <VCardTitle class="text-subtitle-2 pb-2">
                  <VIcon size="18" class="mr-1">mdi-lightbulb-on</VIcon>
                  Usage Tips
                </VCardTitle>
                <VCardText class="pt-0">
                  <ul class="pl-4">
                    <li v-for="(tip, i) in safetyInfo.ai_summary.usage_tips" :key="i" class="text-body-2 mb-1">
                      {{ tip }}
                    </li>
                  </ul>
                </VCardText>
              </VCard>

              <div class="text-caption text-medium-emphasis mt-3 d-flex align-center">
                <VIcon size="14" class="mr-1">mdi-information</VIcon>
                Generated by {{ safetyInfo.ai_model_used || 'Claude AI' }} for patient-friendly display.
                This is shown to patients by default. They can expand to see full FDA data.
              </div>
            </VCardText>
          </VCard>

          <VAlert v-else-if="hasFDAData && !safetyInfo.has_ai_summary" type="info" variant="tonal" class="mb-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="font-weight-medium">AI Summary Available</div>
                <div class="text-body-2">Generate a patient-friendly summary using Claude AI. This will be shown to patients by default.</div>
              </div>
              <VBtn color="deep-purple" variant="elevated" :loading="generatingAI" @click="generateAISummary">
                <VIcon start>mdi-robot</VIcon>
                Generate AI Summary
              </VBtn>
            </div>
          </VAlert>

          <!-- Display Settings -->
          <VExpansionPanels v-model="expandedPanels" multiple class="mb-4">
            <!-- Display Settings Panel -->
            <VExpansionPanel value="display">
              <VExpansionPanelTitle>
                <VIcon class="mr-2">mdi-eye-settings</VIcon>
                Display Settings
                <VSpacer />
                <VChip size="x-small" color="primary" variant="tonal" class="mr-2">
                  {{ enabledSectionsCount }}/6 sections visible
                </VChip>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VRow>
                  <VCol cols="12" md="6">
                    <VCheckbox
                      v-model="localSettings.display_settings.show_boxed_warning"
                      label="Show Boxed Warning (Black Box)"
                      color="error"
                      hide-details
                      density="compact"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <VCheckbox
                      v-model="localSettings.display_settings.show_warnings"
                      label="Show General Warnings"
                      color="warning"
                      hide-details
                      density="compact"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <VCheckbox
                      v-model="localSettings.display_settings.show_adverse_reactions"
                      label="Show Side Effects/Adverse Reactions"
                      color="info"
                      hide-details
                      density="compact"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <VCheckbox
                      v-model="localSettings.display_settings.show_contraindications"
                      label="Show Contraindications"
                      color="error"
                      hide-details
                      density="compact"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <VCheckbox
                      v-model="localSettings.display_settings.show_drug_interactions"
                      label="Show Drug Interactions"
                      color="warning"
                      hide-details
                      density="compact"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <VCheckbox
                      v-model="localSettings.display_settings.show_pregnancy_info"
                      label="Show Pregnancy & Breastfeeding Info"
                      color="info"
                      hide-details
                      density="compact"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <VCheckbox
                      v-model="localSettings.display_settings.show_custom_warnings"
                      label="Show Custom Warnings"
                      color="primary"
                      hide-details
                      density="compact"
                    />
                  </VCol>
                </VRow>
              </VExpansionPanelText>
            </VExpansionPanel>

            <!-- Boxed Warning (Black Box) -->
            <VExpansionPanel v-if="safetyInfo.boxed_warning" value="boxed">
              <VExpansionPanelTitle class="text-error">
                <VIcon class="mr-2" color="error">mdi-alert-octagram</VIcon>
                Boxed Warning (Black Box)
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VAlert type="error" variant="outlined" border="start" class="mt-2">
                  <div class="text-body-2" style="white-space: pre-wrap;">{{ safetyInfo.boxed_warning }}</div>
                </VAlert>
                <div class="text-caption text-medium-emphasis mt-2">
                  <VIcon size="12">mdi-information</VIcon>
                  Source: FDA Drug Label
                </div>
              </VExpansionPanelText>
            </VExpansionPanel>

            <!-- Warnings -->
            <VExpansionPanel v-if="safetyInfo.warnings?.length" value="warnings">
              <VExpansionPanelTitle class="text-warning">
                <VIcon class="mr-2" color="warning">mdi-alert</VIcon>
                Warnings
                <VChip size="x-small" class="ml-2">{{ safetyInfo.warnings.length }}</VChip>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VList density="compact">
                  <VListItem v-for="(warning, i) in safetyInfo.warnings" :key="i">
                    <template #prepend>
                      <VIcon size="small" color="warning">mdi-alert-circle</VIcon>
                    </template>
                    <VListItemTitle class="text-body-2">{{ warning }}</VListItemTitle>
                  </VListItem>
                </VList>
              </VExpansionPanelText>
            </VExpansionPanel>

            <!-- Adverse Reactions / Side Effects -->
            <VExpansionPanel v-if="safetyInfo.adverse_reactions?.length" value="adverse">
              <VExpansionPanelTitle>
                <VIcon class="mr-2" color="info">mdi-medical-bag</VIcon>
                Side Effects / Adverse Reactions
                <VChip size="x-small" class="ml-2">{{ safetyInfo.adverse_reactions.length }}</VChip>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <div class="d-flex flex-wrap gap-2">
                  <VChip
                    v-for="(reaction, i) in safetyInfo.adverse_reactions"
                    :key="i"
                    size="small"
                    variant="tonal"
                  >
                    {{ reaction }}
                  </VChip>
                </div>
              </VExpansionPanelText>
            </VExpansionPanel>

            <!-- Contraindications -->
            <VExpansionPanel v-if="safetyInfo.contraindications?.length" value="contraindications">
              <VExpansionPanelTitle class="text-error">
                <VIcon class="mr-2" color="error">mdi-cancel</VIcon>
                Contraindications
                <VChip size="x-small" class="ml-2">{{ safetyInfo.contraindications.length }}</VChip>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VList density="compact">
                  <VListItem v-for="(item, i) in safetyInfo.contraindications" :key="i">
                    <template #prepend>
                      <VIcon size="small" color="error">mdi-close-circle</VIcon>
                    </template>
                    <VListItemTitle class="text-body-2">{{ item }}</VListItemTitle>
                  </VListItem>
                </VList>
              </VExpansionPanelText>
            </VExpansionPanel>

            <!-- Drug Interactions -->
            <VExpansionPanel v-if="safetyInfo.drug_interactions?.length" value="interactions">
              <VExpansionPanelTitle class="text-warning">
                <VIcon class="mr-2" color="warning">mdi-pill-multiple</VIcon>
                Drug Interactions
                <VChip size="x-small" class="ml-2">{{ safetyInfo.drug_interactions.length }}</VChip>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VList density="compact">
                  <VListItem v-for="(interaction, i) in safetyInfo.drug_interactions" :key="i">
                    <template #prepend>
                      <VIcon size="small" color="warning">mdi-alert-circle</VIcon>
                    </template>
                    <VListItemTitle class="text-body-2">{{ interaction }}</VListItemTitle>
                  </VListItem>
                </VList>
              </VExpansionPanelText>
            </VExpansionPanel>

            <!-- Pregnancy & Breastfeeding -->
            <VExpansionPanel v-if="safetyInfo.pregnancy_or_breastfeeding" value="pregnancy">
              <VExpansionPanelTitle>
                <VIcon class="mr-2" color="info">mdi-human-pregnant</VIcon>
                Pregnancy & Breastfeeding
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VAlert type="info" variant="tonal" class="mt-2">
                  <div class="text-body-2" style="white-space: pre-wrap;">{{ safetyInfo.pregnancy_or_breastfeeding }}</div>
                </VAlert>
              </VExpansionPanelText>
            </VExpansionPanel>

            <!-- Custom Warnings -->
            <VExpansionPanel value="custom">
              <VExpansionPanelTitle>
                <VIcon class="mr-2" color="primary">mdi-pencil-plus</VIcon>
                Custom Warnings
                <VChip size="x-small" class="ml-2">{{ localSettings.custom_warnings?.length || 0 }}</VChip>
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <!-- Existing Custom Warnings -->
                <VList v-if="localSettings.custom_warnings?.length" density="compact" class="mb-4">
                  <VListItem
                    v-for="(warning, i) in localSettings.custom_warnings"
                    :key="i"
                    :class="`bg-${getSeverityColor(warning.severity)}-lighten-5`"
                  >
                    <template #prepend>
                      <VIcon :color="getSeverityColor(warning.severity)" size="small">
                        {{ getSeverityIcon(warning.severity) }}
                      </VIcon>
                    </template>
                    <VListItemTitle class="font-weight-medium">{{ warning.title }}</VListItemTitle>
                    <VListItemSubtitle>{{ warning.content }}</VListItemSubtitle>
                    <template #append>
                      <VBtn icon variant="text" size="small" color="error" @click="removeCustomWarning(i)">
                        <VIcon size="18">mdi-delete</VIcon>
                      </VBtn>
                    </template>
                  </VListItem>
                </VList>

                <VAlert v-else type="info" variant="tonal" density="compact" class="mb-4">
                  No custom warnings added yet.
                </VAlert>

                <!-- Add New Custom Warning -->
                <VCard variant="outlined">
                  <VCardTitle class="text-body-1">
                    <VIcon start size="18">mdi-plus</VIcon>
                    Add Custom Warning
                  </VCardTitle>
                  <VCardText>
                    <VRow dense>
                      <VCol cols="12" md="8">
                        <VTextField
                          v-model="newWarning.title"
                          label="Warning Title"
                          placeholder="e.g., Storage Warning"
                          density="compact"
                          hide-details
                        />
                      </VCol>
                      <VCol cols="12" md="4">
                        <VSelect
                          v-model="newWarning.severity"
                          :items="severityOptions"
                          label="Severity"
                          density="compact"
                          hide-details
                        />
                      </VCol>
                      <VCol cols="12">
                        <VTextarea
                          v-model="newWarning.content"
                          label="Warning Content"
                          placeholder="Enter the warning message..."
                          rows="2"
                          density="compact"
                          hide-details
                        />
                      </VCol>
                      <VCol cols="12">
                        <VBtn
                          color="primary"
                          variant="tonal"
                          size="small"
                          :disabled="!newWarning.title || !newWarning.content"
                          @click="addCustomWarning"
                        >
                          <VIcon start size="16">mdi-plus</VIcon>
                          Add Warning
                        </VBtn>
                      </VCol>
                    </VRow>
                  </VCardText>
                </VCard>
              </VExpansionPanelText>
            </VExpansionPanel>

            <!-- Admin Notes -->
            <VExpansionPanel value="notes">
              <VExpansionPanelTitle>
                <VIcon class="mr-2">mdi-note-text</VIcon>
                Admin Notes
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <VTextarea
                  v-model="localSettings.admin_notes"
                  label="Internal Notes"
                  placeholder="Add notes for internal reference (not shown to patients)..."
                  rows="3"
                  density="compact"
                  hint="These notes are for admin use only and will not be displayed to patients."
                  persistent-hint
                />
              </VExpansionPanelText>
            </VExpansionPanel>
          </VExpansionPanels>
        </template>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VBtn variant="text" @click="close">Cancel</VBtn>
        <VSpacer />
        <VBtn
          v-if="safetyInfo"
          color="primary"
          :loading="saving"
          :disabled="!hasChanges"
          @click="saveSettings"
        >
          <VIcon start>mdi-content-save</VIcon>
          Save Changes
        </VBtn>
      </VCardActions>
    </VCard>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </VDialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  drug: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'updated'])

const dialogOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// State
const loading = ref(false)
const saving = ref(false)
const syncing = ref(false)
const generatingAI = ref(false)
const safetyInfo = ref(null)
const originalSettings = ref(null)
const expandedPanels = ref(['display'])

const localSettings = reactive({
  is_enabled: true,
  patient_display_mode: 'both', // 'ai_only', 'fda_only', 'both'
  display_settings: {
    show_adverse_reactions: true,
    show_warnings: true,
    show_boxed_warning: true,
    show_contraindications: true,
    show_drug_interactions: true,
    show_pregnancy_info: true,
    show_custom_warnings: true,
  },
  custom_warnings: [],
  admin_notes: '',
})

const newWarning = reactive({
  title: '',
  content: '',
  severity: 'info',
})

const severityOptions = [
  { title: 'Info', value: 'info' },
  { title: 'Warning', value: 'warning' },
  { title: 'Danger', value: 'danger' },
]

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const API_BASE = '/admin-api/pharmacy/drugs'

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.access_token}`,
  }
}

// Computed
const drugImage = computed(() => {
  if (!props.drug?.images?.length) return null
  const primary = props.drug.images.find(img => img.is_primary)
  return primary?.url || props.drug.images[0]?.url
})

const enabledSectionsCount = computed(() => {
  const ds = localSettings.display_settings
  let count = 0
  if (ds.show_boxed_warning) count++
  if (ds.show_warnings) count++
  if (ds.show_adverse_reactions) count++
  if (ds.show_contraindications) count++
  if (ds.show_drug_interactions) count++
  if (ds.show_pregnancy_info) count++
  return count
})

const hasChanges = computed(() => {
  if (!originalSettings.value) return false
  return JSON.stringify(localSettings) !== JSON.stringify(originalSettings.value)
})

const hasFDAData = computed(() => {
  if (!safetyInfo.value) return false
  return (
    safetyInfo.value.adverse_reactions?.length > 0 ||
    safetyInfo.value.warnings?.length > 0 ||
    safetyInfo.value.boxed_warning?.length > 0 ||
    safetyInfo.value.contraindications?.length > 0 ||
    safetyInfo.value.drug_interactions?.length > 0
  )
})

// Methods
const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatAIDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getSyncStatusColor = (status) => {
  switch (status) {
    case 'synced': return 'success'
    case 'pending': return 'warning'
    case 'failed': return 'error'
    case 'no_data': return 'grey'
    default: return 'grey'
  }
}

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'danger': return 'error'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return 'grey'
  }
}

const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'danger': return 'mdi-alert-octagram'
    case 'warning': return 'mdi-alert'
    case 'info': return 'mdi-information'
    default: return 'mdi-information'
  }
}

const fetchSafetyInfo = async () => {
  if (!props.drug?._id) return

  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/${props.drug._id}/safety/admin`, {
      headers: getAuthHeaders(),
    })

    if (response.ok) {
      const result = await response.json()
      safetyInfo.value = result.data || result.result

      // Populate local settings
      if (safetyInfo.value) {
        localSettings.is_enabled = safetyInfo.value.is_enabled !== false
        localSettings.patient_display_mode = safetyInfo.value.patient_display_mode || 'both'
        localSettings.admin_notes = safetyInfo.value.admin_notes || ''
        localSettings.custom_warnings = safetyInfo.value.custom_warnings || []

        if (safetyInfo.value.display_settings) {
          Object.assign(localSettings.display_settings, safetyInfo.value.display_settings)
        }

        // Store original for change detection
        originalSettings.value = JSON.parse(JSON.stringify(localSettings))
      }
    } else if (response.status === 404) {
      // No safety info yet
      safetyInfo.value = null
    } else {
      const result = await response.json()
      showSnackbar(result.message || 'Failed to fetch safety info', 'error')
    }
  } catch (error) {
    console.error('Error fetching safety info:', error)
    showSnackbar('Error fetching safety information', 'error')
  } finally {
    loading.value = false
  }
}

const syncSafetyData = async () => {
  if (!props.drug?._id) return

  syncing.value = true
  try {
    const response = await fetch(`${API_BASE}/${props.drug._id}/safety/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    const result = await response.json()
    if (response.ok) {
      showSnackbar('Safety information synced successfully')
      await fetchSafetyInfo()
    } else {
      showSnackbar(result.message || 'Failed to sync safety data', 'error')
    }
  } catch (error) {
    console.error('Error syncing safety data:', error)
    showSnackbar('Error syncing safety information', 'error')
  } finally {
    syncing.value = false
  }
}

const generateAISummary = async () => {
  if (!props.drug?._id) return

  generatingAI.value = true
  try {
    const response = await fetch(`${API_BASE}/${props.drug._id}/safety/ai-summary`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    const result = await response.json()
    if (response.ok) {
      showSnackbar('AI summary generated successfully! Patients will now see this by default.')
      await fetchSafetyInfo()
    } else {
      showSnackbar(result.message || 'Failed to generate AI summary', 'error')
    }
  } catch (error) {
    console.error('Error generating AI summary:', error)
    showSnackbar('Error generating AI summary', 'error')
  } finally {
    generatingAI.value = false
  }
}

const saveSettings = async () => {
  if (!props.drug?._id) return

  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/${props.drug._id}/safety`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        is_enabled: localSettings.is_enabled,
        patient_display_mode: localSettings.patient_display_mode,
        display_settings: localSettings.display_settings,
        custom_warnings: localSettings.custom_warnings,
        admin_notes: localSettings.admin_notes,
      }),
    })

    const result = await response.json()
    if (response.ok) {
      showSnackbar('Safety settings saved successfully')
      originalSettings.value = JSON.parse(JSON.stringify(localSettings))
      emit('updated')
    } else {
      showSnackbar(result.message || 'Failed to save settings', 'error')
    }
  } catch (error) {
    console.error('Error saving settings:', error)
    showSnackbar('Error saving settings', 'error')
  } finally {
    saving.value = false
  }
}

const addCustomWarning = () => {
  if (!newWarning.title || !newWarning.content) return

  localSettings.custom_warnings.push({
    title: newWarning.title,
    content: newWarning.content,
    severity: newWarning.severity,
  })

  // Reset form
  newWarning.title = ''
  newWarning.content = ''
  newWarning.severity = 'info'
}

const removeCustomWarning = (index) => {
  localSettings.custom_warnings.splice(index, 1)
}

const close = () => {
  dialogOpen.value = false
  safetyInfo.value = null
  originalSettings.value = null
  expandedPanels.value = ['display']
}

// Watch for dialog open
watch(dialogOpen, (isOpen) => {
  if (isOpen && props.drug) {
    fetchSafetyInfo()
  }
})

// Watch for drug change while dialog is open
watch(() => props.drug, (newDrug) => {
  if (dialogOpen.value && newDrug) {
    fetchSafetyInfo()
  }
})
</script>

<style scoped>
.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding-top: 8px;
}
</style>
