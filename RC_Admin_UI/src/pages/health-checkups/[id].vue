<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDate } from '@core/utils/formatters'

const route = useRoute()
const router = useRouter()

// Computed property to reactively get checkupId from route
const checkupId = computed(() => route.params.id)

const checkupReport = ref(null)
const loading = ref(true)
const error = ref(false)

// Fetch detailed health checkup report
const fetchHealthCheckupReport = async () => {
  loading.value = true
  error.value = false
  checkupReport.value = null

  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    console.log('Fetching health checkup report for ID:', checkupId.value)

    const response = await fetch(`/admin-api/dashboard/health-checkup/${checkupId.value}`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Health checkup report response status:', response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('Health checkup report result:', result)
    
    if (result.statusCode === 200) {
      checkupReport.value = result.data
      console.log('Health checkup report loaded successfully')
    } else {
      console.error('API returned error:', result)
      error.value = true
    }
  } catch (err) {
    console.error('Error fetching health checkup report:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.go(-1)
}

// Download report as JSON
const downloadReport = () => {
  if (!checkupReport.value) return
  
  const reportData = {
    patient_name: checkupReport.value.patient_name,
    assessment_date: checkupReport.value.date,
    time_ago: checkupReport.value.time_ago,
    priority_level: checkupReport.value.has_emergency ? 'Urgent' : 'Normal',
    conditions_identified: checkupReport.value.conditions_found,
    conditions: checkupReport.value.conditions.map(condition => ({
      name: condition.common_name || condition.name,
      confidence: Math.round((condition.probability || 0) * 100),
      id: condition.id,
      triage_level: condition.triage_level
    })),
    emergency_status: checkupReport.value.has_emergency,
    checkup_id: checkupId.value,
    generated_at: new Date().toISOString(),
    generated_by: 'Rapid Capsule Admin Dashboard'
  }
  
  const blob = new Blob([JSON.stringify(reportData, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `health-checkup-report-${checkupReport.value.patient_name?.replace(/\s+/g, '-') || checkupId.value}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  console.log('Health checkup report downloaded')
}

// Print report
const printReport = () => {
  if (!checkupReport.value) return
  
  // Create a formatted print view
  const printContent = `
    <html>
      <head>
        <title>Health Checkup Report - ${checkupReport.value.patient_name || 'Patient'}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6; 
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
          }
          .section { 
            margin: 20px 0; 
          }
          .condition { 
            background: #f5f5f5; 
            padding: 10px; 
            margin: 10px 0; 
            border-left: 4px solid #007bff; 
          }
          .urgent { 
            border-left-color: #dc3545; 
          }
          .confidence { 
            font-weight: bold; 
            color: #007bff; 
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ccc; 
            padding-top: 10px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Health Checkup Report</h1>
          <h2>${checkupReport.value.patient_name || 'Patient Information'}</h2>
          <p>Assessment Date: ${formatDate(checkupReport.value.date)} (${checkupReport.value.time_ago})</p>
          <p>Priority Level: <strong>${checkupReport.value.has_emergency ? 'URGENT' : 'Normal'}</strong></p>
        </div>
        
        <div class="section">
          <h3>Assessment Summary</h3>
          <p><strong>Conditions Identified:</strong> ${checkupReport.value.conditions_found}</p>
          <p><strong>Emergency Status:</strong> ${checkupReport.value.has_emergency ? 'Yes' : 'No'}</p>
          <p><strong>Health Check For:</strong> ${checkupReport.value.health_check_for || 'Self'}</p>
        </div>
        
        <div class="section">
          <h3>Identified Conditions</h3>
          ${checkupReport.value.conditions && checkupReport.value.conditions.length > 0 
            ? checkupReport.value.conditions.map(condition => `
              <div class="condition ${checkupReport.value.has_emergency ? 'urgent' : ''}">
                <h4>${condition.common_name || condition.name}</h4>
                <p><span class="confidence">${Math.round((condition.probability || 0) * 100)}% confidence</span></p>
                <p><strong>Condition ID:</strong> ${condition.id}</p>
                ${condition.triage_level ? `<p><strong>Triage Level:</strong> ${condition.triage_level}</p>` : ''}
              </div>
            `).join('')
            : '<p>No specific conditions identified - Assessment appears normal.</p>'
          }
        </div>
        
        <div class="footer">
          <p><strong>Report ID:</strong> ${checkupId.value}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Generated by:</strong> Rapid Capsule Admin Dashboard</p>
          <p><em>This report is generated by AI-powered health assessment and should be reviewed by qualified medical professionals.</em></p>
        </div>
      </body>
    </html>
  `
  
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }
  
  console.log('Health checkup report sent to printer')
}

// Watch for route parameter changes and refetch report
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchHealthCheckupReport()
  }
}, { immediate: true })
</script>

<template>
  <div>
    <!-- Header with back button -->
    <div class="d-flex align-center mb-6">
      <VBtn
        icon
        variant="text" 
        @click="goBack"
        class="mr-2"
      >
        <VIcon>mdi-arrow-left</VIcon>
      </VBtn>
      <div>
        <h1 class="text-h4 font-weight-bold">Health Checkup Report</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">Detailed AI health assessment results</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12">
      <VProgressCircular indeterminate color="primary" size="50" />
      <div class="text-h6 mt-4">Loading health checkup report...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <VAlert type="error" variant="tonal" class="mb-4">
        <VIcon start>mdi-alert-circle</VIcon>
        Error loading health checkup report. Please try again.
      </VAlert>
      <VBtn @click="fetchHealthCheckupReport" color="primary">
        Try Again
      </VBtn>
    </div>

    <!-- Report content -->
    <div v-else-if="checkupReport">
      <!-- Report Overview -->
      <VRow class="mb-6">
        <VCol cols="12" md="8">
          <VCard>
            <VCardTitle class="d-flex align-center">
              <VIcon 
                :color="checkupReport.has_emergency ? 'error' : 'success'" 
                class="mr-2"
                size="24"
              >
                {{ checkupReport.has_emergency ? 'mdi-alert-circle' : 'mdi-check-circle' }}
              </VIcon>
              Health Assessment Summary
            </VCardTitle>
            <VCardText>
              <VRow>
                <VCol cols="12" md="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis mb-1">Assessment Date</div>
                    <div class="text-body-1 font-weight-medium">
                      {{ formatDate(checkupReport.date) }}
                    </div>
                    <div class="text-caption">{{ checkupReport.time_ago }}</div>
                  </div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis mb-1">Priority Level</div>
                    <VChip
                      :color="checkupReport.has_emergency ? 'error' : 'success'"
                      variant="tonal"
                      size="small"
                    >
                      {{ checkupReport.has_emergency ? 'Urgent' : 'Normal' }}
                    </VChip>
                  </div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis mb-1">Conditions Identified</div>
                    <div class="text-h5 font-weight-bold text-primary">
                      {{ checkupReport.conditions_found }}
                    </div>
                  </div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis mb-1">Patient</div>
                    <div class="text-body-1 font-weight-medium">
                      {{ checkupReport.patient_name || 'Patient Information' }}
                    </div>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="4">
          <VCard>
            <VCardTitle>Quick Actions</VCardTitle>
            <VCardText>
              <VBtn 
                block 
                variant="outlined" 
                color="primary" 
                class="mb-2"
                prepend-icon="mdi-download"
                @click="downloadReport"
                :disabled="!checkupReport"
              >
                Download Report
              </VBtn>
              <VBtn 
                block 
                variant="outlined" 
                color="secondary"
                prepend-icon="mdi-printer"
                @click="printReport"
                :disabled="!checkupReport"
              >
                Print Report
              </VBtn>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Detailed Conditions -->
      <VCard class="mb-6">
        <VCardTitle class="d-flex align-center">
          <VIcon class="mr-2" color="primary">mdi-medical-bag</VIcon>
          Identified Conditions
        </VCardTitle>
        <VCardText>
          <div v-if="checkupReport.conditions && checkupReport.conditions.length > 0">
            <VRow>
              <VCol 
                v-for="(condition, index) in checkupReport.conditions" 
                :key="index"
                cols="12" 
                md="6"
                class="mb-4"
              >
                <VCard variant="outlined" class="h-100">
                  <VCardText>
                    <div class="d-flex justify-space-between align-start mb-2">
                      <div class="text-h6 font-weight-medium">
                        {{ condition.common_name || condition.name }}
                      </div>
                      <VChip 
                        size="small" 
                        color="info" 
                        variant="tonal"
                      >
                        {{ Math.round((condition.probability || 0) * 100) }}%
                      </VChip>
                    </div>
                    <div class="text-body-2 text-medium-emphasis mb-3">
                      ID: {{ condition.id }}
                    </div>
                    <div v-if="condition.triage_level" class="mb-2">
                      <VChip 
                        size="small"
                        :color="getTriageColor(condition.triage_level)"
                        variant="tonal"
                      >
                        {{ condition.triage_level }}
                      </VChip>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </div>
          <div v-else>
            <VAlert type="success" variant="tonal">
              <VIcon start>mdi-check-circle</VIcon>
              No specific conditions identified - Assessment appears normal.
            </VAlert>
          </div>
        </VCardText>
      </VCard>

      <!-- Raw Report Data (for debugging - can be hidden in production) -->
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon class="mr-2" color="info">mdi-code-json</VIcon>
          Technical Details
        </VCardTitle>
        <VCardText>
          <VExpansionPanels>
            <VExpansionPanel title="Raw Report Data">
              <VExpansionPanelText>
                <pre class="text-caption">{{ JSON.stringify(checkupReport, null, 2) }}</pre>
              </VExpansionPanelText>
            </VExpansionPanel>
          </VExpansionPanels>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    getTriageColor(level) {
      switch (level?.toLowerCase()) {
        case 'emergency':
          return 'error'
        case 'urgent':
          return 'warning'
        case 'standard':
          return 'info'
        default:
          return 'primary'
      }
    }
  }
}
</script>

<style scoped>
pre {
  background: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 4px;
  padding: 16px;
  overflow-x: auto;
  max-height: 400px;
  font-size: 12px;
}
</style>