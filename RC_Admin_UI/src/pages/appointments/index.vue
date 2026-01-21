<script setup>
import SimpleFilter from '@/components/Table/SimpleFilter.vue'
import TableAdvancedFilter from '@/components/Table/TableAdvancedFilter.vue'
import TableDownload from '@/components/Table/TableDownload.vue'
import TableIndex from '@/components/Table/TableIndex.vue'
import TableSearch from '@/components/Table/TableSearch.vue'
import { useAppointmentStore } from '@/stores/appointment'
import { computed, onMounted } from 'vue'
import moment from 'moment'
import { useRouter } from 'vue-router'

const emit = defineEmits([
  'update:isDrawerOpen',
  'userData',
])

const appointmentStore = useAppointmentStore()
const router = useRouter()

const searchQuery = ref('')
const rowPerPage = ref(0)
const currentPage = ref(1)
const totalPage = ref(1)
const totalAppointments = ref(0)
const appointments = ref([])
const isTableAdvancedFilterVisible = ref(false)
const date = ref(null)
const ongoingTableElementId = 'rc-ongoing-appointment-table'
const upcomingTableElementId = 'rc-upcoming-appointment-table'
const cancelledTableElementId = 'rc-cancelled-appointment-table'
const completedTableElementId = 'rc-completed-appointment-table'
const currentTableElementId = ref(ongoingTableElementId)
const currentTableDownloadName = ref('RC-upcoming-appointments-data')

// Stats for hero banner
const stats = ref({
  liveNow: 0,
  today: 0,
  thisWeek: 0,
  total: 0,
  cancellationRate: 0,
})
const statsLoading = ref(true)

// Tab counts
const tabCounts = ref({
  ONGOING: 0,
  UPCOMING: 0,
  COMPLETED: 0,
  CANCELLED: 0,
  MISSED: 0,
})

