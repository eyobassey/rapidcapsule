import axios from "../../services/http";
import { io } from "socket.io-client";

let socket = null;
let typingTimeout = null;

const state = () => ({
	conversations: [],
	activeConversation: null,
	messages: [],
	presenceMap: {},
	typingMap: {},
	unreadTotal: 0,
	isConnected: false,
	isLoading: false,
	hasMoreMessages: false,
	messageCursor: null,
	hasConsent: null,
	messagingRestriction: { status: "none", message_cap: { enabled: false } },
});

const getters = {
	sortedConversations(state) {
		return [...state.conversations].sort((a, b) => {
			const aTime = a.last_message?.sent_at || a.updated_at || a.created_at;
			const bTime = b.last_message?.sent_at || b.updated_at || b.created_at;
			return new Date(bTime) - new Date(aTime);
		});
	},
	activeMessages(state) {
		return state.messages;
	},
	activeConversation(state) {
		return state.activeConversation;
	},
	totalUnread(state) {
		return state.unreadTotal;
	},
	isUserOnline: (state) => (userId) => {
		return state.presenceMap[userId] === "online";
	},
	getUserPresence: (state) => (userId) => {
		return state.presenceMap[userId] || "offline";
	},
	isUserTyping: (state) => (conversationId, userId) => {
		return state.typingMap[`${conversationId}:${userId}`] || false;
	},
	typingUsersInConversation: (state) => (conversationId) => {
		const typing = [];
		for (const key of Object.keys(state.typingMap)) {
			if (key.startsWith(`${conversationId}:`) && state.typingMap[key]) {
				typing.push(key.split(":")[1]);
			}
		}
		return typing;
	},
	isConnected(state) {
		return state.isConnected;
	},
	isLoading(state) {
		return state.isLoading;
	},
	hasMoreMessages(state) {
		return state.hasMoreMessages;
	},
	hasConsent(state) {
		return state.hasConsent;
	},
	messagingRestriction(state) {
		return state.messagingRestriction;
	},
};

const mutations = {
	SET_CONVERSATIONS(state, conversations) {
		state.conversations = conversations;
	},
	SET_ACTIVE_CONVERSATION(state, conversation) {
		state.activeConversation = conversation;
	},
	SET_MESSAGES(state, { messages, hasMore, cursor }) {
		state.messages = messages;
		state.hasMoreMessages = hasMore;
		state.messageCursor = cursor;
	},
	PREPEND_MESSAGES(state, { messages, hasMore, cursor }) {
		state.messages = [...messages, ...state.messages];
		state.hasMoreMessages = hasMore;
		state.messageCursor = cursor;
	},
	ADD_MESSAGE(state, message) {
		// Avoid duplicates
		const exists = state.messages.find((m) => m._id === message._id);
		if (!exists) {
			state.messages.push(message);
		}
	},
	UPDATE_MESSAGE_STATUS(state, { messageId, status }) {
		const msg = state.messages.find((m) => m._id === messageId);
		if (msg) {
			msg.status = { ...msg.status, ...status };
		}
	},
	MARK_ALL_MESSAGES_READ(state, { readBy, read_at }) {
		// Mark all messages sent by the current user as read by the other party
		const userId = state.activeConversation?.currentUserId;
		if (!userId) return;
		state.messages.forEach((msg) => {
			const senderId = msg.sender?._id || msg.sender;
			if (senderId === userId && !msg.status?.read_at) {
				msg.status = { ...msg.status, read_at, delivered_at: msg.status?.delivered_at || read_at };
			}
		});
	},
	REMOVE_MESSAGE(state, messageId) {
		state.messages = state.messages.filter((m) => m._id !== messageId);
	},
	UPDATE_MESSAGE(state, updatedMessage) {
		const idx = state.messages.findIndex((m) => m._id === updatedMessage._id);
		if (idx !== -1) {
			state.messages.splice(idx, 1, { ...state.messages[idx], ...updatedMessage });
		}
	},
	SET_TYPING(state, { conversationId, userId, isTyping }) {
		const key = `${conversationId}:${userId}`;
		if (isTyping) {
			state.typingMap = { ...state.typingMap, [key]: true };
		} else {
			const copy = { ...state.typingMap };
			delete copy[key];
			state.typingMap = copy;
		}
	},
	SET_PRESENCE(state, { userId, status }) {
		state.presenceMap = { ...state.presenceMap, [userId]: status };
	},
	SET_UNREAD_TOTAL(state, total) {
		state.unreadTotal = total;
	},
	UPDATE_CONVERSATION(state, updatedConv) {
		const idx = state.conversations.findIndex((c) => c._id === updatedConv._id);
		if (idx !== -1) {
			state.conversations.splice(idx, 1, { ...state.conversations[idx], ...updatedConv });
		}
	},
	UPDATE_CONVERSATION_LAST_MESSAGE(state, { conversationId, lastMessage, unreadCounts }) {
		const conv = state.conversations.find((c) => c._id === conversationId);
		if (conv) {
			conv.last_message = lastMessage;
			if (unreadCounts) conv.unread_counts = unreadCounts;
		}
	},
	MARK_CONVERSATION_READ(state, conversationId) {
		const conv = state.conversations.find((c) => c._id === conversationId);
		if (conv && conv.unread_counts) {
			// Reset current user's unread count
			const userId = state.activeConversation?.currentUserId;
			if (userId && conv.unread_counts[userId] !== undefined) {
				conv.unread_counts[userId] = 0;
			}
		}
	},
	SET_CONNECTED(state, connected) {
		state.isConnected = connected;
	},
	SET_LOADING(state, loading) {
		state.isLoading = loading;
	},
	SET_CONSENT(state, hasConsent) {
		state.hasConsent = hasConsent;
	},
	SET_MESSAGING_RESTRICTION(state, restriction) {
		state.messagingRestriction = restriction || { status: "none", message_cap: { enabled: false } };
	},
};

