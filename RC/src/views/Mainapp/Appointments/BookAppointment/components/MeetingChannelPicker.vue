<template>
  <div class="channel-picker">
    <h4 class="picker-title">Meeting Channel</h4>
    <div class="channel-options">
      <label
        v-for="channel in channels"
        :key="channel.value"
        class="channel-option"
        :class="{ selected: modelValue === channel.value }"
      >
        <input
          type="radio"
          :value="channel.value"
          :checked="modelValue === channel.value"
          @change="$emit('update:modelValue', channel.value)"
          class="channel-radio"
        />
        <div class="channel-content">
          <v-icon :name="channel.icon" scale="1.1" class="channel-icon" />
          <div class="channel-info">
            <span class="channel-name">{{ channel.label }}</span>
            <span class="channel-desc">{{ channel.description }}</span>
          </div>
        </div>
        <div v-if="modelValue === channel.value" class="check-indicator">
          <v-icon name="hi-check-circle" scale="0.9" />
        </div>
      </label>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
});

defineEmits(['update:modelValue']);

const channels = [
  {
    value: 'zoom',
    label: 'Zoom',
    description: 'HD video consultation',
    icon: 'hi-video-camera',
  },
  {
    value: 'google_meet',
    label: 'Google Meet',
    description: 'Video via Google Meet',
    icon: 'hi-globe-alt',
  },
  {
    value: 'phone',
    label: 'Phone Call',
    description: 'Audio consultation',
    icon: 'hi-phone',
  },
];
</script>

<style scoped lang="scss">
.channel-picker {
  margin-bottom: 20px;
}

.picker-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px;
}

.channel-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.channel-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #0EAEC4;
  }

  &.selected {
    border-color: #0EAEC4;
    background: rgba(14, 174, 196, 0.04);
  }
}

.channel-radio {
  display: none;
}

.channel-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.channel-icon {
  color: #0EAEC4;
  flex-shrink: 0;
}

.channel-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.channel-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.channel-desc {
  font-size: 12px;
  color: #9ca3af;
}

.check-indicator {
  color: #0EAEC4;
  flex-shrink: 0;
}
</style>
