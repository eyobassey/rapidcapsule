import axios from '@axios'
import { defineStore } from 'pinia'

const apiBaseURl = import.meta.env.VITE_API_BASE_URL

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    drugInteractionSettings: {
      enabled_for_patients: true,
      enabled_for_specialists: true,
      show_severity_levels: true,
      disclaimer_text: 'This information is for reference only. Always consult your pharmacist or doctor before taking multiple medications together.',
    },
    loading: false,
    error: null,
  }),

  actions: {
    async fetchDrugInteractionSettings() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${apiBaseURl}/settings/drug-interactions`)

        if (response.status === 200) {
          this.drugInteractionSettings = response.data.data
          return response.data.data
        }
        return null
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch drug interaction settings'
        console.error('Error fetching drug interaction settings:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async updateDrugInteractionSettings(settings) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.patch(`${apiBaseURl}/settings/drug-interactions`, settings)

        if (response.status === 200) {
          this.drugInteractionSettings = {
            ...this.drugInteractionSettings,
            ...settings,
          }
          return true
        }
        return false
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update drug interaction settings'
        console.error('Error updating drug interaction settings:', error)
        return false
      } finally {
        this.loading = false
      }
    },
  },
})
