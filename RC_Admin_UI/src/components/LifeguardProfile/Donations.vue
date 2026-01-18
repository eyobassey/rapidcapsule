
<script setup>
import TableIndex from '@/components/Table/TableIndex.vue'
import SimpleFilter from '@/components/Table/SimpleFilter.vue'
import moment from 'moment'
import { watch } from 'vue'

const props = defineProps({
  donations: {
    type: Array,
    required: true,
  },
})

const filteredDonations = ref([])

const donationsTableHeads = [
  'Date',
  'Age Range',
  'Gender',
  'Location',
  'Class',
  'Donation Type',
  'Frequency',
  'Amount',
]

const filterTabs = [
  {
    label: 'All',
    value: 'All',
  },
  {
    label: 'One-time',
    value: 'One-time',
  },
  {
    label: 'Recurring',
    value: 'Recurring',
  },
]

const seletedFilterTab = ref(
  filterTabs[0],
)

watch(seletedFilterTab, value => {
  if(value == 'All') {
    filteredDonations.value = props.donations
  } else {
    filterByStatus()
  }
}, 
{ deep: true },
{ immediate: true },
)


const filterByStatus = () => {
  filteredDonations.value = props.donations.filter(propDonation => propDonation.status == seletedFilterTab.value.value)
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
          :table-heads="donationsTableHeads"
          :show-select-all="false"
          hide-td-border
          more-button="false"
          class="mt-6"
        >
          <tr
            v-for="(donation, index) in filteredDonations"
            :key="index"
            class="hide-td-border"
          >
            <!-- 👉 Date -->
            <td>
              <div
                class="d-flex align-center"
                style="width: 250px"
              >
              <!-- {{ momentizeDate(donation.created_at) }} -->
              </div>
            </td>

            <!-- 👉 Age Range -->
            <td>
              {{ donation.age_range }}
            </td>

            <!-- 👉 Gender -->
            <td class="text-capitalize text-high-emphasis">
              {{ donation.gender }}
            </td>

            <!-- 👉 Location -->
            <td>
              <div>
                <!-- {{ donation.status }} -->
              </div>
            </td>

            <!-- 👉 Class -->
            <td>
              <div class="d-flex align-center">
                {{ donation.treatment_class }}
              </div>
            </td>

            <!-- 👉 Donation Type -->
            <td>
              <div class="d-flex align-center">
                {{donation.donation_type}}
              </div>
            </td>

            <!-- 👉 Frequency -->
            <td>
              <div class="d-flex align-center">
                <!-- {{donation.treatment_class}} -->
              </div>
            </td>

            <!-- 👉 Amount -->
            <td>
              <div class="d-flex align-center">
                {{donation.currency + '' + donation.amount_donated}}
              </div>
            </td>
          </tr>

         
          <!--
            <tr v-if="!donations.length">
            <td
            colspan="7"
            class="text-center text-body-1"
            >
            No data available
            </td>
            </tr> 
          -->
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
