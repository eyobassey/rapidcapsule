<script setup>
const props = defineProps({
  tableData: {
    type: Array,
    required: false,
  },
  tableHeads : {
    type: Array,
    required: true,
  },
  showSelectAll : {
    type: Boolean,
    required: false,
    default: true,
  },
  hideTdBorder : {
    type: Boolean,
    required: false,
    default: false,
  },
  moreButton : {
    type: Boolean,
    required: false,
    default: true,
  },
})

const selectedRows = ref([])

// 👉 watch if checkbox array is empty all select should be uncheck
watch(selectedRows, () => {
  if (!selectedRows.value.length)
    selectAllUser.value = false
}, { deep: true })

</script>


<template>
  <VTable
    class="text-no-wrap admin-general-table"
  >
    <!-- 👉 table head -->
    <thead>
      <tr>
        <th
          v-if="props.showSelectAll"
          scope="col"
          style="inline-size: 48px;"
        >
          <VCheckbox
            :model-value="selectAllUser"
            :indeterminate="(tableData.length !== selectedRows.length) && !!selectedRows.length"
            class="mx-1"
            @click="selectUnselectAll"
          />
        </th>
        <th
          v-for="thead in tableHeads"
          :key="thead"
          scope="col"
        >
          {{ thead }}
        </th>
        <th
          v-if="moreButton"
          scope="col"
        />
      </tr>
    </thead>

    <!-- 👉 table body -->
    <tbody :class="{'hide-td-border': hideTdBorder}">
      <slot />
    </tbody>

    <!-- 👉 table footer  -->
    <tfoot v-show="tableData && !tableData?.length">
      <tr>
        <td
          colspan="7"
          class="text-center text-body-1"
        >
          No data available
        </td>
      </tr>
    </tfoot>
  </VTable>
</template>


<style lang="scss">
table {
  tbody.hide-td-border {
    td {
      border: none !important; 
      border-style: hidden !important;
     
    }
  }
}
</style>
