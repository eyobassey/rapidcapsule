<template>
  <div
    class="setup-card"
    :class="cardClasses"
    @click="handleClick"
  >
    <!-- Status indicator strip -->
    <div v-if="status === 'current'" class="status-strip" />

    <!-- Card Header -->
    <div class="card-header">
      <div class="icon-wrapper" :class="iconClasses">
        <v-icon :name="icon" :scale="iconScale" />
      </div>
      <div class="card-meta">
        <div class="title-row">
          <h3 class="card-title">{{ title }}</h3>
          <span v-if="badge" class="card-badge" :class="badgeClass">
            {{ badge }}
          </span>
        </div>
        <p class="card-description">{{ description }}</p>
      </div>
      <div class="card-status">
        <div v-if="status === 'completed'" class="status-icon completed">
          <v-icon name="fa-check" scale="0.7" />
        </div>
        <div v-else-if="status === 'locked'" class="status-icon locked">
          <v-icon name="hi-lock-closed" scale="0.7" />
        </div>
        <v-icon v-else name="hi-chevron-right" scale="0.9" class="chevron" />
      </div>
    </div>

    <!-- Progress Bar (if applicable) -->
    <div v-if="progress !== null && status !== 'completed'" class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }" />
      </div>
      <span class="progress-text">{{ progress }}% complete</span>
    </div>

    <!-- Summary Info (if provided) -->
    <div v-if="summary && status !== 'locked'" class="summary-section">
      <div v-for="(item, index) in summaryItems" :key="index" class="summary-item">
        <v-icon :name="item.icon" scale="0.7" />
        <span>{{ item.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'hi-document',
  },
  iconScale: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    default: 'pending',
    validator: (val) => ['pending', 'current', 'completed', 'locked'].includes(val),
  },
  badge: {
    type: String,
    default: '',
  },
  badgeType: {
    type: String,
    default: 'info',
    validator: (val) => ['info', 'warning', 'success', 'mandatory'].includes(val),
  },
  progress: {
    type: Number,
    default: null,
  },
  summary: {
    type: Array,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['click']);

const cardClasses = computed(() => ({
  'is-current': props.status === 'current',
  'is-completed': props.status === 'completed',
  'is-locked': props.status === 'locked',
  'is-disabled': props.disabled,
}));

const iconClasses = computed(() => ({
  current: props.status === 'current',
  completed: props.status === 'completed',
  locked: props.status === 'locked',
}));

const badgeClass = computed(() => {
  const classes = {
    info: 'badge-info',
    warning: 'badge-warning',
    success: 'badge-success',
    mandatory: 'badge-mandatory',
  };
  return classes[props.badgeType] || 'badge-info';
});

const summaryItems = computed(() => props.summary || []);

const handleClick = () => {
  if (!props.disabled && props.status !== 'locked') {
    emit('click');
  }
};
</script>

<style scoped lang="scss">
.setup-card {
  position: relative;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.setup-card:hover:not(.is-locked):not(.is-disabled) {
  border-color: #4FC3F7;
  box-shadow: 0 4px 20px -5px rgba(79, 195, 247, 0.15);
  transform: translateY(-2px);
}

.setup-card.is-current {
  border-color: rgba(79, 195, 247, 0.3);
  box-shadow: 0 4px 20px -2px rgba(79, 195, 247, 0.15);
}

.setup-card.is-completed {
  background: #FAFAFA;
  border-color: #E2E8F0;
}

.setup-card.is-locked {
  background: #F8FAFC;
  border-color: #E2E8F0;
  cursor: not-allowed;
  opacity: 0.7;
}

.setup-card.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.status-strip {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #4FC3F7;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #F1F5F9;
  color: #64748B;
  transition: all 0.2s;
}

.icon-wrapper.current {
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
}

.icon-wrapper.completed {
  background: #D1FAE5;
  color: #059669;
}

.icon-wrapper.locked {
  background: #F1F5F9;
  color: #94A3B8;
}

.card-meta {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0;
}

.is-completed .card-title {
  color: #64748B;
}

.is-locked .card-title {
  color: #94A3B8;
}

.card-badge {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.badge-info {
  background: #E1F5FE;
  color: #0288D1;
}

.badge-warning {
  background: #FFF3E0;
  color: #F57C00;
}

.badge-success {
  background: #E8F5E9;
  color: #4CAF50;
}

.badge-mandatory {
  background: #FEE2E2;
  color: #DC2626;
}

.card-description {
  font-size: 0.8125rem;
  color: #64748B;
  margin: 0.25rem 0 0 0;
  line-height: 1.4;
}

.is-locked .card-description {
  color: #94A3B8;
}

.card-status {
  flex-shrink: 0;
}

.status-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-icon.completed {
  background: #4CAF50;
  color: white;
}

.status-icon.locked {
  background: #E2E8F0;
  color: #94A3B8;
}

.chevron {
  color: #94A3B8;
  transition: transform 0.2s;
}

.setup-card:hover:not(.is-locked):not(.is-disabled) .chevron {
  transform: translateX(4px);
  color: #4FC3F7;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #F1F5F9;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4FC3F7 0%, #0288D1 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748B;
  white-space: nowrap;
}

.summary-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #F1F5F9;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #64748B;
}

.summary-item svg {
  color: #94A3B8;
}
</style>
