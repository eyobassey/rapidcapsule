<template>
  <div class="notification-bell" ref="bellRef">
    <button
      class="notification-bell__button"
      :class="{ 'notification-bell__button--active': isOpen }"
      @click="toggleDropdown"
      aria-label="Notifications"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        class="notification-bell__icon"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      <span
        v-if="unreadCount > 0"
        class="notification-bell__badge"
        :class="{ 'notification-bell__badge--large': unreadCount > 9 }"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>

      <span
        v-if="!isSocketConnected && unreadCount === 0"
        class="notification-bell__status notification-bell__status--disconnected"
        title="Reconnecting..."
      ></span>
    </button>

    <transition name="dropdown">
      <NotificationDropdown
        v-if="isOpen"
        @close="closeDropdown"
      />
    </transition>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, defineComponent } from 'vue';
import NotificationDropdown from './NotificationDropdown.vue';
import useNotifications from '@/composables/useNotifications';

export default defineComponent({
  name: 'NotificationBell',

  components: {
    NotificationDropdown,
  },

  setup() {
    const bellRef = ref(null);
    const isOpen = ref(false);

    const {
      unreadCount,
      isSocketConnected,
      initNotifications,
      cleanup,
      fetchUnreadCount,
    } = useNotifications();

    // Initialize on mount
    onMounted(async () => {
      await initNotifications();

      // Click outside handler
      document.addEventListener('click', handleClickOutside);

      // Periodically refresh unread count
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 60000); // Every minute

      // Clean up interval on unmount
      onUnmounted(() => {
        clearInterval(interval);
      });
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
      cleanup();
    });

    const handleClickOutside = (event) => {
      if (bellRef.value && !bellRef.value.contains(event.target)) {
        isOpen.value = false;
      }
    };

    const toggleDropdown = () => {
      isOpen.value = !isOpen.value;
    };

    const closeDropdown = () => {
      isOpen.value = false;
    };

    return {
      bellRef,
      isOpen,
      unreadCount,
      isSocketConnected,
      toggleDropdown,
      closeDropdown,
    };
  },
});
</script>

<style scoped lang="scss">
.notification-bell {
  position: relative;
}

.notification-bell__button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: #4b5563;
}

.notification-bell__button:hover {
  background-color: #f3f4f6;
}

.notification-bell__button--active {
  background-color: #eff6ff;
  color: #4f46e5;
}

.notification-bell__icon {
  width: 24px;
  height: 24px;
}

.notification-bell__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background-color: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
  animation: pulse 2s infinite;
}

.notification-bell__badge--large {
  top: 2px;
  right: 0;
  font-size: 10px;
}

.notification-bell__status {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid white;
}

.notification-bell__status--disconnected {
  background-color: #f59e0b;
  animation: blink 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Dropdown animation */
.dropdown-enter-active {
  animation: dropdown-in 0.2s ease-out;
}

.dropdown-leave-active {
  animation: dropdown-out 0.15s ease-in;
}

@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dropdown-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
}
</style>
