import axios from '@axios'
import { defineStore } from 'pinia'


const apiBaseURl = import.meta.env.VITE_API_BASE_URL


export const usePatientStore = defineStore('patient',{
  
  state: () => ({
    patients: [],
    patient: {},
    patientsCountries: [],
    plans: [],
  }),
  actions: {
    async fetchPatients(formData) {
      try {
        let filterParams = ''
        for (const key in formData) {
          if(key != 'currentPage') {
            filterParams += !!formData[key] ? `&${key}=${formData[key]}` : ''
          }
        }

        const response = await axios.get(`${apiBaseURl}/patients?currentPage=${formData.currentPage}${filterParams}`)

        if(response.status === 200) {
          this.patients = response.data.data
          
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
    async fetchPatient(id) {
      try {

        const response = await axios.get(`${apiBaseURl}/patients/${id}`)

        if(response.status === 200) {
          this.patient = response.data.data
          
          return response.data.data
        } else {
          return 'error'
        }
      } catch(error) {
        error

        return 'error'
      }
    },
    async updatePatientStatus(data) {
      try {
        const response = await axios.patch(`${apiBaseURl}/patients/${data.id}`, { profileStatus: data.status })

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
    async fetchCountries() {
      try {

        const response = await axios.get(`${apiBaseURl}/patients/countries`)

        if(response.status === 200) {
          this.patientsCountries = response.data.data
          
          return response.data.data
        }
      } catch(error) {
        return error
      }
    },
    async fetchPlans() {
      try {

        const response = await axios.get(`${apiBaseURl}/plans`)

        if(response.status === 200) {
          this.plans = response.data.data
          
          return response.data.data
        }
      } catch(error) {
        return error
      }
    },
  },
})
