<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <div class="d-flex align-center gap-2 mb-2">
          <VBtn icon variant="text" @click="$router.push('/pharmacy')">
            <VIcon>mdi-arrow-left</VIcon>
          </VBtn>
          <h1 class="text-h4 font-weight-bold">Pharmacy Settings</h1>
        </div>
        <p class="text-subtitle-1 text-medium-emphasis">Manage pharmacy module configurations</p>
      </div>
    </div>

    <!-- Drug Interaction Checker Settings -->
    <VRow>
      <VCol cols="12" lg="8">
        <VCard>
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon color="warning">mdi-alert-circle</VIcon>
            Drug Interaction Checker
          </VCardTitle>
          <VCardSubtitle>
            Configure drug interaction checking with multiple data sources
          </VCardSubtitle>

          <VCardText>
            <VRow>
              <VCol cols="12">
                <VAlert type="info" variant="tonal" class="mb-4">
                  <div class="d-flex align-center gap-2">
                    <VIcon>mdi-information</VIcon>
                    <div>
                      Drug interaction data can be sourced from multiple providers including AI analysis
                      and FDA databases. Select your preferred data sources below.
                    </div>
                  </div>
                </VAlert>
              </VCol>

              <!-- Enable for Patients -->
              <VCol cols="12" md="6">
                <VCard variant="outlined" class="pa-4">
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="d-flex align-center gap-2 mb-1">
                        <VIcon color="primary" size="20">mdi-account</VIcon>
                        <span class="font-weight-medium">Enable for Patients</span>
                      </div>
                      <p class="text-body-2 text-medium-emphasis mb-0">
                        Show drug interaction alerts to patients when adding items to their cart
                      </p>
                    </div>
                    <VSwitch
                      v-model="settings.enabled_for_patients"
                      color="primary"
                      hide-details
                      @change="handleSettingChange"
                    />
                  </div>
                </VCard>
              </VCol>

              <!-- Enable for Specialists -->
              <VCol cols="12" md="6">
                <VCard variant="outlined" class="pa-4">
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="d-flex align-center gap-2 mb-1">
                        <VIcon color="secondary" size="20">mdi-doctor</VIcon>
                        <span class="font-weight-medium">Enable for Specialists</span>
                      </div>
                      <p class="text-body-2 text-medium-emphasis mb-0">
                        Show drug interaction alerts to specialists when creating prescriptions
                      </p>
                    </div>
                    <VSwitch
                      v-model="settings.enabled_for_specialists"
                      color="secondary"
                      hide-details
                      @change="handleSettingChange"
                    />
                  </div>
                </VCard>
              </VCol>

              <!-- Show Severity Levels -->
              <VCol cols="12" md="6">
                <VCard variant="outlined" class="pa-4">
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="d-flex align-center gap-2 mb-1">
                        <VIcon color="warning" size="20">mdi-alert-outline</VIcon>
                        <span class="font-weight-medium">Show Severity Levels</span>
                      </div>
                      <p class="text-body-2 text-medium-emphasis mb-0">
                        Display severity indicators (high, moderate, low) with interactions
                      </p>
                    </div>
                    <VSwitch
                      v-model="settings.show_severity_levels"
                      color="warning"
                      hide-details
                      @change="handleSettingChange"
                    />
                  </div>
                </VCard>
              </VCol>

              <!-- Severity Preview -->
              <VCol cols="12" md="6">
                <VCard variant="outlined" class="pa-4">
                  <div class="mb-2">
                    <span class="font-weight-medium">Severity Level Preview</span>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <VChip color="error" size="small" variant="flat">
                      <VIcon start size="14">mdi-alert-circle</VIcon>
                      High
                    </VChip>
                    <VChip color="warning" size="small" variant="flat">
                      <VIcon start size="14">mdi-alert</VIcon>
                      Moderate
                    </VChip>
                    <VChip color="info" size="small" variant="flat">
                      <VIcon start size="14">mdi-information</VIcon>
                      Low
                    </VChip>
                  </div>
                </VCard>
              </VCol>

              <!-- Disclaimer Text -->
              <VCol cols="12">
                <VCard variant="outlined" class="pa-4">
                  <div class="d-flex align-center gap-2 mb-3">
                    <VIcon color="info" size="20">mdi-text-box-outline</VIcon>
                    <span class="font-weight-medium">Disclaimer Text</span>
                  </div>
                  <VTextarea
                    v-model="settings.disclaimer_text"
                    label="Disclaimer shown with interaction results"
                    rows="3"
                    variant="outlined"
                    counter
                    maxlength="500"
                    @blur="handleSettingChange"
                  />
                  <p class="text-caption text-medium-emphasis mt-1">
                    This text appears alongside drug interaction results to remind users to consult healthcare professionals.
                  </p>
                </VCard>
              </VCol>

              <!-- Data Sources Selection -->
              <VCol cols="12">
                <VCard variant="outlined" class="pa-4">
                  <div class="d-flex align-center gap-2 mb-3">
                    <VIcon color="primary" size="20">mdi-database</VIcon>
                    <span class="font-weight-medium">Data Sources</span>
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-3">
                    Select which data sources to use for drug interaction checking. Sources are checked in order of priority.
                  </p>

                  <div class="data-sources-grid">
                    <!-- Claude AI -->
                    <VCard
                      variant="outlined"
                      class="pa-3 data-source-card"
                      :class="{ 'data-source-active': settings.data_sources?.includes('claude_ai') }"
                    >
                      <div class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center gap-3">
                          <VAvatar color="purple" size="40">
                            <VIcon color="white">mdi-robot</VIcon>
                          </VAvatar>
                          <div>
                            <div class="font-weight-medium">Claude AI</div>
                            <p class="text-caption text-medium-emphasis mb-0">
                              AI-powered drug interaction analysis
                            </p>
                          </div>
                        </div>
                        <VCheckbox
                          :model-value="settings.data_sources?.includes('claude_ai')"
                          color="purple"
                          hide-details
                          @update:model-value="toggleDataSource('claude_ai', $event)"
                        />
                      </div>
                      <VChip size="x-small" color="success" variant="tonal" class="mt-2">
                        Recommended
                      </VChip>
                    </VCard>

                    <!-- OpenFDA -->
                    <VCard
                      variant="outlined"
                      class="pa-3 data-source-card"
                      :class="{ 'data-source-active': settings.data_sources?.includes('openfda') }"
                    >
                      <div class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center gap-3">
                          <VAvatar color="blue" size="40">
                            <VIcon color="white">mdi-pill</VIcon>
                          </VAvatar>
                          <div>
                            <div class="font-weight-medium">OpenFDA</div>
                            <p class="text-caption text-medium-emphasis mb-0">
                              FDA drug label interaction data
                            </p>
                          </div>
                        </div>
                        <VCheckbox
                          :model-value="settings.data_sources?.includes('openfda')"
                          color="blue"
                          hide-details
                          @update:model-value="toggleDataSource('openfda', $event)"
                        />
                      </div>
                      <VChip size="x-small" color="info" variant="tonal" class="mt-2">
                        Official FDA Data
                      </VChip>
                    </VCard>

                    <!-- RxNav (DrugBank + ONCHigh) -->
                    <VCard
                      variant="outlined"
                      class="pa-3 data-source-card"
                      :class="{ 'data-source-active': settings.data_sources?.includes('rxnav') }"
                    >
                      <div class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center gap-3">
                          <VAvatar color="teal" size="40">
                            <VIcon color="white">mdi-hospital-box</VIcon>
                          </VAvatar>
                          <div>
                            <div class="font-weight-medium">RxNav API</div>
                            <p class="text-caption text-medium-emphasis mb-0">
                              DrugBank + ONCHigh via NIH/NLM
                            </p>
                          </div>
                        </div>
                        <VCheckbox
                          :model-value="settings.data_sources?.includes('rxnav')"
                          color="teal"
                          hide-details
                          @update:model-value="toggleDataSource('rxnav', $event)"
                        />
                      </div>
                      <VChip size="x-small" color="warning" variant="tonal" class="mt-2">
                        Requires API Access
                      </VChip>
                    </VCard>
                  </div>

                  <VAlert v-if="!settings.data_sources?.length" type="warning" variant="tonal" class="mt-3">
                    Please select at least one data source for drug interaction checking.
                  </VAlert>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>

          <VDivider />

          <VCardActions class="pa-4">
            <VSpacer />
            <VBtn
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
      </VCol>

      <!-- Sidebar Info -->
      <VCol cols="12" lg="4">
        <!-- API Status Card -->
        <VCard class="mb-4">
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon color="success">mdi-api</VIcon>
            API Status
          </VCardTitle>
          <VCardText>
            <div class="d-flex align-center gap-2 mb-3">
              <VChip color="success" size="small" variant="flat">
                <VIcon start size="14">mdi-check-circle</VIcon>
                Connected
              </VChip>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-2">
              <strong>Provider:</strong> NIH RxNav API
            </p>
            <p class="text-body-2 text-medium-emphasis mb-2">
              <strong>Endpoint:</strong> rxnav.nlm.nih.gov
            </p>
            <p class="text-body-2 text-medium-emphasis mb-0">
              <strong>Cache TTL:</strong> 1 hour
            </p>
          </VCardText>
        </VCard>

        <!-- How It Works Card -->
        <VCard class="mb-4">
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon color="info">mdi-help-circle</VIcon>
            How It Works
          </VCardTitle>
          <VCardText>
            <VTimeline density="compact" side="end">
              <VTimelineItem dot-color="primary" size="small">
                <div class="text-body-2">
                  <strong>1. Drug Lookup</strong>
                  <p class="text-medium-emphasis mb-0">Drug names are matched to RxCUI identifiers</p>
                </div>
              </VTimelineItem>
              <VTimelineItem dot-color="secondary" size="small">
                <div class="text-body-2">
                  <strong>2. Interaction Check</strong>
                  <p class="text-medium-emphasis mb-0">RxNav API checks for known interactions</p>
                </div>
              </VTimelineItem>
              <VTimelineItem dot-color="warning" size="small">
                <div class="text-body-2">
                  <strong>3. Results Displayed</strong>
                  <p class="text-medium-emphasis mb-0">Interactions shown with severity and description</p>
                </div>
              </VTimelineItem>
            </VTimeline>
          </VCardText>
        </VCard>

        <!-- Active Data Sources Card -->
        <VCard>
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon color="primary">mdi-database</VIcon>
            Active Sources
          </VCardTitle>
          <VCardText>
            <p class="text-body-2 mb-2">
              Currently enabled data sources:
            </p>
            <VList density="compact" class="bg-transparent">
              <VListItem v-if="settings.data_sources?.includes('claude_ai')">
                <template #prepend>
                  <VIcon color="purple" size="small">mdi-robot</VIcon>
                </template>
                <VListItemTitle class="text-body-2">Claude AI</VListItemTitle>
              </VListItem>
              <VListItem v-if="settings.data_sources?.includes('openfda')">
                <template #prepend>
                  <VIcon color="blue" size="small">mdi-pill</VIcon>
                </template>
                <VListItemTitle class="text-body-2">OpenFDA</VListItemTitle>
              </VListItem>
              <VListItem v-if="settings.data_sources?.includes('rxnav')">
                <template #prepend>
                  <VIcon color="teal" size="small">mdi-hospital-box</VIcon>
                </template>
                <VListItemTitle class="text-body-2">RxNav (DrugBank + ONCHigh)</VListItemTitle>
              </VListItem>
              <VListItem v-if="!settings.data_sources?.length">
                <template #prepend>
                  <VIcon color="warning" size="small">mdi-alert</VIcon>
                </template>
                <VListItemTitle class="text-body-2 text-warning">No sources enabled</VListItemTitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Snackbar for notifications -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <VBtn variant="text" @click="snackbar.show = false">Close</VBtn>
      </template>
    </VSnackbar>

    <!-- Loading Overlay -->
    <VOverlay v-model="loading" class="align-center justify-center" persistent>
      <VProgressCircular indeterminate size="64" color="primary" />
    </VOverlay>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const loading = ref(false)
