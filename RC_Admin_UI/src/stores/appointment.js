import axios from '@axios'
import { defineStore } from 'pinia'


const apiBaseURl = import.meta.env.VITE_API_BASE_URL


export const useAppointmentStore = defineStore('appointment',{

  state: () => ({
    appointments: [],
    stats: null,
  }),
  actions: {
    async fetchAppointments(formData) {
      try {
        let filterParams = ''
        for (const key in formData) {
          if(key != 'currentPage') {
            filterParams += !!formData[key] ? `&${key}=${formData[key]}` : ''
          }
        }

        const response = await axios.get(`
          ${apiBaseURl}/appointments?currentPage=${formData.currentPage + filterParams}`)

        if(response.status === 200) {
          this.appointments = response.data.data

          return response.data
        }
        else {
          return 'error'
        }
      } catch(error) {
        error

        return 'error'
      }
    },

    async fetchAppointmentStats() {
      try {
        const response = await axios.get(`${apiBaseURl}/appointments/stats`)

        if(response.status === 200) {
          this.stats = response.data.data
          return response.data
        }
        else {
          return 'error'
        }
      } catch(error) {
        console.error('Error fetching appointment stats:', error)
        return 'error'
      }
    },
  },
})
