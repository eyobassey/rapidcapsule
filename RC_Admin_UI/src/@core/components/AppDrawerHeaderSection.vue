<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['cancel'])
</script>

<template>
  <div class="px-6 py-4 d-flex align-center bg-var-theme-background">
    <h3 class="font-weight-medium text-xl">
      {{ props.title }}
    </h3>
    <VSpacer />

    <slot name="beforeClose" />

    <IconBtn
      size="30"
      @click="$emit('cancel')"
    >
      <VIcon
        size="20"
        icon="bx-x"
      />
    </IconBtn>
  </div>
</template>
