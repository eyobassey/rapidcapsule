<template>
  <div v-if="totalPages > 1" class="pagination">
    <button
      class="pagination__btn"
      :disabled="currentPage <= 1"
      @click="$emit('page-change', currentPage - 1)"
    >
      <v-icon name="hi-chevron-left" scale="0.8" />
    </button>

    <template v-for="page in visiblePages" :key="page">
      <span v-if="page === '...'" class="pagination__ellipsis">...</span>
      <button
        v-else
        :class="['pagination__page', { active: page === currentPage }]"
        @click="$emit('page-change', page)"
      >
        {{ page }}
      </button>
    </template>

    <button
      class="pagination__btn"
      :disabled="currentPage >= totalPages"
      @click="$emit('page-change', currentPage + 1)"
    >
      <v-icon name="hi-chevron-right" scale="0.8" />
    </button>

    <span class="pagination__info">
      Page {{ currentPage }} of {{ totalPages }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
});

defineEmits(['page-change']);

const visiblePages = computed(() => {
  const total = props.totalPages;
  const current = props.currentPage;
  const pages = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
});
</script>

<style scoped lang="scss">
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $size-8;
  margin-top: $size-24;

  &__btn {
    width: $size-32;
    height: $size-32;
    border-radius: $size-8;
    border: 1px solid $color-g-85;
    background: $color-white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-g-44;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      border-color: $color-pri;
      color: $color-pri;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__page {
    width: $size-32;
    height: $size-32;
    border-radius: $size-8;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: $size-14;
    font-weight: $fw-medium;
    color: $color-g-44;
    transition: all 0.2s ease;

    &:hover {
      background: $color-g-95;
    }

    &.active {
      background: $color-pri;
      color: $color-white;
    }
  }

  &__ellipsis {
    font-size: $size-14;
    color: $color-g-54;
    width: $size-24;
    text-align: center;
  }

  &__info {
    font-size: $size-12;
    color: $color-g-54;
    margin-left: $size-12;
  }
}
</style>
