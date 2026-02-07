<template>
  <div
    :class="[
      'notification-item',
      { 'notification-item--unread': !notification.is_read },
      { 'notification-item--urgent': notification.priority === 'urgent' },
    ]"
    @click="handleClick"
  >
    <div class="notification-item__icon">
      <component :is="iconComponent" class="icon" />
    </div>

    <div class="notification-item__content">
      <div class="notification-item__header">
        <span class="notification-item__title">{{ notification.title }}</span>
        <span class="notification-item__time">{{ formatTime(notification.created_at) }}</span>
      </div>

      <p class="notification-item__message">{{ notification.message }}</p>

      <div v-if="notification.priority === 'urgent'" class="notification-item__badge">
        Urgent
      </div>
    </div>

    <div class="notification-item__actions" @click.stop>
      <button
        v-if="!notification.is_read"
        class="action-btn"
        title="Mark as read"
        @click="handleMarkAsRead"
      >
        <CheckIcon class="icon-sm" />
      </button>

      <button
        class="action-btn action-btn--delete"
        title="Delete"
        @click="handleDelete"
      >
        <TrashIcon class="icon-sm" />
      </button>
    </div>
  </div>
</template>

<script>
import { computed, defineComponent } from 'vue';

// Icon components with render functions to avoid template parsing issues
import { h } from 'vue';

const BellIcon = {
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' })
    ]);
  }
};

const CalendarIcon = {
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' })
    ]);
  }
};

const CreditCardIcon = {
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' })
    ]);
  }
};

const DocumentIcon = {
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ]);
  }
};

const HeartIcon = {
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' })
    ]);
  }
};

const ShoppingBagIcon = {
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' })
    ]);
  }
};

const CheckIcon = {
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M5 13l4 4L19 7' })
    ]);
  }
};

const TrashIcon = {
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' })
    ]);
  }
};

export default defineComponent({
  name: 'NotificationItem',

  components: {
    BellIcon,
    CalendarIcon,
    CreditCardIcon,
    DocumentIcon,
    HeartIcon,
    ShoppingBagIcon,
    CheckIcon,
    TrashIcon,
  },

  props: {
    notification: {
      type: Object,
      required: true,
    },
  },

  emits: ['click', 'mark-read', 'delete'],

  setup(props, { emit }) {
    const iconComponent = computed(() => {
      const type = props.notification.type || '';

      if (type.startsWith('appointment')) return 'CalendarIcon';
      if (type.startsWith('payment') || type.startsWith('wallet') || type.startsWith('earnings')) return 'CreditCardIcon';
      if (type.startsWith('prescription')) return 'DocumentIcon';
      if (type.startsWith('pharmacy')) return 'ShoppingBagIcon';
      if (type.startsWith('health') || type.startsWith('vitals')) return 'HeartIcon';

      return 'BellIcon';
    });

    const formatTime = (dateString) => {
      if (!dateString) return '';

      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    };

    const handleClick = () => {
      emit('click', props.notification);
    };

    const handleMarkAsRead = () => {
      emit('mark-read', props.notification._id);
    };

    const handleDelete = () => {
      emit('delete', props.notification._id);
    };

    return {
      iconComponent,
      formatTime,
      handleClick,
      handleMarkAsRead,
      handleDelete,
    };
  },
});
</script>

<style scoped lang="scss">
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-item--unread {
  background-color: #eff6ff;
}

.notification-item--unread:hover {
  background-color: #dbeafe;
}

.notification-item--urgent {
  border-left: 3px solid #ef4444;
}

.notification-item__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e0e7ff;
  border-radius: 50%;
  color: #4f46e5;
}

.notification-item--urgent .notification-item__icon {
  background-color: #fee2e2;
  color: #dc2626;
}

.icon {
  width: 20px;
  height: 20px;
}

.notification-item__content {
  flex: 1;
  min-width: 0;
}

.notification-item__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
}

.notification-item__title {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
  line-height: 1.3;
}

.notification-item--unread .notification-item__title {
  color: #1e40af;
}

.notification-item__time {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.notification-item__message {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.4;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-item__badge {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #dc2626;
  background-color: #fee2e2;
  border-radius: 9999px;
  text-transform: uppercase;
}

.notification-item__actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notification-item:hover .notification-item__actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #e5e7eb;
  color: #374151;
}

.action-btn--delete:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

@media (max-width: 640px) {
  .notification-item__actions {
    opacity: 1;
  }
}
</style>
