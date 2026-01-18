
<script setup>
import TableIndex from '@/components/Table/TableIndex.vue'

const props = defineProps({
  dependents: {
    type: Array,
    required: true,
  },
})


const tableHeads = [
  'Fullname',
  'Gender',
  'Relationship',
  'Email',
]
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
        <TableIndex
          :table-heads="tableHeads"
          :show-select-all="false"
          hide-td-border
          more-button="false"
        >
          <tr
            v-for="(dependent, index) in dependents"
            :key="index"
            class="hide-td-border"
          >
            <!-- 👉 Full name -->
            <td>
              <div class="d-flex align-center">
                {{ dependent.first_name + ' ' + dependent.last_name}}
              </div>
            </td>

            <!-- 👉 Gender -->
            <td>
              <span class="text-high-emphasis">{{ dependent.gender }}</span>
            </td>

            <!-- 👉 Relationship -->
            <td class="text-capitalize text-high-emphasis">
              {{ dependent.relationship }}
            </td>

            <!-- 👉 Email -->
            <td>
              <div class="sec-color">
                {{ dependent.contact.email }}
              </div>
            </td>
          </tr>

          <tr v-if="!dependents.length">
            <td
              colspan="7"
              class="text-center text-body-1"
            >
              No data available
            </td>
          </tr>
        </TableIndex>
        <!-- 👉 dependents List table -->
      </div>
    </VCol>
  </VRow>
</template>

<style lang="scss">
.sec-color {
  color: #008C99 !important;
}
</style>
