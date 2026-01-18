<script setup>
import SimpleFilter from '@/components/Table/SimpleFilter.vue'
import TableIndex from '@/components/Table/TableIndex.vue'
import TableSearch from '@/components/Table/TableSearch.vue'
import { useLifeguardStore } from '@/stores/lifeguard'
import { computed, watchEffect } from 'vue'

const router = useRouter()

const lifeguardStore = useLifeguardStore()

const searchQuery = ref('')
const rowPerPage = ref(0)
const currentPage = ref(1)
const totalPage = ref(1)
const totalLifeguards = ref(0)
const lifeguards = ref(lifeguardStore?.lifeguards)
let pageLoading = ref(true)
let tableLoading = ref(false)
let lifeguardsError = ref(false)
const lifeguardTableElementId = 'rc-lifeguard-table'



const tableHeads = [
  'ID',
  'Name',
  'Gender',
  'Contact',
  'Total Donations',
  'Beneficiaries',
  'Status',
]

const filterTabs = [
  {
    label: 'All',
    value: 'All',
  },
  {
    label: 'Suspended',
    value: 'Suspended',
  },
  {
    label: 'Active',
    value: 'Active',
  },
]

const currentStatus = ref(
  filterTabs[0],
)

watch(currentPage, () => {
  fetchLifeguards()
}, { deep: true })

watch(searchQuery, () => {
  fetchLifeguards()
}, { deep: true })

watch(currentStatus, () => {
  fetchLifeguards()
}, { deep: true })


// SECTION Checkbox toggle
const selectedRows = ref([])


// 👉 watching current page
watchEffect(() => {
  if (currentPage.value > totalPage.value)
    currentPage.value = totalPage.value
})



// 👉 Fetching lifeguards
const fetchLifeguards = () => {
  tableLoading.value = true
  lifeguardsError.value = false
  lifeguardStore.fetchLifeguards({
    currentPage: currentPage.value,
    status: currentStatus.value.value,
  }).then(response => {
    console.log(response)
    if(response == 'error') {
      pageLoading.value = false
      tableLoading.value = false
      lifeguardsError.value = true
    } 
    else {
      lifeguards.value = response.data.docs
      totalPage.value = response.data.pages
      totalLifeguards.value = response.data.total
      rowPerPage.value = response.data.perPage
      pageLoading.value = false
      tableLoading.value = false
      lifeguardsError.value = false
    }

    // currentPage.value = response.data.currentPage
  }).catch(error => {
    console.error(error)
    tableLoading.value = false
    lifeguardsError.value = true
    pageLoading.value = false
  })
}

fetchLifeguards()

const totalDonation = donations => {
  return donations.reduce((accumulator, currentValue) => {
    return accumulator + parseInt(currentValue.amount_donated)
  },0)
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
  const firstIndex = lifeguards.value.length ? (currentPage.value - 1) * rowPerPage.value + 1 : 0
  const lastIndex = lifeguards.value.length + (currentPage.value - 1) * rowPerPage.value
  
  return `${ firstIndex }-${ lastIndex } of ${ totalLifeguards.value }`
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
          LifeGuards
        </h2>
        <VCardText
          class="d-flex flex-wrap gap-4 mbs-10 filter-section-card"
        >
          <!-- 👉 simple filter -->

          <div class="d-flex w-100 filter-section">
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
            v-else-if="lifeguardsError"
            style="inline-size:100vw; padding-block: 100px; padding-inline: 0"
          >
            <div
              style="margin-block: 0;
                margin-inline: auto;
                text-align: center"
            >
              Something went wrong <br> <br>
              <VBtn @click="fetchLifeguards">
                Try again
              </VBtn>
            </div>
          </div>
          <TableIndex
            v-else
            :id="lifeguardTableElementId"
            :table-data="lifeguards"
            :table-heads="tableHeads"
            :show-select-all="false"
          >
            <tr
              v-for="lifeguard in lifeguards"
              :key="lifeguard.id"
            >
              <!-- 👉 ID -->
              <td>
                <div class="d-flex align-center">
                  {{ lifeguard.email }}
                </div>
              </td>

              <!-- 👉 Full name -->
              <td>
                <div class="d-flex align-center">
                  {{ lifeguard.first_name + ' ' + lifeguard?.last_name }}
                </div>
              </td>

              <!-- 👉 Gender -->
              <td class="text-capitalize text-high-emphasis" />

              <!-- 👉 Contact -->
              <td>
                {{ lifeguard.phone.country_code }}
                {{ lifeguard.phone.number }}
                <div class="long-text-ellipsis sec-color">
                  {{ lifeguard?.email }}
                </div>
              </td>

              <!-- 👉 Total Donations -->
              <td>
                {{ totalDonation(lifeguard.preferences) }}
              </td>

              <!-- 👉 Beneficiaries -->
              <td>
                {{ lifeguard.plan?.plan_name }}
              </td>

              <!-- 👉 Status -->
              <td>
                <VChip
                  :color="resolveUserStatusVariant(lifeguard.status)"
                  density="compact"
                  label
                  class="text-uppercase"
                >
                  {{ lifeguard.status }}
                </VChip> 
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
  </section>
</template>
