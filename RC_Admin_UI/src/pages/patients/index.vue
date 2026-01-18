<script setup>
import SimpleFilter from '@/components/Table/SimpleFilter.vue'
import TableAdvancedFilter from '@/components/Table/TableAdvancedFilter.vue'
import TableDownload from '@/components/Table/TableDownload.vue'
import TableIndex from '@/components/Table/TableIndex.vue'
import TableSearch from '@/components/Table/TableSearch.vue'
import { usePatientStore } from '@/stores/patient'
import html2pdf from "html2pdf.js"
import { computed, watchEffect } from 'vue'

const router = useRouter()

const emit = defineEmits([
  'update:isDrawerOpen',
  'userData',
])

const patientStore = usePatientStore()

const searchQuery = ref('')
const rowPerPage = ref(0)
const currentPage = ref(1)
const totalPage = ref(1)
const totalPatients = ref(0)
const patientsData = ref({})
const patients = ref(patientStore?.patients)
const isTableAdvancedFilterVisible = ref(false)
const date = ref(null)
const plans = ref([])
const planCheckers = ref([])
const plan = ref('')
const moreButtonAction = ref('')
const moreId = ref('')
let pageLoading = ref(true)
let tableLoading = ref(false)
let patientsError = ref(false)
let statusUpdateError = ref(false)
const patientTableElementId = 'rc-patients-table'
const patientTableDownloadName = 'RC-patients-data'

const downloadOptions = [
  'PDF',
]


const tableHeads = [
  'Fullname',
  'Gender',
  'Phone Number',
  'Email',
  'Dependents',
  'Plan',
  'Status',
  '',
]

const filterTabs = [
  {
    label: 'All',
    value: 'All',
  },
  {
    label: 'Active',
    value: 'Active',
  },
  {
    label: 'Suspended',
    value: 'Suspended',
  },
  {
    label: 'Inactive',
    value: 'Inactive',
  },
  {
    label: 'Canceled',
    value: 'Canceled',
  },
]

const currentStatus = ref(
  filterTabs[0],
)

const dependant = ref({
  min: 0,
  max: 0,
})

// 👉 Gender
let gender = ref('')
let female = ref(false)
let male = ref(false)


watch(male, value => {
  if (male.value) {
    gender.value = 'Male'
    female.value = false
  } 
  else if(!male.value && !female.value) {
    gender.value = ''
  } 
}, { deep: true })

watch(female, value => {
  if (female.value) {
    gender.value = 'Female'
    male.value = false
  } 
  else if(!male.value && !female.value) {
    gender.value = ''
  } 
}, { deep: true })


watch(currentPage, () => {
  if(!isTableAdvancedFilterVisible.value) {
    fetchPatients()
  }
}, { deep: true })

watch(searchQuery, () => {
  fetchPatients()
}, { deep: true })

watch(currentStatus, () => {
  fetchPatients()
}, { deep: true })


// SECTION Checkbox toggle
const selectedRows = ref([])
const selectAllUser = ref(false)

// 👉 watch if checkbox array is empty all select should be uncheck
watch(selectedRows, () => {
  if (!selectedRows.value.length)
    selectAllUser.value = false
}, { deep: true })

// 👉 watch when a value from More dropdown is selected
watch(moreButtonAction, () => {
  if(moreButtonAction.value.value == 'suspend') {
    updatePatientStatus(moreId.value, 'Suspended') 
  }
  else if(moreButtonAction.value.value == 'reactivate') {
    updatePatientStatus(moreId.value, 'Active') 
  }
  else if(moreButtonAction.value.value == 'view') {
    console.log('Navigating to patient:', moreId.value)
    router.push(`/patients/${moreId.value}`) 
  }
})

// 👉 watching current page
watchEffect(() => {
  if (currentPage.value > totalPage.value)
    currentPage.value = totalPage.value
})



// 👉 Countries and states
const countries = ref([])
const contryLabels = ref([])
const country = ref(null)
const filterCountry = ref(null)
const state = ref('')

const selectedCountry = computed( {
  get() {
    return country.value?.country
  },
  set(value) {
    filterCountry.value = value
    country.value = countries.value.find(country => country.country == value)
  },
})

const computedMoreList = status => {
  let list = [
    {
      title: 'View Account',
      value: 'view',
    },
  ]
  if(status == 'Active') {
    list[1] = {
      title: 'Suspend Account',
      value: 'suspend',
    }
  }
  else if(status == 'Suspended') {
    list[1] = {
      title: 'Reactivate Account',
      value: 'reactivate',
    }
  }

  return list
}