const saving = ref(false)
const originalSettings = ref(null)

const settings = reactive({
  enabled_for_patients: true,
  enabled_for_specialists: true,
  show_severity_levels: true,
  disclaimer_text: 'This information is for reference only. Always consult your pharmacist or doctor before taking multiple medications together.',
  data_sources: ['claude_ai', 'openfda'],
})

const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
})

const hasChanges = computed(() => {
  if (!originalSettings.value) return false
  return JSON.stringify(settings) !== JSON.stringify(originalSettings.value)
})

const showSnackbar = (message, color = 'success') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

const fetchSettings = async () => {
  loading.value = true
  try {
    const result = await settingsStore.fetchDrugInteractionSettings()
    if (result) {
      Object.assign(settings, result)
      originalSettings.value = { ...result }
    }
  } catch (error) {
    showSnackbar('Failed to load settings', 'error')
  } finally {
    loading.value = false
  }
}

const handleSettingChange = () => {
  // Auto-save is optional, this just triggers reactive update
  // Could implement debounced auto-save here if desired
}

const toggleDataSource = (source, enabled) => {
  if (!settings.data_sources) {
    settings.data_sources = []
  }

  if (enabled) {
    if (!settings.data_sources.includes(source)) {
      settings.data_sources.push(source)
    }
  } else {
    settings.data_sources = settings.data_sources.filter(s => s !== source)
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const success = await settingsStore.updateDrugInteractionSettings({
      enabled_for_patients: settings.enabled_for_patients,
      enabled_for_specialists: settings.enabled_for_specialists,
      show_severity_levels: settings.show_severity_levels,
      disclaimer_text: settings.disclaimer_text,
      data_sources: settings.data_sources,
    })

    if (success) {
      originalSettings.value = { ...settings }
      showSnackbar('Settings saved successfully', 'success')
    } else {
      showSnackbar('Failed to save settings', 'error')
    }
  } catch (error) {
    showSnackbar('Failed to save settings', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.data-sources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.data-source-card {
  transition: all 0.2s ease;
}

.data-source-card:hover {
  border-color: rgb(var(--v-theme-primary));
}

.data-source-active {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}
</style>
