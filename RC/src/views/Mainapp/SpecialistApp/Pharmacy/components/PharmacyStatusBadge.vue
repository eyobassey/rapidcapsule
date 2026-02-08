<template>
  <span :class="['status-badge', `status-badge--${normalizedStatus}`, `status-badge--${size}`]">
    <span class="status-badge__dot" />
    {{ label || formatStatus(status) }}
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { usePharmacy } from '../composables/usePharmacy';

const props = defineProps({
  status: { type: String, default: '' },
  label: { type: String, default: '' },
  size: { type: String, default: 'md', validator: (val) => ['sm', 'md', 'lg'].includes(val) },
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
  gap: 6px;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 20px;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  // Sizes
  &--sm {
    font-size: 11px;
    padding: 4px 10px;
    .status-badge__dot { width: 5px; height: 5px; }
  }

  &--md {
    font-size: 12px;
    padding: 5px 12px;
  }

  &--lg {
    font-size: 13px;
    padding: 6px 14px;
    .status-badge__dot { width: 7px; height: 7px; }
  }

  // Status colors
  &--draft {
    background: rgba(#64748b, 0.1);
    color: #475569;
    .status-badge__dot { background: #64748b; }
  }

  &--pending_payment {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
    .status-badge__dot { background: #f59e0b; animation: pulse-dot 2s ease-in-out infinite; }
  }

  &--paid,
  &--processing {
    background: rgba(#3b82f6, 0.1);
    color: #2563eb;
    .status-badge__dot { background: #3b82f6; }
  }

  &--dispensed,
  &--shipped {
    background: rgba(#8b5cf6, 0.1);
    color: #7c3aed;
    .status-badge__dot { background: #8b5cf6; }
  }

  &--delivered,
  &--completed {
    background: rgba(#10b981, 0.1);
    color: #059669;
    .status-badge__dot { background: #10b981; }
  }

  &--cancelled,
  &--failed {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
    .status-badge__dot { background: #ef4444; }
  }

  &--sent_to_patient {
    background: rgba(#6366f1, 0.1);
    color: #4f46e5;
    .status-badge__dot { background: #6366f1; }
  }

  &--in_stock,
  &--in-stock {
    background: rgba(#10b981, 0.1);
    color: #059669;
    .status-badge__dot { background: #10b981; }
  }

  &--low_stock,
  &--low-stock {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
    .status-badge__dot { background: #f59e0b; animation: pulse-dot 2s ease-in-out infinite; }
  }

  &--out_of_stock,
  &--out-of-stock {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
    .status-badge__dot { background: #ef4444; }
  }

  &--active {
    background: rgba(#10b981, 0.1);
    color: #059669;
    .status-badge__dot { background: #10b981; animation: pulse-dot 2s ease-in-out infinite; }
  }

  &--inactive {
    background: rgba(#64748b, 0.1);
    color: #475569;
    .status-badge__dot { background: #64748b; }
  }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}
</style>
