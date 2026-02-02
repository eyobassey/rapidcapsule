<template>
  <div class="consent-item" :class="{ checked: modelValue }">
    <label class="consent-label">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
        class="consent-checkbox"
      />
      <div class="checkbox-custom">
        <v-icon v-if="modelValue" name="hi-check" scale="0.7" />
      </div>
      <div class="consent-content">
        <div class="consent-header">
          <span class="consent-title">{{ title }}</span>
          <span v-if="required" class="required-badge">Required</span>
        </div>
        <p class="consent-description">{{ description }}</p>
      </div>
    </label>
    <button class="view-details-btn" @click="$emit('viewDetails')">
      View details
      <v-icon name="hi-chevron-right" scale="0.7" />
    </button>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  required: { type: Boolean, default: false },
  modelValue: { type: Boolean, default: false },
});

defineEmits(['update:modelValue', 'viewDetails']);
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-success: #4CAF50;

.consent-item {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px 20px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #d1d5db;
  }

  &.checked {
    border-color: $v2-success;
    background: linear-gradient(135deg, rgba($v2-success, 0.02) 0%, white 100%);
  }
}

.consent-label {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  cursor: pointer;
}

.consent-checkbox {
  display: none;
}

.checkbox-custom {
  width: 24px;
  height: 24px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  margin-top: 2px;

  .checked & {
    background: $v2-success;
    border-color: $v2-success;
    color: white;
  }
}

.consent-content {
  flex: 1;
}

.consent-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.consent-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.required-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: $v2-sky-light;
  color: $v2-sky-dark;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.consent-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.view-details-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: $v2-sky-dark;
  cursor: pointer;
  margin-top: 12px;
  margin-left: 38px;
  transition: all 0.2s ease;

  &:hover {
    color: $v2-sky;
    gap: 6px;
  }
}
</style>
