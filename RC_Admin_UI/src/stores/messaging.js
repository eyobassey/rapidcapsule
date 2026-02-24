import axios from 'axios'
import adminAxios from '@axios'
import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

const adminApiBase = import.meta.env.VITE_API_BASE_URL
// Patient API is same-origin via nginx (/api/ → port 5020)
// Only set VITE_PATIENT_API_URL if you need to point at a different host
const patientApiBase = import.meta.env.VITE_PATIENT_API_URL || ''

// Create a separate axios instance for patient backend calls
const patientApi = axios.create({
  baseURL: `${patientApiBase}/api`,
  timeout: 15000,
})

export const useMessagingStore = defineStore('messaging', {
  state: () => ({
    // Session
    messagingToken: null,
    messagingUserId: null,
    sessionReady: false,
    sessionError: null,

    // Socket
    socket: null,
    connected: false,

    // My conversations (admin as participant)
    myConversations: [],
    myConversationsLoading: false,
    myConversationsPage: 1,
    myConversationsHasMore: false,

    // Active conversation messages
    activeConversationId: null,
    messages: [],
    messagesLoading: false,
    hasMoreMessages: false,
    oldestCursor: null,

    // Real-time state
    unreadCounts: {},
    typingUsers: {},
    onlineUsers: new Set(),

    // Search
    searchResults: [],
    searchLoading: false,

    // Broadcast progress
    activeBroadcast: null,
    broadcastPolling: false,
  }),

  getters: {
    totalUnread() {
      return Object.values(this.unreadCounts).reduce((sum, c) => sum + c, 0)
    },
    isUserOnline() {
      return (userId) => this.onlineUsers.has(userId)
    },
    getTypingUsers() {
      return (conversationId) => this.typingUsers[conversationId] || []
    },
  },

  actions: {
    // ---------- Session ----------

    async initSession() {
      if (this.sessionReady) return
      try {
        this.sessionError = null
        const { data } = await adminAxios.post(`${adminApiBase}/messaging/session`)
        if (data?.data) {
          this.messagingToken = data.data.messaging_token
          this.messagingUserId = data.data.messaging_user_id
          this.sessionReady = true

          // Set up the patient API auth header
          patientApi.interceptors.request.use((config) => {
            if (this.messagingToken) {
              config.headers.Authorization = `Bearer ${this.messagingToken}`
            }
            return config
          })
        }
      } catch (error) {
        console.error('Failed to init messaging session:', error)
        this.sessionError = error.message || 'Failed to initialize messaging'
      }
    },

    // ---------- Socket ----------

    connectSocket() {
      if (this.socket || !this.messagingToken) return

      this.socket = io(`${patientApiBase}/messaging`, {
        auth: { token: this.messagingToken },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      })

      this.socket.on('connect', () => {
        this.connected = true
        console.log('[Messaging WS] Connected')
      })

      this.socket.on('disconnect', () => {
        this.connected = false
        console.log('[Messaging WS] Disconnected')
      })

      this.socket.on('connected', ({ conversations, presence }) => {
        // Initial presence state
        if (presence) {
          Object.entries(presence).forEach(([userId, status]) => {
            if (status === 'online') this.onlineUsers.add(userId)
          })
        }
      })

      this.socket.on('new_message', ({ message, conversation }) => {
        const convId = message.conversation?._id || message.conversation

        // If viewing this conversation, append message
        if (this.activeConversationId === convId) {
          const exists = this.messages.some((m) => m._id === message._id)
          if (!exists) {
            this.messages.push(message)
          }
          // Auto-mark as read if message is from someone else
          if (message.sender?._id !== this.messagingUserId && message.sender !== this.messagingUserId) {
            this.markAsRead(convId)
          }
        } else {
          // Increment unread for other conversations
          if (message.sender?._id !== this.messagingUserId && message.sender !== this.messagingUserId) {
            this.unreadCounts[convId] = (this.unreadCounts[convId] || 0) + 1
          }
        }

        // Update conversation in myConversations list
        this._updateConversationPreview(convId, conversation || message)
      })

      this.socket.on('user_typing', ({ conversationId, userId, isTyping }) => {
        if (userId === this.messagingUserId) return
        if (!this.typingUsers[conversationId]) {
          this.typingUsers[conversationId] = []
        }
        if (isTyping) {
          if (!this.typingUsers[conversationId].includes(userId)) {
            this.typingUsers[conversationId].push(userId)
          }
        } else {
          this.typingUsers[conversationId] = this.typingUsers[conversationId].filter(
            (id) => id !== userId,
          )
        }
      })

      this.socket.on('messages_read', ({ conversationId, readBy }) => {
        if (readBy === this.messagingUserId) {
          this.unreadCounts[conversationId] = 0
        }
      })

      this.socket.on('message_deleted', ({ messageId, conversationId }) => {
        if (this.activeConversationId === conversationId) {
          const msg = this.messages.find((m) => m._id === messageId)
          if (msg) {
            msg.is_deleted = true
            msg.content = ''
          }
        }
      })

      this.socket.on('message_updated', ({ message, conversationId }) => {
        if (this.activeConversationId === conversationId) {
          const idx = this.messages.findIndex((m) => m._id === message._id)
          if (idx !== -1) {
            this.messages[idx] = { ...this.messages[idx], ...message }
          }
        }
      })

      this.socket.on('presence_update', ({ userId, status }) => {
        if (status === 'online') {
          this.onlineUsers.add(userId)
        } else {
          this.onlineUsers.delete(userId)
        }
      })
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.connected = false
      }
    },

    // ---------- Conversations ----------

    async fetchMyConversations(page = 1) {
      this.myConversationsLoading = true
      try {
        const { data } = await patientApi.get(
          `/messaging/conversations?page=${page}&limit=20`,
        )
        if (data?.data) {
          const fetched = data.data.data || data.data || []
          if (page === 1) {
            this.myConversations = fetched
          } else {
            // Append without duplicates
            const existingIds = new Set(this.myConversations.map((c) => c._id))
            const newConvs = fetched.filter((c) => !existingIds.has(c._id))
            this.myConversations.push(...newConvs)
          }
          this.myConversationsPage = page
          this.myConversationsHasMore =
            data.data.pagination?.has_more ??
            data.data.has_more ??
            fetched.length >= 20
          // Initialize unread counts
          fetched.forEach((conv) => {
            if (conv.unread_counts && this.messagingUserId) {
              const count = conv.unread_counts[this.messagingUserId] || 0
              if (count > 0) this.unreadCounts[conv._id] = count
            }
          })
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
      } finally {
        this.myConversationsLoading = false
      }
    },

    async createConversation(participantId) {
      const { data } = await patientApi.post('/messaging/conversations', {
        participant_id: participantId,
      })
      if (data?.data) {
        const conv = data.data.result || data.data
        // Add to list if not already there
        const exists = this.myConversations.some((c) => c._id === conv._id)
        if (!exists) {
          this.myConversations.unshift(conv)
        }
        return conv
      }
      return null
    },

    // ---------- Messages ----------

    async fetchMessages(conversationId, loadMore = false) {
      this.messagesLoading = true
      this.activeConversationId = conversationId
      try {
        const params = new URLSearchParams()
        params.append('limit', '50')
        if (loadMore && this.oldestCursor) {
          params.append('before', this.oldestCursor)
        }

        const { data } = await patientApi.get(
          `/messaging/conversations/${conversationId}/messages?${params}`,
        )
        if (data?.data) {
          const fetched = data.data.data || data.data || []
          if (loadMore) {
            this.messages = [...fetched, ...this.messages]
          } else {
            this.messages = fetched
          }
          this.hasMoreMessages = data.data.has_more || false
          if (fetched.length > 0) {
            this.oldestCursor = fetched[0]._id
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      } finally {
        this.messagesLoading = false
      }
    },

    async sendMessage(conversationId, content, type = 'text', replyTo = null) {
      const body = { content, type }
      if (replyTo) body.reply_to = replyTo

      const { data } = await patientApi.post(
        `/messaging/conversations/${conversationId}/messages`,
        body,
      )
      if (data?.data) {
        const msg = data.data.result || data.data
        // Append if not already added by WebSocket
        const exists = this.messages.some((m) => m._id === msg._id)
        if (!exists) {
          this.messages.push(msg)
        }
        return msg
      }
      return null
    },

    async sendAttachment(conversationId, file, type, caption = '', replyTo = null, thumbnail = null) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      if (caption) formData.append('content', caption)
      if (replyTo) formData.append('reply_to', replyTo)
      if (thumbnail) formData.append('thumbnail', thumbnail, 'thumbnail.jpg')

      const { data } = await patientApi.post(
        `/messaging/conversations/${conversationId}/messages/attachment`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 },
      )
      if (data?.data) {
        const msg = data.data.result || data.data
        const exists = this.messages.some((m) => m._id === msg._id)
        if (!exists) {
          this.messages.push(msg)
        }
        return msg
      }
      return null
    },

    async markAsRead(conversationId) {
      try {
        await patientApi.patch(`/messaging/conversations/${conversationId}/read`)
        this.unreadCounts[conversationId] = 0
      } catch (error) {
        // Silent fail for mark as read
      }
    },

    // ---------- Typing ----------

    emitTypingStart(conversationId) {
      if (this.socket) {
        this.socket.emit('typing_start', { conversationId })
      }
    },

    emitTypingStop(conversationId) {
      if (this.socket) {
        this.socket.emit('typing_stop', { conversationId })
      }
    },

    // ---------- Search ----------

    async searchUsers(query) {
      if (!query || query.length < 2) {
        this.searchResults = []
        return
      }
      this.searchLoading = true
      try {
        const { data } = await patientApi.get(
          `/messaging/users/search?q=${encodeURIComponent(query)}`,
        )
        if (data?.data) {
          this.searchResults = data.data.result || data.data || []
        }
      } catch (error) {
        console.error('Failed to search users:', error)
        this.searchResults = []
      } finally {
        this.searchLoading = false
      }
    },

    // ---------- Broadcast ----------

    async broadcast(payload, file = null, thumbnail = null, attachmentType = null) {
      if (file) {
        const formData = new FormData()
        if (payload.content) formData.append('content', payload.content)
        if (payload.recipient_ids) {
          formData.append('recipient_ids', JSON.stringify(payload.recipient_ids))
        }
        if (payload.recipient_type) {
          formData.append('recipient_type', payload.recipient_type)
        }
        formData.append('file', file)
        if (attachmentType) formData.append('attachment_type', attachmentType)
        if (thumbnail) formData.append('thumbnail', thumbnail, 'thumbnail.jpg')

        const { data } = await adminAxios.post(
          `${adminApiBase}/messaging/broadcast`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 },
        )
        return data?.data
      }
      const { data } = await adminAxios.post(
        `${adminApiBase}/messaging/broadcast`,
        payload,
        { timeout: 30000 },
      )
      return data?.data
    },

    async pollBroadcastStatus(broadcastId) {
      try {
        const { data } = await adminAxios.get(
          `${adminApiBase}/messaging/broadcast/${broadcastId}`,
        )
        const broadcast = data?.data || data?.result
        this.activeBroadcast = broadcast
        return broadcast
      } catch (error) {
        console.error('Failed to poll broadcast status:', error)
        return null
      }
    },

    async cancelBroadcast(broadcastId) {
      const { data } = await adminAxios.post(
        `${adminApiBase}/messaging/broadcast/${broadcastId}/cancel`,
      )
      return data?.data || data?.result
    },

    stopBroadcastPolling() {
      this.broadcastPolling = false
      this.activeBroadcast = null
    },

    // ---------- Internal ----------

    _updateConversationPreview(convId, data) {
      const idx = this.myConversations.findIndex((c) => c._id === convId)
      if (idx !== -1) {
        // Update last message and move to top
        if (data.last_message) {
          this.myConversations[idx].last_message = data.last_message
        }
        if (data.updated_at) {
          this.myConversations[idx].updated_at = data.updated_at
        }
        // Move to top of list
        const [conv] = this.myConversations.splice(idx, 1)
        this.myConversations.unshift(conv)
      }
    },

    clearActiveConversation() {
      this.activeConversationId = null
      this.messages = []
      this.hasMoreMessages = false
      this.oldestCursor = null
    },
  },
})
