import axios from '@axios'
import { defineStore } from 'pinia'

const apiBaseURl = import.meta.env.VITE_API_BASE_URL
export const useSpecialistStore = defineStore('specialist',{
  state: () => ({
    specialists: [],
    specialist: {},
    specialistsCountries: [],
  }),
  actions: {
    async fetchSpecialists(formData) {
      console.log(formData)
      try {
        let filterParams = ''
        for (const key in formData) {
          if(key != 'currentPage') {
            filterParams += !!formData[key] ? `&${key}=${formData[key]}` : ''
          }
        }

        const response = await axios.get(`
        ${apiBaseURl}/specialists?currentPage=${formData.currentPage + filterParams}`)

        if(response.status === 200) {
          this.specialists = response.data.data
          
          return response.data
        }
      } catch(error) {
        return error
      }
    },
    async fetchSpecialist(id) {
      try {
       
        const response = await axios.get(`${apiBaseURl}/specialists/${id}`)
  
        if(response.status === 200) {
          this.specialist = response.data.data
            
          return response.data
        }
      } catch(error) {
        return error
      }
    },
    async fetchCountries() {
      try {

        const response = await axios.get(`${apiBaseURl}/patients/countries`)

        if(response.status === 200) {
          this.specialistsCountries = response.data.data
          
          return response.data.data
        }
      } catch(error) {
        return error
      }
    },
    async updateSpecialistStatus(data) {
      try {

        const response = await axios.patch(`${apiBaseURl}/specialists/${data.id}`, {
          profileStatus: data.status
        })

        if(response.status === 200) {
          return true
        } else {
          return 'error'
        }
      } catch(error) {
        error

        return 'error'
      }
    },
    async updateSpecialistDetails(id, data) {
      try {
        const response = await axios.patch(`${apiBaseURl}/specialists/${id}/professional-practice`, data)

        if(response.status === 200) {
          return response.data
        } else {
          return 'error'
        }
      } catch(error) {
        console.error('Error updating specialist details:', error)

        return 'error'
      }
    },
  },
})