// 👉 Fetching patients
const fetchPatients = () => {
  tableLoading.value = true
  patientsError.value = false
  patientStore.fetchPatients({
    currentPage: currentPage.value,
    status: currentStatus.value.value,
    gender: gender.value,
    country: filterCountry.value,
    state: state.value,
    minDependant: dependant.value.min,
    maxDependant: dependant.value.max,
    dateReg: date.value,
    plan: plan.value,
    search: searchQuery.value,
  }).then(response => {
    if(response == 'error') {
      pageLoading.value = false
      tableLoading.value = false
      patientsError.value = true
    } 
    else {
      patientsData.value = response
      patients.value = response.data.docs
      totalPage.value = response.data.pages
      totalPatients.value = response.data.total
      rowPerPage.value = response.data.perPage
      pageLoading.value = false
      tableLoading.value = false
      patientsError.value = false
    }

    // currentPage.value = response.data.currentPage
  }).catch(error => {
    console.error(error)
    tableLoading.value = false
    patientsError.value = true
    pageLoading.value = false
  })
}

// 👉 Updating patient status
const updatePatientStatus = (id, status) => {
  let data = {
    id,
    status,
  }
  tableLoading.value = true
  statusUpdateError.value = false
  patientStore.updatePatientStatus(data)
    .then(response => {
      if(response == 'error') {
        tableLoading.value = false
        statusUpdateError.value = true
      } 
      else {
        patients.value.map(patient => {
          if(patient._id == id) {
            patient.status = status
          }
        })
        tableLoading.value = false
        statusUpdateError.value = false
      }

    // currentPage.value = response.data.currentPage
    }).catch(error => {
      console.error(error)
      tableLoading.value = false
      statusUpdateError.value = true
    })
}

// 👉 Fetching patients' countries
const fetchPatientsCountries = () => {
  patientStore.fetchCountries().then(response => {
    countries.value = response
    countries.value.map(country => {
      contryLabels.value.push(country.country)
    })
  }).catch(error => {
    console.error(error)
  })
}

// 👉 Fetching plans
const fetchPlans = () => {
  patientStore.fetchPlans().then(response => {
    plans.value = response
    plans.value.map(plan => {
      planCheckers.value.push({
        id: plan._id,
        name: plan.name,
        checked: false,
      })
    })
  }).catch(error => {
    console.error(error)
  })
}

const fetchAdvancedFilter = () => {
  currentPage.value = 1
  fetchPatients()
}


// 👉 selecting plan
const checkPlan = id => {
  planCheckers.value.map(pC => {
    if(pC.id == id) {
      pC.checked = true
    } else {
      pC.checked = false
    }
  })
  plan.value = id
}


fetchPatients()
fetchPatientsCountries()
fetchPlans()



// watch(selectedRows, () => {
//   if (!selectedRows.value.length)
//     selectAllUser.value = false
// }, { deep: true })



// 👉  clear advanced filter fields
const clearAdvanceFilterFields = () => {
  gender.value = ''
  male.value = false
  female.value = false
  country.value = null
  filterCountry.value = ''
  state.value = ''
  dependant.value.min = 0
  dependant.value.max = 0
  date.value = null
  plan.value = ''

  planCheckers.value.map(pC => {
    pC.checked = false
  })

  fetchPatients()
}

const addRemoveIndividualCheckbox = checkID => {
  if (selectedRows.value.includes(checkID)) {
    const index = selectedRows.value.indexOf(checkID)

    selectedRows.value.splice(index, 1)
  } else {
    selectedRows.value.push(checkID)
    selectAllInvoice.value = true
  }
}


const resolveUserStatusVariant = stat => {
  const statLowerCase = stat.toLowerCase()
  if (statLowerCase === 'pending')
    return 'warning'
  if (statLowerCase === 'active')
    return 'success'
  if (statLowerCase === 'inactive')
    return 'secondary'
  
  return 'primary'
}


// 👉 Computing pagination data
const paginationData = computed(() => {
  const firstIndex = patients.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0
  const lastIndex = patients.value.length + (currentPage.value - 1) * rowPerPage.value
  
  return `${ firstIndex }-${ lastIndex } of ${ totalPatients.value }`
})

// 👉 Phone number
const phoneNumber = contact => {
  return contact.phone ? contact.phone?.country_code + contact.phone?.number : ''
  
}
</script>



