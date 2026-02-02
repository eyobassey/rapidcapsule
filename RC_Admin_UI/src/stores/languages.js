import axios from '@axios'
import { defineStore } from 'pinia'

const apiBaseURl = import.meta.env.VITE_API_BASE_URL

export const useLanguagesStore = defineStore('languages', {
  state: () => ({
    languages: [],
    total: 0,
    page: 1,
    limit: 50,
    loading: false,
    error: null,
  }),

  getters: {
    activeLanguages: (state) => (Array.isArray(state.languages) ? state.languages : []).filter(l => l.is_active),
    totalPages: (state) => Math.ceil(state.total / state.limit),
  },

  actions: {
    async fetchLanguages(params = {}) {
      this.loading = true
      this.error = null
      try {
        const queryParams = new URLSearchParams({
          page: params.page || this.page,
          limit: params.limit || this.limit,
          ...(params.is_active !== undefined && { is_active: params.is_active }),
          ...(params.search && { search: params.search }),
        })

        const url = `${apiBaseURl}/languages?${queryParams}`
        const response = await axios.get(url)

        const responseData = response.data || {}
        this.languages = Array.isArray(responseData.data) ? responseData.data : []
        this.total = responseData.meta?.total || this.languages.length
        this.page = responseData.meta?.page || 1

        return responseData
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch languages'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createLanguage(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.post(`${apiBaseURl}/languages`, payload)
        await this.fetchLanguages()
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create language'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateLanguage(id, payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.patch(`${apiBaseURl}/languages/${id}`, payload)
        await this.fetchLanguages()
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update language'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteLanguage(id) {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.delete(`${apiBaseURl}/languages/${id}`)
        await this.fetchLanguages()
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete language'
        throw error
      } finally {
        this.loading = false
      }
    },

    async seedDefaults() {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.post(`${apiBaseURl}/languages/seed`)
        await this.fetchLanguages()
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to seed languages'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
