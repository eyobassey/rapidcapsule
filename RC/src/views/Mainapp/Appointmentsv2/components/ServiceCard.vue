<template>
  <div
    class="service-card"
    :class="[
      { selected: isSelected },
      `theme-${theme}`,
      { 'has-top-bar': hasTopBar },
    ]"
    @click="$emit('select')"
  >
    <!-- Top accent bar for recommended -->
    <div v-if="hasTopBar" class="top-bar"></div>

    <!-- Recommended badge (top right) -->
    <span v-if="showRecommendedBadge" class="recommended-badge">Recommended</span>

    <div class="card-inner">
      <!-- Icon -->
      <div class="card-icon" :class="`icon-${iconTheme || theme}`">
        <v-icon :name="icon" :scale="iconScale" />
      </div>

      <!-- Content -->
      <div class="card-content">
        <div class="title-row">
          <h4 class="card-title">{{ title }}</h4>
          <span v-if="priorityBadge" class="priority-badge">{{ priorityBadge }}</span>
        </div>
        <p class="card-description">{{ description }}</p>

        <!-- Info pill (for method cards) -->
        <div v-if="infoPill" class="info-pill">
          <v-icon :name="infoPill.icon" scale="0.5" />
          <span>{{ infoPill.text }}</span>
        </div>
      </div>

      <!-- Selection indicator -->
      <div class="card-indicator">
        <div class="indicator-circle" :class="{ checked: isSelected }">
          <v-icon v-if="isSelected" name="hi-check" scale="0.5" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, required: true },
  iconScale: { type: Number, default: 1.2 },
  theme: { type: String, default: 'blue' }, // blue, red, sky, orange, purple
  iconTheme: { type: String, default: '' }, // Override icon color theme
  isSelected: { type: Boolean, default: false },
  priorityBadge: { type: String, default: '' },
  showRecommendedBadge: { type: Boolean, default: false },
  hasTopBar: { type: Boolean, default: false },
  infoPill: { type: Object, default: null }, // { icon: 'hi-wifi', text: 'Needs stable internet' }
});

defineEmits(['select']);
</script>

<style scoped lang="scss">
// V2 Colors
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;
$v2-purple: #9C27B0;
$v2-purple-light: #F3E5F5;
$v2-blue: #3B82F6;
$v2-blue-light: #EFF6FF;
$v2-red: #EF4444;
$v2-red-light: #FEF2F2;

.service-card {
  position: relative;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;

  &:active {
    transform: scale(0.98);
  }

  &.selected {
    border-color: $v2-sky;
    background: #F0F9FF;
    box-shadow: 0 0 0 2px $v2-sky;
  }

  &.has-top-bar {
    border-color: rgba($v2-sky, 0.3);

    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: $v2-sky;
    }
  }
}

.recommended-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, $v2-sky, #3B82F6);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
}

.card-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}

.card-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;

  &.icon-blue {
    background: $v2-blue-light;
    color: $v2-blue;
  }

  &.icon-red {
    background: $v2-red-light;
    color: $v2-red;
  }

  &.icon-sky {
    background: $v2-sky-light;
    color: $v2-sky-dark;
  }

  &.icon-orange {
    background: $v2-orange-light;
    color: $v2-orange;
  }

  &.icon-purple {
    background: $v2-purple-light;
    color: $v2-purple;
  }
}

// Larger circular icon for method cards
.service-card.method-card .card-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.priority-badge {
  font-size: 10px;
  font-weight: 700;
  background: $v2-red-light;
  color: $v2-red;
  padding: 2px 8px;
  border-radius: 10px;
}

.card-description {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.info-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 11px;
  color: #64748b;

  svg {
    color: #94a3b8;
  }
}

.card-indicator {
  flex-shrink: 0;
  padding-top: 2px;
}

.indicator-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &.checked {
    background: $v2-sky;
    border-color: $v2-sky;
    color: white;
  }
}
</style>
