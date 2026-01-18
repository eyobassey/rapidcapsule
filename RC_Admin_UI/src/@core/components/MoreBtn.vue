<script setup>
import { watchEffect } from "vue"

const props = defineProps({
  menuList: {
    type: Array,
    required: false,
  },
  itemProps: {
    type: Boolean,
    required: false,
  },
})

const emit = defineEmits([
  'selectedList',
])

const selectedMethod = ref('')

watchEffect(() => {
  emit('update:selectedList', selectedMethod.value)
})
</script>

<template>
  <IconBtn size="32">
    <VIcon icon="bx-dots-vertical-rounded" />

    <VMenu
      v-if="props.menuList"
      activator="parent"
    >
      <VList
        class="card-list mt-2"
        style="padding: 20px"
      >
        <VListItem
          v-for="list in props.menuList"
          :key="list.value"

          @click.prevent="selectedMethod = list"
        >
          <span>
            {{ list.title }}
          </span>
        </VListItem>
      </VList>
    </VMenu>
  </IconBtn>
</template>
