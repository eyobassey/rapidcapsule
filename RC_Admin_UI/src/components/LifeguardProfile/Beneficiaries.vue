
<script setup>
import TableIndex from '@/components/Table/TableIndex.vue'
import SimpleFilter from '@/components/Table/SimpleFilter.vue'
import moment from 'moment'
import { watch } from 'vue'

const props = defineProps({
  beneficiaries: {
    type: Array,
    required: true,
  },
})

const filteredAbeneficiaries = ref([])

const beneficiaryTableHeads = [
  'Name',
  'Age',
  'Gender',
  'Condition',
  'Treatment',
  'Total Cost',
  'Status',
]

const filterTabs = [
  {
    label: 'All',
    value: 'All',
  },
  {
    label: 'Completed',
    value: 'Completed',
  },
  {
    label: 'In-progress',
    value: 'In-progress',
  },
  {
    label: 'Next in line',
    value: 'Next in line',
  },
]

const seletedFilterTab = ref(
  filterTabs[0],
)

watch(seletedFilterTab, value => {
  if(value == 'All') {
    filteredBeneficiaries.value = props.beneficiaries
  } else {
    filterByStatus()
  }
}, 
{ deep: true },
{ immediate: true },
)


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
  filteredBeneficiaries.value = props.beneficiaries.filter(propBeneficiary => propBeneficiary.status == seletedFilterTab.value.value)
}

const momentizeDate = date => {
  return moment(date).format("DD/MM/YYYY")
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
          :table-heads="beneficiaryTableHeads"
          :show-select-all="false"
          hide-td-border
          more-button="false"
          class="mt-6"
        >
          <tr
            v-for="(beneficiary, index) in filteredBeneficiaries"
            :key="index"
            class="hide-td-border"
          >
            <!-- 👉 Name -->
            <td>
              <div
                class="d-flex align-center"
                style="width: 250px"
              >
                {{ specialist.specialist.profile.first_name }} 
                {{ specialist.specialist.profile.last_name }}
              </div>
            </td>

            <!-- 👉 Age  -->
            <td>
              {{ momentizeDate(beneficiary.created_at) }}
            </td>

            <!-- 👉 Gender -->
            <td class="text-capitalize text-high-emphasis">
              {{ beneficiary.call_duration.time_taken }} mins
            </td>

            <!-- 👉 Condition -->
            <td>
              <div>
                {{ beneficiary.status }}
              </div>
            </td>

            <!-- 👉 Treatment -->
            <td>
              <div class="d-flex align-center">
                ₦ 8,000
              </div>
            </td>

            <!-- 👉 Total Cost -->
            <td>
              <div class="d-flex align-center">
                ₦ 8,000
              </div>
            </td>

            <!-- 👉 Status -->
            <td>
              <div class="d-flex align-center">
                ₦ 8,000
              </div>
            </td>
          </tr>

         
          <tr v-if="!beneficiaries.length">
            <td
              colspan="7"
              class="text-center text-body-1"
            >
              No data available
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
