<template>
  <div>
    <!-- Welcome Header -->
    <VCard class="mb-6" color="primary" variant="tonal">
      <VCardText class="d-flex align-center">
        <div class="flex-grow-1">
          <h2 class="text-h4 font-weight-bold mb-2">Welcome to Rapid Capsule Admin</h2>
          <p class="text-subtitle-1 mb-0">Manage your telemedicine platform efficiently</p>
        </div>
        <VIcon size="60" class="text-primary">mdi-hospital</VIcon>
      </VCardText>
    </VCard>

    <!-- Key Metrics Row -->
    <VRow class="mb-6">
      <VCol cols="12" lg="2.4" md="4" sm="6">
        <VCard class="text-center">
          <VCardText>
            <VIcon size="40" color="success" class="mb-3">mdi-account-group</VIcon>
            <div class="text-h3 font-weight-bold">{{ metrics.totalUsers || 0 }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">Total Users</div>
            <VChip size="small" color="success" class="mt-2">
              +{{ metrics.newUsersToday || 0 }} today
            </VChip>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" lg="2.4" md="4" sm="6">
        <VCard class="text-center">
          <VCardText>
            <VIcon size="40" color="info" class="mb-3">mdi-calendar-check</VIcon>
            <div class="text-h3 font-weight-bold">{{ metrics.todayAppointments || 0 }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">Today's Appointments</div>
            <VChip size="small" color="info" class="mt-2">
              {{ metrics.completedToday || 0 }} completed
            </VChip>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" lg="2.4" md="4" sm="6">
        <VCard class="text-center">
          <VCardText>
            <VIcon size="40" color="warning" class="mb-3">mdi-doctor</VIcon>
            <div class="text-h3 font-weight-bold">{{ metrics.totalSpecialists || 0 }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">Medical Specialists</div>
            <VChip size="small" color="warning" class="mt-2">
              {{ metrics.activeSpecialists || 0 }} active
            </VChip>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" lg="2.4" md="4" sm="6">
        <VCard class="text-center">
          <VCardText>
            <VIcon size="40" color="primary" class="mb-3">mdi-shield-account</VIcon>
            <div class="text-h3 font-weight-bold">{{ metrics.totalLifeguards || 0 }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">Lifeguards</div>
            <VChip size="small" color="primary" class="mt-2">
              {{ metrics.activeLifeguards || 0 }} active
            </VChip>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" lg="2.4" md="4" sm="6">
        <VCard class="text-center">
          <VCardText>
            <VIcon size="40" color="error" class="mb-3">mdi-heart-pulse</VIcon>
            <div class="text-h3 font-weight-bold">{{ metrics.healthCheckupsToday || 0 }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">AI Health Checkups</div>
            <VChip size="small" color="error" class="mt-2">
              Today
            </VChip>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Analytics and Recent Activity Row -->
    <VRow>
      <VCol cols="12" lg="8">
        <VCard title="Platform Activity">
          <VCardText class="pb-4">
            <div class="d-flex align-center mb-3 flex-wrap" style="gap: 12px">
              <VTextField
                v-model="activityDateRange.start"
                type="date"
                label="Start Date"
                variant="outlined"
                density="compact"
                style="max-width: 160px"
                @change="updateActivityChart"
              />
              <VTextField
                v-model="activityDateRange.end"
                type="date"
                label="End Date"
                variant="outlined"
                density="compact"
                style="max-width: 160px"
                @change="updateActivityChart"
              />
              <VBtn 
                color="primary" 
                variant="outlined"
                size="small"
                @click="resetActivityToDefault"
              >
                Reset to 7 Days
              </VBtn>
            </div>
            <div style="height: 250px; position: relative;">
              <canvas ref="chartCanvas"></canvas>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" lg="4">
        <VCard title="Recent Activities" class="h-100">
          <VCardText>
            <VList v-if="recentActivities.length > 0">
              <VListItem
                v-for="(activity, index) in recentActivities"
                :key="index"
                class="px-0"
              >
                <template #prepend>
                  <VIcon :color="getActivityIcon(activity.type).color" size="20">
                    {{ getActivityIcon(activity.type).icon }}
                  </VIcon>
                </template>
                <VListItemTitle class="text-sm">{{ activity.message }}</VListItemTitle>
                <VListItemSubtitle class="text-xs">{{ activity.time_ago }}</VListItemSubtitle>
              </VListItem>
            </VList>
            <VAlert v-else type="info" variant="tonal" class="mb-0">
              <VIcon start>mdi-information</VIcon>
              No recent activities in the last 24 hours
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Health Checkups Chart Row -->
    <VRow class="mt-6">
      <VCol cols="12" lg="8">
        <VCard title="Health Checkups Trend">
          <VCardText class="pb-4">
            <div class="d-flex align-center mb-3 flex-wrap" style="gap: 12px">
              <VTextField
                v-model="healthCheckupDateRange.start"
                type="date"
                label="Start Date"
                variant="outlined"
                density="compact"
                style="max-width: 160px"
                @change="updateHealthCheckupChart"
              />
              <VTextField
                v-model="healthCheckupDateRange.end"
                type="date"
                label="End Date"
                variant="outlined"
                density="compact"
                style="max-width: 160px"
                @change="updateHealthCheckupChart"
              />
              <VBtn 
                color="primary" 
                variant="outlined"
                size="small"
                @click="resetHealthCheckupToDefault"
              >
                Reset to 30 Days
              </VBtn>
            </div>
            <div style="height: 250px; position: relative;">
              <canvas ref="healthCheckupChartCanvas"></canvas>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" lg="4">
        <VCard title="Health Checkup Stats" class="h-100">
          <VCardText>
            <div class="text-center">
              <div class="text-h2 font-weight-bold text-primary">{{ totalHealthCheckups }}</div>
              <div class="text-subtitle-1 text-medium-emphasis mb-4">Total Health Checkups</div>
              
              <VDivider class="my-4"></VDivider>
              
              <div class="text-h3 font-weight-bold text-success">{{ metrics.healthCheckupsToday }}</div>
              <div class="text-subtitle-2 text-medium-emphasis">Today</div>
              
              <VChip 
                v-if="metrics.healthCheckupsToday > 0" 
                color="success" 
                size="small" 
                class="mt-3"
              >
                Active Today!
              </VChip>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Quick Actions Row -->
    <VRow class="mt-6">
      <VCol cols="12" md="6">
        <VCard title="Pending Approvals">
          <VCardText>
            <VAlert
              v-if="pendingApprovals.length === 0"
              type="success"
              variant="tonal"
              class="mb-0"
            >
              <VIcon start>mdi-check-circle</VIcon>
              All specialist applications are up to date
            </VAlert>
            <VList v-else>
              <VListItem
                v-for="(approval, index) in pendingApprovals"
                :key="index"
              >
                <template #prepend>
                  <VAvatar color="warning">
                    <VIcon>mdi-doctor</VIcon>
                  </VAvatar>
                </template>
                <VListItemTitle>{{ approval.name }}</VListItemTitle>
                <VListItemSubtitle>{{ approval.specialty }} - {{ approval.date }}</VListItemSubtitle>
                <template #append>
                  <VBtn 
                    size="small" 
                    color="success"
                    @click="navigateToSpecialistReview(approval.id)"
                  >
                    Review
                  </VBtn>
                </template>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" md="6">
        <VCard title="System Status">
          <VCardText>
            <VList>
              <VListItem>
                <template #prepend>
                  <VIcon color="success">mdi-check-circle</VIcon>
                </template>
                <VListItemTitle>API Server</VListItemTitle>
                <VListItemSubtitle>Online</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VIcon color="success">mdi-check-circle</VIcon>
                </template>
                <VListItemTitle>Database</VListItemTitle>
                <VListItemSubtitle>Connected</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VIcon color="warning">mdi-alert-circle</VIcon>
                </template>
                <VListItemTitle>Payment Gateway</VListItemTitle>
                <VListItemSubtitle>Monitoring required</VListItemSubtitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

// Reactive data
const metrics = ref({
  totalUsers: 0,
  newUsersToday: 0,
  todayAppointments: 0,
  completedToday: 0,
  totalSpecialists: 0,
  activeSpecialists: 0,
  totalLifeguards: 0,
  activeLifeguards: 0,
  healthCheckupsToday: 0
})

const recentActivities = ref([])

const pendingApprovals = ref([])
const chartCanvas = ref(null)
const healthCheckupChartCanvas = ref(null)
let chartInstance = null
let healthCheckupChartInstance = null
const totalHealthCheckups = ref(0)

// Date range controls
const activityDateRange = ref({
  start: '',
  end: ''
})
const healthCheckupDateRange = ref({
  start: '',
  end: ''
})

// Initialize chart
const initChart = async (trendData) => {
  try {
    await nextTick()
    
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }
    
    if (!chartCanvas.value) {
      console.warn('Chart canvas not found')
      return
    }
    
    if (!trendData || trendData.length === 0) {
      console.warn('No trend data provided for chart')
      return
    }
    
    const ctx = chartCanvas.value.getContext('2d')
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.map(d => d.date),
        datasets: [
          {
            label: 'New Patients',
            data: trendData.map(d => d.patients),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.3
          },
          {
            label: 'Appointments',
            data: trendData.map(d => d.appointments),
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.3
          },
          {
            label: 'Health Checkups',
            data: trendData.map(d => d.healthCheckups),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10
          }
        }
      }
    })
  } catch (error) {
    console.error('Error initializing activity chart:', error)
  }
}

// Initialize health checkup chart
const initHealthCheckupChart = async (trendData) => {
  try {
    await nextTick()
    
    if (healthCheckupChartInstance) {
      healthCheckupChartInstance.destroy()
      healthCheckupChartInstance = null
    }
    
    if (!healthCheckupChartCanvas.value) {
      console.warn('Health checkup chart canvas not found')
      return
    }
    
    if (!trendData || trendData.length === 0) {
      console.warn('No health checkup trend data provided')
      return
    }
    
    const ctx = healthCheckupChartCanvas.value.getContext('2d')
    healthCheckupChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: trendData.map(d => d.date),
        datasets: [
          {
            label: 'Health Checkups',
            data: trendData.map(d => d.healthCheckups),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                return Number.isInteger(value) ? value : ''
              }
            },
            title: {
              display: true,
              text: 'Health Checkups'
            }
          },
          x: {
            title: {
              display: false
            }
          }
        },
        layout: {
          padding: {
            top: 10,
            bottom: 5,
            left: 10,
            right: 10
          }
        }
      }
    })
  } catch (error) {
    console.error('Error initializing health checkup chart:', error)
  }
}

