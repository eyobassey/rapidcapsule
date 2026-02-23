<template>
  <div class="sync-status" v-if="syncLogs.length > 0">
    <h3 class="section-title">Recent Sync Activity</h3>
    <div class="sync-list">
      <div
        v-for="log in syncLogs"
        :key="log._id"
        class="sync-item"
        :class="log.status"
      >
        <div class="sync-icon">
          <v-icon
            :name="statusIcon(log.status)"
            scale="0.85"
          />
        </div>
        <div class="sync-info">
          <span class="sync-provider">{{ formatProvider(log.provider) }}</span>
          <span class="sync-detail">
            {{ log.recordsProcessed || 0 }} records
            <template v-if="log.recordsSyncedToVitals">
              &middot; {{ log.recordsSyncedToVitals }} to vitals
            </template>
          </span>
        </div>
        <div class="sync-meta">
          <span class="sync-type">{{ log.syncType }}</span>
          <span class="sync-time">{{ formatTime(log.startedAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  syncLogs: {
    type: Array,
    default: () => [],
  },
});

const statusIcon = (status) => {
  switch (status) {
    case 'completed': return 'hi-check-circle';
    case 'failed': return 'hi-x-circle';
    case 'started': return 'hi-refresh';
    default: return 'hi-clock';
  }
};

const formatProvider = (provider) => {
  const names = {
    google_fit: 'Google Fit',
    samsung_health: 'Samsung Health',
    apple_health: 'Apple Health',
    garmin: 'Garmin',
    polar: 'Polar',
    suunto: 'Suunto',
    whoop: 'Whoop',
  };
  return names[provider] || provider;
};

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
  return date.toLocaleDateString();
};
</script>

<style scoped lang="scss">
.sync-status {
  margin-top: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1A365D;
  margin: 0 0 1rem 0;
}

.sync-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sync-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #F8FAFC;
  border-radius: 0.5rem;
  border-left: 3px solid #E2E8F0;

  &.completed {
    border-left-color: #10B981;
  }

  &.failed {
    border-left-color: #EF4444;
  }

  &.started {
    border-left-color: #F59E0B;
  }
}

.sync-icon {
  flex-shrink: 0;

  .completed & {
    color: #10B981;
  }

  .failed & {
    color: #EF4444;
  }

  .started & {
    color: #F59E0B;
  }
}

.sync-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.sync-provider {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1A365D;
}

.sync-detail {
  font-size: 0.75rem;
  color: #64748B;
}

.sync-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
  flex-shrink: 0;
}

.sync-type {
  font-size: 0.6875rem;
  color: #94A3B8;
  text-transform: capitalize;
}

.sync-time {
  font-size: 0.75rem;
  color: #64748B;
}
</style>
