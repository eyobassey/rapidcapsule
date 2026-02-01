<template>
  <div class="patient-avatar" :class="[sizeClass, { 'with-badge': showHealthBadge, 'with-ring': ring }]">
    <div class="avatar-ring" v-if="ring">
      <div class="avatar-image">
        <img v-if="src && !imageFailed" :src="src" :alt="name" @error="onImageError" />
        <span v-else class="avatar-initials">{{ initials }}</span>
      </div>
    </div>
    <div v-else class="avatar-image">
      <img v-if="src && !imageFailed" :src="src" :alt="name" @error="onImageError" />
      <span v-else class="avatar-initials">{{ initials }}</span>
    </div>
    <div v-if="showHealthBadge" class="health-badge" :class="healthBadgeClass">
      <v-icon :name="healthIcon" :scale="healthIconScale" />
    </div>
    <div v-if="showOnlineStatus" class="online-indicator" :class="{ online: isOnline }">
      <span v-if="isOnline" class="online-pulse"></span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v),
  },
  healthScore: {
    type: Number,
    default: null,
  },
  showHealthBadge: {
    type: Boolean,
    default: false,
  },
  showOnlineStatus: {
    type: Boolean,
    default: false,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  ring: {
    type: Boolean,
    default: false,
  },
});

const imageFailed = ref(false);

const initials = computed(() => {
  if (!props.name) return '?';
  const parts = props.name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
});

const sizeClass = computed(() => `avatar-${props.size}`);

const healthBadgeClass = computed(() => {
  if (props.healthScore === null) return 'health-unknown';
  if (props.healthScore >= 80) return 'health-excellent';
  if (props.healthScore >= 60) return 'health-good';
  if (props.healthScore >= 40) return 'health-fair';
  return 'health-poor';
});

const healthIcon = computed(() => {
  if (props.healthScore === null) return 'hi-question-mark-circle';
  if (props.healthScore >= 60) return 'hi-heart';
  return 'hi-exclamation';
});

const healthIconScale = computed(() => {
  const scales = { xs: 0.5, sm: 0.55, md: 0.6, lg: 0.7, xl: 0.8 };
  return scales[props.size];
});

function onImageError() {
  imageFailed.value = true;
}
</script>

<style scoped lang="scss">
@import '../styles/sa-variables';

.patient-avatar {
  position: relative;
  display: inline-flex;
}

.avatar-ring {
  padding: 3px;
  border-radius: 50%;
  background: $sa-sky-gradient;
}

.avatar-image {
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, $sa-sky-light 0%, #B3E5FC 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid $sa-white;
  box-shadow: $sa-shadow-sm;
  transition: all $sa-transition;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.avatar-initials {
  font-weight: 700;
  color: $sa-sky-dark;
  letter-spacing: 0.02em;
}

// Size variants
.avatar-xs {
  .avatar-image {
    width: 28px;
    height: 28px;
  }
  .avatar-initials {
    font-size: 0.625rem;
  }
  .health-badge {
    width: 14px;
    height: 14px;
    bottom: -1px;
    right: -1px;
    border-width: 1.5px;
  }
  .online-indicator {
    width: 8px;
    height: 8px;
  }
}

.avatar-sm {
  .avatar-image {
    width: 36px;
    height: 36px;
  }
  .avatar-initials {
    font-size: 0.75rem;
  }
  .health-badge {
    width: 16px;
    height: 16px;
  }
  .online-indicator {
    width: 10px;
    height: 10px;
  }
}

.avatar-md {
  .avatar-image {
    width: 44px;
    height: 44px;
  }
  .avatar-initials {
    font-size: 0.875rem;
  }
}

.avatar-lg {
  .avatar-image {
    width: 56px;
    height: 56px;
  }
  .avatar-initials {
    font-size: 1rem;
  }
  .health-badge {
    width: 22px;
    height: 22px;
    bottom: 0;
    right: 0;
  }
  .online-indicator {
    width: 14px;
    height: 14px;
  }
}

.avatar-xl {
  .avatar-image {
    width: 72px;
    height: 72px;
  }
  .avatar-initials {
    font-size: 1.25rem;
  }
  .health-badge {
    width: 26px;
    height: 26px;
    bottom: 2px;
    right: 2px;
  }
  .online-indicator {
    width: 16px;
    height: 16px;
  }
}

// With ring enhancement
.with-ring {
  .avatar-image {
    border: none;
    box-shadow: none;
  }
}

// Health badge with gradient backgrounds
.health-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid $sa-white;
  color: white;
  box-shadow: $sa-shadow-xs;
  transition: all $sa-transition;
}

.health-excellent {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
}

.health-good {
  background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%);
}

.health-fair {
  background: linear-gradient(135deg, #FFB800 0%, #F57C00 100%);
}

.health-poor {
  background: linear-gradient(135deg, #EF5350 0%, #C62828 100%);
}

.health-unknown {
  background: linear-gradient(135deg, #94A3B8 0%, #64748B 100%);
}

// Online status with pulse animation
.online-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $sa-gray-400;
  border: 2px solid $sa-white;
  box-shadow: $sa-shadow-xs;
  transition: all $sa-transition;

  &.online {
    background: $sa-success;

    .online-pulse {
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: $sa-success;
      animation: onlinePulse 2s ease-in-out infinite;
    }
  }
}

@keyframes onlinePulse {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.5);
  }
}
</style>
