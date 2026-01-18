<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  totalItems: {
    type: Number,
    required: false,
    default: 0,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'userData',
  'clearFields',
  'submitData',
])


const clearFields = () => {
  emit('clearFields')
}

const submitData = () => {
  emit('submitData')
}



// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()
  })
}


const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}
</script>

<template>
  <VNavigationDrawer
    temporary
    :width="400"
    location="end"
    class="scrollable-content"
    :model-value="props.isDrawerOpen"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Title -->
    <AppDrawerHeaderSection
      title="Advanced Filter"
      @cancel="closeNavigationDrawer"
    />

    <!-- 👉 Clear all fields -->
    <!-- This should only show when there at least a field with content in the form -->
    <VRow>
      <VCol
        cols="12"
        class="af-p-30"
      >
        <VBtn
        @click.prevent="clearFields"
          class="me-3 adv-filter-clear-all"
          color="none"
          append-icon="bx:x"
        >
          Clear All Filters
        </VBtn>
      </VCol>
    </VRow>

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Form -->
          <slot />
        </VCardText>
      </VCard>
    </PerfectScrollbar>
    <VRow>
      <!-- 👉 Submit and Cancel -->
      <VCol
        cols="12"
        class="af-p-30"
      >
        <div class="d-flex">
          <div class="adv-filter-result"> 
            <h3>{{props.totalItems}}</h3>
            <small>Patients matched</small>
          </div>
          <div>
            <VBtn
              @click.prevent="submitData"
              class="me-3"
            >
              Submit
            </VBtn>
          </div>
        </div>
      </VCol>
    </VRow>
  </VNavigationDrawer>
</template>

<style lang="scss">
  .adv-filter {
    &-label {
      color: #aaaaaa; 
      padding-left: 10px; 
      margin-top: 10px;
    }

    &-clear-all {
      border: 1px solid #F16439;
      color: #F16439;
    }

    &-divider {
      border-bottom: 1px solid #aaaaaa7a; 
      margin: 10px 0;
    }

    &-gender-col {
      padding: 0 12px;
    }

    &-dependents-mid {
      &-minus {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        padding: 10px;
      }
    }

    &-date-icon {
      position: absolute;
      z-index: -1;
      top: 8px;
      right: 12px;
    }

    &-result {
      margin-right: auto
    }
  }

  .af-p-30 {
    padding: 30px;
  }

  .v-checkbox-btn {
    label {
      color: #151515 !important;
    }
  }
</style>
