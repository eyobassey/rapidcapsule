import axios from "../../services/http";

export default {
  namespaced: true,

  state() {
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      loadingMore: false,
      error: null,
      pagination: {
        page: 1,
        pages: 1,
        total: 0,
        limit: 20,
      },
      filters: {
        is_read: null,
        type: null,
        priority: null,
      },
      socketConnected: false,
    };
  },

  getters: {
    getNotifications: (state) => state.notifications,
    getUnreadCount: (state) => state.unreadCount,
    getLoading: (state) => state.loading,
    getLoadingMore: (state) => state.loadingMore,
    getError: (state) => state.error,
    getPagination: (state) => state.pagination,
    getFilters: (state) => state.filters,
    isSocketConnected: (state) => state.socketConnected,
    getUnreadNotifications: (state) => state.notifications.filter((n) => !n.is_read),
    getRecentNotifications: (state) => state.notifications.slice(0, 5),
    hasMoreNotifications: (state) => state.pagination.page < state.pagination.pages,
  },

  mutations: {
    SET_NOTIFICATIONS(state, notifications) {
      state.notifications = notifications;
    },
    APPEND_NOTIFICATIONS(state, notifications) {
      // Avoid duplicates
      const existingIds = new Set(state.notifications.map((n) => n._id));
      const newNotifications = notifications.filter((n) => !existingIds.has(n._id));
      state.notifications = [...state.notifications, ...newNotifications];
    },
    PREPEND_NOTIFICATION(state, notification) {
      // Add to beginning and avoid duplicates
      const existingIndex = state.notifications.findIndex((n) => n._id === notification._id);
      if (existingIndex > -1) {
        state.notifications[existingIndex] = notification;
      } else {
        state.notifications.unshift(notification);
      }
    },
    UPDATE_NOTIFICATION(state, notification) {
      const index = state.notifications.findIndex((n) => n._id === notification._id);
      if (index > -1) {
        state.notifications[index] = { ...state.notifications[index], ...notification };
      }
    },
    REMOVE_NOTIFICATION(state, notificationId) {
      state.notifications = state.notifications.filter((n) => n._id !== notificationId);
    },
    MARK_AS_READ(state, notificationId) {
      const notification = state.notifications.find((n) => n._id === notificationId);
      if (notification && !notification.is_read) {
        notification.is_read = true;
        notification.read_at = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    MARK_ALL_AS_READ(state) {
      state.notifications.forEach((n) => {
        if (!n.is_read) {
          n.is_read = true;
          n.read_at = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
    },
    SET_UNREAD_COUNT(state, count) {
      state.unreadCount = count;
    },
    INCREMENT_UNREAD_COUNT(state) {
      state.unreadCount++;
    },
    DECREMENT_UNREAD_COUNT(state) {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_LOADING_MORE(state, loading) {
      state.loadingMore = loading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
    SET_PAGINATION(state, pagination) {
      state.pagination = { ...state.pagination, ...pagination };
    },
    SET_FILTERS(state, filters) {
      state.filters = { ...state.filters, ...filters };
    },
    RESET_FILTERS(state) {
      state.filters = {
        is_read: null,
        type: null,
        priority: null,
      };
    },
    SET_SOCKET_CONNECTED(state, connected) {
      state.socketConnected = connected;
    },
    CLEAR_NOTIFICATIONS(state) {
      state.notifications = [];
      state.pagination = {
        page: 1,
        pages: 1,
        total: 0,
        limit: 20,
      };
    },
  },

  actions: {
    // Fetch notifications with pagination
    async fetchNotifications({ commit, state }, { page = 1, limit = 20, append = false } = {}) {
      try {
        if (append) {
          commit("SET_LOADING_MORE", true);
        } else {
          commit("SET_LOADING", true);
        }
        commit("SET_ERROR", null);

        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", limit);

        if (state.filters.is_read !== null) {
          params.append("is_read", state.filters.is_read);
        }
        if (state.filters.type) {
          params.append("type", state.filters.type);
        }
        if (state.filters.priority) {
          params.append("priority", state.filters.priority);
        }

        const response = await axios.get(`notifications?${params.toString()}`);

        if (response.status === 200) {
          const { data, pagination } = response.data;

          if (append) {
            commit("APPEND_NOTIFICATIONS", data || []);
          } else {
            commit("SET_NOTIFICATIONS", data || []);
          }

          commit("SET_PAGINATION", pagination || {
            page,
            pages: 1,
            total: data?.length || 0,
            limit,
          });
        }

        return response.data;
      } catch (error) {
        console.error("Error fetching notifications:", error);
        commit("SET_ERROR", error.response?.data?.message || "Failed to fetch notifications");
        throw error;
      } finally {
        commit("SET_LOADING", false);
        commit("SET_LOADING_MORE", false);
      }
    },

    // Fetch unread count
    async fetchUnreadCount({ commit }) {
      try {
        const response = await axios.get("notifications/unread-count");
        if (response.status === 200) {
          const count = response.data.data?.unread_count || 0;
          commit("SET_UNREAD_COUNT", count);
          return count;
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
        // Don't throw - this is a background operation
        return 0;
      }
    },

    // Load more notifications
    async loadMore({ dispatch, state }) {
      if (state.pagination.page >= state.pagination.pages) {
        return;
      }

      await dispatch("fetchNotifications", {
        page: state.pagination.page + 1,
        limit: state.pagination.limit,
        append: true,
      });
    },

    // Mark single notification as read
    async markAsRead({ commit }, notificationId) {
      try {
        const response = await axios.patch(`notifications/${notificationId}/read`);
        if (response.status === 200) {
          commit("MARK_AS_READ", notificationId);
        }
        return response.data;
      } catch (error) {
        console.error("Error marking notification as read:", error);
        throw error;
      }
    },

    // Mark all notifications as read
    async markAllAsRead({ commit }) {
      try {
        const response = await axios.patch("notifications/read-all");
        if (response.status === 200) {
          commit("MARK_ALL_AS_READ");
        }
        return response.data;
      } catch (error) {
        console.error("Error marking all as read:", error);
        throw error;
      }
    },

    // Delete notification
    async deleteNotification({ commit }, notificationId) {
      try {
        const response = await axios.delete(`notifications/${notificationId}`);
        if (response.status === 200) {
          commit("REMOVE_NOTIFICATION", notificationId);
        }
        return response.data;
      } catch (error) {
        console.error("Error deleting notification:", error);
        throw error;
      }
    },

    // Set filters and refetch
    async setFilters({ commit, dispatch }, filters) {
      commit("SET_FILTERS", filters);
      commit("CLEAR_NOTIFICATIONS");
      await dispatch("fetchNotifications", { page: 1 });
    },

    // Reset filters
    async resetFilters({ commit, dispatch }) {
      commit("RESET_FILTERS");
      commit("CLEAR_NOTIFICATIONS");
      await dispatch("fetchNotifications", { page: 1 });
    },

    // Add notification from WebSocket
    addRealTimeNotification({ commit }, notification) {
      commit("PREPEND_NOTIFICATION", notification);
      if (!notification.is_read) {
        commit("INCREMENT_UNREAD_COUNT");
      }
    },

    // Handle notification read event from WebSocket
    handleNotificationRead({ commit }, { notificationId }) {
      commit("MARK_AS_READ", notificationId);
    },

    // Handle all notifications read event from WebSocket
    handleAllNotificationsRead({ commit }) {
      commit("MARK_ALL_AS_READ");
    },

    // Handle notification deleted event from WebSocket
    handleNotificationDeleted({ commit }, { notificationId }) {
      commit("REMOVE_NOTIFICATION", notificationId);
    },

    // Set socket connection status
    setSocketConnected({ commit }, connected) {
      commit("SET_SOCKET_CONNECTED", connected);
    },

    // Clear all notifications (on logout)
    clearNotifications({ commit }) {
      commit("CLEAR_NOTIFICATIONS");
      commit("SET_UNREAD_COUNT", 0);
    },
  },
};
