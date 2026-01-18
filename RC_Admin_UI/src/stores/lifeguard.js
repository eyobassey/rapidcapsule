import axios from '@axios'
import { defineStore } from 'pinia'


const apiBaseURl = import.meta.env.VITE_API_BASE_URL


export const useLifeguardStore = defineStore('lifeguard',{
  
  state: () => ({
    lifeguards: [],
    lifeguard: {},
  }),
  actions: {
    async fetchLifeguards(formData) {
      try {
        let filterParams = ''
        for (const key in formData) {
          if(key != 'currentPage') {
            filterParams += !!formData[key] ? `&${key}=${formData[key]}` : ''
          }
        }

        const response = await axios.get(`
        ${apiBaseURl}/lifeguards?currentPage=${formData.currentPage + filterParams}`)

        if(response.status === 200) {
          this.lifeguards = response.data.data
          
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
    async fetchLifeguard(id) {
      try {

        const response = await axios.get(`${apiBaseURl}/lifeguards/${id}`)

        if(response.status === 200) {
          this.lifeguard = response.data.data
          
          return response.data.data
        } else {
          return 'error'
        }
      } catch(error) {
        error

        return 'error'
      }
    },
  },
})
