<script setup>
import SimpleFilter from '@/components/Table/SimpleFilter.vue'
import TableAdvancedFilter from '@/components/Table/TableAdvancedFilter.vue'
import TableDownload from '@/components/Table/TableDownload.vue'
import TableIndex from '@/components/Table/TableIndex.vue'
import TableSearch from '@/components/Table/TableSearch.vue'
import { useAppointmentStore } from '@/stores/appointment'
import { computed } from 'vue'
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
  <section>
    <VRow>
      <VCol cols="12">
        <h2
          class="head-title text-h6 mbs-20"
        >
          Appointments
        </h2>
        <VCardText
          class="d-flex flex-wrap gap-4 mbs-10 filter-section-card"
        >
          <!-- 👉 simple filter -->

          <div class="d-flex w-100 filter-section">
            <div class="mr-auto filter-section-simple-filter simple-filter-container">
              <SimpleFilter
                v-model:selectabledTab="filteredTab" 
                :tabs="filterTabs"
                :default-tab="filteredTab"
              />
            </div>
            <div>
              <div
                class="search-adv-filter-cover"
              >
                <!-- 👉 Search  -->
                <TableSearch 
                  v-model:searchQuery="searchQuery" 
                />

                <!-- 👉 Download button  -->
                <TableDownload
                  :items="downloadOptions"
                  :item-element-id="currentTableElementId"
                  :item-name="currentTableDownloadName"
                />
                
                <!-- 👉 Advance fliter button -->
                <VBtn
                  color="#EAEAEA"
                  class="table-filter-btn"
                  @click="isTableAdvancedFilterVisible = true"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M2.5 13C1.11929 13 0 14.1193 0 15.5C0 16.8807 1.11929 18 2.5 18C3.70948 18 4.71836 17.1411 4.94999 16H17.4615C17.7589 16 18 15.7761 18 15.5C18 15.2239 17.7589 15 17.4615 15H4.94999C4.71836 13.8589 3.70948 13 2.5 13ZM4 15.5C4 14.6715 3.32843 14 2.5 14C1.67157 14 1 14.6715 1 15.5C1 16.3285 1.67157 17 2.5 17C3.32843 17 4 16.3285 4 15.5Z"
                      fill="#151515"
                    />
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M13.05 10H0.538462C0.241077 10 0 9.77614 0 9.5C0 9.22386 0.241077 9 0.538462 9H13.05C13.2816 7.85886 14.2905 7 15.5 7C16.8807 7 18 8.11926 18 9.5C18 10.8807 16.8807 12 15.5 12C14.2905 12 13.2816 11.1411 13.05 10ZM14 9.5C14 10.3285 14.6715 11 15.5 11C16.3285 11 17 10.3285 17 9.5C17 8.67154 16.3285 8 15.5 8C14.6715 8 14 8.67154 14 9.5Z"
                      fill="#151515"
                    />
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M6.05001 3H0.5C0.223858 3 0 2.77614 0 2.5C0 2.22386 0.223858 2 0.5 2H6.05001C6.28164 0.858883 7.29049 0 8.5 0C9.70951 0 10.7184 0.858883 10.95 2H17.4286C17.7442 2 18 2.22386 18 2.5C18 2.77614 17.7442 3 17.4286 3H10.95C10.7184 4.14112 9.70951 5 8.5 5C7.29049 5 6.28164 4.14112 6.05001 3ZM10 2.5C10 1.67157 9.32845 1 8.5 1C7.67155 1 7 1.67157 7 2.5C7 3.32843 7.67155 4 8.5 4C9.32845 4 10 3.32843 10 2.5Z"
                      fill="#151515"
                    />
                  </svg>
                  &nbsp;
                  <span class="adv-filter-btn-text">Advanced Filter</span>
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
.patient-name-link,
.specialist-name-link {
  cursor: pointer;
  transition: all 0.2s;
}

.patient-name-link:hover,
.specialist-name-link:hover {
  color: #1976d2 !important;
  text-decoration: underline;
}
</style>


