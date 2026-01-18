<script setup>
import SimpleFilter from '@/components/Table/SimpleFilter.vue'
import TableAdvancedFilter from '@/components/Table/TableAdvancedFilter.vue'
import TableDownload from '@/components/Table/TableDownload.vue'
import TableIndex from '@/components/Table/TableIndex.vue'
import TableSearch from '@/components/Table/TableSearch.vue'
import { useSpecialistStore } from '@/stores/specialist'
import { useUserListStore } from '@/views/apps/user/useUserListStore'
import html2pdf from "html2pdf.js"
import { computed } from "vue"


const emit = defineEmits([
  'update:isDrawerOpen',
  'userData',
])

const specialistStore = useSpecialistStore()

const router = useRouter()
const userListStore = useUserListStore()
const searchQuery = ref('')
const rowPerPage = ref(0)
const currentPage = ref(1)
const totalPage = ref(1)
const specialists = ref([])
const isTableAdvancedFilterVisible = ref(false)
const specialistsData = ref({})
const totalSpecialists = ref(0)
const date = ref(null)
const moreButtonAction = ref('')
const moreId = ref('')

// const plans = ref([])
// const planCheckers = ref([])
// const plan = ref()
let pageLoading = ref(true)
let tableLoading = ref(false)
let specialistsError = ref(false)
let statusUpdateError = ref(false)

const downloadOptions = [
  'PDF',
]

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

