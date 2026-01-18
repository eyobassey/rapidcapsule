<script setup>
import { computed, onMounted } from "vue"

const props = defineProps({
  tabs: {
    type: Array,
    required: true,
  },
  defaultTab: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits([
  'selectabledTab',
])

const isOverflow = ref(false)

let selectedTab = computed({
  get() {
    return props.defaultTab
  },
  set(value) {
    emit('update:selectabledTab', value)
  },
})

const leftBordered = index => {
  return index == 0 ? 'filter-tabs-left-bordered' : ''
}

const rightBordered = index => {
  return index == props.tabs.length - 1 ? 'filter-tabs-right-bordered': ''
}

const activated = index => {
  return selectedTab.value.value == props.tabs[index].value ? 'filter-tabs-item-active': 'nothing'
}

const selectTab = tab => {
  selectedTab.value = tab
}

const elSimpleFilter = ref(null)

const chekOverflow = () => {
  const el = elSimpleFilter.value

  const container = el.parentNode
  let containerWidth

  try {
    containerWidth = window.getComputedStyle(container, null)
      .getPropertyValue('width')
  } catch(e) {
    console.log('eeeee', e);
    containerWidth = container.currentStyle.width
  }
  
  isOverflow.value = el.offsetWidth > parseFloat(containerWidth) + 1
}

const tabScroll = direction => {
  const el = elSimpleFilter.value
  let dir = direction == 'left' ? -100 : 100
  el.scrollBy(dir, 0)
}

onMounted(() => {
  setTimeout(chekOverflow)
})
</script>


<template>
  <div
    style="max-width: 100%;"
    class="d-flex"
  >
    <div
      v-if="isOverflow"
      class="filter-tabs-overflow-arrow"
    >
      <VIcon
        icon="bx:chevron-left"
        @click.prevent="tabScroll('left')"
      />
    </div>
    <div
      ref="elSimpleFilter"
      class="d-flex"
      :class="{'small-screen-filter-tabs': isOverflow}"
    >
      <button
        v-for="(tab, index) in tabs"
        class="filter-tabs-item"
        :class="`${leftBordered(index)} ${rightBordered(index)} ${activated(index)}`"
        @click.prevent="selectTab(tab)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div
      v-if="isOverflow"
      class="filter-tabs-overflow-arrow"
    >
      <VIcon
        icon="bx:chevron-right"
        @click.prevent="tabScroll('right')"
      />
    </div>
  </div>
</template>

<style lang="scss">
.filter-tabs {
  &-item {
    background: #e2e1e1; 
    color: #363636; 
    padding-block: 8px; 
    padding-inline: 16px;

    &:hover {
      background: #dedcdc; 
    }
  }

  &-item-active {
    background: #008C99 !important; 
    color: #fff !important;
    padding-block: 8px;
    padding-inline: 16px;

    &:hover {
      background: #037985; 
    }
  }

  &-right-bordered {
    border-radius: 0 6px 6px 0;
  }

  &-left-bordered {
    border-radius: 6px 0 0 6px;
  }

  &-overflow-arrow {
    padding: 7px;
  }
}

.small-screen-filter-tabs {
  max-width: 90%;
  overflow-x: hidden;
}
</style>
