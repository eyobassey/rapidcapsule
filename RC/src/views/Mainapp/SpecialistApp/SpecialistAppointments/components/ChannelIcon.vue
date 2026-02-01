<template>
  <div class="channel-icon" :class="[channelClass, sizeClass, { 'icon-only': iconOnly, 'with-glow': glow }]">
    <span class="icon-wrapper">
      <v-icon :name="iconName" :scale="iconScale" />
    </span>
    <span v-if="!iconOnly" class="channel-label">{{ displayLabel }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  channel: {
    type: String,
    required: true,
    validator: (v) => ['video', 'audio', 'chat', 'phone', 'zoom'].includes(v),
  },
  iconOnly: {
    type: Boolean,
    default: false,
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
});

const channelConfig = {
  video: {
    label: 'Video Call',
    icon: 'hi-video-camera',
    class: 'channel-video',
  },
  zoom: {
    label: 'Zoom Meeting',
    icon: 'hi-video-camera',
    class: 'channel-video',
  },
  audio: {
    label: 'Audio Call',
    icon: 'hi-phone',
    class: 'channel-audio',
  },
  phone: {
    label: 'Phone Call',
    icon: 'hi-phone',
    class: 'channel-audio',
  },
  chat: {
    label: 'Chat Session',
    icon: 'hi-chat-alt-2',
    class: 'channel-chat',
  },
};

const config = computed(() => channelConfig[props.channel] || channelConfig.video);
const displayLabel = computed(() => config.value.label);
const iconName = computed(() => config.value.icon);
const channelClass = computed(() => config.value.class);
const sizeClass = computed(() => `channel-${props.size}`);

const iconScale = computed(() => {
  const scales = { sm: 0.75, md: 0.9, lg: 1.1 };
  return scales[props.size];
});
</script>

<style scoped lang="scss">
@import '../styles/sa-variables';

.channel-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: $sa-radius;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: all $sa-transition;
  border: 1px solid transparent;

  &.icon-only {
    padding: 0.5rem;
    border-radius: $sa-radius-md;

    .icon-wrapper {
      margin: 0;
    }
  }

  &:hover {
    transform: translateY(-1px);
  }
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

// Size variants
.channel-sm {
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  gap: 0.375rem;
  border-radius: $sa-radius-sm;

  &.icon-only {
    padding: 0.375rem;
  }
}

.channel-md {
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
}

.channel-lg {
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  gap: 0.5rem;

  &.icon-only {
    padding: 0.625rem;
  }
}

.channel-label {
  white-space: nowrap;
  letter-spacing: 0.01em;
}

// Channel variants with sophisticated gradient styling
.channel-video {
  background: linear-gradient(135deg, $sa-sky-light 0%, #B3E5FC 100%);
  color: $sa-sky-dark;
  border-color: rgba($sa-sky-dark, 0.12);

  .icon-wrapper {
    color: $sa-sky-dark;
  }

  &.with-glow {
    box-shadow: $sa-shadow-sky;
  }

  &:hover {
    background: linear-gradient(135deg, #B3E5FC 0%, $sa-sky-light 100%);
    border-color: rgba($sa-sky-dark, 0.25);
  }
}

.channel-audio {
  background: linear-gradient(135deg, $sa-orange-light 0%, #FFE0B2 100%);
  color: $sa-orange-dark;
  border-color: rgba($sa-orange-dark, 0.12);

  .icon-wrapper {
    color: $sa-orange-dark;
  }

  &.with-glow {
    box-shadow: $sa-shadow-orange;
  }

  &:hover {
    background: linear-gradient(135deg, #FFE0B2 0%, $sa-orange-light 100%);
    border-color: rgba($sa-orange-dark, 0.25);
  }
}

.channel-chat {
  background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
  color: #7B1FA2;
  border-color: rgba(123, 31, 162, 0.12);

  .icon-wrapper {
    color: #7B1FA2;
  }

  &.with-glow {
    box-shadow: 0 4px 14px -2px rgba(123, 31, 162, 0.25);
  }

  &:hover {
    background: linear-gradient(135deg, #E1BEE7 0%, #F3E5F5 100%);
    border-color: rgba(123, 31, 162, 0.25);
  }
}
</style>
