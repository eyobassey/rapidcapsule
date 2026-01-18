<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAdvancedHealthScoreStore } from '@/stores/advancedHealthScore'

const store = useAdvancedHealthScoreStore()

const loading = ref(false)
const saving = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

// Form data
const formData = ref({
  credit_cost: 3,
  is_enabled: true,
  max_documents: 5,
  max_file_size_mb: 10,
  allowed_file_types: ['application/pdf', 'image/jpeg', 'image/png'],
  // Health Checkup Inclusion Settings
  checkup_auto_include_days: 14,
  checkup_auto_exclude_days: 30,
  allow_patient_checkup_exclusion: true,
  exclude_self_care_triage: true,
  // Credit Sharing Settings
  credit_sharing_enabled: true,
  credit_sharing_min_amount: 1,
  credit_sharing_max_amount: 50,
})

// File type options
const fileTypeOptions = [
  { title: 'PDF', value: 'application/pdf' },
  { title: 'JPEG Image', value: 'image/jpeg' },
  { title: 'PNG Image', value: 'image/png' },
  { title: 'GIF Image', value: 'image/gif' },
  { title: 'Word Document', value: 'application/msword' },
  { title: 'Word (docx)', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
]

// Fetch settings
const fetchSettings = async () => {
  loading.value = true
  try {
    await store.fetchSettings()
    if (store.settings) {
      formData.value = {
        credit_cost: store.settings.credit_cost || 3,
        is_enabled: store.settings.is_enabled ?? true,
        max_documents: store.settings.max_documents || 5,
        max_file_size_mb: store.settings.max_file_size_mb || 10,
        allowed_file_types: store.settings.allowed_file_types || ['application/pdf', 'image/jpeg', 'image/png'],
        // Health Checkup Inclusion Settings
        checkup_auto_include_days: store.settings.checkup_auto_include_days || 14,
        checkup_auto_exclude_days: store.settings.checkup_auto_exclude_days || 30,
        allow_patient_checkup_exclusion: store.settings.allow_patient_checkup_exclusion ?? true,
        exclude_self_care_triage: store.settings.exclude_self_care_triage ?? true,
        // Credit Sharing Settings
        credit_sharing_enabled: store.settings.credit_sharing_enabled ?? true,
        credit_sharing_min_amount: store.settings.credit_sharing_min_amount || 1,
        credit_sharing_max_amount: store.settings.credit_sharing_max_amount || 50,
      }
    }
  } catch (error) {
    snackbar.value = { show: true, message: 'Failed to load settings', color: 'error' }
  } finally {
    loading.value = false
  }
}

// Save settings
const saveSettings = async () => {
  saving.value = true
  try {
    const adminId = localStorage.getItem('adminId') || 'admin'
    await store.updateSettings(formData.value, adminId)
    snackbar.value = { show: true, message: 'Settings saved successfully', color: 'success' }
  } catch (error) {
    snackbar.value = { show: true, message: error.message || 'Failed to save settings', color: 'error' }
  } finally {
    saving.value = false
  }
}

// Reset to defaults (fetched from backend)
const resettingDefaults = ref(false)
const resetToDefaults = async () => {
  resettingDefaults.value = true
  try {
    const defaults = await store.fetchDefaultSettings()
    if (defaults) {
      formData.value = {
        credit_cost: defaults.credit_cost,
        is_enabled: defaults.is_enabled,
        max_documents: defaults.max_documents,
        max_file_size_mb: defaults.max_file_size_mb,
        allowed_file_types: defaults.allowed_file_types,
        checkup_auto_include_days: defaults.checkup_auto_include_days,
        checkup_auto_exclude_days: defaults.checkup_auto_exclude_days,
        allow_patient_checkup_exclusion: defaults.allow_patient_checkup_exclusion,
        exclude_self_care_triage: defaults.exclude_self_care_triage,
        credit_sharing_enabled: defaults.credit_sharing_enabled,
        credit_sharing_min_amount: defaults.credit_sharing_min_amount,
        credit_sharing_max_amount: defaults.credit_sharing_max_amount,
      }
      snackbar.value = { show: true, message: 'Reset to default values', color: 'info' }
    }
  } catch (error) {
    snackbar.value = { show: true, message: 'Failed to fetch default settings', color: 'error' }
  } finally {
    resettingDefaults.value = false
  }
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
          <h2 class="text-h4 font-weight-bold mb-2">Settings</h2>
          <p class="text-subtitle-1 mb-0">Configure Advanced Health Score feature settings</p>
        </div>
        <div>
          <VBtn color="secondary" variant="outlined" :to="{ name: 'advanced-health-score' }">
            <VIcon start>mdi-arrow-left</VIcon>
            Back to Dashboard
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Settings Form -->
    <VCard :loading="loading">
      <VCardTitle>Feature Settings</VCardTitle>
      <VCardText>
        <VForm @submit.prevent="saveSettings">
          <VRow>
            <!-- Feature Toggle -->
            <VCol cols="12" md="6">
              <VCard variant="outlined" class="pa-4">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <h4 class="text-subtitle-1 font-weight-bold">Feature Status</h4>
                    <p class="text-caption text-medium-emphasis mb-0">
                      Enable or disable the Advanced Health Score feature
                    </p>
                  </div>
                  <VSwitch
                    v-model="formData.is_enabled"
                    color="success"
                    hide-details
                  />
                </div>
                <VChip
                  :color="formData.is_enabled ? 'success' : 'error'"
                  size="small"
                  class="mt-3"
                >
                  {{ formData.is_enabled ? 'Enabled' : 'Disabled' }}
                </VChip>
              </VCard>
            </VCol>

            <!-- Credit Cost -->
            <VCol cols="12" md="6">
              <VCard variant="outlined" class="pa-4">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Credit Cost</h4>
                <p class="text-caption text-medium-emphasis mb-3">
                  Number of AI credits required per assessment
                </p>
                <VSlider
                  v-model="formData.credit_cost"
                  :min="1"
                  :max="10"
                  :step="1"
                  thumb-label="always"
                  color="primary"
                  track-color="grey-lighten-2"
                />
                <div class="text-center mt-2">
                  <VChip color="primary" size="small">
                    {{ formData.credit_cost }} credits per assessment
                  </VChip>
                </div>
              </VCard>
            </VCol>

            <!-- Max Documents -->
            <VCol cols="12" md="6">
              <VCard variant="outlined" class="pa-4">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Maximum Documents</h4>
                <p class="text-caption text-medium-emphasis mb-3">
                  Maximum number of supporting documents allowed per assessment
                </p>
                <VTextField
                  v-model.number="formData.max_documents"
                  type="number"
                  :min="1"
                  :max="20"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-file-multiple"
                />
              </VCard>
            </VCol>

            <!-- Max File Size -->
            <VCol cols="12" md="6">
              <VCard variant="outlined" class="pa-4">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Maximum File Size</h4>
                <p class="text-caption text-medium-emphasis mb-3">
                  Maximum size per uploaded document (in MB)
                </p>
                <VTextField
                  v-model.number="formData.max_file_size_mb"
                  type="number"
                  :min="1"
                  :max="50"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-file-chart"
                  suffix="MB"
                />
              </VCard>
            </VCol>

            <!-- Allowed File Types -->
            <VCol cols="12">
              <VCard variant="outlined" class="pa-4">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Allowed File Types</h4>
                <p class="text-caption text-medium-emphasis mb-3">
                  Select which file types patients can upload
                </p>
                <VSelect
                  v-model="formData.allowed_file_types"
                  :items="fileTypeOptions"
                  item-title="title"
                  item-value="value"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-file-document-outline"
                />
              </VCard>
            </VCol>
          </VRow>

          <!-- Health Checkup Inclusion Settings -->
          <VDivider class="my-6" />
          <h3 class="text-h6 font-weight-bold mb-4">
            <VIcon start color="primary">mdi-clipboard-pulse</VIcon>
            Health Checkup Inclusion Settings
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Configure how recent health checkups (symptom assessments) are included in the Advanced Health Score calculation.
          </p>

          <VRow>
            <!-- Auto-Include Days -->
            <VCol cols="12" md="6">
              <VCard variant="outlined" class="pa-4">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Auto-Include Window</h4>
                <p class="text-caption text-medium-emphasis mb-3">
                  Automatically suggest including checkups from the last X days
                </p>
                <VTextField
                  v-model.number="formData.checkup_auto_include_days"
                  type="number"
                  :min="1"
                  :max="90"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-calendar-check"
                  suffix="days"
                />
                <VChip color="success" size="small" class="mt-2">
                  Checkups within {{ formData.checkup_auto_include_days }} days will be suggested
                </VChip>
              </VCard>
            </VCol>

            <!-- Auto-Exclude Days -->
            <VCol cols="12" md="6">
              <VCard variant="outlined" class="pa-4">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Auto-Exclude Window</h4>
                <p class="text-caption text-medium-emphasis mb-3">
                  Automatically exclude checkups older than X days
                </p>
                <VTextField
                  v-model.number="formData.checkup_auto_exclude_days"
                  type="number"
                  :min="7"
                  :max="180"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-calendar-remove"
                  suffix="days"
                />
                <VChip color="warning" size="small" class="mt-2">
                  Checkups older than {{ formData.checkup_auto_exclude_days }} days won't appear
                </VChip>
              </VCard>
            </VCol>

            <!-- Allow Patient Exclusion -->
            <VCol cols="12" md="6">
              <VCard variant="outlined" class="pa-4">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <h4 class="text-subtitle-1 font-weight-bold">Patient Can Exclude Checkups</h4>
                    <p class="text-caption text-medium-emphasis mb-0">
                      Allow patients to toggle which checkups to include during assessment
                    </p>
                  </div>
                  <VSwitch
                    v-model="formData.allow_patient_checkup_exclusion"
                    color="primary"
                    hide-details
                  />
                </div>
                <VChip
                  :color="formData.allow_patient_checkup_exclusion ? 'primary' : 'grey'"
                  size="small"
                  class="mt-3"
                >
                  {{ formData.allow_patient_checkup_exclusion ? 'Patients can toggle checkups' : 'System decides automatically' }}
                </VChip>
              </VCard>
            </VCol>

            <!-- Exclude Self-Care Triage -->
            <VCol cols="12" md="6">
              <VCard variant="outlined" class="pa-4">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <h4 class="text-subtitle-1 font-weight-bold">Exclude Self-Care Triage</h4>
                    <p class="text-caption text-medium-emphasis mb-0">
                      Automatically exclude checkups with "self-care" triage level (minor symptoms)
                    </p>
                  </div>
                  <VSwitch
                    v-model="formData.exclude_self_care_triage"
                    color="primary"
                    hide-details
                  />
                </div>
                <VChip
                  :color="formData.exclude_self_care_triage ? 'success' : 'grey'"
                  size="small"
                  class="mt-3"
                >
                  {{ formData.exclude_self_care_triage ? 'Self-care checkups excluded' : 'All triage levels included' }}
                </VChip>
              </VCard>
            </VCol>
          </VRow>

          <!-- Credit Sharing Settings -->
          <VDivider class="my-6" />
          <h3 class="text-h6 font-weight-bold mb-4">
            <VIcon start color="purple">mdi-share-variant</VIcon>
            AI Credit Sharing Settings
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Configure patient-to-patient credit sharing feature. When enabled, patients can share their purchased AI credits with other patients.
          </p>

          <VRow>
            <!-- Credit Sharing Toggle -->
            <VCol cols="12" md="6">
              <VCard variant="outlined" class="pa-4">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <h4 class="text-subtitle-1 font-weight-bold">Credit Sharing Feature</h4>
                    <p class="text-caption text-medium-emphasis mb-0">
                      Allow patients to share purchased AI credits with other patients
                    </p>
                  </div>
                  <VSwitch
                    v-model="formData.credit_sharing_enabled"
                    color="purple"
                    hide-details
                  />
                </div>
                <VChip
                  :color="formData.credit_sharing_enabled ? 'purple' : 'grey'"
                  size="small"
                  class="mt-3"
                >
                  {{ formData.credit_sharing_enabled ? 'Credit sharing enabled' : 'Credit sharing disabled' }}
                </VChip>
              </VCard>
            </VCol>

            <!-- Minimum Transfer Amount -->
            <VCol cols="12" md="6">
              <VCard variant="outlined" class="pa-4">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Minimum Transfer Amount</h4>
                <p class="text-caption text-medium-emphasis mb-3">
                  Minimum number of credits per transfer
                </p>
                <VTextField
                  v-model.number="formData.credit_sharing_min_amount"
                  type="number"
                  :min="1"
                  :max="100"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-arrow-down-bold"
                  suffix="credits"
                  :disabled="!formData.credit_sharing_enabled"
                />
              </VCard>
            </VCol>

            <!-- Maximum Transfer Amount -->
            <VCol cols="12" md="6">
              <VCard variant="outlined" class="pa-4">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Maximum Transfer Amount</h4>
                <p class="text-caption text-medium-emphasis mb-3">
                  Maximum number of credits per transfer
                </p>
                <VTextField
                  v-model.number="formData.credit_sharing_max_amount"
                  type="number"
                  :min="1"
                  :max="500"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-arrow-up-bold"
                  suffix="credits"
                  :disabled="!formData.credit_sharing_enabled"
                />
              </VCard>
            </VCol>

            <!-- Info Note -->
            <VCol cols="12" md="6">
              <VCard variant="flat" class="pa-4" color="purple-lighten-5">
                <div class="d-flex align-start" style="gap: 12px">
                  <VIcon color="purple">mdi-information</VIcon>
                  <div>
                    <h4 class="text-subtitle-2 font-weight-bold mb-1">How Credit Sharing Works</h4>
                    <p class="text-caption mb-0">
                      Only purchased credits can be shared between patients. Free monthly credits and admin-gifted credits cannot be transferred. Both sender and recipient receive email notifications for each transfer.
                    </p>
                  </div>
                </div>
              </VCard>
            </VCol>
          </VRow>

          <!-- Actions -->
          <div class="d-flex justify-end mt-6" style="gap: 12px">
            <VBtn
              color="secondary"
              variant="outlined"
              @click="resetToDefaults"
              :disabled="saving || resettingDefaults"
              :loading="resettingDefaults"
            >
              Reset to Defaults
            </VBtn>
            <VBtn
              color="primary"
              type="submit"
              :loading="saving"
            >
              <VIcon start>mdi-content-save</VIcon>
              Save Settings
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>
