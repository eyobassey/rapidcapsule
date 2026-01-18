import { defineStore } from 'pinia'
import axiosIns from '@/plugins/axios'

export const useReferralsStore = defineStore('referrals', {
  state: () => ({
    referrals: [],
    pagination: null,
    analytics: null,
    settings: null,
    clicks: [],
    clicksPagination: null,
    loading: false,
    error: null,
  }),

  actions: {
    // Get all referrals with pagination
    async fetchReferrals(page = 1, limit = 20, search = '', sortBy = 'total_signups') {
      this.loading = true
      this.error = null
      try {
        const response = await axiosIns.get(`/referrals`, {
          params: { page, limit, search, sortBy },
        })
        this.referrals = response.data.data.referrals
        this.pagination = response.data.data.pagination
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch referrals'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Get analytics
    async fetchAnalytics(startDate = null, endDate = null) {
      this.loading = true
      this.error = null
      try {
        const params = {}
        if (startDate) params.startDate = startDate
        if (endDate) params.endDate = endDate

        const response = await axiosIns.get('/referrals/analytics', { params })
        this.analytics = response.data.data
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch analytics'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Get settings
    async fetchSettings() {
      this.loading = true
      this.error = null
      try {
        const response = await axiosIns.get('/referrals/settings')
        this.settings = response.data.data
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch settings'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update settings
    async updateSettings(settingsData) {
      this.loading = true
      this.error = null
      try {
        const response = await axiosIns.patch('/referrals/settings', settingsData)
        this.settings = response.data.data
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update settings'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Get recent clicks
    async fetchClicks(page = 1, limit = 50) {
      this.loading = true
      this.error = null
      try {
        const response = await axiosIns.get('/referrals/clicks', {
          params: { page, limit },
        })
        this.clicks = response.data.data.clicks
        this.clicksPagination = response.data.data.pagination
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch clicks'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Get referral by ID
    async getReferralById(id) {
      try {
        const response = await axiosIns.get(`/referrals/${id}`)
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch referral'
        throw error
      }
    },

    // Get user's referral details
    async getUserReferralDetails(userId) {
      try {
        const response = await axiosIns.get(`/referrals/user/${userId}`)
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch user referral details'
        throw error
      }
    },
  },
})
