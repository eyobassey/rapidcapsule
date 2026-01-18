<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: false,
    default: 'primary',
  },
  icon: {
    type: String,
    required: true,
  },
  stats: {
    type: String,
    required: true,
  },
  change: {
    type: Number,
    required: true,
  },
})

const isPositive = controlledComputed(() => props.change, () => Math.sign(props.change) === 1)
</script>

<template>
  <VCard>
    <VCardText class="d-flex justify-space-between align-start">
      <div>
        <span>{{ props.title }}</span>
        <div class="d-flex align-center flex-wrap gap-2">
          <span class="text-h6">{{ props.stats }}</span>
          <div
            v-if="props.change"
            :class="`${isPositive ? 'text-success' : 'text-error'}`"
          >
            <span class="text-sm">({{ (isPositive ? '+' : '-') + Math.abs(props.change) }}%)</span>
          </div>
        </div>
        <span class="text-sm">{{ props.subtitle }}</span>
      </div>

      <VAvatar
        size="40"
        rounded
        :color="props.color"
        variant="tonal"
      >
        <VIcon
          :icon="props.icon"
          size="24"
        />
      </VAvatar>
    </VCardText>
  </VCard>
</template>
