import axios from '@axios'
import { defineStore } from 'pinia'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL

export const useRecoveryStore = defineStore('recovery', {
  state: () => ({
    metrics: null,
    cohort: [],
    cohortPagination: null,
    riskOverview: null,
    screeningTrends: null,
    recentMilestones: [],
    activeCrises: [],
    crisisHistory: [],
    crisisHistoryPagination: null,
    groupSessions: [],
    groupSessionsPagination: null,
    patientProfile: null,
    patientRiskHistory: [],
    patientSobrietyTimeline: [],
    patientTreatmentProgress: null,
    patientScreenings: [],
    patientCrises: [],
    matCompliance: [],
    suspiciousActivity: [],
    suspiciousActivityPagination: null,
    outcomeMetrics: null,
    loading: false,
    error: null,
  }),

  actions: {
    // ─── Dashboard ───────────────────────────────────────

    async fetchMetrics() {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/metrics`)
        if (response.status === 200) {
          this.metrics = response.data.data
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchCohort(filters = {}) {
      try {
        let params = ''
        for (const key in filters) {
          if (key !== 'page' && filters[key]) params += `&${key}=${filters[key]}`
        }
        const response = await axios.get(
          `${apiBaseURL}/recovery/cohort?page=${filters.page || 1}${params}`,
        )
        if (response.status === 200) {
          const result = response.data.data
          this.cohort = result?.data || []
          this.cohortPagination = result?.pagination || null
          return result
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchRiskOverview() {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/risk-overview`)
        if (response.status === 200) {
          this.riskOverview = response.data.data
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchScreeningTrends() {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/screenings/trends`)
        if (response.status === 200) {
          this.screeningTrends = response.data.data
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchRecentMilestones(limit = 20) {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/milestones/recent?limit=${limit}`)
        if (response.status === 200) {
          this.recentMilestones = response.data.data || []
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchActiveCrises() {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/crisis/active`)
        if (response.status === 200) {
          this.activeCrises = response.data.data || []
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchCrisisHistory(filters = {}) {
      try {
        let params = ''
        for (const key in filters) {
          if (key !== 'page' && filters[key]) params += `&${key}=${filters[key]}`
        }
        const response = await axios.get(
          `${apiBaseURL}/recovery/crisis/history?page=${filters.page || 1}${params}`,
        )
        if (response.status === 200) {
          const result = response.data.data
          this.crisisHistory = result?.data || []
          this.crisisHistoryPagination = result?.pagination || null
          return result
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchGroupSessions(filters = {}) {
      try {
        let params = ''
        for (const key in filters) {
          if (key !== 'page' && filters[key]) params += `&${key}=${filters[key]}`
        }
        const response = await axios.get(
          `${apiBaseURL}/recovery/group-sessions?page=${filters.page || 1}${params}`,
        )
        if (response.status === 200) {
          const result = response.data.data
          this.groupSessions = result?.data || []
          this.groupSessionsPagination = result?.pagination || null
          return result
        }
      } catch (error) {
        return 'error'
      }
    },

    // ─── Patient ─────────────────────────────────────────

    async fetchPatientProfile(patientId) {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/patient/${patientId}/profile`)
        if (response.status === 200) {
          this.patientProfile = response.data.data
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchPatientRiskHistory(patientId, page = 1) {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/patient/${patientId}/risk-history?page=${page}`)
        if (response.status === 200) {
          const result = response.data.data
          this.patientRiskHistory = result?.data || []
          return result
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchPatientSobrietyTimeline(patientId, page = 1) {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/patient/${patientId}/sobriety-timeline?page=${page}`)
        if (response.status === 200) {
          const result = response.data.data
          this.patientSobrietyTimeline = result?.data || []
          return result
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchPatientTreatmentProgress(patientId) {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/patient/${patientId}/treatment-progress`)
        if (response.status === 200) {
          this.patientTreatmentProgress = response.data.data
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchPatientScreenings(patientId, page = 1) {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/patient/${patientId}/screenings?page=${page}`)
        if (response.status === 200) {
          const result = response.data.data
          this.patientScreenings = result?.data || []
          return result
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchPatientCrises(patientId, page = 1) {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/patient/${patientId}/crises?page=${page}`)
        if (response.status === 200) {
          const result = response.data.data
          this.patientCrises = result?.data || []
          return result
        }
      } catch (error) {
        return 'error'
      }
    },

    async updatePatientStatus(patientId, status, reason) {
      try {
        const response = await axios.patch(
          `${apiBaseURL}/recovery/patient/${patientId}/status`,
          { status, reason },
        )
        if (response.status === 200) {
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    // ─── Withdrawal ───────────────────────────────────────

    async fetchWithdrawalOverview() {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/withdrawal/overview`)
        if (response.status === 200) {
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchWithdrawalAssessments(filters = {}) {
      try {
        let params = ''
        for (const key in filters) {
          if (key !== 'page' && filters[key]) params += `&${key}=${filters[key]}`
        }
        const response = await axios.get(
          `${apiBaseURL}/recovery/withdrawal/assessments?page=${filters.page || 1}${params}`,
        )
        if (response.status === 200) {
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    // ─── MAT & Reporting ─────────────────────────────────

    async fetchMATCompliance() {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/mat/compliance`)
        if (response.status === 200) {
          this.matCompliance = response.data.data || []
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchSuspiciousActivity(filters = {}) {
      try {
        let params = ''
        for (const key in filters) {
          if (key !== 'page' && filters[key]) params += `&${key}=${filters[key]}`
        }
        const response = await axios.get(
          `${apiBaseURL}/recovery/mat/suspicious-activity?page=${filters.page || 1}${params}`,
        )
        if (response.status === 200) {
          const result = response.data.data
          this.suspiciousActivity = result?.data || []
          this.suspiciousActivityPagination = result?.pagination || null
          return result
        }
      } catch (error) {
        return 'error'
      }
    },

    async reviewSuspiciousActivity(activityId, resolution) {
      try {
        const response = await axios.post(
          `${apiBaseURL}/recovery/mat/suspicious-activity/${activityId}/review`,
          { resolution },
        )
        if (response.status === 200 || response.status === 201) {
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchOutcomeMetrics() {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/outcomes`)
        if (response.status === 200) {
          this.outcomeMetrics = response.data.data
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async fetchPatientReport(patientId) {
      try {
        const response = await axios.get(`${apiBaseURL}/recovery/patient/${patientId}/report`)
        if (response.status === 200) {
          return response.data.data
        }
      } catch (error) {
        return 'error'
      }
    },

    async exportOutcomes(format = 'csv') {
      try {
        const response = await axios.get(
          `${apiBaseURL}/recovery/outcomes/export?format=${format}`,
        )
        if (response.status === 200) {
          const result = response.data.data
          if (format === 'csv' && result?.content) {
            const blob = new Blob([result.content], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = result.filename || `recovery-outcomes-${new Date().toISOString().split('T')[0]}.csv`
            link.click()
            window.URL.revokeObjectURL(url)
            return true
          }
          return result
        }
      } catch (error) {
        return 'error'
      }
    },
  },
})
