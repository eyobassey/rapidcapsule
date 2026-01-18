import axios from '@axios'
import { defineStore } from 'pinia'

const apiBaseURl = import.meta.env.VITE_API_BASE_URL

export const useAdvancedHealthScoreStore = defineStore('advancedHealthScore', {
  state: () => ({
    settings: null,
    questions: [],
    questionsByDomain: {},
    overview: null,
    usageTrends: null,
    scoreDistribution: [],
    domainAverages: [],
    patientAssessments: [],
    currentAssessment: null,
    loading: false,
    error: null,
  }),

  getters: {
    activeQuestions: (state) => state.questions.filter(q => q.is_active),
    inactiveQuestions: (state) => state.questions.filter(q => !q.is_active),
    questionCount: (state) => state.questions.length,
    activeQuestionCount: (state) => state.questions.filter(q => q.is_active).length,
  },

  actions: {
    // =====================
    // Settings Management
    // =====================
    async fetchSettings() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${apiBaseURl}/advanced-health-score/settings`)
        if (response.status === 200) {
          this.settings = response.data.data
          return this.settings
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch settings'
        return null
      } finally {
        this.loading = false
      }
    },

    async fetchDefaultSettings() {
      try {
        const response = await axios.get(`${apiBaseURl}/advanced-health-score/settings/defaults`)
        if (response.status === 200) {
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch default settings'
        return null
      }
    },

    async updateSettings(settingsData, adminId) {
      this.loading = true
      try {
        const response = await axios.patch(`${apiBaseURl}/advanced-health-score/settings`, {
          ...settingsData,
          admin_id: adminId,
        })
        if (response.status === 200) {
          this.settings = response.data.data
          return this.settings
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update settings'
        throw error
      } finally {
        this.loading = false
      }
    },

    // =====================
    // Questions Management
    // =====================
    async fetchQuestions(includeInactive = true) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${apiBaseURl}/advanced-health-score/questions?include_inactive=${includeInactive}`)
        if (response.status === 200) {
          this.questions = response.data.data || []
          return this.questions
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch questions'
        this.questions = []
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchQuestionsByDomain() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${apiBaseURl}/advanced-health-score/questions/by-domain`)
        if (response.status === 200) {
          this.questionsByDomain = response.data.data || {}
          return this.questionsByDomain
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch questions by domain'
        this.questionsByDomain = {}
        return {}
      } finally {
        this.loading = false
      }
    },

    async createQuestion(questionData, adminId) {
      this.loading = true
      try {
        const response = await axios.post(`${apiBaseURl}/advanced-health-score/questions`, {
          ...questionData,
          admin_id: adminId,
        })
        if (response.status === 200 || response.status === 201) {
          await this.fetchQuestions()
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create question'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateQuestion(questionId, questionData) {
      this.loading = true
      try {
        const response = await axios.patch(`${apiBaseURl}/advanced-health-score/questions/${questionId}`, questionData)
        if (response.status === 200) {
          await this.fetchQuestions()
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update question'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteQuestion(questionId) {
      this.loading = true
      try {
        const response = await axios.delete(`${apiBaseURl}/advanced-health-score/questions/${questionId}`)
        if (response.status === 200) {
          await this.fetchQuestions()
          return true
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete question'
        throw error
      } finally {
        this.loading = false
      }
    },

    async reorderQuestions(questions) {
      this.loading = true
      try {
        const response = await axios.post(`${apiBaseURl}/advanced-health-score/questions/reorder`, { questions })
        if (response.status === 200) {
          await this.fetchQuestions()
          return response.data.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to reorder questions'
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
        const response = await axios.get(`${apiBaseURl}/advanced-health-score/analytics/overview`)
        if (response.status === 200) {
          this.overview = response.data.data
          return this.overview
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch overview'
        return null
      }
    },

    async fetchUsageTrends(startDate, endDate) {
      try {
        let url = `${apiBaseURl}/advanced-health-score/analytics/trends`
        const params = []
        if (startDate) params.push(`start_date=${startDate}`)
        if (endDate) params.push(`end_date=${endDate}`)
        if (params.length) url += '?' + params.join('&')

        const response = await axios.get(url)
        if (response.status === 200) {
          this.usageTrends = response.data.data
          return this.usageTrends
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch usage trends'
        return null
      }
    },

    async fetchScoreDistribution() {
      try {
        const response = await axios.get(`${apiBaseURl}/advanced-health-score/analytics/distribution`)
        if (response.status === 200) {
          this.scoreDistribution = response.data.data || []
          return this.scoreDistribution
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch score distribution'
        return []
      }
    },

    async fetchDomainAverages() {
      try {
        const response = await axios.get(`${apiBaseURl}/advanced-health-score/analytics/domain-averages`)
        if (response.status === 200) {
          this.domainAverages = response.data.data || []
          return this.domainAverages
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch domain averages'
        return []
      }
    },

    // =====================
    // Patient Assessments
    // =====================
    async fetchPatientAssessments(patientId, page = 1, limit = 10) {
      try {
        const response = await axios.get(`${apiBaseURl}/advanced-health-score/patient/${patientId}/assessments?page=${page}&limit=${limit}`)
        if (response.status === 200) {
          this.patientAssessments = response.data.data
          return this.patientAssessments
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch patient assessments'
        return null
      }
    },

    async fetchAssessmentDetail(assessmentId) {
      this.loading = true
      try {
        const response = await axios.get(`${apiBaseURl}/advanced-health-score/assessments/${assessmentId}`)
        if (response.status === 200) {
          this.currentAssessment = response.data.data
          return this.currentAssessment
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch assessment detail'
        return null
      } finally {
        this.loading = false
      }
    },
  },
})
