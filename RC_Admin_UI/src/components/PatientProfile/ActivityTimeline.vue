<script setup>
import { ref, onMounted, computed } from 'vue'
import { formatDate } from '@core/utils/formatters'
import moment from 'moment'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

const activities = ref([])
const loading = ref(false)
const error = ref(false)

// Fetch patient activity timeline
const fetchActivityTimeline = async () => {
  loading.value = true
  error.value = false
  
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    console.log('Fetching activity timeline for patient:', props.userData._id)
    
    const response = await fetch(`/admin-api/dashboard/patient/${props.userData._id}/activity-timeline`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Activity timeline response status:', response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('Activity timeline result:', result)
    
    if (result.statusCode === 200) {
      activities.value = result.data
      console.log('Activity timeline loaded:', result.data.length, 'activities')
    } else {
      console.error('API returned error:', result)
      error.value = true
    }
  } catch (err) {
    console.error('Error fetching activity timeline:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.userData._id) {
    fetchActivityTimeline()
  }
})

// Get activity icon based on type
const getActivityIcon = (type) => {
  switch (type) {
    case 'health_checkup':
      return 'mdi-clipboard-pulse'
    case 'appointment_created':
      return 'mdi-calendar-plus'
    case 'appointment_completed':
      return 'mdi-calendar-check'
    case 'appointment_cancelled':
      return 'mdi-calendar-remove'
    case 'prescription_received':
      return 'mdi-pill'
    case 'login':
      return 'mdi-login'
    case 'profile_updated':
      return 'mdi-account-edit'
    case 'emergency_contact_added':
      return 'mdi-account-plus'
    case 'subscription_changed':
      return 'mdi-credit-card'
    default:
      return 'mdi-circle'
  }
}

// Get activity color based on type
const getActivityColor = (type) => {
  switch (type) {
    case 'health_checkup':
      return 'info'
    case 'appointment_created':
      return 'primary'
    case 'appointment_completed':
      return 'success'
    case 'appointment_cancelled':
      return 'error'
    case 'prescription_received':
      return 'secondary'
    case 'login':
      return 'success'
    case 'profile_updated':
      return 'warning'
    case 'emergency_contact_added':
      return 'info'
    case 'subscription_changed':
      return 'primary'
    default:
      return 'grey'
  }
}

// Group activities by date
const groupedActivities = computed(() => {
  const groups = {}
  
  activities.value.forEach(activity => {
    const date = moment(activity.timestamp).format('YYYY-MM-DD')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
  })
  
  // Sort dates in descending order
  const sortedGroups = {}
  Object.keys(groups)
    .sort((a, b) => new Date(b) - new Date(a))
    .forEach(date => {
      sortedGroups[date] = groups[date].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )
    })
  
  return sortedGroups
})
</script>

<template>
  <VCardText>
    <div class="mb-6">
      <h3 class="text-h6 mb-4 d-flex align-center">
        <VIcon class="mr-2" color="primary">mdi-timeline</VIcon>
        Patient Activity Timeline
      </h3>
      <p class="text-body-2 text-medium-emphasis">
        Chronological history of {{ props.userData.profile?.first_name }}'s interactions with the platform
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8">
      <VProgressCircular indeterminate color="primary" size="40" />
      <div class="text-body-2 mt-3">Loading activity timeline...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-8">
      <VAlert type="error" variant="tonal" class="mb-4">
        <VIcon start>mdi-alert-circle</VIcon>
        Error loading activity timeline. Please try again.
      </VAlert>
      <VBtn @click="fetchActivityTimeline" color="primary" variant="outlined">
        <VIcon start>mdi-refresh</VIcon>
        Retry
      </VBtn>
    </div>

    <!-- Timeline content -->
    <div v-else-if="Object.keys(groupedActivities).length > 0">
      <div 
        v-for="(dayActivities, date) in groupedActivities" 
        :key="date"
        class="mb-8"
      >
        <!-- Date header -->
        <div class="date-header-container mb-4">
          <VDivider />
          <div class="date-header-content">
            <VChip 
              color="primary" 
              variant="tonal" 
              size="default"
              class="text-body-2 font-weight-medium date-chip"
            >
              {{ moment(date).format('dddd, MMMM Do, YYYY') }}
            </VChip>
          </div>
          <VDivider />
        </div>

        <!-- Activities for this date -->
        <VTimeline 
          density="compact" 
          align="start"
          side="end"
          class="timeline-custom"
        >
          <VTimelineItem
            v-for="activity in dayActivities"
            :key="activity.id || activity.timestamp"
            size="small"
            :dot-color="getActivityColor(activity.type)"
            :icon="getActivityIcon(activity.type)"
          >
            <template #opposite>
              <div class="text-caption text-medium-emphasis">
                {{ moment(activity.timestamp).format('h:mm A') }}
              </div>
            </template>

            <VCard variant="tonal" :color="getActivityColor(activity.type)" class="mb-3">
              <VCardText class="py-3">
                <div class="d-flex align-start">
                  <div class="flex-grow-1">
                    <div class="text-subtitle-2 font-weight-medium mb-1">
                      {{ activity.title }}
                    </div>
                    <div class="text-body-2 mb-2">
                      {{ activity.description }}
                    </div>
                    <div v-if="activity.details" class="text-caption text-medium-emphasis">
                      {{ activity.details }}
                    </div>
                  </div>
                  <VChip
                    size="x-small"
                    :color="getActivityColor(activity.type)"
                    variant="flat"
                    class="ml-2"
                  >
                    {{ activity.type.replace('_', ' ').toUpperCase() }}
                  </VChip>
                </div>
              </VCardText>
            </VCard>
          </VTimelineItem>
        </VTimeline>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <VIcon size="64" color="grey-lighten-2" class="mb-4">
        mdi-timeline-clock-outline
      </VIcon>
      <h4 class="text-h6 mb-2">No Activity History</h4>
      <p class="text-body-2 text-medium-emphasis">
        No recent activity found for this patient.
      </p>
    </div>
  </VCardText>
</template>

<style scoped>
.timeline-custom :deep(.v-timeline-item__body) {
  padding-top: 0;
}

.timeline-custom :deep(.v-timeline-item__opposite) {
  padding-top: 8px;
}

.date-header-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
}

.date-header-content {
  display: flex;
  justify-content: center;
}

.date-chip {
  white-space: nowrap;
  padding: 8px 16px;
  min-width: auto;
  max-width: none;
  flex-shrink: 0;
}
</style>