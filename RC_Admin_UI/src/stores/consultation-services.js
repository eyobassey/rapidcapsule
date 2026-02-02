import axios from '@axios'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const apiBaseURl = import.meta.env.VITE_API_BASE_URL

export const useConsultationServicesStore = defineStore('consultation-services', () => {
  // State
  const services = ref([])
  const currentService = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Getters
  const activeServices = computed(() => services.value.filter(s => s.is_active))
  const inactiveServices = computed(() => services.value.filter(s => !s.is_active))
  const defaultServices = computed(() => services.value.filter(s => s.is_default))

  // Actions
  async function fetchServices(includeInactive = true) {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.get(`${apiBaseURl}/consultation-services?include_inactive=${includeInactive}`)
      services.value = response.data?.data || []
      return services.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch services'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchService(id) {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.get(`${apiBaseURl}/consultation-services/${id}`)
      currentService.value = response.data?.data
      return currentService.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch service'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createService(serviceData) {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.post(`${apiBaseURl}/consultation-services`, serviceData)
      const newService = response.data?.data
      services.value.push(newService)
      return newService
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create service'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateService(id, serviceData) {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.patch(`${apiBaseURl}/consultation-services/${id}`, serviceData)
      const updatedService = response.data?.data
      const index = services.value.findIndex(s => s._id === id)
      if (index !== -1) {
        services.value[index] = updatedService
      }
      return updatedService
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update service'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteService(id) {
    isLoading.value = true
    error.value = null
    try {
      await axios.delete(`${apiBaseURl}/consultation-services/${id}`)
      services.value = services.value.filter(s => s._id !== id)
      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete service'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function toggleServiceStatus(id, isActive) {
    return updateService(id, { is_active: isActive })
  }

  async function reorderServices(orderedIds) {
    isLoading.value = true
    error.value = null
    try {
      await axios.patch(`${apiBaseURl}/consultation-services/reorder`, { orderedIds })
      // Re-fetch to get updated order
      await fetchServices()
      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to reorder services'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function seedDefaultServices() {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.get(`${apiBaseURl}/consultation-services/seed`)
      // Re-fetch to get seeded services
      await fetchServices()
      return response.data?.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to seed services'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    services,
    currentService,
    isLoading,
    error,
    // Getters
    activeServices,
    inactiveServices,
    defaultServices,
    // Actions
    fetchServices,
    fetchService,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    reorderServices,
    seedDefaultServices,
    clearError,
  }
})