// Fetch stats for hero banner
const fetchStats = async () => {
  statsLoading.value = true
  try {
    const response = await appointmentStore.fetchAppointmentStats?.()
    if (response?.data) {
      stats.value = {
        liveNow: response.data.live_now || 0,
        today: response.data.today || 0,
        thisWeek: response.data.this_week || 0,
        total: response.data.total || 0,
        cancellationRate: response.data.cancellation_rate || 0,
      }
      tabCounts.value = {
        ONGOING: response.data.ongoing_count || 0,
        UPCOMING: response.data.upcoming_count || 0,
        COMPLETED: response.data.completed_count || 0,
        CANCELLED: response.data.cancelled_count || 0,
        MISSED: response.data.missed_count || 0,
      }
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  } finally {
    statsLoading.value = false
  }
}

onMounted(() => {
  fetchStats()
})

const mediumCheckers = ref([
  {
    id: 1,
    name: 'Video',
    checked: false,
  },
  {
    id: 2,
    name: 'Audio only',
    checked: false,
  },
])

const meetingCheckers = ref([
  {
    id: 1,
    name: 'Free',
    checked: false,
  },
  {
    id: 2,
    name: 'Premium',
    checked: false,
  },
  {
    id: 3,
    name: 'Premium Gold',
    checked: false,
  },
])

const interventionCheckers = ref([
  {
    id: 1,
    name: 'Yes',
    checked: false,
  },
  {
    id: 2,
    name: 'No',
    checked: false,
  },
])

let pageLoading = ref(true)
let tableLoading = ref(false)
let appointmentsError = ref(false)

const downloadOptions = [
  'PDF',
]

const remarks = []

// 👉 TableHeads for  ongoing filter
const ongoingTableHeads = [
  'Patient',
  'Specialist',
  'Medium',
  'Meeting Class',
  'Time Spent',
  '',
]

// 👉 TableHeads for  upcoming filter
const upcomingTableHeads = [
  'Date',
  'Time',
  'Medium',
  'Meeting Class',
  'Patient',
  'Specialist',
  'Remark',
]

// 👉 TableHeads for  canceled filter
const canceledableHeads = [
  'Date',
  'Time',
  'Medium',
  'Meeting Class',
  'Patient',
  'Specialist',
  'Canceled by',
]

// 👉 TableHeads for  completed filter
const completedTableHeads = [
  'Date',
  'Medium',
  'Meeting Class',
  'Patient',
  'Specialist',
  'Start Time',
  'Duration',
  'Intervention',
]


const filterTabs = [
  {
    label: 'Ongoing',
    value: 'ONGOING',
  },
  {
    label: 'Upcoming',
    value: 'UPCOMING',
  },
  {
    label: 'Completed',
    value: 'COMPLETED',
  },
  {
    label: 'Cancelled',
    value: 'CANCELLED',
  },
  {
    label: 'Missed',
    value: 'MISSED',
  },
]

const filteredTab = ref(
  filterTabs[0],
)





// 👉 Fetching appointments
const fetchAppointments = () => {
  tableLoading.value = true
  appointmentsError.value = false
  appointmentStore.fetchAppointments({
    currentPage: currentPage.value,
    status: filteredTab.value.value,
    medium: medium.value,
    meeting_type: meeting.value,
    intervention: intervention.value,
    date: date.value,
    search: searchQuery.value,
  }).then(response => {
    if(response == 'error') {
      pageLoading.value = false
      tableLoading.value = false
      appointmentsError.value = true
    } 
    else {
      appointments.value = response.data.docs
      totalPage.value = response.data.pages
      totalAppointments.value = response.data.total
      rowPerPage.value = response.data.perPage
      pageLoading.value = false
      tableLoading.value = false
      appointmentsError.value = false
    }

    // currentPage.value = response.data.currentPage
  }).catch(error => {
    console.error(error)
    tableLoading.value = false
    appointmentsError.value = true
    pageLoading.value = false
  })
}

// 👉  clear advanced filter fields
const clearAdvanceFilterFields = () => {
  medium.value = ''
  meeting.value = ''
  intervention.value = ''
  date.value = null

  mediumCheckers.value.map(mC => {
    mC.checked = false
  })
  meetingCheckers.value.map(mC => {
    mC.checked = false
  })
  interventionCheckers.value.map(mC => {
    mC.checked = false
  })

  fetchAppointments()
}

const fetchAdvancedFilter = () => {
  currentPage.value = 1
  fetchAppointments()
}

const medium = ref('')
const meeting = ref('')
const intervention = ref('')

// 👉 Usimg checkboxes as radio button
const checkCheckers = (checker, name) => {
  let checking = []
  let checked
  if(checker == 'medium') {
    checking = mediumCheckers
    checked = medium
  }
  else if(checker == 'meeting') {
    checking = meetingCheckers
    checked = meeting
  }
  else if(checker == 'intervention') {
    checking = interventionCheckers
    checked = intervention
  }
  checking.value.map(mC => {
    if(mC.name == name) {
      mC.checked = true
    } else {
      mC.checked = false
    }
  })
  checked.value = name
}


fetchAppointments()

watch(currentPage, () => {
  if(!isTableAdvancedFilterVisible.value) {
    fetchAppointments()
  }
}, { deep: true })

watch(searchQuery, () => {
  fetchAppointments()
}, { deep: true })

watch(filteredTab, newVal => {
  fetchAppointments()
  if(newVal.value == 'ONGOING') {
    currentTableDownloadName.value = 'RC-ongoing-appointments-data'
    currentTableElementId.value = ongoingTableElementId
  }
  else if(newVal.value == 'UPCOMING') {
    currentTableDownloadName.value = 'RC-upcoming-appointments-data'
    currentTableElementId.value = upcomingTableElementId
  }
  else if(newVal.value == 'CANCELLED') {
    currentTableDownloadName.value = 'RC-cancelled-appointments-data'
    currentTableElementId.value = cancelledTableElementId
  }
  else if(newVal.value == 'COMPLETED') {
    currentTableDownloadName.value = 'RC-completed-appointments-data'
    currentTableElementId.value = completedTableElementId
  }
  
}, { deep: true })



// 👉 watching current page
watchEffect(() => {
  if (currentPage.value > totalPage.value)
    currentPage.value = totalPage.value
})

// 👉 Computing pagination data
const paginationData = computed(() => {
  const firstIndex = appointments.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0
  const lastIndex = appointments.value.length + (currentPage.value - 1) * rowPerPage.value
  
  return `${ firstIndex }-${ lastIndex } of ${ totalAppointments.value }`
})

// 👉 Phone number
const phoneNumber = contact => {
  return contact.phone ? contact.phone?.country_code + contact.phone?.number : ''
  
}

const momentizeDate = date => {
  return moment(date).format("DD/MM/YYYY")
}

const momentizeTime = time => {
  return moment.utc(time).format("LT")
}

const goToPatientDetail = (patientId) => {
  router.push(`/patients/${patientId}`)
}

const goToSpecialistDetail = (specialistId) => {
  router.push(`/specialists/${specialistId}`)
}
</script>



<template>
  <section class="appointments-page">
    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">Appointments Overview</h1>
          <p class="hero-subtitle">Monitor and manage all platform consultations</p>
        </div>
        <div class="hero-stats">
          <div class="stat-card live">
            <div class="stat-icon">
              <VIcon icon="bx-broadcast" size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.liveNow }}</span>
              <span class="stat-label">Live Now</span>
            </div>
            <div v-if="stats.liveNow > 0" class="live-indicator"></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <VIcon icon="bx-calendar-check" size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.today }}</span>
              <span class="stat-label">Today</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <VIcon icon="bx-calendar-week" size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.thisWeek }}</span>
              <span class="stat-label">This Week</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <VIcon icon="bx-line-chart" size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
          <div class="stat-card cancellation">
            <div class="stat-icon">
              <VIcon icon="bx-x-circle" size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.cancellationRate }}%</span>
              <span class="stat-label">Cancellation Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <VRow>
      <VCol cols="12">
        <VCardText
          class="d-flex flex-wrap gap-4 mbs-10 filter-section-card"
        >
          <!-- Tabs and Filters -->
          <div class="d-flex w-100 filter-section">
            <div class="mr-auto filter-section-simple-filter simple-filter-container">
              <div class="modern-tabs">
                <button
                  v-for="tab in filterTabs"
                  :key="tab.value"
                  :class="['tab-btn', { active: filteredTab.value === tab.value }]"
                  @click="filteredTab = tab"
                >
                  <span class="tab-label">{{ tab.label }}</span>
                  <span v-if="tabCounts[tab.value]" class="tab-count">{{ tabCounts[tab.value] }}</span>
                </button>
              </div>
            </div>
            <div>
              <div class="search-adv-filter-cover">
                <!-- Search  -->
                <TableSearch
                  v-model:searchQuery="searchQuery"
                />

                <!-- Download button  -->
                <TableDownload
                  :items="downloadOptions"
                  :item-element-id="currentTableElementId"
                  :item-name="currentTableDownloadName"
                />

                <!-- Advance filter button -->
                <VBtn
                  color="#EAEAEA"
                  class="table-filter-btn"
                  @click="isTableAdvancedFilterVisible = true"
                >
                  <VIcon icon="bx-filter-alt" size="18" />
                  &nbsp;
                  <span class="adv-filter-btn-text">Filters</span>
                </VBtn>
              </div>
            </div>
          </div>

          <VSpacer />
        </VCardText>

        <!-- 👉 Table Card -->
        <VCard :loading="tableLoading">
          <div
            v-if="pageLoading"
            style="width:100vw; padding: 100px 0"
          >
            <VLoaderSpinner
              size="30"
              style="margin-left: 42%"
            />
          </div>
          <div
            v-else-if="appointmentsError"
            style="width:100vw; padding: 100px 0"
          >
            <div
              style="margin: 0 auto;
                text-align: center"
            >
              Something went wrong <br> <br>
              <VBtn @click="fetchAppointments">
                Try again
              </VBtn>
            </div>
          </div>
          
          <!-- 👉 Upcoming Table -->
          <TableIndex
            v-else-if="filteredTab.value == 'UPCOMING'"
            :id="upcomingTableElementId"
            :table-data="appointments"
            :table-heads="upcomingTableHeads"
            :show-select-all="false"
          >
            <tr
              v-for="appointment in appointments"
              :key="appointment.id"
            >
              <!-- 👉 Date -->
              <td>
                <div class="d-flex align-center">
                  {{ momentizeDate(appointment.start_time) }}
                </div>
              </td>

              <!-- 👉 Time -->
              <td>
                {{ momentizeTime(appointment.start_time) }}
              </td>

              <!-- 👉 Medium -->
              <td class="text-capitalize text-high-emphasis">
                {{ appointment.meeting_channel || appointment.meeting_type || 'N/A' }}
              </td>

              <!-- 👉 Meeting Class -->
              <td>
                <div class="long-text-ellipsis">
                  {{ appointment.meeting_class }}
                </div>
              </td>

              <!-- 👉 Patient -->
              <td class="sec-color patient-name-link" @click="goToPatientDetail(appointment.patient._id)">
                {{ appointment.patient?.profile?.first_name }} {{ appointment.patient?.profile?.last_name }}
              </td>

              <!-- 👉 Specialist -->
              <td class="sec-color specialist-name-link" @click="goToSpecialistDetail(appointment.specialist._id)">
                {{ appointment.specialist?.profile?.first_name }} {{ appointment.specialist?.profile?.last_name }}
              </td>

              <!-- 👉 Remark -->
              <td>
                <VList :items="appointment.notes" />
              </td>
            </tr>
          </TableIndex>

          <!-- 👉 Canceled Table -->
          <TableIndex
            v-else-if="filteredTab.value == 'CANCELLED'"
            :id="cancelledTableElementId"
            :table-data="appointments"
            :table-heads="canceledableHeads"
            :show-select-all="false"
          >
            <tr
              v-for="appointment in appointments"
              :key="appointment.id"
            >
              <!-- 👉 Date -->
              <td>
                <div class="d-flex align-center">
                  {{ momentizeDate(appointment.start_time) }}
                </div>
              </td>

              <!-- 👉 Time -->
              <td>
                {{ momentizeTime(appointment.start_time) }}
              </td>

              <!-- 👉 Medium -->
              <td class="text-capitalize text-high-emphasis">
                {{ appointment.meeting_channel || appointment.meeting_type || 'N/A' }}
              </td>

              <!-- 👉 Meeting Class -->
              <td>
                <div class="long-text-ellipsis">
                  {{ appointment.meeting_class }}
                </div>
              </td>

              <!-- 👉 Patient -->
              <td class="sec-color patient-name-link" @click="goToPatientDetail(appointment.patient._id)">
                {{ appointment.patient?.profile?.first_name }} {{ appointment.patient?.profile?.last_name }}
              </td>

              <!-- 👉 Specialist -->
              <td class="sec-color specialist-name-link" @click="goToSpecialistDetail(appointment.specialist._id)">
                {{ appointment.specialist?.profile?.first_name }} {{ appointment.specialist?.profile?.last_name }}
              </td>

              <!-- 👉 Canceled by -->
              <td>
                <VList :items="appointment.notes" />
              </td>
            </tr>
          </TableIndex>

          <!-- 👉 Completed Table -->
          <TableIndex
            v-else-if="filteredTab.value == 'COMPLETED'"
            :id="completedTableElementId"
            :table-data="appointments"
            :table-heads="completedTableHeads"
            :show-select-all="false"
          >
            <tr
              v-for="appointment in appointments"
              :key="appointment.id"
            >
              <!-- 👉 Date -->
              <td>
                <div class="d-flex align-center">
                  {{ momentizeDate(appointment.start_time) }}
                </div>
              </td>

              <!-- 👉 Medium -->
              <td class="text-capitalize text-high-emphasis">
                {{ appointment.meeting_channel || appointment.meeting_type || 'N/A' }}
              </td>

              <!-- 👉 Meeting Class -->
              <td>
                <div class="long-text-ellipsis">
                  {{ appointment.meeting_class }}
                </div>
              </td>

              <!-- 👉 Patient -->
              <td class="sec-color patient-name-link" @click="goToPatientDetail(appointment.patient._id)">
                {{ appointment.patient?.profile?.first_name }} {{ appointment.patient?.profile?.last_name }}
              </td>

              <!-- 👉 Specialist -->
              <td class="sec-color specialist-name-link" @click="goToSpecialistDetail(appointment.specialist._id)">
                {{ appointment.specialist?.profile?.first_name }} {{ appointment.specialist?.profile?.last_name }}
              </td>

              <!-- 👉 Start Time -->
              <td>
                {{ momentizeTime(appointment.start_time) }}
              </td>

              <!-- 👉 Duration -->
              <td>
                {{ appointment.call_duration.time_taken + ' ' + appointment.call_duration.unit }}
              </td>

              <!-- 👉 Intervention -->
              <td>
                {{ appointment.specialist.full_name }}
              </td>
            </tr>
          </TableIndex>

          <!-- 👉 Ongoing Table -->
          <TableIndex
            v-else
            :id="ongoingTableElementId"
            :table-data="appointments"
            :table-heads="ongoingTableHeads"
            :show-select-all="false"
          >
            <tr
              v-for="appointment in appointments"
              :key="appointment.id"
            >
              <!-- 👉 Patient -->
              <td>
                <div class="d-flex align-center sec-color patient-name-link" @click="goToPatientDetail(appointment.patient._id)">
                  {{ appointment.patient?.profile?.first_name }} {{ appointment.patient?.profile?.last_name }}
                </div>
              </td>

              <!-- 👉 Specialist -->
              <td class="sec-color specialist-name-link" @click="goToSpecialistDetail(appointment.specialist._id)">
                {{ appointment.specialist?.profile?.first_name }} {{ appointment.specialist?.profile?.last_name }}
              </td>

              <!-- 👉 Medium -->
              <td class="text-capitalize text-high-emphasis">
                {{ appointment.meeting_channel || appointment.meeting_type || 'N/A' }}
              </td>

              <!-- 👉 Meeting Class -->
              <td>
                {{ appointment.meeting_class }}
              </td>

              <!-- 👉 Time Spent -->
              <td>
                {{ appointment.call_duration.time_taken + ' ' + appointment.call_duration.unit }}
              </td>

              <!-- 👉 Intervention -->
              <td />
            </tr>
          </TableIndex>

          <VDivider />
        </VCard>

        <!-- SECTION Pagination -->
        <VCardText class="d-flex flex-wrap gap-4 pa-2">
          <!-- 👉 Pagination and pagination meta -->
          <div class="d-flex align-center mr-auto">
            <h6 class="text-sm font-weight-regular">
              Showing {{ paginationData }} Records
            </h6>
          </div>
          <VPagination
            v-model="currentPage"
            size="small"
            variant="outlined"
            :total-visible="3"
            :length="totalPage"
            @next="selectedRows = []"
            @prev="selectedRows = []"
          />
        </VCardText>
        <!-- !SECTION -->
      </VCol>
    </VRow>

    <!-- 👉 Advanced filter -->
    <TableAdvancedFilter
      v-model:isDrawerOpen="isTableAdvancedFilterVisible"
      :total-items="totalAppointments"
      @clear-fields="clearAdvanceFilterFields"
      @submit-data="fetchAdvancedFilter"
    >
      <VForm>
        <VRow>
          <!-- 👉 Medium -->
          <VCol
            cols="12"
            class="adv-filter-gender-col"
          >
            <div class="adv-filter-label">
              Medium
            </div>
            <div class="adv-filter-divider" />
            <div class="my-2">
              <VCheckbox
                v-for="mediumCheck in mediumCheckers"
                :key="mediumCheck.id"
                v-model="mediumCheck.checked"
                :label="mediumCheck.name"
                @change.prevent="checkCheckers('medium', mediumCheck.name)"
              />
            </div>
          </VCol>

          <!-- 👉 Meeting Class -->
          <VCol
            cols="12"
            class="adv-filter-gender-col"
          >
            <div class="adv-filter-label">
              Meeting Class
            </div>
            <div class="adv-filter-divider" />
            <div class="my-2">
              <VCheckbox
                v-for="meetingCheck in meetingCheckers"
                :key="meetingCheck.id"
                v-model="meetingCheck.checked"
                :label="meetingCheck.name"
                @change.prevent="checkCheckers('meeting', meetingCheck.name)"
              />
            </div>
          </VCol>

          <!-- 👉 Requested Intervention -->
          <VCol
            cols="12"
            class="adv-filter-gender-col"
          >
            <div class="adv-filter-label">
              Requested Intervention
            </div>
            <div class="adv-filter-divider" />
            <div class="my-2">
              <VCheckbox
                v-for="interventionCheck in interventionCheckers"
                :key="interventionCheck.id"
                v-model="interventionCheck.checked"
                :label="interventionCheck.name"
                @change.prevent="checkCheckers('intervention', interventionCheck.name)"
              />
            </div>
          </VCol>

          <!-- 👉 Remark -->
          <VCol cols="12">
            <div class="adv-filter-label">
              Remark
            </div>
            <div class="adv-filter-divider" />
          </VCol>
          <VCol cols="12">
            <VSelect
              :items="remarks"
              label="Select remark category"
              density="compact"
            />
          </VCol>

          <!-- 👉 Date -->
          <VCol cols="12">
            <div class="adv-filter-label">
              Date
            </div>
            <div class="adv-filter-divider" />
          </VCol>
              
          <VCol cols="12">
            <div
              class="position-relative"
            >
              <AppDateTimePicker
                v-model="date"
                label="Date "
                :config="{ altInput: true, altFormat: 'F j, Y', dateFormat: 'Y-m-d' }"
                style="position: absolute;"
                density="compact"
              />
              <span
                class="adv-filter-date-icon"
              ><VIcon icon="bx:calendar" /></span>
            </div>
          </VCol>
        </VRow>
      </VForm>
    </TableAdvancedFilter>
  </section>