// Set default date ranges
// Helper function to get activity icons and colors
const getActivityIcon = (activityType) => {
  const iconMap = {
    'patient_registration': { icon: 'mdi-account-plus', color: 'success' },
    'specialist_application': { icon: 'mdi-doctor', color: 'warning' },
    'lifeguard_registration': { icon: 'mdi-shield-account', color: 'primary' },
    'appointment_completed': { icon: 'mdi-calendar-check', color: 'info' },
    'health_checkup': { icon: 'mdi-heart-pulse', color: 'error' }
  }
  return iconMap[activityType] || { icon: 'mdi-circle', color: 'grey' }
}

const setDefaultDateRanges = () => {
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)
  
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  activityDateRange.value = {
    start: sevenDaysAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  }
  
  healthCheckupDateRange.value = {
    start: thirtyDaysAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  }
}

// Reset functions
const resetActivityToDefault = async () => {
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)
  
  activityDateRange.value = {
    start: sevenDaysAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  }
  
  await updateActivityChart()
}

const resetHealthCheckupToDefault = async () => {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  healthCheckupDateRange.value = {
    start: thirtyDaysAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  }
  
  await updateHealthCheckupChart()
}

// Navigation function
const router = useRouter()
const navigateToSpecialistReview = (specialistId) => {
  router.push(`/specialists/${specialistId}`)
}