const actions = {
	// ===================== API CALLS =====================

	async fetchConversations({ commit }, query = {}) {
		commit("SET_LOADING", true);
		try {
			const params = new URLSearchParams();
			if (query.page) params.append("page", query.page);
			if (query.limit) params.append("limit", query.limit);
			if (query.search) params.append("search", query.search);

			const { data } = await axios.get(`messaging/conversations?${params}`);
			commit("SET_CONVERSATIONS", data.data.data);

			// Calculate total unread
			const userId = data.data.data.length > 0 ? getCurrentUserId() : null;
			if (userId) {
				const total = data.data.data.reduce((sum, conv) => {
					return sum + (conv.unread_counts?.[userId] || 0);
				}, 0);
				commit("SET_UNREAD_TOTAL", total);
			}
		} catch (error) {
			console.error("Failed to fetch conversations:", error);
		} finally {
			commit("SET_LOADING", false);
		}
	},

	async fetchMessages({ commit }, { conversationId, before }) {
		try {
			const params = new URLSearchParams();
			if (before) params.append("before", before);
			params.append("limit", "50");

			const { data } = await axios.get(
				`messaging/conversations/${conversationId}/messages?${params}`
			);
			const result = data.data;

			if (before) {
				commit("PREPEND_MESSAGES", {
					messages: result.data,
					hasMore: result.has_more,
					cursor: result.cursor,
				});
			} else {
				commit("SET_MESSAGES", {
					messages: result.data,
					hasMore: result.has_more,
					cursor: result.cursor,
				});
			}
		} catch (error) {
			console.error("Failed to fetch messages:", error);
		}
	},

	async sendMessage({ commit, state }, { conversationId, type, content, replyTo }) {
		try {
			const { data } = await axios.post(
				`messaging/conversations/${conversationId}/messages`,
				{ type, content, reply_to: replyTo }
			);
			commit("ADD_MESSAGE", data.data);
			return data.data;
		} catch (error) {
			console.error("Failed to send message:", error);
			throw error;
		}
	},

	async sendAttachment({ commit }, { conversationId, file, type, content, durationSeconds, replyTo, thumbnail }) {
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("type", type);
			if (content) formData.append("content", content);
			if (durationSeconds) formData.append("duration_seconds", durationSeconds);
			if (replyTo) formData.append("reply_to", replyTo);
			if (thumbnail) formData.append("thumbnail", thumbnail);

			const { data } = await axios.post(
				`messaging/conversations/${conversationId}/messages/attachment`,
				formData,
				{ headers: { "Content-Type": "multipart/form-data" } }
			);
			commit("ADD_MESSAGE", data.data);
			return data.data;
		} catch (error) {
			console.error("Failed to send attachment:", error);
			throw error;
		}
	},

	async markAsRead({ commit }, conversationId) {
		try {
			await axios.patch(`messaging/conversations/${conversationId}/read`);
			commit("MARK_CONVERSATION_READ", conversationId);
		} catch (error) {
			console.error("Failed to mark as read:", error);
		}
	},

	async createConversation({ commit, dispatch }, participantId) {
		try {
			const { data } = await axios.post("messaging/conversations", {
				participant_id: participantId,
			});
			await dispatch("fetchConversations");
			return data.data;
		} catch (error) {
			console.error("Failed to create conversation:", error);
			throw error;
		}
	},

	async archiveConversation({ commit, dispatch }, conversationId) {
		try {
			await axios.patch(`messaging/conversations/${conversationId}/archive`);
			await dispatch("fetchConversations");
		} catch (error) {
			console.error("Failed to archive conversation:", error);
		}
	},

	async deleteMessage({ commit }, messageId) {
		try {
			const { data } = await axios.delete(`messaging/messages/${messageId}`);
			commit("REMOVE_MESSAGE", messageId);
			return data.data;
		} catch (error) {
			console.error("Failed to delete message:", error);
			throw error;
		}
	},

	async getDownloadUrl(_, { conversationId, messageId }) {
		try {
			const { data } = await axios.get(
				`messaging/conversations/${conversationId}/messages/${messageId}/download`
			);
			return data.data;
		} catch (error) {
			console.error("Failed to get download URL:", error);
			throw error;
		}
	},

	async checkConsent({ commit }) {
		try {
			const { data } = await axios.get("messaging/consent");
			commit("SET_CONSENT", data.data.has_consent);
			return data.data.has_consent;
		} catch (error) {
			console.error("Failed to check consent:", error);
			return false;
		}
	},

	async searchUsers(_, query) {
		try {
			const { data } = await axios.get(`messaging/users/search?q=${encodeURIComponent(query)}`);
			return data.data || [];
		} catch (error) {
			console.error("Failed to search users:", error);
			return [];
		}
	},

	async getMyContacts() {
		try {
			const { data } = await axios.get("messaging/contacts");
			return data.data || [];
		} catch (error) {
			console.error("Failed to fetch contacts:", error);
			return [];
		}
	},

	async fetchMyRestrictions({ commit }) {
		try {
			const { data } = await axios.get("messaging/my-restrictions");
			commit("SET_MESSAGING_RESTRICTION", data.data);
			return data.data;
		} catch (error) {
			console.error("Failed to fetch messaging restrictions:", error);
			return { status: "none" };
		}
	},

	async recordConsent({ commit }) {
		try {
			await axios.post("messaging/consent");
			commit("SET_CONSENT", true);
		} catch (error) {
			console.error("Failed to record consent:", error);
			throw error;
		}
	},

	// ===================== SOCKET.IO =====================

	connectSocket({ commit, dispatch, rootGetters }) {
		const token = localStorage.getItem("token") || sessionStorage.getItem("token");
		if (!token) return;

		if (socket?.connected) return;

		const apiUrl = process.env.VUE_APP_API_GATEWAY || "http://localhost:5020";

		socket = io(`${apiUrl}/messaging`, {
			auth: { token },
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			timeout: 10000,
		});

		socket.on("connect", () => {
			commit("SET_CONNECTED", true);
		});

		socket.on("disconnect", () => {
			commit("SET_CONNECTED", false);
		});

		socket.on("connected", (data) => {
			console.log("Connected to messaging:", data);
			// Join all conversation rooms
			if (data.conversations) {
				socket.emit("join_conversations", { conversationIds: data.conversations });
			}
			// Set initial presence for all conversation partners
			if (data.presence) {
				Object.entries(data.presence).forEach(([userId, status]) => {
					commit("SET_PRESENCE", { userId, status });
				});
			}
		});

		// New message received
		socket.on("new_message", ({ message, conversation }) => {
			const myId = getCurrentUserId();
			const senderId = message?.sender?._id || message?.sender;
			commit("ADD_MESSAGE", message);
			if (conversation) {
				commit("UPDATE_CONVERSATION", conversation);
			}
			// Play notification sound if message is from someone else
			if (senderId && senderId !== myId) {
				playNotificationSound();
			}
			// Refresh conversations to update unread counts
			dispatch("fetchConversations");
		});

		// Message delivered
		socket.on("message_delivered", ({ messageId, delivered_at }) => {
			commit("UPDATE_MESSAGE_STATUS", {
				messageId,
				status: { delivered_at },
			});
		});

		// Message read (single)
		socket.on("message_read", ({ conversationId, messageId, read_at, readBy }) => {
			commit("UPDATE_MESSAGE_STATUS", {
				messageId,
				status: { read_at },
			});
		});

		// All messages in conversation read
		socket.on("messages_read", ({ conversationId, readBy, read_at }) => {
			commit("MARK_ALL_MESSAGES_READ", { readBy, read_at });
		});

		// Typing indicator
		socket.on("user_typing", ({ conversationId, userId, isTyping }) => {
			commit("SET_TYPING", { conversationId, userId, isTyping });
		});

		// Presence update
		socket.on("presence_update", ({ userId, status }) => {
			commit("SET_PRESENCE", { userId, status });
		});

		// Message deleted
		socket.on("message_deleted", ({ messageId }) => {
			commit("REMOVE_MESSAGE", messageId);
		});

		// Message updated (e.g. link previews added)
		socket.on("message_updated", ({ message }) => {
			if (message) {
				commit("UPDATE_MESSAGE", message);
			}
		});

		// Conversation updated
		socket.on("conversation_updated", ({ conversation }) => {
			commit("UPDATE_CONVERSATION", conversation);
		});

		// Restriction update from admin
		socket.on("restriction_update", (restriction) => {
			commit("SET_MESSAGING_RESTRICTION", restriction);
			// If blocked, disconnect
			if (restriction.status === "blocked") {
				dispatch("disconnectSocket");
			}
		});

		// Blocked on connect
		socket.on("restriction", ({ status, reason }) => {
			if (status === "blocked") {
				commit("SET_MESSAGING_RESTRICTION", { status: "blocked", reason });
			}
		});

		// Heartbeat
		const heartbeatInterval = setInterval(() => {
			if (socket?.connected) {
				socket.emit("heartbeat");
			}
		}, 30000);

		socket._heartbeatInterval = heartbeatInterval;
	},

	disconnectSocket({ commit }) {
		if (socket) {
			if (socket._heartbeatInterval) {
				clearInterval(socket._heartbeatInterval);
			}
			socket.disconnect();
			socket = null;
			commit("SET_CONNECTED", false);
		}
	},

	startTyping(_, conversationId) {
		if (socket?.connected) {
			socket.emit("typing_start", { conversationId });

			// Auto-stop typing after 3 seconds
			if (typingTimeout) clearTimeout(typingTimeout);
			typingTimeout = setTimeout(() => {
				socket?.emit("typing_stop", { conversationId });
			}, 3000);
		}
	},

	stopTyping(_, conversationId) {
		if (socket?.connected) {
			socket.emit("typing_stop", { conversationId });
			if (typingTimeout) clearTimeout(typingTimeout);
		}
	},

	markReadViaSocket(_, { conversationId, messageId }) {
		if (socket?.connected) {
			socket.emit("mark_read", { conversationId, messageId });
		}
	},

	setActiveConversation({ commit }, conversation) {
		const userId = getCurrentUserId();
		commit("SET_ACTIVE_CONVERSATION", conversation ? { ...conversation, currentUserId: userId } : null);
	},
};

// Helper to get current user ID from storage
function getCurrentUserId() {
	try {
		const token = localStorage.getItem("token") || sessionStorage.getItem("token");
		if (!token) return null;
		const payload = JSON.parse(atob(token.split(".")[1]));
		return payload.sub;
	} catch {
		return null;
	}
}

// Play a short notification sound when a message is received
let audioCtx = null;
function playNotificationSound() {
	try {
		if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.connect(gain);
		gain.connect(audioCtx.destination);
		osc.type = "sine";
		osc.frequency.setValueAtTime(880, audioCtx.currentTime);
		osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.1);
		gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
		osc.start(audioCtx.currentTime);
		osc.stop(audioCtx.currentTime + 0.3);
	} catch {
		// Audio not available
	}
}

export default {
	namespaced: true,
	state,
	getters,
	mutations,
	actions,
};
