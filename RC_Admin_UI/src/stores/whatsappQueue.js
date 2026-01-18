import axios from '@axios'
import { defineStore } from 'pinia'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL

export const useWhatsAppQueueStore = defineStore('whatsappQueue', {
  state: () => ({
    queueItems: [],
    currentItem: null,
    myQueue: [],
    stats: null,
    loading: false,
    error: null,
  }),

  actions: {
    /**
     * Fetch pending queue items with optional filters
     */
    async fetchPendingItems(options = {}) {
      this.loading = true
      this.error = null

      try {
        const params = new URLSearchParams()
        if (options.queueType) params.append('queueType', options.queueType)
        if (options.priority) params.append('priority', options.priority)
        if (options.limit) params.append('limit', options.limit)
        if (options.offset) params.append('offset', options.offset)
        if (options.sortBy) params.append('sortBy', options.sortBy)
        if (options.sortOrder) params.append('sortOrder', options.sortOrder)

        const response = await axios.get(
          `${apiBaseURL}/whatsapp/queue/pending?${params.toString()}`
        )

        if (response.status === 200 && response.data?.data) {
          this.queueItems = response.data.data.items || []
          return response.data.data
        }
        return { items: [], total: 0 }
      } catch (error) {
        this.error = error.message
        console.error('Error fetching pending items:', error)
        return { items: [], total: 0 }
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch queue items assigned to current pharmacist
     */
    async fetchMyQueue(options = {}) {
      this.loading = true
      this.error = null

      try {
        const params = new URLSearchParams()
        if (options.status) params.append('status', options.status)
        if (options.includeAll) params.append('includeAll', 'true')
        if (options.limit) params.append('limit', options.limit)
        if (options.offset) params.append('offset', options.offset)

        const response = await axios.get(
          `${apiBaseURL}/whatsapp/queue/my-queue?${params.toString()}`
        )

        if (response.status === 200 && response.data?.data) {
          this.myQueue = response.data.data.items || []
          return response.data.data
        }
        return { items: [], total: 0 }
      } catch (error) {
        this.error = error.message
        console.error('Error fetching my queue:', error)
        return { items: [], total: 0 }
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch escalated queue items
     */
    async fetchEscalatedItems(options = {}) {
      this.loading = true
      this.error = null

      try {
        const params = new URLSearchParams()
        if (options.queueType) params.append('queueType', options.queueType)
        if (options.priority) params.append('priority', options.priority)
        if (options.limit) params.append('limit', options.limit)
        if (options.offset) params.append('offset', options.offset)

        const response = await axios.get(
          `${apiBaseURL}/whatsapp/queue/escalated?${params.toString()}`
        )

        if (response.status === 200 && response.data?.data) {
          return response.data.data
        }
        return { items: [], total: 0 }
      } catch (error) {
        this.error = error.message
        console.error('Error fetching escalated items:', error)
        return { items: [], total: 0 }
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a specific queue item by ID
     */
    async fetchQueueItem(id) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${apiBaseURL}/whatsapp/queue/${id}`)

        if (response.status === 200 && response.data?.data) {
          this.currentItem = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        this.error = error.message
        console.error('Error fetching queue item:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch queue statistics
     */
    async fetchStats(options = {}) {
      try {
        const params = new URLSearchParams()
        if (options.queueType) params.append('queueType', options.queueType)
        if (options.dateFrom) params.append('dateFrom', options.dateFrom)
        if (options.dateTo) params.append('dateTo', options.dateTo)

        const response = await axios.get(
          `${apiBaseURL}/whatsapp/queue/stats/overview?${params.toString()}`
        )

        if (response.status === 200 && response.data?.data) {
          this.stats = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching stats:', error)
        return null
      }
    },

    /**
     * Claim the next available queue item
     */
    async claimNextItem(preferredTypes = []) {
      try {
        const response = await axios.post(`${apiBaseURL}/whatsapp/queue/claim-next`, {
          preferredTypes,
        })

        if ((response.status === 200 || response.status === 201) && response.data?.data) {
          if (response.data.data.item) {
            this.currentItem = response.data.data.item
          }
          return response.data.data
        }
        return { item: null, message: 'Failed to claim item' }
      } catch (error) {
        console.error('Error claiming item:', error)
        return { item: null, message: error.message }
      }
    },

    /**
     * Assign a specific queue item to current pharmacist
     */
    async assignItem(id) {
      try {
        const response = await axios.post(`${apiBaseURL}/whatsapp/queue/${id}/assign`)

        if ((response.status === 200 || response.status === 201) && response.data?.data) {
          this.currentItem = response.data.data
          return { success: true, item: response.data.data }
        }
        return { success: false, error: 'Failed to assign item' }
      } catch (error) {
        console.error('Error assigning item:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * Send a message to patient
     */
    async sendMessage(id, message) {
      try {
        const response = await axios.post(`${apiBaseURL}/whatsapp/queue/${id}/message`, {
          message,
        })

        if ((response.status === 200 || response.status === 201) && response.data?.data) {
          // Refresh current item to get updated messages
          await this.fetchQueueItem(id)
          // Response contains { item, whatsapp }
          return { success: true, item: response.data.data.item, whatsapp: response.data.data.whatsapp }
        }
        return { success: false, error: 'Failed to send message' }
      } catch (error) {
        console.error('Error sending message:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * Complete a queue item
     */
    async completeItem(id, resolution = '') {
      try {
        const response = await axios.patch(`${apiBaseURL}/whatsapp/queue/${id}/complete`, {
          resolution,
        })

        if (response.status === 200 && response.data?.data) {
          // Response contains { item, whatsapp }, extract the item
          const item = response.data.data.item || response.data.data
          this.currentItem = item
          return { success: true, item, whatsapp: response.data.data.whatsapp }
        }
        return { success: false, error: 'Failed to complete item' }
      } catch (error) {
        console.error('Error completing item:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * Escalate a queue item
     */
    async escalateItem(id, reason) {
      try {
        const response = await axios.patch(`${apiBaseURL}/whatsapp/queue/${id}/escalate`, {
          reason,
        })

        if (response.status === 200 && response.data?.data) {
          // Response contains { item, whatsapp }, extract the item
          const item = response.data.data.item || response.data.data
          this.currentItem = item
          return { success: true, item, whatsapp: response.data.data.whatsapp }
        }
        return { success: false, error: 'Failed to escalate item' }
      } catch (error) {
        console.error('Error escalating item:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * Get chat messages for a queue item
     */
    async fetchMessages(id) {
      try {
        const response = await axios.get(`${apiBaseURL}/whatsapp/queue/${id}/messages`)

        if (response.status === 200 && response.data?.data) {
          return response.data.data
        }
        return { messages: [], queueType: null }
      } catch (error) {
        console.error('Error fetching messages:', error)
        return { messages: [], queueType: null }
      }
    },

    /**
     * Clear current item
     */
    clearCurrentItem() {
      this.currentItem = null
    },
  },

  getters: {
    /**
     * Get pending count
     */
    pendingCount: (state) => state.stats?.pending || 0,

    /**
     * Get in-progress count
     */
    inProgressCount: (state) => state.stats?.inProgress || 0,

    /**
     * Get items sorted by priority
     */
    sortedByPriority: (state) => {
      const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 }
      return [...state.queueItems].sort((a, b) => {
        return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
      })
    },
  },
})