// Update chart functions
const updateActivityChart = async () => {
  if (!activityDateRange.value.start || !activityDateRange.value.end) return
  
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const headers = {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json'
    }
    
    const response = await fetch(
      `/admin-api/dashboard/trends?start_date=${activityDateRange.value.start}&end_date=${activityDateRange.value.end}`,
      { headers }
    )
    const data = await response.json()
    
    if (data.statusCode === 200 && data.data) {
      await initChart(data.data)
    }
  } catch (error) {
    console.error('Error updating activity chart:', error)
  }
}

const updateHealthCheckupChart = async () => {
  if (!healthCheckupDateRange.value.start || !healthCheckupDateRange.value.end) return
  
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const headers = {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json'
    }
    
    const response = await fetch(
      `/admin-api/dashboard/health-checkup-trends?start_date=${healthCheckupDateRange.value.start}&end_date=${healthCheckupDateRange.value.end}`,
      { headers }
    )
    const data = await response.json()
    
    if (data.statusCode === 200 && data.data) {
      await initHealthCheckupChart(data.data)
    }
  } catch (error) {
    console.error('Error updating health checkup chart:', error)
  }
}

// Fetch dashboard data
const fetchDashboardData = async () => {
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const headers = {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json'
    }

    // Fetch comprehensive metrics from the new endpoint
    const metricsResponse = await fetch('/admin-api/dashboard/metrics', {
      headers
    })
    const metricsData = await metricsResponse.json()

    if (metricsData.statusCode === 200 && metricsData.data) {
      const data = metricsData.data
      
      // Update metrics with real data from API
      metrics.value = {
        totalUsers: data.users.totalUsers,
        newUsersToday: data.users.newUsersToday,
        todayAppointments: data.appointments.todayTotal,
        completedToday: data.appointments.todayCompleted,
        totalSpecialists: data.users.totalSpecialists,
        activeSpecialists: data.users.activeSpecialists,
        totalLifeguards: data.users.totalLifeguards,
        activeLifeguards: data.users.activeLifeguards,
        healthCheckupsToday: data.healthCheckups.todayTotal
      }

      // Update pending approvals if we have pending verifications
      if (data.verifications.pendingSpecialists > 0) {
        // Fetch pending specialists details
        const pendingResponse = await fetch('/admin-api/specialists?currentPage=1&status=All', {
          headers
        })
        const pendingData = await pendingResponse.json()
        
        if (pendingData.data?.docs) {
          pendingApprovals.value = pendingData.data.docs
            .filter(s => s.verification_status === 'Unverified')
            .map(s => ({
              id: s._id,
              name: `${s.profile.first_name} ${s.profile.last_name}`,
              specialty: s.professional_practice?.category || 'Specialist',
              date: new Date(s.created_at).toLocaleDateString()
            }))
            .slice(0, 3) // Show only first 3
        }
      }
    }
    
    // Fetch weekly trends for main chart
    const trendsResponse = await fetch('/admin-api/dashboard/trends', {
      headers
    })
    const trendsData = await trendsResponse.json()
    
    // Fetch health checkup trends for dedicated chart
    const healthCheckupTrendsResponse = await fetch('/admin-api/dashboard/health-checkup-trends', {
      headers
    })
    const healthCheckupTrendsData = await healthCheckupTrendsResponse.json()
    
    if (trendsData.statusCode === 200 && trendsData.data) {
      // Initialize main activity chart
      await initChart(trendsData.data)
      
      // Set total health checkups count
      totalHealthCheckups.value = metricsData.data.totals.allTimeHealthCheckups
    }
    
    if (healthCheckupTrendsData.statusCode === 200 && healthCheckupTrendsData.data) {
      // Initialize health checkup chart with 30-day data
      await initHealthCheckupChart(healthCheckupTrendsData.data)
    }
    
    // Fetch recent activities
    const activitiesResponse = await fetch('/admin-api/dashboard/recent-activities', {
      headers
    })
    const activitiesData = await activitiesResponse.json()
    
    if (activitiesData.statusCode === 200 && activitiesData.data) {
      recentActivities.value = activitiesData.data
    }

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }
}

onMounted(() => {
  setDefaultDateRanges()
  fetchDashboardData()
})
</script>