<template>
  <section>
    <VRow>
      <VCol cols="12">
        <h2
          class="head-title text-h6 mbs-20"
        >
          Patients
        </h2>
        <VCardText
          class="d-flex flex-wrap gap-4 mbs-10 filter-section-card"
        >
          <!-- 👉 simple filter -->

          <div class="d-flex w-100 filter-section" >
            <div class="mr-auto filter-section-simple-filter simple-filter-container">
              <SimpleFilter
                v-model:selectabledTab="currentStatus" 
                :tabs="filterTabs"
                :default-tab="currentStatus"
                style="max-width: 100%;"
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
                  :item-element-id="patientTableElementId"
                  :item-name="patientTableDownloadName"
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
        <VCard :loading="tableLoading">
          <div
            v-if="pageLoading"
            style="inline-size:100vw; padding-block: 100px; padding-inline: 0"
          >
            <VLoaderSpinner
              size="30"
              style="margin-block: 0;margin-left: 42%"
            />
          </div>
          <div
            v-else-if="patientsError"
            style="inline-size:100vw; padding-block: 100px; padding-inline: 0"
          >
            <div
              style="margin-block: 0;
                margin-inline: auto;
                text-align: center"
            >
              Something went wrong <br> <br>
              <VBtn @click="fetchPatients">
                Try again
              </VBtn>
            </div>
          </div>
          <TableIndex
            v-else
            :id="patientTableElementId"
            :table-data="patients"
            :table-heads="tableHeads"
            :show-select-all="false"
          >
            <tr
              v-for="patient in patients"
              :key="patient.id"
            >
              <!-- 👉 Checkbox -->
              <!--
                <td>
                <VCheckbox
                :id="`check${patient.id}`"
                :model-value="selectedRows.includes(`check${patient.id}`)"
                class="mx-1"
                @click="addRemoveIndividualCheckbox(`check${patient.id}`)"
                />
                </td> 
              -->

              <!-- 👉 Full name -->
              <td>
                <div class="d-flex align-center">
                  {{ patient.profile.first_name + ' ' + patient.profile?.last_name }}
                </div>
              </td>

              <!-- 👉 Gender -->
              <td>
                {{ patient.profile.gender }}
              </td>

              <!-- 👉 Phone number -->
              <td class="text-capitalize text-high-emphasis">
                {{ phoneNumber(patient.profile.contact) }}
              </td>

              <!-- 👉 Email -->
              <td>
                <div class="long-text-ellipsis sec-color">
                  {{ patient.profile.contact?.email }}
                </div>
              </td>

              <!-- 👉 Dependents -->
              <td>
                {{ patient.dependants.length }}
              </td>

              <!-- 👉 Plan -->
              <td>
                {{ patient.plan?.plan_name }}
              </td>

              <!-- 👉 Status -->
              <td>
                <VChip
                  :color="resolveUserStatusVariant(patient.status)"
                  density="compact"
                  label
                  class="text-uppercase"
                >
                  {{ patient.status }}
                </VChip> 
              </td>

              <!-- 👉 Actions -->
              <td
                class="text-center"
                style="inline-size: 80px;"
              >
                <MoreBtn
                  v-model:selectedList="moreButtonAction"
                  :menu-list="computedMoreList(patient.status)"
                  item-props
                  @click.prevent="moreId = patient._id"
                />
              </td>
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
      :total-items="totalPatients"
      @user-data="addNewUser"
      @clear-fields="clearAdvanceFilterFields"
      @submit-data="fetchAdvancedFilter"
    >
      <VForm>
        <VRow>
          <!-- 👉 Gender -->
          <VCol
            cols="12"
            class="adv-filter-gender-col"
          >
            <div class="adv-filter-label">
              Gender
            </div>
            <div class="adv-filter-divider" />
            <div class="my-3">
              <VCheckbox
                v-model="male"
                label="Male"
              />
              <VCheckbox
                v-model="female"
                label="Female"
              />
            </div>
          </VCol>

          <!-- 👉 Location -->
          <VCol cols="12">
            <div class="adv-filter-label">
              Location
            </div>
            <div class="adv-filter-divider" />
          </VCol>
          <!-- Country -->
          <VCol cols="12">
            <VCombobox
              v-model="selectedCountry"
              label="Country"
              :items="contryLabels"
              density="compact"
            />
          </VCol>
          <VCol cols="12">
            <VCombobox
              v-if="country"
              v-model="state"
              label="State"
              :items="country.states"
              density="compact"
            />
          </VCol>

          <!-- 👉 Dependants -->
          <VCol cols="12">
            <div class="adv-filter-label">
              Number of Dependants
            </div>
            <div class="adv-filter-divider" />
          </VCol>
          <VCol cols="5.5">
            <VTextField
              v-model="dependant.min"
              type="number"
              :rules="[requiredValidator]"
              label="Min"
              min="0"
              density="compact"
            />
          </VCol>
          <VCol
            cols="1"
            class="text-center position-relative"
          >
            <span
              class="adv-filter-dependents-mid-minus"
            >-</span>
          </VCol>
          <VCol cols="5.5">
            <VTextField
              v-model="dependant.max"
              type="number"
              :rules="[requiredValidator]"
              label="Max"
              :min="dependant.min"
              density="compact"
            />
          </VCol>

          <!-- 👉 Date -->
          <VCol cols="12">
            <div class="adv-filter-label">
              Registration Date
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

          <!-- 👉 Plan -->
          <VCol cols="12">
            <div class="adv-filter-label">
              Plan
            </div>
            <div class="adv-filter-divider" />
            <div class="my-2">
              <VCheckbox
                v-for="planCheck in planCheckers"
                :key="planCheck.id"
                v-model="planCheck.checked"
                :label="planCheck.name"
                @change.prevent="checkPlan(planCheck.id)"
              />
            </div>
          </VCol>
        </VRow>
      </VForm>
    </TableAdvancedFilter>
  </section>
</template>