const computedMoreList = computed(() => {
  return status => {
    let list = [
      {
        title: 'View Specialist',
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
})


const tableHeads = [
  'Fullname',
  'Gender',
  'Practice Category',
  'License No.',
  'Phone No.',
  'Email',
  'Verification Status',
]

const filterTabs = [
  {
    label: 'All',
    value: 'all',
  },
  {
    label: 'Verified',
    value: 'verified',
  },
  {
    label: 'Unverified',
    value: 'unverified',
  },
  {
    label: 'Suspended',
    value: 'suspended',
  },
  
]

const currentStatus = ref(
  filterTabs[0],
)

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

// 👉 watch when a value from More dropdown is selected
watch(moreButtonAction, () => {
  if(moreButtonAction.value.value == 'suspend') {
    updatespecialistStatus(moreId.value, 'Suspended')
  }
  else if(moreButtonAction.value.value == 'reactivate') {
    updatespecialistStatus(moreId.value, 'Active')
  }
  else if(moreButtonAction.value.value == 'view') {
    console.log('Navigating to specialist:', moreId.value)
    router.push(`/specialists/${moreId.value}`)
  }
})

// 👉 Practice Category
let practice_category = ref('')
let generalPractitioner = ref(false)
let pharmacist = ref(false)

// 👉 Practice Category
let verificationStatus = ref('')
let verifiedStatus = ref(false)
let unverifiedStatus = ref(false)
let suspendedStatus = ref(false)




watch(generalPractitioner, value => {
  if (generalPractitioner.value) {
    practice_category.value = 'General Practitioner'
    pharmacist.value = false
  } 
  else if(!generalPractitioner.value && !pharmacist.value) {
    practice_category.value = ''
  } 
}, { deep: true })

watch(pharmacist, value => {
  if (pharmacist.value) {
    practice_category.value = 'Pharmacist'
    generalPractitioner.value = false
  } 
  else if(!generalPractitioner.value && !pharmacist.value) {
    practice_category.value = ''
  } 
}, { deep: true })

watch(verifiedStatus, value => {
  if (verifiedStatus.value) {
    verificationStatus.value = 'Verified'
    unverifiedStatus.value = false
    suspendedStatus.value = false
  } 
  else if(!verifiedStatus.value && !unverifiedStatus.value && !suspendedStatus.value) {
    verificationStatus.value = ''
  } 
}, { deep: true })

watch(unverifiedStatus, value => {
  if (unverifiedStatus.value) {
    verificationStatus.value = 'Unverified'
    verifiedStatus.value = false
    suspendedStatus.value = false
  } 
  else if(!verifiedStatus.value && !unverifiedStatus.value && !suspendedStatus.value) {
    verificationStatus.value = ''
  } 
}, { deep: true })

watch(suspendedStatus, value => {
  if (suspendedStatus.value) {
    verificationStatus.value = 'Suspended'
    verifiedStatus.value = false
    unverifiedStatus.value = false
  } 
  else if(!verifiedStatus.value && !unverifiedStatus.value && !suspendedStatus.value) {
    verificationStatus.value = ''
  } 
}, { deep: true })


// 👉 Updating specialist status
const updatespecialistStatus = (id, status) => {
  let data = {
    id,
    status,
  }
  tableLoading.value = true
  statusUpdateError.value = false
  specialistStore.updateSpecialistStatus(data)
    .then(response => {
      if(response == 'error') {
        tableLoading.value = false
        statusUpdateError.value = true
      } 
      else {
        specialists.value.map(specialist => {
          if(specialist._id == id) {
            specialist.status = status
          }
        })
        tableLoading.value = false
        statusUpdateError.value = false
      }
    }).catch(error => {
      console.error(error)
      tableLoading.value = false
      statusUpdateError.value = true
    })
}



// 👉 Fetching Specialists
const fetchSpecialists = () => {
  tableLoading.value = true
  specialistsError.value = false
  specialistStore.fetchSpecialists({ 
    currentPage: currentPage.value,

    // status: currentStatus.value.value,
    status: "Active",
    gender: gender.value,
    country: filterCountry.value,
    state: state.value,
    category:  practice_category.value,
    dateReg: date.value,
    search: searchQuery.value, 
  }).then(response => { if(response == 'error') {
    pageLoading.value = false
    tableLoading.value = false
    specialistsError.value = true
  } 
  else {
    specialistsData.value = response
    specialists.value = response.data.docs
    totalPage.value = response.data.pages
    totalSpecialists.value = response.data.total
    rowPerPage.value = response.data.perPage
    pageLoading.value = false
    tableLoading.value = false
    specialistsError.value = false}
  }).catch(error => {
    console.error(error)
    tableLoading.value = false
    specialistsError.value = true
    pageLoading.value = false
  })
}

// 👉 Fetching countries
const fetchCountries = () => {
  specialistStore.fetchCountries().then(response => {
    countries.value = response
    countries.value.map(country => {
      contryLabels.value.push(country.country)
    })
  }).catch(error => {
    console.error(error)
  })
}

console.log(contryLabels.value )

fetchSpecialists()
fetchCountries()



watch(currentPage, () => {
  if(!isTableAdvancedFilterVisible.value) {
    fetchSpecialists()
  }
}, { deep: true })

watch(searchQuery, () => {
  fetchSpecialists()
}, { deep: true })

watch(currentStatus, () => {
  fetchSpecialists()
}, { deep: true })


const fetchAdvancedFilter = () => {
  currentPage.value = 1
  fetchSpecialists()
}


// 👉  clear advanced filter fields
const clearAdvanceFilterFields = () => {
  gender.value = ''
  male.value = false
  female.value = false
  generalPractitioner.value = false
  pharmacist.value = false
  country.value = null
  filterCountry.value = ''
  state.value = ''
  date.value = null
  practice_category.value = ''
  verificationStatus.value = ''
  verifiedStatus.value = false
  unverifiedStatus.value = false
  suspendedStatus.value = false
  fetchSpecialists()
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

// 👉 export to pdf
const exportToPDF = () => {
  html2pdf(document.getElementById("specialists-table"), {
    margin: 1,
    filename: "specialists-data.pdf",
  })
}

//👉 watching current page
watchEffect(() => {
  if (currentPage.value > totalPage.value)
    currentPage.value = totalPage.value
})




// 👉 Computing pagination data
const paginationData = computed(() => {
  const firstIndex = specialists.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0
  const lastIndex = specialists.value.length + (currentPage.value - 1) * rowPerPage.value
  
  return `${ firstIndex }-${ lastIndex } of ${ totalSpecialists.value }`
})
</script>



<template>
  <section>
    <VRow>
      <VCol cols="12">
        <h2
          class="head-title text-h6 mbs-20"
        >
          Specialists
        </h2>
        <VCardText
          class="d-flex flex-wrap gap-4 mbs-10 filter-section-card"
        >
          <!-- 👉 simple filter -->

          <div class="d-flex w-100 filter-section filter-section-simple-filter">
            <div class="me-auto simple-filter-container" style="margin-bottom: 20px">
              <SimpleFilter
                v-model:selectabledTab="currentStatus" 
                :tabs="filterTabs"
                :default-tab="currentStatus"
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
                  @download="exportToPDF"
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
            v-else-if="specialistsError"
            style="inline-size:100vw; padding-block: 100px; padding-inline: 0"
          >
            <div
              style="margin-block: 0;
                margin-inline: auto;
                text-align: center"
            >
              Something went wrong <br> <br>
              <VBtn @click="fetchSpecialists">
                Try again
              </VBtn>
            </div>
          </div>
          <TableIndex
            v-else
            id="specialists-table" 
            :table-data="specialists"
            :table-heads="tableHeads"
            :show-select-all="false"
          >
            <tr
              v-for="specialist in specialists"
              :key="specialist.id"
            >
              <!-- 👉 Checkbox -->
              <!-- 
                <td>
                <VCheckbox
                :id="`check${specialist.id}`"
                :model-value="selectedRows.includes(`check${specialist.id}`)"
                class="mx-1"
                />
                </td> 
              -->

              <!-- 👉 Full name -->
              <td>
                <div class="d-flex align-center">
                  {{ specialist.profile.first_name + ' ' + specialist.profile.last_name }}
                </div>
              </td>

              <!-- 👉 Gender -->
              <td>
                {{ specialist.profile.gender ? specialist.profile.gender : "Female" }}
              </td>

              <!-- 👉 Practice  Category -->
              <td>
                {{ specialist.professional_practice?.category }}
              </td>

              <!-- 👉 License No -->
              <td>
                {{ specialist.professional_practice?.license_number }}
              </td>

              <!-- 👉 Phone number -->
              <td class="text-capitalize text-high-emphasis">
                {{ specialist.profile.contact.phone ? specialist.profile.contact.phone.country_code + specialist.profile.contact.phone.number : 
                  "" }}
              </td>

              <!-- 👉 Email -->
              <td style="color: #008C99;">
                <div class="long-text-ellipsis">
                  {{ specialist.profile.contact.email.length > 16 ? specialist.profile.contact.email.substring(0, 13) + "..." : specialist.profile.contact.email }}
                </div>
              </td>

              <!-- 👉 Status -->
              <td>
                <VChip
                  :color="resolveUserStatusVariant(specialist.status)"
                  density="compact"
                  label
                  class="text-uppercase"
                >
                  {{ specialist.status }}
                </VChip> 
              </td>

              <!-- 👉 Actions -->
              <td
                class="text-center"
                style="inline-size: 80px;"
              >
                <MoreBtn
                  v-model:selectedList="moreButtonAction"
                  :menu-list="computedMoreList(specialist.status)"
                  item-props
                  @click.prevent="moreId = specialist._id"
                />
              </td>
            </tr>
          </TableIndex>

          <VDivider />
        </VCard>

        <!-- SECTION Pagination -->
        <VCardText class="d-flex flex-wrap gap-4 pa-2">
          <!-- 👉 Pagination and pagination meta -->
          <div class="d-flex align-center me-auto">
            <h6 class="text-sm font-weight-regular">
              Showing {{ paginationData }} Records
            </h6>
          </div>
          <VPagination
            v-model="currentPage"
            size="small"
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
      :total-items="totalSpecialists"
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
          <VCol
            cols="12"
            class="adv-filter-gender-col"
          >
            <div class="adv-filter-label">
              Practice Category
            </div>
            <div class="adv-filter-divider" />
            <div class="my-3">
              <VCheckbox
                v-model="generalPractitioner"
                label="General Practitioner"
              />
              <VCheckbox
                v-model="pharmacist"
                label="Pharmacist"
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

          <!-- 👉 Status -->
          <VCol cols="12">
            <div class="adv-filter-label">
              Status
            </div>
            <div class="adv-filter-divider" />
            <div class="my-2">
              <VCheckbox
                v-model="verifiedStatus"
                label="Verified"
              />
              <VCheckbox
                v-model="unverifiedStatus"
                label="Unverified"
              />
              <VCheckbox
                v-model="suspendedStatus"
                label="Suspended"
              />
            </div>
          </VCol>
        </VRow>
      </VForm>
    </TableAdvancedFilter>
  </section>
</template>
