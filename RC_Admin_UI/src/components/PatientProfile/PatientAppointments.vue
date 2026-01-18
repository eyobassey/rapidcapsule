
<script setup>
import TableIndex from '@/components/Table/TableIndex.vue'
import SimpleFilter from '@/components/Table/SimpleFilter.vue'
import moment from 'moment'
import { watch } from 'vue'

const props = defineProps({
  appointments: {
    type: Array,
    required: true,
  },
})

const filteredAppointments = ref([])

const appointmentTableHeads = [
  'Specialist',
  'Date',
  'Duration',
  'Status',
  'Total',
]

const filterTabs = [
  {
    label: 'All',
    value: 'All',
  },
  {
    label: 'Upcoming',
    value: 'OPEN',
  },
  {
    label: 'Completed',
    value: 'COMPLETED',
  },
  {
    label: 'Ongoing',
    value: 'ONGOING',
  },
  {
    label: 'Closed',
    value: 'CLOSED',
  },
  {
    label: 'Canceled',
    value: 'CANCELLED',
  },
  {
    label: 'Failed',
    value: 'FAILED',
  },
]

const seletedFilterTab = ref(
  filterTabs[0],
)

watch(seletedFilterTab, value => {
  if(value.value == 'All') {
    filteredAppointments.value = (props.appointments || []).slice().sort((a, b) => {
      const dateA = new Date(a.start_time || a.created_at)
      const dateB = new Date(b.start_time || b.created_at)
      return dateB - dateA // Most recent first for All
    })
  } else {
    filterByStatus()
  }
},
{ deep: true },
{ immediate: true },
)

// Also watch appointments prop for changes
watch(() => props.appointments, () => {
  if(seletedFilterTab.value.value == 'All') {
    filteredAppointments.value = (props.appointments || []).slice().sort((a, b) => {
      const dateA = new Date(a.start_time || a.created_at)
      const dateB = new Date(b.start_time || b.created_at)
      return dateB - dateA // Most recent first for All
    })
  } else {
    filterByStatus()
  }
}, { immediate: true })


const resolveUserStatusVariant = stat => {
  if (stat === 'pending')
    return 'warning'
  if (stat === 'verified')
    return 'success'
  if (stat === 'unverified')
    return 'error'
  
  return 'primary'
}

const resolveUserProgressVariant = progress => {
  if (progress <= 25)
    return 'error'
  if (progress > 25 && progress <= 50)
    return 'warning'
  if (progress > 50 && progress <= 75)
    return 'primary'
  if (progress > 75 && progress <= 100)
    return 'success'
  
  return 'secondary'
}

const filterByStatus = () => {
  if (!props.appointments) {
    filteredAppointments.value = []
    return
  }

  const selectedStatus = seletedFilterTab.value.value
  const now = new Date()

  filteredAppointments.value = props.appointments.filter(appointment => {
    // Check if status matches
    const statusMatches = appointment.status?.toLowerCase() === selectedStatus.toLowerCase()

    // For OPEN status (Upcoming), also check if date is in the future
    if (selectedStatus === 'OPEN' && statusMatches) {
      const appointmentDate = new Date(appointment.start_time)
      return appointmentDate > now
    }

    return statusMatches
  })

  // Sort by start_time (soonest first for upcoming, most recent first for others)
  filteredAppointments.value.sort((a, b) => {
    const dateA = new Date(a.start_time || a.created_at)
    const dateB = new Date(b.start_time || b.created_at)

    // For upcoming appointments, show soonest first
    if (selectedStatus === 'OPEN') {
      return dateA - dateB
    }
    // For completed/past appointments, show most recent first
    return dateB - dateA
  })
}

const momentizeDate = date => {
  return moment(date).format("DD/MM/YYYY")
}

const getStatusColor = status => {
  const statusColors = {
    'COMPLETED': 'success',
    'OPEN': 'info',
    'ONGOING': 'primary',
    'CANCELLED': 'error',
    'CLOSED': 'warning',
    'FAILED': 'error'
  }
  return statusColors[status] || 'default'
}

const getStatusLabel = status => {
  const statusLabels = {
    'COMPLETED': 'Completed',
    'OPEN': 'Upcoming',
    'ONGOING': 'Ongoing',
    'CANCELLED': 'Canceled',
    'CLOSED': 'Closed',
    'FAILED': 'Failed'
  }
  return statusLabels[status] || status || 'N/A'
}
</script>

<template>
  <VRow>
    <VCol
      cols="12"
    >
      <div
        title=""
        class="px-6 pt-4"
      >
        <div class="d-flex mt-6 mx-3 simple-filter-container">
          <SimpleFilter
            v-model:selectabledTab="seletedFilterTab" 
            :tabs="filterTabs"
            :default-tab="seletedFilterTab"
          />
        </div>

        <TableIndex
          :table-heads="appointmentTableHeads"
          :show-select-all="false"
          hide-td-border
          more-button="false"
          class="mt-6"
        >
          <tr
            v-for="(appointment, index) in filteredAppointments"
            :key="index"
            class="hide-td-border"
          >
            <!-- 👉 Specialist -->
            <td>
              <div
                class="d-flex align-center"
                style="width: 250px"
              >
                <template v-if="appointment.specialist">
                  {{ appointment.specialist.profile?.first_name || 'N/A' }}
                  {{ appointment.specialist.profile?.last_name || '' }}
                </template>
                <template v-else>
                  N/A
                </template>
              </div>
            </td>

            <!-- 👉 Date -->
            <td>
              {{ appointment.start_time ? momentizeDate(appointment.start_time) : momentizeDate(appointment.created_at) }}
            </td>

            <!-- 👉 Duration -->
            <td class="text-capitalize text-high-emphasis">
              <template v-if="appointment.call_duration?.time_taken">
                {{ appointment.call_duration.time_taken }} mins
              </template>
              <template v-else-if="appointment.duration_minutes">
                {{ appointment.duration_minutes }} mins
              </template>
              <template v-else>
                N/A
              </template>
            </td>

            <!-- 👉 Status -->
            <td>
              <VChip
                :color="getStatusColor(appointment.status)"
                size="small"
              >
                {{ getStatusLabel(appointment.status) }}
              </VChip>
            </td>

            <!-- 👉 Total -->
            <td>
              <div class="d-flex align-center">
                {{ appointment.appointment_fee ? `₦ ${appointment.appointment_fee.toLocaleString()}` : 'N/A' }}
              </div>
            </td>
          </tr>


          <tr v-if="!filteredAppointments || !filteredAppointments.length">
            <td
              colspan="5"
              class="text-center text-body-1 py-8"
            >
              No appointments found
            </td>
          </tr> 
        </TableIndex>
        <!-- 👉 project List table -->
      </div>
    </VCol>
  </VRow>
</template>

<style scoped lang="scss">
.notAvailable {
  padding: 18px;
  text-align: center;
}
</style>
