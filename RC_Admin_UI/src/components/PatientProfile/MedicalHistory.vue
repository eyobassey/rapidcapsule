<script setup>
import { computed, ref, onMounted } from 'vue'
import { formatDate } from '@core/utils/formatters'
import { useRouter } from 'vue-router'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

const router = useRouter()

// Health checkup history
const healthCheckups = ref([])
const loadingCheckups = ref(false)
const checkupsError = ref(false)

// Clinical notes
const clinicalNotes = ref([])
const loadingNotes = ref(false)
const notesError = ref(false)

// Fetch health checkup history
const fetchHealthCheckups = async () => {
  loadingCheckups.value = true
  checkupsError.value = false

  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    console.log('Fetching health checkups for patient:', props.userData._id)

    const response = await fetch(`/admin-api/dashboard/patient/${props.userData._id}/health-checkups`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Health checkups response status:', response.status)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Health checkups result:', result)

    if (result.statusCode === 200) {
      healthCheckups.value = result.data
      console.log('Health checkups loaded:', result.data.length)
    } else {
      console.error('API returned error:', result)
      checkupsError.value = true
    }
  } catch (error) {
    console.error('Error fetching health checkups:', error)
    checkupsError.value = true
  } finally {
    loadingCheckups.value = false
  }
}

// Fetch clinical notes
const fetchClinicalNotes = async () => {
  loadingNotes.value = true
  notesError.value = false

  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    console.log('Fetching clinical notes for patient:', props.userData._id)

    const response = await fetch(`/admin-api/dashboard/patient/${props.userData._id}/clinical-notes`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Clinical notes response status:', response.status)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Clinical notes result:', result)

    if (result.statusCode === 200) {
      clinicalNotes.value = result.data
      console.log('Clinical notes loaded:', result.data.length)
    } else {
      console.error('API returned error:', result)
      notesError.value = true
    }
  } catch (error) {
    console.error('Error fetching clinical notes:', error)
    notesError.value = true
  } finally {
    loadingNotes.value = false
  }
}

onMounted(() => {
  if (props.userData._id) {
    fetchHealthCheckups()
    fetchClinicalNotes()
  }
})

// Navigate to health checkup report
const viewHealthCheckupReport = (checkupId) => {
  console.log('Navigating to health checkup report:', checkupId)
  router.push(`/health-checkups/${checkupId}`)
}

// Calculate BMI from basic health info
const bmi = computed(() => {
  const healthInfo = props.userData?.profile?.basic_health_info
  if (healthInfo?.height?.value && healthInfo?.weight?.value) {
    const heightInMeters = healthInfo.height.unit === 'cm' 
      ? healthInfo.height.value / 100 
      : healthInfo.height.value
    const weight = healthInfo.weight.value
    const bmiValue = weight / (heightInMeters * heightInMeters)
    return Math.round(bmiValue * 10) / 10
  }
  return null
})

// BMI category
const bmiCategory = computed(() => {
  if (!bmi.value) return 'Unknown'
  if (bmi.value < 18.5) return 'Underweight'
  if (bmi.value < 25) return 'Normal weight'
  if (bmi.value < 30) return 'Overweight'
  return 'Obese'
})

// BMI color based on category
const bmiColor = computed(() => {
  if (!bmi.value) return 'grey'
  if (bmi.value < 18.5) return 'warning'
  if (bmi.value < 25) return 'success'
  if (bmi.value < 30) return 'warning'
  return 'error'
})

// Format height display
const heightDisplay = computed(() => {
  const height = props.userData?.profile?.basic_health_info?.height
  if (!height?.value) return 'Not provided'
  return `${height.value}${height.unit}`
})

// Format weight display
const weightDisplay = computed(() => {
  const weight = props.userData?.profile?.basic_health_info?.weight
  if (!weight?.value) return 'Not provided'
  return `${weight.value}${weight.unit}`
})

