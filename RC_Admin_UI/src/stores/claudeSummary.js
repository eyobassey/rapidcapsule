import axios from '@axios'
import { defineStore } from 'pinia'

const apiBaseURl = import.meta.env.VITE_API_BASE_URL

export const useClaudeSummaryStore = defineStore('claudeSummary', {
  state: () => ({
    plans: [],
    overview: null,
    usageAnalytics: null,
    revenueReport: null,
    dailyTrends: [],
    topUsers: [],
    patientCredits: null,
    patientTransactions: [],
    loading: false,
    error: null,
  }),

  actions: {
    // =====================
    // Plan Management
    // =====================
    async fetchPlans(includeInactive = true) {
      this.loading = true
      this.error = null
      try {
        const url = `${apiBaseURl}/claude-summary/plans?include_inactive=${includeInactive}`
        const response = await axios.get(url)
        this.plans = response.data?.data || []
        return this.plans
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch plans'
        this.plans = []
        return []
      } finally {
        this.loading = false
      }
    },

    async createPlan(planData) {
      this.loading = true
      try {
        const response = await axios.post(`${apiBaseURl}/claude-summary/plans`, planData)
        if (response.status === 200 || response.status === 201) {
          await this.fetchPlans()
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create plan'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updatePlan(planId, planData) {
      this.loading = true
      try {
        const response = await axios.patch(`${apiBaseURl}/claude-summary/plans/${planId}`, planData)
        if (response.status === 200) {
          await this.fetchPlans()
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update plan'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deletePlan(planId) {
      this.loading = true
      try {
        const response = await axios.delete(`${apiBaseURl}/claude-summary/plans/${planId}`)
        if (response.status === 200) {
          await this.fetchPlans()
          return true
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete plan'
        throw error
      } finally {
        this.loading = false
      }
    },

    async seedDefaultPlans(adminId) {
      this.loading = true
      try {
        const response = await axios.post(`${apiBaseURl}/claude-summary/plans/seed`, { admin_id: adminId })
        if (response.status === 200 || response.status === 201) {
          await this.fetchPlans()
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to seed plans'
        throw error
      } finally {
        this.loading = false
      }
    },

    // =====================
    // Analytics
    // =====================
    async fetchOverviewStats() {
      try {
        const response = await axios.get(`${apiBaseURl}/claude-summary/analytics/overview`)
        if (response.status === 200) {
          this.overview = response.data.data
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch overview'
        return 'error'
      }
    },

    async fetchUsageAnalytics(startDate, endDate) {
      try {
        let url = `${apiBaseURl}/claude-summary/analytics/usage`
        const params = []
        if (startDate) params.push(`start_date=${startDate}`)
        if (endDate) params.push(`end_date=${endDate}`)
        if (params.length) url += '?' + params.join('&')

        const response = await axios.get(url)
        if (response.status === 200) {
          this.usageAnalytics = response.data.data
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch usage analytics'
        return 'error'
      }
    },

    async fetchRevenueReport(startDate, endDate) {
      try {
        let url = `${apiBaseURl}/claude-summary/analytics/revenue`
        const params = []
        if (startDate) params.push(`start_date=${startDate}`)
        if (endDate) params.push(`end_date=${endDate}`)
        if (params.length) url += '?' + params.join('&')

        const response = await axios.get(url)
        if (response.status === 200) {
          this.revenueReport = response.data.data
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch revenue report'
        return 'error'
      }
    },

    async fetchDailyTrends(startDate, endDate) {
      try {
        let url = `${apiBaseURl}/claude-summary/analytics/trends`
        const params = []
        if (startDate) params.push(`start_date=${startDate}`)
        if (endDate) params.push(`end_date=${endDate}`)
        if (params.length) url += '?' + params.join('&')

        const response = await axios.get(url)
        if (response.status === 200) {
          // Extract daily_usage array from response
          const data = response.data.data
          this.dailyTrends = data?.daily_usage || []
          return this.dailyTrends
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch daily trends'
        this.dailyTrends = []
        return 'error'
      }
    },

    async fetchTopUsers(limit = 10) {
      try {
        const response = await axios.get(`${apiBaseURl}/claude-summary/analytics/top-users?limit=${limit}`)
        if (response.status === 200) {
          this.topUsers = response.data.data
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch top users'
        return 'error'
      }
    },

    // =====================
    // Patient Credit Management
    // =====================
    async fetchPatientCredits(patientId) {
      try {
        const response = await axios.get(`${apiBaseURl}/claude-summary/patient/${patientId}/credits`)
        if (response.status === 200) {
          this.patientCredits = response.data.data
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch patient credits'
        return 'error'
      }
    },

    async fetchPatientTransactions(patientId, page = 1, limit = 20) {
      try {
        const response = await axios.get(`${apiBaseURl}/claude-summary/patient/${patientId}/transactions?page=${page}&limit=${limit}`)
        if (response.status === 200) {
          this.patientTransactions = response.data.data
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch patient transactions'
        return 'error'
      }
    },

    async giftCreditsToPatient(patientId, credits, expiryDays, reason, adminId) {
      this.loading = true
      try {
        const response = await axios.post(`${apiBaseURl}/claude-summary/patient/${patientId}/gift-credits`, {
          credits,
          expiry_days: expiryDays,
          reason,
          admin_id: adminId,
        })
        if (response.status === 200 || response.status === 201) {
          await this.fetchPatientCredits(patientId)
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to gift credits'
        throw error
      } finally {
        this.loading = false
      }
    },

    async giftUnlimitedToPatient(patientId, durationDays, reason, adminId) {
      this.loading = true
      try {
        const response = await axios.post(`${apiBaseURl}/claude-summary/patient/${patientId}/gift-unlimited`, {
          duration_days: durationDays,
          reason,
          admin_id: adminId,
        })
        if (response.status === 200 || response.status === 201) {
          await this.fetchPatientCredits(patientId)
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to gift unlimited access'
        throw error
      } finally {
        this.loading = false
      }
    },

    async revokeGiftedCredits(patientId, reason, adminId) {
      this.loading = true
      try {
        const response = await axios.post(`${apiBaseURl}/claude-summary/patient/${patientId}/revoke-gifted`, {
          reason,
          admin_id: adminId,
        })
        if (response.status === 200) {
          await this.fetchPatientCredits(patientId)
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to revoke credits'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
