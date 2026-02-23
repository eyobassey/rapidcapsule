<template>
  <div
    class="provider-card"
    :class="{
      connected: isConnected,
      syncing: isSyncing,
      error: isError,
      unavailable: !isAvailable,
    }"
  >
    <div class="provider-icon" :style="{ background: provider.color }">
      <v-icon :name="provider.icon" scale="1.2" />
    </div>
    <div class="provider-info">
      <h4>{{ provider.name }}</h4>
      <p v-if="isSyncing">Syncing...</p>
      <p v-else-if="isConnected && integration?.lastSyncedAt">
        Last sync: {{ formatTime(integration.lastSyncedAt) }}
      </p>
      <p v-else-if="isError">Connection error</p>
      <p v-else-if="!isAvailable">Not available</p>
      <p v-else>{{ provider.description }}</p>
    </div>
    <div class="provider-actions">
      <template v-if="isConnected">
        <button
          class="btn-sync"
          @click.stop="$emit('sync', provider.id)"
          :disabled="isSyncing"
          title="Sync now"
        >
          <v-icon name="hi-refresh" scale="0.9" :class="{ spinning: isSyncing }" />
        </button>
        <button
          class="btn-disconnect"
          @click.stop="$emit('disconnect', provider.id)"
          title="Disconnect"
        >
          <v-icon name="hi-x-circle" scale="0.9" />
        </button>
      </template>
      <template v-else-if="isAvailable">
        <button class="btn-connect" @click.stop="$emit('connect', provider.id)">
          Connect
        </button>
      </template>
      <span v-else class="status-unavailable">Unavailable</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  provider: {
    type: Object,
    required: true,
  },
  integration: {
    type: Object,
    default: null,
  },
  isSyncing: {
    type: Boolean,
    default: false,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

defineEmits(['connect', 'disconnect', 'sync']);

const isConnected = computed(() => props.integration?.status === 'connected');
const isError = computed(() => props.integration?.status === 'error');

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};
</script>

<style scoped lang="scss">
.provider-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #F8FAFC;
  border: 2px solid #E2E8F0;
  border-radius: 0.75rem;
  transition: all 0.2s;

  &:hover {
    border-color: #CBD5E1;
  }

  &.connected {
    background: #E1F5FE;
    border-color: #4FC3F7;
  }

  &.syncing {
    background: #FFF8E1;
    border-color: #FFD54F;
  }

  &.error {
    background: #FFF3F0;
    border-color: #FF8A65;
  }

  &.unavailable {
    opacity: 0.5;
  }
}

.provider-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.provider-info {
  flex: 1;
  min-width: 0;

  h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1A365D;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.75rem;
    color: #64748B;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.provider-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-connect {
  padding: 0.375rem 1rem;
  background: #4FC3F7;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #29B6F6;
  }
}

.btn-sync,
.btn-disconnect {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
}

.btn-sync {
  color: #4FC3F7;

  &:hover {
    background: rgba(79, 195, 247, 0.1);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.btn-disconnect {
  color: #EF5350;

  &:hover {
    background: rgba(239, 83, 80, 0.1);
  }
}

.status-unavailable {
  font-size: 0.75rem;
  color: #9CA3AF;
  font-weight: 500;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .provider-card {
    padding: 0.875rem;
    gap: 0.75rem;
  }

  .provider-icon {
    width: 40px;
    height: 40px;
  }

  .provider-info h4 {
    font-size: 0.875rem;
  }
}
</style>
