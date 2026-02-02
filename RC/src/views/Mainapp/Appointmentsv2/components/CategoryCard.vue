<template>
  <div
    class="category-card"
    :class="{ selected: isSelected, suggested: isSuggested }"
    @click="$emit('select')"
  >
    <div class="card-icon-wrapper" :style="{ background: iconBg }">
      <v-icon :name="icon" scale="1.2" :style="{ color: iconColor }" />
    </div>
    <div class="card-content">
      <span class="card-title">{{ title }}</span>
      <span class="card-subtitle" v-if="subtitle">{{ subtitle }}</span>
    </div>
    <div class="card-badges">
      <span v-if="isSuggested" class="badge badge-ai">
        <v-icon name="hi-sparkles" scale="0.6" />
        AI Suggested
      </span>
      <span v-if="isPopular" class="badge badge-popular">Popular</span>
    </div>
    <div class="card-check" v-if="isSelected">
      <v-icon name="hi-check-circle" scale="0.9" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, required: true },
  iconColor: { type: String, default: '#4FC3F7' },
  iconBg: { type: String, default: '#E1F5FE' },
  isSelected: { type: Boolean, default: false },
  isSuggested: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
});

defineEmits(['select']);
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;
$v2-success: #4CAF50;

.category-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border: 2px solid #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: white;

  &:hover {
    border-color: $v2-sky;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 195, 247, 0.1);
  }

  &.selected {
    border-color: $v2-sky;
    background: $v2-sky-light;
  }

  &.suggested {
    border-color: $v2-orange;

    &:hover {
      border-color: $v2-orange;
    }

    &.selected {
      background: $v2-orange-light;
    }
  }
}

.card-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.card-subtitle {
  font-size: 12px;
  color: #9ca3af;
}

.card-badges {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.badge-ai {
    background: $v2-orange-light;
    color: $v2-orange;
  }

  &.badge-popular {
    background: #f3f4f6;
    color: #6b7280;
  }
}

.card-check {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  color: $v2-sky-dark;

  .suggested & {
    color: $v2-orange;
  }
}
</style>