</template>

<style scoped>
.appointments-page {
  padding: 0;
}

/* Hero Banner */
.hero-banner {
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: 24px;
  padding: 32px 40px;
  margin-bottom: 24px;
  box-shadow: 0 10px 40px rgba(14, 174, 196, 0.3);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
}

.hero-text {
  flex-shrink: 0;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
}

.hero-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.hero-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 16px 20px;
  border-radius: 12px;
  min-width: 140px;
  position: relative;
  transition: all 0.2s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.stat-card.live {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.stat-card.cancellation .stat-value {
  color: #fbbf24;
}

.live-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.stat-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

/* Modern Tabs */
.modern-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: #f5f5f5;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #e8e8e8;
}

.tab-btn.active {
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
  color: white;
}

.tab-btn.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 8px;
  background: rgba(14, 174, 196, 0.1);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #0EAEC4;
}

/* Enhanced Table Links */
.patient-name-link,
.specialist-name-link {
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
  font-weight: 500;
}

.patient-name-link:hover,
.specialist-name-link:hover {
  color: #0EAEC4 !important;
  text-decoration: underline;
}

/* Health Data Badge */
.health-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.health-badge.has-data {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.health-badge.no-data {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.ongoing {
  background: rgba(14, 174, 196, 0.1);
  color: #0EAEC4;
}

.status-badge.upcoming {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.status-badge.cancelled {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.status-badge.missed {
  background: rgba(249, 115, 22, 0.1);
  color: #ea580c;
}

/* Responsive */
@media (max-width: 1200px) {
  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-stats {
    width: 100%;
  }

  .stat-card {
    flex: 1;
    min-width: calc(50% - 8px);
  }
}

@media (max-width: 768px) {
  .hero-banner {
    padding: 24px 20px;
    border-radius: 16px;
    margin: 0 -16px 24px;
    width: calc(100% + 32px);
  }

  .hero-title {
    font-size: 22px;
  }

  .hero-stats {
    gap: 10px;
  }

  .stat-card {
    min-width: calc(50% - 5px);
    padding: 12px 14px;
  }

  .stat-value {
    font-size: 18px;
  }

  .modern-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .tab-btn {
    padding: 8px 14px;
    font-size: 13px;
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  .hero-banner {
    padding: 20px 16px;
    border-radius: 12px;
  }

  .hero-title {
    font-size: 18px;
  }

  .hero-subtitle {
    font-size: 13px;
  }

  .hero-stats {
    gap: 8px;
  }

  .stat-card {
    min-width: calc(50% - 4px);
    padding: 10px 12px;
  }

  .stat-value {
    font-size: 16px;
  }

  .stat-label {
    font-size: 10px;
  }

  .stat-icon-wrap {
    width: 28px;
    height: 28px;
  }

  .stat-icon-wrap .v-icon {
    font-size: 14px !important;
  }

  .modern-tabs {
    gap: 6px;
    margin-bottom: 16px;
  }

  .tab-btn {
    padding: 6px 12px;
    font-size: 12px;
    border-radius: 16px;
  }

  .tab-count {
    padding: 2px 6px;
    font-size: 10px;
  }
}
</style>


