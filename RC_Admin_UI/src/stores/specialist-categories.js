import axios from '@axios'
import { defineStore } from 'pinia'

const apiBaseURl = import.meta.env.VITE_API_BASE_URL

export const useSpecialistCategoriesStore = defineStore('specialist-categories', {
  state: () => ({
    categories: [],
    total: 0,
    page: 1,
    limit: 50,
    loading: false,
    error: null,
  }),

  getters: {
    activeCategories: (state) => (Array.isArray(state.categories) ? state.categories : []).filter(c => c.is_active),
    popularCategories: (state) => (Array.isArray(state.categories) ? state.categories : []).filter(c => c.is_active && c.is_popular),
    totalPages: (state) => Math.ceil(state.total / state.limit),
    professionalCategoryOptions: () => [
      'Specialist',
      'Medical Doctor',
      'Pharmacist',
      'Therapist',
      'Nurse',
      'Dentist',
    ],
  },

  actions: {
    async fetchCategories(params = {}) {
      this.loading = true
      this.error = null
      try {
        const queryParams = new URLSearchParams({
          page: params.page || this.page,
          limit: params.limit || this.limit,
          ...(params.is_active !== undefined && { is_active: params.is_active }),
          ...(params.is_popular !== undefined && { is_popular: params.is_popular }),
          ...(params.professional_category && { professional_category: params.professional_category }),
          ...(params.search && { search: params.search }),
        })

        const url = `${apiBaseURl}/specialist-categories?${queryParams}`
        const response = await axios.get(url)

        const responseData = response.data || {}
        this.categories = Array.isArray(responseData.data) ? responseData.data : []
        this.total = responseData.meta?.total || this.categories.length
        this.page = responseData.meta?.page || 1

        return responseData
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch categories'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createCategory(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.post(`${apiBaseURl}/specialist-categories`, payload)
        await this.fetchCategories()
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create category'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateCategory(id, payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.patch(`${apiBaseURl}/specialist-categories/${id}`, payload)
        await this.fetchCategories()
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update category'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteCategory(id) {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.delete(`${apiBaseURl}/specialist-categories/${id}`)
        await this.fetchCategories()
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete category'
        throw error
      } finally {
        this.loading = false
      }
    },

    async seedDefaults() {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.post(`${apiBaseURl}/specialist-categories/seed`)
        await this.fetchCategories()
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to seed categories'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
