<template>
  <div class="notifications-page">
    <div class="notifications-page__header">
      <div class="notifications-page__title-row">
        <h1 class="notifications-page__title">Notifications</h1>
        <span v-if="unreadCount > 0" class="notifications-page__unread-badge">
          {{ unreadCount }} unread
        </span>
      </div>

      <div class="notifications-page__actions">
        <button
          v-if="unreadCount > 0"
          class="btn btn--secondary"
          @click="handleMarkAllAsRead"
          :disabled="markingAllRead"
        >
          {{ markingAllRead ? 'Marking...' : 'Mark all as read' }}
        </button>

        <div class="notifications-page__filter-dropdown" ref="filterDropdownRef">
          <button
            class="btn btn--outline"
            @click="showFilters = !showFilters"
          >
            <FilterIcon class="btn-icon" />
            Filter
            <span v-if="activeFilterCount > 0" class="filter-count">{{ activeFilterCount }}</span>
          </button>

          <transition name="fade">
            <div v-if="showFilters" class="filter-panel">
              <div class="filter-group">
                <label class="filter-label">Status</label>
                <select v-model="localFilters.is_read" class="filter-select">
                  <option :value="null">All</option>
                  <option :value="false">Unread</option>
                  <option :value="true">Read</option>
                </select>
              </div>

              <div class="filter-group">
                <label class="filter-label">Type</label>
                <select v-model="localFilters.type" class="filter-select">
                  <option :value="null">All types</option>
                  <option value="appointment_booked">Appointments</option>
                  <option value="payment_received">Payments</option>
                  <option value="prescription_created">Prescriptions</option>
                  <option value="pharmacy_order_placed">Pharmacy</option>
                  <option value="health_checkup_complete">Health</option>
                </select>
              </div>

              <div class="filter-group">
                <label class="filter-label">Priority</label>
                <select v-model="localFilters.priority" class="filter-select">
                  <option :value="null">All priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div class="filter-actions">
                <button class="btn btn--text" @click="handleResetFilters">Reset</button>
                <button class="btn btn--primary btn--small" @click="handleApplyFilters">Apply</button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <div class="notifications-page__content">
      <div v-if="loading && notifications.length === 0" class="notifications-page__loading">
        <div class="spinner"></div>
        <span>Loading notifications...</span>
      </div>

      <div v-else-if="notifications.length === 0" class="notifications-page__empty">
        <div class="empty-state">
          <BellIcon class="empty-state__icon" />
          <h3 class="empty-state__title">No notifications</h3>
          <p class="empty-state__description">
            You're all caught up! We'll notify you when something important happens.
          </p>
        </div>
      </div>

      <div v-else class="notifications-page__list">
        <div
          v-for="(group, dateKey) in groupedNotifications"
          :key="dateKey"
          class="notification-group"
        >
          <div class="notification-group__header">
            <span class="notification-group__date">{{ dateKey }}</span>
          </div>

          <div class="notification-group__items">
            <NotificationItem
              v-for="notification in group"
              :key="notification._id"
              :notification="notification"
              @click="handleNotificationClick"
              @mark-read="handleMarkAsRead"
              @delete="handleDelete"
            />
          </div>
        </div>

        <div v-if="loadingMore" class="notifications-page__loading-more">
          <div class="spinner spinner--small"></div>
          <span>Loading more...</span>
        </div>

        <button
          v-if="hasMore && !loadingMore"
          class="notifications-page__load-more"
          @click="handleLoadMore"
        >
          Load more notifications
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import NotificationItem from '@/components/Notifications/NotificationItem.vue';
import useNotifications from '@/composables/useNotifications';

// Icon components with render functions
import { h } from 'vue';

const BellIcon = {
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' })
    ]);
  }
};

const FilterIcon = {
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' })
    ]);
  }
};

