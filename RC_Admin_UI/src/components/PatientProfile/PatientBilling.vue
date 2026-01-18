
<script setup>
import TableIndex from '@/components/Table/TableIndex.vue'
import SimpleFilter from '@/components/Table/SimpleFilter.vue'
import moment from 'moment'

// const d = new Date()

// this.date = d.getDate()
// this.month = d.getMonth()
// this.year = d.getFullYear()
// this.format = this.date + '/' + this.month + '/' + this.year


const props = defineProps({
  subscriptions: {
    type: Array,
    required: true,
  },
  appointments: {
    type: Array,
    required: true,
  },
})

const currentTab = ref(0)

const subscriptionTableHeads = [
  'Date',
  'Description',
  'Expiry Date',
  'Payment Method',
  'Total',
]

const appointmentTableHeads = [
  'Date',
  'Description',
  'Duration',
  'Payment Method',
  'Total',
]

const filterTabs = [
  {
    label: 'Subscriptions',
    value: 'subscriptions',
  },
  {
    label: 'Appointments',
    value: 'appointments',
  },
]

const seletedFilterTab = ref(
  filterTabs[0],
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
        <div style="color: #AAAAAA">
          Subscription Plan
          <div class="d-flex mt-6 mx-3">
            <h2 class="mr-auto">
              Rapid Capsule Free
            </h2>
            <!-- <span>128 MB of 5 GB used</span> -->
          </div>
          <div class="d-flex mt-8" style="flex-wrap: wrap;">
            <span class="mr-auto">Payment History</span>
            <div class="simple-filter-container">
              <SimpleFilter
                v-model:selectabledTab="seletedFilterTab" 
                :tabs="filterTabs"
                :default-tab="seletedFilterTab"
              />
            </div>
          </div>
        </div>

        <TableIndex
          v-if="seletedFilterTab.value == 'appointments'"
          :table-heads="appointmentTableHeads"
          :show-select-all="false"
          hide-td-border
          more-button="false"
          class="mt-4"
        >
          <tr
            v-for="(appointment, index) in appointments"
            :key="index"
            class="hide-td-border"
          >
            <!-- 👉 Date -->
            <td>
              <div class="d-flex align-center sec-color">
                {{ momentizeDate(appointment.created_at) }}
              </div>
            </td>

            <!-- 👉 Description -->
            <td class="appointment-w-200">
              <VList :items="appointment.notes" />
            </td>

            <!-- 👉 Duration -->
            <td class="text-capitalize text-high-emphasis">
              {{ appointment.call_duration.time_taken }} mins
            </td>

            <!-- 👉 Payment Method -->
            <td>
              <div>
                **** **** **** {{ appointment.payment_method.last4Digit }}
              </div>
            </td>
            <!-- 👉 Total -->
            <td>
              <div class="d-flex align-center">
                ₦ 8,000
              </div>
            </td>
          </tr>

          <tr v-if="!subscriptions.length">
            <td
              colspan="7"
              class="text-center text-body-1"
            >
              No data available
            </td>
          </tr>
        </TableIndex>

        <TableIndex
          v-else-if="seletedFilterTab.value == 'subscriptions'"
          :table-heads="subscriptionTableHeads"
          :show-select-all="false"
          hide-td-border
          more-button="false"
          class="mt-4"
        >
          <tr
            v-for="(subscription, index) in subscriptions"
            :key="index"
            class="hide-td-border"
          >
            <!-- 👉 Date -->
            <td>
              <div class="d-flex align-center sec-color">
                {{ momentizeDate(subscription.created_at) }}
              </div>
            </td>

            <!-- 👉 Description -->
            <td class="appointment-w-200">
              {{ subscription.description }}
            </td>

            <!-- 👉 Expiry -->
            <td class="text-capitalize text-high-emphasis">
              {{ subscription.current_period_end }}
            </td>

            <!-- 👉 Payment Method -->
            <td>
              <div>
                **** **** **** {{ subscription.payment_method.last4Digit }}
              </div>
            </td>

            <!-- 👉 Total -->
            <td>
              <div class="d-flex align-center">
                ₦{{ subscription.amount_paid }}
              </div>
            </td>
          </tr>
          
          <tr v-if="!subscriptions.length">
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

<style lang="scss">
.appointment-w-200 {
  width: 200px; white-space: normal;
}
</style>
