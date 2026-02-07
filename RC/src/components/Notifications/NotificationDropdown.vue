<template>
  <div class="notification-dropdown" ref="dropdownRef">
    <div class="notification-dropdown__header">
      <h3 class="notification-dropdown__title">Notifications</h3>
      <button
        v-if="unreadCount > 0"
        class="notification-dropdown__mark-all"
        @click="handleMarkAllAsRead"
        :disabled="markingAllRead"
      >
        {{ markingAllRead ? 'Marking...' : 'Mark all as read' }}
      </button>
    </div>

    <div class="notification-dropdown__content" ref="contentRef">
      <div v-if="loading && notifications.length === 0" class="notification-dropdown__loading">
        <div class="spinner"></div>
        <span>Loading notifications...</span>
      </div>

      <div v-else-if="notifications.length === 0" class="notification-dropdown__empty">
        <BellIcon class="empty-icon" />
        <p>No notifications yet</p>
        <span>We'll notify you when something important happens</span>
      </div>

      <div v-else class="notification-dropdown__list">
        <NotificationItem
          v-for="notification in notifications"
          :key="notification._id"
          :notification="notification"
          @click="handleNotificationClick"
          @mark-read="handleMarkAsRead"
          @delete="handleDelete"
        />

        <div v-if="loadingMore" class="notification-dropdown__loading-more">
          <div class="spinner spinner--small"></div>
        </div>

        <button
          v-if="hasMore && !loadingMore"
          class="notification-dropdown__load-more"
          @click="handleLoadMore"
        >
          Load more
        </button>
      </div>
    </div>

    <div class="notification-dropdown__footer">
      <router-link
        to="/app/patient/notifications"
        class="notification-dropdown__view-all"
        @click="$emit('close')"
      >
        View all notifications
      </router-link>
    </div>
  </div>
</template>

<script>
import { ref, defineComponent, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import NotificationItem from './NotificationItem.vue';
import useNotifications from '@/composables/useNotifications';

// Bell icon component with render function to avoid template parsing issues
import { h } from 'vue';

const BellIcon = {
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' })
    ]);
  }
};

export default defineComponent({
  name: 'NotificationDropdown',

  components: {
    NotificationItem,
    BellIcon,
  },

  emits: ['close'],

  setup(props, { emit }) {
    const router = useRouter();
    const dropdownRef = ref(null);
    const contentRef = ref(null);
    const markingAllRead = ref(false);

    const {
      notifications,
      unreadCount,
      loading,
      loadingMore,
      hasMore,
      fetchNotifications,
      loadMore,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    } = useNotifications();

    // Fetch notifications on mount
    onMounted(async () => {
      await fetchNotifications();

      // Handle scroll for lazy loading
      if (contentRef.value) {
        contentRef.value.addEventListener('scroll', handleScroll);
      }
    });

    onUnmounted(() => {
      if (contentRef.value) {
        contentRef.value.removeEventListener('scroll', handleScroll);
      }
    });

    const handleScroll = () => {
      if (!contentRef.value || loadingMore.value || !hasMore.value) return;

      const { scrollTop, scrollHeight, clientHeight } = contentRef.value;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        handleLoadMore();
      }
    };

    const handleNotificationClick = async (notification) => {
      // Mark as read if unread
      if (!notification.is_read) {
        await markAsRead(notification._id);
      }

      // Navigate to action URL if present
      if (notification.action_url) {
        emit('close');
        router.push(notification.action_url);
      }
    };

    const handleMarkAsRead = async (notificationId) => {
      await markAsRead(notificationId);
    };

    const handleMarkAllAsRead = async () => {
      markingAllRead.value = true;
      try {
        await markAllAsRead();
      } finally {
        markingAllRead.value = false;
      }
    };

    const handleDelete = async (notificationId) => {
      await deleteNotification(notificationId);
    };

    const handleLoadMore = async () => {
      await loadMore();
    };

    return {
      dropdownRef,
      contentRef,
      notifications,
      unreadCount,
      loading,
      loadingMore,
      hasMore,
      markingAllRead,
      handleNotificationClick,
      handleMarkAsRead,
      handleMarkAllAsRead,
      handleDelete,
      handleLoadMore,
    };
  },
});
</script>

<style scoped lang="scss">
.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 380px;
  max-height: 480px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

.notification-dropdown__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.notification-dropdown__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.notification-dropdown__mark-all {
  font-size: 13px;
  color: #4f46e5;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s ease;
}

.notification-dropdown__mark-all:hover:not(:disabled) {
  color: #4338ca;
}

.notification-dropdown__mark-all:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.notification-dropdown__content {
  flex: 1;
  overflow-y: auto;
  max-height: 350px;
}

.notification-dropdown__list {
  display: flex;
  flex-direction: column;
}

.notification-dropdown__loading,
.notification-dropdown__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.notification-dropdown__empty .empty-icon {
  width: 48px;
  height: 48px;
  color: #d1d5db;
  margin-bottom: 12px;
}

.notification-dropdown__empty p {
  margin: 0 0 4px 0;
  font-weight: 500;
  color: #374151;
}

.notification-dropdown__empty span {
  font-size: 13px;
}

.notification-dropdown__loading-more {
  display: flex;
  justify-content: center;
  padding: 12px;
}

.notification-dropdown__load-more {
  width: 100%;
  padding: 12px;
  background: none;
  border: none;
  border-top: 1px solid #f0f0f0;
  color: #4f46e5;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-dropdown__load-more:hover {
  background-color: #f9fafb;
}

.notification-dropdown__footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.notification-dropdown__view-all {
  font-size: 14px;
  font-weight: 500;
  color: #4f46e5;
  text-decoration: none;
  transition: color 0.2s ease;
}

.notification-dropdown__view-all:hover {
  color: #4338ca;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 8px;
}

.spinner--small {
  width: 16px;
  height: 16px;
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .notification-dropdown {
    width: 100vw;
    max-height: 70vh;
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 16px 16px 0 0;
  }
}
</style>
