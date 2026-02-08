import axios from '@axios'
import { defineStore } from 'pinia'

const apiBaseURl = import.meta.env.VITE_API_BASE_URL

export const useRxGPTStore = defineStore('rxgpt', {
  state: () => ({
    // Settings
    settings: null,
    settingsLoading: false,

    // Analytics
    analytics: null,
    analyticsLoading: false,
    dailyTrends: [],
    alertBreakdown: null,
    topDrugs: [],
    topSpecialists: [],

    // Specialist Credits
    specialists: [],
    specialistsTotal: 0,
    specialistsPagination: null,
    specialistsLoading: false,
    currentSpecialistCredits: null,

    // General
    error: null,
  }),

  actions: {
    // =====================
    // Settings Management
    // =====================
    async fetchSettings() {
      this.settingsLoading = true
      this.error = null
      try {
        const response = await axios.get(`${apiBaseURl}/rxgpt/settings`)
        if (response.status === 200) {
          this.settings = response.data?.data || null
          return this.settings
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch RxGPT settings'
        return null
      } finally {
        this.settingsLoading = false
      }
    },

    async updateSettings(settingsData) {
      this.settingsLoading = true
      try {
        const response = await axios.patch(`${apiBaseURl}/rxgpt/settings`, settingsData)
        if (response.status === 200) {
          this.settings = response.data?.data || null
          return this.settings
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update settings'
        throw error
      } finally {
        this.settingsLoading = false
      }
    },

    // =====================
    // Analytics
    // =====================
    async fetchAnalytics(startDate, endDate) {
      this.analyticsLoading = true
      this.error = null
      try {
        let url = `${apiBaseURl}/rxgpt/analytics`
        const params = []
        if (startDate) params.push(`start_date=${startDate}`)
        if (endDate) params.push(`end_date=${endDate}`)
        if (params.length) url += '?' + params.join('&')

        const response = await axios.get(url)
        if (response.status === 200) {
          this.analytics = response.data?.data || null
          return this.analytics
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch analytics'
        return null
      } finally {
        this.analyticsLoading = false
      }
    },

    async fetchDailyTrends(startDate, endDate) {
      try {
        let url = `${apiBaseURl}/rxgpt/analytics/trends`
        const params = []
        if (startDate) params.push(`start_date=${startDate}`)
        if (endDate) params.push(`end_date=${endDate}`)
        if (params.length) url += '?' + params.join('&')

        const response = await axios.get(url)
        if (response.status === 200) {
          this.dailyTrends = response.data?.data?.daily_usage || []
          return this.dailyTrends
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch trends'
        this.dailyTrends = []
        return []
      }
    },

    async fetchAlertBreakdown(startDate, endDate) {
      try {
        let url = `${apiBaseURl}/rxgpt/analytics/alerts`
        const params = []
        if (startDate) params.push(`start_date=${startDate}`)
        if (endDate) params.push(`end_date=${endDate}`)
        if (params.length) url += '?' + params.join('&')

        const response = await axios.get(url)
        if (response.status === 200) {
          this.alertBreakdown = response.data?.data || null
          return this.alertBreakdown
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch alert breakdown'
        return null
      }
    },

    async fetchTopDrugs(limit = 10) {
      try {
        const response = await axios.get(`${apiBaseURl}/rxgpt/analytics/top-drugs?limit=${limit}`)
        if (response.status === 200) {
          this.topDrugs = response.data?.data || []
          return this.topDrugs
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch top drugs'
        return []
      }
    },

    async fetchTopSpecialists(limit = 10) {
      try {
        const response = await axios.get(`${apiBaseURl}/rxgpt/analytics/top-specialists?limit=${limit}`)
        if (response.status === 200) {
          this.topSpecialists = response.data?.data || []
          return this.topSpecialists
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch top specialists'
        return []
      }
    },

    // =====================
    // Specialist Credits Management
    // =====================
    async fetchSpecialistCredits(page = 1, limit = 20, search = '') {
      this.specialistsLoading = true
      this.error = null
      try {
        let url = `${apiBaseURl}/rxgpt/specialists?page=${page}&limit=${limit}`
        if (search) url += `&search=${encodeURIComponent(search)}`

        const response = await axios.get(url)
        if (response.status === 200) {
          const data = response.data?.data || {}
          this.specialists = data.specialists || []
          this.specialistsTotal = data.total || 0
          this.specialistsPagination = data.pagination || null
          return data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch specialist credits'
        return null
      } finally {
        this.specialistsLoading = false
      }
    },

    async fetchSpecialistCreditDetails(specialistId) {
      try {
        const response = await axios.get(`${apiBaseURl}/rxgpt/specialists/${specialistId}/credits`)
        if (response.status === 200) {
          this.currentSpecialistCredits = response.data?.data || null
          return this.currentSpecialistCredits
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch specialist credit details'
        return null
      }
    },

    async giftCreditsToSpecialist(specialistId, credits, expiryDays, reason) {
      this.specialistsLoading = true
      try {
        const response = await axios.post(`${apiBaseURl}/rxgpt/specialists/${specialistId}/gift-credits`, {
          credits,
          expiry_days: expiryDays,
          reason,
        })
        if (response.status === 200 || response.status === 201) {
          await this.fetchSpecialistCreditDetails(specialistId)
          return response.data?.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to gift credits'
        throw error
      } finally {
        this.specialistsLoading = false
      }
    },

    async giftUnlimitedToSpecialist(specialistId, durationDays, reason) {
      this.specialistsLoading = true
      try {
        const response = await axios.post(`${apiBaseURl}/rxgpt/specialists/${specialistId}/gift-unlimited`, {
          duration_days: durationDays,
          reason,
        })
        if (response.status === 200 || response.status === 201) {
          await this.fetchSpecialistCreditDetails(specialistId)
          return response.data?.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to gift unlimited access'
        throw error
      } finally {
        this.specialistsLoading = false
      }
    },

    async revokeSpecialistCredits(specialistId, reason) {
      this.specialistsLoading = true
      try {
        const response = await axios.post(`${apiBaseURl}/rxgpt/specialists/${specialistId}/revoke-credits`, {
          reason,
        })
        if (response.status === 200) {
          await this.fetchSpecialistCreditDetails(specialistId)
          return response.data?.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to revoke credits'
        throw error
      } finally {
        this.specialistsLoading = false
      }
    },

    async bulkGiftCredits(specialistIds, credits, expiryDays, reason) {
      this.specialistsLoading = true
      try {
        const response = await axios.post(`${apiBaseURl}/rxgpt/specialists/bulk-gift`, {
          specialist_ids: specialistIds,
          credits,
          expiry_days: expiryDays,
          reason,
        })
        if (response.status === 200 || response.status === 201) {
          return response.data?.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to bulk gift credits'
        throw error
      } finally {
        this.specialistsLoading = false
      }
    },
  },
})
