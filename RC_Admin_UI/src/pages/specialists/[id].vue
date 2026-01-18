<script setup>
import Appointments from '@/components/SpecialistProfile/Appointments.vue'
import UserBioPanel from '@/components/SpecialistProfile/BioPanel.vue'
import CertificationsAwards from '@/components/SpecialistProfile/CertificationsAwards.vue'
import TransactionHistory from '@/components/SpecialistProfile/TransactionHistory.vue'
import QuickActions from '@/components/SpecialistProfile/QuickActions.vue'
import { useSpecialistStore } from '@/stores/specialist'
import { useUserListStore } from '@/views/apps/user/useUserListStore'


const specialistStore = useSpecialistStore()
const userListStore = useUserListStore()
const route = useRoute()
const userData = ref()
const specialistData = ref({})
const specialist = ref(null)
const userTab = ref(null)
const isUpdating = ref(false)

const tabs = [
  {
    // icon: 'bx-detail',
    title: 'Certifications & Awards',
  },
  {
    // icon: 'bx-bell',
    title: 'Transaction History',
  },
  {
    // icon: 'bx-link',
    title: 'Appointments',
  },
]

// Computed property to reactively get specialistId from route
const specialistId = computed(() => route.params.id)


// 👉 Fetching a Specialist
const fetchSpecialist = () => {
  // Clear previous specialist data
  specialist.value = null
  specialistData.value = {}

  specialistStore.fetchSpecialist(specialistId.value).then(response => {
    specialistData.value = response.data
    specialist.value = response.data.user
    console.log(specialistData.value)
  }).catch(error => {
    console.error(error)
  })
}

// 👉 Update Specialist Professional Details
const handleUpdateSpecialist = async (updatedData) => {
  isUpdating.value = true
  try {
    const result = await specialistStore.updateSpecialistDetails(specialistId.value, updatedData)
    if (result !== 'error') {
      // Update local data
      specialist.value.professional_practice = {
        ...specialist.value.professional_practice,
        ...updatedData,
      }
      // Optionally show success message
      console.log('Specialist details updated successfully')
    } else {
      console.error('Failed to update specialist details')
    }
  } catch (error) {
    console.error('Error updating specialist:', error)
  } finally {
    isUpdating.value = false
  }
}

// Watch for route parameter changes and refetch specialist data
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    userTab.value = null // Reset tab selection
    fetchSpecialist()
  }
}, { immediate: true })
</script>

<template>
  <h3
    class="head-title"
  >
    Specialist/Profile
  </h3>
  <VRow v-if="specialist">
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <UserBioPanel
        :user-data="specialist"
        @update:userData="handleUpdateSpecialist"
      />

      <QuickActions
        :user-data="specialist"
        @refresh-specialist="fetchSpecialist"
      />
    </VCol>

    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <VTabs
        v-model="userTab"
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.icon"
        >
          <!--
            <VIcon
            start
            :size="20"
            :icon="tab.icon"
            />
          -->
          <span>{{ tab.title }}</span>
        </VTab>
      </VTabs>

      <VWindow
        v-model="userTab"
        class="mt-6 disable-tab-transition"
        :touch="false"
      >
        <VWindowItem>
          <CertificationsAwards :user-data="specialist" />
        </VWindowItem>

        <VWindowItem>
          <TransactionHistory
            :transactions="specialistData.transactions"
            :earnings="specialistData.earnings"
          />
        </VWindowItem>

        <VWindowItem>
          <Appointments :appointments="specialistData.appointments" />
        </VWindowItem>
        <!--
          <VWindowItem>
          <UserTabNotifications />
          </VWindowItem>

        
          <VWindowItem>
          <UserTabConnections />
          </VWindowItem>
        -->
      </VWindow>
    </VCol>
  </VRow>
</template>

<style scoped lang="scss">
.head-title {
  margin-block-end: 30px;
}
</style>