export default {
  name: 'NotificationsPage',

  components: {
    NotificationItem,
    BellIcon,
    FilterIcon,
  },

  setup() {
    const router = useRouter();
    const filterDropdownRef = ref(null);
    const showFilters = ref(false);
    const markingAllRead = ref(false);

    const localFilters = reactive({
      is_read: null,
      type: null,
      priority: null,
    });

    const {
      notifications,
      unreadCount,
      loading,
      loadingMore,
      hasMore,
      filters,
      initNotifications,
      fetchNotifications,
      loadMore,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      setFilters,
      resetFilters,
    } = useNotifications();

    // Group notifications by date
    const groupedNotifications = computed(() => {
      const groups = {};

      notifications.value.forEach((notification) => {
        const date = new Date(notification.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateKey;
        if (date.toDateString() === today.toDateString()) {
          dateKey = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
          dateKey = 'Yesterday';
        } else {
          dateKey = date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });
        }

        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(notification);
      });

      return groups;
    });

    // Active filter count
    const activeFilterCount = computed(() => {
      let count = 0;
      if (filters.value.is_read !== null) count++;
      if (filters.value.type) count++;
      if (filters.value.priority) count++;
      return count;
    });

    // Initialize on mount
    onMounted(async () => {
      await initNotifications();

      // Click outside handler for filter dropdown
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    const handleClickOutside = (event) => {
      if (filterDropdownRef.value && !filterDropdownRef.value.contains(event.target)) {
        showFilters.value = false;
      }
    };

    const handleNotificationClick = async (notification) => {
      if (!notification.is_read) {
        await markAsRead(notification._id);
      }

      if (notification.action_url) {
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

    const handleApplyFilters = async () => {
      showFilters.value = false;
      await setFilters(localFilters);
    };

    const handleResetFilters = async () => {
      localFilters.is_read = null;
      localFilters.type = null;
      localFilters.priority = null;
      showFilters.value = false;
      await resetFilters();
    };

    // Sync local filters with store filters
    watch(filters, (newFilters) => {
      localFilters.is_read = newFilters.is_read;
      localFilters.type = newFilters.type;
      localFilters.priority = newFilters.priority;
    }, { immediate: true });

    return {
      filterDropdownRef,
      showFilters,
      markingAllRead,
      localFilters,
      notifications,
      unreadCount,
      loading,
      loadingMore,
      hasMore,
      groupedNotifications,
      activeFilterCount,
      handleNotificationClick,
      handleMarkAsRead,
      handleMarkAllAsRead,
      handleDelete,
      handleLoadMore,
      handleApplyFilters,
      handleResetFilters,
    };
  },
};
</script>

<style scoped lang="scss">
.notifications-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.notifications-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.notifications-page__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notifications-page__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.notifications-page__unread-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background-color: #eff6ff;
  color: #1e40af;
  font-size: 14px;
  font-weight: 500;
  border-radius: 9999px;
}

.notifications-page__actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.notifications-page__filter-dropdown {
  position: relative;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn--primary {
  background-color: #4f46e5;
  color: white;
}

.btn--primary:hover {
  background-color: #4338ca;
}

.btn--secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn--secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.btn--secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--outline {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn--outline:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn--text {
  background: none;
  color: #6b7280;
  padding: 8px 12px;
}

.btn--text:hover {
  color: #374151;
}

.btn--small {
  padding: 8px 12px;
  font-size: 13px;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  background-color: #4f46e5;
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9999px;
}

.filter-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 100;
}

.filter-group {
  margin-bottom: 16px;
}

.filter-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.filter-select {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: white;
  color: #111827;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  padding-right: 36px;
}

.filter-select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.notifications-page__content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.notifications-page__loading,
.notifications-page__loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #6b7280;
}

.notifications-page__loading-more {
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.notifications-page__empty {
  padding: 60px 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-state__icon {
  width: 64px;
  height: 64px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state__title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.empty-state__description {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  max-width: 300px;
}

.notification-group {
  border-bottom: 1px solid #f0f0f0;
}

.notification-group:last-child {
  border-bottom: none;
}

.notification-group__header {
  padding: 12px 16px;
  background-color: #f9fafb;
  border-bottom: 1px solid #f0f0f0;
}

.notification-group__date {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.notifications-page__load-more {
  width: 100%;
  padding: 16px;
  background: none;
  border: none;
  border-top: 1px solid #f0f0f0;
  color: #4f46e5;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notifications-page__load-more:hover {
  background-color: #f9fafb;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner--small {
  width: 16px;
  height: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}


@media (max-width: 640px) {
  .notifications-page {
    padding: 16px;
  }

  .notifications-page__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .notifications-page__title {
    font-size: 24px;
  }

  .notifications-page__actions {
    width: 100%;
    justify-content: flex-end;
    gap: 8px;
  }

  .notifications-page__filter-dropdown {
    position: static;
    width: 100%;
  }

  .filter-panel {
    position: relative;
    top: auto;
    right: auto;
    width: 100%;
    margin-top: 12px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .filter-select {
    padding: 12px;
    font-size: 16px;
  }

  .btn {
    padding: 8px 12px;
    font-size: 13px;
  }

  .btn--secondary {
    flex: 1;
  }
}
</style>
