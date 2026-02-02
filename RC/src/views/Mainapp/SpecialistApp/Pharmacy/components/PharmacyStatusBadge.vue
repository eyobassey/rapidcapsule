<template>
  <span :class="['status-badge', `status-badge--${normalizedStatus}`]">
    {{ label || formatStatus(status) }}
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { usePharmacy } from '../composables/usePharmacy';

const props = defineProps({
  status: { type: String, default: '' },
  label: { type: String, default: '' },
});

const { formatStatus } = usePharmacy();

const normalizedStatus = computed(() => {
  return (props.status || '').toLowerCase().replace(/\s+/g, '_');
});
</script>

<style scoped lang="scss">
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: $size-12;
  padding: $size-4 $size-12;
  border-radius: $size-12;
  font-weight: $fw-medium;
  white-space: nowrap;

  &--draft {
    background: $color-g-90;
    color: $color-g-44;
  }

  &--pending_payment {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--paid,
  &--processing {
    background: rgba(#3b82f6, 0.1);
    color: #2563eb;
  }

  &--dispensed,
  &--shipped {
    background: rgba(#8b5cf6, 0.1);
    color: #7c3aed;
  }

  &--delivered,
  &--completed {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--cancelled,
  &--failed {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }

  &--sent_to_patient {
    background: rgba(#6366f1, 0.1);
    color: #4f46e5;
  }

  &--in_stock,
  &--in-stock {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--low_stock,
  &--low-stock {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--out_of_stock,
  &--out-of-stock {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }
}
</style>
