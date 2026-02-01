<template>
  <span class="status-badge" :class="[statusClass, sizeClass, { 'badge-pill': pill, 'badge-glow': glow }]">
    <span v-if="showIcon && iconName" class="badge-icon">
      <v-icon :name="iconName" :scale="iconScale" />
    </span>
    <span class="badge-label">{{ displayLabel }}</span>
    <span v-if="pulse" class="pulse-dot"></span>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (v) => ['confirmed', 'pending', 'completed', 'cancelled', 'no_show', 'in_progress', 'rescheduled'].includes(v),
  },
  pill: {
    type: Boolean,
    default: true,
  },
  showIcon: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  glow: {
    type: Boolean,
    default: false,
  },
  pulse: {
    type: Boolean,
    default: false,
  },
});

const statusConfig = {
  confirmed: {
    label: 'Confirmed',
    icon: 'hi-check-circle',
    class: 'status-confirmed',
  },
  pending: {
    label: 'Pending',
    icon: 'hi-clock',
    class: 'status-pending',
  },
  completed: {
    label: 'Completed',
    icon: 'hi-badge-check',
    class: 'status-completed',
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'hi-x-circle',
    class: 'status-cancelled',
  },
  no_show: {
    label: 'No Show',
    icon: 'hi-user-remove',
    class: 'status-no-show',
  },
  in_progress: {
    label: 'In Progress',
    icon: 'hi-play',
    class: 'status-in-progress',
  },
  rescheduled: {
    label: 'Rescheduled',
    icon: 'hi-refresh',
    class: 'status-rescheduled',
  },
};

const config = computed(() => statusConfig[props.status] || statusConfig.pending);
const displayLabel = computed(() => config.value.label);
const iconName = computed(() => config.value.icon);
const statusClass = computed(() => config.value.class);
const sizeClass = computed(() => `badge-${props.size}`);

const iconScale = computed(() => {
  const scales = { sm: 0.6, md: 0.7, lg: 0.85 };
  return scales[props.size];
});
</script>

<style scoped lang="scss">
@import '../styles/sa-variables';

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: $sa-radius-sm;
  font-weight: 600;
  white-space: nowrap;
  transition: all $sa-transition;
  position: relative;
  letter-spacing: 0.01em;

  &.badge-pill {
    border-radius: $sa-radius-full;
  }

  &.badge-glow {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

// Size variants
.badge-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  gap: 0.25rem;
}

.badge-md {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.badge-lg {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  gap: 0.375rem;
}

.badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-label {
  line-height: 1;
}

// Pulse animation for live/urgent statuses
.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

// Status variants with sophisticated styling
.status-confirmed {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  color: #2E7D32;
  border: 1px solid rgba(46, 125, 50, 0.15);

  &.badge-glow {
    box-shadow: 0 2px 10px rgba(46, 125, 50, 0.2);
  }
}

.status-pending {
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  color: #F57C00;
  border: 1px solid rgba(245, 124, 0, 0.15);

  &.badge-glow {
    box-shadow: 0 2px 10px rgba(245, 124, 0, 0.2);
  }
}

.status-completed {
  background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
  color: #0277BD;
  border: 1px solid rgba(2, 119, 189, 0.15);

  &.badge-glow {
    box-shadow: 0 2px 10px rgba(2, 119, 189, 0.2);
  }
}

.status-cancelled {
  background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
  color: #C62828;
  border: 1px solid rgba(198, 40, 40, 0.15);

  &.badge-glow {
    box-shadow: 0 2px 10px rgba(198, 40, 40, 0.2);
  }
}

.status-no-show {
  background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
  color: #7B1FA2;
  border: 1px solid rgba(123, 31, 162, 0.15);

  &.badge-glow {
    box-shadow: 0 2px 10px rgba(123, 31, 162, 0.2);
  }
}

.status-in-progress {
  background: linear-gradient(135deg, $sa-sky-light 0%, #B3E5FC 100%);
  color: $sa-sky-dark;
  border: 1px solid rgba($sa-sky-dark, 0.2);

  &.badge-glow {
    box-shadow: $sa-shadow-sky;
    animation: softPulse 2s ease-in-out infinite;
  }
}

.status-rescheduled {
  background: linear-gradient(135deg, $sa-orange-light 0%, #FFE0B2 100%);
  color: $sa-orange-dark;
  border: 1px solid rgba($sa-orange-dark, 0.15);

  &.badge-glow {
    box-shadow: $sa-shadow-orange;
  }
}

@keyframes softPulse {
  0%, 100% {
    box-shadow: $sa-shadow-sky;
  }
  50% {
    box-shadow: 0 4px 20px rgba($sa-sky, 0.35);
  }
}
</style>