// Risk factor display
const riskFactors = computed(() => {
  const factors = props.userData?.profile?.health_risk_factors
  if (!factors) return []
  
  const riskArray = []
  if (factors.is_smoker && factors.is_smoker !== 'No') {
    riskArray.push({ 
      factor: 'Smoking', 
      value: factors.is_smoker,
      color: 'error',
      icon: 'mdi-smoking'
    })
  }
  if (factors.weight_status && factors.weight_status !== 'Normal') {
    riskArray.push({ 
      factor: 'Weight Status', 
      value: factors.weight_status,
      color: factors.weight_status === 'Overweight' ? 'warning' : 'error',
      icon: 'mdi-scale-bathroom'
    })
  }
  if (factors.has_recent_injuries && factors.has_recent_injuries !== 'No') {
    riskArray.push({ 
      factor: 'Recent Injuries', 
      value: factors.has_recent_injuries,
      color: 'warning',
      icon: 'mdi-bandage'
    })
  }
  return riskArray
})
</script>

<template>
  <VCardText>
    <!-- Pre-existing Conditions -->
    <div class="mb-8">
      <h3 class="text-h6 mb-4 d-flex align-center">
        <VIcon class="mr-2" color="error">mdi-medical-bag</VIcon>
        Pre-existing Conditions
      </h3>
      
      <div v-if="userData.pre_existing_conditions && userData.pre_existing_conditions.length > 0">
        <VCard
          v-for="condition in userData.pre_existing_conditions"
          :key="condition._id"
          class="mb-3"
          variant="tonal"
        >
          <VCardText>
            <div class="d-flex justify-space-between align-start">
              <div>
                <h4 class="text-subtitle-1 font-weight-medium mb-1">
                  {{ condition.name }}
                </h4>
                <p class="text-body-2 text-medium-emphasis mb-2">
                  {{ condition.description }}
                </p>
                <div class="d-flex align-center">
                  <VChip
                    size="small"
                    :color="condition.is_condition_exists ? 'error' : 'success'"
                    variant="tonal"
                  >
                    {{ condition.is_condition_exists ? 'Active' : 'Resolved' }}
                  </VChip>
                  <VSpacer />
                  <span class="text-caption text-medium-emphasis">
                    Since: {{ formatDate(condition.start_date) }}
                  </span>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </div>
      
      <VAlert
        v-else
        type="info"
        variant="tonal"
        class="mb-0"
      >
        <VIcon start>mdi-information</VIcon>
        No pre-existing conditions recorded
      </VAlert>
    </div>

    <!-- Basic Health Metrics -->
    <div class="mb-8">
      <h3 class="text-h6 mb-4 d-flex align-center">
        <VIcon class="mr-2" color="primary">mdi-heart-pulse</VIcon>
        Health Metrics
      </h3>
      
      <VRow>
        <VCol cols="12" md="6">
          <VCard variant="tonal" color="info">
            <VCardText class="text-center">
              <VIcon size="40" color="info" class="mb-2">mdi-human-male-height</VIcon>
              <div class="text-h5 font-weight-bold">{{ heightDisplay }}</div>
              <div class="text-caption text-medium-emphasis">Height</div>
            </VCardText>
          </VCard>
        </VCol>
        
        <VCol cols="12" md="6">
          <VCard variant="tonal" color="primary">
            <VCardText class="text-center">
              <VIcon size="40" color="primary" class="mb-2">mdi-scale-bathroom</VIcon>
              <div class="text-h5 font-weight-bold">{{ weightDisplay }}</div>
              <div class="text-caption text-medium-emphasis">Weight</div>
            </VCardText>
          </VCard>
        </VCol>
        
        <VCol v-if="bmi" cols="12" md="6">
          <VCard variant="tonal" :color="bmiColor">
            <VCardText class="text-center">
              <VIcon size="40" :color="bmiColor" class="mb-2">mdi-calculator</VIcon>
              <div class="text-h5 font-weight-bold">{{ bmi }}</div>
              <div class="text-caption text-medium-emphasis">BMI</div>
              <VChip
                size="small"
                :color="bmiColor"
                variant="flat"
                class="mt-1"
              >
                {{ bmiCategory }}
              </VChip>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <!-- Health Risk Factors -->
    <div class="mb-6">
      <h3 class="text-h6 mb-4 d-flex align-center">
        <VIcon class="mr-2" color="warning">mdi-alert-circle</VIcon>
        Health Risk Factors
      </h3>
      
      <div v-if="riskFactors.length > 0">
        <VRow>
          <VCol
            v-for="risk in riskFactors"
            :key="risk.factor"
            cols="12"
            md="4"
          >
            <VCard variant="tonal" :color="risk.color">
              <VCardText class="text-center py-4">
                <VIcon size="30" :color="risk.color" class="mb-2">{{ risk.icon }}</VIcon>
                <div class="text-subtitle-2 font-weight-medium mb-1">{{ risk.factor }}</div>
                <div class="text-caption">{{ risk.value }}</div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>
      
      <VAlert
        v-else
        type="success"
        variant="tonal"
        class="mb-0"
      >
        <VIcon start>mdi-check-circle</VIcon>
        No significant health risk factors identified
      </VAlert>
    </div>

    <!-- Recent Health Activity -->
    <div class="mb-6">
      <h3 class="text-h6 mb-4 d-flex align-center">
        <VIcon class="mr-2" color="info">mdi-clipboard-pulse</VIcon>
        Recent Health Checkups
      </h3>
      
      <div v-if="loadingCheckups" class="text-center py-4">
        <VProgressCircular indeterminate color="primary" />
        <div class="text-caption mt-2">Loading health checkups...</div>
      </div>
      
      <div v-else-if="checkupsError" class="text-center py-4">
        <VAlert type="error" variant="tonal">
          <VIcon start>mdi-alert-circle</VIcon>
          Error loading health checkups
        </VAlert>
      </div>
      
      <div v-else-if="healthCheckups.length > 0">
        <VCard
          v-for="checkup in healthCheckups"
          :key="checkup.id"
          class="mb-3 cursor-pointer"
          variant="outlined"
          hover
          @click="viewHealthCheckupReport(checkup.id)"
        >
          <VCardText>
            <div class="d-flex justify-space-between align-start mb-3">
              <div class="d-flex align-center">
                <VIcon 
                  :color="checkup.has_emergency ? 'error' : 'success'" 
                  class="mr-2"
                >
                  {{ checkup.has_emergency ? 'mdi-alert-circle' : 'mdi-check-circle' }}
                </VIcon>
                <div>
                  <div class="text-subtitle-2 font-weight-medium">
                    Health Checkup - {{ formatDate(checkup.date) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ checkup.time_ago }}
                  </div>
                </div>
              </div>
              <div class="d-flex align-center gap-2">
                <VChip
                  size="small"
                  :color="checkup.has_emergency ? 'error' : 'success'"
                  variant="tonal"
                >
                  {{ checkup.has_emergency ? 'Urgent' : 'Normal' }}
                </VChip>
                <VIcon size="20" color="primary">mdi-arrow-right</VIcon>
              </div>
            </div>
            
            <div class="mt-3">
              <VRow>
                <VCol cols="12" md="6">
                  <div class="text-caption text-medium-emphasis mb-1">Conditions Found</div>
                  <VChip size="small" color="info" variant="tonal">
                    {{ checkup.conditions_found }} conditions
                  </VChip>
                </VCol>
                
                <VCol v-if="checkup.top_condition" cols="12" md="6">
                  <div class="text-caption text-medium-emphasis mb-1">Primary Condition</div>
                  <div class="text-body-2 font-weight-medium">
                    {{ checkup.top_condition.common_name || checkup.top_condition.name }}
                    <VChip
                      v-if="checkup.top_condition.probability"
                      size="x-small"
                      color="success"
                      class="ml-2"
                    >
                      {{ Math.round(checkup.top_condition.probability * 100) }}%
                    </VChip>
                  </div>
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>
      </div>
      
      <VAlert
        v-else
        type="info"
        variant="tonal"
        class="mb-0"
      >
        <VIcon start>mdi-information</VIcon>
        No health checkups completed yet
      </VAlert>
    </div>

    <!-- Clinical Notes -->
    <div class="mb-6">
      <h3 class="text-h6 mb-4 d-flex align-center">
        <VIcon class="mr-2" color="success">mdi-note-text</VIcon>
        Clinical Notes
      </h3>

      <div v-if="loadingNotes" class="text-center py-4">
        <VProgressCircular indeterminate color="primary" />
        <div class="text-caption mt-2">Loading clinical notes...</div>
      </div>

      <div v-else-if="notesError" class="text-center py-4">
        <VAlert type="error" variant="tonal">
          <VIcon start>mdi-alert-circle</VIcon>
          Error loading clinical notes
        </VAlert>
      </div>

      <div v-else-if="clinicalNotes.length > 0">
        <VCard
          v-for="note in clinicalNotes"
          :key="note.note_id"
          class="mb-3"
          variant="outlined"
        >
          <VCardText>
            <div class="d-flex justify-space-between align-start mb-3">
              <div class="d-flex align-center flex-grow-1">
                <VIcon
                  :color="note.platform === 'zoom' ? 'primary' : 'success'"
                  class="mr-2"
                >
                  {{ note.platform === 'zoom' ? 'mdi-video' : 'mdi-pencil' }}
                </VIcon>
                <div class="flex-grow-1">
                  <div class="text-subtitle-2 font-weight-medium">
                    Clinical Note - {{ formatDate(note.created_at) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    by {{ note.specialist?.profile?.first_name }} {{ note.specialist?.profile?.last_name }}
                  </div>
                </div>
              </div>
              <div class="d-flex align-center gap-2">
                <VChip
                  size="small"
                  :color="note.platform === 'zoom' ? 'primary' : 'success'"
                  variant="tonal"
                >
                  {{ note.platform === 'zoom' ? 'Zoom' : 'Custom' }}
                </VChip>
                <VChip
                  v-if="note.completed"
                  size="small"
                  color="success"
                  variant="tonal"
                >
                  <VIcon start size="16">mdi-check-circle</VIcon>
                  Completed
                </VChip>
              </div>
            </div>

            <!-- Note Content -->
            <div class="note-content mb-3 pa-3 rounded" style="background-color: rgba(var(--v-theme-surface-variant), 0.3);">
              <div class="text-body-2" style="white-space: pre-wrap;">{{ note.content }}</div>
            </div>

            <!-- Appointment Context -->
            <div class="mt-3">
              <VRow>
                <VCol cols="12" md="6">
                  <div class="text-caption text-medium-emphasis mb-1">Appointment Date</div>
                  <div class="text-body-2">{{ formatDate(note.appointment.date) }}</div>
                </VCol>

                <VCol cols="12" md="3">
                  <div class="text-caption text-medium-emphasis mb-1">Meeting Channel</div>
                  <VChip size="small" variant="tonal">
                    {{ note.appointment.meeting_channel }}
                  </VChip>
                </VCol>

                <VCol cols="12" md="3">
                  <div class="text-caption text-medium-emphasis mb-1">Status</div>
                  <VChip
                    size="small"
                    :color="note.appointment.status === 'Completed' ? 'success' : 'warning'"
                    variant="tonal"
                  >
                    {{ note.appointment.status }}
                  </VChip>
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>
      </div>

      <VAlert
        v-else
        type="info"
        variant="tonal"
        class="mb-0"
      >
        <VIcon start>mdi-information</VIcon>
        No clinical notes recorded yet
      </VAlert>
    </div>
  </VCardText>
</template>

<style scoped>
.text-capitalize {
  text-transform: capitalize;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  transform: translateY(-2px);
  transition: all 0.2s ease-in-out;
}
</style>