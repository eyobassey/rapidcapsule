import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { io } from 'socket.io-client';

// Socket instance (singleton)
let socket = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useNotifications() {
  const store = useStore();

  // Reactive state
  const isConnecting = ref(false);
  const connectionError = ref(null);

  // Computed properties from store
  const notifications = computed(() => store.getters['notifications/getNotifications']);
  const unreadCount = computed(() => store.getters['notifications/getUnreadCount']);
  const loading = computed(() => store.getters['notifications/getLoading']);
  const loadingMore = computed(() => store.getters['notifications/getLoadingMore']);
  const hasMore = computed(() => store.getters['notifications/hasMoreNotifications']);
  const recentNotifications = computed(() => store.getters['notifications/getRecentNotifications']);
  const isSocketConnected = computed(() => store.getters['notifications/isSocketConnected']);
  const filters = computed(() => store.getters['notifications/getFilters']);
  const pagination = computed(() => store.getters['notifications/getPagination']);

  // Get token for authentication
  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Get user ID from store
  const getUserId = () => {
    const userProfile = store.getters.userprofile;
    return userProfile?._id;
  };

  // Initialize socket connection
  const connectSocket = () => {
    const token = getToken();
    const userId = getUserId();

    if (!token || !userId) {
      console.warn('Cannot connect to notifications socket: missing token or userId');
      return;
    }

    if (socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    isConnecting.value = true;
    connectionError.value = null;

    const apiUrl = process.env.VUE_APP_API_GATEWAY || 'http://localhost:5020';

    socket = io(`${apiUrl}/notifications`, {
      query: { userId },
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to notifications socket');
      isConnecting.value = false;
      connectionError.value = null;
      connectionAttempts = 0;
      store.dispatch('notifications/setSocketConnected', true);
    });

    socket.on('connected', (data) => {
      console.log('Server acknowledged connection:', data);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from notifications socket:', reason);
      store.dispatch('notifications/setSocketConnected', false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      connectionAttempts++;
      connectionError.value = error.message;
      isConnecting.value = false;

      if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn('Max reconnection attempts reached');
        disconnectSocket();
      }
    });

    // Notification events
    socket.on('notification', (notification) => {
      console.log('Received notification:', notification);
      store.dispatch('notifications/addRealTimeNotification', notification);

      // Play notification sound if desired
      playNotificationSound();

      // Show browser notification if permitted
      showBrowserNotification(notification);
    });

    socket.on('notification:read', ({ notificationId }) => {
      store.dispatch('notifications/handleNotificationRead', { notificationId });
    });

    socket.on('notifications:read-all', () => {
      store.dispatch('notifications/handleAllNotificationsRead');
    });

    socket.on('notification:deleted', ({ notificationId }) => {
      store.dispatch('notifications/handleNotificationDeleted', { notificationId });
    });

    // Heartbeat
    socket.on('pong', () => {
      console.log('Heartbeat received');
    });
  };

  // Disconnect socket
  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      store.dispatch('notifications/setSocketConnected', false);
    }
  };

  // Send ping for heartbeat
  const sendPing = () => {
    if (socket?.connected) {
      socket.emit('ping');
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Audio not available, ignore
    }
  };

  // Show browser notification
  const showBrowserNotification = async (notification) => {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification._id,
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification._id,
        });
      }
    }
  };

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  // Fetch notifications
  const fetchNotifications = async (options = {}) => {
    return store.dispatch('notifications/fetchNotifications', options);
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    return store.dispatch('notifications/fetchUnreadCount');
  };

  // Load more notifications
  const loadMore = async () => {
    return store.dispatch('notifications/loadMore');
  };

  // Mark as read
  const markAsRead = async (notificationId) => {
    return store.dispatch('notifications/markAsRead', notificationId);
  };

  // Mark all as read
  const markAllAsRead = async () => {
    return store.dispatch('notifications/markAllAsRead');
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    return store.dispatch('notifications/deleteNotification', notificationId);
  };

  // Set filters
  const setFilters = async (newFilters) => {
    return store.dispatch('notifications/setFilters', newFilters);
  };

  // Reset filters
  const resetFilters = async () => {
    return store.dispatch('notifications/resetFilters');
  };

  // Initialize notifications
  const initNotifications = async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount(),
    ]);
    connectSocket();
  };

  // Cleanup
  const cleanup = () => {
    disconnectSocket();
    store.dispatch('notifications/clearNotifications');
  };

  return {
    // State
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    recentNotifications,
    isSocketConnected,
    isConnecting,
    connectionError,
    filters,
    pagination,

    // Methods
    connectSocket,
    disconnectSocket,
    sendPing,
    fetchNotifications,
    fetchUnreadCount,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilters,
    resetFilters,
    initNotifications,
    cleanup,
    requestNotificationPermission,
  };
}

// Export a hook for use in setup
export default useNotifications;
